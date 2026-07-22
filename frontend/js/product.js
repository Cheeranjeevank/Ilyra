async function loadProducts() {
    const res = await fetch(`${CONFIG.API_URL}/api/products`);
    const products = await res.json();
  
    const container = document.getElementById("products");
    container.innerHTML = "";
  
    products.forEach(p => {
      container.innerHTML += `
        <div class="card glass">
          <img src="${p.image}" />
          <h3>${p.name}</h3>
          <p>₹${p.price}</p>
  
          ${p.stock === 0 ? `
            <button class="btn" style="background:red;">Out of Stock</button>
          ` : `
            <button class="btn" onclick="viewProduct(${p.id})">
              View
            </button>
          `}
        </div>
      `;
    });
  }
  
  function viewProduct(id){
  localStorage.setItem("selectedProductId", id);
  window.location.href = "product.html?id=" + id;
}
  
  loadProducts();