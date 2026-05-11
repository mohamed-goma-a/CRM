import speech_recognition as sr
from textblob import TextBlob

def start_sentiment_analysis():
    # 1. Initialize the recognizer
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("Listening... Please speak now (English).")
        # Adjust for ambient noise for better accuracy
        recognizer.adjust_for_ambient_noise(source, duration=1)
        audio = recognizer.listen(source)

    try:
        # 2. Convert Speech to Text using Google Web Speech API
        # We keep it 'en-US' as you requested
        text = recognizer.recognize_google(audio, language='en-US')
        print(f"You said: {text}")

        # 3. Analyze Sentiment
        analysis = TextBlob(text)
        # Polarity: -1 (Negative) to 1 (Positive)
        if analysis.sentiment.polarity > 0:
            result = "Positive 😊"
        elif analysis.sentiment.polarity < 0:
            result = "Negative 😡"
        else:
            result = "Neutral 😐"
            
        print(f"Analysis Result: {result}")

    except sr.UnknownValueError:
        print("Error: Google Speech Recognition could not understand the audio.")
    except sr.RequestError as e:
        print(f"Error: Could not request results from Google service; {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Run the project
if __name__ == "__main__":
    start_sentiment_analysis()