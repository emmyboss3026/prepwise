"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const PHOTO=require("../js/photos.js");
const page=(title,license="CC BY-SA 4.0",mime="image/jpeg",url="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Photo.jpg/480px-Photo.jpg")=>({
  title:"File:"+title,
  imageinfo:[{mime,thumburl:url,descriptionurl:"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(title),
    extmetadata:{LicenseShortName:{value:license},Artist:{value:"<a href=\"https://commons.wikimedia.org/\">Jane Doe</a> &amp; Co."}}}]
});
test("all 61 built-in grocery items have intentional real-photo queries",()=>{
  assert.equal(Object.keys(PHOTO.QUERY).length,61);
  assert.equal(PHOTO.queryFor("chicken","AIA 550g"),"chicken breast");
  assert.equal(PHOTO.queryFor("banana","Bananas 5"),"bananas");
});
test("custom product titles yield useful search terms without pack quantities",()=>{
  assert.equal(PHOTO.queryFor("custom-1","Organic fresh carrots (500 g)"),"Organic fresh carrots");
});
test("photo URL validation rejects unsafe schemes and credential leaks",()=>{
  for(const url of ["javascript:alert(1)","data:image/svg+xml,<svg>","http://example.com/a.jpg","https://name:pass@example.com/image.jpg",""])assert.equal(PHOTO.safeUrl(url),"");
  assert.ok(PHOTO.safeUrl("https://upload.wikimedia.org/x.jpg"));
});
test("only licensed raster photos from Commons are accepted",()=>{
  assert.equal(PHOTO.fromPage(page("Raw chicken breast.jpg")).license,"CC BY-SA 4.0");
  assert.equal(PHOTO.fromPage(page("Chicken logo.jpg")),null);
  assert.equal(PHOTO.fromPage(page("Raw chicken breast.jpg","All rights reserved")),null);
  assert.equal(PHOTO.fromPage(page("Raw chicken breast.svg","CC BY-SA 4.0","image/svg+xml")),null);
  assert.equal(PHOTO.fromPage(page("Raw chicken breast.jpg","CC BY-SA 4.0","image/jpeg","https://random.example.net/a.jpg")),null);
});
test("photo credit text is sanitized and irrelevant photos are excluded",()=>{
  const p=PHOTO.fromPage(page("Raw chicken breast.jpg"));
  assert.equal(p.artist,"Jane Doe & Co.");
  const results=PHOTO.pick([page("Raw chicken breast.jpg"),page("Banana bunch.jpg"),page("Chicken logo.jpg")],"chicken breast");
  assert.equal(results.length,1);
  assert.equal(results[0].title,"Raw chicken breast.jpg");
});
test("search uses anonymous Commons CORS and filters results",async()=>{
  let sentUrl="",sentOpts=null;
  const mock=async(url,opts)=>{
    sentUrl=url;sentOpts=opts;
    return {ok:true,json:async()=>({query:{pages:[page("Raw chicken breast.jpg"),page("Bananas.jpg")]}})};
  };
  const result=await PHOTO.search("chicken breast",mock);
  assert.equal(result.length,1);
  assert.equal(result[0].title,"Raw chicken breast.jpg");
  assert.match(sentUrl,/origin=\*/);
  assert.match(sentUrl,/iiurlwidth=480/);
  assert.equal(sentOpts.credentials,"omit");
});
