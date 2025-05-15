#!/bin/bash
# 主构建脚本 - 构建所有或选定平台的Electron应用
# 作者: KurodaKayn
# 日期: $(date +"%Y-%m-%d")

set -e  # 遇到错误立即退出

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # 恢复默认颜色

# 设置脚本路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAC_SCRIPT="${SCRIPT_DIR}/build-mac.sh"
WIN_SCRIPT="${SCRIPT_DIR}/build-win.sh"
LINUX_SCRIPT="${SCRIPT_DIR}/build-linux.sh"

# 确保脚本可执行
chmod +x "${MAC_SCRIPT}" "${WIN_SCRIPT}" "${LINUX_SCRIPT}"

# 显示帮助信息
show_help() {
  echo -e "${BLUE}Electron应用多平台构建工具${NC}"
  echo -e "用法: $0 [选项]"
  echo -e "选项:"
  echo -e "  ${GREEN}-a, --all${NC}      构建所有平台版本 (macOS, Windows, Linux)"
  echo -e "  ${GREEN}-m, --mac${NC}      仅构建macOS版本"
  echo -e "  ${GREEN}-w, --windows${NC}  仅构建Windows版本"
  echo -e "  ${GREEN}-l, --linux${NC}    仅构建Linux版本"
  echo -e "  ${GREEN}-h, --help${NC}     显示此帮助信息"
  echo -e "\n示例："
  echo -e "  $0 --mac --windows  # 构建macOS和Windows版本"
  echo -e "  $0 -a               # 构建所有平台版本"
}

# 没有参数时显示帮助
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

# 解析命令行参数
BUILD_MAC=false
BUILD_WIN=false
BUILD_LINUX=false

while [ $# -gt 0 ]; do
  case "$1" in
    -a|--all)
      BUILD_MAC=true
      BUILD_WIN=true
      BUILD_LINUX=true
      shift
      ;;
    -m|--mac)
      BUILD_MAC=true
      shift
      ;;
    -w|--windows)
      BUILD_WIN=true
      shift
      ;;
    -l|--linux)
      BUILD_LINUX=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}错误: 未知参数 $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# 开始构建过程
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}     Electron应用多平台构建工具      ${NC}"
echo -e "${BLUE}======================================${NC}"

STARTED_TIME=$(date +"%T")
echo -e "${YELLOW}开始时间: ${STARTED_TIME}${NC}"
echo

# 构建macOS版本
if [ "$BUILD_MAC" = true ]; then
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}        构建macOS应用版本           ${NC}"
  echo -e "${BLUE}======================================${NC}"
  if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}警告: 不在macOS系统上，跳过macOS构建${NC}"
  else
    ${MAC_SCRIPT}
  fi
  echo
fi

# 构建Windows版本
if [ "$BUILD_WIN" = true ]; then
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}        构建Windows应用版本         ${NC}"
  echo -e "${BLUE}======================================${NC}"
  ${WIN_SCRIPT}
  echo
fi

# 构建Linux版本
if [ "$BUILD_LINUX" = true ]; then
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}        构建Linux应用版本           ${NC}"
  echo -e "${BLUE}======================================${NC}"
  ${LINUX_SCRIPT}
  echo
fi

# 显示总结
FINISHED_TIME=$(date +"%T")
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}             构建完成               ${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}开始时间: ${STARTED_TIME}${NC}"
echo -e "${YELLOW}结束时间: ${FINISHED_TIME}${NC}"
echo -e "${GREEN}构建文件位于: $(cd "${SCRIPT_DIR}/.." && pwd)/dist${NC}" 