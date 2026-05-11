from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from transformers import pipeline
import threading
import re
import os

app = Flask(__name__)
CORS(app)

# ======================================================
# Model State
# ======================================================
models = {
    "arabic": None,
    "english": None,
}

model_ready = False
model_error = None


# ======================================================
# Load Models in Background
# ======================================================
def load_models():
    global model_ready, model_error

    try:
        print("⏳ Loading English model...")
        models["english"] = pipeline(
            "text-classification",
            model="siebert/sentiment-roberta-large-english",
            truncation=True,
            max_length=512,
            device=-1  # Force CPU (important for Railway)
        )
        print("✅ English model ready!")

        print("⏳ Loading Arabic model...")
        models["arabic"] = pipeline(
            "text-classification",
            model="CAMeL-Lab/bert-base-arabic-camelbert-mix-sentiment",
            truncation=True,
            max_length=512,
            device=-1  # Force CPU
        )
        print("✅ Arabic model ready!")

        model_ready = True
        print("🚀 All models loaded successfully!")

    except Exception as e:
        model_error = str(e)
        print(f"❌ Model loading failed: {e}")


# Start loading models in background
threading.Thread(target=load_models, daemon=True).start()


# ======================================================
# Language Detection
# ======================================================
def is_arabic(text):
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    return arabic_chars > len(text) * 0.2 if text else False


# ======================================================
# Context Padding
# ======================================================
def pad_english(text):
    """Add context for very short English inputs."""
    if len(text.split()) <= 2:
        return f"I feel {text}"
    return text


def pad_arabic(text):
    """Add context for very short Arabic inputs."""
    if len(text.split()) <= 2:
        return f"أنا أشعر بأنني {text}"
    return text


# ======================================================
# Sentiment Mapping
# ======================================================
def map_english(label, confidence):
    label = label.upper()

    if label == "POSITIVE":
        return "Positive", round(confidence, 2)
    elif label == "NEGATIVE":
        return "Negative", round(-confidence, 2)
    else:
        return "Neutral", 0.0


def map_arabic(label, confidence):
    label = label.lower()

    if label == "positive":
        return "Positive", round(confidence, 2)
    elif label == "negative":
        return "Negative", round(-confidence, 2)
    else:
        return "Neutral", 0.0


# ======================================================
# Routes
# ======================================================
@app.route('/')
def home():
    return render_template('index.html')


@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "ready": model_ready,
        "error": model_error
    })


@app.route('/status')
def status():
    if model_error:
        return jsonify({
            "ready": False,
            "error": model_error
        }), 500

    return jsonify({
        "ready": model_ready
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    if model_error:
        return jsonify({
            "error": model_error
        }), 500

    if not model_ready:
        return jsonify({
            "error": "Models are still loading, please wait..."
        }), 503

    try:
        # Safe JSON parsing
        data = request.get_json(silent=True) or {}
        text = data.get('text', '').strip()

        if not text:
            return jsonify({
                "error": "No text provided"
            }), 400

        # Arabic
        if is_arabic(text):
            padded = pad_arabic(text)
            result = models["arabic"](padded)[0]
            sentiment, score = map_arabic(
                result["label"],
                result["score"]
            )
            lang = "ar"

        # English
        else:
            padded = pad_english(text)
            result = models["english"](padded)[0]
            sentiment, score = map_english(
                result["label"],
                result["score"]
            )
            lang = "en"

        return jsonify({
            "text": text,
            "sentiment": sentiment,
            "score": score,
            "lang": lang,
            "confidence": round(result["score"], 4)
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ======================================================
# Local Development / Railway Production
# ======================================================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host='0.0.0.0',   # Required for Railway
        port=port,
        debug=False       # Disable debug in production
    )
