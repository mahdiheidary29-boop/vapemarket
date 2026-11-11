/* VapePad Market — storefront application */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const SUPABASE_URL = "https://fgpxwxrlkowauouwmhqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SzsHEG24RmsWFWJXZyMICA_LmY-HcNE";
const ADMIN_USER_ID = "55422178-aed3-4eb7-9b0f-9301304125c3";
const SUPPORT_PHONE = "09223149682";
const INSTAGRAM = "vapepad_market";
const money = n => `${Number(n || 0).toLocaleString("en-US")} تومان`;
const parseMoney = v => Number(String(v ?? "").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^0-9.-]/g,""));
const digitsOnly = v => String(v||"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g,"");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sb = null, products = [], cart = [], activeFilter = "همه", authMode = "login", isAdmin = false;

function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}
function status(el, message, type = "") { el.textContent = message; el.className = `inline-status ${type}`; }
function getSession() { return sb.auth.getSession(); }
function phoneToInternalEmail(phone) { return `phone-${phone.replace(/\D/g, "")}@users.vapemarket.invalid`; }
function normalizePhone(v) { return String(v || "").replace(/[\s()-]/g, ""); }

if (window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
else console.error("Supabase JS library failed to load.");

function rowToProduct(row) {
  const stock = Number(row.stock ?? 0), discount = Math.min(100, Math.max(0, Number(row.discount_percent ?? 0)));
  return {...row, id: row.id, price: Number(row.price), stock, discount_percent: discount,
    finalPrice: Math.round(Number(row.price) * (100 - discount) / 100)};
}
async function loadProducts(showError = false) {
  if (!sb) return;
  try {
    const {data,error} = await sb.from("vm_products")
      .select("id,name,category,price,description,bg,stock,discount_percent,image_url")
      .order("id",{ascending:false});
    if (error) throw error;
    products = (data || []).map(rowToProduct);
    renderProducts(); renderAdminProducts();
  } catch (e) {
    console.error(e); $("#productGrid").innerHTML = '<div class="empty-state">دریافت محصولات ممکن نشد. اتصال و مجوزهای جدول vm_products را بررسی کنید.</div>';
    if (showError) toast("بارگذاری محصولات ناموفق بود.");
  }
}
function renderProducts() {
  const shown = products.filter(p => activeFilter === "همه" || p.category === activeFilter);
  const grid = $("#productGrid");
  if (!shown.length) { grid.innerHTML = '<div class="empty-state">در این دسته محصولی ثبت نشده است.</div>'; return; }
  grid.innerHTML = shown.map(p => {
    const out = p.stock <= 0;
    return `<article class="product-card">
      ${p.discount_percent > 0 ? `<span class="discount-badge">${p.discount_percent.toLocaleString("fa-IR")}٪ تخفیف</span>` : ""}
      <div class="product-art">${p.image_url ? `<img class="product-photo-neon" src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="product-symbol"></div>`}</div>
      <div class="product-info"><span class="product-category">${esc(p.category || "محصول")}</span>
        <h3 title="${esc(p.name)}">${esc(p.name)}</h3><p>${esc(p.description || "برای مشاهده جزئیات بیشتر با پشتیبانی تماس بگیرید.")}</p>
        <span class="stock-badge ${out ? "out" : ""}">${out ? "● اتمام موجودی" : `● موجودی: ${p.stock.toLocaleString("fa-IR")} عدد`}</span>
        <div class="product-price-row"><div>${p.discount_percent ? `<span class="price-old">${money(p.price)}</span>` : ""}<span class="price-current">${money(p.finalPrice)}</span></div>
        <button class="add-btn" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "ناموجود" : "افزودن +"}</button></div>
      </div></article>`;
  }).join("");
}
function saveCart() { try { sessionStorage.setItem("vapepad_cart", JSON.stringify(cart)); } catch {} }
function loadCart() { try { cart = JSON.parse(sessionStorage.getItem("vapepad_cart") || "[]"); if (!Array.isArray(cart)) cart=[]; } catch { cart=[]; } }
function cartTotal() { return cart.reduce((sum, item) => sum + Number(item.finalPrice) * Number(item.qty), 0); }
function renderCart() {
  $("#cartCount").textContent = cart.reduce((n,x)=>n+x.qty,0).toLocaleString("fa-IR");
  $("#cartItems").innerHTML = cart.length ? cart.map(x=>`<div class="cart-line"><span>${esc(x.name)}<br><small>${x.qty.toLocaleString("fa-IR")} × ${money(x.finalPrice)}</small></span><span><b>${money(x.finalPrice*x.qty)}</b><br><button class="remove-item" data-remove="${esc(x.id)}">حذف</button></span></div>`).join("") : '<div class="empty-state">سبد خرید خالی است.</div>';
  $("#cartTotal").textContent = money(cartTotal()); saveCart();
}
function openCart() { $("#cartDrawer").classList.add("open"); $("#drawerBackdrop").classList.add("show"); }
function closeCart() { $("#cartDrawer").classList.remove("open"); $("#drawerBackdrop").classList.remove("show"); }
function closeModal(id) { $(id).classList.remove("show"); }
async function currentUser() { if (!sb) return null; const {data,error}=await getSession(); if(error) throw error; return data.session?.user || null; }
async function checkAdmin() {
  try { const user=await currentUser(); isAdmin=!!user && user.id===ADMIN_USER_ID; }
  catch(e) { console.error(e); isAdmin=false; }
  $("#adminOpen").hidden = !isAdmin;
  return isAdmin;
}
async function openAdmin() {
  if (!await checkAdmin()) { toast("برای دسترسی مدیریت، با حساب مدیر وارد شوید."); openAuth(); return; }
  $("#adminModal").classList.add("show"); renderAdminProducts(); loadTickets();
}
async function confirmAdmin() {
  const user=await currentUser();
  if (!user || user.id !== ADMIN_USER_ID) { toast("دسترسی مدیر تأیید نشد."); $("#adminModal").classList.remove("show"); return false; }
  return true;
}
function resetProductForm() { $("#productForm").reset(); $("#pId").value=""; $("#pStock").value="0"; $("#pDiscount").value="0"; $("#pImagePreview").hidden=true; $("#pImagePreview").src=""; $("#productSave").textContent="ذخیره محصول"; }
function renderAdminProducts() {
  const host=$("#adminProducts"); if(!host) return;
  host.innerHTML = products.length ? products.map(p=>`<div class="admin-row">
    <strong>${esc(p.name)}</strong><small>${money(p.finalPrice)} · موجودی ${p.stock} · تخفیف ${p.discount_percent}٪</small>
    <button class="admin-edit" data-edit="${esc(p.id)}">ویرایش</button><button class="admin-delete" data-delete="${esc(p.id)}">حذف</button>
  </div>`).join("") : '<div class="empty-state">محصولی ثبت نشده است.</div>';
}
function editProduct(id) {
  const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
  $("#pId").value=p.id; $("#pName").value=p.name; $("#pCategory").value=p.category || "دستگاه ویپ";
  $("#pPrice").value=Number(p.price).toLocaleString("en-US"); $("#pStock").value=p.stock; $("#pDiscount").value=p.discount_percent; $("#pDesc").value=p.description || "";
  if(p.image_url){$("#pImagePreview").src=p.image_url;$("#pImagePreview").hidden=false;} $("#productSave").textContent="ذخیره تغییرات"; $("#adminModal").querySelector(".admin-panel").scrollTo({top:0,behavior:"smooth"});
}
function setAuthMode(mode) {
  authMode=mode; $("#authTitle").textContent=mode==="signup"?"ساخت حساب کاربری":"ورود به حساب";
  $("#authSubmit").textContent=mode==="signup"?"ثبت‌نام":"ورود";
  $("#authLoginTab").classList.toggle("active",mode==="login"); $("#authSignupTab").classList.toggle("active",mode==="signup");
  $("#authPassword").autocomplete=mode==="signup"?"new-password":"current-password"; status($("#authStatus"),"");
}
async function refreshAuthUI() {
  if(!sb)return;
  const user=await currentUser(); $("#authForm").hidden=!!user; $("#authSignedIn").hidden=!user;
  if(user) $("#authUserLabel").textContent="وارد شده‌اید: "+(user.user_metadata?.phone_number || user.email || "حساب کاربری");
  await checkAdmin();
}
function openAuth() { $("#authModal").classList.add("show"); refreshAuthUI().catch(console.error); }
async function submitTicket(event) {
  event.preventDefault();
  const box=$("#ticketStatus"); const user=await currentUser();
  if(!user) { status(box,"برای ثبت تیکت ابتدا وارد حساب کاربری شوید.","error"); openAuth(); return; }
  const subject=$("#ticketSubject").value.trim(), message=$("#ticketMessage").value.trim();
  if(!subject || !message)return;
  const btn=$("#ticketForm button[type=submit]"); btn.disabled=true;
  try {
    const {error}=await sb.from("support_tickets").insert({user_id:user.id,subject,message,status:"open"});
    if(error)throw error;
    $("#ticketForm").reset(); status(box,"تیکت شما با موفقیت ثبت شد.","success");
  } catch(e) { console.error(e); status(box,"ثبت تیکت انجام نشد. جدول و مجوزهای support_tickets را بررسی کنید.","error"); }
  finally { btn.disabled=false; }
}
async function loadTickets() {
  if(!await confirmAdmin())return;
  const host=$("#adminTickets");
  try {
    const {data,error}=await sb.from("support_tickets").select("id,user_id,subject,message,status,created_at").order("created_at",{ascending:false}).limit(100);
    if(error)throw error;
    host.innerHTML=data?.length?data.map(t=>`<article class="admin-ticket"><b>${esc(t.subject)}</b><p>${esc(t.message)}</p><small>شناسه کاربر: ${esc(t.user_id)} · ${new Date(t.created_at).toLocaleString("fa-IR")} · ${esc(t.status)}</small></article>`).join(""):'<div class="empty-state">هنوز تیکتی ثبت نشده است.</div>';
  } catch(e) { console.error(e); host.innerHTML='<div class="empty-state">دریافت تیکت‌ها ممکن نیست؛ سیاست‌های دسترسی دیتابیس را بررسی کنید.</div>'; }
}
async function startCheckout() {
  if(!cart.length){toast("سبد خرید خالی است.");return;}
  const user=await currentUser();
  if(!user){toast("برای ثبت سفارش ابتدا وارد حساب شوید.");openAuth();return;}
  $("#checkoutSummary").textContent=`${cart.length.toLocaleString("fa-IR")} قلم کالا · جمع محصولات: ${money(cartTotal())} · هزینه ارسال با مشتری است.`;
  closeCart(); $("#checkoutModal").classList.add("show");
}
async function submitOrder(event) {
  event.preventDefault();
  if(!await currentUser()){toast("ابتدا وارد حساب کاربری شوید.");openAuth();return;}
  const btn=$("#submitOrder"), box=$("#checkoutStatus"); btn.disabled=true; status(box,"در حال ثبت سفارش…");
  const phone=digitsOnly($("#customerPhone").value);
  if(!/^09\d{9}$/.test(phone)){status(box,"شماره تماس معتبر ۱۱ رقمی وارد کنید؛ مثال: 09123456789","error");btn.disabled=false;return;}
  const delivery_method=$('input[name="deliveryMethod"]:checked').value;
  const device_check=$('input[name="deviceCheck"]:checked').value;
  const payload={
    items:cart.map(x=>({product_id:String(x.id),quantity:Number(x.qty)})),
    customer:{name:$("#customerName").value.trim(),phone,address:$("#customerAddress").value.trim()},
    delivery_method, device_check, shipping_cost_payer:"customer"
  };
  try {
    const {data,error}=await sb.functions.invoke("create-order",{body:payload});
    if(error)throw error;
    if(!data?.order_id || data.status!=="pending")throw new Error("پاسخ معتبر از سرویس ثبت سفارش دریافت نشد.");
    status(box,`سفارش ${data.order_id} ثبت شد. مبلغ: ${money(data.amount_toman)}. وضعیت پرداخت: در انتظار پرداخت.`,"success");
    cart=[];renderCart();$("#checkoutForm").reset();
    // Keep the order confirmation visible. Payment redirect can be added by the gateway function response.
    if(data.payment_url) window.location.href=data.payment_url;
  } catch(e) { console.error(e); status(box,e.message || "ثبت سفارش ناموفق بود. تنظیمات Edge Function را بررسی کنید.","error"); }
  finally { btn.disabled=false; }
}

async function trackOrder(event){
  event.preventDefault();const box=$("#trackOrderResult"),btn=$("#trackOrderBtn");
  const orderId=$("#trackOrderId").value.trim(),phone=digitsOnly($("#trackOrderPhone").value);
  if(!orderId||!/^09\d{9}$/.test(phone)){status(box,"شناسه سفارش و شماره موبایل معتبر (۱۱ رقم) را وارد کنید.","error");return;}
  btn.disabled=true;status(box,"در حال بررسی سفارش…");
  try{const {data,error}=await sb.rpc("track_order_by_phone",{p_order_id:orderId,p_phone:phone});if(error)throw error;
    const order=Array.isArray(data)?data[0]:data;if(!order){status(box,"سفارشی با این شناسه و شماره تماس پیدا نشد.","error");return;}
    const labels={pending:"در انتظار پرداخت",paid:"پرداخت‌شده",processing:"در حال آماده‌سازی",shipped:"ارسال‌شده",delivered:"تحویل‌شده",cancelled:"لغوشده",failed:"ناموفق"};
    status(box,`وضعیت: ${labels[order.status]||order.status||"در حال بررسی"} · مبلغ: ${money(order.amount_toman)} · تاریخ ثبت: ${order.created_at?new Date(order.created_at).toLocaleString("fa-IR"):"—"}`,"success");
  }catch(err){console.error(err);status(box,"پیگیری سفارش در حال حاضر انجام نشد. اسکریپت SQL پیگیری سفارش را در Supabase اجرا کنید.","error");}
  finally{btn.disabled=false;}
}
async function loadSalesStats(){
  if(!await confirmAdmin())return;const host=$("#adminStats"),top=$("#topProducts");host.innerHTML="<div class='empty-state'>در حال دریافت آمار…</div>";
  try{const {data,error}=await sb.from("vm_orders").select("id,status,amount_toman,created_at").order("created_at",{ascending:false}).limit(5000);if(error)throw error;
    const rows=data||[],now=new Date(),today=now.toLocaleDateString("en-CA"),month=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
    const paid=rows.filter(o=>["paid","processing","shipped","delivered","completed","success"].includes(String(o.status||"").toLowerCase()));
    const sum=arr=>arr.reduce((a,o)=>a+Number(o.amount_toman||0),0);
    const todayRows=paid.filter(o=>o.created_at&&new Date(o.created_at).toLocaleDateString("en-CA")==today),monthRows=paid.filter(o=>o.created_at&&new Date(o.created_at).toISOString().slice(0,7)===month);
    host.innerHTML=[["سفارش‌های ثبت‌شده",rows.length],["سفارش‌های پرداخت‌شده",paid.length],["فروش امروز",money(sum(todayRows))],["فروش این ماه",money(sum(monthRows))]].map(([l,v])=>`<div class="stat-card"><small>${l}</small><b>${typeof v==="number"?v.toLocaleString("fa-IR"):v}</b></div>`).join("");
    let salesByProduct={};
    // Support either JSON line items stored on vm_orders or a normalized vm_order_items table.
    rows.filter(o=>paid.some(p=>String(p.id)===String(o.id))).forEach(o=>{
      const lines=Array.isArray(o.items)?o.items:(Array.isArray(o.order_items)?o.order_items:[]);
      lines.forEach(line=>{const pid=String(line.product_id??line.id??"");if(pid)salesByProduct[pid]=(salesByProduct[pid]||0)+Number(line.quantity??line.qty??1);});
    });
    if(!Object.keys(salesByProduct).length){
      try{const {data:lines,error:linesError}=await sb.from("vm_order_items").select("product_id,quantity,order_id").limit(10000);if(!linesError){const paidIds=new Set(paid.map(o=>String(o.id)));(lines||[]).filter(x=>paidIds.has(String(x.order_id))).forEach(x=>{const pid=String(x.product_id);salesByProduct[pid]=(salesByProduct[pid]||0)+Number(x.quantity||1);});}}catch(_){}
    }
    const ranked=Object.entries(salesByProduct).sort((a,b)=>b[1]-a[1]).slice(0,8);
    top.innerHTML=ranked.length?ranked.map(([pid,qty],i)=>{const prod=products.find(p=>String(p.id)===pid);return `<div class="admin-row"><strong>${esc(prod?.name||`محصول #${pid}`)}</strong><small>فروش: ${qty.toLocaleString("fa-IR")} عدد</small><span class="rank-number">${i+1}</span></div>`;}).join(""):"<div class='empty-state'>اطلاعات اقلام سفارش در ساختار فعلی سفارش‌ها در دسترس نیست؛ اگر Edge Function اقلام را در جدول vm_order_items ذخیره نمی‌کند، باید آن بخش نیز به‌روزرسانی شود.</div>";
  }catch(e){console.error(e);host.innerHTML="<div class='empty-state'>خواندن آمار ممکن نیست؛ دسترسی مدیر به جدول vm_orders یا نام ستون‌ها را بررسی کنید.</div>";}
}

// Product cards and cart
$("#productGrid").addEventListener("click",e=>{
  const b=e.target.closest("[data-add]");if(!b)return;
  const p=products.find(x=>String(x.id)===String(b.dataset.add));if(!p||p.stock<=0)return;
  const line=cart.find(x=>String(x.id)===String(p.id));
  if(line){if(line.qty>=p.stock){toast("تعداد درخواستی بیشتر از موجودی است.");return;}line.qty++;}
  else cart.push({...p,qty:1});
  renderCart();toast("به سبد خرید اضافه شد.");
});
$("#cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(!b)return;cart=cart.filter(x=>String(x.id)!==String(b.dataset.remove));renderCart();});
$("#cartOpen").onclick=()=>{renderCart();openCart();};$("#drawerBackdrop").onclick=closeCart;$$("[data-close]").forEach(b=>b.onclick=closeCart);
$("#checkout").onclick=startCheckout;$("#checkoutForm").addEventListener("submit",submitOrder);
$("#checkoutModal").addEventListener("click",e=>{if(e.target.id==="checkoutModal"||e.target.closest("[data-modal-close]"))closeModal("#checkoutModal");});
$$("[data-auth-close]").forEach(b=>b.onclick=()=>closeModal("#authModal"));
$("#authModal").addEventListener("click",e=>{if(e.target.id==="authModal")closeModal("#authModal");});
$("#adminModal").addEventListener("click",e=>{if(e.target.id==="adminModal"||e.target.closest("[data-close]"))closeModal("#adminModal");});
$("#adminOpen").onclick=openAdmin;$("#authOpen").onclick=openAuth;
$("#authLoginTab").onclick=()=>setAuthMode("login");$("#authSignupTab").onclick=()=>setAuthMode("signup");
$("#authForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!sb){status($("#authStatus"),"اتصال Supabase برقرار نیست.","error");return;}
  const ident=normalizePhone($("#authPhone").value.trim()),password=$("#authPassword").value;let email;
  if(authMode==="login" && ident.includes("@")) email=ident.toLowerCase();
  else {
    const digits=ident.replace(/\D/g,"");
    if(!/^\+?[1-9]\d{7,14}$/.test(digits)){status($("#authStatus"),"شماره تلفن معتبر را با کد کشور وارد کنید؛ مثال: +989121234567","error");return;}
    email=phoneToInternalEmail(ident);
  }
  if(password.length<6){status($("#authStatus"),"رمز عبور باید حداقل ۶ کاراکتر باشد.","error");return;}
  const btn=$("#authSubmit");btn.disabled=true;status($("#authStatus"),"در حال بررسی…");
  try{
    const result=authMode==="signup"
      ? await sb.auth.signUp({email,password,options:{data:{phone_number:ident}}})
      : await sb.auth.signInWithPassword({email,password});
    if(result.error)throw result.error;
    if(authMode==="signup"&&!result.data.session)status($("#authStatus"),"حساب ساخته شد؛ برای ورود بدون پیامک باید تأیید ایمیل در Supabase خاموش باشد.","error");
    else {status($("#authStatus"),"ورود با موفقیت انجام شد.","success");await refreshAuthUI();toast("خوش آمدید.");}
  }catch(e){status($("#authStatus"),e.message||"ورود ناموفق بود.","error");}
  finally{btn.disabled=false;}
});
$("#authSignOut").onclick=async()=>{const {error}=await sb.auth.signOut();if(error)status($("#authStatus"),error.message,"error");else{status($("#authStatus"),"از حساب خارج شدید.","success");await refreshAuthUI();}};
$("#ticketForm").addEventListener("submit",submitTicket);$("#trackOrderForm").addEventListener("submit",trackOrder);
$("#productForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!await confirmAdmin())return;
  const id=$("#pId").value, discount=Number($("#pDiscount").value),stock=Number($("#pStock").value),price=parseMoney($("#pPrice").value);
  if(!Number.isInteger(stock)||stock<0||!Number.isFinite(price)||price<0||!Number.isFinite(discount)||discount<0||discount>100){toast("موجودی، قیمت یا درصد تخفیف معتبر نیست.");return;}
  let image_url=products.find(x=>String(x.id)===String(id))?.image_url || null;
  const imageFile=$("#pImageFile").files?.[0];
  if(imageFile){
    if(!imageFile.type.startsWith("image/") || imageFile.size>5*1024*1024){toast("تصویر باید حداکثر ۵ مگابایت باشد.");return;}
    const safeName=`${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    const {data:upload,error:uploadError}=await sb.storage.from("product-images").upload(safeName,imageFile,{upsert:true,contentType:imageFile.type});
    if(uploadError){console.error(uploadError);toast("آپلود تصویر ناموفق بود؛ بخش SQL و Storage را اجرا کنید.");return;}
    image_url=sb.storage.from("product-images").getPublicUrl(upload.path).data.publicUrl;
  }
  const row={name:$("#pName").value.trim(),category:$("#pCategory").value,price,description:$("#pDesc").value.trim(),stock,discount_percent:discount,bg:"#28213e",image_url};
  try{
    const result=id?await sb.from("vm_products").update(row).eq("id",id):await sb.from("vm_products").insert(row);
    if(result.error)throw result.error;
    toast(id?"محصول بروزرسانی شد.":"محصول اضافه شد.");resetProductForm();await loadProducts(true);
  }catch(err){console.error(err);toast("ذخیره نشد؛ ستون‌های stock و discount_percent و مجوز مدیر را بررسی کنید.");}
});
$("#pPrice").addEventListener("input",e=>{const n=parseMoney(e.target.value);if(Number.isFinite(n)&&e.target.value.trim()) {const pos=e.target.selectionStart;e.target.value=n.toLocaleString("en-US");try{e.target.setSelectionRange(e.target.value.length,e.target.value.length);}catch{}}});
$("#pImageFile").addEventListener("change",e=>{const f=e.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);$("#pImagePreview").src=url;$("#pImagePreview").hidden=false;});
$("#adminProducts").addEventListener("click",async e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit){editProduct(edit.dataset.edit);return;}
  if(del){if(!confirm("این محصول حذف شود؟"))return;if(!await confirmAdmin())return;
    const {error}=await sb.from("vm_products").delete().eq("id",del.dataset.delete);
    if(error){console.error(error);toast("حذف محصول ناموفق بود.");return;}await loadProducts(true);toast("محصول حذف شد.");}
});
$("#productCancel").onclick=resetProductForm;$("#refreshProducts").onclick=()=>loadProducts(true);$("#refreshTickets").onclick=loadTickets;$("#refreshStats").onclick=loadSalesStats;
$$("[data-admin-tab]").forEach(b=>b.onclick=()=>{
  $$("[data-admin-tab]").forEach(x=>x.classList.toggle("active",x===b));
  $("#adminProductsView").hidden=b.dataset.adminTab!=="products";$("#adminTicketsView").hidden=b.dataset.adminTab!=="tickets";$("#adminOrdersView").hidden=b.dataset.adminTab!=="orders";
  if(b.dataset.adminTab==="tickets")loadTickets(); if(b.dataset.adminTab==="orders")loadSalesStats();
});
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{
  activeFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===activeFilter));
  renderProducts();$("#products").scrollIntoView({behavior:"smooth"});
}));
$("#mobileMenu").onclick=()=>document.querySelector("#categories").scrollIntoView({behavior:"smooth"});
const ageGate=$("#ageGate");
$("#ageYes").onclick=()=>{try{sessionStorage.setItem("vapepad_age_confirmed","1");}catch{}ageGate.remove();};
$("#ageNo").onclick=()=>{document.body.innerHTML='<main style="padding:15vh 8vw;text-align:center;font-family:Vazirmatn">دسترسی امکان‌پذیر نیست.</main>';};
try{if(sessionStorage.getItem("vapepad_age_confirmed"))ageGate.remove();}catch{}
loadCart();renderCart();loadProducts(true);
if(sb)sb.auth.onAuthStateChange(()=>{refreshAuthUI().catch(console.error);});
refreshAuthUI().catch(console.error);
