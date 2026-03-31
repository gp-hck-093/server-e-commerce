const { analyzeImage } = require('../ai/imageService');
const logger = require('../../helpers/logger');
const { generateChat } = require('../ai/chatService');
const { createEmbedding } = require('./embeddingService');
const { similaritySearch } = require('./vectorService');
const { buildPrompt } = require('../../helpers/prompt.helper');

async function processUserMessage(message, imageUrl = null) {
    try {
        let imageCaption = null;
        
        // 1. Process image if provided optional
        if (imageUrl) {
            imageCaption = await analyzeImage(imageUrl);
        }

        // 2. Combine user message + image caption
        const searchInput = imageCaption 
            ? `${message}. Image context: ${imageCaption}` 
            : message;

        // 3. Retrieve relevant products via Vector DB
        const queryEmbedding = await createEmbedding(searchInput);
        const relevantProductsDocs = await similaritySearch(queryEmbedding, 3);
        const relevantProducts = relevantProductsDocs.map(doc => doc.metadata);

        // 4. Build Prompt
        const prompt = buildPrompt(message, relevantProducts, imageCaption);

        // 5. Call Gemini
        const aiResponse = await generateChat(prompt);
        
        return aiResponse;
    } catch (error) {
        // console.error('Error in RAG orchestrator:', error);
        logger.error('Error in RAG orchestrator:', error);
        throw error;
    }
}

module.exports = {
    processUserMessage
};
