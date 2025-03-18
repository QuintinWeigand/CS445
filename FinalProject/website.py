from flask import Flask, jsonify
from pymongo import MongoClient

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')  # Assuming MongoDB is running locally
db = client['stock_database']  # Connect to 'stock_database'
collection = db['stock_prices']  # Connect to 'stock_prices' collection

@app.route('/')
def home():
    return 'Hello, Flask!'

@app.route('/sp500')
def get_sp500():
    result = []

    # Fetch all tickers from MongoDB collection
    tickers_cursor = collection.find({}, {'_id': 0, 'ticker': 1})
    tickers = [ticker['ticker'] for ticker in tickers_cursor]
    
    # Fetch stock data for all tickers
    for symbol in tickers:
        # Fetch the stock price document from MongoDB
        stock_data = collection.find_one({'ticker': symbol})
        
        if stock_data:
            result.append({
                'symbol': symbol,
                'price': round(stock_data.get('price', None), 2),
                'timestamp': stock_data.get('timestamp', None)  # You can include a timestamp if available
            })
        else:
            result.append({
                'symbol': symbol,
                'error': 'No data available'
            })

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
