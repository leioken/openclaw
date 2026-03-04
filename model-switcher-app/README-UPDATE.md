# 模型切换器使用说明

## 问题说明

当你在界面中切换模型后，配置文件会被更新，但 OpenClaw 服务不会自动重启。
这导致虽然配置改了，但实际使用的还是旧模型。

## 解决方案

### 方法 1：使用桌面快捷方式（推荐）

1. 在模型切换器中选择你想要的模型
2. 双击桌面的 **"重启OpenClaw.command"**
3. 等待提示"服务已重启"
4. 新模型配置生效！

### 方法 2：使用命令行

打开终端，运行：

```bash
pkill -9 -f "openclaw-gateway" && sleep 2 && /opt/homebrew/bin/openclaw gateway > ~/Library/Logs/openclaw-launcher.log 2>&1 &
```

### 方法 3：使用 OpenClaw 命令

```bash
openclaw gateway restart
```

## 验证模型是否切换成功

1. 打开终端
2. 运行：`tail ~/Library/Logs/openclaw-launcher.log | grep "agent model"`
3. 查看输出的模型名称是否是你选择的模型

## 可用模型列表

- **qwen3.5-plus** - 通义千问 3.5 Plus（推荐，支持图像）
- **kimi-k2.5** - Kimi K2.5（推荐，支持图像）
- **glm-5** - GLM-5（推荐）
- **MiniMax-M2.5** - MiniMax M2.5
- **qwen3-max-2026-01-23** - 通义千问 3 Max
- **qwen3-coder-next** - 代码专用
- **qwen3-coder-plus** - 代码专用
- **glm-4.7** - GLM-4.7

## 提示

- 切换模型后必须重启服务才能生效
- 建议将"重启OpenClaw.command"固定在 Dock 方便使用
- 每次切换模型都需要重启一次服务
