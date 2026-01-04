const express = require('express');
const HistoryManager = require('./historyManager');

class HistoryAPI {
  constructor() {
    this.router = express.Router();
    this.historyManager = new HistoryManager();
    this.setupRoutes();
  }

  setupRoutes() {
    // 获取所有历史记录
    this.router.get('/history', async (req, res) => {
      try {
        const {
          limit = 50,
          offset = 0,
          queryType,
          startDate,
          endDate,
          search
        } = req.query;

        const records = await this.historyManager.getAllRecords({
          limit: parseInt(limit),
          offset: parseInt(offset),
          queryType,
          startDate,
          endDate,
          search
        });

        res.json({
          success: true,
          data: records,
          total: records.length
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '获取历史记录失败'
        });
      }
    });

    // 获取历史记录统计
    this.router.get('/history/stats', async (req, res) => {
      try {
        const stats = await this.historyManager.getStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '获取统计信息失败'
        });
      }
    });

    // 获取单个历史记录
    this.router.get('/history/:id', async (req, res) => {
      try {
        const record = await this.historyManager.getRecordById(req.params.id);

        if (record) {
          res.json({
            success: true,
            data: record
          });
        } else {
          res.status(404).json({
            success: false,
            error: '记录不存在'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '获取记录失败'
        });
      }
    });

    // 删除历史记录
    this.router.delete('/history/:id', async (req, res) => {
      try {
        const deleted = await this.historyManager.deleteRecord(req.params.id);

        if (deleted) {
          res.json({
            success: true,
            message: '记录删除成功'
          });
        } else {
          res.status(404).json({
            success: false,
            error: '记录不存在'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '删除记录失败'
        });
      }
    });

    // 批量删除历史记录
    this.router.delete('/history', async (req, res) => {
      try {
        const { ids } = req.body;

        if (!Array.isArray(ids)) {
          return res.status(400).json({
            success: false,
            error: '需要提供ID数组'
          });
        }

        let deletedCount = 0;
        for (const id of ids) {
          const deleted = await this.historyManager.deleteRecord(id);
          if (deleted) deletedCount++;
        }

        res.json({
          success: true,
          message: `成功删除 ${deletedCount} 条记录`,
          deletedCount
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '批量删除失败'
        });
      }
    });

    // 清空所有历史记录
    this.router.delete('/history/all/clear', async (req, res) => {
      try {
        const cleared = await this.historyManager.clearAll();

        if (cleared) {
          res.json({
            success: true,
            message: '所有历史记录已清空'
          });
        } else {
          res.status(500).json({
            success: false,
            error: '清空记录失败'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '清空记录失败'
        });
      }
    });

    // 导出历史记录
    this.router.get('/history/export/:format', async (req, res) => {
      try {
        const { format } = req.params;
        const data = await this.historyManager.exportHistory(format);

        if (data) {
          let filename, contentType;

          if (format === 'json') {
            filename = `weather-history-${Date.now()}.json`;
            contentType = 'application/json';
          } else if (format === 'csv') {
            filename = `weather-history-${Date.now()}.csv`;
            contentType = 'text/csv';
          }

          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else {
          res.status(400).json({
            success: false,
            error: '不支持的导出格式'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '导出失败'
        });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = HistoryAPI;