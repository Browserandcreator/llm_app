/**
 * 数据库配置和初始化模块
 * 使用SQLite作为轻量级数据库解决方案
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../data/travel_planner.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('连接数据库时出错:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
  }
});

// 初始化数据库表结构
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建用户偏好表
    const createPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        preference_type TEXT NOT NULL,
        preference_value TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    // 创建旅游历史表
    const createTravelHistoryTable = `
      CREATE TABLE IF NOT EXISTS travel_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        destination TEXT NOT NULL,
        days INTEGER NOT NULL,
        people INTEGER NOT NULL,
        budget REAL NOT NULL,
        travel_plan TEXT,
        satisfaction_rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    // 创建会话表
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    // 执行表创建
    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('创建用户表时出错:', err.message);
          reject(err);
          return;
        }
        console.log('用户表创建成功');
      });

      db.run(createPreferencesTable, (err) => {
        if (err) {
          console.error('创建偏好表时出错:', err.message);
          reject(err);
          return;
        }
        console.log('偏好表创建成功');
      });

      db.run(createTravelHistoryTable, (err) => {
        if (err) {
          console.error('创建旅游历史表时出错:', err.message);
          reject(err);
          return;
        }
        console.log('旅游历史表创建成功');
      });

      db.run(createSessionsTable, (err) => {
        if (err) {
          console.error('创建会话表时出错:', err.message);
          reject(err);
          return;
        }
        console.log('会话表创建成功');
        resolve();
      });
    });
  });
};

// 关闭数据库连接
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
        reject(err);
      } else {
        console.log('数据库连接已关闭');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  closeDatabase
};