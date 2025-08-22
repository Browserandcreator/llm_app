const deepseekService = require('../services/deepseekService');

exports.processChat = async (req, res) => {
  try {
    const { message, conversationId, messages } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    // 构建提示词
    const prompt = buildPrompt(message, messages);
    
    // 调用DeepSeek API
    const reply = await deepseekService.generateResponse(prompt);
    
    return res.json({ reply, conversationId });
  } catch (error) {
    console.error('处理聊天请求时出错:', error);
    return res.status(500).json({ message: '生成回复时出错', error: error.message });
  }
};

// 构建提示词
function buildPrompt(currentMessage, previousMessages) {
  // 提取用户输入的旅游信息
  const userInputInfo = extractTravelInfo(currentMessage);
  
  // 构建对话历史
  let conversationHistory = '';
  if (previousMessages && previousMessages.length > 0) {
    conversationHistory = previousMessages
      .filter(msg => !msg.isLoading) // 过滤掉加载中的消息
      .map(msg => `${msg.sender === 'user' ? '用户' : '助手'}: ${msg.content}`)
      .join('\n');
    
    if (conversationHistory) {
      conversationHistory = `对话历史:\n${conversationHistory}\n\n`;
    }
  }
  
  // 构建完整提示词
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

// 提取旅游信息
function extractTravelInfo(message) {
  // 尝试从用户消息中提取关键信息
  const peopleMatch = message.match(/([0-9]+)\s*人/) || message.match(/人数\s*[：:]*\s*([0-9]+)/);
  const daysMatch = message.match(/([0-9]+)\s*天/) || message.match(/时间\s*[：:]*\s*([0-9]+)\s*天/);
  const budgetMatch = message.match(/([0-9]+)\s*元/) || message.match(/预算\s*[：:]*\s*([0-9]+)/);
  const destinationMatch = message.match(/去\s*([^，。,.]*)/) || message.match(/目的地\s*[：:]*\s*([^，。,.]*)/); 

  const people = peopleMatch ? peopleMatch[1] : null;
  const days = daysMatch ? daysMatch[1] : null;
  const budget = budgetMatch ? budgetMatch[1] : null;
  const destination = destinationMatch ? destinationMatch[1] : null;

  let result = '';
  
  if (people) result += `游玩人数: ${people}人\n`;
  if (days) result += `旅游时间: ${days}天\n`;
  if (destination) result += `目的地: ${destination}\n`;
  if (budget) result += `预算: ${budget}元\n`;
  
  return result;
}