const { processUserMessage } = require('../services/rag/ragService');
const logger = require('../helpers/logger');

module.exports = (io) => {
    io.on('connection', (socket) => {
        // console.log(`[Socket] User connected: ${socket.id}`);
        logger.info(`[Socket] User connected: ${socket.id}`);

        socket.on('chat:message', async (data) => {
            try {
                // Asumsikan client mengirim userId juga, misal { message: '...', userId: 1 }
                const { message, imageUrl, userId } = data;
                
                // Emitting typing event immediately
                socket.emit('chat:typing');
                
                const aiResponse = await processUserMessage(message, imageUrl, userId);
                
                socket.emit('chat:response', {
                    response: aiResponse
                });

            } catch (error) {
                // console.error('[Socket] chat:message error:', error);
                logger.error('[Socket] chat:message error:', error);
                socket.emit('chat:error', {
                    message: 'Sorry, I encountered an issue processing your request.'
                });
            }
        });

        socket.on('disconnect', () => {
            //  console.log(`[Socket] User disconnected: ${socket.id}`);
             logger.info(`[Socket] User disconnected: ${socket.id}`);
        });
    });
};
