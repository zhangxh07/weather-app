const readline = require('readline');
const WeatherAPI = require('./weather');
const HistoryManager = require("./historyManager");

class WeatherCLI {
    constructor() {
        this.weatherAPI = new WeatherAPI();
        this.historyManager = new HistoryManager();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🌤️  天气查询应用 (CLI版本)');
        console.log('='.repeat(40));

        await this.showMeun();
    }

    /**
   * 显示菜单
   */
    async showMeun() {
        console.log('\n请选择操作:');
        console.log('1. 查询当前天气');
        console.log('2. 查询天气预报');
        console.log('3. 搜索城市');
        console.log('4. 查看历史记录');
        console.log('5. 查看历史统计');
        console.log('6. 清空历史记录');
        console.log('7. 退出');

        this.rl.question('请输入选项编号',async (choice) => {
            switch (choice.trim()) {
                case '1':
                    await this.queryCurrentWeather();
                    break;
                case '2':
                    await this.queryForecast();
                    break;
                case '3':
                    await this.searchCity();
                    break;
                case '4':
                    await this.viewHistory();
                    break;
                case '5':
                    await this.viewStats();
                    break;
                case '6':
                    await this.clearHistory();
                    break;
                case '7':
                    console.log('再见！👋');
                    this.rl.close();
                    process.exit(0);
                    break;
                default:
                    console.log('无效的选项，请重新输入！');
                    await this.showMeun()
            }
        });
    }

    /**
   * 查询当前天气
   */
   async queryCurrentWeather() {
       this.rl.question('请输入城市名称 (例如: 北京, London, Tokyo): ',async (location) => {
           if (!location.trim()) {
               console.log('城市名称不能为空！');
               return this.queryCurrentWeather();
           }

           try {
               console.log(`\n正在查询 ${location} 的天气...`);
               const weather = await this.weatherAPI.getCurrentWeather(location);

               // 保存历史记录
                await this.historyManager.addRecord(weather, location);

                console.log('\n📊 天气信息');
                console.log('='.repeat(40));
                console.log(`地点: ${weather.location.name}, ${weather.location.region}, ${weather.location.country}`);
                console.log(`时间: ${weather.location.localTime}`);
                console.log(`天气: ${weather.current.condition.text}`);
                console.log(`温度: ${weather.current.temp_c}°C (体感 ${weather.current.feelslike_c}°C)`);
                console.log(`湿度: ${weather.current.humidity}%`);
                console.log(`风速: ${weather.current.wind_kph} km/h ${weather.current.wind_dir}`);
                console.log(`降水量: ${weather.current.precip_mm} mm`);
                console.log(`气压: ${weather.current.pressure_mb} hPa`);
                console.log(`能见度: ${weather.current.visibility_km} km`);
                console.log(`紫外线指数: ${weather.current.uv}`);
                console.log('='.repeat(40));
                console.log(`最后更新: ${weather.lastUpdated}`);
           } catch (error) {
               console.error('❌ 查询失败:', error.response?.data?.error?.message || error.message);
           } finally {
               setTimeout(() => this.showMeun(), 1000);
           }
       });
    }

    //查询天气预报
    async queryForecast() {
       this.rl.question('请输入城市名称：',async (location) => {
           if(!location.trim()) {
                console.log('城市名称不能为空！');
                return this.queryForecast();
           }

           this.rl.question('请输入预报天数 (1-3): ', async (days) => {
               const daysNum = parseInt(days);
               if (isNaN(daysNum) || daysNum < 1 || daysNum >3) {
                   console.log('请输入1-3之间的数字！');
                   return this.queryForecast();
               }

               try {
                   console.log(`\n正在查询 ${location} 的${daysNum}天预报...`);
                   const forecast = await this.weatherAPI.getForecast(location,daysNum);

                   //保存查询历史记录
                   //await this.historyManager.addForecastRecord(forecast, location, daysNum)

                   console.log(`\n📅 ${location} 天气预报`);
                   console.log('='.repeat(50));

                   // 显示当前天气
                  console.log('\n当前天气:');
                  console.log(`温度: ${forecast.current.temp_c}°C | 天气: ${forecast.current.condition.text}`);
                  console.log(`湿度: ${forecast.current.humidity}% | 风速: ${forecast.current.wind_kph} km/h`);

                  // 显示预报
                  console.log('\n天气预报:');
                  forecast.forecast.forEach((day,index) => {
                        console.log(`\n${day.date}:`);
                        console.log(`  最高: ${day.day.maxtemp_c}°C | 最低: ${day.day.mintemp_c}°C`);
                        console.log(`  天气: ${day.day.condition.text}`);
                        console.log(`  降水概率: ${day.day.daily_chance_of_rain}%`);
                        console.log(`  风速: ${day.day.maxwind_kph} km/h`);
                  });

                  console.log('='.repeat(50));

               } catch (error) {
                    console.error('❌ 查询失败:', error.response?.data?.error?.message || error.message);
               } finally {
                   setTimeout( () => this.showMeun(),1000);
               }
           });
       });
    }

    //搜索城市
      async searchCity() {
        this.rl.question('请输入搜索关键词: ', async (query) => {
          if (!query.trim()) {
            console.log('搜索关键词不能为空！');
            return this.searchCity();
          }

          try {
            console.log(`\n正在搜索 "${query}"...`);
            const results = await this.weatherAPI.searchCity(query);

            if (results.length === 0) {
              console.log('未找到相关城市');
            } else {
              console.log('\n📍 搜索结果:');
              console.log('='.repeat(40));
              results.forEach((city, index) => {
                console.log(`${index + 1}. ${city.name}, ${city.region}, ${city.country}`);
              });
              console.log('='.repeat(40));
            }

          } catch (error) {
            console.error('❌ 搜索失败:', error.message);
          } finally {
            setTimeout(() => this.showMeun(), 1000);
          }
        });
   }

    /**
     * 查看历史记录
     * @returns {Promise<void>}
     */

   async viewHistory() {
       try {
           console.log('\n📜 查询历史记录');
           console.log('='.repeat(60));

           const records = await this.historyManager.getAllRecords({ limit: 20 });

           if (records.length === 0 ) {
               console.log('暂无查询记录');
           }else {
               records.forEach((record,index) => {
                   console.log(`\n${index + 1}. ${record.location.name}, ${record.location.country}`);
                   console.log(`   时间: ${record.timestampDisplay}`);
                  console.log(`   天气: ${record.weather.condition} ${record.weather.temp_c}°C`);
                  console.log(`   类型: ${record.queryType === 'current' ? '当前天气' : '天气预报'}`);
               });
           }
           console.log('\n' + '='.repeat(60));
       } catch (error) {
            console.error('❌ 获取历史记录失败:', error.message);
       } finally {
           setTimeout(() => this.showMeun(), 1000);
       }
   }

    /**
     * 清空历史记录
     */
    async clearHistory() {
        this.rl.question('确定要清空所有历史记录吗？(y/N): ', async (answer) => {
            if (answer.toLowerCase() === 'y') {
                try {
                    const cleared = await this.historyManager.clearAll();
                    if (cleared) {
                        console.log('✅ 历史记录已清空');
                    } else {
                        console.log('❌ 清空记录失败');
                    }
                } catch (error) {
                    console.error('❌ 清空失败:', error.message);
                }
            } else {
                console.log('已取消清空操作');
            }
            setTimeout(() => this.showMeun(),500);
        });
    }

    /**
     * 查看统计信息
     */
    async viewStats() {
        try {
            console.log('\n📊 历史记录统计');
            console.log('='.repeat(40));

            const stats = await this.historyManager.getStats();

            console.log(`总查询次数: ${stats.total}`);
              console.log(`今日查询: ${stats.today}`);
              console.log(`昨日查询: ${stats.yesterday}`);
              console.log(`当前天气查询: ${stats.queryTypeCounts.current}`);
              console.log(`天气预报查询: ${stats.queryTypeCounts.forecast}`);

              if (stats.mostFrequentCities.length > 0) {
                console.log('\n最常查询的城市:');
                stats.mostFrequentCities.forEach((city, index) => {
                  console.log(`  ${index + 1}. ${city.city}: ${city.count} 次`);
                });
              }
              console.log('='.repeat(40));
        } catch (error) {
            console.error('❌ 获取统计信息失败:', error.message);
        } finally {
            setTimeout(() => this.showMeun(), 1000);
        }
    }
}

//如果直接运行这个文件
if (require.main == module) {
    const cli = new WeatherCLI();
    cli.start();
}

module.exports = WeatherCLI;