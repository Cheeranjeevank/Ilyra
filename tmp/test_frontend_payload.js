async function run() {
  try {
    const loginRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: "admin@ilyra.com", password: "admin123"})
    });
    const authData = await loginRes.json();
    
    // Simulate updating a product exactly as frontend does
    // Suppose we edit product 12
    const reqBody = {
      id: "12", // This is productId input
      name: "Updated Name",
      price: "199",
      original_price: "",
      description: "It's a great shirt",
      image: "",
      stock: null, // parsed from parseInt("")
      category: "Shirts",
      category_image: null,
      sizes: "M, L",
      colors: "Red",
      variants: [],
      size_prices: []
    };
    
    const updateRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/products/12", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", 
        "Authorization": authData.token
      },
      body: JSON.stringify(reqBody)
    });
    console.log("Status:", updateRes.status);
    const updateData = await updateRes.text();
    console.log("Response:", updateData);

  } catch(e) {
    console.error(e);
  }
}
run();
