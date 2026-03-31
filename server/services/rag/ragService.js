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
            
            const cleanJsonStr = aiResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
            parsedCommand = JSON.parse(cleanJsonStr);
        } catch (err) {
            // Fallback jika bukan JSON
            return aiResponse;
        }

       
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
        
        let productsToReturn = [];
        if (parsedCommand.recommendedProductIds && Array.isArray(parsedCommand.recommendedProductIds) && parsedCommand.recommendedProductIds.length > 0) {
            try {
                // Fetch the actual products from PostgreSQL so we get correct imageUrl and only the recommended ones
                const recommended = await Product.findAll({
                    where: { id: parsedCommand.recommendedProductIds }
                });
                
                productsToReturn = recommended.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image: p.imageUrl || "",
                    description: p.description
                }));
            } catch (dbErr) {
                logger.error("Failed to fetch recommended products from DB:", dbErr);
            }
        }

       
        return {
            message: parsedCommand.answer || aiResponse,
            products: productsToReturn
        };
    } catch (error) {
        // console.error('Error in RAG orchestrator:', error);
        logger.error('Error in RAG orchestrator:', error);
        throw error;
    }
}

module.exports = {
    processUserMessage
};
