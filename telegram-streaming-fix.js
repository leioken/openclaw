#!/usr/bin/env node

/**
 * 🦐 Telegram 流式输出修复
 * 测试真正的流式效果
 */

const https = require('https');

const BOT_TOKEN = '8202210625:AAGRQ47fh7GxVLMKHcNtx8dXR94irSVRQao';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BOSS_ID = '8693911314';

/**
 * 发送消息
 */
function sendMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text
    });

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
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 编辑消息
 */
function editMessage(chatId, messageId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text
    });

    const req = https.request(`${API_BASE}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 测试流式输出
 */
async function testStreaming() {
  console.log('📱 发送测试消息...');
  
  // 1. 发送初始消息
  const init = await sendMessage(BOSS_ID, '🦐 流式输出测试\n\n准备开始...');
  
  if (!init.ok) {
    console.error('发送失败:', init);
    return;
  }
  
  const messageId = init.result.message_id;
  console.log('✅ 初始消息已发送，ID:', messageId);
  
  // 2. 流式编辑
  const chunks = [
    '1️⃣ ', '2️⃣ ', '3️⃣ ', '4️⃣ ', '5️⃣ ',
    '\n\n', '这', '是', '真', '正', '的', '流', '式', '输', '出', '！',
    '\n\n', '每', '个', '字', '都', '是', '实', '时', '编', '辑', '的', '！',
    '\n\n', '✅ ', '完', '成', '！'
  ];
  
  let currentText = '🦐 流式输出测试\n\n';
  
  for (let i = 0; i < chunks.length; i++) {
    currentText += chunks[i];
    
    try {
      const result = await editMessage(BOSS_ID, messageId, currentText);
      if (result.ok) {
        console.log(`✓ 编辑成功 (${i + 1}/${chunks.length})`);
      } else {
        console.error('✗ 编辑失败:', result);
      }
    } catch (error) {
      console.error('✗ 编辑异常:', error.message);
    }
    
    // 节流：600ms 更新一次
    await new Promise(resolve => setTimeout(resolve, 600));
  }
  
  console.log('✅ 流式测试完成！');
}

// 运行测试
testStreaming().catch(console.error);
