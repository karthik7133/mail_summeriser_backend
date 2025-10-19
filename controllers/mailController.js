const Mail = require('../models/Mail');
const User = require('../models/User'); 
const GmailHelper = require('../utils/gmailHelper');
const GeminiHelper = require('../utils/geminiHelper');

const getAllMails = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const mails = await Mail.find({ user_id: req.userId })
      .sort({ received_at: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: mails.length,
      mails
    });
  } catch (error) {
    console.error('Get mails error:', error);
    return res.status(500).json({ error: 'Failed to fetch mails', details: error.message });
  }
};

const getMailById = async (req, res) => {
  try {
    const { id } = req.params;

    const mail = await Mail.findById(id);

    if (!mail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    return res.status(200).json({
      success: true,
      mail
    });
  } catch (error) {
    console.error('Get mail by ID error:', error);
    return res.status(500).json({ error: 'Failed to fetch mail', details: error.message });
  }
};

const fetchGmailEmails = async (req, res) => {
  try {
    const { maxResults: clientMaxResults } = req.body; 

    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const accessToken = user.google_access_token;
    const limit = clientMaxResults || 50;
    const filterQuery = 'in:inbox category:primary';

    if (!accessToken) {
        console.error(`Fetch failed for ${user.email}: Access token is missing or expired.`);
        return res.status(400).json({ error: 'Access token is required' });
    }

    const emails = await GmailHelper.fetchEmails(accessToken, limit, filterQuery);

    const savedEmails = [];
    const skippedEmails = [];

    for (const email of emails) {
      const existingMail = await Mail.findOne({ mail_id: email.mailId });

      if (!existingMail) {
        const newMail = await Mail.create({
          user_id: req.userId,
          mail_id: email.mailId,
          from_address: email.from,
          subject: email.subject,
          body: email.body,
          received_at: email.receivedAt
        });
        savedEmails.push(newMail);
      } else {
        skippedEmails.push(email.mailId);
      }
    }

    return res.status(200).json({
      success: true,
      fetched: emails.length,
      saved: savedEmails.length,
      skipped: skippedEmails.length,
      mails: savedEmails
    });
  } catch (error) {
    console.error('Fetch Gmail emails error:', error);
    return res.status(500).json({ error: 'Failed to fetch Gmail emails', details: error.message });
  }
};

const summarizeMail = async (req, res) => {
  try {
    const { id } = req.params;

    const mail = await Mail.findById(id);

    if (!mail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    // If already has a valid summary, return it
    if (mail.summary) {
      return res.status(200).json({
        success: true,
        message: 'Summary already exists',
        mail
      });
    }

    // Create detailed prompt for Gemini
    const emailContent = `Subject: ${mail.subject}\nFrom: ${mail.from_address}\n\n${mail.body}`;
    
    const prompt = `Analyze this email and provide a structured JSON response with the following fields:

{
  "importance": "Very Important" | "Important" | "Normal" | "Not Wanted",
  "useful": true | false,
  "summary": "A comprehensive 2-3 sentence summary of the email content and key message",
  "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "action_required": "Specific action needed, or empty string if none"
}

Guidelines:
- Importance: Determine based on urgency, sender, and content relevance
- Useful: Is this email valuable or spam/promotional?
- Summary: Focus on the main message and purpose
- Key Points: Extract 3-5 most important takeaways
- Action Required: What should the recipient do with this email?

Email to analyze:
${emailContent}

Respond ONLY with valid JSON, no additional text.`;

    // Get summary from Gemini
    const summaryResponse = await GeminiHelper.summarizeEmail(prompt);
    
    // Parse the JSON response from Gemini
    let parsedSummary;
    try {
      // Clean the response in case it has extra whitespace or markdown
      const cleanedResponse = summaryResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsedSummary = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn('Failed to parse Gemini JSON response, creating fallback:', parseError);
      // Fallback structure if JSON parsing fails
      parsedSummary = {
        importance: 'Normal',
        useful: true,
        summary: summaryResponse,
        key_points: [],
        action_required: ''
      };
    }

    // Store as JSON string in database
    const summaryData = JSON.stringify(parsedSummary);
    const updatedMail = await Mail.findByIdAndUpdate(
      id, 
      { summary: summaryData }, 
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Email summarized successfully',
      mail: updatedMail
    });
  } catch (error) {
    console.error('Summarize mail error:', error);
    return res.status(500).json({ error: 'Failed to summarize email', details: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const mail = await Mail.findById(id);

    if (!mail) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    // Create context from email
    const emailContext = `
Email Subject: ${mail.subject}
From: ${mail.from_address}
Email Body: ${mail.body}
${mail.summary ? `Email Summary: ${mail.summary}` : ''}
`;

    // Build chat prompt with email context
    const chatPrompt = `You are a helpful AI assistant analyzing emails. Here is the email context:

${emailContext}

User Question: ${message}

Provide a helpful, concise response based on the email content.`;

    // Get response from Gemini
    const aiResponse = await GeminiHelper.chatWithEmail(chatPrompt);

    return res.status(200).json({
      success: true,
      aiResponse: aiResponse
    });
  } catch (error) {
    console.error('Chat with AI error:', error);
    return res.status(500).json({ error: 'Failed to process chat message', details: error.message });
  }
};

const deleteMail = async (req, res) => {
  try {
    const { id } = req.params;

    await Mail.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Mail deleted successfully'
    });
  } catch (error) {
    console.error('Delete mail error:', error);
    return res.status(500).json({ error: 'Failed to delete mail', details: error.message });
  }
};

module.exports = {
  getAllMails,
  getMailById,
  fetchGmailEmails,
  summarizeMail,
  chatWithAI,
  deleteMail
};