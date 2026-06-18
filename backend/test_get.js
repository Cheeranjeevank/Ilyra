const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_yJrLueMzt63m@ep-bitter-mud-ao1usizn.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" });
pool.query('SELECT variants FROM products LIMIT 1').then(res => {
  console.log(typeof res.rows[0].variants, Array.isArray(res.rows[0].variants));
  console.log(res.rows[0].variants);
  process.exit(0);
});
