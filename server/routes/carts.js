const CartController = require("../controllers/CartController");
const authorization = require("../middlewares/authorization");

const router = require("express").Router();

// Get all cart items
router.get("/", CartController.getCart);

// Add to cart
router.post("/", CartController.addToCart);

// Update cart item (need ownership check)
router.put("/:id", authorization, CartController.updateCart);

// Delete cart item (need ownership check)
router.delete("/:id", authorization, CartController.deleteCart);

module.exports = router;
