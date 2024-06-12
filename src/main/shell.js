import { shell, ipcMain } from "electron";

ipcMain.handle("shell-open-path", (event, path) => {
  return shell.openPath(path);
});
