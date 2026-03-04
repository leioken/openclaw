const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;
let tray = null;
let configWatcher = null;
let restartTimeout = null;

const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');

function restartOpenClawService() {
    return new Promise((resolve, reject) => {
        console.log('🔄 正在重启 OpenClaw 服务...');
        
        // 停止服务
        exec('pkill -9 -f "openclaw-gateway"', (error) => {
            setTimeout(() => {
                // 启动服务
                const startCmd = 'eval "$(/opt/homebrew/bin/brew shellenv)" && export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && /opt/homebrew/bin/openclaw gateway > ~/Library/Logs/openclaw-launcher.log 2>&1 &';
                
                exec(startCmd, { shell: '/bin/bash' }, (error) => {
                    if (error) {
                        console.error('❌ 启动服务失败:', error);
                        reject(error);
                        return;
                    }
                    
                    // 等待服务启动
                    setTimeout(() => {
                        exec('curl -s http://localhost:18789', (error) => {
                            if (error) {
                                console.error('❌ 服务启动失败');
                                reject(new Error('服务启动失败'));
                            } else {
                                console.log('✅ OpenClaw 服务已重启');
                                // 通知渲染进程
                                if (mainWindow && !mainWindow.isDestroyed()) {
                                    mainWindow.webContents.send('service-restarted');
                                }
                                resolve();
                            }
                        });
                    }, 4000);
                });
            }, 2000);
        });
    });
}

function watchConfigFile() {
    if (configWatcher) {
        configWatcher.close();
    }
    
    let lastConfig = '';
    try {
        lastConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
    } catch (err) {
        console.error('无法读取配置文件:', err);
        return;
    }
    
    configWatcher = fs.watch(CONFIG_PATH, (eventType) => {
        if (eventType === 'change') {
            // 清除之前的定时器
            if (restartTimeout) {
                clearTimeout(restartTimeout);
            }
            
            // 延迟重启，避免频繁重启
            restartTimeout = setTimeout(() => {
                try {
                    const newConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
                    const oldModel = JSON.parse(lastConfig).agents?.defaults?.model?.primary;
                    const newModel = JSON.parse(newConfig).agents?.defaults?.model?.primary;
                    
                    if (oldModel !== newModel) {
                        console.log(`�� 检测到模型切换: ${oldModel} → ${newModel}`);
                        lastConfig = newConfig;
                        
                        restartOpenClawService()
                            .then(() => {
                                console.log(`✅ 已切换到模型: ${newModel}`);
                            })
                            .catch((err) => {
                                console.error('❌ 重启服务失败:', err);
                            });
                    }
                } catch (err) {
                    console.error('处理配置变化失败:', err);
                }
            }, 1000); // 1秒后重启
        }
    });
    
    console.log('👀 开始监听配置文件变化...');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 720,
        height: 780,
        minWidth: 500,
        minHeight: 600,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 20, y: 20 },
        backgroundColor: '#667eea',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png'),
        show: false,
        frame: true,
        title: '🦐 模型切换器 (自动重启)'
    });

    mainWindow.loadURL('http://127.0.0.1:18791');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 开始监听配置文件
    watchConfigFile();

    // 创建系统托盘
    createTray();

    mainWindow.on('closed', () => {
        if (configWatcher) {
            configWatcher.close();
        }
    });

    // macOS 特有：点击 dock 图标重新打开窗口
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}

function createTray() {
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABuElEQVR4nO2WQUoDQRBFa3QhiOABvIB6AA/gCbyCRxDxAK7cuXHrTkEQQRDBhRtFEMSFIAgiKP5AQRjHpKu7Zyb9oKGZma761e+qbsiyjP+8MoAbYAqMA3NgBtwCE+AK6ABZSv0R0ANmwBJYAyvgHfgCPoF34AW4Bk6jAzjXADaBCfAEvG0A+NxrYBc4iQZwBtwBb8AG+NkC8Ln3wHY0gHPgAfj+B4DvfQAuogGcAo8/APzcZ+AkGkAfeN0AwPdOowFcAi9bAHjvEjgPGNkDXrcA8N59YC8awAXwtAHgc58C1p4DT98A+NwJ0I4G0AXmGwB87zPQjgbQAz42APjee6ATDaAPfG4A8L0PwH40gAHwvgGA7x0Bh9EAhsCqBsDvjYCjaACj+I+2APjeN+AwYOQIWNUA+L3PwEHAyBGwrgHwvXNgPxrACbCqAfC9L0A7GsAp8F0D4Huf9J8gGsAlMK8B8L0vwFk0gEvgqwbA9z4DF9EA+sC6BsD3TvWfNxrAAPiuAfC9b8BBwIXoA581AL73BWhHA7gAvmsAfO8UaEcDuAK+agB87xS4jgZwoyuZO6F/tW4JjLU35yH+AMfJfhB/ANwRAAAAAElFTkSuQmCC');
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '打开模型切换器',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        {
            label: '手动重启服务',
            click: () => {
                restartOpenClawService()
                    .then(() => console.log('✅ 服务已重启'))
                    .catch((err) => console.error('❌ 重启失败:', err));
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('🦐 模型切换器 (自动重启)');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    
    app.on('window-all-closed', (e) => {
        e.preventDefault();
    });
});

app.on('will-quit', () => {
    if (configWatcher) {
        configWatcher.close();
    }
    if (tray) {
        tray.destroy();
    }
});

app.on('before-quit', () => {
    if (configWatcher) {
        configWatcher.close();
    }
});
