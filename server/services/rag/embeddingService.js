const { hf } = require('../ai/config/huggingface');

async function createEmbedding(text) {
    try {
        const result = await hf.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: text
        });
        return result;
    } catch (error) {
        // console.error('Error creating embedding:', error);
        logger.error('Error creating embedding:', error);
        throw error;
    }
}

module.exports = {
    createEmbedding
};
