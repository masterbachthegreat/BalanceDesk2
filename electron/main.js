// Electron main process: creates the window and exposes backend services over IPC.
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, Menu, Tray, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const backend = require('./backend');

let win = null;
let tray = null;
let quitting = false;
let trayHintShown = false;
const startHidden = process.argv.includes('--hidden'); // started with Windows: live in the tray
const ICON = path.join(__dirname, '..', 'build', 'icon.png');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

// The world runs in real time, so closing the window keeps BalanceDesk running in the tray
// (Settings → "Keep running in the tray"); Quit from the tray menu really quits.
function setupTray() {
  const img = nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('BalanceDesk');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open BalanceDesk', click: () => showWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', () => showWindow());
}

function applyOsSettings() {
  const s = backend.settingsGet();
  if (process.platform === 'win32' || process.platform === 'darwin') {
    try { app.setLoginItemSettings({ openAtLogin: !!s.startWithWindows, args: ['--hidden'] }); } catch {}
  }
}

function notify({ title, body, chatId }) {
  if (!Notification.isSupported() || (win && win.isVisible() && win.isFocused())) return;
  const n = new Notification({ title: String(title).slice(0, 120), body: String(body || '').slice(0, 240), icon: ICON, silent: true });
  n.on('click', () => { showWindow(); if (chatId) win.webContents.send('bd:openChat', chatId); });
  n.show();
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
  settingsSet: (patch) => { const r = backend.settingsSet(patch); applyOsSettings(); return r; },
  usage: () => backend.usageGet(),
  llm: (req) => backend.llm(req),
  testConnection: () => backend.testConnection(),
  resetSave: (opts) => backend.resetSave(opts),
  openDataFolder: () => shell.openPath(backend.dataDir),
  openExternal: (url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); },
  flash: () => { if (win && !win.isFocused()) win.flashFrame(true); },
  notify: (n) => notify(n || {}),
  setUnread: (n) => { if (tray) tray.setToolTip(n ? `BalanceDesk: ${n} unread` : 'BalanceDesk'); },
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
    icon: ICON,
    autoHideMenuBar: true,
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      backgroundThrottling: false, // keep the clock and customers going while hidden in the tray
    },
  });
  win.on('focus', () => win.flashFrame(false));
  win.on('close', (e) => {
    if (quitting || !tray || backend.settingsGet().closeToTray === false) return;
    e.preventDefault();
    win.hide();
    if (!trayHintShown && Notification.isSupported()) {
      trayHintShown = true;
      new Notification({ title: 'BalanceDesk is still running', body: 'Customers keep writing. Find it in the tray; right-click → Quit to close it completely.', icon: ICON, silent: true }).show();
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
}

app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('com.whiterock.balancedesk'); // needed for Windows notifications
  Menu.setApplicationMenu(null);
  setupBackend();
  createWindow();
  try { setupTray(); } catch (e) { console.error('tray', e); }
  applyOsSettings();
});

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => app.quit());
