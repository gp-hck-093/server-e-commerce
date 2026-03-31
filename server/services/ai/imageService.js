const { hf } = require('./config/huggingface');
const logger = require('../../helpers/logger');

async function analyzeImage(imageUrl) {
    try {
        const result = await hf.imageToText({
            data: imageUrl,
            model: 'Xenova/vit-base-patch16-224' // Default model or any text-captioning model you prefer
        });
        return result.generated_text;
    } catch (error) {
        // console.error('Error analyzing image with Hugging Face:', error);
        logger.error('Error analyzing image with Hugging Face:', error);
        throw error;
    }
}

module.exports = {
    analyzeImage
};
