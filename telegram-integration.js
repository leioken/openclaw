#!/usr/bin/env node

/**
 * 🦐 Telegram 机器人集成
 * 多代理调度 + 第二大脑 + 安全检查 + 自进化系统
 */

const { dispatch, classifyTask, getAgents } = require('./dispatch-agent');
const { capture, search } = require('./second-brain');
const { securityCheck } = require('./security-check');
const { CompleteEvolutionManager } = require('./complete-evolution');

// 初始化完整自进化系统
const evolution = new CompleteEvolutionManager();

// Telegram Bot API 配置
const BOT_TOKEN = '8202210625:AAGRQ47fh7GxVLMKHcNtx8dXR94irSVRQao';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 用户白名单
const ALLOWED_USERS = ['8693911314']; // 老板的 Telegram ID

// 命令处理
const COMMANDS = {
  '/start': handleStart,
  '/help': handleHelp,
  '/agents': handleAgents,
  '/search': handleSearch,
  '/remember': handleRemember,
  '/status': handleStatus,
  '/model': handleModel,
  '/evolution': handleEvolution
};

/**
 * 主消息处理
 */
async function handleMessage(update) {
  const message = update.message;
  if (!message) return;
  
  const userId = message.from.id.toString();
  const text = message.text;
  const chatId = message.chat.id;
  
  // 安全检查：用户白名单
  if (!ALLOWED_USERS.includes(userId)) {
    await sendMessage(chatId, '⚠️ 未授权用户，无法访问');
    return;
  }
  
  // 安全检查：内容审查
  const securityResult = securityCheck('external_send', {
    recipient: userId,
    content: text
  });
  
  if (!securityResult.pass && securityResult.results) {
    const warnings = securityResult.results.filter(r => !r.pass);
    if (warnings.length > 0) {
      await sendMessage(chatId, `⚠️ 安全警告：${warnings.map(w => w.message).join(', ')}`);
      return;
    }
  }
  
  // 检查是否是命令
  if (text.startsWith('/')) {
    const command = text.split(' ')[0];
    const handler = COMMANDS[command];
    if (handler) {
      await handler(update);
      return;
    }
  }
  
  // 检查是否包含记忆关键词（第二大脑）
  const memoryKeywords = ['记住', '记一下', '保存', '收藏', 'mark', 'remember'];
  const isMemoryCapture = memoryKeywords.some(k => text.toLowerCase().includes(k));
  
  if (isMemoryCapture) {
    const content = text.replace(/(记住 | 记一下 | 保存 | 收藏|mark|remember)/gi, '').trim();
    capture(content);
    await sendMessage(chatId, `✅ 已保存记忆：${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`);
    return;
  }
  
  // 多代理调度
  const classification = classifyTask(text);
  const startTime = Date.now();
  
  // 发送初始消息（显示正在处理）
  const statusMsg = await sendMessage(chatId, `${classification.emoji} ${classification.name} 正在处理...\n\n0%`);
  const messageId = statusMsg?.ok ? statusMsg.result?.message_id : null;
  
  let output = '';
  let success = true;
  
  try {
    // 执行代理调用（流式）
    await dispatchStreaming(text, chatId, classification, messageId);
    output = '回复已发送';
  } catch (error) {
    success = false;
    output = `处理失败：${error.message}`;

    if (messageId) {
      await editMessage(chatId, messageId, `❌ 处理失败：${error.message}`);
    } else {
      await sendMessage(chatId, `❌ 处理失败：${error.message}`);
    }
  }
  
  // 计算响应时间
  const responseTime = Date.now() - startTime;
  
  // 完整自进化系统：学习对话
  try {
    await evolution.learnConversation(text, output, success, {
      chatId,
      classification,
      responseTime
    });
  } catch (error) {
    console.error('自进化系统错误:', error.message);
  }
}

/**
 * 命令处理函数
 */
async function handleStart(update) {
  const chatId = update.message.chat.id;
  await sendMessage(chatId, `
🦐 欢迎使用麦克虾 AI 助手！

我是你的个人 AI 助理，支持：
- 🧠 第二大脑：随时记忆和搜索
- 🤖 多代理协作：7 个专业代理
- 🛡️ 安全检查：保护你的数据安全

发送消息开始对话，或输入 /help 查看帮助
  `);
}

async function handleHelp(update) {
  const chatId = update.message.chat.id;
  await sendMessage(chatId, `
📚 使用指南

【命令列表】
/agents - 查看所有代理
/search <关键词> - 搜索记忆
/remember <内容> - 保存记忆
/status - 查看系统状态
/model - 查看当前模型
/evolution - 查看自进化系统状态

【自动功能】
- 说"记住 xxx"自动保存记忆
- 根据内容自动分配专业代理
- 敏感操作前安全检查
- 自进化系统自动学习对话

【代理团队】
🦐 麦克虾 - 主协调员（综合任务）
👨‍💻 代码专家 - 编程相关
🔍 研究员 - 研究分析
🎨 创意作家 - 内容创作
⚡ 快速助手 - 简单问答
🧠 深度思考者 - 复杂推理
📊 数据分析师 - 数据处理
  `);
}

async function handleAgents(update) {
  const chatId = update.message.chat.id;
  const agents = getAgents();
  
  let text = '🤖 代理团队:\n\n';
  agents.forEach(a => {
    text += `${a.emoji} ${a.name}\n`;
    text += `   模型：${a.model.split('/')[1]}\n`;
    text += `   上下文：${a.context}\n\n`;
  });
  
  await sendMessage(chatId, text);
}

async function handleSearch(update) {
  const chatId = update.message.chat.id;
  const query = update.message.text.replace('/search', '').trim();
  
  if (!query) {
    await sendMessage(chatId, '用法：/search <关键词>');
    return;
  }
  
  const results = search(query);
  await sendMessage(chatId, results || '未找到相关记忆');
}

async function handleRemember(update) {
  const chatId = update.message.chat.id;
  const content = update.message.text.replace('/remember', '').trim();
  
  if (!content) {
    await sendMessage(chatId, '用法：/remember <内容>');
    return;
  }
  
  capture(content);
  await sendMessage(chatId, `✅ 已保存：${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`);
}

async function handleStatus(update) {
  const chatId = update.message.chat.id;
  const { exec } = require('child_process');
  
  exec('openclaw models status', (error, stdout) => {
    if (error) {
      sendMessage(chatId, `❌ 错误：${error.message}`);
    } else {
      sendMessage(chatId, `📊 系统状态:\n\n${stdout}`);
    }
  });
}

async function handleModel(update) {
  const chatId = update.message.chat.id;
  const { exec } = require('child_process');
  
  exec('openclaw models list', (error, stdout) => {
    if (error) {
      sendMessage(chatId, `❌ 错误：${error.message}`);
    } else {
      sendMessage(chatId, `📋 可用模型:\n\n${stdout}`);
    }
  });
}

async function handleEvolution(update) {
  const chatId = update.message.chat.id;
  
  try {
    const stats = evolution.learning.getStats();
    const performance = evolution.optimization.analyzePerformance();
    
    let text = `🦐 自进化系统状态\n\n`;
    text += `🧠 自我学习统计:\n`;
    text += `   总对话数：${stats.totalConversations}\n`;
    text += `   成功率：${stats.successRate.toFixed(2)}%\n`;
    text += `   识别模式：${stats.patterns} 个\n\n`;
    
    text += `⚡ 性能指标:\n`;
    text += `   平均响应时间：${performance.avgTime}\n`;
    text += `   总请求数：${performance.totalRequests}\n\n`;
    
    const suggestions = evolution.optimization.getOptimizationSuggestions();
    text += `💡 优化建议:\n`;
    suggestions.forEach(s => text += `   ${s}\n`);
    
    await sendMessage(chatId, text);
  } catch (error) {
    await sendMessage(chatId, `❌ 错误：${error.message}`);
  }
}

/**
 * Telegram API 调用
 */
async function sendMessage(chatId, text, parseMode = null) {
  const url = `${API_BASE}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text
  };

  if (parseMode) {
    body.parse_mode = parseMode;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

/**
 * 发送草稿消息 (流式输出)
 * Bot API 9.3+ 支持
 * 参考：https://core.telegram.org/bots/api#sendmessagedraft
 * 
 * 参数:
 * - chat_id: 聊天 ID (必填)
 * - draft_id: 草稿 ID (可选，更新时传入)
 * - text: 消息文本 (必填)
 * - parse_mode: 解析模式 (可选)
 * - entities: 特殊实体列表 (可选)
 * - link_preview_options: 链接预览选项 (可选)
 */
async function sendDraft(chatId, text, draftId = null) {
  const url = `${API_BASE}/sendMessageDraft`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
    // 不添加 random_id - 官方文档没有这个参数
  };
  
  if (draftId) {
    body.draft_id = draftId;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

/**
 * 编辑消息 (用于流式更新)
 */
async function editMessage(chatId, messageId, text, parseMode = null) {
  const url = `${API_BASE}/editMessageText`;
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: text
  };

  if (parseMode) {
    body.parse_mode = parseMode;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function deleteMessage(chatId, messageId) {
  const url = `${API_BASE}/deleteMessage`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  });
}

/**
 * 流式输出 - 实时编辑消息
 * 限制：每 500ms 最多编辑一次，避免触发 rate limit
 */
async function streamMessage(chatId, messageId, chunks, interval = 500) {
  let currentText = '';
  
  for (const chunk of chunks) {
    currentText += chunk;
    
    try {
      const result = await editMessage(chatId, messageId, currentText);
      if (!result.ok) {
        console.error('流式编辑失败:', result);
        // 如果编辑失败，发送新消息
        await sendMessage(chatId, currentText);
        break;
      }
    } catch (error) {
      console.error('流式编辑异常:', error.message);
    }
    
    // 节流，避免触发 rate limit
    await sleep(interval);
  }
}

/**
 * 工具函数
 */
function splitMessage(text, maxLength = 4000) {
  const chunks = [];
  let current = '';
  
  for (const line of text.split('\n')) {
    if ((current + line + '\n').length > maxLength) {
      chunks.push(current);
      current = line + '\n';
    } else {
      current += line + '\n';
    }
  }
  
  if (current) {
    chunks.push(current);
  }
  
  return chunks;
}

function chunkText(text, chunkSize = 220) {
  if (!text) return [];

  const chunks = [];
  let index = 0;

  while (index < text.length) {
    const end = Math.min(index + chunkSize, text.length);
    chunks.push(text.slice(index, end));
    index = end;
  }

  return chunks;
}

/**
 * 长轮询
 */
let lastUpdateId = 0;

async function startPolling() {
  console.log('🦐 Telegram 机器人启动...');
  console.log(`📍 Bot: @maikexiabot`);
  console.log(`👤 授权用户：${ALLOWED_USERS.join(', ')}`);
  console.log('');
  
  while (true) {
    try {
      const url = `${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.ok && data.result) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await handleMessage(update);
        }
      }
    } catch (error) {
      console.error('❌ 轮询错误:', error.message);
      await sleep(5000);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 启动
if (require.main === module) {
  startPolling().catch(console.error);
}

/**
 * 流式代理调用
 */
async function dispatchWithStreaming(message, chatId, agent) {
  const { exec } = require('child_process');
  
  // 先切换模型
  await execPromise(`openclaw models set "${agent.model}" > /dev/null 2>&1`);
  
  // 发送初始消息 (作为草稿)
  const initialText = `${agent.emoji} ${agent.name}:\n\n`;
  const draftResult = await sendDraft(chatId, initialText);
  
  if (!draftResult.ok || !draftResult.result) {
    // 如果不支持 draft，回退到普通模式
    return dispatch(message);
  }
  
  const messageId = draftResult.result.message_id;
  const draftKey = draftResult.result.draft_key;
  
  // 执行代理命令，流式获取输出
  return new Promise((resolve) => {
    const cmd = `openclaw agent --message "${message.replace(/"/g, '\\"')}"`;
    const proc = exec(cmd);
    
    let fullOutput = '';
    let chunkCount = 0;
    
    // 实时读取 stdout
    proc.stdout.on('data', async (data) => {
      const text = data.toString();
      fullOutput += text;
      chunkCount++;
      
      // 每 3 个 chunk 更新一次消息 (平衡流畅度和 rate limit)
      if (chunkCount % 3 === 0) {
        await editMessage(chatId, messageId, initialText + fullOutput);
      }
    });
    
    proc.stderr.on('data', (data) => {
      console.error('Agent stderr:', data.toString());
    });
    
    proc.on('close', async (code) => {
      // 最终更新
      await editMessage(chatId, messageId, initialText + fullOutput);
      resolve({
        agent,
        message,
        output: fullOutput,
        streamed: true,
        error: code !== 0 ? 'Agent execution failed' : null
      });
    });
  });
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * 流式代理调用（真流式）
 * 实时读取 subprocess stdout，边接收边编辑消息
 */
async function dispatchStreaming(message, chatId, agent, messageId) {
  const { exec } = require('child_process');
  const header = `${agent.emoji} ${agent.name}:\n\n`;
  const maxBodyLength = 3900 - header.length;

  let workingMessageId = messageId;
  if (!workingMessageId) {
    const init = await sendMessage(chatId, `${header}正在思考中...`);
    workingMessageId = init?.ok ? init.result?.message_id : null;
    if (!workingMessageId) {
      throw new Error('无法创建流式消息');
    }
  } else {
    await editMessage(chatId, workingMessageId, `${header}正在思考中...`);
  }

  // 先切换模型
  await new Promise(resolve => {
    exec(`openclaw models set "${agent.model}" > /dev/null 2>&1`, resolve);
  });

  // 执行 agent 命令，实时读取 stdout
  const cmd = `openclaw agent --to main --message "${message.replace(/"/g, '\\"')}"`;
  const proc = exec(cmd, { timeout: 180000 });

  let fullOutput = '';
  let buffer = '';
  const bufferSize = 3; // 每 3 个字更新一次（更流畅）
  let updateCount = 0;

  return new Promise((resolve, reject) => {
    // 逐字符流式输出
    const flushBuffer = async () => {
      if (buffer.length === 0) return;
      
      fullOutput += buffer;
      buffer = '';
      updateCount++;
      
      const display = fullOutput.slice(0, maxBodyLength);
      try {
        await editMessage(chatId, workingMessageId, `${header}${display}`);
      } catch (err) {
        console.error('编辑消息失败:', err.message);
      }
    };

    proc.stdout.on('data', async (data) => {
      const text = data.toString();
      
      // 逐字处理，实现打字机效果
      for (const char of text) {
        buffer += char;
        
        // 每 3 个字刷新一次（约 100-150ms 的视觉效果）
        if (buffer.length >= bufferSize) {
          await flushBuffer();
          // 超短延迟，模拟打字机节奏
          await new Promise(r => setTimeout(r, 50));
        }
      }
      
      // 清空剩余 buffer
      if (buffer.length > 0) {
        await flushBuffer();
      }
    });

    proc.stderr.on('data', (data) => {
      console.error('Agent stderr:', data.toString());
    });

    proc.on('close', async (code, signal) => {
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        await editMessage(chatId, workingMessageId, `${header}⚠️ 请求超时`);
        reject(new Error('超时'));
        return;
      }

      // 最终确保完整输出
      let output = fullOutput.trim();
      if (!output) {
        output = '⚠️ 无回复';
      }
      await editMessage(chatId, workingMessageId, `${header}${output.slice(0, maxBodyLength)}`);

      // 超长部分续发
      if (output.length > maxBodyLength) {
        const extraChunks = splitMessage(output.slice(maxBodyLength), 3800);
        for (const extra of extraChunks) {
          await sendMessage(chatId, extra);
          await sleep(200);
        }
      }

      resolve({ agent, output, streamed: true });
    });

    proc.on('error', async (err) => {
      await editMessage(chatId, workingMessageId, `${header}❌ ${err.message}`);
      reject(err);
    });
  });
}

module.exports = { handleMessage, startPolling, dispatchStreaming };
