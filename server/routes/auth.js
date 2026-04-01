const AuthController = require("../controllers/AuthController");

const router = require("express").Router();

// Register
router.post("/register", AuthController.register);

// Login
router.post("/login", AuthController.login);

// Google login
router.post("/google-login", AuthController.googleLogin);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

module.exports = router;
