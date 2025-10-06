const chatBox = document.getElementById("chatBox");
const startBtn = document.getElementById("startBtn");

// 🔑 Your OpenRouter API Key
const OPENROUTER_API_KEY = "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";

// 🧒 Tappy's Personality
const systemPrompt = `
You are TAPPY, a funny, playful kid AI. Your best friend and owner is Tharul.
Reply ONLY in JSON with 'emotion' and 'reply'. Do NOT include anything else.
Use only these emotions(DO NOT CHANGE ANYLETTER OR ANYWORD IN EMOTIONS):
Normal, Angry, Glee, Happy, Sad, Worried, Focused, Annoyed, Surprised, Skeptic,
Frustrated, Unimpressed, Sleepy, Suspicious, Squint, Furious, Scared, Awe.
Your answers should be childlike and funny. Only be sad in very very sad moments.
Use 1–10 words for simple answers and 1–30 words for complex ones.
`;

let voices = [];
let childVoice = null;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  const childlikeNames = [
    "Google UK English Female",
    "Microsoft Zira Desktop",
    "Google US English",
    "Google UK English Male"
  ];
  childVoice = voices.find(v => childlikeNames.includes(v.name)) || voices[0];
}

if (typeof speechSynthesis !== "undefined") {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}:</b> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = childVoice;
  utter.pitch = 1.6;
  utter.rate = 1.2;
  utter.volume = 1;
  speechSynthesis.speak(utter);
}

async function getAI(userText) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ]
      })
    });

    if (!response.ok) {
      addMessage("TAPPY", "Sorry, I cannot respond right now.");
      return;
    }

    const data = await response.json();
    const replyText = data.choices[0].message?.content || "";
    const parsed = JSON.parse(replyText);
    const aiReply = parsed.reply;

    addMessage("TAPPY", aiReply);
    speak(aiReply);

  } catch (err) {
    console.error(err);
    addMessage("TAPPY", "Oops, something went wrong!");
  }
}

startBtn.onclick = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.start();
  startBtn.innerText = "🎧 Listening...";
  addMessage("System", "Listening...");

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    addMessage("You", userText);
    recognition.stop();
    startBtn.innerText = "🎤 Start Conversation";
    await getAI(userText);
  };

  recognition.onerror = (err) => {
    console.error(err);
    startBtn.innerText = "🎤 Start Conversation";
    addMessage("System", "Error with mic. Please try again.");
  };
};
