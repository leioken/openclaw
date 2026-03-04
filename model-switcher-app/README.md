# 🦐 模型切换器 - 使用指南

## 当前状态

✅ **Web 界面**: http://127.0.0.1:18791
✅ **Mac 应用**: 已启动（系统托盘可见）

## 为什么只有一个模型？

你目前只配置了 **阿里云 Qwen3.5-Plus** 模型。要获取更多模型，有以下几种方式：

### 方式 1: 配置 OpenRouter（推荐）

OpenRouter 提供数百个免费/付费模型：

1. 访问 https://openrouter.ai/keys 创建 API Key
2. 在 OpenClaw 中配置：
   ```bash
   openclaw models auth add openrouter --key <你的 API_KEY>
   ```
3. 扫描免费模型：
   ```bash
   openclaw models scan
   ```

### 方式 2: 手动添加模型

编辑配置文件添加其他模型提供商：
```bash
openclaw config set models.providers '{"openai": {"key": "xxx"}, "anthropic": {"key": "xxx"}}'
```

### 方式 3: 使用免费模型

一些无需 API Key 的选项：
- `ollama` 本地运行（需自行安装 Ollama）
- `lmstudio` 本地运行（需自行安装 LM Studio）

## 常用模型推荐

| 模型 | 提供商 | 特点 |
|------|--------|------|
| `openai/gpt-4o` | OpenAI | 最强通用 |
| `anthropic/claude-3.5-sonnet` | Anthropic | 代码能力强 |
| `google/gemini-pro-1.5` | Google | 长上下文 |
| `meta-llama/llama-3-70b` | Meta | 开源最强 |
| `mistralai/mistral-large` | Mistral | 欧洲模型 |

## Mac 应用功能

- 🖥️ 独立窗口，更像原生应用
- 📍 系统托盘常驻
- ⚡ 一键切换模型
- 🔄 实时刷新列表

## 快捷操作

- 点击托盘图标：显示/隐藏窗口
- 右键托盘：快捷菜单
- Cmd+Q: 完全退出应用

## 问题排查

**应用无法连接？**
确保后端服务在运行：
```bash
lsof -i:18791
```

**重启服务：**
```bash
lsof -ti:18791 | xargs kill -9
cd /Users/lee/.openclaw/workspace && node model-switcher-server.js &
```

---

🦐 赛博老虾 出品
