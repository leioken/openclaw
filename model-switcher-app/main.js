const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let tray = null;
let backendProcess = null;

// 启动后端服务器
function startBackendServer() {
    const backendPath = path.join(__dirname, 'backend-server.js');
    console.log('启动后端服务器:', backendPath);
    
    // 使用完整的 node 路径
    const nodePath = '/opt/homebrew/opt/node@22/bin/node';
    
    backendProcess = spawn(nodePath, [backendPath], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
    });
    
    backendProcess.stdout.on('data', (data) => {
        console.log('后端输出:', data.toString());
    });
    
    backendProcess.stderr.on('data', (data) => {
        console.error('后端错误:', data.toString());
    });
    
    backendProcess.on('error', (error) => {
        console.error('后端服务器启动失败:', error);
    });
    
    backendProcess.on('exit', (code) => {
        console.log('后端服务器退出，代码:', code);
        backendProcess = null;
    });
}

function createWindow() {
    // 使用 PNG 格式的龙虾图标
    const iconPath = path.join(__dirname, 'lobster.png');
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        titleBarStyle: 'default',
        backgroundColor: '#667eea',
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        frame: true,
        title: '🦐 OpenClaw 小龙虾'
    });

    // 等待后端服务器启动
    setTimeout(() => {
        mainWindow.loadURL('http://127.0.0.1:18792');
    }, 3000);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
            app.dock.show();
            // 设置 Dock 图标
            try {
                app.dock.setIcon(iconPath);
            } catch (error) {
                console.log('设置 Dock 图标失败:', error.message);
            }
        }
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            // 不隐藏 Dock 图标，这样固定的图标会保留
        }
    });

    createTray();
}

function createTray() {
    // 使用 PNG 格式的托盘图标
    const iconPath = path.join(__dirname, 'lobster.png');
    try {
        const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
        tray = new Tray(trayIcon);
    } catch (error) {
        console.log('创建托盘图标失败，使用默认图标');
        // 使用默认图标
        const defaultIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABuElEQVR4nO2WQUoDQRBFa3QhiOABvIB6AA/gCbyCRxDxAK7cuXHrTkEQQRDBhRtFEMSFIAgiKP5AQRjHpKu7Zyb9oKGZma761e+qbsiyjP+8MoAbYAqMA3NgBtwCE+AK6ABZSv0R0ANmwBJYAyvgHfgCPoF34AW4Bk6jAzjXADaBCfAEvG0A+NxrYBc4iQZwBtwBb8AG+NkC8Ln3wHY0gHPgAfj+B4DvfQAuogGcAo8/APzcZ+AkGkAfeN0AwPdOowFcAi9bAHjvEjgPGNkDXrcA8N59YC8awAXwtAHgc58C1p4DT98A+NwJ0I4G0AXmGwB87zPQjgbQAz42APjee6ATDaAPfG4A8L0PwH40gAHwvgGA7x0Bh9EAhsCqBsDvjYCjaACj+I+2APjeN+AwYOQIWNUA+L3PwEHAyBGwrgHwvXNgPxrACbCqAfC9L0A7GsAp8F0D4Huf9J8gGsAlMK8B8L0vwFk0gEvgqwbA9z4DF9EA+sC6BsD3TvWfNxrAAPiuAfC9b8BBwIXoA581AL73BWhHA7gAvmsAfO8UaEcDuAK+agB87xS4jgZwoyuZO6F/tW4JjLU35yH+AMfJfhB/ANwRAAAAAElFTkSuQmCC');
        tray = new Tray(defaultIcon);
    }
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '打开小龙虾',
            click: () => {
                mainWindow.show();
                if (process.platform === 'darwin') {
                    app.dock.show();
                }
            }
        },
        {
            label: '刷新页面',
            click: () => {
                mainWindow.webContents.reload();
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('🦐 OpenClaw 小龙虾');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            if (process.platform === 'darwin') {
                app.dock.show();
            }
        }
    });
}

app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
        if (process.platform === 'darwin') {
            app.dock.show();
        }
    } else {
        createWindow();
    }
});

app.whenReady().then(() => {
    startBackendServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
    
    // 停止后端服务器
    if (backendProcess) {
        console.log('停止后端服务器...');
        backendProcess.kill();
        backendProcess = null;
    }
});

app.on('will-quit', () => {
    if (tray) {
        tray.destroy();
    }
});
