const { contextBridge, ipcRenderer } = require('electron');

const windowAPI = {
    initialize: (callback) => ipcRenderer.once('initialize', (_event, data) => callback(data)),
    onceSaveDialogInitialized: () => ipcRenderer.send('save-dialog-initialized'),
    onceLicenseDialogInitialized: () => ipcRenderer.send('license-dialog-initialized'),

    onResolveSaveDialog: (result) => ipcRenderer.send('resolve-save-dialog', result),
    onResolveLicenseDialog: (result) => ipcRenderer.send('resolve-license-dialog', result)
}

contextBridge.exposeInMainWorld('API', windowAPI);
