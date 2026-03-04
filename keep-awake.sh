#!/bin/bash
# 🦐 24 小时待命配置脚本
# 禁用 Mac 休眠，保持 OpenClaw 持续运行

echo "🦐 配置 24 小时待命模式..."

# 禁用休眠
sudo pmset -a disablesleep 1
sudo pmset -a sleep 0
sudo pmset -a hibernatemode 0
sudo pmset -a autopoweroff 0
sudo pmset -a standby 0
sudo pmset -a powernap 0

# 保持屏幕常亮（可选）
# sudo pmset -a displaysleep 0

echo ""
echo "✅ 配置完成！"
echo ""
echo "当前电源设置:"
pmset -g

echo ""
echo "💡 提示:"
echo "- 使用 'caffeinate' 命令可临时保持唤醒"
echo "- 使用 'pmset -g' 查看当前设置"
echo "- 恢复默认：sudo pmset -a restoresetdefaults
