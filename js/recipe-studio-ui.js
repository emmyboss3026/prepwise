/* Recipe Studio presentation; uses Prepwise's existing recipe state and saving. */
function studioVideoMarkup(){
  return `<figure class="studio-video-preview"><video controls playsinline preload="metadata" src="${esc(studioVideoUrl)}"></video><figcaption>${esc(studioVideoName)} — device-only preview, never uploaded or stored.</figcaption></figure`;
}
function refreshStudioVideo(){
  const host=$("#studio-video-preview");if(host)host.innerHTML=studioVideoUrl?studioVideoMarkup():"";
}
function viewRecipeStudio(){
  const v=S.recipeStudioInput||{};
  const slot=["breakfast","lunch","dinner","snack"].includes(v.slot)?v.slot:"dinner";
  return `<section class="studio-hero"><button class="chip" type="button" data-act="studioexit">← All recipes</button><span class="eyebrow">Recipe Studio · Idea → kitchen</span>
    <h2>Turn an idea into a recipe.</h2><p>Describe a dish or paste the caption/transcript from a cooking video. Prepwise organizes written ingredients and steps into an editable recipe draft, then helps you shop for it.</p>
    <p class="small">Free, private first version. No paid AI, no invented quantities or calories. Video playback is local; a video alone cannot yet be transcribed automatically.</p></section>
  <section class="card studio-input"><h3>Bring your recipe</h3>
    <form data-form="studiobuild" class="studio-form">
      <label class="f" for="studio-title">Recipe name (optional)<input id="studio-title" type="text" maxlength="80" value="${esc(v.name||"")}" placeholder="e.g. Creamy chicken &amp; rice"></label>
      <div class="grid2"><label class="f" for="studio-slot">Menu section<select id="studio-slot">${["breakfast","lunch","dinner","snack"].map(x=>`<option value="${x}" ${slot===x?"selected":""}>${x[0].toUpperCase()+x.slice(1)}</option>`).join("")}</select></label>
      <label class="f" for="studio-serves">Portions<input id="studio-serves" type="number" min="1" max="200" value="${esc(v.serves||"")}" placeholder="4 (default)"></label></div>
      <label class="f" for="studio-text">Your idea, ingredients, recipe caption or written transcript<textarea id="studio-text" rows="12" maxlength="14000" required placeholder="Title: Lemon garlic chicken\nServings: 4\nIngredients:\n500 g | Chicken breast\n2 tbsp | Olive oil\nSteps:\n1. Season the chicken.\n2. Cook fully and serve.">${esc(v.text||"")}</textarea></label>
      <div class="studio-help"><strong>Works best with:</strong> an Ingredients heading, amounts like “500 g chicken”, a Steps heading, and any cooking times. A one-sentence idea becomes a draft with blank details for you to complete.</div>
      <label class="f" for="studio-source">Video or recipe link (optional, saved with recipe)<input id="studio-source" type="url" maxlength="1000" value="${esc(v.sourceUrl||"")}" placeholder="https://www.youtube.com/watch?v=..."></label>
      <div class="studio-media">
        <label class="f" for="studio-video">Optional video from this device<input id="studio-video" type="file" accept="video/*" data-act="studiofile" aria-describedby="studio-video-help"></label>
        <p class="muted small" id="studio-video-help">Preview while you write. Maximum 150 MB; no uploads, no recognition, and no permanent video storage.</p>
        <div id="studio-video-preview" aria-live="polite">${studioVideoUrl?studioVideoMarkup():""}</div>
        <div class="row"><button class="chip" type="button" data-act="studiovideoclear">Clear video preview</button></div>
        <label class="f" for="studio-captions">Or import subtitles/text from a video (.srt, .vtt, .txt)<input type="file" id="studio-captions" data-act="studiocaptions" accept=".srt,.vtt,.txt,text/plain,text/vtt"></label>
        <p class="muted small">Subtitle text is read on this device and added to the draft. Review it: subtitles may omit quantities.</p>
      </div>
      <div class="row"><button class="btn" type="submit">Build my recipe draft →</button><button type="button" class="btn ghost" data-act="newrecipe">Start from scratch</button></div>
    </form>
  </section>
  <section class="card studio-steps"><h3>How your recipe gets organized</h3><div class="grid3"><div><b>01 · Create</b><p class="small muted">Paste the idea, caption or transcript.</p></div><div><b>02 · Review</b><p class="small muted">Confirm quantities, portions, steps and nutrition.</p></div><div><b>03 · Cook & shop</b><p class="small muted">Save to your menu and add selected ingredients to shopping.</p></div></div></section>`;
}
function recipeShoppingCard(r){
  const lines=(r.ingredients||[]).slice(0,200);
  return `<section class="card studio-shop" aria-label="Add recipe ingredients to shopping trip"><div class="row between"><h3>Shop for ${esc(r.name)}</h3><button class="chip" type="button" data-act="closerecipeshop">Close</button></div>
  <p class="small muted">Choose what you need for shopping trip ${esc(fmtDate(S.trip))}. Quantities are never guessed. Existing manually-added shopping items aren't deleted or merged.</p>
  <form data-form="recipeshop">
    <fieldset class="studio-ingredient-picks"><legend>Select ingredients</legend>
    ${lines.map((ing,i)=>`<label class="studio-ingredient-pick"><input type="checkbox" name="rshop-ing" value="${i}" ${ing[0]?"checked":"disabled"}><span><b>${esc(ing[1])}</b><small>${ing[0]?esc(ing[0]):"Amount missing — edit recipe first"}</small></span></label>`).join("")}
    </fieldset>
    <label class="f" for="recipe-shop-store">Where to buy (editable later)<select id="recipe-shop-store">${STORE_OPTS.filter(x=>x[0]!=="PANTRY").map(([v,label])=>`<option value="${v}" ${v==="OTHER"?"selected":""}>${esc(label)}</option>`).join("")}</select></label>
    <div class="row"><button class="btn" type="submit">Add selected to shopping list</button><button class="btn ghost" type="button" data-act="closerecipeshop">Cancel</button></div>
  </form></section>`;
}
