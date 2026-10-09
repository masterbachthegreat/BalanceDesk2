// Node-side services shared by the Electron main process and the dev web harness.
// Everything the renderer needs from disk or the network goes through here.
'use strict';

const fs = require('fs');
const path = require('path');
const mock = require('./mock-llm');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_SETTINGS = {
  apiKey: '',
  customerModel: 'anthropic/claude-haiku-5.5',
  smartModel: 'anthropic/claude-sonnet-5.5',
  bossModel: 'anthropic/claude-sonnet-5.5',
  sound: true,
  notifications: true,
};

let dataDir = '';      // where saves live (userData/save)
let appDir = '';       // where the bundled data/ folder lives
let crypto = { encrypt: (s) => s, decrypt: (s) => s, available: false };

function init(opts) {
  dataDir = opts.dataDir;
  appDir = opts.appDir;
  if (opts.crypto) crypto = opts.crypto;
  fs.mkdirSync(path.join(dataDir, 'chats'), { recursive: true });
}

// ---------- safe paths ----------
function resolveInData(rel) {
  const full = path.resolve(dataDir, rel);
  if (!full.startsWith(path.resolve(dataDir) + path.sep)) throw new Error('Path escapes data dir: ' + rel);
  return full;
}

function readJSON(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJSONAtomic(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 1));
  fs.renameSync(tmp, file);
}

// ---------- game data (bundled, editable JSON) ----------
function readGameData() {
  const d = path.join(appDir, 'data');
  const out = {
    config: readJSON(path.join(d, 'config.json'), {}),
    ranks: readJSON(path.join(d, 'ranks.json'), []),
    personalities: readJSON(path.join(d, 'personalities.json'), []),
    shop: readJSON(path.join(d, 'shop.json'), []),
    memos: readJSON(path.join(d, 'memos.json'), []),
    questions: [],
  };
  const qdir = path.join(d, 'questions');
  if (fs.existsSync(qdir)) {
    for (const f of fs.readdirSync(qdir).filter((f) => f.endsWith('.json')).sort()) {
      const file = readJSON(path.join(qdir, f));
      if (!file) { console.error('Bad question file', f); continue; }
      for (const q of file.questions || []) out.questions.push({ ...q, rank: q.rank || file.rank });
    }
  }
  return out;
}

// ---------- save store ----------
const store = {
  read(rel) { return readJSON(resolveInData(rel)); },
  write(rel, obj) { writeJSONAtomic(resolveInData(rel), obj); return true; },
  remove(rel) { try { fs.unlinkSync(resolveInData(rel)); } catch {} return true; },
  list(dir) {
    const full = resolveInData(dir);
    if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full).filter((f) => f.endsWith('.json'));
  },
  readAll(dir) {
    return store.list(dir).map((f) => readJSON(path.join(resolveInData(dir), f))).filter(Boolean);
  },
};

// ---------- settings ----------
function loadSettingsRaw() {
  const s = { ...DEFAULT_SETTINGS, ...(readJSON(path.join(dataDir, 'settings.json'), {})) };
  if (s.apiKeyEnc) {
    try { s.apiKey = crypto.decrypt(s.apiKeyEnc); } catch { s.apiKey = ''; }
  }
  delete s.apiKeyEnc;
  return s;
}

function saveSettingsRaw(s) {
  const toSave = { ...s };
  if (toSave.apiKey && crypto.available) {
    toSave.apiKeyEnc = crypto.encrypt(toSave.apiKey);
    delete toSave.apiKey;
  }
  writeJSONAtomic(path.join(dataDir, 'settings.json'), toSave);
}

function settingsGet() {
  const s = loadSettingsRaw();
  const key = s.apiKey || '';
  return {
    ...s,
    apiKey: undefined,
    hasKey: !!key || mock.enabled(),
    keyPreview: key ? key.slice(0, 8) + '…' + key.slice(-4) : '',
    mock: mock.enabled(),
  };
}

function settingsSet(patch) {
  const s = loadSettingsRaw();
  for (const k of Object.keys(patch)) {
    if (k === 'apiKey' && !patch.apiKey) continue; // empty = keep existing
    s[k] = patch[k];
  }
  if (patch.clearKey) { s.apiKey = ''; delete s.clearKey; }
  saveSettingsRaw(s);
  return settingsGet();
}

// ---------- usage log ----------
function usageFile() { return path.join(dataDir, 'usage.json'); }
function usageGet() { return readJSON(usageFile(), []); }
function usageAdd(rec) {
  const all = usageGet();
  all.push(rec);
  writeJSONAtomic(usageFile(), all);
}

// ---------- LLM ----------
// req: { role: 'customer' | 'smart' | 'boss', category: string, messages, maxTokens, temperature, chatId }
async function llm(req) {
  const settings = loadSettingsRaw();
  const model = req.role === 'customer' ? settings.customerModel : req.role === 'boss' ? settings.bossModel || settings.smartModel : settings.smartModel;
  const started = Date.now();

  if (mock.enabled()) {
    const text = await mock.respond(req);
    const usage = { prompt_tokens: 300, completion_tokens: 80, cost: 0 };
    usageAdd({ t: Date.now(), category: req.category, model: 'mock', in: usage.prompt_tokens, out: usage.completion_tokens, cost: 0, chatId: req.chatId || null });
    return { text, model: 'mock', ms: Date.now() - started };
  }

  if (!settings.apiKey) throw new Error('No OpenRouter API key set. Open Settings (☰ → Settings) and paste your key.');

  const body = {
    model,
    messages: req.messages,
    max_tokens: req.maxTokens || 600,
    temperature: req.temperature ?? 0.7,
    usage: { include: true },
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + settings.apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/masterbachthegreat/balancedesk2',
        'X-Title': 'BalanceDesk',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error('Network error talking to OpenRouter: ' + (e.name === 'AbortError' ? 'request timed out' : e.message));
  } finally {
    clearTimeout(timer);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.error) {
    const msg = (json && json.error && (json.error.message || JSON.stringify(json.error))) || ('HTTP ' + res.status);
    throw new Error('OpenRouter error: ' + msg);
  }
  const text = json.choices?.[0]?.message?.content ?? '';
  const u = json.usage || {};
  usageAdd({
    t: Date.now(),
    category: req.category,
    model: json.model || model,
    in: u.prompt_tokens || 0,
    out: u.completion_tokens || 0,
    cost: typeof u.cost === 'number' ? u.cost : 0,
    chatId: req.chatId || null,
  });
  return { text, model: json.model || model, ms: Date.now() - started };
}

async function testConnection() {
  const r = await llm({
    role: 'customer',
    category: 'other',
    messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
    maxTokens: 10,
    temperature: 0,
  });
  return { ok: true, reply: r.text.trim(), model: r.model };
}

module.exports = {
  init, readGameData, store, settingsGet, settingsSet, usageGet, llm, testConnection,
  get dataDir() { return dataDir; },
};
