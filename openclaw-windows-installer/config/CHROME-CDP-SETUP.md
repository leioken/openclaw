# Chrome CDP 配置指南

## 第一步：打开 Chrome 调试页面

在 Chrome 地址栏输入：
```
chrome://inspect/#remote-debugging
```

## 第二步：启用远程调试

勾选：
```
☑ Allow remote debugging for this browser instance
```

## 第三步：记录监听地址

页面会显示：
```
Server running at: 127.0.0.1:9222
```

## 第四步：保持 Chrome 运行

**重要：** Chrome 必须保持运行状态，服务才能正常工作。

## 第五步：配置到 OpenClaw

编辑 `config/openclaw.json`，添加 CDP 配置：

```json
{
  "plugins": {
    "chrome-cdp": {
      "enabled": true,
      "cdpEndpoint": "ws://127.0.0.1:9222"
    }
  }
}
```

---

## 常见问题

### Q: 找不到远程调试选项？
A: 确保 Chrome 版本是 146+

### Q: 端口 9222 被占用？
A: 关闭其他 Chrome 实例，或改用其他端口

### Q: 每次打开都要确认？
A: 每个标签页只需授权一次
