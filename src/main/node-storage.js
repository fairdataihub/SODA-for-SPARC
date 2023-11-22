import { ipcMain, app } from "electron";
import JSONStorage from 'node-localstorage'


let nodeStorage = new JSONStorage(app.getPath("userData"));


ipcMain.handle("get-nodestorage-item", (event, key ) => {
    return nodeStorage.getItem(key);
})


ipcMain.handle("set-nodestorage-item", (event, key, item) => {
    return nodeStorage.setItem(key, item);
})