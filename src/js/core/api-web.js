// Browser fallback for window.api, used only by the dev web harness (npm run dev:web).
// Inside Electron, preload.js has already defined window.api and this file does nothing.
(function () {
  if (window.api) return;
  const call = async (method, ...args) => {
    const res = await fetch('/__api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, args }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.result;
  };
  window.api = {
    gameData: () => call('gameData'),
    store: {
      read: (rel) => call('storeRead', rel),
      write: (rel, obj) => call('storeWrite', rel, obj),
      remove: (rel) => call('storeRemove', rel),
      list: (dir) => call('storeList', dir),
      readAll: (dir) => call('storeReadAll', dir),
    },
    settings: { get: () => call('settingsGet'), set: (p) => call('settingsSet', p) },
    usage: () => call('usage'),
    llm: (req) => call('llm', req),
    testConnection: () => call('testConnection'),
    resetSave: (opts) => call('resetSave', opts),
    openDataFolder: () => call('dataDir').then((d) => alert('Save folder: ' + d)),
    openExternal: (url) => window.open(url, '_blank'),
    flash: async () => {},
    pickImage: () => new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return resolve(null);
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(f);
      };
      inp.click();
    }),
    isElectron: false,
  };
})();
