const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_yJrLueMzt63m@ep-bitter-mud-ao1usizn.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  await client.connect();
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  
  try {
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin', 'admin@ilyra.com', hash, 'admin']);
    console.log("Admin seeded successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

seedAdmin();
