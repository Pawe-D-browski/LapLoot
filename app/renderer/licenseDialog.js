const body = document.getElementById('body');
const acceptButton = document.getElementById('accept-button');
const declineButton = document.getElementById('decline-button');


acceptButton.addEventListener('click', () => {
    onAcceptClicked();
})

declineButton.addEventListener('click', () => {
    onDeclineClicked();
})


document.addEventListener('keydown', (event) => {
   if ((event.key === 'w' && event.ctrlKey) && (!event.repeat && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("decline");
    } else if ((event.key === 'Enter') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("accept");
    } else if ((event.key === 'Escape') && (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("decline");
    } else if ((event.key === 'z' && event.ctrlKey) && (!event.altKey && !event.metaKey && !event.shiftKey)) {
        resolveDialog("decline");
    }
});

window.API.initialize((data) => {
    initialize(data);
})

function initialize(data) {
    setTimeout(() => {
        body.style.visibility = 'visible'
    }, 1)

    window.API.onceLicenseDialogInitialized();
}

function onAcceptClicked() {
    resolveDialog("accept");
}

function onDeclineClicked() {
    resolveDialog("decline");
}

function resolveDialog(result) {
    window.API.onResolveLicenseDialog(result);
}
