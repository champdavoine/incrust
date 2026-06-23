// Screen + Cam Merge — capture screen, cut webcam background, composite, record.

const els = {
  camSelect: document.getElementById('camSelect'),
  micSelect: document.getElementById('micSelect'),
  posSeg: document.getElementById('posSeg'),
  sizeRange: document.getElementById('sizeRange'),
  sizeVal: document.getElementById('sizeVal'),
  featherRange: document.getElementById('featherRange'),
  featherVal: document.getElementById('featherVal'),
  effectSelect: document.getElementById('effectSelect'),
  mirrorToggle: document.getElementById('mirrorToggle'),
  shadowToggle: document.getElementById('shadowToggle'),
  persistToggle: document.getElementById('persistToggle'),
  resetBtn: document.getElementById('resetBtn'),
  startBtn: document.getElementById('startBtn'),
  startGlyph: document.getElementById('startGlyph'),
  startLabel: document.getElementById('startLabel'),
  recBtn: document.getElementById('recBtn'),
  recGlyph: document.getElementById('recGlyph'),
  recLabel: document.getElementById('recLabel'),
  status: document.getElementById('status'),
  preview: document.getElementById('preview'),
  placeholder: document.getElementById('placeholder'),
  resChip: document.getElementById('resChip'),
  recBadge: document.getElementById('recBadge'),
  recTime: document.getElementById('recTime'),
};

const state = {
  pos: 'bl',
  custom: null,      // {x, y} camera CENTER as fraction of canvas, or null for preset
  camRect: null,     // last drawn camera rect in canvas px (for drag hit-testing)
  size: 0.28,        // camera height as fraction of canvas height
  feather: 3,
  effect: 'none',
  mirror: true,
  shadow: true,
  screenStream: null,
  camStream: null,
  micStream: null,
  running: false,
  recorder: null,
  chunks: [],
};

// Hidden <video> elements that feed the canvas.
const screenVideo = document.createElement('video');
const camVideo = document.createElement('video');
[screenVideo, camVideo].forEach(v => { v.muted = true; v.playsInline = true; });

// Offscreen canvas holding only the cut-out person (transparent background).
const personCanvas = document.createElement('canvas');
const personCtx = personCanvas.getContext('2d');

const ctx = els.preview.getContext('2d');

// Resolve once a media element knows its real pixel dimensions.
function onceLoaded(video) {
  return new Promise((resolve) => {
    if (video.videoWidth) return resolve();
    video.addEventListener('loadedmetadata', () => resolve(), { once: true });
  });
}

// --- MediaPipe Selfie Segmentation -------------------------------------------
let latestMask = null; // ImageBitmap-like canvas/image of the segmentation mask
const segmenter = new SelfieSegmentation({
  locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
});
segmenter.setOptions({ modelSelection: 1 }); // 1 = general model, best for sitting at a desk
segmenter.onResults((results) => { latestMask = results.segmentationMask; });

// --- Settings persistence ----------------------------------------------------
const STORAGE_KEY = 'screen-cam-merge:settings';

function saveSettings() {
  if (!els.persistToggle.checked) { localStorage.removeItem(STORAGE_KEY); return; }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pos: state.pos, custom: state.custom, size: state.size, feather: state.feather,
      effect: state.effect, mirror: state.mirror, shadow: state.shadow,
      camId: els.camSelect.value, micId: els.micSelect.value,
    }));
  } catch (_) {}
}

function loadSettings() {
  let data;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
  if (!data) return;
  state.pos = data.pos ?? state.pos;
  state.custom = data.custom ?? null;
  state.size = data.size ?? state.size;
  state.feather = data.feather ?? state.feather;
  state.effect = data.effect ?? state.effect;
  state.mirror = data.mirror ?? state.mirror;
  state.shadow = data.shadow ?? state.shadow;
  state.savedCamId = data.camId || '';
  state.savedMicId = data.micId || '';
  // Reflect into the controls.
  els.sizeRange.value = Math.round(state.size * 100);
  els.sizeVal.textContent = els.sizeRange.value + '%';
  els.featherRange.value = state.feather;
  els.featherVal.textContent = state.feather;
  els.effectSelect.value = state.effect;
  els.mirrorToggle.checked = state.mirror;
  els.shadowToggle.checked = state.shadow;
  els.posSeg.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', !state.custom && b.dataset.pos === state.pos));
}

// --- Device enumeration ------------------------------------------------------
async function listDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  fill(els.camSelect, devices.filter(d => d.kind === 'videoinput'), 'Camera');
  fill(els.micSelect, devices.filter(d => d.kind === 'audioinput'), 'Microphone');
  // Restore previously chosen devices if they're still present.
  if (state.savedCamId && [...els.camSelect.options].some(o => o.value === state.savedCamId))
    els.camSelect.value = state.savedCamId;
  if (state.savedMicId && [...els.micSelect.options].some(o => o.value === state.savedMicId))
    els.micSelect.value = state.savedMicId;
}
function fill(sel, devices, label) {
  sel.innerHTML = '';
  devices.forEach((d, i) => {
    const o = document.createElement('option');
    o.value = d.deviceId;
    o.textContent = d.label || `${label} ${i + 1}`;
    sel.appendChild(o);
  });
}

// --- UI wiring ---------------------------------------------------------------
els.posSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  els.posSeg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.pos = btn.dataset.pos;
  state.custom = null; // snapping to a corner clears the custom position
  saveSettings();
});

// Drag the webcam anywhere on the preview.
let drag = null; // { dx, dy } cursor offset from cam center, in canvas px
function canvasPoint(e) {
  const r = els.preview.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (els.preview.width / r.width),
    y: (e.clientY - r.top) * (els.preview.height / r.height),
  };
}
els.preview.addEventListener('pointerdown', (e) => {
  const c = state.camRect;
  if (!c) return;
  const p = canvasPoint(e);
  if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
    drag = { dx: p.x - (c.x + c.w / 2), dy: p.y - (c.y + c.h / 2) };
    els.preview.setPointerCapture(e.pointerId);
    els.preview.style.cursor = 'grabbing';
    els.posSeg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  }
});
els.preview.addEventListener('pointermove', (e) => {
  const c = state.camRect;
  if (drag) {
    const p = canvasPoint(e);
    state.custom = {
      x: (p.x - drag.dx) / els.preview.width,
      y: (p.y - drag.dy) / els.preview.height,
    };
  } else if (c) {
    const p = canvasPoint(e);
    const over = p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h;
    els.preview.style.cursor = over ? 'grab' : 'default';
  }
});
function endDrag(e) {
  if (!drag) return;
  drag = null;
  els.preview.style.cursor = 'grab';
  try { els.preview.releasePointerCapture(e.pointerId); } catch (_) {}
  saveSettings(); // remember the dropped position
}
els.preview.addEventListener('pointerup', endDrag);
els.preview.addEventListener('pointercancel', endDrag);
els.sizeRange.addEventListener('input', () => {
  state.size = els.sizeRange.value / 100;
  els.sizeVal.textContent = els.sizeRange.value + '%';
  saveSettings();
});
els.featherRange.addEventListener('input', () => {
  state.feather = +els.featherRange.value;
  els.featherVal.textContent = state.feather;
  saveSettings();
});
els.effectSelect.addEventListener('change', () => { state.effect = els.effectSelect.value; saveSettings(); });
els.mirrorToggle.addEventListener('change', () => { state.mirror = els.mirrorToggle.checked; saveSettings(); });
els.shadowToggle.addEventListener('change', () => { state.shadow = els.shadowToggle.checked; saveSettings(); });
els.camSelect.addEventListener('change', saveSettings);
els.micSelect.addEventListener('change', saveSettings);
els.persistToggle.addEventListener('change', saveSettings);
els.resetBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

// CSS-style filter strings used to color-grade the webcam cutout.
const EFFECTS = {
  none: 'none',
  bw: 'grayscale(1)',
  sepia: 'sepia(0.85)',
  vintage: 'sepia(0.5) contrast(1.15) saturate(1.3)',
  cool: 'saturate(1.2) hue-rotate(-18deg)',
  warm: 'sepia(0.3) saturate(1.4) hue-rotate(-12deg)',
  invert: 'invert(1)',
};

function setStatus(text, kind = '') {
  els.status.innerHTML = `<span class="dot ${kind}"></span>${text}`;
}

// --- Start / stop capture ----------------------------------------------------
els.startBtn.addEventListener('click', async () => {
  if (state.running) return stopAll();
  try {
    setStatus('Requesting screen…');
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: false,
    });
    state.screenStream.getVideoTracks()[0].addEventListener('ended', stopAll);

    setStatus('Requesting webcam…');
    state.camStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: els.camSelect.value ? { exact: els.camSelect.value } : undefined,
               width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    state.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: els.micSelect.value ? { exact: els.micSelect.value } : undefined },
    }).catch(() => null);

    await listDevices(); // labels now available after permission

    screenVideo.srcObject = state.screenStream;
    camVideo.srcObject = state.camStream;
    // Wait for real frame dimensions before sizing the canvas.
    await Promise.all([
      onceLoaded(screenVideo).then(() => screenVideo.play()),
      onceLoaded(camVideo).then(() => camVideo.play()),
    ]);

    // Canvas matches the ACTUAL captured screen resolution, 1:1.
    els.preview.width = screenVideo.videoWidth;
    els.preview.height = screenVideo.videoHeight;
    personCanvas.width = camVideo.videoWidth;
    personCanvas.height = camVideo.videoHeight;

    els.placeholder.style.display = 'none';
    els.preview.style.display = 'block';
    els.resChip.style.display = 'flex';
    state.running = true;
    els.startGlyph.textContent = '■';
    els.startLabel.textContent = 'Stop';
    els.recBtn.disabled = false;
    setStatus('Live preview running.', 'live');
    pump();
    requestAnimationFrame(render);
  } catch (err) {
    setStatus('Error: ' + err.message);
    stopAll();
  }
});

// Feed webcam frames to the segmenter on its own loop (decoupled from render).
async function pump() {
  if (!state.running) return;
  if (camVideo.readyState >= 2) {
    try { await segmenter.send({ image: camVideo }); } catch (_) {}
  }
  if (state.running) requestAnimationFrame(pump);
}

// --- Compositing -------------------------------------------------------------
function render() {
  if (!state.running) return;

  // Keep the canvas locked to the live screen resolution (windows can resize).
  if (screenVideo.videoWidth &&
      (els.preview.width !== screenVideo.videoWidth || els.preview.height !== screenVideo.videoHeight)) {
    els.preview.width = screenVideo.videoWidth;
    els.preview.height = screenVideo.videoHeight;
  }
  const W = els.preview.width, H = els.preview.height;

  // 1. Screen fills the canvas.
  ctx.drawImage(screenVideo, 0, 0, W, H);

  // 2. Build the cut-out person on the offscreen canvas.
  if (latestMask && camVideo.videoWidth) {
    const cw = personCanvas.width, ch = personCanvas.height;
    personCtx.clearRect(0, 0, cw, ch);
    // Draw mask, then keep only webcam pixels where the mask is opaque.
    personCtx.save();
    if (state.feather > 0) personCtx.filter = `blur(${state.feather}px)`;
    personCtx.drawImage(latestMask, 0, 0, cw, ch);
    personCtx.filter = 'none';
    personCtx.globalCompositeOperation = 'source-in';
    personCtx.drawImage(camVideo, 0, 0, cw, ch);
    personCtx.restore();

    // 3. Place it, preserving aspect ratio. Custom position wins over presets.
    const camH = H * state.size;
    const camW = camH * (cw / ch);
    const m = H * 0.03; // margin
    let x, y;
    if (state.custom) {
      // custom holds the camera's CENTER as a fraction of the canvas.
      // No clamping — the camera may hang off any edge (canvas clips it).
      x = state.custom.x * W - camW / 2;
      y = state.custom.y * H - camH / 2;
    } else {
      switch (state.pos) {
        case 'br': x = W - camW - m; y = H - camH - m; break;
        case 'tl': x = m;            y = m;            break;
        case 'tr': x = W - camW - m; y = m;            break;
        default:   x = m;            y = H - camH - m; // bl
      }
    }
    state.camRect = { x, y, w: camW, h: camH }; // for hit-testing drags

    ctx.save();
    if (state.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = H * 0.025;
      ctx.shadowOffsetY = H * 0.008;
    }
    const filter = EFFECTS[state.effect] || 'none';
    if (filter !== 'none') ctx.filter = filter;
    if (state.mirror) {
      // Flip horizontally around the camera's own center.
      ctx.translate(x + camW, y);
      ctx.scale(-1, 1);
      ctx.drawImage(personCanvas, 0, 0, camW, camH);
    } else {
      ctx.drawImage(personCanvas, x, y, camW, camH);
    }
    ctx.restore();
  }

  // Live resolution + FPS readout (refreshed twice a second).
  state.frames = (state.frames || 0) + 1;
  const now = performance.now();
  if (!state.fpsT) state.fpsT = now;
  if (now - state.fpsT >= 500) {
    const fps = Math.round((state.frames * 1000) / (now - state.fpsT));
    els.resChip.textContent = `${W} × ${H} · ${fps} fps`;
    state.frames = 0;
    state.fpsT = now;
  }

  requestAnimationFrame(render);
}

// --- Recording ---------------------------------------------------------------
els.recBtn.addEventListener('click', () => {
  if (state.recorder && state.recorder.state === 'recording') {
    state.recorder.stop();
    return;
  }
  const canvasStream = els.preview.captureStream(30);
  if (state.micStream) {
    state.micStream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
  }
  // Prefer MP4/H.264 so the file opens in QuickTime, Final Cut, Premiere, etc.
  const candidates = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];
  const mime = candidates.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
  state.recMime = mime;
  state.chunks = [];
  state.recorder = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  state.recorder.ondataavailable = (e) => { if (e.data.size) state.chunks.push(e.data); };
  state.recorder.onstop = saveRecording;
  state.recorder.start();
  els.recBtn.classList.add('recording');
  els.recGlyph.textContent = '■';
  els.recLabel.textContent = 'Stop';
  setStatus('Recording…', 'rec');

  // Recording badge + elapsed timer over the preview.
  els.recBadge.style.display = 'flex';
  state.recStart = performance.now();
  els.recTime.textContent = '00:00';
  state.recTimer = setInterval(() => {
    const s = Math.floor((performance.now() - state.recStart) / 1000);
    els.recTime.textContent =
      `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 250);
});

function stopRecTimer() {
  clearInterval(state.recTimer);
  state.recTimer = null;
  els.recBadge.style.display = 'none';
}

async function saveRecording() {
  stopRecTimer();
  els.recBtn.classList.remove('recording');
  els.recGlyph.textContent = '●';
  els.recLabel.textContent = 'Record';

  const isMp4 = (state.recMime || '').startsWith('video/mp4');
  let blob = new Blob(state.chunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
  let ext = isMp4 ? 'mp4' : 'webm';

  // Browser couldn't record MP4 natively → transcode the WebM to MP4 in-browser.
  if (!isMp4) {
    try {
      setStatus('Converting to MP4…', 'rec');
      blob = await webmToMp4(blob);
      ext = 'mp4';
    } catch (err) {
      console.error('MP4 conversion failed:', err);
      setStatus('Saved as .webm (MP4 convert failed).', 'live');
    }
  }

  download(blob, ext);
  if (ext === 'mp4') setStatus('Saved MP4 — preview still live.', 'live');
}

function download(blob, ext) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `screen-cam-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Lazy-loaded ffmpeg.wasm transcoder (single-thread core; no special headers).
let ffmpegPromise = null;
async function getFfmpeg() {
  if (!ffmpegPromise) ffmpegPromise = (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('https://esm.sh/@ffmpeg/ffmpeg@0.12.10'),
      import('https://esm.sh/@ffmpeg/util@0.12.1'),
    ]);
    const ff = new FFmpeg();
    ff.on('progress', ({ progress }) => {
      if (progress > 0 && progress <= 1) setStatus(`Converting to MP4… ${Math.round(progress * 100)}%`, 'rec');
    });
    const base = 'https://esm.sh/@ffmpeg/core@0.12.6/dist/esm';
    await ff.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ff;
  })();
  return ffmpegPromise;
}

async function webmToMp4(webmBlob) {
  const ff = await getFfmpeg();
  const buf = new Uint8Array(await webmBlob.arrayBuffer());
  await ff.writeFile('in.webm', buf);
  await ff.exec([
    '-i', 'in.webm',
    '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k',
    'out.mp4',
  ]);
  const data = await ff.readFile('out.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

// --- Teardown ----------------------------------------------------------------
function stopAll() {
  state.running = false;
  if (state.recorder && state.recorder.state === 'recording') state.recorder.stop();
  [state.screenStream, state.camStream, state.micStream].forEach(s =>
    s && s.getTracks().forEach(t => t.stop()));
  state.screenStream = state.camStream = state.micStream = null;
  stopRecTimer();
  els.preview.style.display = 'none';
  els.resChip.style.display = 'none';
  els.placeholder.style.display = 'flex';
  els.startGlyph.textContent = '▶';
  els.startLabel.textContent = 'Start';
  els.recBtn.classList.remove('recording');
  els.recGlyph.textContent = '●';
  els.recLabel.textContent = 'Record';
  els.recBtn.disabled = true;
  setStatus('Idle — press Start.');
}

// --- Init --------------------------------------------------------------------
loadSettings();
listDevices().catch(() => {});
navigator.mediaDevices.addEventListener('devicechange', () => listDevices().catch(() => {}));
