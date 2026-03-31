const OrderController = require("../controllers/OrderController");

const router = require("express").Router();

// Checkout (create order from cart)
router.post("/checkout", OrderController.checkout);

// Get all orders for logged-in user
router.get("/", OrderController.getOrders);

// Get order detail
router.get("/:id", OrderController.getOrderById);
router.post("/:id/payment", OrderController.getSnapToken);
module.exports = router;
