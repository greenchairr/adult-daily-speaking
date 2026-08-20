let currentAudio = null;
let currentActiveButton = null;

// Voice recording state
let mediaRecorder = null;
let audioChunks = [];

// --- IndexedDB Local Storage Manager ---
const DB_NAME = "EnglishPracticeAudioDB";
const STORE_NAME = "recordings";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRecordingLocally(key, blob) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, key);
  } catch (err) {
    console.error("Error saving audio to IndexedDB:", err);
  }
}

async function getRecordingLocally(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error("Error reading audio from IndexedDB:", err);
    return null;
  }
}

// --- App Initialization & Navigation ---
function initApp() {
  const unitGrid = document.getElementById("unit-grid");
  const btnBack = document.getElementById("btn-back");

  const units = window.allUnits || (typeof allUnits !== "undefined" ? allUnits : null);

  if (!units || units.length === 0) {
    unitGrid.innerHTML = `<p style="text-align:center; color:#64748b;">Chưa tìm thấy bài học nào.</p>`;
    return;
  }

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

  btnBack.onclick = () => {
    stopCurrentAudio();
    stopRecording();
    showView("view-home");
  };
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add("active");
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
      alert("Không tìm thấy dữ liệu bài học.");
    }
  };

  script.onerror = () => {
    alert("Lỗi tải tệp: " + unitInfo.path);
  };

  document.body.appendChild(script);
}

async function renderUnitDetail(unit) {
  document.getElementById("detail-unit-title").innerText = unit.unitTitle;
  const list = document.getElementById("sentence-list");
  list.innerHTML = "";

  for (const item of unit.sentences) {
    const storageKey = `u${unit.unitId}_s${item.id}`;
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-text">
        <div class="card-en">${item.en}</div>
        <div class="card-vi">🇻🇳 ${item.vi || ""}</div>
        ${item.chunk ? `<div class="card-chunk">🧩 <strong>Cụm:</strong> ${item.chunk}</div>` : ""}
        ${item.cue ? `<div class="card-cue">🚦 <strong>Ra hiệu:</strong> ${item.cue}</div>` : ""}
      </div>
      <div class="card-actions" id="actions-${storageKey}"></div>
    `;

    const actionsContainer = card.querySelector(".card-actions");
    const savedBlob = await getRecordingLocally(storageKey);

    if (savedBlob) {
      const audioUrl = URL.createObjectURL(savedBlob);
      renderActionButtons(actionsContainer, item, audioUrl, storageKey);
    } else {
      renderDefaultButtons(actionsContainer, item, storageKey);
    }

    list.appendChild(card);
  }
}

function renderDefaultButtons(container, item, storageKey) {
  container.innerHTML = `
    <button class="btn-action play-btn" title="Nghe mẫu">🔊 Mẫu</button>
    <button class="btn-action record-btn" title="Ghi âm">🎙️ Ghi âm</button>
  `;

  const playBtn = container.querySelector(".play-btn");
  const recordBtn = container.querySelector(".record-btn");

  playBtn.onclick = () => playAudio(item.audio, playBtn);
  recordBtn.onclick = () => handleRecordToggle(recordBtn, container, item, storageKey);
}

function renderActionButtons(container, item, audioUrl, storageKey) {
  container.innerHTML = `
    <button class="btn-action play-btn" title="Nghe mẫu">🔊 Mẫu</button>
    <button class="btn-action user-play-btn" title="Nghe lại giọng bạn">▶️ Nghe lại</button>
    <button class="btn-action re-record-btn" title="Ghi âm lại">🔄 Ghi lại</button>
  `;

  const playBtn = container.querySelector(".play-btn");
  const userPlayBtn = container.querySelector(".user-play-btn");
  const reRecordBtn = container.querySelector(".re-record-btn");

  playBtn.onclick = () => playAudio(item.audio, playBtn);
  userPlayBtn.onclick = () => playAudio(audioUrl, userPlayBtn);
  reRecordBtn.onclick = () => resetAndRecord(container, item, storageKey);
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

// Student Recording with IndexedDB Persistence
async function handleRecordToggle(btn, container, item, storageKey) {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }

  stopCurrentAudio();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/mp4" });
      await saveRecordingLocally(storageKey, audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      renderActionButtons(container, item, audioUrl, storageKey);

      stream.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;
    };

    mediaRecorder.start();
    btn.classList.add("recording");
    btn.innerHTML = "⏹️ Dừng";
    btn.title = "Bấm để dừng ghi âm";
  } catch (err) {
    console.error("Microphone access error:", err);
    alert("Vui lòng cho phép quyền truy cập Micro trên trình duyệt để ghi âm.");
  }
}

function resetAndRecord(container, item, storageKey) {
  renderDefaultButtons(container, item, storageKey);
  const recordBtn = container.querySelector(".record-btn");
  recordBtn.click();
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
}

// Block iOS double-tap zoom
let lastTouchEnd = 0;
document.addEventListener("touchend", function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Block pinch gestures
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
