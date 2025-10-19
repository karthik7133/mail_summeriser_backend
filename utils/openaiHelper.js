const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple rate limiting - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

class OpenAIHelper {
  static async summarizeEmail(emailContent) {
    try {
      // Simple rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();

      const prompt = `Please summarize the following email concisely in 2-3 sentences:\n\n${emailContent}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes emails clearly and concisely.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.5
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI summarization error:', error);
      
      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new Error('OpenAI API quota exceeded. Please check your billing or try again later.');
      } else if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (error.status === 400) {
        throw new Error('Invalid request to OpenAI API.');
      } else {
        throw new Error(`Failed to summarize email: ${error.message}`);
      }
    }
  }

  static async chatWithAI(messages, context = '') {
    try {
      const systemMessage = context
        ? `You are a helpful assistant discussing an email. Email context: ${context}`
        : 'You are a helpful assistant answering questions about emails.';

      const chatMessages = [
        { role: 'system', content: systemMessage },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: chatMessages,
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }
}

module.exports = OpenAIHelper;
