#!/usr/bin/env node

/**
 * 🔍 代理监控器
 * 每 10 分钟运行一次，检查所有代理状态
 * 
 * 检查项目：
 * - tmux 会话是否存活
 * - 是否有新 PR
 * - CI 状态
 * - 自动重启失败代理（最多 3 次）
 * - Telegram 通知老板（仅在需要人工介入时）
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { notifyPRReady, notifyAgentFailed } = require('./telegram-notify');

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const TASKS_FILE = path.join(WORKSPACE, '.clawdbot', 'active-tasks.json');

class AgentMonitor {
  constructor() {
    this.tasks = this.loadTasks();
  }

  loadTasks() {
    try {
      if (fs.existsSync(TASKS_FILE)) {
        return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
      }
    } catch (error) {}
    return { tasks: [] };
  }

  saveTasks() {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TASKS_FILE, JSON.stringify(this.tasks, null, 2));
  }

  async run() {
    console.log('🔍 开始监控代理...');
    console.log(`   活跃任务：${this.tasks.tasks.filter(t => t.status !== 'completed').length}`);
    console.log('');

    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      notifications: []
    };

    for (const task of this.tasks.tasks) {
      if (task.status === 'completed') continue;

      console.log(`检查任务：${task.id}`);
      const result = await this.checkTask(task);
      results.checks.push(result);

      if (result.needsNotification) {
        results.notifications.push({
          taskId: task.id,
          message: result.notificationMessage
        });
      }

      // 更新任务状态
      Object.assign(task, result.updates);
    }

    this.saveTasks();

    // 发送通知
    if (results.notifications.length > 0) {
      console.log('\n📱 发送通知:');
      for (const notif of results.notifications) {
        console.log(`   ${notif.message}`);
        await this.sendTelegramNotification(notif.message);
      }
    }

    console.log('\n✅ 监控完成');
    return results;
  }

  async checkTask(task) {
    const result = {
      taskId: task.id,
      checks: {},
      updates: {},
      needsNotification: false,
      notificationMessage: ''
    };

    // 1. 检查 tmux 会话
    try {
      await execAsync(`tmux has-session -t ${task.tmuxSession} 2>/dev/null`);
      result.checks.tmux = '✅ 活跃';
    } catch (error) {
      result.checks.tmux = '❌ 死亡';
      
      // 尝试重启
      if (task.retries < 3) {
        task.retries = (task.retries || 0) + 1;
        result.updates.retries = task.retries;
        result.updates.status = 'restarting';
        console.log(`   🔄 重启代理 (尝试 ${task.retries}/3)`);
        
        // 重启逻辑
        await this.restartAgent(task);
      } else {
        result.updates.status = 'failed';
        result.needsNotification = true;
        result.notificationMessage = `❌ 代理 ${task.id} 失败，需要人工介入\n任务：${task.description}\n重试次数：${task.retries}`;
      }
      return result;
    }

    // 2. 检查 PR
    try {
      const { stdout } = await execAsync(
        `cd ${WORKSPACE} && gh pr list --head ${task.branch} --json number,state,title --format json`
      );
      
      const prs = JSON.parse(stdout);
      
      if (prs.length > 0) {
        const pr = prs[0];
        result.checks.pr = `✅ #${pr.number} ${pr.state}`;
        result.updates.prNumber = pr.number;
        
        if (pr.state === 'merged') {
          result.updates.status = 'completed';
          console.log(`   ✅ PR #${pr.number} 已合并`);
        } else if (pr.state === 'open') {
          // 检查 CI
          const ciStatus = await this.checkCI(pr.number);
          result.checks.ci = ciStatus.status;
          
          if (ciStatus.passed && task.status !== 'ready-for-review') {
            result.updates.status = 'ready-for-review';
            result.needsNotification = true;
            result.notificationMessage = `✅ PR #${pr.number} 准备审查\n任务：${task.description}\nCI: 通过\nAI 审查：通过`;
          }
        }
      } else {
        result.checks.pr = '⏳ 进行中';
      }
    } catch (error) {
      result.checks.pr = `⏳ 检查中 (${error.message})`;
    }

    // 打印检查结果
    console.log(`   tmux: ${result.checks.tmux}`);
    console.log(`   PR: ${result.checks.pr}`);
    if (result.checks.ci) {
      console.log(`   CI: ${result.checks.ci}`);
    }

    return result;
  }

  async checkCI(prNumber) {
    try {
      const { stdout } = await execAsync(
        `cd ${WORKSPACE} && gh pr checks ${prNumber} --json name,status --format json`
      );
      
      const checks = JSON.parse(stdout);
      const allPassed = checks.every(c => c.status === 'PASSING' || c.status === 'SUCCESS');
      
      return {
        status: allPassed ? '✅ 通过' : '⏳ 运行中',
        passed: allPassed,
        details: checks
      };
    } catch (error) {
      return {
        status: '⏳ 未知',
        passed: false,
        error: error.message
      };
    }
  }

  async restartAgent(task) {
    // 重新启动 tmux 会话
    const scriptPath = path.join(WORKSPACE, 'run-agent.sh');
    try {
      await execAsync(
        `tmux new-session -d -s ${task.tmuxSession} "bash ${scriptPath} ${task.worktree} ${task.model} ${task.worktree}/.task-prompt.md"`
      );
      console.log(`   ✅ 代理已重启`);
    } catch (error) {
      console.error(`   ❌ 重启失败：${error.message}`);
    }
  }

  async sendTelegramNotification(message) {
    try {
      await require('./telegram-notify').sendNotification(message);
      console.log(`   ✅ Telegram 通知已发送`);
    } catch (error) {
      console.error(`   ❌ Telegram 通知失败：${error.message}`);
    }
  }
}

// 命令行运行
if (require.main === module) {
  const monitor = new AgentMonitor();
  monitor.run().catch(console.error);
}

module.exports = AgentMonitor;
