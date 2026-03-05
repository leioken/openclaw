#!/usr/bin/env node

/**
 * 📱 Telegram 通知模块
 * 用于 Agent Swarm 发送通知给老板
 */

const https = require('https');

const BOT_TOKEN = '8202210625:AAGRQ47fh7GxVLMKHcNtx8dXR94irSVRQao';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 老板的 Telegram ID
const BOSS_ID = '8693911314';

/**
 * 发送 Telegram 消息
 */
async function sendNotification(message, options = {}) {
  const {
    chatId = BOSS_ID,
    parseMode = null,
    disableNotification = false
  } = options;

  return new Promise((resolve, reject) => {
    const payload = {
      chat_id: chatId,
      text: message,
      disable_notification: disableNotification
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }
    
    const data = JSON.stringify(payload);

    const req = https.request(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.ok) {
          resolve(result);
        } else {
          reject(new Error(result.description || '发送失败'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 发送 PR 准备审查通知
 */
async function notifyPRReady(prNumber, taskDescription) {
  const message = `✅ **PR 准备审查**

📋 任务：${taskDescription}
🔗 PR: #${prNumber}

状态:
✅ CI 通过
✅ AI 审查通过
✅ 截图已附

请审查：https://github.com/lee/openclaw/pull/${prNumber}`;

  return await sendNotification(message);
}

/**
 * 发送代理失败通知
 */
async function notifyAgentFailed(taskId, taskDescription, error) {
  const message = `❌ **代理失败，需要人工介入**

📋 任务：${taskDescription}
🆔 ID: ${taskId}
⚠️ 错误：${error}

请检查日志并手动处理。`;

  return await sendNotification(message);
}

/**
 * 发送任务完成通知
 */
async function notifyTaskCompleted(taskId, taskDescription) {
  const message = `✅ **任务完成**

📋 任务：${taskDescription}
🆔 ID: ${taskId}

已自动提交并创建 PR。`;

  return await sendNotification(message);
}

// CLI 测试
if (require.main === module) {
  (async () => {
    console.log('📱 发送测试通知...');
    try {
      const message = '🦐 麦克虾测试通知\n\n如果你看到这条消息，说明 Telegram 通知功能正常工作！';
      console.log('消息内容:', message);
      await sendNotification(message);
      console.log('✅ 测试成功');
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
    }
  })();
}

module.exports = {
  sendNotification,
  notifyPRReady,
  notifyAgentFailed,
  notifyTaskCompleted
};
