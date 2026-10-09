// Whiterock Management channel: occasional memos (data/memos.json), some with pay bonuses.
import { S, cfg, rand, pick, touchProfile } from '../core/state.js';
import { addMessage, getChat } from './chats.js';
import * as clock from './clock.js';
import { rankInfo } from './progress.js';

function fillVars(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

function baseVars() {
  const p = S.profile;
  return { name: p.name, rank: p.rank, rankTitle: rankInfo(p.rank).title, balance: Math.round(p.balance) };
}

export function scheduleNext() {
  const [a, b] = cfg().memos.everyMs;
  S.profile.memo.nextAtA = clock.now() + rand(a, b);
}

export function sendMemo(memo, vars = {}) {
  const chat = getChat('manager');
  if (!chat || !memo) return;
  const v = { ...baseVars(), ...vars };
  let text = '**' + fillVars(memo.title, v) + '**\n\n' + fillVars(memo.text, v);
  if (memo.effect) {
    const mod = { ...memo.effect, id: 'mod' + Date.now(), source: memo.title };
    S.profile.modifiers.push(mod);
    text += '\n\n🎁 _' + (memo.effect.label || 'Bonus active') + '_';
  }
  text += '\n\n— ' + (memo.from || 'Whiterock Management');
  addMessage(chat, { from: 'them', text });
  S.profile.memo.sent = [...(S.profile.memo.sent || []), memo.id].slice(-60);
  touchProfile();
}

export function triggerMemo(trigger, vars = {}) {
  const list = S.data.memos.filter((m) => m.trigger === trigger && (!m.minRank || S.profile.rank >= m.minRank));
  if (!list.length) return;
  const unsent = list.filter((m) => !(S.profile.memo.sent || []).includes(m.id));
  sendMemo(pick(unsent.length ? unsent : list), vars);
}

export function tickMemos() {
  const p = S.profile;
  if (!p.memo.nextAtA) scheduleNext();
  if (clock.now() >= p.memo.nextAtA) {
    triggerMemo('random');
    scheduleNext();
  }
}
