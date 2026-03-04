const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 18792;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const CONFIG_PATH = path.join(require('os').homedir(), '.openclaw', 'openclaw.json');

// 模型详细信息数据库
const MODEL_INFO = {
    'qwen3.5-plus': {
        name: 'Qwen 3.5 Plus',
        description: '通义千问最新旗舰模型',
        features: ['多模态', '超长上下文', '推理能力强'],
        bestFor: '复杂任务、代码生成、多轮对话',
        contextWindow: '1M tokens',
        type: '通用大模型'
    },
    'kimi-k2.5': {
        name: 'Kimi K2.5',
        description: 'Moonshot AI 最新模型',
        features: ['超长上下文', '多模态', '推理优化'],
        bestFor: '长文本处理、文档分析、代码理解',
        contextWindow: '200K tokens',
        type: '通用大模型'
    },
    'glm-5': {
        name: 'GLM-5',
        description: '智谱 AI 最新一代模型',
        features: ['推理能力强', '代码生成', '多语言'],
        bestFor: '代码生成、逻辑推理、技术写作',
        contextWindow: '128K tokens',
        type: '通用大模型'
    },
    'glm-4.7': {
        name: 'GLM-4.7',
        description: '智谱 AI 稳定版本',
        features: ['稳定可靠', '响应快速', '成本优化'],
        bestFor: '日常编码、快速响应场景',
        contextWindow: '128K tokens',
        type: '通用大模型'
    },
    'MiniMax-M2.5': {
        name: 'MiniMax M2.5',
        description: 'MiniMax 高性能模型',
        features: ['高性能', '多模态', '创意生成'],
        bestFor: '创意写作、内容生成、对话交互',
        contextWindow: '200K tokens',
        type: '通用大模型'
    },
    'qwen3-max-2026-01-23': {
        name: 'Qwen 3 Max',
        description: '通义千问 3 代旗舰版',
        features: ['强大推理', '代码优化', '长上下文'],
        bestFor: '复杂代码重构、架构设计',
        contextWindow: '256K tokens',
        type: '通用大模型'
    },
    'qwen3-coder-next': {
        name: 'Qwen 3 Coder Next',
        description: '代码专用模型 - 最新版',
        features: ['代码生成', '代码理解', '多语言支持'],
        bestFor: '代码编写、调试、重构',
        contextWindow: '256K tokens',
        type: '代码专用模型'
    },
    'qwen3-coder-plus': {
        name: 'Qwen 3 Coder Plus',
        description: '代码专用增强版',
        features: ['超长代码', '项目级理解', '架构分析'],
        bestFor: '大型项目、代码审查、架构优化',
        contextWindow: '1M tokens',
        type: '代码专用模型'
    }
};

// 获取完整配置（包含所有 API 和模型）
app.get('/api/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const currentModel = config.agents?.defaults?.model?.primary || 'unknown';
        
        // 解析所有 providers 和它们的模型
        const providers = {};
        const modelsConfig = config.models?.providers || {};
        
        Object.keys(modelsConfig).forEach(providerName => {
            const provider = modelsConfig[providerName];
            providers[providerName] = {
                name: providerName,
                baseUrl: provider.baseUrl,
                models: (provider.models || []).map(model => ({
                    id: model.id,
                    fullId: `${providerName}/${model.id}`,
                    name: model.name || model.id,
                    info: MODEL_INFO[model.id] || {
                        name: model.id,
                        description: '高性能 AI 模型',
                        features: ['通用能力'],
                        bestFor: '各类编程任务',
                        contextWindow: `${Math.floor(model.contextWindow / 1000)}K tokens`,
                        type: '通用模型'
                    },
                    contextWindow: model.contextWindow,
                    maxTokens: model.maxTokens,
                    input: model.input || ['text']
                }))
            };
        });
        
        res.json({
            success: true,
            currentModel: currentModel,
            providers: providers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 切换模型
app.post('/api/switch-model', (req, res) => {
    const { model } = req.body;
    
    if (!model) {
        return res.status(400).json({ success: false, error: '模型名称不能为空' });
    }
    
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        
        if (!config.agents) config.agents = {};
        if (!config.agents.defaults) config.agents.defaults = {};
        if (!config.agents.defaults.model) config.agents.defaults.model = {};
        
        config.agents.defaults.model.primary = model;
        
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        
        res.json({ 
            success: true, 
            message: '模型配置已更新',
            newModel: model
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动 OpenClaw 服务
app.post('/api/start-service', (req, res) => {
    console.log('正在启动 OpenClaw 服务...');
    
    const startCmd = 'eval "$(/opt/homebrew/bin/brew shellenv)" && export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && /opt/homebrew/bin/openclaw gateway > ~/Library/Logs/openclaw-launcher.log 2>&1 &';
    
    exec(startCmd, { shell: '/bin/bash' }, (error) => {
        if (error) {
            console.error('启动服务失败:', error);
            return res.status(500).json({ 
                success: false, 
                error: '服务启动失败: ' + error.message 
            });
        }
        
        setTimeout(() => {
            exec('curl -s http://localhost:18789', (error) => {
                if (error) {
                    res.status(500).json({ 
                        success: false, 
                        error: '服务启动失败，请检查日志' 
                    });
                } else {
                    console.log('✓ OpenClaw 服务已启动');
                    res.json({ 
                        success: true, 
                        message: 'OpenClaw 服务已启动' 
                    });
                }
            });
        }, 4000);
    });
});

// 停止 OpenClaw 服务
app.post('/api/stop-service', (req, res) => {
    console.log('正在停止 OpenClaw 服务...');
    
    exec('pkill -9 -f "openclaw-gateway"', (error) => {
        setTimeout(() => {
            exec('curl -s http://localhost:18789', (error) => {
                if (error) {
                    console.log('✓ OpenClaw 服务已停止');
                    res.json({ 
                        success: true, 
                        message: 'OpenClaw 服务已停止' 
                    });
                } else {
                    res.status(500).json({ 
                        success: false, 
                        error: '服务停止失败' 
                    });
                }
            });
        }, 2000);
    });
});

// 重启 OpenClaw 服务
app.post('/api/restart-service', (req, res) => {
    console.log('正在重启 OpenClaw 服务...');
    
    exec('pkill -9 -f "openclaw-gateway"', (error) => {
        setTimeout(() => {
            const startCmd = 'eval "$(/opt/homebrew/bin/brew shellenv)" && export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && /opt/homebrew/bin/openclaw gateway > ~/Library/Logs/openclaw-launcher.log 2>&1 &';
            
            exec(startCmd, { shell: '/bin/bash' }, (error) => {
                if (error) {
                    console.error('启动服务失败:', error);
                    return res.status(500).json({ 
                        success: false, 
                        error: '服务启动失败: ' + error.message 
                    });
                }
                
                setTimeout(() => {
                    exec('curl -s http://localhost:18789', (error) => {
                        if (error) {
                            res.status(500).json({ 
                                success: false, 
                                error: '服务启动失败，请手动检查' 
                            });
                        } else {
                            console.log('✓ OpenClaw 服务已重启');
                            res.json({ 
                                success: true, 
                                message: 'OpenClaw 服务已重启，新模型配置已生效'
                            });
                        }
                    });
                }, 4000);
            });
        }, 2000);
    });
});

// 获取服务状态
app.get('/api/status', (req, res) => {
    exec('curl -s http://localhost:18789', (error) => {
        const isRunning = !error;
        
        if (isRunning) {
            // 从配置文件读取当前模型
            try {
                const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
                const currentModel = config.agents?.defaults?.model?.primary || 'unknown';
                
                res.json({
                    success: true,
                    running: true,
                    currentModel: currentModel
                });
            } catch (error) {
                res.json({
                    success: true,
                    running: true,
                    currentModel: 'unknown'
                });
            }
        } else {
            res.json({
                success: true,
                running: false,
                currentModel: null
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🦐 OpenClaw 小龙虾控制器运行在 http://localhost:${PORT}`);
    console.log(`✓ 可以启动/停止服务，切换模型`);
});
