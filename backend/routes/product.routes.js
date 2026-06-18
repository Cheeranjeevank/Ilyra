const router = require("express").Router();

const {
  createProduct,
  getProducts,
  deleteProduct
} = require("../controllers/product.controller");

const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");

router.get("/", getProducts);
router.post("/", auth, admin, createProduct);
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;