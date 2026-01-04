const express = require('express');
const cors = require('cors');
const path = require('path');
const WeatherAPI = require('./weather');
const HistoryManager = require('./historyManager');
const HistoryAPI = require('./historyApi');
require('dotenv').config()

class WeatherWebServer {
    constructor() {
        this.app = express();
        this.weatherAPI = new WeatherAPI();
        this.historyManager = new HistoryManager();
        this.historyAPI = new HistoryAPI();
        this.port = process.env.PORT || 3000;

        this.setupMiddleware();
        this.setupRoutes();
    }

    //设置中间件
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname,'../public')));
    }

    //设置路由
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // 历史记录页面
        this.app.get('/history', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/history.html'));
        });

        //获取当前天气
        this.app.get('/api/weather/current', async (req, res) => {
            try {
                const { location } = req.query;
                const saveHistory = 'true'
                if (!location) {
                    return res.status(400).json({error: 'Location parameter is required'})
                }
                const weather = await this.weatherAPI.getCurrentWeather(location);

                // 保存历史记录（异步执行，不阻塞响应）
                if (saveHistory === 'true') {
                  this.historyManager.addRecord(weather, location).catch(error => {
                    console.error('保存历史记录失败:', error.message);
                  });
                }
                // if (saveHistory === 'true' || saveHistory === true) {
                //    this.historyManager.addRecord(weather, location);
                // }
                console.log("数据返回success")
                res.json(weather);
            } catch (error) {
                res.status(500).json({
                    error: error.response?.data?.error?.message || 'Failed to fetch weather data'
                });
            }
        });

        // 获取天气预报
        this.app.get('/api/weather/forecast', async (req, res) => {
            try {
                const { location, days = 3 } = req.query;
                const saveHistory = 'true'
                if (!location) {
                    return res.status(400).json({error: 'Location parameter is required'});
                }

                const forecast = await this.weatherAPI.getForecast(location, parseInt(days));

                //保存历史记录（异步执行，不阻塞响应）
                if (saveHistory === 'true') {
                  this.historyManager.addForecastRecord(forecast, location, days).catch(error => {
                    console.error('保存预报记录失败:', error.message);
                  });
                }

                res.json(forecast);
            } catch (error) {
                res.status(500).json({
                    error: error.response?.data?.error?.message || 'Failed to fetch forecast data'
                });
            }
        });

        // 搜索城市
        this.app.get('/api/search', async (req, res) => {
            try {
                const {q} = req.query;

                if (!q) {
                    return res.status(400).json({error: 'Query parameter is required'});
                }

                const results = await this.weatherAPI.searchCity(q);
                res.json(results);
            } catch (error) {
                res.status(500).json({
                    error: error.response?.data?.error?.message || 'Failed to search cities'
                });
            }
        });

        // 集成历史记录API
        this.app.use('/api', this.historyAPI.getRouter());

        //健康检查
        this.app.get('/api/health', (req, res) => {
            res.json({status: 'ok', timestamp: new Date().toISOString()});
        });

        // 在所有路由之后添加错误处理中间件
        this.app.use((err, req, res, next) => {
          console.error('服务器错误:', err.stack);
          res.status(500).json({
            error: '服务器内部错误',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        });

        // 404 处理
        this.app.use((req, res) => {
          res.status(404).json({ error: '页面未找到' });
        });
    }

    //启动服务器
    start() {
        this.app.listen(this.port, () => {
              console.log(`🌐 天气应用服务器运行在 http://localhost:${this.port}`);
              console.log(`📚 API文档:`);
              console.log(`  获取当前天气: GET /api/weather/current?location=城市名`);
              console.log(`  获取天气预报: GET /api/weather/forecast?location=城市名&days=天数`);
              console.log(`  搜索城市: GET /api/search?q=关键词`);
              console.log(`  历史记录页面: http://localhost:${this.port}/history`);
              console.log(`  获取历史记录: GET /api/history`);
              console.log(`  历史统计: GET /api/history/stats`);
        });
    }
}

if (require.main == module) {
    const server = new WeatherWebServer();
    server.start();
}

module.exports = WeatherWebServer;