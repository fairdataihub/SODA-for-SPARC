import { shell, ipcMain } from "electron";

ipcMain.handle("shell-open-external", (event, url) => {
  return shell.openExternal(url);
});

ipcMain.handle("shell-open-path", (event, path) => {
  return shell.openPath(path);
});
