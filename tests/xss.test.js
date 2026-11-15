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
    navigator: {}, location: { origin: "http://x", pathname: "/" }, URL: Object.assign(class extends URL {}, { revokeObjectURL() {}, createObjectURL: () => "blob:x" }), CSS: { escape: s => s }
  };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  for (const f of ["recipes.js", "js/core.js", "js/prices.js", "js/recs.js", "js/photos.js", "js/barcode.js", "js/app.js"]) vm.runInContext(read(f), ctx, { filename: f });
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
      customItems: [{ id: Q, name: P, buy: R, price: P, store: Q, imageUrl: "javascript:alert(1)" }, { id: R, name: Q, buy: P, price: R, store: "NOPE" + P, imageUrl: "https://example.com/a.png" + P }, { id: "u3", name: "Tea", buy: "1", price: 1, store: "LIDL", imageUrl: "https://user:pw@example.com/x.png" }, { id: "u4", name: "Rice", buy: "1", price: 1, store: "LIDL", imageUrl: "https://example.com/a.png" + P }],
      hiddenItems: [P], tripBudgets: { [td]: P, [P]: Q, x: R },
      priceLog: [
        { id: R, item: Q, name: P, store: R, total: 1, amount: Q, base: 1, unit: "kg", price: 1, date: td, cur: "EUR", promo: 0 },
        { id: Q, item: Q, name: P, store: P, total: 2, amount: R, base: 1, unit: "kg", price: 2, date: td, cur: "EUR", promo: 1 },
        { id: "c1", item: "chicken", name: P, store: "SPAR", total: 10, amount: "1 kg", base: 1, unit: "kg", price: 10, date: td, cur: "EUR", promo: 0 },
        { id: "c2", item: "chicken", name: Q, store: P, total: 5, amount: "1 kg", base: 1, unit: "kg", price: 5, date: td, cur: "EUR", promo: 0 },
        { id: "c3", item: "chicken", name: R, store: R, total: 6, amount: "1 kg", base: 1, unit: "kg", price: 6, date: td, cur: "EUR", promo: 0 }
      ],
      recExclude: [Q, 5], recStopCost: P
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
  call("shop recs", () => ctx.viewShop());
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
  assert.ok(out["shop recs"].includes("&lt;b id=PWNA&gt;") && out["shop recs"].includes("extra stop"), "recommendation store names should appear escaped");
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
  // Reviewed sinks: render() main, timers box, chart svg (2), theme icon, price-photo preview box, Commons photo chooser (2). Adding a new one must be a conscious decision.
  const count = (read("js/app.js").match(/\.innerHTML\s*=/g) || []).length;
  assert.equal(count, 8);
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

/* ---------- Recommendations card (2.5) ---------- */
test("recommendations card is honest: past prices, dates, no live-price claims, opt-out works", () => {
  const td = today(), ctx = boot("{}"), S = vm.runInContext("S", ctx);
  S.trip = td;
  const noHist = String(ctx.viewShop());
  assert.match(noHist, /No price history yet/);
  S.settings.priceLog = [
    { id: "a", item: "chicken", name: "Chicken", store: "SPAR / INTERSPAR", total: 10, amount: "1 kg", base: 1, unit: "kg", price: 10, date: td, cur: "EUR", promo: 0 },
    { id: "b", item: "chicken", name: "Chicken", store: "HOFER", total: 5, amount: "1 kg", base: 1, unit: "kg", price: 5, date: td, cur: "EUR", promo: 0 }
  ];
  const html = String(ctx.viewShop());
  assert.match(html, /Possible saving/);
  assert.match(html, /not live shop prices/);
  assert.match(html, /Price recorded/);
  assert.match(html, /Some evidence/); // two entries, both from today: not high (needs 3), not low
  assert.ok(!/live price|current price|in stock/i.test(html.replace(/not live shop prices/g, "")));
  S.settings.recsOff = true;
  const off = String(ctx.viewShop());
  assert.match(off, /Recommendations are off/);
  assert.ok(!/Possible saving/.test(off));
});

/* ---------- Local photo preview (2.3 first step) ---------- */
test("photo preview: only JPG/PNG/WebP up to 5 MB are accepted; nothing else is guessed", () => {
  const ctx = boot("{}");
  const ok = { type: "image/jpeg", size: 1024, name: "a.jpg" };
  assert.equal(ctx.photoProblem(ok), "");
  assert.equal(ctx.photoProblem({ type: "image/webp", size: 5 * 1024 * 1024, name: "b.webp" }), "");
  for (const bad of [{ type: "image/heic", size: 10 }, { type: "application/pdf", size: 10 }, { type: "image/svg+xml", size: 10 }, { type: "image/jpeg", size: 0 }, { type: "image/jpeg", size: 5 * 1024 * 1024 + 1 }, { type: "", size: 10 }])
    assert.match(ctx.photoProblem(bad), /JPG, PNG or WebP/, JSON.stringify(bad));
  assert.equal(ctx.photoProblem(null), "");
});
test("photo preview never touches storage or the network and is not linked to a saved price", () => {
  const app = read("js/app.js");
  const photoCode = app.slice(app.indexOf("/* Photo preview is local-only"), app.indexOf("function viewPrices"));
  for (const w of ["localStorage", "fetch(", "sb.", "putSettings", "FileReader", "readAsDataURL", "canvas"]) assert.ok(!photoCode.includes(w), w);
  assert.ok(!/photo|image/i.test(read("js/prices.js")), "price observations carry no photo field");
  assert.match(app, /clearPricePhoto\(\);S\.priceDraft=null;S\.pricesOpen=true;S\.priceItem/, "successful save drops the preview");
  assert.ok(!/capture=/.test(app), "file input must offer the gallery as well as the camera");
});
test("photo file name and object URL are escaped in the preview markup", () => {
  const ctx = boot("{}");
  vm.runInContext(`pricePhotoUrl='blob:x"><b id=PWNA>';pricePhotoName='<b id=PWNA>"';`, ctx);
  const html = String(ctx.pricePhotoMarkup());
  for (const bad of LEAKS) assert.ok(!html.includes(bad), bad);
  assert.ok(html.includes("&lt;b id=PWNA&gt;"));
  vm.runInContext("clearPricePhoto()", ctx);
  assert.equal(String(ctx.pricePhotoMarkup()), "");
});

/* ---------- Grocery thumbnails (#10) ---------- */
test("custom image URLs: only clean https URLs are ever rendered", () => {
  const ctx = boot("{}");
  const f = ctx.safeGroceryImageUrl;
  assert.equal(f("https://example.com/a.png"), "https://example.com/a.png");
  for (const bad of ["javascript:alert(1)", "http://example.com/a.png", "data:image/png;base64,AAAA", "https://user:pw@example.com/x.png", "ftp://x/y", "//example.com/a.png", "not a url", "", null, 5, "https://" + "a".repeat(600) + ".com/x.png"])
    assert.equal(f(bad), "", String(bad));
});
test("thumbnail markup: malicious custom URLs never become active HTML; photo choice is explicit", () => {
  const td = today(), ctx = boot("{}"), S = vm.runInContext("S", ctx);
  S.trip = td; S.editList = false; S.shopFilter = "all";
  S.settings.customItems = hostileState(td).settings.customItems;
  const html = String(ctx.viewShop());
  assert.ok(html.includes('data-act="choosephoto"'), "every item has a real-photo picker");
  assert.ok(html.includes('data-photo-query='), "photos are resolved lazily, not injected into HTML");
  assert.ok(!html.includes("javascript:"), "javascript: URL must not appear in HTML");
  assert.ok(!html.includes("<b id=PWNA>"), "item names and search strings are escaped");
  assert.ok(!html.includes("grocery-thumb-fallback"), "ugly emoji illustrations are removed");
  const malicious = ctx.items().find(i => i[0] === "u3");
  assert.equal(ctx.photoRecord(malicious), null, "credential-bearing custom URL is rejected");
});
