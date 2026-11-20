const COMBOS={'combo-1':{name:'Combo Offer 1',price:999,groups:[['12 × 18',3]]},'combo-2':{name:'Combo Offer 2',price:999,groups:[['12 × 8',4],['6 × 4',2]]},'combo-3':{name:'Combo Offer 3',price:1200,groups:[['12 × 18',1],['12 × 8',4],['6 × 4',2]]},'combo-4':{name:'Combo Offer 4',price:999,groups:[['12 × 8',3],['6 × 4',5]]},'combo-5':{name:'Combo Offer 5',price:1200,groups:[['12 × 18',3],['12 × 8',3]]}};
const id=new URLSearchParams(location.search).get('id')||'combo-1',combo=COMBOS[id]||COMBOS['combo-1'],slots=[];
combo.groups.forEach(([size,count],groupIndex)=>{for(let i=0;i<count;i++)slots.push({size,groupIndex,file:null})});
let activeGroup=0,launchOfferEnabled=false,freeGiftSize='6 × 4',freeGiftFile=null,freeGiftPreviewUrl='';
const $=s=>document.querySelector(s);
$('#comboTitle').textContent=combo.name;$('#comboPrice').textContent='₹'+combo.price.toLocaleString('en-IN');document.title=combo.name+' Photo Frame Combo in Chennai | Joel Frame Work';
const comboDescription=combo.name+' in Chennai: choose your photo frame sizes, upload your pictures and order this personalised frame combo online for ₹'+combo.price.toLocaleString('en-IN')+'.';
const metaDescription=document.querySelector('meta[name="description"]');if(metaDescription)metaDescription.content=comboDescription;
const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href='https://joelframeworks.in/combo.html?id='+encodeURIComponent(id);
const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=document.title;
const ogDescription=document.querySelector('meta[property="og:description"]');if(ogDescription)ogDescription.content=comboDescription;
const ogUrl=document.querySelector('meta[property="og:url"]');if(ogUrl)ogUrl.content='https://joelframeworks.in/combo.html?id='+encodeURIComponent(id);
const comboImage='assets/combo-offer-'+(Number(id.replace('combo-',''))||1)+'.jpg';$('#comboHeroImage').src=comboImage;$('#comboHeroImage').alt=combo.name+' handcrafted photo frame combo';
async function loadLaunchOffer(){
 const config=window.JOEL_SUPABASE_CONFIG||{};
 if(!window.supabase||!config.url||!config.anonKey)return;
 try{
  const db=window.supabase.createClient(config.url,config.anonKey);
  const {data,error}=await db.from('site_content').select('content').eq('key','launch_offer').maybeSingle();
  if(error)throw error;
  const settings=data?.content;
  launchOfferEnabled=settings?settings.enabled===true:true;
  if(launchOfferEnabled)freeGiftSize=String(settings.freeFrameSize||'6 × 4').trim()||'6 × 4';
 }catch(error){console.warn('Could not confirm launch-offer eligibility; no free gift will be added.',error);launchOfferEnabled=false;}
}
function groupSlots(groupIndex){return slots.map((slot,index)=>({...slot,index})).filter(slot=>slot.groupIndex===groupIndex)}
function renderFreeGiftUpload(){
 const panel=$('#comboFreeGiftUpload');if(!panel)return;
 if(!launchOfferEnabled){panel.hidden=true;panel.innerHTML='';return;}
 panel.hidden=false;
 panel.innerHTML='<div class="combo-free-gift-head"><span class="combo-free-gift-badge">LIMITED-TIME GIFT</span><span class="combo-free-gift-price">COMPLIMENTARY · ₹0</span></div><div class="combo-free-gift-body"><div class="combo-free-gift-preview" id="comboFreeGiftPreview"><span>＋</span></div><div class="combo-free-gift-copy"><strong>Free Gift Frame</strong><span id="comboFreeGiftSize"></span><small id="comboFreeGiftStatus">Upload one photo for your free frame</small><label class="combo-inline-upload-button combo-free-gift-button" for="comboFreeGiftInput">UPLOAD PHOTO<input id="comboFreeGiftInput" type="file" accept="image/jpeg,image/png,image/webp"></label></div></div><p class="combo-free-gift-note">One complimentary 6×4-inch frame is included with this launch offer. No extra charge.</p>';
 $('#comboFreeGiftSize').textContent=freeGiftSize+' inch';
 const note=panel.querySelector('.combo-free-gift-note');if(note)note.textContent='One complimentary '+freeGiftSize+' inch frame is included with this launch offer. No extra charge.';
 const preview=$('#comboFreeGiftPreview');
 if(freeGiftFile){
  if(freeGiftPreviewUrl)URL.revokeObjectURL(freeGiftPreviewUrl);
  freeGiftPreviewUrl=URL.createObjectURL(freeGiftFile);
  const img=document.createElement('img');img.src=freeGiftPreviewUrl;img.alt='Photo selected for free gift frame';preview.replaceChildren(img);
  $('#comboFreeGiftStatus').textContent='Gift photo selected · '+freeGiftFile.name;
  $('#comboFreeGiftInput').parentElement.firstChild.textContent='CHANGE PHOTO';
 }
 $('#comboFreeGiftInput').addEventListener('change',e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){alert('Choose a JPG, PNG or WEBP photo under 8 MB.');e.target.value='';return;}
  freeGiftFile=file;renderFreeGiftUpload();
 });
}
function renderFrames(){
 const summary=$('#comboSizeSummary');
 summary.innerHTML=combo.groups.map(([size,count],groupIndex)=>{const group=groupSlots(groupIndex),done=group.filter(s=>s.file).length,complete=done===count;return '<button type="button" class="combo-size-pill'+(activeGroup===groupIndex?' active':'')+(complete?' complete':'')+'" data-size-group="'+groupIndex+'" aria-pressed="'+(activeGroup===groupIndex)+'"><span>'+size+' inch</span><small>'+done+' / '+count+' uploaded</small></button>'}).join('');
 summary.querySelectorAll('[data-size-group]').forEach(button=>button.addEventListener('click',()=>{activeGroup=Number(button.dataset.sizeGroup);renderFrames()}));
 const current=groupSlots(activeGroup),root=$('#comboFrameItems');root.innerHTML='';
 current.forEach(slot=>{
  const card=document.createElement('article');card.className='combo-inline-upload-card';
  const preview=slot.file?URL.createObjectURL(slot.file):'';
  card.innerHTML='<div class="combo-inline-upload-icon">'+(preview?'<img src="'+preview+'" alt="Selected photo">':'<span>▧</span>')+'</div><div class="combo-inline-upload-copy"><strong>Frame '+(slot.index+1)+'</strong><span>'+slot.size+' inch</span><small>'+(slot.file?'Photo selected':'Upload Photo')+'</small></div><label class="combo-inline-upload-button">'+(slot.file?'CHANGE':'UPLOAD')+'<input type="file" accept="image/jpeg,image/png,image/webp" data-frame="'+slot.index+'"></label>';
  root.appendChild(card);
 });
 root.querySelectorAll('input[type=file]').forEach(input=>input.addEventListener('change',e=>{
  const file=e.target.files?.[0],index=Number(e.target.dataset.frame);if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){alert('Choose a JPG, PNG or WEBP photo under 8 MB.');e.target.value='';return;}
  slots[index].file=file;const selectedGroup=slots[index].groupIndex,allDone=groupSlots(selectedGroup).every(s=>s.file);
  if(allDone){const next=combo.groups.findIndex((_,i)=>i>selectedGroup&&groupSlots(i).some(s=>!s.file));if(next>=0)activeGroup=next;}
  renderFrames();
 }));
 renderFreeGiftUpload();
 const uploaded=slots.filter(s=>s.file).length;$('#summaryCount').textContent=uploaded+' / '+slots.length+' combo photos added'+(launchOfferEnabled?' · plus one free gift photo':'');
 const [size,count]=combo.groups[activeGroup];
 $('#comboUploadHeading').textContent='Upload photos for '+size+' inch ('+count+' '+(count===1?'frame':'frames')+')';
}
function makeOrderId(){return 'JFW-C-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
$('#sendComboOrder').onclick=async()=>{
 const button=$('#sendComboOrder'),status=$('#comboOrderStatus'),missing=slots.findIndex(s=>!s.file);
 if(missing>=0){activeGroup=slots[missing].groupIndex;renderFrames();const remaining=slots.filter(s=>!s.file).length;alert('Please upload the remaining '+remaining+' combo frame image'+(remaining===1?'':'s')+' before continuing to checkout.');return;}
 if(launchOfferEnabled&&!freeGiftFile){alert('Please upload one photo for your complimentary '+freeGiftSize+' inch free gift frame to claim this launch offer.');$('#comboFreeGiftInput')?.focus();return;}
 const orderId=makeOrderId();button.disabled=true;button.textContent='UPLOADING PHOTOS…';status.hidden=false;
 try{
  const originals=slots.map((slot,i)=>{const ext=(slot.file.name.split('.').pop()||'jpg').toLowerCase();return new File([slot.file],orderId+'-frame-'+(i+1)+'-original.'+ext,{type:slot.file.type||'image/jpeg'});});
  if(launchOfferEnabled&&freeGiftFile){const ext=(freeGiftFile.name.split('.').pop()||'jpg').toLowerCase();originals.push(new File([freeGiftFile],orderId+'-free-gift-'+freeGiftSize.replace(/[^a-z0-9]/gi,'-')+'.'+ext,{type:freeGiftFile.type||'image/jpeg'}));}
  const links=await window.JoelOrderNotifications.uploadOrderFiles({orderId,files:originals});
  const paidLinks=links.slice(0,slots.length);
  const frames=slots.map((slot,i)=>({frame:i+1,size:slot.size,originalFileName:slot.file.name,imageUrl:paidLinks[i].url,imagePath:paidLinks[i].path}));
  const details={comboId:id,comboName:combo.name,frames};
  let freeGift=null;
  if(launchOfferEnabled&&freeGiftFile){
   const giftLink=links[slots.length];
   freeGift={included:true,title:'Free Gift Frame',size:freeGiftSize,quantity:1,price:0,originalFileName:freeGiftFile.name,imageUrl:giftLink.url,imagePath:giftLink.path,imageIndex:slots.length};
   details.promotionalGift=freeGift;
  }
  const description=frames.length+' personalised combo frames'+(freeGift?' + 1 FREE '+freeGiftSize+' inch gift frame':'');
  sessionStorage.setItem('joelFrameCheckoutDraft',JSON.stringify({orderId,orderType:'combo',itemName:combo.name,description,amount:combo.price,details,imageLinks:links,paidPhotoCount:slots.length,freeGift}));
  window.location.href='checkout.html';
 }catch(err){console.error(err);status.textContent='Photo upload failed: '+(err.message||String(err));button.disabled=false;button.textContent='CONTINUE TO CHECKOUT';}
};
async function initCombo(){
 const button=$('#sendComboOrder');button.disabled=true;button.textContent='CHECKING LAUNCH OFFER…';
 await loadLaunchOffer();renderFrames();
 button.disabled=false;button.textContent='CONTINUE TO CHECKOUT';
 const gallery=$('#comboProductThumbnails');
 if(gallery){gallery.querySelectorAll('button[data-image]').forEach(button=>button.addEventListener('click',()=>{$('#comboHeroImage').src=button.dataset.image;gallery.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));}));const initial=gallery.querySelector('button[data-image="'+comboImage+'"]')||gallery.querySelector('button[data-image]');if(initial)initial.click();}
}
initCombo();