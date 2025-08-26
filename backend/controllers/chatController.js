/**
 * 聊天控制器
 * 处理聊天相关的请求，调用DeepSeek服务生成回复
 */

// 导入DeepSeek服务
const deepseekService = require('../services/deepseekService');

/**
 * 处理聊天请求
 * 实现两阶段DeepSeek调用：
 * 1. 第一个DeepSeek调用作为信息中介，提取和确认用户旅游信息
 * 2. 第二个DeepSeek调用生成详细的旅游规划
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.message - 用户发送的消息
 * @param {string} req.body.conversationId - 会话ID
 * @param {Array} req.body.messages - 历史消息数组
 * @param {Object} res - Express响应对象
 * @returns {Object} 包含AI回复和会话ID的JSON响应
 */
exports.processChat = async (req, res) => {
  try {
    // 从请求体中提取必要参数
    const { message, conversationId, messages } = req.body;
    
    // 验证消息不能为空
    if (!message) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    // 第一阶段：调用DeepSeek API提取旅游信息
    const travelInfo = await deepseekService.extractTravelInfo(message, messages);
    
    // 如果信息不完整，返回询问用户的回复
    if (!travelInfo.isComplete && travelInfo.reply) {
      return res.json({ reply: travelInfo.reply, conversationId });
    }
    
    // 第二阶段：构建提示词，包含提取的旅游信息
    const prompt = buildPrompt(travelInfo);
    
    // 调用DeepSeek API生成旅游规划回复
    const reply = await deepseekService.generateResponse(prompt);
    
    // 返回成功响应
    return res.json({ reply, conversationId });
  } catch (error) {
    // 错误处理
    console.error('处理聊天请求时出错:', error);
    return res.status(500).json({ message: '生成回复时出错', error: error.message });
  }
};

/**
 * 构建发送给AI的提示词
 * 使用提取的旅游信息构建详细的旅游规划提示词
 * 
 * @param {Object} travelInfo - 提取的旅游信息对象
 * @param {string} travelInfo.destination - 目的地
 * @param {string} travelInfo.days - 旅游天数
 * @param {string} travelInfo.people - 旅游人数
 * @param {string} travelInfo.budget - 旅游预算
 * @returns {string} 完整的提示词
 */
function buildPrompt(travelInfo) {
  // 构建旅游信息字符串
  const travelInfoStr = [
    `目的地: ${travelInfo.destination}`,
    `旅游天数: ${travelInfo.days}天`,
    `旅游人数: ${travelInfo.people}人`,
    `预算: ${travelInfo.budget}元`
  ].join('\n');
  
  // 构建完整提示词，包含：
  // 1. 系统指令（旅游助手角色定义）
  // 2. 提取的旅游信息
  // 3. 回复要求和格式指导
  return `你是一个专业的旅游规划助手。请根据用户提供的以下信息，生成一个详细的旅游规划：

用户提供的信息：
${travelInfoStr}

请提供以下详细信息：
1. 详细的游玩路径和每日行程安排
2. 推荐的景点及其特色
3. 各个景点之间的交通工具和预计时间
4. 住宿酒店推荐（符合预算）
5. 餐饮推荐（当地特色美食）
6. 预算分配建议

请以Markdown格式回复，使用标题、列表和表格等元素使回复更加清晰易读。

助手:`;
}