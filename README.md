# Prepwise — meal prep grocery list app

Live: https://prepwise-plum.vercel.app (Vercel project `prepwise`, team slug `mk-0cad`)

Plain static site, no build step:
- `index.html` — page shell: icon sprite, header, tab bar, sign-in dialog
- `styles.css` — design system (tokens, light/dark themes, components, motion)
- `js/prices.js` — price history logic (unit normalisation, cheapest recorded store). No DOM, unit-tested
- `js/core.js` — pure logic (dates, scaling, grocery totals, body maths, storage normalisation). No DOM; unit-tested
- `js/app.js` — state, Supabase sync, all views and events
- `recipes.js` — `window.DEFAULT_RECIPES`, the owner's six default recipes (guarded by a hash test)
- `vercel.json` — clean URLs and two security headers

Run locally: `npx serve .` (or any static server), then open http://localhost:3000.
Tests: `npm test` (Node 18+, no dependencies installed).
Code: https://github.com/emmyboss3026/prepwise — pushing to `main` deploys to production once the Vercel project is connected to this repo (Vercel → prepwise → Settings → Git).
Manual deploy: `vercel --prod` from this folder.

## Tabs
Home (greeting, today's meals, next cook day, grocery progress, upcoming cooking tasks, progress summary, quick actions) ·
Shop (grocery list with "I have it"/"Bought", price paid, store, totals, spending history, editable list) ·
Cooking (Cooking Time guides: oven settings, scalable ingredients, steps with timers, portions, storage; meals editable/addable) ·
Meals (planned day, 14-day food log, per-serving macros) ·
Progress (Mifflin–St Jeor BMR × activity, 7,700 kcal/kg projection, weigh-ins chart) ·
Cook day (countdown to the 2-weekly Friday cook day, .ics export, chicken split, account).

## Data
- Signed out: everything in localStorage key `prepwise-local-v1`. The theme choice is stored separately under `prepwise-theme`.
- Signed in (Supabase magic link): synced. On first sign-in, local data is copied to the account.
- Supabase project `pzasvqshxxmwxouktzzw` (shared with other unrelated tables — only touch `mp_*`).
  Publishable key is in `js/app.js` (safe to ship; RLS protects rows).
- Tables, all with RLS policy `user_id = (select auth.uid())`, anon revoked:
  - `mp_items (user_id, trip_date, item_id, status 'have'|'bought', paid, store, updated_at)` unique (user_id, trip_date, item_id)
  - `mp_settings (user_id pk, data jsonb, updated_at)` — body stats, plan, `recipes` overrides/custom meals, `customItems`, `hiddenItems`
  - `mp_log (user_id, day, slot 'breakfast'|'lunch'|'dinner'|'extra', meal, eaten, kcal, updated_at)` unique (user_id, day, slot)
  - `mp_weights (user_id, day, kg)` unique (user_id, day)
- Price history (2.4) is stored in `settings.priceLog` inside `mp_settings.data` (and in localStorage when signed out): no new table. Capped at 1,500 entries; move to a dedicated table with a reviewed migration if that is ever too small. Prices are per user, never shared, and are the user's own confirmed records, not live shop prices.
- Supabase Auth → URL Configuration → Redirect URLs must include the app URL (and http://localhost:3000 for local testing).

## Conventions
- Grocery items live in `ITEMS` in `js/app.js`: `[id, store, name, buy, price, source, uses]`.
  Keep ids stable — saved ticks/prices are keyed by id.
- Recipe edits never change `recipes.js`; they're stored in `settings.recipes` and merged by `R()`.
  Change `recipes.js` only when the owner's own default recipe changes.
- Steps containing `[N min]` get a timer button.
- Trip schedule: `ANCHOR = "2026-11-06"` (in `js/core.js`), every 14 days (Fridays).
- `meal-prep-handover.txt` is the original project brief (recipes, measurements, decisions). Don't change agreed proportions without saying why.

## Roadmap status
Implemented (Phase 1): redesigned visual system with light/dark themes, home dashboard, skeleton loading, interactive weight chart, empty states, unit tests for date, scaling, grocery, persistence and migration logic.
Planned, not built: recipe-driven grocery generation, adjustable servings across the whole plan, pantry inventory, meal calendar, recipe search and filters, freezer inventory, meal-prep history, data export and backup, CSP and SRI hardening, PWA/offline.
Implemented (2.4): personal price history, per kg/litre/item normalisation, cheapest recorded store with price age. Planned: photo/receipt capture (2.3, needs approval for any paid OCR), store recommendations (2.5), recipe-driven grocery quantities.
