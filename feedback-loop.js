#!/usr/bin/env node

/**
 * 🔄 实时反馈循环系统
 * 跟踪用户满意度，根据反馈调整策略，A/B 测试不同方法
 */

const fs = require('fs');
const path = require('path');

const FEEDBACK_FILE = path.join(process.env.HOME, '.openclaw/evolution/feedback.json');
const AB_TEST_FILE = path.join(process.env.HOME, '.openclaw/evolution/ab-tests.json');
const STRATEGIES_FILE = path.join(process.env.HOME, '.openclaw/evolution/strategies.json');

class FeedbackLoop {
  constructor() {
    this.feedback = this.loadFeedback();
    this.abTests = this.loadABTests();
    this.strategies = this.loadStrategies();
  }

  loadFeedback() {
    try {
      if (fs.existsSync(FEEDBACK_FILE)) {
        return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'));
      }
    } catch (error) {}
    return { ratings: [], reactions: [], comments: [], metrics: {} };
  }

  saveFeedback() {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(this.feedback, null, 2));
  }

  loadABTests() {
    try {
      if (fs.existsSync(AB_TEST_FILE)) {
        return JSON.parse(fs.readFileSync(AB_TEST_FILE, 'utf8'));
      }
    } catch (error) {}
    return { active: [], completed: [] };
  }

  saveABTests() {
    fs.writeFileSync(AB_TEST_FILE, JSON.stringify(this.abTests, null, 2));
  }

  loadStrategies() {
    try {
      if (fs.existsSync(STRATEGIES_FILE)) {
        return JSON.parse(fs.readFileSync(STRATEGIES_FILE, 'utf8'));
      }
    } catch (error) {}
    return { 
      responses: {}, 
      reasoning: {}, 
      formatting: {},
      default: {
        response: 'balanced',
        reasoning: 'thorough',
        formatting: 'structured'
      }
    };
  }

  saveStrategies() {
    fs.writeFileSync(STRATEGIES_FILE, JSON.stringify(this.strategies, null, 2));
  }

  // 记录用户评分
  recordRating(input, output, rating, context = {}) {
    const record = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      input: input.substring(0, 200),
      output: output.substring(0, 200),
      rating, // 1-5
      context,
      strategy: this.getCurrentStrategy()
    };

    this.feedback.ratings.push(record);
    this.updateMetrics();
    this.saveFeedback();

    return record.id;
  }

  // 记录用户反应
  recordReaction(input, output, reaction, context = {}) {
    const record = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      input: input.substring(0, 200),
      output: output.substring(0, 200),
      reaction, // 'like', 'dislike', 'neutral'
      context
    };

    this.feedback.reactions.push(record);
    this.saveFeedback();

    return record.id;
  }

  // 记录用户评论
  recordComment(input, output, comment, context = {}) {
    const record = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      input: input.substring(0, 200),
      output: output.substring(0, 200),
      comment,
      context
    };

    this.feedback.comments.push(record);
    this.saveFeedback();

    return record.id;
  }

  // 更新指标
  updateMetrics() {
    const ratings = this.feedback.ratings.slice(-100); // 最近 100 次评分
    
    if (ratings.length === 0) return;

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingsByStrategy = {};
    
    for (const rating of ratings) {
      const strategy = rating.strategy || 'default';
      if (!ratingsByStrategy[strategy]) {
        ratingsByStrategy[strategy] = [];
      }
      ratingsByStrategy[strategy].push(rating.rating);
    }

    const strategyStats = {};
    for (const [strategy, values] of Object.entries(ratingsByStrategy)) {
      strategyStats[strategy] = {
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
        count: values.length
      };
    }

    this.feedback.metrics = {
      avgRating: avgRating.toFixed(2),
      totalRatings: this.feedback.ratings.length,
      recentRatings: ratings.length,
      strategyStats,
      lastUpdated: new Date().toISOString()
    };

    this.saveFeedback();
  }

  // 获取当前策略
  getCurrentStrategy() {
    return this.strategies.default;
  }

  // 调整策略（根据反馈）
  adjustStrategy(dimension, newStrategy) {
    const validDimensions = ['response', 'reasoning', 'formatting'];
    
    if (!validDimensions.includes(dimension)) {
      throw new Error(`Invalid dimension: ${dimension}`);
    }

    this.strategies.default[dimension] = newStrategy;
    this.strategies[dimension][newStrategy] = {
      adoptedAt: new Date().toISOString(),
      previousStrategy: this.strategies.default[dimension]
    };

    this.saveStrategies();

    return newStrategy;
  }

  // 创建 A/B 测试
  createABTest(testName, variantA, variantB, durationHours = 24) {
    const test = {
      id: Date.now().toString(),
      name: testName,
      variantA: {
        name: variantA.name,
        config: variantA.config,
        results: { ratings: [], reactions: [], count: 0 }
      },
      variantB: {
        name: variantB.name,
        config: variantB.config,
        results: { ratings: [], reactions: [], count: 0 }
      },
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };

    this.abTests.active.push(test);
    this.saveABTests();

    return test.id;
  }

  // 分配测试变体
  assignVariant(testId) {
    const test = this.abTests.active.find(t => t.id === testId);
    if (!test) return null;

    // 简单轮换分配（50/50）
    const variantId = Date.now().toString();
    const variant = variantId.endsWith('0') || variantId.endsWith('2') || variantId.endsWith('4') || variantId.endsWith('6') || variantId.endsWith('8')
      ? 'A'
      : 'B';

    return {
      testId,
      variant,
      config: variant === 'A' ? test.variantA.config : test.variantB.config
    };
  }

  // 记录测试结果
  recordTestResult(testId, variant, rating, reaction) {
    const test = this.abTests.active.find(t => t.id === testId);
    if (!test) return;

    const variantData = variant === 'A' ? test.variantA : test.variantB;
    
    if (rating) {
      variantData.results.ratings.push(rating);
    }
    if (reaction) {
      variantData.results.reactions.push(reaction);
    }
    variantData.results.count++;

    this.saveABTests();
  }

  // 分析测试结果
  analyzeTest(testId) {
    const test = this.abTests.active.find(t => t.id === testId);
    if (!test) return null;

    const avgRatingA = test.variantA.results.ratings.length > 0
      ? test.variantA.results.ratings.reduce((a, b) => a + b, 0) / test.variantA.results.ratings.length
      : 0;
    
    const avgRatingB = test.variantB.results.ratings.length > 0
      ? test.variantB.results.ratings.reduce((a, b) => a + b, 0) / test.variantB.results.ratings.length
      : 0;

    const positiveReactionsA = test.variantA.results.reactions.filter(r => r === 'like').length;
    const positiveReactionsB = test.variantB.results.reactions.filter(r => r === 'like').length;

    const winner = avgRatingA > avgRatingB ? 'A' : avgRatingB > avgRatingA ? 'B' : 'tie';

    return {
      testId,
      testName: test.name,
      variantA: {
        name: test.variantA.name,
        avgRating: avgRatingA.toFixed(2),
        positiveReactions: `${positiveReactionsA}/${test.variantA.results.reactions.length}`,
        totalResponses: test.variantA.results.count
      },
      variantB: {
        name: test.variantB.name,
        avgRating: avgRatingB.toFixed(2),
        positiveReactions: `${positiveReactionsB}/${test.variantB.results.reactions.length}`,
        totalResponses: test.variantB.results.count
      },
      winner,
      significance: Math.abs(avgRatingA - avgRatingB) > 0.5 ? 'significant' : 'not-significant'
    };
  }

  // 完成测试并应用胜者
  completeTest(testId) {
    const testIndex = this.abTests.active.findIndex(t => t.id === testId);
    if (testIndex === -1) return null;

    const test = this.abTests.active[testIndex];
    const analysis = this.analyzeTest(testId);

    // 移动到已完成
    this.abTests.active.splice(testIndex, 1);
    this.abTests.completed.push({
      ...test,
      status: 'completed',
      completedAt: new Date().toISOString(),
      analysis
    });

    // 应用胜者策略
    if (analysis.winner !== 'tie') {
      const winnerConfig = analysis.winner === 'A' ? test.variantA.config : test.variantB.config;
      
      for (const [dimension, value] of Object.entries(winnerConfig)) {
        this.adjustStrategy(dimension, value);
      }
    }

    this.saveABTests();

    return analysis;
  }

  // 获取推荐策略
  getRecommendedStrategy() {
    const metrics = this.feedback.metrics;
    const strategyStats = metrics.strategyStats || {};

    // 找出平均评分最高的策略
    let bestStrategy = 'default';
    let bestRating = 0;

    for (const [strategy, stats] of Object.entries(strategyStats)) {
      if (parseFloat(stats.avg) > bestRating && stats.count >= 10) {
        bestRating = parseFloat(stats.avg);
        bestStrategy = strategy;
      }
    }

    return {
      strategy: bestStrategy,
      rating: bestRating.toFixed(2),
      confidence: strategyStats[bestStrategy]?.count || 0
    };
  }

  // 生成反馈报告
  generateReport() {
    const metrics = this.feedback.metrics;
    const reactions = this.feedback.reactions.slice(-100);
    
    const positiveReactions = reactions.filter(r => r.reaction === 'like').length;
    const negativeReactions = reactions.filter(r => r.reaction === 'dislike').length;
    
    const recentComments = this.feedback.comments.slice(-5);

    return {
      overview: metrics,
      reactions: {
        positive: positiveReactions,
        negative: negativeReactions,
        total: reactions.length,
        positiveRate: reactions.length > 0 ? (positiveReactions / reactions.length * 100).toFixed(1) + '%' : 'N/A'
      },
      activeABTests: this.abTests.active.length,
      completedABTests: this.abTests.completed.length,
      recommendedStrategy: this.getRecommendedStrategy(),
      recentComments,
      lastUpdated: new Date().toISOString()
    };
  }

  // 清理旧数据
  cleanup(daysOld = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const before = this.feedback.ratings.length;

    // 清理评分
    this.feedback.ratings = this.feedback.ratings.filter(r => new Date(r.timestamp) > cutoff);
    
    // 清理反应
    this.feedback.reactions = this.feedback.reactions.filter(r => new Date(r.timestamp) > cutoff);
    
    // 清理评论
    this.feedback.comments = this.feedback.comments.filter(c => new Date(c.timestamp) > cutoff);

    const after = this.feedback.ratings.length;
    
    this.saveFeedback();

    return { removed: before - after, remaining: after };
  }
}

// 导出
module.exports = { FeedbackLoop };