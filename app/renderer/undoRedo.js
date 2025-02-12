let undoData = {}


function initializeUndo(textField) {
    let textFieldId = textField.id
    undoData[textFieldId] = {textField: textField, pointer: 0, stack: [{text: textField.value, selectionStart: textField.selectionStart, selectionEnd: textField.selectionEnd}]}
}


function updateUndo(textField) {
    let textFieldId = textField.id
    if (undoData[textFieldId].pointer < undoData[textFieldId].stack.length - 1) {
        undoData[textFieldId].stack = undoData[textFieldId].stack.slice(0, undoData[textFieldId].pointer + 1);
    }
    
    undoData[textFieldId].stack.push({text: undoData[textFieldId].textField.value, selectionStart: undoData[textFieldId].textField.selectionStart, selectionEnd: undoData[textFieldId].textField.selectionEnd});
    undoData[textFieldId].pointer++;
}


function undo(textField) {
    let textFieldId = textField.id
    if (undoData[textFieldId].pointer >= 1) {
        undoData[textFieldId].textField.value = undoData[textFieldId].stack[undoData[textFieldId].pointer - 1].text;
        undoData[textFieldId].textField.selectionStart = undoData[textFieldId].stack[undoData[textFieldId].pointer - 1].selectionStart
        undoData[textFieldId].textField.selectionEnd = undoData[textFieldId].stack[undoData[textFieldId].pointer - 1].selectionEnd
        undoData[textFieldId].pointer--;
    }
}


function redo(textField) {
    let textFieldId = textField.id
    if (undoData[textFieldId].pointer < undoData[textFieldId].stack.length - 1) {
        undoData[textFieldId].pointer++;
        undoData[textFieldId].textField.value = undoData[textFieldId].stack[undoData[textFieldId].pointer].text;
        undoData[textFieldId].textField.selectionStart = undoData[textFieldId].stack[undoData[textFieldId].pointer].selectionStart
        undoData[textFieldId].textField.selectionEnd = undoData[textFieldId].stack[undoData[textFieldId].pointer].selectionEnd
    }
}
