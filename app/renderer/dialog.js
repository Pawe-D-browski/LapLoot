const body = document.getElementById('body');
const label = document.getElementById('dialog-label');
const saveButton = document.getElementById('save-button');
const backButton = document.getElementById('back-button');
const dontSaveButton = document.getElementById('dont-save-button');

saveButton.addEventListener('click', () => {
    onSaveClicked();
})

backButton.addEventListener('click', () => {
    onBackClicked();
})

dontSaveButton.addEventListener('click', () => {
    onDontSaveClicked();
})

document.addEventListener('keydown', (event) => {
   if ((event.key === 'w' && event.ctrlKey) && (!event.repeat && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("cancel");
    } else if ((event.key === 'Enter') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("save");
    } else if ((event.key === 'Escape') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("cancel");
    } else if ((event.key === 's' && event.ctrlKey) && (!event.repeat && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("save");
    } else if ((event.key === 'z' && event.ctrlKey) && (!event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("cancel");
    }
});

window.API.initialize((data) => {
    initialize(data);
})

function initialize(data) {
    label.innerHTML = label.innerHTML + data.question;
    saveButton.innerHTML = saveButton.innerHTML + data.saveButtonText;
    backButton.innerHTML = backButton.innerHTML + data.backButtonText;
    dontSaveButton.innerHTML = dontSaveButton.innerHTML + data.dontSaveButtonText;

    const downIcon = document.getElementById('down');
    const checkIcon = document.getElementById('check');

    if (data.saveButtonIcon === "down") {
        checkIcon.remove();
    } else if (data.saveButtonIcon === "check") {
        downIcon.remove();
    }

    setTimeout(() => {
        body.style.visibility = 'visible'
    }, 1)

    window.API.onceInitialized();
}

function onSaveClicked() {
    resolveDialog("save");
}

function onBackClicked() {
    resolveDialog("cancel");
}

function onDontSaveClicked() {
    resolveDialog("dont-save");
}

function resolveDialog(result) {
    window.API.onResolveDialog(result);
}
