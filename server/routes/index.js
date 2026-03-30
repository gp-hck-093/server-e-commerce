const router = require("express").Router();

const authentication = require("../middlewares/authentication");

const authRoutes = require("./auth");
const productsRoutes = require("./products");
const cartsRoutes = require("./carts");
const ordersRoutes = require("./orders");
const OrderController = require("../controllers/OrderController");

// PUBLIC ROUTES
router.use("/auth", authRoutes);
router.use("/products", productsRoutes);

// Midtrans webhook
router.post("/orders/webhook", OrderController.midtransWebhook);

// PROTECTED ROUTES (everything below requires login)
router.use(authentication);

router.use("/carts", cartsRoutes);
router.use("/orders", ordersRoutes);

module.exports = router;
