#!/bin/bash
# 在Docker中构建Linux版本的Electron应用
# 作者: KurodaKayn
# 日期: $(date +"%Y-%m-%d")

set -e  # 遇到错误立即退出

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 恢复默认颜色

echo -e "${YELLOW}准备在Docker中构建Linux版本...${NC}"

# 检查Docker是否已安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: 未找到Docker，请先安装Docker${NC}"
    exit 1
fi

# 检查镜像是否存在，不存在则拉取
DOCKER_IMAGE="electronuserland/builder:12"
if ! docker images | grep -q "electronuserland/builder" | grep -q "12"; then
    echo -e "${YELLOW}未找到${DOCKER_IMAGE}镜像，正在拉取...${NC}"
    docker pull ${DOCKER_IMAGE}
    if [ $? -ne 0 ]; then
        echo -e "${RED}拉取镜像失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}开始构建Linux应用...${NC}"

# 获取项目根目录路径和项目名称
PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")

# 运行Docker容器进行构建
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PROJECT_DIR}:/project \
  -v ${PROJECT_NAME}-linux-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  ${DOCKER_IMAGE} \
  /bin/bash -c "cd /project && npm install && npm run build:electron:linux"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Linux应用构建成功！${NC}"
    echo -e "${YELLOW}构建文件位于: ${PROJECT_DIR}/dist${NC}"
else
    echo -e "${RED}Linux应用构建失败${NC}"
    exit 1
fi 