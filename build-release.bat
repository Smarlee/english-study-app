@echo off
chcp 65001 >nul
echo ==========================================
echo   小学英语单词课堂 - Release APK 打包脚本
echo ==========================================
echo.
echo 注意：Release 打包需要配置签名密钥

REM 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    exit /b 1
)

REM 步骤1: 同步 Web 资源到 Android 项目
echo [1/3] 正在同步 Web 资源...
call npx cap sync android
if errorlevel 1 (
    echo [错误] 同步失败
    exit /b 1
)
echo [1/3] 同步完成
echo.

REM 步骤2: 构建 Release APK
echo [2/3] 正在构建 Release APK...
cd android
call .\gradlew assembleRelease
if errorlevel 1 (
    echo [错误] 构建失败
    cd ..
    exit /b 1
)
cd ..
echo [2/3] 构建完成
echo.

REM 步骤3: 复制 APK 到输出目录
echo [3/3] 正在复制 APK 文件...
if not exist "output" mkdir output
copy /Y "android\app\build\outputs\apk\release\app-release-unsigned.apk" "output\english-study-release-unsigned.apk" >nul
echo [3/3] APK 已复制到 output\english-study-release-unsigned.apk
echo.

echo ==========================================
echo   打包完成！
echo   APK 路径: output\english-study-release-unsigned.apk
echo   注意：Release APK 需要签名后才能安装
echo ==========================================
pause