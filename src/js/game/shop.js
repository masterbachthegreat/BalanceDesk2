// Shop items (data/shop.json): ownership, purchases, equipping and gameplay effects.
import { S, touchProfile } from '../core/state.js';
import { money } from '../core/format.js';
import { emit } from '../core/bus.js';

export const SLOTS = ['theme', 'wallpaper', 'border', 'nameColor', 'title'];

export function items() { return S.data.shop; }
export function item(id) { return S.data.shop.find((i) => i.id === id); }

export function owns(id) {
  const it = item(id);
  if (!it) return false;
  if (it.price === 0) return true;
  const v = S.profile.owned[id];
  return it.consumable ? (v || 0) > 0 : !!v;
}

export function count(id) { return S.profile.owned[id] || 0; }

export function ownedItems() { return items().filter((i) => owns(i.id)); }

// Sum of a numeric effect over owned permanent upgrades, e.g. effectSum('slots')
export function effectSum(key) {
  return ownedItems().reduce((s, i) => s + (i.effect && typeof i.effect[key] === 'number' && !i.consumable ? i.effect[key] : 0), 0);
}
export function effectProduct(key) {
  return ownedItems().reduce((s, i) => s * (i.effect && typeof i.effect[key] === 'number' && !i.consumable ? i.effect[key] : 1), 1);
}

export function hasTool(tool) { return ownedItems().some((i) => i.tool === tool); }
export function hasUnlock(u) { return ownedItems().some((i) => i.unlock === u); }

export function emojiPacks() { return items().filter((i) => i.category === 'emoji'); }

export function packsUsedIn(text) {
  const used = [];
  for (const p of emojiPacks()) {
    if (!p.starBonus || !owns(p.id)) continue;
    if (p.emojis.some((e) => text.includes(e))) used.push(p.id);
  }
  return used;
}

export function canBuy(it) {
  if (!it) return { ok: false, why: 'Unknown item.' };
  if (it.price === 0) return { ok: false, why: 'This one is free and already yours.' };
  if (!it.consumable && owns(it.id)) return { ok: false, why: 'You already own ' + it.name + '.' };
  if (it.requires && !owns(it.requires)) return { ok: false, why: 'Requires ' + (item(it.requires)?.name || it.requires) + ' first.' };
  if (it.minRank && S.profile.rank < it.minRank) return { ok: false, why: 'Unlocks at rank ' + it.minRank + '.' };
  if (S.profile.balance < it.price) return { ok: false, why: 'Not enough money: costs ' + money(it.price) + ', you have ' + money(S.profile.balance) + '.' };
  return { ok: true };
}

export function buy(id) {
  const it = item(id);
  const c = canBuy(it);
  if (!c.ok) return c;
  const p = S.profile;
  p.balance -= it.price;
  p.lifetimeSpent = (p.lifetimeSpent || 0) + it.price;
  if (it.consumable) {
    p.owned[id] = (p.owned[id] || 0) + 1;
  } else {
    p.owned[id] = true;
    if (it.slot) equip(id, true);
  }
  touchProfile();
  emit('purchase', it);
  return { ok: true, msg: 'Bought ' + it.name + ' for ' + money(it.price) + '.' };
}

export function equip(id, silent) {
  const it = item(id);
  if (!it || !it.slot) return { ok: false, why: 'That item cannot be equipped.' };
  if (!owns(id)) return { ok: false, why: 'You don\'t own ' + it.name + ' yet.' };
  S.profile.equipped[it.slot] = id;
  applyCosmetics();
  if (!silent) touchProfile();
  return { ok: true, msg: 'Equipped ' + it.name + '.' };
}

export function unequip(slot) {
  if (!SLOTS.includes(slot)) return { ok: false, why: 'Unknown slot. Slots: ' + SLOTS.join(', ') };
  S.profile.equipped[slot] = slot === 'theme' ? 'theme-night' : null;
  applyCosmetics();
  touchProfile();
  return { ok: true, msg: 'Unequipped ' + slot + '.' };
}

export function equippedValue(slot) {
  const id = S.profile.equipped[slot];
  const it = id && item(id);
  return it && owns(id) ? it.value : null;
}

// Use a consumable from the inventory.
export function useItem(id) {
  const it = item(id);
  if (!it || !it.consumable) return { ok: false, why: 'That is not a usable item.' };
  if (!count(id)) return { ok: false, why: 'You have no ' + it.name + ' left. Buy one in the /shop.' };
  const p = S.profile;
  p.owned[id] -= 1;
  if (it.modifier) p.modifiers.push({ ...it.modifier, id: 'mod' + Date.now(), source: it.name });
  if (it.action === 'vipNext') p.vipNext = true;
  touchProfile();
  return { ok: true, msg: it.useText || ('Used ' + it.name + '.') };
}

export function applyCosmetics() {
  const theme = equippedValue('theme') || 'night';
  document.documentElement.dataset.theme = theme;
  emit('cosmetics');
}
