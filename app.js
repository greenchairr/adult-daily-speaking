let currentAudio = null;
let currentActiveButton = null;

function initApp() {
  const unitNav = document.getElementById("unit-nav");
  if (!allUnits || allUnits.length === 0) return;

  allUnits.forEach((unit, index) => {
    const btn = document.createElement("button");
    btn.className = `unit-btn ${index === 0 ? "active" : ""}`;
    btn.innerText = `Unit ${unit.id}`;
    btn.onclick = () => {
      document.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadUnit(unit);
    };
    unitNav.appendChild(btn);
  });

  // Load first unit
  loadUnit(allUnits[0]);
}

function loadUnit(unitInfo) {
  const oldScript = document.getElementById("dynamic-unit-script");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = "dynamic-unit-script";
  script.src = unitInfo.path + "?v=" + Date.now();
  
  script.onload = () => {
    if (window.currentUnitData) {
      renderUnit(window.currentUnitData);
    }
  };

  document.body.appendChild(script);
}

function renderUnit(unit) {
  document.getElementById("current-unit-title").innerText = unit.unitTitle;
  const list = document.getElementById("sentence-list");
  list.innerHTML = "";

  unit.sentences.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-text">
        <div class="card-en">${item.en}</div>
        <div class="card-vi">🇻🇳 ${item.vi || ""}</div>
        ${item.chunk ? `<div class="card-chunk">🧩 <strong>Chunk:</strong> ${item.chunk}</div>` : ""}
        ${item.cue ? `<div class="card-cue">🚦 <strong>Cue:</strong> ${item.cue}</div>` : ""}
      </div>
      <button class="play-btn" title="Listen">🔊</button>
    `;

    const playBtn = card.querySelector(".play-btn");
    playBtn.onclick = () => speakCloudTTS(item.en, playBtn);

    list.appendChild(card);
  });
}

// Google Cloud TTS streamer (Free, Instant, No key required)
// Reliable Audio Player (Cloud Stream with Instant Fail-safe)
function speakCloudTTS(text, buttonElement) {
  // Stop current audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  if (currentActiveButton) {
    currentActiveButton.classList.remove("playing");
  }

  currentActiveButton = buttonElement;
  buttonElement.classList.add("playing");

  const cleanText = text.trim();
  const encodedText = encodeURIComponent(cleanText);

  // Free Cloud TTS stream endpoint (CORS-friendly)
  const cloudUrl = `https://api.voicerss.org/?key=e413697e556441b4b08709ecbbdeca15&hl=en-us&v=Mary&r=0&src=${encodedText}`;

  const audio = new Audio(cloudUrl);
  currentAudio = audio;

  audio.play()
    .then(() => {
      audio.onended = () => {
        buttonElement.classList.remove("playing");
      };
    })
    .catch((err) => {
      console.warn("Cloud stream blocked, switching to HD speech engine:", err);
      playHDSpeech(cleanText, buttonElement);
    });
}

function playHDSpeech(text, buttonElement) {
  if (!('speechSynthesis' in window)) {
    buttonElement.classList.remove("playing");
    alert("Audio playback not supported on this browser.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;

  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => 
    v.lang.startsWith("en") && (
      v.name.includes("Natural") || 
      v.name.includes("Google") || 
      v.name.includes("Siri") || 
      v.name.includes("Samantha")
    )
  ) || voices.find(v => v.lang.startsWith("en"));

  if (naturalVoice) utterance.voice = naturalVoice;

  utterance.onend = () => {
    buttonElement.classList.remove("playing");
  };

  utterance.onerror = () => {
    buttonElement.classList.remove("playing");
  };

  window.speechSynthesis.speak(utterance);
}

document.addEventListener("DOMContentLoaded", initApp);
