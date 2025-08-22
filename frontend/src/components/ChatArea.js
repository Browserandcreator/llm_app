import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ReactMarkdown from 'react-markdown';

function ChatArea({ messages, onSendMessage, isSidebarOpen }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box className={`chat-area ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Box className="message-list">
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            textAlign: 'center',
            padding: 3
          }}>
            <Typography variant="h4" gutterBottom>旅游规划助手</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mb: 4 }}>
              请输入您的旅游需求，包括游玩人数、旅途时间、目的地和预算，我将为您生成详细的旅游规划。
            </Typography>
            <Paper elevation={3} sx={{ p: 3, maxWidth: 600, width: '100%', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>示例：</Typography>
              <Typography variant="body2" paragraph>
                我计划和家人3人去云南旅游，时间是7天，预算8000元。请帮我规划行程。
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => onSendMessage('我计划和家人3人去云南旅游，时间是7天，预算8000元。请帮我规划行程。')}
                fullWidth
              >
                使用此示例
              </Button>
            </Paper>
          </Box>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  backgroundColor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2
                }}
              >
                {message.isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                    <Typography>{message.content}</Typography>
                  </Box>
                ) : (
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                )}
              </Paper>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      <Box className="message-input">
        <form onSubmit={handleSubmit} className="message-form">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的旅游需求（游玩人数、旅途时间、目的地、预算）..."
            variant="outlined"
            size="small"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            disabled={!input.trim()}
          >
            发送
          </Button>
        </form>
      </Box>
    </Box>
  );
}

export default ChatArea;