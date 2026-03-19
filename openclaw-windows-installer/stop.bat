@echo off
chcp 65001 >nul
title OpenClaw Gateway - 停止服务

echo.
echo ========================================
echo    OpenClaw Gateway 停止中...
echo ========================================
echo.

:: 查找并停止 OpenClaw 进程
echo [正在查找 OpenClaw 进程...]
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find "openclaw"') do (
    echo [正在停止进程 %%i...]
    taskkill /f /pid %%i >nul 2>&1
)

echo.
echo [√] 服务已停止
echo.

pause
