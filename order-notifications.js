(function(){
  function client(){
    const c=window.JOEL_SUPABASE_CONFIG||{};
    if(!window.supabase||!c.url||!c.anonKey)throw new Error('Supabase is not configured.');
    return window.supabase.createClient(c.url,c.anonKey);
  }
  async function uploadOrderFiles(args){
    const c=window.JOEL_SUPABASE_CONFIG||{},db=client(),bucket=c.bucket||'joel-site-media',result=[];
    for(let i=0;i<(args.files||[]).length;i++){
      const file=args.files[i],safe=String(file.name||('image-'+(i+1)+'.png')).replace(/[^a-zA-Z0-9._-]/g,'-');
      const path='orders/'+args.orderId+'/'+String(i+1).padStart(2,'0')+'-'+safe;
      const uploaded=await db.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type||'application/octet-stream',cacheControl:'3600'});
      if(uploaded.error)throw new Error('Image upload failed: '+uploaded.error.message);
      result.push({name:file.name,url:db.storage.from(bucket).getPublicUrl(path).data.publicUrl,path});
    }
    return result;
  }
  async function saveOrder(order){
    const db=client();
    const {data,error}=await db.functions.invoke('save-customer-order',{body:{
      orderId:order.orderId,
      orderType:order.orderType,
      customer:order.customer,
      totalPrice:order.totalPrice,
      details:order.details,
      imageLinks:order.imageLinks
    }});
    if(error){
      let message=error.message||'Order database save failed.';
      try{const body=await error.context?.json?.();if(body?.error)message=body.error}catch(_){}
      throw new Error(message);
    }
    if(!data?.saved)throw new Error(data?.error||'The order could not be saved.');
    return data;
  }
  window.JoelOrderNotifications={uploadOrderFiles,saveOrder};
})();