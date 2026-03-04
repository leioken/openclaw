#!/bin/bash
# 🦐 OpenClaw 功能测试脚本

echo "🦐 测试三大核心功能..."
echo ""

# 1. 测试第二大脑
echo "=== 1️⃣ 第二大脑测试 ==="
node ~/.openclaw/workspace/second-brain.js capture "测试记忆：功能部署完成"
node ~/.openclaw/workspace/second-brain.js search "测试"
echo ""

# 2. 测试多代理调度
echo "=== 2️⃣ 多代理调度测试 ==="
echo "测试消息：'帮我 review 这段代码'"
node ~/.openclaw/workspace/dispatch-agent.js "帮我 review 这段代码" 2>&1 | head -5
echo ""
echo "测试消息：'搜索一下 AI 最新进展'"
node ~/.openclaw/workspace/dispatch-agent.js "搜索一下 AI 最新进展" 2>&1 | head -5
echo ""
echo "测试消息：'你好'"
node ~/.openclaw/workspace/dispatch-agent.js "你好" 2>&1 | head -5
echo ""

# 3. 测试安全检查
echo "=== 3️⃣ 安全检查测试 ==="
echo "测试操作：file_write"
node ~/.openclaw/workspace/security-check.js file_write '{"path":"/tmp/test.txt"}'
echo ""
echo "测试操作：command_exec"
node ~/.openclaw/workspace/security-check.js command_exec '{"command":"ls -la"}'
echo ""
echo "测试操作：external_send"
node ~/.openclaw/workspace/security-check.js external_send '{"recipient":"123","content":"hello"}'
echo ""

echo "✅ 所有测试完成！"
