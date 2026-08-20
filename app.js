let currentAudio = null;
let currentActiveButton = null;

function initApp() {
  const unitNav = document.getElementById("unit-nav");
  if (!lessonsData || lessonsData.length === 0) return;

  // Generate Unit Buttons
  lessonsData.forEach((unit, index) => {
    const btn = document.createElement("button");
    btn.className = `unit-btn ${index === 0 ? "active" : ""}`;
    btn.innerText = `Unit ${unit.unitId}`;
    btn.onclick = () => {
      document.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderUnit(unit);
    };
    unitNav.appendChild(btn);
  });

  // Render first unit by default
  renderUnit(lessonsData[0]);
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
    playBtn.onclick = () => playAudio(item.audio, playBtn);

    list.appendChild(card);
  });
}


function playAudio(audioSrc, buttonElement) {
  // Stop existing audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentActiveButton) {
      currentActiveButton.classList.remove("playing");
    }
  }

  const audio = new Audio(audioSrc);
  currentAudio = audio;
  currentActiveButton = buttonElement;
  buttonElement.classList.add("playing");

  audio.play().catch(err => {
    console.error("Audio playback error:", err);
    buttonElement.classList.remove("playing");
  });

  audio.onended = () => {
    buttonElement.classList.remove("playing");
  };
}

document.addEventListener("DOMContentLoaded", initApp);
