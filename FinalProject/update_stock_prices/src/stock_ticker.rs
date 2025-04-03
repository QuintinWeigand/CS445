use mongodb::bson::doc;

pub struct StockTicker {
    ticker: String,
    close_price: f64,
    percent_change: f64,
    previous_close: f64,
}

impl StockTicker {
    pub fn new(ticker: &str, close_price: f64, percent_change: f64, previous_close: f64) -> Self {
        Self {
            ticker: ticker.to_string(),
            close_price: close_price,
            percent_change: percent_change,
            previous_close: previous_close,
        }
    }

    pub fn get_ticker(&self) -> &String {
        &self.ticker
    }

    pub fn get_close_price(&self) -> f64 {
        self.close_price
    }

    pub fn get_percent_change(&self) -> f64 {
        self.percent_change
    }

    pub fn get_previous_close(&self) -> f64 {
        self.previous_close
    }

    pub fn to_document(&self) -> mongodb::bson::Document {
        doc! {
            "ticker": &self.ticker,
            "close_price": self.close_price,
            "percent_change": self.percent_change,
            "previous_close": self.previous_close,
        }
    }
}
