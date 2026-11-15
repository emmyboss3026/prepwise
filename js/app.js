"use strict";
/* ---------- Config ---------- */
const SB_URL="https://pzasvqshxxmwxouktzzw.supabase.co";
const SB_KEY="sb_publishable_njAi3wbwVr86eqeKxLOuRw_nF2p62fn";
const {ANCHOR,LKEY,esc,num,r1,eur,iso,parse,addDays,diffDays,scaleAmt,stepParts}=PW; // pure logic lives in js/core.js

/* ---------- Plan data ---------- */
const STORES={
  SPAR:{name:"Stop 1 · SPAR / INTERSPAR",note:"Chicken: AIA Hendl-Filet 550 g, €4.49 until 18 Nov."},
  HOFER:{name:"Stop 2 · HOFER",note:"Beef, dairy, eggs, potatoes and the basics."},
  BILLA:{name:"Stop 3 · BILLA",note:"Liquid egg whites, pasta and basmati."},
  LIDL:{name:"Lidl",note:"Items you added."},
  OTHER:{name:"Other stores",note:"Items you added."},
  PANTRY:{name:"Pantry · check at home first",note:"Estimated prices, not counted in Planned."}
};
const DISH=["Pancakes","Burritos","Cajun","Alfredo","Middle Eastern","Mexican"];
// id, store, name, buy, price, source, uses
const ITEMS=[
 ["chicken","SPAR","Chicken breast fillet (AIA, 550 g)","6 packs",26.94,"offer",{"Cajun":"817 g","Alfredo":"817 g","Middle Eastern":"817 g","Mexican":"849 g"}],
 ["beef","HOFER","Beef mince, 100% beef (Sonnhof, 800 g)","2 packs",18.98,"store",{"Burritos":"1,600 g of 1,800 g"}],
 ["beef2","HOFER","Beef mince, small pack","~250 g",3.50,"est",{"Burritos":"top up to 1,800 g"}],
 ["eggs","HOFER","Eggs","18 (3 × 6)",8.37,"store",{"Burritos":"16"}],
 ["topfen","HOFER","Magertopfen or Skyr, 250 g","6 tubs",5.94,"est",{"Pancakes":"1,440 g"}],
 ["potato","HOFER","Potatoes","3 kg",3.75,"est",{"Burritos":"~1,670 g raw","Cajun":"~1,330 g raw"}],
 ["tortilla","HOFER","Large tortillas, packs of 6","3 packs",5.97,"est",{"Burritos":"16"}],
 ["sriracha","HOFER","Sriracha mayo","2 bottles",5.98,"est",{"Burritos":"320 g"}],
 ["worc","HOFER","Worcestershire sauce","1 bottle",4.99,"est",{"Burritos":"150 ml"}],
 ["veg","HOFER","Frozen mixed vegetables, 1 kg","2 bags",4.58,"est",{"Cajun":"600 g","Alfredo":"600 g"}],
 ["evap","HOFER","Light evaporated milk, 410 g","2 cans",2.58,"est",{"Cajun":"200 ml","Alfredo":"300 ml","Middle Eastern":"50–70 ml"}],
 ["herbcc","HOFER","Herb/garlic cream cheese, light, 200 g","1",1.59,"store",{"Cajun":"120 g"}],
 ["cc","HOFER","Light cream cheese, plain, 200 g","1",1.59,"store",{"Alfredo":"130 g"}],
 ["butter","HOFER","Butter, 250 g","1",1.59,"store",{"Cajun":"10 g","Alfredo":"10 g","Middle Eastern":"10 g"}],
 ["parm","HOFER","Grated Parmesan or Grana, 100 g","1",1.99,"est",{"Alfredo":"30 g"}],
 ["cottage","HOFER","Cottage cheese, 200 g","1",1.19,"est",{"Burritos":"160 g"}],
 ["yogurt","HOFER","Natural yogurt, 500 g","1",0.94,"store",{"Middle Eastern":"160 g","Mexican":"144 g"}],
 ["milk","HOFER","Milk, 1 L","1",1.19,"est",{"Pancakes":"300–400 g"}],
 ["mayo","HOFER","Light mayonnaise","1 jar",1.49,"est",{"Middle Eastern":"70–80 g","Mexican":"64 g"}],
 ["chilli","HOFER","Chilli-garlic sauce","1 bottle",2.49,"est",{"Middle Eastern":"60–70 g"}],
 ["paste","HOFER","Tomato paste, 200 g","1",1.29,"est",{"Burritos":"120 g","Cajun":"26–30 g","Middle Eastern":"15 g"}],
 ["passata","HOFER","Passata, 500 g","1",0.79,"est",{"Alfredo":"150 g"}],
 ["corn","HOFER","Sweetcorn, can","2",1.78,"est",{"Mexican":"360 g drained"}],
 ["oats","HOFER","Oats, 500 g","1",0.95,"est",{"Pancakes":"288 g"}],
 ["bp","HOFER","Baking powder","1 pack",0.79,"est",{"Pancakes":"48 g"}],
 ["banana","HOFER","Bananas","5",1.52,"est",{"Pancakes":"5"}],
 ["onion","HOFER","Onions, 1 kg net","1",1.29,"est",{"Burritos":"225 g","Cajun":"1 small","Alfredo":"1 small","Middle Eastern":"100–120 g"}],
 ["redonion","HOFER","Red onion","1",0.30,"est",{"Mexican":"80 g"}],
 ["garlic","HOFER","Garlic, 1 net","1",0.99,"est",{"Burritos":"6 cloves","Alfredo":"4 cloves"}],
 ["tomato","HOFER","Tomatoes","400 g",1.00,"est",{"Middle Eastern":"400 g"}],
 ["pepper","HOFER","Red bell pepper","1",0.79,"est",{"Mexican":"120–160 g"}],
 ["lemon","HOFER","Lemons","2",0.80,"est",{"Middle Eastern":"2"}],
 ["lime","HOFER","Limes","2",0.80,"est",{"Mexican":"2"}],
 ["parsley","HOFER","Fresh parsley","3 bunches",2.67,"est",{"Middle Eastern":"80–100 g"}],
 ["spring","HOFER","Spring onions","1 bunch",0.79,"est",{"Middle Eastern":"80–100 g"}],
 ["coriander","HOFER","Fresh coriander","1 bunch",1.49,"est",{"Mexican":"20–24 g"}],
 ["chives","HOFER","Chives","1 bunch",0.89,"est",{"Burritos":"16–24 g"}],
 ["eiklar","BILLA","Liquid egg white (485 ml)","3 bottles",14.97,"store",{"Pancakes":"1,500 g"}],
 ["rice","BILLA","Basmati rice, 500 g","2 packs",5.70,"store",{"Middle Eastern":"270 g","Mexican":"320 g"}],
 ["pasta","BILLA","Pasta or spaghetti, 500 g","1",0.85,"store",{"Alfredo":"230 g"}],
 ["p-oil","PANTRY","Olive oil, 500 ml","1",4.99,"est",{"Burritos":"~12 g","Middle Eastern":"20–25 g","Mexican":"12–16 g"}],
 ["p-honey","PANTRY","Honey","1",3.49,"est",{"Middle Eastern":"10–15 g"}],
 ["p-spray","PANTRY","Cooking spray","1",2.99,"est",{"Pancakes":"a little"}],
 ["p-sumac","PANTRY","Sumac","1",2.49,"est",{"Middle Eastern":"a pinch"}],
 ["p-sweet","PANTRY","Sweetener","1",1.99,"est",{"Pancakes":"to taste"}],
 ["p-cajun","PANTRY","Cajun seasoning","1",1.99,"est",{"Cajun":"to taste"}],
 ["p-smoked","PANTRY","Smoked paprika","1",1.49,"est",{"Burritos":"~1 tbsp"}],
 ["p-pepper","PANTRY","Black pepper","1",1.29,"est",{"Burritos":"to taste","Cajun":"to taste","Alfredo":"to taste"}],
 ["p-garlicp","PANTRY","Garlic powder","1",1.29,"est",{"Burritos":"1 tsp","Middle Eastern":"4 g","Mexican":"4 g"}],
 ["p-onionp","PANTRY","Onion powder","1",1.29,"est",{"Burritos":"1 tsp","Middle Eastern":"4 g","Mexican":"3 g"}],
 ["p-cumin","PANTRY","Cumin","1",1.29,"est",{"Middle Eastern":"4–5 g","Mexican":"4 g"}],
 ["p-paprika","PANTRY","Sweet paprika","1",0.99,"est",{"Middle Eastern":"~8 g","Mexican":"6 g"}],
 ["p-oregano","PANTRY","Oregano","1",0.99,"est",{"Middle Eastern":"3 g"}],
 ["p-parsley","PANTRY","Dried parsley","1",0.99,"est",{"Middle Eastern":"2 g"}],
 ["p-turmeric","PANTRY","Turmeric","1",0.99,"est",{"Middle Eastern":"1 tsp"}],
 ["p-italian","PANTRY","Italian herbs","1",0.99,"est",{"Cajun":"to taste","Alfredo":"to taste","Middle Eastern":"1 tsp"}],
 ["p-chilli","PANTRY","Chilli powder","1",0.99,"est",{"Burritos":"½–1 tsp","Mexican":"~2 g"}],
 ["p-flakes","PANTRY","Chilli flakes","1",0.99,"est",{"Alfredo":"optional"}],
 ["p-cinnamon","PANTRY","Cinnamon","1",0.99,"est",{"Pancakes":"8 g"}],
 ["p-vanilla","PANTRY","Vanilla","1",0.99,"est",{"Pancakes":"20 ml"}],
 ["p-salt","PANTRY","Salt","1",0.39,"est",{"Burritos":"to taste","Middle Eastern":"4–5 g","Mexican":"4 g"}]
];
// Recipes: defaults in recipes.js, the user's edits and own meals in settings.recipes
const DEF=window.DEFAULT_RECIPES||{};
function R(){
  const own=(S.settings&&S.settings.recipes)||{};const out={};
  Object.keys(DEF).forEach(k=>{if(own[k]&&own[k].deleted)return;out[k]=Object.assign({id:k,builtin:true},DEF[k],own[k]||{},{edited:!!own[k]})});
  Object.keys(own).forEach(k=>{if(!DEF[k]&&!own[k].deleted)out[k]=Object.assign({id:k,builtin:false},own[k])});
  return out;
}
function bySlot(sl){return Object.values(R()).filter(r=>r.slot===sl)}
const DINNERS=["Cajun","Cajun","Alfredo","Alfredo","Middle Eastern","Middle Eastern","Mexican","Mexican"];
const STORE_OPTS=[["SPAR","SPAR / INTERSPAR"],["HOFER","HOFER"],["BILLA","BILLA"],["LIDL","Lidl"],["OTHER","Other store"],["PANTRY","Pantry"]];
const ACTIVITY=[["1.2","Mostly sitting"],["1.375","Light (1–3 workouts/week)"],["1.55","Moderate (3–5/week)"],["1.725","Hard (6–7/week)"],["1.9","Very hard or physical job"]];

function items(){
  const st=S.settings||{};const hid=st.hiddenItems||[];
  const own=(st.customItems||[]).map(c=>[c.id,c.store||"OTHER",c.name,c.buy||"",num(c.price)||0,"mine",{}]);
  return ITEMS.filter(i=>!hid.includes(i[0])).concat(own);
}
/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s);
const today=()=>iso(new Date());
const tripOf=day=>PW.tripOf(day);
function fmtDate(s,opt){return parse(s).toLocaleDateString("en-GB",opt||{weekday:"short",day:"numeric",month:"short"})}
function toast(msg){document.querySelectorAll(".toast").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
const ic=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const SLOT_IC={breakfast:"sun",lunch:"bowl",dinner:"moon",snack:"bolt"};
const slotIc=sl=>ic(Object.prototype.hasOwnProperty.call(SLOT_IC,sl)?SLOT_IC[sl]:"bowl");
const reduceMotion=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme (only the choice is stored, under its own key) ---------- */
function effTheme(){return document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}
function syncTheme(){const d=effTheme()==="dark",b=$("#theme");b.innerHTML=ic(d?"sun":"moon");b.setAttribute("aria-label",d?"Switch to light theme":"Switch to dark theme")}
$("#theme").addEventListener("click",()=>{const n=effTheme()==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("prepwise-theme",n)}catch(e){}syncTheme();if(S.tab==="progress")drawChart()});
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{syncTheme();if(S.tab==="progress")drawChart()})}catch(e){}
syncTheme();

/* ---------- State & storage ---------- */
const S={tab:"home",group:"store",shopFilter:"remaining",pinned:{},trip:tripOf(today()),logTrip:tripOf(today()),items:{},settings:{},log:{},weights:{},user:null,cloud:false,loading:false};
let sb=null;
try{if(window.supabase)sb=window.supabase.createClient(SB_URL,SB_KEY)}catch(e){sb=null}

function loadLocal(){let raw=null;try{raw=localStorage.getItem(LKEY)}catch(e){}Object.assign(S,PW.normalizeLocal(raw))}
function saveLocal(){try{localStorage.setItem(LKEY,PW.serializeLocal(S))}catch(e){}}

async function loadCloud(){
  const [a,b,c,d]=await Promise.all([
    sb.from("mp_items").select("trip_date,item_id,status,paid,store"),
    sb.from("mp_settings").select("data").maybeSingle(),
    sb.from("mp_log").select("day,slot,meal,eaten,kcal"),
    sb.from("mp_weights").select("day,kg")
  ]);
  if(a.error||b.error||c.error||d.error)throw (a.error||b.error||c.error||d.error);
  Object.assign(S,PW.mapCloud(a.data,b.data,c.data,d.data));
}
async function withSave(fn){
  saveLocal();
  if(!S.cloud)return;
  try{const {error}=await fn();if(error)throw error}catch(e){toast("Couldn't sync that change. Check your connection.")}
}
function putItem(trip,id,rec){
  const t=S.items[trip]=S.items[trip]||{};
  const empty=!rec.status&&rec.paid==null&&!rec.store;
  if(empty)delete t[id];else t[id]=rec;
  return withSave(()=>empty
    ?sb.from("mp_items").delete().eq("trip_date",trip).eq("item_id",id)
    :sb.from("mp_items").upsert({user_id:S.user.id,trip_date:trip,item_id:id,status:rec.status||null,paid:rec.paid,store:rec.store||null,updated_at:new Date().toISOString()},{onConflict:"user_id,trip_date,item_id"}));
}
function putSettings(){return withSave(()=>sb.from("mp_settings").upsert({user_id:S.user.id,data:S.settings,updated_at:new Date().toISOString()},{onConflict:"user_id"}))}
function putLog(day,slot,rec){
  (S.log[day]=S.log[day]||{})[slot]=rec;
  return withSave(()=>sb.from("mp_log").upsert({user_id:S.user.id,day,slot,meal:rec.meal||null,eaten:!!rec.eaten,kcal:rec.kcal==null?null:Math.round(rec.kcal),updated_at:new Date().toISOString()},{onConflict:"user_id,day,slot"}));
}
function putWeight(day,kg){
  if(kg==null)delete S.weights[day];else S.weights[day]=kg;
  return withSave(()=>kg==null?sb.from("mp_weights").delete().eq("day",day):sb.from("mp_weights").upsert({user_id:S.user.id,day,kg},{onConflict:"user_id,day"}));
}
async function clearTrip(trip){
  delete S.items[trip];
  return withSave(()=>sb.from("mp_items").delete().eq("trip_date",trip));
}

/* ---------- Calculations ---------- */
function tripTotals(trip){return PW.tripTotals(items(),S.items[trip])}
function dinnerFor(day){const n=((diffDays(ANCHOR,day)%14)+14)%14;const r=R();const d=DINNERS[n%8];if(r[d]&&r[d].slot==="dinner")return d;const ds=bySlot("dinner");return ds.length?ds[n%ds.length].id:null}
function defSlot(sl){const p=(S.settings.plan||{})[sl];const r=R();if(p&&r[p])return p;const def=sl==="breakfast"?"Burritos":"Pancakes";if(r[def]&&r[def].slot===sl)return def;const l=bySlot(sl);return l.length?l[0].id:null}
function plannedDay(){
  const r=R(),ds=bySlot("dinner");const avg=k=>ds.length?ds.reduce((a,m)=>a+(num(m[k])||0),0)/ds.length:0;
  const b=r[defSlot("breakfast")]||{},l=r[defSlot("lunch")]||{};
  const extra=num(S.settings.extraKcal)||0;
  return {kcal:(num(b.kcal)||0)+(num(l.kcal)||0)+avg("kcal")+extra,p:(num(b.p)||0)+(num(l.p)||0)+avg("p")};
}
function dayEaten(day){
  const L=S.log[day]||{};let kcal=0,p=0,any=false;
  ["breakfast","lunch","dinner"].forEach(sl=>{const e=L[sl];if(e&&e.eaten){const m=R()[e.meal||(sl==="dinner"?dinnerFor(day):defSlot(sl))];if(m){kcal+=num(m.kcal)||0;p+=num(m.p)||0;any=true}}});
  if(L.extra&&L.extra.kcal){kcal+=L.extra.kcal;any=true}
  return {kcal,p,any};
}
function loggedAvg(){
  const days=[];for(let i=1;i<=14;i++){const d=addDays(today(),-i);const e=dayEaten(d);if(e.any)days.push(e)}
  const t=dayEaten(today());if(t.any)days.push(t);
  if(days.length<3)return null;
  return {kcal:days.reduce((a,d)=>a+d.kcal,0)/days.length,p:days.reduce((a,d)=>a+d.p,0)/days.length,n:days.length};
}
const body=()=>PW.bodyStats(S.settings);

/* ---------- Render ---------- */
function render(opt){
  document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===S.tab?"page":"false"));
  const acct=$("#acct");
  if(S.user){acct.textContent="Synced";acct.classList.add("on");acct.title="Signed in as "+(S.user.email||"")}
  else{acct.textContent=sb?"Sign in to sync":"This device";acct.classList.remove("on");acct.title=""}
  const m=$("#main");
  m.innerHTML=S.tab==="home"?viewHome():S.tab==="shop"?viewShop():S.tab==="cooking"?viewCooking():S.tab==="meals"?viewMeals():S.tab==="progress"?viewProgress():viewCook();
  m.classList.remove("enter");
  if(opt&&opt.enter&&!reduceMotion()){[...m.children].forEach((c,i)=>c.style.setProperty("--i",i));void m.offsetWidth;m.classList.add("enter")}
  if(S.tab==="progress")drawChart();
}
/* Switch section: render with a staggered entrance, reset scroll, move focus to the content for screen readers. */
function go(tab,pre){if(tab!==S.tab)S.pinned={};S.tab=tab;if(pre)pre();render({enter:true});window.scrollTo(0,0);main.focus({preventScroll:true})}

/* ---------- Home dashboard ---------- */
const SLOT_RANK={breakfast:0,lunch:1,dinner:2,snack:3};
function ringSvg(frac,label,sub,size){
  const c=2*Math.PI*36,v=Math.max(0,Math.min(1,frac||0));
  return `<div class="ring" style="--s:${size||88}px;--circ:${c.toFixed(1)};--v:${v.toFixed(3)}" role="img" aria-label="${esc(label)}${sub?" "+esc(sub):""}"><svg viewBox="0 0 88 88" aria-hidden="true"><circle class="tr" cx="44" cy="44" r="36"/><circle class="fg" cx="44" cy="44" r="36"/></svg><div class="mid"><span>${esc(label)}${sub?`<small>${esc(sub)}</small>`:""}</span></div></div>`;
}
function macroShare(m){const p=(num(m.p)||0)*4,c=(num(m.c)||0)*4,f=(num(m.f)||0)*9,t=p+c+f;if(!t)return "";
  const w=x=>Math.round(x/t*100);return `<div class="macrobar" role="img" aria-label="Energy from protein ${w(p)}%, carbs ${w(c)}%, fat ${w(f)}%"><i class="mp" style="width:${w(p)}%"></i><i class="mc" style="width:${w(c)}%"></i><i class="mf" style="width:${w(f)}%"></i></div>`}
function sparkline(vals){
  if(vals.length<2)return "";const lo=Math.min(...vals),hi=Math.max(...vals),rng=hi-lo||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1)*200).toFixed(1)},${(52-(v-lo)/rng*44).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function skeletonHome(){
  return `<p class="muted small" role="status">Loading your plan…</p><div class="skel hero-s" aria-hidden="true"></div>
  <div class="dash cols" aria-hidden="true"><div class="skel c w3"></div><div class="skel c w3"></div><div class="skel c w3"></div><div class="skel c w3"></div></div>`;
}
function viewHome(){
  if(S.loading)return skeletonHome();
  const td=today(),cur=tripOf(td),next=PW.nextCookDay(td),left=diffDays(td,next),rs=R();
  const nm=S.settings.displayName||(S.user&&S.user.email?S.user.email.split("@")[0]:"");
  const t=tripTotals(cur),all=items(),eaten=dayEaten(td),pd=plannedDay();
  const nextTxt=left===0?"Today":left===1?"Tomorrow":"In "+left+" days";
  const toBuy=all.filter(i=>i[1]!=="PANTRY"&&!((S.items[cur]||{})[i[0]]||{}).status).length;

  // today's meals
  const L=S.log[td]||{};
  const mealRow=sl=>{const x=L[sl]||{};const def=sl==="dinner"?dinnerFor(td):defSlot(sl);const id=x.meal&&rs[x.meal]?x.meal:def;const m=rs[id];
    if(!m)return `<li class="tmeal" data-slot="${sl}"><span class="bub">${slotIc(sl)}</span><span><span class="t">${sl[0].toUpperCase()+sl.slice(1)}</span><span class="meta">No meal chosen yet</span></span><span></span></li>`;
    return `<li class="tmeal${x.eaten?" is-eaten":""}" data-slot="${sl}"><span class="bub">${slotIc(sl)}</span>
      <span><span class="eyebrow">${sl}</span><span class="t">${esc(m.name)}</span><span class="meta">${Math.round(num(m.kcal)||0)} kcal · ${r1(num(m.p)||0)} g protein</span></span>
      <button type="button" class="chip" data-act="eat" data-day="${td}" data-slot="${sl}" data-meal="${esc(id)}" aria-pressed="${!!x.eaten}" aria-label="${sl} eaten today: ${esc(m.name)}">${x.eaten?"Eaten":"Eat"}</button></li>`};
  const target=pd.kcal||0,frac=target?eaten.kcal/target:0;

  // upcoming tasks: shop first, then recipes in cooking order (breakfast and lunch, then dinners)
  const order=Object.values(rs).sort((a,b)=>(SLOT_RANK[a.slot]??9)-(SLOT_RANK[b.slot]??9));
  const tasks=order.map((r,i)=>`<li><button type="button" class="task" data-act="gocook" data-id="${esc(r.id)}"><span class="num">${i+2}</span><span><span class="t">${esc(r.name)}</span><span class="meta">${esc(r.time||"")}${r.time?" · ":""}makes ${esc(r.serves)} × ${esc(r.servingLabel||"serving")}</span></span>${ic("arrow")}</button></li>`).join("");

  // progress summary
  const ws=Object.keys(S.weights).sort(),last=ws.length?S.weights[ws[ws.length-1]]:null,first=ws.length?S.weights[ws[0]]:null;
  const goal=num(S.settings.goal),la=loggedAvg();
  let prog;
  if(!ws.length){prog=`<div class="empty"><span class="art">${ic("scale")}</span><b>No weigh-ins yet</b><span class="small">Log your weight once a week to see your trend here.</span><button class="btn sm" type="button" data-act="logweight">${ic("plus")}Log weigh-in</button></div>`}
  else{const d=last-first;
    prog=`<div class="row between" style="align-items:flex-end"><div><span class="bignum">${last.toFixed(1)}<small class="muted" style="font:600 .9rem var(--body)"> kg</small></span>
      ${ws.length>1?`<div class="delta ${d<=0?"down":"up"}">${d>0?"+":""}${r1(d)} kg since ${fmtDate(ws[0],{day:"numeric",month:"short"})}</div>`:`<div class="muted small">First weigh-in logged</div>`}</div>
      ${goal?`<div class="small muted" style="text-align:right">Goal ${goal} kg<br><b style="color:var(--fg)">${r1(Math.abs(last-goal))} kg to go</b></div>`:""}</div>${sparkline(ws.slice(-12).map(k=>S.weights[k]))}`}

  return `<section class="hero">
    <div><span class="eyebrow">${fmtDate(td,{weekday:"long",day:"numeric",month:"long"})}</span>
      <h2>${PW.greeting(new Date().getHours())}${nm?", "+esc(nm):""}</h2>
      <p>${left===0?"It's shop and cook day. Your list is ready.":toBuy>0?`${toBuy} item${toBuy===1?"":"s"} still to sort before cook day.`:"Your grocery list is all sorted."}</p></div>
    <div class="next"><span class="count">${left===0?"Today":left}</span><span><b>${left===0?"Shop and cook day":left===1?"day to cook day":"days to cook day"}</b><span>${fmtDate(next,{weekday:"long",day:"numeric",month:"long"})}</span></span></div>
    <div class="row"><button class="btn" type="button" data-act="gotab" data-tab="shop">${ic("cart")}Open grocery list</button><button class="btn ghost" type="button" data-act="gotab" data-tab="cooking">${ic("pot")}Cooking guides</button></div>
  </section>
  <div class="dash cols">
    <section class="card w3" aria-labelledby="h-today"><div class="row between"><h3 id="h-today">${ic("plate")}Today's meals</h3><span class="eyebrow">${fmtDate(td,{day:"numeric",month:"short"})}</span></div>
      <ul>${["breakfast","lunch","dinner"].map(mealRow).join("")}</ul>
      <div style="display:flex;gap:14px;align-items:center">${ringSvg(frac,Math.round(Math.min(frac,9.99)*100)+"%","of plan",76)}
        <p class="small muted"><b style="color:var(--fg)">${Math.round(eaten.kcal)} kcal</b> and <b style="color:var(--fg)">${Math.round(eaten.p)} g protein</b> eaten so far${target?` of about ${Math.round(target)} kcal planned`:""}.</p></div></section>
    <section class="card w3" aria-labelledby="h-shop"><div class="row between"><h3 id="h-shop">${ic("cart")}Grocery progress</h3><span class="eyebrow">Trip ${fmtDate(cur,{day:"numeric",month:"short"})}</span></div>
      <div style="display:flex;gap:16px;align-items:center">${ringSvg(t.total?t.done/t.total:0,t.done+"/"+t.total,"sorted",88)}
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:0"><div class="row between small"><span class="muted">Spent${t.est?" (est.)":""}</span><b class="price">${eur(t.spent)} <span class="muted" style="font-weight:500">of ${eur(t.planned)}</span></b></div>
        <div class="bar${t.spent>t.planned?" offer":""}" role="img" aria-label="Spent ${eur(t.spent)} of ${eur(t.planned)} planned"><i style="--v:${Math.min(100,t.planned?t.spent/t.planned*100:0).toFixed(1)}"></i></div>
        <div class="row between small"><span class="muted">Still to buy</span><b class="price">${eur(t.left)}</b></div></div></div>
      <button class="btn ghost sm" type="button" data-act="gotab" data-tab="shop" style="align-self:flex-start">Continue shopping${ic("arrow")}</button></section>
    <section class="card w3" aria-labelledby="h-tasks"><div class="row between"><h3 id="h-tasks">${ic("list")}Upcoming cooking tasks</h3><span class="eyebrow">${nextTxt}</span></div>
      <ul><li><button type="button" class="task" data-act="gotab" data-tab="shop"><span class="num">1</span><span><span class="t">Shop for the batch</span><span class="meta">${toBuy?toBuy+" items still to buy":"Everything sorted"}</span></span>${ic("arrow")}</button></li>${tasks}</ul></section>
    <section class="card w3" aria-labelledby="h-prog"><div class="row between"><h3 id="h-prog">${ic("trend")}Progress</h3><button class="chip" type="button" data-act="gotab" data-tab="progress">Details</button></div>
      ${prog}
      <div class="grid2"><div class="ov"><span>${la?"Avg logged":"Planned day"}</span><b>${Math.round(la?la.kcal:pd.kcal)} kcal</b></div><div class="ov"><span>Protein</span><b>${Math.round(la?la.p:pd.p)} g</b></div></div></section>
  </div>
  <div class="quick" role="group" aria-label="Quick actions">
    <button type="button" class="qa" data-act="gotab" data-tab="shop"><span class="bub">${ic("cart")}</span><span>Grocery list<small>${toBuy} to buy</small></span></button>
    <button type="button" class="qa" data-act="logweight"><span class="bub">${ic("scale")}</span><span>Log weight<small>${last?last.toFixed(1)+" kg last":"Start tracking"}</small></span></button>
    <button type="button" class="qa" data-act="gotab" data-tab="cooking"><span class="bub">${ic("pot")}</span><span>Start cooking<small>${Object.keys(rs).length} guides</small></span></button>
    <button type="button" class="qa" data-act="ics"><span class="bub">${ic("cal")}</span><span>Add to calendar<small>Cook day reminders</small></span></button>
  </div>`;
}

function tripOptions(sel){
  const cur=tripOf(today());const list=[];let t=ANCHOR;
  while(diffDays(t,cur)>=0){list.push(t);t=addDays(t,14)}
  Object.keys(S.items).forEach(k=>{if(!list.includes(k))list.push(k)});
  list.sort().reverse();
  return list.map(t=>`<option value="${esc(t)}" ${t===sel?"selected":""}>${fmtDate(t,{day:"numeric",month:"short",year:"numeric"})}${t===cur?" (current)":""}</option>`).join("");
}
function itemRow(i,extra){
  const [id,,name,buy,price,src]=i;const r=(S.items[S.trip]||{})[id]||{};const st=r.status==="have"||r.status==="bought"?r.status:"";
  const right=st==="bought"&&r.paid!=null?`${eur(r.paid)}<small>you paid</small>`:st==="have"?`${eur(price)}<small>at home</small>`:`${eur(price)}<small>${src==="est"?"est.":"store price"}</small>`;
  const diff=st==="bought"&&r.paid!=null?(price-r.paid>=0?`<span class="diff save">${eur(price-r.paid)} under my price</span>`:`<span class="diff more">${eur(r.paid-price)} over my price</span>`):"";
  const tag=src==="offer"?'<span class="tag offer">Offer to 18 Nov</span>':"";
  return `<li class="item${st?" is-"+st:""}">
    <span><span class="name">${esc(name)}</span><span class="meta">${extra}</span>${tag}</span>
    <span class="price">${right}</span>
    <span class="acts">
      <button type="button" class="chip have" data-act="status" data-id="${esc(id)}" data-st="have" aria-pressed="${st==="have"}">I have it</button>
      <button type="button" class="chip" data-act="status" data-id="${esc(id)}" data-st="bought" aria-pressed="${st==="bought"}">Bought</button>
    </span>
    ${st==="bought"?`<span class="pricefields">
      <input type="text" inputmode="decimal" id="paid-${esc(id)}" data-act="paid" data-id="${esc(id)}" placeholder="Paid €" aria-label="What you paid for ${esc(name)}" value="${r.paid==null||isNaN(Number(r.paid))?"":Number(r.paid).toFixed(2).replace(".",",")}">
      <input type="text" id="store-${esc(id)}" data-act="store" data-id="${esc(id)}" placeholder="Store" aria-label="Where you bought ${esc(name)}" value="${esc(r.store)}">
      ${diff}</span>`:""}
  </li>`;
}
function budgetCard(t){
  const budget=PW.parseBudget((S.settings.tripBudgets||{})[S.trip]).value;
  const b=PW.budgetStatus(t.spent,t.left,budget);
  return `<section class="card" aria-label="Shopping budget"><div class="row between"><h3>Trip budget</h3><label class="f" for="trip-budget">Budget (€)<input type="text" id="trip-budget" inputmode="decimal" data-act="tripbudget" value="${budget==null?"":esc(String(budget).replace(".",","))}" placeholder="Set budget" style="max-width:130px"></label></div>
    <p class="muted small">Estimated checkout: ${eur(b.total)} · ${eur(t.spent)} purchased · ${eur(t.left)} still to buy. Pantry items are not counted.</p>
    ${budget==null?"":`<p class="small" aria-live="polite"><strong>${b.over?eur(-b.diff)+" over budget":eur(b.diff)+" under budget"}</strong> based on the estimated total. Enter actual prices for more accuracy.</p><div class="bar${b.over?" offer":""}" role="img" aria-label="Estimated spending ${eur(b.total)} of ${eur(budget)} budget"><i style="--v:${Math.min(100,budget?b.total/budget*100:100).toFixed(1)}"></i></div>`}</section>`;
}
function viewShop(){
  const t=tripTotals(S.trip);const cur=tripOf(today());const all=items();const ed=S.editList;
  let html=`<section class="row between"><div><h2>Grocery list</h2><p class="muted small">${ed?"Editing your list":"Everything you need for this two-week prep"}</p></div>
    <label class="f" for="tripsel">Shopping trip<select id="tripsel" data-act="trip">${tripOptions(S.trip)}</select></label></section>
  <section class="stats" aria-label="Trip totals">
    <div class="stat"><b>${eur(t.planned)}</b><span>Planned</span></div>
    <div class="stat have"><b>${eur(t.have)}</b><span>Already have</span></div>
    <div class="stat spent"><b>${t.est?"~":""}${eur(t.spent)}</b><span>Spent</span></div>
    <div class="stat"><b>${eur(t.left)}</b><span>Still to buy</span></div>
  </section>
  ${budgetCard(t)}
  <section class="card" aria-label="Shopping completion">
    ${(()=>{const recs=S.items[S.trip]||{};const needed=all.filter(i=>recs[i[0]]?.status!=="have");const bought=needed.filter(i=>recs[i[0]]?.status==="bought").length;const remaining=needed.length-bought;const pct=needed.length?Math.round(100*bought/needed.length):100;return `<div class="row between"><h3>Shopping progress</h3><strong>${pct}% complete</strong></div><progress value="${bought}" max="${needed.length||1}" style="width:100%;accent-color:var(--accent,#23865a)" aria-label="Groceries purchased"></progress><p class="muted small" aria-live="polite">${bought} bought · ${remaining} left to buy · ${all.length-needed.length} already at home</p>`})()}
  </section>
  <p class="muted small">${t.done} of ${all.length} items sorted.${t.est?" “~” means some bought items use my price until you type yours.":""} ${S.trip!==cur?"You're looking at a past trip.":""}</p>
  <div class="row between"><div class="seg" role="group" aria-label="Group by">
    <button type="button" data-act="group" data-g="store" aria-pressed="${S.group==="store"}">By store</button>
    <button type="button" data-act="group" data-g="meal" aria-pressed="${S.group==="meal"}">By meal</button></div>
    <button class="btn ghost" type="button" data-act="editlist">${ed?"Done editing":"Edit list"}</button></div>`;
  if(ed){
    html+=`<section class="card"><h3>Add an item</h3>
      <form data-form="additem" class="grid2">
        <label class="f" for="ni-name">Item<input type="text" id="ni-name" required maxlength="80" placeholder="e.g. Greek yogurt 1 kg"></label>
        <label class="f" for="ni-buy">How much to buy<input type="text" id="ni-buy" maxlength="40" placeholder="e.g. 2 tubs"></label>
        <label class="f" for="ni-price">Expected price, €<input type="text" inputmode="decimal" id="ni-price" placeholder="e.g. 2,49"></label>
        <label class="f" for="ni-store">Store<select id="ni-store">${STORE_OPTS.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></label>
        <div class="row"><button class="btn" type="submit">Add to list</button></div>
      </form>
      ${(S.settings.hiddenItems||[]).length?`<p class="small muted">${S.settings.hiddenItems.length} of my default items are hidden. <button class="chip" type="button" data-act="unhide">Show them again</button></p>`:""}</section>`;
  }
  if(!ed)html+=`<div class="row between"><div class="seg" role="group" aria-label="Show groceries"><button type="button" data-act="shopfilter" data-filter="remaining" aria-pressed="${S.shopFilter==="remaining"}">Remaining</button><button type="button" data-act="shopfilter" data-filter="all" aria-pressed="${S.shopFilter==="all"}">All</button><button type="button" data-act="shopfilter" data-filter="bought" aria-pressed="${S.shopFilter==="bought"}">Bought</button></div></div>`;
  const visible=ed?all:all.filter(i=>{const status=(S.items[S.trip]||{})[i[0]]?.status;return S.shopFilter==="all"||S.pinned[i[0]]||(S.shopFilter==="bought"?status==="bought":!status)}); // pinned: a row you just tapped stays put so you can enter its price
  if(!ed&&!visible.length)html+=`<section class="card"><p class="muted">No items in this view. Choose All to see your full list.</p></section>`;
  const rowFor=(i,extra)=>ed?`<li class="item"><span><span class="name">${esc(i[2])}</span><span class="meta">${esc(i[3])} · ${eur(i[4])}</span></span><span class="price"><button class="chip" type="button" data-act="rmitem" data-id="${esc(i[0])}" aria-label="Remove ${esc(i[2])}">Remove</button></span></li>`:itemRow(i,extra);
  if(S.group==="store"){
    for(const s of Object.keys(STORES)){
      const its=visible.filter(i=>i[1]===s);if(!its.length)continue;const recs=S.items[S.trip]||{};
      const open=its.filter(i=>!(recs[i[0]]||{}).status).reduce((a,i)=>a+i[4],0);
      html+=`<section class="group"><div class="ghead"><h3>${STORES[s].name}</h3><span class="gtot">${eur(open)} to buy</span></div><p class="muted small">${STORES[s].note}</p><ul>`;
      its.slice().sort((a,b)=>b[4]-a[4]).forEach(i=>{const u=Object.keys(i[6]);html+=rowFor(i,`Buy ${esc(i[3])}${u.length?" · for "+u.map(k=>esc((R()[k]||{}).name||k)).join(", "):""}`)});
      html+=`</ul></section>`;
    }
  }else{
    const groups=DISH.map(d=>[d,visible.filter(i=>i[6][d])]).concat([["My added items",visible.filter(i=>!Object.keys(i[6]).length)]]);
    for(const [d,its] of groups){
      if(!its.length)continue;const recs=S.items[S.trip]||{};
      html+=`<section class="group"><div class="ghead"><h3>${esc((R()[d]||{}).name||d)}</h3><span class="gtot">${its.filter(i=>(recs[i[0]]||{}).status).length}/${its.length} sorted</span></div><ul>`;
      its.forEach(i=>{html+=rowFor(i,`${i[6][d]?"Need "+esc(i[6][d])+" · ":""}buy ${esc(i[3])}${i[1]==="PANTRY"?"":" at "+(STORES[i[1]]?STORES[i[1]].name.replace(/^Stop \d · /,""):esc(i[1]))}`)});
      html+=`</ul></section>`;
    }
  }
  const trips=Object.keys(S.items).filter(k=>Object.keys(S.items[k]).length).sort().reverse();
  if(trips.length&&!ed){
    html+=`<section class="card"><h3>Spending history</h3><div class="tablewrap"><table><thead><tr><th>Trip</th><th class="n">Spent</th><th class="n">Had at home</th><th class="n">vs plan</th></tr></thead><tbody>`;
    trips.forEach(k=>{const x=tripTotals(k);const d=x.planned-x.have-x.spent;
      html+=`<tr><td>${fmtDate(k,{day:"numeric",month:"short"})}</td><td class="n">${x.est?"~":""}${eur(x.spent)}</td><td class="n">${eur(x.have)}</td><td class="n">${d>=0?"−":"+"}${eur(Math.abs(d))}</td></tr>`});
    html+=`</tbody></table></div><p class="muted small">“vs plan” compares what you spent with my planned total minus what you already had.</p></section>`;
  }
  if(!trips.length&&!ed)html+=`<section class="card"><div class="empty"><span class="art">${ic("cart")}</span><b>Your spending history starts here</b><span class="small">Mark items as bought and add what you paid. Each trip is saved so you can compare against your plan.</span></div></section>`;
  if(!ed)html+=`<section class="row"><button class="btn danger" type="button" data-act="reset">Reset this trip</button></section>`;
  return html;
}
function macroBox(m){const v=k=>num(m[k])||0;return `<div class="macro"><div><b>${Math.round(v("kcal"))}</b><span>kcal</span></div><div><b>${r1(v("p"))}</b><span>Protein</span></div><div><b>${r1(v("c"))}</b><span>Carbs</span></div><div><b>${r1(v("f"))}</b><span>Fat</span></div><div><b>${r1(v("fib"))}</b><span>Fibre</span></div></div>`}
function viewMeals(){
  const pd=plannedDay(),rs=R();
  const opt=(sl,sel)=>bySlot(sl).map(r=>`<option value="${esc(r.id)}" ${r.id===sel?"selected":""}>${esc(r.name)}</option>`).join("");
  let html=`<section><h2>Meals & nutrition</h2><p class="muted small">Per serving, estimated from typical label values. Tick what you eat each day to track your real intake.</p></section>
  <section class="card"><h3>A planned day</h3><p>${esc((rs[defSlot("breakfast")]||{}).name||"No breakfast")} + ${esc((rs[defSlot("lunch")]||{}).name||"no lunch")} + an average dinner${num(S.settings.extraKcal)?` + ${Math.round(num(S.settings.extraKcal))} kcal extras`:""} = <b>${Math.round(pd.kcal)} kcal</b> and <b>${Math.round(pd.p)} g protein</b>.</p>
  <div class="grid3">
   <label class="f" for="plan-b">Usual breakfast<select id="plan-b" data-act="plan" data-k="breakfast">${opt("breakfast",defSlot("breakfast"))}</select></label>
   <label class="f" for="plan-l">Usual lunch<select id="plan-l" data-act="plan" data-k="lunch">${opt("lunch",defSlot("lunch"))}</select></label>
   <label class="f" for="extra">Extras per day, kcal<input type="number" id="extra" data-act="setting" data-k="extraKcal" min="0" step="50" value="${esc(S.settings.extraKcal||"")}" placeholder="0"></label></div></section>`;
  const start=S.logTrip,td=today();
  html+=`<section class="row between"><h3>Food log</h3><label class="f" for="logsel">Two weeks starting<select id="logsel" data-act="logtrip">${tripOptions(start)}</select></label></section>`;
  for(let i=0;i<14;i++){
    const d=addDays(start,i),L=S.log[d]||{},e=dayEaten(d);
    const slot=(sl,label,def)=>{const x=L[sl]||{};const meal=x.meal&&rs[x.meal]?x.meal:def;
      const sel=`<select data-act="logmeal" data-day="${d}" data-slot="${sl}" aria-label="${label} on ${fmtDate(d)}">${opt(sl,meal)}</select>`;
      return `<div class="slot"><span class="lbl">${label}</span>${sel}<button type="button" class="chip" data-act="eat" data-day="${d}" data-slot="${sl}" data-meal="${esc(meal||"")}" aria-pressed="${!!x.eaten}" aria-label="${label} eaten on ${fmtDate(d)}">${x.eaten?"Eaten":"Eat"}</button></div>`};
    html+=`<article class="day${d===td?" today":""}"><div class="row between"><b>${fmtDate(d)}${d===td?" · today":""}</b><span class="muted small">${e.any?`${Math.round(e.kcal)} kcal · ${Math.round(e.p)} g protein`:"Nothing logged"}</span></div>
      ${slot("breakfast","Breakfast",defSlot("breakfast"))}${slot("lunch","Lunch",defSlot("lunch"))}${slot("dinner","Dinner",dinnerFor(d))}
      <div class="slot"><span class="lbl">Extras</span><input type="number" min="0" step="10" data-act="logextra" data-day="${d}" id="ex-${d}" aria-label="Extra calories on ${fmtDate(d)}" placeholder="kcal" value="${L.extra&&L.extra.kcal?esc(L.extra.kcal):""}"><span></span></div></article>`;
  }
  html+=`<section><h3>Per-serving nutrition</h3></section>`;
  Object.values(rs).forEach(m=>{
    html+=`<section class="card"><div class="row between"><h3>${esc(m.name)}</h3><span class="muted small">${esc(m.servingLabel||"1 serving")} · ${esc(m.slot)}</span></div>${macroBox(m)}
    ${(m.portion||[]).length?`<p class="small"><b>One portion:</b> ${(m.portion||[]).map(esc).join(" · ")}</p>`:""}</section>`;
  });
  html+=`<p class="muted small">Estimates, not lab values. Edit a meal in Cooking to change its numbers, or send Claude your labels.</p>`;
  return html;
}
/* ---------- Cooking Time ---------- */
const SCALES=[0.5,1,1.5,2];
function ckKey(id){return "prepwise-ck-"+id}
function getCk(id){try{return JSON.parse(localStorage.getItem(ckKey(id))||"{}")}catch(e){return {}}}
function setCk(id,v){try{localStorage.setItem(ckKey(id),JSON.stringify(v))}catch(e){}}
function viewCooking(){
  const rs=R();
  if(S.editRecipe)return viewEdit();
  if(S.recipe&&rs[S.recipe])return viewRecipe(rs[S.recipe]);
  let html=`<section><h2>Cooking Time</h2><p class="muted small">Step-by-step guides with amounts, oven settings, timers and portions. Every meal can be edited, and you can add your own.</p></section>`;
  ["breakfast","lunch","dinner","snack"].forEach(sl=>{
    const list=Object.values(rs).filter(r=>r.slot===sl);if(!list.length)return;
    html+=`<section class="group"><div class="ghead"><h3>${sl[0].toUpperCase()+sl.slice(1)}</h3><span class="gtot">${list.length} guide${list.length===1?"":"s"}</span></div>`;
    list.forEach(r=>{html+=`<button type="button" class="card rcard" data-act="open" data-id="${esc(r.id)}" data-slot="${esc(r.slot)}"><span class="tile">${slotIc(r.slot)}</span><span style="min-width:0"><span class="rt">${esc(r.name)}</span><span class="meta">${ic("clock")} ${esc(r.time||"No time set")} · makes ${esc(r.serves)} × ${esc(r.servingLabel||"serving")}</span>${macroShare(r)}${r.edited?'<span class="tag">Edited</span>':""}${!r.builtin?'<span class="tag">Your meal</span>':""}</span><span class="kc">${Math.round(num(r.kcal)||0)}<small>kcal each</small><em>${r1(num(r.p)||0)} g protein</em></span></button>`});
    html+=`</section>`;
  });
  html+=`<section class="row"><button class="btn" type="button" data-act="newrecipe">Add a meal</button>${Object.keys(S.settings.recipes||{}).some(k=>DEF[k]&&S.settings.recipes[k].deleted)?`<button class="btn ghost" type="button" data-act="restore">Restore deleted meals</button>`:""}</section>`;
  return html;
}
function viewRecipe(r){
  const f=S.scale||1,ck=getCk(r.id);
  let html=`<section class="row between"><button class="btn ghost" type="button" data-act="back">← All meals</button><button class="btn ghost" type="button" data-act="wake" aria-pressed="${!!S.wake}">${S.wake?"Screen stays on":"Keep screen on"}</button></section>
  <section><h2>${esc(r.name)}</h2><p class="muted small">Makes ${esc(scaleAmt(String(r.serves),f))} × ${esc(r.servingLabel||"serving")} · ${esc(r.time||"")} · ${Math.round(num(r.kcal)||0)} kcal and ${r1(num(r.p)||0)} g protein each</p></section>
  <div class="seg" role="group" aria-label="Batch size">${SCALES.map(x=>`<button type="button" data-act="scale" data-f="${x}" aria-pressed="${f===x}">${x===0.5?"½":x===1.5?"1½":x}×</button>`).join("")}</div>`;
  if((r.oven||[]).length)html+=`<section class="card"><h3>Oven & hob</h3><div class="ovgrid">${r.oven.map(o=>`<div class="ov"><span>${esc(o[0])}</span><b>${esc(o[1])}</b></div>`).join("")}</div></section>`;
  html+=`<section class="card"><div class="row between"><h3>Ingredients${f!==1?` · ${f}× batch`:""}</h3><span class="muted small">Tick as you weigh</span></div><ul>${(r.ingredients||[]).map((g,i)=>`<li><label class="ing${ck["i"+i]?" done":""}" for="ig-${i}"><input type="checkbox" id="ig-${i}" data-act="ck" data-k="i${i}" ${ck["i"+i]?"checked":""}><span><span class="amt">${esc(scaleAmt(g[0],f))}</span>${esc(g[1])}</span></label></li>`).join("")}</ul></section>`;
  html+=`<section class="card"><div class="row between"><h3>Steps</h3><span class="muted small">${f!==1?"Amounts in steps are for 1×":""}</span></div><ol style="list-style:none;margin:0;padding:0">${(r.steps||[]).map((t,i)=>{const p=stepParts(t);return `<li class="step${ck["s"+i]?" done":""}"><input type="checkbox" id="st-${i}" data-act="ck" data-k="s${i}" aria-label="Step ${i+1} done" ${ck["s"+i]?"checked":""}><span class="no">${i+1}</span><span><label for="st-${i}">${esc(p.text)}</label>${p.min?`<br><button class="chip tbtn" type="button" data-act="timer" data-min="${p.min}" data-label="${esc(r.name)}: step ${i+1}">Start ${p.min} min timer</button>`:""}</span></li>`}).join("")}</ol></section>`;
  if((r.portion||[]).length)html+=`<section class="card"><h3>Portioning</h3><ul>${r.portion.map(x=>`<li class="small" style="padding:4px 0">${esc(x)}</li>`).join("")}</ul><p class="muted small">Weigh each cooked component and divide by the number of servings for exact portions.</p></section>`;
  if((r.storage||[]).length)html+=`<section class="card"><h3>Storage & reheating</h3><ul>${r.storage.map(x=>`<li class="small" style="padding:4px 0">${esc(x)}</li>`).join("")}</ul></section>`;
  if(r.notes)html+=`<section class="note ok">${esc(r.notes)}</section>`;
  html+=`<section class="row"><button class="btn" type="button" data-act="edit" data-id="${esc(r.id)}">Edit this meal</button><button class="btn ghost" type="button" data-act="clearck">Clear ticks</button>
    ${r.builtin&&r.edited?`<button class="btn ghost" type="button" data-act="revert" data-id="${esc(r.id)}">Back to my original</button>`:""}
    <button class="btn danger" type="button" data-act="delrecipe" data-id="${esc(r.id)}">Delete meal</button></section>`;
  return html;
}
function linesOf(arr,pair){return (arr||[]).map(x=>pair?(x[0]+" | "+x[1]):x).join("\n")}
function viewEdit(){
  const id=S.editRecipe,r=id==="__new"?{name:"",slot:"dinner",serves:4,servingLabel:"1 bowl",time:"",kcal:"",p:"",c:"",f:"",fib:"",oven:[],ingredients:[],steps:[],portion:[],storage:[],notes:""}:R()[id];
  if(!r){S.editRecipe=null;return viewCooking()}
  return `<section class="row between"><h2>${id==="__new"?"Add a meal":"Edit meal"}</h2><button class="btn ghost" type="button" data-act="canceledit">Cancel</button></section>
  <form class="card" data-form="recipe">
   <label class="f" for="e-name">Name<input type="text" id="e-name" required maxlength="80" value="${esc(r.name)}"></label>
   <div class="grid3">
    <label class="f" for="e-slot">Meal<select id="e-slot">${["breakfast","lunch","dinner","snack"].map(x=>`<option ${x===r.slot?"selected":""}>${x}</option>`).join("")}</select></label>
    <label class="f" for="e-serves">Servings<input type="number" id="e-serves" min="1" max="200" value="${esc(r.serves)}"></label>
    <label class="f" for="e-sl">One serving is<input type="text" id="e-sl" maxlength="40" value="${esc(r.servingLabel||"")}"></label>
   </div>
   <label class="f" for="e-time">Total time<input type="text" id="e-time" maxlength="60" value="${esc(r.time||"")}" placeholder="e.g. About 1 hour"></label>
   <p class="small"><b>Nutrition per serving</b></p>
   <div class="grid3">
    <label class="f" for="e-kcal">kcal<input type="text" inputmode="decimal" id="e-kcal" value="${esc(r.kcal)}"></label>
    <label class="f" for="e-p">Protein g<input type="text" inputmode="decimal" id="e-p" value="${esc(r.p)}"></label>
    <label class="f" for="e-c">Carbs g<input type="text" inputmode="decimal" id="e-c" value="${esc(r.c)}"></label>
    <label class="f" for="e-f">Fat g<input type="text" inputmode="decimal" id="e-f" value="${esc(r.f)}"></label>
    <label class="f" for="e-fib">Fibre g<input type="text" inputmode="decimal" id="e-fib" value="${esc(r.fib)}"></label>
   </div>
   <label class="f" for="e-oven">Oven & hob, one per line as “Label | setting”<textarea id="e-oven" placeholder="Oven | 190 °C fan">${esc(linesOf(r.oven,true))}</textarea></label>
   <label class="f" for="e-ing">Ingredients, one per line as “Amount | ingredient”<textarea id="e-ing" style="min-height:12rem" placeholder="800 g | Chicken breast">${esc(linesOf(r.ingredients,true))}</textarea></label>
   <label class="f" for="e-steps">Steps, one per line. Add “[20 min]” to get a timer button<textarea id="e-steps" style="min-height:14rem" placeholder="Bake on the middle rack. [20 min]">${esc(linesOf(r.steps))}</textarea></label>
   <label class="f" for="e-portion">Portioning, one per line<textarea id="e-portion">${esc(linesOf(r.portion))}</textarea></label>
   <label class="f" for="e-storage">Storage & reheating, one per line<textarea id="e-storage">${esc(linesOf(r.storage))}</textarea></label>
   <label class="f" for="e-notes">Notes<textarea id="e-notes" style="min-height:4rem">${esc(r.notes||"")}</textarea></label>
   <div class="row"><button class="btn" type="submit">Save meal</button><button class="btn ghost" type="button" data-act="canceledit">Cancel</button></div>
  </form>`;
}
function viewProgress(){
  const s=S.settings,b=body(),pd=plannedDay(),la=loggedAvg();
  const intake=la?la.kcal:pd.kcal;
  let html=`<section><h2>Progress</h2><p class="muted small">Your stats, a weight projection from what you eat, and a weigh-in log.</p></section>
  <section class="card"><h3>Your stats</h3>
   <div class="grid3">
    <label class="f" for="sex">Sex<select id="sex" data-act="setting" data-k="sex"><option value="">Choose</option><option value="male" ${s.sex==="male"?"selected":""}>Male</option><option value="female" ${s.sex==="female"?"selected":""}>Female</option></select></label>
    <label class="f" for="age">Age<input type="number" id="age" data-act="setting" data-k="age" min="14" max="100" value="${esc(s.age||"")}"></label>
    <label class="f" for="height">Height, cm<input type="number" id="height" data-act="setting" data-k="height" min="120" max="230" value="${esc(s.height||"")}"></label>
    <label class="f" for="weight">Weight now, kg<input type="number" id="weight" data-act="setting" data-k="weight" min="30" max="300" step="0.1" value="${esc(s.weight||"")}"></label>
    <label class="f" for="goal">Goal weight, kg<input type="number" id="goal" data-act="setting" data-k="goal" min="30" max="300" step="0.1" value="${esc(s.goal||"")}"></label>
    <label class="f" for="act">Activity<select id="act" data-act="setting" data-k="activity">${ACTIVITY.map(([v,l])=>`<option value="${v}" ${String(s.activity||"1.375")===v?"selected":""}>${l}</option>`).join("")}</select></label>
   </div></section>`;
  if(!b){html+=`<section class="note">Fill in sex, age, height and weight to see your daily energy needs and a weight projection.</section>`}
  else{
    const bal=intake-b.tdee,week=bal*7/7700;
    const proj=[2,4,8,12].map(w=>({w,kg:b.w+week*w}));
    const goal=num(s.goal);let eta="";
    if(goal&&Math.abs(week)>0.01&&Math.sign(goal-b.w)===Math.sign(week)){eta=` At this rate you'd reach ${goal} kg in about <b>${Math.ceil(Math.abs((goal-b.w)/week))} weeks</b>.`}
    const pmin=Math.round(b.w*1.6),pmax=Math.round(b.w*2.2),prot=la?la.p:pd.p;
    html+=`<section class="stats" aria-label="Energy">
      <div class="stat"><b>${Math.round(b.bmr)}</b><span>Resting kcal</span></div>
      <div class="stat"><b>${Math.round(b.tdee)}</b><span>Daily needs</span></div>
      <div class="stat spent"><b>${Math.round(intake)}</b><span>${la?"You eat (logged)":"You eat (plan)"}</span></div>
      <div class="stat"><b>${bal>0?"+":""}${Math.round(bal)}</b><span>Daily balance</span></div></section>
    <section class="card"><h3>Projection</h3>
      <p>${Math.abs(week)<0.05?"You're eating about what you burn, so your weight should stay roughly steady.":`You're on track to <b>${week<0?"lose":"gain"} about ${Math.abs(r1(week))} kg a week</b> (${Math.abs(r1(week*2))} kg per two-week prep cycle).`}${eta}</p>
      <div class="tablewrap"><table><thead><tr><th>After</th><th class="n">Weight</th><th class="n">Change</th></tr></thead><tbody>
      ${proj.map(p=>`<tr><td>${p.w} weeks</td><td class="n">${r1(p.kg)} kg</td><td class="n">${p.kg-b.w>=0?"+":""}${r1(p.kg-b.w)} kg</td></tr>`).join("")}</tbody></table></div>
      <p class="muted small">Based on ${la?`your logged average over ${la.n} days`:"the planned day (log meals to use your real intake)"}, the Mifflin–St Jeor formula and ~7,700 kcal per kg. Real results vary with water, training and how accurate the activity level is.</p></section>`;
    if(intake<b.bmr)html+=`<section class="note">Your intake is below your resting needs (${Math.round(b.bmr)} kcal). Very low intakes are hard to sustain and can cost muscle. Consider adding food, and talk to a doctor or dietitian before staying this low for long.</section>`;
    else if(bal<-1000)html+=`<section class="note">That's a deficit of over 1,000 kcal a day. Losing more than about 1% of body weight a week is hard to sustain; consider adding a snack or a bigger portion.</section>`;
    html+=`<section class="note ${prot>=pmin?"ok":""}">Protein: about <b>${Math.round(prot)} g a day</b>. A common target for active people is ${pmin}–${pmax} g (1.6–2.2 g per kg).</section>`;
  }
  const ws=Object.keys(S.weights).sort();
  html+=`<section class="card"><h3>Weigh-ins</h3>
    <form class="row" data-form="weight"><label class="f" for="wday">Date<input type="date" id="wday" value="${today()}" max="${today()}"></label>
    <label class="f" for="wkg">Weight, kg<input type="number" id="wkg" step="0.1" min="30" max="300" required></label>
    <button class="btn" type="submit" style="align-self:flex-end">Save</button></form>
    <div class="chartbox" id="chartbox"><svg class="chart" id="chart" viewBox="0 0 640 260" role="img" aria-label="Weight chart"></svg><div class="tip" id="tip" hidden></div></div>
    ${ws.length?`<div class="tablewrap"><table><thead><tr><th>Date</th><th class="n">kg</th><th></th></tr></thead><tbody>${ws.slice().reverse().map(d=>`<tr><td>${fmtDate(d)}</td><td class="n">${(Number(S.weights[d])||0).toFixed(1)}</td><td class="n"><button class="chip" type="button" data-act="delw" data-day="${esc(d)}" aria-label="Delete weigh-in on ${fmtDate(d)}">Delete</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><span class="art">${ic("scale")}</span><b>No weigh-ins yet</b><span class="small">Weigh yourself at the same time each week, ideally in the morning, and your trend appears above.</span></div>`}
  </section>`;
  return html;
}
function drawChart(){
  const svg=$("#chart");if(!svg)return;
  const ws=Object.keys(S.weights).sort().map(d=>({d,kg:S.weights[d]}));
  const b=body();const css=getComputedStyle(document.documentElement);
  const C={fg:css.getPropertyValue("--fg"),muted:css.getPropertyValue("--muted"),line:css.getPropertyValue("--line"),acc:css.getPropertyValue("--accent"),off:css.getPropertyValue("--offer")};
  if(!ws.length&&!b){svg.innerHTML=`<text x="320" y="130" text-anchor="middle" fill="${C.muted}" font-size="24">Add a weigh-in to start your chart</text>`;return}
  const startD=ws.length?ws[0].d:today(),startKg=ws.length?ws[0].kg:b.w;
  const la=loggedAvg(),pd=plannedDay();const week=b?(((la?la.kcal:pd.kcal)-b.tdee)*7/7700):0;
  const endD=addDays(startD,84);
  const proj=b?[{d:startD,kg:startKg},{d:endD,kg:startKg+week*12}]:[];
  const all=ws.map(x=>x.kg).concat(proj.map(x=>x.kg));if(num(S.settings.goal))all.push(num(S.settings.goal));
  let lo=Math.floor(Math.min(...all)-1),hi=Math.ceil(Math.max(...all)+1);if(hi-lo<4){hi+=2;lo-=2}
  const lastD=ws.length&&diffDays(endD,ws[ws.length-1].d)>0?ws[ws.length-1].d:endD;
  const span=Math.max(14,diffDays(startD,lastD));
  const X=d=>56+diffDays(startD,d)/span*560, Y=k=>20+(hi-k)/(hi-lo)*200;
  let g="";const step=Math.max(1,Math.round((hi-lo)/4));
  for(let k=lo;k<=hi;k+=step){g+=`<line x1="56" x2="616" y1="${Y(k)}" y2="${Y(k)}" stroke="${C.line}"/><text x="48" y="${Y(k)+4}" text-anchor="end" font-size="22" fill="${C.muted}">${k}</text>`}
  for(let w=0;w<=span/7;w+=Math.max(1,Math.round(span/7/6))){const d=addDays(startD,w*7);g+=`<text x="${X(d)}" y="244" text-anchor="middle" font-size="22" fill="${C.muted}">${w}w</text>`}
  if(num(S.settings.goal)){const y=Y(num(S.settings.goal));g+=`<line x1="56" x2="616" y1="${y}" y2="${y}" stroke="${C.off}" stroke-dasharray="2 4"/><text x="612" y="${y-6}" text-anchor="end" font-size="22" fill="${C.off}">goal</text>`}
  if(proj.length)g+=`<line x1="${X(proj[0].d)}" y1="${Y(proj[0].kg)}" x2="${X(proj[1].d)}" y2="${Y(proj[1].kg)}" stroke="${C.muted}" stroke-width="2" stroke-dasharray="6 5"/><text x="${X(proj[1].d)}" y="${Y(proj[1].kg)-8}" text-anchor="end" font-size="22" fill="${C.muted}">projected</text>`;
  if(ws.length>1)g+=`<polyline class="ln" fill="none" stroke="${C.acc}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${ws.map(x=>X(x.d)+","+Y(x.kg)).join(" ")}"/>`;
  ws.forEach((x,i)=>{g+=`<circle cx="${X(x.d)}" cy="${Y(x.kg)}" r="${i===ws.length-1?5:3.5}" fill="${C.acc}"/>`});
  g+=`<circle id="hov" r="7" fill="none" stroke="${C.acc}" stroke-width="2" display="none"/><rect class="hit" x="0" y="0" width="640" height="230" fill="transparent"/>`;
  svg.innerHTML=g;
  const ln=svg.querySelector(".ln");if(ln)ln.style.setProperty("--len",Math.ceil(ln.getTotalLength()));
  svg.setAttribute("aria-label",ws.length?`Weight chart: ${ws.length} weigh-in${ws.length===1?"":"s"}, latest ${ws[ws.length-1].kg.toFixed(1)} kilograms. Full data is in the table below.`:"Weight chart, no weigh-ins yet");
  // hover or touch a point to read its date and weight
  const tip=$("#tip"),hov=svg.querySelector("#hov");
  if(!ws.length||!tip)return;
  const show=ev=>{const r=svg.getBoundingClientRect(),mx=(ev.clientX-r.left)/r.width*640;
    let best=ws[0];ws.forEach(p=>{if(Math.abs(X(p.d)-mx)<Math.abs(X(best.d)-mx))best=p});
    hov.setAttribute("cx",X(best.d));hov.setAttribute("cy",Y(best.kg));hov.removeAttribute("display");
    tip.textContent=fmtDate(best.d,{day:"numeric",month:"short"})+" · "+best.kg.toFixed(1)+" kg";tip.hidden=false;
    tip.style.left=(X(best.d)/640*r.width)+"px";tip.style.top=(Y(best.kg)/260*r.height)+"px"};
  const hide=()=>{tip.hidden=true;hov.setAttribute("display","none")};
  svg.addEventListener("pointermove",show);svg.addEventListener("pointerdown",show);svg.addEventListener("pointerleave",hide);
}
function viewCook(){
  const td=today();const next=PW.nextCookDay(td);const left=diffDays(td,next);
  return `<section><h2>Cook day</h2><p class="muted small">You shop and cook every two weeks, on Fridays.</p></section>
  <section class="card"><div class="row" style="align-items:flex-end;gap:14px"><span class="count">${left===0?"Today":left}</span><span>${left===0?"is shop and cook day":left===1?"day to go":"days to go"}<br><b>${fmtDate(next,{weekday:"long",day:"numeric",month:"long"})}</b></span></div>
   <p class="small">Add it to your phone's calendar for an alarm at 9:00 every second Friday. Claude also sends you a reminder in chat with that week's offers.</p>
   <div class="row"><button class="btn" type="button" data-act="ics">Add to calendar</button></div></section>
  <section class="card"><h3>What you cook</h3><div class="tablewrap"><table><thead><tr><th>Meal (tap for the guide)</th><th>Batch</th><th class="n">kcal each</th></tr></thead><tbody>
   ${Object.values(R()).map(m=>`<tr><td><button class="chip" type="button" data-act="gocook" data-id="${esc(m.id)}">${esc(m.name)}</button></td><td>${esc(m.serves)} × ${esc(m.servingLabel||"")}</td><td class="n">${Math.round(num(m.kcal)||0)}</td></tr>`).join("")}</tbody></table></div>
   <p class="muted small">Suggested order: burritos and pancakes first, then Cajun, Alfredo, Middle Eastern and Mexican. Keep the next 3 days in the fridge and freeze the rest.</p></section>
  <section class="card"><h3>Chicken split (3,300 g)</h3><p>Cajun 817 g · Alfredo 817 g · Middle Eastern 817 g · Mexican 849 g</p></section>
  <section class="card"><h3>Account</h3><p class="small muted">${S.user?`Signed in as ${esc(S.user.email)}. Everything syncs.`:sb?"Not signed in: data is saved on this device only.":"Sync isn't available right now; data is saved on this device."}</p>
   <label class="f" for="dname">Your name (for the greeting)<input type="text" id="dname" data-act="setting" data-k="displayName" maxlength="30" autocomplete="given-name" value="${esc(S.settings.displayName||"")}" placeholder="Optional"></label>
   <div class="row">${S.user?`<button class="btn ghost" type="button" data-act="signout">Sign out</button>`:sb?`<button class="btn" type="button" data-act="signin">Sign in to sync</button>`:""}</div></section>`;
}

/* ---------- Events ---------- */
document.querySelector("nav.tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]");if(!b||b.dataset.tab===S.tab&&!S.recipe)return;go(b.dataset.tab)});
const main=$("#main");
main.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b||b.tagName==="SELECT"||b.tagName==="INPUT")return;const a=b.dataset.act;
  if(a==="status"){const id=b.dataset.id,st=b.dataset.st;S.pinned[id]=1;const r=Object.assign({status:"",paid:null,store:""},(S.items[S.trip]||{})[id]);
    r.status=r.status===st?"":st;if(r.status!=="bought"){r.paid=null;r.store=""}putItem(S.trip,id,r);keepFocus(()=>render(),b.id||null,`[data-act=status][data-id="${id}"][data-st="${st}"]`)}
  else if(a==="group"){S.group=b.dataset.g;render()}
  else if(a==="shopfilter"){S.shopFilter=["remaining","all","bought"].includes(b.dataset.filter)?b.dataset.filter:"remaining";S.pinned={};render()}
  else if(a==="reset"){if(b.dataset.confirm){clearTrip(S.trip);toast("Trip cleared");render()}else{b.dataset.confirm="1";b.textContent="Tap again to clear every tick and price"}}
  else if(a==="eat"){const d=b.dataset.day,sl=b.dataset.slot;const x=Object.assign({},(S.log[d]||{})[sl]);x.eaten=!x.eaten;x.meal=b.dataset.meal;putLog(d,sl,x);keepFocus(()=>render(),null,`[data-act=eat][data-day="${d}"][data-slot="${sl}"]`)}
  else if(a==="delw"){putWeight(b.dataset.day,null);render()}
  else if(a==="ics")downloadIcs();
  else if(a==="editlist"){S.editList=!S.editList;render()}
  else if(a==="rmitem"){const id=b.dataset.id;const st=S.settings;
    if(ITEMS.some(i=>i[0]===id)){st.hiddenItems=(st.hiddenItems||[]).concat([id])}else{st.customItems=(st.customItems||[]).filter(c=>c.id!==id)}
    putSettings();toast("Removed from your list");render()}
  else if(a==="unhide"){S.settings.hiddenItems=[];putSettings();render()}
  else if(a==="open"||a==="gocook"){const id=b.dataset.id;go("cooking",()=>{S.recipe=id;S.scale=1;S.editRecipe=null})}
  else if(a==="gotab")go(b.dataset.tab);
  else if(a==="logweight"){go("progress");const w=$("#wkg");if(w)w.focus()}
  else if(a==="back"){S.recipe=null;render();window.scrollTo(0,0)}
  else if(a==="scale"){S.scale=parseFloat(b.dataset.f);render()}
  else if(a==="wake")toggleWake();
  else if(a==="timer")startTimer(parseFloat(b.dataset.min),b.dataset.label);
  else if(a==="clearck"){setCk(S.recipe,{});render()}
  else if(a==="edit"){S.editRecipe=b.dataset.id;render();window.scrollTo(0,0)}
  else if(a==="newrecipe"){S.editRecipe="__new";render();window.scrollTo(0,0)}
  else if(a==="canceledit"){S.editRecipe=null;render();window.scrollTo(0,0)}
  else if(a==="revert"){const o=Object.assign({},S.settings.recipes);delete o[b.dataset.id];S.settings.recipes=o;putSettings();toast("Back to your original recipe");render()}
  else if(a==="delrecipe"){if(b.dataset.confirm){const id=b.dataset.id;const o=Object.assign({},S.settings.recipes);if(DEF[id])o[id]={deleted:true};else delete o[id];S.settings.recipes=o;putSettings();S.recipe=null;toast("Meal deleted");render()}else{b.dataset.confirm="1";b.textContent="Tap again to delete"}}
  else if(a==="restore"){const o=Object.assign({},S.settings.recipes);Object.keys(o).forEach(k=>{if(o[k]&&o[k].deleted)delete o[k]});S.settings.recipes=o;putSettings();render()}
  else if(a==="signin")openSignin();
  else if(a==="signout"){sb.auth.signOut()}
});
main.addEventListener("change",e=>{
  const el=e.target,a=el.dataset.act;if(!a)return;
  if(a==="trip"){S.trip=el.value;S.pinned={};render()}
  else if(a==="logtrip"){S.logTrip=el.value;render()}
  else if(a==="paid"||a==="store"){const id=el.dataset.id;const r=Object.assign({status:"bought",paid:null,store:""},(S.items[S.trip]||{})[id]);
    if(a==="paid"){const n=num(el.value);r.paid=el.value.trim()===""||n==null?null:Math.round(n*100)/100}else r.store=el.value.trim().slice(0,60);
    putItem(S.trip,id,r);setTimeout(()=>keepFocus(()=>render()),0)}
  else if(a==="tripbudget"){const p=PW.parseBudget(el.value);if(!p.ok){toast("Enter a budget from €0 to €100,000");render();return}
    const tb=Object.assign({},S.settings.tripBudgets);if(p.value==null)delete tb[S.trip];else tb[S.trip]=p.value;S.settings.tripBudgets=tb;putSettings();setTimeout(()=>keepFocus(()=>render()),0)}
  else if(a==="setting"){S.settings[el.dataset.k]=el.value;putSettings();setTimeout(()=>keepFocus(()=>render()),0)}
  else if(a==="logmeal"){const d=el.dataset.day,sl=el.dataset.slot||"dinner";const x=Object.assign({},(S.log[d]||{})[sl]);x.meal=el.value;putLog(d,sl,x);render()}
  else if(a==="plan"){S.settings.plan=Object.assign({},S.settings.plan,{[el.dataset.k]:el.value});putSettings();render()}
  else if(a==="ck"){const c=getCk(S.recipe);if(el.checked)c[el.dataset.k]=1;else delete c[el.dataset.k];setCk(S.recipe,c);const row=el.closest(".ing,.step");if(row)row.classList.toggle("done",el.checked)}
  else if(a==="logextra"){const d=el.dataset.day;const n=num(el.value);putLog(d,"extra",{eaten:!!n,kcal:n?Math.round(n):null});setTimeout(()=>keepFocus(()=>render()),0)}
});
main.addEventListener("submit",e=>{
  const fm=e.target.dataset.form;
  if(fm==="additem"){e.preventDefault();const name=$("#ni-name").value.trim();if(!name)return;
    const c={id:"u-"+Date.now().toString(36),name:name.slice(0,80),buy:$("#ni-buy").value.trim().slice(0,40),price:num($("#ni-price").value)||0,store:$("#ni-store").value};
    S.settings.customItems=(S.settings.customItems||[]).concat([c]);putSettings();toast("Added to your list");render();return}
  if(fm==="recipe"){e.preventDefault();saveRecipe();return}
  if(fm!=="weight")return;e.preventDefault();
  const d=$("#wday").value,kg=num($("#wkg").value);if(!d||!kg||kg<30||kg>300){toast("Enter a weight between 30 and 300 kg");return}
  putWeight(d,Math.round(kg*10)/10);
  if(d===today()||!S.settings.weight){S.settings.weight=String(Math.round(kg*10)/10);putSettings()}
  toast("Weigh-in saved");render();
});
function keepFocus(fn,_id,sel){const a=document.activeElement;const fid=a&&a.id;fn();
  if(fid){const el=document.getElementById(fid);if(el&&el!==document.activeElement)el.focus();return}
  if(sel){const el=main.querySelector(sel);if(el)el.focus()}}

function saveRecipe(){
  const g=id=>$(id).value;const lines=v=>v.split("\n").map(x=>x.trim()).filter(Boolean);
  const pairs=v=>lines(v).map(x=>{const i=x.indexOf("|");return i<0?["",x]:[x.slice(0,i).trim(),x.slice(i+1).trim()]});
  const name=g("#e-name").trim();if(!name){toast("Give the meal a name");return}
  const rec={name:name.slice(0,80),slot:g("#e-slot"),serves:Math.max(1,Math.round(num(g("#e-serves"))||1)),servingLabel:g("#e-sl").trim().slice(0,40),time:g("#e-time").trim().slice(0,60),
    kcal:num(g("#e-kcal"))||0,p:num(g("#e-p"))||0,c:num(g("#e-c"))||0,f:num(g("#e-f"))||0,fib:num(g("#e-fib"))||0,
    oven:pairs(g("#e-oven")),ingredients:pairs(g("#e-ing")),steps:lines(g("#e-steps")),portion:lines(g("#e-portion")),storage:lines(g("#e-storage")),notes:g("#e-notes").trim()};
  const id=S.editRecipe==="__new"?"r-"+Date.now().toString(36):S.editRecipe;
  S.settings.recipes=Object.assign({},S.settings.recipes,{[id]:rec});putSettings();
  S.editRecipe=null;S.recipe=id;toast("Meal saved");render();window.scrollTo(0,0);
}
let timers=[];let tick=null;let audio=null;
function startTimer(min,label){
  try{audio=audio||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
  timers.push({id:Date.now()+Math.random(),label,end:Date.now()+min*60000,ring:false});drawTimers();
  if(!tick)tick=setInterval(drawTimers,1000);toast("Timer started: "+min+" min");
}
function beep(){try{if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=880;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.2,audio.currentTime);o.start();o.stop(audio.currentTime+.4)}catch(e){}try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}}
function drawTimers(){
  const now=Date.now();const box=$("#timers");
  timers.forEach(t=>{if(!t.ring&&t.end<=now){t.ring=true;toast("Time's up: "+t.label)}});
  if(timers.some(t=>t.ring)&&Math.floor(now/1000)%2===0)beep();
  box.innerHTML=timers.map(t=>{const left=Math.max(0,Math.round((t.end-now)/1000));const mm=Math.floor(left/60),ss=String(left%60).padStart(2,"0");
    return `<span class="tchip${t.ring?" ring":""}"><span>${esc(t.label.replace(/^.*: /,""))}</span><b>${t.ring?"Done":mm+":"+ss}</b><button type="button" data-tid="${t.id}" aria-label="${t.ring?"Stop":"Cancel"} timer">${t.ring?"Stop":"✕"}</button></span>`}).join("");
  if(!timers.length&&tick){clearInterval(tick);tick=null}
}
$("#timers").addEventListener("click",e=>{const b=e.target.closest("button[data-tid]");if(!b)return;timers=timers.filter(t=>String(t.id)!==b.dataset.tid);drawTimers()});
let wakeLock=null;
async function toggleWake(){
  if(S.wake){try{wakeLock&&await wakeLock.release()}catch(e){}wakeLock=null;S.wake=false;render();return}
  try{wakeLock=await navigator.wakeLock.request("screen");S.wake=true;wakeLock.addEventListener("release",()=>{S.wake=false;render()})}catch(e){toast("Your browser can't keep the screen on")}
  render();
}
document.addEventListener("visibilitychange",async()=>{if(S.wake&&document.visibilityState==="visible"){try{wakeLock=await navigator.wakeLock.request("screen")}catch(e){}}});
function downloadIcs(){
  const next=PW.nextCookDay(today());const d=next.replace(/-/g,"");
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Prepwise//Meal prep//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT",
    "UID:prepwise-cookday@prepwise","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,""),
    "DTSTART:"+d+"T090000","DTEND:"+d+"T100000","RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=FR",
    "SUMMARY:Meal prep: shop and cook","DESCRIPTION:Open Prepwise for this trip's grocery list.",
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Meal prep day","TRIGGER:-PT0M","END:VALARM",
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Meal prep tomorrow","TRIGGER:-P1D","END:VALARM",
    "END:VEVENT","END:VCALENDAR"].join("\r\n");
  const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));
  const a=document.createElement("a");a.href=url;a.download="prepwise-cook-day.ics";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* ---------- Auth ---------- */
const dlg=$("#signin");
function openSignin(){$("#si-msg").textContent="";if(dlg.showModal)dlg.showModal();else dlg.setAttribute("open","")}
$("#acct").addEventListener("click",()=>{if(S.user)go("cook");else if(sb)openSignin()});
$("#si-close").addEventListener("click",()=>dlg.close());
$("#si-form").addEventListener("submit",async e=>{
  e.preventDefault();const email=$("#si-email").value.trim();if(!email)return;
  const btn=$("#si-send");btn.disabled=true;$("#si-msg").textContent="Sending…";
  const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
  btn.disabled=false;
  $("#si-msg").textContent=error?("That didn't send: "+error.message):"Check your inbox and open the link on this device.";
});
async function onSession(session){
  const before=S.user&&S.user.id;S.user=session?session.user:null;
  if(S.user){
    try{
      const local={items:S.items,settings:S.settings,log:S.log,weights:S.weights};
      await loadCloud();S.cloud=true;
      // first sign-in: move anything saved on this device into the account
      if(!before&&!Object.keys(S.items).length&&Object.keys(local.items).length){
        for(const [t,recs] of Object.entries(local.items))for(const [id,r] of Object.entries(recs))await putItem(t,id,r);
      }
      if(!Object.keys(S.settings).length&&Object.keys(local.settings).length){S.settings=local.settings;await putSettings()}
      if(!Object.keys(S.weights).length)for(const [d,kg] of Object.entries(local.weights))await putWeight(d,kg);
      if(!Object.keys(S.log).length)for(const [d,sl] of Object.entries(local.log))for(const [k,v] of Object.entries(sl))await putLog(d,k,v);
      saveLocal();
    }catch(e){S.cloud=false;toast("Couldn't load your synced data. Using this device for now.")}
  }else{S.cloud=false;loadLocal()}
  S.loading=false;
  render();
}
function hasSavedSession(){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^sb-.+-auth-token$/.test(k))return true}}catch(e){}return false}
loadLocal();
if(sb&&hasSavedSession()){S.loading=true;setTimeout(()=>{if(S.loading){S.loading=false;render()}},4000)} // never show the skeleton for more than 4 s
render();
if(sb){
  sb.auth.getSession().then(({data})=>onSession(data.session)).catch(()=>{S.loading=false;render()});
  sb.auth.onAuthStateChange((ev,session)=>{if(ev==="SIGNED_IN"||ev==="SIGNED_OUT"){if(ev==="SIGNED_IN"&&dlg.open)dlg.close();onSession(session)}});
}
