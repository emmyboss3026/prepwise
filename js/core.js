/* Prepwise core: pure logic with no DOM or network access.
   Loaded as a classic script in the browser (window.PW) and with require() in tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PW = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const ANCHOR = "2026-11-06"; // first shop/cook day; repeats every 14 days
  const LKEY = "prepwise-local-v1"; // localStorage key for all user data; never rename

  /* ---------- Formatting and parsing ---------- */
  const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = v => { const n = parseFloat(String(v).replace(",", ".").replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; };
  const r1 = n => Math.round(n * 10) / 10;
  const eur = n => "€" + (Math.round(n * 100) / 100).toFixed(2);

  /* ---------- Dates (local calendar days as YYYY-MM-DD) ---------- */
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); }
  function tripOf(day, anchor) {
    anchor = anchor || ANCHOR;
    const k = Math.floor(diffDays(anchor, day) / 14);
    return addDays(anchor, Math.max(0, k) * 14);
  }
  /* Next shop/cook day on or after `day`. */
  function nextCookDay(day, anchor) {
    const cur = tripOf(day, anchor);
    return diffDays(day, cur) >= 0 ? cur : addDays(cur, 14);
  }
  function greeting(hour) { return hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; }

  /* ---------- Ingredient scaling ---------- */
  function scaleAmt(a, f) {
    if (f === 1 || !a) return a;
    return String(a).replace(/\d[\d,]*(?:\.\d+)?/g, m => {
      const n = parseFloat(m.replace(/,/g, ""));
      if (isNaN(n)) return m;
      const v = n * f;
      return v >= 100 ? Math.round(v).toLocaleString("en-GB") : String(Math.round(v * 10) / 10);
    });
  }
  function stepParts(t) {
    const m = String(t).match(/\[(\d+(?:\.\d+)?)\s*min\]/i);
    return { text: String(t).replace(/\s*\[\d+(?:\.\d+)?\s*min\]/i, ""), min: m ? parseFloat(m[1]) : null };
  }

  /* ---------- Grocery calculations ----------
     list: [id, store, name, buy, price, source, uses]; recs: { [itemId]: {status, paid, store} } */
  function tripTotals(list, recs) {
    recs = recs || {};
    let planned = 0, have = 0, spent = 0, est = false, left = 0, done = 0;
    list.forEach(i => {
      const r = recs[i[0]] || {};
      if (i[1] !== "PANTRY") planned += i[4];
      if (r.status === "have") { have += i[4]; done++; }
      else if (r.status === "bought") { done++; if (r.paid != null) spent += r.paid; else { spent += i[4]; est = true; } }
      else if (i[1] !== "PANTRY") left += i[4];
    });
    return { planned, have, spent, est, left, done, total: list.length };
  }

  /* ---------- Trip budget ---------- */
  /* Accepts "", 0..100000 with up to 2 decimals (comma or dot). Anything else (1e3, -5, abc) is rejected, not guessed. */
  function parseBudget(raw) {
    raw = String(raw == null ? "" : raw).trim();
    if (raw === "") return { ok: true, value: null };
    if (!/^\d{1,6}([.,]\d{1,2})?$/.test(raw)) return { ok: false, value: null };
    const n = parseFloat(raw.replace(",", "."));
    return n > 100000 ? { ok: false, value: null } : { ok: true, value: n };
  }
  /* total = purchased + still to buy (pantry excluded, as in tripTotals). */
  function budgetStatus(spent, left, budget) {
    const total = spent + left;
    if (budget == null) return { total, diff: null, over: false };
    const diff = Math.round((budget - total) * 100) / 100;
    return { total, diff, over: diff < 0 };
  }

  /* ---------- Body maths (Mifflin–St Jeor) ---------- */
  function bodyStats(s) {
    s = s || {};
    const w = num(s.weight), h = num(s.height), a = num(s.age), act = num(s.activity) || 1.375;
    if (!w || !h || !a || !s.sex) return null;
    const bmr = 10 * w + 6.25 * h - 5 * a + (s.sex === "male" ? 5 : -161);
    return { w, h, a, bmr, tdee: bmr * act };
  }

  /* ---------- Persistence and migration ---------- */
  function emptyState() { return { items: {}, settings: {}, log: {}, weights: {} }; }
  /* Stored or synced data is untrusted: drop keys that could reach Object.prototype, and keep weights numeric. */
  const BAD_KEYS = ["__proto__", "constructor", "prototype"];
  function stripProto(o, depth) {
    if (!o || typeof o !== "object" || depth < 0) return o;
    if (Array.isArray(o)) { o.forEach(x => stripProto(x, depth - 1)); return o; }
    BAD_KEYS.forEach(k => { if (Object.prototype.hasOwnProperty.call(o, k)) delete o[k]; });
    Object.keys(o).forEach(k => stripProto(o[k], depth - 1));
    return o;
  }
  function cleanWeights(w) {
    const o = {};
    Object.keys(w).forEach(k => { const n = Number(w[k]); if (w[k] !== null && w[k] !== "" && isFinite(n)) o[k] = n; });
    return o;
  }
  /* Accepts the raw localStorage string (or null). Never throws; missing or wrong-typed
     keys fall back to empty so older saves keep working. */
  function normalizeLocal(raw) {
    const out = emptyState();
    let d;
    try { d = JSON.parse(raw || "{}"); } catch (e) { return out; }
    if (!d || typeof d !== "object" || Array.isArray(d)) return out;
    ["items", "settings", "log", "weights"].forEach(k => {
      if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k])) out[k] = stripProto(d[k], 6);
    });
    out.weights = cleanWeights(out.weights);
    return out;
  }
  function serializeLocal(s) { return JSON.stringify({ items: s.items, settings: s.settings, log: s.log, weights: s.weights }); }

  /* Supabase rows (mp_items, mp_settings, mp_log, mp_weights) to app state. */
  function mapCloud(itemRows, settingsRow, logRows, weightRows) {
    const out = emptyState();
    const ok = (...ks) => ks.every(k => BAD_KEYS.indexOf(k) < 0);
    (itemRows || []).forEach(r => { if (!ok(r.trip_date, r.item_id)) return; (out.items[r.trip_date] = out.items[r.trip_date] || {})[r.item_id] = { status: r.status || "", paid: r.paid == null ? null : Number(r.paid), store: r.store || "" }; });
    out.settings = stripProto((settingsRow && settingsRow.data) || {}, 6);
    (logRows || []).forEach(r => { if (!ok(r.day, r.slot)) return; (out.log[r.day] = out.log[r.day] || {})[r.slot] = { meal: r.meal, eaten: r.eaten, kcal: r.kcal }; });
    (weightRows || []).forEach(r => { if (ok(r.day) && isFinite(Number(r.kg))) out.weights[r.day] = Number(r.kg); });
    return out;
  }

  return { ANCHOR, LKEY, esc, num, r1, eur, iso, parse, addDays, diffDays, tripOf, nextCookDay, greeting,
    scaleAmt, stepParts, tripTotals, parseBudget, budgetStatus, bodyStats, emptyState, normalizeLocal, serializeLocal, mapCloud };
});
