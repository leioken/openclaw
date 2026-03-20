# Chrome CDP 技能 - 浏览器自动化

## 功能
通过 Chrome DevTools Protocol 直连浏览器，实现：
- 页面导航、点击、输入
- 内容提取、截图
- 登录态保持（复用用户已登录的 Chrome）

## 配置

### 1. 启动 Chrome 带远程调试端口

**Windows 快捷方式目标：**
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-cdp-profile"
```

### 2. 配置 OpenClaw

在 `config.json` 中添加：
```json
{
  "plugins": {
    "entries": {
      "chrome-cdp": {
        "enabled": true,
        "config": {
          "port": 9222,
          "host": "127.0.0.1"
        }
      }
    }
  }
}
```

## 使用示例

```bash
# 导航到页面
openclaw browser navigate --url "https://example.com"

# 截图
openclaw browser screenshot --output page.png

# 提取内容
openclaw browser snapshot --format markdown
```

## 支持的操作

| 操作 | 命令 |
|------|------|
| 导航 | `browser navigate --url <url>` |
| 点击 | `browser act --kind click --ref <element>` |
| 输入 | `browser act --kind type --text <text>` |
| 截图 | `browser screenshot --output <file>` |
| 快照 | `browser snapshot --refs aria` |

## 注意事项

- Chrome 必须先启动并开启远程调试端口
- 首次使用需要授权 OpenClaw 连接
- 不要关闭 Chrome 主窗口，否则连接会断开
