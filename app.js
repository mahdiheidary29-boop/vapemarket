const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const seed=[
{id:1,name:"دستگاه ویپ مدل Nova",category:"دستگاه ویپ",price:2450000,desc:"طراحی جمع‌وجور با بدنه خوش‌دست",bg:"#e4ddff"},
{id:2,name:"پادسیستم مدل Air",category:"پادسیستم",price:1780000,desc:"سبک و مناسب استفاده روزمره",bg:"#ffd9eb"},
{id:3,name:"کویل سازگار مدل X",category:"کویل و کارتریج",price:320000,desc:"برای مدل‌های سازگار؛ مشخصات را بررسی کنید",bg:"#d8f6f2"},
{id:4,name:"کیف نگهداری دستگاه",category:"لوازم جانبی",price:410000,desc:"کیف سبک برای نگهداری لوازم",bg:"#e9f7bd"}];
function readStoredJSON(storage, key, fallback) {
  try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch (error) { console.warn("ذخیره محلی قابل خواندن نیست:", key, error); return fallback; }
}
let products=[];
let cart=readStoredJSON(sessionStorage, "vm_cart", []), activeFilter="همه";
const money=n=>Number(n).toLocaleString("fa-IR")+" تومان";
function dbRowToProduct(row){return {id:Number(row.id),name:row.name,category:row.category,price:Number(row.price),desc:row.description||"",bg:row.bg||"#e4ddff"}}
async function loadProducts(showError=false){
  if(!sb){products=[];renderProducts();return;}
  try{
    const {data,error}=await sb.from("vm_products").select("id,name,category,price,description,bg").order("id",{ascending:false});
    if(error)throw error;
    products=(data||[]).map(dbRowToProduct);
    renderProducts();
    if($("#adminModal").classList.contains("show"))renderAdmin();
  }catch(error){
    console.error("بارگذاری محصولات از پایگاه داده ناموفق بود:",error);
    products=[];renderProducts();
    if(showError)toast("بارگذاری محصولات از Supabase ناموفق بود؛ تنظیمات جدول و RLS را بررسی کن.");
  }
}
function renderProducts(){const list=products.filter(p=>activeFilter==="همه"||p.category===activeFilter);$("#productGrid").innerHTML=list.length?list.map(p=>`<article class="product"><div class="product-art" style="background:${p.bg||'#e4ddff'}"><div class="mini-device"></div></div><h3>${esc(p.name)}</h3><p>${esc(p.desc||"برای اطلاع از جزئیات بیشتر، مشخصات محصول را بررسی کنید.")}</p><div class="product-foot"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}">افزودن +</button></div></article>`).join(""):`<div class="empty">محصولی در این دسته وجود ندارد.</div>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderCart(){let count=cart.reduce((n,x)=>n+x.qty,0);$("#cartCount").textContent=count.toLocaleString("fa-IR");$("#cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><span>${esc(x.name)}<br><small>${x.qty.toLocaleString("fa-IR")} × ${money(x.price)}</small></span><span><b>${money(x.price*x.qty)}</b><br><button data-remove="${x.id}">حذف</button></span></div>`).join(""):`<div class="empty" style="margin-top:25px">سبد خرید خالی است.</div>`;$("#cartTotal").textContent=money(cart.reduce((n,x)=>n+x.price*x.qty,0));sessionStorage.setItem("vm_cart",JSON.stringify(cart))}
function renderAdmin(){$("#adminProducts").innerHTML=products.map(p=>`<div class="admin-row"><span>${esc(p.name)} — ${money(p.price)}</span><button data-delete="${p.id}">حذف</button></div>`).join("")||"<p>هنوز محصولی اضافه نشده.</p>"}
function toast(t){$("#toast").textContent=t;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2400)}
function openDrawer(){$("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.add("show")}
async function openAdmin(){
  // Front-end allowlist: configure ADMIN_USER_ID below with your Supabase Auth user UUID.
  if (!sb) { toast("ورود امن فعال نیست؛ تنظیمات Supabase را بررسی کنید."); return; }
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session) {
      toast("برای ورود به پنل مدیریت، ابتدا وارد حساب شوید.");
      openAuth();
      return;
    }
    if (!ADMIN_USER_ID || ADMIN_USER_ID === "PASTE_YOUR_SUPABASE_USER_ID_HERE") {
      toast("شناسه مدیر هنوز تنظیم نشده است؛ راهنمای داخل بسته را ببینید.");
      return;
    }
    if (session.user.id !== ADMIN_USER_ID) {
      toast("این حساب اجازه دسترسی به پنل مدیریت را ندارد.");
      return;
    }
    $("#adminModal").classList.add("show");
    renderAdmin();
  } catch (error) {
    toast("بررسی دسترسی مدیر ناموفق بود.");
    console.error(error);
  }
}
function closeAll(){$("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("show");$("#adminModal").classList.remove("show")}
const ageGate = $("#ageGate"), ageYes = $("#ageYes"), ageNo = $("#ageNo");
if (ageYes) ageYes.addEventListener("click", () => {
  try { sessionStorage.setItem("vm_age_confirmed", "1"); } catch (_) {}
  if (ageGate) ageGate.remove();
});
if (ageNo) ageNo.addEventListener("click", () => {
  document.body.innerHTML='<main style="font-family:Tahoma;text-align:center;padding:15vh 8vw;line-height:2"><h2>دسترسی امکان‌پذیر نیست</h2><p>این فروشگاه برای افراد واجد شرایط سنی است.</p></main>';
});
try { if (sessionStorage.getItem("vm_age_confirmed") && ageGate) ageGate.remove(); } catch (_) {}
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts();$("#products").scrollIntoView({behavior:"smooth"})}));
$("#productGrid").addEventListener("click",e=>{let b=e.target.closest("[data-add]");if(!b)return;let p=products.find(x=>x.id===Number(b.dataset.add));if(!p)return;let line=cart.find(x=>x.id===p.id);line?line.qty++:cart.push({...p,qty:1});renderCart();toast("به سبد خرید اضافه شد")});
$("#cartOpen").onclick=()=>{renderCart();openDrawer()};$("#adminOpen").onclick=openAdmin;$("#drawerBackdrop").onclick=closeAll;$$("[data-close]").forEach(b=>b.onclick=closeAll);
$("#cartItems").addEventListener("click",e=>{let b=e.target.closest("[data-remove]");if(!b)return;cart=cart.filter(x=>x.id!==Number(b.dataset.remove));renderCart()});
$("#checkout").onclick=()=>toast("برای پرداخت واقعی، درگاه پرداخت و بک‌اند امن باید راه‌اندازی شود.");
$("#productForm").onsubmit=async e=>{
  e.preventDefault();
  if (!(await confirmAdminAction())) return;
  const newProduct={name:$("#pName").value.trim(),category:$("#pCategory").value,price:Number($("#pPrice").value),description:$("#pDesc").value.trim(),bg:["#e4ddff","#ffd9eb","#d8f6f2","#e9f7bd"][products.length%4]};
  const {error}=await sb.from("vm_products").insert(newProduct);
  if(error){console.error(error);toast("ذخیره محصول ناموفق بود؛ مجوز مدیر در Supabase را بررسی کن.");return;}
  await loadProducts(true);renderAdmin();e.target.reset();toast("محصول با موفقیت در پایگاه داده ذخیره شد")
};
$("#adminProducts").addEventListener("click",async e=>{let b=e.target.closest("[data-delete]");if(!b)return;if (!(await confirmAdminAction())) return;const {error}=await sb.from("vm_products").delete().eq("id",Number(b.dataset.delete));if(error){console.error(error);toast("حذف محصول ناموفق بود.");return;}await loadProducts(true);renderAdmin();toast("محصول حذف شد")});
$("#resetDemo").onclick=async()=>{if (!(await confirmAdminAction())) return;const {error:deleteError}=await sb.from("vm_products").delete().gt("id",0);if(deleteError){console.error(deleteError);toast("بازگردانی محصولات ناموفق بود.");return;}const rows=seed.map(x=>({name:x.name,category:x.category,price:x.price,description:x.desc,bg:x.bg}));const {error:insertError}=await sb.from("vm_products").insert(rows);if(insertError){console.error(insertError);toast("حذف انجام شد اما درج نمونه‌ها ناموفق بود.");return;}await loadProducts(true);renderAdmin();toast("محصولات نمونه در پایگاه داده بازگردانی شدند")};
// Supabase authentication: phone number + password, without SMS.
// IMPORTANT: Set these to your Supabase project's Project URL and Publishable key.
const SUPABASE_URL = "https://fgpxwxrlkowauouwmhqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SzsHEG24RmsWFWJXZyMICA_LmY-HcNE";
// Replace this placeholder with YOUR account UUID from Supabase → Authentication → Users.
const ADMIN_USER_ID = "55422178-aed3-4eb7-9b0f-9301304125c3";

let sb = null;
let authMode = "login";
const authModal = $("#authModal");
const authStatus = $("#authStatus");

function setAuthStatus(message, type = "") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.className = "auth-status" + (type ? " " + type : "");
}

function setAuthMode(mode) {
  authMode = mode;
  $("#authTitle").textContent = mode === "signup" ? "ساخت حساب کاربری" : "ورود به حساب";
  $("#authSubmit").textContent = mode === "signup" ? "ثبت‌نام" : "ورود";
  $("#authLoginTab").classList.toggle("active", mode === "login");
  $("#authSignupTab").classList.toggle("active", mode === "signup");
  $("#authPassword").autocomplete = mode === "signup" ? "new-password" : "current-password";
  $("#authForm").hidden = false;
  $("#otpForm").hidden = true;
  $("#authSignedIn").hidden = true;
  setAuthStatus("");
}

function normalizePhone(value) {
  return String(value || "").replace(/[\s()-]/g, "");
}

// Customer phone numbers are mapped to a syntactically valid internal email.
// This no-SMS workaround requires Supabase email confirmation to be disabled.
// It does NOT verify that the customer owns the phone number.
function phoneToInternalEmail(phone) {
  return "phone-" + phone.replace(/\D/g, "") + "@users.vapemarket.com";
}

function openAuth() {
  authModal.classList.add("show");
  authModal.setAttribute("aria-hidden", "false");
  setAuthStatus("");
  refreshAuthUI();
}

function closeAuth() {
  authModal.classList.remove("show");
  authModal.setAttribute("aria-hidden", "true");
}

async function refreshAuthUI() {
  if (!sb) return;
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const session = data.session;
    $("#authSignedIn").hidden = !session;
    $("#authForm").hidden = !!session;
    $("#otpForm").hidden = true;
    if (session) {
      const phone = session.user.user_metadata?.phone_number;
      $("#authUserLabel").textContent = "وارد شده‌اید: " + (phone || "حساب کاربری");
      $("#authTitle").textContent = "حساب کاربری";
    } else {
      $("#authTitle").textContent = authMode === "signup" ? "ساخت حساب کاربری" : "ورود به حساب";
    }
  } catch (error) {
    setAuthStatus(error.message || "بررسی وضعیت ورود ناموفق بود.", "error");
  }
}

if (window.supabase &&
    SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY") {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("برای فعال شدن ورود، آدرس پروژه و کلید Publishable را در app.js وارد کنید.");
}

async function confirmAdminAction() {
  if (!sb || !ADMIN_USER_ID || ADMIN_USER_ID === "PASTE_YOUR_SUPABASE_USER_ID_HERE") {
    toast("شناسه مدیر یا تنظیمات Supabase کامل نیست.");
    return false;
  }
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (!data.session || data.session.user.id !== ADMIN_USER_ID) {
      toast("اجازه انجام این عملیات را ندارید.");
      $("#adminModal").classList.remove("show");
      return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    toast("تأیید دسترسی ناموفق بود.");
    return false;
  }
}

$("#authOpen").addEventListener("click", openAuth);
$("[data-auth-close]").addEventListener("click", closeAuth);
authModal.addEventListener("click", event => {
  if (event.target === authModal) closeAuth();
});
$("#authLoginTab").addEventListener("click", () => setAuthMode("login"));
$("#authSignupTab").addEventListener("click", () => setAuthMode("signup"));

$("#authForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!sb) {
    setAuthStatus("آدرس پروژه و کلید Publishable مربوط به Supabase هنوز تنظیم نشده است.", "error");
    return;
  }

  const identifier = normalizePhone($("#authPhone").value.trim());
  const password = $("#authPassword").value;
  let email;
  if (authMode === "login" && identifier.includes("@")) {
    // Allows the owner to log into the pre-created Supabase email account.
    email = identifier.toLowerCase();
  } else {
    if (!/^\+[1-9]\d{7,14}$/.test(identifier)) {
      setAuthStatus(authMode === "signup"
        ? "شماره را با کد کشور وارد کنید؛ مثال: +994501234567"
        : "شماره را با کد کشور وارد کنید یا با ایمیل حساب مدیر وارد شوید.", "error");
      return;
    }
    email = phoneToInternalEmail(identifier);
  }
  if (password.length < 6) {
    setAuthStatus("رمز عبور باید حداقل ۶ کاراکتر باشد.", "error");
    return;
  }
  const submit = $("#authSubmit");
  submit.disabled = true;
  setAuthStatus(authMode === "signup" ? "در حال ساخت حساب…" : "در حال ورود…");
  try {
    let result;
    if (authMode === "signup") {
      result = await sb.auth.signUp({
        email,
        password,
        options: { data: { phone_number: identifier } }
      });
    } else {
      result = await sb.auth.signInWithPassword({ email, password });
    }
    if (result.error) throw result.error;

    if (authMode === "signup" && !result.data.session) {
      setAuthStatus("حساب ساخته شد؛ برای ورود بدون پیامک باید تأیید ایمیل در تنظیمات Supabase خاموش باشد. این تنظیم را بررسی کنید.", "error");
    } else {
      setAuthStatus(authMode === "signup" ? "حساب ساخته شد و وارد شدید." : "با موفقیت وارد شدید.", "success");
      await refreshAuthUI();
      if (result.data.session) toast("با موفقیت وارد شدید");
    }
  } catch (error) {
    setAuthStatus(error.message || "عملیات ناموفق بود. تنظیمات Supabase را بررسی کنید.", "error");
  } finally {
    submit.disabled = false;
  }
});

// This flow intentionally does not send or request an SMS code.
$("#authSignOut").addEventListener("click", async () => {
  if (!sb) return;
  const { error } = await sb.auth.signOut();
  if (error) setAuthStatus(error.message, "error");
  else {
    setAuthMode("login");
    setAuthStatus("از حساب خارج شدید.", "success");
    await refreshAuthUI();
  }
});

if (sb) sb.auth.onAuthStateChange(() => { refreshAuthUI(); });

loadProducts(true);
renderCart();
async function createCheckoutOrder(cartItems) {
  const items = cartItems.map(item => ({
    product_id: String(item.id),
    quantity: Number(item.quantity)
  }));

  const { data, error } = await supabase.functions.invoke(
    "create-order",
    { body: { items } }
  );

  if (error) {
    throw new Error("ثبت سفارش ناموفق بود. دوباره تلاش کنید.");
  }

  if (!data?.order_id || data.status !== "pending") {
    throw new Error("پاسخ سفارش معتبر نیست.");
  }

  alert(
    `سفارش ثبت شد: ${data.order_id}\n` +
    `مبلغ: ${Number(data.amount_toman).toLocaleString("fa-IR")} تومان\n` +
    "این سفارش هنوز پرداخت نشده است."
  );

  return data;
}
