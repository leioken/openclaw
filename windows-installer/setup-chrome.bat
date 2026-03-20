@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo    Chrome CDP 配置工具
echo ============================================
echo.

REM ==============================
REM 1. 查找或安装 Chrome
REM ==============================
set "CHROME_PATH="

REM 检查常见安装路径
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if "!CHROME_PATH!"=="" (
    echo [!] 未找到 Chrome 浏览器
    echo     正在自动下载 Chrome...
    echo.
    
    REM 创建临时目录
    set "TEMP_DIR=%TEMP%\chrome-install"
    if not exist "!TEMP_DIR!" mkdir "!TEMP_DIR!"
    
    REM 下载 Chrome 离线安装包
    echo     下载 Chrome 离线安装包...
    powershell -Command ^
        "$ProgressPreference = 'SilentlyContinue'; ^
        Invoke-WebRequest -Uri 'https://dl.google.com/chrome/install/latest/chrome_installer.exe' ^
        -OutFile '!TEMP_DIR!\chrome_installer.exe'"
    
    if not exist "!TEMP_DIR!\chrome_installer.exe" (
        echo [!] Chrome 下载失败
        echo     请手动下载安装：https://www.google.com/chrome/
        pause
        exit /b 1
    )
    
    echo     正在安装 Chrome...
    "!TEMP_DIR!\chrome_installer.exe" /silent /install
    timeout /t 30 /nobreak >nul
    
    REM 重新查找 Chrome
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
    ) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    )
    
    if "!CHROME_PATH!"=="" (
        echo [!] Chrome 安装失败，请手动安装后重试
        pause
        exit /b 1
    )
    
    echo [✓] Chrome 安装完成
)

echo [✓] 找到 Chrome: !CHROME_PATH!
echo.

REM ==============================
REM 2. 创建 CDP 配置文件目录
REM ==============================
set "CDP_PROFILE=%USERPROFILE%\chrome-cdp-profile"
if not exist "!CDP_PROFILE!" (
    mkdir "!CDP_PROFILE!"
    echo [✓] 创建 CDP 配置文件目录：!CDP_PROFILE!
) else (
    echo [✓] CDP 配置文件目录已存在
)
echo.

REM ==============================
REM 3. 创建桌面快捷方式
REM ==============================
echo 正在创建桌面快捷方式...
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=!DESKTOP!\Chrome-CDP.lnk"

powershell -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; ^
    $Shortcut = $WshShell.CreateShortcut('!SHORTCUT!'); ^
    $Shortcut.TargetPath = '!CHROME_PATH!'; ^
    $Shortcut.Arguments = '--remote-debugging-port=9222 --user-data-dir=\"!CDP_PROFILE!\" --disable-features=TranslateUI --disable-client-side-phishing-detection'; ^
    $Shortcut.Description = 'Chrome with CDP enabled (for OpenClaw)'; ^
    $Shortcut.IconLocation = '!CHROME_PATH!,0'; ^
    $Shortcut.WorkingDirectory = '!CDP_PROFILE!'; ^
    $Shortcut.Save()"

echo [✓] 快捷方式已创建：!SHORTCUT!
echo.

REM ==============================
REM 4. 创建启动脚本
REM ==============================
echo 正在创建启动脚本...
set "LAUNCHER=%WORKSPACE_DIR%\launch-chrome-cdp.bat"

(
echo @echo off
echo chcp 65001 ^>nul
echo.
echo 正在启动 Chrome CDP...
echo.
echo 提示:
echo - 在此 Chrome 中登录你的账号 ^(即梦/Grok/Gemini 等^)
echo - 保持 Chrome 运行，OpenClaw 即可控制浏览器
echo - 不要关闭此窗口
echo.
"!CHROME_PATH!" --remote-debugging-port=9222 --user-data-dir="!CDP_PROFILE!" --disable-features=TranslateUI --disable-client-side-phishing-detection
) > "!LAUNCHER!"

echo [✓] 启动脚本已创建：!LAUNCHER!
echo.

REM ==============================
REM 5. 测试连接 (可选)
REM ==============================
echo.
set /p "TEST_NOW=是否现在启动 Chrome 并测试连接？(Y/N): "
if /i "!TEST_NOW!"=="Y" (
    echo.
    echo 正在启动 Chrome CDP...
    start "" "!CHROME_PATH!" --remote-debugging-port=9222 --user-data-dir="!CDP_PROFILE!"
    
    echo 等待 Chrome 启动...
    timeout /t 5 /nobreak >nul
    
    echo.
    echo 正在测试 CDP 连接...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/version' -TimeoutSec 5; Write-Host 'CDP 连接成功！'; $response.Content } catch { Write-Host 'CDP 连接失败，请检查 Chrome 是否正常启动' }"
    
    echo.
    echo [✓] Chrome CDP 已启动
    echo.
    echo 下一步:
    echo 1. 在 Chrome 中登录你的账号 (即梦/Grok/Gemini 等)
    echo 2. 保持 Chrome 运行
    echo 3. 启动 OpenClaw Gateway
) else (
    echo [✓] 配置完成
    echo.
    echo 下一步:
    echo 1. 双击桌面上的 Chrome-CDP 快捷方式
    echo 2. 在 Chrome 中登录你的账号
    echo 3. 保持 Chrome 运行
)

REM ==============================
REM 清理
REM ==============================
if exist "!TEMP_DIR!" (
    echo.
    echo 清理临时文件...
    rmdir /s /q "!TEMP_DIR!"
)

echo.
echo ============================================
echo    Chrome CDP 配置完成！
echo ============================================
echo.
pause
