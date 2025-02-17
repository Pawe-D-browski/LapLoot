const { contextBridge, ipcRenderer } = require('electron');

const windowAPI = {
    initialize: (callback) => ipcRenderer.once('initialize', (_event, data) => callback(data)),
    onceInitialized: () => ipcRenderer.send('initialized'),

    showSuccess: (callback) => ipcRenderer.on('show-success', (_event, message) => callback(message)),
    showInfo: (callback) => ipcRenderer.on('show-info', (_event, message) => callback(message)),
    showError: (callback) => ipcRenderer.on('show-error', (_event, message) => callback(message)),

    onSpecificationsSaveRequest: (content, directory, filename) => ipcRenderer.send('specifications-save-request', content, directory, filename),
    finishSavingSpecifications: (callback) => ipcRenderer.on('finish-saving-specifications', (_event) => callback()),

    onSpecificationsSaveAsRequest: (content, defaultDirectory, defaultFilename) => ipcRenderer.send('specifications-save-as-request', content, defaultDirectory, defaultFilename),
    finishSavingSpecificationsAs: (callback) => ipcRenderer.on('finish-saving-specifications-as', (_event, directory, filename) => callback(directory, filename)),

    onOfferSaveRequest: (content, directory, filename) => ipcRenderer.send('offer-save-request', content, directory, filename),
    finishSavingOffer: (callback) => ipcRenderer.on('finish-saving-offer', (_event) => callback()),

    onOfferSaveAsRequest: (content, defaultDirectory, defaultFilename) => ipcRenderer.send('offer-save-as-request', content, defaultDirectory, defaultFilename),
    finishSavingOfferAs: (callback) => ipcRenderer.on('finish-saving-offer-as', (_event, directory, filename) => callback(directory, filename)),

    onSettingsSaveRequest: (settings) => ipcRenderer.send('settings-save-request', settings),
    finishSavingSettings: (callback) => ipcRenderer.on('finish-saving-settings', (_event, settings) => callback(settings)),

    onStorageSaveRequest: (settings) => ipcRenderer.send('storage-save-request', settings),
    finishSavingStorage: (callback) => ipcRenderer.on('finish-saving-storage', (_event, settings) => callback(settings)),

    showSaveCancel: (callback) => ipcRenderer.on('show-save-cancel', (_event, message) => callback(message)),
    showSaveError: (callback) => ipcRenderer.on('show-save-error', (_event, message) => callback(message)),

    onSpecificationsOpenRequest: (directory) => ipcRenderer.send('specifications-open-request', directory),
    finishOpeningSpecifications: (callback) => ipcRenderer.on('finish-opening-specifications', (_event, fileContent, deviceName, directory, filename) => callback(fileContent, deviceName, directory, filename)),

    onReloadRequest: () => ipcRenderer.send('reload-request'),
    finishReload: (callback) => ipcRenderer.on('finish-reload', (_event, specifications, deviceName) => callback(specifications, deviceName)),

    onGenerateRequest: (specifications) => ipcRenderer.send('generate-request', specifications),
    finishGenerating: (callback) => ipcRenderer.on('finish-generating', (_event, offer) => callback(offer)),
    showGenerationError: (callback) => ipcRenderer.on('show-generation-error', (_event, message) => callback(message)),
    onGenerateCancel: () => ipcRenderer.send('generate-cancel'),

    onToggleFullScreen: (on) => ipcRenderer.send('toggle-full-screen', on),

    onSaveChangesDialogRequest: (options) => ipcRenderer.send('save-changes-dialog-request', options),
    finishSaveChangesDialog: (callback) => ipcRenderer.on('finish-save-changes-dialog', (_event, result) => callback(result)),

    startClosing: (callback) => ipcRenderer.on('start-closing', (_event) => callback()),
    onCloseRequest: () => ipcRenderer.send('close-request')
}

contextBridge.exposeInMainWorld('API', windowAPI);
