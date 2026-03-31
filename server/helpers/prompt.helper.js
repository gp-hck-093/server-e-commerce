function buildPrompt(question, contextData = [], imageAnalysis = null) {
    let contextStr = '--- RELEVANT PRODUCTS ---\n';
    
    if (contextData.length > 0) {
        contextData.forEach((product, index) => {
            contextStr += `\n[Product ${index + 1}]\n`;
            contextStr += `Name: ${product.name || 'N/A'}\n`;
            contextStr += `Price: ${product.price ? `$${product.price}` : 'N/A'}\n`;
            contextStr += `Description: ${product.description || 'N/A'}\n`;
        });
    } else {
        contextStr += 'No matching products found in the database.\n';
    }

    let imageContext = '';
    if (imageAnalysis) {
        imageContext = `\n--- RELEVANT IMAGE DATA ---\n${imageAnalysis}\n`;
    }

    const systemInstructions = `
You are an AI-powered e-commerce assistant.
RULES:
1. ONLY recommend or discuss products found in the "RELEVANT PRODUCTS" section below.
2. DO NOT hallucinate products, features, or prices that are not explicitly provided.
3. Keep your answers concise, clear, and focused on helping the user buy.
4. If an image is provided, incorporate its details into your response contextually.
5. Provide details formatted clearly with product name, price, and description.
    `;

    return `${systemInstructions}\n${contextStr}${imageContext}\nUSER QUESTION: ${question}\n\nAI RESPONSE:`;
}

module.exports = {
    buildPrompt
};
