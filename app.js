const API_KEY = "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";
const API_URL = "https://corsproxy.io/?" + encodeURIComponent("https://openrouter.ai/api/v1/chat/completions");

const systemPrompt =
  "You are TAPPY, a funny, playful kid AI. Your best friend and owner is Tharul. " +
  "Reply ONLY in JSON with 'emotion' and 'reply'. Do NOT include anything else. " +
  "Use only these emotions: Normal, Angry, Glee, Happy, Sad, Worried, Focused, Annoyed, " +
  "Surprised, Skeptic, Frustrated, Unimpressed, Sleepy, Suspicious, Squint, Furious, " +
  "Scared, Awe. " +
  "Your answers should be childlike and funny. Use 1–10 words for simple answers, 1–30 for complex ones.";

const startBtn = document.getElementById("startBtn");
const messagesDiv = document.getElementById("messages");

let conv = [{ role: "system", content: systemPrompt }];
let voicesLoaded = false;

// 🧠 Wait until voices are loaded
window.speechSynthesis.onvoiceschanged = () => {
  voicesLoaded = true;
};

// 🧩 Helper: Add message to chat
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.classList.add(role);
  msg.textContent = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 🧒 Alvin-style voice effect
function speak(text) {
  if (!voicesLoaded) {
    // Wait for voices, then speak
    setTimeout(() => speak(text), 200);
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1.7;    // Slightly faster for child tone
  utter.pitch = 2.0;   // Browser max (chipmunk feel)
  utter.volume = 1.3;

  const voices = window.speechSynthesis.getVoices();

  // Try to pick child-like or female voices
  const zira = voices.find(v => v.name.toLowerCase().includes("zira"));
  const female = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google us english"));
  const child = voices.find(v => v.name.toLowerCase().includes("child"));

  utter.voice = zira || child || female || voices[0];

  window.speechSynthesis.cancel(); // Prevent overlap
  window.speechSynthesis.speak(utter);
}

// 🤖 Call Qwen AI
async function getAI(text) {
  conv.push({ role: "user", content: text });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: JSON.stringify({
      model: "qwen/qwen-turbo",
      messages: conv
    })
  });

  if (!response.ok) {
    console.error("Error:", response.status, await response.text());
    addMessage("bot", "TAPPY: Sorry, I can’t respond right now.");
    return;
  }

  const data = await response.json();
  const aiReply = data.choices[0].message.content;
  conv.push({ role: "assistant", content: aiReply });

  try {
    const json = JSON.parse(aiReply);
    const replyText = json.reply || "Hmm?";
    addMessage("bot", "TAPPY: " + replyText);
    speak(replyText);
  } catch {
    addMessage("bot", "TAPPY: " + aiReply);
    speak(aiReply);
  }
}

// 🎤 Speech recognition setup
startBtn.onclick = async () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onstart = () => {
    startBtn.textContent = "🎙️ Listening...";
    startBtn.disabled = true;
  };

  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    addMessage("user", "You: " + text);
    recognition.stop();
    startBtn.textContent = "🎤 Start Conversation";
    startBtn.disabled = false;
    await getAI(text);
  };

  recognition.onerror = (err) => {
    console.error("Speech Error:", err);
    startBtn.textContent = "🎤 Start Conversation";
    startBtn.disabled = false;
  };
};
