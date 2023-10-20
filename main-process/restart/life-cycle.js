const { ipcMain, app } = require("electron");

ipcMain.handle("restart-app", (event) => {
  app.relaunch();
  app.quit();
});
