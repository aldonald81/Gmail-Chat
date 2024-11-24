const express = require('express');
const { fetchAllEmails, fetchRecentEmails, fetchUnreadEmails } = require('../controllers/emailController');

const router = express.Router();

router.get('/getAllEmails', fetchAllEmails);
router.get('/getRecentEmails', fetchRecentEmails);
router.get('/getUnreadEmails', fetchUnreadEmails);


module.exports = router;
