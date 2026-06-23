# Incrust

Captures your screen and webcam at the same time, cuts the background out of the
webcam (detourage via MediaPipe Selfie Segmentation), composites the floating
person over the screen on a `<canvas>`, and records the result to an `.mp4` file.

Ships as a native **Electron** desktop app (macOS / Windows). The UI is plain
HTML/JS — no build step.

## Run (desktop app)

```bash
npm install
npm start
```

This opens the native **Incrust** window with screen, camera and microphone
access wired up.

### Package a distributable

```bash
npm run dist    # → dist/ (.dmg on macOS, NSIS installer on Windows)
```

## Run in a browser (alternative)

`getDisplayMedia` / `getUserMedia` need a *secure context*, so serve over
`localhost` (a plain `file://` open won't get camera/screen permission):

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 in **Chrome**. Note: native mouse-follow needs the
Electron app; the browser falls back to motion-based follow.

## Use

1. **Start capture** → pick the screen or window to share, allow the webcam + mic.
2. Adjust position / size / edge smoothing / shadow live in the sidebar.
3. **Record** → **Stop & save** downloads a `.webm`.

### Output format

Records straight to **MP4 (H.264/AAC)** when the browser supports it (current
Chrome on macOS does) — opens directly in QuickTime, Final Cut, Premiere, iMovie.

If the browser can only record WebM, the app **auto-converts to MP4 in-browser**
via ffmpeg.wasm before download (needs internet on first use to fetch the wasm
core; conversion of long clips can take a while). Either way you get an `.mp4`.

## Notes

- First macOS run: grant **Screen Recording** + **Camera** + **Microphone** to your
  browser in System Settings → Privacy & Security (relaunch the browser after).
- Segmentation runs on the GPU in real time; `modelSelection: 1` in `app.js` is
  tuned for sitting at a desk.
- The detourage works best with even lighting and contrast between you and your
  background — no green screen required, but it helps the edges.
