// Right column: the open chat (header, messages, composer, info panel).
import { S, cfg } from '../core/state.js';
import { escapeHtml, clockTime, dayLabel, waitWords, lastSeenText, durationWords, money, starsText, stars, num } from '../core/format.js';
import { chatAvatar } from './avatar.js';
import { renderMarkdown, splitCharts } from './markdown.js';
import { renderChart, destroyChartsIn } from './charts.js';
import { displayName, handle, customerChats, markRead, getChat } from '../game/chats.js';
import * as clock from '../game/clock.js';
import * as shop from '../game/shop.js';
import { onPlayerMessage, retryCustomer, isOnline, lastSeen } from '../game/customers.js';
import * as boss from '../game/boss.js';
import { gradeAndPay } from '../game/results.js';
import { handleBotInput, handleChatCommand, COMMANDS, CHAT_COMMANDS } from '../game/bot.js';
import { sendToMentor, retryMentor } from '../game/mentor.js';
import { reasonText } from '../game/transcript.js';
import { ui } from './registry.js';

const drafts = new Map();
let view = { chatId: null, els: new Map(), typingEl: null };
let suggest = { items: [], index: 0, kind: null };

const pane = () => document.getElementById('chatPane');

// ---------- header ----------
function subtitle(chat) {
  if (chat.kind === 'bot') return { text: 'bot · type /help', cls: '' };
  if (chat.kind === 'manager') return { text: 'channel · official announcements', cls: '' };
  if (chat.kind === 'mentor') return chat.typing ? { text: 'typing…', cls: 'online' } : { text: 'your mentor · online', cls: 'online' };
  if (chat.kind === 'boss') return boss.presenceText();
  if (chat.status === 'active') {
    if (chat.cs.typing) return { text: 'typing…', cls: 'online' };
    const vip = chat.customer.vip ? ' · VIP client' : '';
    if (isOnline(chat)) return { text: 'online' + vip, cls: 'online' };
    return { text: lastSeenText(lastSeen(chat), clock.now()) + vip, cls: '' };
  }
  if (chat.status === 'grading') return { text: 'conversation ended · grading…', cls: '' };
  const r = chat.result;
  return { text: r ? `conversation ended · ${starsText(r.stars)} · score ${r.aiScore}/100 · ${money(r.payout.total)}` : 'conversation ended', cls: '' };
}

function timersHtml(chat) {
  if (chat.kind !== 'customer' || chat.status !== 'active') return '';
  const cs = chat.cs;
  let h = `<span class="timer-pill" title="Since the customer first wrote">⏱ open ${waitWords(clock.now() - chat.createdAt)}</span>`;
  if (cs.waitingSince != null) {
    const w = clock.now() - cs.waitingSince;
    const ideal = chat.rush ? cfg().rush.idealReplyMs : cfg().world.idealReplyMs;
    const cls = cs.nudged ? 'danger' : w > ideal ? 'warn' : '';
    h += `<span class="timer-pill ${cls}" title="The customer is waiting for your reply (ideal: within ${waitWords(ideal)})">⌛ waiting ${waitWords(w)}</span>`;
  } else if (cs.typing) {
    h += '<span class="timer-pill">✍ customer is typing</span>';
  } else if (cs.readAt != null) {
    h += `<span class="timer-pill" title="They'll read it next time they check their phone">${isOnline(chat) ? '👀 reading' : '📱 not read yet'}</span>`;
  }
  if (chat.rush) h += '<span class="timer-pill" title="Rush shift customer: expects replies within minutes">⚡ rush</span>';
  return h;
}

function headerHtml(chat) {
  const sub = subtitle(chat);
  const vip = chat.kind === 'customer' && chat.customer.vip ? ' 👑' : '';
  return `<div class="chat-header">
    ${chatAvatar(chat, 'sm')}
    <div class="ch-info" id="chInfo"><div class="ch-name">${escapeHtml(displayName(chat))}${vip}${chat.kind === 'customer' ? ` <span style="color:var(--muted);font-weight:400;font-size:12px">${handle(chat)}</span>` : ''}</div>
    <div class="ch-sub ${sub.cls}" id="chSub">${escapeHtml(sub.text)}</div></div>
    <div class="ch-timers" id="chTimers">${timersHtml(chat)}</div>
    ${chat.kind === 'customer' ? '<button class="icon-btn" id="chConceptBtn" title="Concept: learn the idea behind this question">📖</button>' : ''}
    <button class="icon-btn" id="chInfoBtn" title="Info">ⓘ</button>
    <button class="icon-btn" id="chMenuBtn" title="More">⋮</button>
  </div>`;
}

// ---------- messages ----------
function isOnlyEmoji(t) {
  const s = String(t || '').trim();
  if (!s || s.length > 16) return false;
  return /^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(s) && /\p{Extended_Pictographic}/u.test(s);
}

function payoutCard(chat) {
  const r = chat.result;
  if (!r) return '<div class="service">Paid</div>';
  if (r.missed) return `<div class="payout-card"><div class="pc-title">No reply · ${escapeHtml(reasonText(chat.endReason))}</div><div style="font-size:13px">No pay and no rating. It doesn't count towards promotion.</div><div style="margin-top:8px"><button class="btn small" data-review="${chat.id}">🎓 Review with mentor</button></div></div>`;
  return `<div class="payout-card">
    <div class="pc-title">Conversation result · ${escapeHtml(reasonText(chat.endReason))}</div>
    <div class="pc-stars" title="${r.stars} stars">${stars(r.stars)}</div>
    <div class="pc-row">
      <div><div class="pc-big">${r.aiScore}<span style="font-size:13px;color:var(--muted)">/100</span></div><div class="pc-label">AI answer score</div></div>
      <div><div class="pc-big">${durationWords(r.durationMs)}</div><div class="pc-label">chat time</div></div>
      <div><div class="pc-big pc-pay">${money(r.payout.total)}</div><div class="pc-label">paid</div></div>
    </div>
    ${r.grade?.summary ? `<div style="font-size:13px;margin-top:6px">${escapeHtml(r.grade.summary)}</div>` : ''}
    <div style="margin-top:8px"><button class="btn small" data-review="${chat.id}">🎓 Review with mentor</button></div>
    <div class="pc-hint">Type <span class="cmd" data-cmd="/payout">/payout</span> for the pay breakdown · <span class="cmd" data-cmd="/feedback">/feedback</span> for grader notes</div>
  </div>`;
}

function breakdownCard(chat) {
  const r = chat.result;
  const rows = r.payout.lines.map((l) => {
    const v = l.value !== undefined ? money(l.value) : l.mult !== undefined ? '×' + num(l.mult, 2) : '+' + money(l.add);
    return `<tr><td>${escapeHtml(l.label)}<div class="why">${escapeHtml(l.why || '')}</div></td><td>${v}</td></tr>`;
  }).join('');
  return `<div class="payout-card" style="text-align:left">
    <div class="pc-title" style="text-align:center">Pay breakdown · ${handle(chat)}</div>
    <table class="breakdown">${rows}<tr class="total"><td>Total paid</td><td>${money(r.payout.total)}</td></tr></table>
    <div class="pc-hint" style="text-align:center">Pay = Base × VIP × Quality × Service × Length × Time × Bonuses + Tip</div>
  </div>`;
}

function feedbackCard(chat) {
  const g = chat.result.grade || {};
  const list = (arr) => (arr && arr.length ? '<ul style="margin:4px 0;padding-left:18px">' + arr.map((x) => `<li>${escapeHtml(x)}</li>`).join('') + '</ul>' : '<div style="color:var(--muted)">—</div>');
  return `<div class="payout-card" style="text-align:left">
    <div class="pc-title" style="text-align:center">Grader feedback · ${chat.result.aiScore}/100 · ${starsText(chat.result.graderStars ?? chat.result.stars)} from grader</div>
    <div style="margin:6px 0">${escapeHtml(g.summary || '')}</div>
    <b>Strengths</b>${list(g.strengths)}
    <b>Issues</b>${list(g.issues)}
    ${g.correctAnswer ? `<b>Correct answer</b><div style="margin-top:3px">${escapeHtml(g.correctAnswer)}</div>` : ''}
  </div>`;
}

function messageEl(chat, m) {
  const el = document.createElement('div');
  if (m.from === 'sys') {
    if (m.kind === 'payout') el.innerHTML = payoutCard(chat);
    else if (m.kind === 'breakdown' && chat.result) el.innerHTML = breakdownCard(chat);
    else if (m.kind === 'feedback' && chat.result) el.innerHTML = feedbackCard(chat);
    else {
      el.innerHTML = `<div class="service ${m.kind === 'error' ? 'error' : ''}">${escapeHtml(m.text)}${m.retry ? ` <button data-retry="${m.retry}">Retry</button>` : ''}</div>`;
    }
    el.style.display = 'contents';
    return el;
  }
  const out = m.from === 'me';
  el.className = 'msg ' + (out ? 'out' : 'in') + (isOnlyEmoji(m.text) ? ' big-emoji' : '');
  el.dataset.from = m.from;
  const col = document.createElement('div');
  col.style.cssText = 'display:flex;flex-direction:column;min-width:0;max-width:100%';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const full = !out && chat.kind !== 'customer';
  const text = document.createElement('div');
  text.className = 'text';
  if (chat.kind === 'mentor' && !out) {
    for (const part of splitCharts(m.text)) {
      if (part.type === 'text') {
        const d = document.createElement('div');
        d.innerHTML = renderMarkdown(part.text.trim(), { full: true, mentions: true });
        text.appendChild(d);
      } else renderChart(text, part.json);
    }
  } else {
    text.innerHTML = renderMarkdown(m.text, { full, commands: chat.kind === 'bot', mentions: chat.kind === 'mentor' || chat.kind === 'boss' });
  }
  if (m.charts) for (const spec of m.charts) renderChart(text, spec);
  bubble.appendChild(text);
  const meta = document.createElement('span');
  meta.className = 'meta';
  meta.innerHTML = `${m.kind === 'nudge' ? '⌛ ' : ''}${clockTime(m.t)}${out ? ` <span class="ticks ${m.read && !m.after ? 'read' : ''}">${m.read && !m.after ? '✓✓' : '✓'}</span>` : ''}`;
  text.appendChild(meta);
  col.appendChild(bubble);
  if (m.buttons && m.buttons.length) {
    const ib = document.createElement('div');
    ib.className = 'inline-buttons';
    m.buttons.forEach((row, ri) => {
      const r = document.createElement('div');
      r.className = 'row';
      row.forEach((b, bi) => {
        const btn = document.createElement('button');
        btn.textContent = b.label;
        btn.dataset.btn = ri + ':' + bi;
        btn.dataset.msg = m.id;
        r.appendChild(btn);
      });
      ib.appendChild(r);
    });
    col.appendChild(ib);
  }
  el.appendChild(col);
  return el;
}

function typingEl() {
  const el = document.createElement('div');
  el.className = 'msg in typing-bubble first last';
  el.innerHTML = '<div class="bubble"><span></span><span></span><span></span></div>';
  return el;
}

function regroup(inner) {
  const msgs = [...inner.querySelectorAll(':scope > .msg')];
  msgs.forEach((el, i) => {
    const prev = el.previousElementSibling;
    const next = el.nextElementSibling;
    const same = (o) => o && o.classList.contains('msg') && o.dataset.from === el.dataset.from;
    el.classList.toggle('first', !same(prev));
    el.classList.toggle('last', !same(next));
    void i;
  });
}

function syncMessages(chat, forceBottom = false) {
  const box = document.getElementById('messages');
  const inner = document.getElementById('messagesInner');
  if (!box || !inner) return;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  const ids = new Set(chat.messages.map((m) => m.id));
  // remove deleted
  for (const [id, el] of view.els) {
    if (!ids.has(id)) { destroyChartsIn(el); el.remove(); view.els.delete(id); }
  }
  if (view.typingEl) { view.typingEl.remove(); view.typingEl = null; }
  // a message timestamped earlier than ones already shown (caught-up replies): rebuild in order
  let seenNew = false;
  for (const m of chat.messages) {
    if (!view.els.has(m.id)) seenNew = true;
    else if (seenNew) {
      for (const el of view.els.values()) destroyChartsIn(el);
      inner.innerHTML = '';
      view.els.clear();
      view.lastDay = null;
      break;
    }
  }
  // append new messages and update ticks
  for (const m of chat.messages) {
    let el = view.els.get(m.id);
    if (!el) {
      const day = dayLabel(m.t);
      if (day !== view.lastDay) {
        const sep = document.createElement('div');
        sep.className = 'service day-sep';
        sep.textContent = day;
        inner.appendChild(sep);
        view.lastDay = day;
      }
      el = messageEl(chat, m);
      inner.appendChild(el);
      view.els.set(m.id, el);
    } else if (m.from === 'me') {
      const t = el.querySelector('.ticks');
      if (t) {
        const read = m.read && !m.after;
        t.classList.toggle('read', read);
        t.textContent = read ? '✓✓' : '✓';
      }
    }
  }
  const typing = chat.kind === 'customer' ? chat.status === 'active' && chat.cs.typing : chat.typing;
  if (typing) { view.typingEl = typingEl(); inner.appendChild(view.typingEl); }
  regroup(inner);
  if (forceBottom || nearBottom) box.scrollTop = box.scrollHeight;
}

// ---------- composer ----------
function composerHtml(chat) {
  if (chat.kind === 'manager') return '<div class="readonly-bar">📢 Announcements channel — read only</div>';
  let note = '';
  if (chat.kind === 'customer' && chat.status !== 'active') note = '<div class="composer-note">This conversation has ended — the customer won\'t see new messages. Try /payout or /feedback.</div>';
  if (chat.kind === 'mentor') note = '<div class="composer-note">Mention a chat with @ (e.g. @chat3) and the mentor reads the whole conversation.</div>';
  if (chat.kind === 'boss') note = `<div class="composer-note">Diane is at her desk ${boss.shiftText()} and answers fastest then. Ask for a rush, a lighter or heavier day, time off, a transfer (@chat3) or a raise, or just chat.</div>`;
  const placeholder = chat.kind === 'bot' ? 'Type a command, e.g. /help' : chat.kind === 'mentor' ? 'Ask your mentor…' : chat.kind === 'boss' ? 'Message Diane…' : chat.status === 'active' ? 'Write a message…' : 'Message (the customer has left)';
  const emojiBtn = chat.kind === 'bot' ? '' : '<button class="icon-btn" id="emojiBtn" title="Emoji">😊</button>';
  return `<div class="composer">${note}<div class="composer-inner">${emojiBtn}
    <textarea id="input" rows="1" placeholder="${placeholder}" spellcheck="true"></textarea>
    <button class="icon-btn send" id="sendBtn" title="Send (Enter)">➤</button></div>
    <div id="suggest" class="suggest hidden"></div><div id="emojiPicker" class="emoji-picker hidden"></div></div>`;
}

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(180, ta.scrollHeight) + 'px';
}

function send() {
  const chat = getChat(view.chatId);
  const ta = document.getElementById('input');
  if (!chat || !ta) return;
  const text = ta.value.trim();
  if (!text) return;
  ta.value = '';
  drafts.delete(chat.id);
  autosize(ta);
  hideSuggest();
  hideEmoji();
  if (chat.kind === 'bot') handleBotInput(text);
  else if (chat.kind === 'mentor') sendToMentor(text);
  else if (chat.kind === 'boss') boss.onPlayerMessage(text);
  else if (chat.kind === 'customer') {
    if (text.startsWith('/') && handleChatCommand(chat, text)) return;
    onPlayerMessage(chat, text);
  }
  syncMessages(chat, true);
}

// ---------- suggestions (/commands and @mentions) ----------
function hideSuggest() {
  suggest = { items: [], index: 0, kind: null };
  document.getElementById('suggest')?.classList.add('hidden');
}

function updateSuggest() {
  const chat = getChat(view.chatId);
  const ta = document.getElementById('input');
  const box = document.getElementById('suggest');
  if (!chat || !ta || !box) return;
  const before = ta.value.slice(0, ta.selectionStart);
  let items = [];
  let kind = null;
  const cm = /^\/(\w*)$/.exec(before);
  const mm = /(^|\s)@(\w*)$/.exec(before);
  if (cm && (chat.kind === 'bot' || chat.kind === 'customer')) {
    kind = 'cmd';
    const list = chat.kind === 'bot' ? COMMANDS : CHAT_COMMANDS;
    items = list.filter((c) => c.cmd.startsWith(cm[1].toLowerCase())).map((c) => ({ key: '/' + c.cmd + (c.args ? ' ' : ''), label: '/' + c.cmd, desc: (c.args ? c.args + ' — ' : '') + c.desc }));
  } else if (mm && (chat.kind === 'mentor' || chat.kind === 'boss')) {
    kind = 'mention';
    const q = mm[2].toLowerCase();
    items = customerChats().sort((a, b) => b.lastAt - a.lastAt)
      .filter((c) => !q || ('chat' + c.seq).startsWith(q) || c.customer.name.toLowerCase().includes(q))
      .slice(0, 12)
      .map((c) => ({ key: handle(c) + ' ', label: handle(c), desc: `${c.customer.name}${c.customer.vip ? ' 👑' : ''} · ${c.question.topic} · ${c.status === 'active' ? 'active' : c.result ? starsText(c.result.stars) + ' ' + c.result.aiScore + '/100' : 'ended'}` }));
  }
  if (!items.length) return hideSuggest();
  suggest = { items, index: Math.min(suggest.index, items.length - 1), kind };
  box.innerHTML = items.map((it, i) => `<div class="item ${i === suggest.index ? 'active' : ''}" data-i="${i}"><span class="k">${escapeHtml(it.label)}</span><span class="d">${escapeHtml(it.desc)}</span></div>`).join('');
  box.classList.remove('hidden');
}

function applySuggest(i) {
  const it = suggest.items[i];
  const ta = document.getElementById('input');
  if (!it || !ta) return;
  const pos = ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const after = ta.value.slice(pos);
  const re = suggest.kind === 'cmd' ? /\/\w*$/ : /@\w*$/;
  const nb = before.replace(re, it.key);
  ta.value = nb + after;
  ta.selectionStart = ta.selectionEnd = nb.length;
  ta.focus();
  hideSuggest();
}

// ---------- emoji picker ----------
let emojiTab = null;
function hideEmoji() { document.getElementById('emojiPicker')?.classList.add('hidden'); }

function renderEmoji() {
  const box = document.getElementById('emojiPicker');
  if (!box) return;
  const packs = shop.emojiPacks();
  if (!emojiTab || !packs.find((p) => p.id === emojiTab)) emojiTab = packs[0]?.id;
  const pack = packs.find((p) => p.id === emojiTab);
  const owned = shop.owns(pack.id);
  const grid = '<div class="ep-grid">' + pack.emojis.map((e) => `<button data-emoji="${e}">${e}</button>`).join('') + '</div>';
  box.innerHTML = `<div class="ep-tabs">${packs.map((p) => `<button class="${p.id === emojiTab ? 'active' : ''}" data-tab="${p.id}" title="${escapeHtml(p.name)}" style="${shop.owns(p.id) ? '' : 'opacity:.45'}">${p.emojis[0]}</button>`).join('')}</div>
    <div class="ep-body"><div class="ep-title"><span>${escapeHtml(pack.name)}</span><span>${pack.starBonus ? '+' + pack.starBonus + '★ when used' : 'basic'}</span></div>
    ${owned ? grid : `<div class="ep-locked">${grid}🔒 ${escapeHtml(pack.desc)}<br><br><button class="btn primary small" data-buy="${pack.id}">Buy for ${money(pack.price)}</button></div>`}</div>`;
}

function insertAtCursor(ta, s) {
  const a = ta.selectionStart, b = ta.selectionEnd;
  ta.value = ta.value.slice(0, a) + s + ta.value.slice(b);
  ta.selectionStart = ta.selectionEnd = a + s.length;
  ta.focus();
  autosize(ta);
}

// ---------- info panel ----------
function infoHtml(chat) {
  if (chat.kind !== 'customer') {
    const about = {
      bot: 'Your desk assistant. Type /help for commands: balance, stats, rank, shop, spendings and more.',
      mentor: 'A senior analyst who coaches you. Ask about any concept, get graphs, or mention a chat (@chat3) so the mentor can read it.',
      manager: 'Official memos from Whiterock management. Some memos come with pay bonuses.',
      boss: `Diane Whitfield, Head of Client Services: your manager (the whole team works remotely). She's at her desk ${boss.shiftText()} (your time) and replies within minutes then; evenings and weekends she answers when she checks her phone. Ask her for a rush shift (the next few customers right away), a lighter or heavier day, time off, to hand a chat to a colleague, or a raise when your numbers are good. Or just talk to her.`,
    }[chat.kind];
    return `<div class="ip-top">${chatAvatar(chat, 'lg')}<h3>${escapeHtml(chat.title)}</h3></div><div class="ip-val">${about}</div>`;
  }
  const c = chat.customer;
  const q = chat.question;
  let h = `<div class="ip-top">${chatAvatar(chat, 'lg')}<h3>${escapeHtml(c.name)}${c.vip ? ' 👑' : ''}</h3><div style="color:var(--muted)">${handle(chat)}${c.vip ? ' · VIP client' : ''}</div></div>
    <div class="ip-sec">About</div><div class="ip-val">${escapeHtml(c.bio)}</div>
    <div class="ip-sec">Traits</div><div class="ip-val">Reads ${c.read} · patience ${c.patience}</div>
    <div class="ip-sec">Local time</div><div class="ip-val">${localTimeOf(chat)}</div>
    <div class="ip-sec">Started</div><div class="ip-val">${new Date(chat.createdAt).toLocaleString('en-GB')}</div>`;
  if (chat.status === 'active') {
    h += `<div class="ip-sec">Customer replies</div><div class="ip-val">${chat.cs.turns} so far (gives up after about ${chat.cs.maxTurns})</div>`;
  } else {
    h += `<div class="ip-sec">Topic</div><div class="ip-val">${escapeHtml(q.topic)} · chapter ${q.chapter}</div>`;
    h += `<div class="ip-sec">Outcome</div><div class="ip-val">${escapeHtml(reasonText(chat.endReason))}</div>`;
    if (chat.result) h += `<div class="ip-sec">Result</div><div class="ip-val">${starsText(chat.result.stars)} · ${chat.result.aiScore}/100 · ${money(chat.result.payout.total)}</div>`;
  }
  h += `<div style="margin-top:18px"><button class="btn small" id="askMentor">🎓 Ask the mentor about this chat</button></div>`;
  return h;
}

function localTimeOf(chat) {
  const p = S.data.personalities.find((x) => x.id === chat.customer.personaId);
  const tz = p?.tz ?? 0;
  const d = new Date(clock.now() + tz * 3600000);
  const hh = String(d.getUTCHours()).padStart(2, '0'), mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} (UTC${tz >= 0 ? '+' : ''}${tz})`;
}

// ---------- public ----------
export function renderChatPane() {
  const p = pane();
  const prev = view.chatId && getChat(view.chatId);
  const ta = document.getElementById('input');
  if (prev && ta) drafts.set(prev.id, ta.value);
  destroyChartsIn(p);
  view = { chatId: S.activeChatId, els: new Map(), typingEl: null, lastDay: null };
  const chat = S.activeChatId && getChat(S.activeChatId);
  // wallpaper
  p.className = 'chat-pane';
  const wp = shop.equippedValue('wallpaper');
  if (wp) p.classList.add(wp);
  document.getElementById('infoPanel')?.remove();
  if (!chat) {
    p.classList.add('empty');
    p.innerHTML = '<div class="empty-hint">Select a chat to start messaging</div>';
    return;
  }
  p.innerHTML = headerHtml(chat) + '<div class="messages" id="messages"><div class="messages-inner" id="messagesInner"></div></div>' + composerHtml(chat);
  syncMessages(chat, true);
  if (S.infoOpen) openInfo(chat);
  const input = document.getElementById('input');
  if (input) {
    input.value = drafts.get(chat.id) || '';
    autosize(input);
    input.focus();
  }
  markRead(chat);
}

function openInfo(chat) {
  document.getElementById('infoPanel')?.remove();
  const panel = document.createElement('aside');
  panel.className = 'info-panel';
  panel.id = 'infoPanel';
  panel.innerHTML = infoHtml(chat);
  document.getElementById('main').appendChild(panel);
}

export function updateChatPane(chatId) {
  if (!chatId || chatId !== view.chatId) return;
  const chat = getChat(chatId);
  if (!chat) return renderChatPane();
  const header = document.querySelector('#chatPane .chat-header');
  if (header) header.outerHTML = headerHtml(chat);
  // composer state can change when a chat ends
  const ended = chat.kind === 'customer' && chat.status !== 'active';
  if (chat.kind === 'customer' && !!document.querySelector('.composer-note') !== ended) {
    const ta = document.getElementById('input');
    const val = ta ? ta.value : '';
    document.querySelector('.composer').outerHTML = composerHtml(chat);
    const nta = document.getElementById('input');
    if (nta) { nta.value = val; autosize(nta); }
  }
  syncMessages(chat);
  if (S.infoOpen && document.getElementById('infoPanel')) openInfo(chat);
  if (S.focused && !S.showModal) markRead(chat);
}

export function tickChatPane() {
  const chat = view.chatId && getChat(view.chatId);
  if (!chat) return;
  const t = document.getElementById('chTimers');
  if (t) t.innerHTML = timersHtml(chat);
}

export function currentChatId() { return view.chatId; }

export function bindChatPane() {
  const p = pane();
  p.addEventListener('keydown', (e) => {
    if (e.target.id !== 'input') return;
    const box = document.getElementById('suggest');
    const open = box && !box.classList.contains('hidden') && suggest.items.length;
    if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      suggest.index = (suggest.index + (e.key === 'ArrowDown' ? 1 : -1) + suggest.items.length) % suggest.items.length;
      updateSuggest();
      return;
    }
    if (open && (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey))) {
      e.preventDefault();
      const it = suggest.items[suggest.index];
      const kind = suggest.kind;
      applySuggest(suggest.index);
      if (kind === 'cmd' && e.key === 'Enter' && it && !it.key.endsWith(' ')) send();
      return;
    }
    if (e.key === 'Escape') { hideSuggest(); hideEmoji(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  p.addEventListener('input', (e) => {
    if (e.target.id !== 'input') return;
    autosize(e.target);
    updateSuggest();
  });
  p.addEventListener('click', (e) => {
    const chat = getChat(view.chatId);
    if (!chat) return;
    const t = e.target;
    if (t.closest('#sendBtn')) return send();
    if (t.closest('#emojiBtn')) {
      const box = document.getElementById('emojiPicker');
      box.classList.toggle('hidden');
      if (!box.classList.contains('hidden')) renderEmoji();
      return;
    }
    const tab = t.closest('[data-tab]');
    if (tab) { emojiTab = tab.dataset.tab; renderEmoji(); return; }
    const em = t.closest('[data-emoji]');
    if (em) { insertAtCursor(document.getElementById('input'), em.dataset.emoji); return; }
    const buy = t.closest('[data-buy]');
    if (buy) {
      const r = shop.buy(buy.dataset.buy);
      if (!r.ok) ui.toast?.('Can\'t buy', r.why, 'bad');
      renderEmoji();
      return;
    }
    const sg = t.closest('#suggest .item');
    if (sg) {
      const it = suggest.items[+sg.dataset.i];
      const kind = suggest.kind;
      applySuggest(+sg.dataset.i);
      if (kind === 'cmd' && it && !it.key.endsWith(' ')) send();
      return;
    }
    const cmd = t.closest('.cmd');
    if (cmd) {
      const c = cmd.dataset.cmd;
      if (chat.kind === 'bot') handleBotInput(c);
      else if (chat.kind === 'customer') handleChatCommand(chat, c);
      return;
    }
    const btn = t.closest('[data-btn]');
    if (btn) {
      const m = chat.messages.find((x) => x.id === btn.dataset.msg);
      const [ri, bi] = btn.dataset.btn.split(':').map(Number);
      const b = m?.buttons?.[ri]?.[bi];
      if (!b) return;
      if (b.action === 'cmd') handleBotInput(b.value);
      else if (b.action === 'ui') ({ shop: ui.openShop, settings: ui.openSettings, profile: ui.openProfile })[b.value]?.();
      else if (b.action === 'open') ui.openChat(b.value);
      return;
    }
    const retry = t.closest('[data-retry]');
    if (retry) {
      const kind = retry.dataset.retry;
      if (kind === 'customer') retryCustomer(chat);
      else if (kind === 'grade') gradeAndPay(chat);
      else if (kind === 'mentor') retryMentor();
      else if (kind === 'boss') boss.retryBoss();
      return;
    }
    if (t.closest('#chConceptBtn')) { ui.openConcept?.(chat.id); return; }
    const rv = t.closest('[data-review]');
    if (rv) { ui.reviewWithMentor?.(rv.dataset.review); return; }
    if (t.closest('#chInfo') || t.closest('#chInfoBtn')) {
      S.infoOpen = !document.getElementById('infoPanel');
      if (S.infoOpen) openInfo(chat); else document.getElementById('infoPanel')?.remove();
      return;
    }
    if (t.closest('#chMenuBtn')) {
      const r = t.closest('#chMenuBtn').getBoundingClientRect();
      ui.chatContextMenu(chat.id, r.right - 210, r.bottom + 4);
      return;
    }
    if (!t.closest('#emojiPicker')) hideEmoji();
  });
  document.getElementById('main').addEventListener('click', (e) => {
    if (e.target.closest('#askMentor')) {
      const chat = getChat(view.chatId);
      if (chat) ui.askMentorAbout(chat.id);
    }
  });
}

export function prefillInput(text) {
  const ta = document.getElementById('input');
  if (!ta) return;
  ta.value = text;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = text.length;
  autosize(ta);
}

