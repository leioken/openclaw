#!/usr/bin/env node

/**
 * 🧠 元学习系统
 * 学习如何更有效地学习，改进学习算法本身
 */

const fs = require('fs');
const path = require('path');

const METALEARNING_FILE = path.join(process.env.HOME, '.openclaw/evolution/metalearning.json');
const LEARNING_LOG_FILE = path.join(process.env.HOME, '.openclaw/evolution/learning-log.json');

class MetaLearning {
  constructor() {
    this.metalearning = this.loadMetalearning();
    this.learningLog = this.loadLearningLog();
  }

  loadMetalearning() {
    try {
      if (fs.existsSync(METALEARNING_FILE)) {
        return JSON.parse(fs.readFileSync(METALEARNING_FILE, 'utf8'));
      }
    } catch (error) {}
    return {
      strategies: {},
      preferences: {},
      patterns: {},
      lastUpdate: null
    };
  }

  saveMetalearning() {
    this.metalearning.lastUpdate = new Date().toISOString();
    fs.writeFileSync(METALEARNING_FILE, JSON.stringify(this.metalearning, null, 2));
  }

  loadLearningLog() {
    try {
      if (fs.existsSync(LEARNING_LOG_FILE)) {
        return JSON.parse(fs.readFileSync(LEARNING_LOG_FILE, 'utf8'));
      }
    } catch (error) {}
    return { sessions: [], insights: [] };
  }

  saveLearningLog() {
    fs.writeFileSync(LEARNING_LOG_FILE, JSON.stringify(this.learningLog, null, 2));
  }

  // 记录学习会话
  recordLearningSession(type, input, output, success, context = {}) {
    const session = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      input: input.substring(0, 200),
      output: output.substring(0, 200),
      success,
      context,
      duration: context.duration || 0,
      attempts: context.attempts || 1
    };

    this.learningLog.sessions.push(session);
    this.analyzeSession(session);
    this.saveLearningLog();

    return session.id;
  }

  // 分析学习会话
  analyzeSession(session) {
    // 分析输入模式
    const inputType = this.classifyInput(session.input);
    
    // 记录模式
    if (!this.metalearning.patterns[inputType]) {
      this.metalearning.patterns[inputType] = { count: 0, successCount: 0, attempts: 0 };
    }
    
    this.metalearning.patterns[inputType].count++;
    this.metalearning.patterns[inputType].successCount += session.success ? 1 : 0;
    this.metalearning.patterns[inputType].attempts += session.attempts;

    // 计算成功率
    const pattern = this.metalearning.patterns[inputType];
    pattern.successRate = pattern.successCount / pattern.count;
    pattern.avgAttempts = pattern.attempts / pattern.count;

    // 生成策略偏好
    if (pattern.successRate > 0.8) {
      this.metalearning.preferences[inputType] = 'current';
    } else if (pattern.successRate < 0.5) {
      this.metalearning.preferences[inputType] = 'need_improvement';
    }

    this.saveMetalearning();
  }

  classifyInput(input) {
    const lower = input.toLowerCase();
    
    if (lower.includes('代码') || lower.includes('函数') || lower.includes('编程')) {
      return 'coding';
    } else if (lower.includes('文档') || lower.includes('搜索') || lower.includes('查找')) {
      return 'research';
    } else if (lower.includes('写') || lower.includes('创作') || lower.includes('生成')) {
      return 'creative';
    } else if (lower.includes('计算') || lower.includes('分析') || lower.includes('数据')) {
      return 'analysis';
    } else if (lower.includes('天气') || lower.includes('时间') || lower.includes('日期')) {
      return 'info';
    } else if (lower.includes('记住') || lower.includes('保存') || lower.includes('笔记')) {
      return 'memory';
    } else {
      return 'general';
    }
  }

  // 学习学习策略
  learnStrategy(inputType, strategy, performance) {
    if (!this.metalearning.strategies[inputType]) {
      this.metalearning.strategies[inputType] = [];
    }

    // 记录策略性能
    this.metalearning.strategies[inputType].push({
      strategy,
      performance,
      timestamp: new Date().toISOString()
    });

    // 只保留最近 20 次记录
    if (this.metalearning.strategies[inputType].length > 20) {
      this.metalearning.strategies[inputType].shift();
    }

    // 找出最佳策略
    const strategies = this.metalearning.strategies[inputType];
    const best = strategies.reduce((best, current) => 
      current.performance > best.performance ? current : best
    );

    this.metalearning.bestStrategy = this.metalearning.bestStrategy || {};
    this.metalearning.bestStrategy[inputType] = best.strategy;

    this.saveMetalearning();

    return best;
  }

  // 获取推荐策略
  getRecommendedStrategy(inputType) {
    // 如果有历史最佳策略
    if (this.metalearning.bestStrategy && this.metalearning.bestStrategy[inputType]) {
      return this.metalearning.bestStrategy[inputType];
    }

    // 根据模式推荐
    const pattern = this.metalearning.patterns[inputType];
    if (pattern && pattern.successRate > 0.7) {
      return 'continue_current';
    }

    // 默认策略
    const defaults = {
      coding: 'use_coder_agent',
      research: 'use_researcher_agent',
      creative: 'use_creative_writer',
      analysis: 'use_analyst_agent',
      info: 'use_direct_answer',
      memory: 'save_to_memory',
      general: 'use_main_agent'
    };

    return defaults[inputType] || defaults.general;
  }

  // 生成学习洞察
  generateInsights() {
    const insights = [];
    const sessions = this.learningLog.sessions.slice(-100);

    // 洞察 1：成功率分析
    const totalSuccess = sessions.filter(s => s.success).length;
    const successRate = sessions.length > 0 ? (totalSuccess / sessions.length * 100).toFixed(1) + '%' : 'N/A';
    
    if (parseFloat(successRate) < 70) {
      insights.push({
        type: 'performance',
        message: `整体成功率较低 (${successRate})，需要改进学习方法`,
        priority: 'high'
      });
    }

    // 洞察 2：尝试次数分析
    const avgAttempts = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.attempts, 0) / sessions.length
      : 0;

    if (avgAttempts > 2) {
      insights.push({
        type: 'efficiency',
        message: `平均尝试次数较高 (${avgAttempts.toFixed(1)})，需要更准确的策略`,
        priority: 'medium'
      });
    }

    // 洞察 3：类型偏好分析
    const typeCounts = {};
    for (const session of sessions) {
      const type = session.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommonType) {
      insights.push({
        type: 'preference',
        message: `最常见任务类型：${mostCommonType} (${typeCounts[mostCommonType]} 次)`,
        priority: 'low'
      });
    }

    // 洞察 4：模式成功率分析
    for (const [type, pattern] of Object.entries(this.metalearning.patterns)) {
      if (pattern.count >= 5) {
        if (pattern.successRate < 0.5) {
          insights.push({
            type: 'pattern',
            message: `${type} 类型任务成功率较低 (${(pattern.successRate * 100).toFixed(1)}%)，需要改进`,
            priority: 'medium'
          });
        }
      }
    }

    this.learningLog.insights = insights;
    this.saveLearningLog();

    return insights;
  }

  // 优化学习算法
  optimizeLearningAlgorithm() {
    const recommendations = [];
    const sessions = this.learningLog.sessions.slice(-200);

    // 推荐 1：改进预测准确率
    if (sessions.length > 50) {
      const recentSuccessRate = sessions.slice(-50).filter(s => s.success).length / 50;
      const overallSuccessRate = sessions.filter(s => s.success).length / sessions.length;

      if (recentSuccessRate < overallSuccessRate * 0.9) {
        recommendations.push({
          area: 'prediction',
          issue: '预测准确率下降',
          suggestion: '更新输入分类模型'
        });
      }
    }

    // 推荐 2：提高首次成功率
    const firstAttemptSuccess = sessions.filter(s => s.success && s.attempts === 1).length;
    const totalSessions = sessions.length;

    if (totalSessions > 0 && firstAttemptSuccess / totalSessions < 0.6) {
      recommendations.push({
        area: 'efficiency',
        issue: '首次成功率低',
        suggestion: '改进策略选择逻辑'
      });
    }

    // 推荐 3：减少学习时间
    const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    
    if (avgDuration > 5000) { // 5秒
      recommendations.push({
        area: 'speed',
        issue: '学习时间较长',
        suggestion: '优化缓存和检索速度'
      });
    }

    return recommendations;
  }

  // 获取元学习统计
  getMetalearningStats() {
    const sessions = this.learningLog.sessions;
    const patterns = this.metalearning.patterns;

    return {
      totalSessions: sessions.length,
      successRate: sessions.length > 0 ? (sessions.filter(s => s.success).length / sessions.length * 100).toFixed(1) + '%' : 'N/A',
      avgAttempts: sessions.length > 0 ? (sessions.reduce((sum, s) => sum + s.attempts, 0) / sessions.length).toFixed(1) : 'N/A',
      recognizedPatterns: Object.keys(patterns).length,
      insights: this.learningLog.insights.length,
      lastUpdate: this.metalearning.lastUpdate
    };
  }
}

// 导出
module.exports = { MetaLearning };