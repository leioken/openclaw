# 🦐 模型配置指南

## 🎯 快速开始

### 1. 获取 OpenRouter API Key（免费）

1. 访问：https://openrouter.ai/keys
2. 注册/登录账号
3. 点击 "Create Key" 创建 API Key
4. 复制 Key，备用

### 2. 配置到 OpenClaw

```bash
# 添加 OpenRouter 认证
openclaw models auth add openrouter --key <你的 API_KEY>

# 或者手动编辑配置文件
openclaw config set models.providers.openrouter.api_key "<你的 API_KEY>"
```

### 3. 扫描免费模型

```bash
openclaw models scan
```

---

## 🆓 推荐免费模型列表

以下模型在 OpenRouter 上提供免费额度（每日限制）：

### 顶级免费模型

| 模型 ID | 上下文 | 特点 |
|---------|--------|------|
| `meta-llama/llama-3.3-70b-instruct:free` | 131K | GPT-4 级别性能 |
| `google/gemini-2.0-flash-exp:free` | 1M | 多模态，超长上下文 |
| `deepseek/deepseek-v3:free` | 164K | 代码/数学强 |
| `qwen/qwen-2.5-coder-32b-instruct:free` | 262K | 代码专用 |
| `mistralai/mistral-small-3:free` | 128K | 平衡性能好 |

### 其他免费选项

| 模型 ID | 提供商 | 特点 |
|---------|--------|------|
| `arcee-ai/trinity-large-preview:free` | Arcee AI | 400B 超大模型 |
| `stepfun-ai/step-3.5-flash:free` | StepFun | 196B MoE，快速 |
| `z-ai/glm-4.5-air:free` | Z.ai | 轻量级 |
| `nvidia/nemotron-nano-30b:free` | NVIDIA | 开源权重 |
| `openai/gpt-oss-20b:free` | OpenAI | 开源版本 |
| `upstage/solar-pro-3:free` | Upstage | 多语言支持 |
| `google/gemma-3-27b-instruct:free` | Google | Gemma 系列 |
| `liquid/lfm2.5-1.2b-instruct:free` | Liquid AI | 超轻量 |

---

## 🔧 手动添加模型

如果扫描不到，可以手动添加：

```bash
# 设置默认模型
openclaw models set meta-llama/llama-3.3-70b-instruct:free

# 查看当前配置
openclaw models status
```

---

## 📊 模型对比

### 日常对话推荐
- `meta-llama/llama-3.3-70b-instruct:free` - 综合最佳
- `google/gemini-2.0-flash-exp:free` - 长文本处理

### 代码编程推荐
- `deepseek/deepseek-v3:free` - 代码能力最强
- `qwen/qwen-2.5-coder-32b-instruct:free` - 中文友好

### 快速响应推荐
- `mistralai/mistral-small-3:free` - 速度快
- `liquid/lfm2.5-1.2b-instruct:free` - 最轻量

---

## ⚠️ 注意事项

1. **免费限制**: 免费模型有每日请求限制
2. **速率限制**: 高峰期可能需要排队
3. **隐私**: 部分免费模型会记录提示用于训练
4. **可用性**: 免费模型列表可能随时变化

---

## 🛠️ 故障排除

### 问题：扫描失败
```bash
# 检查 API Key 是否配置
openclaw models auth list

# 重新配置
openclaw models auth add openrouter --key <KEY>
```

### 问题：模型不可用
```bash
# 查看可用模型
openclaw models list

# 切换到其他模型
openclaw models set aliyun/qwen3.5-plus
```

### 问题：应用无法连接
```bash
# 检查后端服务
lsof -i:18791

# 重启服务
lsof -ti:18791 | xargs kill -9
cd /Users/lee/.openclaw/workspace && node model-switcher-server.js &
```

---

## 📱 Mac 应用使用

- **打开应用**: 点击 Dock 图标或托盘图标
- **隐藏窗口**: Cmd+H 或点击托盘
- **完全退出**: Cmd+Q 或右键托盘选择"退出"
- **切换模型**: 点击任意模型卡片

---

🦐 赛博老虾 | 最后更新：2026-03-02
