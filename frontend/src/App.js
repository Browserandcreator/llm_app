// App.js - 旅游规划应用的主组件文件
// 该文件是整个前端应用的核心，负责管理应用状态、处理用户交互和组织UI布局

// 导入React核心库和钩子函数
import React, { useState, useEffect } from 'react'; 

// 导入Material UI主题相关组件
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// 导入自定义组件：侧边栏和聊天区域
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// 导入样式文件
import './App.css';

// 导入UUID生成库，用于创建唯一标识符
import { v4 as uuidv4 } from 'uuid';

// 创建应用主题，定义颜色方案
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // 主色调：蓝色
    },
    background: {
      default: '#f5f5f5', // 背景色：浅灰色
    },
  },
});

function App() {
  // 状态管理
  // conversations: 存储所有对话数据的数组
  const [conversations, setConversations] = useState([]);
  
  // currentConversationId: 当前选中的对话ID
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // isSidebarOpen: 侧边栏是否打开的状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 副作用钩子：在组件挂载或conversations变化时执行
  useEffect(() => {
    // 如果没有对话，则初始化一个新对话
    if (conversations.length === 0) {
      const newConversationId = uuidv4(); // 生成唯一ID
      setConversations([{
        id: newConversationId,
        title: '新的旅游规划', // 默认对话标题
        messages: [] // 初始化空消息数组
      }]);
      setCurrentConversationId(newConversationId); // 设置为当前对话
    }
  }, [conversations]);

  // 创建新对话的处理函数
  const handleNewConversation = () => {
    const newConversationId = uuidv4();
    setConversations([...conversations, {
      id: newConversationId,
      title: '新的旅游规划',
      messages: []
    }]);
    setCurrentConversationId(newConversationId); // 自动切换到新创建的对话
  };

  // 选择对话的处理函数
  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  // 删除对话的处理函数
  const handleDeleteConversation = (id) => {
    // 过滤掉要删除的对话
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);
    
    // 如果删除的是当前对话，则自动选择第一个对话或创建新对话
    if (currentConversationId === id && updatedConversations.length > 0) {
      setCurrentConversationId(updatedConversations[0].id);
    } else if (updatedConversations.length === 0) {
      handleNewConversation(); // 如果删除后没有对话，则创建一个新对话
    }
  };

  // 发送消息的处理函数（异步）
  const handleSendMessage = async (message) => {
    // 验证消息不为空
    if (!message.trim()) return;

    // 查找当前对话
    const currentConversation = conversations.find(conv => conv.id === currentConversationId);
    if (!currentConversation) return;

    // 创建用户消息对象
    const userMessage = {
      id: uuidv4(),
      content: message,
      sender: 'user', // 标记为用户发送
      timestamp: new Date().toISOString() // 记录发送时间
    };

    // 更新对话标题（如果是第一条消息）
    let updatedTitle = currentConversation.title;
    if (currentConversation.messages.length === 0) {
      // 截取消息前20个字符作为标题，过长则添加省略号
      updatedTitle = message.length > 20 ? `${message.substring(0, 20)}...` : message;
    }

    // 更新对话列表，添加用户消息
    const updatedConversations = conversations.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          title: updatedTitle,
          messages: [...conv.messages, userMessage]
        };
      }
      return conv;
    });

    setConversations(updatedConversations);

    try {
      // 创建并显示"加载中"消息
      const loadingMessageId = uuidv4();
      const loadingMessage = {
        id: loadingMessageId,
        content: '思考中...',
        sender: 'assistant', // 标记为助手发送
        isLoading: true, // 标记为加载状态
        timestamp: new Date().toISOString()
      };

      // 将加载消息添加到当前对话
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, loadingMessage]
            };
          }
          return conv;
        });
      });

      // 调用后端API获取回复
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message, // 当前消息
          conversationId: currentConversationId, // 对话ID
          messages: updatedConversations.find(conv => conv.id === currentConversationId).messages // 对话历史
        }),
      });

      // 检查响应状态
      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      // 解析响应数据
      const data = await response.json();

      // 创建助手回复消息，替换加载中消息
      const assistantMessage = {
        id: uuidv4(),
        content: data.reply, // 使用API返回的回复内容
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };

      // 更新对话，将加载消息替换为实际回复
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === loadingMessageId ? assistantMessage : msg
              )
            };
          }
          return conv;
        });
      });
    } catch (error) {
      // 错误处理
      console.error('Error sending message:', error);
      
      // 将加载消息更新为错误消息
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg => {
                if (msg.isLoading) {
                  return {
                    ...msg,
                    content: '抱歉，处理您的请求时出现错误。请稍后再试。',
                    isLoading: false,
                    isError: true // 标记为错误状态
                  };
                }
                return msg;
              })
            };
          }
          return conv;
        });
      });
    }
  };

  // 切换侧边栏显示/隐藏的函数
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 获取当前对话，如果不存在则提供默认值
  const currentConversation = conversations.find(conv => conv.id === currentConversationId) || { messages: [] };

  // 渲染应用界面
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* 重置CSS基础样式 */}
      <Box className="app-container">
        {/* 侧边栏组件 */}
        <Sidebar 
          conversations={conversations} // 所有对话
          currentConversationId={currentConversationId} // 当前对话ID
          onNewConversation={handleNewConversation} // 新建对话处理函数
          onSelectConversation={handleSelectConversation} // 选择对话处理函数
          onDeleteConversation={handleDeleteConversation} // 删除对话处理函数
          isOpen={isSidebarOpen} // 侧边栏开关状态
          toggleSidebar={toggleSidebar} // 切换侧边栏函数
        />
        {/* 聊天区域组件 */}
        <ChatArea 
          messages={currentConversation.messages} // 当前对话的消息列表
          onSendMessage={handleSendMessage} // 发送消息处理函数
          isSidebarOpen={isSidebarOpen} // 侧边栏状态（用于响应式布局）
        />
      </Box>
    </ThemeProvider>
  );
}

// 导出App组件
export default App;