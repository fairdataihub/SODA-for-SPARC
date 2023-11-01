import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import os from"os"
import fs from "fs-extra"
import path from "path"
import process from "process"
import log from 'electron-log/renderer'
import imageDataURI from "image-data-uri" // TODO: fix this
import Jimp from "jimp";
import excel4node from "excel4node";

import "v8-compile-cache";




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
    }),
    contextBridge.exposeInMainWorld('process', {
      platform: () => {
        return process.platform
      }, 
      env: () => {
        return process.env
      }
    })
    contextBridge.exposeInMainWorld('path', {
      join: (...paths) => {
        return path.join(...paths)
      }
    }), 
    contextBridge.exposeInMainWorld('log', {
      info: (message) => {
        return log.info(message)
      },
      error: (message) => {
        return log.error(message)
      },
      warn: (message) => {
        return log.warn(message)
      },
      debug: (message) => {
        return log.debug(message)
      },
      verbose: (message) => {
        return log.verbose(message)
      }
    }),
    contextBridge.exposeInMainWorld('imageDataURI', {
      encodeFromURL: (url) => {
        return imageDataURI.encodeFromURL(url)
      }, 
      outputFile: (croppedImageDataURI, imagePath) => {
        return imageDataURI.outputFile(croppedImageDataURI, imagePath)
      }
    }), 
    contextBridge.exposeInMainWorld('Jimp', {
      read: (imagePath) => {
        return Jimp.read(imagePath)
      }
    }), 
    contextBridge.exposeInMainWorld('excel4node', {
      Workbook: () => {
        return new excel4node.Workbook()
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
