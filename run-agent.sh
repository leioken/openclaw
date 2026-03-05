#!/bin/bash

# 🤖 运行代理脚本
# 在 tmux 会话中执行代理任务

WORKTREE_PATH="$1"
MODEL="$2"
PROMPT_FILE="$3"
TASK_ID="${4:-task-default}"

if [ -z "$WORKTREE_PATH" ] || [ -z "$MODEL" ] || [ -z "$PROMPT_FILE" ]; then
  echo "用法：$0 <worktree 路径> <模型> <prompt 文件> [任务 ID]"
  exit 1
fi

# 确保 tmux 服务器运行
tmux start-server 2>/dev/null || true

echo "🚀 代理启动"
echo "   工作区：$WORKTREE_PATH"
echo "   模型：$MODEL"
echo "   Prompt: $PROMPT_FILE"
echo ""

cd "$WORKTREE_PATH" || exit 1

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
# 使用 --message 传递任务 prompt
echo "🤖 调用 OpenClaw agent..."

# 保持 tmux 会话活跃：使用普通命令执行并捕获退出码
# 添加 --session-id 参数避免错误
openclaw agent --session-id="$TASK_ID" --message="$PROMPT" --thinking high 2>&1 | tee agent-output.log
RESULT=${PIPESTATUS[0]}

# 更新任务状态
if [ $RESULT -eq 0 ]; then
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
  "status": "failed",
  "exitCode": $RESULT
}
EOF
  echo ""
  echo "❌ 任务失败 (exit code: $RESULT)"
fi

exit $RESULT
