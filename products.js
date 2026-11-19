const FRAME_SIZE_VARIANTS = [{"size":"10 × 8","price":300},{"size":"12 × 8","price":350},{"size":"12 × 10","price":380},{"size":"15 × 10","price":500},{"size":"15 × 12","price":580},{"size":"18 × 12","price":750},{"size":"20 × 16","price":1000},{"size":"20 × 30","price":2500}];
const PRODUCTS = [
 {id:'frame-10x8', name:'Classic Portrait Frame', size:'10 × 8', price:300, photos:1, finish:'Ivory & Gold', image:'assets/cover-10x8.png', label:'EVERYDAY'},
 {id:'frame-12x8', name:'Classic Memory Frame', size:'12 × 8', price:350, photos:1, finish:'Ivory & Gold', image:'assets/cover-12x8.png', label:'POPULAR'},
 {id:'frame-12x10', name:'Classic Family Frame', size:'12 × 10', price:380, photos:1, finish:'Champagne Gold', image:'assets/cover-12x10.png', label:'POPULAR'},
 {id:'frame-15x10', name:'Classic Couple Frame', size:'15 × 10', price:500, photos:1, finish:'Charcoal', image:'assets/cover-15x10.png', label:'BESTSELLER'},
 {id:'frame-15x12', name:'Premium Display Frame', size:'15 × 12', price:580, photos:1, finish:'Ivory & Gold', image:'assets/cover-15x12.png', label:'PREMIUM'},
 {id:'frame-18x12', name:'Statement Wall Frame', size:'18 × 12', price:750, photos:1, finish:'Classic Black', image:'assets/cover-18x12.png', label:'STATEMENT'},
 {id:'frame-20x16', name:'Premium Wall Frame', size:'20 × 16', price:1000, photos:1, finish:'Charcoal', image:'assets/cover-20x16.png', label:'PREMIUM'},
 {id:'frame-20x30', name:'Grand Gallery Frame', size:'20 × 30', price:2500, photos:1, finish:'Classic Black', image:'assets/cover-20x30.png', label:'GRAND'}
];
function productCover(p){return p.image||'assets/cover-12x8.png'}
function productEscape(value){
 return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function productCard(p){
 const start=Math.min(...FRAME_SIZE_VARIANTS.map(v=>Number(v.price)||Infinity));
 const id=encodeURIComponent(p.id||'');
 const name=productEscape(p.name||'Photo frame');
 const description=productEscape(p.description||'Premium frame with personalised photo printing.');
 const image=productEscape(productCover(p));
 const label=productEscape(p.label||'NEW');
 const kicker=/personal|custom/i.test(String(p.description||''))?'PERSONALISED FRAME':'THE FRAME COLLECTION';
 return `<article class="product-card" data-href="product.html?id=${id}">
  <a class="product-image-link" href="product.html?id=${id}" aria-label="View ${name}">
   <div class="product-image">
    <img src="${image}" alt="${name}" loading="lazy">
    <span class="product-tag">${label}</span>
   </div>
  </a>
  <div class="product-info">
   <div class="product-size">${kicker}</div>
   <h3>${name}</h3>
   <p>${description}</p>
   <div class="product-bottom">
    <strong>From ₹${Number.isFinite(start)?start.toLocaleString('en-IN'):'300'}</strong>
    <a class="product-link product-buy-button" href="product.html?id=${id}">BUY NOW <span aria-hidden="true">→</span></a>
   </div>
  </div>
 </article>`;
}
let productCollectionPage=1;
const PRODUCT_COLLECTION_PAGE_SIZE=4;
function renderProductCollection(requestedPage=productCollectionPage){
 const grid=document.querySelector('#productGrid');
 const pager=document.querySelector('#productPagination');
 if(!grid||!Array.isArray(PRODUCTS))return;
 const total=PRODUCTS.length;
 const pageCount=Math.max(1,Math.ceil(total/PRODUCT_COLLECTION_PAGE_SIZE));
 productCollectionPage=Math.min(pageCount,Math.max(1,Number(requestedPage)||1));
 const first=(productCollectionPage-1)*PRODUCT_COLLECTION_PAGE_SIZE;
 const visible=PRODUCTS.slice(first,first+PRODUCT_COLLECTION_PAGE_SIZE);
 grid.innerHTML=visible.map(productCard).join('');
 grid.querySelectorAll('.product-card').forEach(card=>{
  card.addEventListener('click',event=>{
   if(event.target.closest('a,button,input,select,textarea'))return;
   location.href=card.dataset.href;
  });
  card.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href=card.dataset.href;}
  });
  card.setAttribute('tabindex','0');
  card.setAttribute('aria-label','View '+(card.querySelector('h3')?.textContent||'frame')+' details');
 });
 if(pager){
  const shownTo=Math.min(first+visible.length,total);
  const pages=Array.from({length:pageCount},(_,i)=>i+1);
  pager.innerHTML=`<span class="product-pagination-meta">Showing ${total?first+1:0}–${shownTo} of ${total} products</span>
   <nav class="product-pagination-controls" aria-label="Product pagination">
    <button type="button" class="product-page-arrow" data-product-page="${Math.max(1,productCollectionPage-1)}" ${productCollectionPage===1?'disabled':''} aria-label="Previous page">←</button>
    ${pages.map(n=>`<button type="button" class="product-page-number ${n===productCollectionPage?'active':''}" data-product-page="${n}" ${n===productCollectionPage?'aria-current="page"':''}>${n}</button>`).join('')}
    <button type="button" class="product-page-arrow" data-product-page="${Math.min(pageCount,productCollectionPage+1)}" ${productCollectionPage===pageCount?'disabled':''} aria-label="Next page">→</button>
   </nav>`;
  if(pager.dataset.bound!=='true'){
   pager.dataset.bound='true';
   pager.addEventListener('click',event=>{
    const button=event.target.closest('[data-product-page]');
    if(!button||button.disabled)return;
    renderProductCollection(Number(button.dataset.productPage));
    const section=document.querySelector('#products');
    if(section)section.scrollIntoView({behavior:'smooth',block:'start'});
   });
  }
 }
}
document.addEventListener('error', e => { const img=e.target; if(img instanceof HTMLImageElement && img.closest('.product-image')){img.style.display='none';img.closest('.product-image').classList.add('asset-missing')} }, true);
