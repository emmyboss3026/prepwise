/* Prepwise Recipe Studio: deterministic, local-only text structuring.
   Never fabricates ingredient amounts, instructions, or nutrition numbers. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.PWRS=api;
})(typeof self!=="undefined"?self:this,function(){
"use strict";
const MAX_TEXT=14000,MAX_LINES=150;
const SECTION=/^(ingredients?|what you (?:need|will need)|method|instructions?|directions?|steps?|preparation|notes?|tips?)\s*:?\s*$/i;
const ING_HEAD=/^(?:(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])\s*)?(kg|g|grams?|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|tbsps?|tablespoons?|tsps?|teaspoons?|cups?|cans?|packs?|packets?|cloves?|slices?|pieces?|pcs?|whole|medium|small|large)?\b/i;
const INSTRUCTION=/^(?:step\s*)?\d{1,2}[.)\-:]\s+|^[•\-\*]\s*/i;
const ACTION=/\b(add|mix|stir|bake|cook|heat|boil|fry|chop|cut|grill|serve|blend|simmer|preheat|season|combine|drain|pour|whisk|spread|roast|saute|sauté|marinate|divide|portion|refrigerate|freeze|store)\b/i;
const SLOTS=["breakfast","lunch","dinner","snack"];
function clean(text){return String(text||"").replace(/\r\n?/g,"\n").replace(/\u00a0/g," ").slice(0,MAX_TEXT).trim()}
function safeLink(text){
  if(!text)return "";
  const s=String(text).trim().slice(0,1000);
  try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password&&u.hostname?u.href:""}catch(e){return ""}
}
function ingredientLine(raw){
  let s=String(raw||"").trim().replace(/^[•\-\*]\s*/,"");
  if(!s)return null;
  const pipe=s.indexOf("|");if(pipe>0)return [s.slice(0,pipe).trim().slice(0,60),s.slice(pipe+1).trim().slice(0,180)];
  const q=s.match(ING_HEAD);
  if(q&&q[1]){
    const rawAmount=(q[1]+" "+(q[2]||"")).trim();
    const rest=s.slice(q[0].length).replace(/^\s*(?:of\s+)?/i,"").trim();
    if(rest)return [rawAmount.slice(0,60),rest.slice(0,180)];
  }
  return ["",s.slice(0,180)];
}
function stripInstruction(line){
  return String(line||"").replace(INSTRUCTION,"").trim().slice(0,700);
}
function parse(text,options={}){
  const content=clean(text);
  const lines=content.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,MAX_LINES);
  let name=String(options.name||"").trim().slice(0,80);
  let slot=SLOTS.includes(options.slot)?options.slot:"dinner";
  let serves=Number(options.serves);if(!Number.isInteger(serves)||serves<1||serves>200)serves=4;
  const result={name,slot,serves,servingLabel:"1 portion",time:"",kcal:0,p:0,c:0,f:0,fib:0,
    ingredients:[],steps:[],oven:[],portion:[],storage:[],notes:"",sourceUrl:safeLink(options.sourceUrl)};
  const notes=[];let mode="intro",matchedSections=false;
  for(let idx=0;idx<lines.length;idx++){
    let line=lines[idx];
    const title=line.match(/^(?:recipe|title|dish|meal)\s*:\s*(.+)$/i);
    if(title){if(!name)name=title[1].trim().slice(0,80);continue}
    const servings=line.match(/^(?:servings?|makes|yield)\s*:\s*(\d{1,3})(?:\s+.*)?$/i);
    if(servings){if(!options.serves)serves=Math.max(1,Math.min(200,Number(servings[1])));continue}
    const time=line.match(/^(?:time|prep(?:aration)? time|total time)\s*:\s*(.+)$/i);
    if(time){result.time=time[1].slice(0,60);continue}
    if(SECTION.test(line)){
      matchedSections=true;
      mode=/ingredients?|what you/i.test(line)?"ingredients":/method|instructions?|directions?|steps?|preparation/i.test(line)?"steps":"notes";
      continue;
    }
    // First standalone line is a proposed title only for formatted recipe texts with more content.
    if(idx===0&&!name&&lines.length>1&&!/[\d.]/.test(line)&&line.length<65&&!ACTION.test(line)&&!ING_HEAD.test(line)){
      name=line.slice(0,80);continue;
    }
    if(mode==="ingredients"){
      const row=ingredientLine(line);
      if(row&&row[1])result.ingredients.push(row);
    }else if(mode==="steps"){
      const step=stripInstruction(line);if(step)result.steps.push(step);
    }else if(mode==="notes"){
      notes.push(line);
    }else if(!matchedSections){
      // Draft idea without sections is kept as a note, not misrepresented as a complete recipe.
      notes.push(line);
    }
  }
  if(!name)name=String(options.name||"Untitled recipe").trim().slice(0,80)||"Untitled recipe";
  result.name=name;result.serves=serves;
  result.notes=notes.join("\n").slice(0,1500);
  result.reviewRequired=true;
  result.missing=[];
  if(!result.ingredients.length)result.missing.push("Ingredient names and measurements");
  if(result.ingredients.some(([amount])=>!amount))result.missing.push("Missing ingredient quantities");
  if(!result.steps.length)result.missing.push("Cooking instructions");
  result.missing.push("Nutrition/portion values (optional; never estimated without reliable data)");
  return result;
}
function suggestions(recipe){
  const ing=(recipe.ingredients||[]).map(i=>String(i[1]).toLowerCase()).join(" ");
  const out=["Weigh ingredients as you cook and confirm the number of portions before saving calories."];
  if(/oil|butter|cream|mayonnaise|mayo/.test(ing))out.push("For a lighter version, measure added oil, butter or creamy sauces rather than removing them automatically.");
  if(/rice|potato|pasta|flour|oats|wrap|tortilla/.test(ing))out.push("Record the uncooked grain or starch amount so the recipe scales consistently.");
  if(!recipe.steps.length)out.push("Add the cooking method, temperature and timings before using the cooking guide.");
  if((recipe.ingredients||[]).some(i=>!i[0]))out.push("Confirm any ingredient without a quantity before adding it to your shopping list.");
  return out;
}
function shoppingKey(id,index){
  if(!/^(?:[A-Za-z0-9_-]{1,65})$/.test(String(id||""))||!Number.isInteger(index)||index<0||index>299)return "";
  return "ri-"+id+"-"+index;
}
function proposedItems(recipe,recipeId,selected=[],store="OTHER"){
  if(!["OTHER","SPAR","HOFER","BILLA","LIDL","PANTRY"].includes(store))store="OTHER";
  if(!recipe||!Array.isArray(recipe.ingredients))return [];
  return recipe.ingredients.slice(0,200).flatMap((row,i)=>{
    if(!selected.includes(i)||!Array.isArray(row)||!String(row[1]||"").trim())return [];
    const id=shoppingKey(recipeId,i);if(!id)return [];
    return [{id,store,name:String(row[1]).trim().slice(0,80),buy:String(row[0]||"").trim().slice(0,40),price:0,sourceRecipeId:recipeId,sourceIngredientIndex:i}];
  });
}
return {parse,ingredientLine,clean,suggestions,safeLink,shoppingKey,proposedItems};
});
