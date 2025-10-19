const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiHelper {
  static lastRequestTime = 0;

  /**
   * Helper function to apply rate limiting
   */
  static async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => 
        setTimeout(resolve, 1000 - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Summarize email with enhanced structured JSON output
   */
  static async summarizeEmail(emailContent) {
    try {
      await this.applyRateLimit();

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Analyze this email carefully and provide a structured summary in JSON format.

Return ONLY valid JSON with no additional text:

{
  "importance": "Very Important" | "Important" | "Normal" | "Not Wanted",
  "useful": true | false,
  "summary": "A comprehensive 2-3 sentence summary of the email's main content and purpose",
  "key_points": [
    "First key point extracted from email",
    "Second key point extracted from email",
    "Third key point extracted from email"
  ],
  "action_required": "Specific action needed or empty string if none"
}

Guidelines:
- importance: Based on urgency, sender relevance, and content
- useful: Is this email valuable to the recipient? (true for important emails, false for spam/promotional)
- summary: Focus on main message and context
- key_points: Extract 3 most important takeaways
- action_required: What should recipient do? (e.g., "Reply by Friday", "Approve document", etc. or empty string)

Email to analyze:
${emailContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summaryText = response.text();

      // Parse JSON from response
      try {
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cleanedJson = jsonMatch[0].trim();
          const parsedSummary = JSON.parse(cleanedJson);
          
          // Validate structure
          const validSummary = {
            importance: parsedSummary.importance || 'Normal',
            useful: typeof parsedSummary.useful === 'boolean' ? parsedSummary.useful : true,
            summary: parsedSummary.summary || 'No summary available',
            key_points: Array.isArray(parsedSummary.key_points) ? parsedSummary.key_points : [],
            action_required: parsedSummary.action_required || ''
          };
          
          return JSON.stringify(validSummary);
        }
      } catch (parseError) {
        console.warn('JSON parse error, creating fallback:', parseError.message);
      }

      // Fallback structure
      const fallbackSummary = {
        importance: 'Normal',
        useful: true,
        summary: summaryText.trim(),
        key_points: [],
        action_required: ''
      };
      
      return JSON.stringify(fallbackSummary);
    } catch (error) {
      console.error('Gemini summarization error:', error);
      this.handleGeminiError(error);
    }
  }

  /**
   * Chat with AI about email - NOW SUPPORTS CONVERSATION HISTORY
   * @param {Array} conversationMessages - Array of {role, content} objects
   * @param {String} emailContext - Email context string
   */
  static async chatWithAI(conversationMessages, emailContext = '') {
    try {
      await this.applyRateLimit();

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Build the chat session with proper context
      const chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // Create system context message
      let systemPrompt = `You are a helpful AI assistant analyzing an email for the user. Here is the email information:

${emailContext}

Please answer the user's questions based on this email context. Be helpful, concise, and accurate. If you cannot answer based on the email context, politely let the user know.`;

      // Build conversation history for context
      let fullConversation = systemPrompt + '\n\n';
      
      // Add conversation history (excluding the last message which we'll send separately)
      for (let i = 0; i < conversationMessages.length - 1; i++) {
        const msg = conversationMessages[i];
        fullConversation += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n\n`;
      }

      // Get the last user message
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      fullConversation += `User: ${lastMessage.content}\n\nAI:`;

      console.log('DEBUG: Full prompt being sent to Gemini:', fullConversation.substring(0, 500) + '...');

      // Send the complete conversation context
      const result = await chat.sendMessage(fullConversation);
      const response = await result.response;
      const answer = response.text();

      console.log('DEBUG: Gemini response:', answer);

      return answer.trim();
    } catch (error) {
      console.error('Gemini chat error:', error);
      this.handleGeminiError(error);
    }
  }

  /**
   * Extract action items from email
   */
  static async extractActionItems(emailContent) {
    try {
      await this.applyRateLimit();

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Extract all action items from this email. Return ONLY valid JSON:

[
  {
    "action": "What needs to be done",
    "assignee": "Who should do it (or 'Me' if not specified)",
    "deadline": "Deadline date or 'Not specified'",
    "priority": "High" | "Medium" | "Low"
  }
]

Email:
${emailContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.stringify(JSON.parse(jsonMatch[0]));
        }
      } catch (parseError) {
        console.warn('Failed to parse action items:', parseError.message);
      }

      return JSON.stringify([]);
    } catch (error) {
      console.error('Extract action items error:', error);
      this.handleGeminiError(error);
    }
  }

  /**
   * Analyze email sentiment
   */
  static async analyzeSentiment(emailContent) {
    try {
      await this.applyRateLimit();

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Analyze the sentiment and tone of this email. Return ONLY valid JSON:

{
  "sentiment": "Positive" | "Negative" | "Neutral" | "Mixed",
  "tone": "Formal" | "Casual" | "Angry" | "Friendly" | "Professional" | "Urgent",
  "urgency": "Low" | "Medium" | "High",
  "confidence": 0.95
}

Email:
${emailContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.stringify(JSON.parse(jsonMatch[0]));
        }
      } catch (parseError) {
        console.warn('Failed to parse sentiment:', parseError.message);
      }

      return JSON.stringify({
        sentiment: 'Neutral',
        tone: 'Professional',
        urgency: 'Medium',
        confidence: 0.5
      });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      this.handleGeminiError(error);
    }
  }

  /**
   * Generate email reply suggestions
   */
  static async generateReplySuggestions(emailContent, replyStyle = 'professional') {
    try {
      await this.applyRateLimit();

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Based on this email, generate 3 professional reply suggestions in ${replyStyle} style. Return ONLY valid JSON:

[
  {
    "subject": "Reply subject line",
    "suggestion": "Full reply text (2-3 sentences)"
  }
]

Email to reply to:
${emailContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.stringify(JSON.parse(jsonMatch[0]));
        }
      } catch (parseError) {
        console.warn('Failed to parse reply suggestions:', parseError.message);
      }

      return JSON.stringify([]);
    } catch (error) {
      console.error('Generate reply suggestions error:', error);
      this.handleGeminiError(error);
    }
  }

  /**
   * Categorize email
   */
  static async categorizeEmail(emailContent) {
    try {
      await this.applyRateLimit();

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Categorize this email into one of these categories. Return ONLY valid JSON:

{
  "category": "Work" | "Personal" | "Marketing" | "Finance" | "Support" | "Social" | "Other",
  "subcategory": "More specific category if applicable",
  "confidence": 0.95
}

Email:
${emailContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.stringify(JSON.parse(jsonMatch[0]));
        }
      } catch (parseError) {
        console.warn('Failed to parse category:', parseError.message);
      }

      return JSON.stringify({
        category: 'Other',
        subcategory: 'Uncategorized',
        confidence: 0.5
      });
    } catch (error) {
      console.error('Categorize email error:', error);
      this.handleGeminiError(error);
    }
  }

  /**
   * Handle Gemini-specific errors
   */
  static handleGeminiError(error) {
    if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    } else if (error.message.includes('API_KEY') || error.message.includes('UNAUTHENTICATED')) {
      throw new Error('Gemini API key is invalid or missing.');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      throw new Error('Gemini API permission denied. Check your credentials.');
    } else if (error.message.includes('safety') || error.message.includes('SAFETY')) {
      throw new Error('Content blocked by safety filters.');
    } else if (error.message.includes('DEADLINE_EXCEEDED')) {
      throw new Error('Request took too long. Please try again.');
    } else {
      throw new Error(`Failed to process request: ${error.message}`);
    }
  }
}

module.exports = GeminiHelper;