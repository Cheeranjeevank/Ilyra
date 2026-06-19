async function run() {
  const loginRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email: "test_checkout@test.com", password: "password"})
  });
  const data = await loginRes.json();
  console.log("Login:", data);
  if (data.token) {
    const productsRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/products");
    const products = await productsRes.json();
    const pid = products[0].id;
    console.log("Product ID:", pid);
    
    const orderRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/orders", {
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": data.token},
      body: JSON.stringify({
        items: [{id: pid, name: "Test Product", price: 100, quantity: 1, image: ""}],
        address: {name: "Test", phone: "123", address: "123", city: "Test", pincode: "123"},
        status: "placed",
        payment_status: "pending_payment"
      })
    });
    console.log("Order Res:", await orderRes.text());
  }
}
run();
