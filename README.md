# 项目简介
## 项目初衷
本项目的设计目的是提高学生效率，在相同时间内能提升到一个更高的做题水平
适合直接把自己从各种地方Ctrl C + Ctrl V或者是说爬取的题目拿来反复联系最终打到一个比较理想的死记硬背水平，从而在考试或者是说八股面试中拿到个更好的成绩

## 支持的操作系统
Mac OS: supports Mac OSX 10.12+
Windows: 还真不晓得理论上来说10跟11是没问题的
Linux: not yet

## 如何使用
### 1.下载安装包
在repo中根据操作系统安装包
### 2.安装
windows的.exe和Mac的
### 3.(可选)去Deepseek/阿里云百炼获取AI api密钥
去deepseek或者是同义千问的api平台获取api key在设置里设置好即可使用AI导入功能即可。推荐阿里，为有免费额度而且回复更快.
因为更推荐阿里百炼所以我这里就只放它的链接了`https://bailian.console.aliyun.com/`(我每收米所以建议是齁完羊毛就撤退别真付费上了,后续我会增加个更多可以白嫖的API)

## 技术栈
Next.js作为全栈框架，最终用Electron打包生成桌面应用。因为Electron打包next.js的路由似乎有点问题，所以最后只能用Fetch API了(其实也只有调用LLM的时候会向外部发出请求，其他时候都是在本地进行操作)。
辅助美化的库有tailwindcss
AI辅助导入题库目前只有deepseek和Qwen，未来有空或许会支持更多的AI或者是说调用来自其他平台AI的API

## 数据存储
因为是网页的技术栈，所以数据是存在网页的localstorage里的。但是因为最后用Electron打包了，所以数据会存在：
Windows:%USERPROFILE%\AppData\Local\ahf-qds-eoe\Local Storage\ 
Mac OS:~/Library/Application Support/ahf-qds-eoe/Local Storage/

## 项目特色
很多题库的刷错题之类的功能不好用，又不能直接导出。所以我就想做个软件来解决这个问题。大语言模型显然是个不错的解决方案，还可以顺带给判断之类的告诉我这个到底为什么对为什么错，而不是因为你的老师太蠢了，不告诉原因。导致你只能无脑赢背住。

## 未来计划
### 1.加入题目的图片存储支持
### 2.也许在很遥远的未来，会搞手机APP(目前已经有了响应式布局，只要导出就行了，但是app的存储挺麻烦的)

#开发者食用指南
本项目支持打包成桌面应用，可以在Windows和macOS系统上运行。当然如果你不是开发者直接就从我放在Releases的包直接拿来用就行了

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

- macOS: 打包为.dmg安装文件和.app应用程序
- Windows: 打包为.exe安装文件

## 自定义应用图标

1. 在项目根目录创建`build`文件夹
2. 添加以下图标文件:
   - icon.icns (macOS)
   - icon.ico (Windows)
   - icon.png (通用)

更多详细信息请参考`electron/icon.txt`文件。
