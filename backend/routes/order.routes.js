const router = require("express").Router();

const {
  placeOrder,
  getUserOrders,
  getAllOrders,
  createPayment,
  verifyPayment
} = require("../controllers/order.controller");

const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");

router.post("/", auth, placeOrder);
router.get("/my", auth, getUserOrders);
router.get("/", auth, admin, getAllOrders);

router.post("/create-payment", createPayment);
router.post("/verify-payment", verifyPayment);

module.exports = router;