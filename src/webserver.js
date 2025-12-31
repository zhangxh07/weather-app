const express = require('express');
const cors = require('cors');
const path = require('path');
const WeatherAPI = require('./weather');
require('dotenv').config()

class WeatherWebServer {
    constructor() {
        this.app = express();
        this.weatherAPI = new WeatherAPI();
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
        //获取当前天气
        this.app.get('/api/weather/current', async (req, res) => {
            try {
                const {location} = req.query;
                if (!location) {
                    return res.status(400).json({error: 'Location parameter is required'})
                }
                const weather = await this.weatherAPI.getCurrentWeather(location);
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
                const {location, days = 3} = req.query;

                if (!location) {
                    return res.status(400).json({error: 'Location parameter is required'});
                }

                const forecast = await this.weatherAPI.getForecast(location, parseInt(days));
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

        //健康检查
        this.app.get('/api/health', (req, res) => {
            res.json({status: 'ok', timestamp: new Date().toISOString()});
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
        });
    }
}

if (require.main == module) {
    const server = new WeatherWebServer();
    server.start();
}

module.exports = WeatherWebServer;