const { InferenceClient } = require('@huggingface/inference');

if (!process.env.HF_API_KEY) {
    throw new Error('HF_API_KEY is missing');
}

const hf = new InferenceClient(process.env.HF_API_KEY);

module.exports = {
    hf
};
