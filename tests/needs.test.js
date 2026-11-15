"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const N = require("../js/needs.js");

global.window = {};
require("../recipes.js");
const RECIPES = global.window.DEFAULT_RECIPES;
delete global.window;
const ITEM_IDS = new Set([...fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8").matchAll(/^ \["([^"]+)","\w+","/gm)].map(m => m[1]));

/* ---------- Amount parsing ---------- */
test("parseRecipeAmount reads grams, kilos, millilitres, counts, ranges and approximations", () => {
  assert.deepEqual(N.parseRecipeAmount("817 g"), { min: 817, max: 817, unit: "g", approx: false });
  assert.deepEqual(N.parseRecipeAmount("1,500 g"), { min: 1500, max: 1500, unit: "g", approx: false }); // thousands comma, not a decimal
  assert.deepEqual(N.parseRecipeAmount("3 kg"), { min: 3000, max: 3000, unit: "g", approx: false });
  assert.deepEqual(N.parseRecipeAmount("300–400 g"), { min: 300, max: 400, unit: "g", approx: false });
  assert.deepEqual(N.parseRecipeAmount("~12 g"), { min: 12, max: 12, unit: "g", approx: true });
  assert.deepEqual(N.parseRecipeAmount("~480–520 ml"), { min: 480, max: 520, unit: "ml", approx: true });
  assert.deepEqual(N.parseRecipeAmount("16"), { min: 16, max: 16, unit: "count", approx: false });
  assert.deepEqual(N.parseRecipeAmount("½"), { min: 0.5, max: 0.5, unit: "count", approx: false });
  assert.deepEqual(N.parseRecipeAmount("6.4 g"), { min: 6.4, max: 6.4, unit: "g", approx: false });
});
test("parseRecipeAmount returns null instead of guessing", () => {
  for (const bad of ["to taste", "a little", "1 small", "1 tsp", "½–1 tsp", "", null, "0 g", "400–300 g", "2 cups"]) assert.equal(N.parseRecipeAmount(bad), null, String(bad));
});

/* ---------- The mapping itself ---------- */
test("every ingredient line of every default recipe is mapped or deliberately skipped", () => {
  const r = N.needsFor(RECIPES);
  assert.deepEqual(r.unmapped, []);
  assert.ok(r.skipped.length >= 4, "water, spice mixes and the shared potato batch are skipped on purpose");
  r.skipped.forEach(s => assert.ok(s.reason, "every skip has a reason"));
});
test("every mapped target is a real grocery item id", () => {
  for (const [rid, m] of Object.entries(N.MAP)) for (const [name, t] of Object.entries(m)) if (typeof t === "string") assert.ok(ITEM_IDS.has(t), `${rid}: "${name}" -> ${t}`);
});
test("the mapping contains no stale ingredient names", () => {
  for (const [rid, m] of Object.entries(N.MAP)) {
    const names = new Set((RECIPES[rid] || { ingredients: [] }).ingredients.map(i => i[1]));
    for (const name of Object.keys(m)) assert.ok(names.has(name), `${rid}: "${name}" is not in recipes.js`);
  }
});

/* ---------- Totals ---------- */
const R = N.needsFor(RECIPES);
test("chicken across the four dinners matches the agreed 3,300 g split", () => {
  assert.deepEqual(R.items.chicken.total, { min: 3300, max: 3300, unit: "g" });
  assert.equal(R.items.chicken.parts.length, 4);
  assert.equal(N.fmtNeed(R.items.chicken.total), "3.3 kg");
});
test("potatoes are counted once (Cajun uses the Burritos batch)", () => {
  assert.deepEqual(R.items.potato.total, { min: 3000, max: 3000, unit: "g" });
  assert.ok(R.skipped.some(s => s.recipe === "Cajun" && /potato/i.test(s.name)));
});
test("evaporated milk sums three recipes, one of them a range", () => {
  assert.deepEqual(R.items.evap.total, { min: 550, max: 570, unit: "ml" }); // 200 + 300 + 50–70
  assert.equal(N.fmtNeed(R.items.evap.total), "550 ml–570 ml");
});
test("counts add up: eggs, tortillas, bananas", () => {
  assert.equal(R.items.eggs.total.min, 16);
  assert.equal(R.items.tortilla.total.min, 16);
  assert.equal(R.items.banana.total.min, 5);
  assert.equal(R.items.eggs.total.unit, "count");
});
test("an item with unreadable lines keeps the readable total and lists the rest, never invents a number", () => {
  const onion = R.items.onion; // Burritos 225 g, Middle Eastern 100–120 g readable; Cajun and Alfredo "1 small"
  assert.deepEqual(onion.total, { min: 325, max: 345, unit: "g" });
  assert.equal(onion.unreadable.length, 2);
  onion.unreadable.forEach(u => assert.equal(u.amount, "1 small"));
});
test("mixed units are never added together", () => {
  const r = N.needsFor({ X: { ingredients: [["2 kg", "Chicken breast"], ["3", "Chicken breast"]] } });
  // X is not in MAP, so both lines are unmapped; prove the rule with a synthetic map instead
  assert.equal(r.unmapped.length, 2);
  const saved = N.MAP.X;
  N.MAP.X = { "Chicken breast": "chicken", "Eggs": "chicken" };
  const r2 = N.needsFor({ X: { ingredients: [["2 kg", "Chicken breast"], ["3", "Eggs"]] } });
  delete N.MAP.X; if (saved) N.MAP.X = saved;
  assert.equal(r2.items.chicken.total, null);
  assert.deepEqual(r2.items.chicken.mixedUnits.sort(), ["count", "g"]);
});
test("approximate inputs mark the total as approximate", () => {
  assert.equal(R.items["p-oil"].approx, true); // "~12 g", "~8 g", "4–8 g", "10–15 g"
  assert.equal(R.items.chicken.approx, false);
});

/* ---------- Scaling and edits ---------- */
test("scaling a recipe scales only its own lines", () => {
  const r = N.needsFor(RECIPES, { Cajun: 2 });
  assert.equal(r.items.chicken.total.min, 3300 + 817);
  assert.equal(r.items.herbcc.total.min, 240);
  assert.equal(r.items.eggs.total.min, 16);
  assert.equal(N.needsFor(RECIPES, { Cajun: 0 }).items.chicken.total.min, 3300, "a non-positive scale falls back to 1");
});
test("an edited ingredient line is reported as unmapped, not guessed", () => {
  const edited = JSON.parse(JSON.stringify(RECIPES));
  edited.Cajun.ingredients[0] = ["900 g", "Chicken thigh"];
  const r = N.needsFor(edited);
  assert.deepEqual(r.unmapped, [{ recipe: "Cajun", name: "Chicken thigh", amount: "900 g" }]);
  assert.equal(r.items.chicken.total.min, 3300 - 817);
});
test("a user's own recipe (no mapping) is fully reported as unmapped", () => {
  const r = N.needsFor({ "r-abc": { ingredients: [["200 g", "Tofu"], ["1", "Lime"]] } });
  assert.equal(r.unmapped.length, 2);
  assert.deepEqual(r.items, {});
});
test("fmtNeed", () => {
  assert.equal(N.fmtNeed({ min: 288, max: 288, unit: "g" }), "288 g");
  assert.equal(N.fmtNeed({ min: 16, max: 16, unit: "count" }), "16");
  assert.equal(N.fmtNeed({ min: 1500, max: 1500, unit: "ml" }), "1.5 L");
  assert.equal(N.fmtNeed(null), "");
});
test("privacy: the module has no DOM, storage or network access", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "needs.js"), "utf8");
  for (const w of ["fetch(", "localStorage", "document.", "navigator", "XMLHttpRequest"]) assert.ok(!src.includes(w), w);
});
