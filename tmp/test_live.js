async function run() {
  try {
    const loginRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: "admin@ilyra.com", password: "admin123"})
    });
    const authData = await loginRes.json();
    
    const getRes = await fetch("https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/products");
    const products = await getRes.json();
    const product = products[0]; // Take the first product
    
    console.log("Updating product:", product.id);

    const updateRes = await fetch(`https://eskkhytjfxgeddwmxqcn.supabase.co/functions/v1/api/products/${product.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", 
        "Authorization": authData.token
      },
      body: JSON.stringify({
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price || "",
        description: product.description || "",
        image: product.image || "",
        stock: parseInt(product.stock || "0"),
        category: product.category || "",
        category_image: null,
        sizes: product.sizes || "",
        colors: product.colors || "",
        variants: product.variants || [],
        size_prices: product.size_prices || []
      })
    });
    
    console.log("Status:", updateRes.status);
    const updateData = await updateRes.text();
    console.log("Response:", updateData);

  } catch(e) {
    console.error(e);
  }
}
run();
