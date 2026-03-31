const { geminiModel } = require('./config/gemini');
const logger = require('../../helpers/logger');

async function analyzeImage(imageUrl) {
    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Gagal mengunduh gambar dari URL: ${imageResponse.status}`);
        }
        
        // Ambil data gambar dalam bentuk array buffer dan ubah ke Base64 (Format yang diminta Gemini)
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

        // Minta Gemini yang lebih pintar untuk mendeskripsikan isi gambarnya!
        const result = await geminiModel.generateContent([
            "Describe the objects, product features, and colors in this image briefly but accurately.", 
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);
        
        const response = await result.response;
        return response.text();
    } catch (error) {
        // console.error('Error analyzing image with Hugging Face:', error);
        logger.error('Error analyzing image with Hugging Face:', error);
        throw error;
    }
}

module.exports = {
    analyzeImage
};
