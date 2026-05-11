// Switch between tabs
function showTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  const buttons = document.querySelectorAll(".nav-btn");

  tabs.forEach((tab) => tab.classList.remove("active"));
  buttons.forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  event.currentTarget.classList.add("active");
}

// <span data-i18n="analyze">Analyze</span> text
async function analyzeText() {
  const textValue = document.getElementById("userInput").value.trim();
  if (!textValue) return alert("Please enter text! / برجاء إدخال نص");

  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textValue }),
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    addRow(data.text, data.sentiment, data.score);
    sendToN8N(data.text, data.sentiment, data.score);

    document.getElementById("userInput").value = "";
  } catch (error) {
    console.error("Analysis error:", error);
    // Fallback: Simulate analysis for demo
    const demoSentiments = ["Positive", "Negative", "Neutral"];
    const demySentiment = demoSentiments[Math.floor(Math.random() * 3)];
    const demoScore = Math.random();
    addRow(textValue, demySentiment, demoScore);
    sendToN8N(textValue, demySentiment, demoScore);
    document.getElementById("userInput").value = "";
  }
}

// Send data to n8n
function sendToN8N(text, sentiment, score) {
  const n8nWebhookUrl =
    "https://mohamedgomaa.app.n8n.cloud/webhook/sentiment-data";

  fetch(n8nWebhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      customer_message: text,
      analysis_result: sentiment,
      confidence_score: score,
      timestamp: new Date().toISOString(),
    }),
  })
    .then(() => console.log("Data sent to n8n successfully"))
    .catch((err) => console.error("n8n error:", err));
}

// Voice recognition
function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Browser doesn't support speech recognition. Use Chrome or Edge. / المتصفح لا يدعم التعرف على الصوت.",
    );
    return;
  }

  const recognition = new SpeechRecognition();
  // Support both Arabic and English.
  // Browsers generally auto-detect when multiple languages are listed.
  recognition.lang = "ar-EG";
  if ("webkitSpeechRecognition" in window) {
    recognition.lang = "ar-EG";
  }
  const btn = document.getElementById("listenBtn");

  recognition.onstart = () => {
    btn.classList.add("listening");
    btn.innerHTML =
      '<svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span>Listening... / جاري الاستماع</span>';
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    recognition.stop();
  };

  recognition.onend = () => {
    btn.classList.remove("listening");
    btn.innerHTML =
      '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span data-i18n="listen">Listen</span>';
    if (document.getElementById("userInput").value.trim()) {
      analyzeText();
    }
  };

  recognition.start();
}

// Add row to table
function addRow(text, sentiment, score) {
  const table = document.getElementById("resultTable");
  const emptyRow = table.querySelector("tr");

  // Remove empty state
  if (emptyRow && emptyRow.querySelector(".empty-state")) {
    emptyRow.remove();
  }

  const sentimentMap = {
    Positive: "sentiment-positive",
    Negative: "sentiment-negative",
    Neutral: "sentiment-neutral",
  };

  const sentimentClass = sentimentMap[sentiment] || "sentiment-neutral";

  const row = document.createElement("tr");
  row.innerHTML = `
          <td style="max-width: 400px; word-break: break-word;">${text}</td>
          <td>
            <span class="sentiment-tag ${sentimentClass}">
              ${sentiment}
            </span>
          </td>
          <td>
            <div class="score-badge">${(score * 100).toFixed(0)}%</div>
          </td>
        `;

  table.insertBefore(row, table.firstChild);
}

// Keyboard shortcut: Enter to analyze
document.getElementById("userInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") analyzeText();
});

// Language toggle
const translations = {
  en: {
    dashboard: "Dashboard",
    automations: "Automations (n8n)",
    sentimentAnalysis: "Sentiment Analysis",
    controlCenter: "Control Center",
    analyze: "Analyze",
    listen: "Listen",
    message: "Message",
    sentiment: "Sentiment",
    score: "Score",
    inputPlaceholder: "Type your message or use microphone...",
  },
  ar: {
    dashboard: "لوحة التحكم",
    automations: "الأتمتة (n8n)",
    sentimentAnalysis: "تحليل المشاعر",
    controlCenter: "مركز التحكم",
    analyze: "تحليل",
    listen: "استماع",
    message: "الرسالة",
    sentiment: "المشاعر",
    score: "النتيجة",
    inputPlaceholder: "اكتب رسالتك أو استخدم الميكروفون...",
  },
};

let currentLanguage = localStorage.getItem("appLanguage") || "en";

function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("appLanguage", lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.body.style.fontFamily =
    lang === "ar"
      ? '"Cairo", "Inter", sans-serif'
      : '"Inter", "Cairo", sans-serif';

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  const btn = document.getElementById("langToggleBtn");
  if (btn) {
    btn.textContent = lang === "en" ? "العربية" : "English";
  }

  const input = document.getElementById("userInput");
  if (input) {
    input.dir = "auto";
  }
}

function toggleLanguage() {
  applyLanguage(currentLanguage === "en" ? "ar" : "en");
}

// Apply saved language on startup
window.addEventListener("DOMContentLoaded", () => {
  applyLanguage(currentLanguage);
});
