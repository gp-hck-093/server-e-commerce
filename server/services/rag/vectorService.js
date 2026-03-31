// Extremely simple in-memory vector DB for development
const memoryDB = [];

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

async function insert(id, embedding, metadata) {
    memoryDB.push({ id, embedding, metadata });
    return id;
}

async function similaritySearch(queryEmbedding, k = 3) {
    try {
        const scoredDocs = memoryDB.map(doc => {
            const score = cosineSimilarity(queryEmbedding, doc.embedding);
            return { ...doc, score };
        });
        
        // Sort descending by score
        scoredDocs.sort((a, b) => b.score - a.score);
        return scoredDocs.slice(0, k);
    } catch (error) {
        // console.error('Error in similarity search:', error);
        logger.error('Error in similarity search:', error);
        throw error;
    }
}

module.exports = {
    insert,
    similaritySearch
};
