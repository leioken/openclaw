# 🦞 OpenClaw Windows 一键安装包 - 快速部署指南

## 📦 安装包内容

```
openclaw-windows-installer/
├── install.bat           # 主安装脚本（双击运行）
├── start.bat             # 启动服务脚本
├── stop.bat              # 停止服务脚本
├── README.md             # 完整使用说明
├── config/
│   ├── openclaw.json     # OpenClaw 配置
│   ├── CHROME-CDP-SETUP.md  # Chrome 配置指南
│   └── API-SETUP.md      # API 接口配置指南
└── skills/               # 自定义 Skills（安装时自动下载）
```

---

## 🚀 5 分钟快速部署

### 步骤 1：下载和解压（1 分钟）

1. 复制整个 `openclaw-windows-installer` 文件夹到 Windows 电脑
2. 建议放到：`D:\openclaw\`

### 步骤 2：运行安装（2 分钟）

1. **右键 → 以管理员身份运行** `install.bat`
2. 等待自动完成以下操作：
   - ✅ 检查 Node.js 环境
   - ✅ 安装 OpenClaw
   - ✅ 安装 Chrome CDP Skill
   - ✅ 配置开机自启动

### 步骤 3：配置 Chrome（1 分钟）

1. 打开 Chrome 浏览器
2. 地址栏输入：`chrome://inspect/#remote-debugging`
3. 勾选：`Allow remote debugging for this browser instance`
4. 保持 Chrome 运行

### 步骤 4：启动服务（1 分钟）

1. 双击运行 `start.bat`
2. 等待看到 `Gateway online` 提示
3. 访问：`http://localhost:18789`

**完成！** 🎉

---

## 🔧 API 使用

### 端点

```
POST http://localhost:18789/api/generate
```

### 请求示例

```json
{
  "platform": "jimeng",
  "prompt": "金刚大战哥斯拉，电影海报风格",
  "params": {
    "ratio": "16:9",
    "style": "realistic"
  }
}
```

### 响应示例

```json
{
  "status": "success",
  "result_url": "http://localhost:18789/files/xxx.png",
  "task_id": "task_12345"
}
```

---

## 📋 支持的平台

| 平台 | 配置难度 | 稳定性 | 说明 |
|------|---------|--------|------|
| 即梦 | ⭐⭐ | ⭐⭐⭐⭐ | 需要会员账号 |
| Grok (X) | ⭐⭐ | ⭐⭐⭐ | 需要会员账号 |
| Gemini | ⭐⭐ | ⭐⭐⭐⭐ | 需要 Pro 账号 |

---

## 🛡️ 防封号建议

1. **低频使用** - 每个账号每天不超过 50 次请求
2. **随机间隔** - 请求间隔 30-120 秒随机
3. **单账号单用途** - 不要一个账号同时跑多个服务
4. **失败重试** - 失败后等待 5 分钟再试

---

## 💰 Token 消耗

| 模式 | Token 消耗 | 说明 |
|------|-----------|------|
| 固定模板 | 0 | 预定义操作，不走 LLM |
| 本地规则 | ~0 | 80% 请求为 0 token |
| LLM 解析 | ~500 | 复杂请求才调用 |

**预计成本：** 每月 < $10（使用便宜模型如 qwen3.5-plus）

---

## 🔍 故障排查

### 问题 1：安装失败

**可能原因：**
- Node.js 未安装或版本过低
- 网络连接问题

**解决方法：**
1. 安装 Node.js 22+：https://nodejs.org/
2. 以管理员身份重新运行 `install.bat`

### 问题 2：Chrome 无法连接

**可能原因：**
- Chrome 版本过低
- 未启用远程调试

**解决方法：**
1. 更新 Chrome 到 146+
2. 访问 `chrome://inspect/#remote-debugging`
3. 勾选 `Allow remote debugging`

### 问题 3：服务无法启动

**可能原因：**
- 端口 18789 被占用
- 旧进程未停止

**解决方法：**
1. 运行 `stop.bat` 停止旧进程
2. 检查端口占用：`netstat -ano | findstr 18789`
3. 重新启动 `start.bat`

---

## 📞 技术支持

- 查看日志：`workspace/logs/`
- 查看配置：`config/` 目录下的指南
- 重启服务：先 `stop.bat` 再 `start.bat`

---

## 🎯 下一步

安装完成后，参考 `config/API-SETUP.md` 配置具体平台的 API 接口。

**祝使用愉快！** 🦐
