# Electron安装指南

如果因网络问题无法自动安装Electron，可以尝试手动下载并离线安装。

## 步骤

1. 查看package.json中electron的版本号（当前为^30.0.4）

2. 手动下载对应版本的Electron:
   - 从淘宝镜像下载: https://npmmirror.com/mirrors/electron/
   - 选择版本30.0.4
   - 下载对应系统的zip文件:
     - Mac: electron-v30.0.4-darwin-x64.zip
     - Windows: electron-v30.0.4-win32-x64.zip

3. 设置环境变量告诉npm使用本地文件:

```bash
# Mac/Linux
export ELECTRON_MIRROR="file://绝对路径到下载目录/"
export npm_config_electron_custom_dir="30.0.4"

# Windows
set ELECTRON_MIRROR=file://绝对路径到下载目录/
set npm_config_electron_custom_dir=30.0.4
```

4. 重新安装:
```bash
npm install
```

## 另一种方法：使用别的包管理器

有时候使用yarn或pnpm可能会有更好的网络连接结果:

```bash
# 安装yarn
npm install -g yarn

# 使用yarn安装依赖
yarn

# 或者使用pnpm
npm install -g pnpm
pnpm install
```

## 如果所有方法都失败

如果以上方法都不起作用，可以尝试:

1. 使用移动热点或其他网络连接
2. 使用全局VPN
3. 考虑使用Tauri替代Electron（参见tauri-guide.md） 