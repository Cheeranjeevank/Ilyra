async function run() {
  try {
    const loginRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: "admin@ilyra.com", password: "admin123"})
    });
    const authData = await loginRes.json();
    const token = authData.token;

    // Add Product
    const addRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/products", {
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": token},
      body: JSON.stringify({
        id: "SHOULD-BE-IGNORED",
        name: "New Product",
        price: 99,
        original_price: "",
        description: "Test Desc",
        image: "",
        stock: 5,
        category: "Test Cat",
        category_image: null,
        sizes: "",
        colors: "",
        variants: [],
        size_prices: []
      })
    });
    const addData = await addRes.text();
    console.log("Add:", addData);

  } catch(e) {
    console.error(e);
  }
}
run();
