// ================= CONFIGURATION =================
const CONFIG = {
  // If running locally, use localhost. If on Netlify/Cloud, use the live backend placeholder.
  API_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:5001" 
    : "https://ilyra.onrender.com"
};

// ================= PARTICLES BACKGROUND =================
const canvas = document.getElementById("particles");

if (canvas) {
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const particleColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";

    particles.forEach(p => {
      p.y += p.speed;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// ================= THEME SYSTEM =================
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  injectNavbarExtras();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.innerHTML = theme === "dark" ? "<span>☀️</span>" : "<span>🌙</span>";
  }
}

// ================= BACKGROUND THEME SYSTEM =================
const DEFAULT_BG_LIGHT = "#f8fafc";
const DEFAULT_BG_DARK = "#0f172a";
const BG_PRESETS = [
  { name: "Default", hex: "#f8fafc" },
  { name: "Midnight", hex: "#0a0f1e" },
  { name: "Coffee", hex: "#1a130c" },
  { name: "Forest", hex: "#0b1a13" },
  { name: "Cream", hex: "#fdf8ef" },
  { name: "Slate", hex: "#1e293b" }
];

function initCustomTheme() {
  const saved = localStorage.getItem("custom-bg");
  if (saved) {
    applyBgColor(saved);
  }
}

function applyBgColor(hex) {
  const root = document.documentElement;
  const rgb = hexToRgb(hex);
  if (!rgb) return;

  // 1. Set Base Background
  root.style.setProperty("--bg-color", hex);
  
  // 2. Calculate Luminance for Contrast
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const isDark = luminance <= 0.6;

  // 3. Set Text Colors
  if (isDark) {
    root.style.setProperty("--text-primary", "#f8fafc");
    root.style.setProperty("--text-secondary", "#94a3b8");
    root.style.setProperty("--text-muted", "#64748b");
    root.style.setProperty("--surface-color", adjustColor(hex, 8)); // Lighter surface
    root.style.setProperty("--surface-hover", adjustColor(hex, 15));
    root.style.setProperty("--border-color", "rgba(255,255,255,0.1)");
    root.style.setProperty("--glass-bg", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`);
    root.style.setProperty("--glass-border", "rgba(255,255,255,0.1)");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    root.style.setProperty("--text-primary", "#0f172a");
    root.style.setProperty("--text-secondary", "#475569");
    root.style.setProperty("--text-muted", "#94a3b8");
    root.style.setProperty("--surface-color", "#ffffff");
    root.style.setProperty("--surface-hover", "#f1f5f9");
    root.style.setProperty("--border-color", "rgba(0,0,0,0.1)");
    root.style.setProperty("--glass-bg", "rgba(255,255,255,0.7)");
    root.style.setProperty("--glass-border", "rgba(0,0,0,0.05)");
    document.documentElement.setAttribute("data-theme", "light");
  }

  localStorage.setItem("custom-bg", hex);
  
  const picker = document.getElementById("bgPicker");
  if (picker) picker.value = hex;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function adjustColor(hex, percent) {
  let { r, g, b } = hexToRgb(hex);
  r = Math.floor(Math.max(0, Math.min(255, r + (r * percent / 100) + percent)));
  g = Math.floor(Math.max(0, Math.min(255, g + (g * percent / 100) + percent)));
  b = Math.floor(Math.max(0, Math.min(255, b + (b * percent / 100) + percent)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  const isAdminPage = window.location.pathname.includes("/admin/");
  if (isAdminPage) {
    window.location.href = "admin-login.html";
  } else {
    // Check if we are in the /user/ directory
    const isUserDir = window.location.pathname.includes("/user/");
    window.location.href = isUserDir ? "../login.html" : "login.html";
  }
}

function injectNavbarExtras() {
  const navRight = document.querySelector(".nav-right") || document.querySelector(".nav") || document.querySelector(".header");
  if (!navRight) return;

  // Prevent multiple injections
  if (document.getElementById("ilyraNavExtras")) return;

  const container = document.createElement("div");
  container.id = "ilyraNavExtras";
  container.style.cssText = "display: flex; align-items: center; gap: 1rem; margin-left: auto;";

  // 1. Theme Toggle
  const themeBtn = document.createElement("button");
  themeBtn.id = "themeToggle";
  themeBtn.className = "theme-toggle";
  themeBtn.onclick = toggleTheme;
  const theme = localStorage.getItem("theme") || "light";
  themeBtn.innerHTML = theme === "dark" ? "<span>☀️</span>" : "<span>🌙</span>";
  container.appendChild(themeBtn);

  // 2. Color Palette Toggle
  const paletteBtn = document.createElement("div");
  paletteBtn.style.position = "relative";
  paletteBtn.innerHTML = `
    <button class="theme-toggle" id="paletteToggle" aria-label="Customize colors">
      <span>🎨</span>
    </button>
    <div id="paletteMenu" class="card glass" style="
      position: absolute; top: 100%; right: 0; margin-top: 0.5rem; width: 220px; 
      padding: 1rem; display: none; z-index: 1001; text-align: left;
    ">
      <p style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem; color: var(--text-muted);">Background Theme</p>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
        ${BG_PRESETS.map(c => `
          <div onclick="applyBgColor('${c.hex}')" 
               style="background: ${c.hex}; height: 30px; border-radius: 6px; cursor: pointer; border: 2px solid var(--border-color); transition: var(--transition);"
               title="${c.name}">
          </div>
        `).join("")}
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <input type="color" id="bgPicker" style="width: 30px; height: 30px; border: none; cursor: pointer; padding: 0; background: none;" 
               oninput="applyBgColor(this.value)">
        <span style="font-size: 0.75rem; font-weight: 600;">Custom Background</span>
      </div>
      <button onclick="localStorage.removeItem('custom-bg'); location.reload();" 
              style="width: 100%; margin-top: 1rem; font-size: 0.7rem;" class="btn btn-secondary">Reset to Default</button>
    </div>
  `;
  container.appendChild(paletteBtn);

  // Toggle Menu
  const toggle = paletteBtn.querySelector("#paletteToggle");
  const menu = paletteBtn.querySelector("#paletteMenu");
  toggle.onclick = (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  };
  document.addEventListener("click", () => menu.style.display = "none");
  menu.onclick = (e) => e.stopPropagation();

  // 3. Auth Button
  const token = localStorage.getItem("token");
  const isAdminPage = window.location.pathname.includes("/admin/");
  const isLoginPage = window.location.pathname.includes("login.html");

  if (!isLoginPage) {
    if (token) {
      // Show Logout if logged in
      const logoutBtn = document.createElement("button");
      logoutBtn.className = "btn btn-secondary";
      logoutBtn.style.cssText = "width: auto; padding: 0.5rem 1rem; font-size: 0.85rem; height: 38px;";
      logoutBtn.innerText = "Logout";
      logoutBtn.onclick = logout;
      container.appendChild(logoutBtn);
    } else if (!isAdminPage) {
      // Show Login if NOT logged in (only on user pages)
      const loginBtn = document.createElement("button");
      loginBtn.className = "btn";
      loginBtn.style.cssText = "width: auto; padding: 0.5rem 1rem; font-size: 0.85rem; height: 38px;";
      loginBtn.innerText = "Login";
      loginBtn.onclick = () => {
        const isUserDir = window.location.pathname.includes("/user/");
        window.location.href = isUserDir ? "../login.html" : "login.html";
      };
      container.appendChild(loginBtn);
    }
  }

  // Prepend or Append based on context
  if (navRight.classList.contains("nav-right")) {
    navRight.appendChild(container); // Put at end of nav links
  } else {
    navRight.prepend(container);
  }
}

// Immediate theme execution to prevent flash
(function() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

document.addEventListener("DOMContentLoaded", initTheme);

// ================= PRODUCT SYSTEM =================
let allProducts = [];

async function fetchProducts() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/api/products`);
    allProducts = await res.json();
    return allProducts;
  } catch (err) {
    console.error("Failed to fetch products", err);
    return [];
  }
}

let CATEGORY_IMAGES = {};

async function fetchCategoryImages() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/api/categories`);
    const data = await res.json();
    data.forEach(cat => {
      CATEGORY_IMAGES[cat.name] = cat.image;
    });
  } catch (err) {
    console.error("Failed to fetch category images", err);
  }
}

async function renderCategories() {
  await fetchCategoryImages();
  const container = document.getElementById("products");
  if (!container) return;

  const categories = [...new Set(allProducts.map(p => p.category).filter(c => c))];
  
  if (categories.length === 0) {
      container.innerHTML = "<p class='text-center' style='grid-column: 1/-1;'>No categories found.</p>";
      return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="card fade-in category-card" onclick="filterByCategory('${cat}')" style="cursor: pointer; text-align: center;">
      <img src="${CATEGORY_IMAGES[cat] || 'https://via.placeholder.com/400x300?text=' + cat}" 
           alt="${cat}" 
           style="height: 250px; width: 100%; object-fit: cover; margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${cat}</h2>
      <p style="color: var(--text-secondary); font-size: 0.875rem;">Explore ${allProducts.filter(p => p.category === cat).length} items</p>
    </div>
  `).join("");
  
  // Update section title
  const title = document.querySelector(".section-title");
  if (title) title.innerText = "Shop by Category";
}

function filterByCategory(category) {
  const filtered = allProducts.filter(p => p.category === category);
  renderProducts(filtered);
  
  // Update section title and add back button
  const title = document.querySelector(".section-title");
  if (title) {
      title.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem;">
              <button onclick="renderCategories()" class="btn btn-secondary" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.8rem;">← Back</button>
              <span>${category}</span>
          </div>
      `;
  }
}

function renderProducts(products) {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = products.map(p => `
    <div class="card fade-in">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div style="display: flex; gap: 0.5rem; align-items: baseline;">
        <p style="color: var(--accent-color); font-weight: 700; font-size: 1.25rem;">₹${p.price}</p>
        ${p.original_price ? `<p style="color: var(--text-muted); text-decoration: line-through; font-size: 0.9rem;">₹${p.original_price}</p>` : ''}
      </div>
      
      <div style="margin-top: auto;">
        ${p.stock === 0 ? `
          <button class="btn" style="background:var(--text-muted); cursor:not-allowed;" disabled>Out of Stock</button>
        ` : `
          <button class="btn" style="margin-bottom: 0.5rem;" onclick="location.href='product.html?id=${p.id}'">View Details</button>
          <button class="btn btn-secondary" onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
        `}
      </div>
    </div>
  `).join("");
}

function searchProducts() {
  const query = document.getElementById("search")?.value.toLowerCase() || "";
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(query) || 
    (p.category && p.category.toLowerCase().includes(query)) ||
    (p.keywords && p.keywords.toLowerCase().includes(query)) ||
    (p.description && p.description.toLowerCase().includes(query))
  );
  renderProducts(filtered);
  
  const title = document.querySelector(".section-title");
  if (title) title.innerText = `Search results for "${query}"`;
}

// ================= CART SYSTEM =================
function addToCart(product, size = "M", color = "Default", variantImage = null, priceOverride = null) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  // Use a composite key to distinguish between different variants of the same product
  const variantKey = `${product.id}-${size}-${color}`;
  const existing = cart.find(item => item.variantKey === variantKey);

  if (existing) {
    existing.quantity += 1;
    if (variantImage) existing.image = variantImage;
    if (priceOverride) existing.price = priceOverride;
  } else {
    cart.push({
      variantKey: variantKey,
      id: product.id,
      name: product.name,
      price: priceOverride || product.price,
      image: variantImage || product.image,
      size: size,
      color: color,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast(`${product.name} (${size}, ${color}) added to cart!`);
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const countEl = document.getElementById("cartCount");
  if (countEl) {
    countEl.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);
  }
}

// ================= UTILITIES =================
function showToast(message) {
  // Check if snackbar/toast container exists
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text-primary);
      color: var(--bg-color);
      padding: 0.75rem 1.5rem;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      opacity: 0;
      transition: var(--transition);
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.innerText = message;
  toast.style.opacity = "1";
  toast.style.bottom = "3rem";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.bottom = "2rem";
  }, 3000);
}

async function initTracking() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await fetch(`${CONFIG.API_URL}/api/orders/my`, {
    headers: { "Authorization": token }
  });
  const orders = await res.json();

  if (orders.length > 0) {
    const latest = orders[0];
    if (latest.status !== "Delivered") {
      renderTrackingCard(latest);
    }
  }
}

function renderTrackingCard(order) {
  const container = document.getElementById("trackingSection");
  if (!container) return;

  const statuses = ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
  const currentIndex = statuses.indexOf(order.status);
  const progress = (currentIndex / (statuses.length - 1)) * 100;

  container.innerHTML = `
    <div class="tracking-card glass">
      <div class="tracking-header">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Latest Order:</span>
          <span style="font-weight: 700;">#${order.id.slice(0, 8)}</span>
        </div>
        <span class="tracking-status-badge">${order.status}</span>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCustomTheme();
  initTracking();
  updateCartCount();
  
  if (document.getElementById("categoryGrid")) {
    renderCategories();
  }
});