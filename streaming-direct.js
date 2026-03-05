#!/usr/bin/env node

/**
 * 🦐 直接流式调用模型 API
 * 绕过 openclaw agent 命令，实现真正的逐字输出
 */

const https = require('https');

// 阿里云百炼 API 配置
const API_KEY = 'sk-sp-faddba250cdd44829f6623c37d0d16c0';
const MODEL = 'qwen3.5-plus';

/**
 * 流式调用阿里云 API
 */
async function streamChat(message, onChunk) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      input: {
        messages: [
          { role: 'system', content: '你是麦克虾，稳重老成，干练可靠的 AI 助理。' },
          { role: 'user', content: message }
        ]
      },
      parameters: {
        result_format: 'text'
      },
      stream: true
    });

    const req = https.request('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let fullText = '';

      res.on('data', (chunk) => {
        const data = chunk.toString();
        // SSE 格式：data: {...}
        const lines = data.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const json = JSON.parse(line.slice(5).trim());
              if (json.output && json.output.text) {
                const text = json.output.text;
                fullText += text;
                onChunk(text);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      res.on('end', () => {
        resolve(fullText);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 测试
if (require.main === module) {
  console.log('🦐 测试流式输出...\n');
  
  streamChat('你好，介绍一下你自己', (chunk) => {
    process.stdout.write(chunk);
  }).then(() => {
    console.log('\n\n✅ 完成');
  }).catch(console.error);
}

module.exports = { streamChat };
