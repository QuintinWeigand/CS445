import yfinance as yf
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["stock_database"]
collection = db["stock_prices"]

# Get distinct tickers from the collection
tickers = collection.distinct("ticker")

for ticker in tickers:
    try:
        stock_info = yf.Ticker(ticker).info
        long_name = stock_info.get("longName")

        if long_name:
            # Update all documents with this ticker
            result = collection.update_many(
                {"ticker": ticker},
                {"$set": {"company_name": long_name}}
            )
            print(f"Updated {result.modified_count} documents for {ticker} - {long_name}")
        else:
            print(f"No longName found for ticker: {ticker}")
    except Exception as e:
        print(f"Error processing ticker {ticker}: {e}")
