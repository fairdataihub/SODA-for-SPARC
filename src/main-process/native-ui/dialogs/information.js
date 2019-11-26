const {ipcMain, dialog} = require('electron')

ipcMain.on('warning-clear-table', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will erase all your progress, are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(options, (index) => {
    event.sender.send('warning-clear-table-selection', index)
  })
})

ipcMain.on('warning-add-permission-owner', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(options, (index) => {
    event.sender.send('warning-add-permission-owner-selection', index)
  })
})

ipcMain.on('warning-add-permission-owner-PI', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(options, (index) => {
    event.sender.send('warning-add-permission-owner-selection-PI', index)
  })
})

