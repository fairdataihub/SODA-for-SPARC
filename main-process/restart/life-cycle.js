const { ipcMain, app } = require("electron");

ipcMain.handle("quit-app", (event) => {
  app.quit();
});
