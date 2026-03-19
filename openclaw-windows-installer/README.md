# OpenClaw Windows 一键安装包

## 📦 快速开始

### 安装步骤

1. **解压安装包**到任意目录（如 `D:\openclaw`）

2. **双击运行 `install.bat`**
   - 自动检查 Node.js 环境
   - 自动安装 OpenClaw
   - 自动安装 Chrome CDP Skill
   - 自动配置开机自启动

3. **配置 Chrome 浏览器**
   - 打开 Chrome 146+ 浏览器
   - 地址栏输入：`chrome://inspect/#remote-debugging`
   - 勾选：`Allow remote debugging for this browser instance`
   - 记录监听地址（通常是 `127.0.0.1:9222`）

4. **启动服务**
   - 双击运行 `start.bat`
   - 访问：`http://localhost:18789`

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

| 平台 | 状态 | 说明 |
|------|------|------|
| 即梦 | ⏳ 待配置 | 需要会员账号 |
| Grok (X) | ⏳ 待配置 | 需要会员账号 |
| Gemini | ⏳ 待配置 | 需要 Pro 账号 |

---

## 🛡️ 注意事项

1. **保持电脑唤醒** - 设置电源选项为"从不睡眠"
2. **保持 Chrome 登录** - 不要用无痕模式
3. **并发控制** - 建议同时只跑 1-2 个任务
4. **账号安全** - 不要高频使用，避免封号

---

## 🔍 故障排查

### 问题：安装失败

**解决：**
1. 确保已安装 Node.js 22+
2. 以管理员身份运行 `install.bat`
3. 检查网络连接

### 问题：Chrome 无法连接

**解决：**
1. 确保 Chrome 版本 146+
2. 确认已勾选"允许远程调试"
3. 检查 9222 端口是否被占用

### 问题：服务无法启动

**解决：**
1. 运行 `stop.bat` 停止旧进程
2. 检查 18789 端口是否被占用
3. 查看日志文件：`workspace/logs/`

---

## 📞 技术支持

遇到问题请查看日志文件或联系管理员。
