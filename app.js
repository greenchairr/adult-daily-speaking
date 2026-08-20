let currentAudio = null;
let currentActiveButton = null;

function initApp() {
  const unitGrid = document.getElementById("unit-grid");
  const btnBack = document.getElementById("btn-back");

  if (!window.allUnits || window.allUnits.length === 0) return;

  // Render main screen unit buttons
  unitGrid.innerHTML = "";
  window.allUnits.forEach((unit) => {
    const btn = document.createElement("button");
    btn.className = "unit-card-btn";
    btn.innerHTML = `
      <span class="unit-title-text">${unit.title}</span>
      <span class="arrow-icon">➔</span>
    `;
    btn.onclick = () => openUnit(unit);
    unitGrid.appendChild(btn);
  });

  // Back button functionality
  btnBack.onclick = () => {
    stopCurrentAudio();
    showView("view-home");
  };
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });
  document.getElementById(viewId).classList.add("active");
  window.scrollTo(0, 0);
}

function openUnit(unitInfo) {
  // Clean up any previously injected script
  const oldScript = document.getElementById("dynamic-unit-script");
  if (oldScript) oldScript.remove();

  // Dynamically load the unit's data.js
  const script = document.createElement("script");
  script.id = "dynamic-unit-script";
  script.src = unitInfo.path + "?v=" + Date.now();

  script.onload = () => {
    if (window.currentUnitData) {
      renderUnitDetail(window.currentUnitData);
      showView("view-unit");
    }
  };

  script.onerror = () => {
    alert("Could not load unit data. Please check the file path: " + unitInfo.path);
  };

  document.body.appendChild(script);
}

function renderUnitDetail(unit) {
  document.getElementById("detail-unit-title").innerText = unit.unitTitle;
  const list = document.getElementById("sentence-list");
  list.innerHTML = "";

  unit.sentences.forEach((item) => {
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

function playAudio(audioSrc, buttonElement) {
  stopCurrentAudio();

  currentActiveButton = buttonElement;
  buttonElement.classList.add("playing");

  const audio = new Audio(audioSrc);
  currentAudio = audio;

  audio.play().catch((err) => {
    console.error("Audio playback error:", err);
    stopCurrentAudio();
  });

  audio.onended = () => {
    stopCurrentAudio();
  };
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentActiveButton) {
    currentActiveButton.classList.remove("playing");
    currentActiveButton = null;
  }
}

document.addEventListener("DOMContentLoaded", initApp);
