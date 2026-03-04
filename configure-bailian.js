#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configPath = path.join(process.env.HOME, '.openclaw/config.json');

// 阿里云百炼 Coding Plan 支持的所有模型
const bailianModels = [
  { id: "qwen3.5-plus", name: "通义千问 3.5 Plus", input: ["text", "image"], contextWindow: 128000, maxTokens: 65536 },
  { id: "qwen3.5-max", name: "通义千问 3.5 Max", input: ["text", "image"], contextWindow: 256000, maxTokens: 65536 },
  { id: "qwen3-max", name: "通义千问 3 Max", input: ["text", "image"], contextWindow: 256000, maxTokens: 65536 },
  { id: "qwen-plus", name: "通义千问 Plus", input: ["text", "image"], contextWindow: 128000, maxTokens: 65536 },
  { id: "qwen-max", name: "通义千问 Max", input: ["text", "image"], contextWindow: 32000, maxTokens: 65536 },
  { id: "qwen-turbo", name: "通义千问 Turbo", input: ["text", "image"], contextWindow: 256000, maxTokens: 65536 },
  { id: "qwen-long", name: "通义千问 Long", input: ["text"], contextWindow: 1000000, maxTokens: 65536 },
  { id: "qwen-vl-max", name: "通义千问 VL Max", input: ["text", "image"], contextWindow: 32000, maxTokens: 65536 },
  { id: "qwen-vl-plus", name: "通义千问 VL Plus", input: ["text", "image"], contextWindow: 32000, maxTokens: 65536 },
  { id: "qwen-coder-plus", name: "通义千问 Coder Plus", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "qwen-coder-max", name: "通义千问 Coder Max", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "deepseek-v3", name: "DeepSeek V3", input: ["text"], contextWindow: 64000, maxTokens: 65536 },
  { id: "deepseek-r1", name: "DeepSeek R1", input: ["text"], contextWindow: 64000, maxTokens: 65536 },
  { id: "glm-4-plus", name: "GLM-4 Plus", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "glm-4-flash", name: "GLM-4 Flash", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "kimi-k2", name: "Kimi K2", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "step-2-16k", name: "Step-2 16K", input: ["text"], contextWindow: 16000, maxTokens: 65536 },
  { id: "step-1-32k", name: "Step-1 32K", input: ["text"], contextWindow: 32000, maxTokens: 65536 },
  { id: "internlm3-8b-instruct", name: "InternLM3 8B Instruct", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "internlm3-20b-instruct", name: "InternLM3 20B Instruct", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "minicpm3-4b", name: "MiniCPM3 4B", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "llama-3.2-3b-instruct", name: "Llama 3.2 3B Instruct", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "mistral-large-2", name: "Mistral Large 2", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "mistral-small-3", name: "Mistral Small 3", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "gemma-3-27b-it", name: "Gemma 3 27B IT", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "yi-lightning", name: "Yi Lightning", input: ["text"], contextWindow: 128000, maxTokens: 65536 },
  { id: "yi-large", name: "Yi Large", input: ["text"], contextWindow: 128000, maxTokens: 65536 }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🦐 阿里云百炼模型配置工具\n');
console.log('请将你在阿里云百炼控制台获取的 API Key 粘贴到这里');
console.log('(API Key 通常以 sk-sp- 开头)\n');

rl.question('API Key: ', (apiKey) => {
  apiKey = apiKey.trim();
  
  if (!apiKey.startsWith('sk-')) {
    console.log('⚠️  警告：API Key 格式可能不正确（通常以 sk- 开头）');
  }
  
  // 读取现有配置
  let config = {};
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(content);
  } catch (e) {
    console.log('创建新配置文件...');
  }
  
  // 配置百炼平台
  config.models = config.models || {};
  config.models.providers = config.models.providers || {};
  
  config.models.providers.bailian = {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
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
  
  // 设置默认模型为百炼的 qwen3.5-plus
  if (!config.models.default) {
    config.models.default = "bailian/qwen3.5-plus";
  }
  
  // 保存配置
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  
  console.log('\n✅ 配置完成！');
  console.log(`📦 已添加 ${bailianModels.length} 个百炼模型`);
  console.log('\n模型列表:');
  bailianModels.forEach((m, i) => {
    console.log(`  ${i + 1}. bailian/${m.id} - ${m.name} (${m.contextWindow} tokens)`);
  });
  console.log('\n⚠️  请重启 OpenClaw 网关使配置生效:');
  console.log('  openclaw gateway restart\n');
  
  rl.close();
});
