#!/bin/bash

# 启动独立后端服务

cd "$(dirname "$0")"

echo "🦐 启动模型切换器后端服务..."
echo "端口: 18792 (独立端口，不与 OpenClaw 冲突)"

node backend-server.js
