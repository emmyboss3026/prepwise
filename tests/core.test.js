"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const PW = require("../js/core.js");

/* ---------- Dates ---------- */
test("iso/parse/addDays round-trip across month and year ends", () => {
  assert.equal(PW.addDays("2026-11-06", 14), "2026-11-20");
  assert.equal(PW.addDays("2026-12-25", 14), "2027-01-08");
  assert.equal(PW.addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(PW.iso(PW.parse("2026-01-09")), "2026-01-09");
});
test("diffDays ignores DST (Europe/Vienna spring/autumn changes)", () => {
  assert.equal(PW.diffDays("2026-03-28", "2026-03-30"), 2);
  assert.equal(PW.diffDays("2026-10-24", "2026-10-26"), 2);
  assert.equal(PW.diffDays("2026-11-20", "2026-11-06"), -14);
});
test("tripOf: 14-day cycle from the anchor, never before it", () => {
  assert.equal(PW.tripOf("2026-11-06"), "2026-11-06");
  assert.equal(PW.tripOf("2026-11-19"), "2026-11-06");
  assert.equal(PW.tripOf("2026-11-20"), "2026-11-20");
  assert.equal(PW.tripOf("2026-10-01"), "2026-11-06"); // before anchor clamps to anchor
});
test("nextCookDay: today when it is cook day, otherwise the next cycle", () => {
  assert.equal(PW.nextCookDay("2026-11-20"), "2026-11-20");
  assert.equal(PW.nextCookDay("2026-11-21"), "2026-12-04");
  assert.equal(PW.nextCookDay("2026-11-09"), "2026-11-20");
  assert.equal(PW.nextCookDay("2026-10-01"), "2026-11-06");
});
test("anchor is a Friday", () => assert.equal(PW.parse(PW.ANCHOR).getDay(), 5));
test("greeting by hour", () => {
  assert.equal(PW.greeting(8), "Good morning");
  assert.equal(PW.greeting(14), "Good afternoon");
  assert.equal(PW.greeting(20), "Good evening");
});

/* ---------- Ingredient scaling ---------- */
test("scaleAmt: identity at 1x and for empty input", () => {
  assert.equal(PW.scaleAmt("1,500 g", 1), "1,500 g");
  assert.equal(PW.scaleAmt("", 2), "");
});
test("scaleAmt: scales plain, comma and decimal numbers", () => {
  assert.equal(PW.scaleAmt("1,500 g", 2), "3,000 g");
  assert.equal(PW.scaleAmt("288 g", 0.5), "144 g");
  assert.equal(PW.scaleAmt("48 g", 1.5), "72 g");
  assert.equal(PW.scaleAmt("2.5 g", 2), "5 g");
  assert.equal(PW.scaleAmt("5", 1.5), "7.5");
});
test("scaleAmt: scales both ends of a range, leaves words alone", () => {
  assert.equal(PW.scaleAmt("300–400 g", 2), "600–800 g");
  assert.equal(PW.scaleAmt("to taste", 2), "to taste");
  assert.equal(PW.scaleAmt("a little", 0.5), "a little");
});
test("stepParts extracts [N min] timers", () => {
  assert.deepEqual(PW.stepParts("Rest the batter. [8 min]"), { text: "Rest the batter.", min: 8 });
  assert.deepEqual(PW.stepParts("Bake [12.5 min] until golden"), { text: "Bake until golden", min: 12.5 });
  assert.deepEqual(PW.stepParts("Stir well"), { text: "Stir well", min: null });
});

/* ---------- Grocery calculations ---------- */
const LIST = [
  ["a", "HOFER", "Eggs", "18", 8.37, "store", {}],
  ["b", "HOFER", "Oats", "1", 0.95, "est", {}],
  ["c", "SPAR", "Chicken", "6", 26.94, "offer", {}],
  ["p", "PANTRY", "Salt", "1", 0.39, "est", {}],
  ["q", "PANTRY", "Cumin", "1", 1.29, "est", {}]
];
test("tripTotals: nothing ticked", () => {
  const t = PW.tripTotals(LIST, {});
  assert.equal(PW.eur(t.planned), "€36.26"); // pantry excluded
  assert.equal(PW.eur(t.left), "€36.26");
  assert.equal(t.done, 0);
  assert.equal(t.total, 5);
});
test("tripTotals: have, bought with price, bought without price (estimate)", () => {
  const t = PW.tripTotals(LIST, {
    a: { status: "have" },
    b: { status: "bought", paid: 0.89 },
    c: { status: "bought", paid: null },
    p: { status: "have" }
  });
  assert.equal(PW.eur(t.have), "€8.76"); // eggs + salt
  assert.equal(PW.eur(t.spent), "€27.83"); // 0.89 + planned chicken price
  assert.equal(t.est, true);
  assert.equal(t.done, 4);
  assert.equal(PW.eur(t.left), "€0.00");
});
test("tripTotals: pantry items never count toward 'still to buy'", () => {
  const t = PW.tripTotals(LIST, { a: { status: "have" }, b: { status: "have" }, c: { status: "have" } });
  assert.equal(PW.eur(t.left), "€0.00");
});
test("eur rounds to cents", () => assert.equal(PW.eur(1.005 + 1.1), "€2.11"));
test("num parses European decimals and junk", () => {
  assert.equal(PW.num("2,49"), 2.49);
  assert.equal(PW.num("€ 3.5"), 3.5);
  assert.equal(PW.num("abc"), null);
});

/* ---------- Body maths ---------- */
test("bodyStats: Mifflin–St Jeor for male and female", () => {
  const m = PW.bodyStats({ sex: "male", age: 30, height: 180, weight: 80, activity: "1.55" });
  assert.equal(Math.round(m.bmr), 1780);
  assert.equal(Math.round(m.tdee), 2759);
  const f = PW.bodyStats({ sex: "female", age: 30, height: 165, weight: 60 });
  assert.equal(Math.round(f.bmr), 1320);
  assert.equal(Math.round(f.tdee), 1815); // default activity 1.375
});
test("bodyStats: null until the four required fields exist", () => {
  assert.equal(PW.bodyStats({ sex: "male", age: 30, height: 180 }), null);
  assert.equal(PW.bodyStats(undefined), null);
});

/* ---------- Persistence and migration ---------- */
function fakeStorage() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; }

test("state survives a save/load round trip through storage", () => {
  const st = fakeStorage();
  const s = {
    items: { "2026-11-06": { eggs: { status: "bought", paid: 8.37, store: "HOFER" } } },
    settings: { weight: "80", recipes: { Cajun: { kcal: 400 } }, customItems: [{ id: "u-1", name: "Tea" }], hiddenItems: ["oats"] },
    log: { "2026-11-09": { breakfast: { meal: "Burritos", eaten: true, kcal: null } } },
    weights: { "2026-11-09": 80.4 }
  };
  st.setItem(PW.LKEY, PW.serializeLocal(s));
  assert.deepEqual(PW.normalizeLocal(st.getItem(PW.LKEY)), s);
});
test("storage key is unchanged (renaming it would orphan user data)", () => assert.equal(PW.LKEY, "prepwise-local-v1"));
test("legacy save with only some keys still loads", () => {
  const out = PW.normalizeLocal(JSON.stringify({ items: { "2026-11-06": { eggs: { status: "have" } } } }));
  assert.deepEqual(out.settings, {});
  assert.deepEqual(out.log, {});
  assert.deepEqual(out.weights, {});
  assert.equal(out.items["2026-11-06"].eggs.status, "have");
});
test("unknown extra keys in a save are ignored, not fatal", () => {
  const out = PW.normalizeLocal(JSON.stringify({ items: {}, theme: "dark", futureThing: [1] }));
  assert.deepEqual(Object.keys(out).sort(), ["items", "log", "settings", "weights"]);
});
test("corrupt, empty or wrong-typed storage falls back to empty state", () => {
  const empty = PW.emptyState();
  assert.deepEqual(PW.normalizeLocal(null), empty);
  assert.deepEqual(PW.normalizeLocal("{not json"), empty);
  assert.deepEqual(PW.normalizeLocal("[]"), empty);
  assert.deepEqual(PW.normalizeLocal("42"), empty);
  assert.deepEqual(PW.normalizeLocal(JSON.stringify({ items: [], settings: "x", log: null, weights: 5 })), empty);
});
test("mapCloud converts mp_* rows to app state exactly as before", () => {
  const out = PW.mapCloud(
    [{ trip_date: "2026-11-06", item_id: "eggs", status: "bought", paid: "8.37", store: "HOFER" },
     { trip_date: "2026-11-06", item_id: "oats", status: null, paid: null, store: null }],
    { data: { weight: "80" } },
    [{ day: "2026-11-09", slot: "dinner", meal: "Cajun", eaten: true, kcal: null }],
    [{ day: "2026-11-09", kg: "80.4" }]
  );
  assert.deepEqual(out.items["2026-11-06"].eggs, { status: "bought", paid: 8.37, store: "HOFER" });
  assert.deepEqual(out.items["2026-11-06"].oats, { status: "", paid: null, store: "" });
  assert.deepEqual(out.settings, { weight: "80" });
  assert.deepEqual(out.log["2026-11-09"].dinner, { meal: "Cajun", eaten: true, kcal: null });
  assert.equal(out.weights["2026-11-09"], 80.4);
});
test("mapCloud copes with empty results", () => {
  assert.deepEqual(PW.mapCloud(null, null, null, null), PW.emptyState());
});

/* ---------- Owner's recipes must not change by accident ---------- */
test("recipes.js is byte-identical to the owner's agreed version", () => {
  const buf = fs.readFileSync(path.join(__dirname, "..", "recipes.js"));
  const lf = Buffer.from(buf.toString("utf8").replace(/
/g, "
")); // same hash whether git checked out LF or CRLF
  const sha = crypto.createHash("sha256").update(lf).digest("hex");
  // Update this hash only when the owner deliberately changes a default recipe.
  assert.equal(sha, "0517631cc3188fe2a87a4838cc367c9b03ebadcf7322e84d70f5ea2285b90d94");
});
test("every default recipe has the fields the app relies on", () => {
  global.window = {};
  require("../recipes.js");
  const R = global.window.DEFAULT_RECIPES;
  assert.equal(Object.keys(R).length, 6);
  for (const [id, r] of Object.entries(R)) {
    assert.ok(r.name && r.slot, id + " name/slot");
    assert.ok(Array.isArray(r.ingredients) && r.ingredients.length, id + " ingredients");
    assert.ok(Array.isArray(r.steps) && r.steps.length, id + " steps");
    assert.ok(Number(r.serves) >= 1, id + " serves");
  }
  delete global.window;
});
