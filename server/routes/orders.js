const OrderController = require("../controllers/OrderController");

const router = require("express").Router();

// Checkout (create order from cart)
router.post("/checkout", OrderController.checkout);

router.post("/:id/pay", OrderController.payOrder);

// Get all orders for logged-in user
router.get("/", OrderController.getOrders);

// Get order detail
router.get("/:id", OrderController.getOrderById);

// Cancel order
router.patch("/:id/cancel", OrderController.cancelOrder);

module.exports = router;
