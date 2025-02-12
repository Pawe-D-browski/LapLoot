const { contextBridge, ipcRenderer } = require('electron');

const windowAPI = {
    initialize: (callback) => ipcRenderer.once('initialize', (_event, data) => callback(data)),
    onceInitialized: () => ipcRenderer.send('dialog-initialized'),

    onResolveDialog: (result) => ipcRenderer.send('resolve-dialog', result)
}

contextBridge.exposeInMainWorld('API', windowAPI);
