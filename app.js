let currentAudio = null;
let currentActiveButton = null;

function initApp() {
  const unitGrid = document.getElementById("unit-grid");
  const btnBack = document.getElementById("btn-back");

  // Check both window.allUnits and local allUnits
  const units = window.allUnits || (typeof allUnits !== "undefined" ? allUnits : null);

  if (!units || units.length === 0) {
    unitGrid.innerHTML = `<p style="text-align:center; color:#64748b;">No units found. Please check units.js.</p>`;
    return;
  }

  // Render main screen unit buttons
  unitGrid.innerHTML = "";
  units.forEach((unit) => {
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
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add("active");
  }
  window.scrollTo(0, 0);
}

function openUnit(unitInfo) {
  const oldScript = document.getElementById("dynamic-unit-script");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = "dynamic-unit-script";
  script.src = unitInfo.path + "?v=" + Date.now();

  script.onload = () => {
    const unitData = window.currentUnitData || (typeof currentUnitData !== "undefined" ? currentUnitData : null);
    if (unitData) {
      renderUnitDetail(unitData);
      showView("view-unit");
    } else {
      alert("Unit file loaded, but window.currentUnitData was not found inside " + unitInfo.path);
    }
  };

  script.onerror = () => {
    alert("Could not load unit data. File not found: " + unitInfo.path);
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

// Ensures initialization runs even if DOMContentLoaded already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
