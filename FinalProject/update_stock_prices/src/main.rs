use mongodb::Client;
use mongodb::bson;
use std::env;
use std::fs::File;
use std::io::{self, BufRead};
use time::{Duration, OffsetDateTime};
use tokio;
use update_stock_prices::stock_history::StockHistory;
use update_stock_prices::stock_ticker::StockTicker;
use yahoo_finance_api as yahoo;

fn get_ticker_vector(file_path: &str) -> Vec<String> {
    let file = match File::open(file_path) {
        Ok(file) => file,
        Err(e) => {
            eprintln!(
                "Error opening file \"tickers.txt\". Please ensure it is included or can be accessed, {e}"
            );
            panic!("File is required to move on");
        }
    };

    let reader = io::BufReader::new(file);

    let mut ticker_vector = Vec::<String>::new();

    for line in reader.lines() {
        match line {
            Ok(line) => ticker_vector.push(line),
            Err(e) => eprintln!("Error reading line: {e}"),
        }
    }

    ticker_vector
}

#[tokio::main]
async fn main() {
    // Get the command-line arguments
    let args: Vec<String> = env::args().collect();

    // Check if the file path argument is provided
    if args.len() < 2 {
        eprintln!("Usage: {} <file_path>", args[0]);
        return;
    }

    let file_path = &args[1];

    // Mongo stuff
    let uri = "mongodb://localhost:27017";
    let client = match Client::with_uri_str(uri).await {
        Ok(client) => client,
        Err(e) => {
            eprintln!("Failed to connect to MongoDB: {e}");
            return;
        }
    };

    let db_name = "stock_database";
    let collection_name = "stock_prices";
    let collection_history_name = "stock_history";

    let database = client.database(db_name);
    let collection: mongodb::Collection<mongodb::bson::Document> =
        database.collection(collection_name);

    let history_collection = database.collection::<StockHistory>(collection_history_name);

    let ticker_vector = get_ticker_vector(file_path);

    println!("Updating {} tickers and their history.\n--------------------", ticker_vector.len());

    let provider = match yahoo::YahooConnector::new() {
        Ok(provider) => provider,
        Err(e) => {
            eprintln!("Error creating YahooConnector: {}", e);
            return;
        }
    };

    // Calculate end_date and start_date once, outside the loop
    let mut end_date = OffsetDateTime::now_utc();

    // Adjust end_date to the most recent trading day if it's a weekend
    if end_date.weekday() == time::Weekday::Saturday {
        end_date -= Duration::days(1);
    } else if end_date.weekday() == time::Weekday::Sunday {
        end_date -= Duration::days(2);
    }

    // Calculate the start_date based on the adjusted end_date
    let start_date = if end_date.weekday() == time::Weekday::Monday {
        end_date - Duration::days(3)
    } else {
        end_date - Duration::days(1)
    };

    // Fetch quotes for all tickers in the vector
    for (i, ticker) in ticker_vector.iter().enumerate() {
        let response = provider
            .get_quote_history(ticker, start_date, end_date)
            .await;

        let response = match response {
            Ok(response) => response,
            Err(e) => {
                eprintln!("Failed getting a quote on {ticker}: {e}");
                continue;
            }
        };

        // Extract the last two quotes (current and previous day)
        let quotes = match response.quotes() {
            Ok(quote_vector) => quote_vector,
            Err(e) => {
                eprintln!("Something went wrong getting the quotes. Error: {e}");
                return;
            }
        };

        if quotes.len() < 2 {
            eprintln!("Not enough data for {ticker}. Quote length: {} | (We want 2) |", quotes.len());
            continue;
        }

        let current_quote = &quotes[quotes.len() - 1];
        let previous_quote = &quotes[quotes.len() - 2];

        let current_close = current_quote.close;
        let previous_close = previous_quote.close;

        let percent_change = if previous_close != 0.0 {
            ((current_close - previous_close) / previous_close) * 100.0
        } else {
            0.0
        };

        // Old verbose std out
        // println!(
        //     "Index: [{i}]\nTicker: {ticker}\nClose Price: {:.2}\nPercent Change: {:.2}%\nPrevious Close: {:.2}",
        //     current_close, percent_change, previous_close
        // );

        // New more minimal std out
        println!("(Gathering Ticker[{i}]: {ticker} information) Updating Database");

        let index_stock_ticker = StockTicker::new(
            ticker.as_str(),
            (current_close * 100.0).round() / 100.0,
            (percent_change * 100.0).round() / 100.0,
            (previous_close * 100.0).round() / 100.0,
        );

        let filter = mongodb::bson::doc! { "ticker": ticker.as_str() };
        let update = mongodb::bson::doc! {
            "$set": index_stock_ticker.to_document()
        };
        let options = mongodb::options::UpdateOptions::builder()
            .upsert(true)
            .build();

        if let Err(e) = collection.update_one(filter, update, options).await {
            eprintln!("Failed to update document for {ticker}: {e}");
        }

        // HEY THIS IS WHERE WE DO THE STOCK HISTORY STUFF
        let history_filter = mongodb::bson::doc! {"ticker": ticker};
        if let Ok(Some(mut document)) = history_collection
            .find_one(history_filter.clone(), None)
            .await
        {
            println!("Updating stock history for {}\n--------------------", document.get_ticker());
            // TODO: We would edit the document here
            document.update(current_close);

            let updated_doc = match bson::to_document(&document) {
                Ok(doc) => doc,
                Err(e) => {
                    eprintln!("Failed to serialize the document! {e}");
                    return;
                }
            };

            let update = mongodb::bson::doc! {
                "$set": updated_doc
            };

            if let Err(e) = history_collection.update_one(history_filter, update, None).await {
                eprintln!("Failed to update history! {e}");
            }


        } else {
            eprintln!("{ticker} was not found in the history section. Making one now!\n--------------------");
            let mut temp = StockHistory::new(ticker);
            temp.update(current_close);

            // Convert the StockHistory struct into a BSON document
            let temp_doc = match bson::to_document(&temp) {
                Ok(doc) => doc,
                Err(e) => {
                    eprintln!("Failed to serialize StockHistory for {ticker}: {e}");
                    return;
                }
            };

            let update = mongodb::bson::doc! {
                "$set": temp_doc
            };

            let options = mongodb::options::UpdateOptions::builder()
                .upsert(true)
                .build();

            if let Err(e) = history_collection
                .update_one(history_filter, update, options)
                .await
            {
                eprintln!("Failed to update history document for {ticker}: {e}");
            }
        }
    }

    //println!("Hey we actually made it the end of the program. I did not expect this. :)");
}
