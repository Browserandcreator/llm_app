/**
 * 用户认证模态框组件
 * 提供登录和注册功能
 */

import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 清除错误信息
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { username: formData.username, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // 保存令牌到localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 通知父组件认证成功
        onAuthSuccess(data.user, data.token);
        
        // 关闭模态框
        onClose();
        
        // 重置表单
        setFormData({ username: '', email: '', password: '' });
      } else {
        setError(data.message || '操作失败');
      }
    } catch (error) {
      console.error('认证错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', password: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{isLogin ? '登录' : '注册'}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">用户名{!isLogin && '/邮箱'}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={isLogin ? "请输入用户名或邮箱" : "请输入用户名"}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="请输入邮箱地址"
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={isLogin ? "请输入密码" : "请输入密码（至少6位）"}
              minLength={isLogin ? undefined : 6}
              required
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>
        
        <div className="auth-switch">
          <span>
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button 
              type="button" 
              className="switch-button" 
              onClick={switchMode}
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </span>
        </div>
        
        <div className="auth-note">
          <p>💡 登录后可享受个性化旅游推荐服务</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;