/**
 * DeepSeek API服务模块
 * 负责与DeepSeek API进行通信，发送提示词并获取AI生成的回复
 */

// 导入axios用于发送HTTP请求
const axios = require('axios');

// DeepSeek API服务对象
const deepseekService = {
  /**
   * 调用DeepSeek API生成回复
   * 发送提示词到DeepSeek API并处理响应
   * 
   * @param {string} prompt - 完整的提示词文本
   * @returns {Promise<string>} - 生成的AI回复文本
   * @throws {Error} - 如果API调用失败或配置错误
   */
  generateResponse: async (prompt) => {
    try {
      // 检查API密钥是否在环境变量中配置
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API密钥未配置');
      }

      // 调用DeepSeek API的chat completions端点
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          // 请求体参数
          model: 'deepseek-chat',  // 使用DeepSeek的聊天模型
          messages: [
            // 系统消息定义AI助手的角色和行为
            { role: 'system', content: '你是一个专业的旅游规划助手，擅长根据用户需求提供详细的旅游规划建议。' },
            // 用户消息包含完整提示词
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,     // 控制回复的创造性/随机性（0-1）
          max_tokens: 2000      // 限制回复的最大长度
        },
        {
          // 请求头配置
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // 身份验证
          }
        }
      );

      // 从响应中提取AI生成的回复文本
      return response.data.choices[0].message.content;
    } catch (error) {
      // 错误处理和日志记录
      console.error('调用DeepSeek API时出错:', error);
      
      // 如果是API返回的错误，提取并格式化错误信息
      if (error.response && error.response.data) {
        throw new Error(`DeepSeek API错误: ${JSON.stringify(error.response.data)}`);
      }
      
      // 重新抛出原始错误
      throw error;
    }
  }
};

module.exports = deepseekService;