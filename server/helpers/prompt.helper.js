function buildPrompt(question, contextData = [], imageAnalysis = null, chatHistory = []) {
  let contextStr = "--- RELEVANT PRODUCTS ---\n";

  if (contextData.length > 0) {
    contextData.forEach((product, index) => {
      contextStr += `\n[Product ${index + 1}]\n`;
      contextStr += `ID: ${product.id}\n`;
      contextStr += `Name: ${product.name || "N/A"}\n`;
      contextStr += `Price: ${product.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : "N/A"}\n`;
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
1. ALWAYS respond in fluent Indonesian (Bahasa Indonesia) for the "answer" field. NEVER use English.
2. ALWAYS format prices in Rupiah with "Rp" (e.g., Rp 18.000.000). DO NOT use "$" or "Dollars".
3. ONLY recommend or discuss products found in the "RELEVANT PRODUCTS" section below IF they logically match the user's intent. 
4. DO NOT cross-sell or list unrelated products from the 'RELEVANT PRODUCTS' section just to offer alternatives. For example, if the user asks for shoes but the RELEVANT PRODUCTS only show electronics or clothes, you MUST ONLY say: "Mohon maaf, kami tidak memiliki barang tersebut." DO NOT add "tapi kami punya barang ini...".
5. DO NOT hallucinate products, features, or prices that are not explicitly provided.
6. Keep your answers concise, clear, and focused on helping the user buy. Use the RECENT CHAT HISTORY to understand the context of the user's question, especially if they are answering a previous question from you.
7. If an image is provided (RELEVANT IMAGE DATA), explicitly COMPARE the image with the recommended products. Point out what matches and what is different (e.g., color, style, brand) in a helpful manner.
8. If the user explicitly asks to BUY or ADD TO CART a specific product from the context, set "action" to "ADD_CART" and "productId" to the product's ID. Otherwise, "action" is "CHAT" and "productId" is null.
9. Include a list of product IDs in "recommendedProductIds" ONLY if you are explicitly recommending them in your text response.
10. YOU MUST ONLY RESPOND WITH A VALID RAW JSON OBJECT. NO MARKDOWN, NO OTHER TEXT.

FORMAT MUST EXACTLY BE:
{
  "answer": "Your detailed standard text response here",
  "action": "CHAT" | "ADD_CART",
  "productId": 123 | null,
  "recommendedProductIds": [123, 456] | []
}
    `;

  let historyStr = "";
  if (chatHistory && chatHistory.length > 0) {
    historyStr = "\n--- RECENT CHAT HISTORY ---\n";
    chatHistory.forEach(msg => {
        historyStr += `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
    });
  }

  return `${systemInstructions}\n${contextStr}${imageContext}${historyStr}\nUSER QUESTION: ${question}\n\nAI RESPONSE (JSON ONLY):`;
}

module.exports = {
  buildPrompt,
};
