/**
 * 服务器入口文件
 * 负责配置Express应用程序、中间件、路由和错误处理
 */

// 导入必要的依赖包
const express = require('express'); // Web框架
const cors = require('cors');       // 跨域资源共享
const morgan = require('morgan');   // HTTP请求日志记录器
const path = require('path');       // 文件路径处理
const dotenv = require('dotenv');   // 环境变量加载
const { initDatabase } = require('./config/database'); // 数据库初始化

// 加载环境变量(.env文件)
dotenv.config();

// 创建Express应用实例
const app = express();

// 配置中间件
app.use(cors());           // 启用CORS，允许前端跨域请求
app.use(express.json());   // 解析JSON请求体
app.use(morgan('dev'));    // 开发环境下的HTTP请求日志

// 配置API路由
// 认证路由
app.use('/api/auth', require('./routes/auth'));
// 用户偏好路由
app.use('/api/preferences', require('./routes/preferences'));
// 聊天路由（支持可选认证）
const { optionalAuth } = require('./middleware/auth');
app.use('/api', optionalAuth, require('./routes/api'));

// 生产环境配置：提供前端静态文件
if (process.env.NODE_ENV === 'production') {
  // 设置静态文件目录，指向前端构建输出
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // 对于所有未匹配的路由，返回前端的index.html（支持SPA前端路由）
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// 全局错误处理中间件
// 捕获应用中抛出的所有错误，并返回统一的错误响应
app.use((err, req, res, next) => {
  // 记录错误堆栈信息到控制台
  console.error(err.stack);
  
  // 返回500错误响应
  res.status(500).json({
    message: '服务器内部错误',
    // 生产环境下不暴露详细错误信息，开发环境下返回完整错误
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 设置服务器端口，优先使用环境变量中的PORT，默认为5000
// 初始化数据库并启动服务器
const PORT = process.env.PORT || 5000;

// 异步启动函数
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    console.log('数据库初始化完成');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log('用户偏好存储功能已启用');
    });
  } catch (error) {
    console.error('启动服务器时出错:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();