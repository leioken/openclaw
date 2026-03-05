# 🚀 Agent Swarm 部署指南

_四大核心功能完整实现，5 分钟搞定_

---

## ✅ 已完成功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 📱 Telegram 通知 | ✅ 完成 | 自动发送 PR 审查/失败/完成通知 |
| 🔄 CI 集成 | ✅ 完成 | GitHub Actions 自动测试 |
| ⏰ LaunchAgent | ✅ 完成 | 每 10 分钟自动监控 |
| 🔐 GitHub 认证 | ⚠️ 待配置 | 需要手动登录一次 |

---

## 🔧 快速配置（只需 3 步）

### 步骤 1: GitHub 认证（2 分钟）

```bash
cd ~/.openclaw/workspace
gh auth login
```

**按提示操作：**
1. 选择 `GitHub.com`
2. 选择 `HTTPS`
3. 选择 `Login with a web browser`
4. 复制显示的设备代码
5. 在浏览器打开 https://github.com/login/device
6. 粘贴代码，授权
7. 回到终端，按回车

**验证：**
```bash
gh auth status
```

看到 `✓ Logged in to GitHub.com as xxx` 即成功。

---

### 步骤 2: 测试 Telegram 通知（1 分钟）

```bash
cd ~/.openclaw/workspace
node telegram-notify.js
```

**检查 Telegram：**
- 打开 Telegram
- 找到 @maikexiabot
- 应该收到测试消息："🦐 麦克虾测试通知"

**如果没收到：**
1. 检查是否已启动 Bot (`/start`)
2. 检查网络连接
3. 查看错误信息

---

### 步骤 3: 验证 LaunchAgent（1 分钟）

```bash
# 查看状态
launchctl list | grep com.openclaw

# 查看日志
tail -f ~/.openclaw/logs/agent-monitor-out.log
```

**正常状态：**
```
-	0	com.openclaw.agent-monitor
```

**等待 10 分钟**，日志文件应该有输出。

---

## 🎯 完整测试流程

### 测试 1: 生成代理

```bash
cd ~/.openclaw/workspace
node orchestrator.js spawn "添加用户注册功能"
```

**预期：**
- ✅ 创建 worktree
- ✅ 启动 tmux 会话
- ✅ 任务记录到 `.clawdbot/active-tasks.json`

---

### 测试 2: 监控代理

```bash
node orchestrator.js monitor
```

**预期：**
- ✅ 检查 tmux 会话状态
- ✅ 检查 PR 状态（如果已创建）
- ✅ 检查 CI 状态（如果已创建 PR）

---

### 测试 3: 主动寻工

```bash
node orchestrator.js find-work
```

**预期：**
- ✅ 扫描错误日志
- ✅ 扫描会议笔记
- ✅ 扫描 git log

---

### 测试 4: 清理任务

```bash
node orchestrator.js cleanup
```

**预期：**
- ✅ 删除完成的 worktree
- ✅ 清理 tmux 会话
- ✅ 保留最近 10 个任务记录

---

## 📊 文件清单

```
~/.openclaw/workspace/
├── orchestrator.js          # 编排器核心
├── monitor-agents.js        # 监控器
├── run-agent.sh             # 代理运行脚本
├── telegram-notify.js       # Telegram 通知模块 ✨ 新增
├── agent-monitor.plist      # LaunchAgent 配置
├── deploy-agent-swarm.sh    # 一键部署脚本
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions 配置 ✨ 新增
└── .clawdbot/
    └── active-tasks.json    # 任务注册表
```

---

## 🔍 故障排查

### 问题 1: tmux 会话启动失败

```bash
# 检查 tmux 是否安装
which tmux

# 手动测试
tmux new-session -d -s test "echo hello"
tmux list-sessions
```

---

### 问题 2: Telegram 通知不发送

```bash
# 检查 Bot Token
cat telegram-notify.js | grep BOT_TOKEN

# 手动测试
curl "https://api.telegram.org/bot8202210625:AAGRQ47fh7GxVLMKHcNtx8dXR94irSVRQao/getMe"
```

---

### 问题 3: LaunchAgent 不运行

```bash
# 重新加载
launchctl unload ~/Library/LaunchAgents/com.openclaw.agent-monitor.plist
launchctl load ~/Library/LaunchAgents/com.openclaw.agent-monitor.plist

# 查看日志
tail -f ~/.openclaw/logs/agent-monitor-error.log
```

---

### 问题 4: GitHub CLI 认证失败

```bash
# 清除旧认证
gh auth logout

# 重新认证
gh auth login

# 使用 token（备选方案）
echo "你的_GITHUB_TOKEN" | gh auth login --with-token
```

---

## 🎉 完成检查清单

- [ ] GitHub CLI 已认证 (`gh auth status`)
- [ ] Telegram 测试消息已收到
- [ ] LaunchAgent 已加载 (`launchctl list`)
- [ ] 生成了一个测试代理
- [ ] 监控器运行正常
- [ ] 日志文件有输出

---

## 📚 下一步

1. **推送代码到 GitHub**
   ```bash
   cd ~/.openclaw/workspace
   git remote add origin https://github.com/你的用户名/openclaw.git
   git push -u origin main
   ```

2. **启用 GitHub Actions**
   - 打开 https://github.com/你的用户名/openclaw/actions
   - 点击 "I understand my workflows, go ahead and enable them"

3. **等待第一个 PR**
   - 生成一个代理任务
   - 等待完成
   - 在 Telegram 接收通知
   - 审查并合并

---

## 🦐 享受你的 AI 团队！

现在你拥有了：
- 🤖 24 小时工作的 AI 代理团队
- 📱 实时通知系统
- 🔄 自动化测试和审查
- ⏰ 自动监控和重启

**你只需要：**
1. 提出需求
2. 审查 PR
3. 点击合并

剩下的交给麦克虾！🦐

---

_创建时间：2026-03-05_
_版本：1.0.0_
