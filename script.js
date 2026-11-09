const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

// Mobile navigation
const menu=$('.menu'),nav=$('.nav');
if(menu&&nav){
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('mobile-open');menu.setAttribute('aria-expanded',String(open));});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('mobile-open')));
}

// Hero carousel
let slide=0;const slides=$$('.hero-slide'),dots=$$('.dot');
function showSlide(i){if(!slides.length)return;slide=i;slides.forEach((s,n)=>s.classList.toggle('active',n===i));dots.forEach((d,n)=>d.classList.toggle('active',n===i));}
dots.forEach(d=>d.addEventListener('click',()=>showSlide(Number(d.dataset.slide))));
if(slides.length>1)setInterval(()=>showSlide((slide+1)%slides.length),5000);

// Homepage product collection
const productGrid=$('#productGrid');
if(productGrid && typeof PRODUCTS!=='undefined') {
  productGrid.innerHTML=PRODUCTS.map(productCard).join('');
  // Make the entire product card open its matching product detail page.
  productGrid.querySelectorAll('.product-card').forEach((card,index)=>{
    const product=PRODUCTS[index];
    if(!product) return;
    card.dataset.href=`product.html?id=${product.id}`;
    card.setAttribute('role','link');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label',`View ${product.name} details`);
    card.addEventListener('click',event=>{
      if(event.target.closest('a,button,input,select,textarea')) return;
      location.href=card.dataset.href;
    });
    card.addEventListener('keydown',event=>{
      if((event.key==='Enter'||event.key===' ') && !event.target.closest('a,button,input,select,textarea')){
        event.preventDefault(); location.href=card.dataset.href;
      }
    });
  });
}

// Smooth auto-sliding carousels for products, gallery, projects and videos.
// Visitors can also drag with a mouse, swipe on touchscreens, use the wheel, or tap arrows.
function setupCarousel(selector, label, delay=4200){
  const track=document.querySelector(selector);
  if(!track || track.dataset.carouselReady==='true' || !track.children.length) return;
  track.dataset.carouselReady='true';
  track.classList.add('carousel-track');
  track.setAttribute('tabindex','0');
  track.setAttribute('aria-label',label);

  const controls=document.createElement('div');
  controls.className='carousel-controls';
  controls.innerHTML=`<span class="carousel-hint">Slides automatically · drag, swipe or use arrows</span><div class="carousel-buttons"><button type="button" class="carousel-arrow carousel-prev" aria-label="Previous ${label}">←</button><button type="button" class="carousel-arrow carousel-next" aria-label="Next ${label}">→</button></div>`;
  track.insertAdjacentElement('afterend',controls);

  const step=()=>{
    const card=track.querySelector(':scope > *');
    if(!card) return track.clientWidth*.8;
    const style=getComputedStyle(track);
    const gap=parseFloat(style.columnGap||style.gap)||0;
    return card.getBoundingClientRect().width+gap;
  };
  const maxScroll=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  const move=(direction)=>{
    const max=maxScroll();
    if(max<=8) return;
    const next=track.scrollLeft+direction*step();
    if(direction>0 && next>=max-4) track.scrollTo({left:0,behavior:'smooth'});
    else if(direction<0 && next<=4) track.scrollTo({left:max,behavior:'smooth'});
    else track.scrollTo({left:Math.max(0,Math.min(max,next)),behavior:'smooth'});
  };

  let pausedUntil=0,hovered=false,focused=false,inView=true;
  let autoDirection=1;
  let dragStartX=0,dragStartScroll=0,dragging=false,didDrag=false;
  const pauseBriefly=()=>{pausedUntil=Date.now()+7500;};
  controls.querySelector('.carousel-prev').addEventListener('click',()=>{pauseBriefly();move(-1)});
  controls.querySelector('.carousel-next').addEventListener('click',()=>{pauseBriefly();move(1)});

  // Mouse / pen drag. Native touch scrolling remains enabled on phones and tablets.
  track.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch' || event.button!==0 || event.target.closest('a,button,video,input,select,textarea')) return;
    dragging=true;didDrag=false;dragStartX=event.clientX;dragStartScroll=track.scrollLeft;
    track.classList.add('is-dragging');
    pauseBriefly();
  });
  track.addEventListener('pointermove',event=>{
    if(!dragging) return;
    const distance=event.clientX-dragStartX;
    if(Math.abs(distance)>4) didDrag=true;
    if(didDrag){
      track.scrollLeft=dragStartScroll-distance;
      if(event.cancelable) event.preventDefault();
    }
  });
  const finishDrag=()=>{
    if(!dragging) return;
    dragging=false;
    track.classList.remove('is-dragging');
    if(didDrag){
      window.setTimeout(()=>{didDrag=false},80);
      pauseBriefly();
    }
  };
  track.addEventListener('pointerup',finishDrag);
  track.addEventListener('pointercancel',finishDrag);
  track.addEventListener('lostpointercapture',finishDrag);
  track.addEventListener('click',event=>{
    if(didDrag){event.preventDefault();event.stopPropagation();didDrag=false;}
  },true);

  track.addEventListener('pointerenter',()=>{hovered=true});
  track.addEventListener('pointerleave',()=>{hovered=false;pauseBriefly();finishDrag()});
  track.addEventListener('focusin',()=>{focused=true;pauseBriefly()});
  track.addEventListener('focusout',()=>{focused=false;pauseBriefly()});
  track.addEventListener('touchstart',pauseBriefly,{passive:true});
  track.addEventListener('wheel',pauseBriefly,{passive:true});
  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'){event.preventDefault();pauseBriefly();move(1)}
    if(event.key==='ArrowLeft'){event.preventDefault();pauseBriefly();move(-1)}
  });

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting},{threshold:.08});
    observer.observe(track);
  }
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion) window.setInterval(()=>{
    const max=maxScroll();
    if(document.hidden || !inView || hovered || focused || dragging || Date.now()<pausedUntil || max<=8) return;
    // Reverse smoothly at either end so the carousel never visibly jumps back to start.
    if(autoDirection>0 && track.scrollLeft>=max-8) autoDirection=-1;
    else if(autoDirection<0 && track.scrollLeft<=8) autoDirection=1;
    track.scrollTo({left:Math.max(0,Math.min(max,track.scrollLeft+autoDirection*step())),behavior:'smooth'});
  },delay);
}
setupCarousel('.gallery-grid','frame gallery',3900);
setupCarousel('#productGrid','our products',4300);
setupCarousel('.combo-offer-grid','combo offers',4200);
setupCarousel('.project-grid','our projects',4100);
setupCarousel('.video-grid','videos',4500);

// Make any non-link area of a frame-gallery card open its mapped product page.
document.querySelectorAll('.gallery-card[data-product-href]').forEach(card=>{
  card.addEventListener('click',event=>{
    if(event.target.closest('a,button')) return;
    location.href=card.dataset.productHref;
  });
  card.querySelectorAll('.gallery-caption a').forEach(link=>link.href=card.dataset.productHref);
});

// A very slow one-time page drift for unattended display screens. Any visitor
// input cancels it immediately; normal browsing and scrolling remain in control.
(function gentlePageDrift(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let cancelled=false, frame=0, last=0;
  const cancel=()=>{cancelled=true;if(frame)cancelAnimationFrame(frame);};
  ['pointerdown','pointermove','keydown','wheel','touchstart'].forEach(type=>window.addEventListener(type,cancel,{once:true,passive:true}));
  const start=()=>{
    if(cancelled || document.hidden) return;
    const tick=now=>{
      if(cancelled) return;
      if(!last) last=now;
      const delta=Math.min(now-last,50); last=now;
      window.scrollBy(0,delta*0.012); // roughly 12 pixels per second
      if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2){cancel();return;}
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
  };
  window.setTimeout(start,12000);
})();

// Custom builder: only initialise when the builder exists on the current page.
const pillWrap=$('#sizePills'), input=$('#photoUpload'), list=$('#uploadList'), img=$('#previewImage'), empty=$('#previewEmpty'), mat=$('.mat');
if(pillWrap && input && list && img && mat){
  const sizes=['4 × 5','4 × 6','5 × 7','6 × 8','8 × 10','8 × 12','9 × 12','10 × 13','11 × 14','12 × 16','14 × 18','16 × 20','20 × 24','22 × 28','24 × 30','24 × 36','30 × 40','12 × 8','12 × 18'];
  let selectedSize='12 × 8', selectedPrice=399, requiredPhotos=1, files=[];
  sizes.forEach(size=>{const b=document.createElement('button');b.className='size-pill'+(size===selectedSize?' active':'');b.textContent=size;b.dataset.size=size;b.addEventListener('click',()=>selectSize(size));pillWrap.appendChild(b)});
  function priceFor(size){if(size==='12 × 8')return 399;if(size==='12 × 18')return 999;return null;}
  function updateUploadHint(){input.title=`Upload ${requiredPhotos} photo${requiredPhotos>1?'s':''}`;}
  function selectSize(size,price=null,count=1){selectedSize=size;selectedPrice=price??priceFor(size);requiredPhotos=count||1;$$('.size-pill').forEach(b=>b.classList.toggle('active',b.dataset.size===size));if($('#previewSize'))$('#previewSize').textContent=size;if($('#previewPrice'))$('#previewPrice').textContent=selectedPrice?`₹${selectedPrice}`:'Custom quote';updateUploadHint();}
  $$('.select-size').forEach(b=>b.addEventListener('click',()=>{selectSize(b.dataset.size,Number(b.dataset.price),Number(b.dataset.count||1));const custom=$('#custom');if(custom)custom.scrollIntoView({behavior:'smooth'});else location.href='products.html';}));
  input.addEventListener('change',e=>{files=[...e.target.files].filter(f=>f.size<=8*1024*1024).slice(0,requiredPhotos);renderFiles();});
  function renderFiles(){list.innerHTML='';files.forEach(f=>{const u=URL.createObjectURL(f),im=document.createElement('img');im.src=u;im.className='upload-thumb';im.alt='Uploaded photo';list.appendChild(im)});if(files[0]){img.src=URL.createObjectURL(files[0]);mat.classList.add('has-image');}else{img.removeAttribute('src');mat.classList.remove('has-image');}}
  const clear=$('#clearPhotos');if(clear)clear.addEventListener('click',()=>{files=[];input.value='';renderFiles();});
  $$('input[name="finish"]').forEach(r=>r.addEventListener('change',()=>{if($('#previewFinish'))$('#previewFinish').textContent=r.value;}));
  const place=$('#placeOrder');
  if(place)place.addEventListener('click',()=>{const name=$('#customerName')?.value.trim(),phone=$('#customerPhone')?.value.trim(),address=$('#customerAddress')?.value.trim();if(!name||!phone||!address){alert('Please enter your name, mobile number and address.');return}if(files.length<requiredPhotos){alert(`Please upload ${requiredPhotos} photo${requiredPhotos>1?'s':''} for this order.`);return}const id=`JFW-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`,finish=$('input[name="finish"]:checked')?.value||'Ivory & Gold';const msg=`New Joel Frame Work's order\nOrder ID: ${id}\nCustomer: ${name}\nMobile: ${phone}\nSize: ${selectedSize}\nFinish: ${finish}\nPrice: ${selectedPrice?`₹${selectedPrice}`:'Custom quote'}\nPhotos: ${files.length}\nAddress: ${address}`;localStorage.setItem('joel-last-order',JSON.stringify({id,name,phone,address,size:selectedSize,finish,price:selectedPrice,photoCount:files.length}));const box=$('#orderStatus');if(box){box.hidden=false;box.innerHTML=`<strong>Order ${id} created.</strong><br>Your order is awaiting owner confirmation.<br><a class="btn gold" style="margin-top:10px" target="_blank" rel="noopener" href="https://wa.me/918610493135?text=${encodeURIComponent(msg)}">Send order to WhatsApp</a>`;}});
}


// Media assets: keep images visible after both initial HTML and Supabase content updates.
function wireMediaAssets(root=document){
  if(!root) return;
  const imageSelector='.hero-placeholder img, .gallery-slot img, .project-slot img, .video-slot img';
  const videoSelector='.video-slot video';
  const collect=(selector)=>{
    const found=[];
    if(root.nodeType===1 && root.matches?.(selector)) found.push(root);
    if(root.querySelectorAll) found.push(...root.querySelectorAll(selector));
    return found;
  };
  const ensureFallback=(media,label)=>{
    const host=media.parentElement;
    if(!host) return null;
    let fallback=[...host.children].find(node=>node.classList?.contains('media-fallback'));
    if(!fallback){
      fallback=document.createElement('div');
      fallback.className='media-fallback';
      fallback.innerHTML='<span>'+label+'</span><small>Image unavailable — check the image URL in the Admin Portal.</small>';
      host.appendChild(fallback);
    }
    return fallback;
  };

  collect(imageSelector).forEach(img=>{
    if(img.dataset.mediaWired==='true') return;
    img.dataset.mediaWired='true';
    const label=img.closest('.gallery-slot')?'GALLERY IMAGE':img.closest('.project-slot')?'PROJECT IMAGE':img.closest('.video-slot')?'VIDEO THUMBNAIL':'HERO IMAGE';
    const fallback=ensureFallback(img,label);
    const markLoaded=()=>{
      img.classList.remove('asset-error');
      img.classList.add('asset-loaded');
    };
    const markFailed=()=>{
      img.classList.remove('asset-loaded');
      img.classList.add('asset-error');
      if(fallback) fallback.hidden=false;
    };
    img.addEventListener('load',markLoaded);
    img.addEventListener('error',markFailed);
    if(img.complete){
      if(img.naturalWidth>0) markLoaded();
      else if(img.currentSrc||img.src) markFailed();
    }
  });

  collect(videoSelector).forEach(video=>{
    if(video.dataset.mediaWired==='true') return;
    video.dataset.mediaWired='true';
    const fallback=ensureFallback(video,'VIDEO PREVIEW');
    const markLoaded=()=>{
      video.classList.remove('asset-error');
      video.classList.add('asset-loaded');
    };
    const markFailed=()=>{
      video.classList.remove('asset-loaded');
      video.classList.add('asset-error');
      if(fallback) fallback.hidden=false;
    };
    video.addEventListener('loadeddata',markLoaded);
    video.addEventListener('canplay',markLoaded);
    video.addEventListener('error',markFailed);
    if(video.readyState>=2) markLoaded();
  });
}
wireMediaAssets();

// Make the media setup callable by the Supabase content renderer.
window.wireMediaAssets = wireMediaAssets;

// Supabase replaces gallery/project/video cards after page load. Watch for those
// new elements and attach the same load/error handling before they can stay hidden.
if('MutationObserver' in window){
  const mediaObserver=new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1) wireMediaAssets(node);
    }));
  });
  mediaObserver.observe(document.documentElement,{childList:true,subtree:true});
}

// Chatbot
const chat=$('#chatbot'), chatToggle=$('#chatToggle'), chatClose=$('#chatClose'), chatBody=$('#chatBody');
if(chat&&chatToggle){
  chatToggle.addEventListener('click',()=>{chat.hidden=!chat.hidden; if(!chat.hidden)chatClose?.focus();});
  chatClose?.addEventListener('click',()=>chat.hidden=true);
  const replies={size:'For a small portrait, try 4 × 5, 4 × 6 or 5 × 7. For a larger wall frame, explore 11 × 14 and above.',offer:'Current offers: 12 × 8 ₹399; 12 × 8 One + One ₹799; 12 × 18 One + One ₹999.',upload:'Open a frame from the collection, choose the finish, upload your photo and check the preview before ordering.',order:'Choose a frame, open Show details, upload the required photo or photos, enter your details and send the order to the owner on WhatsApp.'};
  $$('.chat-options button').forEach(b=>b.addEventListener('click',()=>{const reply=document.createElement('div');reply.className='chat-reply';reply.textContent=replies[b.dataset.chat]||'Please choose one of the options above.';chatBody.appendChild(reply);chatBody.scrollTop=chatBody.scrollHeight;if(b.dataset.chat==='order')setTimeout(()=>location.href='products.html',350);}));
}

// Make floating social buttons work even when the site is opened from a local file.
document.querySelectorAll('.social-float').forEach(a=>a.addEventListener('click',()=>{a.blur();}));

/* Header product search */

const searchForm=$('#siteSearch'),searchInput=$('#productSearch'),searchResults=$('#searchResults');

// Mobile-only header search toggle (declare form elements before binding).
const mobileSearchToggle=$('.mobile-search-toggle');
if(mobileSearchToggle&&searchForm&&searchInput){
 mobileSearchToggle.addEventListener('click',()=>{
  const open=searchForm.classList.toggle('mobile-search-open');
  mobileSearchToggle.setAttribute('aria-expanded',String(open));
  if(open){searchInput.focus();}else{searchResults.hidden=true;searchInput.value='';}
 });
}
if(searchForm&&searchInput&&searchResults){
 const renderSearch=()=>{
  const q=searchInput.value.trim().toLowerCase();
  if(!q){searchResults.hidden=true;searchResults.innerHTML='';return;}
  const matches=(typeof PRODUCTS!=='undefined'?PRODUCTS:[]).filter(p=>[p.name,p.size,p.label,p.finish].join(' ').toLowerCase().includes(q));
  searchResults.innerHTML=matches.length?matches.map(p=>'<a href="product.html?id='+encodeURIComponent(p.id)+'"><span>'+p.name+'</span><small>'+p.size+' · ₹'+Number(p.price).toLocaleString('en-IN')+'</small></a>').join(''):'<div class="search-empty">No matching frames found.</div>';
  searchResults.hidden=false;
 };
 searchInput.addEventListener('input',renderSearch);
 searchForm.addEventListener('submit',e=>{e.preventDefault();const first=searchResults.querySelector('a');if(first)location.href=first.href;else if(searchInput.value.trim())location.href='products.html';});
 document.addEventListener('click',e=>{if(!searchForm.contains(e.target))searchResults.hidden=true;});
}
