// Electron main process — wraps the existing web app in a native window.
const { app, BrowserWindow, session, desktopCapturer, systemPreferences, dialog, screen } = require('electron');
const path = require('path');
const os = require('os');

app.setName('Incrust');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#d6d3ca',
    title: 'Incrust',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      // The app is fully self-contained (no Node access needed in the page).
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');

  // Stream the OS cursor position to the page (~30 Hz) as a fraction of the
  // display it's on, so auto-follow can track the real mouse, not motion.
  const cursorTimer = setInterval(() => {
    if (win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    const d = screen.getDisplayNearestPoint(p).bounds;
    win.webContents.send('cursor', {
      x: d.width ? (p.x - d.x) / d.width : 0.5,
      y: d.height ? (p.y - d.y) / d.height : 0.5,
    });
  }, 33);
  win.on('closed', () => clearInterval(cursorTimer));

  // Surface renderer console + JS errors in the terminal for diagnostics.
  // Electron 36+ emits a single Details object; older builds use positional args.
  win.webContents.on('console-message', (a, b, c, d) => {
    if (a && typeof a === 'object' && 'message' in a) {
      console.log(`[renderer:${a.level}] ${a.message} (${a.sourceId}:${a.lineNumber})`);
    } else {
      console.log(`[renderer:${a}] ${b} (${d}:${c})`);
    }
  });

  return win;
}

// --- Media permissions -------------------------------------------------------
// Grant camera / microphone / screen requests coming from our own page.
function wirePermissions() {
  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(['media', 'display-capture', 'audioCapture', 'videoCapture'].includes(permission));
  });
  ses.setPermissionCheckHandler(() => true);

  // getDisplayMedia → let the OS show its native screen/window picker when it
  // can (macOS ScreenCaptureKit); otherwise fall back to the primary screen.
  ses.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      callback({ video: sources[0], audio: false });
    });
  }, { useSystemPicker: true });

  // The page exports via a blob `<a download>` click. In a file:// Electron
  // window that fires a download but with no reliable default save location —
  // give it a native "Save As" dialog so the recording actually lands on disk.
  ses.on('will-download', (_e, item) => {
    const name = item.getFilename() || 'screen-cam.mp4';
    console.log('[download] will-download:', name, item.getMimeType());
    const savePath = dialog.showSaveDialogSync({
      title: 'Save recording',
      defaultPath: path.join(app.getPath('downloads') || os.homedir(), name),
    });
    if (savePath) {
      item.setSavePath(savePath);
    } else {
      item.cancel();
    }
    item.on('done', (_ev, st) => console.log('[download] done:', st, '→', item.getSavePath()));
  });
}

app.whenReady().then(() => {
  // Create the window FIRST. Nothing below is allowed to block it — the dock
  // icon and the camera/mic permission prompts are best-effort and run after,
  // so a missing asset or a stalled TCC dialog can never leave the app
  // running with no window.
  wirePermissions();
  createWindow();

  if (process.platform === 'darwin') {
    try {
      if (app.dock) app.dock.setIcon(path.join(__dirname, 'build', 'icon.png'));
    } catch (_) {}
    // Fire and forget — the page also requests these via getUserMedia.
    systemPreferences.askForMediaAccess('camera').catch(() => {});
    systemPreferences.askForMediaAccess('microphone').catch(() => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
