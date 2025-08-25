/**
 * API路由配置文件
 * 定义所有API端点及其对应的控制器方法
 */

// 导入依赖
const express = require('express');  // Express框架
const router = express.Router();     // 创建路由实例
const chatController = require('../controllers/chatController');  // 导入聊天控制器

// 聊天API路由
// POST /api/chat - 处理用户聊天请求，调用chatController的processChat方法
router.post('/chat', chatController.processChat);

// 导出路由配置，供server.js使用
module.exports = router;