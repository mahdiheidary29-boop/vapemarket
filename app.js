const SUPABASE_URL = "https://fgpxwxrlkowauouwmhqc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SzsHEG24RmsWFWJXZyMICA_LmY-HcNE";
const seed = [
  {
    id: 1,
    name: "دستگاه ویپ مدل Nova",
    category: "دستگاه ویپ",
    price: 2450000,
    desc: "طراحی جمع‌وجور با بدنه خوش‌دست",
    bg: "#e4ddff"
  },
  {
    id: 2,
    name: "پادسیستم مدل Air",
    category: "پادسیستم",
    price: 1780000,
    desc: "سبک و مناسب استفاده روزمره",
    bg: "#ffd9eb"
  },
  {
    id: 3,
    name: "کویل سازگار مدل X",
    category: "کویل و کارتریج",
    price: 320000,
    desc: "برای مدل‌های سازگار؛ مشخصات را بررسی کنید",
    bg: "#d8f6f2"
  },
  {
    id: 4,
    name: "کیف نگهداری دستگاه",
    category: "لوازم جانبی",
    price: 410000,
    desc: "کیف سبک برای نگهداری لوازم",
    bg: "#e9f7bd"
  }
];

let products =
  JSON.parse(localStorage.getItem("vm_products") || "null") || seed;

let cart =
  JSON.parse(sessionStorage.getItem("vm_cart") || "[]");

let activeFilter = "همه";

const money = n =>
  Number(n).toLocaleString("fa-IR") + " تومان";

function save() {
  localStorage.setItem("vm_products", JSON.stringify(products));
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function renderProducts() {
  const list = products.filter(
    p => activeFilter === "همه" || p.category === activeFilter
  );

  $("#productGrid").innerHTML = list.length
    ? list.map(p => `
      <article class="product">
        <div class="product-art"
             style="background:${p.bg || "#e4ddff"}">
          <div class="mini-device"></div>
        </div>

        <h3>${esc(p.name)}</h3>

        <p>${esc(
          p.desc ||
          "برای اطلاع از جزئیات بیشتر، مشخصات محصول را بررسی کنید."
        )}</p>

        <div class="product-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" data-add="${p.id}">
            افزودن +
          </button>
        </div>
      </article>
    `).join("")
    : `<div class="empty">محصولی در این دسته وجود ندارد.</div>`;
}

function renderCart() {
  const count = cart.reduce((n, x) => n + x.qty, 0);

  $("#cartCount").textContent = count.toLocaleString("fa-IR");

  $("#cartItems").innerHTML = cart.length
    ? cart.map(x => `
      <div class="cart-line">
        <span>
          ${esc(x.name)}<br>
          <small>
            ${x.qty.toLocaleString("fa-IR")} × ${money(x.price)}
          </small>
        </span>

        <span>
          <b>${money(x.price * x.qty)}</b><br>
          <button data-remove="${x.id}">حذف</button>
        </span>
      </div>
    `).join("")
    : `<div class="empty" style="margin-top:25px">
         سبد خرید خالی است.
       </div>`;

  $("#cartTotal").textContent =
    money(cart.reduce((n, x) => n + x.price * x.qty, 0));

  sessionStorage.setItem("vm_cart", JSON.stringify(cart));
}

function renderAdmin() {
  $("#adminProducts").innerHTML = products.map(p => `
    <div class="admin-row">
      <span>${esc(p.name)} — ${money(p.price)}</span>
      <button data-delete="${p.id}">حذف</button>
    </div>
  `).join("") || "<p>هنوز محصولی اضافه نشده.</p>";
}

function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");

  setTimeout(() => {
    $("#toast").classList.remove("show");
  }, 2400);
}

function openDrawer() {
  $("#cartDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("show");
}

function openAdmin() {
  $("#adminModal").classList.add("show");
  renderAdmin();
}

function closeAll() {
  $("#cartDrawer").classList.remove("open");
  $("#drawerBackdrop").classList.remove("show");
  $("#adminModal").classList.remove("show");
}

/* تأیید سن */

$("#ageYes").onclick = () => {
  sessionStorage.setItem("vm_age_confirmed", "1");
  $("#ageGate").remove();
};

$("#ageNo").onclick = () => {
  document.body.innerHTML = `
    <main style="font-family:Tahoma;text-align:center;
      padding:15vh 8vw;line-height:2">
      <h2>دسترسی امکان‌پذیر نیست</h2>
      <p>این فروشگاه برای افراد واجد شرایط سنی است.</p>
    </main>
  `;
};

if (sessionStorage.getItem("vm_age_confirmed")) {
  $("#ageGate").remove();
}

/* فیلتر محصولات */

$$("[data-filter]").forEach(b => {
  b.addEventListener("click", () => {
    activeFilter = b.dataset.filter;

    $$(".filter").forEach(x => {
      x.classList.toggle("active", x === b);
    });

    renderProducts();

    $("#products").scrollIntoView({
      behavior: "smooth"
    });
  });
});

/* افزودن به سبد خرید */

$("#productGrid").addEventListener("click", e => {
  const b = e.target.closest("[data-add]");

  if (!b) return;

  const p = products.find(
    x => x.id === Number(b.dataset.add)
  );

  if (!p) return;

  const line = cart.find(x => x.id === p.id);

  if (line) {
    line.qty++;
  } else {
    cart.push({ ...p, qty: 1 });
  }

  renderCart();
  toast("به سبد خرید اضافه شد");
});

/* کنترل سبد خرید و مدیریت */

$("#cartOpen").onclick = () => {
  renderCart();
  openDrawer();
};

$("#adminOpen").onclick = openAdmin;
$("#drawerBackdrop").onclick = closeAll;

$$("[data-close]").forEach(b => {
  b.onclick = closeAll;
});

$("#cartItems").addEventListener("click", e => {
  const b = e.target.closest("[data-remove]");

  if (!b) return;

  cart = cart.filter(
    x => x.id !== Number(b.dataset.remove)
  );

  renderCart();
});

$("#checkout").onclick = () => {
  toast("برای پرداخت واقعی، درگاه پرداخت و بک‌اند امن باید راه‌اندازی شود.");
};

/* افزودن و حذف محصول */

$("#productForm").onsubmit = e => {
  e.preventDefault();

  products.unshift({
    id: Date.now(),
    name: $("#pName").value.trim(),
    category: $("#pCategory").value,
    price: Number($("#pPrice").value),
    desc: $("#pDesc").value.trim(),
    bg: ["#e4ddff", "#ffd9eb", "#d8f6f2", "#e9f7bd"][
      products.length % 4
    ]
  });

  save();
  renderProducts();
  renderAdmin();
  e.target.reset();

  toast("محصول در همین مرورگر ذخیره شد");
};

$("#adminProducts").addEventListener("click", e => {
  const b = e.target.closest("[data-delete]");

  if (!b) return;

  products = products.filter(
    p => p.id !== Number(b.dataset.delete)
  );

  save();
  renderProducts();
  renderAdmin();
});

$("#resetDemo").onclick = () => {
  products = seed.map(x => ({ ...x }));

  save();
  renderProducts();
  renderAdmin();

  toast("محصولات نمونه بازگردانی شدند");
};

/* تنظیمات Supabase */

const SUPABASE_URL =
  "https://fgpxwxrlkowauouwmhqc.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_SzsHEG24RmsWFWJXZyMICA_LmY-HcNE";

let sb = null;
let authMode = "login";
let pendingPhone = "";

const authModal = $("#authModal");
const authStatus = $("#authStatus");

function setAuthStatus(message, type = "") {
  authStatus.textContent = message;
  authStatus.className =
    "auth-status" + (type ? " " + type : "");
}

function setAuthMode(mode) {
  authMode = mode;

  $("#authTitle").textContent =
    mode === "signup"
      ? "ساخت حساب کاربری"
      : "ورود به حساب";

  $("#authSubmit").textContent =
    mode === "signup" ? "ثبت‌نام" : "ورود";

  $("#authLoginTab").classList.toggle(
    "active",
    mode === "login"
  );

  $("#authSignupTab").classList.toggle(
    "active",
    mode === "signup"
  );

  $("#authPassword").autocomplete =
    mode === "signup" ? "new-password" : "current-password";

  $("#authForm").hidden = false;
  $("#otpForm").hidden = true;

  setAuthStatus("");
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
    const {
      data: { session }
    } = await sb.auth.getSession();

    $("#authSignedIn").hidden = !session;
    $("#authForm").hidden = !!session;
    $("#otpForm").hidden = true;

    if (session) {
      const label =
        session.user.phone ||
        session.user.email ||
        "کاربر واردشده";

      $("#authUserLabel").textContent =
        "وارد شده‌اید: " + label;

      $("#authTitle").textContent = "حساب کاربری";
    } else {
      $("#authTitle").textContent =
        authMode === "signup"
          ? "ساخت حساب کاربری"
          : "ورود به حساب";
    }
  } catch (e) {
    setAuthStatus(
      "بررسی وضعیت ورود ناموفق بود. تنظیمات Supabase را بررسی کنید.",
      "error"
    );
  }
}

/* ساخت اتصال به Supabase */

if (window.supabase) {
  sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} else {
  console.error(
    "کتابخانه Supabase بارگذاری نشده است. index.html را بررسی کنید."
  );
}

/* رویدادهای ورود و ثبت‌نام */

$("#authOpen").onclick = openAuth;
$("[data-auth-close]").onclick = closeAuth;

authModal.addEventListener("click", e => {
  if (e.target === authModal) closeAuth();
});

$("#authLoginTab").onclick = () => setAuthMode("login");
$("#authSignupTab").onclick = () => setAuthMode("signup");

$("#authForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!sb) {
    setAuthStatus(
      "اتصال به Supabase برقرار نشده است.",
      "error"
    );
    return;
  }

  const phone = $("#authPhone").value.trim();
  const password = $("#authPassword").value;

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    setAuthStatus(
      "شماره را با کد کشور وارد کنید؛ مثال: +994501234567",
      "error"
    );
    return;
  }

  $("#authSubmit").disabled = true;

  setAuthStatus(
    authMode === "signup"
      ? "در حال ساخت حساب..."
      : "در حال ورود..."
  );

  try {
    if (authMode === "signup") {
      const { data, error } = await sb.auth.signUp({
        phone,
        password
      });

      if (error) throw error;

      if (data.session) {
        setAuthStatus(
          "حساب ساخته شد و وارد شدید.",
          "success"
        );

        await refreshAuthUI();
      } else {
        pendingPhone = phone;

        $("#authForm").hidden = true;
        $("#otpForm").hidden = false;

        setAuthStatus(
          "حساب ایجاد شد، اما تأیید شماره لازم است. اگر تأیید تلفن در Supabase فعال باشد، باید شماره را تأیید کنید.",
          "success"
        );
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({
        phone,
        password
      });

      if (error) throw error;

      setAuthStatus(
        "با موفقیت وارد شدید.",
        "success"
      );

      await refreshAuthUI();
    }
  } catch (err) {
    setAuthStatus(
      err.message || "عملیات ناموفق بود. تنظیمات احراز هویت را بررسی کنید.",
      "error"
    );
  } finally {
    $("#authSubmit").disabled = false;
  }
});

/* تأیید پیامکی، در صورت فعال بودن */

$("#otpForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!sb || !pendingPhone) return;

  const token = $("#authOtp").value.trim();

  try {
    const { error } = await sb.auth.verifyOtp({
      phone: pendingPhone,
      token,
      type: "sms"
    });

    if (error) throw error;

    setAuthStatus(
      "شماره تأیید شد و حساب فعال است.",
      "success"
    );

    await refreshAuthUI();
  } catch (err) {
    setAuthStatus(
      err.message || "کد تأیید نامعتبر است.",
      "error"
    );
  }
});

/* خروج از حساب */

$("#authSignOut").onclick = async () => {
  if (!sb) return;

  const { error } = await sb.auth.signOut();

  if (error) {
    setAuthStatus(error.message, "error");
  } else {
    setAuthMode("login");

    setAuthStatus(
      "از حساب خارج شدید.",
      "success"
    );

    await refreshAuthUI();
  }
};

if (sb) {
  sb.auth.onAuthStateChange(() => {
    refreshAuthUI();
  });
}

/* نمایش اولیه */

renderProducts();
renderCart();