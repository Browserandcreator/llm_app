/**
 * 认证中间件
 * 验证JWT令牌并提取用户信息
 */

const authService = require('../services/authService');

/**
 * JWT认证中间件
 * 验证请求头中的Authorization令牌
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const verification = await authService.verifyToken(token);
    
    if (!verification.success) {
      return res.status(403).json({
        success: false,
        message: verification.message || '令牌无效'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = verification.user;
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行（用于可选登录的功能）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const verification = await authService.verifyToken(token);
      if (verification.success) {
        req.user = verification.user;
      }
    }

    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    // 即使出错也继续执行，不阻断请求
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};