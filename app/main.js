const path = require('path');
const fs = require('fs');
const url = require('url');
const util = require('util');
const { readFile } = require('node:fs/promises');
const { generateOffer, cancelGenerating } = require('./offerGenerator');


const { app, session, protocol, net, BrowserWindow, Menu, ipcMain, dialog } = require('electron');

const { execFile } = require('child_process');

const execFilePromise = util.promisify(execFile);

const isDev = !app.isPackaged;

let appPath;
let settingsPath;
let resourcesPath;

let mainWindow = null;
let dialogWindow = null;

let mainWindowReadyToShow = false;

let isDialogResolved = false;

let readyToClose = false;

let specifications = null;
let deviceName = null;
let specificationsReady = false;
let specificationsError = false;


let settings = { "apiKey": '' };
let settingsReady = false;
let settingsError = false;


const menu = [];

checkForUnauthorizedWebContents();

app.enableSandbox();

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app',
        privileges: {
            standard: true
        }
    }
]);

app.setUserTasks([]);

app.whenReady().then(() => {
    forceCustomSecurityPolicy();

    useCustomProtocol();

    appPath = path.join(app.getAppPath(), "..", "..");
    settingsPath = isDev ? path.join(__dirname, "./settings.json") : path.join(appPath, './settings.json');
    resourcesPath = isDev ? path.join(__dirname, "./resources") : process.resourcesPath

    getInitialSpecifications();
    loadSettings();

    app.on('window-all-closed', (event) => {
        app.quit();
    });

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    ipcMain.once('initialized', async (event) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        onceInitialized();
    })

    ipcMain.on('toggle-full-screen', async (event, on) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        toggleFullScreen(on);
    })

    ipcMain.on('specifications-save-request', async (event, content, directory, filename) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        saveSpecifications(content, directory, filename);
    })

    ipcMain.on('specifications-save-as-request', async (event, content, defaultDirectory, defaultFilename) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        saveSpecificationsAs(content, defaultDirectory, defaultFilename);
    })

    ipcMain.on('offer-save-request', async (event, content, directory, filename) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        saveOffer(content, directory, filename);
    })

    ipcMain.on('offer-save-as-request', async (event, content, defaultDirectory, defaultFilename) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        saveOfferAs(content, defaultDirectory, defaultFilename);
    })

    ipcMain.on('specifications-open-request', async (event, openDirectory) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        openSpecifications(openDirectory);
    })

    ipcMain.on('reload-request', async (event) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        reloadSpecifications();
    })

    ipcMain.on('generate-request', async (event, specifications) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        generateOffer(mainWindow, settings.apiKey, specifications);
    })

    ipcMain.on('generate-cancel', async (event) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        cancelGenerating();
    })

    ipcMain.on('settings-save-request', async (event, settings) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        saveSettings(settings);
    })

    ipcMain.on('close-request', async (event) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        readyToClose = true;
        mainWindow.close()
    })

    ipcMain.on('save-changes-dialog-request', async (event, options) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        createSaveChangesDialog(options);
    })

    ipcMain.on('dialog-initialized', async (event) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        onDialogInitialized();
    })

    ipcMain.on('resolve-dialog', async (event, result) => {
        if (!validateIPCSender(event.senderFrame)) {
            return null;
        }
        resolveSaveChangesDialog(result);
    })


    createMainWindow();

    app.on('activate', (event) => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });

}).catch((error) => {
    crash(error);
})


function createMainWindow() {
    if (mainWindow) {
        mainWindow.restore();
        mainWindow.focus();
        return;
    }

    mainWindow = new BrowserWindow({
        title: 'LapLoot',
        width: 800,
        height: 500,
        minWidth: 800,
        minHeight: 500,
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
            preload: path.join(__dirname, './preloadMain.js')
        }
    });

    mainWindow.on('close', (event) => {
        if (!readyToClose) {
            event.preventDefault()
            mainWindow.webContents.send('start-closing');
        } else {
            mainWindow = null;
        }
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if ((isDev && input.control && input.shift && input.key === 'I' && input.type === "keyDown") && (!input.isAutoRepeat && !input.alt && !input.meta)) {
            event.preventDefault();
            mainWindow.webContents.openDevTools();
        }
    })

    mainWindow.once('ready-to-show', (event) => {
        mainWindowReadyToShow = true;
        initializeIfReady();
    });
    mainWindow.loadURL('app://root/renderer/index.html');
};

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
        width: 400,
        height: 400,
        minWidth: 400,
        minHeight: 400,
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
            resolveSaveChangesDialog("cancel")
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
    dialogWindow.loadURL('app://root/renderer/dialog.html');
};


function loadSettings() {
    readFile(settingsPath, { encoding: 'utf8' }).then((contents) => {
        try {
            settings = JSON.parse(contents);
            settingsReady = true;
            initializeIfReady();
        } catch (jsonError) {
            console.error(jsonError);
            settingsError = true;
            initializeIfReady();
        }
    }).catch((error) => {
        if (error.code === 'ENOENT') {
            settingsReady = true;
            initializeIfReady();
        } else {
            console.error(error)
            settingsError = true;
            initializeIfReady();
        }
    });
}


function saveSettings(newSettings) {
    newSettings.apiKey = newSettings.apiKey.trim().replace("\r", "")
    settings = newSettings;
    const jsonData = JSON.stringify(settings, null, 4);

    fs.writeFile(settingsPath, jsonData, (error) => {
        if (error) {
            console.error('Error writing file:', error);
            mainWindow.webContents.send('show-save-error', "Error saving settings");
        } else {
            mainWindow.webContents.send('finish-saving-settings', settings);
        }
    });
}

function cleanSpecifications(input) {
    input = input.split('\n').filter(line => !line.includes('^^^USB^^^')).join('\n');
    input = input.replace(/\^\^\^.*?\^\^\^/g, '');

    return input;
}


function getSpecifications() {
    const fastfetchPath = path.join(resourcesPath, './fastfetch/internal.exe');
    const configPath = path.join(resourcesPath, './fastfetch/laploot.jsonc');
    return execFilePromise(fastfetchPath, ['-c', configPath], { timeout: 10000 });
}


function getInitialSpecifications() {
    getSpecifications().then((result) => {
        if (result.error) {
            throw result.error;
        } else {
            specifications = cleanSpecifications(result.stdout.trim());
            deviceName = getDeviceNameFromSpecifications(specifications)
            specificationsReady = true;
            initializeIfReady();
        }
    }).catch((error) => {
        console.error(error);
        specificationsError = true;
        initializeIfReady();
    })
}


function reloadSpecifications() {
    getSpecifications().then((result) => {
        if (result.error) {
            throw result.error;
        } else {
            specifications = cleanSpecifications(result.stdout.trim());
            deviceName = getDeviceNameFromSpecifications(specifications)
            mainWindow.webContents.send('finish-reload', specifications, deviceName);
        }
    }).catch((error) => {
        console.error(error);
        mainWindow.webContents.send('show-error', "Error loading specifications");
    })
}


function initializeIfReady() {
    if ((mainWindowReadyToShow) && (specificationsReady || specificationsError) && (settingsReady || settingsError)) {
        mainWindow.webContents.send('initialize', {
            specificationsError: specificationsError,
            settingsError: settingsError,
            specifications: specifications,
            deviceName: deviceName,
            settings: settings
        });
    }
};

function initializeDialog(options) {
    dialogWindow.webContents.send('initialize', options);
}


function onceInitialized() {
    mainWindow.show();
}

function onDialogInitialized() {
    dialogWindow.show()
}

function createSaveChangesDialog(options) {
    isDialogResolved = false;
    createDialogWindow(options)
}

function resolveSaveChangesDialog(result) {
    isDialogResolved = true;
    dialogWindow.close()
    mainWindow.webContents.send('finish-save-changes-dialog', result);
}


function toggleFullScreen(on) {
    mainWindow.setFullScreen(on);
}

async function saveSpecifications(content, directory, filename) {
    fs.writeFile(path.join(directory, filename), content.trim().replace("\r", ""), (error) => {
        if (error) {
            console.error('Error writing file:', error);
            mainWindow.webContents.send('show-save-error', "Error saving specifications");
        } else {
            mainWindow.webContents.send('finish-saving-specifications');
        }

    });
}


async function saveSpecificationsAs(content, defaultDirectory, defaultFilename) {
    if (!defaultDirectory) {
        defaultDirectory = path.join(appPath, '..', "specifications");
    }
    if (!defaultFilename) {
        defaultFilename = "specifications.txt"
    }

    const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save specifications",
        defaultPath: path.join(defaultDirectory, defaultFilename),
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        fs.writeFile(result.filePath, content.trim().replace("\r", ""), (error) => {
            if (error) {
                console.error('Error writing file:', error);
                mainWindow.webContents.send('show-save-error', "Error saving specifications");
            } else {
                mainWindow.webContents.send('finish-saving-specifications-as', path.dirname(result.filePath), path.basename(result.filePath));
            }

        });
    } else {
        mainWindow.webContents.send('show-save-cancel', "Saving specifications canceled");
    }
}

async function saveOffer(content, directory, filename) {
    fs.writeFile(path.join(directory, filename), content.trim().replace("\r", ""), (error) => {
        if (error) {
            console.error('Error writing file:', error);
            mainWindow.webContents.send('show-save-error', "Error saving offer");
        } else {
            mainWindow.webContents.send('finish-saving-offer');
        }

    });
}


async function saveOfferAs(content, defaultDirectory, defaultFilename) {
    if (!defaultDirectory) {
        defaultDirectory = path.join(appPath, '..', "offers");
    }
    if (!defaultFilename) {
        defaultFilename = "sale_offer.txt"
    }

    const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save offer",
        defaultPath: path.join(defaultDirectory, defaultFilename),
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        fs.writeFile(result.filePath, content.trim().replace("\r", ""), (error) => {
            if (error) {
                console.error('Error writing file:', error);
                mainWindow.webContents.send('show-save-error', "Error saving offer");
            } else {
                mainWindow.webContents.send('finish-saving-offer-as', path.dirname(result.filePath), path.basename(result.filePath));
            }

        });
    } else {
        mainWindow.webContents.send('show-save-cancel', "Saving offer canceled");
    }
}


async function openSpecifications(openDirectory) {
    if (!openDirectory) {
        openDirectory = path.join(appPath, '..', "specifications");
    }

    const result = await dialog.showOpenDialog(mainWindow, {
        title: "Open specifications",
        defaultPath: openDirectory,
        filters: [
            { name: 'Text Files', extensions: ['txt'] }
        ]
    });

    if (!result.canceled && result.filePaths && result.filePaths[0]) {
        let openPath = result.filePaths[0];
        readFile(openPath, { encoding: 'utf8' }).then((contents) => {
            mainWindow.webContents.send('finish-opening-specifications', contents.trim().replace("\r", ""), getDeviceNameFromSpecifications(contents), path.dirname(openPath), path.basename(openPath));
        }).catch((error) => {
            console.error(error);
            mainWindow.webContents.send('show-error', "Error opening file");
        });

    } else {
        mainWindow.webContents.send('show-info', "Opening canceled");
    }
}


function getDeviceNameFromSpecifications(specifications) {
    try {
        let lines = specifications.trim().split('\n');
        let name = lines[0].trim()
        if (!name.startsWith("Name:") && !name.startsWith("name:")) {
            throw Error("Name not found");
        }
        name = name.replace('Name:', '').replace('name:', '').trim();
        name = name.replace("\\", '_').replace("/", '_').replace(":", '_').replace("*", '_').replace("?", '_');
        name = name.replace('"', '_').replace("<", '_').replace(">", '_').replace("|", '_').replace(" ", '_');
        if (name.length > 30) {
            throw Error("Name too long");
        } else if (name.length < 5) {
            throw Error("Name too short");
        }
        return name;
    } catch (error) {
        return null;
    }
}


function crash(error) {
    console.error(error);
    app.quit();
}


function checkForUnauthorizedWebContents() {
    app.on('web-contents-created', (event, contents) => {
        contents.on('will-attach-webview', (event, webPreferences, params) => {
            event.preventDefault()
            delete webPreferences.preload
            webPreferences.nodeIntegration = false
            crash("Unauthorized webview attachment attempt.");
        });

        contents.on('will-navigate', (event, navigationUrl) => {
            event.preventDefault()
            crash("Unauthorized navigation attempt.");
        });

        contents.setWindowOpenHandler(({ url }) => {
            crash("Unauthorized window opening attempt.")
        });
    });
}


function forceCustomSecurityPolicy() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        let scriptPolicy;
        if (details.url == 'app://root/renderer/index.html') {
            scriptPolicy = 'script-src-elem app://root/renderer/toastify.js app://root/renderer/undoRedo.js app://root/renderer/index.js;'
        } else if (details.url == 'app://root/renderer/dialog.html') {
            scriptPolicy = 'script-src-elem app://root/renderer/dialog.js;'
        }
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'none'; " + scriptPolicy + "style-src 'self'; img-src 'self'; upgrade-insecure-requests"],
            }
        });
    })
}


function useCustomProtocol() {
    protocol.handle('app', (request) => {
        const { host, pathname } = new URL(request.url);
        if (host === 'root') {
            const relativePathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;
            const pathToServe = path.resolve(__dirname, relativePathname);
            const relativePath = path.relative(__dirname, pathToServe);
            const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
            if (isSafe) {
                return net.fetch(url.pathToFileURL(pathToServe).toString());
            }
        }
        crash("Unauthorized app:// request.");
    })
}


function validateIPCSender(frame) {
    const host = (new URL(frame.url)).host;
    if (host === 'root') {
        return true;
    } else {
        crash("Unauthorized IPC sender: " + host);
    }
}
