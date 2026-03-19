@echo off
chcp 65001 >nul
title OpenClaw Gateway - 启动服务

echo.
echo ========================================
echo    OpenClaw Gateway 启动中...
echo ========================================
echo.

cd /d "%~dp0workspace"

:: 启动 Gateway
echo [正在启动 OpenClaw Gateway...]
openclaw gateway

echo.
echo ========================================
echo    服务已停止
echo ========================================
echo.

pause
