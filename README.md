# 项目简介

![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.77+-000000?logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5.x-443E38?logo=react&logoColor=white)
![Tesseract.js](https://img.shields.io/badge/Tesseract.js-7.x-5A29E4?logo=octocat&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-package_manager-F69220?logo=pnpm&logoColor=white)

## 项目初衷

本项目的设计目的是提高学生效率，在相同时间内能提升到一个更高的做题水平
适合直接把自己从各种地方 Ctrl C + Ctrl V 或者是说爬取的题目拿来反复联系最终打到一个比较理想的死记硬背水平，从而在考试或者是说八股面试中拿到个更好的成绩

## 支持的操作系统

Mac OS: supports Mac OSX 10.12+
Windows: 还真不晓得理论上来说 10 跟 11 是没问题的
Linux: not yet

## 如何使用

### 1.下载安装包

在 repo 中根据操作系统安装包

### 2.安装

windows 的.exe 和 Mac 的
如果 MacOS 遇到显示图中显示的问题时可以输入以下命令来解决

```bash
xattr -rd com.apple.quarantine /Applications/AHF\ QDS\ EOE.app
```

![alt text](image.png)

### 3.(可选)去 Deepseek/阿里云百炼获取 AI api 密钥

去 deepseek 或者是同义千问的 api 平台获取 api key 在设置里设置好即可使用 AI 导入功能即可。推荐阿里，为有免费额度而且回复更快.
因为更推荐阿里百炼所以我这里就只放它的链接了`https://bailian.console.aliyun.com/`(我每收米所以建议是齁完羊毛就撤退别真付费上了,后续我会增加个更多可以白嫖的 API)

## 技术栈

Next.js 作为全栈框架，最终用 Tauri 打包生成桌面应用。Tauri 使用 Rust 作为后端，提供更小的应用体积和更好的性能。前端使用静态导出模式，确保与 Tauri 的完美兼容。
辅助美化的库有 tailwindcss
AI 辅助导入题库目前只有 deepseek 和 Qwen，未来有空或许会支持更多的 AI 或者是说调用来自其他平台 AI 的 API

## 数据存储

因为是网页的技术栈，所以数据是存在网页的 localstorage 里的。但是因为最后用 Tauri 打包了，所以数据会存在：
Windows: %USERPROFILE%\AppData\Roaming\com.ahf-qds-eoe\
Mac OS: ~/Library/Application Support/com.ahf-qds-eoe/

## 项目特色

很多题库的刷错题之类的功能不好用，又不能直接导出。所以我就想做个软件来解决这个问题。大语言模型显然是个不错的解决方案，还可以顺带给判断之类的告诉我这个到底为什么对为什么错，而不是因为你的老师太蠢了，不告诉原因。导致你只能无脑赢背住。

## 未来计划

### 1.加入题目的图片存储支持

### 2.也许在很遥远的未来，会搞手机 APP(目前已经有了响应式布局，只要导出就行了，但是 app 的存储挺麻烦的)

# 开发者食用指南

本项目使用 Tauri 打包成桌面应用，可以在 Windows、macOS 和 Linux 系统上运行。当然如果你不是开发者直接就从我放在 Releases 的包直接拿来用就行了

## 环境要求

### 前置依赖

- **Node.js** (推荐 18+)
- **pnpm** (包管理器)
- **Rust** (1.77.2+)
- **Tauri CLI**

## 开发环境运行

```bash
# 安装前端依赖
pnpm install

# 开发模式运行桌面应用 (会自动启动前端开发服务器)
pnpm tauri:dev

# 或者分别运行
pnpm dev          # 启动 Next.js 开发服务器
cargo tauri dev   # 启动 Tauri 开发模式
```

## 构建和打包

```bash
# 构建前端并打包桌面应用
pnpm build:tauri

# 或者分步执行
pnpm build        # 构建 Next.js 静态文件
cargo tauri build # 打包 Tauri 应用
```

打包后的应用将会在 `src-tauri/target/release/bundle/` 目录中生成。

### 打包选项

- **macOS**: 打包为 .app 应用程序和 .dmg 安装文件
- **Windows**: 打包为 .exe 安装文件和 .msi 安装包
- **Linux**: 打包为 .deb、.rpm 和 .AppImage 格式

## 项目结构

```
├── src/                    # Next.js 前端代码
├── src-tauri/             # Tauri 后端代码
│   ├── src/               # Rust 源代码
│   ├── icons/             # 应用图标
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 应用配置
├── out/                   # Next.js 静态导出目录
└── package.json           # 前端依赖配置
```

## 自定义应用配置

### 应用图标

图标文件位于 `src-tauri/icons/` 目录：

- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `icon.png` (Linux/通用)
- `32x32.png`, `128x128.png`, `128x128@2x.png` (各种尺寸)

### 应用信息

在 `src-tauri/tauri.conf.json` 中修改：

- 应用名称、版本号
- 窗口大小和行为
- 权限和安全设置
- 打包选项
