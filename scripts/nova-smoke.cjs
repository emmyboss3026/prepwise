"use strict";
/* Real Chromium smoke QA for the Nova redesign. Uses temporary local-only data. */
const {chromium}=require("playwright");
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const mimetypes={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".json":"application/json"};
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    const rel=pathname==="/"?"/index.html":pathname;
    const file=path.resolve(root,"."+rel);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
      res.writeHead(404);res.end("Not found");return;
    }
    res.writeHead(200,{"Content-Type":mimetypes[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});
    fs.createReadStream(file).pipe(res);
  }catch(e){res.writeHead(400);res.end("Bad request")}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const addr=server.address();const base="http://127.0.0.1:"+addr.port;
  const browser=await chromium.launch({headless:true});
  const widths=[320,390,768,1440],errors=[];
  const artifact=path.join(root,"test-artifacts");
  fs.mkdirSync(artifact,{recursive:true});
  try{
    for(const width of widths){
      const context=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:1,reducedMotion:"reduce"});
      const page=await context.newPage();
      page.on("pageerror",e=>errors.push(width+"px: "+e.message));
      // No third-party calls or real Supabase accounts in smoke QA.
      await page.route(/^https:\/\//,route=>route.abort());
      await page.goto(base,{waitUntil:"load",timeout:20000});
      await page.locator(".hero").waitFor({timeout:10000});
      assert.equal(await page.locator('link[href="styles/nova.css"]').count(),1,"Nova layer is loaded");
      assert.ok((await page.locator(".brand h1").innerText()).includes("Prepwise"),"Brand is kept");
      if(width===390||width===1440)await page.screenshot({path:path.join(artifact,"home-"+width+".png")});
      await page.locator('nav.tabs button[data-tab="shop"]').click();
      await page.locator(".grocery-product-info .name").first().waitFor();
      const name=await page.locator(".grocery-product-info .name").first().innerText();
      assert.ok(name.includes("Chicken breast"),"Exact grocery name stays visible: "+name);
      assert.ok(await page.locator(".grocery-product-info .name").first().isVisible(),"Name is visibly rendered beside image");
      assert.ok(await page.locator(".grocery-thumb").first().isVisible(),"Photo button is visible");
      assert.ok(await page.locator('.card[aria-label="Shopping budget"]').count(),"Budget preserved");
      const checkOverflow=async section=>{
        const dims=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,ww:window.innerWidth}));
        assert.ok(dims.sw<=dims.ww+2,section+" overflows "+width+"px: "+JSON.stringify(dims));
      };
      await checkOverflow("Shopping");
      if(width===390||width===1440)await page.screenshot({path:path.join(artifact,"shop-"+width+".png")});
      await page.locator(".grocery-thumb").first().click();
      await page.locator(".photo-picker-exact-name").waitFor();
      assert.equal((await page.locator(".photo-picker-exact-name").innerText()).trim(),name.trim(),
        "Photo picker labels exactly the same product as the shopping list");
      await checkOverflow("Photo picker");
      if(width===390)await page.screenshot({path:path.join(artifact,"photos-390.png")});
      await page.locator('[data-act="photoclose"]').click();
      await page.locator('#theme').click();
      assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
      const darkname=page.locator(".grocery-product-info .name").first();
      assert.ok(await darkname.isVisible(),"Product name remains visible in dark mode");
      await checkOverflow("Dark shopping");
      if(width===390)await page.screenshot({path:path.join(artifact,"dark-shop-390.png")});
      for(const tab of ["home","cooking","meals","progress","cook","shop"]){
        await page.locator('nav.tabs button[data-tab="'+tab+'"]').click();
        assert.ok(await page.locator("#main").innerHTML().then(x=>x.length>40),"Tab "+tab+" rendered");
        await checkOverflow("Tab "+tab);
      }
      await context.close();
    }
    assert.deepEqual(errors,[],"Unexpected browser JavaScript errors");
    process.stdout.write("NOVA BROWSER SMOKE PASSED: 4 widths, exact product names, light/dark, image chooser, all 6 sections\n");
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
