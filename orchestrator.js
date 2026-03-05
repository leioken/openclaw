#!/usr/bin/env node

/**
 * 🦐 Orchestrator - 麦克虾多代理编排器
 * 基于 Elvis (@elvissun) 的实战架构
 * 
 * 核心职责：
 * - 持有完整业务上下文 (MEMORY.md + 会议笔记)
 * - 编写精准的 agent prompts
 * - 选择合适的模型
 * - 监控代理进度
 * - Telegram 通知老板
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const AGENTS_DIR = process.env.HOME + '/.openclaw/agents';
const TASKS_FILE = path.join(WORKSPACE, '.clawdbot', 'active-tasks.json');

/**
 * 代理编排器
 */
class Orchestrator {
  constructor() {
    this.businessContext = this.loadBusinessContext();
    this.activeTasks = this.loadActiveTasks();
    
    // 代理配置 - 根据 Elvis 的实战经验
    this.agentProfiles = {
      codex: {
        name: '👨‍💻 代码专家',
        model: 'qwen3-coder-plus',
        strengths: ['后端逻辑', '复杂 bug', '多文件重构', '跨代码库推理'],
        weakness: '较慢',
        usage: '90% 的任务'
      },
      claude: {
        name: '⚡ 快速助手',
        model: 'glm-4.7',
        strengths: ['前端工作', 'Git 操作', '简单任务', '权限问题少'],
        weakness: '复杂推理较弱',
        usage: '快速任务'
      },
      gemini: {
        name: '🎨 设计师',
        model: 'glm-5',
        strengths: ['UI 设计', '视觉方案', 'HTML/CSS 规范'],
        weakness: '代码实现需配合',
        usage: '设计先行，Claude 实现'
      },
      maikexia: {
        name: '🦐 麦克虾',
        model: 'qwen3.5-plus',
        strengths: ['协调', '长文档', '图片理解', '业务上下文'],
        weakness: '不直接写代码',
        usage: '编排器默认'
      }
    };
  }

  /**
   * 加载业务上下文
   */
  loadBusinessContext() {
    const context = {
      memory: '',
      meetingNotes: [],
      customerData: {},
      pastDecisions: [],
      whatWorked: [],
      whatFailed: []
    };

    // 读取 MEMORY.md
    const memoryPath = path.join(WORKSPACE, 'MEMORY.md');
    if (fs.existsSync(memoryPath)) {
      context.memory = fs.readFileSync(memoryPath, 'utf8');
    }

    // 读取会议笔记
    const notesDir = path.join(WORKSPACE, 'meeting-notes');
    if (fs.existsSync(notesDir)) {
      const notes = fs.readdirSync(notesDir)
        .filter(f => f.endsWith('.md'))
        .map(f => fs.readFileSync(path.join(notesDir, f), 'utf8'));
      context.meetingNotes = notes;
    }

    return context;
  }

  /**
   * 加载活跃任务
   */
  loadActiveTasks() {
    try {
      if (fs.existsSync(TASKS_FILE)) {
        return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
      }
    } catch (error) {}
    return { tasks: [] };
  }

  /**
   * 保存活跃任务
   */
  saveActiveTasks() {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TASKS_FILE, JSON.stringify(this.activeTasks, null, 2));
  }

  /**
   * 选择最佳代理
   */
  selectAgent(taskDescription) {
    const task = taskDescription.toLowerCase();
    
    // 关键词匹配
    const rules = [
      { keywords: ['ui', '设计', '界面', '视觉', 'css', 'html'], agent: 'gemini' },
      { keywords: ['前端', 'react', 'vue', '组件'], agent: 'claude' },
      { keywords: ['git', 'commit', 'push', 'pr', 'merge'], agent: 'claude' },
      { keywords: ['bug', '修复', '调试', '错误'], agent: 'codex' },
      { keywords: ['重构', '优化', '性能'], agent: 'codex' },
      { keywords: ['后端', 'api', '数据库', '服务器'], agent: 'codex' },
      { keywords: ['测试', 'unit', 'e2e'], agent: 'codex' }
    ];

    for (const rule of rules) {
      if (rule.keywords.some(kw => task.includes(kw))) {
        return this.agentProfiles[rule.agent];
      }
    }

    // 默认返回代码专家
    return this.agentProfiles.codex;
  }

  /**
   * 生成精准的 agent prompt
   */
  generatePrompt(task, agentProfile) {
    const context = this.businessContext;
    
    let prompt = `# 任务指令

## 你的角色
你是 ${agentProfile.name}，擅长：${agentProfile.strengths.join('、')}

## 任务描述
${task}

## 业务上下文
${context.memory.substring(0, 2000)}...

## 历史经验
`;

    // 添加相关的历史经验
    if (context.whatWorked.length > 0) {
      prompt += '\n### 过去成功的做法:\n';
      context.whatWorked.slice(0, 3).forEach(item => {
        prompt += `- ${item}\n`;
      });
    }

    if (context.whatFailed.length > 0) {
      prompt += '\n### 过去失败的教训:\n';
      context.whatFailed.slice(0, 3).forEach(item => {
        prompt += `- ${item}\n`;
      });
    }

    prompt += `
## 完成标准 (Definition of Done)
- [ ] 代码已提交
- [ ] PR 已创建
- [ ] 分支与 main 同步（无合并冲突）
- [ ] CI 通过（lint, types, tests）
- [ ] 如有 UI 变更，附截图
- [ ] 边界情况已记录

## 注意事项
- 专注于你的专长领域
- 遇到不确定的地方，明确说明
- 优先保证代码质量，而非速度

请开始执行任务。
`;

    return prompt;
  }

  /**
   * 生成代理（创建 worktree + tmux 会话）
   */
  async spawnAgent(task, agentProfile) {
    const taskId = `task-${Date.now()}`;
    const branchName = `feature/${taskId}`;
    const worktreePath = path.join(WORKSPACE, '..', `worktree-${taskId}`);
    const tmuxSession = `agent-${taskId}`;

    console.log(`🚀 生成代理：${agentProfile.name}`);
    console.log(`   任务 ID: ${taskId}`);
    console.log(`   分支：${branchName}`);

    try {
      // 1. 创建 worktree
      console.log(`   📦 创建 worktree...`);
      await execAsync(`cd ${WORKSPACE} && git worktree add -b ${branchName} ${worktreePath} HEAD`);

      // 2. 生成 prompt
      const prompt = this.generatePrompt(task, agentProfile);
      const promptFile = path.join(worktreePath, '.task-prompt.md');
      fs.writeFileSync(promptFile, prompt);

      // 3. 启动 tmux 会话
      console.log(`   🖥️  启动 tmux 会话...`);
      const scriptPath = path.join(WORKSPACE, 'run-agent.sh');
      await execAsync(`tmux new-session -d -s ${tmuxSession} "bash ${scriptPath} ${worktreePath} ${agentProfile.model} ${promptFile} ${taskId}"`);

      // 4. 记录任务
      this.activeTasks.tasks.push({
        id: taskId,
        description: task,
        agent: agentProfile.name,
        model: agentProfile.model,
        branch: branchName,
        worktree: worktreePath,
        tmuxSession: tmuxSession,
        status: 'running',
        createdAt: new Date().toISOString(),
        prNumber: null,
        retries: 0
      });
      this.saveActiveTasks();

      console.log(`   ✅ 代理已启动`);

      return {
        success: true,
        taskId,
        agent: agentProfile.name,
        message: `代理已启动：${agentProfile.name}`
      };

    } catch (error) {
      console.error(`   ❌ 错误：${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 监控所有代理
   */
  async monitorAgents() {
    console.log('🔍 监控代理...');
    
    const results = [];

    for (const task of this.activeTasks.tasks) {
      if (task.status === 'completed') continue;

      const result = await this.checkAgent(task);
      results.push(result);

      // 更新任务状态
      Object.assign(task, result.taskUpdate);
    }

    this.saveActiveTasks();
    return results;
  }

  /**
   * 检查单个代理
   */
  async checkAgent(task) {
    const result = {
      taskId: task.id,
      checks: [],
      taskUpdate: {}
    };

    try {
      // 1. 检查 tmux 会话是否存活
      try {
        await execAsync(`tmux has-session -t ${task.tmuxSession}`);
        result.checks.push({ name: 'tmux 会话', status: '✅' });
      } catch (error) {
        result.checks.push({ name: 'tmux 会话', status: '❌' });
        
        // 会话死亡，尝试重启
        if (task.retries < 3) {
          task.retries++;
          result.taskUpdate.status = 'restarting';
          result.taskUpdate.retries = task.retries;
          console.log(`   🔄 重启代理 ${task.id} (尝试 ${task.retries}/3)`);
          // 重启逻辑...
        } else {
          result.taskUpdate.status = 'failed';
          console.log(`   ❌ 代理 ${task.id} 失败，超过最大重试次数`);
          // Telegram 通知老板
          await this.notifyBoss(`代理 ${task.id} 失败，需要人工介入`);
        }
        return result;
      }

      // 2. 检查是否有 PR
      try {
        const { stdout } = await execAsync(`cd ${WORKSPACE} && gh pr list --head ${task.branch} --json number,state`);
        const prs = JSON.parse(stdout);
        
        if (prs.length > 0) {
          const pr = prs[0];
          result.checks.push({ name: 'PR', status: '✅', number: pr.number });
          result.taskUpdate.prNumber = pr.number;
          
          if (pr.state === 'merged') {
            result.taskUpdate.status = 'completed';
            console.log(`   ✅ 任务 ${task.id} 已完成（PR #${pr.number} 已合并）`);
          } else if (pr.state === 'open') {
            // 检查 CI
            const ciStatus = await this.checkCI(pr.number);
            result.checks.push(ciStatus);
            
            if (ciStatus.status === '✅' && task.status !== 'ready-for-review') {
              result.taskUpdate.status = 'ready-for-review';
              // Telegram 通知老板
              await this.notifyBoss(`PR #${pr.number} 准备审查`);
            }
          }
        } else {
          result.checks.push({ name: 'PR', status: '⏳' });
        }
      } catch (error) {
        result.checks.push({ name: 'PR', status: '⏳', error: error.message });
      }

    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * 检查 CI 状态
   */
  async checkCI(prNumber) {
    try {
      const { stdout } = await execAsync(`cd ${WORKSPACE} && gh pr checks ${prNumber} --json name,status`);
      const checks = JSON.parse(stdout);
      
      const allPassed = checks.every(c => c.status === 'PASSING');
      
      return {
        name: 'CI',
        status: allPassed ? '✅' : '⏳',
        details: checks
      };
    } catch (error) {
      return {
        name: 'CI',
        status: '⏳',
        error: error.message
      };
    }
  }

  /**
   * Telegram 通知老板
   */
  async notifyBoss(message) {
    console.log(`📱 通知老板：${message}`);
    // 实际实现会调用 Telegram API
    // 这里只是日志
  }

  /**
   * 主动寻找工作（Ralph Loop V2）
   */
  async findWorkProactively() {
    console.log('🔍 主动寻找工作...');

    // 1. 扫描错误日志
    const errors = await this.scanErrors();
    if (errors.length > 0) {
      console.log(`   发现 ${errors.length} 个错误，生成修复代理...`);
      for (const error of errors.slice(0, 3)) {
        await this.spawnAgent(`修复错误：${error}`, this.agentProfiles.codex);
      }
    }

    // 2. 扫描会议笔记
    const featureRequests = await this.scanMeetingNotes();
    if (featureRequests.length > 0) {
      console.log(`   发现 ${featureRequests.length} 个功能需求，生成实现代理...`);
      for (const request of featureRequests.slice(0, 3)) {
        await this.spawnAgent(`实现功能：${request}`, this.agentProfiles.codex);
      }
    }

    // 3. 扫描 git log
    const needsDocumentation = await this.checkDocumentationNeeds();
    if (needsDocumentation) {
      console.log(`   需要更新文档，生成文档代理...`);
      await this.spawnAgent('更新 changelog 和文档', this.agentProfiles.claude);
    }
  }

  async scanErrors() {
    // 简化实现：扫描错误日志文件
    const errorLog = path.join(WORKSPACE, 'error.log');
    if (fs.existsSync(errorLog)) {
      const content = fs.readFileSync(errorLog, 'utf8');
      return content.split('\n').filter(line => line.includes('ERROR')).slice(0, 5);
    }
    return [];
  }

  async scanMeetingNotes() {
    // 从会议笔记中提取功能需求
    const features = [];
    const notesDir = path.join(WORKSPACE, 'meeting-notes');
    if (fs.existsSync(notesDir)) {
      const notes = fs.readdirSync(notesDir)
        .filter(f => f.endsWith('.md'))
        .map(f => fs.readFileSync(path.join(notesDir, f), 'utf8'));
      
      for (const note of notes) {
        const matches = note.match(/功能 (?:需求 | 请求 )[:：]\s*(.+)/g);
        if (matches) {
          features.push(...matches.map(m => m.split(/[:：]/)[1].trim()));
        }
      }
    }
    return features;
  }

  async checkDocumentationNeeds() {
    // 检查是否有新 commit 需要更新文档
    try {
      const { stdout } = await execAsync(`cd ${WORKSPACE} && git log --oneline -10`);
      return stdout.some(line => 
        line.includes('feat:') || line.includes('fix:')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 清理完成的任务
   */
  async cleanupCompletedTasks() {
    console.log('🧹 清理完成的任务...');

    const completedTasks = this.activeTasks.tasks.filter(t => t.status === 'completed');
    
    for (const task of completedTasks) {
      // 删除 worktree
      try {
        await execAsync(`rm -rf ${task.worktree}`);
        await execAsync(`cd ${WORKSPACE} && git worktree prune`);
      } catch (error) {}

      // 删除 tmux 会话
      try {
        await execAsync(`tmux kill-session -t ${task.tmuxSession}`);
      } catch (error) {}
    }

    // 保留最近 10 个完成任务的记录
    this.activeTasks.tasks = this.activeTasks.tasks
      .filter(t => t.status !== 'completed')
      .concat(completedTasks.slice(-10));
    
    this.saveActiveTasks();
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const orchestrator = new Orchestrator();

  (async () => {
    if (args[0] === 'spawn') {
      const task = args.slice(1).join(' ');
      const agent = orchestrator.selectAgent(task);
      console.log(`选择代理：${agent.name} (${agent.model})`);
      const result = await orchestrator.spawnAgent(task, agent);
      console.log(JSON.stringify(result, null, 2));
    } else if (args[0] === 'monitor') {
      const results = await orchestrator.monitorAgents();
      console.log(JSON.stringify(results, null, 2));
    } else if (args[0] === 'find-work') {
      await orchestrator.findWorkProactively();
    } else if (args[0] === 'cleanup') {
      await orchestrator.cleanupCompletedTasks();
    } else {
      console.log('🦐 Orchestrator - 麦克虾多代理编排器');
      console.log('');
      console.log('用法:');
      console.log('  node orchestrator.js spawn <任务描述>');
      console.log('  node orchestrator.js monitor');
      console.log('  node orchestrator.js find-work');
      console.log('  node orchestrator.js cleanup');
      console.log('');
      console.log('示例:');
      console.log('  node orchestrator.js spawn "修复登录 bug"');
      console.log('  node orchestrator.js spawn "添加用户界面"');
    }
  })().catch(console.error);
}

module.exports = Orchestrator;
