"use strict";
/* Structural checks on the shipped files: accessibility basics, responsive meta, motion preference, asset wiring. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const html = read("index.html"), css = read("styles.css"), app = read("js/app.js");

test("index.html: language, viewport, skip link, single h1, main landmark", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport" content="[^"]*width=device-width/);
  assert.match(html, /<a class="skip" href="#main">/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.match(html, /<main id="main"/);
});
test("index.html: every local script and stylesheet exists", () => {
  const refs = [...html.matchAll(/(?:src|href)="([^":]+\.(?:js|css))"/g)].map(m => m[1]);
  assert.ok(refs.includes("js/core.js") && refs.includes("js/app.js") && refs.includes("styles.css") && refs.includes("recipes.js"));
  refs.forEach(r => assert.ok(fs.existsSync(path.join(root, r)), r + " missing"));
});
test("core.js loads before app.js", () => assert.ok(html.indexOf("js/core.js") < html.indexOf("js/app.js")));
test("no duplicate ids in the static page", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
});
test("navigation: six sections, each with an icon and a view", () => {
  const tabs = [...html.matchAll(/data-tab="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(tabs, ["home", "shop", "cooking", "meals", "progress", "cook"]);
  for (const id of [...html.matchAll(/<use href="#(i-[\w-]+)"/g)].map(m => m[1])) assert.ok(html.includes(`<symbol id="${id}"`), id + " icon undefined");
  for (const v of ["viewHome", "viewShop", "viewCooking", "viewMeals", "viewProgress", "viewCook"]) assert.match(app, new RegExp("function " + v + "[(]"));
});
test("icon buttons have accessible names", () => {
  assert.match(html, /id="theme"[^>]*aria-label=/);
});
test("styles: reduced-motion, dark theme (system and manual) and safe-area support", () => {
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /prefers-color-scheme:dark/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /:focus-visible/);
});
test("styles: tap targets are at least 44px for primary controls", () => {
  assert.match(css, /button\.btn\{[^}]*min-height:44px/);
  assert.match(css, /select,input\[type=text\][^{]*\{[^}]*min-height:44px/);
});
test("data safety: storage keys and tables are untouched", () => {
  assert.match(app, /sb\.from\("mp_items"\)/);
  for (const t of ["mp_items", "mp_settings", "mp_log", "mp_weights"]) assert.ok(app.includes(`"${t}"`), t);
  assert.equal([...app.matchAll(/sb\.from\("([^"]+)"\)/g)].every(m => /^mp_(items|settings|log|weights)$/.test(m[1])), true);
  assert.ok(!/service_role|sb_secret|eyJ[A-Za-z0-9_-]{20}/.test(app + html), "no private key material");
});
test("user data is rendered through esc() in the new dashboard", () => {
  const home = app.slice(app.indexOf("function viewHome"), app.indexOf("function tripOptions"));
  assert.match(home, /esc\(nm\)/);
  assert.match(home, /esc\(m\.name\)/);
});
test("styles: the hidden attribute always wins over component display rules", () => {
  assert.match(css, /\[hidden\]\{display:none!important\}/);
});
