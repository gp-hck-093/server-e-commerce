const { processUserMessage } = require('../services/rag/ragService');
const { Cart, Product } = require('../models');
const logger = require('../helpers/logger');

module.exports = (io) => {
    io.on('connection', (socket) => {
        logger.info(`[Socket] User connected: ${socket.id}`);

        // 1. EVENT: "chat"
        socket.on('chat', async (data) => {
            try {
                // data could be just a string message, or an object containing message and userId
                const message = data.message || data;
                const imageUrl = data.imageUrl || null;
                // Ideally, userId should be obtained from socket authentication (e.g. socket.user.id)
                const userId = data.userId || null; 
                const chatHistory = data.chatHistory || [];
                
                socket.emit('chat:typing');
                
                // processUserMessage returns { message: string, products: [...] }
                const aiResponse = await processUserMessage(message, imageUrl, userId, chatHistory);
                
                // Emitting the response back exactly as requested
                socket.emit('chat', aiResponse);

            } catch (error) {
                logger.error('[Socket] chat event error:', error);
                socket.emit('chat', {
                    message: 'Sorry, I encountered an issue processing your request.',
                    products: []
                });
            }
        });

        // 2. EVENT: "cart"
        socket.on('cart', async (data) => {
            try {
                const { productId, userId } = data; // need userId to add to cart
                
                if (!productId) {
                    return socket.emit('cart', { success: false, message: 'productId is required' });
                }

                // If no userId provided, simulate failure or handle accordingly 
                if (!userId) {
                    return socket.emit('cart', { success: false, message: 'userId is required for cart operations' });
                }

                const product = await Product.findByPk(productId);
                if (product) {
                    const existingCart = await Cart.findOne({
                        where: { UserId: userId, ProductId: product.id }
                    });
                    
                    if (existingCart) {
                        if (existingCart.qty + 1 > product.qty) {
                            return socket.emit('cart', { success: false, message: `Maaf, stok ${product.name} tidak mencukupi.` });
                        }
                        existingCart.qty += 1;
                        await existingCart.save();
                    } else {
                        if (product.qty < 1) {
                            return socket.emit('cart', { success: false, message: `Maaf, ${product.name} sedang habis.` });
                        }
                        await Cart.create({ UserId: userId, ProductId: product.id, qty: 1 });
                    }
                    
                    socket.emit('cart', { success: true, message: `${product.name} ditambahkan ke keranjang!` });
                } else {
                    socket.emit('cart', { success: false, message: 'Product not found' });
                }

            } catch (error) {
                logger.error('[Socket] cart event error:', error);
                socket.emit('cart', { success: false, message: 'Failed to add to cart' });
            }
        });

        socket.on('disconnect', () => {
             logger.info(`[Socket] User disconnected: ${socket.id}`);
        });
    });
};
