"use strict";
/* XSS regression tests.
   Runs the real js/app.js in a vm sandbox with a stub DOM, fills every user-controlled field with attack
   strings, renders every view, and checks that no attack string survives as live markup.
   The attack strings only become dangerous if they reach the HTML unescaped:
     P breaks out of a tag/attribute and opens a new tag, Q and R break out of double/single quoted attributes. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

const P = '"><b id=PWNA>', Q = '" autofocus onfocus=PWNB x="', R = "' autofocus onfocus=PWNC x='";
const LEAKS = ["<b id=PWNA>", '" autofocus onfocus=PWNB', "' autofocus onfocus=PWNC"];

function stub() {
  return new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : stub()),
    apply: () => stub(), construct: () => stub(), set: () => true
  });
}
function boot(storedJson) {
  const store = { "prepwise-local-v1": storedJson };
  const ctx = {
    document: stub(), console, Math, JSON, Date, Object, Array, String, Number, parseFloat, isNaN, isFinite, Promise, Set, Map, Symbol, Intl, Buffer,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, get length() { return 0; }, key: () => null },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    setTimeout: () => 0, clearInterval() {}, setInterval: () => 0, addEventListener() {}, scrollTo() {},
    navigator: {}, location: { origin: "http://x", pathname: "/" }
  };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  for (const f of ["recipes.js", "js/core.js", "js/prices.js", "js/app.js"]) vm.runInContext(read(f), ctx, { filename: f });
  return ctx;
}

const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const evilRecipe = n => ({ name: n, slot: Q, serves: R, servingLabel: P, time: Q, kcal: P, p: Q, c: R, f: P, fib: Q,
  oven: [[P, Q]], ingredients: [[P, Q], [R, P]], steps: [P + " [5 min]", Q], portion: [P, Q], storage: [R], notes: P });

function hostileState(td) {
  return {
    items: { [P]: { [Q]: { status: R, paid: P, store: Q } }, [td]: { chicken: { status: "bought", paid: "oops", store: P }, [R]: { status: Q } } },
    settings: {
      displayName: P, extraKcal: Q, sex: R, age: P, height: Q, weight: R, goal: P, activity: Q,
      plan: { breakfast: Q, lunch: R },
      recipes: { evil: evilRecipe(P), [Q]: evilRecipe(R), Pancakes: { name: P, servingLabel: Q } },
      customItems: [{ id: Q, name: P, buy: R, price: P, store: Q }, { id: R, name: Q, buy: P, price: R, store: "NOPE" + P }],
<<<<<<< HEAD
      hiddenItems: [P], tripBudgets: { [td]: P, [P]: Q, x: R }
=======
      hiddenItems: [P],
      priceLog: [
        { id: R, item: Q, name: P, store: R, total: 1, amount: Q, base: 1, unit: "kg", price: 1, date: td, cur: "EUR", promo: 0 },
        { id: Q, item: Q, name: P, store: P, total: 2, amount: R, base: 1, unit: "kg", price: 2, date: td, cur: "EUR", promo: 1 }
      ]
>>>>>>> ab900ec (2.4 price history: normalised unit prices, cheapest recorded store (WIP))
    },
    log: { [td]: { breakfast: { meal: P, eaten: true }, lunch: { meal: Q }, dinner: { meal: R, eaten: true }, extra: { kcal: Q } }, [P]: { dinner: { meal: R } } },
    weights: { [P]: 80, [td]: 81 }
  };
}

function renderEverything() {
  const td = today();
  const ctx = boot(JSON.stringify(hostileState(td)));
  const S = vm.runInContext("S", ctx);
  Object.assign(S, hostileState(td));
  S.user = { id: "u", email: P };
  const out = {};
  const call = (name, fn) => { try { out[name] = String(fn()); } catch (e) { out[name] = ""; out[name + " THREW"] = e.stack; } };
  call("home", () => ctx.viewHome());
  call("tripOptions", () => ctx.tripOptions(P));
  for (const group of ["store", "meal"]) for (const editList of [false, true]) {
    S.group = group; S.editList = editList;
    call(`shop ${group} edit=${editList}`, () => ctx.viewShop());
    for (const trip of [td, P]) { S.trip = trip; call(`shop ${group} edit=${editList} trip`, () => ctx.viewShop()); }
  }
  S.trip = td; S.editList = false;
  S.pricesOpen = true; S.priceItem = Q;
  call("shop prices open", () => ctx.viewShop());
  S.priceDraft = { itemKey: Q, itemName: P, other: true, store: R, total: P, amount: Q, date: Q, promo: true, id: R };
  call("shop price draft", () => ctx.viewShop());
  S.priceDraft = null; S.pricesOpen = false;
  call("meals", () => ctx.viewMeals());
  call("cooking list", () => { S.recipe = null; S.editRecipe = null; return ctx.viewCooking(); });
  for (const id of ["evil", Q, "Pancakes"]) {
    for (const scale of [1, 1.5]) call(`recipe ${id.slice(0, 6)} x${scale}`, () => { S.scale = scale; return ctx.viewRecipe(vm.runInContext("R()", ctx)[id]); });
    call(`edit ${id.slice(0, 6)}`, () => { S.editRecipe = id; return ctx.viewEdit(); });
  }
  S.editRecipe = null;
  call("progress", () => ctx.viewProgress());
  call("cook day", () => ctx.viewCook());
  return out;
}

test("hostile user data never becomes live markup in any view", () => {
  const out = renderEverything();
  const leaks = [];
  for (const [view, html] of Object.entries(out)) for (const bad of LEAKS) if (html.includes(bad)) leaks.push(`${view}: ${bad}`);
  assert.deepEqual(leaks, []);
});
test("the test really exercises the escaping (escaped payloads are present)", () => {
  const out = renderEverything();
  assert.ok(out.home.includes("&lt;b id=PWNA&gt;"), "display name should appear escaped on Home");
  assert.ok(out["cook day"].includes("&lt;b id=PWNA&gt;"), "email/recipe names should appear escaped");
  assert.ok(out["shop meal edit=true"].includes("&quot; autofocus onfocus=PWNB"), "custom item names should appear escaped");
  assert.ok(out["shop prices open"].includes("&lt;b id=PWNA&gt;"), "price history names should appear escaped");
  assert.ok(out["shop price draft"].includes("&quot; autofocus onfocus=PWNB"), "price form draft should appear escaped");
});
test("tampered data does not crash any view", () => {
  const threw = Object.keys(renderEverything()).filter(k => k.endsWith("THREW"));
  assert.deepEqual(threw, []);
});
test("toasts and status text use textContent, not innerHTML", () => {
  const app = read("js/app.js");
  assert.match(app, /t\.textContent=msg/);
  assert.match(app, /\$\("#si-msg"\)\.textContent=/);
});
test("every innerHTML assignment in app.js is accounted for", () => {
  // Reviewed sinks: render() main, timers box, chart svg, theme icon. Adding a new one must be a conscious decision.
  const count = (read("js/app.js").match(/\.innerHTML\s*=/g) || []).length;
  assert.equal(count, 5);
});

/* ---------- Prototype-key and numeric hardening in core.js ---------- */
const PW = require("../js/core.js");
test("normalizeLocal strips prototype-reaching keys", () => {
  const raw = '{"items":{"__proto__":{"polluted":true},"2026-11-06":{"constructor":{"x":1},"eggs":{"status":"have"}}},"settings":{"__proto__":{"admin":1}},"log":{},"weights":{}}';
  const out = PW.normalizeLocal(raw);
  assert.equal(({}).polluted, undefined);
  assert.equal(({}).admin, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(out.items, "__proto__"), false);
  assert.deepEqual(Object.keys(out.items["2026-11-06"]), ["eggs"]);
});
test("normalizeLocal keeps only numeric weights", () => {
  const out = PW.normalizeLocal(JSON.stringify({ weights: { "2026-11-01": 80.5, "2026-11-02": "81", a: "<b>", b: null, c: "" } }));
  assert.deepEqual(out.weights, { "2026-11-01": 80.5, "2026-11-02": 81 });
});
test("mapCloud skips rows with prototype keys and non-numeric weights", () => {
  const out = PW.mapCloud(
    [{ trip_date: "__proto__", item_id: "x", status: "have" }, { trip_date: "2026-11-06", item_id: "constructor", status: "have" }, { trip_date: "2026-11-06", item_id: "eggs", status: "have" }],
    { data: { __proto__: { evil: 1 }, ok: 1 } },
    [{ day: "__proto__", slot: "dinner", meal: "x", eaten: true }],
    [{ day: "2026-11-01", kg: "abc" }, { day: "2026-11-02", kg: "80" }]
  );
  assert.equal(({}).x, undefined);
  assert.deepEqual(Object.keys(out.items["2026-11-06"]), ["eggs"]);
  assert.deepEqual(out.weights, { "2026-11-02": 80 });
});

/* ---------- Budget card (Prepwise 2.2) ---------- */
test("budget card shows status from settings and ignores unparseable stored budgets", () => {
  const td = today(), ctx = boot("{}"), S = vm.runInContext("S", ctx);
  S.trip = td; S.editList = false; S.group = "store";
  S.settings.tripBudgets = { [td]: 500 };
  const html = String(ctx.viewShop());
  assert.match(html, /id="trip-budget"[^>]*value="500"/);
  assert.match(html, /under budget/);
  S.settings.tripBudgets = { [td]: P };
  const bad = String(ctx.viewShop());
  assert.match(bad, /id="trip-budget"[^>]*value=""/);
  assert.ok(!/over budget|under budget/.test(bad));
});
test("budget forecast excludes pantry items in the rendered card", () => {
  const td = today(), ctx = boot("{}"), S = vm.runInContext("S", ctx);
  S.trip = td; S.settings.tripBudgets = { [td]: 1000 };
  const eur = vm.runInContext("eur", ctx), t = ctx.tripTotals(td); // left excludes PANTRY
  const html = String(ctx.viewShop());
  assert.ok(html.includes(eur(t.left) + " still to buy"));
  assert.match(html, /Pantry items are not counted/);
});
