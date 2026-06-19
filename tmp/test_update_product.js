async function run() {
  try {
    const loginRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: "admin@ilyra.com", password: "admin123"})
    });
    const authData = await loginRes.json();
    
    if (authData.token) {
      console.log("Logged in!");
      const reqBody = {
        name: "Test Update",
        price: "99",
        image: "",
        stock: 10,
        category: "Test",
        description: "",
        original_price: "199",
        variants: [],
        size_prices: []
      };
      
      const updateRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/products/12", {
        method: "PUT",
        headers: {"Content-Type": "application/json", "Authorization": authData.token},
        body: JSON.stringify(reqBody)
      });
      const updateData = await updateRes.text();
      console.log("Update response:", updateData);
    } else {
      console.log("Login failed", authData);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
