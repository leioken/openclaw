@echo off
chcp 65001 >nul
title OpenClaw Gateway - 停止

set "WORKSPACE_DIR=%USERPROFILE%\openclaw-workspace"
cd /d "%WORKSPACE_DIR%"

echo 正在停止 OpenClaw Gateway...
echo.

openclaw gateway stop

if %errorlevel% equ 0 (
    echo [✓] 网关已停止
) else (
    echo [!] 停止失败或网关未运行
)

echo.
pause
