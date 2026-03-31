const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../../helpers/logger');

// Init Pinecone Client (pastikan PINECONE_API_KEY ada di .env)
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });


const index = pc.index('ecommerce');

async function insert(id, embedding, metadata) {
    try {
        // 1. Pastikan embedding adalah array 1 Dimensi murni
        let safeEmbedding = Array.isArray(embedding) ? embedding.flat(Infinity) : Array.from(embedding);

        // 2. Bersihkan metadata: Pinecone tidak menoleransi data 'null', 'undefined', atau Object rumit.
        const safeMetadata = {};
        for (const [key, val] of Object.entries(metadata)) {
            if (val !== null && val !== undefined) {
                safeMetadata[key] = String(val); // Ubah semua tipe jadi string agar super aman
            }
        }

        if (!safeEmbedding || safeEmbedding.length === 0) {
            logger.error("ALARM! Embedding kosong atau gagal dibuat oleh Hugging Face. Raw Embedding:", embedding);
            throw new Error("Embedding is empty!");
        }

        await index.upsert({
            records: [{
                id: String(id), 
                values: safeEmbedding, 
                metadata: safeMetadata
            }]
        });
        return id;
    } catch (error) {
        logger.error('Error inserting ke Pinecone:', error);
        throw error;
    }
}

async function similaritySearch(queryEmbedding, k = 3) {
    try {
        const safeQueryEmbedding = Array.isArray(queryEmbedding) ? queryEmbedding.flat(Infinity) : Array.from(queryEmbedding);

        const queryResponse = await index.query({
            vector: safeQueryEmbedding,
            topK: k,
            includeMetadata: true
        });
        
        // Pinecone mereturn "matches", kita samakan format balasan (.metadata) seperti array memoryDB kita sebelumnya
        return queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata
        }));
    } catch (error) {
        logger.error('Error in Pinecone similarity search:', error);
        throw error;
    }
}

module.exports = {
    insert,
    similaritySearch
};
