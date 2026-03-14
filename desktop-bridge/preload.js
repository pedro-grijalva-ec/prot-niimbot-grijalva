const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    connectPrinter: () => ipcRenderer.invoke('printer:connect'),
    setApiUrl: (url) => ipcRenderer.invoke('api:set-url', url),
    getStatus: () => ipcRenderer.invoke('bridge:status'),
    togglePolling: (state) => ipcRenderer.invoke('bridge:toggle-polling', state),
    onLog: (callback) => ipcRenderer.on('bridge:log', (event, message) => callback(message)),
});
