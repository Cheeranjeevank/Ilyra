const jwt = require('./backend/node_modules/jsonwebtoken');

(async () => {
  const token = jwt.sign({ id: 1, email: "admin@ilyra.com", role: "admin" }, "ilyra_secret", { expiresIn: "1h" });

  const res = await fetch(`http://localhost:5001/api/products/1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ 
      id: "1",
      name: "Women With Stanley Cup T Shirt",
      price: "499.00",
      original_price: "999.00",
      description: "Stay stylish and sporty with this trendy graphic tee featuring a woman with a Stanley Cup design. Made from soft, breathable fabric for all-day comfort, it's perfect for casual outings, coffee runs, and everyday wear.",
      image: "",
      stock: 500,
      category: "",
      category_image: null,
      sizes: "XS, S, M, L, XL, 2XL",
      colors: "White, Black",
      variants: [],
      size_prices: []
    })
  });
  
  console.log(res.status, await res.text());
  process.exit(0);
})();
