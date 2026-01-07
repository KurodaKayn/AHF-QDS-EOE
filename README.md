# 项目简介

![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-30.x-47848F?logo=electron&logoColor=white)
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

### 3.(可选)去 Deepseek/阿里云百炼获取 AI api 密钥

去 deepseek 或者是同义千问的 api 平台获取 api key 在设置里设置好即可使用 AI 导入功能即可。推荐阿里，为有免费额度而且回复更快.
因为更推荐阿里百炼所以我这里就只放它的链接了`https://bailian.console.aliyun.com/`(我每收米所以建议是齁完羊毛就撤退别真付费上了,后续我会增加个更多可以白嫖的 API)

## 技术栈

Next.js 作为全栈框架，最终用 Electron 打包生成桌面应用。因为 Electron 打包 next.js 的路由似乎有点问题，所以最后只能用 Fetch API 了(其实也只有调用 LLM 的时候会向外部发出请求，其他时候都是在本地进行操作)。
辅助美化的库有 tailwindcss
AI 辅助导入题库目前只有 deepseek 和 Qwen，未来有空或许会支持更多的 AI 或者是说调用来自其他平台 AI 的 API

## 数据存储

因为是网页的技术栈，所以数据是存在网页的 localstorage 里的。但是因为最后用 Electron 打包了，所以数据会存在：
Windows:%USERPROFILE%\AppData\Local\ahf-qds-eoe\Local Storage\
Mac OS:~/Library/Application Support/ahf-qds-eoe/Local Storage/

## 项目特色

很多题库的刷错题之类的功能不好用，又不能直接导出。所以我就想做个软件来解决这个问题。大语言模型显然是个不错的解决方案，还可以顺带给判断之类的告诉我这个到底为什么对为什么错，而不是因为你的老师太蠢了，不告诉原因。导致你只能无脑赢背住。

## 未来计划

### 1.加入题目的图片存储支持

### 2.也许在很遥远的未来，会搞手机 APP(目前已经有了响应式布局，只要导出就行了，但是 app 的存储挺麻烦的)

#开发者食用指南
本项目支持打包成桌面应用，可以在 Windows 和 macOS 系统上运行。当然如果你不是开发者直接就从我放在 Releases 的包直接拿来用就行了

## 开发环境运行桌面应用

```bash
# 安装依赖
npm install

# 开发模式运行桌面应用
npm run electron:dev
```

## 打包桌面应用

```bash
# 构建并打包桌面应用
npm run build:electron

# 或者，先构建然后再打包
npm run build
npm run dist
```

打包后的应用将会在`dist`目录中生成。

### 打包选项

- macOS: 打包为.dmg 安装文件和.app 应用程序
- Windows: 打包为.exe 安装文件

## 自定义应用图标

1. 在项目根目录创建`build`文件夹
2. 添加以下图标文件:
   - icon.icns (macOS)
   - icon.ico (Windows)
   - icon.png (通用)

更多详细信息请参考`electron/icon.txt`文件。
