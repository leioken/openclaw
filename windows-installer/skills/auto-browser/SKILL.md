# 自动浏览器技能 - 即梦/Grok/Gemini 接入

## 功能
通过 Chrome CDP 自动操作浏览器，将会员账号服务接入 API：
- 即梦 AI 图片生成
- Grok 对话
- Gemini Pro 对话
- 其他需要登录的网站服务

## 配置

### 1. 确保 Chrome CDP 已启动
运行 `setup-chrome.bat` 创建 Chrome 快捷方式，并通过该快捷方式启动 Chrome。

### 2. 登录目标网站
在 Chrome 中登录：
- 即梦：https://jimeng.jianying.com/
- Grok: https://x.com/
- Gemini: https://gemini.google.com/

### 3. 使用示例

```bash
# 即梦图片生成
openclaw browser navigate --url "https://jimeng.jianying.com/"
openclaw browser act --kind click --ref "生成按钮"
openclaw browser act --kind type --text "一只可爱的猫咪"
openclaw browser act --kind click --ref "确认生成"

# 截图查看结果
openclaw browser screenshot --output result.png
```

## 自动化脚本示例

创建 `generate-image.bat`:
```batch
@echo off
set "PROMPT=%1"
openclaw browser navigate --url "https://jimeng.jianying.com/"
timeout /t 3 /nobreak >nul
openclaw browser act --kind click --selector "#create-btn"
openclaw browser act --kind type --selector "#prompt-input" --text "%PROMPT%"
openclaw browser act --kind click --selector "#generate-btn"
timeout /t 10 /nobreak >nul
openclaw browser screenshot --output "output/%date:~0,4%%date:~5,2%%date:~8,2%.png"
```

使用：
```cmd
generate-image.bat "一只在草地上奔跑的金毛犬"
```

## 注意事项

- 首次使用需要手动登录网站
- Chrome 必须保持运行状态
- 网站 UI 变化可能需要更新选择器
- 建议为每个网站创建独立的 CDP 配置文件
