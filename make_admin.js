const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_yJrLueMzt63m@ep-bitter-mud-ao1usizn.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" });

(async () => {
  await pool.query("INSERT INTO users (name, email, password, role) VALUES ('cheeru', 'cheeru@ilyra.com', '$2b$10$wO0Hn3P7nS6R2h4X6H2O/eVJ7p5r8q3n7R5j4x6G5V3m5n4b2a0Gq', 'admin') ON CONFLICT (email) DO UPDATE SET role='admin'");
  console.log("Admin created");
  process.exit(0);
})();
