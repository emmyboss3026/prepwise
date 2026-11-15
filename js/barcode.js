/* Prepwise: opt-in exact-barcode product photography from Open Food Facts.
   Pure validation/mapping; no personal data, no API calls in this module. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.PWB=api;
})(typeof self!=="undefined"?self:this,function(){
"use strict";
function gtin(raw){
  if(typeof raw!=="string"&&typeof raw!=="number")return "";
  const value=String(raw).replace(/[\s-]/g,"");
  if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value))return "";
  const digits=value.split("").map(Number);
  let sum=0;
  for(let i=digits.length-2,weight=3;i>=0;i--,weight=weight===3?1:3)sum+=digits[i]*weight;
  return (10-sum%10)%10===digits[digits.length-1]?value:"";
}
function safeImage(url){
  if(typeof url!=="string"||url.length>2000)return "";
  try{const u=new URL(url);return u.protocol==="https:"&&u.hostname==="images.openfoodfacts.org"&&!u.username&&!u.password?u.href:""}
  catch(e){return ""}
}
function normalizeProduct(payload,barcode){
  const code=gtin(barcode);if(!code||!payload||typeof payload!=="object")return null;
  const p=payload.product;if(!p||typeof p!=="object")return null;
  const matched=String(p.code||code);
  if(!/^[0-9]{8,14}$/.test(matched)||matched.padStart(14,"0")!==code.padStart(14,"0"))return null;
  const image=safeImage(p.image_front_url||p.image_front_small_url||p.image_url||"");
  if(!image)return null;
  const name=String(p.product_name||p.product_name_en||"Unknown product").trim().slice(0,120);
  const brand=String(p.brands||"").trim().slice(0,90);
  return {barcode:code,name,brand,url:image,
    title:[brand,name].filter(Boolean).join(" · "),
    source:"https://world.openfoodfacts.org/product/"+code,
    license:"CC BY-SA · Open Food Facts",
    artist:"Open Food Facts contributors",kind:"barcode"};
}
return {gtin,safeImage,normalizeProduct};
});
