#!/usr/bin/env node

/**
 * 🦐 麦克虾 - 自动自检任务
 * 定期运行自检、学习和优化
 */

const { SelfEvolution } = require('./self-evolution');

const evolution = new SelfEvolution();

async function autoCheck() {
  console.log('');
  console.log('═'.repeat(50));
  console.log('🦐 麦克虾 - 自动自检');
  console.log('时间：', new Date().toLocaleString('zh-CN'));
  console.log('═'.repeat(50));
  console.log('');
  
  try {
    const results = await evolution.selfCheck();
    
    // 如果有问题，执行修复
    if (!results.repair.telegramBot.running) {
      console.log('🛠️ 检测到问题，正在自动修复...');
      await evolution.repair.fullCheck();
    }
    
    // 执行优化
    await evolution.runOptimization();
    
    console.log('');
    console.log('✅ 自检完成');
    console.log('');
  } catch (error) {
    console.error('❌ 自检失败:', error.message);
  }
}

// 运行自检
autoCheck();