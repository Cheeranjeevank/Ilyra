const bcrypt = require('./backend/node_modules/bcryptjs');
const { Pool } = require('./backend/node_modules/pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_yJrLueMzt63m@ep-bitter-mud-ao1usizn.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" });

(async () => {
  const hash = await bcrypt.hash("admin123", 10);
  await pool.query("UPDATE users SET password=$1 WHERE email='admin@ilyra.com'", [hash]);
  console.log("Password updated");
  process.exit(0);
})();
