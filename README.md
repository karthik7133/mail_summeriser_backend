# Mail Summarizer Backend API

A complete Node.js backend API for the Mail Summarizer App that integrates Firebase Authentication, Gmail API, and ChatGPT for intelligent email summarization and conversational AI.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Security](#security)
- [Deployment](#deployment)

---

## Features

- **Firebase Authentication**: Secure user authentication with Firebase Admin SDK
- **Gmail Integration**: Fetch emails from Gmail using OAuth2 access tokens
- **AI Summarization**: Automatic email summarization using ChatGPT API
- **Conversational AI**: Chat with AI about email content for follow-up questions
- **MongoDB Database**: MongoDB Atlas for scalable NoSQL data storage
- **Data Security**: Built-in user-based data isolation
- **RESTful API**: Clean, organized REST endpoints
- **Email Deduplication**: Prevents duplicate email storage

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (NoSQL)
- **Authentication**: Firebase Admin SDK
- **Email API**: Google Gmail API
- **AI**: OpenAI GPT-3.5-turbo
- **Dependencies**:
  - `mongoose` - MongoDB object modeling
  - `firebase-admin` - Firebase authentication
  - `googleapis` - Gmail API integration
  - `openai` - ChatGPT API client
  - `express` - Web framework
  - `cors` - Cross-origin resource sharing
  - `dotenv` - Environment configuration
  - `axios` - HTTP client

---

## Project Structure

```
mail-summarizer-backend/
├── config/
│   ├── mongodb.js           # MongoDB connection configuration
│   └── firebase.js          # Firebase Admin SDK setup
├── models/
│   ├── User.js              # User data model (Mongoose)
│   ├── Mail.js              # Mail data model (Mongoose)
│   └── Chat.js              # Chat data model (Mongoose)
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── mailRoutes.js        # Mail management routes
│   └── chatRoutes.js        # Chat routes
├── controllers/
│   ├── authController.js    # Auth logic
│   ├── mailController.js    # Mail operations
│   └── chatController.js    # Chat handling
├── middleware/
│   └── authMiddleware.js    # Firebase token verification
├── utils/
│   ├── gmailHelper.js       # Gmail API utilities
│   └── openaiHelper.js      # OpenAI API utilities
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── server.js               # Main application entry
└── package.json            # Project dependencies
```

---

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Admin SDK credentials
- Google Cloud project with Gmail API enabled
- OpenAI API account
- MongoDB Atlas account

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd mail-summarizer-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables** (see [Environment Variables](#environment-variables))

4. **Start the server**
```bash
npm start
```

The server will start on `http://localhost:5000`

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://karthik7133:Ch.karthik.7@cluster7133.yzxk6k4.mongodb.net/Mail_db

# Firebase Configuration (REQUIRED - Add your credentials)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url"}

# OpenAI Configuration (REQUIRED - Add your API key)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google OAuth (Optional - for reference)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Getting Your Credentials

#### Firebase Service Account:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Copy the entire JSON content and paste it as a single-line string in `FIREBASE_SERVICE_ACCOUNT`

#### OpenAI API Key:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in and navigate to API Keys
3. Create a new secret key
4. Copy the key and paste it in `OPENAI_API_KEY`

#### MongoDB Atlas:
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace the connection string in `MONGODB_URI`

#### Gmail API (Frontend handles OAuth):
- Your Flutter app will handle Google Sign-In and provide access tokens
- No backend configuration needed for Gmail API

---

## Database Setup

The database is configured with MongoDB Atlas and includes:

### Collections

#### 1. **users**
- `_id` (ObjectId) - Primary key
- `firebase_uid` (String) - Unique Firebase user ID
- `name` (String) - User's display name
- `email` (String) - User's email address
- `profile_pic` (String) - Profile picture URL
- `createdAt` (Date) - Account creation time
- `updatedAt` (Date) - Last update time

#### 2. **mails**
- `_id` (ObjectId) - Primary key
- `user_id` (ObjectId) - Reference to users collection
- `mail_id` (String) - Unique Gmail message ID
- `from_address` (String) - Sender's email
- `subject` (String) - Email subject
- `body` (String) - Email content
- `summary` (String) - AI-generated summary
- `received_at` (Date) - Email received time
- `createdAt` (Date) - Record creation time
- `updatedAt` (Date) - Last update time

#### 3. **chats**
- `_id` (ObjectId) - Primary key
- `user_id` (ObjectId) - Reference to users collection
- `mail_id` (ObjectId) - Reference to mails collection
- `messages` (Array) - Array of chat messages with role, content, and timestamp
- `createdAt` (Date) - Chat creation time
- `updatedAt` (Date) - Last message time

### Data Security

MongoDB collections are secured with:
- User-based data isolation through user_id references
- Authentication required for all operations
- Proper ownership checks on all CRUD operations

---

## API Endpoints

### Base URL
```
http://localhost:5000
```

### Authentication Endpoints

#### 1. Verify User / Create Account
```http
POST /api/auth/verify
```

**Request Body:**
```json
{
  "firebase_uid": "firebase_user_uid",
  "name": "John Doe",
  "email": "john@example.com",
  "profile_pic": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase_user_uid",
    "name": "John Doe",
    "email": "john@example.com",
    "profile_pic": "https://example.com/photo.jpg",
    "created_at": "2025-10-18T12:00:00Z"
  }
}
```

#### 2. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase_user_uid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Mail Endpoints

All mail endpoints require authentication:
```
Authorization: Bearer <firebase_token>
```

#### 1. Get All Mails
```http
GET /api/mails?limit=50
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "mails": [
    {
      "id": "uuid",
      "mail_id": "gmail_message_id",
      "from_address": "sender@example.com",
      "subject": "Meeting Tomorrow",
      "body": "Email content...",
      "summary": "AI-generated summary",
      "received_at": "2025-10-18T10:00:00Z",
      "created_at": "2025-10-18T10:05:00Z"
    }
  ]
}
```

#### 2. Get Mail by ID
```http
GET /api/mails/:id
```

**Response:**
```json
{
  "success": true,
  "mail": {
    "id": "uuid",
    "from_address": "sender@example.com",
    "subject": "Meeting Tomorrow",
    "body": "Full email content...",
    "summary": "Brief summary..."
  }
}
```

#### 3. Fetch Gmail Emails
```http
POST /api/mails/fetch
```

**Request Body:**
```json
{
  "accessToken": "google_oauth_access_token",
  "maxResults": 10
}
```

**Response:**
```json
{
  "success": true,
  "fetched": 10,
  "saved": 8,
  "skipped": 2,
  "mails": [...]
}
```

#### 4. Summarize Email
```http
POST /api/mails/summarize/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Email summarized successfully",
  "mail": {
    "id": "uuid",
    "subject": "Meeting Tomorrow",
    "summary": "This email discusses the meeting scheduled for tomorrow at 10 AM. The sender requests confirmation of attendance."
  }
}
```

#### 5. Delete Mail
```http
DELETE /api/mails/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Mail deleted successfully"
}
```

---

### Chat Endpoints

All chat endpoints require authentication:
```
Authorization: Bearer <firebase_token>
```

#### 1. Get Chat History
```http
GET /api/chat/:mailId
```

**Response:**
```json
{
  "success": true,
  "chatId": "uuid",
  "mailId": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "What is the main point?",
      "timestamp": "2025-10-18T11:00:00Z"
    },
    {
      "role": "ai",
      "content": "The main point is...",
      "timestamp": "2025-10-18T11:00:05Z"
    }
  ]
}
```

#### 2. Send Chat Message
```http
POST /api/chat/:mailId
```

**Request Body:**
```json
{
  "message": "What action items are mentioned?"
}
```

**Response:**
```json
{
  "success": true,
  "chatId": "uuid",
  "userMessage": "What action items are mentioned?",
  "aiResponse": "The email mentions the following action items: 1. Confirm attendance, 2. Prepare presentation, 3. Review documents",
  "messages": [...]
}
```

---

## Authentication Flow

### Frontend (Flutter) Flow:

1. **User signs in with Google** using Firebase Auth
2. **Get Firebase ID token** from authenticated user
3. **Send token to backend** in `Authorization: Bearer <token>` header
4. **Backend verifies token** using Firebase Admin SDK
5. **Backend creates/retrieves user** in database
6. **Backend returns user data** to frontend

### Making Authenticated Requests:

```javascript
// Example using fetch
const response = await fetch('http://localhost:5000/api/mails', {
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Usage Examples

### 1. Complete Authentication Flow

```dart
// Flutter example
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

// Sign in with Google
final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
final user = userCredential.user;

// Get ID token
final idToken = await user?.getIdToken();

// Verify with backend
final response = await http.post(
  Uri.parse('http://localhost:5000/api/auth/verify'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'firebase_uid': user?.uid,
    'name': user?.displayName,
    'email': user?.email,
    'profile_pic': user?.photoURL,
  }),
);
```

### 2. Fetching and Summarizing Emails

```dart
// Get Gmail access token from Google Sign-In
final googleSignIn = GoogleSignIn(scopes: ['https://mail.google.com/']);
final account = await googleSignIn.signIn();
final auth = await account?.authentication;

// Fetch emails
final fetchResponse = await http.post(
  Uri.parse('http://localhost:5000/api/mails/fetch'),
  headers: {
    'Authorization': 'Bearer $idToken',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'accessToken': auth?.accessToken,
    'maxResults': 10,
  }),
);

// Get mails
final mailsResponse = await http.get(
  Uri.parse('http://localhost:5000/api/mails'),
  headers: {'Authorization': 'Bearer $idToken'},
);

// Summarize specific email
final mailId = 'uuid-of-email';
final summarizeResponse = await http.post(
  Uri.parse('http://localhost:5000/api/mails/summarize/$mailId'),
  headers: {'Authorization': 'Bearer $idToken'},
);
```

### 3. Chatting with AI

```dart
// Send message to AI
final chatResponse = await http.post(
  Uri.parse('http://localhost:5000/api/chat/$mailId'),
  headers: {
    'Authorization': 'Bearer $idToken',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'message': 'What are the key action items?',
  }),
);

// Get chat history
final historyResponse = await http.get(
  Uri.parse('http://localhost:5000/api/chat/$mailId'),
  headers: {'Authorization': 'Bearer $idToken'},
);
```

---

## Error Handling

### Standard Error Response Format:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes:

- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Example Error Responses:

```json
// Missing token
{
  "error": "No token provided"
}

// Invalid token
{
  "error": "Invalid or expired token"
}

// Resource not found
{
  "error": "Mail not found"
}

// API error
{
  "error": "Failed to summarize email",
  "details": "OpenAI API rate limit exceeded"
}
```

---

## Security

### Authentication
- Firebase ID tokens are verified on every protected request
- Tokens expire after 1 hour (Firebase default)
- Users must reauthenticate when tokens expire

### Data Security
- MongoDB collections use user-based data isolation
- Users can only access their own data through user_id references
- Queries automatically filtered by user ownership

### Data Protection
- Passwords are managed by Firebase (never stored in backend)
- Email content is sanitized before storage
- API keys are stored in environment variables
- CORS configured for cross-origin requests

### Best Practices
- Never commit `.env` file to version control
- Rotate API keys regularly
- Use HTTPS in production
- Implement rate limiting for production
- Monitor API usage and costs

---

## Deployment

### Recommended Platforms:

1. **Railway**
2. **Render**
3. **Heroku**
4. **AWS EC2**
5. **Google Cloud Run**
6. **DigitalOcean App Platform**

### Deployment Checklist:

- [ ] Set `NODE_ENV=production`
- [ ] Configure all environment variables
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure CORS for your frontend domain
- [ ] Enable database connection pooling
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up automated backups
- [ ] Test all endpoints
- [ ] Update frontend API base URL

### Example: Deploy to Render

1. Create new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add all environment variables
6. Deploy!

---

## Testing

### Health Check:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T12:00:00.000Z"
}
```

### Test Authentication:
```bash
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_uid": "test_uid",
    "name": "Test User",
    "email": "test@example.com"
  }'
```

---

## Troubleshooting

### Common Issues:

#### 1. Firebase Authentication Fails
- Verify `FIREBASE_SERVICE_ACCOUNT` is properly formatted JSON
- Ensure Firebase project is correctly configured
- Check that ID tokens are valid and not expired

#### 2. Gmail Fetch Fails
- Verify access token is valid and has Gmail scope
- Check Google Cloud Console for API quotas
- Ensure Gmail API is enabled in your project

#### 3. OpenAI Errors
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has sufficient credits
- Review rate limits and usage quotas

#### 4. Database Connection Issues
- Verify MongoDB URI is correct and accessible
- Check MongoDB Atlas cluster is running
- Ensure network access is configured properly

---

## Support & Contact

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team
- Review API documentation

---

## License

This project is private and confidential.

---

## Changelog

### Version 1.0.0 (2025-10-18)
- Initial release
- Firebase Authentication integration
- Gmail API integration
- ChatGPT summarization
- Conversational AI chat
- MongoDB Atlas database
- RESTful API endpoints
- User-based data isolation

### Version 1.1.0 (2025-10-18)
- Migrated from Supabase to MongoDB Atlas
- Updated to use Mongoose ODM
- Improved data models and relationships
- Enhanced error handling and logging
