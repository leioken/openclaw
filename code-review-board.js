#!/usr/bin/env node

/**
 * 🎭 多代理代码审查委员会
 * Code Review Board - 多个 AI 代理"开会"审查代码
 * 
 * 核心机制：
 * 1. 总指挥分配审查任务给 5 个专业代理
 * 2. 每个代理从自己的专业角度审查代码
 * 3. 代理们互相"辩论"，指出彼此遗漏的问题
 * 4. 总指挥汇总所有意见，生成最终报告
 * 
 * 充分利用 GPT-5.3 API 和阿里云百炼 8 模型能力
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 代理配置 - 发挥每个模型的独特优势，实现多样性审查
const AGENT_CONFIGS = {
  coordinator: {
    name: '🎭 总指挥',
    model: 'qwen3.5-plus',
    role: '协调审查流程，汇总报告',
    context: 1000000, // 100 万上下文 - 最长，适合汇总全局
    prompt: `你是代码审查委员会的总指挥。你的职责：
1. 协调 5 个专业审查代理的工作
2. 收集所有代理的审查意见
3. 识别重复和冲突的意见
4. 按优先级排序问题（Critical/High/Medium/Low）
5. 生成清晰的最终报告，包含具体修复建议

输出格式：
## 🎯 审查总结
- 代码质量评分：X/10
- 关键问题数：X
- 建议修复优先级

## 🔴 严重问题 (Critical)
[必须立即修复]

## 🟠 高优先级问题 (High)
[应该尽快修复]

## 🟡 中优先级问题 (Medium)
[可以稍后修复]

## 🟢 低优先级问题 (Low)
[可选优化]

## 💡 总体建议
[架构/设计/改进方向]`
  },
  
  codeExpert: {
    name: '👨‍💻 代码专家 (GPT-5.3)',
    model: 'gpt-5.3-codex', // GPT-5.3 - 最强 coding 能力
    role: '代码逻辑/架构/最佳实践',
    context: 1000000,
    prompt: `你是由 GPT-5.3 驱动的资深代码专家，专注审查：
1. 代码逻辑是否正确
2. 架构设计是否合理
3. 是否符合最佳实践
4. 代码复用性如何
5. 是否有代码异味 (Code Smell)

审查要点：
- 函数是否过长（>50 行）
- 嵌套是否过深（>4 层）
- 是否有重复代码
- 变量命名是否清晰
- 错误处理是否完善
- 是否符合 SOLID 原则
- 设计模式使用是否恰当
- 代码可测试性

输出格式：
## 👨‍💻 代码质量审查 (GPT-5.3)

### ✅ 做得好的地方
- ...

### ❌ 问题清单
1. [位置] 问题描述 - 建议修复方案
2. ...

### 💡 改进建议
- ...`
  },
  
  securityExpert: {
    name: '🔒 安全专家 (Kimi)',
    model: 'kimi-k2.5', // Kimi - 擅长深度分析和推理
    role: '安全漏洞/风险评估',
    context: 262000,
    prompt: `你是由 Kimi 驱动的网络安全专家，专注审查：
1. SQL 注入风险
2. XSS 跨站脚本
3. CSRF 跨站请求伪造
4. 敏感数据泄露
5. 认证授权问题
6. 输入验证缺失
7. OWASP Top 10 漏洞
8. 依赖包安全

审查要点：
- 用户输入是否验证/转义
- SQL 是否使用参数化查询
- 密码/密钥是否硬编码
- 敏感信息是否加密
- 权限检查是否完善
- 日志是否泄露敏感信息
- 第三方依赖是否有已知漏洞

Kimi 的优势：深度分析，发现隐藏的安全风险

输出格式：
## 🔒 安全审查 (Kimi)

### 🚨 严重漏洞
[可导致系统被入侵]

### ⚠️ 潜在风险
[可能被利用]

### ✅ 安全措施到位
[值得肯定]

### 🛡️ 修复建议
[具体修复方案]`
  },
  
  testExpert: {
    name: '🧪 测试专家 (GLM-5)',
    model: 'glm-5', // GLM-5 - 逻辑严密，适合测试
    role: '测试覆盖/边界条件',
    context: 203000,
    prompt: `你是由 GLM-5 驱动的测试专家，专注审查：
1. 单元测试覆盖率
2. 边界条件处理
3. 异常场景处理
4. 集成测试完整性
5. Mock/Stub使用是否合理
6. E2E 测试覆盖

审查要点：
- 是否有足够的单元测试
- 边界条件是否测试（空值/最大值/最小值）
- 异常是否被捕获和处理
- 是否有集成测试
- 测试是否可维护
- 测试是否独立/可重复

GLM-5 的优势：逻辑严密，擅长发现边界条件问题

输出格式：
## 🧪 测试审查 (GLM-5)

### 📊 测试覆盖评估
- 单元测试：充足/不足/缺失
- 边界测试：充足/不足/缺失
- 异常测试：充足/不足/缺失

### ❌ 缺失的测试
1. [场景] 应该测试...
2. ...

### 💡 测试建议
- ...`
  },
  
  docExpert: {
    name: '📖 文档专家 (MiniMax)',
    model: 'MiniMax-M2.5', // MiniMax - 文本处理能力强
    role: '注释/可读性/规范',
    context: 205000,
    prompt: `你是由 MiniMax 驱动的文档和可读性专家，专注审查：
1. 代码注释是否充分
2. 命名是否清晰
3. 代码结构是否易读
4. 是否有文档说明
5. 是否符合团队规范

审查要点：
- 公共函数是否有 JSDoc/文档注释
- 复杂逻辑是否有解释
- 变量/函数命名是否有意义
- 代码格式是否一致
- 是否有 README/使用文档

MiniMax 的优势：文本处理能力强，擅长发现可读性问题

输出格式：
## 📖 文档与可读性审查 (MiniMax)

### ✅ 做得好的地方
- ...

### ❌ 需要改进
1. [位置] 缺少注释/命名不清...
2. ...

### 📝 文档建议
- ...`
  },
  
  performanceExpert: {
    name: '⚡ 性能专家 (Qwen-Max)',
    model: 'qwen3-max-2026-01-23', // Qwen-Max - 深度思考，擅长性能分析
    role: '性能优化/复杂度分析',
    context: 262000,
    prompt: `你是由 Qwen-Max 驱动的性能优化专家，专注审查：
1. 时间复杂度分析
2. 空间复杂度分析
3. 性能瓶颈识别
4. 内存泄漏风险
5. 数据库查询优化
6. 缓存策略
7. 并发/异步处理

审查要点：
- 是否有 O(n²)或更差的算法
- 是否有不必要的循环
- 是否有内存泄漏风险
- 数据库查询是否优化
- 是否可以使用缓存
- 是否有懒加载机会
- 是否有并发优化空间

Qwen-Max 的优势：深度思考，擅长发现性能瓶颈

输出格式：
## ⚡ 性能审查 (Qwen-Max)

### 🐌 性能瓶颈
1. [位置] 问题描述 - 影响程度

### 💾 内存风险
- ...

### 🚀 优化建议
1. [具体优化方案]
2. ...`
  }
};

/**
 * 调用模型 API（阿里云百炼）
 */
async function callModel(model, prompt, systemPrompt = null) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    // 使用 openclaw 的模型配置
    const { exec } = require('child_process');
    
    // 通过 openclaw agent 调用模型
    const cmd = `openclaw agent --message "${prompt.replace(/"/g, '\\"')}" --thinking high`;
    
    exec(cmd, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

    const req = https.request('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 300000 // 5 分钟超时
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.output && result.output.text) {
            resolve(result.output.text);
          } else if (result.message) {
            reject(new Error(result.message));
          } else {
            reject(new Error('Unknown error'));
          }
        } catch (e) {
          reject(new Error(`解析失败：${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时（5 分钟）'));
    });
    req.write(postData);
    req.end();
  });
}

/**
 * 代码审查委员会
 */
class CodeReviewBoard {
  constructor() {
    this.agents = AGENT_CONFIGS;
    this.reviews = {};
  }

  /**
   * 审查代码文件或目录
   */
  async reviewCode(target, options = {}) {
    const {
      language = 'auto',
      focusAreas = [],
      includeSuggestions = true
    } = options;

    console.log('🎭 代码审查委员会启动...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      target,
      language,
      reviews: {},
      summary: null,
      score: 0
    };

    try {
      // 1. 读取代码
      console.log('📄 读取代码...');
      const code = await this.readCode(target);
      report.codeStats = this.analyzeCodeStats(code);
      
      // 2. 并行调用 5 个审查代理
      console.log('\n🔍 5 位专家开始审查...\n');
      await this.parallelReview(code, language, report);

      // 3. 交叉评审（代理们互相"辩论"）
      console.log('\n💬 交叉评审开始...\n');
      await this.crossReview(code, report);

      // 4. 总指挥汇总报告
      console.log('\n📋 总指挥生成最终报告...\n');
      report.summary = await this.generateSummary(report);
      
      // 5. 计算综合评分
      report.score = this.calculateScore(report);

      return report;

    } catch (error) {
      console.error('❌ 审查失败:', error.message);
      throw error;
    }
  }

  /**
   * 读取代码文件
   */
  async readCode(target) {
    const stat = fs.statSync(target);
    
    if (stat.isFile()) {
      return fs.readFileSync(target, 'utf8');
    }
    
    if (stat.isDirectory()) {
      // 递归读取目录中的所有代码文件
      const codeFiles = [];
      const extensions = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.vue', '.react', '.jsx', '.tsx'];
      
      const readDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
              readDir(filePath);
            }
          } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
              codeFiles.push({
                path: filePath,
                content: fs.readFileSync(filePath, 'utf8')
              });
            }
          }
        }
      };
      
      readDir(target);
      
      return codeFiles.map(f => `// File: ${f.path}\n${f.content}`).join('\n\n');
    }
    
    throw new Error('不支持的文件类型');
  }

  /**
   * 分析代码统计
   */
  analyzeCodeStats(code) {
    const lines = code.split('\n');
    return {
      totalLines: lines.length,
      codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#')).length,
      commentLines: lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#') || l.trim().startsWith('/*')).length,
      blankLines: lines.filter(l => !l.trim()).length
    };
  }

  /**
   * 并行调用 5 个审查代理
   */
  async parallelReview(code, language, report) {
    const reviewPromises = [];
    
    // 为每个代理创建审查任务
    const agentsToCall = [
      { key: 'codeExpert', config: this.agents.codeExpert },
      { key: 'securityExpert', config: this.agents.securityExpert },
      { key: 'testExpert', config: this.agents.testExpert },
      { key: 'docExpert', config: this.agents.docExpert },
      { key: 'performanceExpert', config: this.agents.performanceExpert }
    ];

    for (const { key, config } of agentsToCall) {
      const prompt = `${config.prompt}\n\n请审查以下代码：\n\n\`\`\`${language}\n${code}\n\`\`\``;
      
      reviewPromises.push(
        callModel(config.model, prompt)
          .then(result => {
            report.reviews[key] = {
              agent: config.name,
              model: config.model,
              review: result,
              timestamp: new Date().toISOString()
            };
            console.log(`✅ ${config.name} 审查完成`);
          })
          .catch(error => {
            console.error(`❌ ${config.name} 审查失败:`, error.message);
            report.reviews[key] = {
              agent: config.name,
              error: error.message
            };
          })
      );
    }

    // 等待所有审查完成
    await Promise.all(reviewPromises);
  }

  /**
   * 交叉评审 - 代理们互相"辩论"
   */
  async crossReview(code, report) {
    const coordinatorPrompt = `你是总指挥。现在你有 5 位专家的初步审查意见。

请组织交叉评审：
1. 识别不同专家之间的意见冲突
2. 找出可能被所有专家遗漏的问题
3. 让专家们互相"辩论"，指出彼此的问题
4. 汇总共识和分歧

## 初步审查意见：

${Object.entries(report.reviews).map(([key, review]) => 
  `### ${review.agent}\n${review.review || review.error}`
).join('\n\n')}

## 交叉评审结果：`;

    const coordinator = this.agents.coordinator;
    const crossReviewResult = await callModel(coordinator.model, coordinatorPrompt);
    
    report.crossReview = crossReviewResult;
    console.log('✅ 交叉评审完成');
  }

  /**
   * 生成最终报告
   */
  async generateSummary(report) {
    const coordinator = this.agents.coordinator;
    
    const summaryPrompt = `${coordinator.prompt}

## 代码统计：
- 总行数：${report.codeStats.totalLines}
- 代码行：${report.codeStats.codeLines}
- 注释行：${report.codeStats.commentLines}
- 空白行：${report.codeStats.blankLines}

## 5 位专家的审查意见：

${Object.entries(report.reviews).map(([key, review]) => 
  `### ${review.agent}\n${review.review || review.error}`
).join('\n\n')}

## 交叉评审结果：
${report.crossReview || '未进行交叉评审'}

## 最终报告：`;

    const summary = await callModel(coordinator.model, summaryPrompt);
    return summary;
  }

  /**
   * 计算综合评分
   */
  calculateScore(report) {
    // 简单评分逻辑：根据问题数量和质量
    let score = 10;
    
    // 从审查意见中提取问题数量
    const allReviews = Object.values(report.reviews)
      .map(r => r.review || '')
      .join('\n');
    
    // 负面关键词扣分
    const criticalKeywords = ['严重', '漏洞', '危险', '必须修复', 'critical'];
    const highKeywords = ['高优先级', '重要', '应该修复', 'high'];
    const mediumKeywords = ['中等', '建议', '可以优化', 'medium'];
    
    criticalKeywords.forEach(kw => {
      const count = (allReviews.match(new RegExp(kw, 'gi')) || []).length;
      score -= count * 1.5;
    });
    
    highKeywords.forEach(kw => {
      const count = (allReviews.match(new RegExp(kw, 'gi')) || []).length;
      score -= count * 0.8;
    });
    
    mediumKeywords.forEach(kw => {
      const count = (allReviews.match(new RegExp(kw, 'gi')) || []).length;
      score -= count * 0.3;
    });
    
    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  }

  /**
   * 格式化报告
   */
  formatReport(report) {
    let text = `# 🎭 代码审查委员会报告\n\n`;
    text += `**审查时间:** ${new Date(report.timestamp).toLocaleString('zh-CN')}\n`;
    text += `**审查目标:** ${report.target}\n`;
    text += `**代码统计:** ${report.codeStats.totalLines} 行 (代码:${report.codeStats.codeLines} | 注释:${report.codeStats.commentLines} | 空白:${report.codeStats.blankLines})\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // 最终报告
    text += `## 📋 最终报告\n\n${report.summary}\n\n`;
    
    // 交叉评审
    if (report.crossReview) {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      text += `## 💬 交叉评审\n\n${report.crossReview}\n\n`;
    }
    
    // 各专家详细意见
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `## 🔍 专家详细意见\n\n`;
    
    for (const [key, review] of Object.entries(report.reviews)) {
      text += `### ${review.agent}\n`;
      text += `${review.review || review.error}\n\n`;
    }
    
    // 综合评分
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `## 📊 综合评分\n\n`;
    text += `**代码质量：${report.score}/10**\n\n`;
    
    const scoreEmoji = {
      '10': '🏆',
      '9': '🌟',
      '8': '✨',
      '7': '✅',
      '6': '👍',
      '5': '⚠️',
      '4': '❗',
      '3': '🚨',
      '2': '🚨',
      '1': '🚨',
      '0': '💀'
    };
    
    text += `${scoreEmoji[Math.floor(report.score)] || '📊'}\n`;
    
    return text;
  }

  /**
   * 保存报告到文件
   */
  saveReport(report, outputPath) {
    const formatted = this.formatReport(report);
    fs.writeFileSync(outputPath, formatted, 'utf8');
    console.log(`\n📄 报告已保存：${outputPath}`);
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎭 多代理代码审查委员会');
    console.log('');
    console.log('用法:');
    console.log('  node code-review-board.js <文件路径|目录>');
    console.log('  node code-review-board.js <文件路径> --output report.md');
    console.log('');
    console.log('示例:');
    console.log('  node code-review-board.js ./src');
    console.log('  node code-review-board.js ./main.js --output review.md');
    console.log('');
    console.log('审查代理:');
    console.log('  🎭 总指挥 - qwen3.5-plus (100 万上下文)');
    console.log('  👨‍💻 代码专家 - qwen3-coder-plus');
    console.log('  🔒 安全专家 - kimi-k2.5');
    console.log('  🧪 测试专家 - glm-5');
    console.log('  📖 文档专家 - MiniMax-M2.5');
    console.log('  ⚡ 性能专家 - qwen3-max');
    process.exit(0);
  }

  const target = args[0];
  const outputFlag = args.indexOf('--output');
  const outputPath = outputFlag !== -1 ? args[outputFlag + 1] : null;

  const board = new CodeReviewBoard();
  
  board.reviewCode(target)
    .then(report => {
      console.log('\n' + board.formatReport(report));
      
      if (outputPath) {
        board.saveReport(report, outputPath);
      }
    })
    .catch(console.error);
}

module.exports = { CodeReviewBoard, AGENT_CONFIGS };
