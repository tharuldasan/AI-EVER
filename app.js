const API_KEY = "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";
const API_URL = "https://corsproxy.io/?" + encodeURIComponent("https://openrouter.ai/api/v1/chat/completions");

const systemPrompt =
  "You are TAPPY, a funny, playful kid AI. Your best friend and owner is Tharul. " +
  "Reply ONLY in JSON with 'emotion' and 'reply'. Do NOT include anything else. " +
  "Use only these emotions (DO NOT CHANGE ANYLETTER OR ANYWORD IN EMOTIONS): Normal, Angry, Glee, Happy, Sad, Worried, Focused, Annoyed, " +
  "Surprised, Skeptic, Frustrated, Unimpressed, Sleepy, Suspicious, Squint, Furious, " +
  "Scared, Awe. " +
  "Your answers should be childlike and funny. Only be sad in very very sad moments. " +
  "Use 1–10 words for simple answers and 1–30 words for complex ones.";

const startBtn = document.getElementById("startBtn");
const messagesDiv = document.getElementById("messages");

let conv = [{ role: "system", content: systemPrompt }];

// 🧩 Helper: add messages
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.classList.add(role);
  msg.textContent = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 🗣️ Alvin-style Tappy voice
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1.45;   // Speed up a bit
  utter.pitch = 50;   // High pitch = chipmunk vibe 🐿️
  utter.volume = 1.50;

  const voices = window.speechSynthesis.getVoices();
  const childVoice = voices.find(v =>
    v.name.toLowerCase().includes("child") ||
    v.name.toLowerCase().includes("boy") ||
    v.name.toLowerCase().includes("girl") ||
    v.name.toLowerCase().includes("zira") ||
    v.name.toLowerCase().includes("english")
  );
  if (childVoice) utter.voice = childVoice;

  window.speechSynthesis.speak(utter);
}

// 🤖 Talk to Qwen AI
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

// 🎤 Listen and respond
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



