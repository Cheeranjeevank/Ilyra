const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: "admin@ilyra.com", role: "admin" }, "ilyra_secret", { expiresIn: "1h" });

async function test() {
  const res = await fetch("http://localhost:5001/api/products/4fc1bba9-a67d-4d9a-a4d3-ead792bf6b6a", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      name: "Updated Test",
      price: "150",
      original_price: "",
      description: "",
      image: "http://example.com/img2.png",
      stock: 20,
      category: "",
      category_image: null,
      sizes: "",
      colors: "",
      variants: [],
      size_prices: []
    })
  });
  console.log(res.status, await res.text());
}
test();
