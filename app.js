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

  // Load first unit by default
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
        ${item.chunk ? `<div class="card-chunk">🧩 <strong>Cụm:</strong> ${item.chunk}</div>` : ""}
        ${item.cue ? `<div class="card-cue">🚦 <strong>Ra hiệu:</strong> ${item.cue}</div>` : ""}
      </div>
      <button class="play-btn" title="Listen">🔊</button>
    `;

    const playBtn = card.querySelector(".play-btn");
    playBtn.onclick = () => playAudio(item.audio, playBtn);

    list.appendChild(card);
  });
}

// Single shared Audio instance for iOS Safari compatibility
let sharedAudio = new Audio();
let currentActiveButton = null;

function playAudio(audioSrc, buttonElement) {
  if (currentActiveButton) {
    currentActiveButton.classList.remove("playing");
  }

  currentActiveButton = buttonElement;
  buttonElement.classList.add("playing");

  // Pause and reset previous source
  sharedAudio.pause();
  sharedAudio.currentTime = 0;
  sharedAudio.src = audioSrc;
  sharedAudio.load();

  // Play immediately within the direct user touch event
  const playPromise = sharedAudio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        // Audio started successfully
      })
      .catch(err => {
        console.error("iOS Audio Playback Error:", err);
        buttonElement.classList.remove("playing");
      });
  }

  sharedAudio.onended = () => {
    buttonElement.classList.remove("playing");
  };

  sharedAudio.onerror = () => {
    console.error("File loading error for path:", audioSrc);
    buttonElement.classList.remove("playing");
  };
}

document.addEventListener("DOMContentLoaded", initApp);
