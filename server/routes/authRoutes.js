const express = require('express');
const { generateAuthUrl, handleAuthCallback, checkAuthStatus } = require('../controllers/authController');

const router = express.Router();

router.get('/gmail/url', generateAuthUrl);
router.get('/gmail/callback', handleAuthCallback);
router.get('/status', checkAuthStatus);

module.exports = router;
