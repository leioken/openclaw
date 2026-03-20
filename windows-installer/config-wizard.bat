@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo    OpenClaw 配置向导
echo ============================================
echo.

set "WORKSPACE_DIR=%USERPROFILE%\openclaw-workspace"
if not exist "%WORKSPACE_DIR%\config.json" (
    echo [!] 未找到 OpenClaw 工作目录
    echo     请先运行 install.bat 完成安装
    pause
    exit /b 1
)

cd /d "%WORKSPACE_DIR%"

:MENU
cls
echo ============================================
echo    OpenClaw 配置向导
echo ============================================
echo.
echo 当前配置:
if exist "config.json" (
    echo   配置文件：config.json [✓]
) else (
    echo   配置文件：config.json [缺失]
)
if exist ".env" (
    echo   API Key: 已配置 [✓]
) else (
    echo   API Key: 未配置 [!]
)
echo.
echo ----------------------------------------
echo 请选择要配置的项目:
echo ----------------------------------------
echo 1. Telegram 机器人配置
echo 2. 模型选择
echo 3. API Key 更新
echo 4. Chrome CDP 配置
echo 5. 查看当前配置
echo 6. 测试配置
echo 0. 退出
echo ----------------------------------------
echo.
set /p "CHOICE=请输入选项 (0-6): "

if "%CHOICE%"=="1" goto TELEGRAM
if "%CHOICE%"=="2" goto MODEL
if "%CHOICE%"=="3" goto APIKEY
if "%CHOICE%"=="4" goto CHROME
if "%CHOICE%"=="5" goto VIEW
if "%CHOICE%"=="6" goto TEST
if "%CHOICE%"=="0" goto END
goto MENU

:TELEGRAM
cls
echo.
echo --- Telegram 配置 ---
echo.
echo Telegram 机器人配置步骤:
echo 1. 在 Telegram 中搜索 @BotFather
echo 2. 发送 /newbot 创建新机器人
echo 3. 按提示设置机器人名称和用户名
echo 4. 复制 Bot Token (格式：123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)
echo.
set /p "TG_ENABLED=是否启用 Telegram? (Y/N): "
set /p "TG_TOKEN=请输入 Bot Token (直接回车跳过): "

if "!TG_TOKEN!"=="" (
    echo [!] Token 不能为空，跳过配置
    goto MENU
)

powershell -Command ^
    "$config = Get-Content 'config.json' | ConvertFrom-Json; ^
    $config.plugins.entries.telegram.enabled = $(if ('!TG_ENABLED!' -eq 'Y') {'$true'} else {'$false'}); ^
    $config.plugins.entries.telegram.token = '!TG_TOKEN!'; ^
    $config | ConvertTo-Json -Depth 10 | Set-Content 'config.json'"

echo [✓] Telegram 配置已保存
echo.
echo 提示：配置完成后运行 start-gateway.bat 启动网关
echo      然后在 Telegram 中发送 /start 给你的机器人
echo.
pause
goto MENU

:MODEL
cls
echo.
echo --- 模型选择 ---
echo.
echo 可用模型:
echo 1. bailian/qwen3.5-plus  (默认，推荐)
echo 2. bailian/qwen3-plus
echo 3. bailian/qwen-max
echo 4. bailian/qwen-turbo
echo 5. bailian/qwen-plus
echo.
set /p "MODEL_CHOICE=请选择模型 (1-5): "

if "%MODEL_CHOICE%"=="1" set "MODEL=bailian/qwen3.5-plus"
if "%MODEL_CHOICE%"=="2" set "MODEL=bailian/qwen3-plus"
if "%MODEL_CHOICE%"=="3" set "MODEL=bailian/qwen-max"
if "%MODEL_CHOICE%"=="4" set "MODEL=bailian/qwen-turbo"
if "%MODEL_CHOICE%"=="5" set "MODEL=bailian/qwen-plus"

if "!MODEL!"=="" (
    echo [!] 无效选择，使用默认模型
    set "MODEL=bailian/qwen3.5-plus"
)

powershell -Command ^
    "$config = Get-Content 'config.json' | ConvertFrom-Json; ^
    $config.model = '!MODEL!'; ^
    $config | ConvertTo-Json -Depth 10 | Set-Content 'config.json'"

echo [✓] 模型已设置为：!MODEL!
echo.
pause
goto MENU

:APIKEY
cls
echo.
echo --- 更新 API Key ---
echo.
if exist ".env" (
    echo 当前 API Key:
    type .env
    echo.
)
set /p "API_KEY=请输入新的 API Key: "
if "!API_KEY!"=="" (
    echo [!] API Key 不能为空
    pause
    goto MENU
)

echo BAILIAN_API_KEY=!API_KEY!> "%WORKSPACE_DIR%\.env"
echo [✓] API Key 已更新
echo.
pause
goto MENU

:CHROME
cls
echo.
echo --- Chrome CDP 配置 ---
echo.
if exist "%~dp0setup-chrome.bat" (
    call "%~dp0setup-chrome.bat"
) else (
    echo [!] setup-chrome.bat 不存在
    echo     位置：%~dp0setup-chrome.bat
)
echo.
pause
goto MENU

:VIEW
cls
echo.
echo --- 当前配置 ---
echo.
echo === config.json ===
type "%WORKSPACE_DIR%\config.json"
echo.
echo === .env ===
if exist "%WORKSPACE_DIR%\.env" (
    type "%WORKSPACE_DIR%\.env"
) else (
    echo 文件不存在
)
echo.
echo === 已安装的技能 ===
if exist "%WORKSPACE_DIR%\skills" (
    dir /b "%WORKSPACE_DIR%\skills"
) else (
    echo 技能目录不存在
)
echo.
pause
goto MENU

:TEST
cls
echo.
echo --- 配置测试 ---
echo.
echo 1. 检查 Node.js...
node --version >nul 2>&1 && echo   [✓] Node.js 已安装 || echo   [!] Node.js 未安装

echo 2. 检查 OpenClaw...
openclaw --version >nul 2>&1 && echo   [✓] OpenClaw 已安装 || echo   [!] OpenClaw 未安装

echo 3. 检查配置文件...
if exist "config.json" (
    echo   [✓] config.json 存在
) else (
    echo   [!] config.json 缺失
)

echo 4. 检查 API Key...
if exist ".env" (
    echo   [✓] .env 存在
) else (
    echo   [!] .env 缺失
)

echo 5. 检查 Gateway 状态...
openclaw gateway status >nul 2>&1 && echo   [✓] Gateway 运行中 || echo   [!] Gateway 未运行

echo.
pause
goto MENU

:END
cls
echo.
echo ============================================
echo    配置完成！
echo ============================================
echo.
echo 记得重启网关使配置生效:
echo   openclaw gateway restart
echo   或运行：stop-gateway.bat 然后 start-gateway.bat
echo.
pause
