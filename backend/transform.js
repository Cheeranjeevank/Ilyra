const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// Remove dotenv
code = code.replace(/require\("dotenv"\)\.config\(\);\n?/g, '');

// Transform requires to imports
code = code.replace(/const express = require\("express"\);/g, 'import express from "npm:express@4.18.2";');
code = code.replace(/const cors = require\("cors"\);/g, 'import cors from "npm:cors@2.8.5";');
code = code.replace(/const \{ Pool \} = require\("pg"\);/g, 'import pg from "npm:pg@8.11.3";\nconst { Pool } = pg;');
code = code.replace(/const bcrypt = require\("bcrypt"\);/g, 'import bcrypt from "npm:bcryptjs@2.4.3";');
code = code.replace(/const jwt = require\("jsonwebtoken"\);/g, 'import jwt from "npm:jsonwebtoken@9.0.2";');
code = code.replace(/const Razorpay = require\("razorpay"\);/g, 'import Razorpay from "npm:razorpay@2.9.2";');
code = code.replace(/const crypto = require\("crypto"\);/g, 'import crypto from "node:crypto";');

// Transform process.env
code = code.replace(/process\.env/g, 'Deno.env.toObject()');

// Transform app.listen
code = code.replace(/const PORT = Deno\.env\.toObject\(\)\.PORT \|\| 5001;\napp\.listen\(PORT, \(\) => \{\n  console\.log\(`Server running on port \$\{PORT\} 🚀`\);\n\}\);/g, 'Deno.serve(app);');
code = code.replace(/const PORT = Deno\.env\.toObject\(\)\.PORT \|\| 5001;\s+app\.listen\(PORT, \(\) => \{\s+console\.log\(`Server running on port \$\{PORT\} 🚀`\);\s+\}\);/g, 'Deno.serve(app);');

fs.writeFileSync('supabase/functions/api/index.ts', code);
console.log("Transformed!");
