import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import os from"os"
import fs from "fs-extra"
import path from "path"


// Custom APIs for renderer
const api = {
  homeDir: () => {
    return app.getPath('home')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    // contextBridge.exposeInMainWorld('process', process)
    contextBridge.exposeInMainWorld('os', {
      homedir: () => {
        return os.homedir()
        
    }})
    contextBridge.exposeInMainWorld('fs', {
      existsSync: (targetPath) => {
        return fs.existsSync(targetPath)
      }, 
      mkdirSync: (targetDir, options) => {
        return fs.mkdirSync(targetDir, options)
      }
    })
    contextBridge.exposeInMainWorld('path', {
      join: (...paths) => {
        return path.join(...paths)
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
