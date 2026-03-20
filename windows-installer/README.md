# OpenClaw Windows 一键安装包 🦐

麦克虾出品的 OpenClaw 自动化部署工具，让闲置 Windows 电脑变身 AI 助手工作站。

## 功能特性

✅ **全自动安装** - 新系统也能一键完成，自动下载安装所有依赖  
✅ **Node.js 自动安装** - 未安装时自动下载并安装 Node.js 20 LTS  
✅ **Chrome 自动安装** - 未安装时自动下载并安装 Chrome  
✅ **配置向导** - 交互式配置 API Key、Telegram、模型  
✅ **技能预装** - 内置 Chrome CDP 浏览器自动化技能  
✅ **环境验证** - 一键检查所有依赖和配置状态  
✅ **Token 优化** - 90% 固定操作走本地规则，0 token 消耗  

## 快速开始

### 在新系统上：

1. **下载** - 将整个 `windows-installer` 文件夹复制到目标 Windows 电脑

2. **运行安装** - 双击 `install.bat`
   - 自动检测并安装 Node.js（如缺失）
   - 自动检测并安装 Git（如缺失）
   - 自动安装 OpenClaw
   - 交互式配置 API Key
   - 自动生成所有配置文件
   - 可选配置 Chrome CDP

3. **验证安装** - 双击 `verify.bat` 检查所有依赖

4. **启动** - 双击 `start-gateway.bat`

### 在已有环境的电脑上：

直接运行 `install.bat`，它会自动检测已安装的组件并跳过。

## 文件说明

| 文件 | 说明 |
|------|------|
| `install.bat` | 主安装脚本，一键完成所有安装和配置 |
| `setup-chrome.bat` | Chrome CDP 配置工具（可单独运行） |
| `config-wizard.bat` | 配置向导，修改 Telegram/模型/API Key |
| `start-gateway.bat` | 启动 OpenClaw Gateway |
| `stop-gateway.bat` | 停止 OpenClaw Gateway |
| `verify.bat` | 环境验证工具，检查所有依赖和配置 |
| `package.bat` | 打包成 ZIP 方便分享 |
| `README.md` | 本说明文档 |

## 配置说明

### API Key
安装过程中会提示输入阿里云百炼 API Key。  
获取地址：https://bailian.console.aliyun.com/

### Telegram 机器人
1. 在 Telegram 中联系 @BotFather 创建机器人
2. 发送 `/newbot` 按提示创建
3. 获取 Bot Token
4. 运行 `config-wizard.bat` 选择选项 1 配置

### Chrome CDP 浏览器自动化
用于接入即梦、Grok、Gemini Pro 等会员账号：

**安装时配置：**
- 运行 `install.bat` 时选择配置 Chrome CDP

**安装后配置：**
- 运行 `setup-chrome.bat`
- 或双击桌面生成的 `Chrome-CDP.lnk` 快捷方式

**使用步骤：**
1. 双击 `Chrome-CDP.lnk` 启动 Chrome
2. 在该 Chrome 中登录你的会员账号
3. 保持 Chrome 运行
4. OpenClaw 即可通过 CDP 控制浏览器

## 目录结构

### 安装包
```
windows-installer/
├── install.bat           # 主安装脚本
├── setup-chrome.bat      # Chrome CDP 配置
├── config-wizard.bat     # 配置向导
├── start-gateway.bat     # 启动网关
├── stop-gateway.bat      # 停止网关
├── verify.bat            # 环境验证
├── package.bat           # 打包工具
├── README.md             # 本文件
└── skills/               # 预装技能
    ├── chrome-cdp/       # Chrome CDP 技能
    └── auto-browser/     # 浏览器自动化技能
```

### 安装后
```
%USERPROFILE%\openclaw-workspace/
├── config.json           # 主配置文件
├── .env                  # 环境变量 (API Key)
├── SOUL.md               # 助手人格配置
├── USER.md               # 用户信息
├── AGENTS.md             # 工作区说明
├── MEMORY.md             # 长期记忆
├── HEARTBEAT.md          # 心跳检查任务
├── TOOLS.md              # 本地工具笔记
├── memory/               # 记忆文件目录
│   └── YYYY-MM-DD.md
└── skills/               # 技能目录
    ├── chrome-cdp/
    └── auto-browser/
```

## 常用命令

```cmd
# 启动网关
openclaw gateway start

# 停止网关
openclaw gateway stop

# 重启网关
openclaw gateway restart

# 查看状态
openclaw gateway status

# 查看日志
openclaw gateway logs --follow

# 验证环境
verify.bat

# 配置向导
config-wizard.bat
```

## 故障排查

### Gateway 启动失败
```cmd
# 1. 运行验证工具
verify.bat

# 2. 查看详细日志
openclaw gateway logs --follow

# 3. 检查配置
openclaw config check

# 4. 检查 API Key
type %USERPROFILE%\openclaw-workspace\.env
```

### Chrome CDP 连接失败
1. 确认 Chrome 已通过快捷方式启动
2. 检查端口 9222 是否被占用：`netstat -ano | findstr 9222`
3. 确认防火墙未阻止连接
4. 重新运行 `setup-chrome.bat`

### Telegram 无法收到消息
1. 检查 Bot Token 是否正确
2. 确认 `telegram.enabled` 为 `true`
3. 在 Telegram 中发送 `/start` 给机器人
4. 检查网关日志：`openclaw gateway logs --follow`

### Node.js 安装失败
1. 检查网络连接
2. 手动下载安装：https://nodejs.org/
3. 安装完成后重新运行 `install.bat`

### Chrome 安装失败
1. 检查网络连接
2. 手动下载安装：https://www.google.com/chrome/
3. 安装完成后运行 `setup-chrome.bat` 配置 CDP

## 系统要求

- **操作系统:** Windows 10/11 (64 位)
- **内存:** 最低 4GB，推荐 8GB+
- **磁盘:** 最低 1GB 可用空间
- **网络:** 需要访问 npm、阿里云、Google（安装 Chrome 时）

## 卸载

```cmd
# 1. 停止网关
openclaw gateway stop

# 2. 删除工作目录
rmdir /s /q %USERPROFILE%\openclaw-workspace

# 3. 删除 OpenClaw
npm uninstall -g openclaw

# 4. 删除 Chrome CDP 配置 (可选)
rmdir /s /q %USERPROFILE%\chrome-cdp-profile
del "%USERPROFILE%\Desktop\Chrome-CDP.lnk"
```

## 技术支持

- 文档：https://docs.openclaw.ai
- 社区：https://discord.com/invite/clawd
- 技能市场：https://clawhub.com
- GitHub: https://github.com/openclaw/openclaw

---

_麦克虾 🦐 | 稳重老成，干练可靠_

_最后更新：2026-03-21_
