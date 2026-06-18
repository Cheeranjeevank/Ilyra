const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_yJrLueMzt63m@ep-bitter-mud-ao1usizn.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  await client.connect();
  console.log("Connected to Neon DB for migration...");

  try {
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Migration successful: Added description, original_price, and variants to products table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
