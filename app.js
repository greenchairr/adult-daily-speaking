let currentAudio = null;
let currentActiveButton = null;

// Voice recording state
let mediaRecorder = null;
let audioChunks = [];
let activeRecordingButton = null;

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
      <div class="card-actions">
        <button class="btn-action play-btn" title="Nghe mẫu">🔊</button>
        <button class="btn-action record-btn" title="Ghi âm giọng của bạn">🎙️</button>
      </div>
    `;

    const playBtn = card.querySelector(".play-btn");
    const recordBtn = card.querySelector(".record-btn");

    playBtn.onclick = () => playAudio(item.audio, playBtn);
    recordBtn.onclick = () => handleRecordToggle(recordBtn);

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

// Student Recording & Playback
async function handleRecordToggle(btn) {
  // If button already has a saved recording, tapping it plays the recorded voice
  if (btn.dataset.audioUrl && !btn.classList.contains("recording")) {
    playAudio(btn.dataset.audioUrl, btn);
    return;
  }

  // If currently recording on this button, stop recording
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }

  // Stop other audio
  stopCurrentAudio();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    activeRecordingButton = btn;

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/mp4" });
      const audioUrl = URL.createObjectURL(audioBlob);

      btn.dataset.audioUrl = audioUrl;
      btn.classList.remove("recording");
      btn.classList.add("has-recording");
      btn.innerHTML = "▶️";
      btn.title = "Nghe lại giọng của bạn";

      // Release microphone tracks
      stream.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;
    };

    mediaRecorder.start();
    btn.classList.add("recording");
    btn.innerHTML = "⏹️";
    btn.title = "Dừng ghi âm";
  } catch (err) {
    console.error("Microphone access denied:", err);
    alert("Vui lòng cấp quyền truy cập Micro trên trình duyệt để ghi âm.");
  }
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

// Block pinch-to-zoom
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
