// src/services/openai.service.js
require('dotenv').config();
const axios = require('axios');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

async function callOpenAIAPI(prompt, options = {}) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');

  const body = {
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 800,
  };

  const res = await axios.post(OPENAI_URL, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    timeout: options.timeout || 120000,
  });

  const content = res.data?.choices?.[0]?.message?.content || res.data?.choices?.[0]?.text || '';
  return content;
}

module.exports = { callOpenAIAPI };
