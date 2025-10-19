const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:mailId', chatController.getChatHistory);
router.post('/:mailId', chatController.sendChatMessage);

module.exports = router;
