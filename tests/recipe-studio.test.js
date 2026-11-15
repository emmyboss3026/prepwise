"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const R=require("../js/recipe-studio.js");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("caption with measured ingredients becomes an editable recipe, with no invented calories",()=>{
  const p=R.parse("Recipe: Creamy chicken rice\nServings: 4\nTime: 35 minutes\nIngredients:\n500 g chicken breast\n1 1/2 cups rice\n2 tbsp olive oil\nSteps:\n1. Chop chicken.\n2. Cook rice until done.");
  assert.equal(p.name,"Creamy chicken rice");
  assert.equal(p.serves,4);
  assert.equal(p.time,"35 minutes");
  assert.deepEqual(p.ingredients,[["500 g","chicken breast"],["1 1/2 cups","rice"],["2 tbsp","olive oil"]]);
  assert.deepEqual(p.steps,["Chop chicken.","Cook rice until done."]);
  assert.equal(p.kcal,0);
  assert.equal(p.reviewRequired,true);
  assert.ok(p.missing.some(x=>x.includes("Nutrition")));
});
test("ideas without measurements or instructions are drafts, never fabricated recipes",()=>{
  const p=R.parse("I want a creamy pasta with less sauce",{name:"My pasta idea",slot:"lunch",serves:"5"});
  assert.equal(p.name,"My pasta idea");
  assert.equal(p.slot,"lunch");assert.equal(p.serves,5);
  assert.deepEqual(p.ingredients,[]);assert.deepEqual(p.steps,[]);
  assert.ok(p.missing.some(x=>x.includes("quantities")||x.includes("measurements")));
  assert.ok(p.notes.includes("creamy pasta"));
});
test("mixed fractions, pipes, natural-language ingredient lines and insufficient amounts",()=>{
  assert.deepEqual(R.ingredientLine("2 tbsp | Coconut oil"),["2 tbsp","Coconut oil"]);
  assert.deepEqual(R.ingredientLine("1/2 tsp cinnamon"),["1/2 tsp","cinnamon"]);
  assert.deepEqual(R.ingredientLine("¾ cup rolled oats"),["¾ cup","rolled oats"]);
  assert.deepEqual(R.ingredientLine("Fresh herbs"),["","Fresh herbs"]);
});
test("only safe https links are retained, never script/data URLs or credentials",()=>{
  for(const url of ["javascript:alert(1)","data:text/html,x","http://x.test/x","https://admin:pw@example.com/recipe","//unsafe.example.com/x",""])assert.equal(R.safeLink(url),"");
  assert.equal(R.safeLink("https://www.youtube.com/watch?v=xyz"),"https://www.youtube.com/watch?v=xyz");
  assert.equal(R.parse("Title: Rice\nIngredients:\n200 g rice\nSteps:\nCook.",{sourceUrl:"javascript:alert(1)"}).sourceUrl,"");
});
test("ingredient shopping IDs are stable, names and quantities preserved and store validated",()=>{
  const recipe={ingredients:[["550 g","Chicken breast"],["","Salt"],["2 tbsp","Olive oil"]]};
  const a=R.proposedItems(recipe,"r-myrecipe",[0,1,2],"HOFER");
  const b=R.proposedItems(recipe,"r-myrecipe",[0,1,2],"HOFER");
  assert.deepEqual(a,b);
  assert.equal(a[0].id,"ri-r-myrecipe-0");
  assert.equal(a[0].name,"Chicken breast");assert.equal(a[0].buy,"550 g");
  assert.equal(a[1].buy,"");assert.equal(a[2].buy,"2 tbsp");
  assert.equal(R.proposedItems(recipe,"r-myrecipe",[0],"BAD")[0].store,"OTHER");
  assert.equal(R.shoppingKey("__proto__",1),"ri-__proto__-1");
  assert.equal(R.shoppingKey("../escape",0),"");
});
test("ideas get modest optional improvements without fabricated nutrition",()=>{
  const p=R.parse("Recipe: Creamy pasta\nIngredients:\n2 tbsp olive oil\n200 g pasta\nSteps:\nBoil pasta.");
  const lines=R.suggestions(p).join(" ");
  assert.match(lines,/measure added oil/);
  assert.match(lines,/uncooked grain or starch/);
  assert.ok(!/\b\d+\s*kcal\b/i.test(lines));
});
test("recipe studio is opt-in and does not change Supabase tables or settings key",()=>{
  const app=read("js/app.js"),ui=read("js/recipe-studio-ui.js"),html=read("index.html");
  assert.ok(app.includes('data-act="recipestudio"')&&app.includes('data-form="recipeshop"')===false); // form is a separate module
  assert.ok(ui.includes('data-form="recipeshop"')&&ui.includes('data-form="studiobuild"'));
  assert.ok(app.includes('sourceUrl:PWRS.safeLink(g("#e-source"))'));
  assert.ok(app.includes("S.settings.recipes"));
  assert.ok(html.includes('src="js/recipe-studio-ui.js"')&&html.includes('src="js/recipe-studio.js"'));
  assert.ok(!/fetch\(|sb\.from\(|apikey/i.test(read("js/recipe-studio.js")+ui));
});
test("video input explicitly does not claim automated transcription and is capped",()=>{
  const ui=read("js/recipe-studio-ui.js"),app=read("js/app.js");
  assert.match(ui,/cannot yet be transcribed automatically/);
  assert.match(ui,/video\/\*/);
  assert.match(ui,/no permanent video storage/);
  assert.match(app,/150\*1024\*1024/);
  assert.match(app,/URL\.revokeObjectURL/);
});
