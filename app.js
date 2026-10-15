
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

const defaultProducts = [
  { id: 1, name: "Pod System", category: "پادسیستم", price: 1200000, desc: "دستگاه جمع‌وجور" },
  { id: 2, name: "Vape Device", category: "دستگاه ویپ", price: 2500000, desc: "دستگاه با طراحی مدرن" },
  { id: 3, name: "کارتریج", category: "کویل و کارتریج", price: 250000, desc: "لوازم جانبی دستگاه" },
  { id: 4, name: "لوازم جانبی", category: "لوازم جانبی", price: 180000, desc: "لوازم جانبی فروشگاه" }
];

let products = [...defaultProducts];
let cart = [];
let activeFilter = "همه";
let authMode = "login";
let pendingPhone = "";

function toman(value) {
  return Number(value || 0).toLocaleString("fa-IR") + " تومان";
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function openModal(id) {
  const element = $(id);
  if (element) element.classList.add("open");
}

function closeModal(id) {
  const element = $(id);
  if (element) element.classList.remove("open");
}

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;

  const shown = activeFilter === "همه"
    ? products
    : products.filter(p => p.category === activeFilter);

  grid.innerHTML = shown.map(product => `
    <article class="product-card">
      <div class="product-art"><span>VM</span></div>
      <div class="product-info">
        <small>${product.category}</small>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.desc || "")}</p>
        <div class="product-bottom">
          <b>${toman(product.price)}</b>
          <button class="btn primary" data-add="${product.id}">افزودن</button>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === activeFilter);
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const item = cart.find(p => p.id === id);
  if (item) item.quantity++;
  else cart.push({ ...product, quantity: 1 });
  renderCart();
  showToast("به سبد خرید اضافه شد");
}

function renderCart() {
  const items = $("cartItems");
  const count = $("cartCount");
  const total = $("cartTotal");
  if (count) count.textContent = cart.reduce((sum, p) => sum + p.quantity, 0);
  if (total) total.textContent = toman(cart.reduce((sum, p) => sum + p.price * p.quantity, 0));

  if (!items) return;
  items.innerHTML = cart.length ? cart.map(item => `
    <div class="cart-item">
      <div>
        <b>${escapeHTML(item.name)}</b>
        <p>${toman(item.price)} × ${item.quantity}</p>
      </div>
      <button class="btn ghost" data-remove="${item.id}">حذف</button>
    </div>
  `).join("") : "<p>سبد خرید خالی است.</p>";

  items.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      cart = cart.filter(item => item.id !== Number(button.dataset.remove));
      renderCart();
    });
  });
}

function renderAdmin() {
  const list = $("adminProducts");
  if (!list) return;
  list.innerHTML = products.map(p => `
    <div class="admin-product">
      <span>${escapeHTML(p.name)} — ${toman(p.price)}</span>
      <button class="btn ghost" data-delete="${p.id}">حذف</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      products = products.filter(p => p.id !== Number(button.dataset.delete));
      renderProducts();
      renderAdmin();
    });
  });
}

function setAuthStatus(message, isError = false) {
  const status = $("authStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function setAuthMode(mode) {
  authMode = mode;
  $("authTitle").textContent = mode === "signup" ? "ساخت حساب جدید" : "ورود به حساب";
  $("authSubmit").textContent = mode === "signup" ? "ثبت‌نام" : "ورود";
  $("authLoginTab").classList.toggle("active", mode === "login");
  $("authSignupTab").classList.toggle("active", mode === "signup");
  $("authPassword").autocomplete = mode === "signup" ? "new-password" : "current-password";
  setAuthStatus("");
}

function normalizePhone(value) {
  return value.replace(/[\s()-]/g, "");
}

function showSignedIn(user) {
  $("authForm").hidden = true;
  $("otpForm").hidden = true;
  $("authSignedIn").hidden = false;
  $("authUserLabel").textContent =
    "وارد شده‌اید: " + (user.phone || user.email || "حساب کاربری");
  $("authTitle").textContent = "حساب کاربری";
  setAuthStatus("ورود با موفقیت انجام شد.");
}

function showSignedOut() {
  $("authForm").hidden = false;
  $("otpForm").hidden = true;
  $("authSignedIn").hidden = true;
  setAuthMode("login");
}

async function refreshAuth() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setAuthStatus("بررسی وضعیت حساب ناموفق بود.", true);
    return;
  }
  if (data.session) showSignedIn(data.session.user);
  else showSignedOut();
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const phone = normalizePhone($("authPhone").value.trim());
  const password = $("authPassword").value;

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    setAuthStatus("شماره را با کد کشور وارد کن؛ مثال: +994501234567", true);
    return;
  }

  if (password.length < 6) {
    setAuthStatus("رمز عبور باید حداقل ۶ کاراکتر باشد.", true);
    return;
  }

  $("authSubmit").disabled = true;
  setAuthStatus("لطفاً صبر کن...");

  try {
    let result;

    if (authMode === "signup") {
      result = await supabaseClient.auth.signUp({
        phone,
        password
      });

      if (!result.error && result.data.user && !result.data.session) {
        pendingPhone = phone;
        $("authForm").hidden = true;
        $("otpForm").hidden = false;
        setAuthStatus("اگر پیامک تأیید تنظیم شده باشد، کد برایت ارسال می‌شود.");
      }
    } else {
      result = await supabaseClient.auth.signInWithPassword({
        phone,
        password
      });
    }

    if (result.error) throw result.error;

    if (result.data.session) {
      showSignedIn(result.data.session.user);
      showToast("با موفقیت وارد شدی");
    }
  } catch (error) {
    setAuthStatus(error.message || "مشکلی پیش آمد. تنظیمات Supabase را بررسی کن.", true);
  } finally {
    $("authSubmit").disabled = false;
  }
}

async function handleOtpSubmit(event) {
  event.preventDefault();
  const token = $("authOtp").value.trim();

  if (!token) {
    setAuthStatus("کد پیامک را وارد کن.", true);
    return;
  }

  setAuthStatus("در حال بررسی کد...");

  const { data, error } = await supabaseClient.auth.verifyOtp({
    phone: pendingPhone,
    token,
    type: "sms"
  });

  if (error) {
    setAuthStatus(error.message || "کد تأیید درست نیست.", true);
    return;
  }

  if (data.user) {
    showSignedIn(data.user);
    showToast("حساب با موفقیت تأیید شد");
  }
}

function init() {
  $("ageYes")?.addEventListener("click", () => {
    $("ageGate").classList.add("hidden");
  });

  $("ageNo")?.addEventListener("click", () => {
    showToast("برای ادامه باید سن قانونی را داشته باشی.");
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      renderProducts();
    });
  });

  $("cartOpen")?.addEventListener("click", () => openModal("cartDrawer"));
  $("adminOpen")?.addEventListener("click", () => openModal("adminModal"));
  $("authOpen")?.addEventListener("click", () => openModal("authModal"));

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      closeModal("adminModal");
      closeModal("cartDrawer");
    });
  });

  document.querySelectorAll("[data-auth-close]").forEach(button => {
    button.addEventListener("click", () => closeModal("authModal"));
  });

  $("drawerBackdrop")?.addEventListener("click", () => closeModal("cartDrawer"));

  $("authLoginTab")?.addEventListener("click", () => setAuthMode("login"));
  $("authSignupTab")?.addEventListener("click", () => setAuthMode("signup"));
  $("authForm")?.addEventListener("submit", handleAuthSubmit);
  $("otpForm")?.addEventListener("submit", handleOtpSubmit);

  $("authSignOut")?.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) setAuthStatus(error.message, true);
    else {
      showSignedOut();
      showToast("از حساب خارج شدی");
    }
  });

  $("productForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const name = $("pName").value.trim();
    const category = $("pCategory").value;
    const price = Number($("pPrice").value);
    const desc = $("pDesc").value.trim();

    if (!name || price < 0) return;
    products.push({ id: Date.now(), name, category, price, desc });
    event.target.reset();
    renderProducts();
    renderAdmin();
    showToast("محصول اضافه شد");
  });

  $("resetDemo")?.addEventListener("click", () => {
    products = [...defaultProducts];
    renderProducts();
    renderAdmin();
    showToast("محصولات نمونه بازگردانی شدند");
  });

  $("checkout")?.addEventListener("click", () => {
    showToast("برای ثبت سفارش باید درگاه پرداخت و بخش سفارش‌ها تنظیم شود.");
  });

  renderProducts();
  renderCart();
  renderAdmin();
  refreshAuth();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session) showSignedIn(session.user);
  });
}

init();
```
