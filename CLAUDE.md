# Prepwise — meal prep grocery list app

Live: https://prepwise-plum.vercel.app (Vercel project `prepwise`, team slug `mk-0cad`)

Plain static site, no build step:
- `index.html` — the whole app (HTML + CSS + JS in one file)
- `recipes.js` — `window.DEFAULT_RECIPES`, the owner's six default recipes
- `vercel.json` — clean URLs and two security headers

Run locally: `npx serve .` (or any static server), then open http://localhost:3000.
Deploy: `vercel --prod` from this folder, or connect a GitHub repo to the Vercel project.

## Tabs
Shop (grocery list with "I have it"/"Bought", price paid, store, totals, spending history, editable list) ·
Cooking (Cooking Time guides: oven settings, scalable ingredients, steps with timers, portions, storage; meals editable/addable) ·
Meals (planned day, 14-day food log, per-serving macros) ·
Progress (Mifflin–St Jeor BMR × activity, 7,700 kcal/kg projection, weigh-ins chart) ·
Cook day (countdown to the 2-weekly Friday cook day, .ics export, chicken split, account).

## Data
- Signed out: everything in localStorage key `prepwise-local-v1`.
- Signed in (Supabase magic link): synced. On first sign-in, local data is copied to the account.
- Supabase project `pzasvqshxxmwxouktzzw` (shared with other unrelated tables — only touch `mp_*`).
  Publishable key is in `index.html` (safe to ship; RLS protects rows).
- Tables, all with RLS policy `user_id = (select auth.uid())`, anon revoked:
  - `mp_items (user_id, trip_date, item_id, status 'have'|'bought', paid, store, updated_at)` unique (user_id, trip_date, item_id)
  - `mp_settings (user_id pk, data jsonb, updated_at)` — body stats, plan, `recipes` overrides/custom meals, `customItems`, `hiddenItems`
  - `mp_log (user_id, day, slot 'breakfast'|'lunch'|'dinner'|'extra', meal, eaten, kcal, updated_at)` unique (user_id, day, slot)
  - `mp_weights (user_id, day, kg)` unique (user_id, day)
- Supabase Auth → URL Configuration → Redirect URLs must include the app URL (and http://localhost:3000 for local testing).

## Conventions
- Grocery items live in `ITEMS` in `index.html`: `[id, store, name, buy, price, source, uses]`.
  Keep ids stable — saved ticks/prices are keyed by id.
- Recipe edits never change `recipes.js`; they're stored in `settings.recipes` and merged by `R()`.
  Change `recipes.js` only when the owner's own default recipe changes.
- Steps containing `[N min]` get a timer button.
- Trip schedule: `ANCHOR = "2026-11-06"`, every 14 days (Fridays).
- `meal-prep-handover.txt` is the original project brief (recipes, measurements, decisions). Don't change agreed proportions without saying why.
