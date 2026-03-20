# Windows 新系统安装指南

本指南说明如何在**全新的 Windows 系统**上一键安装 OpenClaw。

## 新系统自动安装流程

`install.bat` 会自动完成以下操作：

### 1. Node.js 自动安装
```
检测 → 未安装 → 下载 Node.js 20 LTS → 静默安装 → 验证
```
- 下载地址：https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
- 安装方式：MSI 静默安装
- 安装后自动刷新环境变量

### 2. Git 自动安装（可选但推荐）
```
检测 → 未安装 → 下载 Git for Windows → 静默安装 → 验证
```
- 下载地址：GitHub Releases
- 安装方式：Inno Setup 静默安装 (`/VERYSILENT`)

### 3. OpenClaw 全局安装
```
npm install -g openclaw
```

### 4. 工作目录创建
```
%USERPROFILE%\openclaw-workspace\
```

### 5. 配置文件生成
自动生成以下文件：
- `config.json` - 主配置（包含 browser CDP 配置）
- `.env` - API Key
- `SOUL.md` - 助手人格
- `USER.md` - 用户信息
- `AGENTS.md` - 工作区说明
- `MEMORY.md` - 长期记忆
- `HEARTBEAT.md` - 心跳任务
- `TOOLS.md` - 本地笔记
- `memory/` - 记忆目录

### 6. 技能部署
自动复制 `skills/` 目录到工作区：
- `chrome-cdp/` - Chrome 浏览器自动化
- `auto-browser/` - 即梦/Grok/Gemini 自动操作

### 7. Chrome CDP 配置（可选）
如果选择配置 Chrome：
```
检测 Chrome → 未安装 → 下载 Chrome → 静默安装
→ 创建 CDP 配置文件目录
→ 创建桌面快捷方式
→ 创建启动脚本
→ 测试 CDP 连接
```

## 安装后验证

运行 `verify.bat` 检查：
- [ ] Node.js 已安装
- [ ] npm 已安装
- [ ] OpenClaw 已安装
- [ ] 工作目录存在
- [ ] config.json 存在
- [ ] .env 存在
- [ ] SOUL.md 存在
- [ ] skills 目录存在
- [ ] Chrome 已安装（如配置）
- [ ] Gateway 可启动

## 首次启动

1. 运行 `start-gateway.bat`
2. 观察启动日志
3. 如有 Telegram 配置，在 Telegram 中发送 `/start`

## 常见问题

### Q: 安装过程中下载失败怎么办？
A: 检查网络连接，或手动下载对应文件后重新运行 `install.bat`

### Q: 安装到一半中断了怎么办？
A: 重新运行 `install.bat`，它会检测已安装的组件并跳过

### Q: 如何确认安装成功？
A: 运行 `verify.bat`，所有检查项应显示 `[✓]`

### Q: API Key 在哪里获取？
A: 访问 https://bailian.console.aliyun.com/ 创建账号并获取 API Key

### Q: Telegram Bot Token 在哪里获取？
A: 在 Telegram 中搜索 @BotFather，发送 `/newbot` 按提示创建

### Q: Chrome CDP 有什么用？
A: 通过 CDP 可以控制浏览器自动操作，用于：
   - 即梦 AI 图片生成
   - Grok 对话
   - Gemini Pro 对话
   - 其他需要登录的网站服务

---

_麦克虾 🦐 | 稳重老成，干练可靠_
