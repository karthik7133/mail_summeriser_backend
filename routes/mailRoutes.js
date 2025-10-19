const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', mailController.getAllMails);
router.get('/:id', mailController.getMailById);
router.post('/fetch', mailController.fetchGmailEmails);
router.post('/summarize/:id', mailController.summarizeMail);
router.delete('/:id', mailController.deleteMail);

module.exports = router;
