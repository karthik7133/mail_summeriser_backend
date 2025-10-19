const Chat = require('../models/Chat');
const Mail = require('../models/Mail');
const GeminiHelper = require('../utils/geminiHelper');

const getChatHistory = async (req, res) => {
  try {
    const { mailId } = req.params;

    const mail = await Mail.findById(mailId);

    if (!mail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    let chat = await Chat.findOne({ mail_id: mailId });

    if (!chat) {
      return res.status(200).json({
        success: true,
        messages: [],
        mailId
      });
    }

    return res.status(200).json({
      success: true,
      chatId: chat._id,
      mailId: chat.mail_id,
      messages: chat.messages || []
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ error: 'Failed to fetch chat history', details: error.message });
  }
};

const sendChatMessage = async (req, res) => {
  try {
    const { mailId } = req.params;
    const { message } = req.body;

    console.log('DEBUG: Incoming Message Type:', typeof message);
    console.log('DEBUG: Incoming Message Value:', message);

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    const mail = await Mail.findById(mailId);

    if (!mail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    let chat = await Chat.findOne({ mail_id: mailId });

    if (!chat) {
      chat = await Chat.create({
        user_id: req.userId,
        mail_id: mailId,
        messages: []
      });
    }

    // Add user message to history before sending to AI
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Construct email context
    const emailContext = `EMAIL DETAILS:
Subject: ${mail.subject || 'No Subject'}
From: ${mail.from_address || 'Unknown Sender'}
Summary: ${mail.summary || 'Not yet summarized'}

EMAIL BODY:
${mail.body ? mail.body.substring(0, 2000) : 'No content available'}`;

    // Get conversation history
    const conversationMessages = chat.messages.map(msg => ({
      role: msg.role,
      content: String(msg.content)
    }));
    
    console.log('DEBUG: Conversation History Length:', conversationMessages.length);
    console.log('DEBUG: Last 2 Messages:', JSON.stringify(conversationMessages.slice(-2)));

    // Call AI with full conversation history and context
    const aiResponse = await GeminiHelper.chatWithAI(conversationMessages, emailContext);

    // Add AI response
    chat.messages.push({
      role: 'ai',
      content: aiResponse,
      timestamp: new Date()
    });

    const updatedChat = await chat.save();

    return res.status(200).json({
      success: true,
      chatId: updatedChat._id,
      userMessage: message,
      aiResponse,
      messages: updatedChat.messages
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    return res.status(500).json({ 
      error: 'Failed to send message', 
      details: error.message 
    });
  }
};

module.exports = {
  getChatHistory,
  sendChatMessage
};