const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');


const isDev = !app.isPackaged;

let mainWindow = null;
let dialogWindow = null;

let isDialogResolved = false;
let succesCallback = () => { }

function createDialogWindow(options) {
    if (dialogWindow) {
        dialogWindow.restore();
        dialogWindow.focus();
        return;
    }

    dialogWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        title: 'LapLoot',
        width: 700,
        height: 500,
        minWidth: 700,
        minHeight: 500,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        backgroundColor: '#111',
        show: false,
        icon: path.join(__dirname, './renderer/logos/logo.png'),
        webPreferences: {
            devTools: isDev,
            javascript: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            nodeIntegrationInSubFrames: false,
            sandbox: true,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            preload: path.join(__dirname, './preloadDialog.js')
        }
    });

    dialogWindow.on('close', (event) => {
        if (!isDialogResolved) {
            event.preventDefault()
            resolveLicenseDialog("decline")
        } else {
            dialogWindow = null;
        }
    });

    dialogWindow.webContents.on('before-input-event', (event, input) => {
        if ((isDev && input.control && input.shift && input.key === 'I' && input.type === "keyDown") && (!input.isAutoRepeat && !input.alt && !input.meta)) {
            event.preventDefault();
            dialogWindow.webContents.openDevTools();
        }
    })

    dialogWindow.once('ready-to-show', (event) => {
        initializeDialog(options);
    });
    dialogWindow.loadURL('app://root/renderer/licenseDialog.html');
};


function initializeDialog(options) {
    dialogWindow.webContents.send('initialize', options);
}


function onDialogInitialized() {
    dialogWindow.show()
}


function createLicenseDialog(options) {
    isDialogResolved = false;
    createDialogWindow(options)
}


function resolveLicenseDialog(result) {
    isDialogResolved = true;
    dialogWindow.close()
    if (result === "accept") {
        succesCallback()
    } else {
        mainWindow.close()
    }
}


function licenseDialog(window, callback) {
    succesCallback = callback;
    mainWindow = window;

    ipcMain.on('license-dialog-request', async (event, options) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        createLicenseDialog(options);
    })

    ipcMain.on('license-dialog-initialized', async (event) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        onDialogInitialized();
    })

    ipcMain.on('resolve-license-dialog', async (event, result) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        resolveLicenseDialog(result);
    })

    createLicenseDialog();
}


function validateIPCSender(frame) {
    const host = (new URL(frame.url)).host;
    if (host === 'root') {
        return true;
    } else {
        crash("Unauthorized IPC sender: " + host);
    }
}


function crash(error) {
    console.error(error);
    app.quit();
}


module.exports = {
    licenseDialog
};
