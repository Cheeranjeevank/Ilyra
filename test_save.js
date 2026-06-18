const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: "admin@ilyra.com", role: "admin" }, "ilyra_secret", { expiresIn: "1h" });

async function test() {
  const res = await fetch("http://localhost:5001/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      id: "ILY-TEST-123",
      name: "Test",
      price: "100",
      original_price: "",
      description: "",
      image: "http://example.com/img.png",
      stock: 10,
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
