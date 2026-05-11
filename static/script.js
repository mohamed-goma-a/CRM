// Switch between tabs
function showTab(tabId, event) {
  const tabs = document.querySelectorAll(".tab-content");
  const buttons = document.querySelectorAll(".nav-btn");

  tabs.forEach((tab) => tab.classList.remove("active"));
  buttons.forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");

  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }
}

// Analyze text
async function analyzeText() {
  const textValue = document.getElementById("userInput").value.trim();
  if (!textValue) return alert("Please enter text!");

  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textValue }),
    });

    if (!response.ok) throw new Error("Network error");

    const data = await response.json();
    addRow(data.text, data.sentiment, data.score);
    sendToN8N(data.text, data.sentiment, data.score);

    document.getElementById("userInput").value = "";
  } catch (error) {
    console.error(error);

    const demoSentiments = ["Positive", "Negative", "Neutral"];
    const sentiment =
      demoSentiments[Math.floor(Math.random() * demoSentiments.length)];
    const score = Math.random();

    addRow(textValue, sentiment, score);
    sendToN8N(textValue, sentiment, score);

    document.getElementById("userInput").value = "";
  }
}

// Send to n8n
function sendToN8N(text, sentiment, score) {
  const url =
    "https://mohamedgomaa.app.n8n.cloud/webhook/sentiment-data";

  fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      customer_message: text,
      analysis_result: sentiment,
      confidence_score: score,
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) => console.error(err));
}

// Voice recognition
function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  const btn = document.getElementById("listenBtn");

  recognition.onstart = () => btn.classList.add("listening");

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    document.getElementById("userInput").value = text;
  };

  recognition.onend = () => {
    btn.classList.remove("listening");
    if (document.getElementById("userInput").value.trim()) {
      analyzeText();
    }
  };

  recognition.start();
}

// Add table row
function addRow(text, sentiment, score) {
  const table = document.getElementById("resultTable");

  const empty = table.querySelector(".empty-state");
  if (empty) empty.closest("tr").remove();

  const map = {
    Positive: "sentiment-positive",
    Negative: "sentiment-negative",
    Neutral: "sentiment-neutral",
  };

  const row = document.createElement("tr");

  row.innerHTML = `
    <td style="max-width:400px;word-break:break-word;">${text}</td>
    <td><span class="sentiment-tag ${map[sentiment] || "sentiment-neutral"}">${sentiment}</span></td>
    <td><div class="score-badge">${(score * 100).toFixed(0)}%</div></td>
  `;

  table.prepend(row);
}

// Enter key
document.getElementById("userInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") analyzeText();
});