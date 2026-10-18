# 小学英语单词课堂 - Android App 打包指南

## 项目简介

本项目基于 [Capacitor](https://capacitorjs.com/) 将 H5 网页应用打包成 Android APK/AAB 应用。

- **应用名称**: 小学英语单词课堂
- **包名**: `com.english.study`
- **目标平台**: Android

---

## 目录结构

```
english-app/
├── .github/
│   └── workflows/          # GitHub Actions 自动化打包配置
│       ├── build-aab.yml       # 构建未签名 AAB/APK
│       └── build-signed-aab.yml  # 构建签名 AAB/APK
├── android/                # Android 原生项目（由 Capacitor 生成）
├── www/                    # H5 静态资源（从 english-h5 复制）
├── output/                 # 本地打包输出的 APK 目录
├── capacitor.config.json   # Capacitor 配置文件
├── package.json            # Node.js 项目配置
├── build-apk.bat           # 本地一键打包 Debug APK 脚本
├── build-release.bat       # 本地一键打包 Release APK 脚本
├── update-and-build.bat    # 更新 H5 资源并重新打包脚本
└── README.md               # 本说明文档
```

---

## 打包方式选择

| 方式 | 需要 Android Studio | 需要本地环境 | 适用场景 |
|------|-------------------|------------|---------|
| **GitHub Actions** | 不需要 | 不需要 | **推荐！** 全自动云端打包 |
| 本地脚本 | 不需要 | 需要 Node + JDK | 本地快速测试 |
| Android Studio | 需要 | 需要完整环境 | 调试开发 |

---

## 方式一：GitHub Actions 自动打包（推荐，完全免费）

**优势**：
- 不需要安装 Android Studio
- 不需要配置本地 Android SDK
- 不需要本地 Java 环境
- 每次推送代码自动构建
- 支持手动触发 + 自动发布 Release

### 使用步骤

#### 1. 创建 GitHub 仓库并推送代码

```bash
cd english-app
git init
git add .
git commit -m "init: capacitor android app"
git branch -M main
git remote add origin https://github.com/你的用户名/english-app.git
git push -u origin main
```

#### 2. 配置签名密钥（可选，用于发布到应用商店）

如果你要发布到 Google Play 或其他应用商店，需要配置签名：

**步骤 A：生成本地签名密钥**

```bash
cd android
keytool -genkey -v -keystore my-release-key.keystore -alias english-study -keyalg RSA -keysize 2048 -validity 10000
```

**步骤 B：将密钥转为 Base64**

```bash
# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android/my-release-key.keystore")) | Set-Clipboard

# Mac/Linux
base64 -i android/my-release-key.keystore | pbcopy
```

**步骤 C：在 GitHub 仓库设置 Secrets**

进入仓库 → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`，添加以下 secrets：

| Secret 名称 | 值 |
|------------|-----|
| `KEYSTORE_BASE64` | 上面复制的 Base64 字符串 |
| `KEYSTORE_PASSWORD` | 密钥库密码 |
| `KEY_ALIAS` | 密钥别名（如 english-study） |
| `KEY_PASSWORD` | 密钥密码 |

#### 3. 触发构建

**自动触发**：
- 推送代码到 `main` 或 `master` 分支时自动构建

**手动触发**：
1. 进入 GitHub 仓库 → `Actions` 标签
2. 选择 `Build Android AAB` 或 `Build Signed Android AAB`
3. 点击 `Run workflow`
4. 输入版本号和版本代码
5. 点击运行

#### 4. 下载构建产物

构建完成后：
- 未签名的包：在 Actions 运行页面 → `Artifacts` 中下载
- 签名的包：自动发布到 GitHub Releases 页面

---

## 方式二：本地一键打包脚本

### 环境要求

| 工具 | 版本要求 | 下载地址 |
|------|---------|---------|
| Node.js | 18.x 或更高 | https://nodejs.org/ |
| Java JDK | 17 或更高 | https://adoptium.net/ |
| Android SDK | API 24+ | 通过命令行工具安装 |

### 环境变量配置

```bash
# Windows 系统环境变量
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17
ANDROID_HOME = C:\Users\用户名\AppData\Local\Android\Sdk
```

### 打包命令

```bash
# 打包 Debug APK（测试用）
.\build-apk.bat

# 打包 Release APK
.\build-release.bat

# 更新 H5 资源后重新打包
.\update-and-build.bat
```

### npm 命令

```bash
# 同步 Web 资源
npm run sync

# 构建 Debug APK
npm run build:debug

# 构建 Release APK
npm run build:release

# 一键重新构建
npm run rebuild
```

---

## 方式三：Android Studio（调试开发）

```bash
# 同步资源
npm run sync

# 打开 Android Studio
npm run open
```

---

## H5 资源更新流程

当 `english-h5` 目录中的网页代码有更新时：

```bash
# 1. 删除旧的 www 目录
rmdir /S /Q www

# 2. 复制最新的 H5 资源
xcopy /E /I ..\english-h5 www

# 3. 同步到 Android 项目并构建
npm run rebuild
```

或使用一键脚本：

```bash
.\update-and-build.bat
```

如果使用 GitHub Actions，直接推送更新后的代码即可自动构建。

---

## APK/AAB 输出位置

### 本地构建

| 类型 | 路径 |
|------|------|
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Release AAB | `android/app/build/outputs/bundle/release/app-release.aab` |

### GitHub Actions 构建

| 类型 | 下载位置 |
|------|---------|
| Debug APK | Actions → 构建记录 → Artifacts |
| Release AAB | Actions → 构建记录 → Artifacts 或 GitHub Releases |

---

## 发布到应用商店

### Google Play

1. 使用 `build-signed-aab.yml` 构建签名的 AAB
2. 登录 [Google Play Console](https://play.google.com/console)
3. 创建应用 → 上传 AAB 文件
4. 填写应用信息并提交审核

### 国内应用商店

国内商店通常需要 APK 格式：

1. 使用 `build-signed-aab.yml` 构建（它会同时输出 APK 和 AAB）
2. 或直接修改 workflow 只构建 APK
3. 上传到各应用商店开发者后台

---

## 常见问题

### 1. GitHub Actions 构建失败

**检查清单**：
- 确认 `www` 目录包含完整的 H5 资源
- 确认 `android` 目录已提交到 git
- 检查 Actions 日志中的具体错误

### 2. 签名配置问题

**未签名 vs 已签名**：
- `build-aab.yml`：构建未签名的包，适合测试和自行签名
- `build-signed-aab.yml`：使用 GitHub Secrets 中的密钥自动签名

### 3. 首次本地构建时 Gradle 下载超时

**解决**：
- 使用 GitHub Actions 完全避免此问题
- 或配置 Gradle 镜像源加速下载

### 4. H5 页面在 App 中显示异常

**解决**：
- 检查 `www` 目录是否包含完整的 H5 资源
- 确保所有资源使用相对路径
- 检查 WebView 控制台日志

### 5. 音频无法播放

**解决**：
- 确保 AndroidManifest.xml 中已添加 `MODIFY_AUDIO_SETTINGS` 权限
- 检查网络连接（在线 TTS 需要网络）
- 在真机上测试

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm run sync` | 同步 Web 资源到 Android |
| `npm run build:debug` | 构建 Debug APK |
| `npm run build:release` | 构建 Release APK |
| `npm run rebuild` | 同步 + 构建 Debug |
| `npx cap doctor` | 检查环境配置 |

---

## 技术栈

- [Capacitor](https://capacitorjs.com/) - 跨平台原生容器
- [GitHub Actions](https://github.com/features/actions) - CI/CD 自动化构建
- [Android Gradle Plugin](https://developer.android.com/studio/releases/gradle-plugin) - Android 构建工具

---

## 参考文档

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Capacitor Android 配置](https://capacitorjs.com/docs/android/configuration)
- [GitHub Actions 文档](https://docs.github.com/cn/actions)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)