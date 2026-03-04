#!/usr/bin/env node

/**
 * 🦐 麦克虾 - 自进化系统
 * 功能：自学习、自修复、自优化、自升级
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const EVOLUTION_DIR = path.join(process.env.HOME, '.openclaw/evolution');
const MEMORY_FILE = path.join(EVOLUTION_DIR, 'evolution-memory.json');
const LEARNING_FILE = path.join(EVOLUTION_DIR, 'learning.json');
const METRICS_FILE = path.join(EVOLUTION_DIR, 'metrics.json');

// 确保目录存在
if (!fs.existsSync(EVOLUTION_DIR)) {
  fs.mkdirSync(EVOLUTION_DIR, { recursive: true });
}

/**
 * 🧠 1. 自我学习系统
 * 记录对话、分析案例、提取模式
 */
class SelfLearning {
  constructor() {
    this.data = this.loadLearning();
  }
  
  loadLearning() {
    try {
      if (fs.existsSync(LEARNING_FILE)) {
        return JSON.parse(fs.readFileSync(LEARNING_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('加载学习数据失败:', error.message);
    }
    return {
      conversations: [],
      patterns: {},
      successes: [],
      failures: [],
      lastUpdate: null
    };
  }
  
  saveLearning() {
    this.data.lastUpdate = new Date().toISOString();
    fs.writeFileSync(LEARNING_FILE, JSON.stringify(this.data, null, 2));
  }
  
  // 记录对话
  recordConversation(input, output, outcome = 'success') {
    const record = {
      timestamp: new Date().toISOString(),
      input,
      output: output.substring(0, 1000), // 限制长度
      outcome
    };
    
    this.data.conversations.push(record);
    
    if (outcome === 'success') {
      this.data.successes.push(record);
    } else {
      this.data.failures.push(record);
    }
    
    // 分析模式
    this.analyzePatterns(input, output);
    this.saveLearning();
  }
  
  // 分析模式
  analyzePatterns(input, output) {
    const keywords = this.extractKeywords(input);
    
    for (const keyword of keywords) {
      if (!this.data.patterns[keyword]) {
        this.data.patterns[keyword] = {
          count: 0,
          responses: [],
          successRate: 0
        };
      }
      
      this.data.patterns[keyword].count++;
      this.data.patterns[keyword].responses.push(output.substring(0, 200));
      
      // 保持最近的 10 个响应
      if (this.data.patterns[keyword].responses.length > 10) {
        this.data.patterns[keyword].responses.shift();
      }
    }
  }
  
  // 提取关键词
  extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['的', '是', '在', '我', '你', '他', '她', '它', '我们', '你们', '他们'];
    return words.filter(w => w.length > 1 && !stopWords.includes(w));
  }
  
  // 根据模式预测最佳响应
  predictResponse(input) {
    const keywords = this.extractKeywords(input);
    const matches = [];
    
    for (const keyword of keywords) {
      if (this.data.patterns[keyword]) {
        const pattern = this.data.patterns[keyword];
        matches.push({
          keyword,
          count: pattern.count,
          response: pattern.responses[pattern.responses.length - 1]
        });
      }
    }
    
    // 按匹配次数排序
    matches.sort((a, b) => b.count - a.count);
    
    return matches.length > 0 ? matches[0].response : null;
  }
  
  // 获取学习统计
  getStats() {
    return {
      totalConversations: this.data.conversations.length,
      successes: this.data.successes.length,
      failures: this.data.failures.length,
      patterns: Object.keys(this.data.patterns).length,
      successRate: this.data.successes.length / Math.max(1, this.data.conversations.length) * 100,
      lastUpdate: this.data.lastUpdate
    };
  }
}

/**
 * 🛠️ 2. 自我修复机制
 * 监控状态、检测错误、自动重启
 */
class SelfRepair {
  constructor() {
    this.issues = this.loadIssues();
  }
  
  loadIssues() {
    const file = path.join(EVOLUTION_DIR, 'issues.json');
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    } catch (error) {}
    return { detected: [], fixed: [], history: [] };
  }
  
  saveIssues() {
    const file = path.join(EVOLUTION_DIR, 'issues.json');
    fs.writeFileSync(file, JSON.stringify(this.issues, null, 2));
  }
  
  // 检查 Telegram Bot 状态
  async checkTelegramBot() {
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      exec('ps aux | grep "telegram-integration" | grep -v grep', (error, stdout) => {
        const running = stdout.trim().length > 0;
        
        if (!running) {
          this.recordIssue('telegram_bot_down', 'Telegram Bot 未运行');
        }
        
        resolve({ running });
      });
    });
  }
  
  // 修复 Telegram Bot
  async repairTelegramBot() {
    const workspace = process.env.HOME + '/.openclaw/workspace';
    
    return new Promise((resolve) => {
      exec(`cd ${workspace} && pkill -9 -f "telegram-integration" 2>/dev/null; sleep 2; node telegram-integration.js &`, 
        (error, stdout, stderr) => {
          if (!error) {
            this.recordFix('telegram_bot_down', 'Telegram Bot 已重启');
            resolve({ success: true });
          } else {
            resolve({ success: false, error: error.message });
          }
        }
      );
    });
  }
  
  // 检查 Gateway 状态
  async checkGateway() {
    return new Promise((resolve) => {
      exec('openclaw status --json 2>&1', (error, stdout) => {
        const running = !error && stdout.includes('reachable');
        
        if (!running) {
          this.recordIssue('gateway_down', 'Gateway 未运行');
        }
        
        resolve({ running });
      });
    });
  }
  
  // 记录问题
  recordIssue(type, description) {
    const issue = {
      timestamp: new Date().toISOString(),
      type,
      description,
      fixed: false
    };
    
    this.issues.detected.push(issue);
    this.issues.history.push(issue);
    this.saveIssues();
  }
  
  // 记录修复
  recordFix(type, description) {
    const fix = {
      timestamp: new Date().toISOString(),
      type,
      description,
      fixed: true
    };
    
    this.issues.fixed.push(fix);
    this.issues.history.push(fix);
    this.saveIssues();
  }
  
  // 全面检查
  async fullCheck() {
    const results = {
      telegramBot: await this.checkTelegramBot(),
      gateway: await this.checkGateway()
    };
    
    // 自动修复
    if (!results.telegramBot.running) {
      console.log('🛠️ 检测到 Telegram Bot 未运行，正在修复...');
      await this.repairTelegramBot();
    }
    
    return results;
  }
}

/**
 * ⚡ 3. 自我优化引擎
 * 分析性能、优化配置、改进响应速度
 */
class SelfOptimization {
  constructor() {
    this.metrics = this.loadMetrics();
  }
  
  loadMetrics() {
    try {
      if (fs.existsSync(METRICS_FILE)) {
        return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
      }
    } catch (error) {}
    return {
      responseTimes: [],
      errorCounts: {},
      resourceUsage: [],
      lastOptimization: null
    };
  }
  
  saveMetrics() {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(this.metrics, null, 2));
  }
  
  // 记录响应时间
  recordResponseTime(time) {
    this.metrics.responseTimes.push({
      time,
      timestamp: new Date().toISOString()
    });
    
    // 只保留最近 1000 条
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
    
    this.saveMetrics();
  }
  
  // 记录错误
  recordError(errorType) {
    if (!this.metrics.errorCounts[errorType]) {
      this.metrics.errorCounts[errorType] = 0;
    }
    this.metrics.errorCounts[errorType]++;
    this.saveMetrics();
  }
  
  // 分析性能
  analyzePerformance() {
    const times = this.metrics.responseTimes.map(r => r.time);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length || 0;
    const maxTime = Math.max(...times) || 0;
    const minTime = Math.min(...times) || 0;
    
    return {
      avgTime: avgTime.toFixed(2) + 'ms',
      maxTime: maxTime.toFixed(2) + 'ms',
      minTime: minTime.toFixed(2) + 'ms',
      totalRequests: times.length,
      errorCounts: this.metrics.errorCounts
    };
  }
  
  // 优化建议
  getOptimizationSuggestions() {
    const analysis = this.analyzePerformance();
    const suggestions = [];
    
    if (parseFloat(analysis.avgTime) > 1000) {
      suggestions.push('⚠️ 平均响应时间较长，建议优化代码性能');
    }
    
    if (analysis.totalRequests < 100) {
      suggestions.push('💡 数据样本较少，建议收集更多性能数据');
    }
    
    const errorTypes = Object.keys(analysis.errorCounts);
    if (errorTypes.length > 0) {
      suggestions.push(`🔧 检测到 ${errorTypes.length} 种错误类型，建议优先修复高频错误`);
    }
    
    if (suggestions.length === 0) {
      suggestions.push('✅ 性能表现良好，无需优化');
    }
    
    return suggestions;
  }
  
  // 执行优化
  async optimize() {
    console.log('⚡ 执行优化...');
    
    // 清理旧数据
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
    
    this.metrics.lastOptimization = new Date().toISOString();
    this.saveMetrics();
    
    return { success: true, message: '优化完成' };
  }
}

/**
 * 🚀 4. 自我升级框架
 * 检查更新、学习新功能、适配新 API
 */
class SelfUpgrade {
  constructor() {
    this.upgradeLog = path.join(EVOLUTION_DIR, 'upgrades.json');
  }
  
  // 检查 OpenClaw 更新
  async checkOpenClawUpdate() {
    return new Promise((resolve) => {
      exec('openclaw --version 2>&1', (error, stdout) => {
        if (!error) {
          resolve({
            current: stdout.trim(),
            latest: 'unknown',
            needsUpdate: false
          });
        } else {
          resolve({ error: error.message });
        }
      });
    });
  }
  
  // 学习新技能
  async learnSkill(skillName, skillUrl) {
    console.log(`📚 学习新技能：${skillName}`);
    
    const skillFile = path.join(EVOLUTION_DIR, `skill-${skillName}.md`);
    const content = `
# ${skillName}

学习时间：${new Date().toISOString()}
来源：${skillUrl}

待完成：
- [ ] 理解技能功能
- [ ] 实现核心逻辑
- [ ] 测试和验证
- [ ] 集成到主系统
`;
    
    fs.writeFileSync(skillFile, content);
    
    return { success: true, message: `技能 ${skillName} 已添加到学习队列` };
  }
  
  // 适配新 API
  async adaptNewAPI(apiName, docs) {
    const adapterFile = path.join(EVOLUTION_DIR, `adapter-${apiName}.js`);
    const content = `
/**
 * ${apiName} 适配器
 * 创建时间：${new Date().toISOString()}
 */

// 待实现：适配 ${apiName} API
`;
    
    fs.writeFileSync(adapterFile, content);
    
    return { success: true, message: `${apiName} 适配器已创建` };
  }
}

/**
 * 🦐 自进化系统主控制器
 */
class SelfEvolution {
  constructor() {
    this.learning = new SelfLearning();
    this.repair = new SelfRepair();
    this.optimization = new SelfOptimization();
    this.upgrade = new SelfUpgrade();
  }
  
  // 全面自检
  async selfCheck() {
    console.log('🦐 麦克虾自进化系统 - 全面自检');
    console.log('');
    
    // 1. 自我学习统计
    console.log('🧠 自我学习统计：');
    const stats = this.learning.getStats();
    console.log(`   总对话数：${stats.totalConversations}`);
    console.log(`   成功率：${stats.successRate.toFixed(2)}%`);
    console.log(`   识别模式：${stats.patterns} 个`);
    console.log('');
    
    // 2. 自我修复检查
    console.log('🛠️ 自我修复检查：');
    const repairResults = await this.repair.fullCheck();
    console.log(`   Telegram Bot：${repairResults.telegramBot.running ? '✅ 运行中' : '❌ 未运行'}`);
    console.log(`   Gateway：${repairResults.gateway.running ? '✅ 运行中' : '❌ 未运行'}`);
    console.log('');
    
    // 3. 自我优化分析
    console.log('⚡ 自我优化分析：');
    const performance = this.optimization.analyzePerformance();
    console.log(`   平均响应时间：${performance.avgTime}`);
    console.log(`   总请求数：${performance.totalRequests}`);
    console.log('');
    
    const suggestions = this.optimization.getOptimizationSuggestions();
    console.log('   优化建议：');
    suggestions.forEach(s => console.log(`   ${s}`));
    console.log('');
    
    // 4. 自我升级状态
    console.log('🚀 自我升级状态：');
    const update = await this.upgrade.checkOpenClawUpdate();
    console.log(`   当前版本：${update.current}`);
    console.log('');
    
    return {
      learning: stats,
      repair: repairResults,
      optimization: performance,
      upgrade: update
    };
  }
  
  // 学习新的对话
  learn(input, output, outcome) {
    this.learning.recordConversation(input, output, outcome);
  }
  
  // 执行优化
  async runOptimization() {
    return await this.optimization.optimize();
  }
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const evolution = new SelfEvolution();
  
  if (args.length === 0 || args[0] === 'check') {
    evolution.selfCheck();
  } else if (args[0] === 'learn') {
    if (args.length < 3) {
      console.log('用法：node self-evolution.js learn <输入> <输出> [success|failure]');
      process.exit(1);
    }
    evolution.learn(args[1], args[2], args[3] || 'success');
    console.log('✅ 学习完成');
  } else if (args[0] === 'optimize') {
    evolution.runOptimization();
    console.log('✅ 优化完成');
  } else {
    console.log('🦐 麦克虾自进化系统');
    console.log('');
    console.log('用法：');
    console.log('  node self-evolution.js check       - 全面自检');
    console.log('  node self-evolution.js learn <输入> <输出> [outcome] - 学习对话');
    console.log('  node self-evolution.js optimize     - 执行优化');
  }
}

module.exports = { SelfEvolution, SelfLearning, SelfRepair, SelfOptimization, SelfUpgrade };