// Exposes a small, whitelisted API to the renderer as window.api.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const call = (method, ...args) => ipcRenderer.invoke('bd', method, args);

contextBridge.exposeInMainWorld('api', {
  gameData: () => call('gameData'),
  store: {
    read: (rel) => call('storeRead', rel),
    write: (rel, obj) => call('storeWrite', rel, obj),
    remove: (rel) => call('storeRemove', rel),
    list: (dir) => call('storeList', dir),
    readAll: (dir) => call('storeReadAll', dir),
  },
  settings: {
    get: () => call('settingsGet'),
    set: (patch) => call('settingsSet', patch),
  },
  usage: () => call('usage'),
  llm: (req) => call('llm', req),
  testConnection: () => call('testConnection'),
  resetSave: (opts) => call('resetSave', opts),
  pickImage: () => call('pickImage'),
  openDataFolder: () => call('openDataFolder'),
  openExternal: (url) => call('openExternal', url),
  flash: () => call('flash'),
  notify: (n) => call('notify', n),
  setUnread: (n) => call('setUnread', n),
  onOpenChat: (cb) => ipcRenderer.on('bd:openChat', (_e, id) => cb(id)),
  isElectron: true,
});
