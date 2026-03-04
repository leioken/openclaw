#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const PORT = 18791;

const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦐 模型切换器 - 赛博老虾</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
        }
        .window {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 16px;
            width: 100%;
            max-width: 680px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
            overflow: hidden;
        }
        .title-bar {
            background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 16px 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .traffic-lights {
            display: flex;
            gap: 8px;
        }
        .traffic-light {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .traffic-light.close { background: #ff5f57; }
        .traffic-light.minimize { background: #febc2e; }
        .traffic-light.maximize { background: #28c840; }
        .title {
            flex: 1;
            text-align: center;
            font-weight: 600;
            color: #1a1a2e;
            font-size: 14px;
        }
        .content { padding: 24px; }
        .header {
            text-align: center;
            margin-bottom: 24px;
        }
        .emoji { font-size: 48px; display: block; margin-bottom: 8px; }
        .header h1 { font-size: 22px; color: #1a1a2e; font-weight: 600; }
        .current-model {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            text-align: center;
        }
        .current-model label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .current-model .model-name {
            font-size: 20px;
            font-weight: 600;
            font-family: 'SF Mono', 'Monaco', monospace;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #6c757d;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .model-list {
            display: grid;
            gap: 10px;
            margin-bottom: 24px;
        }
        .model-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 14px 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .model-card:hover {
            border-color: #667eea;
            background: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        .model-card.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-color: transparent;
        }
        .model-info { flex: 1; }
        .model-info h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
            font-family: 'SF Mono', 'Monaco', monospace;
        }
        .model-info p {
            font-size: 11px;
            opacity: 0.7;
        }
        .model-card.active .model-info p { opacity: 0.9; }
        .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-badge.active {
            background: rgba(255, 255, 255, 0.25);
        }
        .status-badge.inactive {
            background: #e9ecef;
            color: #6c757d;
        }
        .btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 10px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover { transform: scale(1.02); }
        .btn-scan {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
        }
        .btn-scan:hover { transform: scale(1.02); }
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            text-align: center;
            font-size: 13px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            display: block;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            display: block;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #667eea;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .empty-state {
            text-align: center;
            padding: 30px;
            color: #6c757d;
        }
        .empty-state p { margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="window">
        <div class="title-bar">
            <div class="traffic-lights">
                <div class="traffic-light close"></div>
                <div class="traffic-light minimize"></div>
                <div class="traffic-light maximize"></div>
            </div>
            <div class="title">🦐 模型切换器</div>
        </div>
        
        <div class="content">
            <div class="header">
                <span class="emoji">🦐</span>
                <h1>模型切换器</h1>
            </div>
            
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>正在加载模型列表...</p>
            </div>
            
            <div id="content" style="display: none;">
                <div class="current-model">
                    <label>当前使用模型</label>
                    <div class="model-name" id="currentModel">-</div>
                </div>
                
                <div class="section-title">可用模型</div>
                <div class="model-list" id="modelList"></div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                    <div class="section-title" style="margin-bottom: 8px;">🔍 发现更多模型</div>
                    <p style="color: #6c757d; font-size: 12px; margin-bottom: 12px;">扫描 OpenRouter 免费模型</p>
                    <button class="btn btn-scan" onclick="scanModels()">📡 扫描新模型</button>
                </div>
                
                <button class="btn btn-primary" onclick="loadModels()" style="margin-top: 10px;">🔄 刷新模型列表</button>
                
                <div id="message" class="message"></div>
            </div>
        </div>
    </div>

    <script>
        async function loadModels() {
            const loading = document.getElementById('loading');
            const content = document.getElementById('content');
            const message = document.getElementById('message');
            
            loading.style.display = 'block';
            content.style.display = 'none';
            message.className = 'message';
            
            try {
                const [configRes, modelsRes] = await Promise.all([
                    fetch('/api/config'),
                    fetch('/api/models')
                ]);
                
                const config = await configRes.json();
                const modelsData = await modelsRes.json();
                
                const currentModel = config.defaultModel || 'aliyun/qwen3.5-plus';
                document.getElementById('currentModel').textContent = currentModel;
                
                const modelList = document.getElementById('modelList');
                modelList.innerHTML = '';
                
                // Handle different response formats
                let modelArray = [];
                if (Array.isArray(modelsData)) {
                    modelArray = modelsData;
                } else if (modelsData.models && Array.isArray(modelsData.models)) {
                    modelArray = modelsData.models;
                } else if (typeof modelsData === 'object' && modelsData !== null) {
                    modelArray = [modelsData];
                }
                
                if (modelArray.length === 0) {
                    modelList.innerHTML = '<div class="empty-state"><p>暂无模型</p><p style="font-size:12px;">点击下方"扫描新模型"来发现更多</p></div>';
                } else {
                    modelArray.forEach(model => {
                        // Handle both string and object models
                        const modelId = typeof model === 'string' ? model : (model.key || model.id || model.name || 'unknown');
                        const isActive = modelId === currentModel;
                        const ctx = typeof model === 'object' ? (model.contextWindow || model.context_window || model.ctx || 'N/A') : 'N/A';
                        const type = typeof model === 'object' ? (model.input || model.type || model.supports || 'text') : 'text';
                        
                        const card = document.createElement('div');
                        card.className = 'model-card ' + (isActive ? 'active' : '');
                        card.onclick = () => switchModel(modelId);
                        
                        card.innerHTML = \`
                            <div class="model-info">
                                <h3>\${modelId}</h3>
                                <p>上下文：\${ctx} | 类型：\${type}</p>
                            </div>
                            <div class="status-badge \${isActive ? 'active' : 'inactive'}">
                                \${isActive ? '✓ 当前' : '切换'}
                            </div>
                        \`;
                        
                        modelList.appendChild(card);
                    });
                }
                
                loading.style.display = 'none';
                content.style.display = 'block';
                
            } catch (error) {
                console.error('加载失败:', error);
                loading.style.display = 'none';
                content.style.display = 'block';
                showMessage('加载失败：' + error.message, 'error');
            }
        }
        
        async function switchModel(modelId) {
            const message = document.getElementById('message');
            showMessage('🔄 正在切换模型并重启服务...', 'success');
            
            // 禁用所有卡片防止重复点击
            document.querySelectorAll('.model-card').forEach(card => {
                card.style.pointerEvents = 'none';
                card.style.opacity = '0.6';
            });
            
            try {
                const response = await fetch('/api/switch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: modelId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('✅ 已切换到 ' + modelId + '，网关已重启', 'success');
                    document.getElementById('currentModel').textContent = modelId;
                    
                    document.querySelectorAll('.model-card').forEach(card => {
                        card.classList.remove('active');
                        card.style.pointerEvents = '';
                        card.style.opacity = '';
                        const badge = card.querySelector('.status-badge');
                        if (badge) {
                            badge.className = 'status-badge inactive';
                            badge.textContent = '切换';
                        }
                    });
                    
                    const clickedCard = event.currentTarget;
                    clickedCard.classList.add('active');
                    const clickedBadge = clickedCard.querySelector('.status-badge');
                    clickedBadge.className = 'status-badge active';
                    clickedBadge.textContent = '✓ 当前';
                    
                    // 3秒后刷新列表确认新配置
                    setTimeout(() => loadModels(), 3000);
                } else {
                    throw new Error(result.error || '切换失败');
                }
                
            } catch (error) {
                showMessage('❌ 切换失败：' + error.message, 'error');
                // 恢复卡片可点击
                document.querySelectorAll('.model-card').forEach(card => {
                    card.style.pointerEvents = '';
                    card.style.opacity = '';
                });
            }
        }
        
        async function scanModels() {
            const message = document.getElementById('message');
            showMessage('📡 正在扫描 OpenRouter 模型，可能需要几分钟...', 'success');
            
            try {
                const response = await fetch('/api/scan', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    showMessage('✓ 扫描完成！正在刷新列表...', 'success');
                    setTimeout(() => loadModels(), 1500);
                } else {
                    throw new Error(result.error || '扫描失败');
                }
                
            } catch (error) {
                showMessage('扫描失败：' + error.message, 'error');
            }
        }
        
        function showMessage(text, type) {
            const message = document.getElementById('message');
            message.textContent = text;
            message.className = 'message ' + type;
            
            setTimeout(() => {
                message.className = 'message';
            }, 4000);
        }
        
        loadModels();
    </script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
        return;
    }
    
    if (req.url === '/api/config' && req.method === 'GET') {
        try {
            const { stdout } = await execPromise('openclaw models status --json 2>/dev/null || echo "{}"');
            const config = JSON.parse(stdout.trim() || '{}');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                defaultModel: config.default || config.model || 'aliyun/qwen3.5-plus'
            }));
        } catch (error) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ defaultModel: 'aliyun/qwen3.5-plus' }));
        }
        return;
    }
    
    if (req.url === '/api/models' && req.method === 'GET') {
        try {
            const { stdout } = await execPromise('openclaw models list --json 2>/dev/null || echo "{}"');
            let data = {};
            try {
                data = JSON.parse(stdout.trim() || '{}');
            } catch (e) {
                data = {};
            }
            // Extract models array from nested structure
            const models = data.models || (data.models && data.models.models) || [];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ models }));
        } catch (error) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ models: [] }));
        }
        return;
    }
    
    if (req.url === '/api/switch' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { model } = JSON.parse(body);
                
                // 1. 设置默认模型
                const { stdout, stderr } = await execPromise('openclaw models set "' + model + '" 2>&1');
                
                // 2. 重启网关使配置生效
                console.log('🔄 正在重启 OpenClaw 网关...');
                try {
                    await execPromise('pkill -f "openclaw gateway" 2>/dev/null; sleep 2');
                } catch (e) {
                    // 忽略停止失败的错误
                }
                
                // 启动新网关进程（后台运行）
                exec('openclaw gateway --force > /dev/null 2>&1 &', (err) => {
                    if (err) {
                        console.error('网关启动失败:', err);
                    } else {
                        console.log('✅ 网关已重启');
                    }
                });
                
                // 等待几秒让网关启动
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    model,
                    restarted: true,
                    message: '模型已切换，网关已重启'
                }));
            } catch (error) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    if (req.url === '/api/scan' && req.method === 'POST') {
        try {
            const { stdout } = await execPromise('openclaw models scan 2>&1');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, output: stdout }));
        } catch (error) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
});

function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

server.listen(PORT, '127.0.0.1', () => {
    console.log('🦐 模型切换器已启动！');
    console.log('📍 访问地址：http://127.0.0.1:' + PORT);
    console.log('⌘ 按 Ctrl+C 停止服务');
});
