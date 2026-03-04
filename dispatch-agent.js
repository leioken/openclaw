#!/usr/bin/env node

/**
 * 🦐 多代理调度器 v2
 * 基于 8 个模型的能力分工，7 个专业代理
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 7 个专业代理配置
const agents = {
  // 1. 主协调员
  main: {
    id: 'main',
    name: '麦克虾',
    emoji: '🦐',
    model: 'bailian/qwen3.5-plus',
    context: '100 万',
    keywords: ['分析这个', '看看这个', '文档', '文件', '图片', '图像', '总结这个', '整体'],
    priority: 0  // 默认回退
  },
  
  // 2. 代码专家
  coder: {
    id: 'coder',
    name: '代码专家',
    emoji: '👨‍💻',
    model: 'bailian/qwen3-coder-plus',
    context: '100 万',
    keywords: ['代码', '编程', 'debug', 'bug', 'review', '重构', '函数', '类', 'api', '开发', '项目', '仓库', 'git', 'pr', 'merge'],
    priority: 1
  },
  
  // 3. 研究员
  researcher: {
    id: 'researcher',
    name: '研究员',
    emoji: '🔍',
    model: 'bailian/kimi-k2.5',
    context: '262K',
    keywords: ['研究', '搜索', '分析', '报告', '调查', '资料', '信息', '为什么', '如何', '背景', '趋势', '竞品'],
    priority: 1
  },
  
  // 4. 创意作家
  writer: {
    id: 'writer',
    name: '创意作家',
    emoji: '🎨',
    model: 'bailian/MiniMax-M2.5',
    context: '205K',
    keywords: ['写文章', '文案', '故事', '邮件', '创意', '写作', '博客', '推文', '脚本', '剧本'],
    priority: 1
  },
  
  // 5. 快速助手
  assistant: {
    id: 'assistant',
    name: '快速助手',
    emoji: '⚡',
    model: 'bailian/glm-4.7',
    context: '203K',
    keywords: ['你好', '谢谢', '翻译', '简短', '快速', 'hi', 'hello', 'bye', '再见'],
    priority: 2
  },
  
  // 6. 深度思考者
  thinker: {
    id: 'thinker',
    name: '深度思考者',
    emoji: '🧠',
    model: 'bailian/qwen3-max-2026-01-23',
    context: '262K',
    keywords: ['推理', '逻辑', '数学', '战略', '决策', '复杂', '深度', '思考', '证明', '算法'],
    priority: 1
  },
  
  // 7. 数据分析师
  analyst: {
    id: 'analyst',
    name: '数据分析师',
    emoji: '📊',
    model: 'bailian/glm-5',
    context: '203K',
    keywords: ['数据', '表格', '统计', '图表', 'excel', 'csv', '数字', '计算', '百分比'],
    priority: 1
  }
};

/**
 * 任务分类 - 基于关键词匹配和优先级
 */
function classifyTask(message) {
  const msg = message.toLowerCase();
  const matches = [];
  
  // 找出所有匹配的代理
  for (const agent of Object.values(agents)) {
    const matchCount = agent.keywords.filter(k => 
      msg.includes(k.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      matches.push({ agent, matchCount, priority: agent.priority });
    }
  }
  
  // 没有匹配 → 返回主代理
  if (matches.length === 0) {
    return agents.main;
  }
  
  // 按匹配数和优先级排序
  matches.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;  // 匹配多的优先
    }
    return a.priority - b.priority;  // 优先级数字小的优先
  });
  
  return matches[0].agent;
}

/**
 * 调度执行
 */
async function dispatch(message, options = {}) {
  const agent = classifyTask(message);
  
  const result = {
    agent,
    message,
    timestamp: new Date().toISOString(),
    output: null,
    error: null
  };
  
  // 如果是 dry-run 模式，只返回分类结果
  if (options.dryRun) {
    return result;
  }
  
  // 执行代理调用
  return new Promise((resolve) => {
    // 使用 local 模式执行
    const cmd = `openclaw models set "${agent.model}" > /dev/null 2>&1 && openclaw agent --to main --message "${message.replace(/"/g, '\\"')}"`;
    
    exec(cmd, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        result.error = error.message;
      }
      result.output = stdout;
      resolve(result);
    });
  });
}

/**
 * 获取所有代理信息
 */
function getAgents() {
  return Object.values(agents).map(a => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    model: a.model,
    context: a.context,
    keywords: a.keywords
  }));
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    console.log('🤖 可用代理列表:\n');
    getAgents().forEach(a => {
      console.log(`${a.emoji} ${a.name}`);
      console.log(`   模型：${a.model}`);
      console.log(`   上下文：${a.context}`);
      console.log(`   关键词：${a.keywords.slice(0, 5).join(', ')}...\n`);
    });
    process.exit(0);
  }
  
  if (args.includes('--dry-run')) {
    const message = args.filter(a => a !== '--dry-run').join(' ');
    if (!message) {
      console.log('用法：node dispatch-agent.js --dry-run <消息内容>');
      process.exit(1);
    }
    
    const agent = classifyTask(message);
    console.log(`🤖 任务分类：${agent.emoji} ${agent.name}`);
    console.log(`📍 使用模型：${agent.model} (${agent.context})`);
    console.log(`📝 匹配关键词：${agent.keywords.filter(k => message.toLowerCase().includes(k.toLowerCase())).join(', ')}`);
    process.exit(0);
  }
  
  const message = args.join(' ');
  if (!message) {
    console.log('🦐 多代理调度器');
    console.log('\n用法:');
    console.log('  node dispatch-agent.js <消息内容>           # 执行调度');
    console.log('  node dispatch-agent.js --dry-run <消息>     # 预览分类');
    console.log('  node dispatch-agent.js --list               # 列出所有代理');
    console.log('\n示例:');
    console.log('  node dispatch-agent.js "帮我 review 这段代码"');
    console.log('  node dispatch-agent.js "研究一下 AI 最新进展"');
    console.log('  node dispatch-agent.js "写一封邮件"');
    process.exit(1);
  }
  
  dispatch(message).then(result => {
    console.log(`\n🤖 任务分类：${result.agent.emoji} ${result.agent.name}`);
    console.log(`📍 使用模型：${result.agent.model}`);
    console.log(`\n✅ 回复:\n${result.output || result.error}`);
  });
}

module.exports = { dispatch, classifyTask, getAgents, agents };
