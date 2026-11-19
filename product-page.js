const params=new URLSearchParams(location.search);
const requestedProductId=params.get('id')||'frame-12x8';
const $=s=>document.querySelector(s);
let product=PRODUCTS.find(p=>p.id===requestedProductId)||null;
let selectedFinish=product?.finish||'Classic';
let selectedSize=null;
let productReady=false;

function updateProduct(p){
 if(!p)return;
 product=p;
 selectedFinish=p.finish||'Classic';
 const matchingSize=FRAME_SIZE_VARIANTS.find(s=>s.size===p.size)||FRAME_SIZE_VARIANTS[0];
 selectedSize={...matchingSize,price:Number(p.price??matchingSize.price)};
 $('#detailLabel').textContent=p.label||"JOEL FRAME WORK'S";
 $('#detailName').textContent=p.name||'Photo frame';
 $('#detailPrice').textContent='₹'+Number(selectedSize.price).toLocaleString('en-IN');
 $('#detailDescription').textContent=p.description||'Handcrafted photo frame with premium finish and photo printing.';
 $('#productCrumb').textContent=p.name||'Frame details';
 document.title=(p.name||'Photo frame')+' | Custom Photo Frame in Chennai | Joel Frame Work';
 const seoDescription='Buy '+(p.name||'a personalised photo frame')+' in Chennai from Joel Frame Work. Choose your size, upload your photo and order online.';
 const desc=document.querySelector('meta[name="description"]');if(desc)desc.content=seoDescription;
 const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=document.title;
 const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc)ogDesc.content=seoDescription;
 const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href='https://joelframeworks.in/product.html?id='+encodeURIComponent(p.id);
 const images=[p.image,p.image2,p.image3].map(x=>String(x||'').trim()).filter(Boolean);
 if(!images.length)images.push('assets/cover-12x8.png');
 $('#detailMainImage').src=images[0];
 $('#detailMainImage').alt=(p.name||'Photo frame')+' product image';
 const thumbs=$('#productThumbs');thumbs.innerHTML='';
 images.slice(0,3).forEach((src,i)=>{
  const b=document.createElement('button');b.type='button';b.className='frame-product-thumb'+(i===0?' active':'');
  const img=document.createElement('img');img.src=src;img.alt=(p.name||'Photo frame')+' image '+(i+1);b.appendChild(img);
  b.onclick=()=>{thumbs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#detailMainImage').src=src;};
  thumbs.appendChild(b);
 });
 const sizes=$('#frameSizeOptions');sizes.innerHTML='';
 FRAME_SIZE_VARIANTS.forEach(s=>{
  const b=document.createElement('button');b.type='button';
  b.className='frame-size-option'+(s.size===selectedSize.size?' active':'');
  b.textContent=s.size+' inch';b.setAttribute('aria-pressed',s.size===selectedSize.size?'true':'false');
  b.onclick=()=>{
   selectedSize=s;product={...product,size:s.size,price:s.price};
   $('#detailPrice').textContent='₹'+Number(s.price).toLocaleString('en-IN');
   sizes.querySelectorAll('button').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',active?'true':'false');});
  };
  sizes.appendChild(b);
 });
 productReady=true;
 const orderButton=$('#productPlaceOrder');if(orderButton)orderButton.disabled=false;
}

function showProductUnavailable(message){
 productReady=false;
 $('#detailLabel').textContent="JOEL FRAME WORK'S";
 $('#detailName').textContent='Frame details unavailable';
 $('#detailDescription').textContent=message||'This frame could not be loaded. Please return to All Products and select it again.';
 $('#productOrderStatus').hidden=false;
 $('#productOrderStatus').textContent='The requested frame could not be loaded. Please refresh or contact us on WhatsApp.';
 const orderButton=$('#productPlaceOrder');if(orderButton)orderButton.disabled=true;
}

async function loadRequestedProduct(){
 const localProduct=PRODUCTS.find(p=>p.id===requestedProductId&&p.active!==false);
 if(localProduct){updateProduct(localProduct);}
 try{
  const config=window.JOEL_SUPABASE_CONFIG||{};
  if(!window.supabase||!config.url||!config.anonKey){
   if(!localProduct)showProductUnavailable('The frame catalogue is not available right now. Please try again.');
   return;
  }
  const db=window.supabase.createClient(config.url,config.anonKey);
  const {data,error}=await db.from('site_content').select('content').eq('key','products').maybeSingle();
  if(error)throw error;
  const list=Array.isArray(data?.content)?data.content:[];
  const found=list.find(p=>String(p.id)===requestedProductId&&p.active!==false);
  if(found){
   const normalized={...found,image2:found.image2||found.image,image3:found.image3||found.image};
   const index=PRODUCTS.findIndex(p=>p.id===normalized.id);
   if(index>=0)PRODUCTS[index]=normalized;else PRODUCTS.push(normalized);
   updateProduct(normalized);
   return;
  }
  if(!localProduct)showProductUnavailable('This frame is not in the active product catalogue. Please return to All Products.');
 }catch(error){
  console.warn('Could not resolve product from Supabase:',error.message||error);
  if(!localProduct)showProductUnavailable('We could not load this new frame from the catalogue. Please refresh and try again.');
 }
}

function makeOrderId(){return 'JFW-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.random().toString(36).slice(2,7).toUpperCase();}
$('#frameOrderForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const button=$('#productPlaceOrder'),status=$('#productOrderStatus'),file=$('#pPhoto').files[0];
 if(!productReady||!product){status.hidden=false;status.textContent='Please wait while this frame is loading.';return;}
 if(!file||file.size>8*1024*1024){alert('Choose one photo under 8 MB.');return;}
 const id=makeOrderId();button.disabled=true;button.textContent='UPLOADING PHOTO…';status.hidden=false;
 try{
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase(),original=new File([file],id+'-original.'+ext,{type:file.type||'image/jpeg'});
  const links=await window.JoelOrderNotifications.uploadOrderFiles({orderId:id,files:[original]});
  const details={productId:product.id,productName:product.name,size:selectedSize.size,finish:selectedFinish,originalFileName:file.name};
  sessionStorage.setItem('joelFrameCheckoutDraft',JSON.stringify({orderId:id,orderType:'product',itemName:product.name,description:selectedSize.size+' inch · '+selectedFinish+' finish',amount:Number(selectedSize.price),details,imageLinks:links}));
  window.location.href='checkout.html';
 }catch(err){
  console.error(err);status.textContent='Could not upload photo: '+(err.message||String(err));button.disabled=false;button.textContent='CONTINUE TO CHECKOUT';
 }
});
if(product)updateProduct(product);
else showProductUnavailable('Loading this frame from the product catalogue…');
loadRequestedProduct();
