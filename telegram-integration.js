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
  
  let consecutiveErrors = 0;
  const MAX_RETRIES = 10;
  const TIMEOUT_SECONDS = 30;
  
  while (true) {
    try {
      // 使用允许的 update_id 范围，避免事件间隔错误
      const url = `${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=${TIMEOUT_SECONDS}&allowed_updates=["message"]`;
      const response = await fetch(url, { 
        signal: AbortSignal.timeout((TIMEOUT_SECONDS + 5) * 1000) // 超时 +5 秒缓冲
      });
      const data = await response.json();
      
      if (data.ok && data.result) {
        consecutiveErrors = 0; // 重置错误计数
        
        if (data.result.length === 0) {
          // 没有新消息，继续轮询
          continue;
        }
        
        for (const update of data.result) {
          // 确保 update_id 是递增的
          if (update.update_id <= lastUpdateId) {
            console.log(`⚠️  跳过重复的 update_id: ${update.update_id} (last: ${lastUpdateId})`);
            continue;
          }
          
          // 检测事件间隔
          const expectedId = lastUpdateId + 1;
          if (update.update_id > expectedId) {
            console.log(`⚠️  事件间隔检测：期望 ${expectedId}, 收到 ${update.update_id}`);
            console.log(`   可能丢失了 ${update.update_id - expectedId} 个事件`);
            // 不报错，继续处理，Telegram 会自动重发丢失的事件
          }
          
          lastUpdateId = update.update_id;
          
          // 异步处理消息，不阻塞轮询
          handleMessage(update).catch(err => {
            console.error('处理消息失败:', err.message);
          });
        }
        
        // 每处理 10 个消息，短暂休息一下，避免处理太快
        if (data.result.length > 10) {
          await sleep(100);
        }
      }
    } catch (error) {
      consecutiveErrors++;
      console.error(`❌ 轮询错误 (${consecutiveErrors}/${MAX_RETRIES}):`, error.message);
      
      // 网络错误：指数退避
      const backoffTime = Math.min(30000, 5000 * Math.pow(1.5, consecutiveErrors - 1));
      
      if (consecutiveErrors >= MAX_RETRIES) {
        console.error('⚠️  连续错误过多，等待 30 秒后重试...');
        await sleep(30000);
        consecutiveErrors = 0;
      } else {
        console.log(`⏳ ${backoffTime/1000}秒后重试...`);
        await sleep(backoffTime);
      }
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
 * 流式代理调用（模拟打字机效果）
 * 先获取完整回复，然后逐字"表演"给用户看
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

  // 执行 agent 命令，等待完整回复（增加超时和重试）
  const cmd = `openclaw agent --to main --message "${message.replace(/"/g, '\\"')}"`;
  
  let fullOutput = '';
  const MAX_RETRIES = 2;
  let attempt = 0;
  
  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`🔄 执行 agent 命令 (尝试 ${attempt + 1}/${MAX_RETRIES + 1})...`);
      
      fullOutput = await new Promise((resolve, reject) => {
        const proc = exec(cmd, { 
          timeout: 300000, // 5 分钟超时（更宽容）
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout.trim());
          }
        });
        
        // 监听超时事件
        proc.on('timeout', () => {
          console.error('⚠️  Agent 执行超时，终止进程');
          proc.kill('SIGKILL');
        });
      });
      
      // 成功获取回复，跳出重试循环
      if (fullOutput) {
        break;
      }
    } catch (error) {
      attempt++;
      console.error(`❌ Agent 执行失败 (尝试 ${attempt}/${MAX_RETRIES + 1}):`, error.message);
      
      if (attempt > MAX_RETRIES) {
        // 所有重试都失败了
        const errorMsg = error.code === 'ETIMEDOUT' || error.killed 
          ? '️ LLM 请求超时，请稍后重试'
          : `❌ ${error.message}`;
        
        await editMessage(chatId, workingMessageId, `${header}${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // 等待 2 秒后重试
      console.log('⏳ 2 秒后重试...');
      await sleep(2000);
    }
  }

  if (!fullOutput) {
    fullOutput = '⚠️ 无回复';
  }

  // 智能流式输出：按句子快速推送，兼顾效率和顺畅度
  const display = fullOutput.slice(0, maxBodyLength);
  
  // 按句子分割（中文句号/问号/感叹号/换行）
  const sentences = display.split(/([。！？!?]\n?|\n\n+)/);
  let currentText = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (!sentence) continue;
    
    currentText += sentence;
    
    // 每句更新一次，100ms 间隔（快且顺畅）
    await editMessage(chatId, workingMessageId, `${header}${currentText}`);
    await sleep(100);
  }

  // 超长部分续发
  if (fullOutput.length > maxBodyLength) {
    const extraChunks = splitMessage(fullOutput.slice(maxBodyLength), 3800);
    for (const extra of extraChunks) {
      await sendMessage(chatId, extra);
      await sleep(200);
    }
  }

  return { agent, output: fullOutput, streamed: true };
}

module.exports = { handleMessage, startPolling, dispatchStreaming };
