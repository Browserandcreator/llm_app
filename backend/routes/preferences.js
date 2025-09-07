/**
 * 用户偏好路由
 * 处理用户偏好的获取、保存和旅游历史记录
 */

const express = require('express');
const preferenceService = require('../services/preferenceService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 获取用户偏好
 * GET /api/preferences
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await preferenceService.getUserPreferences(req.user.id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('获取偏好路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 保存用户偏好
 * POST /api/preferences
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { preferenceType, preferenceValue, weight } = req.body;

    // 验证输入
    if (!preferenceType || !preferenceValue) {
      return res.status(400).json({
        success: false,
        message: '偏好类型和值都是必填项'
      });
    }

    const result = await preferenceService.savePreference(
      req.user.id,
      preferenceType,
      preferenceValue,
      weight
    );
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('保存偏好路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 从旅游信息中提取偏好
 * POST /api/preferences/extract
 */
router.post('/extract', authenticateToken, async (req, res) => {
  try {
    const { travelInfo } = req.body;

    // 验证输入
    if (!travelInfo) {
      return res.status(400).json({
        success: false,
        message: '旅游信息是必填项'
      });
    }

    const result = await preferenceService.extractPreferencesFromTravel(
      req.user.id,
      travelInfo
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('提取偏好路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 保存旅游历史记录
 * POST /api/preferences/history
 */
router.post('/history', authenticateToken, async (req, res) => {
  try {
    const { destination, days, people, budget, travelPlan } = req.body;

    // 验证输入
    if (!destination || !days || !people || !budget) {
      return res.status(400).json({
        success: false,
        message: '目的地、天数、人数和预算都是必填项'
      });
    }

    const travelData = {
      destination,
      days: parseInt(days),
      people: parseInt(people),
      budget: parseFloat(budget),
      travelPlan
    };

    const result = await preferenceService.saveTravelHistory(
      req.user.id,
      travelData
    );
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('保存旅游历史路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取旅游历史记录
 * GET /api/preferences/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await preferenceService.getTravelHistory(req.user.id, limit);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('获取旅游历史路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取个性化推荐提示
 * GET /api/preferences/personalized-prompt
 */
router.get('/personalized-prompt', authenticateToken, async (req, res) => {
  try {
    const prompt = await preferenceService.generatePersonalizedPrompt(req.user.id);
    
    res.json({
      success: true,
      prompt
    });
  } catch (error) {
    console.error('获取个性化提示路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 批量保存偏好
 * POST /api/preferences/batch
 */
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;

    // 验证输入
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        success: false,
        message: '偏好列表不能为空'
      });
    }

    const results = [];
    for (const pref of preferences) {
      if (!pref.preferenceType || !pref.preferenceValue) {
        continue;
      }
      
      const result = await preferenceService.savePreference(
        req.user.id,
        pref.preferenceType,
        pref.preferenceValue,
        pref.weight || 1.0
      );
      results.push(result);
    }

    res.json({
      success: true,
      message: '批量保存完成',
      results,
      processedCount: results.length
    });
  } catch (error) {
    console.error('批量保存偏好路由错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;