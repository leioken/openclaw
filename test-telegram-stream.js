#!/usr/bin/env node

/**
 * 🦐 Telegram 流式输出测试
 */

const BOT_TOKEN = '8202210625:AAGRQ47fh7GxVLMKHcNtx8dXR94irSVRQao';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TEST_CHAT_ID = '8693911314'; // 老板的 Telegram ID

/**
 * 发送草稿消息
 */
async function sendDraft(chatId, text, draftKey = null) {
  const url = `${API_BASE}/sendMessageDraft`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };
  
  if (draftKey) {
    body.draft_key = draftKey;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

/**
 * 编辑消息
 */
async function editMessage(chatId, messageId, text) {
  const url = `${API_BASE}/editMessageText`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
  return response.json();
}

/**
 * 发送普通消息
 */
async function sendMessage(chatId, text) {
  const url = `${API_BASE}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
  return response.json();
}

/**
 * 流式输出演示
 */
async function streamDemo(chatId) {
  console.log('🦐 开始流式输出测试...');
  
  // 方式 1: 使用 sendMessageDraft (推荐)
  console.log('\n📝 测试 1: sendMessageDraft');
  const draft = await sendDraft(chatId, '🦐 麦克虾流式输出测试...\n\n正在生成回复');
  
  if (draft.ok) {
    console.log('✅ Draft 发送成功:', draft.result);
    const messageId = draft.result.message_id;
    
    // 模拟流式输出
    const chunks = [
      '\n\n1️⃣ 第一段内容...\n',
      '2️⃣ 第二段内容...\n',
      '3️⃣ 第三段内容...\n',
      '\n✅ 完成！'
    ];
    
    for (let i = 0; i < chunks.length; i++) {
      await sleep(1000); // 1 秒间隔
      const result = await editMessage(chatId, messageId, 
        '🦐 麦克虾流式输出测试...' + 
        '\n\n正在生成回复' + 
        chunks.slice(0, i + 1).join('')
      );
      console.log(`✏️  编辑 ${i + 1}/${chunks.length}:`, result.ok ? '成功' : '失败');
    }
  } else {
    console.log('⚠️  Draft 不可用，使用普通消息');
    await sendMessage(chatId, '🦐 麦克虾流式输出测试...\n\n您的 Bot API 版本可能不支持 sendMessageDraft');
  }
  
  // 方式 2: 普通消息 + 编辑
  console.log('\n📝 测试 2: 普通消息 + 编辑');
  await sleep(2000);
  
  const init = await sendMessage(chatId, '🔄 正在处理...');
  if (init.ok) {
    const messageId = init.result.message_id;
    
    const updates = [
      '🔄 正在处理...\n\n📊 分析中',
      '🔄 正在处理...\n\n📊 分析中\n🧠 思考中',
      '🔄 正在处理...\n\n📊 分析中\n🧠 思考中\n✍️ 撰写中',
      '✅ 完成！\n\n📊 分析完成\n🧠 思考完成\n✍️ 撰写完成\n\n🦐 麦克虾为您服务！'
    ];
    
    for (let i = 0; i < updates.length; i++) {
      await sleep(800);
      const result = await editMessage(chatId, messageId, updates[i]);
      console.log(`✏️  编辑 ${i + 1}/${updates.length}:`, result.ok ? '成功' : '失败');
    }
  }
  
  console.log('\n✅ 测试完成！');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
if (require.main === module) {
  console.log('🦐 Telegram 流式输出测试工具\n');
  console.log(`📍 Bot: @maikexiabot`);
  console.log(`👤 测试用户：${TEST_CHAT_ID}`);
  console.log('');
  
  streamDemo(TEST_CHAT_ID).catch(console.error);
}

module.exports = { sendDraft, editMessage, sendMessage, streamDemo };
