# API Skill 配置指南

## 概述

本指南说明如何配置 AI 生成 API 接口，支持即梦、Grok、Gemini 等平台。

## 平台配置

### 即梦 (Jimeng)

```json
{
  "platform": "jimeng",
  "baseUrl": "https://jimeng.com",
  "loginRequired": true,
  "selectors": {
    "promptInput": "#prompt-input",
    "generateButton": "#generate-btn",
    "resultImage": ".result-image",
    "downloadButton": ".download-btn"
  }
}
```

### Grok (X)

```json
{
  "platform": "grok",
  "baseUrl": "https://x.com/i/grok",
  "loginRequired": true,
  "selectors": {
    "promptInput": "[data-testid=\"grok-input\"]",
    "submitButton": "[data-testid=\"submit-btn\"]",
    "resultContent": "[data-testid=\"grok-response\"]"
  }
}
```

### Gemini

```json
{
  "platform": "gemini",
  "baseUrl": "https://gemini.google.com",
  "loginRequired": true,
  "selectors": {
    "promptInput": ".ql-editor",
    "submitButton": "button[aria-label=\"Run\"]",
    "resultContent": ".response-content"
  }
}
```

## API 使用示例

### curl

```bash
curl -X POST http://localhost:18789/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "jimeng",
    "prompt": "金刚大战哥斯拉",
    "params": {
      "ratio": "16:9"
    }
  }'
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:18789/api/generate',
    json={
        'platform': 'jimeng',
        'prompt': '金刚大战哥斯拉',
        'params': {'ratio': '16:9'}
    }
)

print(response.json())
```

### Node.js

```javascript
const response = await fetch('http://localhost:18789/api/generate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    platform: 'jimeng',
    prompt: '金刚大战哥斯拉',
    params: {ratio: '16:9'}
  })
});

const result = await response.json();
```

---

## Token 优化

### 0 Token 模式（推荐）

使用固定模板，不调用 LLM：

```javascript
// 本地规则匹配
if (request.type === 'draw') {
  executeDraw(request.prompt); // 不消耗 token
}
```

### 少量 Token 模式

仅复杂请求调用 LLM：

```javascript
// 简单请求：0 token
// 复杂请求：~500 tokens
if (request.complex) {
  llm.parse(request);
}
```

---

## 防封号建议

1. **低频使用** - 每个账号每天不超过 50 次
2. **随机间隔** - 请求间隔 30-120 秒随机
3. **单账号单用途** - 不要一个账号跑多个服务
4. **失败重试** - 失败后等待 5 分钟再试
