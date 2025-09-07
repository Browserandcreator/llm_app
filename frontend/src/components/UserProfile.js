/**
 * 用户信息显示组件
 * 显示用户头像、用户名和登出功能
 */

import React, { useState } from 'react';
import './UserProfile.css';

const UserProfile = ({ user, onLogout, onViewPreferences }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    // 清除本地存储的认证信息
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // 调用父组件的登出回调
    onLogout();
    
    // 关闭下拉菜单
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleViewPreferences = () => {
    onViewPreferences();
    setShowDropdown(false);
  };

  // 生成用户头像（使用用户名首字母）
  const getAvatarText = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="user-profile">
      <div className="user-info" onClick={toggleDropdown}>
        <div className="user-avatar">
          {getAvatarText(user.username)}
        </div>
        <span className="username">{user.username}</span>
        <svg 
          className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path 
            d="M3 4.5L6 7.5L9 4.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {showDropdown && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <div className="user-avatar large">
              {getAvatarText(user.username)}
            </div>
            <div className="user-details">
              <div className="username">{user.username}</div>
              <div className="email">{user.email}</div>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-menu">
            <button 
              className="dropdown-item"
              onClick={handleViewPreferences}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path 
                  d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                />
                <path 
                  d="M8 1V3M8 13V15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M1 8H3M13 8H15M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
              </svg>
              我的偏好
            </button>
            
            <button 
              className="dropdown-item logout"
              onClick={handleLogout}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path 
                  d="M6 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H6M11 11L15 7L11 3M15 7H6" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      )}
      
      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default UserProfile;