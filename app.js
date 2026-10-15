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
renderProducts();renderCart();