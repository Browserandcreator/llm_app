/**
 * 聊天控制器
 * 处理聊天相关的请求，调用DeepSeek服务生成回复
 */

// 导入DeepSeek服务
const deepseekService = require('../services/deepseekService');

/**
 * 处理聊天请求
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

    // 构建提示词，包含对话历史和当前消息
    const prompt = buildPrompt(message, messages);
    
    // 调用DeepSeek API生成回复
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
 * 组合对话历史、当前消息和指导提示，生成完整的提示词
 * 
 * @param {string} currentMessage - 用户当前发送的消息
 * @param {Array} previousMessages - 历史消息数组
 * @returns {string} 完整的提示词
 */
function buildPrompt(currentMessage, previousMessages) {
  // 提取用户输入的旅游信息（目的地、人数、天数、预算等）
  const userInputInfo = extractTravelInfo(currentMessage);
  
  // 构建对话历史字符串
  let conversationHistory = '';
  if (previousMessages && previousMessages.length > 0) {
    // 将历史消息转换为文本格式
    conversationHistory = previousMessages
      .filter(msg => !msg.isLoading) // 过滤掉加载中的消息
      .map(msg => `${msg.sender === 'user' ? '用户' : '助手'}: ${msg.content}`)
      .join('\n');
    
    // 如果有对话历史，添加标题
    if (conversationHistory) {
      conversationHistory = `对话历史:\n${conversationHistory}\n\n`;
    }
  }
  
  // 构建完整提示词，包含：
  // 1. 对话历史（如果有）
  // 2. 当前用户消息
  // 3. 系统指令（旅游助手角色定义）
  // 4. 提取的旅游信息（如果有）
  // 5. 回复要求和格式指导
  return `${conversationHistory}用户: ${currentMessage}\n\n你是一个专业的旅游规划助手。请根据用户提供的以下信息，生成一个详细的旅游规划：

${userInputInfo ? `用户提供的信息：\n${userInputInfo}\n\n` : ''}

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

/**
 * 从用户消息中提取旅游相关信息
 * 使用正则表达式匹配人数、天数、预算和目的地等关键信息
 * 
 * @param {string} message - 用户消息
 * @returns {string} 格式化的旅游信息文本
 */
function extractTravelInfo(message) {
  // 使用正则表达式从用户消息中提取关键旅游信息
  // 每种信息都有两种匹配模式，以提高匹配成功率
  const peopleMatch = message.match(/([0-9]+)\s*人/) || message.match(/人数\s*[：:]*\s*([0-9]+)/);
  const daysMatch = message.match(/([0-9]+)\s*天/) || message.match(/时间\s*[：:]*\s*([0-9]+)\s*天/);
  const budgetMatch = message.match(/([0-9]+)\s*元/) || message.match(/预算\s*[：:]*\s*([0-9]+)/);
  const destinationMatch = message.match(/去\s*([^，。,.]*)/)||message.match(/目的地\s*[：:]*\s*([^，。,.]*)/);

  // 提取匹配结果
  const people = peopleMatch ? peopleMatch[1] : null;
  const days = daysMatch ? daysMatch[1] : null;
  const budget = budgetMatch ? budgetMatch[1] : null;
  const destination = destinationMatch ? destinationMatch[1] : null;

  // 构建结果字符串
  let result = '';
  
  // 只添加成功提取到的信息
  if (people) result += `游玩人数: ${people}人\n`;
  if (days) result += `旅游时间: ${days}天\n`;
  if (destination) result += `目的地: ${destination}\n`;
  if (budget) result += `预算: ${budget}元\n`;
  
  return result;
}