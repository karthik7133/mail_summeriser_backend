# Mail Summarizer Backend API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All API endpoints (except auth endpoints) require a Firebase JWT token in the Authorization header:
```
Authorization: Bearer <firebase_jwt_token>
```

---

## 🔐 Authentication APIs

### 1. Verify/Create User
**Endpoint:** `POST /api/auth/verify`

**Description:** Verify Firebase token and create user if doesn't exist

**Request Body:**
```json
{
  "firebase_uid": "string (required)",
  "name": "string (optional)",
  "email": "string (required)",
  "profile_pic": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string (MongoDB ObjectId)",
    "firebase_uid": "string",
    "name": "string",
    "email": "string",
    "profile_pic": "string",
    "created_at": "ISO 8601 timestamp"
  }
}
```

**Error Response:**
```json
{
  "error": "Firebase UID and email are required"
}
```

### 2. Get Current User
**Endpoint:** `GET /api/auth/me`

**Description:** Get current authenticated user details

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string (MongoDB ObjectId)",
    "firebase_uid": "string",
    "name": "string",
    "email": "string",
    "profile_pic": "string",
    "created_at": "ISO 8601 timestamp"
  }
}
```

**Error Response:**
```json
{
  "error": "User not found"
}
```

---

## 📧 Mail Management APIs

### 1. Get All Mails
**Endpoint:** `GET /api/mails`

**Description:** Get all mails for the authenticated user

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of mails to return (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "mails": [
    {
      "_id": "string (MongoDB ObjectId)",
      "user_id": "string (MongoDB ObjectId)",
      "mail_id": "string (Gmail message ID)",
      "from_address": "string",
      "subject": "string",
      "body": "string",
      "summary": "string",
      "received_at": "ISO 8601 timestamp",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ]
}
```

### 2. Get Mail by ID
**Endpoint:** `GET /api/mails/:id`

**Description:** Get specific mail by MongoDB ID

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the mail

**Response:**
```json
{
  "success": true,
  "mail": {
    "_id": "string (MongoDB ObjectId)",
    "user_id": "string (MongoDB ObjectId)",
    "mail_id": "string (Gmail message ID)",
    "from_address": "string",
    "subject": "string",
    "body": "string",
    "summary": "string",
    "received_at": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Error Response:**
```json
{
  "error": "Mail not found"
}
```

### 3. Fetch Gmail Emails
**Endpoint:** `POST /api/mails/fetch`

**Description:** Fetch emails from Gmail API and save to database

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Request Body:**
```json
{
  "accessToken": "string (required) - Gmail OAuth access token",
  "maxResults": "number (optional) - Max emails to fetch (default: 10)"
}
```

**Response:**
```json
{
  "success": true,
  "fetched": 10,
  "saved": 8,
  "skipped": 2,
  "mails": [
    {
      "_id": "string (MongoDB ObjectId)",
      "user_id": "string (MongoDB ObjectId)",
      "mail_id": "string (Gmail message ID)",
      "from_address": "string",
      "subject": "string",
      "body": "string",
      "summary": "",
      "received_at": "ISO 8601 timestamp",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Access token is required"
}
```

### 4. Summarize Email
**Endpoint:** `POST /api/mails/summarize/:id`

**Description:** Generate AI summary for a specific email

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the mail

**Response:**
```json
{
  "success": true,
  "message": "Email summarized successfully",
  "mail": {
    "_id": "string (MongoDB ObjectId)",
    "user_id": "string (MongoDB ObjectId)",
    "mail_id": "string (Gmail message ID)",
    "from_address": "string",
    "subject": "string",
    "body": "string",
    "summary": "AI-generated summary text",
    "received_at": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**If already summarized:**
```json
{
  "success": true,
  "message": "Summary already exists",
  "mail": {
    // ... mail object with existing summary
  }
}
```

### 5. Delete Mail
**Endpoint:** `DELETE /api/mails/:id`

**Description:** Delete a specific mail

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Path Parameters:**
- `id`: MongoDB ObjectId of the mail

**Response:**
```json
{
  "success": true,
  "message": "Mail deleted successfully"
}
```

---

## 💬 Chat APIs

### 1. Get Chat History
**Endpoint:** `GET /api/chat/:mailId`

**Description:** Get chat history for a specific email

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Path Parameters:**
- `mailId`: MongoDB ObjectId of the mail

**Response (with existing chat):**
```json
{
  "success": true,
  "chatId": "string (MongoDB ObjectId)",
  "mailId": "string (MongoDB ObjectId)",
  "messages": [
    {
      "role": "user",
      "content": "What is this email about?",
      "timestamp": "ISO 8601 timestamp"
    },
    {
      "role": "ai",
      "content": "This email is about...",
      "timestamp": "ISO 8601 timestamp"
    }
  ]
}
```

**Response (no chat exists):**
```json
{
  "success": true,
  "messages": [],
  "mailId": "string (MongoDB ObjectId)"
}
```

### 2. Send Chat Message
**Endpoint:** `POST /api/chat/:mailId`

**Description:** Send a message and get AI response about the email

**Headers:**
```
Authorization: Bearer <firebase_jwt_token>
```

**Path Parameters:**
- `mailId`: MongoDB ObjectId of the mail

**Request Body:**
```json
{
  "message": "string (required) - User's question about the email"
}
```

**Response:**
```json
{
  "success": true,
  "chatId": "string (MongoDB ObjectId)",
  "userMessage": "What is this email about?",
  "aiResponse": "This email is about a meeting request...",
  "messages": [
    {
      "role": "user",
      "content": "What is this email about?",
      "timestamp": "ISO 8601 timestamp"
    },
    {
      "role": "ai",
      "content": "This email is about a meeting request...",
      "timestamp": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Message is required"
}
```

---

## 🏥 Health Check APIs

### 1. API Info
**Endpoint:** `GET /`

**Description:** Get API information and available endpoints

**Response:**
```json
{
  "message": "Mail Summarizer API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "mails": "/api/mails",
    "chat": "/api/chat"
  }
}
```

### 2. Health Check
**Endpoint:** `GET /health`

**Description:** Check if the server is running

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 Error Handling

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Error message",
  "details": "Additional error details (in development mode)"
}
```

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found",
  "path": "/api/endpoint"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "Error details (in development mode)"
}
```

---

## 📝 Frontend Implementation Notes

### 1. Authentication Flow
1. Get Firebase JWT token from Firebase Auth
2. Call `POST /api/auth/verify` with user details
3. Store the returned user object
4. Use the Firebase JWT token for all subsequent API calls

### 2. Mail Management Flow
1. Get Gmail OAuth access token
2. Call `POST /api/mails/fetch` to fetch emails
3. Display emails using `GET /api/mails`
4. Summarize emails using `POST /api/mails/summarize/:id`

### 3. Chat Flow
1. Select an email
2. Call `GET /api/chat/:mailId` to get chat history
3. Send messages using `POST /api/chat/:mailId`
4. Display the conversation

### 4. Required Environment Variables
Make sure these are set in your backend:
- `MONGODB_URI`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key
- `PORT`: Server port (default: 5000)

---

## 🚀 Getting Started

1. Start the backend server:
   ```bash
   npm start
   ```

2. The server will run on `http://localhost:5000`

3. Test the health endpoint:
   ```bash
   curl http://localhost:5000/health
   ```

4. All API endpoints are ready to use with proper authentication!
