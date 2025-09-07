/**
 * 认证路由
 * 处理用户注册、登录、令牌刷新等认证相关请求
 */

const express = require('express');
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码都是必填项'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    const result = await authService.register(username, email, password);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('注册路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码都是必填项'
      });
    }

    const result = await authService.login(username, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('登录路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '令牌缺失'
      });
    }

    const result = await authService.refreshToken(token);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('刷新令牌路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('获取用户信息路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 验证令牌
 * POST /api/auth/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '令牌缺失'
      });
    }

    const result = await authService.verifyToken(token);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('验证令牌路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;