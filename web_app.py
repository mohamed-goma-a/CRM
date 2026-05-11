from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400

        analysis = TextBlob(text)
        # تحديد الحالة
        if analysis.sentiment.polarity > 0:
            result = "Positive"
        elif analysis.sentiment.polarity < 0:
            result = "Negative"
        else:
            result = "Neutral"

        return jsonify({
            "text": text,
            "sentiment": result,
            "score": round(analysis.sentiment.polarity, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)