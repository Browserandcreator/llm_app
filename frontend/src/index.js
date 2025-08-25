import React from 'react';      //引入react核心组件
import ReactDOM from 'react-dom/client';  //引入挂载组件
import './index.css';           // 全局样式文件index.css，对应全局样式
import App from './App';       // 引入根组件App

const root = ReactDOM.createRoot(document.getElementById('root'));
/*
document.getElementById('root')获取id为root的元素，即挂载点
ReactDOM.createRoot()创建一个React应用的根结点，用于将React组件渲染到DOM中
*/
root.render(//把React组件渲染到页面上
  <React.StrictMode>
    <App /> //渲染App组件（App.js），从这里开始整个应用的UI树由React接管
  </React.StrictMode>
);