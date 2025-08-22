const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// 聊天API路由
router.post('/chat', chatController.processChat);

module.exports = router;