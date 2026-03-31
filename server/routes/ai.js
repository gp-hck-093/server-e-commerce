const router = require("express").Router();
const AiController = require("../controllers/AiController");

// Endpoints for testing RAG and chat
router.post("/chat", AiController.chat);
router.post("/seed", AiController.seedDatabase);

module.exports = router;
