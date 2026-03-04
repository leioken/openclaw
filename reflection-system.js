#!/usr/bin/env node

/**
 * 🪞 反射机制系统
 * 内部自我批判，评估回答，自动改进
 */

const fs = require('fs');
const path = require('path');

const REFLECTIONS_FILE = path.join(process.env.HOME, '.openclaw/evolution/reflections.json');
const EVALUATION_FILE = path.join(process.env.HOME, '.openclaw/evolution/evaluations.json');

class ReflectionSystem {
  constructor() {
    this.reflections = this.loadReflections();
    this.evaluations = this.loadEvaluations();
  }

  loadReflections() {
    try {
      if (fs.existsSync(REFLECTIONS_FILE)) {
        return JSON.parse(fs.readFileSync(REFLECTIONS_FILE, 'utf8'));
      }
    } catch (error) {}
    return { critiques: [], improvements: [], insights: [] };
  }

  saveReflections() {
    fs.writeFileSync(REFLECTIONS_FILE, JSON.stringify(this.reflections, null, 2));
  }

  loadEvaluations() {
    try {
      if (fs.existsSync(EVALUATION_FILE)) {
        return JSON.parse(fs.readFileSync(EVALUATION_FILE, 'utf8'));
      }
    } catch (error) {}
    return { total: 0, scores: [], categories: {} };
  }

  saveEvaluations() {
    fs.writeFileSync(EVALUATION_FILE, JSON.stringify(this.evaluations, null, 2));
  }

  // 自我批判
  critique(input, output, context = {}) {
    const critique = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      input: input.substring(0, 500),
      output: output.substring(0, 500),
      context,
      critiquePoints: [],
      score: 0,
      suggestions: []
    };

    // 批判维度
    const dimensions = {
      accuracy: this.checkAccuracy(input, output),
      relevance: this.checkRelevance(input, output),
      completeness: this.checkCompleteness(input, output),
      clarity: this.checkClarity(output),
      helpfulness: this.checkHelpfulness(input, output),
      tone: this.checkTone(output)
    };

    // 计算总分
    critique.score = Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.keys(dimensions).length;

    // 生成批判点
    for (const [dimension, value] of Object.entries(dimensions)) {
      if (value < 0.7) {
        critique.critiquePoints.push({
          dimension,
          score: value,
          issue: `${dimension} 不足`,
          suggestion: this.getSuggestion(dimension, value)
        });
      }
    }

    // 生成改进建议
    critique.suggestions = this.generateSuggestions(dimensions);

    // 保存批判
    this.reflections.critiques.push(critique);
    this.saveReflections();

    return critique;
  }

  checkAccuracy(input, output) {
    // 检查回答是否准确
    const outputLower = output.toLowerCase();
    
    // 避免明显错误
    if (outputLower.includes('我不知道') || outputLower.includes('无法回答')) {
      return 0.3;
    }
    
    // 如果回答包含具体信息
    if (output.length > 200 && !outputLower.includes('可能')) {
      return 0.9;
    }
    
    return 0.7;
  }

  checkRelevance(input, output) {
    // 检查回答是否相关
    const inputWords = input.toLowerCase().split(/\s+/);
    const outputWords = output.toLowerCase().split(/\s+/);
    
    // 计算词汇重叠
    let overlap = 0;
    for (const word of inputWords) {
      if (outputWords.includes(word)) overlap++;
    }
    
    const overlapRatio = overlap / Math.max(1, inputWords.length);
    
    return Math.min(0.9, overlapRatio + 0.5);
  }

  checkCompleteness(input, output) {
    // 检查回答是否完整
    const hasIntroduction = output.length > 50;
    const hasDetails = output.length > 200;
    const hasConclusion = output.includes('。') || output.includes('！') || output.includes('?');
    
    let score = 0.5;
    if (hasIntroduction) score += 0.15;
    if (hasDetails) score += 0.25;
    if (hasConclusion) score += 0.1;
    
    return Math.min(1.0, score);
  }

  checkClarity(output) {
    // 检查表达是否清晰
    const avgSentenceLength = output.split(/[。！？.!?]/).reduce((a, b) => a + b.length, 0) / (output.split(/[。！？.!?]/).length || 1);
    
    // 句子太长或太短都不好
    if (avgSentenceLength > 100 || avgSentenceLength < 10) {
      return 0.6;
    }
    
    // 检查是否有结构
    const hasStructure = output.includes('\n') || output.includes('：') || output.includes('-');
    if (hasStructure) return 0.9;
    
    return 0.7;
  }

  checkHelpfulness(input, output) {
    // 检查回答是否有帮助
    const helpfulKeywords = ['可以', '应该', '建议', '尝试', '方法', '步骤', '如何', '解决'];
    const outputLower = output.toLowerCase();
    
    let count = 0;
    for (const keyword of helpfulKeywords) {
      if (outputLower.includes(keyword)) count++;
    }
    
    return Math.min(1.0, 0.5 + count * 0.1);
  }

  checkTone(output) {
    // 检查语气是否恰当
    const outputLower = output.toLowerCase();
    
    // 避免过于情绪化
    if (outputLower.includes('！！！') || outputLower.includes('????')) {
      return 0.5;
    }
    
    // 礼貌用语
    const polite = outputLower.includes('请') || outputLower.includes('谢谢') || outputLower.includes('你好');
    if (polite) return 0.9;
    
    return 0.7;
  }

  getSuggestion(dimension, score) {
    const suggestions = {
      accuracy: '确保回答的准确性，避免猜测',
      relevance: '更直接地回答问题，避免跑题',
      completeness: '提供更完整的回答，补充必要细节',
      clarity: '使用更清晰的表达，适当分段',
      helpfulness: '提供具体可行的建议',
      tone: '保持友好专业的语气'
    };
    
    return suggestions[dimension] || '改进此方面';
  }

  generateSuggestions(dimensions) {
    const suggestions = [];
    
    for (const [dimension, score] of Object.entries(dimensions)) {
      if (score < 0.8) {
        suggestions.push(this.getSuggestion(dimension, score));
      }
    }
    
    return suggestions.slice(0, 3);
  }

  // 生成反思报告
  generateReflectionReport() {
    const critiques = this.reflections.critiques.slice(-50); // 最近 50 次批判
    
    const avgScore = critiques.length > 0
      ? critiques.reduce((sum, c) => sum + c.score, 0) / critiques.length
      : 0;

    const issues = {};
    for (const critique of critiques) {
      for (const point of critique.critiquePoints) {
        if (!issues[point.dimension]) {
          issues[point.dimension] = { count: 0, avgScore: 0 };
        }
        issues[point.dimension].count++;
        issues[point.dimension].avgScore += point.score;
      }
    }

    for (const key in issues) {
      issues[key].avgScore /= issues[key].count;
    }

    // 生成改进计划
    const improvements = [];
    const sortedIssues = Object.entries(issues).sort((a, b) => b[1].count - a[1].count);
    
    for (const [dimension, data] of sortedIssues.slice(0, 3)) {
      improvements.push({
        dimension,
        issueCount: data.count,
        avgScore: data.avgScore.toFixed(2),
        priority: data.count > 10 ? 'high' : data.count > 5 ? 'medium' : 'low',
        suggestion: this.getSuggestion(dimension, data.avgScore)
      });
    }

    return {
      totalCritiques: this.reflections.critiques.length,
      recentCritiques: critiques.length,
      avgScore: avgScore.toFixed(2),
      topIssues: improvements,
      lastUpdated: new Date().toISOString()
    };
  }

  // 记录改进
  recordImprovement(improvement) {
    const record = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      improvement,
      implemented: false,
      effectiveness: null
    };

    this.reflections.improvements.push(record);
    this.saveReflections();

    return record.id;
  }

  // 标记改进为已实施
  markImprovementImplemented(improvementId, effectiveness) {
    const improvement = this.reflections.improvements.find(i => i.id === improvementId);
    if (improvement) {
      improvement.implemented = true;
      improvement.effectiveness = effectiveness;
      this.saveReflections();
    }
  }
}

// 导出
module.exports = { ReflectionSystem };