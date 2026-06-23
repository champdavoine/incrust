// Screen + Cam Merge — capture screen, cut webcam background, composite, record.

const els = {
  camSelect: document.getElementById('camSelect'),
  micSelect: document.getElementById('micSelect'),
  posSeg: document.getElementById('posSeg'),
  sizeRange: document.getElementById('sizeRange'),
  sizeVal: document.getElementById('sizeVal'),
  featherRange: document.getElementById('featherRange'),
  featherVal: document.getElementById('featherVal'),
  formatSeg: document.getElementById('formatSeg'),
  zoomRange: document.getElementById('zoomRange'),
  zoomVal: document.getElementById('zoomVal'),
  followToggle: document.getElementById('followToggle'),
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
  format: 'match',   // match | landscape | portrait | square
  zoom: 1,           // 1 = fit, >1 = crop in
  pan: { x: 0.5, y: 0.5 }, // crop CENTER as fraction of the source screen
  follow: false,     // auto-pan toward on-screen motion
  followTarget: null,
  view: { fracW: 1, fracH: 1 }, // visible fraction of source (set each frame)
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
      format: state.format, zoom: state.zoom, pan: state.pan, follow: state.follow,
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
  state.format = data.format ?? state.format;
  state.zoom = data.zoom ?? state.zoom;
  state.pan = data.pan ?? state.pan;
  state.follow = data.follow ?? state.follow;
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
  els.zoomRange.value = Math.round(state.zoom * 100);
  els.zoomVal.textContent = state.zoom.toFixed(1) + '×';
  els.followToggle.checked = state.follow;
  els.effectSelect.value = state.effect;
  els.mirrorToggle.checked = state.mirror;
  els.shadowToggle.checked = state.shadow;
  els.posSeg.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', !state.custom && b.dataset.pos === state.pos));
  els.formatSeg.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.fmt === state.format));
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

els.formatSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  els.formatSeg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.format = btn.dataset.fmt;
  state.pan = { x: 0.5, y: 0.5 }; // recenter the frame on a format change
  saveSettings();
});
els.zoomRange.addEventListener('input', () => {
  state.zoom = els.zoomRange.value / 100;
  els.zoomVal.textContent = state.zoom.toFixed(1) + '×';
  saveSettings();
});
els.followToggle.addEventListener('change', () => {
  state.follow = els.followToggle.checked;
  state.followTarget = null;
  // Following only has somewhere to pan when the frame is cropped. If we're at
  // full screen (no crop), zoom in a touch so enabling follow does something.
  if (state.follow && state.format === 'match' && state.zoom === 1) {
    els.zoomRange.value = 150;
    els.zoomRange.dispatchEvent(new Event('input'));
  }
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
let panDrag = null; // { startX, startY, panX, panY }
const cropActive = () => state.view.fracW < 0.999 || state.view.fracH < 0.999;
const overCam = (p) => {
  const c = state.camRect;
  return c && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h;
};
els.preview.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  if (overCam(p)) {                       // grab the webcam → move it
    const c = state.camRect;
    drag = { dx: p.x - (c.x + c.w / 2), dy: p.y - (c.y + c.h / 2) };
    els.preview.setPointerCapture(e.pointerId);
    els.preview.style.cursor = 'grabbing';
    els.posSeg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  } else if (cropActive() && !state.follow) { // grab the background → pan the frame
    panDrag = { startX: p.x, startY: p.y, panX: state.pan.x, panY: state.pan.y };
    els.preview.setPointerCapture(e.pointerId);
    els.preview.style.cursor = 'grabbing';
  }
});
els.preview.addEventListener('pointermove', (e) => {
  const p = canvasPoint(e);
  if (drag) {
    state.custom = {
      x: (p.x - drag.dx) / els.preview.width,
      y: (p.y - drag.dy) / els.preview.height,
    };
  } else if (panDrag) {
    const { fracW, fracH } = state.view;
    const nx = panDrag.panX - ((p.x - panDrag.startX) / els.preview.width) * fracW;
    const ny = panDrag.panY - ((p.y - panDrag.startY) / els.preview.height) * fracH;
    state.pan.x = Math.min(1 - fracW / 2, Math.max(fracW / 2, nx));
    state.pan.y = Math.min(1 - fracH / 2, Math.max(fracH / 2, ny));
  } else {
    els.preview.style.cursor = overCam(p) ? 'grab' : (cropActive() && !state.follow ? 'move' : 'default');
  }
});
function endDrag(e) {
  if (!drag && !panDrag) return;
  drag = null;
  panDrag = null;
  els.preview.style.cursor = 'grab';
  try { els.preview.releasePointerCapture(e.pointerId); } catch (_) {}
  saveSettings(); // remember the dropped position / pan
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

// Output aspect ratio (width / height) per format. null = match the screen.
const FORMAT_AR = { match: null, landscape: 16 / 9, portrait: 9 / 16, square: 1 };
// Target size of the SHORT side of the output, in px. Vertical → 1080 wide
// (1080×1920), 16:9 → 1080 tall (1920×1080), 1:1 → 1080×1080. "Screen" keeps
// the native crop resolution instead.
const OUTPUT_SHORT = 1080;

// --- Auto-follow: pan the crop toward the mouse (native) or on-screen motion -
// In the Electron app the OS cursor position arrives via the preload bridge as
// a {x, y} fraction of the display. That's exact — unlike motion detection it
// tracks the real pointer. Falls back to motion when running in a plain browser.
let nativeCursor = null;
if (window.native && window.native.onCursor) {
  window.native.onCursor((pos) => { nativeCursor = pos; });
}

const motionCanvas = document.createElement('canvas');
const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });
let prevLuma = null;
function updateFollow(sw, sh, fracW, fracH) {
  if (nativeCursor) {
    // True mouse-follow: aim the crop at the cursor.
    state.followTarget = { x: nativeCursor.x, y: nativeCursor.y };
  } else {
    // Browser fallback: follow where the screen is changing the most.
    const mw = 96, mh = Math.max(1, Math.round(96 * sh / sw));
    if (motionCanvas.width !== mw || motionCanvas.height !== mh) {
      motionCanvas.width = mw; motionCanvas.height = mh; prevLuma = null;
    }
    motionCtx.drawImage(screenVideo, 0, 0, mw, mh);
    const d = motionCtx.getImageData(0, 0, mw, mh).data;
    if (!prevLuma) {
      prevLuma = new Float32Array(mw * mh);
      for (let i = 0, p = 0; i < d.length; i += 4, p++)
        prevLuma[p] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      return;
    }
    let sx = 0, sy = 0, sw8 = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      const diff = Math.abs(l - prevLuma[p]);
      prevLuma[p] = l;
      if (diff > 18) { const x = p % mw, y = (p / mw) | 0; sx += x * diff; sy += y * diff; sw8 += diff; }
    }
    if (sw8 > 60) state.followTarget = { x: (sx / sw8) / mw, y: (sy / sw8) / mh };
  }

  const t = state.followTarget || { x: 0.5, y: 0.5 };
  const tx = Math.min(1 - fracW / 2, Math.max(fracW / 2, t.x));
  const ty = Math.min(1 - fracH / 2, Math.max(fracH / 2, t.y));
  state.pan.x += (tx - state.pan.x) * 0.12; // ease for smooth panning
  state.pan.y += (ty - state.pan.y) * 0.12;
}

// --- Compositing -------------------------------------------------------------
function render() {
  if (!state.running) return;
  const sw = screenVideo.videoWidth, sh = screenVideo.videoHeight;
  if (!sw) { requestAnimationFrame(render); return; }

  // Work out the crop region of the source for the chosen output format/zoom.
  const sourceAR = sw / sh;
  const outAR = FORMAT_AR[state.format] || sourceAR;
  let cropW, cropH;
  if (outAR <= sourceAR) { cropH = sh; cropW = sh * outAR; }   // vertical/narrower slice
  else                   { cropW = sw; cropH = sw / outAR; }   // horizontal slice
  cropW = Math.min(sw, cropW / state.zoom);
  cropH = Math.min(sh, cropH / state.zoom);
  const fracW = cropW / sw, fracH = cropH / sh;
  state.view = { fracW, fracH };

  if (state.follow && (fracW < 0.999 || fracH < 0.999)) updateFollow(sw, sh, fracW, fracH);

  // Clamp the crop centre so the rectangle stays on-screen.
  const cx = (Math.min(1 - fracW / 2, Math.max(fracW / 2, state.pan.x)) * sw) - cropW / 2;
  const cy = (Math.min(1 - fracH / 2, Math.max(fracH / 2, state.pan.y)) * sh) - cropH / 2;

  // Output canvas size: standardise to a 1080-px short side per format so the
  // recording is a clean 1080×1920 / 1920×1080 / 1080×1080. The source crop is
  // still sampled at full resolution; only the destination size is fixed.
  // "Screen" keeps the native crop res. H.264 needs even dimensions.
  let W, H;
  if (state.format === 'match') {
    W = Math.round(cropW); H = Math.round(cropH);
  } else if (outAR >= 1) {
    H = OUTPUT_SHORT; W = Math.round(OUTPUT_SHORT * outAR);
  } else {
    W = OUTPUT_SHORT; H = Math.round(OUTPUT_SHORT / outAR);
  }
  W -= W % 2; H -= H % 2;
  if (els.preview.width !== W || els.preview.height !== H) {
    els.preview.width = W; els.preview.height = H;
  }

  // 1. Draw the cropped screen region to fill the canvas.
  ctx.drawImage(screenVideo, cx, cy, cropW, cropH, 0, 0, W, H);

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
