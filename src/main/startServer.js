import { spawn, execFile, spawnSync } from "node:child_process";
import { existsSync } from "fs";
import fp from "find-free-port";
import { ipcMain } from "electron";
import log from "electron-log/main";
import { join } from "path";

global.serverLive = true;
global.script = null;

const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "../src/pyflask";
const PY_FLASK_MODULE = "app";
const UPLOAD_MODULE_FOLDER = "../src/uploadServer";
const UPLOAD_MODULE = "uploadApp";
let PORT = 4242;
const portRange = 100;
let pyflaskProcess = null;
let uploadAppProcess = null;
let selectedPort = null;

const selectPort = () => {
  return PORT;
};

/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
const guessPackaged = () => {
  const executablePathUnix = join(process.resourcesPath, PY_FLASK_MODULE);
  const executablePathWindows = join(process.resourcesPath, PY_FLASK_MODULE + ".exe");

  if (existsSync(executablePathUnix) || existsSync(executablePathWindows)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Get the system path to the api server script.
 * The script is located in the resources folder for packaged Linux and Mac builds and in the app.getAppPath() for Windows builds.
 * It is relative to the main.js file directory when in dev mode.
 * @returns {string} The path to the api server script that needs to be executed to start the Python server
 */
const getScriptPath = () => {
  if (!guessPackaged()) {
    log.info("App is not packaged returning path: ");
    log.info(join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"));
    return [
      join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"),
      join(__dirname, "..", UPLOAD_MODULE_FOLDER),
    ];
  }
  if (process.platform === "win32") {
    const winPathPyflask = join(process.resourcesPath, PY_FLASK_MODULE + ".exe");
    log.info("App is packaged [Windows]; Path to server executable: " + winPathPyflask);

    const winPathUploadServer = join(process.resourcesPath, UPLOAD_MODULE + ".exe");
    log.info("UploadApp is packaged [Windows]; Path to server executable: " + winPathUploadServer);

    return [winPathPyflask, winPathUploadServer];
  } else {
    const unixPath = join(process.resourcesPath, PY_FLASK_MODULE);
    const unixPathUpload = join(process.resourcesPath, UPLOAD_MODULE);
    log.info("App is packaged [ Unix ]; Path to server executable: " + unixPath);
    return [unixPath, unixPathUpload];
  }
};

export const createPyProc = async () => {
  let scripts = getScriptPath();
  let script = scripts[0];
  global.script = script;
  let uploadScript = scripts[1];
  log.info(`Path to server executable: ${script}`);
  let port = "" + selectPort();
  try {
    await killAllPreviousProcesses();
  } catch (e) {}
  if (existsSync(script)) {
    log.info("Server exists at specified location", script);
  } else {
    log.info("Server doesn't exist at specified location");
  }

  if (existsSync(uploadScript)) {
    log.info("Upload server exists at specified location", uploadScript);
  } else {
    log.info("Server doesn't exist at specified location");
  }

  fp(PORT, PORT + portRange)
    .then(([freePort]) => {
      let port = freePort;
      if (guessPackaged()) {
        log.info("Application is packaged");
        // Store the stdout and stederr in a string to log later
        let sessionServerOutput = "";
        log.info(`Starting server on port ${port}`);
        pyflaskProcess = execFile(script, [port], (error, stdout, stderr) => {
          if (error) {
            console.error(error);
            log.error(error);
            // console.error(stderr)
            // throw error;
          }
        });
        // log the stdout and stderr
        pyflaskProcess.stdout.on("data", (data) => {
          const logOutput = `[pyflaskProcess output] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });
        pyflaskProcess.stderr.on("data", (data) => {
          const logOutput = `[pyflaskProcess stderr] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
          global.serverLive = false;
        });
        // On close, log the outputs and the exit code
        pyflaskProcess.on("close", (code) => {
          log.info(`child process exited with code ${code}`);
          log.info("Server output during session found below:");
          log.info(sessionServerOutput);
          global.serverLive = false;
        });
        // Event listener for when the process exits
        pyflaskProcess.on("exit", (code, signal) => {
          if (signal) {
            log.info(`Process was killed by signal: ${signal}`);
            global.serverLive = false;
          } else if (code !== 0) {
            log.info(`Process exited with error code: ${code}`);
            global.serverLive = false;
          } else {
            log.info("Process exited successfully");
            global.serverLive = false;
          }
        });
      } else {
        log.info("Application is not packaged");
        // update code here
        pyflaskProcess = spawn("python", [script, port], {
          stdio: "ignore",
        });

        pyflaskProcess.on("data", function () {});

        pyflaskProcess.on("error", function (err) {
          console.error("Failed to start pyflaskProcess:", err);
          global.serverLive = false;
        });

        pyflaskProcess.on("close", function (err) {
          console.error("Failed to start pyflaskProcess:", err);
          global.serverLive = false;
        });

        // Event listener for when the process exits
        pyflaskProcess.on("exit", (code, signal) => {
          if (signal) {
            global.serverLive = false;

            log.info(`Process was killed by signal: ${signal}`);
          } else if (code !== 0) {
            global.serverLive = false;

            log.info(`Process exited with error code: ${code}`);
          } else {
            global.serverLive = false;

            log.info("Process exited successfully");
          }
        });
      }
      if (pyflaskProcess != null) {
        log.info("child process success on port " + port);
      } else {
        console.error("child process failed to start on port" + port);
      }
      selectedPort = port;
    })
    .catch((err) => {
      log.error("Error starting the python server");
      log.error(err);
    });

  if (!guessPackaged()) {
    return;
  }

  let sessionServerOutputUpload = "";
};

export const exitPyProc = async () => {
  log.info("Killing python server process");
  // Windows does not properly shut off the python server process. This ensures it is killed.
  const killPythonProcess = () => {
    // kill pyproc with command line
    const cmd = spawnSync("taskkill", ["/pid", pyflaskProcess.pid, "/f", "/t"]);
    const cmd2 = spawnSync("taskkill", ["/pid", uploadAppProcess.pid, "/f", "/t"]);
  };
  try {
    await killAllPreviousProcesses();
  } catch (e) {}
  // check if the platform is Windows
  if (process.platform === "win32") {
    if (pyflaskProcess != null) {
      killPythonProcess();
    }
    pyflaskProcess = null;
    uploadAppProcess = null;
    PORT = null;
    return;
  }
  // kill signal to pyProc
  try {
    if (pyflaskProcess != null) {
      pyflaskProcess.kill();
      pyflaskProcess = null;
    }
    if (uploadAppProcess != null) {
      uploadAppProcess.kill();
      uploadAppProcess = null;
    }
  } catch (e) {}
  PORT = null;
};

ipcMain.handle("restart-server", (event, port) => {
  return new Promise((resolve, reject) => {
    let serverReady = false;
    const pyflaskProcess = spawn("python", [global.script, port], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const READY_MESSAGE = "Running on"; // <-- Change this to match your server's ready output

    pyflaskProcess.stdout.on("data", (data) => {
      const output = data.toString();
      const logOutput = `[pyflaskProcess output] ${output}`;
      event.sender.send("restart-server:progress", logOutput);
      if (!serverReady && output.includes(READY_MESSAGE)) {
        serverReady = true;
        global.serverLive = true;
        resolve("Server is live");
      }
    });

    pyflaskProcess.stderr.on("data", (data) => {
      const logOutput = `[pyflaskProcess stderr] ${data.toString()}`;
      event.sender.send("restart-server:progress", logOutput);
    });

    pyflaskProcess.on("close", (code) => {
      global.serverLive = false;
      if (!serverReady) {
        reject(new Error(`Server process closed before ready. Exit code: ${code}`));
      } else {
        event.sender.send("restart-server:progress", `child process closed with code ${code}`);
      }
    });

    pyflaskProcess.on("exit", (code, signal) => {
      global.serverLive = false;
      if (!serverReady) {
        if (signal) {
          log.info(`Process was killed by signal: ${signal}`);
          reject(new Error(`child process killed with signal ${signal}`));
        } else if (code !== 0) {
          log.info(`Process exited with error code: ${code}`);
          reject(new Error(`Process exited with error code: ${code}`));
        }
      } else {
        log.info("Process exited successfully");
        // Already resolved if serverReady
      }
    });
  });
});

ipcMain.handle("get-port", () => {
  log.info("Renderer requested port: " + selectedPort);
  return selectedPort;
});
