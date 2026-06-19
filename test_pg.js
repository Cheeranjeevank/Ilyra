const { Pool } = require('./backend/node_modules/pg');

(async () => {
  const pool = new Pool({ connectionString: "postgresql://cheeranjeevan.k@localhost/ilyra" });
  try {
    const id = "1";
    const name = "Women With Stanley Cup T Shirt";
    const price = "499.00";
    const original_price = "999.00";
    const description = "Stay stylish and sporty with this trendy graphic tee featuring a woman with a Stanley Cup design. Made from soft, breathable fabric for all-day comfort, it's perfect for casual outings, coffee runs, and everyday wear.";
    const image = "";
    const stock = 500;
    const category = "";
    const sizes = "XS, S, M, L, XL, 2XL";
    const colors = "White, Black";
    const variants = [];
    const size_prices = [];

    await pool.query(
      `UPDATE products SET 
        name=$1, price=$2, image=$3, stock=$4, 
        category=$5, sizes=$6, colors=$7, 
        description=$8, original_price=$9, variants=$10, size_prices=$11,
        updated_at=NOW() 
       WHERE id=$12`,
      [name, price, image, stock, category, sizes, colors, description || "", original_price || null, variants ? JSON.stringify(variants) : '[]', size_prices ? JSON.stringify(size_prices) : '[]', id]
    );
    console.log("SUCCESS");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
})();
