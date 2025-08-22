import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

function Sidebar({ 
  conversations, 
  currentConversationId, 
  onNewConversation, 
  onSelectConversation, 
  onDeleteConversation,
  isOpen,
  toggleSidebar
}) {
  return (
    <>
      {!isOpen && (
        <IconButton 
          className="toggle-sidebar" 
          onClick={toggleSidebar}
          aria-label="打开侧边栏"
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box className={`sidebar ${isOpen ? '' : 'closed'}`}>
        {isOpen && (
          <>
            <Box className="sidebar-header">
              <span className="sidebar-title">旅游规划助手</span>
              <IconButton 
                onClick={toggleSidebar} 
                size="small" 
                sx={{ color: 'white' }}
                aria-label="关闭侧边栏"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewConversation}
              className="new-chat-button"
              fullWidth
            >
              新的旅游规划
            </Button>
            <Box className="conversation-list">
              {conversations.map((conversation) => (
                <Box
                  key={conversation.id}
                  className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <span className="conversation-title">{conversation.title}</span>
                  <IconButton
                    className="delete-button"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    aria-label="删除对话"
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </>
  );
}

export default Sidebar;