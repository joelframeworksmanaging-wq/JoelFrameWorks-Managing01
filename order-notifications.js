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
    const record={
      order_id:order.orderId,
      order_type:order.orderType,
      customer_name:order.customer.name,
      customer_phone:order.customer.phone,
      customer_address:order.customer.address,
      total_price:order.totalPrice,
      order_details:order.details,
      image_links:order.imageLinks
    };
    // The order ID is created before the address step. Reuse that row on retries
    // instead of inserting a second row with the same unique order_id.
    const result=await db.from('customer_orders').upsert(
      {...record,status:'payment_pending',payment_status:'pending'},
      {onConflict:'order_id',ignoreDuplicates:false}
    );
    if(result.error)throw new Error('Order database save failed: '+result.error.message);
  }
  window.JoelOrderNotifications={uploadOrderFiles,saveOrder};
})();