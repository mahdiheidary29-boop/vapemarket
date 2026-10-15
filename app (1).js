const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const seed=[
{id:1,name:"دستگاه ویپ مدل Nova",category:"دستگاه ویپ",price:2450000,desc:"طراحی جمع‌وجور با بدنه خوش‌دست",bg:"#e4ddff"},
{id:2,name:"پادسیستم مدل Air",category:"پادسیستم",price:1780000,desc:"سبک و مناسب استفاده روزمره",bg:"#ffd9eb"},
{id:3,name:"کویل سازگار مدل X",category:"کویل و کارتریج",price:320000,desc:"برای مدل‌های سازگار؛ مشخصات را بررسی کنید",bg:"#d8f6f2"},
{id:4,name:"کیف نگهداری دستگاه",category:"لوازم جانبی",price:410000,desc:"کیف سبک برای نگهداری لوازم",bg:"#e9f7bd"}];
let products=JSON.parse(localStorage.getItem("vm_products")||"null")||seed;
let cart=JSON.parse(sessionStorage.getItem("vm_cart")||"[]"), activeFilter="همه";
const money=n=>Number(n).toLocaleString("fa-IR")+" تومان";
function save(){localStorage.setItem("vm_products",JSON.stringify(products))}
function renderProducts(){const list=products.filter(p=>activeFilter==="همه"||p.category===activeFilter);$("#productGrid").innerHTML=list.length?list.map(p=>`<article class="product"><div class="product-art" style="background:${p.bg||'#e4ddff'}"><div class="mini-device"></div></div><h3>${esc(p.name)}</h3><p>${esc(p.desc||"برای اطلاع از جزئیات بیشتر، مشخصات محصول را بررسی کنید.")}</p><div class="product-foot"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}">افزودن +</button></div></article>`).join(""):`<div class="empty">محصولی در این دسته وجود ندارد.</div>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderCart(){let count=cart.reduce((n,x)=>n+x.qty,0);$("#cartCount").textContent=count.toLocaleString("fa-IR");$("#cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><span>${esc(x.name)}<br><small>${x.qty.toLocaleString("fa-IR")} × ${money(x.price)}</small></span><span><b>${money(x.price*x.qty)}</b><br><button data-remove="${x.id}">حذف</button></span></div>`).join(""):`<div class="empty" style="margin-top:25px">سبد خرید خالی است.</div>`;$("#cartTotal").textContent=money(cart.reduce((n,x)=>n+x.price*x.qty,0));sessionStorage.setItem("vm_cart",JSON.stringify(cart))}
function renderAdmin(){$("#adminProducts").innerHTML=products.map(p=>`<div class="admin-row"><span>${esc(p.name)} — ${money(p.price)}</span><button data-delete="${p.id}">حذف</button></div>`).join("")||"<p>هنوز محصولی اضافه نشده.</p>"}
function toast(t){$("#toast").textContent=t;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2400)}
function openDrawer(){$("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.add("show")}
function openAdmin(){$("#adminModal").classList.add("show");renderAdmin()}
function closeAll(){$("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("show");$("#adminModal").classList.remove("show")}
$("#ageYes").onclick=()=>{sessionStorage.setItem("vm_age_confirmed","1");$("#ageGate").remove()};
$("#ageNo").onclick=()=>{document.body.innerHTML='<main style="font-family:Tahoma;text-align:center;padding:15vh 8vw;line-height:2"><h2>دسترسی امکان‌پذیر نیست</h2><p>این فروشگاه برای افراد واجد شرایط سنی است.</p></main>'};
if(sessionStorage.getItem("vm_age_confirmed"))$("#ageGate").remove();
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts();$("#products").scrollIntoView({behavior:"smooth"})}));
$("#productGrid").addEventListener("click",e=>{let b=e.target.closest("[data-add]");if(!b)return;let p=products.find(x=>x.id===Number(b.dataset.add));if(!p)return;let line=cart.find(x=>x.id===p.id);line?line.qty++:cart.push({...p,qty:1});renderCart();toast("به سبد خرید اضافه شد")});
$("#cartOpen").onclick=()=>{renderCart();openDrawer()};$("#adminOpen").onclick=openAdmin;$("#drawerBackdrop").onclick=closeAll;$$("[data-close]").forEach(b=>b.onclick=closeAll);
$("#cartItems").addEventListener("click",e=>{let b=e.target.closest("[data-remove]");if(!b)return;cart=cart.filter(x=>x.id!==Number(b.dataset.remove));renderCart()});
$("#checkout").onclick=()=>toast("برای پرداخت واقعی، درگاه پرداخت و بک‌اند امن باید راه‌اندازی شود.");
$("#productForm").onsubmit=e=>{e.preventDefault();products.unshift({id:Date.now(),name:$("#pName").value.trim(),category:$("#pCategory").value,price:Number($("#pPrice").value),desc:$("#pDesc").value.trim(),bg:["#e4ddff","#ffd9eb","#d8f6f2","#e9f7bd"][products.length%4]});save();renderProducts();renderAdmin();e.target.reset();toast("محصول در همین مرورگر ذخیره شد")};
$("#adminProducts").addEventListener("click",e=>{let b=e.target.closest("[data-delete]");if(!b)return;products=products.filter(p=>p.id!==Number(b.dataset.delete));save();renderProducts();renderAdmin()});
$("#resetDemo").onclick=()=>{products=seed.map(x=>({...x}));save();renderProducts();renderAdmin();toast("محصولات نمونه بازگردانی شدند")};
// Supabase authentication: phone number + password, without SMS.
// IMPORTANT: Set these to your Supabase project's Project URL and Publishable key.
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "sb_publishable_SzsHEG24RmsWFWJXZyMICA_LmY-HcNE";

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

// Supabase email/password auth is used behind the scenes because Supabase's
// native phone/password provider requires phone verification/SMS configuration.
// The customer still enters only their phone number and password.
function phoneToInternalEmail(phone) {
  return "phone-" + phone.replace(/\D/g, "") + "@users.vapemarket.invalid";
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

  const phone = normalizePhone($("#authPhone").value.trim());
  const password = $("#authPassword").value;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    setAuthStatus("شماره را با کد کشور وارد کنید؛ مثال: +994501234567", "error");
    return;
  }
  if (password.length < 6) {
    setAuthStatus("رمز عبور باید حداقل ۶ کاراکتر باشد.", "error");
    return;
  }

  const email = phoneToInternalEmail(phone);
  const submit = $("#authSubmit");
  submit.disabled = true;
  setAuthStatus(authMode === "signup" ? "در حال ساخت حساب…" : "در حال ورود…");
  try {
    let result;
    if (authMode === "signup") {
      result = await sb.auth.signUp({
        email,
        password,
        options: { data: { phone_number: phone } }
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

renderProducts();
renderCart();
