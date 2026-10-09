// Thin wrapper around window.api.llm plus robust JSON extraction.

import { S } from '../core/state.js';
import { emit } from '../core/bus.js';

// "Connecting…" in the UI while OpenRouter can't be reached (like Telegram's header).
function setNet(down) {
  if (!!S.netDown === down) return;
  S.netDown = down;
  emit('net');
}

export async function llmCall({ role, category, system, messages, maxTokens, temperature, chatId }) {
  const msgs = system ? [{ role: 'system', content: system }, ...messages] : messages;
  try {
    const r = await window.api.llm({ role, category, messages: msgs, maxTokens, temperature, chatId });
    setNet(false);
    return r.text || '';
  } catch (e) {
    if (/Network error|timed out|fetch failed|ENOTFOUND|ECONN/i.test(e.message || '')) setNet(true);
    throw e;
  }
}

// Models sometimes wrap JSON in ```json fences or add chatter around it.
export function parseJSON(text) {
  if (!text) throw new Error('Empty response');
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) {
    const slice = t.slice(a, b + 1);
    try { return JSON.parse(slice); } catch {}
    // last resort: escape raw newlines inside strings
    try { return JSON.parse(slice.replace(/\n/g, '\\n')); } catch {}
  }
  throw new Error('Could not parse JSON from model reply');
}

export async function withRetry(fn, tries = 3, baseDelay = 1500) {
  let err;
  for (let i = 0; i < tries; i++) {
    try { return await fn(i); } catch (e) {
      err = e;
      if (/No OpenRouter API key/.test(e.message)) break;
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** i));
    }
  }
  throw err;
}
