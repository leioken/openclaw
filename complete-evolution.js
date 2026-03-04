#!/usr/bin/env node

/**
 * 🦐 麦克虾 - 完整自进化管理器
 * 集成所有进化组件，协调运行
 */

const { SelfEvolution } = require('./self-evolution');
const { KnowledgeGraph } = require('./knowledge-graph');
const { ReflectionSystem } = require('./reflection-system');
const { FeedbackLoop } = require('./feedback-loop');
const { RecursiveCodeEvolution } = require('./recursive-code-evolution');
const { MetaLearning } = require('./metalearning');

class CompleteEvolutionManager {
  constructor() {
    this.selfEvolution = new SelfEvolution();
    this.knowledgeGraph = new KnowledgeGraph();
    this.reflection = new ReflectionSystem();
    this.feedbackLoop = new FeedbackLoop();
    this.codeEvolution = new RecursiveCodeEvolution();
    this.metalearning = new MetaLearning();
  }

  // 全面进化循环
  async fullEvolutionCycle() {
    console.log('');
    console.log('🦐 麦克虾 - 完整自进化循环');
    console.log('='.repeat(50));
    console.log('');

    const results = {
      timestamp: new Date().toISOString(),
      components: {}
    };

    try {
      // 1. 递归代码进化
      console.log('🔁 1. 递归代码进化...');
      results.components.codeEvolution = await this.codeEvolution.evolve();

      // 2. 反思和改进
      console.log('🪞 2. 反思和改进...');
      results.components.reflection = this.reflection.generateReflectionReport();

      // 3. 实时反馈分析
      console.log('🔄 3. 实时反馈分析...');
      results.components.feedback = this.feedbackLoop.generateReport();

      // 4. 知识图谱更新
      console.log('🧠 4. 知识图谱更新...');
      results.components.knowledgeGraph = this.knowledgeGraph.getStats();

      // 5. 元学习优化
      console.log('🎓 5. 元学习优化...');
      results.components.metalearning = this.metalearning.generateInsights();

      // 6. 自我学习统计
      console.log('📚 6. 自我学习统计...');
      results.components.learning = this.selfEvolution.learning.getStats();

      // 7. 自我优化分析
      console.log('⚡ 7. 自我优化分析...');
      results.components.optimization = this.selfEvolution.optimization.analyzePerformance();

      // 8. 自修复检查
      console.log('🛠️ 8. 自修复检查...');
      results.components.repair = await this.selfEvolution.repair.fullCheck();

      console.log('');
      console.log('✅ 完整自进化循环完成');
      console.log('');

    } catch (error) {
      console.error('❌ 进化循环失败:', error.message);
      results.error = error.message;
    }

    return results;
  }

  // 学习对话
  async learnConversation(input, output, success = true, context = {}) {
    // 1. 自我学习
    this.selfEvolution.learning.recordConversation(input, output, success ? 'success' : 'failure');

    // 2. 添加到知识图谱
    const nodeId = this.knowledgeGraph.addNode('conversation', {
      input: input.substring(0, 500),
      output: output.substring(0, 500),
      success,
      timestamp: new Date().toISOString()
    });

    // 3. 反思
    const critique = this.reflection.critique(input, output, context);

    // 4. 元学习
    const type = this.metalearning.classifyInput(input);
    this.metalearning.recordLearningSession(type, input, output, success, context);

    // 5. 反馈循环
    if (context.rating) {
      this.feedbackLoop.recordRating(input, output, context.rating, context);
    }

    return {
      nodeId,
      critique,
      metalearning: type
    };
  }

  // 查询知识
  queryKnowledge(query, type = null) {
    if (type) {
      return this.knowledgeGraph.query(type);
    } else {
      return this.knowledgeGraph.search(query);
    }
  }

  // 获取进化报告
  async getEvolutionReport() {
    return {
      timestamp: new Date().toISOString(),
      selfEvolution: {
        learning: this.selfEvolution.learning.getStats(),
        optimization: this.selfEvolution.optimization.analyzePerformance(),
        repair: await this.selfEvolution.repair.fullCheck(),
        upgrade: await this.selfEvolution.upgrade.checkOpenClawUpdate()
      },
      knowledgeGraph: this.knowledgeGraph.getStats(),
      reflection: this.reflection.generateReflectionReport(),
      feedbackLoop: this.feedbackLoop.generateReport(),
      codeEvolution: this.codeEvolution.getEvolutionStats(),
      metalearning: this.metalearning.getMetalearningStats()
    };
  }

  // 清理旧数据
  cleanup() {
    const kgCleanup = this.knowledgeGraph.cleanup(30);
    const fbCleanup = this.feedbackLoop.cleanup(30);

    return {
      knowledgeGraph: kgCleanup,
      feedbackLoop: fbCleanup
    };
  }

  // 导出所有数据
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      knowledgeGraph: this.knowledgeGraph,
      reflections: this.reflection.reflections,
      feedback: this.feedbackLoop.feedback,
      codeEvolution: this.codeEvolution.optimizations,
      metalearning: this.metalearning.metalearning,
      selfEvolution: {
        learning: this.selfEvolution.learning,
        optimization: this.selfEvolution.optimization,
        repair: this.selfEvolution.repair,
        upgrade: this.selfEvolution.upgrade
      }
    };
  }

  // 导入数据
  importData(data) {
    if (data.knowledgeGraph) {
      // 需要实际的导入逻辑
      console.log('导入知识图谱数据...');
    }

    if (data.reflections) {
      this.reflection.reflections = data.reflections;
      this.reflection.saveReflections();
    }

    if (data.feedback) {
      this.feedbackLoop.feedback = data.feedback;
      this.feedbackLoop.saveFeedback();
    }

    console.log('数据导入完成');
  }
}

// 导出
module.exports = { CompleteEvolutionManager };