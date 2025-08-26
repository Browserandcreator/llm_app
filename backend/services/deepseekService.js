/**
 * DeepSeek API服务模块
 * 负责与DeepSeek API进行通信，发送提示词并获取AI生成的回复
 * 实现两阶段调用：信息提取和旅游规划生成
 */

// 导入axios用于发送HTTP请求
const axios = require('axios');

// DeepSeek API服务对象
const deepseekService = {
  /**
   * 调用DeepSeek API提取旅游信息
   * 作为信息中介，从用户对话中提取旅游相关信息
   * 
   * @param {string} message - 用户消息
   * @param {Array} previousMessages - 历史消息数组
   * @returns {Promise<Object>} - 包含提取的旅游信息和可能的回复
   * @throws {Error} - 如果API调用失败或配置错误
   */
  extractTravelInfo: async (message, previousMessages) => {
    try {
      // 检查API密钥是否在环境变量中配置
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API密钥未配置');
      }

      // 构建对话历史字符串
      let conversationHistory = '';
      if (previousMessages && previousMessages.length > 0) {
        // 将历史消息转换为文本格式
        conversationHistory = previousMessages
          .filter(msg => !msg.isLoading) // 过滤掉加载中的消息
          .map(msg => `${msg.sender === 'user' ? '用户' : '助手'}: ${msg.content}`)
          .join('\n');
      }

      // 调用DeepSeek API的chat completions端点
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          // 请求体参数
          model: 'deepseek-chat',  // 使用DeepSeek的聊天模型
          messages: [
            // 系统消息定义AI助手的角色和行为
            { 
              role: 'system', 
              content: '你是一个旅游信息提取助手，你的任务是从用户对话中提取旅游相关信息（目的地、人数、天数、预算）。如果信息不完整，你需要生成一个友好的回复向用户询问缺失的信息。如果信息完整，你需要将这些信息整理成标准格式。' 
            },
            // 用户消息
            { 
              role: 'user', 
              content: `以下是用户的对话历史和当前消息，请提取旅游相关信息：\n\n${conversationHistory ? conversationHistory + '\n\n' : ''}用户: ${message}\n\n请提取以下信息：\n1. 目的地\n2. 旅游天数\n3. 旅游人数\n4. 预算\n\n如果信息不完整，请生成一个友好的回复向用户询问缺失的信息。如果信息完整，请将这些信息整理成以下格式：\n{\n  "isComplete": true,\n  "destination": "目的地",\n  "days": "天数",\n  "people": "人数",\n  "budget": "预算",\n  "reply": null\n}\n\n如果信息不完整，请将isComplete设为false，并在reply字段中提供向用户询问缺失信息的回复：\n{\n  "isComplete": false,\n  "destination": "已提供的目的地或null",\n  "days": "已提供的天数或null",\n  "people": "已提供的人数或null",\n  "budget": "已提供的预算或null",\n  "reply": "向用户询问缺失信息的友好回复"\n}`
            }
          ],
          temperature: 0.3,     // 低温度以获得更确定性的回复
          max_tokens: 1000      // 限制回复的最大长度
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
      const content = response.data.choices[0].message.content;
      
      // 尝试解析JSON响应
      try {
        // 查找JSON对象的开始和结束位置
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = content.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonStr);
        } else {
          // 如果无法找到JSON，返回不完整状态
          return {
            isComplete: false,
            destination: null,
            days: null,
            people: null,
            budget: null,
            reply: "抱歉，我无法理解您的旅游需求。请提供目的地、旅游天数、人数和预算信息。"
          };
        }
      } catch (parseError) {
        console.error('解析DeepSeek响应时出错:', parseError);
        return {
          isComplete: false,
          destination: null,
          days: null,
          people: null,
          budget: null,
          reply: "抱歉，我无法理解您的旅游需求。请提供目的地、旅游天数、人数和预算信息。"
        };
      }
    } catch (error) {
      // 错误处理和日志记录
      console.error('调用DeepSeek API提取信息时出错:', error);
      
      // 如果是API返回的错误，提取并格式化错误信息
      if (error.response && error.response.data) {
        throw new Error(`DeepSeek API错误: ${JSON.stringify(error.response.data)}`);
      }
      
      // 重新抛出原始错误
      throw error;
    }
  },
  
  /**
   * 调用DeepSeek API生成旅游规划回复
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