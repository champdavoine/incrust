// Bridges native data from the main process into the (isolated) page context.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
  // Receive the OS cursor position as a {x, y} fraction (0..1) of the display
  // it currently sits on. Pushed from main at ~30 Hz.
  onCursor: (cb) => ipcRenderer.on('cursor', (_e, pos) => cb(pos)),
});
