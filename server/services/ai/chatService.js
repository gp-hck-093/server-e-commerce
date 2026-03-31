const { geminiModel } = require('./config/gemini');

async function generateChat(prompt) {
    try {
        const result = await geminiModel.generateContent(prompt);
        // Await the response fully before returning
        const response = await result.response;
        return response.text();
    } catch (error) {
        // console.error('Error generating chat with Gemini:', error);
        logger.error('Error generating chat with Gemini:', error);
        throw error;
    }
}

module.exports = {
    generateChat
};
