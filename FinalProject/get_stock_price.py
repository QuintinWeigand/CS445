import yfinance as yf
import json
import time
from pymongo import MongoClient
import pandas as pd

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['stock_database']
collection = db['stock_prices']

# Load tickers from tickers.json
with open('tickers.json', 'r') as file:
    tickers = json.load(file)

batch_size = 20
for i in range(0, len(tickers), batch_size):
    batch = tickers[i:i + batch_size]
    try:
        # Download the data for the batch (2 days of data to calculate previous close)
        data = yf.download(batch, period='2d', progress=False, auto_adjust=False)[['Open', 'Close']]
        
        if data.empty:
            print(f"No data retrieved for batch: {batch}")
            continue

        # Reshape DataFrame using future-proof stack
        data = data.stack(future_stack=True).reset_index()
        data.columns = ['Date', 'Ticker', 'Open', 'Close']

        for ticker in batch:
            try:
                # Filter data for the specific ticker
                ticker_data = data[data['Ticker'] == ticker]
                
                if len(ticker_data) >= 2:
                    latest = ticker_data.iloc[-1]  # Most recent day
                    previous_close = ticker_data.iloc[-2]['Close']  # Previous day

                    close_price = latest['Close']

                    if pd.notna(close_price) and pd.notna(previous_close):
                        # Calculate percent change
                        percent_change = round(((close_price - previous_close) / previous_close) * 100, 2)
                        
                        # Format prices to 2 decimal points
                        formatted_close_price = round(close_price, 2)
                        formatted_previous_close = round(previous_close, 2)
                        company_name = yf.Ticker(ticker).info['longName']

                        # Insert or update in MongoDB
                        collection.update_one(
                            {'ticker': ticker},
                            {'$set': {
                                'close_price': formatted_close_price,
                                'previous_close': formatted_previous_close,
                                'percent_change': percent_change,
                                'company_name': company_name
                            }},
                            upsert=True
                        )
                        print(f"Data updated for {ticker}")
                    else:
                        # If no valid price data, insert null values
                        collection.update_one(
                            {'ticker': ticker},
                            {'$set': {
                                'close_price': None,
                                'previous_close': None,
                                'percent_change': None,
                                'company_name': None
                            }},
                            upsert=True
                        )
                        print(f"No valid price data for {ticker}")
                else:
                    print(f"Not enough data for {ticker}")

            except Exception as e:
                print(f"Error processing {ticker}: {e}")

    except Exception as e:
        print(f"Error processing batch {batch}: {e}")

    # Small delay between batches to avoid rate-limiting
    time.sleep(1)

print("Stock prices and percent changes saved to MongoDB collection")
