const { google } = require('googleapis');

class GmailHelper {
  static async fetchEmails(accessToken, maxResults = 10, query = 'is:unread') {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: query
      });

      const messages = response.data.messages || [];

      const emailDetails = await Promise.all(
        messages.map(async (message) => {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          return this.parseEmail(detail.data);
        })
      );

      return emailDetails;
    } catch (error) {
      console.error('Gmail fetch error:', error);
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  }

  static parseEmail(messageData) {
    const headers = messageData.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

    let body = '';

    if (messageData.payload.body.data) {
      body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
    } else if (messageData.payload.parts) {
      const textPart = messageData.payload.parts.find(
        part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    body = body.replace(/<[^>]*>/g, '').substring(0, 5000);

    return {
      mailId: messageData.id,
      from,
      subject,
      body,
      receivedAt: new Date(date).toISOString()
    };
  }
}

module.exports = GmailHelper;
