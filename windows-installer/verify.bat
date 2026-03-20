@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo    OpenClaw 环境验证工具
echo ============================================
echo.

set "WORKSPACE_DIR=%USERPROFILE%\openclaw-workspace"
set "ERRORS=0"

echo [环境检查]
echo ----------------------------------------

REM 1. Node.js
echo - 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo   [✓] Node.js !NODE_VER!
) else (
    echo   [!] Node.js 未安装
    set /a ERRORS+=1
)

REM 2. npm
echo - 检查 npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo   [✓] npm !NPM_VER!
) else (
    echo   [!] npm 未安装
    set /a ERRORS+=1
)

REM 3. Git (可选)
echo - 检查 Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo   [✓] !GIT_VER!
) else (
    echo   [~] Git 未安装 (可选)
)

REM 4. OpenClaw
echo - 检查 OpenClaw...
openclaw --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('openclaw --version') do set OC_VER=%%i
    echo   [✓] OpenClaw !OC_VER!
) else (
    echo   [!] OpenClaw 未安装
    set /a ERRORS+=1
)

echo.
echo [配置文件检查]
echo ----------------------------------------

REM 5. 工作目录
echo - 检查工作目录...
if exist "%WORKSPACE_DIR%" (
    echo   [✓] %WORKSPACE_DIR%
) else (
    echo   [!] 工作目录不存在
    set /a ERRORS+=1
)

REM 6. config.json
echo - 检查 config.json...
if exist "%WORKSPACE_DIR%\config.json" (
    echo   [✓] config.json 存在
) else (
    echo   [!] config.json 缺失
    set /a ERRORS+=1
)

REM 7. .env
echo - 检查 .env...
if exist "%WORKSPACE_DIR%\.env" (
    echo   [✓] .env 存在
) else (
    echo   [!] .env 缺失
    set /a ERRORS+=1
)

REM 8. SOUL.md
echo - 检查 SOUL.md...
if exist "%WORKSPACE_DIR%\SOUL.md" (
    echo   [✓] SOUL.md 存在
) else (
    echo   [!] SOUL.md 缺失
    set /a ERRORS+=1
)

echo.
echo [技能检查]
echo ----------------------------------------

REM 9. 技能目录
echo - 检查 skills 目录...
if exist "%WORKSPACE_DIR%\skills" (
    echo   [✓] skills 目录存在
    for /d %%d in ("%WORKSPACE_DIR%\skills\*") do (
        echo       - %%~nxd
    )
) else (
    echo   [!] skills 目录缺失
    set /a ERRORS+=1
)

echo.
echo [Chrome CDP 检查]
echo ----------------------------------------

REM 10. Chrome
set "CHROME_PATH="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if "!CHROME_PATH!"=="" (
    echo   [!] Chrome 未安装
) else (
    echo   [✓] Chrome 已安装
    echo   [✓] CDP 快捷方式检查...
    if exist "%USERPROFILE%\Desktop\Chrome-CDP.lnk" (
        echo       [✓] Chrome-CDP.lnk 存在
    ) else (
        echo       [!] Chrome-CDP.lnk 不存在
    )
)

echo.
echo [Gateway 状态]
echo ----------------------------------------

REM 11. Gateway 状态
openclaw gateway status >nul 2>&1
if %errorlevel% equ 0 (
    echo   [✓] Gateway 运行中
) else (
    echo   [~] Gateway 未运行 (正常，启动后检查)
)

echo.
echo ============================================
if %ERRORS% equ 0 (
    echo    验证通过！所有检查项均正常
    echo ============================================
    echo.
    echo 可以启动 Gateway 了:
    echo   start-gateway.bat
    echo   或：openclaw gateway start
) else (
    echo    发现 %ERRORS% 个问题，请修复后重试
    echo ============================================
    echo.
    echo 建议:
    echo   1. 重新运行 install.bat 完成安装
    echo   2. 或根据上述 [!] 标记手动修复
)
echo.

pause
