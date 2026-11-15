"use strict";
/* Read-only product lookup. No image uploads, keys, cookies, or personal data. */
const B=require("../js/barcode.js");
module.exports=async function handler(req,res){
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Cache-Control","public, s-maxage=86400, stale-while-revalidate=604800");
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
  const raw=typeof req.query?.barcode==="string"?req.query.barcode:"";
  const barcode=B.gtin(raw);
  if(!barcode)return res.status(400).json({error:"Enter a valid 8, 12, 13 or 14-digit product barcode."});
  const apiUrl="https://world.openfoodfacts.org/api/v3.6/product/"+barcode+"?fields=code,product_name,product_name_en,brands,image_front_url,image_front_small_url,image_url";
  try{
    const upstream=await fetch(apiUrl,{
      headers:{"User-Agent":"Prepwise/2.6 (https://prepwise-plum.vercel.app)","Accept":"application/json"},
      signal:AbortSignal.timeout(9000)
    });
    if(upstream.status===404)return res.status(404).json({error:"No product found for that barcode."});
    if(!upstream.ok)return res.status(503).json({error:"Product catalog temporarily unavailable."});
    const body=await upstream.json();
    const product=B.normalizeProduct(body,barcode);
    if(!product)return res.status(404).json({error:"No verified package photograph available for this barcode."});
    return res.status(200).json({product});
  }catch(e){return res.status(503).json({error:"Product lookup unavailable. Try again or use the photo search."});}
};
