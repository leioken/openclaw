@echo off
chcp 65001 >nul
title OpenClaw Gateway - 麦克虾 🦐

set "WORKSPACE_DIR=%USERPROFILE%\openclaw-workspace"

if not exist "%WORKSPACE_DIR%\config.json" (
    echo [!] 未找到 OpenClaw 配置
    echo     请先运行 install.bat 完成安装
    pause
    exit /b 1
)

cd /d "%WORKSPACE_DIR%"

echo ============================================
echo    OpenClaw Gateway
echo    麦克虾 🦐
echo ============================================
echo.
echo 工作目录：%WORKSPACE_DIR%
echo.
echo 正在启动网关...
echo.

openclaw gateway start

if %errorlevel% equ 0 (
    echo.
    echo [✓] 网关已启动
    echo.
    echo 提示:
    echo - 在 Telegram 中发送 /start 给机器人
    echo - 运行 config-wizard.bat 修改配置
    echo - 运行 stop-gateway.bat 停止网关
    echo.
) else (
    echo [!] 启动失败，请检查日志
    openclaw gateway logs --tail 50
)

echo.
pause
