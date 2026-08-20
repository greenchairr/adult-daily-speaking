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

  // Load the first unit by default
  loadUnit(allUnits[0]);
}

function loadUnit(unitInfo) {
  // Remove previously loaded unit script if it exists
  const oldScript = document.getElementById("dynamic-unit-script");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = "dynamic-unit-script";
  script.src = unitInfo.path + "?v=" + Date.now(); // Prevent caching
  
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
    // Connects the play button directly to the AI text-to-speech engine
    playBtn.onclick = () => speakSentence(item.en, playBtn);

    list.appendChild(card);
  });
}

// Generates natural AI voice directly from the text
function speakSentence(text, buttonElement) {
  if (responsiveVoice.isPlaying()) {
    responsiveVoice.cancel();
    if (currentActiveButton) {
      currentActiveButton.classList.remove("playing");
    }
  }

  currentActiveButton = buttonElement;
  buttonElement.classList.add("playing");

  // Uses high-quality Cloud US English Female/Male
  responsiveVoice.speak(text, "US English Female", {
    rate: 0.9,
    onend: () => {
      buttonElement.classList.remove("playing");
    },
    onerror: () => {
      buttonElement.classList.remove("playing");
    }
  });
}

document.addEventListener("DOMContentLoaded", initApp);
