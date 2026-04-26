const clockEl   = document.getElementById('clock');
const alarmInput = document.getElementById('alarmTime');
const toggleBtn  = document.getElementById('toggleBtn');
const statusEl   = document.getElementById('status');
const overlay    = document.getElementById('overlay');
const stopBtn    = document.getElementById('stopBtn');

let alarmTime  = null;   // "HH:MM" or null
let audioCtx   = null;
let alarmNodes = [];     // 鳴らしているノードを管理

// ── 現在時刻の更新 ──────────────────────────────
function updateClock() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  // アラームチェック（秒が0のときだけ発火）
  if (alarmTime && ss === '00' && `${hh}:${mm}` === alarmTime) {
    triggerAlarm();
  }
}

setInterval(updateClock, 1000);
updateClock();

// ── セット / キャンセル ──────────────────────────
toggleBtn.addEventListener('click', () => {
  if (alarmTime) {
    cancelAlarm();
  } else {
    setAlarm();
  }
});

function setAlarm() {
  const val = alarmInput.value;
  if (!val) {
    statusEl.textContent = '時刻を選択してください';
    statusEl.classList.remove('active');
    return;
  }
  alarmTime = val;
  toggleBtn.textContent = 'キャンセル';
  toggleBtn.classList.add('active');
  statusEl.textContent  = `${val} にアラームをセットしました`;
  statusEl.classList.add('active');
}

function cancelAlarm() {
  alarmTime = null;
  toggleBtn.textContent = 'セット';
  toggleBtn.classList.remove('active');
  statusEl.textContent  = 'アラームが設定されていません';
  statusEl.classList.remove('active');
}

// ── アラーム発火 ────────────────────────────────
function triggerAlarm() {
  cancelAlarm();           // 状態をリセット
  overlay.classList.add('show');
  playBeep();
}

stopBtn.addEventListener('click', () => {
  overlay.classList.remove('show');
  stopBeep();
});

// ── 音 (Web Audio API) ──────────────────────────
function playBeep() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function beep(startTime) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type      = 'sine';
    osc.frequency.setValueAtTime(880, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.05);
    gain.gain.linearRampToValueAtTime(0,   startTime + 0.3);

    osc.start(startTime);
    osc.stop(startTime + 0.35);
    alarmNodes.push(osc);
  }

  // 0.5秒おきに繰り返しビープ
  for (let i = 0; i < 20; i++) {
    beep(audioCtx.currentTime + i * 0.5);
  }
}

function stopBeep() {
  alarmNodes.forEach(n => { try { n.stop(); } catch (_) {} });
  alarmNodes = [];
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}