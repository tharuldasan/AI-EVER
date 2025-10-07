const API_KEY = "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";
const API_URL = "https://corsproxy.io/?" + encodeURIComponent("https://openrouter.ai/api/v1/chat/completions");

const systemPrompt =
  "You are TAPPY, a funny, playful kid AI. Your best friend and owner is Tharul. " +
  "Reply ONLY in JSON with 'emotion' and 'reply'. Do NOT include anything else. " +
  "Use only these emotions: Normal, Angry, Glee, Happy, Sad, Worried, Focused, Annoyed, " +
  "Surprised, Skeptic, Frustrated, Unimpressed, Sleepy, Suspicious, Squint, Furious, " +
  "Scared, Awe. " +
  "Your answers should be childlike and funny. Only be sad in very very sad moments. " +
  "Use 1–10 words for simple answers and 1–30 words for complex ones.";

const startBtn = document.getElementById("startBtn");
const messagesDiv = document.getElementById("messages");

const pitchSlider = document.getElementById("pitch");
const rateSlider = document.getElementById("rate");
const volumeSlider = document.getElementById("volume");
const pitchVal = document.getElementById("pitchVal");
const rateVal = document.getElementById("rateVal");
const volumeVal = document.getElementById("volumeVal");
const voiceSelect = document.getElementById("voiceSelect");

let voices = [];
let conv = [{ role: "system", content: systemPrompt }];

// 🔊 Load available voices
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((v, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${v.name} (${v.lang})`;
    if (v.name.toLowerCase().includes("zira")) option.selected = true;
    voiceSelect.appendChild(option);
  });
}
window.speechSynthesis.onvoiceschanged = loadVoices;

// 🧩 Helper: add message to chat
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.classList.add(role);
  msg.textContent = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 🗣️ Speak with current settings
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = parseFloat(pitchSlider.value);
  utter.rate = parseFloat(rateSlider.value);
  utter.volume = parseFloat(volumeSlider.value);

  const selectedVoice = voices[voiceSelect.value] || voices.find(v => v.name.includes("Zira"));
  if (selectedVoice) utter.voice = selectedVoice;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// Update label values
[pitchSlider, rateSlider, volumeSlider].forEach(slider => {
  slider.addEventListener("input", () => {
    pitchVal.textContent = pitchSlider.value;
    rateVal.textContent = rateSlider.value;
    volumeVal.textContent = volumeSlider.value;
  });
});

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
  const aiReply = data.choices?.[0]?.message?.content || "Hmm?";
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
