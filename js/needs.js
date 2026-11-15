/* Prepwise recipe needs: which grocery item each default-recipe ingredient line buys, and how much of it
   the whole plan needs. Pure logic, no DOM. Loaded as a classic script (window.PWN) and with require() in tests.

   The mapping is keyed by the ingredient's name text as written in recipes.js, not by position, so a reordered
   recipe still maps and an edited line simply stops matching (it is then reported as unmapped, never guessed).
   null = deliberately not a grocery need (tap water, a "to taste" spice mix, a shared batch counted elsewhere). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PWN = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SHARED_POTATOES = "cooked weight taken from the Burritos 3 kg potato batch";
  const SPICE_MIX = "pantry seasoning mix, not purchased per recipe";
  const WATER = "tap water";

  /* recipe id -> { ingredient name -> grocery item id | { skip: reason } } */
  const MAP = {
    Pancakes: {
      "Liquid egg white (3 bottles)": "eiklar", "Magertopfen or Skyr": "topfen", "Oats, blended to flour": "oats", "Baking powder": "bp",
      "Ripe bananas, peeled and mashed (500–600 g)": "banana", "Milk": "milk", "Vanilla": "p-vanilla", "Cinnamon": "p-cinnamon", "Salt": "p-salt",
      "Sweetener (less than usual; banana sweetens)": "p-sweet", "Cooking spray": "p-spray"
    },
    Burritos: {
      "Large tortillas": "tortilla", "Beef mince, 100% beef": "beef", "Potatoes (shared with the Cajun meal: 722 g cooked goes to burritos)": "potato",
      "Oil for the potatoes": "p-oil", "Onion, finely chopped": "onion", "Garlic cloves, minced": "garlic", "Tomato paste": "paste",
      "Worcestershire sauce": "worc", "Eggs": "eggs", "Cottage cheese": "cottage", "Sriracha mayo (20 g per burrito)": "sriracha", "Chives, chopped": "chives",
      "Smoked paprika, garlic powder, onion powder, chilli powder, Italian herbs, salt, pepper": { skip: SPICE_MIX }
    },
    Cajun: {
      "Chicken breast": "chicken", "Roasted potatoes, cooked (from the 3 kg batch)": { skip: SHARED_POTATOES }, "Frozen mixed vegetables": "veg",
      "Light evaporated milk": "evap", "Light herb/garlic cream cheese": "herbcc", "Tomato paste": "paste", "Onion, finely chopped": "onion", "Butter": "butter",
      "Cajun seasoning, paprika, garlic powder, onion powder, Italian herbs, salt, pepper": { skip: SPICE_MIX }
    },
    Alfredo: {
      "Chicken breast": "chicken", "Dry pasta or spaghetti": "pasta", "Passata": "passata", "Light evaporated milk": "evap", "Light cream cheese, plain": "cc",
      "Grated Parmesan or Grana": "parm", "Frozen mixed vegetables": "veg", "Onion, finely chopped": "onion", "Garlic cloves, minced": "garlic", "Light butter": "butter",
      "Italian herbs, garlic powder, paprika, salt, pepper; chilli flakes optional": { skip: SPICE_MIX }
    },
    "Middle Eastern": {
      "Chicken breast": "chicken", "Paprika": "p-paprika", "Garlic powder": "p-garlicp", "Onion powder": "p-onionp", "Cumin": "p-cumin", "Oregano": "p-oregano",
      "Dried parsley": "p-parsley", "Salt": "p-salt", "Tomato paste": "paste", "Honey": "p-honey", "Olive oil": "p-oil", "Lemon, juiced": "lemon",
      "Dry basmati rice": "rice", "Water (check the rice package)": { skip: WATER }, "Butter": "butter", "Onion, finely chopped": "onion", "Turmeric": "p-turmeric",
      "Paprika (rice)": "p-paprika", "Cumin (rice)": "p-cumin", "Italian herbs": "p-italian", "Tomatoes (salad, made fresh per bowl)": "tomato",
      "Spring onion": "spring", "Fresh parsley": "parsley", "Yogurt (sauce)": "yogurt", "Light mayo (sauce)": "mayo", "Chilli-garlic sauce": "chilli",
      "Evaporated milk (sauce)": "evap"
    },
    Mexican: {
      "Chicken breast": "chicken", "Paprika": "p-paprika", "Cumin": "p-cumin", "Garlic powder": "p-garlicp", "Onion powder": "p-onionp", "Chilli powder": "p-chilli",
      "Salt": "p-salt", "Olive oil (chicken)": "p-oil", "Lime, juiced (chicken)": "lime", "Dry basmati rice": "rice", "Water (check the rice package)": { skip: WATER },
      "Sweetcorn, drained": "corn", "Red pepper, diced": "pepper", "Red onion, diced": "redonion", "Olive oil (corn)": "p-oil", "Fresh coriander": "coriander",
      "Yogurt (sauce)": "yogurt", "Light mayo (sauce)": "mayo", "Lime, juiced (sauce)": "lime"
    }
  };

  /* Recipe amounts as written: "817 g", "1,500 g" (thousands comma), "3 kg", "300–400 g", "~12 g", "16", "½".
     Returns {min,max,unit,approx} with unit "g", "ml" or "count", or null when it cannot be read as a quantity
     ("to taste", "1 small", "1 tsp", "a little"). Volumes and masses are kept apart; nothing is converted by density. */
  function parseRecipeAmount(text) {
    let t = String(text == null ? "" : text).trim().toLowerCase();
    const approx = /^~|^about /.test(t);
    t = t.replace(/^~|^about /, "").replace(/,(?=\d{3}\b)/g, "").replace("½", "0.5").replace("¼", "0.25").replace("¾", "0.75");
    const m = t.match(/^(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(kg|g|ml|l)?$/);
    if (!m) return null;
    const a = parseFloat(m[1]), b = m[2] ? parseFloat(m[2]) : a, u = m[3] || "";
    if (!(a > 0) || b < a) return null;
    const f = u === "kg" || u === "l" ? 1000 : 1;
    return { min: a * f, max: b * f, unit: u === "kg" || u === "g" ? "g" : u === "l" || u === "ml" ? "ml" : "count", approx };
  }

  /* recipes: the merged recipe map (R()). scales: {recipeId: factor}, default 1.
     Returns { items: { itemId: { total:{min,max,unit}|null, approx, parts:[{recipe,amount,parsed}], unreadable:[{recipe,amount,name}], mixedUnits:[unit...] } },
               unmapped: [{recipe,name,amount}], skipped: [{recipe,name,reason}] } */
  function needsFor(recipes, scales) {
    scales = scales || {};
    const items = {}, unmapped = [], skipped = [];
    Object.keys(recipes).forEach(rid => {
      const r = recipes[rid], map = MAP[rid] || {}, k = Number(scales[rid]) > 0 ? Number(scales[rid]) : 1;
      (r.ingredients || []).forEach(([amount, name]) => {
        const target = Object.prototype.hasOwnProperty.call(map, name) ? map[name] : undefined;
        if (target === undefined) return unmapped.push({ recipe: rid, name, amount });
        if (typeof target !== "string") return skipped.push({ recipe: rid, name, reason: target.skip });
        const it = items[target] = items[target] || { total: null, approx: false, parts: [], unreadable: [], mixedUnits: [] };
        const p = parseRecipeAmount(amount);
        if (!p) return it.unreadable.push({ recipe: rid, amount, name });
        it.parts.push({ recipe: rid, amount, parsed: { min: p.min * k, max: p.max * k, unit: p.unit, approx: p.approx } });
      });
    });
    Object.values(items).forEach(it => {
      const units = [...new Set(it.parts.map(p => p.parsed.unit))];
      if (!it.parts.length) return;
      if (units.length > 1) { it.mixedUnits = units; return; } // never add grams to counts
      it.total = { min: it.parts.reduce((a, p) => a + p.parsed.min, 0), max: it.parts.reduce((a, p) => a + p.parsed.max, 0), unit: units[0] };
      it.approx = it.parts.some(p => p.parsed.approx);
    });
    return { items, unmapped, skipped };
  }

  function fmtNeed(total) {
    if (!total) return "";
    const one = n => (total.unit === "count" ? String(Math.round(n * 10) / 10) : (n >= 1000 && total.unit === "g" ? (Math.round(n / 10) / 100) + " kg" : n >= 1000 ? (Math.round(n / 10) / 100) + " L" : Math.round(n) + " " + total.unit));
    return total.min === total.max ? one(total.min) : one(total.min) + "–" + one(total.max);
  }

  return { MAP, parseRecipeAmount, needsFor, fmtNeed };
});
