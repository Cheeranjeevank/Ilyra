async function test() {
  const loginRes = await fetch("https://ilyra.onrender.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ilyra.com", password: "admin123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log("Got token:", !!token);

  const res = await fetch("https://ilyra.onrender.com/api/products/11", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      id: "11",
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
  console.log("PUT status:", res.status);
  console.log("PUT response:", await res.text());
}
test();
