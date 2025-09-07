/**
 * 用户偏好服务模块
 * 处理用户偏好的存储、检索和分析
 */

const { db } = require('../config/database');

const preferenceService = {
  /**
   * 保存用户偏好
   * @param {number} userId - 用户ID
   * @param {string} preferenceType - 偏好类型
   * @param {string} preferenceValue - 偏好值
   * @param {number} weight - 权重（默认1.0）
   * @returns {Promise<Object>} 保存结果
   */
  savePreference: async (userId, preferenceType, preferenceValue, weight = 1.0) => {
    try {
      // 检查是否已存在相同偏好，如果存在则更新权重
      const existingPreference = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id, weight FROM user_preferences WHERE user_id = ? AND preference_type = ? AND preference_value = ?',
          [userId, preferenceType, preferenceValue],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingPreference) {
        // 更新权重（增加权重表示用户对此偏好的强化）
        const newWeight = Math.min(existingPreference.weight + weight, 5.0); // 最大权重5.0
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE user_preferences SET weight = ? WHERE id = ?',
            [newWeight, existingPreference.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        return {
          success: true,
          message: '偏好权重已更新',
          preferenceId: existingPreference.id
        };
      } else {
        // 插入新偏好
        const preferenceId = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO user_preferences (user_id, preference_type, preference_value, weight) VALUES (?, ?, ?, ?)',
            [userId, preferenceType, preferenceValue, weight],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        return {
          success: true,
          message: '偏好已保存',
          preferenceId
        };
      }
    } catch (error) {
      console.error('保存偏好错误:', error);
      return {
        success: false,
        message: '保存偏好失败'
      };
    }
  },

  /**
   * 获取用户所有偏好
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户偏好列表
   */
  getUserPreferences: async (userId) => {
    try {
      const preferences = await new Promise((resolve, reject) => {
        db.all(
          'SELECT preference_type, preference_value, weight FROM user_preferences WHERE user_id = ? ORDER BY weight DESC',
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // 按类型分组偏好
      const groupedPreferences = {};
      preferences.forEach(pref => {
        if (!groupedPreferences[pref.preference_type]) {
          groupedPreferences[pref.preference_type] = [];
        }
        groupedPreferences[pref.preference_type].push({
          value: pref.preference_value,
          weight: pref.weight
        });
      });

      return {
        success: true,
        preferences: groupedPreferences,
        totalCount: preferences.length
      };
    } catch (error) {
      console.error('获取用户偏好错误:', error);
      return {
        success: false,
        message: '获取偏好失败'
      };
    }
  },

  /**
   * 从旅游计划中提取并保存偏好
   * @param {number} userId - 用户ID
   * @param {Object} travelInfo - 旅游信息
   * @returns {Promise<Object>} 提取结果
   */
  extractPreferencesFromTravel: async (userId, travelInfo) => {
    try {
      const preferences = [];

      // 提取目的地偏好
      if (travelInfo.destination) {
        preferences.push({
          type: 'destination',
          value: travelInfo.destination,
          weight: 1.0
        });
      }

      // 提取预算偏好范围
      if (travelInfo.budget) {
        let budgetRange = '';
        const budget = parseFloat(travelInfo.budget);
        if (budget < 1000) budgetRange = '经济型';
        else if (budget < 3000) budgetRange = '中等';
        else if (budget < 8000) budgetRange = '高端';
        else budgetRange = '奢华';

        preferences.push({
          type: 'budget_range',
          value: budgetRange,
          weight: 1.0
        });
      }

      // 提取旅行天数偏好
      if (travelInfo.days) {
        let durationRange = '';
        const days = parseInt(travelInfo.days);
        if (days <= 3) durationRange = '短途';
        else if (days <= 7) durationRange = '中途';
        else durationRange = '长途';

        preferences.push({
          type: 'duration_range',
          value: durationRange,
          weight: 1.0
        });
      }

      // 提取人数偏好
      if (travelInfo.people) {
        let groupSize = '';
        const people = parseInt(travelInfo.people);
        if (people === 1) groupSize = '独自旅行';
        else if (people === 2) groupSize = '双人旅行';
        else if (people <= 4) groupSize = '小团体';
        else groupSize = '大团体';

        preferences.push({
          type: 'group_size',
          value: groupSize,
          weight: 1.0
        });
      }

      // 批量保存偏好
      const results = [];
      for (const pref of preferences) {
        const result = await preferenceService.savePreference(
          userId,
          pref.type,
          pref.value,
          pref.weight
        );
        results.push(result);
      }

      return {
        success: true,
        message: '偏好提取完成',
        extractedCount: preferences.length,
        results
      };
    } catch (error) {
      console.error('提取偏好错误:', error);
      return {
        success: false,
        message: '偏好提取失败'
      };
    }
  },

  /**
   * 保存旅游历史记录
   * @param {number} userId - 用户ID
   * @param {Object} travelData - 旅游数据
   * @returns {Promise<Object>} 保存结果
   */
  saveTravelHistory: async (userId, travelData) => {
    try {
      const historyId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO travel_history (user_id, destination, days, people, budget, travel_plan) VALUES (?, ?, ?, ?, ?, ?)',
          [
            userId,
            travelData.destination,
            travelData.days,
            travelData.people,
            travelData.budget,
            travelData.travelPlan
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      return {
        success: true,
        message: '旅游历史已保存',
        historyId
      };
    } catch (error) {
      console.error('保存旅游历史错误:', error);
      return {
        success: false,
        message: '保存旅游历史失败'
      };
    }
  },

  /**
   * 获取用户旅游历史
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Object>} 旅游历史
   */
  getTravelHistory: async (userId, limit = 10) => {
    try {
      const history = await new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM travel_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
          [userId, limit],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return {
        success: true,
        history,
        count: history.length
      };
    } catch (error) {
      console.error('获取旅游历史错误:', error);
      return {
        success: false,
        message: '获取旅游历史失败'
      };
    }
  },

  /**
   * 生成个性化推荐提示
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} 个性化提示
   */
  generatePersonalizedPrompt: async (userId) => {
    try {
      const preferencesResult = await preferenceService.getUserPreferences(userId);
      const historyResult = await preferenceService.getTravelHistory(userId, 5);

      if (!preferencesResult.success) {
        return '';
      }

      let prompt = '\n\n根据用户历史偏好进行个性化推荐：\n';

      // 添加偏好信息
      const preferences = preferencesResult.preferences;
      if (Object.keys(preferences).length > 0) {
        prompt += '用户偏好：\n';
        
        Object.entries(preferences).forEach(([type, prefs]) => {
          const topPrefs = prefs.slice(0, 3); // 取权重最高的3个
          const prefValues = topPrefs.map(p => `${p.value}(权重:${p.weight})`).join(', ');
          
          switch(type) {
            case 'destination':
              prompt += `- 偏爱目的地: ${prefValues}\n`;
              break;
            case 'budget_range':
              prompt += `- 预算偏好: ${prefValues}\n`;
              break;
            case 'duration_range':
              prompt += `- 旅行时长偏好: ${prefValues}\n`;
              break;
            case 'group_size':
              prompt += `- 旅行人数偏好: ${prefValues}\n`;
              break;
          }
        });
      }

      // 添加历史信息
      if (historyResult.success && historyResult.history.length > 0) {
        prompt += '\n最近旅行历史：\n';
        historyResult.history.slice(0, 3).forEach((trip, index) => {
          prompt += `${index + 1}. ${trip.destination} (${trip.days}天, ${trip.people}人, 预算${trip.budget}元)\n`;
        });
      }

      prompt += '\n请基于以上偏好信息，为用户提供更加个性化和精准的旅游建议。';

      return prompt;
    } catch (error) {
      console.error('生成个性化提示错误:', error);
      return '';
    }
  }
};

module.exports = preferenceService;