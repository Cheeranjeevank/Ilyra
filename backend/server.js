require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendOrderEmail } = require("./emailService");

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));

// ======================
// DB CONNECTION (Support both local and cloud)
// ======================
const dbConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 5432),
    };

const pool = new Pool(dbConfig);

(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("DB Connected ✅");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `);
    console.log("Settings table verified/created ✅");

    // Add custom_image column to cart and order_items tables & is_customizable to products
    await pool.query(`
      ALTER TABLE cart ADD COLUMN IF NOT EXISTS custom_image TEXT;
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_image TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT false;
    `);
    console.log("Database schema migrated for custom t-shirts & product customization settings ✅");
  } catch (err) {
    console.error("DB ERROR ❌", err);
  }
})();

// ======================
// AUTH MIDDLEWARE
// ======================
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ======================
// AUTH ROUTES
// ======================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: false, message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)",
      [name, email, hashedPassword, "user"]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false });
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (match) {
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.json({ success: false });
  }
});

// ================= CATEGORIES API =================

app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories", message: err.message });
  }
});

app.post("/api/categories", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });
  
  const { name, image } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM categories WHERE name = $1", [name]);
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        "UPDATE categories SET image = $1 WHERE name = $2 RETURNING *",
        [image, name]
      );
    } else {
      result = await pool.query(
        "INSERT INTO categories (name, image) VALUES ($1, $2) RETURNING *",
        [name, image]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save category" });
  }
});

app.delete("/api/categories/:name", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });
  
  const { name } = req.params;
  try {
    await pool.query("DELETE FROM categories WHERE name = $1", [name]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// ================= PRODUCTS API ======================
app.get("/api/products", async (req, res) => {
  const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  res.json(result.rows);
});

// ADD PRODUCT (ADMIN)
app.post("/api/products", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const { name, price, image, stock, category, category_image, sizes, colors, description, original_price, variants, size_prices, is_customizable } = req.body;

  try {
    if (category && category_image) {
      const existing = await pool.query("SELECT * FROM categories WHERE name = $1", [category]);
      if (existing.rows.length > 0) {
        await pool.query("UPDATE categories SET image = $1 WHERE name = $2", [category_image, category]);
      } else {
        await pool.query("INSERT INTO categories (name, image) VALUES ($1, $2)", [category, category_image]);
      }
    }

    await pool.query(
      "INSERT INTO products (name, price, image, stock, category, sizes, colors, description, original_price, variants, size_prices, is_customizable) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [name, price, image, stock || 0, category || "", sizes || "", colors || "", description || "", original_price || null, variants ? JSON.stringify(variants) : '[]', size_prices ? JSON.stringify(size_prices) : '[]', !!is_customizable]
    );
    res.json({ success: true, message: "Product added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// UPDATE PRODUCT (ADMIN)
app.put("/api/products/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const { name, price, image, stock, category, category_image, sizes, colors, description, original_price, variants, size_prices, is_customizable } = req.body;

  try {
    if (category && category_image) {
      const existing = await pool.query("SELECT * FROM categories WHERE name = $1", [category]);
      if (existing.rows.length > 0) {
        await pool.query("UPDATE categories SET image = $1 WHERE name = $2", [category_image, category]);
      } else {
        await pool.query("INSERT INTO categories (name, image) VALUES ($1, $2)", [category, category_image]);
      }
    }

    await pool.query(
      `UPDATE products SET 
        name=$1, price=$2, image=$3, stock=$4, 
        category=$5, sizes=$6, colors=$7, 
        description=$8, original_price=$9, variants=$10, size_prices=$11,
        is_customizable=$12, updated_at=NOW() 
       WHERE id=$13`,
      [name, price, image, stock || 0, category || "", sizes || "", colors || "", description || "", original_price || null, variants ? JSON.stringify(variants) : '[]', size_prices ? JSON.stringify(size_prices) : '[]', !!is_customizable, req.params.id]
    );
    res.json({ success: true, message: "Product updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// DELETE PRODUCT (ADMIN)
app.delete("/api/products/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
// ======================
// CART
// ======================

app.get("/api/cart", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id as cart_id, product_id as id, name, price, quantity, image, size, color, custom_image FROM cart WHERE user_id=$1 ORDER BY created_at ASC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post("/api/cart", auth, async (req, res) => {
  try {
    const { id: product_id, name, price, quantity, image, size, color, custom_image } = req.body;
    
    // Check if item exists in cart with same size, color and custom_image
    let existing;
    if (custom_image) {
      existing = await pool.query(
        "SELECT id, quantity FROM cart WHERE user_id=$1 AND product_id=$2 AND size=$3 AND color=$4 AND custom_image=$5",
        [req.user.id, product_id, size || 'M', color || 'Default', custom_image]
      );
    } else {
      existing = await pool.query(
        "SELECT id, quantity FROM cart WHERE user_id=$1 AND product_id=$2 AND size=$3 AND color=$4 AND (custom_image IS NULL OR custom_image = '')",
        [req.user.id, product_id, size || 'M', color || 'Default']
      );
    }

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE cart SET quantity = quantity + $1 WHERE id=$2",
        [quantity, existing.rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart (user_id, product_id, name, price, quantity, image, size, color, custom_image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [req.user.id, product_id, name, price, quantity, image, size || 'M', color || 'Default', custom_image || null]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

app.put("/api/cart/:cart_id", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query("UPDATE cart SET quantity=$1 WHERE id=$2 AND user_id=$3", [quantity, req.params.cart_id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update cart" });
  }
});

app.delete("/api/cart/item/:cart_id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE id=$1 AND user_id=$2", [req.params.cart_id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete cart item" });
  }
});

app.delete("/api/cart", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE user_id=$1", [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// ======================
// ORDERS
// ======================

// PLACE ORDER
app.post("/api/orders", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, address, payment_id = null, razorpay_order_id = null, razorpay_signature = null, status: reqStatus = "Placed" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "No address provided" });
    }

    // ✅ VERIFY PAYMENT SIGNATURE BEFORE DB INSERTION
    if (payment_id && !payment_id.startsWith("sim_pay_")) {
      if (!isRazorpayConfigured) {
         return res.status(400).json({ success: false, message: "Razorpay is not configured on the server." });
      }
      if (!razorpay_signature || !razorpay_order_id) {
         return res.status(400).json({ success: false, message: "Missing Razorpay verification details." });
      }
      const body = razorpay_order_id + "|" + payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", rzpSecret)
        .update(body)
        .digest("hex");
      
      if (expectedSignature !== razorpay_signature) {
         return res.status(400).json({ success: false, message: "Invalid payment signature. Potential tampering detected." });
      }
    }

    await client.query("BEGIN");

    // 1️⃣ Recalculate total (trusting frontend variant price to match create-order)
    let total = 0;
    for (let item of items) {
      const pRes = await client.query("SELECT price, stock FROM products WHERE id=$1", [item.id]);
      if (pRes.rows.length === 0) {
        throw new Error(`Product not found: ${item.name}`);
      }
      if (pRes.rows[0].stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${item.name}`);
      }
      total += Number(item.price || 0) * Number(item.quantity || 1);
    }

    // 2️⃣ Create order
    const paymentStatus = payment_id ? "paid" : "unpaid";
    
    const orderRes = await client.query(
      "INSERT INTO orders (user_id, total, status, payment_id, payment_status, razorpay_order_id, customer_name, phone, shipping_address, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [
        req.user.id,
        total,
        reqStatus,
        payment_id,
        paymentStatus,
        razorpay_order_id,
        address.name,
        address.phone,
        address.address + ", " + address.city + " - " + address.pincode,
        new Date()
      ]
    );

    const orderId = orderRes.rows[0].id;

    // 3️⃣ Link payment to order if it exists
    if (payment_id) {
        await client.query(
            "UPDATE payments SET order_id = $1, status = 'captured' WHERE razorpay_payment_id = $2",
            [orderId, payment_id]
        );
    }

    // 4️⃣ insert items and deduct stock
    for (let item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, name, price, quantity, image, custom_image) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [orderId, item.id, item.name, item.price, item.quantity, item.image, item.custom_image || null]
      );

      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.id]
      );
    }

    // Fetch user's registered email if not supplied in shipping address
    let userEmail = address.email;
    if (!userEmail) {
      const uRes = await client.query("SELECT email FROM users WHERE id=$1", [req.user.id]);
      if (uRes.rows.length > 0) {
        userEmail = uRes.rows[0].email;
      }
    }

    await client.query("COMMIT");

    // Trigger order confirmation email asynchronously
    if (userEmail) {
      sendOrderEmail(userEmail, orderRes.rows[0], items, address).catch((emailErr) => {
        console.error("Failed to send order email asynchronously:", emailErr);
      });
    }

    res.json({ success: true, orderId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// USER ORDERS
app.get("/api/orders/my", auth, async (req, res) => {
  const result = await pool.query(
    `SELECT orders.*, 
      (SELECT json_agg(json_build_object('id', oi.id, 'name', oi.name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image, 'custom_image', oi.custom_image)) 
       FROM order_items oi WHERE oi.order_id = orders.id) as items 
     FROM orders WHERE user_id=$1 ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
});

// ADMIN: ALL ORDERS
app.get("/api/orders", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const result = await pool.query(
    `SELECT orders.*, 
      (SELECT json_agg(json_build_object('id', oi.id, 'name', oi.name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image, 'custom_image', oi.custom_image)) 
       FROM order_items oi WHERE oi.order_id = orders.id) as items 
     FROM orders ORDER BY created_at DESC`
  );

  res.json(result.rows);
});

// ADMIN: DASHBOARD STATS
app.get("/api/admin/stats", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const stats = {};

    // 1. Total Products & Stock
    const productStats = await pool.query("SELECT COUNT(*) as count, SUM(stock) as stock FROM products");
    stats.totalProducts = parseInt(productStats.rows[0].count);
    stats.totalStock = parseInt(productStats.rows[0].stock) || 0;

    // 2. Orders Stats
    const orderStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Delivered') as completed,
        SUM(total) FILTER (WHERE payment_status = 'paid') as revenue
      FROM orders
    `);
    stats.ordersReceived = parseInt(orderStats.rows[0].total);
    stats.ordersCompleted = parseInt(orderStats.rows[0].completed);
    stats.totalRevenue = parseFloat(orderStats.rows[0].revenue) || 0;

    // 3. Products Sold
    const soldStats = await pool.query("SELECT SUM(quantity) as sold FROM order_items");
    stats.productsSold = parseInt(soldStats.rows[0].sold) || 0;

    // 4. Total Users
    const userStats = await pool.query("SELECT COUNT(*) as count FROM users");
    stats.totalUsers = parseInt(userStats.rows[0].count);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// MARK PAID
app.post("/api/orders/:id/mark-paid", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const order_id = req.params.id;

  try {
    // 1. Fetch order details
    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [order_id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Update payment_status = "paid"
    await pool.query(
      "UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2",
      ["paid", order_id]
    );

    res.json({
      success: true,
      message: "Order marked as paid"
    });

  } catch (err) {
    console.error("Mark Paid Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE ORDER STATUS (Generic)
app.put("/api/orders/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const { status, payment_status, order_code, customer_name, phone, address } = req.body;
  const order_id = req.params.id;

  try {
    // 1. Prepare the update query
    let updateFields = [];
    let queryParams = [];
    let counter = 1;

    if (status) { updateFields.push(`status = $${counter++}`); queryParams.push(status); }
    if (payment_status) { updateFields.push(`payment_status = $${counter++}`); queryParams.push(payment_status); }
    if (order_code) { updateFields.push(`order_code = $${counter++}`); queryParams.push(order_code); }
    if (customer_name) { updateFields.push(`customer_name = $${counter++}`); queryParams.push(customer_name); }
    if (phone) { updateFields.push(`phone = $${counter++}`); queryParams.push(phone); }
    if (address) { updateFields.push(`shipping_address = $${counter++}`); queryParams.push(address); }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      queryParams.push(order_id);
      await pool.query(
        `UPDATE orders SET ${updateFields.join(", ")} WHERE id = $${counter}`,
        queryParams
      );
    }

    // NOTE: Automated fulfilment logic removed from generic PUT to avoid double-processing. 
    // Admin should use the dedicated /mark-paid endpoint or /fulfill endpoint.

    res.json({ message: "Updated" });

  } catch (err) {
    console.error("Order update error:", err.message);
    res.status(500).json({ message: "Server error during update" });
  }
});


// ======================
// SETTINGS API
// ======================
app.get("/api/settings/:key", async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = $1", [req.params.key]);
    if (result.rows.length > 0) {
      res.json({ value: result.rows[0].value });
    } else {
      res.json({ value: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch setting", message: err.message });
  }
});

app.post("/api/settings/:key", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });
  const { value } = req.body;
  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [req.params.key, value]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save setting", message: err.message });
  }
});

// ======================
// ROOT
// ======================
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// ======================
// USERS (ADMIN)
// ======================
app.get("/api/users", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const result = await pool.query("SELECT id, name, email, role FROM users");
  res.json(result.rows);
});

app.delete("/api/users/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.json({ message: "User deleted" });
});

// ======================
// PAYMENT ROUTES
// ======================

const rzpKey = process.env.RAZORPAY_KEY || process.env.RAZORPAY_KEY_ID;
const rzpSecret = process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = rzpKey && rzpSecret && rzpKey !== "rzp_test_placeholder";

const razorpay = isRazorpayConfigured ? new Razorpay({
  key_id: rzpKey,
  key_secret: rzpSecret
}) : null;

app.get("/api/payment/key", (req, res) => {
  res.json({ key: rzpKey || "rzp_test_placeholder" });
});

app.post("/api/payment/create-order", auth, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Calculate total from items array (trusting frontend variant price)
    let calculatedTotal = 0;
    for (let item of items) {
      calculatedTotal += Number(item.price || 0) * Number(item.quantity || 1);
    }

    if (!isRazorpayConfigured) {
      // ✅ SIMULATED ORDER FOR DEV MODE
      return res.json({
        id: "sim_order_" + Date.now(),
        amount: calculatedTotal * 100,
        currency: "INR",
        notes: { mode: "simulated" }
      });
    }

    const options = {
      amount: calculatedTotal * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);
    res.json(order);

  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    res.status(500).json({ error: "Could not create payment order" });
  }
});

app.post("/api/payment/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    } = req.body;

    let isValid = false;

    if (!isRazorpayConfigured) {
      // ✅ SIMULATED VERIFICATION
      isValid = razorpay_payment_id.startsWith("sim_pay_");
    } else {
      // ✅ LIVE HMCA VERIFICATION
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", rzpSecret)
        .update(body)
        .digest("hex");
      isValid = expectedSignature === razorpay_signature;
    }

    if (isValid) {
      // ✅ STORE PAYMENT IN DB
      await pool.query(
        `INSERT INTO payments 
        (user_id, razorpay_order_id, razorpay_payment_id, amount, status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          req.user.id,
          razorpay_order_id,
          razorpay_payment_id,
          amount || 0,
          "paid",
          new Date()
        ]
      );
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

  } catch (err) {
    console.error("Payment Verify Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});