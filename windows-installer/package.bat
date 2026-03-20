@echo off
chcp 65001 >nul

echo ============================================
echo    打包 Windows 安装包
echo ============================================
echo.

set "PACKAGE_NAME=openclaw-windows-installer-v1.0"
set "PACKAGE_DIR=%TEMP%\%PACKAGE_NAME%"

if exist "%PACKAGE_DIR%" rmdir /s /q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"

echo 正在复制文件...
xcopy /E /I /Y "%~dp0" "%PACKAGE_DIR%" >nul

echo 正在创建 ZIP 压缩包...
powershell -Command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath '%USERPROFILE%\Desktop\%PACKAGE_NAME%.zip' -Force"

echo.
echo [✓] 打包完成！
echo     位置：%USERPROFILE%\Desktop\%PACKAGE_NAME%.zip
echo.

rmdir /s /q "%PACKAGE_DIR%"
pause
