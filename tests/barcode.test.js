"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const B=require("../js/barcode.js");
const handler=require("../api/product.js");
const good="4006381333931";
const pic="https://images.openfoodfacts.org/images/products/400/638/133/3931/front_en.3.400.jpg";
function response(){
  return {headers:{},code:200,body:null,setHeader(k,v){this.headers[k]=v;return this},
    status(n){this.code=n;return this},json(v){this.body=v;return this}};
}
test("barcode validator checks digits, length, spaces and check digit",()=>{
  assert.equal(B.gtin(good),good);
  assert.equal(B.gtin("4006 3813 33931"),good);
  assert.equal(B.gtin("3017620422003"),"3017620422003");
  for(const value of ["4006381333932","1234","12345678X","http://x/","00000001",{},null])assert.equal(B.gtin(value),"",String(value));
});
test("rejects user-controlled hosts, schemes, and mismatched product codes",()=>{
  for(const url of ["javascript:alert(1)","http://images.openfoodfacts.org/z.jpg","https://evil.example.org/p.png",
    "https://user:pass@images.openfoodfacts.org/x.jpg"])assert.equal(B.safeImage(url),"");
  assert.equal(B.safeImage(pic),pic);
  assert.equal(B.normalizeProduct({product:{code:"3017620422003",image_front_url:pic}},good),null);
});
test("maps matched exact barcode photograph and source attribution",()=>{
  const data={product:{code:good,product_name:"Test chocolate",brands:"Test Brand",image_front_url:pic}};
  const p=B.normalizeProduct(data,good);
  assert.equal(p.brand,"Test Brand");
  assert.equal(p.barcode,good);
  assert.equal(p.url,pic);
  assert.equal(p.source,"https://world.openfoodfacts.org/product/"+good);
  assert.match(p.license,/CC BY-SA/);
});
test("GET only, reject malformed barcode before upstream request",async()=>{
  const r=response();await handler({method:"POST",query:{barcode:good}},r);
  assert.equal(r.code,405);
  const bad=response();await handler({method:"GET",query:{barcode:"00000001"}},bad);
  assert.equal(bad.code,400);
  assert.match(bad.body.error,/barcode/);
});
test("server accepts a verified match with identifying User-Agent and safe image URL",async()=>{
  const prev=global.fetch;let target="",ua="";
  global.fetch=async(url,opts)=>{target=url;ua=opts.headers["User-Agent"];return {ok:true,status:200,json:async()=>({product:{code:good,product_name:"Test chocolate",brands:"Test Brand",image_front_url:pic}})}};
  try{const r=response();await handler({method:"GET",query:{barcode:good}},r);
    assert.equal(r.code,200);assert.equal(r.body.product.barcode,good);
    assert.equal(r.body.product.url,pic);
    assert.match(target,/\/api\/v3\.6\/product\/4006381333931/);
    assert.match(ua,/Prepwise\/2\.6/);
    assert.match(r.headers["Cache-Control"],/s-maxage=/);
  }finally{global.fetch=prev}
});
test("server does not return arbitrary remote image URLs",async()=>{
  const prev=global.fetch;
  global.fetch=async()=>({ok:true,status:200,json:async()=>({product:{code:good,image_front_url:"https://evil.example.org/a.png"}})});
  try{const r=response();await handler({method:"GET",query:{barcode:good}},r);assert.equal(r.code,404)}finally{global.fetch=prev}
});
