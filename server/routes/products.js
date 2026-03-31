const ProductController = require("../controllers/ProductController");

const router = require("express").Router();

// Get all products
router.get("/", ProductController.getAllProducts);

// Get product detail
router.get("/:id", ProductController.getProductById);

router.get("/categories", ProductController.getCategories);
router.get("/brands", ProductController.getBrands);

module.exports = router;
