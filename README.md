# 天气查询应用

基于 Node.js 的天气查询工具站点，支持命令行和 Web 界面。

## 功能特性

- 🌤️ 实时天气查询
- 📅 3天天气预报
- 🔍 城市搜索
- 💻 命令行界面
- 🌐 Web 界面
- 📱 响应式设计

## 快速开始
### 命令行版本
```npm run cli
# 或
node src/index.js cli
```
### Web版本
```bash
npm run web
# 或
node src/index.js web
#然后在浏览器中访问：http://localhost:3000
#历史记录查询页面：http://localhost:3000/history
```
### 开发模式
```bash
npm run dev      # Web 版本开发
npm run dev:cli  # CLI 版本开发
```


### 1. 安装依赖
```bash
npm install axios express dotenv cors commander uuid
npm install -D nodemon