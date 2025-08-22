const axios = require('axios');

// DeepSeek API服务
const deepseekService = {
  /**
   * 调用DeepSeek API生成回复
   * @param {string} prompt - 提示词
   * @returns {Promise<string>} - 生成的回复
   */
  generateResponse: async (prompt) => {
    try {
      // 检查API密钥是否配置
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API密钥未配置');
      }

      // 调用DeepSeek API
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',  // 使用适当的模型名称
          messages: [
            { role: 'system', content: '你是一个专业的旅游规划助手，擅长根据用户需求提供详细的旅游规划建议。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          }
        }
      );

      // 返回生成的回复
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('调用DeepSeek API时出错:', error);
      
      // 如果是API错误，提取错误信息
      if (error.response && error.response.data) {
        throw new Error(`DeepSeek API错误: ${JSON.stringify(error.response.data)}`);
      }
      
      throw error;
    }
  }
};

module.exports = deepseekService;