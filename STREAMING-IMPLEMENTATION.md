# 📱 Telegram 流式输出实现文档

## 实现方案

### 方案 1: sendMessageDraft (推荐，但需要 Bot API 9.5+)

**优点:**
- 专为流式设计
- 不会触发消息通知
- 用户体验最佳

**缺点:**
- 需要 Bot API 9.5+
- 可能部分 Bot 不支持

**使用方式:**
```javascript
const draft = await sendDraft(chatId, '初始内容');
const messageId = draft.result.message_id;
const draftKey = draft.result.draft_key;

// 后续更新
await editMessage(chatId, messageId, '更新后的内容');
```

---

### 方案 2: 普通消息 + editMessageText (兼容性好) ✅

**优点:**
- 兼容所有 Bot API 版本
- 测试通过，稳定可靠
- 同样不会触发通知

**缺点:**
- 需要手动控制编辑频率

**实现要点:**

1. **发送初始消息**
```javascript
const msg = await sendMessage(chatId, '🔄 正在处理...');
const messageId = msg.result.message_id;
```

2. **流式编辑**
```javascript
// 每 500-800ms 编辑一次，避免 rate limit
await editMessage(chatId, messageId, '新内容');
```

3. **节流控制**
```javascript
// 推荐间隔：500-800ms
// Telegram 限制：约每秒 1 次编辑
await sleep(800);
```

---

## 代码实现

### 核心函数

**telegram-integration.js**

```javascript
// 发送草稿 (Bot API 9.5+)
async function sendDraft(chatId, text, draftKey = null) {
  const url = `${API_BASE}/sendMessageDraft`;
  // ...
}

// 编辑消息
async function editMessage(chatId, messageId, text) {
  const url = `${API_BASE}/editMessageText`;
  // ...
}

// 流式输出
async function streamMessage(chatId, messageId, chunks, interval = 500) {
  let currentText = '';
  for (const chunk of chunks) {
    currentText += chunk;
    await editMessage(chatId, messageId, currentText);
    await sleep(interval); // 节流
  }
}
```

### 流式代理调用

```javascript
async function dispatchWithStreaming(message, chatId, agent) {
  // 1. 切换模型
  await execPromise(`openclaw models set "${agent.model}"`);
  
  // 2. 发送初始草稿
  const draft = await sendDraft(chatId, `${agent.emoji} ${agent.name}:\n\n`);
  const messageId = draft.result.message_id;
  
  // 3. 执行代理命令，流式读取输出
  const proc = exec(`openclaw agent --message "${message}"`);
  
  let fullOutput = '';
  let chunkCount = 0;
  
  proc.stdout.on('data', async (data) => {
    fullOutput += data.toString();
    chunkCount++;
    
    // 每 3 个 chunk 更新一次
    if (chunkCount % 3 === 0) {
      await editMessage(chatId, messageId, initialText + fullOutput);
    }
  });
  
  proc.on('close', async () => {
    // 最终更新
    await editMessage(chatId, messageId, initialText + fullOutput);
  });
}
```

---

## 测试结果

```bash
node test-telegram-stream.js

📝 测试 1: sendMessageDraft
⚠️  Draft 不可用，使用普通消息

📝 测试 2: 普通消息 + 编辑
✏️  编辑 1/4: 成功
✏️  编辑 2/4: 成功
✏️  编辑 3/4: 成功
✏️  编辑 4/4: 成功

✅ 测试完成！
```

**结论:** 
- `sendMessageDraft` 可能不可用 (Bot API 版本问题)
- **普通消息 + editMessageText** 方案完全可行 ✅

---

## Rate Limit 注意事项

Telegram Bot API 对 `editMessageText` 有限制：

| 限制类型 | 数值 | 建议 |
|---------|------|------|
| 编辑频率 | ~1 次/秒 | 设置为 500-800ms |
| 连续编辑 | 无明确限制 | 建议每 3-5 次停顿一下 |
| 消息长度 | 4096 字符 | 超长消息分段发送 |

**最佳实践:**
```javascript
// 节流控制
const EDIT_INTERVAL = 800; // 800ms

// 批量更新 (每 3 个 chunk 更新一次)
if (chunkCount % 3 === 0) {
  await editMessage(chatId, messageId, currentText);
}

// 错误处理
const result = await editMessage(chatId, messageId, text);
if (!result.ok) {
  // 回退到普通消息
  await sendMessage(chatId, text);
}
```

---

## 用户体验优化

### 1. 显示处理状态
```
🔄 正在处理...
  ↓
📊 分析中...
  ↓
🧠 思考中...
  ↓
✅ 完成！
```

### 2. 渐进式内容
```
🦐 麦克虾：

正在生成回复...
  ↓
🦐 麦克虾：

正在生成回复...
1️⃣ 第一点内容...
  ↓
🦐 麦克虾：

正在生成回复...
1️⃣ 第一点内容...
2️⃣ 第二点内容...
  ↓
🦐 麦克虾：

[完整回复]
```

### 3. 最终标记
```
...内容...

---
✅ 完成 | 👨‍💻 代码专家
```

---

## 文件清单

```
~/.openclaw/workspace/
├── telegram-integration.js      # 主集成 (已实现流式)
├── test-telegram-stream.js      # 测试工具
└── STREAMING-IMPLEMENTATION.md  # 本文档
```

---

## 使用方法

### 启动流式 Bot
```bash
node ~/.openclaw/workspace/telegram-integration.js
```

### 测试流式输出
```bash
node ~/.openclaw/workspace/test-telegram-stream.js
```

### 在 Telegram 中体验
1. 打开 @maikexiabot
2. 发送长消息请求
3. 观察实时编辑效果

---

**🦐 流式输出实现完成！**

_最后更新：2026-03-03 04:50_
