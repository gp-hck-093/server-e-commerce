const AuthController = require("../controllers/AuthController");
const router = require("express").Router();

const upload = require("../middlewares/upload");
const authentication = require("../middlewares/authentication");

// PUBLIC
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google-login", AuthController.googleLogin);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// 🔥 PROTECTED
router.get("/profile", authentication, AuthController.getProfile);

router.put(
  "/profile",
  authentication, // 🔥 MUST HAVE
  upload.single("image"),
  AuthController.updateProfile,
);

module.exports = router;
