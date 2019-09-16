const {ipcRenderer} = require('electron')

// SPARC folder
const selectCodeBtn = document.getElementById('select-code')
selectCodeBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-code')
})
ipcRenderer.on('selected-code', (event, path) => {
  document.getElementById('selected-code').value = path
  var newRow = document.getElementById('codeTable').insertRow()
  var newCell = newRow.insertCell(0)
  newCell.innerHTML = path
  console.log(newRow)
})