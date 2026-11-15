"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const P = require("../js/prices.js");

const TODAY = "2026-11-09";
let n = 0;
const mk = (o = {}) => {
  const r = P.makeObs({ itemKey: "chicken", itemName: "Chicken breast", store: "SPAR", total: "4,49", amount: "550 g", date: "2026-11-01", ...o }, TODAY, "id" + ++n);
  assert.ok(r.ok, JSON.stringify(r));
  return r.obs;
};

/* ---------- Unit normalisation ---------- */
test("parseAmount converts mass, volume and counts to kg, litre, item", () => {
  assert.deepEqual(P.parseAmount("550 g"), { ok: true, unit: "kg", base: 0.55 });
  assert.deepEqual(P.parseAmount("1,5 KG"), { ok: true, unit: "kg", base: 1.5 });
  assert.deepEqual(P.parseAmount("1 L"), { ok: true, unit: "l", base: 1 });
  assert.deepEqual(P.parseAmount("250ml"), { ok: true, unit: "l", base: 0.25 });
  assert.deepEqual(P.parseAmount("33 cl"), { ok: true, unit: "l", base: 0.33 });
  assert.deepEqual(P.parseAmount("5 dl"), { ok: true, unit: "l", base: 0.5 });
  assert.deepEqual(P.parseAmount("6"), { ok: true, unit: "item", base: 6 });
  assert.deepEqual(P.parseAmount("12 stk"), { ok: true, unit: "item", base: 12 });
});
test("parseAmount rejects instead of guessing", () => {
  for (const bad of ["", "abc", "0", "0 g", "-1 kg", "1/2 kg", "2 cups", "1 oz", "1e3", "1 kg 200 g", "100001", "1.2.3 kg", null, undefined]) assert.equal(P.parseAmount(bad).ok, false, String(bad));
});
test("price per kg, litre and item is total divided by normalised amount", () => {
  assert.equal(mk({ total: "4,49", amount: "550 g" }).price, 8.1636); // 4.49 / 0.55
  assert.equal(mk({ total: "1,19", amount: "1 L", itemKey: "milk", itemName: "Milk" }).price, 1.19);
  assert.equal(mk({ total: "2,70", amount: "6", itemKey: "eggs", itemName: "Eggs" }).price, 0.45);
  assert.equal(mk({ total: "0,99", amount: "500 ml", itemKey: "x", itemName: "x" }).unit, "l");
});

/* ---------- Validation, currency, privacy ---------- */
test("makeObs rejects bad totals, dates and missing product", () => {
  const base = { itemKey: "a", itemName: "A", store: "S", total: "1", amount: "1 kg", date: "2026-11-01" };
  for (const bad of [{ total: "" }, { total: "0" }, { total: "-3" }, { total: "1,234" }, { total: "1e2" }, { total: "€2" }, { amount: "lots" }, { date: "2026-13-01" }, { date: "2026-02-30" }, { date: "tomorrow" }, { date: "2026-11-10" }, { itemName: "  " }])
    assert.equal(P.makeObs({ ...base, ...bad }, TODAY, "i").ok, false, JSON.stringify(bad));
  assert.equal(P.makeObs(base, TODAY, "i").ok, true);
});
test("every observation is in EUR; other currencies are not accepted from stored data", () => {
  const o = mk();
  assert.equal(o.cur, "EUR");
  assert.deepEqual(P.cleanLog([o, { ...o, id: "usd", cur: "USD" }]).map(x => x.id), [o.id]);
});
test("cleanLog drops tampered or malformed entries", () => {
  const o = mk();
  const junk = [null, 5, "x", {}, { ...o, id: 7 }, { ...o, price: -1 }, { ...o, price: "1" }, { ...o, base: 0 }, { ...o, date: "2026-02-30" }, { ...o, unit: "oz" }];
  assert.deepEqual(P.cleanLog([...junk, o]), [o]);
  assert.deepEqual(P.cleanLog("nope"), []);
  assert.deepEqual(P.cleanLog(undefined), []);
});
test("privacy: the module has no network, storage or DOM access", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "prices.js"), "utf8");
  for (const word of ["fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "document.", "navigator", "sendBeacon", "WebSocket"]) assert.ok(!src.includes(word), word);
});

/* ---------- Duplicates, edits, deletion, cap ---------- */
test("duplicate purchase is detected, an edit of the same entry is not", () => {
  const a = mk();
  const r1 = P.upsertObs([], a);
  assert.ok(r1.ok);
  const dup = P.makeObs({ itemKey: "chicken", itemName: "Chicken breast", store: " spar ", total: "4,49", amount: "550 g", date: "2026-11-01" }, TODAY, "other").obs;
  assert.equal(P.upsertObs(r1.log, dup).ok, false);
  const edited = { ...a, store: "HOFER" };
  const r2 = P.upsertObs(r1.log, edited);
  assert.ok(r2.ok);
  assert.equal(r2.log.length, 1);
  assert.equal(r2.log[0].store, "HOFER");
});
test("removeObs deletes only the chosen entry", () => {
  const a = mk(), b = mk({ date: "2026-11-02" });
  assert.deepEqual(P.removeObs([a, b], a.id), [b]);
});
test("history is capped", () => {
  const log = Array.from({ length: P.MAX_OBS }, (_, i) => ({ ...mk(), id: "c" + i, total: 1 + i }));
  const r = P.upsertObs(log, mk({ date: "2026-10-30" }));
  assert.equal(r.ok, false);
  assert.match(r.error, /full/);
});

/* ---------- Comparison ---------- */
const chicken = [
  mk({ store: "SPAR", total: "4,49", amount: "550 g", date: "2026-11-01" }),   // 8.16 /kg
  mk({ store: "HOFER", total: "5,99", amount: "1 kg", date: "2026-10-10" }),    // 5.99 /kg  cheapest regular
  mk({ store: "BILLA", total: "7,00", amount: "1 kg", date: "2026-10-20" }),    // 7.00 /kg
  mk({ store: "SPAR", total: "3,00", amount: "1 kg", date: "2026-10-25", promo: true }) // 3.00 /kg promo
];
test("cheapest store compares per kg across pack sizes, and keeps promos apart", () => {
  const [g] = P.compareItem(chicken, "chicken", TODAY);
  assert.equal(g.unit, "kg");
  assert.equal(g.lowestRegular.store, "HOFER");
  assert.equal(g.lowestRegular.price, 5.99);
  assert.equal(g.lowestPromo.store, "SPAR");
  assert.equal(g.cheapestStore.store, "HOFER");
  assert.deepEqual(g.stores.map(s => s.store), ["HOFER", "BILLA", "SPAR"]); // SPAR best regular is 8.16
});
test("stale prices are flagged with their age, never presented as current", () => {
  const [g] = P.compareItem(chicken, "chicken", TODAY);
  assert.equal(g.lowestRegular.age, 30);
  assert.equal(g.lowestRegular.stale, false);
  const [old] = P.compareItem([mk({ date: "2026-06-01" })], "chicken", TODAY);
  assert.equal(old.lowestRegular.stale, true);
  assert.equal(old.lowestRegular.age, 161);
});
test("unlike dimensions are never compared (kg vs item vs litre)", () => {
  const log = [mk({ itemKey: "x", itemName: "X", amount: "1 kg", total: "5" }), mk({ itemKey: "x", itemName: "X", amount: "6", total: "3" }), mk({ itemKey: "x", itemName: "X", amount: "1 L", total: "2" })];
  const groups = P.compareItem(log, "x", TODAY);
  assert.deepEqual(groups.map(g => g.unit).sort(), ["item", "kg", "l"]);
  groups.forEach(g => assert.equal(g.count, 1));
});
test("different currencies are never compared", () => {
  const a = mk({ itemKey: "x", itemName: "X" }), b = { ...mk({ itemKey: "x", itemName: "X", date: "2026-11-02" }), cur: "USD", price: 0.01 };
  const groups = P.compareItem([a, b], "x", TODAY);
  assert.equal(groups.length, 2);
  assert.equal(groups.find(g => g.cur === "EUR").lowestRegular.price, a.price);
});
test("missing store: kept in the history but never wins 'cheapest store'", () => {
  const nostore = mk({ store: "", total: "1", amount: "1 kg" });
  const [g] = P.compareItem([nostore, mk({ store: "SPAR", total: "5", amount: "1 kg", date: "2026-11-02" })], "chicken", TODAY);
  assert.equal(g.count, 2);
  assert.equal(g.lowestRegular.price, 1);
  assert.equal(g.cheapestStore.store, "SPAR");
  const [only] = P.compareItem([nostore], "chicken", TODAY);
  assert.equal(only.cheapestStore, null);
});
test("outlier prices (4+ entries, not on offer) are excluded from 'lowest' and reported", () => {
  const log = [mk({ total: "6", amount: "1 kg", store: "A" }), mk({ total: "6,2", amount: "1 kg", store: "B", date: "2026-11-02" }), mk({ total: "5,8", amount: "1 kg", store: "C", date: "2026-11-03" }), mk({ total: "0,60", amount: "1 kg", store: "D", date: "2026-11-04" })];
  const [g] = P.compareItem(log, "chicken", TODAY);
  assert.equal(g.outliers.size, 1);
  assert.equal(g.lowestRegular.store, "C");
  assert.equal(g.cheapestStore.store, "C");
});
test("with fewer than 4 entries nothing is called an outlier", () => {
  const [g] = P.compareItem([mk({ total: "6", amount: "1 kg" }), mk({ total: "0,6", amount: "1 kg", date: "2026-11-02", store: "B" })], "chicken", TODAY);
  assert.equal(g.outliers.size, 0);
});
test("store names match ignoring case and spaces", () => {
  const [g] = P.compareItem([mk({ store: "Spar" }), mk({ store: " SPAR ", total: "4", date: "2026-11-02" })], "chicken", TODAY);
  assert.equal(g.stores.length, 1);
  assert.equal(g.stores[0].price, 7.2727); // 4 / 0.55
});
test("products() lists newest first; knownStores() de-duplicates", () => {
  const a = mk({ itemKey: "a", itemName: "A", date: "2026-10-01", store: "SPAR" }), b = mk({ itemKey: "b", itemName: "B", date: "2026-11-01", store: "spar " });
  assert.deepEqual(P.products([a, b]).map(p => p.item), ["b", "a"]);
  assert.deepEqual(P.knownStores([a, b]), ["SPAR"]);
});
test("ageDays is calendar-day exact across DST", () => {
  assert.equal(P.ageDays("2026-03-28", "2026-03-30"), 2);
  assert.equal(P.ageDays("2026-10-24", "2026-10-26"), 2);
});
test("store key: 'SPAR / INTERSPAR' and 'spar' are one store", () => {
  assert.equal(P.storeKey("SPAR / INTERSPAR"), "spar");
  assert.equal(P.storeKey(" Spar "), "spar");
  assert.equal(P.storeKey(""), "");
  const [g] = P.compareItem([mk({ store: "SPAR / INTERSPAR" }), mk({ store: "spar", total: "4", date: "2026-11-02" })], "chicken", TODAY);
  assert.equal(g.stores.length, 1);
});
