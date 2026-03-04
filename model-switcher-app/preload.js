const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onRefreshModels: (callback) => ipcRenderer.on('refresh-models', callback)
});
