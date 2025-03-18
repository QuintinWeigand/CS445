import yfinance as yf
import json
import time
from pymongo import MongoClient

# Connect to MongoDB (assuming MongoDB is running locally on the default port)
client = MongoClient('mongodb://localhost:27017/')
db = client['stock_database']  # Create or use a database named 'stock_database'
collection = db['stock_prices']  # Create or use a collection named 'stock_prices'

# Load tickers from tickers.json
with open('tickers.json', 'r') as file:
    tickers = json.load(file)

# Download stock prices for each ticker
for ticker in tickers:
    try:
        # Download the data (get both Open and Close prices)
        data = yf.download(ticker, period='1d', progress=False)[['Open', 'Close']]
        
        # Extract the last row (latest available data)
        latest = data.iloc[-1]  # Get the most recent data
        
        # Extract the timestamp (index) and convert it to a standard format
        timestamp = latest.name.strftime('%Y-%m-%d %H:%M:%S')  # Format as a string
        
        # Extract the actual values from the Series (as scalar values)
        close_price = latest['Close']
        open_price = latest['Open']
        
        if close_price is not None and open_price is not None:
            # Calculate percent change
            percent_change = ((close_price - open_price) / open_price) * 100
            percent_change = round(percent_change, 2)  # Round the percent change to 2 decimal places
            
            # Round close price to 2 decimal points
            formatted_close_price = round(close_price, 2)
            
            # Insert the stock price and percent change into the MongoDB collection
            collection.update_one(
                {'ticker': ticker},  # Find by ticker
                {'$set': {'close_price': float(formatted_close_price.iloc[0]), 
                 'percent_change': float(percent_change.iloc[0]), 
                 'timestamp': timestamp}},  # Use float() properly
                upsert=True  # If the ticker doesn't exist, insert a new document
            )
            print(f"Collection updated for {ticker}")
        else:
            # If no price is available, we can still insert a document with null values
            collection.update_one(
                {'ticker': ticker},
                {'$set': {'close_price': None, 'percent_change': None, 'timestamp': time.time()}},
                upsert=True
            )
    except Exception as e:
        print(f"Error processing {ticker}: {e}")

    # Small delay between batches to avoid rate-limiting
    time.sleep(0.5)

print("Stock prices and percent changes saved to MongoDB collection")
