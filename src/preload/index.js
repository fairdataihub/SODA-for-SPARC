import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import os from "os"
import fs from "fs-extra"
import path from "path"
import process from "process"
import logger from 'electron-log/renderer'
import imageDataURI from "image-data-uri" // TODO: fix this
import Jimp from "jimp";
import excel4node from "excel4node";
// import * as excel4node from 'excel4node';
import { spawn } from "node:child_process"

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

      },
      platform: () => {
        return os.platform()
      },
      release: () => {
        return os.release()
      },
      type: () => {
        return os.type()
      },
      userInfo: () => {
        return os.userInfo()
      }
    })
    contextBridge.exposeInMainWorld('fs', {
      existsSync: (targetPath) => {
        return fs.existsSync(targetPath)
      },
      mkdirSync: (targetDir, options) => {
        return fs.mkdirSync(targetDir, options)
      },
      readFileSync: (filePath, encoding) => {
        return fs.readFileSync(filePath, encoding)
      },
      unlinkSync: (filepath, callback) => {
        return fs.unlinkSync(filepath, callback)
      },
      emptyDirSync: (dirpath) => {
        return fs.emptyDirSync(dirpath)
      },
      writeFileSync: (filepath, data) => {
        return fs.writeFileSync(filepath, data)
      },
      writeFile: (destinationPath, data, errcallback) => {
        return fs.writeFile(destinationPath, data, errcallback)
      },
      readdirSync: (dirpath) => {
        return fs.readdirSync(dirpath)
      },
      stat: async (filepath) => {
        return await fs.stat(filepath)
      },
      statSyncAndDirectory: (filepath) => {
        let fsStatsObj = fs.statSync(filepath);
        return fsStatsObj && fsStatsObj.isDirectory();
      },
      readdir: async (dirpath) => {
        return await fs.readdir(dirpath)
      },
      readdircallback: (dirpath, callback) => {
        return fs.readdir(dirpath, callback)
      },
      isDirectory: async (filepath) => {
        const fsStatsObj = await fs.stat(filepath);
        return fsStatsObj.isDirectory();
      },
      isDirectorySync: (filepath) => {
        const fsStatsObj = fs.statSync(filepath);
        return fsStatsObj.isDirectory();
      },
      statSync: (filepath) => {
        const fsStatsObj = fs.statSync(filepath);
        return {isDirectory: fsStatsObj.isDirectory(), isFile: fsStatsObj.isFile()}
      },
      isFile: async (filepath) => {
        const fsStatsObj = await fs.stat(filepath);
        return fsStatsObj.isFile();
      },
      readFile: async (filepath, encoding) => {
        let result = await fs.readFile(filepath, encoding)
        return JSON.parse(result)
      },
      fileSizeSync: (filepath) => {
        // use stat library to get the size of the directory
        const fileStats = fs.statSync(filepath);
        // return the size of the file 
        return fileStats.size;
      },
      rename: (filepath, newName, errcallback) => {
        return fs.rename(filepath, newName, errcallback)
      },
      lstatSyncIsDirectory: (filepath) => {
        let fsStatsObj = fs.lstatSync(filepath);
        return fsStatsObj.isDirectory();
      },
      rmdirSync: (dirpath) => {
        return fs.rmdirSync(dirpath)
      },
      openSync: (filepath, flag) => {
        return fs.openSync(filepath, flag)
      },
      closeSync: (fileDescriptor) => {
        return fs.closeSync(fileDescriptor)
      }
    })
    contextBridge.exposeInMainWorld('process', {
      platform: () => {
        return process.platform
      },
      env: () => {
        return process.env
      },
      resourcesPath: () => {
        return process.resourcesPath
      }
    })
    contextBridge.exposeInMainWorld('path', {
      join: (...paths) => {
        return path.join(...paths)
      }, 
      extname: (fileName) => {
        return path.extname(fileName)
      },
      basename: (filepath) => {
        return path.basename(filepath)
      },
      extname: (filepath) => {
        return path.extname(filepath)
      },
      parse: (filepath) => {
        return path.parse(filepath)
      },
      dirname: (filepath) => {
        return path.dirname(filepath)
      }
    })
    contextBridge.exposeInMainWorld('log', {
      info: (message) => {
        return logger.info(message)
      },
      error: (message) => {
        return logger.error(message)
      },
      warn: (message) => {
        return logger.warn(message)
      },
      debug: (message) => {
        return logger.debug(message)
      },
      verbose: (message) => {
        return logger.verbose(message)
      },
      setupRendererLogOptions: () => {
        logger.info("SA")
        logger.transports.console.level = false;
        // logger.transports.file.maxSize = 1024 * 1024 * 10;
      }
    })
    contextBridge.exposeInMainWorld('imageDataURI', {
      encodeFromURL: (url) => {
        return imageDataURI.encodeFromURL(url)
      },
      outputFile: (croppedImageDataURI, imagePath) => {
        return imageDataURI.outputFile(croppedImageDataURI, imagePath)
      }
    })
    contextBridge.exposeInMainWorld('Jimp', {
      read: (imagePath) => {
        return Jimp.read(imagePath)
      },
      write: (convertedImagePath) => {
        return Jimp.write(convertedImagePath)
      }
    })
    contextBridge.exposeInMainWorld('excel4node', {
      Workbook: () => {
        return new excel4node.Workbook()
      }
    })
    contextBridge.exposeInMainWorld('spawn', {
      stopPennsieveAgent: () => {
        return new Promise((resolve, reject) => {
          let agentStopSpawn = spawn("pennsieve", ["agent", "stop"], {
            shell: true,
            env: process.env,
          });

          agentStopSpawn.stdout.on("data", (data) => {
            logger.info(data.toString());
            resolve("Stopped the Agent")
          });
          agentStopSpawn.stderr.on("data", (data) => {
            logger.info(data.toString());
            reject(new Error(data.toString()))
          });
        })
      }, 
      startPennsieveAgent: () => {
        return new Promise((resolve, reject) => {
          let agentStartSpawn = spawn("pennsieve", {
            shell: true,
            env: process.env,
          });
      
          agentStartSpawn.stdout.on("data", async (data) => {
            return resolve(true);
          });
      
          agentStartSpawn.stderr.on("data", (data) => {
            logger.error(data.toString());
            return resolve(false);
          });
        });
      },
      startPennsieveAgentStart: () => {
        return new Promise((resolve, reject) => {
          // Keep track of the output from the agent
          // (output is added as strings to the array)
          const pennsieveAgentOutputLog = [];
          // Throw an error if the agent doesn't start within 15 seconds
          const agentStartTimeout = 15000; // 15 seconds
          const versionCheckTimeout = setTimeout(() => {
            reject(
              new Error(
                `Pennsieve Agent output while trying to start the agent:<br />${pennsieveAgentOutputLog.join(
                  "<br />"
                )}`
              )
            );
          }, agentStartTimeout);
      
          let agentStartSpawn = spawn("pennsieve", ["agent", "start"], {
            shell: true,
            env: process.env,
          });
      
          // Listen to the output from the agent and resolve the promise if the agent outputs
          // "Running Agent NOT as daemon" or "Pennsieve Agent started"
          agentStartSpawn.stdout.on("data", (data) => {
            const agentMessage = `[Pennsieve Agent Output] ${data.toString()}`;
            logger.info(agentMessage);
            // Add to message to the output logger which will be used to display the output to the user if the agent fails to start
            pennsieveAgentOutputLog.push(agentMessage);
      
            // Resolve the promise if the agent is already running
            if (agentMessage.includes("Pennsieve Agent is already running")) {
              logger.info(`Pennsieve Agent is confirmed to be running: ${agentMessage}`);
              clearTimeout(versionCheckTimeout);
              resolve();
            }
      
            // If the error message contains "Running Agent NOT as daemon" or "Pennsieve Agent started", then the agent was able to
            // start successfully with the caveat that the agent might throw an error if the agent has issues while starting up.
            // To alleviate this, we will try to start the agent again after 5 seconds and make sure the agent was started successfully.
            if (
              agentMessage.includes("Running Agent NOT as daemon") ||
              agentMessage.includes("Pennsieve Agent started")
            ) {
              setTimeout(() => {
                const secondAgentStartSpawn = spawn("pennsieve", ["agent", "start"], {
                  shell: true,
                  env: process.env,
                });
                secondAgentStartSpawn.stdout.on("data", (data) => {
                  const secondAgentMessage = `[Pennsieve Agent Output] ${data.toString()}`;
                  if (secondAgentMessage.includes("Pennsieve Agent is already running")) {
                    logger.info(`Pennsieve Agent is confirmed to be running: ${secondAgentMessage}`);
                    clearTimeout(versionCheckTimeout);
                    resolve();
                  }
                });
              }, 5000);
            }
          });
          // Capture standard error output and add it to the output logger
          agentStartSpawn.stderr.on("data", (data) => {
            const agentStdErr = `[Pennsieve Agent Error] ${data.toString()}`;
            logger.info(agentStdErr);
            pennsieveAgentOutputLog.push(agentStdErr);
          });
          // Capture error output and add it to the output logger
          agentStartSpawn.on("error", (error) => {
            const agentSpawnError = `[Pennsieve Agent Error] ${error.toString()}`;
            logger.info(agentSpawnError);
            pennsieveAgentOutputLog.push(agentSpawnError);
          });
        });
      },
      getPennsieveAgentVersion: () => {
        return new Promise((resolve, reject) => {
          // Keep track of the output from the agent
          // (output is added as strings to the array)
          const pennsieveAgentOutputLog = [];
          // Throw an error if the agent doesn't start within 15 seconds
          const timeout = 15000; // 15 seconds
          const versionCheckTimeout = setTimeout(() => {
            reject(
              new Error(
                `Pennsieve Agent output while trying to verify the agent version:<br />${pennsieveAgentOutputLog.join(
                  "<br />"
                )}`
              )
            );
          }, timeout);
      
          let agentVersionSpawn = spawn("pennsieve", ["version"], {
            shell: true,
            env: process.env,
          });
      
          // Capture standard output and parse the version
          // Resolve the promise if the version is found
          agentVersionSpawn.stdout.on("data", (data) => {
            const agentVersionOutput = `[Pennsieve Agent Output] ${data.toString()}`;
            logger.info(agentVersionOutput);
            pennsieveAgentOutputLog.push(agentVersionOutput);
      
            const versionResult = {};
            const regex = /(\w+ Version)\s*:\s*(\S+)/g;
            let match;
            while ((match = regex.exec(data)) !== null) {
              versionResult[match[1]] = match[2];
            }
            // If we were able to extract the version from the stdout, resolve the promise
            if (versionResult["Agent Version"]) {
              clearTimeout(versionCheckTimeout);
              resolve(versionResult);
            }
          });
      
          // Capture standard error output and reject the promise
          agentVersionSpawn.stderr.on("data", (data) => {
            const agentStdErr = `[Pennsieve Agent Error] ${data.toString()}`;
            logger.info(agentStdErr);
            pennsieveAgentOutputLog.push(agentStdErr);
          });
      
          // Capture error output and reject the promise
          agentVersionSpawn.on("error", (error) => {
            const agentVersionSpawnError = `[Pennsieve Agent Error] ${error.toString()}`;
            logger.info(agentVersionSpawnError);
            pennsieveAgentOutputLog.push(agentVersionSpawnError);
          });
        });
      }
    })
  } catch (error) {
    logger.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
