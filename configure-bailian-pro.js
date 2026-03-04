#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.HOME, '.openclaw/config.json');

// 用户指定的 8 个 Coding Plan Pro 模型
const bailianModels = [
  { id: "qwen3.5-plus", name: "Qwen3.5 Plus", input: ["text", "image"], contextWindow: 1000000, maxTokens: 65536 },
  { id: "kimi-k2.5", name: "Kimi K2.5", input: ["text", "image"], contextWindow: 262144, maxTokens: 65536 },
  { id: "glm-5", name: "GLM-5", input: ["text"], contextWindow: 202752, maxTokens: 65536 },
  { id: "minimax-m2.5", name: "MiniMax-M2.5", input: ["text", "image"], contextWindow: 204800, maxTokens: 65536 },
  { id: "qwen3-max-2026-01-23", name: "Qwen3 Max 2026-01-23", input: ["text", "image"], contextWindow: 262144, maxTokens: 65536 },
  { id: "qwen3-coder-next", name: "Qwen3 Coder Next", input: ["text"], contextWindow: 262144, maxTokens: 65536 },
  { id: "qwen3-coder-plus", name: "Qwen3 Coder Plus", input: ["text"], contextWindow: 1000000, maxTokens: 65536 },
  { id: "glm-4.7", name: "GLM-4.7", input: ["text"], contextWindow: 202752, maxTokens: 65536 }
];

const apiKey = 'sk-sp-faddba250cdd44829f6623c37d0d16c0';

// 读取现有配置
let config = {};
try {
  const content = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(content);
} catch (e) {
  console.log('创建新配置文件...');
}

// 配置百炼平台 - 使用 Coding Plan 专用配置
config.models = config.models || {};
config.models.providers = config.models.providers || {};

config.models.providers.bailian = {
  baseUrl: "https://coding-intl.dashscope.aliyuncs.com/v1",
  apiKey: apiKey,
  api: "openai-completions",
  models: bailianModels.map(m => ({
    id: `bailian/${m.id}`,
    name: m.name,
    reasoning: false,
    input: m.input,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: m.contextWindow,
    maxTokens: m.maxTokens
  }))
};

// 设置默认模型
config.models.default = "bailian/qwen3.5-plus";

// 保存配置
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

console.log('✅ 配置完成！\n');
console.log(`🔑 API Key: sk-sp-****${apiKey.slice(-16)}`);
console.log(`📦 已添加 ${bailianModels.length} 个 Coding Plan Pro 模型\n`);
console.log('模型列表:');
bailianModels.forEach((m, i) => {
  console.log(`  ${i + 1}. bailian/${m.id.padEnd(25)} - ${m.contextWindow.toLocaleString()} tokens`);
});
console.log('\n⚠️  请重启 OpenClaw 网关:');
console.log('  openclaw gateway restart\n');
console.log('或在模型切换器中点击"刷新模型列表"\n');
