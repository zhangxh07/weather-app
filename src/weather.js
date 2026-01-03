const axios = require('axios')
require('dotenv').config()

class WeatherAPI {
    constructor() {
        this.apiKey = process.env.WEATHER_API_KEY
        this.baseURL = process.env.WEATHER_BASE_URL

        if (!this.apiKey) {
            throw new Error('WEATHER_API_KEY is not defined in environment variables');
        }
    }

    /**
   * 获取当前天气
   * @param {string} location - 城市名称或坐标
   * @returns {Promise<Object>}
   */
    async getCurrentWeather(location){
        try {
            const response = await axios.get(`${this.baseURL}/current.json`,{
                params: {
                    key: this.apiKey,
                    q: location,
                    lang: 'zh'
                }
            });
            return this.formatCurrentWeather(response.data);
        } catch (error) {
            console.error('获取天气数据失败：',error.message);
            throw error;
        }
    }

     /**
   * 获取天气预报
   * @param {string} location - 城市名称或坐标
   * @param {number} days - 预报天数（1-3）
   * @returns {Promise<Object>}
   */
   async getForecast(location,days=3) {
       try {
           const response = await axios.get(`${this.baseURL}/forecast.json`,{
               params: {
                   key: this.apiKey,
                   q: location,
                   days: days,
                   lang: 'zh'
               }
           });
           return this.formatForecast(response.data);
       } catch (error) {
            console.error('获取天气预报失败:', error.message);
            throw error;
       }
     }

     /**
   * 搜索城市
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>}
   */

     async searchCity(query) {
         try {
             const response = await axios.get(`${this.baseURL}/search.json`, {
                 params: {
                     key: this.apiKey,
                     q: query
                 }
             });
            return response.data
         } catch (error) {
            console.error('搜索城市失败:', error.message);
            throw error;
         }
     }

     /**
   * 格式化当前天气数据
   */

     formatCurrentWeather(data) {
         const {location,current} = data;

         return {
            location: {
                name: location.name,
                region: location.region,
                country: location.country,
                localTime: location.localtime,

            },
             current: {
                temp_c: current.temp_c,
                 temp_f: current.temp_f,
                condition: {
                  text: current.condition.text,
                  icon: current.condition.icon
                },
                heatindex_c: current.heatindex_c,
                feelslike_f: current.feelslike_f,
                dewpoint_c: current.dewpoint_c,
                humidity: current.humidity,
                wind_kph: current.wind_kph,
                wind_dir: current.wind_dir,
                pressure_mb: current.pressure_mb,
                precip_mm: current.precip_mm,
                uv: current.uv,
                visibility_km: current.vis_km
             },
             lastUpdated: current.last_updated,
         };
     }

     /**
   * 格式化预报数据
   */
     formatForecast(data) {
         const {location,current,forecast} = data;

         const formatted = {
             location: {
                 name: location.name,
                 region: location.region,
                 country: location.country
             },
             current: this.formatCurrentWeather(data).current,
             forecast: forecast.forecastday.map(day => ({
                 date: day.date,
                 day: {
                      maxtemp_c: day.day.maxtemp_c,
                      mintemp_c: day.day.mintemp_c,
                      condition: day.day.condition,
                      avghumidity: day.day.avghumidity,
                      maxwind_kph: day.day.maxwind_kph,
                      daily_chance_of_rain: day.day.daily_chance_of_rain,
                      daily_chance_of_snow: day.day.daily_chance_of_snow
                 },
                 astro: day.astro,
                 hour: day.hour.map(hour => ({
                      time: hour.time,
                      temp_c: hour.temp_c,
                      condition: hour.condition,
                      chance_of_rain: hour.chance_of_rain,
                      chance_of_snow: hour.chance_of_snow
                 }))
             }))
         };
         return formatted;
     }
}

module.exports = WeatherAPI;