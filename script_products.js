if (!localStorage.getItem("token")) {
  window.location.href = "admin-login.html";
}

document.getElementById("imageFile").addEventListener("change", function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      productImageBase64 = e.target.result;
      const preview = document.getElementById("preview");
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    productImageBase64 = null;
    const preview = document.getElementById("preview");
    preview.src = "";
    preview.style.display = "none";
  }
});

let products = [];
let chartInstance = null;
let editingId = null;
let currentVariants = [];
let currentSizeVariants = [];
let categoryImageBase64 = null;
let productImageBase64 = null;

document.getElementById("categoryImageFile").addEventListener("change", function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      categoryImageBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    categoryImageBase64 = null;
  }
});

function addVariant() {
  const colorInput = document.getElementById("newVariantColor");
  const fileInput = document.getElementById("newVariantImage");
  
  if (!colorInput.value) {
    showToast("Please enter a color name");
    return;
  }
  
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      currentVariants.push({ color: colorInput.value, image: e.target.result });
      colorInput.value = "";
      fileInput.value = "";
      renderVariants();
    };
    reader.readAsDataURL(file);
  } else {
    currentVariants.push({ color: colorInput.value, image: null });
    colorInput.value = "";
    renderVariants();
  }
}

function removeVariant(index) {
  currentVariants.splice(index, 1);
  renderVariants();
}

function addSizeVariant() {
  const sizeInput = document.getElementById("newSizeName");
  const priceInput = document.getElementById("newSizePrice");
  const originalPriceInput = document.getElementById("newSizeOriginalPrice");
  
  if (!sizeInput.value) {
    showToast("Please enter a size");
    return;
  }
  
  currentSizeVariants.push({
    size: sizeInput.value,
    price: priceInput.value ? parseFloat(priceInput.value) : null,
    original_price: originalPriceInput.value ? parseFloat(originalPriceInput.value) : null
  });
  
  sizeInput.value = "";
  priceInput.value = "";
  originalPriceInput.value = "";
  renderSizeVariants();
}

function removeSizeVariant(index) {
  currentSizeVariants.splice(index, 1);
  renderSizeVariants();
}

function renderSizeVariants() {
  const container = document.getElementById("sizeVariantsContainer");
  container.innerHTML = currentSizeVariants.map((v, i) => `
    <div style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-color); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: var(--border-radius-sm);">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="font-weight: 600;">${v.size}</span>
        <span style="color: var(--accent-color);">₹${v.price || "Default"}</span>
        <span style="color: var(--text-muted); text-decoration: line-through;">${v.original_price ? '₹'+v.original_price : ''}</span>
      </div>
      <button class="btn btn-secondary" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;" onclick="removeSizeVariant(${i})">Remove</button>
    </div>
  `).join("");
}

function renderVariants() {
  const container = document.getElementById("variantsContainer");
  container.innerHTML = currentVariants.map((v, i) => `
    <div style="display: flex; align-items: center; justify-content: space-between; background: var(--surface-color); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: var(--border-radius-sm);">
      <div style="display: flex; align-items: center; gap: 1rem;">
        ${v.image ? `<img src="${v.image}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">` : `<div style="width:40px; height:40px; background:#ddd; border-radius:4px;"></div>`}
        <span style="font-weight: 600;">${v.color}</span>
      </div>
      <button class="btn btn-secondary" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;" onclick="removeVariant(${i})">Remove</button>
    </div>
  `).join("");
}

async function loadProducts() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/api/products`);
    products = await res.json();
    renderProducts();
    renderAnalytics();
  } catch (err) {
    console.warn("Live sync failed, retrying...");
  }
}

// Start Live Polling
setInterval(loadProducts, 5000);

function renderProducts() {
  const container = document.getElementById("productList");
  container.innerHTML = "";

  products.forEach(p => {
    const isLowStock = p.stock < 10;
    const badgeClass = p.stock === 0 ? 'badge-danger' : (isLowStock ? 'badge-warning' : 'badge-success');
    const badgeText = p.stock === 0 ? 'Out of Stock' : (isLowStock ? `Low Stock (${p.stock})` : `In Stock (${p.stock})`);

    container.innerHTML += `
      <div class="card fade-in" style="${isLowStock ? 'border-color: #f59e0b;' : ''}">
        <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p style="color: var(--accent-color); font-weight: 700;">₹${p.price}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="badge ${badgeClass}">${badgeText}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${p.category}</span>
        </div>
        ${p.original_price ? `<p style="color: var(--text-muted); font-size: 0.8rem; text-decoration: line-through;">MRP: ₹${p.original_price}</p>` : ''}
        
        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button class="btn btn-secondary" style="flex: 1; font-size: 0.875rem;" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Edit</button>
          <button class="btn btn-secondary" style="flex: 1; font-size: 0.875rem; border-color: #ef4444; color: #ef4444;" onclick="deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

function editProduct(p) {
  editingId = p.id;
  document.getElementById("formTitle").innerText = "Edit Product: " + p.name;
  document.getElementById("submitBtn").innerText = "Update Product";
  document.getElementById("cancelBtn").style.display = "block";

  document.getElementById("productId").value = p.id;
  document.getElementById("productId").disabled = true; // Cannot edit the Primary Key
  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("original_price").value = p.original_price || "";
  document.getElementById("description").value = p.description || "";
  document.getElementById("category").value = p.category || "";
  document.getElementById("stock").value = p.stock || 0;
  
  currentVariants = Array.isArray(p.variants) ? [...p.variants] : [];
  currentSizeVariants = Array.isArray(p.size_prices) ? [...p.size_prices] : [];
  if (currentSizeVariants.length === 0 && p.sizes) {
    // Fallback for old products
    currentSizeVariants = p.sizes.split(",").map(s => ({ size: s.trim(), price: null, original_price: null })).filter(s => s.size);
  }

  renderVariants();
  renderSizeVariants();
  
  const preview = document.getElementById("preview");
  if (p.image) {
    productImageBase64 = p.image;
    preview.src = p.image;
    preview.style.display = "block";
  } else {
    productImageBase64 = null;
    preview.src = "";
    preview.style.display = "none";
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingId = null;
  document.getElementById("formTitle").innerText = "Add New Product";
  document.getElementById("submitBtn").innerText = "Add Product";
  document.getElementById("cancelBtn").style.display = "none";

  document.getElementById("productId").value = "";
  document.getElementById("productId").disabled = false;
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("original_price").value = "";
  document.getElementById("description").value = "";
  document.getElementById("category").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("categoryImageFile").value = "";
  document.getElementById("imageFile").value = "";
  document.getElementById("preview").style.display = "none";
  categoryImageBase64 = null;
  productImageBase64 = null;
  currentVariants = [];
  currentSizeVariants = [];
  renderVariants();
  renderSizeVariants();
}

async function saveProduct() {
  const token = localStorage.getItem("token");
  const productId = document.getElementById("productId").value;
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const original_price = document.getElementById("original_price").value;
  const description = document.getElementById("description").value;
  const stock = document.getElementById("stock").value;
  const category = document.getElementById("category").value;
  
  const sizes = currentSizeVariants.map(v => v.size).join(", ");
  const colors = currentVariants.map(v => v.color).join(", ");
  const previewImg = productImageBase64 || "";

  if (!productId || !name || !price) {
    showToast("Please provide at least a Product ID, Name, and Price.");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = "Saving...";

  const url = editingId 
    ? `${CONFIG.API_URL}/api/products/${editingId}`
    : `${CONFIG.API_URL}/api/products`;
  
  const method = editingId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({ 
        id: productId, name, price, original_price, description, 
        image: previewImg, stock: parseInt(stock), 
        category, category_image: categoryImageBase64,
        sizes, colors, variants: currentVariants,
        size_prices: currentSizeVariants
      })
    });

    if (res.ok) {
      showToast(editingId ? "Product updated successfully!" : "Product added successfully!");
      cancelEdit();
      loadProducts();
    } else {
      showToast("Error saving product.");
    }
  } catch (err) {
    console.error("Save product error:", err);
    showToast("Error saving product.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = editingId ? "Update Product" : "Add Product";
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${CONFIG.API_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: { "Authorization": token }
    });
    if (res.ok) {
      showToast("Product deleted safely.");
      loadProducts();
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to delete product.");
  }
}

function renderAnalytics() {
  const canvas = document.getElementById("productChart");
  if (!canvas) return;

  if (chartInstance) chartInstance.destroy();

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

  chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: products.map(p => p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name),
      datasets: [{ 
        label: "Current Stock", 
        data: products.map(p => p.stock),
        backgroundColor: "rgba(79, 70, 229, 0.6)",
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}


loadProducts();
