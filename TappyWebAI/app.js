// ------------------ CONFIG ------------------
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = "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";

const systemPrompt = 
  "You are TAPPY, a funny, playful kid AI. Your best friend and owner is Tharul. "
  + "Reply ONLY in JSON with 'emotion' and 'reply'. Do NOT include anything else. "
  + "Use only these emotions(DO NOT CHANGE ANYLETTER OR ANYWORD IN EMOTIONS): Normal, Angry, Glee, Happy, Sad, Worried, Focused, Annoyed, "
  + "Surprised, Skeptic, Frustrated, Unimpressed, Sleepy, Suspicious, Squint, Furious, "
  + "Scared, Awe. "
  + "Your answers should be childlike and funny. Only be sad in very very sad moments. "
  + "Use 1–10 words for simple answers and 1–30 words for complex ones.";

// Conversation memory
let conversation = [
  {role: "system", content: systemPrompt}
];

// DOM elements
const chatBox = document.getElementById("chatBox");
const startBtn = document.getElementById("startBtn");

// ------------------ SPEECH RECOGNITION ------------------
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;

startBtn.addEventListener("click", () => {
  recognition.start();
});

// ------------------ SPEECH RESULTS ------------------
recognition.onresult = async (event) => {
  const userText = event.results[0][0].transcript;
  addMessage("user", userText);
  conversation.push({role: "user", content: userText});
  
  const aiResponse = await getAI(conversation);
  if(aiResponse){
    conversation.push({role: "assistant", content: aiResponse.reply});
    addMessage("ai", aiResponse.reply);
    speak(aiResponse.reply);
  }
};

// ------------------ GET AI RESPONSE ------------------
async function getAI(conv) {
  try {
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
      console.error("Error:", response.status, response.statusText);
      return {reply: "Sorry, I cannot respond right now."};
    }

    const data = await response.json();

    // Parse JSON response from AI
    let content = data.choices[0].message.content;
    try {
      const json = JSON.parse(content);
      return {emotion: json.emotion, reply: json.reply};
    } catch (e) {
      console.warn("AI did not return JSON, fallback to raw content.");
      return {emotion: "Normal", reply: content};
    }
  } catch (err) {
    console.error(err);
    return {reply: "Error connecting to AI."};
  }
}

// ------------------ DISPLAY MESSAGES ------------------
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = `${sender === "user" ? "You" : "TAPPY"}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ------------------ SPEAK ------------------
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1.0;
  utter.pitch = 1.5; // childlike voice
  window.speechSynthesis.speak(utter);
}
