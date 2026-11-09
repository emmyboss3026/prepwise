"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const P = require("../js/prices.js");
const R = require("../js/recs.js");

const TODAY = "2026-11-09";
let n = 0;
const obs = (item, store, total, amount, date, extra = {}) => {
  const r = P.makeObs({ itemKey: item, itemName: item, store, total, amount, date, ...extra }, TODAY, "o" + ++n);
  assert.ok(r.ok, JSON.stringify(r));
  return r.obs;
};
const rem = (id, store) => ({ id, name: id, store });

/* chicken: planned at SPAR 8.16/kg, HOFER 5.49/kg, last bought 3.3 kg */
const chickenLog = [
  obs("chicken", "SPAR / INTERSPAR", "26,94", "3,3 kg", "2026-11-05"),
  obs("chicken", "HOFER", "5,49", "1 kg", "2026-10-30"),
  obs("chicken", "HOFER", "5,59", "1 kg", "2026-10-20")
];

test("recommends the cheaper store with a saving based on the last amount bought", () => {
  const r = R.recommend([rem("chicken", "SPAR / INTERSPAR")], { log: chickenLog, today: TODAY });
  assert.equal(r.stops.length, 1);
  const it = r.stops[0].items[0];
  assert.equal(r.stops[0].store, "HOFER");
  assert.equal(it.price, 5.49);
  assert.equal(it.baselinePrice, 8.1636);
  assert.equal(it.qty, 3.3);
  assert.equal(it.saving, 8.82); // (8.1636 - 5.49) * 3.3
  assert.equal(it.estCost, 18.12);
  assert.equal(r.totalSaving + r.weakSaving, 8.82);
  assert.equal(r.covered, 1);
});
test("every result carries the date and age of the price it is based on", () => {
  const it = R.recommend([rem("chicken", "SPAR")], { log: chickenLog, today: TODAY }).stops[0].items[0];
  assert.equal(it.date, "2026-10-30");
  assert.equal(it.age, 10);
  assert.equal(it.stale, false);
});
test("insufficient history: no entries means no recommendation, and it is reported", () => {
  const r = R.recommend([rem("chicken", "SPAR"), rem("milk", "HOFER")], { log: chickenLog, today: TODAY });
  assert.deepEqual(r.noHistory.map(x => x.id), ["milk"]);
  assert.equal(r.covered, 1);
  assert.equal(r.total, 2);
  assert.deepEqual(R.recommend([rem("milk", "HOFER")], { log: [], today: TODAY }).stops, []);
});
test("one old entry is low confidence and is kept out of the headline saving", () => {
  const log = [obs("chicken", "SPAR", "8", "1 kg", "2026-05-01"), obs("chicken", "HOFER", "5", "1 kg", "2026-05-01")];
  const r = R.recommend([rem("chicken", "SPAR")], { log, today: TODAY });
  const it = r.stops[0].items[0];
  assert.equal(it.stale, true);
  assert.equal(it.confidence, "low");
  assert.equal(r.totalSaving, 0);
  assert.equal(r.weakSaving, 3);
});
test("confidence: high needs 3+ entries and a price under 30 days old", () => {
  const g = { count: 3 };
  assert.equal(R.confidence(g, { age: 10, stale: false }), "high");
  assert.equal(R.confidence(g, { age: 45, stale: false }), "medium");
  assert.equal(R.confidence({ count: 1 }, { age: 1, stale: false }), "low");
  assert.equal(R.confidence(g, { age: 90, stale: true }), "low");
  assert.equal(R.confidence({ count: 2 }, { age: 5, stale: false }), "medium");
});
test("no recorded price at the planned store: shown, but no saving is invented", () => {
  const log = [obs("eggs", "HOFER", "2,70", "6", "2026-11-01"), obs("eggs", "LIDL", "2,40", "6", "2026-11-02")];
  const r = R.recommend([rem("eggs", "BILLA")], { log, today: TODAY });
  assert.equal(r.stops.length, 0);
  assert.equal(r.noBaseline.length, 1);
  assert.equal(r.noBaseline[0].store, "LIDL");
  assert.equal(r.noBaseline[0].saving, 0);
  assert.equal(r.totalSaving, 0);
});
test("when the planned store is already the cheapest, it stays", () => {
  const log = [obs("chicken", "SPAR", "5", "1 kg", "2026-11-01"), obs("chicken", "HOFER", "6", "1 kg", "2026-11-01")];
  const r = R.recommend([rem("chicken", "SPAR")], { log, today: TODAY });
  assert.equal(r.stops.length, 0);
  assert.equal(r.staying.length, 1);
});
test("differences under the noise threshold are not advice", () => {
  const log = [obs("x", "SPAR", "5,00", "1 kg", "2026-11-01"), obs("x", "HOFER", "4,90", "1 kg", "2026-11-01")];
  const r = R.recommend([rem("x", "SPAR")], { log, today: TODAY });
  assert.equal(r.stops.length, 0);
  assert.equal(r.staying.length, 1);
});
test("offers and unusual prices are never used as the recommended price", () => {
  const log = [obs("chicken", "SPAR", "8", "1 kg", "2026-11-01"), obs("chicken", "HOFER", "6", "1 kg", "2026-11-01"), obs("chicken", "BILLA", "2", "1 kg", "2026-11-01", { promo: true })];
  const it = R.recommend([rem("chicken", "SPAR")], { log, today: TODAY }).stops[0].items[0];
  assert.equal(it.store, "HOFER");
});
test("cross-store comparison uses unit prices, so pack sizes do not matter", () => {
  const log = [obs("oil", "SPAR", "4,99", "500 ml", "2026-11-01"), obs("oil", "HOFER", "7,50", "1 L", "2026-11-01")]; // 9.98 vs 7.50 per litre
  const it = R.recommend([rem("oil", "SPAR")], { log, today: TODAY }).stops[0].items[0];
  assert.equal(it.store, "HOFER");
  assert.equal(it.unit, "l");
  assert.equal(it.qty, 1); // last purchase: 1 L at HOFER (most recent by date, same day: either is in litres)
});
test("kg and item histories of one product are not mixed", () => {
  const log = [obs("x", "SPAR", "5", "1 kg", "2026-10-01"), obs("x", "HOFER", "3", "6", "2026-11-01"), obs("x", "LIDL", "2", "6", "2026-11-02")];
  const r = R.recommend([rem("x", "HOFER")], { log, today: TODAY });
  assert.equal(r.stops[0].items[0].unit, "item"); // follows the latest purchase's unit
  assert.equal(r.stops[0].items[0].store, "LIDL");
});
test("stores the user excludes are never recommended", () => {
  const r = R.recommend([rem("chicken", "SPAR")], { log: chickenLog, today: TODAY, exclude: ["hofer"] });
  assert.equal(r.stops.length, 0);
  assert.equal(r.staying.length, 1);
});
test("an extra stop is dropped when its saving does not cover the stop cost", () => {
  const log = [...chickenLog, obs("oil", "SPAR", "6", "1 L", "2026-11-01"), obs("oil", "SPAR", "6", "1 L", "2026-10-01"), obs("oil", "LIDL", "5,50", "1 L", "2026-11-02")]; // oil saving 0.50 at LIDL
  const items = [rem("chicken", "SPAR"), rem("oil", "SPAR")];
  const free = R.recommend(items, { log, today: TODAY, stopCost: 0 });
  assert.deepEqual(free.stops.map(s => s.store).sort(), ["HOFER", "LIDL"]);
  const costly = R.recommend(items, { log, today: TODAY, stopCost: 2 });
  assert.deepEqual(costly.stops.map(s => s.store), ["HOFER"]); // LIDL saves 0.50 < 2.00; HOFER saves 8.82
  assert.ok(costly.staying.some(i => i.id === "oil"));
  const huge = R.recommend(items, { log, today: TODAY, stopCost: 50 });
  assert.equal(huge.stops.length, 0);
});
test("a store you are visiting anyway is never dropped by the stop cost", () => {
  const log = [obs("a", "SPAR", "10", "1 kg", "2026-11-01"), obs("a", "HOFER", "9,50", "1 kg", "2026-11-01")];
  const r = R.recommend([rem("a", "SPAR"), rem("b", "HOFER")], { log, today: TODAY, stopCost: 5 });
  assert.equal(r.stops.length, 1); // HOFER is already a planned stop for item b
  assert.equal(r.stops[0].optional, false);
});
test("saving totals add up across stops", () => {
  const log = [...chickenLog, obs("oil", "SPAR", "6", "1 L", "2026-11-01"), obs("oil", "LIDL", "5", "1 L", "2026-11-02"), obs("oil", "LIDL", "5", "1 L", "2026-11-03"), obs("oil", "SPAR", "6", "1 L", "2026-10-03")];
  const r = R.recommend([rem("chicken", "SPAR"), rem("oil", "SPAR")], { log, today: TODAY });
  const sum = r.stops.reduce((a, s) => a + s.saving, 0);
  assert.equal(Math.round((sum) * 100) / 100, Math.round((r.totalSaving + r.weakSaving) * 100) / 100);
});
test("privacy and honesty: no network or storage access, and no live-price wording", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "recs.js"), "utf8");
  for (const w of ["fetch(", "XMLHttpRequest", "localStorage", "document.", "navigator", "sendBeacon"]) assert.ok(!src.includes(w), w);
  assert.ok(!/live price|current price|in stock|available now/i.test(src.replace(/Nothing here is, or claims to be, a live shop price\./, "")));
});
