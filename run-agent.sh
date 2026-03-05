#!/bin/bash

# 🤖 运行代理脚本
# 在 tmux 会话中执行代理任务

set -e

WORKTREE_PATH="$1"
MODEL="$2"
PROMPT_FILE="$3"

if [ -z "$WORKTREE_PATH" ] || [ -z "$MODEL" ] || [ -z "$PROMPT_FILE" ]; then
  echo "用法：$0 <worktree 路径> <模型> <prompt 文件>"
  exit 1
fi

echo "🚀 代理启动"
echo "   工作区：$WORKTREE_PATH"
echo "   模型：$MODEL"
echo "   Prompt: $PROMPT_FILE"
echo ""

cd "$WORKTREE_PATH"

# 读取 prompt
PROMPT=$(cat "$PROMPT_FILE")

# 创建任务文件
TASK_FILE=".clawdbot/current-task.json"
mkdir -p "$(dirname "$TASK_FILE")"

cat > "$TASK_FILE" << EOF
{
  "startTime": "$(date -Iseconds)",
  "model": "$MODEL",
  "status": "running"
}
EOF

echo "📝 开始执行任务..."
echo ""

# 执行代理命令（使用 OpenClaw agent）
# 这里简化实现，实际应该调用正确的 agent 命令
openclaw agent --model="$MODEL" --prompt="$PROMPT" 2>&1 | tee agent-output.log

# 更新任务状态
if [ $? -eq 0 ]; then
  cat > "$TASK_FILE" << EOF
{
  "startTime": "$(date -Iseconds)",
  "endTime": "$(date -Iseconds)",
  "model": "$MODEL",
  "status": "completed"
}
EOF
  echo ""
  echo "✅ 任务完成"
else
  cat > "$TASK_FILE" << EOF
{
  "startTime": "$(date -Iseconds)",
  "endTime": "$(date -Iseconds)",
  "model": "$MODEL",
  "status": "failed"
}
EOF
  echo ""
  echo "❌ 任务失败"
  exit 1
fi
