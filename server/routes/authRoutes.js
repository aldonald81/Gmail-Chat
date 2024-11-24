const express = require('express');
const { generateAuthUrl, handleAuthCallback } = require('../controllers/authController');

const router = express.Router();

router.get('/gmail/url', generateAuthUrl);
router.get('/gmail/callback', handleAuthCallback);

module.exports = router;
