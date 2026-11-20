(()=>{
 const defaults={enabled:true,desktopEnabled:true,mobileEnabled:true,delaySeconds:3,frequency:'session',title:'Website Launching Offer!',message:'Buy any combo from our website & get',highlight:'1 FREE 6×4” Frame!',buttonText:'Shop Combos Now',target:'#combo-offers'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cfg=window.JOEL_SUPABASE_CONFIG||{};
 const isMobile=()=>window.matchMedia('(max-width: 640px)').matches;
 const key='joel-launch-offer-seen';
 function alreadySeen(frequency){try{return frequency==='session'?sessionStorage.getItem(key)==='1':frequency==='once'?localStorage.getItem(key)==='1':false;}catch(_){return false;}}
 function markSeen(frequency){try{if(frequency==='session')sessionStorage.setItem(key,'1');if(frequency==='once')localStorage.setItem(key,'1');}catch(_){}}
 function close(root){root.classList.remove('is-open');document.body.classList.remove('launch-offer-open');}
 function render(settings){
  const mobile=isMobile();
  if(!settings.enabled || (mobile&&!settings.mobileEnabled) || (!mobile&&!settings.desktopEnabled) || alreadySeen(settings.frequency))return;
  const root=document.createElement('div');root.className='launch-offer-overlay';root.id='launchOfferPopup';root.setAttribute('aria-hidden','true');
  root.innerHTML=`<div class="launch-offer-backdrop" data-offer-close></div><section class="launch-offer-card" role="dialog" aria-modal="true" aria-labelledby="launchOfferTitle"><button class="launch-offer-close" type="button" aria-label="Close offer" data-offer-close>×</button><div class="launch-offer-ribbon" aria-hidden="true">✦ A little gift for your memories ✦</div><div class="launch-offer-brand">Joel <small>Frame Work’s</small></div><div class="launch-offer-main"><div class="launch-offer-copy"><span class="launch-offer-kicker">LIMITED TIME SPECIAL</span><h2 id="launchOfferTitle">${esc(settings.title||defaults.title)}</h2><div class="launch-offer-redline">SPECIAL GIFT FOR YOU</div></div><div class="launch-offer-photo"><img src="assets/cover-12x10.png" alt="A personalised photo frame gift" loading="eager"><span>FREE<br><b>6×4”</b><br>FRAME</span></div></div><p class="launch-offer-message">${esc(settings.message||defaults.message)} <strong>${esc(settings.highlight||defaults.highlight)}</strong></p><a class="launch-offer-cta" href="${esc(settings.target||defaults.target)}">${esc(settings.buttonText||defaults.buttonText)} <span>→</span></a><p class="launch-offer-foot">Because every frame tells a story ♡</p></section>`;
  document.body.appendChild(root);
  const dismiss=()=>{close(root);markSeen(settings.frequency);};
  root.querySelectorAll('[data-offer-close]').forEach(el=>el.addEventListener('click',dismiss));
  root.querySelector('.launch-offer-cta').addEventListener('click',e=>{const href=settings.target||defaults.target;if(href.startsWith('#')){const target=document.querySelector(href);if(target){e.preventDefault();dismiss();target.scrollIntoView({behavior:'smooth',block:'start'});}}});
  document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'&&root.isConnected){dismiss();document.removeEventListener('keydown',onKey);}});
  window.setTimeout(()=>{root.classList.add('is-open');root.setAttribute('aria-hidden','false');document.body.classList.add('launch-offer-open');root.querySelector('.launch-offer-close').focus();},Math.max(0,Number(settings.delaySeconds??defaults.delaySeconds))*1000);
 }
 async function init(){
  let settings=defaults;
  try{
   if(window.supabase&&cfg.url&&cfg.anonKey){const client=window.supabase.createClient(cfg.url,cfg.anonKey);const {data}=await client.from('site_content').select('content').eq('key','launch_offer').maybeSingle();if(data?.content&&typeof data.content==='object')settings={...defaults,...data.content};}
  }catch(err){console.warn('Launch offer settings unavailable; using defaults.',err);}
  if(settings.enabled&&(settings.desktopEnabled||settings.mobileEnabled))render(settings);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();