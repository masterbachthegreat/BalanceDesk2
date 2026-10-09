// Modal windows: onboarding, settings, profile, shop and confirmations.
import { S, touchProfile } from '../core/state.js';
import { escapeHtml, money, num, durationWords, starsText } from '../core/format.js';
import { playerAvatar, playerNameHtml, playerTitle } from './avatar.js';
import * as shop from '../game/shop.js';
import { SHOP_CATEGORIES } from '../game/bot.js';
import { rankInfo, promotionStatus, maxRank } from '../game/progress.js';
import { toast } from './toast.js';
import { emit } from '../core/bus.js';
import { renderMarkdown, splitCharts } from './markdown.js';
import { renderChart, destroyChartsIn } from './charts.js';
import { getConcept } from '../game/concept.js';

const root = () => document.getElementById('modalRoot');

export function openModal({ title, body, foot = '', wide = false, onClose, extraHead = '' }) {
  closeModal();
  S.showModal = true;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal${wide ? ' wide' : ''}"><div class="modal-head"><h2>${title}</h2>${extraHead}<button class="icon-btn" data-close>✕</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) closeModal(); });
  wrap.querySelector('[data-close]').onclick = () => closeModal();
  wrap._onClose = onClose;
  root().appendChild(wrap);
  return wrap;
}

export function closeModal() {
  const r = root();
  for (const w of [...r.children]) { w._onClose?.(); w.remove(); }
  if (S.showModal) { S.showModal = false; emit('modalClosed'); }
}

export function confirmModal(title, html, okLabel = 'OK', danger = false) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; resolve(v); };
    const m = openModal({
      title: escapeHtml(title),
      body: `<div style="line-height:1.5">${html}</div>`,
      foot: `<button class="btn" data-no>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${escapeHtml(okLabel)}</button>`,
      onClose: () => finish(false),
    });
    m.querySelector('[data-no]').onclick = () => closeModal();
    m.querySelector('[data-yes]').onclick = () => { finish(true); closeModal(); };
    setTimeout(() => m.querySelector('[data-yes]').focus(), 0);
  });
}

// ---------- onboarding ----------
export function onboardingModal() {
  return new Promise((resolve) => {
    const m = openModal({
      title: 'Welcome to Whiterock',
      body: `<div class="note">You've just joined <b>Whiterock</b>'s customer-support desk. Clients message you with questions on finance, accounting, statistics, maths and economics. Answer well and fast, keep them happy, get paid, get promoted.</div>
        <div class="field"><label>What's your name?</label><input type="text" id="obName" maxlength="32" placeholder="e.g. Alex Morgan"></div>
        <div class="field"><label>OpenRouter API key (you can add it later in Settings)</label><input type="password" id="obKey" placeholder="sk-or-v1-…" autocomplete="off">
        <div class="hint">Customers are played by Claude Haiku 5.5, grading and the mentor by Claude Sonnet 5.5, all through OpenRouter. The key is stored only on this computer${window.api.isElectron ? ', encrypted' : ''}.</div></div>`,
      foot: '<button class="btn primary" id="obGo">Start my first shift</button>',
    });
    m.querySelector('[data-close]').remove();
    const name = m.querySelector('#obName');
    setTimeout(() => name.focus(), 0);
    const go = async () => {
      const n = name.value.trim() || 'Agent';
      const key = m.querySelector('#obKey').value.trim();
      if (key) S.settings = await window.api.settings.set({ apiKey: key });
      closeModal();
      resolve(n);
    };
    m.querySelector('#obGo').onclick = go;
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  });
}

// ---------- settings ----------
export function settingsModal() {
  const s = S.settings;
  const m = openModal({
    title: '⚙ Settings',
    body: `${s.mock ? '<div class="note ok">Running with the <b>mock LLM</b> (BD_MOCK_LLM=1). No API calls are made.</div>' : ''}
      <div class="field"><label>OpenRouter API key</label>
        <div class="row"><input type="password" id="stKey" placeholder="${s.keyPreview ? 'Saved: ' + escapeHtml(s.keyPreview) + ' — paste to replace' : 'sk-or-v1-…'}" autocomplete="off">
        ${s.keyPreview ? '<button class="btn small" id="stClear">Remove</button>' : ''}</div>
        <div class="hint">Get a key at <a href="#" id="stLink" style="color:var(--link)">openrouter.ai/keys</a>. Stored only on this computer.</div></div>
      <div class="field"><label>Customer model (writes customer replies)</label><input type="text" id="stCust" value="${escapeHtml(s.customerModel)}"></div>
      <div class="field"><label>Smart model (grading, mentor)</label><input type="text" id="stSmart" value="${escapeHtml(s.smartModel)}">
        <div class="hint">OpenRouter model ids, e.g. anthropic/claude-haiku-5.5 and anthropic/claude-sonnet-5.5.</div></div>
      <label class="check"><input type="checkbox" id="stSound" ${s.sound ? 'checked' : ''}> Sound when a message arrives</label>
      <label class="check"><input type="checkbox" id="stFlash" ${s.notifications ? 'checked' : ''}> Flash the taskbar when a customer writes</label>
      <div id="stResult"></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" id="stTest">Test connection</button><button class="btn small" id="stFolder">Open save folder</button></div>`,
    foot: '<button class="btn" data-cancel>Cancel</button><button class="btn primary" id="stSave">Save</button>',
  });
  const $ = (q) => m.querySelector(q);
  $('[data-cancel]').onclick = () => closeModal();
  $('#stLink').onclick = (e) => { e.preventDefault(); window.api.openExternal('https://openrouter.ai/keys'); };
  $('#stFolder').onclick = () => window.api.openDataFolder();
  if ($('#stClear')) $('#stClear').onclick = async () => { S.settings = await window.api.settings.set({ clearKey: true }); emit('settings'); closeModal(); settingsModal(); };
  const save = async () => {
    S.settings = await window.api.settings.set({
      apiKey: $('#stKey').value.trim(),
      customerModel: $('#stCust').value.trim() || s.customerModel,
      smartModel: $('#stSmart').value.trim() || s.smartModel,
      sound: $('#stSound').checked,
      notifications: $('#stFlash').checked,
    });
    emit('settings');
  };
  $('#stSave').onclick = async () => { await save(); closeModal(); toast('Settings saved', '', 'good'); };
  $('#stTest').onclick = async () => {
    await save();
    const out = $('#stResult');
    out.innerHTML = '<div class="note">Testing…</div>';
    try {
      const r = await window.api.testConnection();
      out.innerHTML = `<div class="note ok">✅ Connected. ${escapeHtml(r.model)} replied “${escapeHtml(r.reply)}”.</div>`;
    } catch (e) {
      out.innerHTML = `<div class="note err">❌ ${escapeHtml(e.message.replace(/^Error invoking remote method '\w+': (Error: )?/, ''))}</div>`;
    }
  };
}

// ---------- profile ----------
export function profileModal() {
  const p = S.profile;
  const st = p.stats;
  const r = rankInfo(p.rank);
  const ps = promotionStatus();
  const canPhoto = shop.hasUnlock('photo');
  const slotSelect = (slot, label) => {
    const owned = shop.items().filter((i) => i.slot === slot && shop.owns(i.id));
    const cur = p.equipped[slot] || '';
    const opts = (slot === 'theme' ? '' : '<option value="">None</option>') + owned.map((i) => `<option value="${i.id}" ${cur === i.id ? 'selected' : ''}>${escapeHtml(i.name)}</option>`).join('');
    return `<div class="field"><label>${label}</label><select data-slot="${slot}">${opts}</select></div>`;
  };
  const m = openModal({
    title: '👤 My Profile',
    body: `<div class="profile-top">${playerAvatar('lg')}
        <div class="pname">${playerNameHtml()}</div>
        <div class="ptitle">${escapeHtml(playerTitle() || r.title)} · rank ${p.rank}/${maxRank()}</div>
        <div style="display:flex;gap:8px">${canPhoto ? '<button class="btn small" id="pfPhoto">Change photo</button>' + (p.avatar ? '<button class="btn small" id="pfPhotoRm">Remove photo</button>' : '') : `<button class="btn small" id="pfUnlock">📷 Unlock custom photo (${money(shop.item('profile-photo')?.price || 0)})</button>`}</div>
      </div>
      <div class="field"><label>Display name</label><input type="text" id="pfName" maxlength="32" value="${escapeHtml(p.name)}"></div>
      <div class="stat-grid">
        <div class="stat"><b>${money(p.balance)}</b><span>balance</span></div>
        <div class="stat"><b>${st.completed}</b><span>chats</span></div>
        <div class="stat"><b>${st.completed ? num(st.scoreSum / st.completed, 1) : '—'}</b><span>avg score</span></div>
        <div class="stat"><b>${st.completed ? starsText(st.starsSum / st.completed) : '—'}</b><span>avg service</span></div>
        <div class="stat"><b>${st.vipServed}</b><span>VIPs served</span></div>
        <div class="stat"><b>${durationWords(p.activeMs)}</b><span>on shift</span></div>
      </div>
      <div class="field"><label>Promotion to ${ps.atMax ? '— (top rank)' : escapeHtml(rankInfo(p.rank + 1).title)}: ${ps.have}/${ps.need} chats, average ${ps.have ? num(ps.avg, 1) : '—'} (need ≥ ${ps.minAvg})</label>
        <div class="progress"><i style="width:${ps.atMax ? 100 : Math.round((ps.have / ps.need) * 100)}%"></i></div></div>
      <h4 style="margin:16px 0 8px">Appearance</h4>
      ${slotSelect('theme', 'Theme')}${slotSelect('wallpaper', 'Chat wallpaper')}${slotSelect('border', 'Profile border')}${slotSelect('nameColor', 'Name colour')}${slotSelect('title', 'Title')}`,
    foot: '<button class="btn primary" id="pfSave">Done</button>',
  });
  const $ = (q) => m.querySelector(q);
  m.querySelectorAll('select[data-slot]').forEach((sel) => {
    sel.onchange = () => {
      if (sel.value) shop.equip(sel.value); else shop.unequip(sel.dataset.slot);
      closeModal();
      profileModal();
    };
  });
  if ($('#pfPhoto')) $('#pfPhoto').onclick = async () => {
    try {
      const url = await window.api.pickImage();
      if (url) { p.avatar = await shrinkImage(url); touchProfile(); closeModal(); profileModal(); }
    } catch (e) { toast('Could not load image', e.message, 'bad'); }
  };
  if ($('#pfPhotoRm')) $('#pfPhotoRm').onclick = () => { p.avatar = null; touchProfile(); closeModal(); profileModal(); };
  if ($('#pfUnlock')) $('#pfUnlock').onclick = () => { closeModal(); shopModal('profile'); };
  $('#pfSave').onclick = () => {
    const n = $('#pfName').value.trim();
    if (n) p.name = n;
    touchProfile();
    closeModal();
  };
}

// keep saves small: square-crop and resize to 256px
function shrinkImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ---------- shop ----------
function preview(it) {
  if (it.category === 'themes') {
    return `<div class="sc-preview" data-theme="${it.value}" style="background:var(--chat-bg)"><div class="theme-swatch"><div class="a" style="background:var(--sidebar-bg)"><i style="background:var(--accent)"></i><i style="background:var(--hover)"></i><i style="background:var(--hover)"></i></div><div class="b"><i style="background:var(--bubble-in)"></i><i class="o" style="background:var(--bubble-out)"></i><i style="background:var(--bubble-in)"></i></div></div></div>`;
  }
  if (it.category === 'wallpapers') return `<div class="sc-preview chat-pane ${it.value}"></div>`;
  if (it.category === 'emoji') return `<div class="sc-preview" style="background:var(--hover);font-size:22px;letter-spacing:2px">${it.emojis.slice(0, 6).join('')}</div>`;
  if (it.category === 'borders') return `<div class="sc-preview" style="background:var(--hover)"><div class="avatar-wrap ${it.value}"><div class="avatar sm" style="background:#5288c1">${escapeHtml((S.profile.name || '?')[0].toUpperCase())}</div></div></div>`;
  if (it.category === 'namecolors') return `<div class="sc-preview" style="background:var(--hover);font-size:18px;font-weight:700"><span class="${it.value}">${escapeHtml(S.profile.name)}</span></div>`;
  if (it.category === 'titles') return `<div class="sc-preview" style="background:var(--hover);font-size:14px;font-style:italic">“${escapeHtml(it.value)}”</div>`;
  return `<div class="sc-preview" style="background:var(--hover);font-size:36px">${it.icon || '🎁'}</div>`;
}

function cardFoot(it) {
  if (it.price === 0) return `<span class="sc-owned">Free</span>${it.slot ? (S.profile.equipped[it.slot] === it.id ? '<span class="sc-owned">✅ Equipped</span>' : `<button class="btn small" data-equip="${it.id}">Equip</button>`) : ''}`;
  if (it.consumable) {
    const n = shop.count(it.id);
    return `<span class="sc-price">${money(it.price)}</span><span style="display:flex;gap:4px">${n ? `<button class="btn small" data-use="${it.id}">Use (${n})</button>` : ''}<button class="btn primary small" data-buy="${it.id}">Buy</button></span>`;
  }
  if (shop.owns(it.id)) {
    if (it.slot) return S.profile.equipped[it.slot] === it.id ? `<span class="sc-owned">✅ Equipped</span><button class="btn small" data-unequip="${it.slot}">Unequip</button>` : `<span class="sc-owned">Owned</span><button class="btn small" data-equip="${it.id}">Equip</button>`;
    return '<span class="sc-owned">✔ Owned</span>';
  }
  const c = shop.canBuy(it);
  return `<span class="sc-price">${money(it.price)}</span><button class="btn primary small" data-buy="${it.id}" ${c.ok ? '' : `title="${escapeHtml(c.why)}"`} ${c.ok ? '' : 'disabled'}>Buy</button>`;
}

export function shopModal(cat) {
  let current = cat || 'themes';
  const m = openModal({ title: '🛍 Company Store', body: '<div id="shopBody"></div>', wide: true, extraHead: `<span class="shop-balance" id="shopBal"></span>` });
  const render = () => {
    m.querySelector('#shopBal').textContent = money(S.profile.balance);
    const list = shop.items().filter((i) => i.category === current);
    m.querySelector('#shopBody').innerHTML = `<div class="shop-tabs">${SHOP_CATEGORIES.map(([k, l]) => `<button data-cat="${k}" class="${k === current ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div class="shop-grid">${list.map((it) => `<div class="shop-card">${preview(it)}<div class="sc-name">${escapeHtml(it.name)}</div><div class="sc-desc">${escapeHtml(it.desc)}${it.starBonus ? ` <b>+${it.starBonus}★</b>` : ''}${it.minRank ? ` · rank ${it.minRank}+` : ''}</div><div class="sc-foot">${cardFoot(it)}</div></div>`).join('')}</div>`;
  };
  m.addEventListener('click', (e) => {
    const t = e.target;
    const c = t.closest('[data-cat]');
    if (c) { current = c.dataset.cat; return render(); }
    const b = t.closest('[data-buy]');
    if (b) {
      const r = shop.buy(b.dataset.buy);
      toast(r.ok ? 'Purchased' : 'Can\'t buy', r.ok ? r.msg : r.why, r.ok ? 'good' : 'bad');
      return render();
    }
    const eq = t.closest('[data-equip]');
    if (eq) { shop.equip(eq.dataset.equip); return render(); }
    const uq = t.closest('[data-unequip]');
    if (uq) { shop.unequip(uq.dataset.unequip); return render(); }
    const u = t.closest('[data-use]');
    if (u) {
      const r = shop.useItem(u.dataset.use);
      toast(r.ok ? 'Used' : 'Can\'t use', r.ok ? r.msg : r.why, r.ok ? 'good' : 'bad');
      return render();
    }
  });
  render();
}

// ---------- concept explainer ----------
export function conceptModal(chat) {
  const m = openModal({
    title: '📖 Concept · ' + escapeHtml(chat.question.topic),
    body: '<div id="conceptBody" class="concept-body"><div class="note">Preparing a short lesson…</div></div>',
    wide: false,
    onClose: () => destroyChartsIn(m),
  });
  const box = m.querySelector('#conceptBody');
  getConcept(chat).then((text) => {
    if (!box.isConnected) return;
    box.innerHTML = '';
    for (const part of splitCharts(text)) {
      if (part.type === 'text') {
        const d = document.createElement('div');
        d.innerHTML = renderMarkdown(part.text.trim(), { full: true });
        box.appendChild(d);
      } else renderChart(box, part.json);
    }
  }).catch((e) => {
    if (box.isConnected) box.innerHTML = `<div class="note err">❌ ${escapeHtml(e.message)}</div>`;
  });
}
