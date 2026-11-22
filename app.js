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
let sb = null, products = [], variants = [], cart = [], activeFilter = "همه", authMode = "login", isAdmin = false;

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
    const vr = await sb.from("vm_product_variants").select("id,product_id,label,variant_type,stock,price_override,is_active").eq("is_active",true).order("id");
    if (vr.error) throw vr.error;
    variants = vr.data || [];
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
    const pv = variants.filter(v => String(v.product_id) === String(p.id));
    const out = pv.length ? pv.every(v => Number(v.stock) <= 0) : p.stock <= 0;
    return `<article class="product-card product-card-clickable" data-product="${esc(p.id)}" role="button" tabindex="0" aria-label="مشاهده جزئیات ${esc(p.name)}">
      ${p.discount_percent > 0 ? `<span class="discount-badge">${p.discount_percent.toLocaleString("fa-IR")}٪ تخفیف</span>` : ""}
      <div class="product-art">${p.image_url ? `<img class="product-photo" src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="product-symbol"></div>`}</div>
      <div class="product-info"><span class="product-category">${esc(p.category || "محصول")}</span>
        <h3 title="${esc(p.name)}">${esc(p.name)}</h3>
        <p>${esc(p.description || "برای مشاهده جزئیات محصول کلیک کنید.")}</p>
        <span class="stock-badge ${out ? "out" : ""}">${out ? "● اتمام موجودی" : "● موجود"}</span>
        <div class="product-price-row"><div>${p.discount_percent ? `<span class="price-old">${money(p.price)}</span>` : ""}<span class="price-current">${money(p.finalPrice)}</span></div>
        <button class="add-btn" type="button" data-product-open="${esc(p.id)}">مشاهده جزئیات</button></div>
      </div></article>`;
  }).join("");
}
function openProductDetails(productId) {
  const p = products.find(x => String(x.id) === String(productId));
  if (!p) return;
  const pv = variants.filter(v => String(v.product_id) === String(p.id));
  const out = pv.length ? pv.every(v => Number(v.stock) <= 0) : Number(p.stock) <= 0;
  $("#productDetailsContent").innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-image">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}">` : `<div class="product-symbol"></div>`}</div>
      <div class="product-detail-info">
        <span class="product-category">${esc(p.category || "محصول")}</span>
        <h2>${esc(p.name)}</h2>
        <div class="product-detail-price">${p.discount_percent ? `<span class="price-old">${money(p.price)}</span>` : ""}<strong>${money(p.finalPrice)}</strong>${p.discount_percent ? `<span class="discount-badge-inline">${Number(p.discount_percent).toLocaleString("fa-IR")}٪ تخفیف</span>` : ""}</div>
        <p class="product-detail-description">${esc(p.description || "توضیحی برای این محصول ثبت نشده است.")}</p>
        <div class="product-detail-stock ${out ? "out" : ""}">${out ? "اتمام موجودی" : "موجود در انبار"}</div>
        ${pv.length ? `<label class="detail-variant-label">انتخاب ${pv[0].variant_type === "flavor" ? "طعم" : pv[0].variant_type === "color" ? "رنگ" : "مدل"}
          <select id="detailVariantSelect"><option value="">یک گزینه انتخاب کنید</option>${pv.map(v=>`<option value="${esc(v.id)}" ${Number(v.stock)<=0?"disabled":""}>${esc(v.label)}${Number(v.stock)<=0?" — ناموجود":` — موجودی ${Number(v.stock).toLocaleString("fa-IR")}`}</option>`).join("")}</select>
        </label>` : `<div class="product-detail-stock-count">موجودی: ${Number(p.stock).toLocaleString("fa-IR")} عدد</div>`}
        <div class="product-detail-actions">
          <label class="detail-quantity-label">تعداد<input id="detailQuantity" type="number" min="1" value="1" step="1"></label>
          <button class="btn btn-primary" type="button" id="detailAddToCart" ${out ? "disabled" : ""}>افزودن به سبد خرید</button>
        </div>
        <div class="product-detail-hint">${pv.length ? "ابتدا طعم، رنگ یا مدل دلخواه را انتخاب کنید." : "برای افزودن محصول به سبد خرید، تعداد را مشخص کنید."}</div>
      </div>
    </div>`;
  $("#productDetailsModal").classList.add("show");
  $("#detailAddToCart").addEventListener("click", () => {
    const selectedId = $("#detailVariantSelect")?.value || "";
    const quantity = Number($("#detailQuantity").value);
    if (pv.length && !selectedId) { toast("ابتدا طعم، رنگ یا مدل را انتخاب کنید."); return; }
    if (!Number.isInteger(quantity) || quantity < 1) { toast("تعداد معتبر وارد کنید."); return; }
    const selectedVariant = pv.find(v => String(v.id) === String(selectedId)) || null;
    const available = selectedVariant ? Number(selectedVariant.stock) : Number(p.stock);
    if (quantity > available) { toast("تعداد درخواستی بیشتر از موجودی است."); return; }
    const cartKey = `${p.id}:${selectedVariant?.id || "base"}`;
    const line = cart.find(x => x.cartKey === cartKey);
    if (line) {
      if (line.qty + quantity > available) { toast("تعداد درخواستی بیشتر از موجودی است."); return; }
      line.qty += quantity;
    } else {
      cart.push({...p, variant_id:selectedVariant?.id || null, variant_label:selectedVariant?.label || "", cartKey, qty:quantity});
    }
    renderCart(); closeModal("#productDetailsModal"); toast("به سبد خرید اضافه شد.");
  });
}

function saveCart() { try { sessionStorage.setItem("vapepad_cart", JSON.stringify(cart)); } catch {} }
function loadCart() { try { cart = JSON.parse(sessionStorage.getItem("vapepad_cart") || "[]"); if (!Array.isArray(cart)) cart=[]; } catch { cart=[]; } }
function cartTotal() { return cart.reduce((sum, item) => sum + Number(item.finalPrice) * Number(item.qty), 0); }
function renderCart() {
  $("#cartCount").textContent = cart.reduce((n,x)=>n+x.qty,0).toLocaleString("fa-IR");
  $("#cartItems").innerHTML = cart.length ? cart.map(x=>`<div class="cart-line"><span>${esc(x.name)}${x.variant_label?`<br><small>انتخاب: ${esc(x.variant_label)}</small>`:""}<br><small>${x.qty.toLocaleString("fa-IR")} × ${money(x.finalPrice)}</small></span><span><b>${money(x.finalPrice*x.qty)}</b><br><button class="remove-item" data-remove="${esc(x.cartKey)}">حذف</button></span></div>`).join("") : '<div class="empty-state">سبد خرید خالی است.</div>';
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
function renderVariantManager(){
  const select=$("#variantProductSelect"),host=$("#variantManagerList");
  if(!select||!host)return;
  const previous=select.value;
  select.innerHTML=products.length
    ? `<option value="">انتخاب محصول</option>${products.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}`
    : '<option value="">ابتدا محصولی ثبت کنید</option>';
  if(products.some(p=>String(p.id)===String(previous)))select.value=previous;
  else if(products.length)select.value=String(products[0].id);
  const pid=select.value;
  const rows=variants.filter(v=>String(v.product_id)===String(pid)&&v.variant_type==="flavor");
  host.innerHTML=pid
    ? (rows.length?rows.map(v=>`<div class="variant-manager-row"><span><b>${esc(v.label)}</b><small>موجودی: ${Number(v.stock).toLocaleString("fa-IR")} عدد</small></span><button type="button" class="admin-edit" data-variant-edit="${esc(v.id)}">ویرایش موجودی / نام</button><button type="button" class="admin-delete" data-variant-delete="${esc(v.id)}">حذف</button></div>`).join(""):'<div class="empty-state">برای این محصول هنوز طعمی ثبت نشده است.</div>')
    : '<div class="empty-state">ابتدا یک محصول ثبت کن.</div>';
}
function renderAdminProducts() {
  const host=$("#adminProducts"); if(!host) return;
  host.innerHTML = products.length ? products.map(p=>`<div class="admin-row admin-product-row">
    <strong>${esc(p.name)}</strong><small>${money(p.finalPrice)} · موجودی پایه ${p.stock} · تخفیف ${p.discount_percent}٪</small>
    <button class="admin-edit" data-edit="${esc(p.id)}">ویرایش</button><button class="admin-edit" data-add-flavor="${esc(p.id)}">＋ افزودن طعم</button><button class="admin-edit" data-variants="${esc(p.id)}">تنوع‌ها / موجودی</button><button class="admin-delete" data-delete="${esc(p.id)}">حذف</button>
    ${(variants.filter(v=>String(v.product_id)===String(p.id)).map(v=>`<div class="variant-admin-line"><span>${esc(v.label)} · ${Number(v.stock).toLocaleString("fa-IR")} عدد</span><button class="admin-edit" data-variant-edit="${esc(v.id)}">ویرایش</button><button class="admin-delete" data-variant-delete="${esc(v.id)}">حذف</button></div>`).join(""))}
  </div>`).join("") : '<div class="empty-state">محصولی ثبت نشده است.</div>';
  renderVariantManager();
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
    items:cart.map(x=>({product_id:String(x.id),variant_id:x.variant_id ? Number(x.variant_id) : null,quantity:Number(x.qty)})),
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

async function addFlavor(productId){
  if(!await confirmAdmin())return;
  const p=products.find(x=>String(x.id)===String(productId));if(!p)return;
  const label=prompt(`نام طعم جدید برای «${p.name}» را وارد کنید:`);
  if(label===null)return;
  if(!label.trim()){toast("نام طعم را وارد کنید.");return;}
  const stockRaw=prompt(`موجودی طعم «${label.trim()}» چند عدد است؟`,"0");
  if(stockRaw===null)return;
  const stock=Number(digitsOnly(stockRaw));
  if(!Number.isInteger(stock)||stock<0){toast("موجودی باید عدد صحیح و صفر یا بیشتر باشد.");return;}
  try{
    const {error}=await sb.from("vm_product_variants").insert({
      product_id:Number(productId),label:label.trim(),variant_type:"flavor",stock,is_active:true
    });
    if(error)throw error;
    await loadProducts(true);
    toast(`طعم «${label.trim()}» برای ${p.name} اضافه شد.`);
  }catch(err){
    console.error("addFlavor failed:",err);
    toast("افزودن طعم انجام نشد. وجود جدول vm_product_variants و دسترسی مدیر را بررسی کنید.");
  }
}

async function manageVariants(productId){
  if(!await confirmAdmin())return;
  const p=products.find(x=>String(x.id)===String(productId));if(!p)return;
  const typeRaw=prompt("نوع تنوع را وارد کنید: flavor برای طعم، color برای رنگ، model برای مدل", "flavor");if(typeRaw===null)return;
  const type=typeRaw.trim().toLowerCase();if(!["flavor","color","model"].includes(type)){toast("نوع باید flavor یا color یا model باشد.");return;}
  const label=prompt("نام طعم، رنگ یا مدل را وارد کنید:");if(!label?.trim())return;
  const stockRaw=prompt("موجودی این تنوع چند عدد است؟", "0");if(stockRaw===null)return;
  const stock=Number(digitsOnly(stockRaw));if(!Number.isInteger(stock)||stock<0){toast("موجودی معتبر نیست.");return;}
  try{const {error}=await sb.from("vm_product_variants").insert({product_id:Number(productId),label:label.trim(),variant_type:type,stock,is_active:true});if(error)throw error;toast("تنوع محصول ثبت شد.");await loadProducts(true);}
  catch(err){console.error(err);toast("ثبت تنوع ناموفق بود؛ مجوز مدیر و جدول را بررسی کنید.");}
}

// Product cards and cart
$("#productGrid").addEventListener("click",e=>{
  const detailButton=e.target.closest("[data-product-open]");
  if(detailButton){openProductDetails(detailButton.dataset.productOpen);return;}
  const card=e.target.closest("[data-product]");
  if(!card || e.target.closest("button,select,input,label,a"))return;
  openProductDetails(card.dataset.product);
});
$("#productGrid").addEventListener("keydown",e=>{
  if((e.key==="Enter"||e.key===" ") && e.target.matches("[data-product]")){
    e.preventDefault();openProductDetails(e.target.dataset.product);
  }
});
$("#productDetailsModal").addEventListener("click",e=>{
  if(e.target.id==="productDetailsModal" || e.target.closest("[data-product-close]"))closeModal("#productDetailsModal");
});
$("#productGrid").addEventListener("click",e=>{
  const b=e.target.closest("[data-add]");if(!b)return;
  const p=products.find(x=>String(x.id)===String(b.dataset.add));if(!p)return;
  const pv=variants.filter(v=>String(v.product_id)===String(p.id));
  let v=null;
  if(pv.length){const chosen=$(`.variant-picker[data-variant-for="${CSS.escape(String(p.id))}"]`)?.value;if(!chosen){toast("ابتدا طعم، رنگ یا مدل را انتخاب کنید.");return;}v=pv.find(x=>String(x.id)===String(chosen));if(!v||Number(v.stock)<=0){toast("این تنوع ناموجود است.");return;}}
  else if(p.stock<=0){toast("این محصول ناموجود است.");return;}
  const cartKey=`${p.id}:${v?.id||"base"}`;
  const line=cart.find(x=>x.cartKey===cartKey), available=v?Number(v.stock):p.stock;
  if(line){if(line.qty>=available){toast("تعداد درخواستی بیشتر از موجودی است.");return;}line.qty++;}
  else cart.push({...p,variant_id:v?.id||null,variant_label:v?.label||"",cartKey,qty:1});
  renderCart();toast("به سبد خرید اضافه شد.");
});
$("#cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(!b)return;cart=cart.filter(x=>x.cartKey!==b.dataset.remove);renderCart();});
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
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]"),manage=e.target.closest("[data-variants]"),addFlavorBtn=e.target.closest("[data-add-flavor]"),ve=e.target.closest("[data-variant-edit]"),vd=e.target.closest("[data-variant-delete]");
  if(addFlavorBtn){await addFlavor(addFlavorBtn.dataset.addFlavor);return;}
  if(ve){if(!await confirmAdmin())return;const v=variants.find(x=>String(x.id)===String(ve.dataset.variantEdit));if(!v)return;const label=prompt("نام تنوع:",v.label);if(label===null)return;const stockRaw=prompt("موجودی:",String(v.stock));if(stockRaw===null)return;const stock=Number(digitsOnly(stockRaw));if(!label.trim()||!Number.isInteger(stock)||stock<0){toast("اطلاعات تنوع معتبر نیست.");return;}const {error}=await sb.from("vm_product_variants").update({label:label.trim(),stock}).eq("id",v.id);if(error){console.error(error);toast("ویرایش انجام نشد.");return;}await loadProducts(true);toast("تنوع بروزرسانی شد.");return;}
  if(vd){if(!confirm("این تنوع حذف شود؟"))return;if(!await confirmAdmin())return;const {error}=await sb.from("vm_product_variants").delete().eq("id",vd.dataset.variantDelete);if(error){console.error(error);toast("حذف تنوع انجام نشد.");return;}await loadProducts(true);toast("تنوع حذف شد.");return;}
  if(manage){await manageVariants(manage.dataset.variants);return;}
  if(edit){editProduct(edit.dataset.edit);return;}
  if(del){if(!confirm("این محصول حذف شود؟"))return;if(!await confirmAdmin())return;
    const {error}=await sb.from("vm_products").delete().eq("id",del.dataset.delete);
    if(error){console.error(error);toast("حذف محصول ناموفق بود.");return;}await loadProducts(true);toast("محصول حذف شد.");}
});
$("#variantProductSelect").addEventListener("change",renderVariantManager);
$("#variantFlavorAdd").addEventListener("click",async()=>{
  if(!await confirmAdmin())return;
  const productId=$("#variantProductSelect").value;
  const label=$("#variantFlavorName").value.trim();
  const stock=Number(digitsOnly($("#variantFlavorStock").value));
  if(!productId){toast("ابتدا محصول را انتخاب کن.");return;}
  if(!label){toast("نام طعم را وارد کن.");$("#variantFlavorName").focus();return;}
  if(!Number.isInteger(stock)||stock<0){toast("موجودی باید عدد صحیح و صفر یا بیشتر باشد.");return;}
  const btn=$("#variantFlavorAdd");btn.disabled=true;
  try{
    const {error}=await sb.from("vm_product_variants").insert({product_id:Number(productId),label,variant_type:"flavor",stock,is_active:true});
    if(error)throw error;
    $("#variantFlavorName").value="";$("#variantFlavorStock").value="0";
    await loadProducts(true);
    toast(`طعم «${label}» با موجودی ${stock} ثبت شد.`);
  }catch(err){console.error(err);toast("ثبت طعم انجام نشد؛ جدول vm_product_variants و مجوز مدیر را بررسی کن.");}
  finally{btn.disabled=false;}
});
$("#variantManagerList").addEventListener("click",async e=>{
  const edit=e.target.closest("[data-variant-edit]"),del=e.target.closest("[data-variant-delete]");
  if(edit){
    if(!await confirmAdmin())return;
    const v=variants.find(x=>String(x.id)===String(edit.dataset.variantEdit));if(!v)return;
    const label=prompt("نام طعم:",v.label);if(label===null)return;
    const stockRaw=prompt("موجودی این طعم:",String(v.stock));if(stockRaw===null)return;
    const stock=Number(digitsOnly(stockRaw));
    if(!label.trim()||!Number.isInteger(stock)||stock<0){toast("نام طعم یا موجودی معتبر نیست.");return;}
    const {error}=await sb.from("vm_product_variants").update({label:label.trim(),stock}).eq("id",v.id);
    if(error){console.error(error);toast("ویرایش طعم انجام نشد.");return;}
    await loadProducts(true);toast("طعم و موجودی آن بروزرسانی شد.");return;
  }
  if(del){
    if(!confirm("این طعم حذف شود؟"))return;
    if(!await confirmAdmin())return;
    const {error}=await sb.from("vm_product_variants").delete().eq("id",del.dataset.variantDelete);
    if(error){console.error(error);toast("حذف طعم انجام نشد.");return;}
    await loadProducts(true);toast("طعم حذف شد.");
  }
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
