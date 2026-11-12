/* Public website content synchronizer. If Supabase isn't configured, existing HTML remains the fallback. */
(function(){
 const cfg=window.JOEL_SUPABASE_CONFIG||{}; if(!window.supabase||!cfg.url||!cfg.anonKey||cfg.url.includes('PASTE_')||cfg.anonKey.includes('PASTE_')) return;
 const client=window.supabase.createClient(cfg.url,cfg.anonKey); window.JOEL_PUBLIC_DB=client;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
 async function read(key){const {data,error}=await client.from('site_content').select('content').eq('key',key).maybeSingle(); if(error) throw error;return data?.content;}
 function applyText(content){if(!content||typeof content!=='object')return; if(content.tickerMessages?.length){const groups=document.querySelectorAll('.ticker-group');groups.forEach((g,i)=>{g.innerHTML=content.tickerMessages.map((m,n)=>`<span class="ticker-message">${esc(m.text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</span>${n<content.tickerMessages.length-1?'<span class="ticker-separator" aria-hidden="true">✦</span>':''}`).join(''); if(i===1)g.setAttribute('aria-hidden','true');});} const map={'galleryIntro':'#gallery .section-head>p','projectsIntro':'#projects .section-head>p','videosIntro':'#videos .section-head>p','comboIntro':'#combo-offers .section-head>p'};Object.entries(map).forEach(([k,sel])=>{if(content[k]&&document.querySelector(sel))document.querySelector(sel).textContent=content[k];});}
 function renderCombos(items){const grid=document.querySelector('.combo-offer-grid');if(!grid||!Array.isArray(items)||!items.length)return;grid.innerHTML=items.filter(x=>x.active!==false).map((x,i)=>`<article class="combo-offer-card"><a href="combo.html?id=${encodeURIComponent(x.id||'combo-'+(i+1))}"><img src="${esc(x.image||'assets/combo-offer-1.jpg')}" alt="${esc(x.name||'Combo offer')}" loading="lazy"><div class="combo-offer-copy"><span>${esc(x.label||x.name||'COMBO OFFER')}</span><strong>${money(x.price)}</strong><p>${esc(x.description||'Personalised frame combo')}</p><b>Personalise combo →</b></div></a></article>`).join('');}
 function renderGallery(items){const grid=document.querySelector('.gallery-grid');if(!grid||!Array.isArray(items)||!items.length)return;grid.innerHTML=items.filter(x=>x.active!==false).map((x,i)=>`<article class="gallery-card ${i===0?'tall':''}" data-product-href="${esc(x.link||'products.html')}"><div class="gallery-slot"><img src="${esc(x.image||'assets/gallery-01.jpg')}" alt="${esc(x.title||'Frame gallery')}" loading="lazy"><div class="media-fallback"><span>GALLERY IMAGE</span><small>Image unavailable — check the image URL in the Admin Portal.</small></div></div><div class="gallery-caption"><strong>${esc(x.title||'Frame style')}</strong><a href="${esc(x.link||'products.html')}">Show frame details →</a></div></article>`).join('');window.wireMediaAssets?.(grid);}
 function renderProjects(items){const grid=document.querySelector('.project-grid');if(!grid||!Array.isArray(items)||!items.length)return;grid.innerHTML=items.filter(x=>x.active!==false).map((x,i)=>`<article class="project-card ${i%3===0?'wide':''}"><div class="project-slot"><img src="${esc(x.image||'assets/project-01.jpg')}" alt="${esc(x.title||'Joel Frame Work project')}" loading="lazy"><div class="media-fallback"><span>PROJECT IMAGE</span><small>Image unavailable — check the image URL in the Admin Portal.</small></div></div><div><b>${esc(x.title||'Frame project')}</b><span>${esc(x.description||'Custom frame project')}</span></div></article>`).join('');window.wireMediaAssets?.(grid);}
 function renderVideos(items){const grid=document.querySelector('.video-grid');if(!grid||!Array.isArray(items)||!items.length)return;grid.innerHTML=items.filter(x=>x.active!==false).map((x,i)=>`<article class="video-card"><div class="video-slot">${x.video?`<video controls playsinline preload="metadata" src="${esc(x.video)}"${x.image?` poster="${esc(x.image)}"`:''}></video>`:`<img src="${esc(x.image||'assets/project-01.jpg')}" alt="${esc(x.title||'Behind the frame')}" loading="lazy">`}<div class="media-fallback"><span>VIDEO PREVIEW</span><small>Preview unavailable — check the media URL in the Admin Portal.</small></div></div><b>${esc(x.title||'Behind the frame')}</b></article>`).join('');window.wireMediaAssets?.(grid);}
 async function load(){
  const keys=['site_settings','products','combo_offers','gallery_items','projects','videos'];
  const results=await Promise.all(keys.map(async key=>{try{return [key,await read(key),null]}catch(error){console.warn('Could not load '+key+' from Supabase:',error.message||error);return [key,null,error]}}));
  const content=Object.fromEntries(results.map(([key,value])=>[key,value]));
  const settings=content.site_settings,products=content.products,combos=content.combo_offers,gallery=content.gallery_items,projects=content.projects,videos=content.videos;
  applyText(settings);
  if(Array.isArray(products)&&products.length&&typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS)){
   PRODUCTS.splice(0,PRODUCTS.length,...products.filter(x=>x.active!==false).map(x=>({...x,image2:x.image2||x.image,image3:x.image3||x.image})));
   const grid=document.querySelector('#productGrid');
   if(grid&&typeof productCard==='function')grid.innerHTML=PRODUCTS.map(productCard).join('');
   const tbody=document.querySelector('.size-table tbody');
   if(tbody)tbody.innerHTML=PRODUCTS.map(p=>'<tr><td>'+esc(p.size)+'</td><td>'+money(p.price)+'</td></tr>').join('');
   const cards=document.querySelector('.updated-size-cards');
   if(cards)cards.innerHTML=PRODUCTS.slice(0,3).map((p,i)=>'<article class="price-card '+(i===1?'highlighted':'')+'"><span class="tag">'+esc(p.label||'FRAME')+'</span><p>'+esc(p.size)+'</p><h3>'+esc(p.name)+'</h3><strong>'+money(p.price)+'</strong><small>'+Number(p.photos||1)+' frame · photo printing</small><a class="select-size" href="product.html?id='+encodeURIComponent(p.id)+'">Choose this size</a></article>').join('');
   if(typeof updateProduct==='function'&&typeof product!=='undefined'&&product){const fresh=PRODUCTS.find(p=>p.id===product.id);if(fresh)updateProduct(fresh);const sel=document.querySelector('#customSizeSelect');if(sel){sel.innerHTML=PRODUCTS.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.size)+' — '+money(p.price)+'</option>').join('');sel.value=fresh?.id||PRODUCTS[0]?.id;}}
  }
  if(Array.isArray(combos)&&combos.length)renderCombos(combos);
  if(Array.isArray(combos)&&typeof combo!=='undefined'&&combo){
   const chosen=combos.find(c=>c.id===new URLSearchParams(location.search).get('id'));
   if(chosen){
    combo.price=Number(chosen.price||combo.price);
    const title=document.querySelector('#comboTitle'),price=document.querySelector('#comboPrice');
    if(title)title.textContent=chosen.name||chosen.label||combo.name;
    if(price)price.textContent=money(combo.price);
    const galleryRoot=document.querySelector('#comboProductThumbnails'),hero=document.querySelector('#comboHeroImage');
    if(galleryRoot&&hero){
     const fallback='assets/combo-offer-'+(Number(String(chosen.id||'').replace('combo-',''))||1)+'.jpg';
     const images=[chosen.image,chosen.image2,chosen.image3,chosen.image4].map(src=>String(src||'').trim()).filter(Boolean);
     if(!images.length)images.push(fallback);
     galleryRoot.innerHTML=images.map((src,i)=>'<button type="button" class="'+(i===0?'active':'')+'" data-image="'+esc(src)+'" aria-label="View combo image '+(i+1)+'"><img src="'+esc(src)+'" alt="'+esc(chosen.name||'Combo offer')+' image '+(i+1)+'"></button>').join('');
     galleryRoot.querySelectorAll('button[data-image]').forEach(button=>button.addEventListener('click',()=>{hero.src=button.dataset.image;galleryRoot.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));}));
     hero.src=images[0];hero.alt=(chosen.name||'Combo offer')+' product image';
    }
   }
  }
  renderGallery(gallery);renderProjects(projects);renderVideos(videos);
 }
 document.addEventListener('DOMContentLoaded',load);
})();
