#!/bin/bash
# 🦐 麦克虾 - 自进化守护进程
# 定期运行自检、学习和优化

WORKSPACE="$HOME/.openclaw/workspace"
LOG="$HOME/.openclaw/evolution/daemon.log"

mkdir -p "$HOME/.openclaw/evolution"

echo "🦐 麦克虾 - 自进化守护进程启动"
echo "工作目录：$WORKSPACE"
echo "日志文件：$LOG"
echo ""

cd "$WORKSPACE"

# 定期自检（每 10 分钟）
while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始自检..." >> "$LOG"
    node auto-check.js >> "$LOG" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 自检完成" >> "$LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 等待 10 分钟..." >> "$LOG"
    echo "" >> "$LOG"
    sleep 600  # 10 分钟
done