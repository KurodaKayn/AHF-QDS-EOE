#!/bin/bash
# 构建macOS版本的Electron应用
# 作者: KurodaKayn
# 日期: $(date +"%Y-%m-%d")

set -e  # 遇到错误立即退出

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 恢复默认颜色

echo -e "${YELLOW}准备构建macOS版本...${NC}"

# 检查是否在macOS系统上运行
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}错误: 此脚本只能在macOS系统上运行${NC}"
    exit 1
fi

# 检查是否安装了Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js，请先安装Node.js${NC}"
    exit 1
fi

# 检查是否有次级依赖包
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未找到node_modules，正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}安装依赖失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}开始构建macOS应用...${NC}"

# 设置Electron镜像源(中国用户可能需要)
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# 开始构建
echo -e "${YELLOW}执行构建命令: npm run build:electron:mac${NC}"
npm run build:electron:mac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}macOS应用构建成功！${NC}"
    echo -e "${YELLOW}构建文件位于: $(pwd)/dist${NC}"
else
    echo -e "${RED}macOS应用构建失败${NC}"
    exit 1
fi 