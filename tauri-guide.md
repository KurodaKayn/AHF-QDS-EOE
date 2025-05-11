# 使用Tauri替代Electron

如果Electron安装遇到困难，可以考虑使用Tauri作为替代方案。Tauri比Electron更轻量级，使用系统原生WebView，体积更小。

## 安装步骤

1. 首先确保已安装Rust和相关依赖：
   - macOS: `brew install rust`
   - Windows: 下载Rust安装器 https://www.rust-lang.org/tools/install

2. 安装Tauri CLI:
```bash
npm install -g @tauri-apps/cli
```

3. 初始化Tauri项目:
```bash
# 在项目根目录运行
npm install --save-dev @tauri-apps/cli @tauri-apps/api
npx tauri init
```

4. 配置src-tauri/tauri.conf.json文件:
```json
{
  "build": {
    "distDir": "../out",
    "devPath": "http://localhost:3000"
  },
  "tauri": {
    "bundle": {
      "identifier": "com.ahf-qds-eoe",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "windows": [
      {
        "title": "AHF QDS EOE",
        "width": 1200,
        "height": 800,
        "resizable": true
      }
    ]
  }
}
```

5. 修改package.json:
```json
{
  "scripts": {
    "build:tauri": "next build && tauri build",
    "dev:tauri": "concurrently \"npm run dev\" \"tauri dev\""
  }
}
```

## 构建应用
```bash
npm run build:tauri
```

## 优势
- 更小的文件体积（通常比Electron小10倍）
- 更好的性能和更低的内存占用
- 更安全的默认设置
- 更快的启动时间 