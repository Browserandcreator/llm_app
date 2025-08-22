import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';
import { v4 as uuidv4 } from 'uuid';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // 初始化一个新对话
    if (conversations.length === 0) {
      const newConversationId = uuidv4();
      setConversations([{
        id: newConversationId,
        title: '新的旅游规划',
        messages: []
      }]);
      setCurrentConversationId(newConversationId);
    }
  }, [conversations]);

  const handleNewConversation = () => {
    const newConversationId = uuidv4();
    setConversations([...conversations, {
      id: newConversationId,
      title: '新的旅游规划',
      messages: []
    }]);
    setCurrentConversationId(newConversationId);
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);
    
    if (currentConversationId === id && updatedConversations.length > 0) {
      setCurrentConversationId(updatedConversations[0].id);
    } else if (updatedConversations.length === 0) {
      handleNewConversation();
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const currentConversation = conversations.find(conv => conv.id === currentConversationId);
    if (!currentConversation) return;

    // 添加用户消息
    const userMessage = {
      id: uuidv4(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // 更新对话标题（如果是第一条消息）
    let updatedTitle = currentConversation.title;
    if (currentConversation.messages.length === 0) {
      updatedTitle = message.length > 20 ? `${message.substring(0, 20)}...` : message;
    }

    // 更新对话
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
      // 显示加载中消息
      const loadingMessageId = uuidv4();
      const loadingMessage = {
        id: loadingMessageId,
        content: '正在生成旅游规划...',
        sender: 'assistant',
        isLoading: true,
        timestamp: new Date().toISOString()
      };

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

      // 调用API获取回复
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
          messages: updatedConversations.find(conv => conv.id === currentConversationId).messages
        }),
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const data = await response.json();

      // 替换加载中消息为实际回复
      const assistantMessage = {
        id: uuidv4(),
        content: data.reply,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };

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
      console.error('Error sending message:', error);
      
      // 更新加载消息为错误消息
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg => {
                if (msg.isLoading) {
                  return {
                    ...msg,
                    content: '抱歉，生成旅游规划时出现错误。请稍后再试。',
                    isLoading: false,
                    isError: true
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const currentConversation = conversations.find(conv => conv.id === currentConversationId) || { messages: [] };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-container">
        <Sidebar 
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <ChatArea 
          messages={currentConversation.messages}
          onSendMessage={handleSendMessage}
          isSidebarOpen={isSidebarOpen}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;