/* Prepwise price history (2.4): pure logic, no DOM. Loaded as a classic script (window.PWP) and with require() in tests.
   An observation is a purchase the user confirmed: what, where, how much was paid, for how much product, and when.
   Prices are only compared for the same product, the same dimension (kg, litre or item) and the same currency.
   Nothing here is a live price: every result carries its date so the UI can show how old it is. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PWP = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // shortcut: observations live in settings.priceLog (jsonb in mp_settings); MAX keeps that row small.
  // Upgrade to a dedicated table (needs a reviewed migration) if the cap is ever reached.
  const MAX_OBS = 1500;
  const STALE_DAYS = 60;
  const CURRENCY = "EUR";
  const UNIT_LABEL = { kg: "kg", l: "litre", item: "item" };

  const round4 = n => Math.round(n * 10000) / 10000;
  const dayNum = s => { const [y, m, d] = s.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && (() => { const [y, m, d] = s.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; })();
  const ageDays = (date, today) => dayNum(today) - dayNum(date);

  /* "550 g", "1,5 kg", "1 L", "250ml", "6" (items). Never guesses: unknown units, fractions, zero or huge values are rejected.
     Mass and volume are not converted to each other (no density guessing). */
  function parseAmount(text) {
    const m = String(text == null ? "" : text).trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|dl|cl|ml|x|stk|pcs|pc)?$/);
    if (!m) return { ok: false };
    const n = parseFloat(m[1].replace(",", "."));
    if (!(n > 0) || n > 100000) return { ok: false };
    const u = m[2] || "";
    if (u === "kg") return { ok: true, unit: "kg", base: n };
    if (u === "g") return { ok: true, unit: "kg", base: n / 1000 };
    if (u === "l") return { ok: true, unit: "l", base: n };
    if (u === "dl") return { ok: true, unit: "l", base: n / 10 };
    if (u === "cl") return { ok: true, unit: "l", base: n / 100 };
    if (u === "ml") return { ok: true, unit: "l", base: n / 1000 };
    return { ok: true, unit: "item", base: n }; // bare number, x, stk, pcs
  }

  /* "SPAR / INTERSPAR" and "SPAR" are the same store: only the part before "/" counts. */
  const storeKey = s => String(s || "").trim().toLowerCase().split("/")[0].trim();

  /* Validate user input and build an observation. `input`: {itemKey,itemName,store,total,amount,date,promo,id}.
     `today` is YYYY-MM-DD. Returns {ok:true,obs} or {ok:false,error}. */
  function makeObs(input, today, newId) {
    const itemName = String(input.itemName || "").trim().slice(0, 80);
    if (!itemName) return { ok: false, error: "Choose or type the product." };
    const total = String(input.total == null ? "" : input.total).trim();
    if (!/^\d{1,5}([.,]\d{1,2})?$/.test(total) || !(parseFloat(total.replace(",", ".")) > 0)) return { ok: false, error: "Enter the total paid, for example 2,49." };
    const amt = parseAmount(input.amount);
    if (!amt.ok) return { ok: false, error: "Enter the amount bought: 550 g, 1,5 kg, 1 L, 250 ml, or a count like 6." };
    const date = String(input.date || "").trim();
    if (!validDate(date)) return { ok: false, error: "Enter a valid date." };
    if (ageDays(date, today) < 0) return { ok: false, error: "The date cannot be in the future." };
    const totalN = parseFloat(total.replace(",", "."));
    const itemKey = String(input.itemKey || "").trim() || "name:" + itemName.toLowerCase();
    return { ok: true, obs: {
      id: input.id || newId, item: itemKey.slice(0, 80), name: itemName, store: String(input.store || "").trim().slice(0, 60),
      total: totalN, amount: String(input.amount).trim().slice(0, 20), base: amt.base, unit: amt.unit,
      price: round4(totalN / amt.base), date, cur: CURRENCY, promo: input.promo ? 1 : 0
    } };
  }

  /* Same product, store, day, total and amount = the same purchase entered twice. */
  function isDuplicate(log, obs) {
    return log.some(o => o.id !== obs.id && o.item === obs.item && storeKey(o.store) === storeKey(obs.store) && o.date === obs.date && o.total === obs.total && o.base === obs.base);
  }

  /* Insert or replace (by id). Returns {ok,log} or {ok:false,error}. */
  function upsertObs(log, obs) {
    if (isDuplicate(log, obs)) return { ok: false, error: "That purchase is already in your history." };
    const i = log.findIndex(o => o.id === obs.id);
    if (i < 0 && log.length >= MAX_OBS) return { ok: false, error: "Price history is full (" + MAX_OBS + " entries). Delete old entries first." };
    const next = log.slice();
    if (i < 0) next.push(obs); else next[i] = obs;
    return { ok: true, log: next };
  }
  const removeObs = (log, id) => log.filter(o => o.id !== id);

  /* Drop anything that is not a well-formed observation (tampered or old data). */
  function cleanLog(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(o => o && typeof o === "object" && typeof o.id === "string" && typeof o.item === "string" && typeof o.date === "string" && validDate(o.date)
      && Number.isFinite(o.price) && o.price > 0 && Number.isFinite(o.total) && Number.isFinite(o.base) && o.base > 0 && UNIT_LABEL[o.unit] && o.cur === CURRENCY).slice(0, MAX_OBS);
  }

  function median(nums) {
    const a = nums.slice().sort((x, y) => x - y), m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  /* All observations for one product, grouped by comparable unit. Returns groups sorted by size:
     {unit,cur,count,median,outliers:Set<id>, lowestRegular, lowestPromo, cheapestStore, stores:[{store,price,date}] }.
     Outlier: a non-promo price below half or above double the median, only judged when there are 4+ prices. */
  function compareItem(log, itemKey, today) {
    const by = new Map();
    log.filter(o => o.item === itemKey).forEach(o => { const k = o.unit + "|" + o.cur; if (!by.has(k)) by.set(k, []); by.get(k).push(o); });
    const stamp = o => ({ id: o.id, price: o.price, date: o.date, store: o.store, age: ageDays(o.date, today), stale: ageDays(o.date, today) > STALE_DAYS });
    return [...by.values()].map(obs => {
      const med = median(obs.map(o => o.price));
      const outliers = new Set(obs.length >= 4 ? obs.filter(o => !o.promo && (o.price < med / 2 || o.price > med * 2)).map(o => o.id) : []);
      const regular = obs.filter(o => !o.promo && !outliers.has(o.id));
      const lowest = list => list.reduce((b, o) => (!b || o.price < b.price || (o.price === b.price && o.date > b.date) ? o : b), null);
      const lr = lowest(regular), lp = lowest(obs.filter(o => o.promo));
      const perStore = new Map();
      regular.filter(o => storeKey(o.store)).forEach(o => { const k = storeKey(o.store), cur = perStore.get(k); if (!cur || o.price < cur.price || (o.price === cur.price && o.date > cur.date)) perStore.set(k, o); });
      const stores = [...perStore.values()].sort((a, b) => a.price - b.price).map(stamp);
      return { unit: obs[0].unit, cur: obs[0].cur, count: obs.length, median: med, outliers,
        lowestRegular: lr && stamp(lr), lowestPromo: lp && stamp(lp), cheapestStore: stores[0] || null, stores };
    }).sort((a, b) => b.count - a.count);
  }

  /* Products that have at least one observation, newest activity first: [{item,name,count,last}] */
  function products(log) {
    const m = new Map();
    log.forEach(o => { const p = m.get(o.item) || { item: o.item, name: o.name, count: 0, last: "" }; p.count++; if (o.date >= p.last) { p.last = o.date; p.name = o.name; } m.set(o.item, p); });
    return [...m.values()].sort((a, b) => (a.last < b.last ? 1 : a.last > b.last ? -1 : 0));
  }
  const knownStores = log => { const m = new Map(); log.forEach(o => { if (storeKey(o.store) && !m.has(storeKey(o.store))) m.set(storeKey(o.store), o.store.trim()); }); return [...m.values()].sort(); };

  return { MAX_OBS, STALE_DAYS, CURRENCY, UNIT_LABEL, parseAmount, makeObs, isDuplicate, upsertObs, removeObs, cleanLog, compareItem, products, knownStores, ageDays, validDate, storeKey };
});
