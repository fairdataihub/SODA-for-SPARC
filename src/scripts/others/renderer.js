//////////////////////////////////
// Import required modules
//////////////////////////////////

// const zerorpc = require("zerorpc");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { ipcRenderer, BrowserWindow } = require("electron");
const Editor = require("@toast-ui/editor");
const remote = require("electron").remote;
const { Notyf } = require("notyf");
const imageDataURI = require("image-data-uri");
const log = require("electron-log");
const Airtable = require("airtable");
require("v8-compile-cache");
const Tagify = require("@yaireo/tagify");
const https = require("https");
const $ = require("jquery");
// const PDFDocument = require("pdfkit");
// const html2canvas = require("html2canvas");
// const removeMd = require("remove-markdown");
const electron = require("electron");
const bootbox = require("bootbox");
const DragSelect = require("dragselect");
const excelToJson = require("convert-excel-to-json");
const csvToJson = require("convert-csv-to-json");
const Jimp = require("jimp");
const { JSONStorage } = require("node-localstorage");
const tippy = require("tippy.js").default;
const introJs = require("intro.js");
const selectpicker = require("bootstrap-select");
const ini = require("ini");
const { homedir } = require("os");
const diskCheck = require("check-disk-space").default;
// TODO: Test with a build
const {
  datasetUploadSession,
} = require("./scripts/others/analytics/upload-session-tracker");

const {
  logCurationErrorsToAnalytics,
  logCurationSuccessToAnalytics,
} = require("./scripts/others/analytics/curation-analytics");
const {
  determineDatasetLocation,
} = require("./scripts/others/analytics/analytics-utils");
const {
  clientError,
  userErrorMessage,
} = require("./scripts/others/http-error-handler/error-handler");
const api = require("./scripts/others/api/api");

const axios = require("axios").default;

const DatePicker = require("tui-date-picker"); /* CommonJS */
const excel4node = require("excel4node");

const { backOff } = require("exponential-backoff");

// const prevent_sleep_id = "";
const electron_app = electron.app;
const app = remote.app;
const shell = electron.shell;
const Clipboard = electron.clipboard;
var noAirtable = false;

var nextBtnDisabledVariable = true;
var reverseSwalButtons = false;

var datasetStructureJSONObj = {
  folders: {},
  files: {},
  type: "",
};

let introStatus = {
  organizeStep3: true,
  submission: false,
  subjects: false,
  samples: false,
};

/**
 * Clear the Pennsieve Agent's upload queue. Should be run after pre_rlight_checks have passed.
 *
 */
const clearQueue = () => {
  // determine OS
  const os = require("os");
  const platform = os.platform();
  let pennsievePath;

  if (platform === "darwin") {
    pennsievePath = "/usr/local/opt/pennsieve/bin/pennsieve";
  } else if (platform === "win32") {
    pennsievePath = "C:\\Program Files\\PennSieve\\pennsieve.exe";
  } else {
    // linux pennsieve path
    pennsievePath = "/usr/local/bin/pennsieve";
  }

  //* clear the Pennsieve Queue
  const child = require("child_process").spawnSync(
    pennsievePath,
    ["upload-status", "--cancel-all"],
    { timeout: 4000 }
  );

  //* check if there was an error in the subprocess that prevented it from launching
  if (child.error !== undefined) {
    console.error(child.error);
    log.error(child.error);
    return;
  }

  //* if Pennsieve had an error outputed to the console log it for debugging
  if (child.stderr !== null && child.stderr.length > 0) {
    console.error(child.stderr.toString("utf8"));
    log.error(child.stderr.toString("utf8"));
    return;
  }
};

//////////////////////////////////
// App launch actions
//////////////////////////////////

// Log file settings //
log.transports.console.level = false;
log.transports.file.maxSize = 1024 * 1024 * 10;
const homeDirectory = app.getPath("home");
const SODA_SPARC_API_KEY = "SODA-Pennsieve";

// set to true once the SODA server has been connected to
let sodaIsConnected = false;
// set to true once the API version has been confirmed
let apiVersionChecked = false;

//log user's OS version //
log.info("User OS:", os.type(), os.platform(), "version:", os.release());
console.log("User OS:", os.type(), os.platform(), "version:", os.release());

// Check current app version //
const appVersion = window.require("electron").remote.app.getVersion();
log.info("Current SODA version:", appVersion);
console.log("Current SODA version:", appVersion);

//////////////////////////////////
// Connect to Python back-end
//////////////////////////////////

let client = null;

client = axios.create({
  baseURL: "http://127.0.0.1:4242/",
  timeout: 300000,
});

const notyf = new Notyf({
  position: { x: "right", y: "bottom" },
  ripple: true,
  dismissible: true,
  ripple: false,
  types: [
    {
      type: "checking_server_is_live",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 1000,
    },
    {
      type: "checking_server_api_version",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 1000,
    },
    {
      type: "loading_internet",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 10000,
    },
    {
      type: "ps_agent",
      background: "grey",
      icon: {
        className: "fas fa-cogs",
        tagName: "i",
        color: "white",
      },
      duration: 5000,
    },
    {
      type: "app_update",
      background: "grey",
      icon: {
        className: "fas fa-sync-alt",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "api_key_search",
      background: "grey",
      icon: {
        className: "fas fa-users-cog",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "success",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 800,
    },
    {
      type: "final",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
    {
      type: "warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-exclamation-triangle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
    {
      type: "app_update_warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-tools",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "error",
      background: "#B80D49",
      icon: {
        className: "fas fa-times-circle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
  ],
});

let connected_to_internet = false;
let update_available_notification = "";
let update_downloaded_notification = "";

// utility function for async style set timeout
const wait = async (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// check that the client connected to the server using exponential backoff
// verify the api versions match
const startupServerAndApiCheck = async () => {
  // wait for SWAL to be loaded in
  await wait(2000);

  // notify the user that the application is starting connecting to the server
  Swal.fire({
    icon: "info",
    title: `Connecting to the SODA server`,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "Restart now",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Darwin executable starts slowly
  // use an exponential backoff to wait for the app server to be ready
  // this will give Mac users more time before receiving a backend server error message
  // ( during the wait period the server should start )
  // Bonus:  doesn't stop Windows and Linux users from starting right away
  // NOTE: backOff is bad at surfacing errors to the console
  try {
    await backOff(serverIsLiveStartup, {
      delayFirstAttempt: true,
      startingDelay: 1000, // 1 second + 2 second + 4 second + 8 second
      timeMultiple: 2,
      numOfAttempts: 4,
      maxDelay: 8000, // 16 seconds max wait time
    });
  } catch (e) {
    log.error(e);
    console.error(e);
    ipcRenderer.send(
      "track-event",
      "Error",
      "Establishing Python Connection",
      e
    );
    // SWAL that the server needs to be restarted for the app to work
    await Swal.fire({
      icon: "error",
      html: `Something went wrong with loading all the backend systems for SODA. Please restart SODA and try again. If this issue occurs multiple times, please email <a href='mailto:bpatel@calmi2.org'>bpatel@calmi2.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Restart now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // Restart the app
    app.relaunch();
    app.exit();
  }

  console.log("Connected to Python back-end successfully");
  log.info("Connected to Python back-end successfully");
  ipcRenderer.send("track-event", "Success", "Establishing Python Connection");

  // inform observers that the app is connected to the server
  sodaIsConnected = true;

  // dismiss the Swal
  Swal.close();

  // check if the API versions match
  try {
    await apiVersionsMatch();
  } catch (e) {
    // api versions do not match
    app.exit();
  }

  apiVersionChecked = true;
};

startupServerAndApiCheck();

// Check if we are connected to the Pysoda server
// Check app version on current app and display in the side bar
// Also check the core systems to make sure they are all operational
ipcRenderer.on("run_pre_flight_checks", async (event, arg) => {
  // run pre flight checks once the server connection is confirmed
  // wait until soda is connected to the backend server
  while (!sodaIsConnected || !apiVersionChecked) {
    await wait(1000);
  }

  log.info("Done with startup");

  // check integrity of all the core systems
  await run_pre_flight_checks();

  log.info("Running pre flight checks finished");

  // get apps base path
  const basepath = app.getAppPath();
  const resourcesPath = process.resourcesPath;

  // set the templates path
  try {
    await client.put("prepare_metadata/template_paths", {
      basepath: basepath,
      resourcesPath: resourcesPath,
    });
  } catch (error) {
    console.log(error);
    log.error(error);
    ipcRenderer.send("track-event", "Error", "Setting Templates Path");
    return;
  }

  ipcRenderer.send("track-event", "Success", "Setting Templates Path");
});

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
const run_pre_flight_checks = async (check_update = true) => {
  log.info("Running pre flight checks");
  return new Promise(async (resolve) => {
    let connection_response = "";
    let agent_installed_response = "";
    let agent_version_response = "";
    let account_present = false;

    // Check the internet connection and if available check the rest.
    connection_response = await check_internet_connection();
    if (!connection_response) {
      await Swal.fire({
        title: "No Internet Connection",
        icon: "success",
        text: "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of SODA related to Pennsieve and especially none of the features located under the 'Manage Datasets' section.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "I understand",
        showConfirmButton: true,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Do nothing
        }
      });
      return resolve(false);
    } else {
      await wait(500);

      // Check for an API key pair first. Calling the agent check without a config file, causes it to crash.
      account_present = await check_api_key();
      if (account_present) {
        // Check for an installed Pennsieve agent
        await wait(500);
        [agent_installed_response, agent_version_response] =
          await check_agent_installed();
        // If no agent is installed, download the latest agent from Github and link to their docs for installation instrucations if needed.
        if (!agent_installed_response) {
          Swal.fire({
            icon: "error",
            title: "Pennsieve Agent error!",
            html: agent_version_response,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            reverseButtons: reverseSwalButtons,
            confirmButtonText: "Download now",
            cancelButtonText: "Skip for now",
          }).then(async (result) => {
            if (result.isConfirmed) {
              [browser_download_url, latest_agent_version] =
                await get_latest_agent_version();
              shell.openExternal(browser_download_url);
              shell.openExternal(
                "https://docs.pennsieve.io/docs/the-pennsieve-agent"
              );
            }
          });
          resolve(false);
        } else {
          await wait(500);
          // Check the installed agent version. We aren't enforcing the min limit yet but is the python version starts enforcing it, we might have to.
          [browser_download_url, latest_agent_version] =
            await check_agent_installed_version(agent_version_response);
          if (browser_download_url != "") {
            Swal.fire({
              icon: "warning",
              text: "It appears that you are not running the latest version of the Pensieve Agent. We recommend that you update your software and restart SODA for the best experience.",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              confirmButtonText: "Download now",
              cancelButtonText: "Skip for now",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then(async (result) => {
              if (result.isConfirmed) {
                // If there is a newer agent version, download the latest agent from Github and link to their docs for installation instrucations if needed.
                [browser_download_url, latest_agent_version] =
                  await get_latest_agent_version();
                shell.openExternal(browser_download_url);
                shell.openExternal(
                  "https://docs.pennsieve.io/docs/the-pennsieve-agent"
                );
                resolve(false);
              }
              if (result.isDismissed) {
                if (check_update) {
                  checkNewAppVersion();
                }
                await wait(500);
                notyf.open({
                  type: "final",
                  message: "You're all set!",
                });
                resolve(true);
              }
            });
          } else {
            if (check_update) {
              checkNewAppVersion();
            }
            await wait(500);
            notyf.open({
              type: "final",
              message: "You're all set!",
            });
            resolve(true);
          }
        }
      } else {
        if (check_update) {
          checkNewAppVersion();
        }
        // If there is no API key pair, show the warning and let them add a key. Messages are dissmisable.
        Swal.fire({
          icon: "warning",
          text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connected to Pennsieve. Would you like to do it now?",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Yes",
          showCancelButton: true,
          reverseButtons: reverseSwalButtons,
          cancelButtonText: "I'll do it later",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            await openDropdownPrompt(null, "bf");
            resolve(false);
          } else {
            resolve(true);
          }
        });
        resolve(false);
      }
    }
  });
};

// Check if the Pysoda server is live
const serverIsLiveStartup = async () => {
  let echoResponseObject;

  try {
    echoResponseObject = await client.get("/startup/echo?arg=server ready");
  } catch (error) {
    clientError(error);
    throw error;
  }

  let echoResponse = echoResponseObject.data;

  return echoResponse === "server ready" ? true : false;
};

// Check if the Pysoda server API version and the package.json versions match
const apiVersionsMatch = async () => {
  // notyf that tells the user that the server is checking the versions
  let notification = notyf.open({
    message: "Checking API Version",
    type: "checking_server_api_version",
  });

  let responseObject;

  try {
    responseObject = await client.get("/startup/minimum_api_version");
  } catch (e) {
    clientError(e);
    ipcRenderer.send(
      "track-event",
      "Error",
      "Verifying App Version",
      userErrorMessage(e)
    );

    await Swal.fire({
      icon: "error",
      html: `The minimum app versions do not match. Please try restarting your computer and reinstalling the latest version of SODA. If this issue occurs multiple times, please email <a href='mailto:bpatel@calmi2.org'>bpatel@calmi2.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Close now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    throw e;
  }

  let serverAppVersion = responseObject.data.version;

  log.info(`Server version is ${serverAppVersion}`);

  if (serverAppVersion !== appVersion) {
    log.info("Server version does not match client version");

    log.error(error);
    console.error(error);
    ipcRenderer.send("track-event", "Error", "Verifying App Version", error);

    await Swal.fire({
      icon: "error",
      html: `The minimum app versions do not match. Please try restarting your computer and reinstalling the latest version of SODA. If this issue occurs multiple times, please email <a href='mailto:bpatel@calmi2.org'>bpatel@calmi2.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Close now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    throw new Error();
  }

  ipcRenderer.send("track-event", "Success", "Verifying App Version");

  notyf.dismiss(notification);

  // create a success notyf for api version check
  notyf.open({
    message: "API Versions match",
    type: "success",
  });

  log.info("About to do unsupported stuff");

  //Load Default/global Pennsieve account if available
  updateBfAccountList();
  checkNewAppVersion(); // Added so that version will be displayed for new users
};

const check_internet_connection = async (show_notification = true) => {
  let notification = null;
  if (show_notification) {
    notification = notyf.open({
      type: "loading_internet",
      message: "Checking Internet status...",
    });
  }
  await wait(800);

  return require("dns").resolve("www.google.com", (err) => {
    if (err) {
      console.error("No internet connection");
      log.error("No internet connection");
      ipcRenderer.send("warning-no-internet-connection");
      if (show_notification) {
        notyf.dismiss(notification);
        notyf.open({
          type: "error",
          message: "Not connected to internet",
        });
      }
      connected_to_internet = false;
      return connected_to_internet;
    } else {
      console.log("Connected to the internet");
      log.info("Connected to the internet");
      if (show_notification) {
        notyf.dismiss(notification);
        notyf.open({
          type: "success",
          message: "Connected to the internet",
        });
      }
      connected_to_internet = true;
      return connected_to_internet;
    }
  });
};

const check_api_key = async () => {
  let notification = null;
  notification = notyf.open({
    type: "api_key_search",
    message: "Checking for Pennsieve account...",
  });
  await wait(800);
  // If no accounts are found, return false.
  let responseObject;

  try {
    responseObject = await client.get("manage_datasets/bf_account_list");
  } catch (e) {
    notyf.dismiss(notification);
    notyf.open({
      type: "error",
      message: "No account was found",
    });
    clientError(e);
    return false;
  }

  let res = responseObject.data["accounts"];
  log.info("Found a set of valid API keys");
  if (res[0] === "Select" && res.length === 1) {
    //no api key found
    notyf.dismiss(notification);
    notyf.open({
      type: "error",
      message: "No account was found",
    });
    return false;
  } else {
    notyf.dismiss(notification);
    notyf.open({
      type: "success",
      message: "Connected to Pennsieve",
    });
    return true;
  }
};

const check_agent_installed = async () => {
  let notification = null;
  notification = notyf.open({
    type: "ps_agent",
    message: "Searching for Pennsieve Agent...",
  });
  await wait(800);

  let responseObject;

  try {
    // TODO: Test errors
    responseObject = await client.get("/manage_datasets/check_agent_install");
  } catch (error) {
    clientError(error);
    notyf.dismiss(notification);
    notyf.open({
      type: "error",
      message: "Pennsieve agent not found",
    });
    log.warn("Pennsieve agent not found");
    return [false, userErrorMessage(error)];
  }

  let { agent_version } = responseObject.data;

  notyf.dismiss(notification);
  notyf.open({
    type: "success",
    message: "Pennsieve agent found",
  });
  log.info("Pennsieve agent found");
  return [true, agent_version];
};

const check_agent_installed_version = async (agent_version) => {
  let notification = null;
  notification = notyf.open({
    type: "ps_agent",
    message: "Checking Pennsieve Agent version...",
  });
  await wait(800);
  let latest_agent_version = "";
  let browser_download_url = "";
  [browser_download_url, latest_agent_version] =
    await get_latest_agent_version();
  if (latest_agent_version != agent_version) {
    notyf.dismiss(notification);
    notyf.open({
      type: "warning",
      message: "A newer Pennsieve agent was found!",
    });
    log.warn(`Current agent version: ${agent_version}`);
    log.warn(`Latest agent version: ${latest_agent_version}`);
  } else {
    notyf.dismiss(notification);
    notyf.open({
      type: "success",
      message: "You have the latest Pennsieve agent!",
    });
    browser_download_url = "";
    log.info("Up to date agent version found");
  }
  return [browser_download_url, latest_agent_version];
};

const get_latest_agent_version = async () => {
  return new Promise((resolve) => {
    $.getJSON("https://api.github.com/repos/Pennsieve/agent/releases").done(
      (release_res) => {
        let release = release_res[0];
        let latest_agent_version = release.tag_name;
        if (process.platform == "darwin") {
          reverseSwalButtons = true;
          release.assets.forEach((asset, index) => {
            let file_name = asset.name;
            if (path.extname(file_name) == ".pkg") {
              browser_download_url = asset.browser_download_url;
            }
          });
        }
        if (process.platform == "win32") {
          reverseSwalButtons = false;
          release.assets.forEach((asset, index) => {
            let file_name = asset.name;
            if (
              path.extname(file_name) == ".msi" ||
              path.extname(file_name) == ".exe"
            ) {
              browser_download_url = asset.browser_download_url;
            }
          });
        }
        if (process.platform == "linux") {
          reverseSwalButtons = false;
          release.assets.forEach((asset, index) => {
            let file_name = asset.name;
            if (path.extname(file_name) == ".deb") {
              browser_download_url = asset.browser_download_url;
            }
          });
        }

        resolve([browser_download_url, latest_agent_version]);
      }
    );
  });
};

const checkNewAppVersion = () => {
  ipcRenderer.send("app_version");
};

// Check app version on current app and display in the side bar
ipcRenderer.on("app_version", (event, arg) => {
  const version = document.getElementById("version");
  ipcRenderer.removeAllListeners("app_version");
  version.innerText = "v. " + arg.version;
});

// Check for update and show the pop up box
ipcRenderer.on("update_available", () => {
  ipcRenderer.removeAllListeners("update_available");
  ipcRenderer.send(
    "track-event",
    "App Update",
    "Update Requested",
    `User OS-${os.platform()}-${os.release()}- SODAv${app.getVersion()}`
  );
  update_available_notification = notyf.open({
    type: "app_update",
    message: "A new update is available. Downloading now...",
  });
});

// When the update is downloaded, show the restart notification
ipcRenderer.on("update_downloaded", () => {
  ipcRenderer.removeAllListeners("update_downloaded");
  ipcRenderer.send(
    "track-event",
    "App Update",
    "Update Downloaded",
    `User OS-${os.platform()}-${os.release()}- SODAv${app.getVersion()}`
  );
  notyf.dismiss(update_available_notification);
  if (process.platform == "darwin") {
    update_downloaded_notification = notyf.open({
      type: "app_update_warning",
      message:
        "Update downloaded. It will be installed when you close and relaunch the app. Click here to close SODA now.",
    });
  } else {
    update_downloaded_notification = notyf.open({
      type: "app_update_warning",
      message:
        "Update downloaded. It will be installed on the restart of the app. Click here to restart SODA now.",
    });
  }
  update_downloaded_notification.on("click", ({ target, event }) => {
    restartApp();
  });
});

// Restart the app for update. Does not restart on macos
const restartApp = () => {
  notyf.open({
    type: "app_update_warning",
    message: "Closing SODA now...",
  });

  ipcRenderer.send(
    "track-event",
    "App Update",
    "App Restarted",
    `User OS-${os.platform()}-${os.release()}- SODAv${app.getVersion()}`
  );
  ipcRenderer.send("restart_app");
};

//////////////////////////////////
// Get html elements from UI
//////////////////////////////////

// Navigator button //
const buttonSidebar = document.getElementById("button-hamburger");
const buttonSidebarIcon = document.getElementById("button-soda-icon");
const buttonSidebarBigIcon = document.getElementById("button-soda-big-icon");

// Metadata Templates //
const downloadSubmission = document.getElementById("a-submission");
const downloadSamples = document.getElementById("a-samples");
const downloadSubjects = document.getElementById("a-subjects");
const downloadDescription = document.getElementById("a-description");
const downloadManifest = document.getElementById("a-manifest");

/////// New Organize Datasets /////////////////////
const organizeDSglobalPath = document.getElementById("input-global-path");
const organizeDSbackButton = document.getElementById("button-back");
const organizeDSaddFiles = document.getElementById("add-files");
const organizeDSaddNewFolder = document.getElementById("new-folder");
const organizeDSaddFolders = document.getElementById("add-folders");
const contextMenu = document.getElementById("mycontext");
const fullNameValue = document.querySelector(".hoverFullName");
const homePathButton = document.getElementById("home-path");
const menuFolder = document.querySelector(".menu.reg-folder");
const menuFile = document.querySelector(".menu.file");
const menuHighLevelFolders = document.querySelector(".menu.high-level-folder");
const organizeNextStepBtn = document.getElementById(
  "button-organize-confirm-create"
);
const organizePrevStepBtn = document.getElementById("button-organize-prev");
const manifestFileCheck = document.getElementById("generate-manifest-curate");
var bfAccountOptions;
var defaultBfAccount;
var defaultBfDataset = "Select dataset";
var defaultBfDatasetId = undefined;
var bfAccountOptionsStatus;

// Organize dataset //
const selectImportFileOrganizationBtn = document.getElementById(
  "button-select-upload-file-organization"
);
const tableMetadata = document.getElementById("metadata-table");
let tableMetadataCount = 0;

// Validate dataset //
const validateCurrentDSBtn = document.getElementById(
  "button-validate-current-ds"
);
const validateCurrentDatasetReport = document.querySelector(
  "#textarea-validate-current-dataset"
);
const currentDatasetReportBtn = document.getElementById(
  "button-generate-report-current-ds"
);
const validateLocalDSBtn = document.getElementById("button-validate-local-ds");
const validateLocalDatasetReport = document.querySelector(
  "#textarea-validate-local-dataset"
);
const localDatasetReportBtn = document.getElementById(
  "button-generate-report-local-ds"
);
const validateLocalProgressBar = document.getElementById(
  "div-indetermiate-bar-validate-local"
);
const validateSODAProgressBar = document.getElementById(
  "div-indetermiate-bar-validate-soda"
);

// Generate dataset //

var subjectsTableData = [];
var samplesTableData = [];

const newDatasetName = document.querySelector("#new-dataset-name");
const manifestStatus = document.querySelector("#generate-manifest");

// Manage datasets //
var myitem;
var datasetList = [];
const bfUploadRefreshDatasetBtn = document.getElementById(
  "button-upload-refresh-dataset-list"
);

const pathSubmitDataset = document.querySelector(
  "#selected-local-dataset-submit"
);
const progressUploadBf = document.getElementById("div-progress-submit");
const progressBarUploadBf = document.getElementById("progress-bar-upload-bf");
const datasetPermissionDiv = document.getElementById("div-permission-list-2");
const bfDatasetSubtitle = document.querySelector("#bf-dataset-subtitle");
const bfDatasetSubtitleCharCount = document.querySelector(
  "#para-char-count-metadata"
);

const bfCurrentBannerImg = document.getElementById("current-banner-img");

const bfViewImportedImage = document.querySelector("#image-banner");
const bfSaveBannerImageBtn = document.getElementById("save-banner-image");
const datasetBannerImageStatus = document.querySelector(
  "#para-dataset-banner-image-status"
);
const formBannerHeight = document.getElementById("form-banner-height");
const currentDatasetLicense = document.querySelector(
  "#para-dataset-license-current"
);
const bfListLicense = document.querySelector("#bf-license-list");
const bfAddLicenseBtn = document.getElementById("button-add-license");

// Pennsieve dataset permission //
const currentDatasetPermission = document.querySelector(
  "#para-dataset-permission-current"
);
const currentAddEditDatasetPermission = document.querySelector(
  "#para-add-edit-dataset-permission-current"
);
const bfListUsersPI = document.querySelector("#bf_list_users_pi");

const bfAddPermissionCurationTeamBtn = document.getElementById(
  "button-add-permission-curation-team"
);
const datasetPermissionStatusCurationTeam = document.querySelector(
  "#para-dataset-permission-status-curation-team"
);
const bfListUsers = document.querySelector("#bf_list_users");
const bfListTeams = document.querySelector("#bf_list_teams");
const bfListRolesTeam = document.querySelector("#bf_list_roles_team");
const bfAddPermissionTeamBtn = document.getElementById(
  "button-add-permission-team"
);
//Pennsieve dataset status
const bfCurrentDatasetStatusProgress = document.querySelector(
  "#div-bf-current-dataset-status-progress"
);
const bfListDatasetStatus = document.querySelector("#bf_list_dataset_status");

//Pennsieve post curation
const bfRefreshPublishingDatasetStatusBtn = document.querySelector(
  "#button-refresh-publishing-status"
);
const bfWithdrawReviewDatasetBtn = document.querySelector(
  "#btn-withdraw-review-dataset"
);

//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackColor = "#000";
const redColor = "#ff1a1a";
const sparcFolderNames = [
  "code",
  "derivative",
  "docs",
  "primary",
  "protocol",
  "source",
];
const smileyCan = '<img class="message-icon" src="assets/img/can-smiley.png">';
const sadCan = '<img class="message-icon" src="assets/img/can-sad.png">';
const delayAnimation = 250;

//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////

// Sidebar Navigation //
var open = false;
const openSidebar = (buttonElement) => {
  if (!open) {
    ipcRenderer.send("resize-window", "up");
    $("#main-nav").css("width", "250px");
    $("#SODA-logo").css("display", "block");
    $(buttonSidebarIcon).css("display", "none");
    open = true;
  } else {
    ipcRenderer.send("resize-window", "down");
    $("#main-nav").css("width", "70px");
    $("#SODA-logo").css("display", "block");
    $(buttonSidebarIcon).css("display", "none");
    open = false;
  }
};

// Assign dragable area in the code to allow for dragging and selecting items//
let drag_event_fired = false;
let dragselect_area = new DragSelect({
  selectables: document.querySelectorAll(".single-item"),
  draggability: false,
  area: document.getElementById("items"),
});

// Assign the callback event for selecting items
dragselect_area.subscribe("callback", ({ items, event }) => {
  select_items(items, event, isDragging);
});

// Assign an additional event to allow for ctrl drag behaviour
dragselect_area.subscribe("dragstart", ({ items, event, isDragging }) => {
  select_items_ctrl(items, event, isDragging);
});

///////////////////// Prepare Metadata Section ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///// Global variables for this section

/////// Save and load award and milestone info
var metadataPath = path.join(homeDirectory, "SODA", "METADATA");
var awardFileName = "awards.json";
var affiliationFileName = "affiliations.json";
var milestoneFileName = "milestones.json";
var airtableConfigFileName = "airtable-config.json";
var protocolConfigFileName = "protocol-config.json";
var awardPath = path.join(metadataPath, awardFileName);
var affiliationConfigPath = path.join(metadataPath, affiliationFileName);
var milestonePath = path.join(metadataPath, milestoneFileName);
var airtableConfigPath = path.join(metadataPath, airtableConfigFileName);
var progressFilePath = path.join(homeDirectory, "SODA", "Progress");
var protocolConfigPath = path.join(metadataPath, protocolConfigFileName);

// initiate Tagify input fields for Dataset description file
var keywordInput = document.getElementById("ds-keywords"),
  keywordTagify = new Tagify(keywordInput, {
    duplicates: false,
  });

var otherFundingInput = document.getElementById("ds-other-funding"),
  otherFundingTagify = new Tagify(otherFundingInput, {
    duplicates: false,
  });

var studyOrganSystemsInput = document.getElementById("ds-study-organ-system"),
  studyOrganSystemsTagify = new Tagify(studyOrganSystemsInput, {
    whitelist: [
      "autonomic ganglion",
      "brain",
      "colon",
      "heart",
      "intestine",
      "kidney",
      "large intestine",
      "liver",
      "lower urinary tract",
      "lung",
      "nervous system",
      "pancreas",
      "peripheral nervous system",
      "small intestine",
      "spinal cord",
      "spleen",
      "stomach",
      "sympathetic nervous system",
      "urinary bladder",
    ],
    duplicates: false,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
    },
  });

var studyTechniquesInput = document.getElementById("ds-study-technique"),
  studyTechniquesTagify = new Tagify(studyTechniquesInput, {
    duplicates: false,
  });

var studyApproachesInput = document.getElementById("ds-study-approach"),
  studyApproachesTagify = new Tagify(studyApproachesInput, {
    duplicates: false,
  });

// tagify the input inside of the "Add/edit tags" manage dataset section
var datasetTagsInput = document.getElementById("tagify-dataset-tags"),
  // initialize Tagify on the above input node reference
  datasetTagsTagify = new Tagify(datasetTagsInput);

///////////////////// Airtable Authentication /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/////// Load SPARC airtable data
var airtableHostname = "api.airtable.com";

function sendHTTPsRequestAirtable(options, varSuccess) {
  https.get(options, (res) => {
    if (res.statusCode === 200) {
      varSuccess = true;
    } else {
      log.error(res);
      console.error(res);
      varSuccess = false;
    }
    res.on("error", (error) => {
      log.error(error);
      console.error(error);
    });
    return res;
  });
}

loadAwardData();

/////////////////////// Download Metadata Templates ////////////////////////////
templateArray = [
  "submission.xlsx",
  "dataset_description.xlsx",
  "subjects.xlsx",
  "samples.xlsx",
  "manifest.xlsx",
  "DataDeliverablesDocument-template.docx",
];

const downloadTemplates = (templateItem, destinationFolder) => {
  var templatePath = path.join(__dirname, "file_templates", templateItem);
  var destinationPath = path.join(destinationFolder, templateItem);
  if (fs.existsSync(destinationPath)) {
    var emessage =
      "File '" + templateItem + "' already exists in " + destinationFolder;
    Swal.fire({
      icon: "error",
      title: "Metadata file already exists",
      text: `${emessage}`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    ipcRenderer.send(
      "track-event",
      "Error",
      `Download Template - ${templateItem}`
    );
  } else {
    fs.createReadStream(templatePath).pipe(
      fs.createWriteStream(destinationPath)
    );
    var emessage = `Successfully saved '${templateItem}' to ${destinationFolder}`;
    Swal.fire({
      icon: "success",
      title: "Download successful",
      text: `${emessage}`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    ipcRenderer.send(
      "track-event",
      "Success",
      `Download Template - ${templateItem}`
    );
  }
};

downloadSubmission.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[0]);
});
downloadDescription.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[1]);
});
downloadSubjects.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[2]);
});
downloadSamples.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[3]);
});
downloadManifest.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[4]);
});
ipcRenderer.on("selected-metadata-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});

ipcRenderer.on("selected-DDD-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});

/////////////////// Provide Grant Information section /////////////////////////
//////////////// //////////////// //////////////// //////////////// ///////////

////////////////////////Import Milestone Info//////////////////////////////////
const descriptionDateInput = document.getElementById(
  "submission-completion-date"
);

const milestoneInput1 = document.getElementById("selected-milestone-1");
var milestoneTagify1 = new Tagify(milestoneInput1, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});

// generate subjects file
ipcRenderer.on(
  "selected-generate-metadata-subjects",
  (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" +
          filename +
          "' already exists in " +
          dirpath[0] +
          ". Do you want to replace it?";
        Swal.fire({
          icon: "warning",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showConfirmButton: true,
          showCancelButton: true,
          cancelButtonText: "No",
          confirmButtonText: "Yes",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Generating the subjects.xlsx file",
              html: "Please wait...",
              allowEscapeKey: false,
              allowOutsideClick: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              timerProgressBar: false,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {});
            generateSubjectsFileHelper(false);
          }
        });
      } else {
        Swal.fire({
          title: "Generating the subjects.xlsx file",
          html: "Please wait...",
          allowEscapeKey: false,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {});
        generateSubjectsFileHelper(false);
      }
    }
  }
);

async function generateSubjectsFileHelper(uploadBFBoolean) {
  if (uploadBFBoolean) {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing subjects.xlsx file in the high-level folder of the selected dataset will be replaced.",
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
  } else {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing subjects.xlsx file in the specified location will be replaced.",
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
  }
  Swal.fire({
    title: "Generating the subjects.xlsx file",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});

  let bfdataset = document
    .getElementById("bf_dataset_load_subjects")
    .innerText.trim();
  try {
    let save_locally = await client.post(
      `/prepare_metadata/subjects_file?upload_boolean=${uploadBFBoolean}`,
      {
        filepath: subjectsDestinationPath,
        selected_account: defaultBfAccount,
        selected_dataset: bfdataset,
        subjects_str: subjectsTableData,
      }
    );

    let res = save_locally.data;
    console.log(res);

    Swal.fire({
      title:
        "The subjects.xlsx file has been successfully generated at the specified location.",
      icon: "success",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // log the success to Pennsieve
    logMetadataForAnalytics(
      "Success",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
    );

    // log the size of the metadata file that was generated at varying levels of granularity
    const size = res;
    logMetadataSizeForAnalytics(uploadBFBoolean, "subjects.xlsx", size);
  } catch (error) {
    clientError(error);
    let emessage = error.response.data.message;

    Swal.fire({
      title: "Failed to generate the subjects.xlsx file.",
      html: emessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });

    // log the error to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
    );
  }
}

// generate samples file
ipcRenderer.on(
  "selected-generate-metadata-samples",
  (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" +
          filename +
          "' already exists in " +
          dirpath[0] +
          ". Do you want to replace it?";
        Swal.fire({
          icon: "warning",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showConfirmButton: true,
          showCancelButton: true,
          cancelButtonText: "No",
          confirmButtonText: "Yes",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Generating the samples.xlsx file",
              html: "Please wait...",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              allowEscapeKey: false,
              allowOutsideClick: false,
              timerProgressBar: false,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {});
            generateSamplesFileHelper(uploadBFBoolean);
          }
        });
      } else {
        Swal.fire({
          title: "Generating the samples.xlsx file",
          html: "Please wait...",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          allowEscapeKey: false,
          allowOutsideClick: false,
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {});
        generateSamplesFileHelper(uploadBFBoolean);
      }
    }
  }
);

async function generateSamplesFileHelper(uploadBFBoolean) {
  if (uploadBFBoolean) {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing samples.xlsx file in the high-level folder of the selected dataset will be replaced.",
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
  } else {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing samples.xlsx file in the specified location will be replaced.",
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
  }
  Swal.fire({
    title: "Generating the samples.xlsx file",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});

  // new client that has a longer timeout
  let clientLongTimeout = new zerorpc.Client({
    timeout: 300000,
    heartbeatInterval: 60000,
  });
  clientLongTimeout.connect("tcp://127.0.0.1:4242");
  clientLongTimeout.invoke(
    "api_save_samples_file",
    uploadBFBoolean,
    defaultBfAccount,
    $("#bf_dataset_load_samples").text().trim(),
    samplesDestinationPath,
    samplesTableData,
    (error, res) => {
      if (error) {
        var emessage = userError(error);
        log.error(error);
        console.error(error);
        Swal.fire({
          title: "Failed to generate the samples.xlsx file.",
          html: emessage,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "error",
        });

        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.SAMPLES,
          AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
        );
      } else {
        Swal.fire({
          title:
            "The samples.xlsx file has been successfully generated at the specified location.",
          icon: "success",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.SAMPLES,
          AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
        );

        // log the size of the metadata file that was generated at varying levels of granularity
        const size = res;
        logMetadataSizeForAnalytics(uploadBFBoolean, "samples.xlsx", size);
      }
    }
  );
}

// import Primary folder
ipcRenderer.on("selected-local-primary-folder", (event, primaryFolderPath) => {
  if (primaryFolderPath.length > 0) {
    importPrimaryFolderSubjects(primaryFolderPath[0]);
  }
});
ipcRenderer.on(
  "selected-local-primary-folder-samples",
  (event, primaryFolderPath) => {
    if (primaryFolderPath.length > 0) {
      importPrimaryFolderSamples(primaryFolderPath[0]);
    }
  }
);

function transformImportedExcelFile(type, result) {
  for (var column of result.slice(1)) {
    var indices = getAllIndexes(column, "");
    // check if the first 2 columns are empty
    if (
      indices.length > 18 &&
      type === "samples" &&
      (indices.includes(0) || indices.includes(1))
    ) {
      return false;
    }
    if (indices.length > 17 && type === "subjects" && indices.includes(0)) {
      return false;
    }
    var indices = getAllIndexes(column, "nan");
    for (var ind of indices) {
      column[ind] = "";
    }
    if (type === "samples") {
      if (!specimenType.includes(column[5])) {
        column[5] = "";
      }
    }
    return result;
  }
}

function getAllIndexes(arr, val) {
  var indexes = [],
    i = -1;
  while ((i = arr.indexOf(val, i + 1)) != -1) {
    indexes.push(i);
  }
  return indexes;
}

// import existing subjects.xlsx info (calling python to load info to a dataframe)
async function loadSubjectsFileToDataframe(filePath) {
  var fieldSubjectEntries = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase());
  }

  try {
    let import_subjects_file = await client.get(
      `/prepare_metadata/subjects_file`,
      {
        params: {
          type: "subjects",
          filepath: filePath,
          ui_fields: fieldSubjectEntries,
        },
      }
    );

    let res = import_subjects_file.data;
    // res is a dataframe, now we load it into our subjectsTableData in order to populate the UI
    if (res.length > 1) {
      result = transformImportedExcelFile("subjects", res);
      if (result !== false) {
        subjectsTableData = result;
      } else {
        Swal.fire({
          title: "Couldn't load existing subjects.xlsx file",
          text: "Please make sure the imported file follows the latest SPARC Dataset Structure 2.0.0 and try again.",
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.SUBJECTS,
          AnalyticsGranularity.ALL_LEVELS,
          "Existing",
          Destinations.LOCAL
        );
        return;
      }
      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );
      loadDataFrametoUI("local");
    } else {
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
      Swal.fire({
        title: "Couldn't load existing subjects.xlsx file",
        text: "Please make sure there is at least one subject in the subjects.xlsx file.",
        icon: "error",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Couldn't load existing subjects.xlsx file",
      html: userErrorMessage(error),
      icon: "error",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

// import existing subjects.xlsx info (calling python to load info to a dataframe)
async function loadSamplesFileToDataframe(filePath) {
  var fieldSampleEntries = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase());
  }
  try {
    let import_samples_file = await client.get(
      `/prepare_metadata/samples_file`,
      {
        params: {
          type: "samples.xlsx",
        },
        payload: {
          filepath: filePath,
          ui_fields: fieldSampleEntries,
        },
      }
    );

    let res = import_samples_file.data.sample_file_rows;
    console.log(res);
    // res is a dataframe, now we load it into our samplesTableData in order to populate the UI
    if (res.length > 1) {
      result = transformImportedExcelFile("samples", res);
      if (result !== false) {
        samplesTableData = result;
      } else {
        Swal.fire({
          title: "Couldn't load existing samples.xlsx file",
          text: "Please make sure the imported file follows the latest SPARC Dataset Structure 2.0.0 and try again.",
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.SAMPLES,
          AnalyticsGranularity.ALL_LEVELS,
          "Existing",
          Destinations.LOCAL
        );

        return;
      }
      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );

      loadDataFrametoUISamples("local");
    } else {
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
      Swal.fire({
        title: "Couldn't load existing samples.xlsx file",
        text: "Please make sure there is at least one sample in the samples.xlsx file.",
        icon: "error",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  } catch (error) {
    clientError(error);

    Swal.fire({
      title: "Couldn't load existing samples.xlsx file",
      html: userErrorMessage(error),
      icon: "error",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SAMPLES,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

// load and parse json file
function parseJson(path) {
  if (!fs.existsSync(path)) {
    return {};
  }
  try {
    var content = fs.readFileSync(path);
    contentJson = JSON.parse(content);
    return contentJson;
  } catch (error) {
    log.error(error);
    console.log(error);
    return {};
  }
}

// function to make directory if metadata path does not exist
function createMetadataDir() {
  try {
    fs.mkdirSync(metadataPath, { recursive: true });
  } catch (error) {
    log.error(error);
    console.log(error);
  }
}

createMetadataDir();

const specimenType = [
  "whole organism",
  "whole organ",
  "fluid specimen",
  "tissue",
  "nerve",
  "slice",
  "section",
  "cryosection",
  "cell",
  "nucleus",
  "nucleic acid",
  "slide",
  "whole mount",
];
function createSpecimenTypeAutocomplete(id) {
  var autoCompleteJS3 = new autoComplete({
    selector: "#" + id,
    data: {
      cache: true,
      src: specimenType,
    },
    onSelection: (feedback) => {
      var selection = feedback.selection.value;
      document.querySelector("#" + id).value = selection;
    },
    trigger: {
      event: ["input", "focus"],
      // condition: () => true
    },
    resultItem: {
      destination: "#" + id,
      highlight: {
        render: true,
      },
    },
    resultsList: {
      // id: listID,
      maxResults: 5,
    },
  });
}

function createSpeciesAutocomplete(id) {
  // var listID = "autocomplete" + id;
  var autoCompleteJS2 = new autoComplete({
    selector: "#" + id,
    data: {
      src: [
        {
          "Canis lupus familiaris": "dogs, beagle dogs",
          "Mustela putorius furo": "ferrets, black ferrets",
          "Mus sp.": "mice",
          "Mus musculus": "mouse, house mouse",
          "Rattus norvegicus": "Norway rats",
          Rattus: "rats",
          "Sus scrofa": "pigs, swine, wild boar",
          "Sus scrofa domesticus": "domestic pigs",
          "Homo sapiens": "humans",
          "Felis catus": "domestic cat",
        },
      ],
      keys: [
        "Canis lupus familiaris",
        "Mustela putorius furo",
        "Mus sp.",
        "Mus musculus",
        "Sus scrofa",
        "Sus scrofa domesticus",
        "Homo sapiens",
        "Rattus",
        "Felis catus",
        "Rattus norvegicus",
      ],
    },
    resultItem: {
      element: (item, data) => {
        // Modify Results Item Style
        item.style = "display: flex; justify-content: space-between;";
        // Modify Results Item Content
        item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          ${data.match}
        </span>
        <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100; text-transform: uppercase; color: rgba(0,0,0,.2);">
          ${data.key}
        </span>`;
      },
      highlight: true,
    },
    events: {
      input: {
        focus: () => {
          autoCompleteJS2.start();
        },
      },
    },
    threshold: 0,
    resultsList: {
      element: (list, data) => {
        const info = document.createElement("div");

        if (data.results.length === 0) {
          info.setAttribute("class", "no_results_species");
          info.setAttribute(
            "onclick",
            "loadTaxonomySpecies('" + data.query + "', '" + id + "')"
          );
          info.innerHTML = `Find the scientific name for <strong>"${data.query}"</strong>`;
        }
        list.prepend(info);
      },
      noResults: true,
      maxResults: 5,
      tabSelect: true,
    },
  });

  autoCompleteJS2.input.addEventListener("selection", function (event) {
    var feedback = event.detail;
    var selection = feedback.selection.key;
    // Render selected choice to selection div
    document.getElementById(id).value = selection;
    // Replace Input value with the selected value
    autoCompleteJS2.input.value = selection;
    $("#btn-confirm-species").removeClass("confirm-disabled");
  });
}

function createStrain(id, type) {
  var autoCompleteJS4 = new autoComplete({
    selector: "#" + id,
    data: {
      src: [
        "Wistar",
        "Yucatan",
        "C57/B6J",
        "C57 BL/6J",
        "mixed background",
        "Sprague-Dawley",
      ],
    },
    events: {
      input: {
        focus: () => {
          autoCompleteJS4.start();
        },
      },
    },
    resultItem: {
      element: (item, data) => {
        // Modify Results Item Style
        item.style = "display: flex; justify-content: space-between;";
        // Modify Results Item Content
        item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          ${data.match}
        </span>`;
      },
      highlight: true,
    },
    threshold: 0,
    resultsList: {
      element: (list, data) => {
        const info = document.createElement("div");

        if (data.results.length === 0) {
          info.setAttribute("class", "no_results_species");
          info.setAttribute(
            "onclick",
            "populateRRID('" + data.query + "', '" + type + "')"
          );
          info.innerHTML = `Click here to check <strong>"${data.query}"</strong>`;
        }
        list.prepend(info);
      },
      noResults: true,
      maxResults: 5,
      tabSelect: true,
    },
  });

  autoCompleteJS4.input.addEventListener("selection", function (event) {
    var feedback = event.detail;
    var selection = feedback.selection.value;
    document.querySelector("#" + id).value = selection;
    var strain = $("#sweetalert-" + type + "-strain").val();
    if (strain !== "") {
      populateRRID(strain, type);
    }
    autoCompleteJS4.input.value = selection;
  });
}

async function loadTaxonomySpecies(commonName, destinationInput) {
  Swal.fire({
    title: "Finding the scientific name for " + commonName + "...",
    html: "Please wait...",
    heightAuto: false,
    allowOutsideClick: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  try {
    let load_taxonomy_species = await client.get(`/taxonomy/species`, {
      animal_list: [commonName],
    });
    console.log(load_taxonomy_species);
    let res = load_taxonomy_species.data;
    console.log(res);

    if (Object.keys(res).length === 0) {
      Swal.fire({
        title: "Cannot find a scientific name for '" + commonName + "'",
        text: "Make sure you enter a correct species name.",
        icon: "error",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      if (!$("#btn-confirm-species").hasClass("confirm-disabled")) {
        $("#btn-confirm-species").addClass("confirm-disabled");
      }
      if (destinationInput.includes("subject")) {
        if ($("#bootbox-subject-species").val() === "") {
          $("#bootbox-subject-species").css("display", "none");
        }
        // set the Edit species button back to "+ Add species"
        $("#button-add-species-subject").html(
          `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
        );
      }
      if (destinationInput.includes("sample")) {
        if ($("#bootbox-sample-species").val() === "") {
          $("#bootbox-sample-species").css("display", "none");
        }
        // set the Edit species button back to "+ Add species"
        $("#button-add-species-sample").html(
          `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
        );
      }
    } else {
      $("#" + destinationInput).val(res[commonName]["ScientificName"]);
      $("#btn-confirm-species").removeClass("confirm-disabled");
    }
  } catch (error) {
    clientError(error);
  }
}

// Function to add options to dropdown list
function addOption(selectbox, text, value) {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
}

var awardObj = {};
var globalSPARCAward = "";
// indicate to user that airtable records are being retrieved
function loadAwardData() {
  ///// Construct table from data
  var awardResultArray = [];
  ///// config and load live data from Airtable
  var airKeyContent = parseJson(airtableConfigPath);
  if (JSON.stringify(airKeyContent) !== "{}") {
    var airKeyInput = airKeyContent["api-key"];
    var airKeyName = airKeyContent["key-name"];
    if (airKeyInput !== "" && airKeyName !== "") {
      Airtable.configure({
        endpointUrl: "https://" + airtableHostname,
        apiKey: airKeyInput,
      });
      var base = Airtable.base("appiYd1Tz9Sv857GZ");
      base("sparc_members")
        .select({
          view: "All members (ungrouped)",
        })
        .eachPage(
          function page(records, fetchNextPage) {
            records.forEach(function (record) {
              if (record.get("Project_title") !== undefined) {
                var awardNumber = (item = record.get("SPARC_Award_#"));
                item = record
                  .get("SPARC_Award_#")
                  .concat(" (", record.get("Project_title"), ")");
                awardResultArray.push(item);
                awardObj[awardNumber] = item;
              }
            }),
              fetchNextPage();
          },
          function done(err) {
            if (err) {
              log.error(err);
              console.log(err);
              return;
            } else {
              // create set to remove duplicates
              var awardSet = new Set(awardResultArray);
              var resultArray = [...awardSet];
            }
          }
        );
    }
  }
}

//////////////// Dataset description file ///////////////////////
//////////////// //////////////// //////////////// ////////////////

//// get datasets and append that to option list for parent datasets
function getParentDatasets() {
  var parentDatasets = [];
  for (var i = 0; i < datasetList.length; i++) {
    parentDatasets.push(datasetList[i].name);
  }
  return parentDatasets;
}

function changeAwardInputDsDescription() {
  if (dsContributorArrayLast1) {
    removeOptions(dsContributorArrayLast1);
  }
  if (dsContributorArrayFirst1) {
    removeOptions(dsContributorArrayFirst1);
    addOption(dsContributorArrayFirst1, "Select an option", "Select an option");
  }

  currentContributorsLastNames = [];
  currentContributorsFirstNames = [];
  globalContributorNameObject = {};

  /// delete old table
  $("#table-current-contributors").find("tr").slice(1, -1).remove();
  for (
    var i = 0;
    i <
    document.getElementById("table-current-contributors").rows[1].cells.length;
    i++
  ) {
    $(
      $($("#table-current-contributors").find("tr")[1].cells[i]).find(
        "input"
      )[0]
    ).val("");
    $(
      $($("#table-current-contributors").find("tr")[1].cells[i]).find(
        "textarea"
      )[0]
    ).val("");
  }

  var selectID = document.getElementById(
    $(
      $($("#table-current-contributors").find("tr")[1].cells[1]).find(
        "select"
      )[0]
    ).prop("id")
  );
  if (selectID) {
    removeOptions(selectID);
    $(
      $($("#table-current-contributors").find("tr")[1].cells[1]).find(
        "select"
      )[0]
    ).prop("disabled", true);
  }

  var awardVal = $("#ds-description-award-input");
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"];
    Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appiYd1Tz9Sv857GZ");
    base("sparc_members")
      .select({
        filterByFormula: `({SPARC_Award_#} = "${awardVal}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          var firstName = record.get("First_name");
          var lastName = record.get("Last_name");
          globalContributorNameObject[lastName] = firstName;
          currentContributorsLastNames.push(lastName);
        }),
          fetchNextPage();
        var currentRowLeftID = $(
          $($("#table-current-contributors").find("tr")[1].cells[0]).find(
            "select"
          )[0]
        ).prop("id");
        if (currentRowLeftID) {
          cloneConNamesSelect(currentRowLeftID);
        }
      });
    function done(err) {
      if (err) {
        log.error(err);
        console.error(err);
        return;
      }
    }
  }
}

// on change event when users choose a contributor's last name
function onchangeLastNames() {
  $("#dd-contributor-first-name").attr("disabled", true);
  var conLastname = $("#dd-contributor-last-name").val();
  removeOptions(document.getElementById("dd-contributor-first-name"));
  if (conLastname in globalContributorNameObject) {
    addOption(
      document.getElementById("dd-contributor-first-name"),
      globalContributorNameObject[conLastname],
      globalContributorNameObject[conLastname]
    );
    $("#dd-contributor-first-name")
      .val(globalContributorNameObject[conLastname])
      .trigger("onchange");
  }
  $("#dd-contributor-first-name").attr("disabled", false);
}

// on change event when users choose a contributor's first name -> Load con info
function onchangeFirstNames() {
  var conLastname = $("#dd-contributor-last-name").val();
  var conFirstname = $("#dd-contributor-first-name").val();
  if (conFirstname !== "Select") {
    loadContributorInfo(conLastname, conFirstname);
  }
}

// Auto populate once a contributor is selected
function loadContributorInfo(lastName, firstName) {
  // first destroy old tagifies
  $($("#input-con-affiliation").siblings()[0]).remove();
  $($("#input-con-role").siblings()[0]).remove();

  var tagifyRole = new Tagify(document.getElementById("input-con-role"), {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      classname: "color-blue",
      maxItems: 25,
      enabled: 0,
      closeOnSelect: true,
    },
  });
  var tagifyAffliation = new Tagify(
    document.getElementById("input-con-affiliation"),
    {
      dropdown: {
        classname: "color-blue",
        enabled: 0, // show the dropdown immediately on focus
        maxItems: 25,
        closeOnSelect: true, // keep the dropdown open after selecting a suggestion
      },
      whitelist: affiliationSuggestions,
      delimiters: null,
      duplicates: false,
    }
  );
  tagifyRole.removeAllTags();
  tagifyAffliation.removeAllTags();
  var contactLabel = $("#ds-contact-person");
  $(contactLabel).prop("checked", false);
  document.getElementById("input-con-ID").value = "Loading...";

  tagifyAffliation.loading(true);
  tagifyRole.loading(true);

  var airKeyContent = parseJson(airtableConfigPath);
  var airKeyInput = airKeyContent["api-key"];
  var airtableConfig = Airtable.configure({
    endpointUrl: "https://" + airtableHostname,
    apiKey: airKeyInput,
  });
  var base = Airtable.base("appiYd1Tz9Sv857GZ");
  base("sparc_members")
    .select({
      filterByFormula: `AND({First_name} = "${firstName}", {Last_name} = "${lastName}")`,
    })
    .eachPage(function page(records, fetchNextPage) {
      var conInfoObj = {};
      records.forEach(function (record) {
        conInfoObj["ID"] = record.get("ORCID");
        conInfoObj["Role"] = record.get("Dataset_contributor_roles_for_SODA");
        conInfoObj["Affiliation"] = record.get("Institution");
      }),
        fetchNextPage();

      // if no records found, leave fields empty
      leaveFieldsEmpty(
        conInfoObj["ID"],
        document.getElementById("input-con-ID")
      );
      leaveFieldsEmpty(
        conInfoObj["Role"],
        document.getElementById("input-con-role")
      );
      leaveFieldsEmpty(
        conInfoObj["Affiliation"],
        document.getElementById("input-con-affiliation")
      );

      tagifyAffliation.addTags(conInfoObj["Affiliation"]);
      tagifyRole.addTags(conInfoObj["Role"]);
    }),
    function done(err) {
      if (err) {
        log.error(err);
        console.error(err);
        return;
      }
    };
  tagifyAffliation.loading(false);
  tagifyRole.loading(false);
}

//// De-populate dataset dropdowns to clear options
const clearDatasetDropdowns = () => {
  for (let list of [curateDatasetDropdown]) {
    removeOptions(list);
    addOption(list, "Search here...", "Select dataset");
    list.options[0].disabled = true;
  }
};

//////////////////////// Current Contributor(s) /////////////////////

function delete_current_con(no) {
  // after a contributor is deleted, add their name back to the contributor last name dropdown list
  if (
    $("#ds-description-contributor-list-last-" + no).length > 0 &&
    $("#ds-description-contributor-list-first-" + no).length > 0
  ) {
    var deletedLastName = $(
      "#ds-description-contributor-list-last-" + no
    ).val();
    var deletedFirstName = $(
      "#ds-description-contributor-list-first-" + no
    ).val();
    globalContributorNameObject[deletedLastName] = deletedFirstName;
    currentContributorsLastNames.push(deletedLastName);
  }
  document.getElementById("row-current-name" + no + "").outerHTML = "";
}

function delete_link(no) {
  document.getElementById("row-current-link" + no + "").outerHTML = "";
}

//////////////////////// Article(s) and Protocol(s) /////////////////////

//// function to leave fields empty if no data is found on Airtable
function leaveFieldsEmpty(field, element) {
  if (field !== undefined) {
    element.value = field;
  } else {
    element.value = "";
  }
}

$(currentConTable).mousedown(function (e) {
  var length = currentConTable.rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
  }
  $(document).mousemove(move).mouseup(up);
});

$("#table-subjects").mousedown(function (e) {
  var length = document.getElementById("table-subjects").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    // the below functions updates the row index accordingly and update the order of subject IDs in json
    updateIndexForTable(document.getElementById("table-subjects"));
    updateOrderIDTable(
      document.getElementById("table-subjects"),
      subjectsTableData,
      "subjects"
    );
  }
  $(document).mousemove(move).mouseup(up);
});

$("#table-samples").mousedown(function (e) {
  var length = document.getElementById("table-samples").rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    // the below functions updates the row index accordingly and update the order of sample IDs in json
    updateIndexForTable(document.getElementById("table-samples"));
    updateOrderIDTable(
      document.getElementById("table-samples"),
      samplesTableData,
      "samples"
    );
  }
  $(document).mousemove(move).mouseup(up);
});

$("#contributor-table-dd").mousedown(function (e) {
  var length = document.getElementById("contributor-table-dd").rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("contributor-table-dd"));
    updateOrderContributorTable(
      document.getElementById("contributor-table-dd"),
      contributorArray
    );
  }
  $(document).mousemove(move).mouseup(up);
});

$("#protocol-link-table-dd").mousedown(function (e) {
  var length = document.getElementById("protocol-link-table-dd").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("protocol-link-table-dd"));
  }
  $(document).mousemove(move).mouseup(up);
});

$("#additional-link-table-dd").mousedown(function (e) {
  var length = document.getElementById("additional-link-table-dd").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("additional-link-table-dd"));
  }
  $(document).mousemove(move).mouseup(up);
});

const emptyDSInfoEntries = () => {
  var fieldSatisfied = true;
  var inforObj = grabDSInfoEntries();
  var emptyFieldArray = [];
  /// check for number of keywords
  for (var element in inforObj) {
    if (element === "keywords") {
      if (inforObj[element].length < 3) {
        emptyFieldArray.push("at least 3 keywords");
        fieldSatisfied = false;
      }
    } else {
      if (inforObj[element]) {
        if (
          inforObj[element].length === 0 ||
          inforObj[element] === "Select dataset"
        ) {
          fieldSatisfied = false;
          emptyFieldArray.push(element);
        }
      }
    }
  }
  return [fieldSatisfied, emptyFieldArray];
};

function emptyLinkInfo() {
  var tableCurrentLinks = document.getElementById("protocol-link-table-dd");
  var fieldSatisfied = false;
  if (tableCurrentLinks.rows.length > 1) {
    fieldSatisfied = true;
  }
  return fieldSatisfied;
}

const emptyInfoEntries = (element) => {
  var fieldSatisfied = true;
  if (element === "") {
    fieldSatisfied = false;
  }
  return fieldSatisfied;
};

/// detect empty required fields and raise a warning
function detectEmptyRequiredFields(funding) {
  /// dataset info
  var dsContent = emptyDSInfoEntries();
  var dsSatisfied = dsContent[0];
  var dsEmptyField = dsContent[1];

  /// protocol info check
  var protocolSatisfied = emptyLinkInfo();

  /// contributor info
  var conEmptyField = [];
  var conSatisfied = true;
  var fundingSatisfied = emptyInfoEntries(funding);
  var contactPersonExists = checkAtLeastOneContactPerson();
  var contributorNumber = document.getElementById("contributor-table-dd").rows
    .length;
  if (!fundingSatisfied) {
    conEmptyField.push("SPARC Award");
  }
  if (!contactPersonExists) {
    conEmptyField.push("One Corresponding Author");
  }
  if (contributorNumber <= 1) {
    conEmptyField.push("At least one contributor");
  }
  if (conEmptyField.length !== 0) {
    conSatisfied = false;
  }

  /// detect empty required fields and raise a warning
  var emptyArray = [dsSatisfied, conSatisfied, protocolSatisfied];
  var emptyMessageArray = [
    "- Missing required fields under Dataset Info section: " +
      dsEmptyField.join(", "),
    "- Missing required fields under Contributor Info section: " +
      conEmptyField.join(", "),
    "- Missing required item under Article(s) and Protocol(s) Info section: At least one protocol url",
  ];
  var allFieldsSatisfied = true;
  errorMessage = [];
  for (var i = 0; i < emptyArray.length; i++) {
    if (!emptyArray[i]) {
      errorMessage.push(emptyMessageArray[i]);
      allFieldsSatisfied = false;
    }
  }
  return [allFieldsSatisfied, errorMessage];
}

//////////////////////////End of Ds description section ///////////////////////////////////
//////////////// //////////////// //////////////// //////////////// ////////////////////////

var displaySize = 1000;

//////////////////////////////////
// Manage Dataset
//////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////// This is the part where similar functions are being modified for the new ///////////////
//////////////////////////////////// Prepare dataset UI ////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

/// Add all BF accounts to the dropdown list, and then choose by default one option ('global' account)
const curateDatasetDropdown = document.getElementById("curatebfdatasetlist");

async function updateDatasetCurate(datasetDropdown, bfaccountDropdown) {
  let defaultBfAccount =
    bfaccountDropdown.options[bfaccountDropdown.selectedIndex].text;
  try {
    let responseObject = await client.get(
      `manage_datasets/bf_dataset_account`,
      {
        params: {
          selected_account: defaultBfAccount,
        },
      }
    );
    datasetList = [];
    datasetList = responseObject.data.datasets;
    populateDatasetDropdownCurate(datasetDropdown, datasetList);
    refreshDatasetList();
  } catch (error) {
    clientError(error);
    curateBFAccountLoadStatus.innerHTML =
      "<span style='color: red'>" + userErrorMessage(error) + "</span>";
  }
}

//// De-populate dataset dropdowns to clear options for CURATE
function populateDatasetDropdownCurate(datasetDropdown, datasetlist) {
  removeOptions(datasetDropdown);

  /// making the first option: "Select" disabled
  addOption(datasetDropdown, "Select dataset", "Select dataset");
  var options = datasetDropdown.getElementsByTagName("option");
  options[0].disabled = true;

  for (var myitem of datasetlist) {
    var myitemselect = myitem.name;
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    datasetDropdown.appendChild(option);
  }
}
///////////////////////////////END OF NEW CURATE UI CODE ADAPTATION ///////////////////////////////////////////////////

const metadataDatasetlistChange = () => {
  $("#bf-dataset-subtitle").val("");
  $("#para-dataset-banner-image-status").html("");
  showCurrentSubtitle();
  showCurrentDescription();
  showCurrentLicense();
  showCurrentBannerImage();
  // TODO-NEW: Check flow
  showCurrentTags();
};

// Manage dataset permission
const permissionDatasetlistChange = () => {
  showCurrentPermission();
};

function datasetStatusListChange() {
  $(bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");
  showCurrentDatasetStatus();
}

function postCurationListChange() {
  // display the pre-publishing page
  showPrePublishingPageElements();
  showPublishingStatus();
}

// upload banner image //
const Cropper = require("cropperjs");
const { default: Swal } = require("sweetalert2");
const { waitForDebugger } = require("inspector");
const { resolve } = require("path");
const { background } = require("jimp");
const { rename } = require("fs");
const { resolveSoa } = require("dns");
var cropOptions = {
  aspectRatio: 1,
  movable: false,
  // Enable to rotate the image
  rotatable: false,
  // Enable to scale the image
  scalable: false,
  // Enable to zoom the image
  zoomable: false,
  // Enable to zoom the image by dragging touch
  zoomOnTouch: false,
  // Enable to zoom the image by wheeling mouse
  zoomOnWheel: false,
  // preview: '.preview',
  viewMode: 1,
  responsive: true,
  crop: function (event) {
    var data = event.detail;
    let image_height = Math.round(data.height);

    formBannerHeight.value = image_height;

    if (image_height < 512 || image_height > 2048) {
      $("#save-banner-image").prop("disabled", true);
      $("#form-banner-height").css("color", "red");
      $("#form-banner-height").css("border", "1px solid red");
      $(".crop-image-text").css("color", "red");
    } else {
      $("#save-banner-image").prop("disabled", false);
      $("#form-banner-height").css("color", "black");
      $("#form-banner-height").css("border", "1px solid black");
      $(".crop-image-text").css("color", "black");
    }

    // formBannerWidth.value = Math.round(data.width)
  },
};

var imageExtension;
var myCropper = new Cropper(bfViewImportedImage, cropOptions);

const setupPublicationOptionsPopover = () => {
  // setup the calendar that is in the popup
  const container = document.getElementById("tui-date-picker-container");
  const target = document.getElementById("tui-date-picker-target");

  // calculate one year from now
  var oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  // initialize the calendar
  const instance = new DatePicker(container, {
    input: {
      element: target,
    },
    date: new Date(),
    // a user can lift an embargo today or a year from now
    selectableRanges: [[new Date(), oneYearFromNow]],
  });

  // display/hide calendar on toggle
  $("input[name='publishing-options']").on("change", (e) => {
    let tuiCalendarWrapper = document.getElementById("calendar-wrapper");
    if (e.target.value === "embargo-date-check") {
      tuiCalendarWrapper.style.visibility = "visible";
    } else {
      tuiCalendarWrapper.style.visibility = "hidden";
    }
  });

  // add a scroll effect
  const input = document.getElementById("tui-date-picker-target");
  let calendar = document.querySelector(".tui-calendar-body-inner");

  input.addEventListener("click", () => {
    setTimeout(() => {
      calendar.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
  });
};

async function submitReviewDatasetCheck(res) {
  var reviewstatus = res[0];
  var publishingStatus = res[1];
  if (publishingStatus === "PUBLISH_IN_PROGRESS") {
    Swal.fire({
      icon: "error",
      title:
        "Your dataset is currently being published. Please wait until it is completed.",
      text: "Your dataset is already under review. Please wait until the Publishers within your organization make a decision.",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else if (reviewstatus === "requested") {
    Swal.fire({
      icon: "error",
      title: "Cannot submit the dataset for review at this time!",
      text: "Your dataset is already under review. Please wait until the Publishers within your organization make a decision.",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else if (publishingStatus === "PUBLISH_SUCCEEDED") {
    // embargo release date represents the time a dataset that has been reviewed for publication becomes public
    // user sets this value in the UI otherwise it stays an empty string
    let embargoReleaseDate = "";

    // confirm with the user that they will submit a dataset and check if they want to set an embargo date
    let userResponse = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "warning",
      confirmButtonText: "Submit",
      denyButtonText: "Cancel",
      showDenyButton: true,
      title: `Submit your dataset for pre-publishing review`,
      reverseButtons: reverseSwalButtons,
      text: "",
      html: `
                <div style="display: flex; flex-direction: column;  font-size: 15px;">
                <p style="text-align:left">This dataset has already been published. This action will submit the dataset again for review to the SPARC Curation Team. While under review, the dataset will become locked until it has either been approved or rejected for publication. If accepted a new version of your dataset will be published.</p>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" name="publishing-options" value="immediate" style=" border: 0px; width: 18px; height: 18px;" checked>
                  <div style="margin-left: 5px;"><label for="immediate"> Make this dataset available to the public immediately after publishing</label></div>
                </div>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" id="embargo-date-check" name="publishing-options" value="embargo-date-check" style=" border: 0px; width: 22px; height: 22px;">
                  <div style="margin-left: 5px;"><label for="embargo-date-check" style="text-align:left">Place this dataset under embargo so that it is not made public immediately after publishing</label></div>
                </div>
                <div style="visibility:hidden; flex-direction: column;  margin-top: 10px;" id="calendar-wrapper">
                <label style="margin-bottom: 5px; font-size: 13px;">When would you like this dataset to become publicly available?<label>
                <div class="tui-datepicker-input tui-datetime-input tui-has-focus" style="margin-top: 5px;">

                    <input
                      type="text"
                      id="tui-date-picker-target"
                      aria-label="Date-Time"
                      />

                      <span class="tui-ico-date"></span>
                    </div>
                    <div
                    id="tui-date-picker-container"
                    style="margin-top: -1px; margin-left: 60px;"
                    ></div>
                </div>
              </div>
            `,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      willOpen: () => {
        setupPublicationOptionsPopover();
      },
      willClose: () => {
        // check if the embargo radio button is selected
        const checkedRadioButton = $(
          "input:radio[name ='publishing-options']:checked"
        ).val();

        if (checkedRadioButton === "embargo-date-check") {
          // set the embargoDate variable if so
          embargoReleaseDate = $("#tui-date-picker-target").val();
        }
      },
    });

    // check if the user cancelled
    if (!userResponse.isConfirmed) {
      // do not submit the dataset
      return;
    }

    // swal loading message for the submission
    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    Swal.fire({
      title: `Submitting dataset for pre-publishing review`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    // submit the dataset for review with the given embargoReleaseDate
    await submitReviewDataset(embargoReleaseDate);
  } else {
    // status is NOT_PUBLISHED

    // embargo release date represents the time a dataset that has been reviewed for publication becomes public
    // user sets this value in the UI otherwise it stays an empty string
    let embargoReleaseDate = "";

    // confirm with the user that they will submit a dataset and check if they want to set an embargo date
    let userResponse = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Submit",
      denyButtonText: "Cancel",
      showDenyButton: true,
      title: `Submit your dataset for pre-publishing review`,
      reverseButtons: reverseSwalButtons,
      html: `
              <div style="display: flex; flex-direction: column;  font-size: 15px;">
                <p style="text-align:left">Your dataset will be submitted for review to the SPARC Curation Team. While under review, the dataset will become locked until it has either been approved or rejected for publication. </p>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" name="publishing-options" value="immediate" style=" border: 0px; width: 18px; height: 18px;" checked>
                  <div style="margin-left: 5px;"><label for="immediate"> Make this dataset available to the public immediately after publishing</label></div>
                </div>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" id="embargo-date-check" name="publishing-options" value="embargo-date-check" style=" border: 0px; width: 22px; height: 22px;">
                  <div style="margin-left: 5px;"><label for="embargo-date-check" style="text-align:left">Place this dataset under embargo so that it is not made public immediately after publishing</label></div>
                </div>
                <div style="visibility:hidden; flex-direction: column;  margin-top: 10px;" id="calendar-wrapper">
                <label style="margin-bottom: 5px; font-size: 13px;">When would you like this dataset to become publicly available?<label>
                <div class="tui-datepicker-input tui-datetime-input tui-has-focus" style="margin-top: 5px;">

                    <input
                      type="text"
                      id="tui-date-picker-target"
                      aria-label="Date-Time"
                      />

                      <span class="tui-ico-date"></span>
                    </div>
                    <div
                    id="tui-date-picker-container"
                    style="margin-top: -1px; margin-left: 60px;"
                    ></div>
                </div>
              </div>
            `,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      willOpen: () => {
        setupPublicationOptionsPopover();
      },
      willClose: () => {
        // check if the embargo radio button is selected
        const checkedRadioButton = $(
          "input:radio[name ='publishing-options']:checked"
        ).val();

        if (checkedRadioButton === "embargo-date-check") {
          // set the embargoDate variable if so
          embargoReleaseDate = $("#tui-date-picker-target").val();
        }
      },
    });

    // check if the user cancelled
    if (!userResponse.isConfirmed) {
      // do not submit the dataset
      return;
    }

    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    Swal.fire({
      title: `Submitting dataset for pre-publishing review`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // submit the dataset for review with the given embargoReleaseDate
    await submitReviewDataset(embargoReleaseDate);
  }
}

ipcRenderer.on("warning-publish-dataset-selection", (event, index) => {
  if (index === 0) {
    submitReviewDataset();
  }
  $("#submit_prepublishing_review-spinner").hide();
});

ipcRenderer.on("warning-publish-dataset-again-selection", (event, index) => {
  if (index === 0) {
    submitReviewDataset();
  }
  $("#submit_prepublishing_review-spinner").hide();
});

async function submitReviewDataset(embargoReleaseDate) {
  $("#para-submit_prepublishing_review-status").text("");
  bfRefreshPublishingDatasetStatusBtn.disabled = true;
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  // title text
  let title = "";

  // check if the user has selected any files they want to be hidden to the public upon publication (aka ignored/excluded files)
  // set the loading message title accordingly
  if (excludedFilesInPublicationFlow()) {
    title =
      "Ignoring selected files and submitting dataset for pre-publishing review";
  } else {
    title = "Submitting dataset for pre-publishing review";
  }

  // show a SWAL loading message until the submit for prepublishing flow is successful or fails
  Swal.fire({
    title: title,
    html: "Please wait...",
    // timer: 5000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // if there are excluded files upload them to Pennsieve so they will not be viewable to the public upon publication
  if (excludedFilesInPublicationFlow()) {
    // get the excluded files from the excluded files list in the third step of the pre-publishing review submission flow
    let files = getExcludedFilesFromPublicationFlow();
    try {
      // exclude the user's selected files from publication
      //check res
      await api.updateDatasetExcludedFiles(selectedBfDataset, files);
    } catch (error) {
      // log the error
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ALL_LEVELS,
        ["Updating excluded files"]
      );

      var emessage = userError(error);

      // alert the user of the error
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        confirmButtonText: "Ok",
        title: `Could not exclude the selected files from publication`,
        text: "Please try again.",
        icon: "error",
        reverseButtons: reverseSwalButtons,
        text: `${emessage}`,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      // stop publication
      return;
    }
  }

  try {
    // TODO: Replace with Flask Call -- READY
    await submitDatasetForPublication(
      selectedBfAccount,
      selectedBfDataset,
      embargoReleaseDate
    );
  } catch (error) {
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Submit dataset"]
    );
    log.error(error);
    console.error(error);

    var emessage = userError(error);

    // alert the user of an error
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: `Could not submit your dataset for pre-publishing review`,
      icon: "error",
      reverseButtons: reverseSwalButtons,
      text: `${emessage}`,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // stop execution
    return;
  }

  // update the publishing status UI element
  await showPublishingStatus("noClear");

  // track success
  logGeneralOperationsForAnalytics(
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    AnalyticsGranularity.ALL_LEVELS,
    ["Submit dataset"]
  );

  // alert the user the submission was successful
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    confirmButtonText: "Ok",
    title: `Dataset has been submitted for pre-publishing review to the publishers within your organization!`,
    icon: "success",
    reverseButtons: reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  });

  await transitionFreeFormMode(
    document.querySelector("#begin-prepublishing-btn"),
    "submit_prepublishing_review-question-2",
    "submit_prepublishing_review-tab",
    "",
    "individual-question post-curation"
  );
}

// //Withdraw dataset from review
function withdrawDatasetSubmission() {
  // show a SWAL loading message until the submit for prepublishing flow is successful or fails
  Swal.fire({
    title: `Preparing to withdraw the dataset submission`,
    html: "Please wait...",
    // timer: 5000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // get the publishing status of the currently selected dataset
  // then check if it can be withdrawn, then withdraw it
  // catch any uncaught errors at this level (aka greacefully catch any exceptions to alert the user we cannot withdraw their dataset)
  showPublishingStatus(withdrawDatasetCheck).catch((error) => {
    log.error(error);
    console.error(error);
    var emessage = userError(error);
    Swal.fire({
      title: "Could not withdraw dataset from publication!",
      text: `${emessage}`,
      heightAuto: false,
      icon: "error",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });

    // track the error for analysis
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );
  });
}

async function withdrawDatasetCheck(res) {
  var reviewstatus = res[0];
  if (reviewstatus !== "requested") {
    Swal.fire({
      icon: "error",
      title: "Your dataset is not currently under review!",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else {
    let result = await Swal.fire({
      icon: "warning",
      text: "Your dataset will be removed from review. You will have to submit it again before publishing it. Would you like to continue?",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    if (result.isConfirmed) {
      // show a SWAL loading message until the submit for prepublishing flow is successful or fails
      Swal.fire({
        title: `Withdrawing dataset submission`,
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      await withdrawReviewDataset();
    }
  }
}

async function withdrawReviewDataset() {
  bfWithdrawReviewDatasetBtn.disabled = true;
  var selectedBfAccount = $("#current-bf-account").text();
  var selectedBfDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");

  try {
    await api.withdrawDatasetReviewSubmission(selectedBfDataset);

    logGeneralOperationsForAnalytics(
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );

    // show the user their dataset's updated publishing status
    await showPublishingStatus("noClear");

    await Swal.fire({
      title: "Dataset has been withdrawn from review!",
      heightAuto: false,
      icon: "success",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });

    // reveal the current section (question-3) again using the new publishing status value
    await transitionFreeFormMode(
      document.querySelector("#begin-prepublishing-btn"),
      "submit_prepublishing_review-question-2",
      "submit_prepublishing_review-tab",
      "",
      "individual-question post-curation"
    );

    // scroll to the submit button
    // scrollToElement(".pre-publishing-continue");

    bfRefreshPublishingDatasetStatusBtn.disabled = false;
    bfWithdrawReviewDatasetBtn.disabled = false;
  } catch (error) {
    log.error(error);
    console.error(error);
    var emessage = userError(error);
    Swal.fire({
      title: "Could not withdraw dataset from publication!",
      text: `${emessage}`,
      heightAuto: false,
      icon: "error",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });

    // track the error for analysis
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );
  }
}

//////////////////////////////////
// Helper functions
//////////////////////////////////

// General //

function removeOptions(selectbox) {
  var i;
  for (i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
}

function userError(error) {
  var myerror = error.message;
  return myerror;
}

// Manage Datasets //

function refreshBfUsersList() {
  var accountSelected = defaultBfAccount;
  console.log("Default bf account is: ", defaultBfAccount);

  removeOptions(bfListUsers);
  var optionUser = document.createElement("option");
  optionUser.textContent = "Select user";
  bfListUsers.appendChild(optionUser);

  removeOptions(bfListUsersPI);
  var optionUserPI = document.createElement("option");
  optionUserPI.textContent = "Select PI";
  bfListUsersPI.appendChild(optionUserPI);

  if (accountSelected !== "Select") {
    client
      .get(`manage_datasets/bf_get_users?selected_account=${accountSelected}`)
      .then((res) => {
        let users = res.data["users"];
        // console.log("Get users response: ", users);
        // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
        $("#bf_list_users").selectpicker("refresh");
        $("#bf_list_users").find("option:not(:first)").remove();
        $("#button-add-permission-user").hide();
        $("#bf_list_users_pi").selectpicker("refresh");
        $("#bf_list_users_pi").find("option:not(:first)").remove();
        for (var myItem in users) {
          // returns like [..,''fname lname email !!**!! pennsieve_id',',..]
          let sep_pos = users[myItem].lastIndexOf("!|**|!");
          var myUser = users[myItem].substring(0, sep_pos);
          var optionUser = document.createElement("option");
          optionUser.textContent = myUser;
          optionUser.value = users[myItem].substring(sep_pos + 6);
          bfListUsers.appendChild(optionUser);
          var optionUser2 = optionUser.cloneNode(true);
          bfListUsersPI.appendChild(optionUser2);
        }
      })
      .catch((error) => {
        log.error(error);
        console.error(error);
      });
  }
}

function refreshBfTeamsList(teamList) {
  removeOptions(teamList);

  var accountSelected = defaultBfAccount;
  var optionTeam = document.createElement("option");

  optionTeam.textContent = "Select team";
  teamList.appendChild(optionTeam);

  if (accountSelected !== "Select") {
    client
      .get(`/manage_datasets/bf_get_teams?selected_account=${accountSelected}`)
      .then((res) => {
        let teams = res.data["teams"];
        // The removeoptions() wasn't working in some instances (creating a double list) so second removal for everything but the first element.
        $("#bf_list_teams").selectpicker("refresh");
        $("#bf_list_teams").find("option:not(:first)").remove();
        $("#button-add-permission-team").hide();
        for (var myItem in teams) {
          var myTeam = teams[myItem];
          var optionTeam = document.createElement("option");
          optionTeam.textContent = myTeam;
          optionTeam.value = myTeam;
          teamList.appendChild(optionTeam);
        }
        confirm_click_account_function();
      })
      .catch((error) => {
        log.error(error);
        console.error(error);
        confirm_click_account_function();
      });
  }
}

const selectOptionColor = (mylist) => {
  mylist.style.color = mylist.options[mylist.selectedIndex].style.color;
};

////////////////////////////////DATASET FILTERING FEATURE/////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

// this function now is only used to load all datasets ("All" permission)
// onto the dataset_description file ds-name select
const refreshDatasetList = () => {
  var datasetPermission = "All";

  var filteredDatasets = [];
  if (datasetPermission.toLowerCase() === "all") {
    for (var i = 0; i < datasetList.length; i++) {
      filteredDatasets.push(datasetList[i].name);
    }
  }
  filteredDatasets.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  populateDatasetDropdowns(filteredDatasets);
  // parentDSTagify.settings.whitelist = getParentDatasets();
  return filteredDatasets.length;
};

/// populate the dropdowns with refreshed dataset list
const populateDatasetDropdowns = (mylist) => {
  clearDatasetDropdowns();
  for (myitem in mylist) {
    var myitemselect = mylist[myitem];
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    var option1 = option.cloneNode(true);
    var option2 = option.cloneNode(true);

    curateDatasetDropdown.appendChild(option2);
  }
  metadataDatasetlistChange();
  permissionDatasetlistChange();
  postCurationListChange();
  datasetStatusListChange();
};
////////////////////////////////////END OF DATASET FILTERING FEATURE//////////////////////////////

async function updateBfAccountList() {
  let responseObject;
  try {
    responseObject = await client.get("manage_datasets/bf_account_list");
  } catch (error) {
    clientError(error);
    confirm_click_account_function();
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);

    return;
  }

  let accountList = responseObject.data["accounts"];
  for (myitem in accountList) {
    var myitemselect = accountList[myitem];
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    var option2 = option.cloneNode(true);
  }
  await loadDefaultAccount();
  if (accountList[0] === "Select" && accountList.length === 1) {
    // todo: no existing accounts to load
  }
  refreshBfUsersList();
  refreshBfTeamsList(bfListTeams);
}

async function loadDefaultAccount() {
  let responseObject;

  try {
    responseObject = await client.get(
      "/manage_datasets/bf_default_account_load"
    );
  } catch (e) {
    clientError(e);
    confirm_click_account_function();
    console.log("Could not get default account");
    return;
  }

  let accounts = responseObject.data["defaultAccounts"];

  if (accounts.length > 0) {
    var myitemselect = accounts[0];
    defaultBfAccount = myitemselect;
    $("#current-bf-account").text(myitemselect);
    $("#current-bf-account-generate").text(myitemselect);
    $("#create_empty_dataset_BF_account_span").text(myitemselect);
    $(".bf-account-span").text(myitemselect);
    showHideDropdownButtons("account", "show");
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);
  }
}

const showPrePublishingPageElements = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
  } else {
    // show the "Begin Publishing" button and hide the checklist and submission section
    $("#begin-prepublishing-btn").show();
    $("#prepublishing-checklist-container").hide();
    $("#prepublishing-submit-btn-container").hide();
    $("#excluded-files-container").hide();
    $(".pre-publishing-continue-container").hide();
  }
};

async function showPublishingStatus(callback) {
  return new Promise(async function (resolve, reject) {
    if (callback == "noClear") {
      var nothing;
    }
    var selectedBfAccount = $("#current-bf-account").text();
    var selectedBfDataset = $(".bf-dataset-span")
      .html()
      .replace(/^\s+|\s+$/g, "");

    if (selectedBfDataset === "None") {
      resolve();
    } else {
      try {
        let get_publishing_status = await client.get(
          `/disseminate_datasets/datasets/${selectedBfDataset}/publishing_status?selected_account=${selectedBfAccount}`
        );
        let res = get_publishing_status.data;

        try {
          //update the dataset's publication status and display
          //onscreen for the user under their dataset name
          $("#para-review-dataset-info-disseminate").text(
            publishStatusOutputConversion(res)
          );

          if (
            callback === submitReviewDatasetCheck ||
            callback === withdrawDatasetCheck
          ) {
            return resolve(callback(res));
          }

          resolve();
        } catch (error) {
          // an exception will be caught and rejected
          // if the executor function is not ready before an exception is found it is uncaught without the try catch
          reject(error);
        }
      } catch (error) {
        clientError(error);

        Swal.fire({
          title: "Could not get your publishing status!",
          text: userErrorMessage(error),
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Ok",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
        });

        logGeneralOperationsForAnalytics(
          "Error",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
          AnalyticsGranularity.ALL_LEVELS,
          ["Show publishing status"]
        );

        resolve();
      }
    }
  });
}

function publishStatusOutputConversion(res) {
  var reviewStatus = res[0];
  var publishStatus = res[1];

  var outputMessage = "";
  if (reviewStatus === "draft" || reviewStatus === "cancelled") {
    outputMessage += "Dataset is not under review currently";
  } else if (reviewStatus === "requested") {
    outputMessage +=
      "Dataset is currently under review by your Publishing Team";
  } else if (reviewStatus === "rejected") {
    outputMessage +=
      "Dataset has been rejected by your Publishing Team and may require revision";
  } else if (reviewStatus === "accepted") {
    outputMessage +=
      "Dataset has been accepted for publication by your Publishing Team";
  }

  return outputMessage;
}

const allowedMedataFiles = [
  "submission.xlsx",
  "submission.csv",
  "submission.json",
  "dataset_description.xlsx",
  "dataset_description.csv",
  "dataset_description.json",
  "subjects.xlsx",
  "subjects.csv",
  "subjects.json",
  "samples.xlsx",
  "samples.csv",
  "samples.json",
  "README.txt",
  "CHANGES.txt",
];

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
////////////////// ORGANIZE DATASETS NEW FEATURE /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var backFolder = [];
var forwardFolder = [];

var highLevelFolders = [
  "code",
  "derivative",
  "docs",
  "source",
  "primary",
  "protocol",
];
var highLevelFolderToolTip = {
  code: "<b>code</b>: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  derivative:
    "<b>derivative</b>: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  docs: "<b>docs</b>: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  source:
    "<b>source</b>: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  primary:
    "<b>primary</b>: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  protocol:
    "<b>protocol</b>: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a target='_blank' href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>.",
};

var sodaJSONObj = {};

/// back button Curate
organizeDSbackButton.addEventListener("click", function () {
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = getGlobalPath(organizeDSglobalPath);
    if (filtered.length === 1) {
      organizeDSglobalPath.value = filtered[0] + "/";
    } else {
      organizeDSglobalPath.value =
        filtered.slice(0, filtered.length - 1).join("/") + "/";
    }
    var myPath = datasetStructureJSONObj;
    for (var item of filtered.slice(1, filtered.length - 1)) {
      myPath = myPath["folders"][item];
    }
    // construct UI with files and folders
    $("#items").empty();
    already_created_elem = [];
    let items = loadFileFolder(myPath); //array -
    let total_item_count = items[1].length + items[0].length;
    //we have some items to display
    listItems(myPath, "#items", 500, (reset = true));
    organizeLandingUIEffect();
    // reconstruct div with new elements
    getInFolder(
      ".single-item",
      "#items",
      organizeDSglobalPath,
      datasetStructureJSONObj
    );
  }
});

// Add folder button
organizeDSaddNewFolder.addEventListener("click", function (event) {
  event.preventDefault();
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var newFolderName = "New Folder";
    Swal.fire({
      title: "Add new folder...",
      text: "Enter a name below:",
      heightAuto: false,
      input: "text",
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: "Cancel",
      confirmButtonText: "Add folder",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        $(".swal2-input").attr("id", "add-new-folder-input");
        $(".swal2-confirm").attr("id", "add-new-folder-button");
        $("#add-new-folder-input").keyup(function () {
          var val = $("#add-new-folder-input").val();
          for (var char of nonAllowedCharacters) {
            if (val.includes(char)) {
              Swal.showValidationMessage(
                `The folder name cannot contains the following characters ${nonAllowedCharacters}, please enter a different name!`
              );
              $("#add-new-folder-button").attr("disabled", true);
              return;
            }
            $("#add-new-folder-button").attr("disabled", false);
          }
        });
      },
      didDestroy: () => {
        $(".swal2-confirm").attr("id", "");
        $(".swal2-input").attr("id", "");
      },
    }).then((result) => {
      if (result.value) {
        if (result.value !== null && result.value !== "") {
          newFolderName = result.value.trim();
          // check for duplicate or files with the same name
          var duplicate = false;
          var itemDivElements = document.getElementById("items").children;
          for (var i = 0; i < itemDivElements.length; i++) {
            if (newFolderName === itemDivElements[i].innerText) {
              duplicate = true;
              break;
            }
          }
          if (duplicate) {
            Swal.fire({
              icon: "error",
              text: "Duplicate folder name: " + newFolderName,
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });

            logCurationForAnalytics(
              "Error",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );
          } else {
            // var appendString = "";
            // appendString =
            //   appendString +
            //   '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">' +
            //   newFolderName +
            //   "</div></div>";
            // $(appendString).appendTo("#items");

            /// update datasetStructureJSONObj
            var currentPath = organizeDSglobalPath.value;
            var jsonPathArray = currentPath.split("/");
            var filtered = jsonPathArray.slice(1).filter(function (el) {
              return el != "";
            });

            var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
            // update Json object with new folder created
            var renamedNewFolder = newFolderName;
            myPath["folders"][renamedNewFolder] = {
              folders: {},
              files: {},
              type: "virtual",
              action: ["new"],
            };

            listItems(myPath, "#items", 500, (reset = true));
            getInFolder(
              ".single-item",
              "#items",
              organizeDSglobalPath,
              datasetStructureJSONObj
            );

            // log that the folder was successfully added
            logCurationForAnalytics(
              "Success",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );

            hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
            hideMenu(
              "high-level-folder",
              menuFolder,
              menuHighLevelFolders,
              menuFile
            );
          }
        }
      }
    });
  } else {
    Swal.fire({
      icon: "error",
      text: "New folders cannot be added at this level. If you want to add high-level SPARC folder(s), please go back to the previous step to do so.",
      confirmButtonText: "OK",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }
});

// ///////////////////////////////////////////////////////////////////////////
// recursively populate json object
function populateJSONObjFolder(action, jsonObject, folderPath) {
  var myitems = fs.readdirSync(folderPath);
  myitems.forEach((element) => {
    var statsObj = fs.statSync(path.join(folderPath, element));
    var addedElement = path.join(folderPath, element);
    if (statsObj.isDirectory() && !/(^|\/)\.[^\/\.]/g.test(element)) {
      if (irregularFolderArray.includes(addedElement)) {
        var renamedFolderName = "";
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = removeIrregularFolders(element);
          } else if (action === "replace") {
            renamedFolderName = replaceIrregularFolders(element);
          }
          jsonObject["folders"][renamedFolderName] = {
            type: "local",
            folders: {},
            files: {},
            path: addedElement,
            action: ["new", "renamed"],
          };
          element = renamedFolderName;
        }
      } else {
        jsonObject["folders"][element] = {
          type: "local",
          folders: {},
          files: {},
          path: addedElement,
          action: ["new"],
        };
      }
      populateJSONObjFolder(
        action,
        jsonObject["folders"][element],
        addedElement
      );
    } else if (statsObj.isFile() && !/(^|\/)\.[^\/\.]/g.test(element)) {
      jsonObject["files"][element] = {
        path: addedElement,
        description: "",
        "additional-metadata": "",
        type: "local",
        action: ["new"],
      };
    }
  });
}

let full_name_show = false;

function hideFullName() {
  full_name_show = false;
  fullNameValue.style.display = "none";
  fullNameValue.style.top = "-250%";
  fullNameValue.style.left = "-250%";
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  full_name_show = true;
  var isOverflowing =
    element.clientWidth < element.scrollWidth ||
    element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    var mouseX = ev.pageX - 200;
    var mouseY = ev.pageY;
    fullNameValue.innerHTML = text;
    $(".hoverFullName").css({ top: mouseY, left: mouseX });
    setTimeout(() => {
      if (full_name_show) {
        // fullNameValue.style.display = "block";
        $(".hoverFullName").fadeIn("slow");
      }
    }, 800);
  }
}

/// hover over a function for full name
function hoverForFullName(ev) {
  var fullPath = ev.innerText;
  // ev.children[1] is the child element folder_desc of div.single-item,
  // which we will put through the overflowing check in showFullName function
  showFullName(event, ev.children[1], fullPath);
}

// // If the document is clicked somewhere
// document.addEventListener('onmouseover', function(e){
//   if (e.target.classList.value !== "myFile") {
//     hideFullPath()
//   } else {
//     hoverForPath(e)
//   }
// });

document.addEventListener("onmouseover", function (e) {
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e);
  } else {
    hideFullName();
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
function showDetailsFile() {
  $(".div-display-details.file").toggleClass("show");
  // $(".div-display-details.folders").hide()
}

const pasteFromClipboard = (event, target_element) => {
  event.preventDefault();
  let key = Clipboard.readText();

  if (
    target_element == "bootbox-api-key" ||
    target_element == "bootbox-api-secret"
  ) {
    const regex = new RegExp(
      "^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$",
      "i"
    );
    // "/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i";
    if (regex.test(key)) {
      $(`#${target_element}`).val(key);
    } else {
      console.log("Invalid API Key");
      log.error("Invalid API Key");
    }
  }
};

var bfAddAccountBootboxMessage = `<form>
    <div class="form-group row">
      <label for="bootbox-key-name" class="col-sm-3 col-form-label">
        Key name:
      </label>
      <div class="col-sm-9">
        <input type="text" id="bootbox-key-name" class="form-control" />
      </div>
    </div>
    <div class="form-group row">
      <label for="bootbox-api-key" class="col-sm-3 col-form-label">
        API Key:
      </label>
      <div class="col-sm-9" style="display:flex">
        <input id="bootbox-api-key" type="text" class="form-control" />
        <button
          class="ui left floated button"
          style="height:auto; margin-left:3px"
          onclick="pasteFromClipboard(event, 'bootbox-api-key')"
        >
          <i class="fas fa-paste"></i>
        </button>
      </div>
    </div>
    <div class="form-group row">
      <label for="bootbox-api-secret" class="col-sm-3 col-form-label">
        API Secret:
      </label>
      <div class="col-sm-9" style="display:flex">
        <input id="bootbox-api-secret" class="form-control" type="text" />
        <button
          class="ui left floated button"
          style="height:auto; margin-left:3px"
          onclick="pasteFromClipboard(event, 'bootbox-api-secret')"
        >
          <i class="fas fa-paste"></i>
        </button>
      </div>
    </div>
  </form>`;

var bfaddaccountTitle = `<h3 style="text-align:center">Please specify a key name and enter your Pennsieve API key and secret below: <i class="fas fa-info-circle swal-popover"  id="add-bf-account-tooltip" rel="popover" data-placement="right" data-html="true" data-trigger="hover" ></i></h3>`;

// once connected to SODA get the user's accounts
(async () => {
  // wait until soda is connected to the backend server
  while (!sodaIsConnected) {
    await wait(1000);
  }

  retrieveBFAccounts();
})();

// this function is called in the beginning to load bf accounts to a list
// which will be fed as dropdown options
async function retrieveBFAccounts() {
  bfAccountOptions = [];
  bfAccountOptionsStatus = "";

  client
    .get("manage_datasets/bf_account_list")
    .then((res) => {
      let accounts = res.data;
      for (myitem in accounts) {
        bfAccountOptions[accounts[myitem]] = accounts[myitem];
      }
      showDefaultBFAccount();
    })
    .catch((error) => {
      log.error(error);
      console.error(error);
      bfAccountOptionsStatus = error;
    });
  return [bfAccountOptions, bfAccountOptionsStatus];
}

async function showDefaultBFAccount() {
  try {
    let bf_default_acc_req = await client.get(
      "manage_datasets/bf_default_account_load"
    );
    let accounts = bf_default_acc_req.data.defaultAccounts;
    if (accounts.length > 0) {
      var myitemselect = accounts[0];
      defaultBfAccount = myitemselect;
      try {
        let bf_account_details_req = await client.get(
          `/manage_datasets/bf_account_details`,
          {
            params: {
              selected_account: defaultBfAccount,
            },
          }
        );
        let accountDetails = bf_account_details_req.data.account_details;
        $("#para-account-detail-curate").html(accountDetails);
        $("#current-bf-account").text(defaultBfAccount);
        $("#current-bf-account-generate").text(defaultBfAccount);
        $("#create_empty_dataset_BF_account_span").text(defaultBfAccount);
        $(".bf-account-span").text(defaultBfAccount);
        $("#para-account-detail-curate-generate").html(accountDetails);
        $("#para_create_empty_dataset_BF_account").html(accountDetails);
        $(".bf-account-details-span").html(accountDetails);

        $("#div-bf-account-load-progress").css("display", "none");
        showHideDropdownButtons("account", "show");
        // refreshDatasetList()
        updateDatasetList();
      } catch (error) {
        clientError(error);

        $("#para-account-detail-curate").html("None");
        $("#current-bf-account").text("None");
        $("#current-bf-account-generate").text("None");
        $("#create_empty_dataset_BF_account_span").text("None");
        $(".bf-account-span").text("None");
        $("#para-account-detail-curate-generate").html("None");
        $("#para_create_empty_dataset_BF_account").html("None");
        $(".bf-account-details-span").html("None");

        $("#div-bf-account-load-progress").css("display", "none");
        showHideDropdownButtons("account", "hide");
      }
    }
  } catch (error) {
    clientError(error);
  }
}

////// function to trigger action for each context menu option
function hideMenu(category, menu1, menu2, menu3) {
  if (category === "folder") {
    menu1.style.display = "none";
    menu1.style.top = "-200%";
    menu1.style.left = "-200%";
  } else if (category === "high-level-folder") {
    menu2.style.display = "none";
    menu2.style.top = "-220%";
    menu2.style.left = "-220%";
  } else {
    menu3.style.display = "none";
    menu3.style.top = "-210%";
    menu3.style.left = "-210%";
  }
}

function changeStepOrganize(step) {
  if (step.id === "button-organize-prev") {
    document.getElementById("div-step-1-organize").style.display = "block";
    document.getElementById("div-step-2-organize").style.display = "none";
    document.getElementById("dash-title").innerHTML =
      "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>High-level folders";
    organizeNextStepBtn.style.display = "block";
    organizePrevStepBtn.style.display = "none";
  } else {
    document.getElementById("div-step-1-organize").style.display = "none";
    document.getElementById("div-step-2-organize").style.display = "block";
    document.getElementById("dash-title").innerHTML =
      "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>Generate dataset";
    organizePrevStepBtn.style.display = "block";
    organizeNextStepBtn.style.display = "none";
  }
}

var newDSName;
function generateDataset(button) {
  document.getElementById("para-organize-datasets-success").style.display =
    "none";
  document.getElementById("para-organize-datasets-error").style.display =
    "none";
  if (button.id === "btn-generate-locally") {
    $("#btn-generate-BF").removeClass("active");
    $(button).toggleClass("active");
    Swal.fire({
      title: "Generate dataset locally",
      text: "Enter a name for the dataset:",
      input: "text",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm and Choose Location",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate_fastest",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        newDSName = result.value.trim();
        ipcRenderer.send("open-file-dialog-newdataset");
      }
    });
  } else {
    $("#btn-generate-locally").removeClass("active");
    $(button).toggleClass("active");
  }
}

ipcRenderer.on("selected-new-dataset", async (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      document.getElementById("para-organize-datasets-loading").style.display =
        "block";
      document.getElementById("para-organize-datasets-loading").innerHTML =
        "<span>Please wait...</span>";
      try {
        let local_dataset = await client.post(`/organize_datasets/dataset`, {
          generation_type: "create-new",
          generation_destination_path: filepath[0],
          dataset_name: newDSName,
          soda_json_directory_structure: JSON.stringify(
            datasetStructureJSONObj
          ),
        });

        document.getElementById("para-organize-datasets-error").style.display =
          "none";
        document.getElementById(
          "para-organize-datasets-success"
        ).style.display = "block";
        document.getElementById("para-organize-datasets-success").innerHTML =
          "<span>Generated successfully!</span>";
      } catch (error) {
        clientError(error);

        document.getElementById(
          "para-organize-datasets-success"
        ).style.display = "none";
        document.getElementById("para-organize-datasets-error").style.display =
          "block";
        document.getElementById("para-organize-datasets-error").innerHTML =
          "<span> " + error + "</span>";
      }
    }
  }
});

//////////// FILE BROWSERS to import existing files and folders /////////////////////
organizeDSaddFiles.addEventListener("click", function () {
  ipcRenderer.send("open-files-organize-datasets-dialog");
});

ipcRenderer.on("selected-files-organize-datasets", async (event, path) => {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  let hidden_files_present = false;
  path = path.filter(
    (file_path) =>
      fs.statSync(file_path).isFile() && !/(^|\/)\.[^\/\.]/g.test(file_path)
  );
  path.forEach((file_path) => {
    if (/(^|\/)\.[^\/\.]/g.test(file_path)) {
      hidden_files_present = true;
    }
  });
  if (hidden_files_present == true) {
    Swal.fire({
      icon: "warning",
      text: "We found some hidden files. These will be ignored when importing.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }
  if (path.length > 0) {
    if (path.length < 500) {
      await addFilesfunction(
        path,
        myPath,
        organizeDSglobalPath,
        "#items",
        ".single-item",
        datasetStructureJSONObj
      );
    } else {
      let load_spinner_promise = new Promise(async (resolved) => {
        let background = document.createElement("div");
        let spinner_container = document.createElement("div");
        let spinner_icon = document.createElement("div");
        spinner_container.setAttribute("id", "items_loading_container");
        spinner_icon.setAttribute("id", "item_load");
        spinner_icon.setAttribute(
          "class",
          "ui large active inline loader icon-wrapper"
        );
        background.setAttribute("class", "loading-items-background");
        background.setAttribute("id", "loading-items-background-overlay");

        spinner_container.append(spinner_icon);
        document.body.prepend(background);
        document.body.prepend(spinner_container);
        let loading_items_spinner = document.getElementById(
          "items_loading_container"
        );
        loading_items_spinner.style.display = "block";
        if (loading_items_spinner.style.display === "block") {
          setTimeout(() => {
            resolved();
          }, 100);
        }
      }).then(async () => {
        await addFilesfunction(
          path,
          myPath,
          organizeDSglobalPath,
          "#items",
          ".single-item",
          datasetStructureJSONObj
        );
        // Swal.close();
        document.getElementById("loading-items-background-overlay").remove();
        document.getElementById("items_loading_container").remove();
        // background.remove();
      });
    }
  }
});

organizeDSaddFolders.addEventListener("click", function () {
  ipcRenderer.send("open-folders-organize-datasets-dialog");
});

ipcRenderer.on(
  "selected-folders-organize-datasets",
  async (event, pathElement) => {
    var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contain any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
    irregularFolderArray = [];
    var filtered = getGlobalPath(organizeDSglobalPath);
    var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
    for (var ele of pathElement) {
      detectIrregularFolders(path.basename(ele), ele);
    }
    if (irregularFolderArray.length > 0) {
      Swal.fire({
        title:
          "The following folders contain non-allowed characters in their names. How should we handle them?",
        html:
          "<div style='max-height:300px; overflow-y:auto'>" +
          irregularFolderArray.join("</br>") +
          "</div>",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Replace characters with (-)",
        denyButtonText: "Remove characters",
        cancelButtonText: "Cancel",
        didOpen: () => {
          $(".swal-popover").popover();
        },
        footer: footer,
      }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          if (pathElement.length > 500) {
            let load_spinner_promise = new Promise(async (resolved) => {
              let background = document.createElement("div");
              let spinner_container = document.createElement("div");
              let spinner_icon = document.createElement("div");
              spinner_container.setAttribute("id", "items_loading_container");
              spinner_icon.setAttribute("id", "item_load");
              spinner_icon.setAttribute(
                "class",
                "ui large active inline loader icon-wrapper"
              );
              background.setAttribute("class", "loading-items-background");
              background.setAttribute("id", "loading-items-background-overlay");

              spinner_container.append(spinner_icon);
              document.body.prepend(background);
              document.body.prepend(spinner_container);
              let loading_items_spinner = document.getElementById(
                "items_loading_container"
              );
              loading_items_spinner.style.display = "block";
              if (loading_items_spinner.style.display === "block") {
                setTimeout(() => {
                  resolved();
                }, 100);
              }
            }).then(async () => {
              await addFoldersfunction(
                "replace",
                irregularFolderArray,
                pathElement,
                myPath
              );
              document
                .getElementById("loading-items-background-overlay")
                .remove();
              document.getElementById("items_loading_container").remove();
            });
          } else {
            await addFoldersfunction(
              "replace",
              irregularFolderArray,
              pathElement,
              myPath
            );
          }
        } else if (result.isDenied) {
          if (pathElement.length > 500) {
            let load_spinner_promise = new Promise(async (resolved) => {
              let background = document.createElement("div");
              let spinner_container = document.createElement("div");
              let spinner_icon = document.createElement("div");
              spinner_container.setAttribute("id", "items_loading_container");
              spinner_icon.setAttribute("id", "item_load");
              spinner_icon.setAttribute(
                "class",
                "ui large active inline loader icon-wrapper"
              );
              background.setAttribute("class", "loading-items-background");
              background.setAttribute("id", "loading-items-background-overlay");

              spinner_container.append(spinner_icon);
              document.body.prepend(background);
              document.body.prepend(spinner_container);
              let loading_items_spinner = document.getElementById(
                "items_loading_container"
              );
              loading_items_spinner.style.display = "block";
              if (loading_items_spinner.style.display === "block") {
                setTimeout(() => {
                  resolved();
                }, 100);
              }
            }).then(async () => {
              await addFoldersfunction(
                "remove",
                irregularFolderArray,
                pathElement,
                myPath
              );
              document
                .getElementById("loading-items-background-overlay")
                .remove();
              document.getElementById("items_loading_container").remove();
            });
          } else {
            await addFoldersfunction(
              "remove",
              irregularFolderArray,
              pathElement,
              myPath
            );
          }
        }
      });
    } else {
      if (pathElement.length > 500) {
        let load_spinner_promise = new Promise(async (resolved) => {
          let background = document.createElement("div");
          let spinner_container = document.createElement("div");
          let spinner_icon = document.createElement("div");
          spinner_container.setAttribute("id", "items_loading_container");
          spinner_icon.setAttribute("id", "item_load");
          spinner_icon.setAttribute(
            "class",
            "ui large active inline loader icon-wrapper"
          );
          background.setAttribute("class", "loading-items-background");
          background.setAttribute("id", "loading-items-background-overlay");

          spinner_container.append(spinner_icon);
          document.body.prepend(background);
          document.body.prepend(spinner_container);
          let loading_items_spinner = document.getElementById(
            "items_loading_container"
          );
          loading_items_spinner.style.display = "block";
          if (loading_items_spinner.style.display === "block") {
            setTimeout(() => {
              resolved();
            }, 100);
          }
        }).then(async () => {
          await addFoldersfunction(
            "",
            irregularFolderArray,
            pathElement,
            myPath
          );
          document.getElementById("loading-items-background-overlay").remove();
          document.getElementById("items_loading_container").remove();
        });
      } else {
        await addFoldersfunction("", irregularFolderArray, pathElement, myPath);
      }
    }
  }
);

async function addFoldersfunction(
  action,
  nonallowedFolderArray,
  folderArray,
  currentLocation
) {
  let importToast = new Notyf({
    position: { x: "right", y: "bottom" },
    ripple: true,
    dismissible: true,
    ripple: false,
    types: [
      {
        type: "success",
        background: "#13716D",
        icon: {
          className: "fas fa-check-circle",
          tagName: "i",
          color: "white",
        },
        duration: 2500,
      },
    ],
  });
  var uiFolders = {};
  var importedFolders = {};
  var duplicateFolders = [];
  var folderPath = [];

  if (JSON.stringify(currentLocation["folders"]) !== "{}") {
    for (var folder in currentLocation["folders"]) {
      uiFolders[folder] = 1;
    }
  }
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount === 1) {
    Swal.fire({
      icon: "error",
      text: "Only SPARC folders can be added at this level. To add a new SPARC folder, please go back to Step 2.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // log the error
    logCurationForAnalytics(
      "Error",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      ["Step 3", "Import", "Folder"],
      determineDatasetLocation()
    );
  } else {
    // if non-allowed characters are detected, do the action
    // AND
    // check for duplicates/folders with the same name
    for (var i = 0; i < folderArray.length; i++) {
      var j = 1;
      var originalFolderName = path.basename(folderArray[i]);
      var renamedFolderName = originalFolderName;

      if (originalFolderName in currentLocation["folders"]) {
        //folder matches object key
        folderPath.push(folderArray[i]);
        duplicateFolders.push(originalFolderName);
      } else {
        if (originalFolderName in importedFolders) {
          folderPath.push(folderArray[i]);
          duplicateFolders.push(originalFolderName);
        } else {
          if (nonallowedFolderArray.includes(folderArray[i])) {
            if (action !== "ignore" && action !== "") {
              if (action === "remove") {
                renamedFolderName = removeIrregularFolders(folderArray[i]);
              } else if (action === "replace") {
                renamedFolderName = replaceIrregularFolders(folderArray[i]);
              }
              importedFolders[renamedFolderName] = {
                path: folderArray[i],
                "original-basename": originalFolderName,
              };
            }
          } else {
            importedFolders[originalFolderName] = {
              path: folderArray[i],
              "original-basename": originalFolderName,
            };
          }
        }
      }

      if (nonallowedFolderArray.includes(folderArray[i])) {
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = removeIrregularFolders(folderArray[i]);
          } else if (action === "replace") {
            renamedFolderName = replaceIrregularFolders(folderArray[i]);
          }
          importedFolders[renamedFolderName] = {
            path: folderArray[i],
            "original-basename": originalFolderName,
          };
        }
      } else {
        var listElements = showItemsAsListBootbox(duplicateFolders);
        var list = JSON.stringify(folderPath).replace(/"/g, "");
        if (duplicateFolders.length > 0) {
          Swal.fire({
            title: "Duplicate folder(s) detected",
            icon: "warning",
            showConfirmButton: false,
            allowOutsideClick: false,
            showCloseButton: true,
            customClass: "wide-swal-auto",
            backdrop: "rgba(0, 0, 0, 0.4)",
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate_animated animate_zoomout animate__faster",
            },
            html:
              `
            <div class="caption">
              <p>Folders with the following names are already in the current folder: <p><ul style="text-align: start;">${listElements}</ul></p></p>
            </div>
            <div class="swal-button-container">
              <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
              list +
              `')">Skip Folders</button>
              <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}')">Replace Existing Folders</button>
              <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}')">Import Duplicates</button>
              <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel')">Cancel</button>
              </div>`,
          });
        }
      }
    }

    if (Object.keys(importedFolders).length > 0) {
      for (var element in importedFolders) {
        currentLocation["folders"][element] = {
          type: "local",
          path: importedFolders[element]["path"],
          folders: {},
          files: {},
          action: ["new"],
        };
        populateJSONObjFolder(
          action,
          currentLocation["folders"][element],
          importedFolders[element]["path"]
        );
        // check if a folder has to be renamed due to duplicate reason
        if (element !== importedFolders[element]["original-basename"]) {
          currentLocation["folders"][element]["action"].push("renamed");
        }
      }
      // $("#items").empty();
      listItems(currentLocation, "#items", 500, (reset = true));
      getInFolder(
        ".single-item",
        "#items",
        organizeDSglobalPath,
        datasetStructureJSONObj
      );
      beginScrollListen();
      if (Object.keys(importedFolders).length > 1) {
        importToast.open({
          type: "success",
          message: "Successfully Imported Folders",
        });
      } else {
        importToast.open({
          type: "success",
          message: "Successfully Imported Folder",
        });
      }
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);

      // log the success
      logCurationForAnalytics(
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 3", "Import", "Folder"],
        determineDatasetLocation()
      );
    }
  }
}

//// Step 3. Organize dataset: Add files or folders with drag&drop
function allowDrop(ev) {
  ev.preventDefault();
}

var filesElement;
var targetElement;
async function drop(ev) {
  irregularFolderArray = [];
  let renamedFolderName = "";
  let replaced = [];
  var action = "";
  filesElement = ev.dataTransfer.files;
  targetElement = ev.target;
  // get global path
  var currentPath = organizeDSglobalPath.value;
  var jsonPathArray = currentPath.split("/");
  var filtered = jsonPathArray.slice(1).filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
  var importedFiles = {};
  var importedFolders = {};
  var nonAllowedDuplicateFiles = [];
  ev.preventDefault();
  var uiFiles = {};
  var uiFolders = {};
  $("body").addClass("waiting");

  for (var file in myPath["files"]) {
    uiFiles[path.parse(file).base] = 1;
  }
  for (var folder in myPath["folders"]) {
    uiFolders[path.parse(folder).name] = 1;
  }
  for (var i = 0; i < ev.dataTransfer.files.length; i++) {
    var ele = ev.dataTransfer.files[i].path;
    if (path.basename(ele).indexOf(".") === -1) {
      detectIrregularFolders(path.basename(ele), ele);
    }
  }
  var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contain any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
  if (irregularFolderArray.length > 0) {
    Swal.fire({
      title:
        "The following folders contain non-allowed characters in their names. How should we handle them?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        irregularFolderArray.join("</br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Replace characters with (-)",
      denyButtonText: "Remove characters",
      cancelButtonText: "Cancel",
      footer: footer,
      didOpen: () => {
        $(".swal-popover").popover();
      },
    }).then(async (result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        action = "replace";
        if (irregularFolderArray.length > 0) {
          for (let i = 0; i < irregularFolderArray.length; i++) {
            renamedFolderName = replaceIrregularFolders(
              irregularFolderArray[i]
            );
            replaced.push(renamedFolderName);
          }
        }
      } else if (result.isDenied) {
        action = "remove";
        if (irregularFolderArray.length > 0) {
          for (let i = 0; i < irregularFolderArray.length; i++) {
            renamedFolderName = removeIrregularFolders(irregularFolderArray[i]);
            replaced.push(renamedFolderName);
          }
        }
      } else {
        return;
      }
      dropHelper(
        filesElement,
        targetElement,
        action,
        myPath,
        importedFiles,
        importedFolders,
        nonAllowedDuplicateFiles,
        uiFiles,
        uiFolders
      );
    });
  } else {
    dropHelper(
      filesElement,
      targetElement,
      "",
      myPath,
      importedFiles,
      importedFolders,
      nonAllowedDuplicateFiles,
      uiFiles,
      uiFolders
    );
  }
}

function dropHelper(
  ev1,
  ev2,
  action,
  myPath,
  importedFiles,
  importedFolders,
  nonAllowedDuplicateFiles,
  uiFiles,
  uiFolders
) {
  let importToast = new Notyf({
    position: { x: "right", y: "bottom" },
    ripple: true,
    dismissible: true,
    ripple: false,
    types: [
      {
        type: "success",
        background: "#13716D",
        icon: {
          className: "fas fa-check-circle",
          tagName: "i",
          color: "white",
        },
        duration: 2500,
      },
    ],
  });
  var folderPath = [];
  var duplicateFolders = [];
  for (var i = 0; i < ev1.length; i++) {
    /// Get all the file information
    var itemPath = ev1[i].path;
    var itemName = path.parse(itemPath).base;
    var duplicate = false;
    var statsObj = fs.statSync(itemPath);
    // check for duplicate or files with the same name
    for (var j = 0; j < ev2.children.length; j++) {
      if (itemName === ev2.children[j].innerText) {
        duplicate = true;
        break;
      }
    }
    /// check for File duplicate
    if (statsObj.isFile()) {
      var nonAllowedDuplicate = false;
      var originalFileName = path.parse(itemPath).base;
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
        Swal.fire({
          icon: "error",
          html: "<p>This interface is only for including files in the SPARC folders. If you are trying to add SPARC metadata file(s), you can do so in the next Step.</p>",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
        break;
      } else {
        if (
          JSON.stringify(myPath["files"]) === "{}" &&
          JSON.stringify(importedFiles) === "{}"
        ) {
          importedFiles[path.parse(itemPath).base] = {
            path: itemPath,
            basename: path.parse(itemPath).base,
          };
        } else {
          //check if fileName is in to-be-imported object keys
          if (importedFiles.hasOwnProperty(originalFileName)) {
            nonAllowedDuplicate = true;
            nonAllowedDuplicateFiles.push(itemPath);
            continue;
          } else {
            //check if filename is in already-imported object keys
            if (myPath["files"].hasOwnProperty(originalFileName)) {
              nonAllowedDuplicate = true;
              nonAllowedDuplicateFiles.push(itemPath);
              continue;
            } else {
              if (Object.keys(myPath["files"]).length === 0) {
                importedFiles[originalFileName] = {
                  path: itemPath,
                  basename: originalFileName,
                };
              }
              for (let objectKey in myPath["files"]) {
                if (objectKey !== undefined) {
                  nonAllowedDuplicate = false;
                  //just checking if paths are the same
                  if (itemPath === myPath["files"][objectKey]["path"]) {
                    nonAllowedDuplicateFiles.push(itemPath);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //in neither so write
                    importedFiles[originalFileName] = {
                      path: itemPath,
                      basename: originalFileName,
                    };
                  }
                }
              }
            }
          }
        }
      }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
        Swal.fire({
          icon: "error",
          text: "Only SPARC folders can be added at this level. To add a new SPARC folder, please go back to Step 2.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        var j = 1;
        var originalFolderName = itemName;
        var renamedFolderName = originalFolderName;

        if (irregularFolderArray.includes(itemPath)) {
          if (action !== "ignore" && action !== "") {
            if (action === "remove") {
              renamedFolderName = removeIrregularFolders(itemName);
            } else if (action === "replace") {
              renamedFolderName = replaceIrregularFolders(itemName);
            }
            importedFolders[renamedFolderName] = {
              path: itemPath,
              "original-basename": originalFolderName,
            };
          }
        } else {
          if (myPath["folders"].hasOwnProperty(originalFolderName) === true) {
            //folder is already imported
            duplicateFolders.push(itemName);
            folderPath.push(itemPath);
            continue;
          } else {
            if (importedFolders.hasOwnProperty(originalFolderName) === true) {
              //folder is already in to-be-imported list
              duplicateFolders.push(itemName);
              folderPath.push(itemPath);
              continue;
            } else {
              //folder is in neither so write
              importedFolders[originalFolderName] = {
                path: itemPath,
                "original-basename": originalFolderName,
              };
            }
          }
        }
      }
    }
  }
  var listElements = showItemsAsListBootbox(duplicateFolders);
  var list = JSON.stringify(folderPath).replace(/"/g, "");
  if (duplicateFolders.length > 0) {
    Swal.fire({
      title: "Duplicate folder(s) detected",
      icon: "warning",
      showConfirmButton: false,
      allowOutsideClick: false,
      showCloseButton: true,
      customClass: "wide-swal-auto",
      backdrop: "rgba(0, 0, 0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate_animated animate_zoomout animate__faster",
      },
      html:
        `
      <div class="caption">
        <p>Folders with the following names are already in the current folder: <p><ul style="text-align: start;">${listElements}</ul></p></p>
      </div>
      <div class="swal-button-container">
        <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
        list +
        `')">Skip Folders</button>
        <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}')">Replace Existing Folders</button>
        <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}')">Import Duplicates</button>
        <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel')">Cancel</button>
        </div>`,
    });
  }
  let baseName = [];
  if (nonAllowedDuplicateFiles.length > 0) {
    for (let element in nonAllowedDuplicateFiles) {
      let lastSlash = nonAllowedDuplicateFiles[element].lastIndexOf("\\") + 1;
      if (lastSlash === 0) {
        lastSlash = nonAllowedDuplicateFiles[element].lastIndexOf("/") + 1;
      }
      baseName.push(
        nonAllowedDuplicateFiles[element].substring(
          lastSlash,
          nonAllowedDuplicateFiles[element].length
        )
      );
    }
    var listElements = showItemsAsListBootbox(baseName);
    var list = JSON.stringify(nonAllowedDuplicateFiles).replace(/"/g, "");
    Swal.fire({
      title: "Duplicate file(s) detected",
      icon: "warning",
      showConfirmButton: false,
      allowOutsideClick: false,
      showCloseButton: true,
      customClass: "wide-swal-auto",
      backdrop: "rgba(0, 0, 0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate_animated animate_zoomout animate__faster",
      },
      html:
        `
      <div class="caption">
        <p>Files with the following names are already in the current folder: <p><ul style="text-align: start;">${listElements}</ul></p></p>
      </div>
      <div class="swal-button-container">
        <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
        list +
        `')">Skip Files</button>
        <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}')">Replace Existing Files</button>
        <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}')">Import Duplicates</button>
        <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel')">Cancel</button>
        </div>`,
    });
  }
  // // now append to UI files and folders
  if (Object.keys(importedFiles).length > 0) {
    for (var element in importedFiles) {
      myPath["files"][importedFiles[element]["basename"]] = {
        path: importedFiles[element]["path"],
        type: "local",
        description: "",
        "additional-metadata": "",
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(
        myPath["files"][importedFiles[element]["basename"]]["path"]
      ).base;
      if (element !== originalName) {
        myPath["files"][importedFiles[element]["basename"]]["action"].push(
          "renamed"
        );
      }
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)"  style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        importedFiles[element]["basename"] +
        "</div></div>";
      $(appendString).appendTo(ev2);
    }
    listItems(myPath, "#items", 500, (reset = true));
    if (Object.keys(importedFiles).length > 1) {
      importToast.open({
        type: "success",
        message: "Successfully Imported Files",
      });
    } else {
      importToast.open({
        type: "success",
        message: "Successfully Imported File",
      });
    }
    // getInFolder(
    //   ".single-item",
    //   "#items",
    //   organizeDSglobalPath,
    //   datasetStructureJSONObj
    // );
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  }
  if (Object.keys(importedFolders).length > 0) {
    for (var element in importedFolders) {
      myPath["folders"][element] = {
        type: "local",
        path: importedFolders[element]["path"],
        folders: {},
        files: {},
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(myPath["folders"][element]["path"]).name;
      let placeholderString =
        '<div id="placeholder_element" class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="fas fa-file-import"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">Loading ' +
        element +
        "... </div></div>";
      $(placeholderString).appendTo(ev2);
      // await listItems(myPath, "#items");
      //listItems(myPath, "#items");
      if (element !== originalName) {
        myPath["folders"][element]["action"].push("renamed");
      }
      populateJSONObjFolder(
        action,
        myPath["folders"][element],
        importedFolders[element]["path"]
      );
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        element +
        "</div></div>";
      $("#placeholder_element").remove();
      $(appendString).appendTo(ev2);
    }
    listItems(myPath, "#items", 500, (reset = true));
    getInFolder(
      ".single-item",
      "#items",
      organizeDSglobalPath,
      datasetStructureJSONObj
    );
    if (Object.keys(importedFolders).length > 1) {
      importToast.open({
        type: "success",
        message: "Successfully Imported Folders",
      });
    } else {
      importToast.open({
        type: "success",
        message: "Successfully Imported Folder",
      });
    }
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  }
  $("body").removeClass("waiting");
}

var irregularFolderArray = [];
function detectIrregularFolders(folderName, pathEle) {
  if (checkIrregularNameBoolean(folderName)) {
    irregularFolderArray.push(pathEle);
  }
  if (fs.lstatSync(pathEle).isDirectory()) {
    fs.readdirSync(pathEle).forEach(function (folder) {
      var stat = fs.statSync(path.join(pathEle, folder));
      if (stat && stat.isDirectory()) {
        detectIrregularFolders(folder, path.join(pathEle, folder));
      }
      return irregularFolderArray;
    });
  }
}

function checkIrregularNameBoolean(folderName) {
  for (var char of nonAllowedCharacters) {
    if (folderName.includes(char)) {
      return true;
    }
  }
  return false;
}

/* The following functions aim at ignore folders with irregular characters, or replace the characters with (-),
   or remove the characters from the names.
   All return an object in the form {"type": empty for now, will be confirmed once users click an option at the popup,
                                     "paths": array of all the paths with special characters detected}
*/

function replaceIrregularFolders(pathElement) {
  var str = path.basename(pathElement);
  for (var char of nonAllowedCharacters) {
    if (str.includes(char)) {
      str = str.replace(char, "-");
    }
  }
  return str;
}

function removeIrregularFolders(pathElement) {
  var str = path.basename(pathElement);
  for (var char of nonAllowedCharacters) {
    if (str.includes(char)) {
      str = str.replace(char, "");
    }
  }
  return str;
}

// SAVE FILE ORG
ipcRenderer.on("save-file-organization-dialog", (event) => {
  const options = {
    title: "Save File Organization",
    filters: [{ name: "JSON", extensions: ["json"] }],
  };
  dialog.showSaveDialog(null, options, (filename) => {
    event.sender.send("selected-saveorganizationfile", filename);
  });
});

//////////////////////////////////////////////////////////////////////////////
/////////////////// CONTEXT MENU OPTIONS FOR FOLDERS AND FILES ///////////////
//////////////////////////////////////////////////////////////////////////////

//// helper functions for hiding/showing context menus
function showmenu(ev, category, deleted = false) {
  //stop the real right click menu
  ev.preventDefault();
  var mouseX;
  let element = "";
  if (ev.pageX <= 200) {
    mouseX = ev.pageX + 10;
  } else {
    let active_class = $("#sidebarCollapse").attr("class");
    if (active_class.search("active") == -1) {
      mouseX = ev.pageX - 210;
    } else {
      mouseX = ev.pageX - 50;
    }
  }

  var mouseY = ev.pageY - 10;

  if (category === "folder") {
    if (deleted) {
      $(menuFolder)
        .children("#reg-folder-delete")
        .html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuFolder).children("#reg-folder-rename").hide();
      $(menuFolder).children("#folder-move").hide();
      $(menuFolder).children("#folder-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuFolder)
          .children("#reg-folder-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuFolder)
          .children("#folder-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(menuFolder).children("#reg-folder-rename").hide();
        $(menuFolder).children("#folder-description").hide();
      } else {
        $(menuFolder)
          .children("#reg-folder-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuFolder)
          .children("#folder-move")
          .html('<i class="fas fa-external-link-alt"></i> Move');
        $(menuFolder).children("#folder-move").show();
        $(menuFolder).children("#reg-folder-rename").show();
        $(menuFolder).children("#folder-description").show();
      }
    }
    menuFolder.style.display = "block";
    $(".menu.reg-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  } else if (category === "high-level-folder") {
    if (deleted) {
      $(menuHighLevelFolders)
        .children("#high-folder-delete")
        .html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuHighLevelFolders).children("#high-folder-rename").hide();
      $(menuHighLevelFolders).children("#folder-move").hide();
      $(menuHighLevelFolders).children("#tooltip-folders").show();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuHighLevelFolders)
          .children("#high-folder-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuHighLevelFolders).children("#high-folder-delete").show();
        $(menuHighLevelFolders).children("#high-folder-rename").hide();
        $(menuHighLevelFolders).children("#folder-move").hide();
        $(menuHighLevelFolders).children("#tooltip-folders").show();
      } else {
        $(menuHighLevelFolders)
          .children("#high-folder-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuHighLevelFolders).children("#high-folder-delete").show();
        $(menuHighLevelFolders).children("#high-folder-rename").hide();
        $(menuHighLevelFolders).children("#folder-move").hide();
        $(menuHighLevelFolders).children("#tooltip-folders").show();
      }
    }
    menuHighLevelFolders.style.display = "block";
    $(".menu.high-level-folder")
      .css({ top: mouseY, left: mouseX })
      .fadeIn("slow");
  } else {
    if (deleted) {
      $(menuFile)
        .children("#file-delete")
        .html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuFile).children("#file-rename").hide();
      $(menuFile).children("#file-move").hide();
      $(menuFile).children("#file-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuFile)
          .children("#file-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuFile)
          .children("#file-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(menuFile).children("#file-rename").hide();
        $(menuFile).children("#file-description").hide();
      } else {
        $(menuFile)
          .children("#file-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuFile)
          .children("#file-move")
          .html('<i class="fas fa-external-link-alt"></i> Move');
        $(menuFile).children("#file-rename").show();
        $(menuFile).children("#file-move").show();
        $(menuFile).children("#file-description").show();
      }
    }
    menuFile.style.display = "block";
    $(".menu.file").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  }
}

/// options for regular sub-folders
function folderContextMenu(event) {
  $(".menu.reg-folder li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "reg-folder-rename") {
        var itemDivElements = document.getElementById("items").children;
        renameFolder(
          event,
          organizeDSglobalPath,
          itemDivElements,
          datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "reg-folder-delete") {
        delFolder(
          event,
          organizeDSglobalPath,
          "#items",
          ".single-item",
          datasetStructureJSONObj
        );
      } else if ($(this).attr("id") === "folder-move") {
        moveItems(event, "folders");
      }
      // Hide it AFTER the action was triggered
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
      hideFullName();
    });

  /// options for high-level folders
  $(".menu.high-level-folder li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "high-folder-rename") {
        var itemDivElements = document.getElementById("items").children;
        renameFolder(
          event,
          organizeDSglobalPath,
          itemDivElements,
          datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "high-folder-delete") {
        delFolder(
          event,
          organizeDSglobalPath,
          "#items",
          ".single-item",
          datasetStructureJSONObj
        );
      } else if ($(this).attr("id") === "tooltip-folders") {
        showTooltips(event);
      }
      // Hide it AFTER the action was triggered
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
      hideFullName();
    });
  /// hide both menus after an option is clicked
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  hideFullName();
}

//////// options for files
function fileContextMenu(event) {
  if ($(".div-display-details.file").hasClass("show")) {
    $(".div-display-details.file").removeClass("show");
  }
  $(".menu.file li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "file-rename") {
        var itemDivElements = document.getElementById("items").children;
        renameFolder(
          event,
          organizeDSglobalPath,
          itemDivElements,
          datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "file-delete") {
        delFolder(
          event,
          organizeDSglobalPath,
          "#items",
          ".single-item",
          datasetStructureJSONObj
        );
      } else if ($(this).attr("id") === "file-move") {
        moveItems(event, "files");
      } else if ($(this).attr("id") === "file-description") {
        manageDesc(event);
      }
      // Hide it AFTER the action was triggered
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
    });
  hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
}

$(document).ready(function () {
  tippy("[data-tippy-content]", {
    allowHTML: true,
    interactive: true,
    placement: "top",
    theme: "light",
  });
});

// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {
  // Avoid the real one
  event.preventDefault();

  // Right click behaviour for multiple files (Linux os behaviour)
  // ** if right click with ctrl -> include file in selection
  // ** if right click without ctrl -> remove selection from other files
  if (!$(event.target).hasClass("selected-item")) {
    if (event.ctrlKey) {
      $(event.target).addClass("selected-item");
      $(event.target).parent().addClass("selected-item");
    } else {
      $(".selected-item").removeClass("selected-item");
      dragselect_area.clearSelection();
    }
  }

  /// check for high level folders
  var highLevelFolderBool = false;
  var folderName = event.target.parentElement.innerText;
  if (folderName.lastIndexOf("-") != -1) {
    folderName = folderName.substring(0, folderName.lastIndexOf("-"));
  }
  if (highLevelFolders.includes(folderName)) {
    highLevelFolderBool = true;
  }
  // Show the rightcontextmenu for each clicked
  // category (high-level folders, regular sub-folders, and files)
  // The third parameter in show menu is used to show the restore option
  if (event.target.classList[0] === "myFol") {
    if (highLevelFolderBool) {
      if (event.target.classList.contains("deleted_folder")) {
        showmenu(event, "high-level-folder", true);
      } else {
        showmenu(event, "high-level-folder");
      }
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
    } else {
      if (event.target.classList.contains("deleted_folder")) {
        showmenu(event, "folder", true);
      } else {
        showmenu(event, "folder");
      }
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
    }
  } else if (event.target.classList[0] === "myFile") {
    if (event.target.classList.contains("deleted_file")) {
      showmenu(event, "file", true);
    } else {
      showmenu(event, "file");
    }
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
    // otherwise, do not show any menu
  } else {
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
    // hideFullPath()
    hideFullName();
  }
});

const select_items_ctrl = (items, event, isDragging) => {
  if (event["ctrlKey"]) {
  } else {
    $(".selected-item").removeClass("selected-item");
    dragselect_area.clearSelection();
  }
};

const select_items = (items, event, isDragging) => {
  let selected_class = "";

  items.forEach((event_item) => {
    let target_element = null;
    let parent_element = null;

    if (event_item.classList[0] === "single-item") {
      parent_element = event_item;
      target_element = $(parent_element).children()[0];
      if (
        $(target_element).hasClass("myFol") ||
        $(target_element).hasClass("myFile")
      ) {
        selected_class = "selected-item";
        drag_event_fired = true;
      }
    }

    $(".selected-item").removeClass("selected-item");
    $(".ds-selected").addClass(selected_class);
    $(".ds-selected").each((index, element) => {
      target_element = $(element).children()[0];
      $(target_element).addClass(selected_class);
    });
  });
};

$(document).bind("click", (event) => {
  // If there is weird right click menu behaviour, check the hideMenu block
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
  // hideFullPath()
  hideFullName();

  // Handle clearing selection when clicked outside.
  // Currently only handles clicks inside the folder holder area
  if (event.target.classList[0] === "div-organize-items") {
    if (drag_event_fired) {
      drag_event_fired = false;
    } else {
      $(".selected-item").removeClass("selected-item");
    }
  }
});

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  /// sort the files in objects
  if (object.hasOwnProperty("files")) {
    Object.keys(object["files"])
      .sort()
      .forEach(function (key) {
        orderedFiles[key] = object["files"][key];
      });
  }
  if (object.hasOwnProperty("folders")) {
    Object.keys(object["folders"])
      .sort()
      .forEach(function (key) {
        orderedFolders[key] = object["folders"][key];
      });
  }
  const orderedObject = {
    folders: orderedFolders,
    files: orderedFiles,
    type: "",
  };
  return orderedObject;
}

async function listItems(jsonObj, uiItem, amount_req, reset) {
  //allow amount to choose how many elements to create
  //break elements into sets of 100
  var appendString = "";
  var sortedObj = sortObjByKeys(jsonObj);
  let file_elements = [],
    folder_elements = [];
  let count = 0;
  if (Object.keys(sortedObj["folders"]).length > 0) {
    for (var item in sortedObj["folders"]) {
      count += 1;
      var emptyFolder = "";
      if (!highLevelFolders.includes(item)) {
        if (
          JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
          JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
        ) {
          emptyFolder = " empty";
        }
      }

      cloud_item = "";
      deleted_folder = false;

      if ("action" in sortedObj["folders"][item]) {
        if (
          sortedObj["folders"][item]["action"].includes("deleted") ||
          sortedObj["folders"][item]["action"].includes("recursive_deleted")
        ) {
          emptyFolder += " deleted_folder";
          deleted_folder = true;
          if (
            sortedObj["folders"][item]["action"].includes("recursive_deleted")
          ) {
            emptyFolder += " recursive_deleted_file";
          }
        }
      }

      if (sortedObj["folders"][item]["type"] == "bf") {
        cloud_item = " pennsieve_folder";
        if (deleted_folder) {
          cloud_item = " pennsieve_folder_deleted";
        }
      }

      if (
        sortedObj["folders"][item]["type"] == "local" &&
        sortedObj["folders"][item]["action"].includes("existing")
      ) {
        cloud_item = " local_folder";
        if (deleted_folder) {
          cloud_item = " local_folder_deleted";
        }
      }

      if (sortedObj["folders"][item]["action"].includes("updated")) {
        cloud_item = " update-file";
        let elem_creation =
          '<div class="single-item updated-file" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol' +
          emptyFolder +
          '"></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        // folder_elements.push(elem_creation);
        appendString = appendString + elem_creation;
        if (count === 100) {
          folder_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      } else {
        let element_creation =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol' +
          emptyFolder +
          '"></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        // folder_elements.push(element_creation);
        appendString = appendString + element_creation;
        if (count === 100) {
          folder_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      }
    }
    if (count < 100) {
      if (!folder_elements.includes(appendString) && appendString != "") {
        folder_elements.push(appendString);
        count = 0;
      }
    }
  }
  //reset count and string for file elements
  count = 0;
  appendString = "";
  if (Object.keys(sortedObj["files"]).length > 0) {
    for (var item in sortedObj["files"]) {
      count += 1;
      // not the auto-generated manifest
      if (sortedObj["files"][item].length !== 1) {
        if ("path" in sortedObj["files"][item]) {
          var extension = path
            .extname(sortedObj["files"][item]["path"])
            .slice(1);
        } else {
          var extension = "other";
        }
        if (sortedObj["files"][item]["type"] == "bf") {
          if (sortedObj["files"][item]["action"].includes("deleted")) {
            original_file_name = item.substring(0, item.lastIndexOf("-"));
            extension = original_file_name.split(".").pop();
          } else {
            extension = item.split(".").pop();
          }
        }
        if (
          ![
            "docx",
            "doc",
            "pdf",
            "txt",
            "jpg",
            "JPG",
            "jpeg",
            "JPEG",
            "xlsx",
            "xls",
            "csv",
            "png",
            "PNG",
          ].includes(extension)
        ) {
          extension = "other";
        }
      } else {
        extension = "other";
      }

      cloud_item = "";
      deleted_file = false;

      if ("action" in sortedObj["files"][item]) {
        if (
          sortedObj["files"][item]["action"].includes("deleted") ||
          sortedObj["files"][item]["action"].includes("recursive_deleted")
        ) {
          extension += " deleted_file";
          deleted_file = true;
          if (
            sortedObj["files"][item]["action"].includes("recursive_deleted")
          ) {
            extension += " recursive_deleted_file";
          }
        }
      }

      if (sortedObj["files"][item]["type"] == "bf") {
        cloud_item = " pennsieve_file";
        if (deleted_file) {
          cloud_item = " pennsieve_file_deleted";
        }
        let element_creation =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";
      }

      if (
        sortedObj["files"][item]["type"] == "local" &&
        sortedObj["files"][item]["action"].includes("existing")
      ) {
        cloud_item = " local_file";
        if (deleted_file) {
          cloud_item = " local_file_deleted";
        }
      }
      if (
        sortedObj["files"][item]["type"] == "local" &&
        sortedObj["files"][item]["action"].includes("updated")
      ) {
        cloud_item = " update-file";
        if (deleted_file) {
          cloud_item = "pennsieve_file_deleted";
        }
        let elem_creation =
          '<div class="single-item updated-file" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        appendString = appendString + elem_creation;
        if (count === 100) {
          file_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      } else {
        let element_creation =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        appendString = appendString + element_creation;
        if (count === 100) {
          file_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      }
    }
    if (count < 100) {
      if (!file_elements.includes(appendString) && appendString != "") {
        file_elements.push(appendString);
        count = 0;
      }
      // continue;
    }
  }
  if (folder_elements[0] === "") {
    folder_elements.splice(0, 1);
  }
  if (file_elements[0] === "") {
    file_elements.splice(0, 1);
  }
  let items = [folder_elements, file_elements];
  if (amount_req != undefined) {
    //add items using a different function
    //want the initial files to be imported
    let itemDisplay = new Promise(async (resolved) => {
      if (reset != undefined) {
        await add_items_to_view(items, amount_req, reset);
        resolved();
      } else {
        await add_items_to_view(items, amount_req);
        resolved();
      }
    });
  } else {
    //load everything in place
    let itemDisplay = new Promise(async (resolved) => {
      // $(uiItem).empty();
      await add_items_to_view(items, 500);
      resolved();
    });
  }

  dragselect_area.stop();

  dragselect_area = new DragSelect({
    selectables: document.querySelectorAll(".single-item"),
    draggability: false,
    area: document.getElementById("items"),
  });

  dragselect_area.subscribe("callback", ({ items, event, isDragging }) => {
    select_items(items, event, isDragging);
  });

  dragselect_area.subscribe("dragstart", ({ items, event, isDragging }) => {
    select_items_ctrl(items, event, isDragging);
  });
  drag_event_fired = false;
}

async function getInFolder(singleUIItem, uiItem, currentLocation, globalObj) {
  $(singleUIItem).dblclick(async function () {
    if ($(this).children("h1").hasClass("myFol")) {
      start = 0;
      listed_count = 0;
      amount = 0;
      var folderName = this.innerText;
      currentLocation.value = currentLocation.value + folderName + "/";

      var currentPath = currentLocation.value;
      var jsonPathArray = currentPath.split("/");
      var filtered = jsonPathArray.slice(1).filter(function (el) {
        return el.trim() != "";
      });
      var myPath = getRecursivePath(filtered, globalObj);
      if (myPath.length === 2) {
        filtered = myPath[1];
        document.getElementById("input-global-path").value =
          "My_dataset_folder/" + filtered.join("/") + "/";
      }
      $("#items").empty();
      already_created_elem = [];
      let items = loadFileFolder(myPath);
      //we have some items to display
      listItems(myPath, "#items", 500, (reset = true));
      organizeLandingUIEffect();
      // reconstruct folders and files (child elements after emptying the Div)
      // getInFolder(singleUIItem, uiItem, currentLocation, globalObj);
    }
  });
}

function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1);
  return newString;
}

var fileNameForEdit;
///// Option to manage description for files
function manageDesc(ev) {
  var fileName = ev.parentElement.innerText;
  /// get current location of files in JSON object
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  //// load existing metadata/description
  loadDetailsContextMenu(
    fileName,
    myPath,
    "textarea-file-description",
    "textarea-file-metadata",
    "para-local-path-file"
  );
  $("#button-confirm-display-details-file").html("Confirm");
  showDetailsFile();
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  fileNameForEdit = fileName;
}

function updateFileDetails(ev) {
  var fileName = fileNameForEdit;
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  triggerManageDetailsPrompts(
    ev,
    fileName,
    myPath,
    "textarea-file-description",
    "textarea-file-metadata"
  );
  /// list Items again with new updated JSON structure
  listItems(myPath, "#items");
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );
  // find checkboxes here and uncheck them
  for (var ele of $($(ev).siblings().find("input:checkbox"))) {
    document.getElementById(ele.id).checked = false;
  }
  // close the display
  showDetailsFile();
}

function addDetailsForFile(ev) {
  var checked = false;
  for (var ele of $($(ev).siblings()).find("input:checkbox")) {
    if ($(ele).prop("checked")) {
      checked = true;
      break;
    }
  }
  /// if at least 1 checkbox is checked, then confirm with users
  if (checked) {
    Swal.fire({
      icon: "warning",
      title: "Adding additional metadata for files",
      text: "Metadata will be modified for all files in the folder. Would you like to continue?",
      showCancelButton: true,
      focusCancel: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate_fastest",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateFileDetails(ev);
        $("#button-confirm-display-details-file").html("Added");
      }
    });
  } else {
    updateFileDetails(ev);
    $("#button-confirm-display-details-file").html("Added");
  }
}

$("#inputNewNameDataset").on("click", () => {
  $("#nextBtn").prop("disabled", true);
  $("#inputNewNameDataset").keyup();
});

$("#inputNewNameDataset").keyup(function () {
  $("#nextBtn").prop("disabled", true);

  var newName = $("#inputNewNameDataset").val().trim();

  $("#Question-generate-dataset-generate-div").removeClass("show");
  $("#Question-generate-dataset-generate-div").removeClass("test2");
  $("#Question-generate-dataset-generate-div").removeClass("prev");
  $("#Question-generate-dataset-generate-div").hide();
  $("#Question-generate-dataset-generate-div").children().hide();
  $("#para-continue-name-dataset-generate").hide();
  $("#para-continue-name-dataset-generate").text("");

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      document.getElementById("div-confirm-inputNewNameDataset").style.display =
        "none";
      $("#btn-confirm-new-dataset-name").hide();
      document.getElementById("para-new-name-dataset-message").innerHTML =
        "Error: A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>.";
      // $("#nextBtn").prop("disabled", true);
      $("#Question-generate-dataset-generate-div-old").removeClass("show");
      $("#div-confirm-inputNewNameDataset").css("display", "none");
      $("#btn-confirm-new-dataset-name").hide();
    } else {
      $("#div-confirm-inputNewNameDataset").css("display", "flex");
      $("#btn-confirm-new-dataset-name").show();
      $("#Question-generate-dataset-generate-div").show();
      $("#Question-generate-dataset-generate-div").children().show();

      $("#Question-generate-dataset-generate-div-old").addClass("show");
      document.getElementById("para-new-name-dataset-message").innerHTML = "";
    }
  } else {
    $("#div-confirm-inputNewNameDataset").css("display", "none");
    $("#btn-confirm-new-dataset-name").hide();
  }
});

//// Select to choose a local dataset (getting started)
document
  .getElementById("input-destination-getting-started-locally")
  .addEventListener("click", function () {
    $("#Question-getting-started-locally-destination")
      .nextAll()
      .removeClass("show");
    $("#Question-getting-started-locally-destination")
      .nextAll()
      .removeClass("test2");
    $("#Question-getting-started-locally-destination")
      .nextAll()
      .removeClass("prev");
    document.getElementById(
      "input-destination-getting-started-locally"
    ).placeholder = "Browse here";
    $("#para-continue-location-dataset-getting-started").text("");
    document.getElementById("nextBtn").disabled = true;
    ipcRenderer.send("open-file-dialog-local-destination-curate");
  });

ipcRenderer.on(
  "selected-local-destination-datasetCurate",
  async (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        sodaJSONObj["starting-point"]["local-path"] = "";
        document.getElementById(
          "input-destination-getting-started-locally"
        ).placeholder = filepath[0];
        if (
          sodaJSONObj["starting-point"]["type"] === "local" &&
          sodaJSONObj["starting-point"]["local-path"] == ""
        ) {
          valid_dataset = verify_sparc_folder(
            document.getElementById("input-destination-getting-started-locally")
              .placeholder,
            "local"
          );
          if (valid_dataset == true) {
            var action = "";
            irregularFolderArray = [];
            var replaced = [];
            let finished = 0;
            detectIrregularFolders(path.basename(filepath[0]), filepath[0]);
            var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
            if (irregularFolderArray.length > 0) {
              Swal.fire({
                title:
                  "The following folders contain non-allowed characters in their names. How should we handle them?",
                html:
                  "<div style='max-height:300px; overflow-y:auto'>" +
                  irregularFolderArray.join("</br>") +
                  "</div>",
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: "Replace characters with (-)",
                denyButtonText: "Remove characters",
                cancelButtonText: "Cancel",
                didOpen: () => {
                  $(".swal-popover").popover();
                },
                footer: footer,
              }).then(async (result) => {
                // var replaced = [];
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                  action = "replace";
                  if (irregularFolderArray.length > 0) {
                    for (let i = 0; i < irregularFolderArray.length; i++) {
                      renamedFolderName = replaceIrregularFolders(
                        irregularFolderArray[i]
                      );
                      replaced.push(renamedFolderName);
                    }
                  }
                } else if (result.isDenied) {
                  action = "remove";
                  if (irregularFolderArray.length > 0) {
                    for (let i = 0; i < irregularFolderArray.length; i++) {
                      renamedFolderName = removeIrregularFolders(
                        irregularFolderArray[i]
                      );
                      replaced.push(renamedFolderName);
                    }
                  }
                } else {
                  document.getElementById(
                    "input-destination-getting-started-locally"
                  ).placeholder = "Browse here";
                  sodaJSONObj["starting-point"]["local-path"] = "";
                  $("#para-continue-location-dataset-getting-started").text("");
                  return;
                }

                var numb = document.querySelector(".number");
                numb.innerText = "0%";
                progressBar_rightSide = document.getElementById(
                  "left-side_less_than_50"
                );
                progressBar_leftSide = document.getElementById(
                  "right-side_greater_than_50"
                );
                progressBar_rightSide.style.transform = `rotate(0deg)`;
                progressBar_leftSide.style.transform = `rotate(0deg)`;
                document.getElementById("loading_local_dataset").style.display =
                  "block";
                sodaJSONObj["starting-point"]["local-path"] = filepath[0];

                let root_folder_path = $(
                  "#input-destination-getting-started-locally"
                ).attr("placeholder");

                let local_progress = setInterval(progressReport, 500);
                async function progressReport() {
                  try {
                    // TODO: Test error handling
                    let monitorProgressResponse = await client.get(
                      `/organize_datasets/datasets/import/progress`
                    );

                    let { data } = monitorProgressResponse;
                    percentage_amount = data["progress_percentage"].toFixed(2);
                    finished = data["create_soda_json_completed"];

                    progressBar_rightSide = document.getElementById(
                      "left-side_less_than_50"
                    );
                    progressBar_leftSide = document.getElementById(
                      "right-side_greater_than_50"
                    );

                    numb.innerText = percentage_amount + "%";
                    if (percentage_amount <= 50) {
                      progressBar_rightSide.style.transform = `rotate(${
                        percentage_amount * 0.01 * 360
                      }deg)`;
                    } else {
                      progressBar_rightSide.style.transition = "";
                      progressBar_rightSide.classList.add("notransition");
                      progressBar_rightSide.style.transform = `rotate(180deg)`;
                      progressBar_leftSide.style.transform = `rotate(${
                        percentage_amount * 0.01 * 180
                      }deg)`;
                    }

                    if (finished === 1) {
                      progressBar_leftSide.style.transform = `rotate(180deg)`;
                      numb.innerText = "100%";
                      clearInterval(local_progress);
                      progressBar_rightSide.classList.remove("notransition");
                      populate_existing_folders(datasetStructureJSONObj);
                      populate_existing_metadata(sodaJSONObj);
                      $("#para-continue-location-dataset-getting-started").text(
                        "Please continue below."
                      );
                      $("#nextBtn").prop("disabled", false);
                      // log the success to analytics
                      logMetadataForAnalytics(
                        "Success",
                        PrepareDatasetsAnalyticsPrefix.CURATE,
                        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                        Actions.EXISTING,
                        Destinations.LOCAL
                      );
                      setTimeout(() => {
                        document.getElementById(
                          "loading_local_dataset"
                        ).style.display = "none";
                      }, 1000);
                    }
                  } catch (error) {
                    clientError(error);
                  }
                }
                //create setInterval variable that will keep track of the iterated items
              });
            } else {
              document.getElementById("loading_local_dataset").style.display =
                "block";
              progressBar_rightSide = document.getElementById(
                "left-side_less_than_50"
              );
              progressBar_leftSide = document.getElementById(
                "right-side_greater_than_50"
              );
              progressBar_leftSide.style.transform = `rotate(0deg)`;
              progressBar_rightSide.style.transform = `rotate(0deg)`;
              let numb = document.querySelector(".number");
              numb.innerText = "0%";

              action = "";
              sodaJSONObj["starting-point"]["local-path"] = filepath[0];
              let root_folder_path = $(
                "#input-destination-getting-started-locally"
              ).attr("placeholder");

              let percentage_amount = 0;
              let local_progress = setInterval(progressReport, 500);
              async function progressReport() {
                try {
                  // TODO: Test error handling
                  let monitorProgressResponse = await client.get(
                    `/organize_datasets/datasets/import/progress`
                  );

                  let { data } = monitorProgressResponse;
                  percentage_amount = data["progress_percentage"].toFixed(2);
                  finished = data["create_soda_json_completed"];
                  progressBar_rightSide = document.getElementById(
                    "left-side_less_than_50"
                  );
                  progressBar_leftSide = document.getElementById(
                    "right-side_greater_than_50"
                  );

                  numb.innerText = percentage_amount + "%";
                  if (percentage_amount <= 50) {
                    progressBar_rightSide.style.transform = `rotate(${
                      percentage_amount * 0.01 * 360
                    }deg)`;
                  } else {
                    progressBar_rightSide.style.transition = "";
                    progressBar_rightSide.classList.add("notransition");
                    progressBar_rightSide.style.transform = `rotate(180deg)`;
                    progressBar_leftSide.style.transform = `rotate(${
                      percentage_amount * 0.01 * 180
                    }deg)`;
                  }
                  if (finished === 1) {
                    progressBar_leftSide.style.transform = `rotate(180deg)`;
                    numb.innerText = "100%";

                    clearInterval(local_progress);
                    progressBar_rightSide.classList.remove("notransition");
                    populate_existing_folders(datasetStructureJSONObj);
                    populate_existing_metadata(sodaJSONObj);
                    $("#para-continue-location-dataset-getting-started").text(
                      "Please continue below."
                    );
                    $("#nextBtn").prop("disabled", false);
                    // log the success to analytics
                    logMetadataForAnalytics(
                      "Success",
                      PrepareDatasetsAnalyticsPrefix.CURATE,
                      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                      Actions.EXISTING,
                      Destinations.LOCAL
                    );
                    setTimeout(() => {
                      document.getElementById(
                        "loading_local_dataset"
                      ).style.display = "none";
                    }, 1000);
                  }
                } catch (error) {
                  clientError(error);
                  clearInterval(local_progress);
                }
              }
              try {
                console.log("sodaJSONObj", sodaJSONObj);
                console.log("Root folder path:", root_folder_path);
                console.log("Irregular folders: ", irregularFolderArray);
                console.log("Replaced folders: ", replaced);
                // TODO: Test Error handling
                let importLocalDatasetResponse = await client.post(
                  `/organize_datasets/datasets/import`,
                  {
                    sodajsonobject: sodaJSONObj,
                    root_folder_path: root_folder_path,
                    irregular_folders: irregularFolderArray,
                    replaced: replaced,
                  }
                );
                let { data } = importLocalDatasetResponse;
                sodajsonobject = data;
                datasetStructureJSONObj = sodaIsConnected["dataset-structure"];
              } catch (error) {
                clientError(error);
                clearInterval(local_progress);
              }
            }
          } else {
            Swal.fire({
              icon: "warning",
              html: `This folder seem to have non-SPARC folders. Please select a folder that has a valid SPARC dataset structure.
              <br/>
              See the "Data Organization" section of the SPARC documentation for more
              <a a target="_blank" href="https://sparc.science/help/3FXikFXC8shPRd8xZqhjVT#top"> details</a>`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showConfirmButton: false,
              showCancelButton: true,
              focusCancel: true,
              cancelButtonText: "Okay",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then((result) => {
              if (result.isConfirmed) {
              } else {
                document.getElementById(
                  "input-destination-getting-started-locally"
                ).placeholder = "Browse here";
                sodaJSONObj["starting-point"]["local-path"] = "";
                $("#para-continue-location-dataset-getting-started").text("");
              }
            });

            // log the failure to select an appropriate folder to analytics
            logMetadataForAnalytics(
              "Error",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ALL_LEVELS,
              Actions.EXISTING,
              Destinations.LOCAL
            );
          }
        }
      }
    } else {
      document.getElementById("nextBtn").disabled = true;
      $("#para-continue-location-dataset-getting-started").text("");
    }
  }
);

//// Select to choose a local dataset (generate dataset)
document
  .getElementById("input-destination-generate-dataset-locally")
  .addEventListener("click", function () {
    $("#Question-generate-dataset-locally-destination")
      .nextAll()
      .removeClass("show");
    $("#Question-generate-dataset-locally-destination")
      .nextAll()
      .removeClass("test2");
    $("#Question-generate-dataset-locally-destination")
      .nextAll()
      .removeClass("prev");
    document.getElementById("nextBtn").disabled = true;
    ipcRenderer.send("open-file-dialog-local-destination-curate-generate");
  });

ipcRenderer.on(
  "selected-local-destination-datasetCurate-generate",
  (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        $("#div-confirm-destination-locally").css("display", "flex");
        $("#div-confirm-destination-locally button").show();
        document.getElementById(
          "input-destination-generate-dataset-locally"
        ).placeholder = filepath[0];
        document.getElementById("nextBtn").disabled = true;
      } else {
        $("#div-confirm-destination-locally").css("display", "none");
        $("#div-confirm-destination-locally button").hide();
        document.getElementById(
          "input-destination-generate-dataset-locally"
        ).placeholder = "Browse here";
      }
    } else {
      $("#div-confirm-destination-locally").css("display", "none");
      $("#div-confirm-destination-locally button").hide();
      document.getElementById(
        "input-destination-generate-dataset-locally"
      ).placeholder = "Browse here";
    }
  }
);

document
  .getElementById("button-generate-comeback")
  .addEventListener("click", function () {
    setTimeout(function () {
      document.getElementById("generate-dataset-progress-tab").style.display =
        "none";
      document.getElementById("div-vertical-progress-bar").style.display =
        "flex";
      document.getElementById("prevBtn").style.display = "inline";
      document.getElementById("nextBtn").style.display = "inline";
      document.getElementById("start-over-btn").style.display = "inline-block";
      showParentTab(currentTab, 1);
      if (
        sodaJSONObj["starting-point"]["type"] == "new" &&
        "local-path" in sodaJSONObj["starting-point"]
      ) {
        sodaJSONObj["starting-point"]["type"] = "local";
      }
    }, delayAnimation);
  });

// function to hide the sidebar and disable the sidebar expand button
function forceActionSidebar(action) {
  if (action === "show") {
    $("#sidebarCollapse").removeClass("active");
    $("#main-nav").removeClass("active");
  } else {
    $("#sidebarCollapse").addClass("active");
    $("#main-nav").addClass("active");
    // $("#sidebarCollapse").prop("disabled", false);
  }
}

/// MAIN CURATE NEW ///

const progressBarNewCurate = document.getElementById("progress-bar-new-curate");
const divGenerateProgressBar = document.getElementById(
  "div-new-curate-meter-progress"
);
const generateProgressBar = document.getElementById("progress-bar-new-curate");
var progressStatus = document.getElementById(
  "para-new-curate-progress-bar-status"
);

document
  .getElementById("button-generate")
  .addEventListener("click", async function () {
    $($($(this).parent()[0]).parents()[0]).removeClass("tab-active");
    document.getElementById(
      "para-new-curate-progress-bar-error-status"
    ).innerHTML = "";
    document.getElementById("para-please-wait-new-curate").innerHTML = "";
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("start-over-btn").style.display = "none";
    document.getElementById("div-vertical-progress-bar").style.display = "none";
    document.getElementById("div-generate-comeback").style.display = "none";
    document.getElementById("generate-dataset-progress-tab").style.display =
      "flex";
    $("#sidebarCollapse").prop("disabled", false);

    // updateJSON structure after Generate dataset tab
    updateJSONStructureGenerate();
    if (sodaJSONObj["starting-point"]["type"] === "local") {
      sodaJSONObj["starting-point"]["type"] = "new";
    }

    let dataset_name = "";
    let dataset_destination = "";

    if ("bf-dataset-selected" in sodaJSONObj) {
      dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
      dataset_destination = "Pennsieve";
    } else if ("generate-dataset" in sodaJSONObj) {
      if ("destination" in sodaJSONObj["generate-dataset"]) {
        let destination = sodaJSONObj["generate-dataset"]["destination"];
        if (destination == "local") {
          dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
          dataset_destination = "Local";
        }
        if (destination == "bf") {
          dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
          dataset_destination = "Pennsieve";
        }
      }
    }

    generateProgressBar.value = 0;

    progressStatus.innerHTML = "Please wait while we verify a few things...";

    statusText = "Please wait while we verify a few things...";
    if (dataset_destination == "Pennsieve") {
      let supplementary_checks = await run_pre_flight_checks(false);
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }
    }

    // from here you can modify
    document.getElementById("para-please-wait-new-curate").innerHTML =
      "Please wait...";
    document.getElementById(
      "para-new-curate-progress-bar-error-status"
    ).innerHTML = "";
    progressStatus.innerHTML = "";
    document.getElementById("div-new-curate-progress").style.display = "none";

    progressBarNewCurate.value = 0;

    // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
    if ("files" in sodaJSONObj["dataset-structure"]) {
      sodaJSONObj["dataset-structure"]["files"] = {};
    }
    // delete manifest files added for treeview
    for (var highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
      if (
        "manifest.xlsx" in
          sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
        sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
          "manifest.xlsx"
        ]["forTreeview"]
      ) {
        delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol][
          "files"
        ]["manifest.xlsx"];
      }
    }

    let emptyFilesFoldersResponse;
    try {
      // TODO: Test error handling
      emptyFilesFoldersResponse = await client.get(
        `/curate_datasets/empty_files_and_folders`,
        {
          params: {
            soda_json_structure: JSON.stringify(sodaJSONObj),
          },
        }
      );
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);
      document.getElementById(
        "para-new-curate-progress-bar-error-status"
      ).innerHTML = "<span style='color: red;'> Error: " + emessage + "</span>";
      document.getElementById("para-please-wait-new-curate").innerHTML = "";
      $("#sidebarCollapse").prop("disabled", false);
    }

    let { data } = emptyFilesFoldersResponse;

    document.getElementById("para-please-wait-new-curate").innerHTML =
      "Please wait...";
    log.info("Continue with curate");
    let errorMessage = "";
    error_files = data["empty_files"];
    //bring duplicate outside
    error_folders = data["empty_folders"];

    if (error_files.length > 0) {
      var error_message_files =
        backend_to_frontend_warning_message(error_files);
      errorMessage += error_message_files;
    }

    if (error_folders.length > 0) {
      var error_message_folders =
        backend_to_frontend_warning_message(error_folders);
      errorMessage += error_message_folders;
    }

    if (errorMessage) {
      message += "Would you like to continue?";
      message = "<div style='text-align: left'>" + message + "</div>";
      Swal.fire({
        icon: "warning",
        html: message,
        showCancelButton: true,
        cancelButtonText: "No, I want to review my files",
        focusCancel: true,
        confirmButtonText: "Yes, Continue",
        backdrop: "rgba(0,0,0, 0.4)",
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          initiate_generate();
        } else {
          $("#sidebarCollapse").prop("disabled", false);
          document.getElementById("para-please-wait-new-curate").innerHTML =
            "Return to make changes";
          document.getElementById("div-generate-comeback").style.display =
            "flex";
        }
      });
    } else {
      initiate_generate();
    }
  });

const delete_imported_manifest = () => {
  for (let highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in
      sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]
    ) {
      delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
};

function dismissStatus(id) {
  document.getElementById(id).style = "display: none;";
  //document.getElementById("dismiss-status-bar").style = "display: none;";
}

let file_counter = 0;
let folder_counter = 0;
var uploadComplete = new Notyf({
  position: { x: "right", y: "bottom" },
  ripple: true,
  dismissible: true,
  ripple: false,
  types: [
    {
      type: "success",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 4000,
    },
  ],
});

//const remote = require("electron").remote;
//child.setPosition(position[0], position[1]);

// Generates a dataset organized in the Organize Dataset feature locally, or on Pennsieve
async function initiate_generate() {
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  // get the amount of files
  document.getElementById("para-new-curate-progress-bar-status").innerHTML =
    "Preparing files ...";

  progressStatus.innerHTML = "Preparing files ...";

  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "block";
  document.getElementById("div-generate-comeback").style.display = "none";

  let organizeDataset = document.getElementById("organize_dataset_btn");
  let uploadLocally = document.getElementById("upload_local_dataset_btn");
  let organizeDataset_option_buttons = document.getElementById(
    "div-generate-comeback"
  );
  let statusBarContainer = document.getElementById("div-new-curate-progress");
  var statusBarClone = statusBarContainer.cloneNode(true);
  let navContainer = document.getElementById("nav-items");
  let statusText = statusBarClone.children[2];
  let statusMeter = statusBarClone.getElementsByClassName("progresstrack")[0];
  let returnButton = document.createElement("button");

  statusBarClone.id = "status-bar-curate-progress";
  statusText.setAttribute("id", "nav-curate-progress-bar-status");
  statusMeter.setAttribute("id", "nav-progress-bar-new-curate");
  statusMeter.className = "nav-status-bar";
  statusBarClone.appendChild(returnButton);
  uploadLocally.disabled = true;
  organizeDataset.disabled = true;
  organizeDataset.className = "disabled-content-button";
  uploadLocally.className = "disabled-content-button";
  organizeDataset.style = "background-color: #f6f6f6;  border: #fff;";
  uploadLocally.style = "background-color: #f6f6f6; border: #fff;";

  returnButton.type = "button";
  returnButton.id = "returnButton";
  returnButton.innerHTML = "Return to progress";

  returnButton.onclick = function () {
    organizeDataset.disabled = false;
    organizeDataset.className = "content-button is-selected";
    organizeDataset.style = "background-color: #fff";
    organizeDataset.click();
    let button = document.getElementById("button-generate");
    $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("start-over-btn").style.display = "none";
    document.getElementById("div-vertical-progress-bar").style.display = "none";
    document.getElementById("div-generate-comeback").style.display = "none";
    document.getElementById("generate-dataset-progress-tab").style.display =
      "flex";
    organizeDataset.disabled = true;
    organizeDataset.className = "disabled-content-button";
    organizeDataset.style = "background-color: #f6f6f6;  border: #fff;";
  };

  //document.body.appendChild(statusBarClone);
  let sparc_container = document.getElementById("sparc-logo-container");
  sparc_container.style.display = "none";
  navContainer.appendChild(statusBarClone);
  let navbar = document.getElementById("main-nav");
  if (navbar.classList.contains("active")) {
    document.getElementById("sidebarCollapse").click();
  }

  //dissmisButton.addEventListener("click", dismiss('status-bar-curate-progress'));
  if ("manifest-files" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["manifest-files"]) {
      if (sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
        manifest_files_requested = true;
        delete_imported_manifest();
      }
    }
  }
  let dataset_destination = "";
  let dataset_name = "";

  // track the amount of files that have been uploaded/generated
  let uploadedFiles = 0;
  let uploadedFilesSize = 0;
  let foldersUploaded = 0;
  let previousUploadedFileSize = 0;
  let increaseInFileSize = 0;
  let generated_dataset_id = undefined;

  // determine where the dataset will be generated/uploaded
  let nameDestinationPair = determineDatasetDestination();
  dataset_name = nameDestinationPair[0];
  dataset_destination = nameDestinationPair[1];

  if (dataset_destination == "Pennsieve" || dataset_destination == "bf") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }

  // clear the Pennsieve Queue (added to Renderer side for Mac users that are unable to clear the queue on the Python side)
  clearQueue();

  let mainCurateResponse;
  try {
    // TODO: Test Error handling
    mainCurateResponse = await client.post(`/curate_datasets/curation`, {
      soda_json_structure: sodaJSONObj,
    });
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
    organizeDataset_option_buttons.style.display = "flex";
    organizeDataset.disabled = false;
    organizeDataset.className = "content-button is-selected";
    organizeDataset.style = "background-color: #fff";
    $("#sidebarCollapse").prop("disabled", false);
    document.getElementById(
      "para-new-curate-progress-bar-error-status"
    ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
    uploadLocally.disabled = false;
    uploadLocally.className = "content-button is-selected";
    uploadLocally.style = "background-color: #fff";
    Swal.fire({
      icon: "error",
      title: "An Error Occurred While Uploading Your Dataset",
      html: "Check the error text in the Organize Dataset's upload page to see what went wrong.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      statusBarClone.remove();
      sparc_container.style.display = "inline";
      if (result.isConfirmed) {
        organizeDataset.click();
        let button = document.getElementById("button-generate");
        $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
        document.getElementById("prevBtn").style.display = "none";
        document.getElementById("start-over-btn").style.display = "none";
        document.getElementById("div-vertical-progress-bar").style.display =
          "none";
        document.getElementById("div-generate-comeback").style.display = "none";
        document.getElementById("generate-dataset-progress-tab").style.display =
          "flex";
      }
    });
    progressStatus.innerHTML = "";
    statusText.innerHTML = "";
    document.getElementById("div-new-curate-progress").style.display = "none";
    generateProgressBar.value = 0;
    log.error(error);
    console.error(error);

    try {
      // TODO: Test error handling
      let responseObject = await client.get(
        `manage_datasets/bf_dataset_account`,
        {
          params: {
            selected_account: defaultBfAccount,
          },
        }
      );
      datasetList = [];
      datasetList = responseObject.data.datasets;
    } catch (error) {
      clientError(error);
      emessage = error.response.data.message;
    }

    // wait to see if the uploaded files or size will grow once the client has time to ask for the updated information
    // if they stay zero that means nothing was uploaded
    if (uploadedFiles === 0 || uploadedFilesSize === 0) {
      await wait(2000);
    }

    // log the curation errors to Google Analytics
    logCurationErrorsToAnalytics(
      uploadedFiles,
      uploadedFilesSize,
      dataset_destination,
      main_total_generate_dataset_size,
      increaseInFileSize,
      datasetUploadSession
    );
  }

  let { data } = mainCurateResponse;

  main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
  uploadedFiles = data["main_curation_uploaded_files"];

  $("#sidebarCollapse").prop("disabled", false);
  log.info("Completed curate function");

  // log relevant curation details about the dataset generation/Upload to Google Analytics
  logCurationSuccessToAnalytics(
    manifest_files_requested,
    main_total_generate_dataset_size,
    dataset_name,
    dataset_destination,
    uploadedFiles
  );

  try {
    // TODO: Test error handling
    let responseObject = await client.get(
      `manage_datasets/bf_dataset_account`,
      {
        params: {
          selected_account: defaultBfAccount,
        },
      }
    );
    datasetList = [];
    datasetList = responseObject.data.datasets;
  } catch (error) {
    clientError(error);
  }

  // Progress tracking function for main curate
  var countDone = 0;
  var timerProgress = setInterval(main_progressfunction, 1000);
  var successful = false;

  async function main_progressfunction() {
    let mainCurationProgressResponse;
    try {
      // TODO: Test error handling
      mainCurationProgressResponse = await client.get(
        `/curate_datasetscuration/progress`
      );
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      document.getElementById(
        "para-new-curate-progress-bar-error-status"
      ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
      log.error(error);
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.disabled = false;
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";
      Swal.fire({
        icon: "error",
        title: "An Error Occurred While Uploading Your Dataset",
        html: "Check the error text in the Organize Dataset's upload page to see what went wrong.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        //statusBarClone.remove();
        if (result.isConfirmed) {
          organizeDataset.click();
          let button = document.getElementById("button-generate");
          $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
          document.getElementById("prevBtn").style.display = "none";
          document.getElementById("start-over-btn").style.display = "none";
          document.getElementById("div-vertical-progress-bar").style.display =
            "none";
          document.getElementById("div-generate-comeback").style.display =
            "none";
          document.getElementById(
            "generate-dataset-progress-tab"
          ).style.display = "flex";
        }
      });
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.disabled = false;
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";
      console.error(error);
      //Clear the interval to stop the generation of new sweet alerts after intitial error
      clearInterval(timerProgress);
    }

    let { data } = mainCurationProgressResponse;
    main_curate_status = data["main_curate_status"];
    var start_generate = data["start_generate"];
    var main_curate_progress_message = data["main_curate_progress_message"];
    main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
    var main_generated_dataset_size = data["main_generated_dataset_size"];
    var elapsed_time_formatted = data["elapsed_time_formatted"];

    if (start_generate === 1) {
      divGenerateProgressBar.style.display = "block";
      if (main_curate_progress_message.includes("Success: COMPLETED!")) {
        generateProgressBar.value = 100;
        statusMeter.value = 100;
        progressStatus.innerHTML = main_curate_status + smileyCan;
        statusText.innerHTML = main_curate_status + smileyCan;
        successful = true;
      } else {
        var value =
          (main_generated_dataset_size / main_total_generate_dataset_size) *
          100;
        generateProgressBar.value = value;
        statusMeter.value = value;
        if (main_total_generate_dataset_size < displaySize) {
          var totalSizePrint =
            main_total_generate_dataset_size.toFixed(2) + " B";
        } else if (
          main_total_generate_dataset_size <
          displaySize * displaySize
        ) {
          var totalSizePrint =
            (main_total_generate_dataset_size / displaySize).toFixed(2) + " KB";
        } else if (
          main_total_generate_dataset_size <
          displaySize * displaySize * displaySize
        ) {
          var totalSizePrint =
            (
              main_total_generate_dataset_size /
              displaySize /
              displaySize
            ).toFixed(2) + " MB";
        } else {
          var totalSizePrint =
            (
              main_total_generate_dataset_size /
              displaySize /
              displaySize /
              displaySize
            ).toFixed(2) + " GB";
        }
        var progressMessage = "";
        var statusProgressMessage = "";
        progressMessage += main_curate_progress_message + "<br>";
        statusProgressMessage += main_curate_progress_message + "<br>";
        statusProgressMessage += "Progress: " + value.toFixed(2) + "%" + "<br>";
        progressMessage +=
          "Progress: " +
          value.toFixed(2) +
          "%" +
          " (total size: " +
          totalSizePrint +
          ") " +
          "<br>";
        progressMessage += "Elapsed time: " + elapsed_time_formatted + "<br>";
        progressStatus.innerHTML = progressMessage;
        statusText.innerHTML = statusProgressMessage;
      }
    } else {
      statusText.innerHTML =
        main_curate_progress_message +
        "<br>" +
        "Elapsed time: " +
        elapsed_time_formatted +
        "<br>";
      progressStatus.innerHTML =
        main_curate_progress_message +
        "<br>" +
        "Elapsed time: " +
        elapsed_time_formatted +
        "<br>";
    }

    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      countDone++;
      if (countDone > 1) {
        log.info("Done curate track");
        statusBarClone.remove();
        sparc_container.style.display = "inline";
        if (successful === true) {
          organizeDataset_option_buttons.style.display = "flex";
          organizeDataset.disabled = false;
          organizeDataset.className = "content-button is-selected";
          organizeDataset.style = "background-color: #fff";
          uploadLocally.disabled = false;
          uploadLocally.className = "content-button is-selected";
          uploadLocally.style = "background-color: #fff";
          uploadComplete.open({
            type: "success",
            message: "Dataset created successfully",
          });
        } else {
          //enable buttons anyways
          organizeDataset_option_buttons.style.display = "flex";
          organizeDataset.disabled = false;
          organizeDataset.className = "content-button is-selected";
          organizeDataset.style = "background-color: #fff";
          uploadLocally.disabled = false;
          uploadLocally.className = "content-button is-selected";
          uploadLocally.style = "background-color: #fff";
        }
        // then show the sidebar again
        // forceActionSidebar("show");
        clearInterval(timerProgress);
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    }
  }

  // when generating a new dataset we need to add its ID to the ID -> Name mapping
  // we need to do this only once
  let loggedDatasetNameToIdMapping = false;

  // if uploading to Pennsieve set an interval that gets the amount of files that have been uploaded
  // and their aggregate size; starts for local dataset generation as well. Provides easy way to track amount of
  // files copied and their aggregate size.
  // IMP: This handles tracking a session that tracking a session that had a successful Pennsieve upload.
  //      therefore it is unnecessary to have logs for Session ID tracking in the "api_main_curate" success block
  // IMP: Two reasons this exists:
  //    1. Pennsieve Agent can freeze. This prevents us from logging. So we log a Pennsieve dataset upload session as it happens.
  //    2. Local dataset generation and Pennsieve dataset generation can fail. Having access to how many files and their aggregate size for logging at error time is valuable data.
  const checkForBucketUpload = async () => {
    // ask the server for the amount of files uploaded in the current session
    // nothing to log for uploads where a user is solely deleting files in this section

    let mainCurationDetailsResponse;
    try {
      // TODO: Test error handling
      mainCurationDetailsResponse = await client.get(
        `/curate_datasetscuration/upload_details`
      );
    } catch (error) {
      clientError(error);
    }

    let { data } = mainCurationDetailsResponse;

    // check if the amount of successfully uploaded files has increased
    if (
      data["main_curation_uploaded_files"] > 0 &&
      data["uploaded_folder_counter"] > foldersUploaded
    ) {
      previousUploadedFileSize = uploadedFilesSize;
      uploadedFiles = data["main_curation_uploaded_files"];
      uploadedFilesSize = data["current_size_of_uploaded_files"];
      foldersUploaded = data["uploaded_folder_counter"];

      // log the increase in the file size
      increaseInFileSize = uploadedFilesSize - previousUploadedFileSize;

      // log the aggregate file count and size values when uploading to Pennsieve
      if (dataset_destination === "bf" || dataset_destination === "Pennsieve") {
        // use the session id as the label -- this will help with aggregating the number of files uploaded per session
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE +
            " - Step 7 - Generate - Dataset - Number of Files",
          `${datasetUploadSession.id}`,
          uploadedFiles
        );

        // use the session id as the label -- this will help with aggregating the size of the given upload session
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE +
            " - Step 7 - Generate - Dataset - Size",
          `${datasetUploadSession.id}`,
          increaseInFileSize
        );
      }
    }

    generated_dataset_id = data["generated_dataset_id"];
    // if a new Pennsieve dataset was generated log it once to the dataset id to name mapping
    if (
      !loggedDatasetNameToIdMapping &&
      generated_dataset_id !== null &&
      generated_dataset_id !== undefined
    ) {
      ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        generated_dataset_id,
        dataset_name
      );

      // don't log this again for the current upload session
      loggedDatasetNameToIdMapping = true;
    }

    //stop the inteval when the upload is complete
    if (main_curate_status === "Done") {
      clearInterval(timerCheckForBucketUpload);
    }
  };

  let timerCheckForBucketUpload = setInterval(checkForBucketUpload, 1000);
}

const show_curation_shortcut = () => {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "No. I'll do it later",
    confirmButtonText: "Yes, I want to share it",
    heightAuto: false,
    icon: "success",
    allowOutsideClick: false,
    reverseButtons: reverseSwalButtons,
    showCancelButton: true,
    text: "Now that your dataset is uploaded, do you want to share it with the Curation Team?",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then((result) => {
    //dismissStatus("status-bar-curate-progress");
    uploadComplete.open({
      type: "success",
      message: "Upload to Pennsieve completed",
    });
    let statusBarContainer = document.getElementById(
      "status-bar-curate-progress"
    );
    //statusBarContainer.remove();

    if (result.isConfirmed) {
      $("#disseminate_dataset_tab").click();
      $("#share_curation_team_btn").click();
    }
  });
};

const get_num_files_and_folders = (dataset_folders) => {
  if ("files" in dataset_folders) {
    for (let file in dataset_folders["files"]) {
      file_counter += 1;
    }
  }
  if ("folders" in dataset_folders) {
    for (let folder in dataset_folders["folders"]) {
      folder_counter += 1;
      get_num_files_and_folders(dataset_folders["folders"][folder]);
    }
  }
  return;
};

function determineDatasetDestination() {
  if (sodaJSONObj["generate-dataset"]) {
    if (sodaJSONObj["generate-dataset"]["destination"]) {
      let destination = sodaJSONObj["generate-dataset"]["destination"];
      if (destination === "bf" || destination === "Pennsieve") {
        // updating an existing dataset on Pennsieve
        if (sodaJSONObj["bf-dataset-selected"]) {
          return [
            sodaJSONObj["bf-dataset-selected"]["dataset-name"],
            "Pennsieve",
          ];
        } else {
          return [
            // get dataset name,
            document.querySelector("#inputNewNameDataset").value,
            "Pennsieve",
          ];
        }
      } else {
        // replacing files in an existing local dataset
        if (sodaJSONObj["generate-dataset"]["dataset-name"]) {
          return [sodaJSONObj["generate-dataset"]["dataset-name"], "Local"];
        } else {
          // creating a new dataset from an existing local dataset
          return [
            document.querySelector("#inputNewNameDataset").value,
            "Local",
          ];
        }
      }
    }
  } else {
    return [document.querySelector("#inputNewNameDataset").value, "Local"];
  }
}

function backend_to_frontend_warning_message(error_array) {
  if (error_array.length > 1) {
    var warning_message = error_array[0] + "<ul>";
  } else {
    var warning_message = "<ul>";
  }
  for (var i = 1; i < error_array.length; i++) {
    item = error_array[i];
    warning_message += "<li>" + item + "</li>";
  }
  var final_message = warning_message + "</ul>";
  return final_message;
}

var metadataIndividualFile = "";
var metadataAllowedExtensions = [];
var metadataParaElement = "";

function importMetadataFiles(ev, metadataFile, extensionList, paraEle) {
  document.getElementById(paraEle).innerHTML = "";
  metadataIndividualFile = metadataFile;
  metadataAllowedExtensions = extensionList;
  metadataParaElement = paraEle;
  ipcRenderer.send("open-file-dialog-metadata-curate");
}

function importPennsieveMetadataFiles(
  ev,
  metadataFile,
  extensionList,
  paraEle
) {
  extensionList.forEach((file_type) => {
    file_name = metadataFile + file_type;
    if (
      file_name in sodaJSONObj["metadata-files"] &&
      sodaJSONObj["metadata-files"][file_name]["type"] != "bf"
    ) {
      delete sodaJSONObj["metadata-files"][file_name];
    }
    deleted_file_name = file_name + "-DELETED";
    if (
      deleted_file_name in sodaJSONObj["metadata-files"] &&
      sodaJSONObj["metadata-files"][deleted_file_name]["type"] === "bf"
    ) {
      // update Json object with the restored object
      let index =
        sodaJSONObj["metadata-files"][deleted_file_name]["action"].indexOf(
          "deleted"
        );
      sodaJSONObj["metadata-files"][deleted_file_name]["action"].splice(
        index,
        1
      );
      let deleted_file_name_new_key = deleted_file_name.substring(
        0,
        deleted_file_name.lastIndexOf("-")
      );
      sodaJSONObj["metadata-files"][deleted_file_name_new_key] =
        sodaJSONObj["metadata-files"][deleted_file_name];
      delete sodaJSONObj["metadata-files"][deleted_file_name];
    }
  });
  populate_existing_metadata(sodaJSONObj);
}

ipcRenderer.on("selected-metadataCurate", (event, mypath) => {
  if (mypath.length > 0) {
    var dotCount = path.basename(mypath[0]).trim().split(".").length - 1;
    if (dotCount === 1) {
      var metadataWithoutExtension = path
        .basename(mypath[0])
        .slice(0, path.basename(mypath[0]).indexOf("."));
      var extension = path
        .basename(mypath[0])
        .slice(path.basename(mypath[0]).indexOf("."));

      let file_size = 0;

      try {
        if (fs.existsSync(mypath[0])) {
          let stats = fs.statSync(mypath[0]);
          file_size = stats.size;
        }
      } catch (err) {
        console.error(err);
        document.getElementById(metadataParaElement).innerHTML =
          "<span style='color:red'>Your SPARC metadata file does not exist or is unreadable. Please verify that you are importing the correct metadata file from your system. </span>";

        return;
      }

      if (file_size == 0) {
        document.getElementById(metadataParaElement).innerHTML =
          "<span style='color:red'>Your SPARC metadata file is empty! Please verify that you are importing the correct metadata file from your system.</span>";

        return;
      }
      if (metadataWithoutExtension === metadataIndividualFile) {
        if (metadataAllowedExtensions.includes(extension)) {
          document.getElementById(metadataParaElement).innerHTML = mypath[0];
          $($("#" + metadataParaElement).parents()[1])
            .find(".div-metadata-confirm")
            .css("display", "flex");
          $($("#" + metadataParaElement).parents()[1])
            .find(".div-metadata-go-back")
            .css("display", "none");
        } else {
          document.getElementById(metadataParaElement).innerHTML =
            "<span style='color:red'>Your SPARC metadata file must be in one of the formats listed above!</span>";
        }
      } else {
        document.getElementById(metadataParaElement).innerHTML =
          "<span style='color:red'>Your SPARC metadata file must be named and formatted exactly as listed above!</span>";
      }
    }
  }
});

/**
 *
 * @param {object} sodaJSONObj - The SODA json object used for tracking files, folders, and basic dataset curation information such as providence (local or Pennsieve).
 * @returns {
 *    "soda_json_structure": {}
 *    "success_message": ""
 *    "manifest_error_message": ""
 * }
 */
var bf_request_and_populate_dataset = async (sodaJSONObj) => {
  try {
    let filesFoldersResponse = await client.get(
      `/organize_datasets/dataset_files_and_folders`,
      {
        params: {
          sodajsonobject: sodaJSONObj,
        },
      }
    );
    //check return value
    // TODO: This returns two messages along with the soda_json_structure as it originally did.
    //       Gonna have to replace just grabbing soda_json_structure with the whole res object
    //       and make sure it works given the introduction of keys all the way down.
    let data = filesFoldersResponse.data;

    ipcRenderer.send(
      "track-event",
      "Success",
      "Retrieve Dataset - Pennsieve",
      defaultBfDatasetId
    );

    return data;
  } catch (error) {
    clientError(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      "Retrieve Dataset - Pennsieve",
      defaultBfDatasetId
    );
    throw Error(userErrorMessage(error));
  }
};

// When mode = "update", the buttons won't be hidden or shown to prevent button flickering effect
const curation_consortium_check = async (mode = "") => {
  let selected_account = defaultBfAccount;
  let selected_dataset = defaultBfDataset;
  console.log(selected_account);

  $(".spinner.post-curation").show();
  $("#curation-team-unshare-btn").hide();
  $("#sparc-consortium-unshare-btn").hide();
  $("#curation-team-share-btn").hide();
  $("#sparc-consortium-share-btn").hide();

  try {
    let bf_account_details_req = await client.get(
      `/manage_datasets/bf_account_details`,
      {
        params: {
          selected_account: defaultBfAccount,
        },
      }
    );
    let res = bf_account_details_req.data.account_details;
    // remove html tags from response
    res = res.replace(/<[^>]*>?/gm, "");

    if (res.search("SPARC Consortium") == -1) {
      $("#current_curation_team_status").text("None");
      $("#current_sparc_consortium_status").text("None");
      Swal.fire({
        title: "Failed to share with Curation team!",
        text: "This account is not in the SPARC Consortium organization. Please switch accounts and try again",
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      Swal.fire({
        title: "Failed to share with the SPARC Consortium!",
        text: "This account is not in the SPARC Consortium organization. Please switch accounts and try again.",
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      if (mode != "update") {
        $("#curation-team-unshare-btn").hide();
        $("#sparc-consortium-unshare-btn").hide();
        $("#curation-team-share-btn").hide();
        $("#sparc-consortium-share-btn").hide();
        $(".spinner.post-curation").hide();
      }
      return;
    }

    if (mode != "update") {
      $("#curation-team-unshare-btn").hide();
      $("#sparc-consortium-unshare-btn").hide();
      $("#curation-team-share-btn").hide();
      $("#sparc-consortium-share-btn").hide();
    }

    if (selected_dataset === "Select dataset") {
      $("#current_curation_team_status").text("None");
      $("#current_sparc_consortium_status").text("None");
      $(".spinner.post-curation").hide();
    } else {
      //needs to be replaced
      try {
        let bf_get_permissions = await client.get(
          `/manage_datasets/bf_dataset_permissions`,
          {
            params: {
              selected_account: selected_account,
              selected_dataset: selected_dataset,
            },
          }
        );
        let res = bf_get_permissions.data.permissions;

        let curation_permission_satisfied = false;
        let consortium_permission_satisfied = false;
        let curation_return_status = false;
        let consortium_return_status = false;

        for (var i in res) {
          let permission = String(res[i]);
          if (permission.search("SPARC Data Curation Team") != -1) {
            if (permission.search("manager") != -1) {
              curation_permission_satisfied = true;
            }
          }
          if (permission.search("SPARC Embargoed Data Sharing Group") != -1) {
            if (permission.search("viewer") != -1) {
              consortium_permission_satisfied = true;
            }
          }
        }

        if (!curation_permission_satisfied) {
          $("#current_curation_team_status").text(
            "Not shared with the curation team"
          );
          curation_return_status = true;
        }
        if (!consortium_permission_satisfied) {
          $("#current_sparc_consortium_status").text(
            "Not shared with the SPARC Consortium"
          );
          consortium_return_status = true;
        }

        if (curation_return_status) {
          if (mode != "update") {
            $("#curation-team-share-btn").show();
            $("#curation-team-unshare-btn").hide();
          }
        }

        if (consortium_return_status) {
          if (mode != "update") {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
          }
        }

        if (curation_return_status && consortium_return_status) {
          $("#sparc-consortium-unshare-btn").hide();
          $("#sparc-consortium-share-btn").show();
          $("#curation-team-unshare-btn").hide();
          $("#curation-team-share-btn").show();
          $(".spinner.post-curation").hide();
          return;
        }
        //needs to be replaced
        try {
          let bf_dataset_permissions = await client.get(
            `/manage_datasets/bf_dataset_status`,
            {
              params: {
                selected_account: defaultBfAccount,
                selected_dataset: defaultBfDataset,
              },
            }
          );
          let res = bf_dataset_permission.data;

          let dataset_status_value = res[1];
          let dataset_status = parseInt(dataset_status_value.substring(0, 2));
          let curation_status_satisfied = false;
          let consortium_status_satisfied = false;

          if (dataset_status > 2) {
            curation_status_satisfied = true;
          }
          if (dataset_status > 10) {
            consortium_status_satisfied = true;
          }

          if (!curation_status_satisfied) {
            $("#current_curation_team_status").text(
              "Not shared with the curation team"
            );
            curation_return_status = true;
          }
          if (!consortium_status_satisfied) {
            $("#current_sparc_consortium_status").text(
              "Not shared with the SPARC Consortium"
            );
            consortium_return_status = true;
          }

          if (curation_return_status) {
            $("#curation-team-unshare-btn").hide();
            $("#curation-team-share-btn").show();
          } else {
            $("#current_curation_team_status").text(
              "Shared with the curation team"
            );
            $("#curation-team-unshare-btn").show();
            $("#curation-team-share-btn").hide();
          }

          if (consortium_return_status) {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
          } else {
            $("#current_sparc_consortium_status").text(
              "Shared with the SPARC Consortium"
            );
            $("#sparc-consortium-unshare-btn").show();
            $("#sparc-consortium-share-btn").hide();
          }

          if (curation_return_status && consortium_return_status) {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
            $("#curation-team-unshare-btn").hide();
            $("#curation-team-share-btn").show();
            $(".spinner.post-curation").hide();
            return;
          }

          $(".spinner.post-curation").hide();
        } catch (error) {
          clientError(error);
          $("#current_curation_team_status").text("None");
          $("#current_sparc_consortium_status").text("None");
          $(".spinner.post-curation").hide();
        }
      } catch (error) {
        clientError(error);
        if (mode != "update") {
          $("#current_curation_team_status").text("None");
          $("#current_sparc_consortium_status").text("None");
        }
        $(".spinner.post-curation").hide();
      }
    }
  } catch (error) {
    clientError(error);

    if (mode != "update") {
      $("#curation-team-unshare-btn").hide();
      $("#sparc-consortium-unshare-btn").hide();
      $("#curation-team-share-btn").hide();
      $("#sparc-consortium-share-btn").hide();
    }

    $(".spinner.post-curation").hide();
  }
};

$("#button-generate-manifest-locally").click(() => {
  ipcRenderer.send("open-folder-dialog-save-manifest-local");
});

const recursive_remove_deleted_files = (dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let item in dataset_folder["files"]) {
      if (dataset_folder["files"][item]["action"].includes("deleted")) {
        delete dataset_folder["files"][item];
      }
    }
  }

  if ("folders" in dataset_folder) {
    for (let item in dataset_folder["folders"]) {
      recursive_remove_deleted_files(dataset_folder["folders"][item]);
      if (dataset_folder["folders"][item]["action"].includes("deleted")) {
        delete dataset_folder["folders"][item];
      }
    }
  }
};

ipcRenderer.on("selected-manifest-folder", async (event, result) => {
  if (!result["canceled"]) {
    $("body").addClass("waiting");
    let manifest_destination = result["filePaths"][0];
    let manifest_state = {};

    if ("manifest-files" in sodaJSONObj) {
      manifest_state = sodaJSONObj["manifest-files"];
      sodaJSONObj["manifest-files"]["local-destination"] = manifest_destination;
    } else {
      manifest_state = {};
      sodaJSONObj["manifest-files"] = {};
      sodaJSONObj["manifest-files"]["local-destination"] = manifest_destination;
    }

    delete_imported_manifest();

    let temp_sodaJSONObj = JSON.parse(JSON.stringify(sodaJSONObj));
    let dataset_name = "Undetermined";

    recursive_remove_deleted_files(temp_sodaJSONObj["dataset-structure"]);

    if ("bf-dataset-selected" in sodaJSONObj) {
      if ("dataset-name" in sodaJSONObj) {
        dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
      }
    }

    try {
      let generate_manifest_locally = await client.post(
        `/curate_datasets/manifest_files`,
        {
          generate_purpose: "",
          soda_json_object: temp_sodaJSONObj,
        }
      );
      let res = generate_manifest_locally.data;

      $("body").removeClass("waiting");
      logCurationForAnalytics(
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 5", "Generate", "Manifest"],
        determineDatasetLocation()
      );
    } catch (error) {
      clientError(error);
      $("body").removeClass("waiting");

      // log the error to analytics
      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 5", "Generate", "Manifest"],
        determineDatasetLocation()
      );
    }
  }
});

function showBFAddAccountSweetalert() {
  var bootb = Swal.fire({
    title: bfaddaccountTitle,
    html: bfAddAccountBootboxMessage,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add Account",
    customClass: "swal-wide",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    didOpen: () => {
      tippy("#add-bf-account-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        content:
          "See our dedicated <a target='_blank' href='https://docs.sodaforsparc.io/docs/manage-dataset/connect-your-pennsieve-account-with-soda'> help page </a>for generating API key and secret and setting up your Pennsieve account in SODA during your first use.<br><br>The account will then be remembered by SODA for all subsequent uses and be accessible under the 'Select existing account' tab. You can only use Pennsieve accounts under the SPARC Consortium organization with SODA.",
      });
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addBFAccountInsideSweetalert(bootb);
    }
  });
}

async function addBFAccountInsideSweetalert(myBootboxDialog) {
  var name = $("#bootbox-key-name").val();
  var apiKey = $("#bootbox-api-key").val();
  var apiSecret = $("#bootbox-api-secret").val();
  try {
    let add_api_key = await client.put(`/manage_datasets/account/api_key`, {
      keyname: name,
      key: apiKey,
      secret: apiSecret,
    });
    $("#bootbox-key-name").val("");
    $("#bootbox-api-key").val("");
    $("#bootbox-api-secret").val("");
    bfAccountOptions[name] = name;
    defaultBfAccount = name;
    defaultBfDataset = "Select dataset";

    try {
      let bf_account_details_req = await client.get(
        `/manage_datasets/bf_account_details`,
        {
          params: {
            selected_account: name,
          },
        }
      );
      let res = bf_account_details_req.data.account_details;

      $("#para-account-detail-curate").html(res);
      $("#current-bf-account").text(name);
      $("#current-bf-account-generate").text(name);
      $("#create_empty_dataset_BF_account_span").text(name);
      $(".bf-account-span").text(name);
      $("#current-bf-dataset").text("None");
      $("#current-bf-dataset-generate").text("None");
      $(".bf-dataset-span").html("None");
      $("#para-account-detail-curate-generate").html(res);
      $("#para_create_empty_dataset_BF_account").html(res);
      $(".bf-account-details-span").html(res);
      $("#para-continue-bf-dataset-getting-started").text("");
      showHideDropdownButtons("account", "show");
      confirm_click_account_function();
      updateBfAccountList();
    } catch (error) {
      clientError(error);

      Swal.fire({
        icon: "error",
        text: "Something went wrong!",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        footer:
          '<a target="_blank" href="https://docs.pennsieve.io/docs/configuring-the-client-credentials">Why do I have this issue?</a>',
      });
      showHideDropdownButtons("account", "hide");
      confirm_click_account_function();
    }

    Swal.fire({
      icon: "success",
      title: "Successfully added! <br/>Loading your account details...",
      timer: 3000,
      timerProgressBar: true,
      allowEscapeKey: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: false,
    });
  } catch (error) {
    clientError(error);
    Swal.fire({
      icon: "error",
      html: "<span>" + error.response.data.message + "</span>",
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    }).then((result) => {
      if (result.isConfirmed) {
        showBFAddAccountSweetalert();
      }
    });
  }
}

/*
******************************************************
******************************************************
Analytics Logging Section
******************************************************
******************************************************
*/

// Log the dataset description Successes and Errors as the user moves through the process of Preparing their metadata file
// Inputs:
//  category: string - "Success" indicates a successful operation; "Error" indicates a failed operation
//  analyticsActionPrefix: string - One of the analytics action prefixes defined below in an enum
//  analyticsGranularity: string - Determines what levels of granularity get logged; options are: "prefix", "action", "action with destination", "all levels of granularity."
//  action: string - Optional. Indicates the step in the metadata preparation process the Success or Failure occurs
//  destination: string - Optional. The destination where the action is occurring; defined below in an enum

function logMetadataForAnalytics(
  category,
  analyticsActionPrefix,
  granularity,
  action,
  destination
) {
  // the name of the action being logged
  let actionName = analyticsActionPrefix;

  // check if only logging the prefix or all levels of granularity
  if (
    granularity === AnalyticsGranularity.PREFIX ||
    granularity === AnalyticsGranularity.ALL_LEVELS
  ) {
    // log the prefix, category of the event
    ipcRenderer.send("track-event", `${category}`, actionName);
  }

  // check if the user provided an action to be part of the action name
  if (action !== "") {
    // update the action name with the given action
    actionName = actionName + " - " + action;
  } else {
    // add not set so when looking at analytics we can easily identify sections logged without providing an action
    // so we can fix the log call by including an appropriate action
    actionName = actionName + " - " + "(not set)";
  }

  // check if the user wants to log the action without the destination
  if (
    granularity === AnalyticsGranularity.ACTION ||
    granularity === AnalyticsGranularity.ALL_LEVELS ||
    granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // track every time the user wanted to generate a metadata file or everytime the user wanted to use a pre-existing metadata file
    ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
  }

  if (
    granularity === AnalyticsGranularity.ACTION_WITH_DESTINATION ||
    granularity === AnalyticsGranularity.ALL_LEVELS ||
    granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // add the destination to the action
    actionName = actionName + " - " + destination;
    // log only the action with the destination added
    if (destination === Destinations.PENNSIEVE) {
      ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        defaultBfDatasetId
      );
    } else {
      ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
    }
  }
}

// Log the size of a metadata file that was created locally or uploaded to Pennsieve
// Inputs:
//    uploadBFBoolean: boolean - True when the metadata file was created on Pennsieve; false when the Metadata file was created locally
//    metadataFileName: string - the name of the metadata file that was created along with its extension
async function logMetadataSizeForAnalytics(
  uploadBFBoolean,
  metadataFileName,
  size
) {
  ipcRenderer.send(
    "track-event",
    "Success",
    "Prepare Metadata - Generate",
    "Size of Total Metadata Files Generated",
    size
  );

  let fileNameToPrefixMapping = {
    dataset_description: MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
    submission: MetadataAnalyticsPrefix.SUBMISSION,
    subjects: MetadataAnalyticsPrefix.SUBJECTS,
    samples: MetadataAnalyticsPrefix.SAMPLES,
    readme: MetadataAnalyticsPrefix.README,
    changes: MetadataAnalyticsPrefix.CHANGES,
    manifest: MetadataAnalyticsPrefix.MANIFEST,
  };

  // remove the extension from the metadata file's name
  let metadataFileWithoutExtension = metadataFileName.slice(
    0,
    metadataFileName.indexOf(".")
  );

  // get the appropriate prefix for logging the given metadata file's size
  let currentMetadataLoggingPrefix =
    fileNameToPrefixMapping[`${metadataFileWithoutExtension.toLowerCase()}`];

  // log the size to analytics using the Action as a root logging level
  // that aggregates the size of all metadata files of a particular type created through SODA
  ipcRenderer.send(
    "track-event",
    "Success",
    currentMetadataLoggingPrefix + " - Generate - Size",
    "Size",
    size
  );

  // get the destination of the metadata file
  let destination = uploadBFBoolean ? "Pennsieve" : "Local";

  // log the size of the metadata file along with its location; label is the selected dataset's ID or a note informing us the dataset is stored locally
  ipcRenderer.send(
    "track-event",
    "Success",
    currentMetadataLoggingPrefix + ` - Generate - ${destination} - Size`,
    uploadBFBoolean ? defaultBfDatasetId : "Local",
    size
  );
}

// get the size of a file in bytes given a path to a file
const getFileSizeInBytes = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(stats.size);
      }
    });
  });
};

const MetadataAnalyticsPrefix = {
  DATASET_DESCRIPTION: "Prepare Metadata - dataset_description",
  MANIFEST: "Prepare Metadata - manifest",
  SUBJECTS: "Prepare Metadata - subjects",
  SAMPLES: "Prepare Metadata - samples",
  README: "Prepare Metadata - readme",
  CHANGES: "Prepare Metadata - changes",
  SUBMISSION: "Prepare Metadata - submission",
};

const ManageDatasetsAnalyticsPrefix = {
  MANAGE_DATASETS_CREATE_DATASET: "Manage Datasets - Create a new dataset",
  MANAGE_DATASETS_RENAME_DATASET:
    "Manage Datasets - Rename an existing dataset",
  MANAGE_DATASETS_MAKE_PI_OWNER: "Manage Datasets - Make PI owner of dataset",
  MANAGE_DATASETS_ADD_EDIT_PERMISSIONS:
    "Manage Datasets - Add/Edit Permissions",
  MANAGE_DATASETS_ADD_EDIT_SUBTITLE: "Manage Datasets - Add/Edit Subtitle",
  MANAGE_DATASETS_ADD_EDIT_README: "Manage Datasets - Add/Edit Readme",
  MANAGE_DATASETS_ADD_EDIT_BANNER: "Manage Datasets - Upload a Banner Image",
  MANAGE_DATASETS_ADD_EDIT_TAGS: "Manage Datasets - Add/Edit Tags",
  MANAGE_DATASETS_ASSIGN_LICENSE: "Manage Datasets - Assign a License",
  MANAGE_DATASETS_UPLOAD_LOCAL_DATASET:
    "Manage Datasets - Upload Local Dataset",
  MANAGE_DATASETS_CHANGE_STATUS: "Manage Datasets - Change Dataset Status",
};

const DisseminateDatasetsAnalyticsPrefix = {
  DISSEMINATE_REVIEW: "Disseminate Datasets - Pre-publishing Review",
  DISSEMINATE_CURATION_TEAM: "Disseminate Datasets - Share with Curation Team",
  DISSEMINATE_SPARC_CONSORTIUM:
    "Disseminate Datasets - Share with SPARC Consortium",
};

const PrepareDatasetsAnalyticsPrefix = {
  CURATE: "Prepare Datasets - Organize dataset",
};

const AnalyticsGranularity = {
  PREFIX: "prefix",
  ACTION: "action",
  ACTION_WITH_DESTINATION: "action with destination",
  ACTION_AND_ACTION_WITH_DESTINATION: "action and action with destination",
  ALL_LEVELS: "all levels of granularity",
};

const Destinations = {
  LOCAL: "Local",
  PENNSIEVE: "Pennsieve",
  SAVED: "Saved",
  NEW: "New",
};

const Actions = {
  GENERATE: "Generate",
  EXISTING: "Existing",
  NEW: "New",
};

function logCurationForAnalytics(
  category,
  analyticsActionPrefix,
  granularity,
  actions,
  location,
  generalLog
) {
  // if no actions to log return
  if (!actions) {
    return;
  }

  // the name of the action being logged
  let actionName = analyticsActionPrefix;

  // check if only logging the prefix or all levels of granularity
  if (
    granularity === AnalyticsGranularity.PREFIX ||
    granularity === AnalyticsGranularity.ALL_LEVELS
  ) {
    // log the prefix, category of the event
    ipcRenderer.send("track-event", `${category}`, actionName);
  }

  // check if the user wants to log the action(s)
  if (
    granularity === AnalyticsGranularity.ACTION ||
    granularity === AnalyticsGranularity.ALL_LEVELS ||
    granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // iterate through the actions
    for (let idx = 0; idx < actions.length; idx++) {
      // track the action
      actionName = actionName + " - " + actions[idx];
      ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        actions[idx],
        1
      );
    }

    // reset the action's name
    actionName = analyticsActionPrefix;
  }

  // check if the user wants to log the action(s) with the destination
  if (
    granularity === AnalyticsGranularity.ACTION_WITH_DESTINATION ||
    granularity === AnalyticsGranularity.ALL_LEVELS ||
    granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // iterate through the actions
    for (let idx = 0; idx < actions.length; idx++) {
      // track the action
      actionName = actionName + " - " + actions[idx];
    }

    if (!generalLog) {
      // add the location
      actionName = actionName + " - " + location;
    }

    // determine logging format
    if (location === Destinations.PENNSIEVE) {
      // use the datasetid as a label and do not add an aggregation value
      ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        defaultBfDatasetId
      );
    } else {
      // log the location as a label and add an aggregation value
      ipcRenderer.send("track-event", `${category}`, actionName, location, 1);
    }
  }
}

function getMetadataFileNameFromStatus(metadataFileStatus) {
  // get the UI text that displays the file path
  let filePath = metadataFileStatus.text();

  let fileName = path.basename(filePath);

  // remove the extension
  fileName = fileName.slice(0, fileName.indexOf("."));

  return fileName;
}

function determineLocationFromStatus(metadataFileStatus) {
  let filePath = metadataFileStatus.text();

  // determine if the user imported from Pennsieve or Locally
  let pennsieveFile = filePath
    .toUpperCase()
    .includes("Pennsieve".toUpperCase());

  return pennsieveFile;
}

function logGeneralOperationsForAnalytics(
  category,
  analyticsPrefix,
  granularity,
  actions
) {
  // if no actions to log return
  if (!actions) {
    return;
  }

  // the name of the action being logged
  let actionName = analyticsPrefix;

  // check if only logging the prefix or all levels of granularity
  if (
    granularity === AnalyticsGranularity.PREFIX ||
    granularity === AnalyticsGranularity.ALL_LEVELS
  ) {
    // log the prefix, category of the event
    ipcRenderer.send("track-event", `${category}`, actionName);
  }

  // check if the user wants to log the action(s)
  if (
    granularity === AnalyticsGranularity.ACTION ||
    granularity === AnalyticsGranularity.ALL_LEVELS
  ) {
    // iterate through the actions
    for (let idx = 0; idx < actions.length; idx++) {
      // track the action
      actionName = analyticsPrefix + " - " + actions[idx];
      ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        defaultBfDatasetId
      );
    }
  }
}

/**
 *
 * @param {string} datasetIdOrName - The currently selected dataset - name or its ID
 * @returns statuses - A status object that details the state of each pre-publishing checklist item for the given dataset and user
 */
const getPrepublishingChecklistStatuses = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to log status of pre-publishing checklist items from."
    );
  }

  // construct the statuses object
  const statuses = {};

  let dataset = await api.getDataset(defaultBfDatasetId);

  // get the description - aka subtitle (unfortunate naming), tags, banner image URL, collaborators, and license
  const { description, tags, license } = dataset["content"];

  // set the subtitle's status
  statuses.subtitle = description && description.length ? true : false;

  let readme = await api.getDatasetReadme(defaultBfAccount, defaultBfDatasetId);

  // set the readme's status
  statuses.readme = readme && readme.length >= 1 ? true : false;

  // set tags's status
  statuses.tags = tags && tags.length ? true : false;

  let bannerImageURL = await api.getDatasetBannerImageURL(defaultBfDataset);

  // set the banner image's url status
  statuses.bannerImageURL =
    bannerImageURL && bannerImageURL.length ? true : false;

  // set the license's status
  statuses.license = license && license.length ? true : false;

  let role = await api.getDatasetRole(defaultBfDataset);

  if (!role === "owner") {
    return;
  }

  // declare the orcidId
  let orcidId;

  // get the user's information
  let user = await api.getUserInformation();

  // get the orcid object out of the user information
  let orcidObject = user.orcid;

  // check if the owner has an orcid id
  if (orcidObject) {
    orcidId = orcidObject.orcid;
  } else {
    orcidId = undefined;
  }

  // the user has an ORCID iD if the property is defined and non-empty
  statuses.ORCID = orcidId && orcidId.length ? true : false;

  return statuses;
};

// Submits the selected dataset for review by the publishers within a given user's organization.
// Note: To be run after the pre-publishing validation checks have all passed.
// I:
//  pennsieveAccount: string - the SODA user's pennsieve account
//  datasetIdOrName: string - the id/name of the dataset being submitted for publication
//  embargoReleaseDate?: string  - in yyyy-mm-dd format. Represents the day an embargo will be lifted on this dataset; at which point the dataset will be made public.
// O: void
const submitDatasetForPublication = async (
  pennsieveAccount,
  datasetIdOrName,
  embargoReleaseDate
) => {
  // check that a dataset was provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "A valid dataset must be provided to the dataset review process."
    );
  }

  // get the current SODA user's permissions (permissions are indicated by the user's assigned role for a given dataset)
  let userRole = await getCurrentUserPermissions(datasetIdOrName);

  // check that the current SODA user is the owner of the given dataset
  if (!userIsOwnerOrManager(userRole))
    throw new Error(
      "You don't have permissions for submitting this dataset for publication. Please have the dataset owner start the submission process."
    );

  // get an access token for the user
  let jwt = await get_access_token();

  // get the dataset by name or id
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // set the publication type to "publication" or "embargo" based on the value of embargoReleaseDate
  const publicationType = embargoReleaseDate === "" ? "publication" : "embargo";

  // get the dataset id
  const { id } = dataset.content;

  // construct the appropriate query string
  let queryString = "";

  // if an embargo release date was selected add it to the query string
  if (embargoReleaseDate !== "") {
    queryString = `?embargoReleaseDate=${embargoReleaseDate}&publicationType=${publicationType}`;
  } else {
    // add the required publication type
    queryString = `?publicationType=${publicationType}`;
  }
  // request that the dataset be sent in for publication/publication review
  let publicationPost = await client.post(
    `/disseminate_datasets/datasets/${id}/publication/request`,
    {
      params: {
        selected_account: defaultBfAccount,
      },
      payload: {
        publication_type: publicationType,
        embargo_release_date: embargoReleaseDate,
      },
    }
  );

  // get the status code out of the response
  let statusCode = publicationPost.status;

  // check the status code of the response
  switch (statusCode) {
    case 201:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset to add submit for publication.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot submit a dataset for publication while unauthenticated.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );
    case 400:
      throw new Error(
        `${statusCode} - You did not complete an item in the pre-publishing checklist before submitting your dataset for publication.`
      );

    default:
      // something unexpected happened
      let statusText = publicationPost.statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }
};



/*
******************************************************
******************************************************
Manage Datasets Add/Edit Banner Image With Nodejs
******************************************************
******************************************************
*/

// I: Dataset name or id
// O: Presigned URL for the banner image or an empty string
const getDatasetBannerImageURL = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error("Error: Must provide a valid dataset to pull tags from.");
  }

  // fetch the banner url from the Pennsieve API at the readme endpoint (this is because the description is the subtitle not readme )

  let { banner } = bannerResponse.data;

  return banner;
};

/*
******************************************************
******************************************************
Get User Dataset Permissions With Nodejs
******************************************************
******************************************************
*/

// returns the user's permissions/role for the given dataset. Options are : owner, manager, editor, viewer
const getCurrentUserPermissions = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to check permissions for."
    );
  }

  // get access token for the current user
  let jwt = await get_access_token();

  // get the dataset the user wants to edit
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // get the id out of the dataset
  let id = dataset.content.id;

  // get the user's permissions

  // get the status code out of the response
  let statusCode = dataset_roles.status;

  // check the status code of the response
  switch (statusCode) {
    case 200:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset to check your permissions.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot check your dataset permissions while unauthenticated. Please reauthenticate and try again.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );

    default:
      // something unexpected happened
      let statusText = dataset_roles.statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }

  // get the permissions object
  const { role } = dataset_roles.data;

  // return the permissions
  return role;
};

// I: role: string - A user's permissions indicated by their role. Can be: owner, manager, editor, viewer.
// O: boolean - true if role is owner or manager, false otherwise
const userIsOwnerOrManager = (role) => {
  // check if the user permissions do not include "owner" or "manager"
  if (!["owner", "manager"].includes(role)) {
    // throw a permission error: "You don't have permissions for editing metadata on this Pennsieve dataset"
    return false;
  }

  return true;
};

const userIsOwner = (role) => {
  // check if the user permissions do not include "owner"
  if (role !== "owner") {
    // throw a permission error: "You don't have permissions for editing metadata on this Pennsieve dataset"
    return false;
  }

  return true;
};

const userIsDatasetOwner = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to check permissions for."
    );
  }

  // get the dataset the user wants to edit
  // TODO: Replace with Flask call -- READY
  let role = await getCurrentUserPermissions(datasetIdOrName);

  return userIsOwner(role);
};

/*
******************************************************
******************************************************
ORCID Integration with NodeJS
******************************************************
******************************************************
*/

const integrateORCIDWithPennsieve = async (accessCode) => {
  // check that the accessCode is defined and non-empty
  if (accessCode === "" || !accessCode) {
    throw new Error(
      "Cannot integrate your ORCID iD to Pennsieve without an access code."
    );
  }

  // integrate the ORCID to Pennsieve using the access code
  let jwt = await get_access_token();
  let orcidResponse = client.post(`/user/orcid`, {
    params: {
      pennsieve_account: defaultBfAccount,
    },
    payload: {
      access_code: JSON.stringify({ authorizationCode: accessCode }),
    },
  });

  // get the status code
  let statusCode = orcidResponse.status;

  // check for any http errors and statuses
  switch (statusCode) {
    case 200:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The currently signed in user does not exist on Pennsieve.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot update the dataset description while unauthenticated. Please reauthenticate and try again.`
      );
    default:
      // something unexpected happened -- likely a 400 or something in the 500s
      let pennsieveErrorObject = orcidResponse.response.data.message;
      let { message } = pennsieveErrorObject;
      throw new Error(`${statusCode} - ${message}`);
  }
};

const create_validation_report = (error_report) => {
  // let accordion_elements = ` <div class="title active"> `;
  let accordion_elements = "";
  let elements = Object.keys(error_report).length;

  if ((elements = 0)) {
    accordion_elements += `<ul> <li>No errors found </li> </ul>`;
  } else if (elements == 1) {
    let key = Object.keys(error_report)[0];
    accordion_elements += `<ul> `;
    if ("messages" in error_report[key]) {
      for (let i = 0; i < error_report[key]["messages"].length; i++) {
        accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </li>`;
      }
    }
    accordion_elements += `</ul>`;
  } else {
    let keys = Object.keys(error_report);
    for (key_index in keys) {
      key = keys[key_index];
      if (key == keys[0]) {
        accordion_elements += `<ul> `;
        if ("messages" in error_report[key]) {
          for (let i = 0; i < error_report[key]["messages"].length; i++) {
            accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </p> </li>`;
          }
        }
        accordion_elements += `</ul> `;
      } else {
        accordion_elements += `<ul> `;
        if ("messages" in error_report[key]) {
          for (let i = 0; i < error_report[key]["messages"].length; i++) {
            accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </p></li>`;
          }
        }
        accordion_elements += `</ul>`;
      }
    }
    // accordion_elements += `</div>`;
  }
  $("#validation_error_accordion").html(accordion_elements);
  // $("#validation_error_accordion").accordion();
};

$("#validate_dataset_bttn").on("click", async () => {
  const axiosInstance = axios.create({
    baseURL: "http://127.0.0.1:5000/",
    timeout: 0,
  });

  log.info("validating dataset");
  log.info(bfDatasetSubtitle.value);

  $("#dataset_validator_status").text(
    "Please wait while we retrieve the dataset..."
  );
  $("#dataset_validator_spinner").show();

  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  temp_object = {
    "bf-account-selected": {
      "account-name": selectedBfAccount,
    },
    "bf-dataset-selected": {
      "dataset-name": selectedBfDataset,
    },
  };

  let datasetResponse;

  try {
    datasetResponse = await axiosInstance("api_ps_retrieve_dataset", {
      params: {
        obj: JSON.stringify(temp_object),
      },
      responseType: "json",
      method: "get",
    });
  } catch (err) {
    log.error(error);
    console.error(error);
    $("#dataset_validator_spinner").hide();
    $("#dataset_validator_status").html(
      `<span style='color: red;'> ${error}</span>`
    );
  }

  $("#dataset_validator_status").text(
    "Please wait while we validate the dataset..."
  );

  try {
    datasetResponse = axiosInstance("api_validate_dataset_pipeline", {
      params: {
        selectedBfAccount,
        selectedBfDataset,
      },
      responseType: "json",
      method: "get",
    });
  } catch (error) {
    log.error(error);
    console.error(error);
    // var emessage = userError(error);
    $("#dataset_validator_spinner").hide();
    $("#dataset_validator_status").html(
      `<span style='color: red;'> ${error}</span>`
    );
    // ipcRenderer.send(
    //   "track-event",
    //   "Error",
    //   "Validate Dataset",
    //   defaultBfDataset
    // );
  }

  create_validation_report(res);
  $("#dataset_validator_status").html("");
  $("#dataset_validator_spinner").hide();
});

function openFeedbackForm() {
  let feedback_btn = document.getElementById("feedback-btn");
  console.log(feedback_btn.classList);
  if (!feedback_btn.classList.contains("is-open")) {
    feedback_btn.click();
  }
  setTimeout(() => {
    document.getElementById("feedback-btn").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 5);
}
