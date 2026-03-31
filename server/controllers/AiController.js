const { processUserMessage } = require('../services/rag/ragService');
const { insert } = require('../services/rag/vectorService');
const { createEmbedding } = require('../services/rag/embeddingService');
const { Product, Brand, Category } = require('../models');

class AiController {
    // Standard chat endpoint formatting
    static async chat(req, res, next) {
        try {
            const { message, imageUrl, userId } = req.body;
            
            if (!message) {
                return res.status(400).json({ message: "Message is required" });
            }

            const response = await processUserMessage(message, imageUrl, userId);
            
            res.status(200).json({ response });
        } catch (error) {
            next(error);
        }
    }

    // Endpoint to seed the in-memory vector database with products
    static async seedDatabase(req, res, next) {
        try {
            const products = await Product.findAll({
                limit: 30, // Dibatasi 30 produk saja untuk menghindari error Rate Limit HF
                include: [
                    { model: Category, attributes: ["name"] },
                    { model: Brand, attributes: ["name"] }
                ]
            });

            let count = 0;
            
            // Loop through products, create embeddings, and insert into memory DB
            for (const product of products) {
                const textInfo = `Product: ${product.name}. Category: ${product.Category ? product.Category.name : 'None'}. Brand: ${product.Brand ? product.Brand.name : 'None'}. Price: $${product.price}. Description: ${product.description || 'No description'}`;
                
                // Create embedding
                const embedding = await createEmbedding(textInfo);
                
                // Construct metadata mapping
                const metadata = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    description: product.description || textInfo
                };

                // Insert into our vectorService
                await insert(product.id, embedding, metadata);
                count++;
            }

            res.status(200).json({ 
                message: `Successfully seeded ${count} products into the Vector DB` 
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AiController;
