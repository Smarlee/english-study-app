@echo off
chcp 65001 >nul
echo ==========================================
echo   更新 H5 资源并重新打包 APK
echo ==========================================
echo.

REM 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    exit /b 1
)

REM 步骤1: 删除旧的 www 目录
echo [1/4] 正在删除旧的 www 目录...
if exist "www" (
    rmdir /S /Q www
    echo [1/4] 旧资源已删除
) else (
    echo [1/4] 无旧资源需要删除
)
echo.

REM 步骤2: 复制最新的 H5 资源
echo [2/4] 正在复制最新的 H5 资源...
if not exist "..\english-h5" (
    echo [错误] 找不到 ..\english-h5 目录，请确认 english-h5 存在
    exit /b 1
)
xcopy /E /I "..\english-h5" www >nul
echo [2/4] H5 资源复制完成
echo.

REM 步骤3: 同步到 Android 项目
echo [3/4] 正在同步到 Android 项目...
call npx cap sync android
if errorlevel 1 (
    echo [错误] 同步失败
    exit /b 1
)
echo [3/4] 同步完成
echo.

REM 步骤4: 构建 Debug APK
echo [4/4] 正在构建 Debug APK...
cd android
call .\gradlew assembleDebug
if errorlevel 1 (
    echo [错误] 构建失败
    cd ..
    exit /b 1
)
cd ..
echo [4/4] 构建完成
echo.

REM 复制 APK 到输出目录
echo [完成] 正在复制 APK 文件...
if not exist "output" mkdir output
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "output\english-study-debug.apk" >nul
echo [完成] APK 已复制到 output\english-study-debug.apk
echo.

echo ==========================================
echo   更新并打包完成！
echo   APK 路径: output\english-study-debug.apk
echo ==========================================
pause