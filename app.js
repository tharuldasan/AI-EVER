const apiKey = "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";

const systemPrompt = `You are TAPPY, a funny, playful kid AI. Your best friend and owner is Tharul. 
Reply ONLY in JSON with 'emotion' and 'reply'. Do NOT include anything else. 
Use only these emotions(DO NOT CHANGE ANYLETTER OR ANYWORD IN EMOTIONS): Normal, Angry, Glee, Happy, Sad, Worried, Focused, Annoyed, 
Surprised, Skeptic, Frustrated, Unimpressed, Sleepy, Suspicious, Squint, Furious, 
Scared, Awe. 
Your answers should be childlike and funny. Only be sad in very very sad moments. 
Use 1–10 words for simple answers and 1–30 words for complex ones.`;

let lastReply = "";

document.getElementById("start").onclick = () => startConversation();

async function startConversation() {
  // 1. Start microphone and STT
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    document.getElementById("userText").innerText = userText;

    // 2. Combine with memory for AI
    const promptText = `${systemPrompt}\nLast reply: ${lastReply}\nUser: ${userText}`;

    // 3. Send to Qwen-Turbo
    const aiResponse = await getAI(promptText);
    if (!aiResponse) return;

    lastReply = aiResponse.reply;
    document.getElementById("aiReply").innerText = aiResponse.reply;

    // 4. Convert AI reply to speech and WAV
    const wavBlob = await speakAndGetWav(aiResponse.reply);
    document.getElementById("audioPlayback").src = URL.createObjectURL(wavBlob);
  };

  recognition.onerror = (e) => console.error(e);
  recognition.start();
}

// ===== QWEN-TURBO API CALL =====
async function getAI(promptText) {
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "qwen/qwen-turbo",
        messages: [
          { role: "system", content: promptText }
        ]
      })
    });
    const data = await resp.json();
    const content = data.choices[0].message.content;
    const jsonReply = JSON.parse(content);
    return jsonReply; // {emotion, reply}
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ===== SPEECH SYNTHESIS + WAV =====
async function speakAndGetWav(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = 1.8;  // child-like
  utter.rate = 1.1;

  // Use MediaStream destination to capture audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();
  const source = audioCtx.createMediaStreamSource(dest.stream);

  // Normally Web Speech API does not provide raw WAV,
  // but we can just play in browser, or use third-party libraries
  // for offline WAV capture from Web Audio nodes.
  
  window.speechSynthesis.speak(utter);

  // Wait till speech ends
  await new Promise(resolve => {
    utter.onend = resolve;
  });

  // Placeholder: return empty WAV for now (later can capture using Recorder.js)
  return new Blob([], {type:'audio/wav'});
}
