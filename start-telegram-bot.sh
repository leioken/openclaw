#!/bin/bash
# 🦐 启动 Telegram 机器人

echo "🦐 启动麦克虾 Telegram 机器人..."
echo ""

# 检查网关是否运行
if ! lsof -i:18789 | grep -q LISTEN; then
  echo "⚠️  网关未运行，正在启动..."
  openclaw gateway --force &
  sleep 5
fi

# 启动 Telegram 集成
echo "✅ 启动 Telegram 集成服务..."
node ~/.openclaw/workspace/telegram-integration.js &

echo ""
echo "✅ 机器人已启动！"
echo "📍 Bot: @maikexiabot"
echo "📊 7 个专业代理已就绪"
echo ""
echo "按 Ctrl+C 停止"
