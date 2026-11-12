(function(){
  const $=s=>document.querySelector(s);
  const draftKey='joelFrameCheckoutDraft';
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const btn=$('#payNowButton'),msg=$('#paymentMessage');
  let draft;
  try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'null')}catch(e){}
  function showMessage(text,error=true){
    msg.hidden=false;
    msg.className='jfw-payment-message'+(error?' is-error':' is-success');
    msg.textContent=text;
  }
  if(!draft||!draft.orderId){
    showMessage('Your checkout session has expired. Return to your frame selection and try again.');
    btn.disabled=true;return;
  }
  $('#paymentCustomerName').textContent=draft.customer?.name||'Not provided';
  $('#paymentCustomerPhone').textContent=draft.customer?.phone?'+91 '+draft.customer.phone:'Not provided';
  $('#paymentCustomerAddress').textContent=draft.customer?.address||'Store pickup';
  if(draft.customer?.email){$('#paymentCustomerEmail').textContent=draft.customer.email;$('#paymentCustomerEmail').hidden=false;$('#paymentEmailLabel').hidden=false;}
  $('#paymentItemName').textContent=draft.itemName||'Your frame order';
  $('#paymentItemDescription').textContent=draft.description||'';
  $('#paymentOrderId').textContent='Order ID: '+draft.orderId;
  const productThumb=$('#paymentProductThumb');
  const firstPhoto=draft.imageLinks?.[0]?.url;
  if(firstPhoto){const photo=document.createElement('img');photo.src=firstPhoto;photo.alt='Uploaded photo for '+(draft.itemName||'your frame');photo.loading='eager';productThumb.textContent='';productThumb.append(photo);}
  else {productThumb.textContent=draft.orderType==='combo'?'COMBO':'JF';}
  $('#paymentDeliveryFee').textContent=draft.customer?.fulfilment==='pickup'?'Store pickup':'To be confirmed';
  $('#paymentSubtotal').textContent=money(draft.amount);
  $('#paymentTotal').textContent=money(draft.amount);
  const config=window.JOEL_SUPABASE_CONFIG||{};
  const ready=window.supabase&&config.url&&config.anonKey;
  if(!ready){
    showMessage('Payment setup is incomplete: the website database connection is unavailable. Please contact the store.');
    btn.disabled=true;return;
  }
  const db=window.supabase.createClient(config.url,config.anonKey);
  btn.addEventListener('click',async()=>{
    if(btn.disabled)return;
    btn.disabled=true;btn.textContent='CONNECTING TO RAZORPAY…';
    try{
      const {data:created,error:createError}=await db.functions.invoke('create-razorpay-order',{body:{orderId:draft.orderId}});
      if(createError)throw new Error(created?.error||createError.message||'Could not start the payment.');
      if(!created||!created.keyId||!created.razorpayOrderId)throw new Error(created?.error||'Razorpay did not return a valid payment order.');
      if(typeof window.Razorpay!=='function')throw new Error('Razorpay checkout did not load. Refresh the page and try again.');
      const options={
        key:created.keyId,
        amount:created.amount,
        currency:created.currency||'INR',
        name:"Joel Frame Work's",
        description:draft.itemName||'Premium photo frame order',
        order_id:created.razorpayOrderId,
        prefill:{
          name:draft.customer?.name||'',
          contact:draft.customer?.phone||'',
          email:draft.customer?.email||''
        },
        notes:{joel_order_id:draft.orderId},
        theme:{color:'#087b19'},
        modal:{ondismiss:function(){
          btn.disabled=false;btn.textContent='PAY NOW WITH RAZORPAY →';
          showMessage('Payment window closed. Your order is still saved as pending. You can try again when ready.',false);
        }},
        handler:async function(response){
          btn.textContent='VERIFYING PAYMENT…';
          showMessage('Payment received by Razorpay. Verifying it securely…',false);
          try{
            const {data:verified,error:verifyError}=await db.functions.invoke('verify-razorpay-payment',{body:{
              orderId:draft.orderId,
              razorpayPaymentId:response.razorpay_payment_id,
              razorpayOrderId:response.razorpay_order_id,
              razorpaySignature:response.razorpay_signature
            }});
            if(verifyError||!verified?.verified)throw new Error(verified?.error||verifyError?.message||'Payment verification could not be completed.');
            draft.paymentStatus='paid';
            sessionStorage.setItem(draftKey,JSON.stringify(draft));
            showMessage('Payment successful! Your order '+draft.orderId+' is confirmed.',false);
            btn.textContent='PAYMENT SUCCESSFUL ✓';
            const next=document.createElement('a');
            next.href='index.html';
            next.className='jfw-pay-now';
            next.style.display='block';
            next.style.textAlign='center';
            next.style.textDecoration='none';
            next.textContent='RETURN TO HOME';
            btn.insertAdjacentElement('afterend',next);
            btn.disabled=true;
          }catch(error){
            console.error('Payment verification failed:',error);
            showMessage('Razorpay returned the payment, but the website could not verify it yet. Do not pay again. Save your order ID '+draft.orderId+' and contact the store. Details: '+error.message);
            btn.disabled=true;btn.textContent='PAYMENT VERIFICATION PENDING';
          }
        }
      };
      const checkout=new window.Razorpay(options);
      checkout.on('payment.failed',function(response){
        const reason=response?.error?.description||'Payment was not completed.';
        showMessage(reason+' Your order remains pending. You can retry safely.');
        btn.disabled=false;btn.textContent='TRY PAYMENT AGAIN →';
      });
      checkout.open();
      btn.textContent='RAZORPAY CHECKOUT OPENED';
    }catch(error){
      console.error('Razorpay checkout setup failed:',error);
      showMessage(error.message||'Unable to start payment. Please try again.');
      btn.disabled=false;btn.textContent='TRY PAYMENT AGAIN →';
    }
  });
})();