#!/usr/bin/env bash
# ==============================================================================
# Claude-Agy Uninstaller Script
# ==============================================================================
set -e

INSTALL_DIR="${TARGET_DIR:-$HOME/claude-agy}"
SYMLINK_PATH="/usr/local/bin/claude-agy"

RED="\033[0;31m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
NC="\033[0m"

echo -e "${BLUE}==>${NC} Bắt đầu gỡ cài đặt Claude-Agy..."

# 1. Dừng tiến trình proxy cổng 8318 nếu đang chạy
echo -e "${BLUE}==>${NC} Dừng tiến trình proxy (nếu có)..."
pkill -f "cli-proxy-api.*8318" 2>/dev/null || true

# 2. Xóa symlink toàn hệ thống
if [ -L "$SYMLINK_PATH" ] || [ -f "$SYMLINK_PATH" ]; then
    echo -e "${BLUE}==>${NC} Xóa symlink ${GREEN}$SYMLINK_PATH${NC}..."
    sudo rm -f "$SYMLINK_PATH" 2>/dev/null || rm -f "$SYMLINK_PATH"
fi

# 3. Xóa thư mục cài đặt nếu tồn tại
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${BLUE}==>${NC} Xóa thư mục ứng dụng ${GREEN}$INSTALL_DIR${NC}..."
    rm -rf "$INSTALL_DIR"
fi

echo -e "\n${GREEN}🎉 Đã gỡ bỏ hoàn toàn Claude-Agy khỏi hệ thống!${NC}"
