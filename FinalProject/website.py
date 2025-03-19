from flask import Flask, jsonify, render_template_string
from pymongo import MongoClient

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')  # Assuming MongoDB is running locally
db = client['stock_database']  # Connect to 'stock_database'
collection = db['stock_prices']  # Connect to 'stock_prices' collection

@app.route('/')
def home():
    result = []

    # Fetch all tickers from MongoDB collection
    tickers_cursor = collection.find({}, {'_id': 0, 'ticker': 1})
    tickers = [ticker['ticker'] for ticker in tickers_cursor]

    # Fetch stock data for all tickers
    for symbol in tickers:
        # Fetch the stock price document from MongoDB
        stock_data = collection.find_one({'ticker': symbol})

        if stock_data:
            percent_change = stock_data.get('percent_change')
            company_name = stock_data.get('company_name', 'Unknown Company')
            
            if percent_change is not None:
                # Adjust intensity for color gradients based on the percentage change
                if percent_change > 0:
                    # Green gradient, more intense green as percent_change increases
                    intensity = min(abs(percent_change) * 200, 255)  # Max intensity cap
                    color = f"rgb({255 - intensity}, {255}, {255 - intensity})"  # Light green for small, dark green for large percent change
                else:
                    # Red gradient, more intense red as percent_change decreases
                    intensity = min(abs(percent_change) * 200, 255)  # Max intensity cap
                    color = f"rgb({255}, {255 - intensity}, {255 - intensity})"  # Light red for small, dark red for large percent change
                
                result.append({
                    'symbol': symbol,
                    'percent_change': round(percent_change, 2),
                    'company_name': company_name,
                    'color': color
                })
            else:
                result.append({
                    'symbol': symbol,
                    'error': 'No data available',
                    'color': 'gray',
                    'company_name': 'Unknown'
                })

    # Render HTML with inline CSS for displaying boxes
    boxes_html = ''
    for item in result:
        if 'error' in item:
            boxes_html += f"<div style='background-color: {item['color']}; padding: 10px; margin: 5px; color: white; width: 200px; height: 120px; display: inline-flex; justify-content: center; align-items: center; text-align: center; border-radius: 5px; border: 1px solid black;'>"
            boxes_html += f"Ticker: {item['symbol']} - Error: {item['error']}</div>"
        else:
            boxes_html += f"<div style='background-color: {item['color']}; padding: 15px; margin: 5px; width: 200px; height: 100px; display: inline-flex; justify-content: center; align-items: center; text-align: center; border-radius: 5px; border: 1px solid black; flex-direction: column;'>"
            # Ticker and percent change on top with larger font
            boxes_html += f"<div style='font-size: 24px;'>{item['symbol']} ({item['percent_change']}%)</div>"  
            # Company name on bottom with smaller font
            boxes_html += f"<div style='font-size: 12px; margin-top: 10px;'>{item['company_name']}</div>"
            boxes_html += "</div>"

    return render_template_string("""
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stock Prices</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                }
                .stock-box {
                    display: inline-flex;  /* Using inline-flex to center content */
                    padding: 15px;
                    margin: 10px;
                    width: 220px;
                    height: 100px;  /* Height updated to 140px */
                    text-align: center;
                    border-radius: 5px;
                    color: white;
                    font-weight: bold;
                    border: 1px solid black;  /* Black border added here */
                    justify-content: center;  /* Horizontally center content */
                    align-items: center;  /* Vertically center content */
                    flex-direction: column;  /* Stack content vertically */
                }
                .stock-box div {
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <h1>Prices for the Top 100 Stocks (By Market Cap)</h1>
            <div>{{ boxes_html|safe }}</div>
        </body>
        </html>
    """, boxes_html=boxes_html)

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
                'previous_close': round(stock_data.get('previous_close'), 2) if stock_data.get('previous_close') is not None else None,
                'close_price': round(stock_data.get('close_price'), 2) if stock_data.get('close_price') is not None else None,
                'percent_change': round(stock_data.get('percent_change'), 2) if stock_data.get('percent_change') is not None else None,
                'company_name': stock_data.get('company_name', 'Unknown Company')
            })
        else:
            result.append({
                'symbol': symbol,
                'error': 'No data available'
            })

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
