#!/bin/bash
# 🦐 OpenClaw 核心功能一键部署脚本

echo "🦐 OpenClaw 核心功能部署"
echo "========================"
echo ""

WORKSPACE="$HOME/.openclaw/workspace"

# 检查文件是否存在
check_file() {
  if [ -f "$WORKSPACE/$1" ]; then
    echo "✅ $1"
  else
    echo "❌ $1 (缺失)"
  fi
}

echo "📦 检查核心功能文件:"
echo ""

check_file "github-integration.js"       # GitHub 集成
check_file "browser-automation.js"        # 浏览器自动化
check_file "document-manager.js"          # 文档管理
check_file "daily-briefing.js"            # 每日简报
check_file "social-media-manager.js"      # 社交媒体
check_file "skill-vetter.js"              # 技能审查
check_file "work-report-generator.js"     # 工作日志
check_file "dispatch-agent.js"            # 多代理调度
check_file "telegram-integration.js"      # Telegram 集成
check_file "second-brain.js"              # 第二大脑
check_file "security-check.js"            # 安全检查

echo ""
echo "📚 检查文档:"
echo ""

check_file "FEATURES-GUIDE.md"
check_file "STREAMING-IMPLEMENTATION.md"
check_file "AGENT-DESIGN.md"

echo ""
echo "🔧 安装依赖:"
echo ""

# 安装 Playwright
if ! npm list playwright &> /dev/null; then
  echo "🌐 安装 Playwright (浏览器自动化)..."
  cd "$WORKSPACE"
  npm install playwright
  npx playwright install chromium
else
  echo "✅ Playwright 已安装"
fi

# 安装 mammoth (DOCX 读取)
if ! npm list mammoth &> /dev/null; then
  echo "📄 安装 mammoth (DOCX 读取)..."
  cd "$WORKSPACE"
  npm install mammoth
else
  echo "✅ mammoth 已安装"
fi

echo ""
echo "✅ 部署完成!"
echo ""
echo "📖 使用指南:"
echo ""
echo "  # GitHub 集成"
echo "  node $WORKSPACE/github-integration.js pr owner/repo 123"
echo ""
echo "  # 浏览器自动化"
echo "  node $WORKSPACE/browser-automation.js screenshot https://example.com"
echo ""
echo "  # 文档管理"
echo "  node $WORKSPACE/document-manager.js search \"关键词\""
echo ""
echo "  # 每日简报"
echo "  node $WORKSPACE/daily-briefing.js"
echo ""
echo "  # 工作日志"
echo "  node $WORKSPACE/work-report-generator.js daily"
echo ""
echo "  # 技能审查"
echo "  node $WORKSPACE/skill-vetter.js <skill-file.js>"
echo ""
echo "  # Telegram 机器人 (含流式输出)"
echo "  node $WORKSPACE/telegram-integration.js"
echo ""
