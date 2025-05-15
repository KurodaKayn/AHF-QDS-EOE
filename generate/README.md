# Electron 应用多平台构建工具

这个目录包含了用于构建不同平台 Electron 应用的脚本集合。这些脚本简化了跨平台构建过程，特别是针对 Windows 和 Linux 版本，它们使用 Docker 容器来避免依赖问题。

## 文件说明

- `build-all.sh`: 主构建脚本，可以选择构建一个或多个平台的应用
- `build-mac.sh`: 构建 macOS 版本的应用（仅限在 macOS 系统上运行）
- `build-win.sh`: 使用 Docker 容器构建 Windows 版本的应用
- `build-linux.sh`: 使用 Docker 容器构建 Linux 版本的应用

## 前置条件

- **对于所有平台**:
  - 已安装 Node.js 和 npm
  - 项目的 `package.json` 中包含适当的构建脚本（见下文）
  
- **对于 Windows/Linux 构建**:
  - 已安装 Docker
  - 有网络连接以拉取 Docker 镜像（如果尚未下载）

## 使用方法

1. 确保所有脚本有执行权限：
   ```bash
   chmod +x generate/*.sh
   ```

2. 使用主脚本 `build-all.sh` 构建应用：
   ```bash
   # 构建所有平台版本
   ./generate/build-all.sh --all
   
   # 仅构建 macOS 版本
   ./generate/build-all.sh --mac
   
   # 构建 Windows 和 Linux 版本
   ./generate/build-all.sh --windows --linux
   ```

3. 或者，直接使用单个平台的构建脚本：
   ```bash
   # macOS 版本
   ./generate/build-mac.sh
   
   # Windows 版本
   ./generate/build-win.sh
   
   # Linux 版本
   ./generate/build-linux.sh
   ```

## 必要的 package.json 配置

确保您的 `package.json` 中包含以下构建脚本：

```json
"scripts": {
  "build:electron:mac": "next build --no-lint && cross-env ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ electron-builder --mac --publish=never",
  "build:electron:win": "next build --no-lint && cross-env ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ electron-builder --win --x64 --publish=never",
  "build:electron:linux": "next build --no-lint && cross-env ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ electron-builder --linux --publish=never"
}
```

## 注意事项

- macOS 版本只能在 macOS 系统上构建
- Windows 和 Linux 版本使用 Docker 构建，在任何支持 Docker 的平台上都能工作
- 首次运行 Docker 构建时，会自动下载必要的 Docker 镜像（可能需要一些时间）
- 构建完成后，可执行文件将会位于项目根目录下的 `dist` 文件夹中

## 常见问题排查

1. **Docker 镜像下载失败**
   - 检查您的网络连接
   - 尝试使用国内镜像源（脚本中已配置）

2. **构建失败**
   - 检查 Node.js 依赖是否完整
   - 确认 `electron-builder` 已正确安装
   - 查看具体的错误信息进行排查

3. **macOS 构建权限问题**
   - 可能需要为应用签名，请参考 Electron 官方文档 