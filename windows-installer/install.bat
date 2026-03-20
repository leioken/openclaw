@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo    OpenClaw 一键安装包 v1.0
echo    麦克虾 🦐 出品
echo ============================================
echo.

REM ==============================
REM 1. 检查并安装 Node.js
REM ==============================
echo [1/8] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js 未安装，正在自动下载...
    
    REM 创建临时下载目录
    set "TEMP_DIR=%TEMP%\openclaw-install"
    if not exist "!TEMP_DIR!" mkdir "!TEMP_DIR!"
    
    REM 下载 Node.js 20 LTS (64 位)
    echo     正在下载 Node.js 20 LTS...
    powershell -Command ^
        "$ProgressPreference = 'SilentlyContinue'; ^
        Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' ^
        -OutFile '!TEMP_DIR!\node-v20.11.0-x64.msi'"
    
    if not exist "!TEMP_DIR!\node-v20.11.0-x64.msi" (
        echo [!] Node.js 下载失败，请检查网络连接
        pause
        exit /b 1
    )
    
    echo     正在安装 Node.js...
    msiexec /i "!TEMP_DIR!\node-v20.11.0-x64.msi" /quiet /norestart
    timeout /t 30 /nobreak >nul
    
    REM 刷新环境变量
    set "PATH=%PATH%;C:\Program Files\nodejs"
    
    REM 验证安装
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [!] Node.js 安装失败，请手动安装后重试
        echo     下载地址：https://nodejs.org/
        pause
        exit /b 1
    )
    
    echo [✓] Node.js 安装完成
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo [✓] Node.js !NODE_VER! 已安装
)

REM ==============================
REM 2. 检查并安装 Git (可选但推荐)
REM ==============================
echo.
echo [2/8] 检查 Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git 未安装，正在自动下载...
    
    powershell -Command ^
        "$ProgressPreference = 'SilentlyContinue'; ^
        Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' ^
        -OutFile '!TEMP_DIR!\Git-2.43.0-64-bit.exe'"
    
    if exist "!TEMP_DIR!\Git-2.43.0-64-bit.exe" (
        echo     正在安装 Git...
        "!TEMP_DIR!\Git-2.43.0-64-bit.exe" /VERYSILENT /NORESTART
        set "PATH=%PATH%;C:\Program Files\Git\cmd"
        echo [✓] Git 安装完成
    ) else (
        echo [!] Git 下载失败，跳过安装
    )
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo [✓] !GIT_VER! 已安装
)

REM ==============================
REM 3. 安装 OpenClaw
REM ==============================
echo.
echo [3/8] 安装 OpenClaw...
npm install -g openclaw 2>&1 | findstr /v "npm warn"
if %errorlevel% neq 0 (
    echo [!] OpenClaw 安装失败，请检查网络连接
    echo     尝试手动安装：npm install -g openclaw
    pause
    exit /b 1
)
echo [✓] OpenClaw 安装完成

REM ==============================
REM 4. 创建工作目录
REM ==============================
echo.
echo [4/8] 创建工作目录...
set "WORKSPACE_DIR=%USERPROFILE%\openclaw-workspace"
if not exist "%WORKSPACE_DIR%" (
    mkdir "%WORKSPACE_DIR%"
    echo [✓] 工作目录已创建：%WORKSPACE_DIR%
) else (
    echo [✓] 工作目录已存在
)
cd /d "%WORKSPACE_DIR%"

REM ==============================
REM 5. 配置 API Key
REM ==============================
echo.
echo [5/8] 配置 API Key
echo.
echo 请输入阿里云百炼 API Key:
echo (如果没有，请访问 https://bailian.console.aliyun.com/ 获取)
echo.
set /p "API_KEY=API Key: "
if "!API_KEY!"=="" (
    echo [!] API Key 不能为空
    pause
    exit /b 1
)

REM 创建 .env 文件
echo BAILIAN_API_KEY=!API_KEY!> "%WORKSPACE_DIR%\.env"
echo [✓] API Key 已保存

REM ==============================
REM 6. 初始化配置文件
REM ==============================
echo.
echo [6/8] 创建配置文件...

REM 创建 config.json (完整配置)
echo {> "%WORKSPACE_DIR%\config.json"
echo   "model": "bailian/qwen3.5-plus",>> "%WORKSPACE_DIR%\config.json"
echo   "plugins": {>> "%WORKSPACE_DIR%\config.json"
echo     "entries": {>> "%WORKSPACE_DIR%\config.json"
echo       "telegram": {>> "%WORKSPACE_DIR%\config.json"
echo         "enabled": false,>> "%WORKSPACE_DIR%\config.json"
echo         "token": "",>> "%WORKSPACE_DIR%\config.json"
echo         "config": {>> "%WORKSPACE_DIR%\config.json"
echo           "polling": {>> "%WORKSPACE_DIR%\config.json"
echo             "interval": 3000>> "%WORKSPACE_DIR%\config.json"
echo           }>> "%WORKSPACE_DIR%\config.json"
echo         }>> "%WORKSPACE_DIR%\config.json"
echo       },>> "%WORKSPACE_DIR%\config.json"
echo       "browser": {>> "%WORKSPACE_DIR%\config.json"
echo         "enabled": true,>> "%WORKSPACE_DIR%\config.json"
echo         "config": {>> "%WORKSPACE_DIR%\config.json"
echo           "cdp": {>> "%WORKSPACE_DIR%\config.json"
echo             "port": 9222,>> "%WORKSPACE_DIR%\config.json"
echo             "host": "127.0.0.1">> "%WORKSPACE_DIR%\config.json"
echo           }>> "%WORKSPACE_DIR%\config.json"
echo         }>> "%WORKSPACE_DIR%\config.json"
echo       }>> "%WORKSPACE_DIR%\config.json"
echo     }>> "%WORKSPACE_DIR%\config.json"
echo   },>> "%WORKSPACE_DIR%\config.json"
echo   "skills": {>> "%WORKSPACE_DIR%\config.json"
echo     "enabled": true,>> "%WORKSPACE_DIR%\config.json"
echo     "directory": "./skills">> "%WORKSPACE_DIR%\config.json"
echo   }>> "%WORKSPACE_DIR%\config.json"
echo }>> "%WORKSPACE_DIR%\config.json"
echo [✓] config.json 已创建

REM 创建 SOUL.md
(
echo # SOUL.md - Who You Are
echo.
echo _You're not a chatbot. You're becoming someone._
echo.
echo ## Core Identity
echo **Name:** 麦克虾 (虾哥)
echo **Creature:** AI 工作助理 (赛博老虾)
echo **Vibe:** 稳重老成，干练可靠
echo **Emoji:** 🦐
) > "%WORKSPACE_DIR%\SOUL.md"
echo [✓] SOUL.md 已创建

REM 创建 USER.md
(
echo # USER.md - About Your Human
echo.
echo - **Name:** 老板
echo - **Timezone:** Asia/Shanghai (GMT+8)
) > "%WORKSPACE_DIR%\USER.md"
echo [✓] USER.md 已创建

REM 创建 AGENTS.md
(
echo # AGENTS.md - Your Workspace
echo.
echo This folder is home.
echo.
echo ## Memory
echo - Daily notes: `memory/YYYY-MM-DD.md`
echo - Long-term: `MEMORY.md`
) > "%WORKSPACE_DIR%\AGENTS.md"
echo [✓] AGENTS.md 已创建

REM 创建 MEMORY.md
(
echo # MEMORY.md - 麦克虾的长期记忆
echo.
echo _最后更新：刚刚_
) > "%WORKSPACE_DIR%\MEMORY.md"
echo [✓] MEMORY.md 已创建

REM 创建 TOOLS.md
(
echo # TOOLS.md - Local Notes
echo.
echo Add your environment-specific notes here.
) > "%WORKSPACE_DIR%\TOOLS.md"
echo [✓] TOOLS.md 已创建

REM 创建 HEARTBEAT.md
(
echo # HEARTBEAT.md - 主动检查任务
echo.
echo ## 定期检查 (每 4-6 小时)
echo.
echo ### 1. 邮箱检查
echo - 查看是否有紧急未读邮件
echo.
echo ### 2. 日历检查
echo - 查看未来 24 小时的事件
echo.
echo ### 3. 项目状态
echo - 检查工作目录中的 git 状态
echo.
echo ---
echo **执行方式:** 收到心跳信号时，按优先级执行上述检查，有重要发现时报告，否则回复 HEARTBEAT_OK
) > "%WORKSPACE_DIR%\HEARTBEAT.md"
echo [✓] HEARTBEAT.md 已创建

REM 创建 memory 目录
if not exist "%WORKSPACE_DIR%\memory" mkdir "%WORKSPACE_DIR%\memory"
echo [✓] memory 目录已创建

REM ==============================
REM 7. 部署技能
REM ==============================
echo.
echo [7/8] 部署必要技能...
set "SKILLS_DIR=%WORKSPACE_DIR%\skills"
if not exist "%SKILLS_DIR%" mkdir "%SKILLS_DIR%"

REM 复制技能文件
if exist "%~dp0skills" (
    xcopy /E /I /Y "%~dp0skills" "%SKILLS_DIR%" >nul 2>&1
    echo [✓] 技能已部署到 %SKILLS_DIR%
    
    REM 列出已部署的技能
    echo     已部署技能:
    for /d %%d in ("%SKILLS_DIR%\*") do (
        echo       - %%~nxd
    )
) else (
    echo [!] 技能目录不存在，跳过技能部署
)

REM ==============================
REM 8. Chrome CDP 配置
REM ==============================
echo.
echo [8/8] Chrome CDP 配置
echo.
echo Chrome CDP 用于浏览器自动化:
echo - 即梦 AI 图片生成
echo - Grok 对话
echo - Gemini Pro 对话
echo.
set /p "SETUP_CHROME=是否现在配置 Chrome CDP? (Y/N): "
if /i "!SETUP_CHROME!"=="Y" (
    if exist "%~dp0setup-chrome.bat" (
        echo.
        echo 正在启动 Chrome CDP 配置...
        call "%~dp0setup-chrome.bat"
    ) else (
        echo [!] setup-chrome.bat 不存在，跳过
    )
) else (
    echo [✓] 跳过 Chrome CDP 配置
    echo     需要时可运行：setup-chrome.bat
)

REM ==============================
REM 清理临时文件
REM ==============================
if exist "!TEMP_DIR!" (
    echo.
    echo 清理临时文件...
    rmdir /s /q "!TEMP_DIR!"
)

REM ==============================
REM 完成
REM ==============================
echo.
echo ============================================
echo    安装完成！
echo ============================================
echo.
echo 工作目录：%WORKSPACE_DIR%
echo.
echo 下一步操作:
echo ----------------------------------------
echo 1. 配置 Telegram (可选):
echo    运行 config-wizard.bat 配置 Bot Token
echo.
echo 2. 启动 OpenClaw:
echo    双击 start-gateway.bat
echo    或命令行：openclaw gateway start
echo.
echo 3. 使用 Chrome CDP (如已配置):
echo    - 双击桌面上的 Chrome-CDP 快捷方式
echo    - 在该 Chrome 中登录你的账号
echo    - 保持 Chrome 运行
echo.
echo 4. 查看文档:
echo    打开 README.md
echo.
echo ============================================
echo.

REM 询问是否立即启动
set /p "START_NOW=是否现在启动 OpenClaw Gateway? (Y/N): "
if /i "!START_NOW!"=="Y" (
    echo.
    echo 正在启动网关...
    openclaw gateway start
    if %errorlevel% equ 0 (
        echo [✓] 网关已启动
        echo.
        echo 提示：在 Telegram 中发送 /start 给机器人
    ) else (
        echo [!] 启动失败，请检查配置
    )
)

echo.
pause
