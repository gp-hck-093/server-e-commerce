function buildPrompt(question, contextData = [], imageAnalysis = null) {
  let contextStr = "--- RELEVANT PRODUCTS ---\n";

  if (contextData.length > 0) {
    contextData.forEach((product, index) => {
      contextStr += `\n[Product ${index + 1}]\n`;
      contextStr += `ID: ${product.id}\n`;
      contextStr += `Name: ${product.name || "N/A"}\n`;
      contextStr += `Price: ${product.price ? `$${product.price}` : "N/A"}\n`;
      contextStr += `Description: ${product.description || "N/A"}\n`;
    });
  } else {
    contextStr += "No matching products found in the database.\n";
  }

  let imageContext = "";
  if (imageAnalysis) {
    imageContext = `\n--- RELEVANT IMAGE DATA ---\n${imageAnalysis}\n`;
  }

  const systemInstructions = `
You are an AI-powered e-commerce assistant.
RULES:
1. ONLY recommend or discuss products found in the "RELEVANT PRODUCTS" section below. If no products are listed or they don't match the user's criteria (like price bounds or category), politely inform the user you don't have matching products.
2. DO NOT hallucinate products, features, or prices that are not explicitly provided.
3. Keep your answers concise, clear, and focused on helping the user buy.
4. If an image is provided, incorporate its details into your response contextually.
5. If the user explicitly asks to BUY or ADD TO CART a specific product from the context, set "action" to "ADD_CART" and "productId" to the product's ID. Otherwise, "action" is "CHAT" and "productId" is null.
6. Include a list of product IDs in "recommendedProductIds" ONLY if you are explicitly recommending them in your text response.
7. YOU MUST ONLY RESPOND WITH A VALID RAW JSON OBJECT. NO MARKDOWN, NO OTHER TEXT.

FORMAT MUST EXACTLY BE:
{
  "answer": "Your detailed standard text response here",
  "action": "CHAT" | "ADD_CART",
  "productId": 123 | null,
  "recommendedProductIds": [123, 456] | []
}
    `;

  return `${systemInstructions}\n${contextStr}${imageContext}\nUSER QUESTION: ${question}\n\nAI RESPONSE (JSON ONLY):`;
}

module.exports = {
  buildPrompt,
};
