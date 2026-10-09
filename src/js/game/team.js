// #support-team: a group chat with your four coworkers (data/team.json) and Diane. The team is
// remote; everyone works their own shift (your local time).
//   - Every 12 hours a cheap model (the customer model) writes the next 12 hours of team chatter
//     from a few facts the code decides: who's on shift, a coworker warning about a difficult
//     customer, a coworker thanking you because they got a customer you warned the team about,
//     a coworker who took over a chat Diane transferred, your promotion. Messages are queued and
//     posted at their times (also while the app is closed, via catch-up).
//   - When you write in the channel, coworkers who are on shift answer (team model), and Diane
//     may chime in (her own model, with her memory of your private chat).
//   - If you warn the team about a customer, that's remembered (profile.team.flags).
// State in profile.team.
import { S, cfg, rand, pick, touchChat, touchProfile } from '../core/state.js';
import { addMessage, getChat, sysMessage, findChatByHandle, customerChats, handle, toggleReaction } from './chats.js';
import * as clock from './clock.js';
import { llmCall, parseJSON, withRetry } from './llm.js';
import * as boss from './boss.js';

const MIN = 60000;
const HOUR = 3600000;

export const members = () => S.data.team || [];
export const member = (id) => (id === 'diane' ? { id: 'diane', name: 'Diane Whitfield', role: 'Head of Client Services', color: '#c0794a', emoji: '💼' } : members().find((m) => m.id === id));
function chat() { return getChat('team'); }

// Models don't always write the id exactly ("Ken", "Ken Watanabe", "ken"): match any of them.
function memberIn(pool, who) {
  const w = String(who || '').trim().toLowerCase().replace(/^@/, '');
  if (!w) return null;
  return pool.find((m) => m.id === w || m.name.toLowerCase() === w || m.name.split(' ')[0].toLowerCase() === w || w.startsWith(m.name.split(' ')[0].toLowerCase() + ' ')) || null;
}
const textOf = (r) => String(r?.text ?? r?.message ?? r?.reply ?? r?.content ?? '').trim();

export function teamState() {
  const p = S.profile;
  p.team ||= {};
  const t = p.team;
  t.flags ||= {};
  t.warns ||= {};
  t.queue ||= [];
  return t;
}

// ---------- shifts ----------
export function onShift(m, t = clock.now()) {
  const d = new Date(t);
  const h = d.getHours() + d.getMinutes() / 60;
  return m.days.includes(d.getDay()) && h >= m.hours[0] && h < m.hours[1];
}
const onShiftDuring = (m, from, to) => { for (let x = from; x < to; x += 30 * MIN) if (onShift(m, x)) return true; return false; };

export function onlineMembers(t = clock.now()) {
  const list = members().filter((m) => onShift(m, t)).map((m) => m.name.split(' ')[0]);
  if (boss.isOnline(t)) list.push('Diane');
  return list;
}

export function presenceText(t = clock.now()) {
  const c = chat();
  if (c?.typing) return { text: `${c.typing} is typing…`, cls: 'online' };
  const on = onlineMembers(t).length;
  return { text: `${members().length + 2} members${on ? `, ${on} online` : ''}`, cls: on ? 'online' : '' };
}

export function welcome() {
  const c = chat();
  if (!c || c.welcomed || c.messages.length) return;
  c.welcomed = true;
  const t = clock.now();
  addMessage(c, { from: 'them', who: 'diane', text: `Everyone, please welcome ${S.profile.name} to the team! 🎉 Be nice, share your tips, and warn each other about the tricky customers.`, t: t - 4000 });
  addMessage(c, { from: 'them', who: 'priya', text: `Welcome ${S.profile.name.split(' ')[0]}! Shout if you get stuck on anything accounting-ish 🙂`, t: t - 2500 });
  addMessage(c, { from: 'them', who: 'marcus', text: 'welcome mate!! ⚽ you in the sweepstake or what', t: t - 1000 });
}

// ---------- difficult customers ----------
// Coworkers' warnings make that customer more likely to write to you soon.
export function personaWeight(personaId, t) {
  const w = teamState().warns[personaId];
  return w && !w.arrived && t - w.at < cfg().team.warnBoostMs ? cfg().team.warnWeight : 1;
}

export function noteArrival(chatObj) {
  const w = teamState().warns[chatObj.customer.personaId];
  if (w && !w.arrived && chatObj.createdAt - w.at < 7 * 86400000) {
    w.arrived = true;
    chatObj.warnedBy = member(w.by)?.name || null;
  }
}

function difficultPersona(now) {
  const T = teamState();
  const busy = new Set(customerChats().filter((c) => c.status === 'active').map((c) => c.customer.personaId));
  const pool = S.data.personalities.filter((p) => (p.patience === 'low' || p.vip || p.transform) && !busy.has(p.id) && !(T.warns[p.id] && now - T.warns[p.id].at < 7 * 86400000));
  return pool.length ? pick(pool) : null;
}

// Match "@chat12", a customer's full name or first name to one of your customers.
function resolveCustomer(token) {
  const c = findChatByHandle(String(token).trim().split(/\s+/)[0]) || customerChats().find((x) => x.customer.name.toLowerCase() === String(token).toLowerCase().trim());
  return c ? c.customer : null;
}

// ---------- the 12-hour simulation ----------
function poisson(mean) {
  let k = 0, p = Math.exp(-mean), s = p;
  const u = Math.random();
  while (u > s && k < 12) { k++; p *= mean / k; s += p; }
  return k;
}

export function recentLines(n = 30) {
  return chat().messages.filter((m) => m.from !== 'sys').slice(-n).map((m) => `${m.from === 'me' ? S.profile.name + ' (the agent)' : member(m.who)?.name || '?'}: ${m.text}`).join('\n');
}

function teamCard(m) {
  return `- id "${m.id}": ${m.name}, ${m.role}. ${m.bio} Writes: ${m.style}`;
}

let simulating = false;

async function simulate(start) {
  const T = teamState();
  const C = cfg().team;
  const end = start + 12 * HOUR;
  const onDuty = members().filter((m) => onShiftDuring(m, start, end));
  const facts = [];
  const effects = [];
  // a coworker got a customer you warned the team about
  for (const [pid, f] of Object.entries(T.flags)) {
    if (f.hit || start - f.at > C.flagKeepDays * 86400000 || !onDuty.length || Math.random() >= C.flagHitChance) continue;
    const who = pick(onDuty);
    facts.push(`${who.name} (id "${who.id}") gets a chat with the customer ${f.name}, whom ${S.profile.name} warned the team about earlier (${f.why || 'difficult'}). ${who.name.split(' ')[0]} thanks ${S.profile.name} for the heads-up and says how it went.`);
    effects.push(() => { f.hit = true; });
  }
  // a coworker warns about a difficult customer (who may then write to you)
  if (onDuty.length && Math.random() < C.warnChance) {
    const p = difficultPersona(start);
    if (p) {
      const who = pick(onDuty);
      facts.push(`${who.name} (id "${who.id}") had a rough chat with the customer ${p.name} (${p.bio}; writes: ${p.style}). ${who.name.split(' ')[0]} warns the team they might come back to someone else.`);
      effects.push(() => { T.warns[p.id] = { by: who.id, at: start, name: p.name }; });
    }
  }
  // chats Diane handed over to a colleague
  for (const c of customerChats().filter((x) => x.endReason === 'transferred' && x.transferredTo && x.endedAt > start - 12 * HOUR && x.endedAt <= end && !x.transferTold)) {
    const who = member(c.transferredTo);
    if (!who) continue;
    facts.push(`${who.name} (id "${who.id}") took over ${S.profile.name}'s chat with ${c.customer.name} (${c.question.topic}) when Diane transferred it. ${who.name.split(' ')[0]} mentions how it went (casually, no blame).`);
    effects.push(() => { c.transferTold = true; touchChat(c); });
  }
  const promo = (S.profile.rankHistory || []).at(-1);
  if (promo && promo.at > start - 12 * HOUR && promo.rank > 1 && !T.promoTold?.includes?.(promo.rank)) {
    facts.push(`${S.profile.name} was just promoted (rank ${promo.rank}). Someone congratulates them.`);
    effects.push(() => { T.promoTold = [...(T.promoTold || []), promo.rank]; });
  }
  const n = Math.max(facts.length, Math.min(8, poisson(C.messagesPer12h)));
  T.nextSimAt = end;
  if (!n || !onDuty.length) { for (const e of effects) e(); touchProfile(); return; }
  const startText = new Date(start).toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  const shifts = onDuty.map((m) => `${m.name}: on shift ${m.hours[0]}:00-${m.hours[1] === 24 ? '24:00' : m.hours[1] + ':00'}`).join('; ');
  const raw = await withRetry(() => llmCall({
    role: 'customer',
    category: 'team',
    system: `You write the next 12 hours of a remote customer-support team's group chat (#support-team at Whiterock, a financial-services firm). Everyone works from home; they never meet in person. The human player, ${S.profile.name}, is also in the channel but you never write as them.

TEAM:
${onDuty.map(teamCard).join('\n')}

Keep each message short and natural (work banter, a customer story, a quick question to the team, lunch, the weekend, finance-nerd jokes). Stay in each person's voice. People only post while on shift. Continue naturally from the recent chat.`,
    messages: [{ role: 'user', content: `Recent chat:\n${recentLines() || '(nothing yet)'}\n\nThe 12 hours start ${startText}. Shifts: ${shifts}.\n${facts.length ? 'MUST include these events:\n- ' + facts.join('\n- ') + '\n' : ''}\nWrite about ${n} message(s) in total.\nOUTPUT only JSON: {"messages": [{"who": "<member id>", "minute": <0-719, minutes after the start>, "text": "<message>"}]}` }],
    maxTokens: 900,
    temperature: 0.9,
  }), 2, 2000);
  const j = parseJSON(raw);
  for (const m of Array.isArray(j.messages) ? j.messages : []) {
    const mem = memberIn(onDuty, m?.who);
    if (!mem || !textOf(m)) continue;
    let at = start + Math.max(0, Math.min(719, Number(m.minute) || 0)) * MIN + rand(0, 50000);
    for (let i = 0; i < 48 && !onShift(mem, at) && at < end; i++) at += 15 * MIN; // nudge into their shift
    T.queue.push({ who: mem.id, at, text: textOf(m) });
  }
  if (Math.random() < C.dianePostChance) T.queue.push({ who: 'diane', at: start + rand(1, 11) * HOUR, diane: true });
  T.queue.sort((a, b) => a.at - b.at);
  for (const e of effects) e();
  touchProfile();
}

// ---------- you write in the channel ----------
export function onPlayerMessage(text, t = clock.now()) {
  const c = chat();
  addMessage(c, { from: 'me', text, read: true, t, handled: false });
  const T = teamState();
  if (!T.replyAt) {
    const [a, b] = cfg().team.replyDelayMs;
    T.replyAt = t + rand(a, b);
  }
  touchChat(c);
  touchProfile();
}

let replying = false;

async function respond() {
  const T = teamState();
  const c = chat();
  T.replyAt = null;
  const now = clock.now();
  const onDuty = members().filter((m) => onShift(m, now));
  const dianeOn = boss.isOnline(now);
  if (!onDuty.length && !dianeOn) { T.replyAt = nextAnyoneOnShift(now); return; }
  // each message you write is answered (or deliberately left) once; answeredUpTo is from older saves
  const legacy = T.answeredUpTo || 0;
  const fresh = c.messages.filter((m) => m.from === 'me' && !m.handled && !(m.handled === undefined && m.t <= legacy));
  if (!fresh.length) return;
  replying = true;
  const said = fresh.map((m) => m.text).join('\n');
  const ask = () => withRetry(() => llmCall({
    role: 'team',
    category: 'team',
    system: `You play the coworkers in a remote customer-support team's group chat (#support-team at Whiterock, a financial-services firm). Everyone works from home and never meets in person (no coffee or lunch meet-ups). The human player is ${S.profile.name}, a fellow support agent; never write as them, and never as Diane (the manager).

COWORKERS ON SHIFT NOW (only they may reply):
${onDuty.map(teamCard).join('\n') || '(none)'}

Reply like real colleagues: short, in each person's voice. Usually only one or two people reply; nobody replies if nothing invites it. If the agent asks a finance/accounting/stats question, answer helpfully in character (correctly). If the agent warns the team about a difficult customer, react and note it.
Diane is ${dianeOn ? 'online' : 'offline'}; set "diane": true only if the message is addressed to her or really needs the manager.

OUTPUT only JSON: {"replies": [{"who": "<coworker id>", "delaySec": <5-180>, "text": "<message>"}], "diane": <true|false>, "warnedAbout": [{"customer": "<@chatN or the customer's name, exactly as the agent wrote it>", "why": "<few words>"}]}`,
    messages: [{ role: 'user', content: `Recent chat (oldest first):\n${recentLines(60)}\n\n${S.profile.name}'s status: ${S.profile.presence || 'online'}.\nNew from ${S.profile.name}:\n${said}` }],
    maxTokens: 900,
    temperature: 0.8,
  }), 2, 1500).then(parseJSON);
  try {
    const j = await ask();
    const raw = Array.isArray(j.replies) ? j.replies : j.who ? [j] : [];
    const replies = raw.map((r) => ({ m: memberIn(onDuty, r?.who), text: textOf(r), delaySec: r?.delaySec })).filter((r) => r.m && r.text);
    if (raw.length && !replies.length) console.warn('team: reply did not match anyone on shift', raw);
    for (const w of Array.isArray(j.warnedAbout) ? j.warnedAbout : []) {
      const cust = w && resolveCustomer(w.customer);
      if (cust) T.flags[cust.personaId] = { at: now, name: cust.name, why: String(w.why || '').slice(0, 80), hit: false };
    }
    // queue the replies (saved, so they survive the app closing) and let tick() post them with "typing…"
    const speed = S.fastTeam ? 50 : 1;
    let at = now;
    for (const r of replies.slice(0, cfg().team.maxReplies)) {
      at = Math.max(at, now + Math.min(180, Math.max(5, Number(r.delaySec) || 20)) * 1000 / speed) + rand(1000, 4000) / speed;
      T.queue.push({ who: r.m.id, at, text: r.text, reply: true });
    }
    T.queue.sort((a, b) => a.at - b.at);
    for (const m of fresh) m.handled = true;
    T.replyTries = 0;
    if (onDuty.length && Math.random() < 0.25) toggleReaction(c, fresh.at(-1), pick(['👍', '😂', '🔥', '💯']), pick(onDuty).id);
    touchProfile();
    if (j.diane && dianeOn) {
      const text = await boss.teamReply(recentLines(60));
      if (text) { T.queue.push({ who: 'diane', at: at + rand(20000, 60000) / speed, text, reply: true }); T.queue.sort((a, b) => a.at - b.at); }
    }
  } catch (e) {
    // try again in a couple of minutes rather than leaving you on read
    console.warn('team reply failed', e);
    T.replyTries = (T.replyTries || 0) + 1;
    if (T.replyTries <= 3) T.replyAt = now + 2 * MIN;
    else { for (const m of fresh) m.handled = true; T.replyTries = 0; sysMessage(c, '⚠ Your coworkers couldn\'t be reached just now (connection problem).', { kind: 'error' }); }
  } finally {
    replying = false;
    touchChat(c);
    touchProfile();
  }
}

function nextAnyoneOnShift(t) {
  for (let x = t; x < t + 4 * 86400000; x += 10 * MIN) if (members().some((m) => onShift(m, x)) || boss.isOnline(x)) return x + rand(1, 10) * MIN;
  return t + 12 * HOUR;
}

// ---------- the clock ----------
export function tick(now = clock.now()) {
  const c = chat();
  if (!c || simulating || replying) return;
  const T = teamState();
  // queued chatter whose time has come
  while (T.queue.length && T.queue[0].at <= now) {
    const q = T.queue.shift();
    if (q.diane) {
      replying = true;
      boss.teamPost(recentLines(30), q.at).then((text) => { if (text) addMessage(c, { from: 'them', who: 'diane', text, t: Math.min(clock.now(), q.at) }); })
        .finally(() => { replying = false; touchChat(c); });
      touchProfile();
      return;
    }
    c.typing = null;
    addMessage(c, { from: 'them', who: q.who, text: q.text, t: q.at, silent: now - q.at > 10 * MIN }); // old chatter from while you were away: no ping
    touchProfile();
  }
  // "Ken is typing…" just before a queued message goes out
  const next = T.queue[0];
  const typing = next && !next.diane && next.text && next.at - now < Math.min(6000, 600 + next.text.length * 30) / (S.fastTeam ? 50 : 1) ? member(next.who)?.name.split(' ')[0] : null;
  if ((c.typing || null) !== typing) { c.typing = typing; touchChat(c); }
  if (T.replyAt && now >= T.replyAt) { respond(); return; }
  if (!S.settings?.hasKey) return;
  if (T.nextSimAt == null) T.nextSimAt = now + rand(10, 40) * MIN;
  if (now >= T.nextSimAt) {
    simulating = true;
    const start = Math.max(T.nextSimAt, now - 12 * HOUR);
    simulate(start).catch((e) => { console.warn('team sim failed', e); T.nextSimAt = now + HOUR; }).finally(() => { simulating = false; });
  }
}

// When Diane transfers a chat, a coworker on shift (or any) takes it.
export function pickTaker(t = clock.now()) {
  const on = members().filter((m) => onShift(m, t));
  return pick(on.length ? on : members());
}
