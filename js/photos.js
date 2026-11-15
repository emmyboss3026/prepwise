/* Prepwise real-product photo discovery (Wikimedia Commons, no paid API keys).
   Photos are real third-party photographs; never infer exact packaging from a generic photo.
   Search is lazy (visible list items only) and users can override any result. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PWPH = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const QUERY = {
    chicken:"chicken breast",beef:"ground beef",beef2:"ground beef",eggs:"chicken eggs",
    topfen:"skyr yogurt",potato:"potatoes",tortilla:"flour tortillas",sriracha:"sriracha sauce",
    worc:"Worcestershire sauce",veg:"mixed vegetables",evap:"evaporated milk",
    herbcc:"cream cheese",cc:"cream cheese",butter:"butter",parm:"parmesan",
    cottage:"cottage cheese",yogurt:"plain yogurt",milk:"milk carton",mayo:"mayonnaise",
    chilli:"chili garlic sauce",paste:"tomato paste",passata:"tomato passata",
    corn:"canned sweetcorn",oats:"rolled oats",bp:"baking powder",banana:"bananas",
    onion:"yellow onions",redonion:"red onion",garlic:"garlic cloves",tomato:"fresh tomatoes",
    pepper:"red bell pepper",lemon:"lemons",lime:"limes",parsley:"fresh parsley",
    spring:"spring onions",coriander:"fresh coriander",chives:"fresh chives",
    eiklar:"egg whites",rice:"basmati rice",pasta:"dry spaghetti",
    "p-oil":"olive oil","p-honey":"honey jar","p-spray":"cooking spray",
    "p-sumac":"sumac spice","p-sweet":"sugar substitute","p-cajun":"cajun seasoning",
    "p-smoked":"smoked paprika","p-pepper":"black peppercorn",
    "p-garlicp":"garlic powder","p-onionp":"onion powder","p-cumin":"ground cumin",
    "p-paprika":"paprika spice","p-oregano":"oregano herb","p-parsley":"dried parsley",
    "p-turmeric":"turmeric powder","p-italian":"italian herbs",
    "p-chilli":"chili powder","p-flakes":"chili flakes","p-cinnamon":"cinnamon",
    "p-vanilla":"vanilla extract","p-salt":"table salt"
  };
  const BLOCK = /\b(cartoon|clipart|illustration|drawing|diagram|svg|logo|map|symbol|icon|screenshot|drawing|vector|emoji|flag|poster|advertisement)\b/i;
  const LICENSE = /^(CC0|CC BY|CC BY-SA|Public domain|PD|CC-PD)/i;
  const MAX_TERM=80;
  function cleanTerm(s){return String(s||"").replace(/[()\[\]{}]/g," ").replace(/\b\d+\s*(kg|g|ml|l|packs?|tubs?|bottles?|cans?|x)\b/gi," ").replace(/\s+/g," ").trim().slice(0,MAX_TERM)}
  function queryFor(id,name){return QUERY[id]||cleanTerm(name)}
  function safeUrl(url){if(typeof url!=="string"||url.length>1500)return "";try{const u=new URL(url);return u.protocol==="https:"&&!!u.hostname&&!u.username&&!u.password?u.href:""}catch(e){return ""}}
  function fromPage(page){
    const i=page&&page.imageinfo&&page.imageinfo[0];if(!i||!/^image\/(jpeg|png|webp)$/i.test(i.mime||""))return null;
    const title=String(page.title||"").replace(/^File:/,""),meta=i.extmetadata||{};
    const lic=String(meta.LicenseShortName&&meta.LicenseShortName.value||"").trim();
    if(!LICENSE.test(lic)||BLOCK.test(title))return null;
    const url=safeUrl(i.thumburl||i.url),source=safeUrl(i.descriptionurl);
    if(!url||!source||!url.includes("wikimedia.org"))return null;
    const artistHtml=String(meta.Artist&&meta.Artist.value||"");
    const artist=artistHtml.replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\\s+/g," ").trim().slice(0,100);
    return {url,source,title,license:lic.slice(0,50),artist,kind:"representative"};
  }
  function rank(photo,term){
    const text=photo.title.toLowerCase().replace(/[_\-.]/g," ");
    const words=cleanTerm(term).toLowerCase().split(/\s+/).filter(w=>w.length>2);
    if(!words.length)return 0;
    const n=words.filter(w=>text.includes(w)).length;
    return n/words.length + (n?0.1:0);
  }
  function pick(pages,term){
    return (pages||[]).map(fromPage).filter(Boolean)
      .map(p=>({p,score:rank(p,term)})).filter(x=>x.score>=0.34)
      .sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.p);
  }
  function endpoint(term){
    const u=new URL("https://commons.wikimedia.org/w/api.php");
    u.search=new URLSearchParams({action:"query",generator:"search",gsrsearch:cleanTerm(term),gsrnamespace:"6",gsrlimit:"16",prop:"imageinfo",iiprop:"url|mime|extmetadata",iiurlwidth:"480",format:"json",formatversion:"2",origin:"*"}).toString();
    return u.href;
  }
  async function search(term,fetcher){
    const q=cleanTerm(term);if(q.length<2)return [];
    const fetchFn=fetcher||fetch;
    const controller=typeof AbortController!=="undefined"?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),10000):null;
    try{
      const r=await fetchFn(endpoint(q),{credentials:"omit",signal:controller?controller.signal:undefined});
      if(!r.ok)throw new Error("Photo search unavailable ("+r.status+")");
      const body=await r.json();
      return pick(body&&body.query&&body.query.pages,q);
    }finally{if(timer)clearTimeout(timer)}
  }
  return {QUERY,cleanTerm,queryFor,safeUrl,fromPage,pick,endpoint,search};
});
