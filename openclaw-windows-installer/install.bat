@echo off
chcp 65001 >nul
title OpenClaw Windows 一键安装程序

echo.
echo ========================================
echo    OpenClaw Windows 一键安装程序
echo    AI 生成服务节点自动部署工具
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [√] 管理员权限已获取
) else (
    echo [!] 建议以管理员身份运行此脚本
    echo.
)

:: 检查 Node.js
echo.
echo [1/5] 检查 Node.js 环境...
node -v >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [√] 已安装 Node.js: %NODE_VERSION%
) else (
    echo [!] 未检测到 Node.js
    echo.
    echo 正在下载并安装 Node.js 22 LTS...
    echo.
    echo 请前往 https://nodejs.org/ 下载 Node.js 22 LTS
    echo 安装完成后重新运行此脚本
    echo.
    pause
    exit /b 1
)

:: 检查 npm
echo.
echo [2/5] 检查 npm...
npm -v >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [√] 已安装 npm: %NPM_VERSION%
) else (
    echo [×] npm 未安装，请重新安装 Node.js
    pause
    exit /b 1
)

:: 安装 OpenClaw
echo.
echo [3/5] 安装 OpenClaw...
echo 这可能需要几分钟，请耐心等待...
npm install -g openclaw --loglevel=error
if %errorLevel% == 0 (
    echo [√] OpenClaw 安装成功
) else (
    echo [×] OpenClaw 安装失败
    echo 请检查网络连接后重试
    pause
    exit /b 1
)

:: 创建 OpenClaw 工作区
echo.
echo [4/5] 初始化 OpenClaw 工作区...
set WORKSPACE_DIR=%~dp0workspace
if not exist "%WORKSPACE_DIR%" (
    mkdir "%WORKSPACE_DIR%"
    echo [√] 工作区目录已创建：%WORKSPACE_DIR%
) else (
    echo [√] 工作区目录已存在
)

:: 安装 chrome-cdp-skill (Windows 增强版)
echo.
echo [5/5] 安装 Chrome CDP Skill (Windows 增强版)...
npx skills add https://github.com/hanyu0001/chrome-cdp-skill -g --all --copy --yes
if %errorLevel% == 0 (
    echo [√] Chrome CDP Skill 安装成功
) else (
    echo [!] Chrome CDP Skill 安装失败（可稍后手动安装）
)

:: 创建开机自启动
echo.
echo ========================================
echo    创建开机自启动...
echo ========================================
echo.

set SCRIPT_DIR=%~dp0
set START_BAT=%SCRIPT_DIR%start.bat

:: 创建任务计划
schtasks /create /tn "OpenClaw Gateway" /tr "\"%START_BAT%\"" /sc onlogon /rl highest /f >nul 2>&1
if %errorLevel% == 0 (
    echo [√] 开机自启动已配置
) else (
    echo [!] 开机自启动配置失败（可手动运行 start.bat）
)

:: 安装完成
echo.
echo ========================================
echo    安装完成！
echo ========================================
echo.
echo 下一步操作：
echo.
echo 1. 打开 Chrome 浏览器（确保版本 146+）
echo 2. 地址栏输入：chrome://inspect/#remote-debugging
echo 3. 勾选：Allow remote debugging for this browser instance
echo 4. 记录监听地址（通常是 127.0.0.1:9222）
echo.
echo 5. 运行 start.bat 启动服务
echo 6. 访问：http://localhost:18789
echo.
echo API 端点：http://localhost:18789/api/generate
echo.
echo 请求示例:
echo POST {"platform": "jimeng", "prompt": "金刚大战哥斯拉"}
echo.
echo ========================================
echo.

pause
