const { hf } = require("../ai/config/huggingface");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../helpers/logger");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

// OPSI 1: Menggunakan Hugging Face (Membutuhkan Pinecone 384 Dimensi)
async function createEmbeddingHF(text) {
  try {
    const result = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });
    return result;
  } catch (error) {
    logger.error("Error creating embedding with HuggingFace:", error);
    throw error;
  }
}

// OPSI 2: Menggunakan Gemini (Membutuhkan Pinecone 768 Dimensi)
async function createEmbeddingGemini(text) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error("Error creating embedding with Gemini:", error);
    throw error;
  }
}

// FUNGSI UTAMA ORKESTRATOR (Otomatis dipakai RAG)
async function createEmbedding(text) {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "gemini") {
    return await createEmbeddingGemini(text);
  } else {
    return await createEmbeddingHF(text);
  }
}

module.exports = {
  createEmbedding,
  createEmbeddingHF,
  createEmbeddingGemini,
};
