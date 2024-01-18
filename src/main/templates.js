import { ipcMain } from "electron";
import fs from "fs"

ipcMain.handle("write-template", async (event, templatePath, destinationPath) => {
    fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath))
    return
  })


ipcMain.handle("get-current-directory", async (event) => {
  return __dirname
})