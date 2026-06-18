require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

const products = [
  // T-Shirts
  { 
    name: "Essential Cotton Tee", 
    price: 999, 
    category: "T-Shirts", 
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", 
    stock: 100,
    sizes: "S,M,L,XL,XXL",
    colors: JSON.stringify([
      { name: "White", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" },
      { name: "Black", hex: "#000000", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" },
      { name: "Navy", hex: "#000080", image: "https://images.unsplash.com/photo-1581655353564-df123a1ec43f?auto=format&fit=crop&w=800&q=80" }
    ])
  },
  { 
    name: "Graphic Streetwear Tee", 
    price: 1499, 
    category: "T-Shirts", 
    image: "https://images.unsplash.com/photo-1576566580648-47a2754972e0?auto=format&fit=crop&w=800&q=80", 
    stock: 45,
    sizes: "M,L,XL",
    colors: JSON.stringify([
      { name: "Black", hex: "#000000", image: "https://images.unsplash.com/photo-1576566580648-47a2754972e0?auto=format&fit=crop&w=800&q=80" },
      { name: "Grey", hex: "#808080", image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80" }
    ])
  },
  
  // Outerwear
  { 
    name: "Classic Denim Jacket", 
    price: 3999, 
    category: "Outerwear", 
    image: "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?auto=format&fit=crop&w=800&q=80", 
    stock: 20,
    sizes: "S,M,L",
    colors: JSON.stringify([
      { name: "Classic Blue", hex: "#4682B4", image: "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?auto=format&fit=crop&w=800&q=80" },
      { name: "Black Denim", hex: "#1a1a1a", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }
    ])
  },
  { 
    name: "Premium Leather Biker Jacket", 
    price: 8999, 
    category: "Outerwear", 
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80", 
    stock: 10,
    sizes: "M,L,XL",
    colors: JSON.stringify([
      { name: "Obsidian", hex: "#111111", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" }
    ])
  },

  // Formal Wear
  { 
    name: "Crisp White Oxford Shirt", 
    price: 2499, 
    category: "Formal Wear", 
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&w=800&q=80", 
    stock: 40,
    sizes: "S,M,L,XL",
    colors: JSON.stringify([
      { name: "Pure White", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&w=800&q=80" },
      { name: "Light Blue", hex: "#ADDFE3", image: "https://images.unsplash.com/photo-1603251578711-3290ca1a0187?auto=format&fit=crop&w=800&q=80" }
    ])
  }
];

async function seed() {
  try {
    console.log("Cleaning products table...");
    await pool.query("DELETE FROM products");
    
    console.log("Seeding clothing products...");
    for (const p of products) {
      await pool.query(
        "INSERT INTO products (name, price, image, stock, category, sizes, colors) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [p.name, p.price, p.image, p.stock, p.category, p.sizes || "S,M,L,XL", p.colors || "[]"]
      );
    }
    console.log("Clothing seeding complete! ✅");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}


seed();
