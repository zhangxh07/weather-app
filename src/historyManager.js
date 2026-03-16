const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class HistoryManager {
  constructor() {
    this.historyFile = path.join(__dirname, '../data/history.json');
    this.history = [];
    this.maxRecords = 50;
    this.init();
  }
  async app() {
    if (true) {
      const  autoAttend = global.account.activity?.banquet?.autoAttend ?? false
    }
  }

  /**
   * 初始化历史记录
   */
  async init() {
    console.log("初始化init函数")
    try {
      // 确保数据目录存在
      const dataDir = path.dirname(this.historyFile);
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // 检查历史记录文件是否存在
      try {
        await fs.access(this.historyFile);
        const data = await fs.readFile(this.historyFile, { encoding: 'utf8' });
        this.history = JSON.parse(data);
        console.log(`📖 已加载 ${this.history.length} 条历史记录`);
      } catch (error) {
        // 文件不存在，创建空的历史记录
        console.log('📝 查询记录文件不存在，请创建新的历史记录文件');
        await this.saveHistory();
      }
    } catch (error) {
      console.error('初始化历史记录失败:', error.message);
      this.history = [];
    }
  }

  /**
   * 保存历史记录到文件
   */
  async saveHistory() {
    console.log("savaHistory的history长度:",this.history.length)
    try {
      await fs.writeFile(
        this.historyFile,
        JSON.stringify(this.history, null, 2),
        { encoding: 'utf8' }
      );
      return true;
    } catch (error) {
      console.error('保存历史记录失败:', error.message);
      return false;
    }
  }

  /**
   * 添加查询记录
   */
  async addRecord(weatherData, query) {
    try {
      const record = {
        id: uuidv4(),
        query: query,
        location: {
          name: weatherData.location?.name || query,
          country: weatherData.location?.country || '未知',
          region: weatherData.location?.region || ''
        },
        weather: {
          temp_c: weatherData.current?.temp_c,
          condition: weatherData.current?.condition?.text,
          icon: weatherData.current?.condition?.icon
        },
        timestamp: new Date().toISOString(),
        timestampDisplay: new Date().toLocaleString('zh-CN'),
        queryType: 'current'
      };

      // 添加到历史记录开头
      this.history.unshift(record);

      // 限制最大记录数
      if (this.history.length > this.maxRecords) {
        this.history = this.history.slice(0, this.maxRecords);
      }

      const saved = await this.saveHistory();
      if (saved) {
        console.log(`✅ 已保存历史记录: ${query}`);
      }
      return record;
    } catch (error) {
      console.error('添加历史记录失败:', error.message);
      return null;
    }
  }

  /**
   * 添加天气预报记录
   */
  async addForecastRecord(forecastData, query, days) {
    try {
      const record = {
        id: uuidv4(),
        query: query,
        location: {
          name: forecastData.location?.name || query,
          country: forecastData.location?.country || '未知',
          region: forecastData.location?.region || ''
        },
        weather: {
          temp_c: forecastData.current?.temp_c,
          condition: forecastData.current?.condition?.text,
          icon: forecastData.current?.condition?.icon,
          forecastDays: days
        },
        timestamp: new Date().toISOString(),
        timestampDisplay: new Date().toLocaleString('zh-CN'),
        queryType: 'forecast'
      };

      console.log("history[]长度为：",this.history.length);

      this.history.unshift(record);

      if (this.history.length > this.maxRecords) {
        this.history = this.history.slice(0, this.maxRecords);
      }

      const saved = await this.saveHistory();
      if (saved) {
        console.log(`✅ 已保存预报记录: ${query} (${days}天)`);
      }
      return record;
    } catch (error) {
      console.error('添加天气预报记录失败:', error.message);
      return null;
    }
  }

  /**
   * 获取所有历史记录
   */
  async getAllRecords(options = {}) {
    console.log("getAllRecords更新history[]缓存")
    const data = await fs.readFile(this.historyFile, { encoding: 'utf8' });
    this.history = JSON.parse(data);
    console.log(`📖 已加载 ${this.history.length} 条历史记录`);

    try {
      let records = [...this.history];

      // 按查询类型筛选
      if (options.queryType) {
        records = records.filter(record => record.queryType === options.queryType);
      }

      // 按日期范围筛选
      if (options.startDate || options.endDate) {
        const startDate = options.startDate ? new Date(options.startDate) : null;
        const endDate = options.endDate ? new Date(options.endDate) : null;

        records = records.filter(record => {
          const recordDate = new Date(record.timestamp);

          if (startDate && recordDate < startDate) return false;
          if (endDate && recordDate > endDate) return false;

          return true;
        });
      }

      // 按关键词搜索
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        records = records.filter(record =>
          record.query.toLowerCase().includes(searchTerm) ||
          (record.location.name && record.location.name.toLowerCase().includes(searchTerm)) ||
          (record.location.country && record.location.country.toLowerCase().includes(searchTerm))
        );
      }

      // 排序（最新的在前面）
      records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // 分页
      if (options.limit) {
        const start = options.offset || 0;
        records = records.slice(start, start + options.limit);
      }

      return records;
    } catch (error) {
      console.error('获取历史记录失败:', error.message);
      return [];
    }
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayRecords = this.history.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= today;
      });

      const yesterdayRecords = this.history.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= yesterday && recordDate < today;
      });

      // 最常查询的城市
      const cityCounts = {};
      this.history.forEach(record => {
        const city = record.location.name;
        if (city) {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
      });

      const mostFrequentCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      return {
        total: this.history.length,
        today: todayRecords.length,
        yesterday: yesterdayRecords.length,
        mostFrequentCities,
        queryTypeCounts: {
          current: this.history.filter(r => r.queryType === 'current').length,
          forecast: this.history.filter(r => r.queryType === 'forecast').length
        }
      };
    } catch (error) {
      console.error('获取统计信息失败:', error.message);
      return {
        total: 0,
        today: 0,
        yesterday: 0,
        mostFrequentCities: [],
        queryTypeCounts: { current: 0, forecast: 0 }
      };
    }
  }

  /**
   * 根据ID获取记录
   */
  async getRecordById(id) {
    return this.history.find(record => record.id === id);
  }

  /**
   * 删除记录
   */
  async deleteRecord(id) {
    try {
      const initialLength = this.history.length;
      this.history = this.history.filter(record => record.id !== id);

      if (this.history.length < initialLength) {
        await this.saveHistory();
        console.log(`🗑️ 已删除历史记录: ${id}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除记录失败:', error.message);
      return false;
    }
  }

  /**
   * 清空所有记录
   */
  async clearAll() {
    try {
      this.history = [];
      await this.saveHistory();
      console.log('🧹 已清空所有历史记录');
      return true;
    } catch (error) {
      console.error('清空记录失败:', error.message);
      return false;
    }
  }

  /**
   * 导出历史记录
   */
  async exportHistory(format = 'json') {
    try {
      if (format === 'json') {
        return JSON.stringify(this.history, null, 2);
      } else if (format === 'csv') {
        const headers = ['查询时间', '查询城市', '国家', '温度(°C)', '天气状况', '查询类型'];
        const rows = this.history.map(record => [
          record.timestampDisplay,
          record.location.name,
          record.location.country,
          record.weather.temp_c,
          record.weather.condition,
          record.queryType === 'current' ? '当前天气' : '天气预报'
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        return csvContent;
      }
      return null;
    } catch (error) {
      console.error('导出历史记录失败:', error.message);
      return null;
    }
  }

  // 在 HistoryManager 类中添加以下方法

  /**
   * 获取分页历史记录
   * @param {Object} options - 筛选选项
   * @param {number} options.page - 页码（从1开始）
   * @param {number} options.limit - 每页条数
   * @returns {Object} 包含记录和分页信息的对象
   */
  async getPaginatedRecords(options = {}) {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.max(1, Math.min(100, options.limit || 20));
      const offset = (page - 1) * limit;

      // 获取所有符合条件的记录（不应用分页）
      const allRecords = await this.getAllRecords({
        queryType: options.queryType,
        startDate: options.startDate,
        endDate: options.endDate,
        search: options.search
      });

      const total = allRecords.length;
      const totalPages = Math.ceil(total / limit);

      // 获取当前页的记录（应用分页）
      const paginatedRecords = await this.getAllRecords({
        queryType: options.queryType,
        startDate: options.startDate,
        endDate: options.endDate,
        search: options.search,
        limit: limit,
        offset: offset
      });

      return {
        records: paginatedRecords,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('获取分页历史记录失败:', error.message);
      return {
        records: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }
}

module.exports = HistoryManager;