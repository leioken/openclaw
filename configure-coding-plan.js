#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.HOME, '.openclaw/config.json');
const modelsCachePath = path.join(process.env.HOME, '.openclaw/agents/main/agent/models.json');

// 官方文档指定的 8 个模型（按官方配置）
const bailianModels = [
  { id: "qwen3.5-plus", name: "qwen3.5-plus", input: ["text", "image"], contextWindow: 1000000, maxTokens: 65536 },
  { id: "qwen3-max-2026-01-23", name: "qwen3-max-2026-01-23", input: ["text"], contextWindow: 262144, maxTokens: 65536 },
  { id: "qwen3-coder-next", name: "qwen3-coder-next", input: ["text"], contextWindow: 262144, maxTokens: 65536 },
  { id: "qwen3-coder-plus", name: "qwen3-coder-plus", input: ["text"], contextWindow: 1000000, maxTokens: 65536 },
  { id: "MiniMax-M2.5", name: "MiniMax-M2.5", input: ["text"], contextWindow: 204800, maxTokens: 131072 },
  { id: "glm-5", name: "glm-5", input: ["text"], contextWindow: 202752, maxTokens: 16384 },
  { id: "glm-4.7", name: "glm-4.7", input: ["text"], contextWindow: 202752, maxTokens: 16384 },
  { id: "kimi-k2.5", name: "kimi-k2.5", input: ["text", "image"], contextWindow: 262144, maxTokens: 32768 }
];

const apiKey = 'sk-sp-faddba250cdd44829f6623c37d0d16c0';

console.log('🦐 配置阿里云百炼 Coding Plan Pro 套餐\n');

// 删除旧的缓存配置（避免冲突）
try {
  if (fs.existsSync(modelsCachePath)) {
    const cacheContent = JSON.parse(fs.readFileSync(modelsCachePath, 'utf8'));
    if (cacheContent.providers && cacheContent.providers.bailian) {
      delete cacheContent.providers.bailian;
      fs.writeFileSync(modelsCachePath, JSON.stringify(cacheContent, null, 2), 'utf8');
      console.log('✅ 已清理旧的缓存配置');
    }
  }
} catch (e) {
  // 忽略缓存文件错误
}

// 读取现有配置
let config = {};
try {
  const content = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(content);
} catch (e) {
  console.log('创建新配置文件...');
}

// 按照官方文档配置
config.models = {
  mode: "merge",
  providers: {
    bailian: {
      baseUrl: "https://coding.dashscope.aliyuncs.com/v1",
      apiKey: apiKey,
      api: "openai-completions",
      models: bailianModels.map(m => ({
        id: m.id,
        name: m.name,
        reasoning: false,
        input: m.input,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens
      }))
    }
  }
};

// 配置默认模型
config.agents = config.agents || {};
config.agents.defaults = config.agents.defaults || {};
config.agents.defaults.model = {
  primary: "bailian/qwen3.5-plus"
};
config.agents.defaults.models = {
  "bailian/qwen3.5-plus": {},
  "bailian/qwen3-max-2026-01-23": {},
  "bailian/qwen3-coder-next": {},
  "bailian/qwen3-coder-plus": {},
  "bailian/MiniMax-M2.5": {},
  "bailian/glm-5": {},
  "bailian/glm-4.7": {},
  "bailian/kimi-k2.5": {}
};

// 保存配置
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

console.log('✅ 配置完成！\n');
console.log(`🔑 API Key: sk-sp-****${apiKey.slice(-16)}`);
console.log(`📦 Pro 高级套餐 - 8 个模型\n`);
console.log('模型列表:');
bailianModels.forEach((m, i) => {
  console.log(`  ${i + 1}. bailian/${m.id.padEnd(25)} - ${(m.contextWindow/1000).toFixed(0)}K tokens`);
});
console.log('\n⚠️  重启 OpenClaw 网关:');
console.log('  openclaw gateway restart\n');
console.log('💡 Pro 套餐额度：每 5 小时 6,000 次请求\n');
