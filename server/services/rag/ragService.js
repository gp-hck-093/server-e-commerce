const { analyzeImage } = require('../ai/imageService');
const logger = require('../../helpers/logger');
const { generateChat } = require('../ai/chatService');
const { createEmbedding } = require('./embeddingService');
const { similaritySearch } = require('./vectorService');
const { buildPrompt } = require('../../helpers/prompt.helper');
const { Cart, Product } = require('../../models');

async function processUserMessage(message, imageUrl = null, userId = null) {
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
        
        let parsedCommand;
        try {
            // Bersihkan Markdown JSON tick dari response Gemini
            const cleanJsonStr = aiResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
            parsedCommand = JSON.parse(cleanJsonStr);
        } catch (err) {
            // Fallback jika bukan JSON
            return aiResponse;
        }

        // Cek apakah instruksi AI = masukin ke keranjang!
        if (parsedCommand.action === "ADD_CART" && parsedCommand.productId && userId) {
            try {
                const product = await Product.findByPk(parsedCommand.productId);
                if (product) {
                    const existingCart = await Cart.findOne({
                        where: { UserId: userId, ProductId: product.id }
                    });
                    if (existingCart) {
                        existingCart.qty += 1;
                        await existingCart.save();
                    } else {
                        await Cart.create({ UserId: userId, ProductId: product.id, qty: 1 });
                    }
                }
            } catch (cartErr) {
                logger.error("Failed to auto-add to cart:", cartErr);
            }
        }
        
        // Kembalikan jawaban teks bersihnya saja ke User
        return parsedCommand.answer || aiResponse;
    } catch (error) {
        // console.error('Error in RAG orchestrator:', error);
        logger.error('Error in RAG orchestrator:', error);
        throw error;
    }
}

module.exports = {
    processUserMessage
};
