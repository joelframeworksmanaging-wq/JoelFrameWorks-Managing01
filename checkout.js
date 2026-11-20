(function(){
 const $=s=>document.querySelector(s),key='joelFrameCheckoutDraft',money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
 let d;try{d=JSON.parse(sessionStorage.getItem(key)||'null')}catch(e){}
 const status=$('#checkoutStatus'),btn=$('#continueAddressButton');
 if(!d||!d.orderId){status.hidden=false;status.textContent='Checkout session expired. Please select your product again.';btn.disabled=true;return;}
 $('#checkoutItemName').textContent=d.itemName;$('#checkoutItemDescription').textContent=d.description||'';$('#checkoutOrderId').textContent='Order ID: '+d.orderId;$('#checkoutItemType').textContent=d.orderType.toUpperCase();$('#checkoutThumb').setAttribute('aria-label',d.orderType==='combo'?'Combo order':'Frame order');$('#checkoutSubtotal').textContent=money(d.amount);$('#checkoutTotal').textContent=money(d.amount);
 const freeLine=$('#checkoutFreeGiftLine');
 if(d.freeGift?.included&&freeLine){freeLine.hidden=false;$('#checkoutFreeGiftLabel').textContent='Free gift frame ('+d.freeGift.size+' inch)';}
 const list=$('#checkoutPhotoList'),giftIndex=Number(d.freeGift?.imageIndex??d.paidPhotoCount??-1);
 (d.imageLinks||[]).forEach((img,i)=>{
  const isGift=!!(d.freeGift?.included&&i===giftIndex),row=document.createElement('div');row.className='checkout-photo-row'+(isGift?' checkout-free-gift-photo':'');
  const pic=document.createElement('img');pic.src=img.url;pic.alt=isGift?'Uploaded photo for free '+d.freeGift.size+' inch gift frame':'Uploaded order photo '+(i+1);
  const label=document.createElement('span');label.textContent=isGift?'FREE GIFT FRAME · '+d.freeGift.size+' inch · ₹0':(d.orderType==='combo'?'Frame '+(i+1)+' photo':'Your uploaded photo');
  row.append(pic,label);list.append(row);
 });
 btn.onclick=()=>location.href='address.html';
})();