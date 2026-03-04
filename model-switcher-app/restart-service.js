const { exec } = require('child_process');

function restartOpenClawService() {
    return new Promise((resolve, reject) => {
        console.log('正在重启 OpenClaw 服务...');
        
        // 停止服务
        exec('pkill -9 -f "openclaw-gateway"', (error) => {
            // 忽略错误，继续
            setTimeout(() => {
                // 启动服务
                const startCmd = 'eval "$(/opt/homebrew/bin/brew shellenv)" && export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && /opt/homebrew/bin/openclaw gateway > ~/Library/Logs/openclaw-launcher.log 2>&1 &';
                
                exec(startCmd, { shell: '/bin/bash' }, (error) => {
                    if (error) {
                        console.error('启动服务失败:', error);
                        reject(error);
                        return;
                    }
                    
                    // 等待服务启动
                    setTimeout(() => {
                        exec('curl -s http://localhost:18789', (error) => {
                            if (error) {
                                reject(new Error('服务启动失败'));
                            } else {
                                console.log('✓ OpenClaw 服务已重启');
                                resolve();
                            }
                        });
                    }, 3000);
                });
            }, 2000);
        });
    });
}

module.exports = { restartOpenClawService };
