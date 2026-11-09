/* Prepwise store recommendations (2.5): pure logic, no DOM, no network.
   Uses ONLY the user's own confirmed purchase records (js/prices.js). Every figure is a historical price with its date;
   nothing here is, or claims to be, a live shop price. Savings are only estimated when there is a recorded price at the
   store the plan already uses, so there is always a real baseline and never a guess. */
(function (root, factory) {
  const P = typeof module === "object" && module.exports ? require("./prices.js") : root.PWP;
  const api = factory(P);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PWR = api;
})(typeof self !== "undefined" ? self : this, function (P) {
  "use strict";

  const MIN_SAVING = 0.2; // euro; smaller differences are noise, not advice
  const round2 = n => Math.round(n * 100) / 100;

  /* Confidence in one price: low if it is old or the only entry; high if 3+ entries and the price is under 30 days old. */
  function confidence(group, best) {
    if (best.stale || group.count < 2) return "low";
    return group.count >= 3 && best.age <= 30 ? "high" : "medium";
  }

  /* remaining: [{id, name, store}] where store is the store label the plan uses for the item.
     opts: {log, today, exclude: [store names to ignore], stopCost: euro per extra stop (default 0)}.
     Returns {stops, staying, noBaseline, noHistory, totalSaving, weakSaving, covered, total}. */
  function recommend(remaining, opts) {
    const log = opts.log || [], today = opts.today, stopCost = Math.max(0, opts.stopCost || 0);
    const excluded = new Set((opts.exclude || []).map(P.storeKey));
    const plannedKeys = new Set(remaining.map(r => P.storeKey(r.store)).filter(Boolean));

    const entries = [], noHistory = [];
    remaining.forEach(r => {
      const groups = P.compareItem(log, r.id, today);
      if (!groups.length) return noHistory.push(r);
      // typical amount = what you bought last time, in the unit group of your most recent purchase
      const latest = log.filter(o => o.item === r.id).reduce((a, o) => (!a || o.date >= a.date ? o : a) /* same day: the entry added last */, null);
      const g = groups.find(x => x.unit === latest.unit && x.cur === latest.cur);
      const stores = g.stores.filter(s => !excluded.has(P.storeKey(s.store)));
      if (!stores.length) return noHistory.push(r);
      const planned = stores.find(s => P.storeKey(s.store) === P.storeKey(r.store)) || null;
      entries.push({ r, g, qty: latest.base, stores, planned, conf: null });
    });

    // choose a store per item; drop optional stops whose total saving does not cover the cost of the extra stop
    const dropped = new Set();
    const pick = e => {
      const open = e.stores.filter(s => !dropped.has(P.storeKey(s.store)) || P.storeKey(s.store) === P.storeKey(e.r.store));
      return open[0] || e.planned || e.stores[0];
    };
    const evaluate = () => entries.map(e => {
      const best = pick(e), baseline = e.planned;
      const isPlanned = P.storeKey(best.store) === P.storeKey(e.r.store);
      const saving = baseline && !isPlanned ? round2((baseline.price - best.price) * e.qty) : 0;
      return { e, best, baseline, isPlanned, saving };
    });
    let evald = evaluate();
    for (;;) {
      const perStore = new Map();
      evald.filter(x => !x.isPlanned && x.baseline && x.saving >= MIN_SAVING).forEach(x => perStore.set(P.storeKey(x.best.store), (perStore.get(P.storeKey(x.best.store)) || 0) + x.saving));
      const optional = [...perStore.entries()].filter(([k, s]) => !plannedKeys.has(k) && s < stopCost).sort((a, b) => a[1] - b[1]);
      if (!optional.length) break;
      dropped.add(optional[0][0]);
      evald = evaluate();
    }

    const view = x => ({
      id: x.e.r.id, name: x.e.r.name, plannedStore: x.e.r.store, store: x.best.store, unit: x.e.g.unit, qty: x.e.qty,
      price: x.best.price, date: x.best.date, age: x.best.age, stale: x.best.stale, confidence: confidence(x.e.g, x.best),
      baselinePrice: x.baseline ? x.baseline.price : null, baselineDate: x.baseline ? x.baseline.date : null,
      estCost: round2(x.best.price * x.e.qty), saving: x.saving, entries: x.e.g.count
    });
    const stopsMap = new Map(), staying = [], noBaseline = [];
    evald.forEach(x => {
      const v = view(x);
      if (!x.baseline) return noBaseline.push(v);
      if (x.isPlanned || x.saving < MIN_SAVING) return staying.push(v);
      const k = P.storeKey(x.best.store);
      if (!stopsMap.has(k)) stopsMap.set(k, { store: x.best.store, items: [], saving: 0, optional: !plannedKeys.has(k) });
      const s = stopsMap.get(k); s.items.push(v); s.saving = round2(s.saving + v.saving);
    });
    const stops = [...stopsMap.values()].sort((a, b) => b.saving - a.saving);
    const all = stops.flatMap(s => s.items);
    return { stops, staying, noBaseline, noHistory,
      totalSaving: round2(all.filter(i => i.confidence !== "low").reduce((a, i) => a + i.saving, 0)),
      weakSaving: round2(all.filter(i => i.confidence === "low").reduce((a, i) => a + i.saving, 0)),
      covered: entries.length, total: remaining.length };
  }

  return { MIN_SAVING, recommend, confidence };
});
