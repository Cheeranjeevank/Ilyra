# ILYRA - E-Commerce Platform

![ILYRA Banner](https://via.placeholder.com/1200x300?text=ILYRA+E-Commerce) <!-- Replace with an actual banner if available -->

ILYRA is a modern, responsive e-commerce web application built with Vanilla JavaScript, Node.js, Express, and PostgreSQL. It features a fully-functional customer storefront for browsing and purchasing products, and a secure admin dashboard for managing inventory, product variants, and analytics.

**Live Frontend:** [https://ilyraa.netlify.app](https://ilyraa.netlify.app)  
**Live Backend API:** [https://ilyra.onrender.com](https://ilyra.onrender.com)  

---

## 🌟 Features

### For Customers
- **Product Catalog:** Browse products with beautiful, responsive UI.
- **Product Variants:** View and select dynamic pricing based on specific sizes and colors.
- **Shopping Cart:** Add, update, and remove items with real-time price calculation.
- **User Authentication:** Secure registration and login.
- **Checkout Flow:** Submit and track orders (simulated payment flow).
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop viewing.

### For Administrators
- **Admin Dashboard:** Access analytics, recent orders, and quick stats (Chart.js integration).
- **Product Management:** Add, edit, and delete products easily.
- **Variant Control:** Specify exact stock, sizes, custom prices for sizes, and colors directly from the dashboard.
- **Image Handling:** Seamlessly upload and sync product images to the database via base64 encoding.
- **Order Tracking:** Manage customer orders and tracking details.
- **Secure Access:** Protected by JWT (JSON Web Tokens) to ensure only authorized administrators can modify inventory.

---

## 🚀 Tech Stack

### Frontend
- **HTML5 & CSS3** (Vanilla CSS variables for easy theming and dark mode readiness)
- **Vanilla JavaScript** (No heavy frontend frameworks)
- **Chart.js** (For Admin Dashboard Analytics)
- Hosted on **Netlify**

### Backend
- **Node.js & Express.js** (REST API)
- **PostgreSQL** (Relational Database, hosted on **Neon DB**)
- **bcryptjs** (Password Hashing)
- **jsonwebtoken (JWT)** (Authentication & Authorization)
- Hosted on **Render**

---

## 🛠️ Local Development Setup

To run ILYRA locally on your machine, follow these steps:

### Prerequisites
- Node.js (v16+)
- PostgreSQL (Local or Cloud instance)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/Cheeranjeevank/Ilyra.git
cd Ilyra
```

### 2. Setup the Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with your database credentials:
```env
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=ilyra
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_secret_key_here
PORT=5001
```

Start the backend server:
```bash
npm start
# Server will run on http://localhost:5001
```

### 3. Setup the Frontend
The frontend requires no build steps because it uses Vanilla JavaScript! Simply serve the `frontend` folder using any static file server.

For example, using `serve` or VS Code Live Server:
```bash
npx serve frontend
```

_Note: If you run it locally, make sure the `API_URL` in `frontend/js/app.js` is set to `http://localhost:5001`._

---

## 🗄️ Database Schema

The PostgreSQL database uses the following core tables:
- `users`: Manages customer and admin accounts, stores hashed passwords.
- `products`: Stores product details (`name`, `price`, `stock`, `description`, `original_price`, `variants`, `size_prices`, etc.).
- `cart`: Associates user IDs with product IDs and quantities.
- `orders`: Tracks user orders, total prices, and shipping status.
- `order_items`: Maps individual products to their respective orders.
- `categories`: Stores dynamic category images and details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/Cheeranjeevank/Ilyra/issues).

---

## 📝 License

This project is open-source and available under the MIT License.