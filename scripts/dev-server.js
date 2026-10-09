// Dev harness: serves the renderer in a normal browser with the same backend as Electron.
// Usage: node scripts/dev-server.js [port]     (BD_MOCK_LLM=1 for a fake LLM, BD_DATA_DIR for the save folder)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const backend = require('../electron/backend');

const root = path.join(__dirname, '..');
const port = +(process.argv[2] || process.env.PORT || 5174);
const dataDir = process.env.BD_DATA_DIR || path.join(root, '.dev-data');
backend.init({ dataDir, appDir: root });

const handlers = {
  gameData: () => backend.readGameData(),
  storeRead: (rel) => backend.store.read(rel),
  storeWrite: (rel, obj) => backend.store.write(rel, obj),
  storeRemove: (rel) => backend.store.remove(rel),
  storeList: (dir) => backend.store.list(dir),
  storeReadAll: (dir) => backend.store.readAll(dir),
  settingsGet: () => backend.settingsGet(),
  settingsSet: (p) => backend.settingsSet(p),
  usage: () => backend.usageGet(),
  llm: (req) => backend.llm(req),
  testConnection: () => backend.testConnection(),
  dataDir: () => dataDir,
};

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/__api') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { method, args } = JSON.parse(body);
        const fn = handlers[method];
        if (!fn) throw new Error('Unknown method ' + method);
        const result = await fn(...(args || []));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: result === undefined ? null : result }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(root, 'src', path.normalize(p));
  if (!file.startsWith(path.join(root, 'src'))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(port, () => console.log('BalanceDesk dev server on http://localhost:' + port + '  (data: ' + dataDir + ')'));
