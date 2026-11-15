"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dir=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(dir,"js/app.js"),"utf8");
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
const design=fs.readFileSync(path.join(dir,"styles/nova.css"),"utf8");
const main=fs.readFileSync(path.join(dir,"styles.css"),"utf8");

test("Nova stylesheet loads after base styles and all views remain",()=>{
  assert.ok(html.includes('href="styles/nova.css"'));
  assert.ok(html.indexOf('href="styles.css"')<html.indexOf('href="styles/nova.css"'));
  for(const fn of ["viewHome","viewShop","viewMeals","viewCooking","viewProgress","viewCook","viewPrices","viewRecs","budgetCard"]){
    assert.match(app,new RegExp("function "+fn+"\\("));
  }
});
test("shopping, budgets, price history, photos, and sync actions remain",()=>{
  for(const action of ["shopfilter","status","pricedraft","tripbudget","recstoggle","photoselect","gotab","logweight","editlist","additem"]){
    assert.ok(app.includes(action),action+" was removed");
  }
  for(const table of ["mp_items","mp_settings","mp_log","mp_weights"])assert.ok(app.includes('"'+table+'"'));
});
test("grocery image button closes before the product title",()=>{
  const start=app.indexOf("function groceryThumb");
  const end=app.indexOf("function showGroceryPhoto",start);
  const render=app.slice(start,end);
  assert.ok(render.includes('data-act="choosephoto"'));
  assert.ok(render.includes("</button>"),"closing button tag was malformed");
});
test("exact grocery name is visually included in row and photo chooser",()=>{
  const row=app.slice(app.indexOf("function itemRow"),app.indexOf("function budgetCard"));
  assert.match(row,/grocery-product-eyebrow/);
  assert.match(row,/grocery-name-\$\{esc\(id\)\}/);
  assert.match(row,/title="\$\{esc\(name\)\}"/);
  assert.match(row,/>\$\{esc\(name\)\}<\/span>/);
  const gallery=app.slice(app.indexOf("function photoCandidateList"),app.indexOf("function runPhotoSearch"));
  assert.match(gallery,/photo-choice-product/);
  assert.match(gallery,/esc\(product\)/);
  assert.match(gallery,/photo-picker-exact-name/);
  assert.match(gallery,/esc\(i\[2\]\)/);
});
test("Nova covers light, dark, responsive design, accessible focus and reduced motion",()=>{
  assert.match(design,/:root\[data-theme="dark"\]/);
  assert.match(design,/prefers-color-scheme:dark/);
  assert.match(design,/prefers-reduced-motion:reduce/);
  assert.match(design,/@media\(max-width:395px\)/);
  assert.match(design,/\.item \.name\{[^}]*color:var\(--fg\)/);
  assert.match(design,/\.photo-picker-exact-name/);
  assert.match(design,/:focus-visible/);
  assert.match(main,/\[hidden\]\{display:none!important\}/);
});
test("design layer does not change storage or request data",()=>{
  assert.ok(!/fetch\(|localStorage|sb\.from|service_role|@import/.test(design));
  assert.ok(!/eval\(|innerHTML/.test(design));
});
