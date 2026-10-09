// Electron main process: creates the window and exposes backend services over IPC.
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const backend = require('./backend');

let win = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}

function setupBackend() {
  const dataDir = process.env.BD_DATA_DIR || path.join(app.getPath('userData'), 'save');
  const cryptoAvailable = (() => { try { return safeStorage.isEncryptionAvailable(); } catch { return false; } })();
  backend.init({
    dataDir,
    appDir: path.join(__dirname, '..'),
    crypto: {
      available: cryptoAvailable,
      encrypt: (s) => safeStorage.encryptString(s).toString('base64'),
      decrypt: (s) => safeStorage.decryptString(Buffer.from(s, 'base64')),
    },
  });
}

const handlers = {
  gameData: () => backend.readGameData(),
  storeRead: (rel) => backend.store.read(rel),
  storeWrite: (rel, obj) => backend.store.write(rel, obj),
  storeRemove: (rel) => backend.store.remove(rel),
  storeList: (dir) => backend.store.list(dir),
  storeReadAll: (dir) => backend.store.readAll(dir),
  settingsGet: () => backend.settingsGet(),
  settingsSet: (patch) => backend.settingsSet(patch),
  usage: () => backend.usageGet(),
  llm: (req) => backend.llm(req),
  testConnection: () => backend.testConnection(),
  openDataFolder: () => shell.openPath(backend.dataDir),
  openExternal: (url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); },
  flash: () => { if (win && !win.isFocused()) win.flashFrame(true); },
  pickImage: async () => {
    const r = await dialog.showOpenDialog(win, {
      title: 'Choose a profile picture',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const file = r.filePaths[0];
    const buf = fs.readFileSync(file);
    if (buf.length > 8 * 1024 * 1024) throw new Error('Image is larger than 8 MB.');
    const ext = path.extname(file).slice(1).toLowerCase().replace('jpg', 'jpeg');
    return 'data:image/' + ext + ';base64,' + buf.toString('base64');
  },
};

ipcMain.handle('bd', async (_e, method, args) => {
  const fn = handlers[method];
  if (!fn) throw new Error('Unknown method ' + method);
  return fn(...(args || []));
});

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'BalanceDesk — Whiterock Support',
    backgroundColor: '#17212b',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  win.on('focus', () => win.flashFrame(false));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  setupBackend();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
