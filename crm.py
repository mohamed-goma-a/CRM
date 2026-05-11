import speech_recognition as sr
from transformers import pipeline
import threading
import re

# ─── Model State ───────────────────────────────────────
models = {
    "arabic":  None,
    "english": None,
}
model_ready = False


def load_models():
    global model_ready
    print("⏳ Loading English model (roberta-large)...")
    models["english"] = pipeline(
        "text-classification",
        model="siebert/sentiment-roberta-large-english",
        truncation=True,
        max_length=512
    )
    print("✅ English model ready!")

    print("⏳ Loading Arabic model (camelbert-mix)...")
    models["arabic"] = pipeline(
        "text-classification",
        model="CAMeL-Lab/bert-base-arabic-camelbert-mix-sentiment",
        truncation=True,
        max_length=512
    )
    print("✅ Arabic model ready!")
    model_ready = True
    print("🚀 All models loaded!")


threading.Thread(target=load_models, daemon=True).start()


# ─── Helpers ───────────────────────────────────────────
def is_arabic(text):
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    return arabic_chars > len(text) * 0.2


def pad_english(text):
    return f"I feel {text}" if len(text.split()) <= 2 else text


def pad_arabic(text):
    return f"أنا أشعر بأنني {text}" if len(text.split()) <= 2 else text


def map_english(label, confidence):
    label = label.upper()
    if label == "POSITIVE":
        return "Positive 😊", round(confidence, 2)
    elif label == "NEGATIVE":
        return "Negative 😡", round(-confidence, 2)
    return "Neutral 😐", 0.0


def map_arabic(label, confidence):
    label = label.lower()
    if label == "positive":
        return "Positive 😊", round(confidence, 2)
    elif label == "negative":
        return "Negative 😡", round(-confidence, 2)
    return "Neutral 😐", 0.0


def analyze(text):
    if is_arabic(text):
        padded = pad_arabic(text)
        result = models["arabic"](padded)[0]
        return map_arabic(result['label'], result['score'])
    else:
        padded = pad_english(text)
        result = models["english"](padded)[0]
        return map_english(result['label'], result['score'])


# ─── Main ──────────────────────────────────────────────
def start_sentiment_analysis():
    # انتظر لحد ما الموديلات تتحمل
    import time
    while not model_ready:
        print("⏳ Waiting for models to load...")
        time.sleep(2)

    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("\n🎤 Listening... Please speak now (English or Arabic).")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        audio = recognizer.listen(source)

    try:
        text = recognizer.recognize_google(audio, language='en-US')
        print(f"You said: {text}")

        sentiment, score = analyze(text)
        print(f"Result:   {sentiment}")
        print(f"Score:    {abs(score) * 100:.1f}%")

    except sr.UnknownValueError:
        print("Error: Could not understand the audio.")
    except sr.RequestError as e:
        print(f"Error: Could not request results from Google service; {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    start_sentiment_analysis()