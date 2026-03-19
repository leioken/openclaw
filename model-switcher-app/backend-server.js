const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 18792;

const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_PATH = path.join(require('os').homedir(), '.openclaw', 'openclaw.json');

console.log('=================================');
console.log('🦐 OpenClaw 小龙虾控制器');
console.log('=================================');
console.log('工作目录:', __dirname);
console.log('Public 目录:', PUBLIC_DIR);
console.log('配置文件:', CONFIG_PATH);
console.log('=================================');

if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('错误: public 目录不存在:', PUBLIC_DIR);
    process.exit(1);
}

const INDEX_PATH = path.join(PUBLIC_DIR, 'index.html');
if (!fs.existsSync(INDEX_PATH)) {
    console.error('错误: index.html 不存在:', INDEX_PATH);
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
    console.log('请求根路径，返回 index.html');
    res.sendFile(INDEX_PATH);
});

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
        description: 'MiniMax 最新模型',
        features: ['超长上下文', '推理能力', '多模态'],
        bestFor: '长文本处理、复杂推理',
        contextWindow: '200K tokens',
        type: '通用大模型'
    },
    'qwen3-max-2026-01-23': {
        name: 'Qwen 3 Max',
        description: '通义千问 Max 版本',
        features: ['高性能', '代码生成', '推理'],
        bestFor: '复杂任务、代码生成',
        contextWindow: '256K tokens',
        type: '通用大模型'
    },
    'qwen3-coder-next': {
        name: 'Qwen 3 Coder Next',
        description: '通义千问代码专用模型',
        features: ['代码生成', '代码理解', '调试'],
        bestFor: '代码编写、重构、调试',
        contextWindow: '256K tokens',
        type: '代码专用模型'
    },
    'qwen3-coder-plus': {
        name: 'Qwen 3 Coder Plus',
        description: '通义千问代码增强版',
        features: ['代码生成', '超长上下文', '多语言'],
        bestFor: '大型项目、代码重构',
        contextWindow: '1M tokens',
        type: '代码专用模型'
    },
    'gpt-5.3-codex': {
        name: 'GPT-5.3 Codex',
        description: 'OpenAI 最新代码模型',
        features: ['代码生成', '多语言支持', '智能补全'],
        bestFor: '代码编写、调试、重构',
        contextWindow: '400K tokens',
        type: '代码专用模型'
    },
    'gpt-5.4': {
        name: 'GPT-5.4',
        description: 'OpenAI 最新旗舰模型',
        features: ['超强推理', '多模态', '长上下文'],
        bestFor: '复杂任务、深度分析、创意写作',
        contextWindow: '500K tokens',
        type: '通用大模型'
    },
    'gpt-5.2-codex': {
        name: 'GPT-5.2 Codex',
        description: 'OpenAI 代码模型稳定版',
        features: ['代码生成', '调试', '重构'],
        bestFor: '日常编码、代码审查',
        contextWindow: '350K tokens',
        type: '代码专用模型'
    },
    'gpt-5.1-codex-max': {
        name: 'GPT-5.1 Codex Max',
        description: 'OpenAI 代码模型增强版',
        features: ['大型项目', '架构设计', '性能优化'],
        bestFor: '企业级项目、系统设计',
        contextWindow: '400K tokens',
        type: '代码专用模型'
    },
    'gpt-5.2': {
        name: 'GPT-5.2',
        description: 'OpenAI 通用模型',
        features: ['推理能力', '多任务', '快速响应'],
        bestFor: '通用任务、快速开发',
        contextWindow: '400K tokens',
        type: '通用大模型'
    },
    'gpt-5.1-codex-mini': {
        name: 'GPT-5.1 Codex Mini',
        description: 'OpenAI 轻量代码模型',
        features: ['快速响应', '成本优化', '代码补全'],
        bestFor: '快速编码、代码补全',
        contextWindow: '200K tokens',
        type: '代码专用模型'
    }
};

app.get('/api/config', (req, res) => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return res.json({
                success: false,
                error: 'Config file not found',
                currentModel: 'unknown',
                providers: {}
            });
        }
        
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        
        let currentModel = 'unknown';
        if (config.agents && config.agents.defaults && config.agents.defaults.model && config.agents.defaults.model.primary) {
            currentModel = config.agents.defaults.model.primary;
        }
        
        const providers = {};
        if (config.models && config.models.providers) {
            Object.keys(config.models.providers).forEach(providerName => {
                const provider = config.models.providers[providerName];
                providers[providerName] = {
                    baseUrl: provider.baseUrl,
                    models: provider.models.map(model => {
                        const fullId = `${providerName}/${model.id}`;
                        return {
                            id: model.id,
                            fullId: fullId,
                            name: model.name,
                            info: MODEL_INFO[model.id] || {
                                name: model.name,
                                description: '模型信息',
                                features: [],
                                bestFor: '通用任务',
                                contextWindow: `${Math.floor(model.contextWindow / 1000)}K tokens`,
                                type: '通用大模型'
                            }
                        };
                    })
                };
            });
        }
        
        res.json({
            success: true,
            currentModel: currentModel,
            providers: providers
        });
    } catch (error) {
        console.error('读取配置失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            currentModel: 'unknown',
            providers: {}
        });
    }
});

app.post('/api/switch-model', (req, res) => {
    const { model } = req.body;
    
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Config file not found'
            });
        }
        
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        
        if (!config.agents) config.agents = {};
        if (!config.agents.defaults) config.agents.defaults = {};
        if (!config.agents.defaults.model) config.agents.defaults.model = {};
        
        config.agents.defaults.model.primary = model;
        
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        
        console.log('模型已切换:', model);
        res.json({
            success: true,
            message: `已切换到模型: ${model}`,
            model: model
        });
    } catch (error) {
        console.error('切换模型失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/models', (req, res) => {
    res.json({
        success: true,
        models: MODEL_INFO
    });
});

app.get('/api/status', async (req, res) => {
    try {
        exec('pgrep -f "openclaw-gateway"', (error, stdout) => {
            const running = !error && stdout.trim().length > 0;
            res.json({
                success: true,
                running: running,
                status: running ? 'running' : 'stopped',
                port: PORT,
                publicDir: PUBLIC_DIR
            });
        });
    } catch (error) {
        res.json({
            success: true,
            running: false,
            status: 'stopped'
        });
    }
});

app.get('/api/gateway-url', (req, res) => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return res.json({ success: false, error: 'Config not found' });
        }
        
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const token = config.gateway?.auth?.token || '';
        const port = config.gateway?.port || 18789;
        
        const url = `http://127.0.0.1:${port}/#token=${token}`;
        
        res.json({
            success: true,
            url: url,
            token: token
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.send('OK');
});

app.post('/api/start-service', (req, res) => {
    exec('openclaw gateway > /dev/null 2>&1 &', (error) => {
        if (error) {
            res.status(500).json({ success: false, error: error.message });
        } else {
            res.json({ success: true, message: 'OpenClaw 服务已启动' });
        }
    });
});

app.post('/api/stop-service', (req, res) => {
    exec('pkill -f "openclaw gateway"', (error) => {
        if (error && error.code !== 1) {
            res.status(500).json({ success: false, error: error.message });
        } else {
            res.json({ success: true, message: 'OpenClaw 服务已停止' });
        }
    });
});

app.post('/api/restart-service', (req, res) => {
    exec('pkill -f "openclaw gateway" && sleep 2 && openclaw gateway > /dev/null 2>&1 &', (error) => {
        if (error && error.code !== 1) {
            res.status(500).json({ success: false, error: error.message });
        } else {
            res.json({ success: true, message: 'OpenClaw 服务已重启' });
        }
    });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`✓ 服务器运行在 http://127.0.0.1:${PORT}`);
    console.log('✓ 可以启动/停止服务，切换模型');
    console.log('');
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
});
