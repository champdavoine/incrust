# Incrust

**Your screen. You in it.** Incrust captures your screen and webcam at the same
time, cuts the background out of the webcam in real time (MediaPipe Selfie
Segmentation), composites you as a floating bubble over the screen, and records
straight to `.mp4`. No green screen, no editing.

Ships as a native **Electron** desktop app. The UI is plain HTML/CSS/JS — no
build step.

## Download

**[⬇ Incrust for macOS (Apple Silicon)](https://github.com/champdavoine/incrust/releases/latest/download/Incrust-arm64.dmg)**

The app is not notarized yet: on first launch, right-click `Incrust.app` →
**Open**. On macOS Sequoia: System Settings → Privacy & Security → **Open
Anyway**.

## Use

1. **START** → pick the screen or window to share, allow webcam + mic.
2. Adjust live on the preview: **drag** the bubble anywhere, **scroll** on it to
   resize, pick a frame (screen / 16:9 / 9:16 / 1:1), zoom, follow the cursor.
   Webcam/mic devices live behind the gear button.
3. **REC** → press again to stop: a ready-to-publish `.mp4` lands where you
   choose.

Records straight to **MP4 (H.264/AAC)** — opens directly in QuickTime, Final
Cut, Premiere, iMovie. If the runtime can only record WebM, the app
auto-converts to MP4 via ffmpeg.wasm before saving (needs internet on first use
to fetch the wasm core).

## Develop

```bash
npm install
npm start       # native Incrust window, permissions wired up
npm run dist    # package → dist/Incrust-arm64.dmg
```

The marketing site lives in [`landing/`](landing) (Next.js):

```bash
cd landing && npm install && npm run dev
```

## Notes

- Segmentation runs on the GPU in real time; `modelSelection: 1` in `app.js` is
  tuned for sitting at a desk. Even lighting helps the edges.
- MediaPipe is loaded from a CDN — the bubble needs internet the first time.
- Native mouse-follow needs the Electron app; in a plain browser it falls back
  to motion-based follow.

### Future work

- Notarize the macOS build (Developer ID + `notarize` in electron-builder) to
  remove the Gatekeeper first-open friction.
- Windows build (`nsis` target is already configured).
- Bundle MediaPipe + ffmpeg.wasm for fully offline use.
