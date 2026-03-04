# 🦐 麦克虾 - 三大核心功能使用指南

## 1️⃣ 第二大脑 (Second Brain)

**功能：** 零摩擦记忆捕获和搜索系统

### 使用方式

#### Telegram 中自动捕获
发送包含以下关键词的消息会自动保存：
- `记住 xxx`
- `记一下 xxx`
- `保存 xxx`
- `收藏 xxx`

#### 命令行手动捕获
```bash
# 捕获记忆
node ~/.openclaw/workspace/second-brain.js capture "今天学习了 OpenClaw 配置"

# 搜索记忆
node ~/.openclaw/workspace/second-brain.js search "OpenClaw"

# 列出所有记忆文件
node ~/.openclaw/workspace/second-brain.js list
```

#### 存储位置
- 日常记忆：`~/.openclaw/workspace/memory/YYYY-MM-DD.md`
- 长期记忆：`~/.openclaw/workspace/MEMORY.md`

### 实际场景
```
用户：记住明天下午 3 点开会
→ 自动保存到 memory/2026-03-03.md

用户：/search 会议
→ 搜索所有包含"会议"的记忆
```

---

## 2️⃣ 多代理协作 (Multi-Agent Team)

**功能：** 根据任务类型自动分配专业代理

### 代理团队

| 代理 | 模型 | 专长 | 触发关键词 |
|------|------|------|-----------|
| 👨‍💻 代码专家 | bailian/qwen3-coder-plus | 代码审查、调试、架构 | 代码、编程、debug、review |
| 🔍 研究员 | bailian/kimi-k2.5 | 深度研究、分析 | 研究、搜索、分析、为什么 |
| ⚡ 快速助手 | bailian/glm-4.7 | 简单问答、翻译 | 你好、谢谢、翻译、简短 |
| 🦐 麦克虾 (主) | bailian/qwen3.5-plus | 综合任务、长上下文 | 默认 |

### 使用方式

#### 自动调度（推荐）
```bash
# 根据任务自动分配代理
node ~/.openclaw/workspace/dispatch-agent.js "帮我 review 这段代码"
# → 自动分配给 👨‍💻 代码专家

node ~/.openclaw/workspace/dispatch-agent.js "搜索 AI 最新进展"
# → 自动分配给 🔍 研究员
```

#### 手动指定代理
```bash
# 切换到代码专家模式
openclaw models set bailian/qwen3-coder-plus

# 切换到研究员模式
openclaw models set bailian/kimi-k2.5

# 切换回麦克虾
openclaw models set bailian/qwen3.5-plus
```

### 实际场景
```
用户：帮我看看这个函数有什么 bug
→ 👨‍💻 代码专家处理，使用 qwen3-coder-plus

用户：为什么最近 AI 发展这么快？
→ 🔍 研究员处理，使用 kimi-k2.5

用户：你好
→ ⚡ 快速助手处理，使用 glm-4.7
```

---

## 3️⃣ 安全思维 (Security Mindset)

**功能：** 敏感操作前自动安全检查

### 检查的操作类型

| 操作 | 安全级别 | 检查项 |
|------|---------|--------|
| external_send | 🔴 高 | 收件人验证、内容审查、频率限制 |
| command_exec | 🔴 高 | 命令白名单、无破坏性、沙箱 |
| file_delete | 🔴 高 | 路径验证、使用回收站、确认 |
| file_write | 🟡 中 | 路径验证、备份检查 |
| api_call | 🟡 中 | URL 验证、认证检查、频率限制 |
| read_file | 🟢 低 | 路径验证 |
| search | 🟢 低 | 无 |

### 使用方式

#### 命令行检查
```bash
# 检查文件写入
node ~/.openclaw/workspace/security-check.js file_write '{"path":"/tmp/test.txt"}'

# 检查命令执行
node ~/.openclaw/workspace/security-check.js command_exec '{"command":"ls -la"}'

# 检查外部发送
node ~/.openclaw/workspace/security-check.js external_send '{"recipient":"123","content":"hello"}'
```

#### 自动集成
敏感操作会自动触发安全检查，如果未通过会要求用户确认。

### 实际场景
```
操作：发送邮件
→ 检查收件人是否在白名单
→ 检查内容是否包含 API Key/密码
→ 检查发送频率
→ 全部通过才发送

操作：执行 rm -rf /tmp/xxx
→ 检查命令是否在白名单
→ 检查是否有破坏性标志
→ 建议在沙箱执行
→ 用户确认后才执行
```

---

## 🎯 综合使用示例

### 场景 1: 代码项目协作
```
1. 用户：记住我要开发一个 Telegram 机器人
   → 第二大脑捕获记忆

2. 用户：帮我设计机器人架构
   → 多代理调度 → 👨‍💻 代码专家

3. 代码写入文件
   → 安全检查 → 路径验证 + 备份

4. 完成！
```

### 场景 2: 研究报告
```
1. 用户：研究一下 OpenClaw 的最佳实践
   → 多代理调度 → 🔍 研究员

2. 研究员搜索并分析
   
3. 用户：记住关键点
   → 第二大脑捕获

4. 生成报告文件
   → 安全检查 → 文件写入检查
```

---

## 📁 相关文件

```
~/.openclaw/workspace/
├── second-brain.js          # 第二大脑工具
├── dispatch-agent.js        # 多代理调度器
├── security-check.js        # 安全检查器
├── .second-brain-config.json # 第二大脑配置
├── memory/                   # 记忆文件目录
└── FEATURES-GUIDE.md        # 本文件
```

---

**🦐 麦克虾 - 稳重老成，干练可靠**

_最后更新：2026-03-03_
