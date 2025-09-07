/**
 * 用户认证服务模块
 * 处理用户注册、登录、JWT令牌生成和验证
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// JWT密钥（生产环境应使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 令牌有效期7天

const authService = {
  /**
   * 用户注册
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 注册结果
   */
  register: async (username, email, password) => {
    try {
      // 检查用户名是否已存在
      const existingUser = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [username, email],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingUser) {
        throw new Error('用户名或邮箱已存在');
      }

      // 加密密码
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 插入新用户
      const userId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, passwordHash],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // 生成JWT令牌
      const token = jwt.sign(
        { userId, username, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        success: true,
        message: '注册成功',
        user: { id: userId, username, email },
        token
      };
    } catch (error) {
      console.error('用户注册错误:', error);
      return {
        success: false,
        message: error.message || '注册失败'
      };
    }
  },

  /**
   * 用户登录
   * @param {string} username - 用户名或邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  login: async (username, password) => {
    try {
      // 查找用户
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
          [username, username],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        success: true,
        message: '登录成功',
        user: { id: user.id, username: user.username, email: user.email },
        token
      };
    } catch (error) {
      console.error('用户登录错误:', error);
      return {
        success: false,
        message: error.message || '登录失败'
      };
    }
  },

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Promise<Object>} 验证结果
   */
  verifyToken: async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 验证用户是否仍然存在
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id, username, email FROM users WHERE id = ?',
          [decoded.userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      return {
        success: true,
        user: { id: user.id, username: user.username, email: user.email }
      };
    } catch (error) {
      console.error('令牌验证错误:', error);
      return {
        success: false,
        message: '令牌无效或已过期'
      };
    }
  },

  /**
   * 刷新JWT令牌
   * @param {string} token - 当前令牌
   * @returns {Promise<Object>} 新令牌
   */
  refreshToken: async (token) => {
    try {
      const verification = await authService.verifyToken(token);
      if (!verification.success) {
        throw new Error('令牌无效');
      }

      const newToken = jwt.sign(
        { 
          userId: verification.user.id, 
          username: verification.user.username, 
          email: verification.user.email 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        success: true,
        token: newToken,
        user: verification.user
      };
    } catch (error) {
      console.error('令牌刷新错误:', error);
      return {
        success: false,
        message: '令牌刷新失败'
      };
    }
  }
};

module.exports = authService;