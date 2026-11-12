(function(){
const $=s=>document.querySelector(s),key='joelFrameCheckoutDraft',money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
let d;try{d=JSON.parse(sessionStorage.getItem(key)||'null')}catch(e){}
const status=$('#addressStatus'),btn=$('#saveAddressButton'),stateSelect=$('#customerState'),citySelect=$('#customerCity'),deliveryFields=$('#deliveryFields'),pickupNote=$('#pickupNote'),emailFieldGroup=$('#emailFieldGroup');
if(!d||!d.orderId){status.hidden=false;status.textContent='Checkout session expired. Please select your product again.';btn.disabled=true;return;}
$('#addressItemName').textContent=d.itemName||'Your frame order';$('#addressItemDescription').textContent=d.description||'';$('#addressOrderId').textContent='Order ID: '+d.orderId;$('#addressThumb').setAttribute('aria-label',d.orderType==='combo'?'Combo order':'Frame order');$('#addressSubtotal').textContent=money(d.amount);$('#addressTotal').textContent=money(d.amount);
const cities={
'Andhra Pradesh':['Amaravati','Anantapur','Chittoor','Guntur','Kadapa','Kakinada','Kurnool','Nellore','Rajahmundry','Tirupati','Vijayawada','Visakhapatnam'],
'Arunachal Pradesh':['Itanagar','Naharlagun','Pasighat','Tawang'],
'Assam':['Dibrugarh','Guwahati','Jorhat','Silchar','Tezpur'],
'Bihar':['Bhagalpur','Gaya','Muzaffarpur','Patna','Purnia'],
'Chhattisgarh':['Bhilai','Bilaspur','Durg','Raipur'],
'Goa':['Margao','Panaji','Vasco da Gama'],
'Gujarat':['Ahmedabad','Anand','Bhavnagar','Gandhinagar','Jamnagar','Rajkot','Surat','Vadodara'],
'Haryana':['Ambala','Faridabad','Gurugram','Hisar','Karnal','Panipat','Rohtak'],
'Himachal Pradesh':['Dharamshala','Kullu','Mandi','Shimla','Solan'],
'Jharkhand':['Bokaro','Dhanbad','Jamshedpur','Ranchi'],
'Karnataka':['Belagavi','Bengaluru','Hubballi','Mangaluru','Mysuru','Shivamogga','Tumakuru','Udupi'],
'Kerala':['Alappuzha','Ernakulam','Kannur','Kochi','Kollam','Kottayam','Kozhikode','Palakkad','Thiruvananthapuram','Thrissur'],
'Madhya Pradesh':['Bhopal','Gwalior','Indore','Jabalpur','Ujjain'],
'Maharashtra':['Aurangabad','Kolhapur','Mumbai','Nagpur','Nashik','Navi Mumbai','Pune','Solapur','Thane'],
'Manipur':['Imphal'],
'Meghalaya':['Shillong'],
'Mizoram':['Aizawl'],
'Nagaland':['Dimapur','Kohima'],
'Odisha':['Bhubaneswar','Cuttack','Puri','Rourkela','Sambalpur'],
'Punjab':['Amritsar','Jalandhar','Ludhiana','Mohali','Patiala'],
'Rajasthan':['Ajmer','Bikaner','Jaipur','Jodhpur','Kota','Udaipur'],
'Sikkim':['Gangtok'],
'Tamil Nadu':['Chennai','Coimbatore','Cuddalore','Dindigul','Erode','Hosur','Kanchipuram','Karur','Madurai','Nagercoil','Salem','Thanjavur','Tiruchirappalli','Tirunelveli','Tiruppur','Vellore'],
'Telangana':['Hyderabad','Karimnagar','Khammam','Warangal'],
'Tripura':['Agartala'],
'Uttar Pradesh':['Agra','Allahabad (Prayagraj)','Bareilly','Ghaziabad','Gorakhpur','Kanpur','Lucknow','Meerut','Noida','Varanasi'],
'Uttarakhand':['Dehradun','Haridwar','Rishikesh','Roorkee'],
'West Bengal':['Asansol','Durgapur','Howrah','Kolkata','Siliguri'],
'Andaman and Nicobar Islands':['Port Blair'],
'Chandigarh':['Chandigarh'],
'Dadra and Nagar Haveli and Daman and Diu':['Daman','Silvassa'],
'Delhi':['New Delhi'],
'Jammu and Kashmir':['Jammu','Srinagar'],
'Ladakh':['Leh'],
'Lakshadweep':['Kavaratti'],
'Puducherry':['Karaikal','Puducherry']
};
Object.keys(cities).sort().forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;stateSelect.append(o)});
function fillCities(state,selected){citySelect.innerHTML='<option value="">Select city / town</option>';(cities[state]||[]).forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;citySelect.append(o)});citySelect.disabled=!state;if(selected)citySelect.value=selected;const other=document.createElement('option');other.value='Other';other.textContent='Other city / town';citySelect.append(other)}
stateSelect.addEventListener('change',()=>fillCities(stateSelect.value));
function setFulfilment(mode){const pickup=mode==='pickup';document.querySelectorAll('[data-fulfilment]').forEach(x=>x.classList.toggle('active',x.dataset.fulfilment===mode));deliveryFields.hidden=pickup;pickupNote.hidden=!pickup;emailFieldGroup.hidden=pickup;['customerLine1','customerLine2','customerState','customerCity','customerPincode'].forEach(id=>{const el=$('#'+id);el.required=!pickup});$('#saveAddressButton').innerHTML=pickup?'CONFIRM STORE PICKUP <span>→</span>':'SAVE ADDRESS & CONTINUE <span>→</span>';}
document.querySelectorAll('[data-fulfilment]').forEach(b=>b.addEventListener('click',()=>setFulfilment(b.dataset.fulfilment)));
setFulfilment('delivery');
$('#customerPhone').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,10)});
$('#customerPincode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)});
$('#addressForm').addEventListener('submit',async e=>{e.preventDefault();const pickup=document.querySelector('[data-fulfilment].active')?.dataset.fulfilment==='pickup';const phone=$('#customerPhone').value.trim();if(!/^[6-9]\d{9}$/.test(phone)){status.hidden=false;status.className='checkout-status is-error';status.textContent='Enter a valid 10-digit Indian mobile number.';return;}if(!pickup&&!/^\d{6}$/.test($('#customerPincode').value.trim())){status.hidden=false;status.className='checkout-status is-error';status.textContent='Enter a valid 6-digit PIN code.';return;}
const customer={name:$('#customerName').value.trim(),phone,address:pickup?"Store pickup – Joel Frame Work's, MUTHOOT FINANCE LTD, 73, Kamarajar Road, Guruswamy Nagar, Anakaputhur, Tambaram, Tamil Nadu 600075":[$('#customerLine1').value.trim(),$('#customerLine2').value.trim(),$('#customerLandmark').value.trim(),$('#customerCity').value.trim(),$('#customerState').value.trim(),'PIN '+$('#customerPincode').value.trim()].filter(Boolean).join(', '),email:pickup?null:($('#customerEmail').value.trim()||null),fulfilment:pickup?'pickup':'delivery',city:pickup?'':$('#customerCity').value,state:pickup?'':$('#customerState').value,pincode:pickup?'':$('#customerPincode').value.trim()};
btn.disabled=true;btn.textContent='SAVING ADDRESS…';try{await window.JoelOrderNotifications.saveOrder({orderId:d.orderId,orderType:d.orderType,customer,totalPrice:d.amount,details:{...d.details,fulfilment:customer.fulfilment,customerEmail:customer.email},imageLinks:d.imageLinks});d.customer=customer;d.addressSaved=true;d.fulfilment=customer.fulfilment;sessionStorage.setItem(key,JSON.stringify(d));location.href='payment.html'}catch(err){status.hidden=false;status.className='checkout-status is-error';status.textContent='Could not save your order: '+err.message;btn.disabled=false;btn.textContent='SAVE ADDRESS & CONTINUE'}});
})();