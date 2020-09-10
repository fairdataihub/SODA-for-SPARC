
ipcRenderer.on('save-file-organization-dialog', (event) => {
  const options = {
    title: 'Save File Organization',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }
  dialog.showSaveDialog(null, options, (filename) => {
    event.sender.send('selected-saveorganizationfile', filename)
  })
})
