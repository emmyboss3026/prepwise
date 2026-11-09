/* Prepwise default recipes — the owner's own plan. Everyone can edit or add their own in the app. */
window.DEFAULT_RECIPES = {
  "Pancakes": {
    name: "Protein pancakes", slot: "lunch", serves: 16, servingLabel: "6 pancakes", time: "About 2½ hours",
    kcal: 223, p: 24.2, c: 23.1, f: 2.8, fib: 2.7,
    oven: [["Hob", "Low to medium-low (3–4 of 9)"], ["Pan", "Non-stick, lightly greased"], ["Batches", "4 batches of 24"]],
    ingredients: [
      ["1,500 g", "Liquid egg white (3 bottles)"], ["1,440 g", "Magertopfen or Skyr"], ["288 g", "Oats, blended to flour"],
      ["48 g", "Baking powder"], ["5", "Ripe bananas, peeled and mashed (500–600 g)"], ["300–400 g", "Milk"],
      ["20 ml", "Vanilla"], ["8 g", "Cinnamon"], ["2–4 g", "Salt"], ["to taste", "Sweetener (less than usual; banana sweetens)"],
      ["a little", "Cooking spray"]
    ],
    steps: [
      "Prep: mash all 5 bananas, weigh the mash and split it into 4 equal portions. Blend all 288 g oats to flour and weigh out 4 × 72 g. Weigh your empty mixing bowl and write it down.",
      "Batch (repeat 4 times): into the blender put 375 g egg white, 360 g Magertopfen, ¼ of the banana, 75 g milk, 5 ml vanilla, 2 g cinnamon, a pinch of salt and a little sweetener.",
      "Blend 30 seconds until completely smooth, no banana or Topfen lumps.",
      "Add 72 g oat flour and blend 15 seconds.",
      "Add 12 g baking powder and pulse only 2–3 times.",
      "Check thickness: like thick pouring cream. Too thick? Add milk 10–15 g at a time (up to about 25 g more).",
      "Rest the batter. [8 min]",
      "Weigh the batter: total minus empty bowl, then ÷ 24 = batter per pancake (about 43–44 g).",
      "Heat the pan on low to medium-low for 2 minutes and grease very lightly. Banana browns fast, so keep it lower than usual. [2 min]",
      "Cook the first side until edges are dry and bubbles appear. [3 min]",
      "Flip and cook until the centre springs back. [2 min]",
      "Cool in a single layer on a rack or plate. Don't stack them hot."
    ],
    portion: ["96 pancakes = 16 packs of 6", "Batter per pancake = batch weight ÷ 24"],
    storage: ["Fridge: 3 packs for the next 3 days", "Freezer: the other 13 packs, laid flat", "Reheat: microwave 60–90 s from frozen until hot"],
    notes: "Make one or two test pancakes from batch 1 and adjust the heat before doing the rest."
  },
  "Burritos": {
    name: "Beef, egg & potato burritos", slot: "breakfast", serves: 16, servingLabel: "1 burrito", time: "About 1½–2 hours",
    kcal: 695, p: 36.7, c: 55.6, f: 35.5, fib: 4.3,
    oven: [["Oven", "200 °C fan (plain three-blade fan symbol)"], ["Rack", "Middle, 2 trays"], ["Time", "25–30 min, turn halfway"], ["Hob", "Beef medium-high · eggs medium-low"]],
    ingredients: [
      ["16", "Large tortillas"], ["1,800 g", "Beef mince, 100% beef"], ["3 kg", "Potatoes (shared with the Cajun meal: 722 g cooked goes to burritos)"],
      ["~12 g", "Oil for the potatoes"], ["225 g", "Onion, finely chopped"], ["6", "Garlic cloves, minced"], ["120 g", "Tomato paste"],
      ["150 ml", "Worcestershire sauce"], ["16", "Eggs"], ["160 g", "Cottage cheese"], ["320 g", "Sriracha mayo (20 g per burrito)"],
      ["16–24 g", "Chives, chopped"], ["to taste", "Smoked paprika, garlic powder, onion powder, chilli powder, Italian herbs, salt, pepper"]
    ],
    steps: [
      "Preheat the oven to 200 °C fan (three-blade fan symbol).",
      "Cut the potatoes into 1.5–2 cm cubes, toss with the oil and seasoning and spread over 2 trays in a single layer.",
      "Roast on the middle rack, turning halfway and swapping the trays. [28 min]",
      "Brown the beef in 2–3 batches on medium-high. Let it brown before stirring.",
      "Return all the beef to the pan. Tip off any pool of fat if you want fewer calories.",
      "Add the onion and cook until soft. [5 min]",
      "Add the garlic and cook 1 minute, then stir in the tomato paste for 1–2 minutes.",
      "Add the Worcestershire and seasoning and simmer, stirring, until fairly dry with no liquid pooling. [10 min]",
      "Whisk the eggs with the cottage cheese and a pinch of salt and pepper. Cook in 2 batches on medium-low, pushing from the edges, until no runny egg is left.",
      "Spread every filling on a tray to cool. Hot filling makes soggy tortillas. [15 min]",
      "Warm each tortilla 10–15 seconds so it folds without cracking.",
      "Layer: ~45 g potatoes, ~100 g beef mix, ~55 g egg, exactly 20 g sriracha mayo, a pinch of chives. Keep it in a log across the lower third.",
      "Fold both sides in, roll up tightly from the bottom. Optional: toast seam-side down in a dry pan for 1–2 minutes."
    ],
    portion: ["Potatoes ~45 g cooked (722 g ÷ 16)", "Beef mixture ~100 g (cooked total ÷ 16)", "Egg mixture ~55 g (cooked total ÷ 16)", "Sriracha mayo 20 g exactly"],
    storage: ["Wrap each tightly in cling film or foil", "Fridge: 3 for the next 3 days; freezer: 13", "Reheat from frozen: no foil, damp paper towel, microwave 2½–3½ min turning halfway", "Crispier: thaw overnight, air fryer or oven 180 °C for 10–12 min"],
    notes: "Each burrito counts as 112.5 g raw beef, ~104 g raw potato and 1 egg."
  },
  "Cajun": {
    name: "Creamy Cajun chicken & potatoes", slot: "dinner", serves: 4, servingLabel: "1 bowl", time: "About 30 min (potatoes done with the burritos)",
    kcal: 711, p: 63.7, c: 76.9, f: 13.4, fib: 13,
    oven: [["Potatoes", "Roasted with the burrito batch (or 190 °C fan, middle rack, 25–30 min)"], ["Hob", "Chicken medium-high · sauce low-medium"], ["Safe", "Chicken 74 °C inside"]],
    ingredients: [
      ["817 g", "Chicken breast"], ["578 g", "Roasted potatoes, cooked (from the 3 kg batch)"], ["600 g", "Frozen mixed vegetables"],
      ["200 ml", "Light evaporated milk"], ["120 g", "Light herb/garlic cream cheese"], ["26–30 g", "Tomato paste"],
      ["1 small", "Onion, finely chopped"], ["10 g", "Butter"], ["to taste", "Cajun seasoning, paprika, garlic powder, onion powder, Italian herbs, salt, pepper"]
    ],
    steps: [
      "Cut the chicken into 3 cm pieces and season well.",
      "Pan-cook in 2 batches on medium-high until golden, turning. Check the thickest piece reaches 74 °C. [7 min]",
      "Take the chicken out and weigh it. Keep the pan.",
      "Turn to low-medium, melt the butter and soften the onion. [4 min]",
      "Add the tomato paste and cook 1 minute.",
      "Add the evaporated milk and cream cheese and stir until creamy, at a gentle simmer, never a hard boil. [3 min]",
      "Taste, adjust the Cajun or salt, return the chicken and toss to coat. [2 min]",
      "Cook the vegetables following the package and drain very well. [6 min]",
      "Fill 4 containers: ¼ chicken in sauce, ~144 g potatoes, ¼ vegetables."
    ],
    portion: ["Chicken ~155 g cooked (cooked weight ÷ 4)", "Potatoes ~144 g", "Vegetables ~145 g", "¼ of the sauce"],
    storage: ["Cool lids-off 20–30 min, chill within 2 hours", "Fridge: 2 (dinners 1–2); freezer: 2", "Reheat 2½–3½ min, stirring halfway; add a splash of water if the sauce has thickened"],
    notes: ""
  },
  "Alfredo": {
    name: "Chicken Alfredo pasta", slot: "dinner", serves: 4, servingLabel: "1 bowl", time: "About 40–50 min",
    kcal: 699, p: 69, c: 64.6, f: 13.9, fib: 7.5,
    oven: [["Hob", "Pasta water boiling · chicken medium-high · sauce low-medium"], ["Pasta", "1 minute less than the package"], ["Safe", "Chicken 74 °C inside"]],
    ingredients: [
      ["817 g", "Chicken breast"], ["230 g", "Dry pasta or spaghetti"], ["150 g", "Passata"], ["300 ml", "Light evaporated milk"],
      ["130 g", "Light cream cheese, plain"], ["30 g", "Grated Parmesan or Grana"], ["600 g", "Frozen mixed vegetables"],
      ["1 small", "Onion, finely chopped"], ["4", "Garlic cloves, minced"], ["~10 g", "Light butter"],
      ["to taste", "Italian herbs, garlic powder, paprika, salt, pepper; chilli flakes optional"]
    ],
    steps: [
      "Bring 2.5–3 litres of water to the boil with about 1 tbsp salt.",
      "Cut the chicken into 3 cm pieces and season. Pan-cook in 2 batches on medium-high until golden and 74 °C inside. [7 min]",
      "Take the chicken out and weigh it on its own. Keep the pan.",
      "Cook the 230 g pasta 1 minute less than the package says, stirring in the first minute. [9 min]",
      "Before draining, scoop out about 150 ml pasta water. Drain, don't rinse.",
      "Sauce in the chicken pan on low-medium: melt the butter, soften the onion. [4 min]",
      "Add the garlic for 1 minute (don't brown it), then the passata for 2 minutes. [2 min]",
      "Add the evaporated milk, cream cheese and Parmesan. Stir until smooth at a gentle simmer, never boiling hard. [3 min]",
      "Tip in the pasta and toss. Loosen with pasta water, a splash at a time, slightly looser than you'd eat it.",
      "Cook the vegetables following the package and drain well. [6 min]",
      "Fill 4 containers: ¼ pasta (same scoop each), chicken on top, ¼ vegetables."
    ],
    portion: ["Chicken ~155 g cooked", "Pasta + sauce ~290–310 g", "Vegetables ~145 g"],
    storage: ["Fridge: 1 (dinner 3); freezer: 3", "Reheat with 1–2 tbsp water or milk, 2½–3½ min, stirring halfway"],
    notes: "Alfredo thickens a lot in the fridge, so pack it looser than you'd serve it."
  },
  "Middle Eastern": {
    name: "Middle Eastern garlic-herb chicken & rice", slot: "dinner", serves: 4, servingLabel: "1 bowl + salad + sauce", time: "About 1 hour",
    kcal: 702, p: 57, c: 72.9, f: 18.4, fib: 4,
    oven: [["Oven", "190 °C fan (plain three-blade fan symbol)"], ["Rack", "Middle, single layer"], ["Time", "18–22 min to 74 °C"], ["Finish", "Optional top grill (zig-zag) ~200 °C, 2–4 min"]],
    ingredients: [
      ["817 g", "Chicken breast"], ["6 g", "Paprika"], ["4 g", "Garlic powder"], ["4 g", "Onion powder"], ["3 g", "Cumin"], ["3 g", "Oregano"],
      ["2 g", "Dried parsley"], ["4–5 g", "Salt"], ["15 g", "Tomato paste"], ["10–15 g", "Honey"], ["10–15 g", "Olive oil"], ["1", "Lemon, juiced"],
      ["270 g", "Dry basmati rice"], ["~420 ml", "Water (check the rice package)"], ["10 g", "Butter"], ["100–120 g", "Onion, finely chopped"],
      ["1 tsp", "Turmeric"], ["1 tsp", "Paprika (rice)"], ["½–1 tsp", "Cumin (rice)"], ["1 tsp", "Italian herbs"],
      ["400 g", "Tomatoes (salad, made fresh per bowl)"], ["80–100 g", "Spring onion"], ["80–100 g", "Fresh parsley"], ["160 g", "Yogurt (sauce)"],
      ["70–80 g", "Light mayo (sauce)"], ["60–70 g", "Chilli-garlic sauce"], ["50–70 ml", "Evaporated milk (sauce)"]
    ],
    steps: [
      "Slice thick breasts in half or flatten to about 2 cm so they cook evenly.",
      "Mix all the marinade spices with the tomato paste, honey, olive oil and lemon juice. Coat the chicken, cover and chill. [20 min]",
      "Rinse the rice until the water runs mostly clear. Put it in a lidded pot with ~420 ml water and a pinch of salt.",
      "Bring to the boil, cover, lowest heat, don't lift the lid. [11 min]",
      "Turn off the heat and leave covered. [10 min]",
      "Meanwhile soften the onion in the butter, then stir in turmeric, paprika, cumin and Italian herbs for 30 seconds. Fold through the fluffed rice.",
      "Preheat the oven to 190 °C fan. Lay the chicken on a lined tray in a single layer.",
      "Bake on the middle rack until 74 °C inside. [20 min]",
      "Optional: top grill (zig-zag) ~200 °C, watching closely because honey burns. [3 min]",
      "Rest, then slice. [5 min]",
      "Spread the rice on a tray to cool quickly, then pack 4 containers: ¼ chicken, ¼ rice. [15 min]",
      "On the day: salad = 100 g tomato, 20–25 g spring onion, 20–25 g parsley, ½ tsp olive oil, ¼ lemon, pinch of sumac. Sauce = 40 g yogurt, 17.5–20 g light mayo, 15–17.5 g chilli-garlic, 1 tbsp evaporated milk."
    ],
    portion: ["Chicken ~140–150 g cooked", "Rice ~200–225 g cooked (67.5 g dry)", "Salad and sauce: 1 fresh portion per bowl"],
    storage: ["Freeze all 4 within 2 hours (fridge is full with Cajun and Alfredo)", "Thaw overnight, sprinkle the rice with 1 tbsp water, microwave 2½–3½ min until steaming", "Keep parsley in a glass of water in the fridge; tomatoes whole at room temperature"],
    notes: "Cool rice fast: slow-cooled rice is a real food-safety risk."
  },
  "Mexican": {
    name: "Mexican street-corn chicken & rice", slot: "dinner", serves: 4, servingLabel: "1 bowl", time: "About 1 hour",
    kcal: 709, p: 59.5, c: 81.3, f: 13.9, fib: 4,
    oven: [["Chicken", "190 °C fan, middle rack, 18–24 min to 74 °C"], ["Corn mix", "180 °C fan, middle rack, 15–18 min, stir halfway"], ["Finish", "Optional top grill 2–4 min"]],
    ingredients: [
      ["849 g", "Chicken breast"], ["6.4 g", "Paprika"], ["4 g", "Cumin"], ["4 g", "Garlic powder"], ["3.2 g", "Onion powder"],
      ["~2 g", "Chilli powder"], ["4 g", "Salt"], ["~8 g", "Olive oil (chicken)"], ["½", "Lime, juiced (chicken)"],
      ["320 g", "Dry basmati rice"], ["~480–520 ml", "Water (check the rice package)"],
      ["360 g", "Sweetcorn, drained"], ["120–160 g", "Red pepper, diced"], ["80 g", "Red onion, diced"], ["4–8 g", "Olive oil (corn)"],
      ["20–24 g", "Fresh coriander"], ["144 g", "Yogurt (sauce)"], ["64 g", "Light mayo (sauce)"], ["½", "Lime, juiced (sauce)"]
    ],
    steps: [
      "Season the chicken with paprika, cumin, garlic and onion powder, chilli, salt, olive oil and half the lime juice.",
      "Preheat the oven to 190 °C fan. Bake the chicken on the middle rack until 74 °C inside. [21 min]",
      "Rinse the rice, cook with ~480–520 ml water: boil, cover, lowest heat. [12 min]",
      "Rest the rice covered. [10 min]",
      "Mix the corn, pepper and red onion with olive oil and the spices. When the chicken is out, roast at 180 °C fan on the middle rack, stirring halfway. [16 min]",
      "Stir the coriander into the corn after roasting.",
      "Rest the chicken, then slice. [5 min]",
      "Cool the rice on a tray, then pack 4 containers: ¼ chicken, ¼ rice, ¼ corn mix. [15 min]",
      "Sauce: whisk the yogurt, light mayo, the other half lime and a pinch of each spice. Keep it separate."
    ],
    portion: ["Chicken ~160 g cooked", "Rice ¼ (80 g dry)", "Corn mix ¼ (90 g corn)", "Sauce ¼ (~55 g)"],
    storage: ["Freeze the bowls; keep the sauce in the fridge (3–4 days) or make it fresh per bowl", "Reheat 2½–3½ min until steaming, add sauce after"],
    notes: ""
  }
};
