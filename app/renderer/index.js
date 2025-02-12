const body = document.getElementById('body');
const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main-content');

const specificationsEditor = document.getElementById('specifications-editor');
const offerEditor = document.getElementById('offer-editor');
const animation = document.getElementById('animation');
const settingsEditor = document.getElementById('settings');
const about = document.getElementById('about');

const banner = document.getElementById('banner');
const bannerText = document.getElementById('banner-text');
const bannerIcon = document.getElementById('banner-icon');

const specificationsTextArea = document.getElementById('specifications-text-area');
const offerTextArea = document.getElementById('offer-text-area');

const buttons = document.querySelectorAll('button');

const fileButton = document.getElementById('file-button');
const saveButton = document.getElementById('save-button');
const saveAsButton = document.getElementById('save-as-button');
const openButton = document.getElementById('open-button');
const newButton = document.getElementById('new-button');
const generateButton = document.getElementById('generate-button');
const regenerateButton = document.getElementById('regenerate-button');
const cancelGeneratingButton = document.getElementById('cancel-generating-button');
const reloadButton = document.getElementById('reload-button');
const settingsButton = document.getElementById('settings-button');
const confirmButton = document.getElementById('confirm-button');
const cancelSettingsButton = document.getElementById('cancel-settings-button');
const aboutButton = document.getElementById('about-button');
const backButton = document.getElementById('back-button');
const backToSpecificationsButton = document.getElementById('back-to-specifications-button');
const backToOfferButton = document.getElementById('back-to-offer-button');

const apiKeySetting = document.getElementById('api-key-setting');

const aboutTexts = document.querySelectorAll('.about-text');


let isFullScreen = false;

let isInputEnabled = true;
let onInputEnabled = () => { }

let onDialogSave = () => { }
let afterSave = () => { }
let onDialogBack = () => { }
let onDialogDontSave = () => { }

let stage = "specifications";
let menu = "initial";
let isGenerating = false;

let settings = { apiKey: '' };
let lastSavedSettings = null;

let haveOffer = false;

let lastSavedSpecifications = null
let lastSavedOffer = null

let deviceName = null;
let specificationsDirectory = null;
let specificationsFilename = null;
let offerDirectory = null;
let offerFilename = null;

let saveFromButton = false


function initializeFile(messageType = "success", message = null, specifications = null, name = null, directory = null, filename = null) {
    haveOffer = false

    lastSavedOffer = null

    deviceName = name;
    specificationsDirectory = directory;
    specificationsFilename = filename;
    offerDirectory = null;
    offerFilename = null;

    if (specifications) {
        specificationsTextArea.value = specifications;
    } else {
        specificationsTextArea.value = "";
    }
    lastSavedSpecifications = specificationsTextArea.value;

    offerTextArea.value = "";
    lastSavedOffer = offerTextArea.value

    initializeUndo(specificationsTextArea);
    initializeUndo(offerTextArea);

    openSpecificationsMenu()

    if (message) {
        if (messageType === "success") {
            successToast(message)
        } else if (messageType === "info") {
            infoToast(message)
        } else if (messageType === "error") {
            errorToast(message)
        }
    }
    enableInput();
}


fileButton.addEventListener('click', () => {
    onFileClicked();
})

saveButton.addEventListener('click', () => {
    onSaveClicked();
})

saveAsButton.addEventListener('click', () => {
    onSaveAsClicked();
})

openButton.addEventListener('click', () => {
    onOpenClicked();
})

newButton.addEventListener('click', () => {
    onNewClicked();
})

generateButton.addEventListener('click', () => {
    onGenerateClicked();
})

regenerateButton.addEventListener('click', () => {
    onRegenerateClicked();
})

cancelGeneratingButton.addEventListener('click', () => {
    onCancelGeneratingClicked();
})

reloadButton.addEventListener('click', () => {
    onReloadClicked();
})

settingsButton.addEventListener('click', () => {
    onSettingsClicked();
})

confirmButton.addEventListener('click', () => {
    onConfirmClicked();
})

cancelSettingsButton.addEventListener('click', () => {
    onCancelSettingsClicked();
})

aboutButton.addEventListener('click', () => {
    onAboutClicked();
})

backButton.addEventListener('click', () => {
    onBackClicked();
})

backToSpecificationsButton.addEventListener('click', () => {
    onBackToSpecificationsClicked();
})

backToOfferButton.addEventListener('click', () => {
    onBackToOfferClicked();
})


specificationsTextArea.addEventListener('input', () => {
    updateUndo(specificationsTextArea);
});

offerTextArea.addEventListener('input', () => {
    updateUndo(offerTextArea);
});

document.addEventListener('keydown', (event) => {
    if ((event.key === 'F11') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        toggleFullScreen();
    } else if ((event.key === 'w' && event.ctrlKey) && (!event.repeat && !event.altKey && !event.metaKey && !event.shiftKey)) {
        closeGracefuly();
    } else if (!isInputEnabled) {
        return;
    } else if ((event.key === 'Enter') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        onEnterPressed();
    } else if ((event.key === 'Escape') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        onEscapePressed();
    } else if ((event.key === 's' && event.ctrlKey) && (!event.repeat && !event.altKey && !event.metaKey && !event.shiftKey)) {
        onCtrlSPressed();
    } else if ((event.key === 'z' && event.ctrlKey) && (!event.altKey && !event.metaKey && !event.shiftKey)) {
        onCtrlZPressed(event);
    } else if ((event.key === 'Z' && event.ctrlKey && event.shiftKey) && (!event.altKey && !event.metaKey)) {
        onCtrlShiftZPressed(event);
    }
});


window.API.initialize((data) => {
    if (!data.specificationsError) {
        initializeFile("success", "Specifications loaded", data.specifications, data.deviceName);
    } else {
        initializeFile("error", "Error loading specifications");
    }
    if (!data.settingsError) {
        updateSettings(data.settings);
    } else {
        errorToast("Error loading settings");
    }

    setTimeout(() => {
        body.style.visibility = 'visible'
    }, 1)

    window.API.onceInitialized();
})

window.API.showInfo((message) => {
    infoToast(message);
    enableInput();
})

window.API.showError((message) => {
    errorToast(message);
    enableInput();
})

window.API.showSaveCancel((message) => {
    saveFromButton = false;
    infoToast(message);
    enableInput();
})

window.API.showSaveError((message) => {
    saveFromButton = false;
    errorToast(message);
    enableInput();
})

window.API.showGenerationError((message) => {
    if (isGenerating) {
        isGenerating = false;
        errorToast(message);
        enableInput();
        if (menu === "generate") {
            openSpecificationsMenu();
        }
    }
})

window.API.finishSavingSpecifications(() => {
    successToast("Specifications saved");
    lastSavedSpecifications = specificationsTextArea.value
    if (saveFromButton) {
        saveFromButton = false;
        goBack();
    }
    afterSave();
    enableInput();
})

window.API.finishSavingSpecificationsAs((directory, filename) => {
    successToast("Specifications saved");
    specificationsDirectory = directory;
    specificationsFilename = filename;
    lastSavedSpecifications = specificationsTextArea.value
    if (saveFromButton) {
        saveFromButton = false;
        goBack();
    }
    afterSave();
    enableInput();
})

window.API.finishSavingOffer(() => {
    successToast("Offer saved");
    lastSavedOffer = offerTextArea.value
    if (saveFromButton) {
        saveFromButton = false;
        goBack();
    }
    afterSave();
    enableInput();
})

window.API.finishSavingOfferAs((directory, filename) => {
    successToast("Offer saved");
    offerDirectory = directory;
    offerFilename = filename;
    lastSavedOffer = specificationsTextArea.value
    if (saveFromButton) {
        saveFromButton = false;
        goBack();
    }
    afterSave();
    enableInput();
})

window.API.finishOpeningSpecifications((fileContent, deviceName, directory, filename) => {
    initializeFile("success", "Specifications loaded from file", fileContent, deviceName, directory, filename)
    openSpecificationsMenu();
})

window.API.finishReload((specifications, deviceName) => {
    initializeFile("success", "Specifications reloaded", specifications, deviceName);
})

window.API.finishGenerating((offer) => {
    if (isGenerating) {
        isGenerating = false;
        offerTextArea.value = offer;
        if (!haveOffer) {
            initializeUndo(offerTextArea)
        } else {
            updateUndo(offerTextArea)
        }
        haveOffer = true;
        successToast("Offer generated");
        stage = "offer";
        openOfferMenu();
    }
})

window.API.finishSavingSettings((settings) => {
    successToast("Settings saved")
    updateSettings(settings)
    afterSave();
    enableInput()
    goBack();
})

window.API.finishSaveChangesDialog((result) => {
    if (result === "save") {
        onDialogSave()
    } else if (result === "cancel") {
        onDialogBack()
    } else if (result === "dont-save") {
        onDialogDontSave()
    }
})

window.API.startClosing(() => {
    closeGracefuly();
})

specificationsTextArea.addEventListener('focus', () => {
    window.getSelection().removeAllRanges();
});

apiKeySetting.addEventListener('focus', () => {
    window.getSelection().removeAllRanges();
});

aboutTexts.forEach((aboutText) => {
    aboutText.addEventListener('focus', () => {
        window.getSelection().removeAllRanges();
    });
});

async function save(text, windowTitle) {
    return await window.API.saveToFile(text, windowTitle);
}

function onFileClicked() {
    openFileMenu();
}

function onSaveClicked() {
    saveFromButton = true;
    if (stage === "specifications") {
        saveSpecificationsOrSaveAs()
    } else if (stage === "offer") {
        saveOfferOrSaveAs()
    }
}

function onSaveAsClicked() {
    saveFromButton = true;
    if (stage === "specifications") {
        saveSpecificationsAs()
    } else if (stage === "offer") {
        saveOfferAs()
    }
}

function onOpenClicked() {
    if (stage === "specifications") {
        forceSaveSpecifications(() => {
            openSpecifications();
        }, {
            question: "Would you like <wbr>to save <wbr>your specifications <wbr>before loading a file?",
            saveButtonText: "Save and load",
            backButtonText: "Don't load",
            backToastText: "Loading canceled",
            dontSaveButtonText: "Load without saving",
            saveButtonIcon: "down"
        })
    } else if (stage === "offer") {
        forceSaveOffer(() => {
            openSpecifications();
        }, {
            question: "Would you like <wbr>to save <wbr>your offer <wbr>before loading a file?",
            saveButtonText: "Save and load",
            backButtonText: "Don't load",
            backToastText: "Loading canceled",
            dontSaveButtonText: "Load without saving",
            saveButtonIcon: "down"
        })
    }
}

function onNewClicked() {
    if (stage === "specifications") {
        forceSaveSpecifications(() => {
            newFile();
        }, {
            question: "Would you like <wbr>to save <wbr>your specifications <wbr>before starting new file?",
            saveButtonText: "Save and continue",
            backButtonText: "Cancel",
            backToastText: "Canceled",
            dontSaveButtonText: "Discard changes",
            saveButtonIcon: "down"
        })
    } else if (stage === "offer") {
        forceSaveOffer(() => {
            newFile();
        }, {
            question: "Would you like <wbr>to save <wbr>your offer <wbr>before starting new file?",
            saveButtonText: "Save and continue",
            backButtonText: "Cancel",
            backToastText: "Canceled",
            dontSaveButtonText: "Discard changes",
            saveButtonIcon: "down"
        })
    }
}

function onReloadClicked() {
    forceSaveSpecifications(() => {
        reloadSpecifications();
    }, {
        question: "Would you like <wbr>to save <wbr>your specifications <wbr>before reloading?",
        saveButtonText: "Save and reload",
        backButtonText: "Don't reload",
        backToastText: "Reload canceled",
        dontSaveButtonText: "Reload without saving",
        saveButtonIcon: "down"
    })
}

function onGenerateClicked() {
    forceSaveSpecifications(() => {
        generateOffer();
    }, {
        question: "Would you like <wbr>to save <wbr>your specifications <wbr>before generating offer?",
        saveButtonText: "Save and generate",
        backButtonText: "Cancel",
        backToastText: "Generation canceled",
        dontSaveButtonText: "Continue without saving",
        saveButtonIcon: "down"
    })
}

function onRegenerateClicked() {
    if (stage === "specifications") {
        forceSaveSpecifications(() => {
            generateOffer();
        }, {
            question: "Would you like <wbr>to save <wbr>your specifications <wbr>before regenerating offer?",
            saveButtonText: "Save and regenerate",
            backButtonText: "Cancel",
            backToastText: "Regeneration canceled",
            dontSaveButtonText: "Continue without saving",
            saveButtonIcon: "down"
        })
    } else if (stage === "offer") {
        forceSaveOffer(() => {
            generateOffer();
        }, {
            question: "Would you like <wbr>to save <wbr>your current offer <wbr>before regenerating?",
            saveButtonText: "Save and regenerate",
            backButtonText: "Cancel",
            backToastText: "Regeneration canceled",
            dontSaveButtonText: "Continue without saving",
            saveButtonIcon: "down"
        })
    }
}

function onCancelGeneratingClicked() {
    cancelGenerating();
}

function onSettingsClicked() {
    openSettingsMenu();
}

function onConfirmClicked() {
    saveSettings();
}

function onCancelSettingsClicked() {
    cancelEditingSettings();
}

function onAboutClicked() {
    openAboutMenu();
}


function onBackClicked() {
    goBack();
}

function onBackToSpecificationsClicked() {
    forceSaveOffer(() => {
        backToSpecifications();
    }, {
        question: "Would you like <wbr>to save <wbr>your offer <wbr>before switching?",
        saveButtonText: "Save and go",
        backButtonText: "Don't go",
        backToastText: "Switching canceled",
        dontSaveButtonText: "Go without saving",
        saveButtonIcon: "down"
    })
}


function onBackToOfferClicked() {
    forceSaveSpecifications(() => {
        backToOffer();
    }, {
        question: "Would you like <wbr>to save <wbr>your specifications <wbr>before going to offer?",
        saveButtonText: "Save and go",
        backButtonText: "Don't go",
        backToastText: "Switching canceled",
        dontSaveButtonText: "Go without saving",
        saveButtonIcon: "down"
    })
}


function onEnterPressed() {
    if (menu === "settings") {
        saveSettings();
    }
}

function onEscapePressed() {
    if (menu === "settings") {
        forceSaveSettings(() => {
            goBack();
        }, {
                question: "Would you like <wbr>to save <wbr>your settings?",
                saveButtonText: "Save settings",
                backButtonText: "Cancel",
                backToastText: "Canceled",
                dontSaveButtonText: "Discard changes",
                saveButtonIcon: "check"
        })
    } else if (menu === "generate") {
        cancelGenerating();
    } else if (menu === "file" || menu === "about") {
        goBack();
    }
}


function onCtrlSPressed() {
    if (menu === "settings") {
        saveSettings();
    } else if (menu !== "generate" && stage === "specifications") {
        saveSpecificationsOrSaveAs()
    } else if (menu !== "generate" && stage === "offer") {
        saveOfferOrSaveAs()
    }
}


function onCtrlZPressed(event) {
    if (document.activeElement === specificationsTextArea) {
        context = specificationsTextArea
    } else if (document.activeElement === offerTextArea) {
        context = offerTextArea
    } else {
        return;
    }
    event.preventDefault();
    undo(context);
}

function onCtrlShiftZPressed(event) {
    if (document.activeElement === specificationsTextArea) {
        context = specificationsTextArea
    } else if (document.activeElement === offerTextArea) {
        context = offerTextArea
    } else {
        return;
    }
    event.preventDefault();
    redo(context);
}


function enableInput() {
    specificationsTextArea.disabled = false;
    offerTextArea.disabled = false;
    apiKeySetting.disabled = false;

    buttons.forEach((button) => {
        button.disabled = false;
    })

    isInputEnabled = true;
    onInputEnabled()
    onInputEnabled = () => { }
}


function disableInput() {
    isInputEnabled = false;

    specificationsTextArea.disabled = true;
    offerTextArea.disabled = true;
    apiKeySetting.disabled = true;

    buttons.forEach((button) => {
        button.disabled = true;
    });
}


function closeAnyMenu() {
    bannerIcon.remove();

    specificationsEditor.remove();
    offerEditor.remove();
    animation.remove();
    settingsEditor.remove();
    about.remove();

    fileButton.remove();
    saveButton.remove();
    saveAsButton.remove();
    openButton.remove();
    newButton.remove();
    generateButton.remove();
    regenerateButton.remove();
    cancelGeneratingButton.remove();
    reloadButton.remove();
    settingsButton.remove();
    confirmButton.remove();
    cancelSettingsButton.remove();
    aboutButton.remove();
    backButton.remove();
    backToSpecificationsButton.remove();
    backToOfferButton.remove();
}

function openSpecificationsMenu() {
    closeAnyMenu();
    stage = "specifications";
    menu = "specifications";
    bannerText.innerText = "LapLoot";
    banner.insertBefore(bannerIcon, bannerText);

    main.appendChild(specificationsEditor);

    sidebar.appendChild(fileButton);
    if (!haveOffer) {
        sidebar.appendChild(generateButton);
    } else {
        sidebar.appendChild(regenerateButton);
    }

    sidebar.appendChild(reloadButton);

    if (haveOffer) {
        sidebar.appendChild(backToOfferButton);
    }

    sidebar.appendChild(settingsButton);
    sidebar.appendChild(aboutButton);
}

function openFileMenu() {
    closeAnyMenu();
    menu = "file";

    bannerText.innerText = "File";

    if (stage === "specifications") {
        main.appendChild(specificationsEditor);
    } else if (stage === "offer") {
        main.appendChild(offerEditor);
    }

    sidebar.appendChild(saveButton);
    sidebar.appendChild(saveAsButton);
    sidebar.appendChild(openButton);
    sidebar.appendChild(newButton);
    sidebar.appendChild(backButton);
}

function openSettingsMenu() {
    closeAnyMenu();
    menu = "settings";

    bannerText.innerText = "Settings";

    main.appendChild(settingsEditor);
    sidebar.appendChild(confirmButton);
    sidebar.appendChild(cancelSettingsButton);
}

function openAboutMenu() {
    closeAnyMenu();
    menu = "about";

    bannerText.innerText = "About LapLoot";

    main.appendChild(about);
    sidebar.appendChild(backButton);
}

function openGenerateMenu() {
    closeAnyMenu();
    menu = "generate";

    bannerText.innerText = "Generating offer";

    main.appendChild(animation);
    sidebar.appendChild(cancelGeneratingButton);
}

function openOfferMenu() {
    closeAnyMenu();

    stage = "offer";
    menu = "offer";
    bannerText.innerText = "LapLoot";
    banner.insertBefore(bannerIcon, bannerText);

    main.appendChild(offerEditor);

    sidebar.appendChild(fileButton);
    sidebar.appendChild(regenerateButton);
    sidebar.appendChild(backToSpecificationsButton);
    sidebar.appendChild(settingsButton);
    sidebar.appendChild(aboutButton);
}

function goBack() {
    enableInput();
    if (stage === "specifications") {
        openSpecificationsMenu();
    } else if (stage === "offer") {
        openOfferMenu();
    }
}

function backToSpecifications() {
    stage = "specifications";
    infoToast("Editing specifications");
    openSpecificationsMenu();
}

function backToOffer() {
    stage = "offer";
    infoToast("Editing offer");
    openOfferMenu();
}

function closeGracefuly() {
    if (!isInputEnabled) {
        onInputEnabled = () => {
            closeGracefuly();
        }
        return;
    }
    if (isGenerating) {
        cancelGenerating();
    }
    if (stage === "specifications") {
        forceSaveSettings(() => {
            forceSaveSpecifications(() => {
                window.API.onCloseRequest();
            }, {
                question: "Would you like <wbr>to save <wbr>your specifications <wbr>before closing?",
                saveButtonText: "Save specifications and close",
                backButtonText: "Don't close",
                backToastText: "Closing canceled",
                dontSaveButtonText: "Close without saving",
                saveButtonIcon: "down"
            })
        }, {
            question: "Would you like <wbr>to save <wbr>your settings <wbr>before closing?",
            saveButtonText: "Save and close",
            backButtonText: "Don't close",
            backToastText: "Closing canceled",
            dontSaveButtonText: "Close without saving",
            saveButtonIcon: "check"
        });
    } else if (stage === "offer") {
        forceSaveSettings(() => {
            forceSaveOffer(() => {
                window.API.onCloseRequest();
            }, {
                question: "Would you like <wbr>to save <wbr>your offer <wbr>before closing?",
                saveButtonText: "Save offer and close",
                backButtonText: "Don't close",
                backToastText: "Closing canceled",
                dontSaveButtonText: "Close without saving",
                saveButtonIcon: "down"
            })
        }, {
            question: "Would you like <wbr>to save <wbr>your settings <wbr>before closing?",
            saveButtonText: "Save and close",
            backButtonText: "Don't close",
            backToastText: "Closing canceled",
            dontSaveButtonText: "Close without saving",
            saveButtonIcon: "check"
        });
    }

}

function forceSaveSpecifications(callback, options) {
    if (isSpecificationsSaved()) {
        callback();
    } else {
        onDialogSave = () => {
            saveSpecificationsOrSaveAs(() => {
                callback();
            });
        }
        onDialogBack = () => {
            infoToast(options.backToastText);
        }
        onDialogDontSave = () => {
            callback();
        }

        if (menu !== "specifications" && menu !== "file") {
            openSpecificationsMenu();
        }

        window.API.onSaveChangesDialogRequest(options);
    }
}

function forceSaveOffer(callback, options) {
    if (isOfferSaved()) {
        callback();
    } else {
        onDialogSave = () => {
            saveOfferOrSaveAs(() => {
                callback();
            });
        }
        onDialogBack = () => {
            infoToast(options.backToastText);
        }
        onDialogDontSave = () => {
            callback();
        }

        if (menu !== "offer" && menu !== "file") {
            openOfferMenu();
        }

        window.API.onSaveChangesDialogRequest(options);
    }
}

function forceSaveSettings(callback, options) {
    if (isSettingsSaved()) {
        callback();
    } else {
        onDialogSave = () => {
            saveSettings(() => {
                callback();
            });
        }
        onDialogBack = () => {
            infoToast(options.backToastText);
        }
        onDialogDontSave = () => {
            cancelEditingSettings();
            callback();
        }

        window.API.onSaveChangesDialogRequest(options);
    }
}


function isSettingsSaved() {
    if (apiKeySetting.value.trim().replace("\r", "") === lastSavedSettings.apiKey.trim().replace("\r", "")) {
        return true;
    } else {
        return false;
    }
}


function isSpecificationsSaved() {
    if (specificationsTextArea.value.trim().replace("\r", "") === lastSavedSpecifications.trim().replace("\r", "")) {
        return true;
    } else {
        return false;
    }
}


function isOfferSaved() {
    if (offerTextArea.value.trim().replace("\r", "") === lastSavedOffer.trim().replace("\r", "")) {
        return true;
    } else {
        return false;
    }
}


function saveSpecifications(callback = () => { }) {
    disableInput();
    afterSave = callback;
    window.API.onSpecificationsSaveRequest(specificationsTextArea.value, specificationsDirectory, specificationsFilename);
}

function saveSpecificationsAs(callback = () => { }) {
    disableInput();
    afterSave = callback;
    console.log(specificationsFilename)
    if (specificationsFilename) {
        defaultFilename = specificationsFilename
    } else if (deviceName) {
        defaultFilename = deviceName + "_specifications.txt"
    } else {
        defaultFilename = null;
    }
    window.API.onSpecificationsSaveAsRequest(specificationsTextArea.value, specificationsDirectory, defaultFilename);
}

function saveOffer(callback = () => { }) {
    disableInput();
    afterSave = callback;
    window.API.onOfferSaveRequest(offerTextArea.value, specificationsDirectory, specificationsFilename);
}

function saveOfferAs(callback = () => { }) {
    disableInput();
    afterSave = callback;
    if (offerFilename) {
        defaultFilename = offerFilename
    } else if (deviceName) {
        defaultFilename = deviceName + "_sale_offer.txt"
    } else {
        defaultFilename = null;
    }
    window.API.onOfferSaveAsRequest(offerTextArea.value, offerDirectory, defaultFilename);
}


function saveSpecificationsOrSaveAs(callback = () => { }) {
    if (specificationsFilename) {
        saveSpecifications(callback);
    } else {
        saveSpecificationsAs(callback);
    }
}

function saveOfferOrSaveAs(callback = () => { }) {
    if (offerFilename) {
        saveOffer(callback);
    } else {
        saveOfferAs(callback);
    }
}

function saveSettings(callback = () => { }) {
    disableInput();
    afterSave = callback;
    window.API.onSettingsSaveRequest({ apiKey: apiKeySetting.value });
}

function cancelEditingSettings() {
    updateSettings(settings)

    goBack();
}

function openSpecifications() {
    disableInput();
    window.API.onSpecificationsOpenRequest(specificationsDirectory);
}

function newFile() {
    initializeFile("info", "New file")
    openSpecificationsMenu();
}

function reloadSpecifications() {
    disableInput();
    window.API.onReloadRequest();
}

function generateOffer() {
    let missingCharacters = 100 - specificationsTextArea.value.trim().length;
    if (settings.apiKey === '') {
        errorToast("Please set your API key in settings first");
    } else if (missingCharacters > 0) {
        infoToast("Please write at least " + (missingCharacters) + (missingCharacters !== 100 ? " more" : "") + " character" + (missingCharacters !== 1 ? "s" : ""));
    } else {
        isGenerating = true;
        openGenerateMenu();
        window.API.onGenerateRequest(specificationsTextArea.value.trim());
    }
}

function cancelGenerating() {
    isGenerating = false;
    infoToast("Generation canceled");
    window.API.onGenerateCancel();
    goBack();
}


function updateSettings(newSettings) {
    settings = newSettings;
    lastSavedSettings = settings;
    apiKeySetting.value = settings.apiKey;
}

function toggleFullScreen() {
    window.API.onToggleFullScreen(!isFullScreen);
    isFullScreen = !isFullScreen
}

function successToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        close: true,
        className: 'toastify-success'
    }).showToast();
}

function infoToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        close: true,
        className: 'toastify-info'
    }).showToast();
}

function errorToast(message) {
    Toastify({
        text: message,
        duration: 5000,
        gravity: "bottom",
        position: "right",
        close: true,
        className: 'toastify-error'
    }).showToast();
}
