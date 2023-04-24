//////////////////////////////////
// Import required modules
//////////////////////////////////

const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { ipcRenderer, BrowserWindow } = require("electron");
const Editor = require("@toast-ui/editor");
const remote = require("@electron/remote");
const { Notyf } = require("notyf");
const imageDataURI = require("image-data-uri");
const log = require("electron-log");
require("v8-compile-cache");
const Tagify = require("@yaireo/tagify");
const https = require("https");
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

const { homedir } = require("os");
const diskCheck = require("check-disk-space").default;
const validator = require("validator");
const doiRegex = require("doi-regex");
const lottie = require("lottie-web");
const select2 = require("select2")();
const DragSort = require("@yaireo/dragsort");
const spawn = require("child_process").spawn;
const execFile = require("child_process").execFile;
// TODO: Test with a build
const { datasetUploadSession } = require("./scripts/others/analytics/upload-session-tracker");

const {
  logCurationErrorsToAnalytics,
  logCurationSuccessToAnalytics,
} = require("./scripts/others/analytics/curation-analytics");
const { determineDatasetLocation } = require("./scripts/others/analytics/analytics-utils");
const {
  clientError,
  userErrorMessage,
} = require("./scripts/others/http-error-handler/error-handler");
const { hasConnectedAccountWithPennsieve } = require("./scripts/others/authentication/auth");
const api = require("./scripts/others/api/api");

const axios = require("axios").default;

const DatePicker = require("tui-date-picker"); /* CommonJS */
const excel4node = require("excel4node");

const { backOff } = require("exponential-backoff");

// const prevent_sleep_id = "";
// const electron_app = electron.app;
const app = remote.app;
const Clipboard = electron.clipboard;

var nextBtnDisabledVariable = true;
var reverseSwalButtons = false;
let organizeDSglobalPath = "";

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

//////////////////////////////////
// App launch actions
//////////////////////////////////

// Log file settings //
log.transports.console.level = false;
log.transports.file.maxSize = 1024 * 1024 * 10;
const homeDirectory = app.getPath("home");
const SODA_SPARC_API_KEY = "SODA-Pennsieve";

// get port number from the main process
log.info("Requesting the port");
const port = ipcRenderer.sendSync("get-port");
log.info("Port is: " + port);

// set to true once the SODA server has been connected to
let sodaIsConnected = false;
// set to true once the API version has been confirmed
let apiVersionChecked = false;

//log user's OS version //
log.info("User OS:", os.type(), os.platform(), "version:", os.release());
console.log("User OS:", os.type(), os.platform(), "version:", os.release());

// Check current app version //
const appVersion = app.getVersion();
console.log(appVersion);
log.info("Current SODA version:", appVersion);
console.log("Current SODA version:", appVersion);

// Here is where the lotties are created and loaded for the main tabs.
// A mutation observer watches for when the overview tab element has
// a class change to 'is-shown' to know when to load and unload the lotties
// let over_view_section = document.getElementById("getting_started-section");

// LOTTIES FOR DOCUMENTATION AND CONTACT US PAGE
let guidedModeSection = document.getElementById("guided_mode-section");
let docu_lottie_section = document.getElementById("documentation-section");
let contact_section = document.getElementById("contact-us-section");
let doc_lottie = document.getElementById("documentation-lottie");
let contact_lottie_container = document.getElementById("contact-us-lottie");
let madeWithLoveContainer = document.getElementById("made-with-love-lottie");

// LOTTIES FOR CURATE AND SHARE PAGE
let newDatasetLottieContainer = document.getElementById("new-dataset-lottie-container");
let existingDatasetLottieContainer = document.getElementById("existing-dataset-lottie");
let modifyDatasetLottieContainer = document.getElementById("edit-dataset-component-lottie");

//LOTTIES FOR OVERVIEW PAGE
// let column1 = document.getElementById("lottie1");
// let column2 = document.getElementById("lottie2");
// let column3 = document.getElementById("lottie3");
// let heart_lottie = document.getElementById("heart_lottie");

newDatasetLottieContainer.innerHTML = "";
existingDatasetLottieContainer.innerHTML = "";
modifyDatasetLottieContainer.innerHTML = "";

var newDatasetLottie = lottie.loadAnimation({
  container: newDatasetLottieContainer,
  animationData: newDataset,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

var existingDatasetLottie = lottie.loadAnimation({
  container: existingDatasetLottieContainer,
  animationData: existingDataset,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

let editDatasetLottie = lottie.loadAnimation({
  container: modifyDatasetLottieContainer,
  animationData: modifyDataset,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

var contact_lottie_animation = lottie.loadAnimation({
  container: contact_lottie_container,
  animationData: contact_lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});

var contactHeartLottie = lottie.loadAnimation({
  container: madeWithLoveContainer,
  animationData: heartLottie,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

var documentation_lottie = lottie.loadAnimation({
  container: doc_lottie,
  animationData: docu_lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});

// var column1_lottie = lottie.loadAnimation({
//   container: column1,
//   animationData: column1Lottie /*(json js variable, (view src/assets/lotties)*/,
//   renderer: "svg",
//   loop: true /*controls looping*/,
//   autoplay: true,
// });
// var column2_lottie = lottie.loadAnimation({
//   container: column2,
//   animationData: column2Lottie /*(json js variable, (view src/assets/lotties)*/,
//   renderer: "svg",
//   loop: true /*controls looping*/,
//   autoplay: true,
// });
// var column3_lottie = lottie.loadAnimation({
//   container: column3,
//   animationData: column3Lottie,
//   renderer: "svg",
//   loop: true,
//   autoplay: true,
// });
// var heart_container = lottie.loadAnimation({
//   container: heart_lottie,
//   animationData: heartLottie,
//   renderer: "svg",
//   loop: true,
//   autoplay: true,
// });

// A mutation observer (watches the classes of the given element)
// On changes this will do some work with the lotties
var sectionObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var attributeValue = $(mutation.target).prop(mutation.attributeName);

    if (attributeValue.includes("is-shown") == true) {
      //add lotties
      newDatasetLottie.play();
      existingDatasetLottie.play();
      editDatasetLottie.play();
      // heart_container.play();
    } else {
      newDatasetLottie.stop();
      existingDatasetLottie.stop();
      editDatasetLottie.stop();
      // heart_container.stop();
    }
  });
});

// contact_lottie_animation.pause();
// documentation_lottie.pause();
// contactHeartLottieLottie.pause();

var documentation_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown") == true) {
      //play lottie
      documentation_lottie.play();
    } else {
      // stop lottie to preserve memory
      documentation_lottie.stop();
    }
  });
});

var contact_us_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown") == true) {
      //play lottie
      contact_lottie_animation.play();
      contactHeartLottie.play();
    } else {
      //stop lottie to preserve memory
      contact_lottie_animation.stop();
      contactHeartLottie.stop();
    }
  });
});

sectionObserver.observe(guidedModeSection, {
  attributes: true,
  attributeFilter: ["class"],
});

documentation_lottie_observer.observe(docu_lottie_section, {
  attributes: true,
  attributeFilter: ["class"],
});

contact_us_lottie_observer.observe(contact_section, {
  attributes: true,
  attributeFilter: ["class"],
});

document.getElementById("guided_mode_view").click();

let launchAnnouncement = false;
ipcRenderer.on("checkForAnnouncements", (event, index) => {
  launchAnnouncement = true;
  let nodeStorage = new JSONStorage(app.getPath("userData"));
  nodeStorage.setItem("announcements", false);
});

//////////////////////////////////
// Connect to Python back-end
//////////////////////////////////

let client = null;

// get port number from the main process

// TODO: change the default port so it is based off the discovered port in Main.js
client = axios.create({
  baseURL: `http://127.0.0.1:${port}/`,
  timeout: 300000,
});

const notyf = new Notyf({
  position: { x: "right", y: "bottom" },
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
      type: "info",
      background: "#13716D",
      icon: {
        className: "fas fa-info-circle",
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
    title: `Initializing SODA's background services...`,
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
  //while variable is false keep requesting, if time exceeds two minutes break
  let status = false;
  let time_start = new Date();
  let error = "";
  while (true) {
    try {
      status = await serverIsLiveStartup();
    } catch (e) {
      error = e;
      status = false;
    }
    time_pass = new Date() - time_start;
    if (status) break;
    if (time_pass > 120000) break; //break after two minutes
    await wait(2000);
  }

  if (!status) {
    //two minutes pass then handle connection error
    // SWAL that the server needs to be restarted for the app to work
    clientError(error);
    ipcRenderer.send("track-event", "Error", "Establishing Python Connection", error);

    await Swal.fire({
      icon: "error",
      html: `Something went wrong while initializing SODA's background services. Please restart SODA and try again. If this issue occurs multiple times, please email <a href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`,
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

  // let nodeStorage = new JSONStorage(app.getPath("userData"));
  // launchAnnouncement = nodeStorage.getItem("announcements");
  if (launchAnnouncement) {
    // nodeStorage.setItem("announcements", false);
    await checkForAnnouncements("announcements");
    launchAnnouncement = false;
    nodeStorage.setItem("announcements", false);
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
    clientError(error);
    ipcRenderer.send("track-event", "Error", "Setting Templates Path");
    return;
  }

  ipcRenderer.send("track-event", "Success", "Setting Templates Path");
});

const getPennsieveAgentPath = () => {
  if (process.platform === "win32" || process.platform === "cygwin") {
    const bit64Path = path.join("C:\\Program Files\\Pennsieve\\pennsieve.exe");
    if (fs.existsSync(bit64Path)) {
      return bit64Path;
    }
    const bit32Path = path.join("C:\\Program Files (x86)\\Pennsieve\\pennsieve.exe");
    if (fs.existsSync(bit32Path)) {
      return bit32Path;
    }
  } else {
    const unixPath = "/usr/local/bin/pennsieve";
    if (fs.existsSync(unixPath)) {
      return unixPath;
    }
  }
  throw new Error(`Cannot find pennsieve agent executable`);
};

const stopPennsieveAgent = async (pathToPennsieveAgent) => {
  return new Promise((resolve, reject) => {
    try {
      const agentStopSpawn = spawn(pathToPennsieveAgent, ["agent", "stop"]);
      agentStopSpawn.stdout.on("data", (data) => {
        log.info(data.toString());
        resolve();
      });
      agentStopSpawn.stderr.on("data", (data) => {
        log.info(data.toString());
        reject(new Error(data.toString()));
      });
    } catch (error) {
      log.info(error);
      reject(error);
    }
  });
};

const startPennsieveAgent = async (pathToPennsieveAgent) => {
  return new Promise((resolve, reject) => {
    try {
      const agentStartSpawn = spawn(pathToPennsieveAgent, ["agent", "start"]);
      agentStartSpawn.stdout.on("data", (data) => {
        log.info(data.toString());
        resolve();
      });
      agentStartSpawn.stderr.on("data", (data) => {
        log.info(data.toString());
        reject(new Error(data.toString()));
      });
    } catch (error) {
      log.error(error);
      reject(error);
    }
  });
};

const getPennsieveAgentVersion = async (pathToPennsieveAgent) => {
  return new Promise((resolve, reject) => {
    try {
      // Timeout if the agent was not able to be retrieved within 7 seconds
      const versionCheckTimeout = setTimeout(() => {
        reject(
          new Error(
            "Timeout Error: The agent version was not able to be verified in the allotted time"
          )
        );
      }, 7000);

      const agentVersionSpawn = execFile(pathToPennsieveAgent, ["version"]);
      agentVersionSpawn.stdout.on("data", (data) => {
        log.info(data.toString());
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
      agentVersionSpawn.stderr.on("data", (data) => {
        clearTimeout(versionCheckTimeout);
        log.info(data.toString());
        reject(new Error(data.toString()));
      });
    } catch (error) {
      log.error(error);
      reject(error);
    }
  });
};

// Start the Pennsieve agent and check the version
// If any of the mandatory steps fail, the user will be notified on how to alleviate the issue
// and the promise will be rejected
const startPennsieveAgentAndCheckVersion = async () => {
  return new Promise(async (resolve, reject) => {
    // First get the latest Pennsieve agent version on GitHub
    // This is to ensure the user has the latest version of the agent
    let browser_download_url;
    let latest_agent_version;
    try {
      [browser_download_url, latest_agent_version] = await get_latest_agent_version();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        text: "We are unable to get the latest version of the Pennsieve Agent. Please try again later. If this issue persists please contact the SODA team at help@fairdataihub.org",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        confirmButtonText: "Ok",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      log.error(error);
      reject(error);
    }

    // Get the path to the Pennsieve agent
    // If the path that the Pennsieve agent should be at is not found,
    // alert the user and open the download page for the Pennsieve agent
    try {
      agentPath = getPennsieveAgentPath();
    } catch (error) {
      const { value: result } = await Swal.fire({
        icon: "error",
        title: "Pennsieve Agent Not Found",
        text: "It looks like the Pennsieve Agent is not installed on your computer. Please download the latest version of the Pennsieve Agent and install it. Once you have installed the Pennsieve Agent, please restart SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        confirmButtonText: "Download now",
        cancelButtonText: "Skip for now",
      });
      if (result) {
        shell.openExternal(browser_download_url);
        shell.openExternal("https://docs.pennsieve.io/docs/uploading-files-programmatically");
      }
      log.error(error);
      reject(error);
    }

    // Stop the Pennsieve agent if it is running
    // This is to ensure that the agent is not running when we try to start it so no funny business happens
    try {
      await stopPennsieveAgent(agentPath);
    } catch (error) {
      // If the agent is not running then we can ignore this error
      // But it shouldn't throw if the agent is running or not
      log.error(error);
    }

    // Start the Pennsieve agent
    try {
      await startPennsieveAgent(agentPath);
    } catch (error) {
      log.error(error);
      reject(error);
    }

    // Get the version of the Pennsieve agent
    let pennsieveAgentVersion;
    try {
      pennsieveAgentVersionObj = await getPennsieveAgentVersion(agentPath);
      pennsieveAgentVersion = pennsieveAgentVersionObj["Agent Version"];
    } catch (error) {
      log.error(error);
      reject(error);
    }

    if (pennsieveAgentVersion !== latest_agent_version) {
      let { value: result } = await Swal.fire({
        icon: "warning",
        text: "It appears that you are not running the latest version of the Pensieve Agent. Please download the latest version of the Pennsieve Agent and install it. Once you have installed the Pennsieve Agent, please restart SODA.",
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
      });
      if (result) {
        shell.openExternal(browser_download_url);
        shell.openExternal("https://docs.pennsieve.io/docs/uploading-files-programmatically");
      }
      reject("The installed version of the Pennsieve agent is not the latest version.");
    }

    // The Pennsieve agent is now running so we can now resolve the promise
    resolve();
  });
};

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
const run_pre_flight_checks = async (check_update = true) => {
  log.info("Running pre flight checks");
  let connection_response = "";
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
    });

    return false;
  }

  // TODO: Remove? Test first.
  await wait(500);

  // TODO: Start the agent here or while determining installation and agent version.

  // Check for an API key pair first. Calling the agent check without a config file, causes it to crash.
  account_present = await check_api_key();

  // TODO: Reimplement this section to work with the new agent
  if (!account_present) {
    if (check_update) {
      checkNewAppVersion();
    }

    // If there is no API key pair, show the warning and let them add a key. Messages are dissmisable.
    let { value: result } = await Swal.fire({
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
    });

    // TODO: Especially test this part cuz its getting tricky in the conversion
    if (result) {
      await openDropdownPrompt(null, "bf");
      return false;
    } else {
      return true;
    }
  }

  // set the preferred organization spans

  // an account is present
  // Check for an installed Pennsieve agent
  let pennsieveAgentCheckNotyf;
  try {
    // Open a notyf to let the user know that we are checking for the agent that closes only if the agent is found.
    pennsieveAgentCheckNotyf = notyf.open({
      type: "info",
      message: "Checking to make sure the latest Pennsieve Agent is installed...",
      duration: 0, // 0 means it will not close automatically
    });
    await startPennsieveAgentAndCheckVersion();
    notyf.dismiss(pennsieveAgentCheckNotyf);
    notyf.open({
      type: "success",
      message: "The latest Pennsieve Agent is installed.",
    });
  } catch (error) {
    notyf.dismiss(pennsieveAgentCheckNotyf);
    notyf.open({
      type: "error",
      message: "Unable to start the Pennsieve Agent.",
    });
    log.error(error);

    return false;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (check_update) {
    checkNewAppVersion();
  }

  await wait(500);

  notyf.open({
    type: "final",
    message: "You're all set!",
  });

  // let nodeStorage = new JSONStorage(app.getPath("userData"));
  // launchAnnouncement = nodeStorage.getItem("announcements");
  if (launchAnnouncement) {
    // nodeStorage.setItem("announcements", false);
    await checkForAnnouncements("announcements");
    launchAnnouncement = false;
  }
  return true;
};

// Check if the Pysoda server is live
const serverIsLiveStartup = async () => {
  let echoResponseObject;

  try {
    echoResponseObject = await client.get("/startup/echo?arg=server ready");
  } catch (error) {
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
    ipcRenderer.send("track-event", "Error", "Verifying App Version", userErrorMessage(e));

    await Swal.fire({
      icon: "error",
      html: `Something went wrong while initializing SODA's background services. Please try restarting your computer and reinstalling the latest version of SODA. If this issue occurs multiple times, please email <a href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`,
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
    console.error("Server version does not match client version");
    ipcRenderer.send(
      "track-event",
      "Error",
      "Verifying App Version",
      "Server version does not match client version"
    );

    await Swal.fire({
      icon: "error",
      html: `${appVersion} ${serverAppVersion}The minimum app versions do not match. Please try restarting your computer and reinstalling the latest version of SODA or check to see if a previous version is running in the background with the instructions on our <a href='https://docs.sodaforsparc.io/docs/common-errors/pennsieve-agent-is-already-running' target='_blank'>documentation page.</a> If this issue occurs multiple times, please email <a href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Close now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    //await checkForAnnouncements("update")

    throw new Error();
  }

  ipcRenderer.send("track-event", "Success", "Verifying App Version");

  notyf.dismiss(notification);

  // create a success notyf for api version check
  notyf.open({
    message: "API Versions match",
    type: "success",
  });

  //Load Default/global Pennsieve account if available
  if (hasConnectedAccountWithPennsieve()) {
    updateBfAccountList();
  }
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

  return require("dns").resolve("www.google.com", async (err) => {
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

  if (!hasConnectedAccountWithPennsieve()) {
    notyf.dismiss(notification);
    notyf.open({
      type: "error",
      message: "No account was found",
    });
    return false;
  }

  try {
    responseObject = await client.get("manage_datasets/bf_account_list");
  } catch (e) {
    notyf.dismiss(notification);
    notyf.open({
      type: "error",
      message: "No account was found",
    });
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

// return the agent version or an error if the agent is not installed
const check_agent_installed = async () => {
  let notification = null;
  notification = notyf.open({
    type: "ps_agent",
    message: "Searching for Pennsieve Agent...",
  });

  try {
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

  // IMP: error in subfunction is handled by caller
  [browser_download_url, latest_agent_version] = await get_latest_agent_version();

  if (agent_version.indexOf(latest_agent_version) === -1) {
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
  let browser_download_url = undefined;

  // let the error raise up to the caller if one occurs
  let releasesResponse = await axios.get(
    "https://api.github.com/repos/Pennsieve/pennsieve-agent/releases"
  );

  let releases = releasesResponse.data;
  let release = releases[0];
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
      if (path.extname(file_name) == ".msi" || path.extname(file_name) == ".exe") {
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

  if (browser_download_url == undefined || latest_agent_version == undefined) {
    throw new Error("Trouble getting the latest agent version.");
  }

  return [browser_download_url, latest_agent_version];
};

const checkNewAppVersion = () => {
  ipcRenderer.send("app_version");
};

// Check app version on current app and display in the side bar
ipcRenderer.on("app_version", (event, arg) => {
  const version = document.getElementById("version");
  ipcRenderer.removeAllListeners("app_version");
  version.innerText = arg.version;
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
ipcRenderer.on("update_downloaded", async () => {
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
  update_downloaded_notification.on("click", async ({ target, event }) => {
    restartApp();
    //a sweet alert will pop up announcing user to manually update if SODA fails to restart
    checkForAnnouncements("update");
  });
});

// Restart the app for update. Does not restart on macos
const restartApp = async () => {
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

/////// New Organize Datasets /////////////////////

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
const organizeNextStepBtn = document.getElementById("button-organize-confirm-create");
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
const validateCurrentDSBtn = document.getElementById("button-validate-current-ds");
const validateCurrentDatasetReport = document.querySelector("#textarea-validate-current-dataset");
const currentDatasetReportBtn = document.getElementById("button-generate-report-current-ds");
const validateLocalDSBtn = document.getElementById("button-validate-local-ds");
const validateLocalDatasetReport = document.querySelector("#textarea-validate-local-dataset");
const localDatasetReportBtn = document.getElementById("button-generate-report-local-ds");
const validateLocalProgressBar = document.getElementById("div-indetermiate-bar-validate-local");
const validateSODAProgressBar = document.getElementById("div-indetermiate-bar-validate-soda");

// Generate dataset //

var subjectsTableData = [];
var samplesTableData = [];

const newDatasetName = document.querySelector("#new-dataset-name");
const manifestStatus = document.querySelector("#generate-manifest");

// Manage datasets //
var myitem;
var datasetList = [];
var organizationList = [];
var sodaCopy = {};
var datasetStructCopy = {};
const bfUploadRefreshDatasetBtn = document.getElementById("button-upload-refresh-dataset-list");

const pathSubmitDataset = document.querySelector("#selected-local-dataset-submit");
const progressUploadBf = document.getElementById("div-progress-submit");
const progressBarUploadBf = document.getElementById("progress-bar-upload-bf");
const datasetPermissionDiv = document.getElementById("div-permission-list-2");
const bfDatasetSubtitle = document.querySelector("#bf-dataset-subtitle");
const bfDatasetSubtitleCharCount = document.querySelector("#para-char-count-metadata");

const bfCurrentBannerImg = document.getElementById("current-banner-img");

const bfViewImportedImage = document.querySelector("#image-banner");
const guidedBfViewImportedImage = document.querySelector("#guided-image-banner");

const bfSaveBannerImageBtn = document.getElementById("save-banner-image");
const datasetBannerImageStatus = document.querySelector("#para-dataset-banner-image-status");
const formBannerHeight = document.getElementById("form-banner-height");
const guidedFormBannerHeight = document.getElementById("guided-form-banner-height");
const currentDatasetLicense = document.querySelector("#para-dataset-license-current");
const bfListLicense = document.querySelector("#bf-license-list");
const bfAddLicenseBtn = document.getElementById("button-add-license");

// Pennsieve dataset permission //
const currentDatasetPermission = document.querySelector("#para-dataset-permission-current");
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
const bfAddPermissionTeamBtn = document.getElementById("button-add-permission-team");
// Guided mode dropdowns
const guidedBfListUsersPi = document.querySelector("#guided_bf_list_users_pi");
const guidedBfListUsersAndTeams = document.querySelector("#guided_bf_list_users_and_teams");

//Pennsieve dataset status
const bfCurrentDatasetStatusProgress = document.querySelector(
  "#div-bf-current-dataset-status-progress"
);
const bfListDatasetStatus = document.querySelector("#bf_list_dataset_status");

//Pennsieve post curation
const bfRefreshPublishingDatasetStatusBtn = document.querySelector(
  "#button-refresh-publishing-status"
);
const bfWithdrawReviewDatasetBtn = document.querySelector("#btn-withdraw-review-dataset");

//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackColor = "#000";
const redColor = "#ff1a1a";
const sparcFolderNames = ["code", "derivative", "docs", "primary", "protocol", "source"];
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
var protocolConfigFileName = "protocol-config.json";
var affiliationConfigPath = path.join(metadataPath, affiliationFileName);
var milestonePath = path.join(metadataPath, milestoneFileName);
var progressFilePath = path.join(homeDirectory, "SODA", "Progress");
var guidedProgressFilePath = path.join(homeDirectory, "SODA", "Guided-Progress");
const guidedManifestFilePath = path.join(homeDirectory, "SODA", "guided_manifest_files");
var protocolConfigPath = path.join(metadataPath, protocolConfigFileName);
var allCollectionTags = {};
var currentTags = {};
var currentCollectionTags = [];

if (process.platform === "linux") {
  //check if data exists inside of the Soda folder, and if it does, move it into the capitalized SODA folder
  if (fs.existsSync(path.join(homeDirectory, "Soda"))) {
    //copy the folder contents of home/Soda to home/SODA
    fs.copySync(path.join(homeDirectory, "Soda"), path.join(homeDirectory, "SODA"));
    //delete the old folder
    fs.removeSync(path.join(homeDirectory, "Soda"));
  }
}

const createDragSort = (tagify) => {
  const onDragEnd = () => {
    tagify.updateValueByDOMTags();
  };
  new DragSort(tagify.DOM.scope, {
    selector: "." + tagify.settings.classNames.tag,
    callbacks: {
      dragEnd: onDragEnd,
    },
  });
};

const guidedSubmissionTagsInputManual = document.getElementById(
  "guided-tagify-submission-milestone-tags-manual"
);
const guidedSubmissionTagsTagifyManual = new Tagify(guidedSubmissionTagsInputManual, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});
createDragSort(guidedSubmissionTagsTagifyManual);

// initiate Tagify input fields for Dataset description file
var keywordInput = document.getElementById("ds-keywords"),
  keywordTagify = new Tagify(keywordInput, {
    duplicates: false,
  });

createDragSort(keywordTagify);

var otherFundingInput = document.getElementById("ds-other-funding"),
  otherFundingTagify = new Tagify(otherFundingInput, {
    duplicates: false,
  });
createDragSort(otherFundingTagify);

var collectionDatasetInput = document.getElementById("tagify-collection-tags"),
  collectionDatasetTags = new Tagify(collectionDatasetInput, {
    whitelist: [],
    duplicates: false,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
      enforceWhitelist: true,
      maxItems: Infinity,
    },
    autoComplete: {
      enabled: true,
      rightKey: true,
    },
  });
createDragSort(collectionDatasetTags);

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
      maxItems: Infinity,
      enabled: 0,
      closeOnSelect: true,
    },
  });
createDragSort(studyOrganSystemsTagify);

var studyTechniquesInput = document.getElementById("ds-study-technique"),
  studyTechniquesTagify = new Tagify(studyTechniquesInput, {
    duplicates: false,
  });
createDragSort(studyTechniquesTagify);

var studyApproachesInput = document.getElementById("ds-study-approach"),
  studyApproachesTagify = new Tagify(studyApproachesInput, {
    duplicates: false,
  });
createDragSort(studyApproachesTagify);

// tagify the input inside of the "Add/edit tags" manage dataset section
var datasetTagsInput = document.getElementById("tagify-dataset-tags"),
  // initialize Tagify on the above input node reference
  datasetTagsTagify = new Tagify(datasetTagsInput);
createDragSort(datasetTagsTagify);

var guidedDatasetTagsInput = document.getElementById("guided-tagify-dataset-tags"),
  // initialize Tagify on the above input node reference
  guidedDatasetTagsTagify = new Tagify(guidedDatasetTagsInput);
createDragSort(guidedDatasetTagsTagify);

/////////////////// Provide Grant Information section /////////////////////////
//////////////// //////////////// //////////////// //////////////// ///////////

////////////////////////Import Milestone Info//////////////////////////////////
const descriptionDateInput = document.getElementById("submission-completion-date");

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
createDragSort(milestoneTagify1);

// generate subjects file
ipcRenderer.on("selected-generate-metadata-subjects", (event, dirpath, filename) => {
  if (dirpath.length > 0) {
    var destinationPath = path.join(dirpath[0], filename);
    if (fs.existsSync(destinationPath)) {
      var emessage =
        "File '" + filename + "' already exists in " + dirpath[0] + ". Do you want to replace it?";
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
});

async function generateSubjectsFileHelper(uploadBFBoolean) {
  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the subjects file to Pennsieve
    const supplementary_checks = await run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }
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
      title: "Any existing subjects.xlsx file in the specified location will be replaced.",
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

  let bfdataset = document.getElementById("bf_dataset_load_subjects").innerText.trim();
  try {
    log.info(`Generating a subjects file.`);
    let save_locally = await client.post(
      `/prepare_metadata/subjects_file`,
      {
        filepath: subjectsDestinationPath,
        selected_account: defaultBfAccount,
        selected_dataset: bfdataset,
        subjects_header_row: subjectsTableData,
      },
      {
        params: {
          upload_boolean: uploadBFBoolean,
        },
      }
    );

    let res = save_locally.data;

    Swal.fire({
      title: "The subjects.xlsx file has been successfully generated at the specified location.",
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
    let emessage = userErrorMessage(error);

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
ipcRenderer.on("selected-generate-metadata-samples", (event, dirpath, filename) => {
  if (dirpath.length > 0) {
    var destinationPath = path.join(dirpath[0], filename);
    if (fs.existsSync(destinationPath)) {
      var emessage =
        "File '" + filename + "' already exists in " + dirpath[0] + ". Do you want to replace it?";
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
});

async function generateSamplesFileHelper(uploadBFBoolean) {
  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the samples file to Pennsieve
    const supplementary_checks = await run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }
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
      title: "Any existing samples.xlsx file in the specified location will be replaced.",
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

  try {
    let samplesFileResponse = await client.post(
      "prepare_metadata/samples_file",
      {
        filepath: samplesDestinationPath,
        selected_account: defaultBfAccount,
        selected_dataset: $("#bf_dataset_load_samples").text().trim(),
        samples_str: samplesTableData,
      },
      {
        params: {
          upload_boolean: uploadBFBoolean,
        },
      }
    );

    Swal.fire({
      title: "The samples.xlsx file has been successfully generated at the specified location.",
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
    const { size } = samplesFileResponse.data;
    logMetadataSizeForAnalytics(uploadBFBoolean, "samples.xlsx", size);
  } catch (error) {
    clientError(error);
    var emessage = userErrorMessage(error);
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
  }
}

// import Primary folder
ipcRenderer.on("selected-local-primary-folder", (event, primaryFolderPath) => {
  if (primaryFolderPath.length > 0) {
    importPrimaryFolderSubjects(primaryFolderPath[0]);
  }
});
ipcRenderer.on("selected-local-primary-folder-samples", (event, primaryFolderPath) => {
  if (primaryFolderPath.length > 0) {
    importPrimaryFolderSamples(primaryFolderPath[0]);
  }
});

function transformImportedExcelFile(type, result) {
  for (var column of result.slice(1)) {
    var indices = getAllIndexes(column, "");
    // check if the first 2 columns are empty
    if (indices.length > 18 && type === "samples" && (indices.includes(0) || indices.includes(1))) {
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
  for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase());
  }

  try {
    let import_subjects_file = await client.get(`/prepare_metadata/subjects_file`, {
      params: {
        type: "subjects",
        filepath: filePath,
        ui_fields: JSON.stringify(fieldSubjectEntries),
      },
    });

    let res = import_subjects_file.data.subject_file_rows;
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
  for (var field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase());
  }
  try {
    let importSamplesResponse = await client.get(`/prepare_metadata/samples_file`, {
      params: {
        type: "samples.xlsx",
        filepath: filePath,
        ui_fields: JSON.stringify(fieldSampleEntries),
      },
    });

    let res = importSamplesResponse.data.sample_file_rows;
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

const createSpeciesAutocomplete = (id, curationMode) => {
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
            "loadTaxonomySpecies('" + data.query + "', '" + id + "', '" + curationMode + "')"
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
};

function createStrain(id, type, curationMode) {
  var autoCompleteJS4 = new autoComplete({
    selector: "#" + id,
    data: {
      src: ["Wistar", "Yucatan", "C57/B6J", "C57 BL/6J", "mixed background", "Sprague-Dawley"],
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
            "populateRRID('" + data.query + "', '" + type + "', '" + curationMode + "')"
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
      populateRRID(strain, type, curationMode);
    }
    autoCompleteJS4.input.value = selection;
  });
}

const loadTaxonomySpecies = async (commonName, destinationInput, curationMode) => {
  let curationModeSelectorPrefix = "";
  if (curationMode === "guided") {
    curationModeSelectorPrefix = "guided-";
  }

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
      params: {
        animals_list: commonName,
      },
    });
    let res = load_taxonomy_species.data;

    if (Object.keys(res).length === 0) {
      Swal.close();
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
        if ($(`#${curationModeSelectorPrefix}bootbox-subject-species`).val() === "") {
          $(`#${curationModeSelectorPrefix}bootbox-subject-species`).css("display", "none");
        }
        // set the Edit species button back to "+ Add species"
        $("#button-add-species-subject").html(
          `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
        );
      }
      if (destinationInput.includes("sample")) {
        if ($(`#${curationModeSelectorPrefix}bootbox-sample-species`).val() === "") {
          $(`#${curationModeSelectorPrefix}bootbox-sample-species`).css("display", "none");
        }
        // set the Edit species button back to "+ Add species"

        $("#button-add-species-sample").html(
          `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
        );
      }
    } else {
      Swal.close();

      if (destinationInput.includes("subject")) {
        $(`#${curationModeSelectorPrefix}bootbox-subject-species`).val(
          res[commonName]["ScientificName"]
        );
        // $("#bootbox-subject-species").css("display", "inline-block");
        switchSpeciesStrainInput("species", "edit", curationMode);
      }

      if (destinationInput.includes("subject")) {
        $(`#${curationModeSelectorPrefix}bootbox-sample-species`).val(
          res[commonName]["ScientificName"]
        );
        // $(`#${curationModeSelectorPrefix}bootbox-subject-species`).css("display", "inline-block");
        switchSpeciesStrainInput("species", "edit", curationMode);
      }

      $("#" + destinationInput).val(res[commonName]["ScientificName"]);
      $("#btn-confirm-species").removeClass("confirm-disabled");
    }
  } catch (error) {
    Swal.close();
    Swal.fire({
      title: "An error occurred while requesting the scientific name for '" + commonName + "'",
      text: userErrorMessage(error),
      icon: "error",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    clientError(error);
  }
};

// Function to add options to dropdown list
function addOption(selectbox, text, value) {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
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
    i < document.getElementById("table-current-contributors").rows[1].cells.length;
    i++
  ) {
    $($($("#table-current-contributors").find("tr")[1].cells[i]).find("input")[0]).val("");
    $($($("#table-current-contributors").find("tr")[1].cells[i]).find("textarea")[0]).val("");
  }

  var selectID = document.getElementById(
    $($($("#table-current-contributors").find("tr")[1].cells[1]).find("select")[0]).prop("id")
  );
  if (selectID) {
    removeOptions(selectID);
    $($($("#table-current-contributors").find("tr")[1].cells[1]).find("select")[0]).prop(
      "disabled",
      true
    );
  }
}

// on change event when users choose a contributor's last name
const onchangeLastNames = () => {
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
};

//// De-populate dataset dropdowns to clear options
const clearDatasetDropdowns = () => {
  for (let list of [curateDatasetDropdown]) {
    removeOptions(list);
    addOption(list, "Search here...", "Select dataset");
    list.options[0].disabled = true;
  }
};

const clearOrganizationDropdowns = () => {
  for (let list of [curateOrganizationDropdown]) {
    removeOptions(list);
    addOption(list, "Search here...", "Select organization");
    list.options[0].disabled = true;
  }
};

//////////////////////// Current Contributor(s) /////////////////////

const delete_current_con = (no) => {
  // after a contributor is deleted, add their name back to the contributor last name dropdown list
  if (
    $("#ds-description-contributor-list-last-" + no).length > 0 &&
    $("#ds-description-contributor-list-first-" + no).length > 0
  ) {
    var deletedLastName = $("#ds-description-contributor-list-last-" + no).val();
    var deletedFirstName = $("#ds-description-contributor-list-first-" + no).val();
    globalContributorNameObject[deletedLastName] = deletedFirstName;
    currentContributorsLastNames.push(deletedLastName);
  }
  document.getElementById("row-current-name" + no + "").outerHTML = "";
};

const delete_link = (no) => {
  document.getElementById("row-current-link" + no + "").outerHTML = "";
};

//////////////////////// Article(s) and Protocol(s) /////////////////////

//// function to leave fields empty if no data is found on Airtable
const leaveFieldsEmpty = (field, element) => {
  if (field !== undefined) {
    element.value = field;
  } else {
    element.value = "";
  }
};

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
    updateOrderIDTable(document.getElementById("table-subjects"), subjectsTableData, "subjects");
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
    updateOrderIDTable(document.getElementById("table-samples"), samplesTableData, "samples");
  }
  $(document).mousemove(move).mouseup(up);
});

// $("#contributor-table-dd").mousedown(function (e) {
//   var length = document.getElementById("contributor-table-dd").rows.length - 1;
//   var tr = $(e.target).closest("tr"),
//     sy = e.pageY,
//     drag;
//   if ($(e.target).is("tr")) tr = $(e.target);
//   var index = tr.index();
//   $(tr).addClass("grabbed");
//   function move(e) {
//     if (!drag && Math.abs(e.pageY - sy) < 10) return;
//     drag = true;
//     tr.siblings().each(function () {
//       var s = $(this),
//         i = s.index(),
//         y = s.offset().top;
//       if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
//         if (i !== 0) {
//           if ($(e.target).closest("tr")[0].rowIndex !== length) {
//             if (i < tr.index()) {
//               s.insertAfter(tr);
//             } else {
//               s.insertBefore(tr);
//             }
//             return false;
//           }
//         }
//       }
//     });
//   }
//   function up(e) {
//     if (drag && index != tr.index() && tr.index() !== length) {
//       drag = false;
//     }
//     $(document).unbind("mousemove", move).unbind("mouseup", up);
//     $(tr).removeClass("grabbed");
//     updateIndexForTable(document.getElementById("contributor-table-dd"));
//     updateOrderContributorTable(document.getElementById("contributor-table-dd"), contributorArray);
//   }
//   $(document).mousemove(move).mouseup(up);
// });

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
        if (inforObj[element].length === 0 || inforObj[element] === "Select dataset") {
          fieldSatisfied = false;
          emptyFieldArray.push(element);
        }
      }
    }
  }
  return [fieldSatisfied, emptyFieldArray];
};

const emptyLinkInfo = () => {
  var tableCurrentLinks = document.getElementById("protocol-link-table-dd");
  var fieldSatisfied = false;
  if (tableCurrentLinks.rows.length > 1) {
    fieldSatisfied = true;
  }
  return fieldSatisfied;
};

const emptyInfoEntries = (element) => {
  var fieldSatisfied = true;
  if (element === "") {
    fieldSatisfied = false;
  }
  return fieldSatisfied;
};

/// detect empty required fields and raise a warning
const detectEmptyRequiredFields = (funding) => {
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
  var contributorNumber = document.getElementById("contributor-table-dd").rows.length;
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
    "- Missing required fields under Dataset Info section: " + dsEmptyField.join(", "),
    "- Missing required fields under Contributor Info section: " + conEmptyField.join(", "),
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
};

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
const curateOrganizationDropdown = document.getElementById("curatebforganizationlist");

async function updateDatasetCurate(datasetDropdown, bfaccountDropdown) {
  let defaultBfAccount = bfaccountDropdown.options[bfaccountDropdown.selectedIndex].text;
  try {
    let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
      params: {
        selected_account: defaultBfAccount,
      },
    });
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

// This function is called when the user selects a dataset from the dropdown list
// It is called to update the UI elements that are related to the publishing status
// of the dataset and displaying the correct UI elements
const postCurationListChange = () => {
  // display the pre-publishing page
  showPrePublishingPageElements();
  showPublishingStatus();
};

// upload banner image //
const Cropper = require("cropperjs");
const { default: Swal } = require("sweetalert2");
const { waitForDebugger } = require("inspector");
const { resolve } = require("path");
const { background } = require("jimp");
const { rename } = require("fs");
const { resolveSoa } = require("dns");
const internal = require("stream");
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
    //if image-height exceeds 2048 then prompt about scaling image down
    if (image_height < 512) {
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
const guidedCropOptions = {
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

    guidedFormBannerHeight.value = image_height;

    if (image_height < 512) {
      $("#guided-save-banner-image").prop("disabled", true);
      $("#guided-form-banner-height").css("color", "red");
      $("#guided-form-banner-height").css("border", "1px solid red");
      $(".crop-image-text").css("color", "red");
    } else {
      $("#guided-save-banner-image").prop("disabled", false);
      $("#guided-form-banner-height").css("color", "black");
      $("#guided-form-banner-height").css("border", "1px solid black");
      $(".crop-image-text").css("color", "black");
    }
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

const submitReviewDatasetCheck = async (res, curationMode) => {
  let reviewstatus = res["review_request_status"];
  let publishingStatus = res["publishing_status"];
  if (res["publishing_status"] === "PUBLISH_IN_PROGRESS") {
    Swal.fire({
      icon: "error",
      title: "Your dataset is currently being published. Please wait until it is completed.",
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
  } else if (res["review_request_status"] === "requested") {
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
  } else if (res["publishing_status"] === "PUBLISH_SUCCEEDED") {
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
      title: `Submit your dataset for review`,
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
        const checkedRadioButton = $("input:radio[name ='publishing-options']:checked").val();

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
    // Swal.fire({
    //   title: `Submitting dataset for pre-publishing review`,
    //   html: "Please wait...",
    //   // timer: 5000,
    //   allowEscapeKey: false,
    //   allowOutsideClick: false,
    //   heightAuto: false,
    //   backdrop: "rgba(0,0,0, 0.4)",
    //   timerProgressBar: false,
    //   didOpen: () => {
    //     Swal.showLoading();
    //   },
    // });
    // submit the dataset for review with the given embargoReleaseDate
    await submitReviewDataset(embargoReleaseDate, curationMode);
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
      title: `Submit your dataset for review`,
      reverseButtons: reverseSwalButtons,
      html: `
              <div style="display: flex; flex-direction: column;  font-size: 15px;">
                <p style="text-align:left">Your dataset will be submitted for review to the SPARC Curation Team. While under review, the dataset will become locked until it has either been approved or rejected for publication. </p>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="checkbox" id="confirm-to-awknowledge" name="publishing-options" value="immediate" style=" border: 0px; width: 18px; height: 18px;">
                  <div style="margin-left: 5px;"><label for="immediate">I understand that submitting to the Curation Team will lock this dataset</label></div>
                </div>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="checkbox" id="embargo-date-check" name="publishing-options" value="embargo-date-check" style=" border: 0px; width: 22px; height: 22px;">
                  <div style="margin-left: 5px;"><label for="embargo-date-check" style="text-align:left">Place this dataset under embargo so that it is not made public immediately after publishing.</label> <br> <a href="https://docs.pennsieve.io/docs/what-is-an-embargoed-dataset" target="_blank">What is this?</a></div>
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
      didOpen: () => {
        // Add an event listener to id confirm-to-awknowledge
        document.querySelector(".swal2-confirm").disabled = true;
        document.getElementById("confirm-to-awknowledge").addEventListener("click", () => {
          // if the checkbox is checked, enable the submit button
          if (document.getElementById("confirm-to-awknowledge").checked) {
            document.querySelector(".swal2-confirm").disabled = false;
          } else {
            // if the checkbox is not checked, disable the submit button
            document.querySelector(".swal2-confirm").disabled = true;
          }
        });
      },
      willClose: () => {
        // check if the embargo checkbox button is selected or not
        // const checkedRadioButton = $("input:checkbox[name ='publishing-options']:checked").val();

        // const checkedRadioButton = $("input:checkbox[name ='publishing-options']:checked");
        console.log(document.getElementById("embargo-date-check").checked);

        if (document.getElementById("embargo-date-check").checked) {
          // set the embargoDate variable if so
          embargoReleaseDate = $("#tui-date-picker-target").val();
        }
      },
    });

    // check if the user cancelled
    if (!userResponse.isConfirmed) {
      // do not submit the dataset
      return [false, ""];
    }

    if (userResponse.isConfirmed && curationMode === "guided") {
      return [true, embargoReleaseDate];
    }

    if (curationMode != "guided" && userResponse.isConfirmed) {
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
      await submitReviewDataset(embargoReleaseDate, curationMode);
    }
  }
};

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

const submitReviewDataset = async (embargoReleaseDate, curationMode) => {
  let curationModeID = "";
  let currentAccount = defaultBfAccount;
  let currentDataset = defaultBfDataset;

  if (curationMode === "guided") {
    curationModeID = "guided";
    currentAccount = sodaJSONObj["bf-account-selected"]["account-name"];
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
  }
  $("#para-submit_prepublishing_review-status").text("");
  bfRefreshPublishingDatasetStatusBtn.disabled = true;
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  // title text
  let title = "";

  // check if the user has selected any files they want to be hidden to the public upon publication (aka ignored/excluded files)
  // set the loading message title accordingly
  if (excludedFilesInPublicationFlow(curationMode)) {
    title = "Ignoring selected files and submitting dataset for pre-publishing review";
  } else {
    title = "Submitting dataset to Curation Team";
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
  if (excludedFilesInPublicationFlow(curationMode)) {
    // get the excluded files from the excluded files list in the third step of the pre-publishing review submission flow
    let files = getExcludedFilesFromPublicationFlow(curationMode);
    try {
      // exclude the user's selected files from publication
      //check res
      await api.updateDatasetExcludedFiles(currentAccount, currentDataset, files);
    } catch (error) {
      clientError(error);
      // log the error
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ALL_LEVELS,
        ["Updating excluded files"]
      );

      var emessage = userErrorMessage(error);

      // alert the user of the error
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        confirmButtonText: "Ok",
        title: `Could not exclude the selected files from publication`,
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
    await disseminateCurationTeam(currentAccount, currentDataset, "share", "newMethod");

    await api.submitDatasetForPublication(
      currentAccount,
      currentDataset,
      embargoReleaseDate,
      embargoReleaseDate === "" ? "publication" : "embargo"
    );
  } catch (error) {
    clientError(error);
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Submit dataset"]
    );

    var emessage = userErrorMessage(error);

    // alert the user of an error
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: `Could not submit your dataset for pre-publishing review`,
      icon: "error",
      reverseButtons: reverseSwalButtons,
      text: emessage,
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
  await showPublishingStatus("noClear", curationMode);

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
    title: `Dataset has been submitted for review to the SPARC Curation Team!`,
    icon: "success",
    reverseButtons: reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  });

  if (curationMode != "guided") {
    await transitionFreeFormMode(
      document.querySelector("#begin-prepublishing-btn"),
      "submit_prepublishing_review-question-2",
      "submit_prepublishing_review-tab",
      "",
      "individual-question post-curation"
    );
  } else {
    // Update the UI again and hide the flow
    $("#guided--prepublishing-checklist-container").addClass("hidden");
    $("#guided--submit-prepublishing-review").addClass("hidden");
    const guidedShareWithCurationTeamButton = document.getElementById(
      "guided-button-share-dataset-with-curation-team"
    );

    guidedShareWithCurationTeamButton.classList.remove("hidden");
    guidedShareWithCurationTeamButton.classList.remove("loading");
    // $("#guided--para-review-dataset-info-disseminate").text("Dataset is not under review currently")

    guidedShareWithCurationTeamButton.disabled = false;
    // $("#guided-button-unshare-dataset-with-curation-team").show();
    guidedSetCurationTeamUI();
  }
};

// //Withdraw dataset from review
const withdrawDatasetSubmission = async (curationMode) => {
  // show a SWAL loading message until the submit for prepublishing flow is successful or fails

  if (curationMode !== "guided") {
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
  }

  // get the publishing status of the currently selected dataset
  // then check if it can be withdrawn, then withdraw it
  // catch any uncaught errors at this level (aka greacefully catch any exceptions to alert the user we cannot withdraw their dataset)
  await showPublishingStatus(withdrawDatasetCheck, curationMode).catch((error) => {
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
    // This helps signal guided mode to update the UI
    if (curationMode === "guided") {
      return false;
    }
  });

  // This helps signal guided mode to update the UI
  if (curationMode === "guided") {
    return true;
  }
};

const withdrawDatasetCheck = async (res, curationMode) => {
  let reviewstatus = res["publishing_status"];
  let requestStatus = res["review_request_status"];
  if (requestStatus != "requested") {
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
    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    if (curationMode !== "guided") {
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
    }
    await withdrawReviewDataset(curationMode);
  }
};

const withdrawReviewDataset = async (curationMode) => {
  bfWithdrawReviewDatasetBtn.disabled = true;

  let currentAccount = $("#current-bf-account").text();
  let currentDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");

  if (curationMode == "guided") {
    currentAccount = sodaJSONObj["bf-account-selected"]["account-name"];
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
  }

  try {
    await disseminateCurationTeam(currentAccount, currentDataset, "unshare", "newMethod");

    await api.withdrawDatasetReviewSubmission(currentDataset, currentAccount);

    logGeneralOperationsForAnalytics(
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );

    // show the user their dataset's updated publishing status
    await showPublishingStatus("noClear", curationMode);

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

    if (curationMode != "guided") {
      // reveal the current section (question-3) again using the new publishing status value
      await transitionFreeFormMode(
        document.querySelector("#begin-prepublishing-btn"),
        "submit_prepublishing_review-question-2",
        "submit_prepublishing_review-tab",
        "",
        "individual-question post-curation"
      );

      bfRefreshPublishingDatasetStatusBtn.disabled = false;
      bfWithdrawReviewDatasetBtn.disabled = false;
    } else {
      const guidedUnshareWithCurationTeamButton = document.getElementById(
        "guided-button-unshare-dataset-with-curation-team"
      );

      guidedUnshareWithCurationTeamButton.disabled = false;
      guidedUnshareWithCurationTeamButton.classList.remove("loading");
      guidedUnshareWithCurationTeamButton.classList.remove("hidden");

      guidedSetCurationTeamUI();
    }

    // scroll to the submit button
    // scrollToElement(".pre-publishing-continue");
  } catch (error) {
    clientError(error);
    var emessage = userErrorMessage(error);
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
};

//////////////////////////////////
// Helper functions
//////////////////////////////////

// General //

const removeOptions = (selectbox) => {
  var i;
  for (i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
};

const userError = (error) => {
  var myerror = error.message;
  return myerror;
};

// Manage Datasets //

const refreshBfUsersList = () => {
  var accountSelected = defaultBfAccount;

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
        // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
        $("#bf_list_users").selectpicker("refresh");
        $("#bf_list_users").find("option:not(:first)").remove();
        $("#guided_bf_list_users_and_teams").selectpicker("refresh");

        //delete all elements with data-permission-type of "team"
        const userDropdownElements = document.querySelectorAll(
          "#guided_bf_list_users_and_teams option[permission-type='user']"
        );
        userDropdownElements.forEach((element) => {
          element.remove();
        });

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
          var guidedOptionUser = optionUser.cloneNode(true);
          guidedOptionUser.setAttribute("permission-type", "user");
          guidedBfListUsersAndTeams.appendChild(guidedOptionUser);
        }
      })
      .catch((error) => {
        clientError(error);
      });
  }
};

const refreshBfTeamsList = (teamList) => {
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
        $("#guided_bf_list_users_and_teams").selectpicker("refresh");
        $("#button-add-permission-team").hide();
        for (var myItem in teams) {
          var myTeam = teams[myItem];
          var optionTeam = document.createElement("option");
          optionTeam.textContent = myTeam;
          optionTeam.value = myTeam;
          teamList.appendChild(optionTeam);
          var guidedOptionTeam = optionTeam.cloneNode(true);
          guidedOptionTeam.setAttribute("permission-type", "team");
          guidedBfListUsersAndTeams.appendChild(guidedOptionTeam);
        }
        confirm_click_account_function();
      })
      .catch((error) => {
        log.error(error);
        console.error(error);
        confirm_click_account_function();
      });
  }
};

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

/**
 *
 * Sorts the user's available organizations and adds them to the organization picker dropdown.
 * Prerequisite: Organizations have been fetched for the user otherwise nothing happens.
 * @returns length of the organizations list
 */
const refreshOrganizationList = () => {
  console.log("Refreshing orgs list with new results");
  organizationList.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  console.log("About to populate the organization dropdown");
  populateOrganizationDropdowns(organizationList);

  // parentDSTagify.settings.whitelist = getParentDatasets();
  return organizationList.length;
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

const populateOrganizationDropdowns = (organizations) => {
  console.log("About to clear the organization dropdown before repopulating");
  clearOrganizationDropdowns();

  for (const organization in organizations) {
    var myitemselect = organizations[organization];
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    let option1 = option.cloneNode(true);
    let option2 = option.cloneNode(true);

    console.log("Adding an item to the dropdown now");
    console.log(option1);

    curateOrganizationDropdown.appendChild(option1);
  }
};
////////////////////////////////////END OF DATASET FILTERING FEATURE//////////////////////////////

const updateBfAccountList = async () => {
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
};

const loadDefaultAccount = async () => {
  let responseObject;

  try {
    responseObject = await client.get("/manage_datasets/bf_default_account_load");
  } catch (e) {
    clientError(e);
    confirm_click_account_function();
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
};

const showPrePublishingPageElements = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    return;
  }

  // show the "Begin Publishing" button and hide the checklist and submission section
  $("#begin-prepublishing-btn").show();
  $("#prepublishing-checklist-container").hide();
  $("#prepublishing-submit-btn-container").hide();
  $("#excluded-files-container").hide();
  $(".pre-publishing-continue-container").hide();
};

const showPublishingStatus = async (callback, curationMode = "") => {
  return new Promise(async function (resolve, reject) {
    if (callback == "noClear") {
      var nothing;
    }

    let curationModeID = "";
    let currentAccount = $("#current-bf-account").text();
    let currentDataset = $(".bf-dataset-span")
      .html()
      .replace(/^\s+|\s+$/g, "");

    if (curationMode === "guided") {
      curationModeID = "guided--";
      currentAccount = sodaJSONObj["bf-account-selected"]["account-name"];
      currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    }

    if (currentDataset === "None") {
      resolve();
    } else {
      try {
        let get_publishing_status = await client.get(
          `/disseminate_datasets/datasets/${currentDataset}/publishing_status`,
          {
            params: {
              selected_account: currentAccount,
            },
          }
        );
        let res = get_publishing_status.data;

        try {
          //update the dataset's publication status and display
          //onscreen for the user under their dataset name
          $(`#${curationModeID}para-review-dataset-info-disseminate`).text(
            publishStatusOutputConversion(res)
          );

          if (callback === submitReviewDatasetCheck || callback === withdrawDatasetCheck) {
            return resolve(callback(res, curationMode));
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
};

const publishStatusOutputConversion = (res) => {
  var reviewStatus = res["review_request_status"];
  var publishStatus = res["publishing_status"];

  var outputMessage = "";
  if (reviewStatus === "draft" || reviewStatus === "cancelled") {
    outputMessage += "Dataset is not under review currently";
  } else if (reviewStatus === "requested") {
    outputMessage += "Dataset is currently under review";
  } else if (reviewStatus === "rejected") {
    outputMessage += "Dataset has been rejected by your Publishing Team and may require revision";
  } else if (reviewStatus === "accepted") {
    outputMessage += "Dataset has been accepted for publication by your Publishing Team";
  }

  return outputMessage;
};

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

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"];
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
      organizeDSglobalPath.value = filtered.slice(0, filtered.length - 1).join("/") + "/";
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
    getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);
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
        let swal_container = document.getElementsByClassName("swal2-popup")[0];
        swal_container.style.width = "600px";
        swal_container.style.padding = "1.5rem";
        $(".swal2-input").attr("id", "add-new-folder-input");
        $(".swal2-confirm").attr("id", "add-new-folder-button");
        $("#add-new-folder-input").keyup(function () {
          var val = $("#add-new-folder-input").val();
          let folderNameCheck = checkIrregularNameBoolean(val);
          if (folderNameCheck === true) {
            Swal.showValidationMessage(
              `The folder name contains non-allowed characters. To follow the SPARC Data Standards, please create a folder name with only alphanumberic characters and hyphens '-'`
            );
            $("#add-new-folder-button").attr("disabled", true);
            return;
          } else {
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
            getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);

            // log that the folder was successfully added
            logCurationForAnalytics(
              "Success",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );

            hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
            hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
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
const populateJSONObjFolder = (action, jsonObject, folderPath) => {
  var myitems = fs.readdirSync(folderPath);
  myitems.forEach((element) => {
    //prevented here
    var statsObj = fs.statSync(path.join(folderPath, element));
    var addedElement = path.join(folderPath, element);
    if (statsObj.isDirectory() && !/(^|\/)\[^\/\.]/g.test(element)) {
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
      populateJSONObjFolder(action, jsonObject["folders"][element], addedElement);
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
};

let full_name_show = false;

const hideFullName = () => {
  full_name_show = false;
  fullNameValue.style.display = "none";
  fullNameValue.style.top = "-250%";
  fullNameValue.style.left = "-250%";
};

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
const showFullName = (ev, element, text) => {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  full_name_show = true;
  var isOverflowing =
    element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
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
};

/// hover over a function for full name
const hoverForFullName = (ev) => {
  var fullPath = ev.innerText;
  // ev.children[1] is the child element folder_desc of div.single-item,
  // which we will put through the overflowing check in showFullName function
  showFullName(event, ev.children[1], fullPath);
};

document.addEventListener("onmouseover", function (e) {
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e);
  } else {
    hideFullName();
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
const showDetailsFile = () => {
  $(".div-display-details.file").toggleClass("show");
  // $(".div-display-details.folders").hide()
};

const pasteFromClipboard = (event, target_element) => {
  event.preventDefault();
  let key = Clipboard.readText();

  if (target_element == "bootbox-api-key" || target_element == "bootbox-api-secret") {
    $(`#${target_element}`).val(key);
  }
};

var bfAddAccountBootboxMessage = `<form>
    <div class="form-group row" style="justify-content: center; margin-top: .5rem; margin-bottom: 2rem;">
      <div style="display: flex; width: 100%">
        <input placeholder="Enter key name" type="text" style="width: 100%; margin: 0;" id="bootbox-key-name" class="swal2-input" />
      </div>
    </div>
    <div style="justify-content: center;">
      <div style="display:flex; align-items: flex-end; width: 100%;">
        <input placeholder="Enter API key" id="bootbox-api-key" type="text" class="swal2-input" style="width: 100%; margin: 0;" />
      </div>
    </div>
    <div style="justify-content: center; margin-bottom: .5rem; margin-top: 2rem;">
      <div style="display:flex; align-items: flex-end; width: 100%">
        <input placeholder="Enter API secret" id="bootbox-api-secret" class="swal2-input" type="text" style="margin: 0; width: 100%" />
      </div>
    </div>
  </form>`;

var bfaddaccountTitle = `<h3 style="text-align:center">Connect your Pennsieve account using an API key</h3>`;

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
const retrieveBFAccounts = async () => {
  bfAccountOptions = [];
  bfAccountOptionsStatus = "";

  if (hasConnectedAccountWithPennsieve()) {
    client
      .get("manage_datasets/bf_account_list")
      .then((res) => {
        let accounts = res.data;
        for (const myitem in accounts) {
          bfAccountOptions[accounts[myitem]] = accounts[myitem];
        }

        showDefaultBFAccount();
      })
      .catch((error) => {
        // clientError(error)
        bfAccountOptionsStatus = error;
      });
  } else {
    bfAccountOptionsStatus = "No account connected";
  }
  return [bfAccountOptions, bfAccountOptionsStatus];
};

let defaultAccountDetails = "";
const showDefaultBFAccount = async () => {
  try {
    let bf_default_acc_req = await client.get("manage_datasets/bf_default_account_load");
    let accounts = bf_default_acc_req.data.defaultAccounts;
    if (accounts.length > 0) {
      var myitemselect = accounts[0];
      defaultBfAccount = myitemselect;
      try {
        let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
          params: {
            selected_account: defaultBfAccount,
          },
        });
        let accountDetails = bf_account_details_req.data.account_details;
        $("#para-account-detail-curate").html(accountDetails);
        $("#current-bf-account").text(defaultBfAccount);
        $("#current-bf-account-generate").text(defaultBfAccount);
        $("#create_empty_dataset_BF_account_span").text(defaultBfAccount);
        $(".bf-account-span").text(defaultBfAccount);
        $("#card-right bf-account-details-span").html(accountDetails);
        $("#para_create_empty_dataset_BF_account").html(accountDetails);
        $("#para-account-detail-curate-generate").html(accountDetails);
        $(".bf-account-details-span").html(accountDetails);
        defaultAccountDetails = accountDetails;

        // show the preferred organization
        let organization = bf_account_details_req.data.organization;
        $(".bf-organization-span").text(organization);

        $("#div-bf-account-load-progress").css("display", "none");
        showHideDropdownButtons("account", "show");
        // refreshDatasetList()
        console.log("About to update the dataset list");
        updateDatasetList();
        console.log("About to update the organization list");
        updateOrganizationList();
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
};

////// function to trigger action for each context menu option
const hideMenu = (category, menu1, menu2, menu3) => {
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
};

const changeStepOrganize = (step) => {
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
};

var newDSName;
const generateDataset = (button) => {
  document.getElementById("para-organize-datasets-success").style.display = "none";
  document.getElementById("para-organize-datasets-error").style.display = "none";
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
};

ipcRenderer.on("selected-new-dataset", async (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      document.getElementById("para-organize-datasets-loading").style.display = "block";
      document.getElementById("para-organize-datasets-loading").innerHTML =
        "<span>Please wait...</span>";

      log.info("Generating a new dataset organize datasets at ${filepath}");

      try {
        await client.post(
          `/organize_datasets/datasets`,

          {
            generation_type: "create-new",
            generation_destination_path: filepath[0],
            dataset_name: newDSName,
            soda_json_directory_structure: datasetStructureJSONObj,
          },
          {
            timeout: 0,
          },
          {
            timeout: 0,
          }
        );

        document.getElementById("para-organize-datasets-error").style.display = "none";
        document.getElementById("para-organize-datasets-success").style.display = "block";
        document.getElementById("para-organize-datasets-success").innerHTML =
          "<span>Generated successfully!</span>";
      } catch (error) {
        clientError(error);
        document.getElementById("para-organize-datasets-success").style.display = "none";
        document.getElementById("para-organize-datasets-error").style.display = "block";
        document.getElementById("para-organize-datasets-error").innerHTML =
          "<span> " + userErrorMessage(error) + "</span>";
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
    (file_path) => fs.statSync(file_path).isFile() && !/(^|\/)\.[^\/\.]/g.test(file_path)
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
    if (path.length < 0) {
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
        spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
        background.setAttribute("class", "loading-items-background");
        background.setAttribute("id", "loading-items-background-overlay");

        spinner_container.append(spinner_icon);
        document.body.prepend(background);
        document.body.prepend(spinner_container);
        let loading_items_spinner = document.getElementById("items_loading_container");
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

ipcRenderer.on("selected-folders-organize-datasets", async (event, pathElement) => {
  // var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contain any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
  irregularFolderArray = [];
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  for (var ele of pathElement) {
    detectIrregularFolders(path.basename(ele), ele);
  }
  if (irregularFolderArray.length > 0) {
    Swal.fire({
      title:
        "As per the SPARC Data Standards, folder names must contain only alphanumeric values 0-9, A-Z (no special characters, no empty spaces). The folders listed below don't comply with these guidlines. What would you like to do?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        irregularFolderArray.join("</br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Replace forbidden characters with '-')",
      denyButtonText: "Remove forbidden characters",
      cancelButtonText: "Skip these folders",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalTitle = document.getElementById("swal-title");
        swalTitle.style.textAlign = "justify";
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        let swalDenyButton = document.getElementsByClassName("swal2-deny")[0];
        swalContainer.style.width = "600px";
        // swalContainer.style.padding = "1.5rem";
        swal_content.style.textAlign = "justify";
        swalDenyButton.style.backgroundColor = "#086dd3";
      },
    }).then(async (result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        if (pathElement.length > 0) {
          let load_spinner_promise = new Promise(async (resolved) => {
            let background = document.createElement("div");
            let spinner_container = document.createElement("div");
            let spinner_icon = document.createElement("div");
            spinner_container.setAttribute("id", "items_loading_container");
            spinner_icon.setAttribute("id", "item_load");
            spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
            background.setAttribute("class", "loading-items-background");
            background.setAttribute("id", "loading-items-background-overlay");

            spinner_container.append(spinner_icon);
            document.body.prepend(background);
            document.body.prepend(spinner_container);
            let loading_items_spinner = document.getElementById("items_loading_container");
            loading_items_spinner.style.display = "block";
            if (loading_items_spinner.style.display === "block") {
              setTimeout(() => {
                resolved();
              }, 100);
            }
          }).then(async () => {
            await addFoldersfunction("replace", irregularFolderArray, pathElement, myPath);
            document.getElementById("loading-items-background-overlay").remove();
            document.getElementById("items_loading_container").remove();
          });
        } else {
          await addFoldersfunction("replace", irregularFolderArray, pathElement, myPath);
        }
      } else if (result.isDenied) {
        if (pathElement.length > 0) {
          let load_spinner_promise = new Promise(async (resolved) => {
            let background = document.createElement("div");
            let spinner_container = document.createElement("div");
            let spinner_icon = document.createElement("div");
            spinner_container.setAttribute("id", "items_loading_container");
            spinner_icon.setAttribute("id", "item_load");
            spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
            background.setAttribute("class", "loading-items-background");
            background.setAttribute("id", "loading-items-background-overlay");

            spinner_container.append(spinner_icon);
            document.body.prepend(background);
            document.body.prepend(spinner_container);
            let loading_items_spinner = document.getElementById("items_loading_container");
            loading_items_spinner.style.display = "block";
            if (loading_items_spinner.style.display === "block") {
              setTimeout(() => {
                resolved();
              }, 100);
            }
          }).then(async () => {
            await addFoldersfunction("remove", irregularFolderArray, pathElement, myPath);
            document.getElementById("loading-items-background-overlay").remove();
            document.getElementById("items_loading_container").remove();
          });
        } else {
          await addFoldersfunction("remove", irregularFolderArray, pathElement, myPath);
        }
      }
    });
  } else {
    if (pathElement.length > 0) {
      let load_spinner_promise = new Promise(async (resolved) => {
        let background = document.createElement("div");
        let spinner_container = document.createElement("div");
        let spinner_icon = document.createElement("div");
        spinner_container.setAttribute("id", "items_loading_container");
        spinner_icon.setAttribute("id", "item_load");
        spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
        background.setAttribute("class", "loading-items-background");
        background.setAttribute("id", "loading-items-background-overlay");

        spinner_container.append(spinner_icon);
        document.body.prepend(background);
        document.body.prepend(spinner_container);
        let loading_items_spinner = document.getElementById("items_loading_container");
        loading_items_spinner.style.display = "block";
        if (loading_items_spinner.style.display === "block") {
          setTimeout(() => {
            resolved();
          }, 100);
        }
      }).then(async () => {
        await addFoldersfunction("", irregularFolderArray, pathElement, myPath);
        document.getElementById("loading-items-background-overlay").remove();
        document.getElementById("items_loading_container").remove();
      });
    } else {
      await addFoldersfunction("", irregularFolderArray, pathElement, myPath);
    }
  }
});

const addFoldersfunction = async (action, nonallowedFolderArray, folderArray, currentLocation) => {
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
              `', 'free-form')">Skip Folders</button>
              <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}', 'free-form')">Replace Existing Folders</button>
              <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}', 'free-form')">Import Duplicates</button>
              <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', '', 'free-form')">Cancel</button>
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
      getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);
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
};

//// Step 3. Organize dataset: Add files or folders with drag&drop
const allowDrop = (ev) => {
  ev.preventDefault();
};

var filesElement;
var targetElement;
const drop = async (ev) => {
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
  irregularFolderArray = [];
  var action = "";
  filesElement = ev.dataTransfer.files;
  targetElement = ev.target;
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
            renamedFolderName = replaceIrregularFolders(irregularFolderArray[i]);
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
      let load_spinner_promise = new Promise(async (resolved) => {
        let background = document.createElement("div");
        let spinner_container = document.createElement("div");
        let spinner_icon = document.createElement("div");
        spinner_container.setAttribute("id", "items_loading_container");
        spinner_icon.setAttribute("id", "item_load");
        spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
        background.setAttribute("class", "loading-items-background");
        background.setAttribute("id", "loading-items-background-overlay");

        spinner_container.append(spinner_icon);
        document.body.prepend(background);
        document.body.prepend(spinner_container);
        let loading_items_spinner = document.getElementById("items_loading_container");
        loading_items_spinner.style.display = "block";
        if (loading_items_spinner.style.display === "block") {
          setTimeout(() => {
            resolved();
          }, 100);
        }
      }).then(async () => {
        await dropHelper(
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
        // Swal.close();
        document.getElementById("loading-items-background-overlay").remove();
        document.getElementById("items_loading_container").remove();
        // background.remove();
      });
    });
  } else {
    let load_spinner_promise = new Promise(async (resolved) => {
      let background = document.createElement("div");
      let spinner_container = document.createElement("div");
      let spinner_icon = document.createElement("div");
      spinner_container.setAttribute("id", "items_loading_container");
      spinner_icon.setAttribute("id", "item_load");
      spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
      background.setAttribute("class", "loading-items-background");
      background.setAttribute("id", "loading-items-background-overlay");

      spinner_container.append(spinner_icon);
      document.body.prepend(background);
      document.body.prepend(spinner_container);
      let loading_items_spinner = document.getElementById("items_loading_container");
      loading_items_spinner.style.display = "block";
      if (loading_items_spinner.style.display === "block") {
        setTimeout(() => {
          resolved();
        }, 100);
      }
    }).then(async () => {
      await dropHelper(
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
      // Swal.close();
      document.getElementById("loading-items-background-overlay").remove();
      document.getElementById("items_loading_container").remove();
      // background.remove();
    });
  }
};

const dropHelper = async (
  ev1,
  ev2,
  action,
  myPath,
  importedFiles,
  importedFolders,
  nonAllowedDuplicateFiles,
  uiFiles,
  uiFolders
) => {
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
  let nonAllowedCharacterFiles = [];
  var folderPath = [];
  var duplicateFolders = [];
  var hiddenFiles = [];
  var nonAllowedFiles = [];
  let tripleExtension = [];
  let doubleExtension = [];
  let loadingIcon = document.getElementById("items_loading_container");
  let loadingContainer = document.getElementById("loading-items-background-overlay");

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
    let slashCount = getPathSlashCount();
    /// check for File duplicate
    if (statsObj.isFile()) {
      var nonAllowedDuplicate = false;
      var originalFileName = path.parse(itemPath).base;
      let filePath = itemPath;
      let fileName = path.parse(filePath).name;
      let fileBase = path.parse(filePath).base;
      let slashCount = getPathSlashCount();

      let forbiddenCheck = forbiddenFileCheck(filePath);
      if (forbiddenCheck === "forbidden") {
        nonAllowedFiles.push(filePath);
        continue;
      }
      if (forbiddenCheck === "hidden") {
        hiddenFiles.push(filePath);
        continue;
      }

      let warningCharacterBool = warningCharacterCheck(fileBase);
      // let regex = /[\+&\%#]/i;
      if (warningCharacterBool === true) {
        nonAllowedCharacterFiles.push(filePath);
        continue;
      }

      let extensionCount = checkForMultipleExtensions(fileBase);
      if (extensionCount > 2) {
        //multiple extensions, raise warning (do not import)
        tripleExtension.push(filePath);
        continue;
      }
      if (extensionCount === 2) {
        //double extension ask if compressed file
        doubleExtension.push(filePath);
        continue;
      }

      if (slashCount === 1) {
        if (loadingContainer != undefined) {
          loadingContainer.style.display = "none";
          loadingIcon.style.display = "none";
        }
        await Swal.fire({
          icon: "error",
          html: "<p>This interface is only for including files in the SPARC folders. If you are trying to add SPARC metadata file(s), you can do so in the next Step.</p>",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
        break;
      } else {
        if (JSON.stringify(myPath["files"]) === "{}" && JSON.stringify(importedFiles) === "{}") {
          importedFiles[fileBase] = {
            path: filePath,
            basename: originalFileName,
          };
        } else {
          //check if fileName is in to-be-imported object keys
          if (importedFiles.hasOwnProperty(originalFileName)) {
            nonAllowedDuplicate = true;
            nonAllowedDuplicateFiles.push(filePath);
            continue;
          } else {
            //check if filename is in already-imported object keys
            if (myPath["files"].hasOwnProperty(originalFileName)) {
              nonAllowedDuplicate = true;
              nonAllowedDuplicateFiles.push(filePath);
              continue;
            } else {
              if (Object.keys(myPath["files"]).length === 0) {
                importedFiles[originalFileName] = {
                  path: filePath,
                  basename: originalFileName,
                };
              }
              for (let alreadyImportedFile in myPath["files"]) {
                if (alreadyImportedFile !== undefined) {
                  nonAllowedDuplicate = false;
                  //just checking if paths are the same
                  if (filePath === myPath["files"][alreadyImportedFile]["path"]) {
                    nonAllowedDuplicateFiles.push(filePath);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //in neither so write
                    importedFiles[originalFileName] = {
                      path: filePath,
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
      let folderPath = itemPath;

      if (slashCount === 1) {
        if (loadingContainer != undefined) {
          loadingContainer.style.display = "none";
          loadingIcon.style.display = "none";
        }
        await Swal.fire({
          icon: "error",
          text: "Only SPARC folders can be added at this level. To add a new SPARC folder, please go back to Step 2.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        var j = 1;
        var originalFolderName = itemName;
        var renamedFolderName = originalFolderName;

        if (irregularFolderArray.includes(folderPath)) {
          if (action !== "ignore" && action !== "") {
            if (action === "remove") {
              renamedFolderName = removeIrregularFolders(itemName);
            } else if (action === "replace") {
              renamedFolderName = replaceIrregularFolders(itemName);
            }
            importedFolders[renamedFolderName] = {
              path: folderPath,
              "original-basename": originalFolderName,
            };
          }
        } else {
          if (myPath["folders"].hasOwnProperty(originalFolderName) === true) {
            //folder is already imported
            duplicateFolders.push(itemName);
            folderPath.push(folderPath);
            continue;
          } else {
            if (importedFolders.hasOwnProperty(originalFolderName) === true) {
              //folder is already in to-be-imported list
              duplicateFolders.push(itemName);
              folderPath.push(folderPath);
              continue;
            } else {
              //folder is in neither so write
              importedFolders[originalFolderName] = {
                path: folderPath,
                "original-basename": originalFolderName,
              };
            }
          }
        }
      }
    }
  }

  if (doubleExtension.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }

    await Swal.fire({
      title:
        "The following files have a double period, which is only allowed if they are compressed files as per SPARC Data Standards. Do you confirm that these are all compressed files?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        doubleExtension.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Yes, import them",
      // denyButtonText: "Import",
      cancelButtonText: "No, skip them",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        swalContainer.style.width = "600px";
        swal_content.style.textAlign = "justify";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //remove slashes and place just file name in new array
        for (let i = 0; i < doubleExtension.length; i++) {
          if (
            doubleExtension[i] in myPath["files"] ||
            path.parse(doubleExtension[i]).base in Object.keys(importedFiles)
          ) {
            nonAllowedDuplicateFiles.push(doubleExtension[i]);
            continue;
          } else {
            //not in there or regular files so store?
            importedFiles[path.parse(doubleExtension[i]).base] = {
              path: doubleExtension[i],
              basename: path.parse(doubleExtension[i]).base,
            };
          }
        }
      }
    });
  }

  if (tripleExtension.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "Files should typically have one (two when they are compressed) periods in their names according to the SPARC Data Standards. The following files have three of more periods in their name and will not be imported.",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        tripleExtension.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: false,
      showCancelButton: false,
      confirmButtonText: "OK",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        swalContainer.style.width = "600px";
        swal_content.style.textAlign = "justify";
      },
    });
  }

  if (nonAllowedCharacterFiles.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "The following files have characters (#&%+) that are typically not recommendeda as per the SPARC Data Standards. Although not forbidden to import as is, we recommend replacing those characters.",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        nonAllowedCharacterFiles.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Replace characters with '-'",
      denyButtonText: "Import as is",
      cancelButtonText: "Skip All",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        let swalDenyButton = document.getElementsByClassName("swal2-deny")[0];
        swalContainer.style.width = "600px";
        swal_content.style.textAlign = "justify";
        swalDenyButton.style.backgroundColor = "#086dd3";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //replace characters
        for (let i = 0; i < nonAllowedCharacterFiles.length; i++) {
          let fileName = path.parse(nonAllowedCharacterFiles[i]).base;
          let regex = /[\+&\%#]/g;
          let replaceFile = fileName.replace(regex, "-");
          importedFiles[replaceFile] = {
            path: nonAllowedCharacterFiles[i],
            basename: replaceFile,
          };
        }
      }
      if (result.isDenied) {
        for (let i = 0; i < nonAllowedCharacterFiles.length; i++) {
          let fileName = nonAllowedCharacterFiles[i];
          importedFiles[fileName] = {
            path: fileName,
            basename: path.parse(fileName).base,
          };
        }
      }
    });
  }

  if (hiddenFiles.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "The following files have an unexpected name starting with a period and are considered hidden files. As per SPARC Data Standards they are typically not recommended to be imported as hidden. How should we handle them?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        hiddenFiles.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Remove period",
      denyButtonText: "Import as is",
      cancelButtonText: "Skip All",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        swalContainer.style.width = "600px";
        swal_content.style.textAlign = "justify";
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        //replace characters
        //check for already imported
        for (let i = 0; i < hiddenFiles.length; i++) {
          let file_name = path.parse(hiddenFiles[i]).base;
          let path_name = hiddenFiles[i];

          if (Object.keys(myPath["files"]).length > 0) {
            for (const objectKey in myPath["files"]) {
              //tries finding duplicates with the same path
              if (objectKey != undefined) {
                nonAllowedDuplicate = false;
                if (file_name.substr(1, file_name.length) === objectKey) {
                  if (path_name === myPath["files"][objectKey]["path"]) {
                    //same path and has not been renamed
                    nonAllowedDuplicateFiles.push(path_name);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //store in imported files
                    importedFiles[file_name.substr(1, file_name.length)] = {
                      path: path_name,
                      basename: file_name.substr(1, file_name.length),
                    };
                  }
                } else {
                  //store in imported files
                  importedFiles[file_name.substr(1, file_name.length)] = {
                    path: path_name,
                    basename: file_name.substr(1, file_name.length),
                  };
                }
              }
            }
          } else {
            //store in imported files
            importedFiles[file_name.substr(1, file_name.length)] = {
              path: path_name,
              basename: file_name.substr(1, file_name.length),
            };
          }
        }
      } else if (result.isDenied) {
        //leave as is

        for (let i = 0; i < hiddenFiles.length; i++) {
          let file_name = path.parse(hiddenFiles[i]).base;
          let path_name = hiddenFiles[i];

          if (Object.keys(myPath["files"]).length > 0) {
            for (const objectKey in myPath["files"]) {
              //tries finding duplicates with the same path
              if (objectKey != undefined) {
                nonAllowedDuplicate = false;
                if (file_name === objectKey) {
                  if (path_name === myPath["files"][objectKey]["path"]) {
                    //same path and has not been renamed
                    nonAllowedDuplicateFiles.push(path_name);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //file path and object key path arent the same
                    //check if the file name are the same
                    //if so consider it as a duplicate

                    //store in regular files
                    importedFiles[file_name] = {
                      path: path_name,
                      basename: file_name,
                    };
                  }
                } else {
                  //store in regular files
                  importedFiles[file_name] = {
                    path: path_name,
                    basename: file_name,
                  };
                }
              }
            }
          } else {
            //store in regular files
            importedFiles[file_name] = {
              path: path_name,
              basename: file_name,
            };
          }
        }
      }
    });
  }

  if (nonAllowedFiles.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "The following files are not allowed in datasets as per the SPARC Data Standards and will thus not be imported",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        nonAllowedFiles.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      confirmButtonText: "OK",
      didOpen: () => {
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        swalContainer.style.width = "600px";
      },
    });
  }

  var listElements = showItemsAsListBootbox(duplicateFolders);
  var list = JSON.stringify(folderPath).replace(/"/g, "");
  if (duplicateFolders.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
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
        `', 'free-form')">Skip Folders</button>
        <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}', 'free-form')">Replace Existing Folders</button>
        <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}', 'free-form')">Import Duplicates</button>
        <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', '', 'free-form')">Cancel</button>
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
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
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
        `', 'free-form')">Skip Files</button>
        <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}', 'free-form')">Replace Existing Files</button>
        <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}', 'free-form')">Import Duplicates</button>
        <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', '', 'free-form')">Cancel</button>
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
        myPath["files"][importedFiles[element]["basename"]]["action"].push("renamed");
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
      populateJSONObjFolder(action, myPath["folders"][element], importedFolders[element]["path"]);
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        element +
        "</div></div>";
      $("#placeholder_element").remove();
      $(appendString).appendTo(ev2);
    }
    listItems(myPath, "#items", 500, (reset = true));
    getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);
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
  beginScrollListen();
  $("body").removeClass("waiting");
};

var irregularFolderArray = [];
const detectIrregularFolders = (folderName, pathEle) => {
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
};

const checkIrregularNameBoolean = (folderName) => {
  //nonAllowedCharacters modified to only allow a-z A-z 0-9 and hyphen "-"
  const nonAllowedFolderCharacters = /[^a-zA-Z0-9-]/;
  return nonAllowedFolderCharacters.test(folderName);
};

/* The following functions aim at ignore folders with irregular characters, or replace the characters with (-),
  or remove the characters from the names.
  All return an object in the form {"type": empty for now, will be confirmed once users click an option at the popup,
  "paths": array of all the paths with special characters detected}
*/

const replaceIrregularFolders = (pathElement) => {
  const reg = /[^a-zA-Z0-9-]/g;
  const str = path.basename(pathElement);
  const newFolderName = str.replace(reg, "-");
  return newFolderName;
};

const removeIrregularFolders = (pathElement) => {
  const reg = /[^a-zA-Z0-9-]/g;
  const str = path.basename(pathElement);
  const newFolderName = str.replace(reg, "");
  return newFolderName;
};

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

// displays the user selected banner image using Jimp in the edit banner image modal
//path: array
//curationMode: string (guided-moded) (freeform)
const handleSelectedBannerImage = async (path, curationMode) => {
  let imgContainer = "";
  let imgHolder = "";
  let paraImagePath = "";
  let viewImportedImage = "";
  let saveBannerImage = "";
  let cropperOptions = "";
  if (curationMode === "guided-mode") {
    imgHolder = document.getElementById("guided-div-img-container-holder");
    imgContainer = document.getElementById("guided-div-img-container");
    viewImportedImage = guidedBfViewImportedImage;
    paraImagePath = "#guided-para-path-image";
    saveBannerImage = "#guided-save-banner-image";
    cropperOptions = guidedCropOptions;
  }
  if (curationMode === "freeform") {
    cropperOptions = cropOptions;
    paraImagePath = "#para-path-image";
    saveBannerImage = "#save-banner-image";
    viewImportedImage = bfViewImportedImage;
    imgHolder = document.getElementById("div-img-container-holder");
    imgContainer = document.getElementById("div-img-container");
  }

  if (path.length > 0) {
    let original_image_path = path[0];
    let image_path = original_image_path;
    let destination_image_path = require("path").join(
      homeDirectory,
      "SODA",
      "banner-image-conversion"
    );
    let converted_image_file = require("path").join(destination_image_path, "converted-tiff.jpg");
    let conversion_success = true;
    imageExtension = path[0].split(".").pop();

    if (imageExtension.toLowerCase() == "tiff") {
      Swal.fire({
        title: "Image conversion in progress!",
        html: "Pennsieve does not support .tiff banner images. Please wait while SODA converts your image to the appropriate format required.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await Jimp.read(original_image_path)
        .then(async (file) => {
          if (!fs.existsSync(destination_image_path)) {
            fs.mkdirSync(destination_image_path, { recursive: true });
          }

          try {
            if (fs.existsSync(converted_image_file)) {
              fs.unlinkSync(converted_image_file);
            }
          } catch (err) {
            conversion_success = false;
            console.error(err);
          }

          return file.write(converted_image_file, async () => {
            if (fs.existsSync(converted_image_file)) {
              let stats = fs.statSync(converted_image_file);
              let fileSizeInBytes = stats.size;
              let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

              if (fileSizeInMegabytes > 5) {
                fs.unlinkSync(converted_image_file);

                await Jimp.read(original_image_path)
                  .then((file) => {
                    return file.resize(1024, 1024).write(converted_image_file, () => {
                      imgHolder.style.display = "none";
                      imgContainer.style.display = "block";

                      $(paraImagePath).html(image_path);
                      viewImportedImage.src = converted_image_file;
                      myCropper.destroy();
                      myCropper = new Cropper(viewImportedImage, cropperOptions);
                      $(saveBannerImage).css("visibility", "visible");
                      $("body").removeClass("waiting");
                    });
                  })
                  .catch((err) => {
                    conversion_success = false;
                    console.error(err);
                  });
                if (fs.existsSync(converted_image_file)) {
                  let stats = fs.statSync(converted_image_file);
                  let fileSizeInBytes = stats.size;
                  let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                  if (fileSizeInMegabytes > 5) {
                    conversion_success = false;
                    // SHOW ERROR
                  }
                }
              }
              image_path = converted_image_file;
              imageExtension = "jpg";
              $(paraImagePath).html(image_path);
              viewImportedImage.src = image_path;
              myCropper.destroy();
              myCropper = new Cropper(viewImportedImage, cropperOptions);
              $(paraImagePath).css("visibility", "visible");
            }
          });
        })
        .catch((err) => {
          conversion_success = false;
          console.error(err);
          Swal.fire({
            icon: "error",
            text: "Something went wrong",
            confirmButtonText: "OK",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
        });
      if (conversion_success == false) {
        $("body").removeClass("waiting");
        return;
      } else {
        Swal.close();
      }
    } else {
      imgHolder.style.display = "none";
      imgContainer.style.display = "block";

      $(paraImagePath).html(image_path);
      viewImportedImage.src = image_path;
      myCropper.destroy();
      myCropper = new Cropper(viewImportedImage, cropperOptions);

      $(saveBannerImage).css("visibility", "visible");
    }
  } else {
    if (curationMode == "freeform") {
      if ($("#para-current-banner-img").text() === "None") {
        $(saveBannerImage).css("visibility", "hidden");
      } else {
        $(saveBannerImage).css("visibility", "visible");
      }
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
/////////////////// CONTEXT MENU OPTIONS FOR FOLDERS AND FILES ///////////////
//////////////////////////////////////////////////////////////////////////////

//// helper functions for hiding/showing context menus
const showmenu = (ev, category, deleted = false) => {
  //stop the real right click menu
  let guidedModeFileExporer = false;
  let activePages = Array.from(document.querySelectorAll(".is-shown"));

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

  activePages.forEach((page) => {
    if (page.id === "guided_mode-section") {
      guidedModeFileExporer = true;
      mouseX = ev.pageX - 210;
      mouseY = ev.pageY - 10;
    }
  });

  if (category === "folder") {
    if (deleted) {
      $(menuFolder).children("#reg-folder-delete").html("<i class='fas fa-undo-alt'></i> Restore");
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
    // This is where regular folders context menu will appear
    menuFolder.style.display = "block";
    if (guidedModeFileExporer) {
      // $(".menu.reg-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
    }
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
    if (guidedModeFileExporer) {
      // $(".menu.high-level-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
    }
    $(".menu.high-level-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  } else {
    if (deleted) {
      $(menuFile).children("#file-delete").html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuFile).children("#file-rename").hide();
      $(menuFile).children("#file-move").hide();
      $(menuFile).children("#file-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuFile).children("#file-delete").html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuFile)
          .children("#file-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(menuFile).children("#file-rename").hide();
        $(menuFile).children("#file-description").hide();
      } else {
        $(menuFile).children("#file-delete").html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuFile).children("#file-move").html('<i class="fas fa-external-link-alt"></i> Move');
        $(menuFile).children("#file-rename").show();
        $(menuFile).children("#file-move").show();
        $(menuFile).children("#file-description").show();
      }
    }

    // This is where the context menu for regular files will be displayed
    menuFile.style.display = "block";
    $(".menu.file").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  }
};

/// options for regular sub-folders
const folderContextMenu = (event) => {
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
        delFolder(event, organizeDSglobalPath, "#items", ".single-item", datasetStructureJSONObj);
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
        delFolder(event, organizeDSglobalPath, "#items", ".single-item", datasetStructureJSONObj);
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
};

//////// options for files
const fileContextMenu = (event) => {
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
        delFolder(event, organizeDSglobalPath, "#items", ".single-item", datasetStructureJSONObj);
      } else if ($(this).attr("id") === "file-move") {
        moveItems(event, "files");
      } else if ($(this).attr("id") === "file-description") {
        manageDesc(event);
      }
      // Hide it AFTER the action was triggered
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
    });
  hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
};

$(document).ready(function () {
  tippy("[data-tippy-content]:not(.tippy-content-main):not(.guided-tippy-wrapper)", {
    allowHTML: true,
    interactive: true,
    placement: "top",
    theme: "light",
  });

  tippy(".tippy-content-main", {
    allowHTML: true,
    interactive: true,
    placement: "bottom",
    theme: "light",
  });

  tippy(".guided-tippy-wrapper", {
    allowHTML: true,
    interactive: true,
    placement: "bottom",
    theme: "light",
    /*apply -5 bottom margin to negate button bottom margin*/
    offset: [0, -3],
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
      if ($(target_element).hasClass("myFol") || $(target_element).hasClass("myFile")) {
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
const sortObjByKeys = (object) => {
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
};

const listItems = async (jsonObj, uiItem, amount_req, reset) => {
  //allow amount to choose how many elements to create
  //break elements into sets of 100
  const rootFolders = ["primary", "source", "derivative"];
  const datasetPath = document.getElementById("guided-input-global-path");
  const pathDisplay = document.getElementById("datasetPathDisplay");
  const fileExplorerBackButton = document.getElementById("guided-button-back");
  let hideSampleFolders = false;
  let hideSubjectFolders = false;
  let splitPath = datasetPath.value.split("/");
  let fullPath = datasetPath.value;

  if (organizeDSglobalPath.id === "guided-input-global-path") {
    const splitPathCheck = (num, button) => {
      //based on the paths length we will determine if the back button should be disabled/hidden or not
      if (splitPath.length > num) {
        //button should be enabled
        button.disabled = false;
        button.style.display = "block";
      } else {
        //button should be disabled
        button.disabled = true;
        button.style.display = "none";
      }
    };

    let currentPageID = CURRENT_PAGE.id;
    //capsules need to determine if sample or subjects section
    //subjects initially display two folder levels meanwhile samples will initially only show one folder level
    let primarySampleCapsule = document.getElementById(
      "guided-primary-samples-organization-page-capsule"
    );
    let primarySubjectCapsule = document.getElementById(
      "guided-primary-subjects-organization-page-capsule"
    );
    let primaryPoolCapsule = document.getElementById(
      "guided-primary-pools-organization-page-capsule"
    );
    let sourceSampleCapsule = document.getElementById(
      "guided-source-samples-organization-page-capsule"
    );
    let sourceSubjectCapsule = document.getElementById(
      "guided-source-subjects-organization-page-capsule"
    );
    let sourcePoolCapsule = document.getElementById(
      "guided-source-pools-organization-page-capsule"
    );

    let derivativeSampleCapsule = document.getElementById(
      "guided-derivative-samples-organization-page-capsule"
    );
    let derivativeSubjectCapsule = document.getElementById(
      "guided-derivative-subjects-organization-page-capsule"
    );
    let derivativePoolCapsule = document.getElementById(
      "guided-derivative-pools-organization-page-capsule"
    );

    //remove my_dataset_folder and if any of the ROOT FOLDER names is included
    if (splitPath[0] === "My_dataset_folder") splitPath.shift();
    if (rootFolders.includes(splitPath[0])) splitPath.shift();
    //remove the last element in array is it is always ''
    splitPath.pop();

    let trimmedPath = "";
    if (currentPageID.includes("primary")) {
      if (primarySampleCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(3, fileExplorerBackButton);
        } else {
          splitPathCheck(2, fileExplorerBackButton);
        }
      }
      if (primarySubjectCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(2, fileExplorerBackButton);
        } else {
          splitPathCheck(1, fileExplorerBackButton);
        }
        hideSampleFolders = true;
      }
      if (primaryPoolCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(1, fileExplorerBackButton);
        }
        hideSubjectFolders = true;
      }
    }
    if (currentPageID.includes("source")) {
      if (sourceSubjectCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(2, fileExplorerBackButton);
        } else {
          splitPathCheck(1, fileExplorerBackButton);
        }
        hideSampleFolders = true;
      }
      if (sourceSampleCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(3, fileExplorerBackButton);
        } else {
          splitPathCheck(2, fileExplorerBackButton);
        }
      }
      if (sourcePoolCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(1, fileExplorerBackButton);
        }
        hideSubjectFolders = true;
      }
    }
    if (currentPageID.includes("derivative")) {
      //check the active capsule
      if (derivativeSubjectCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(2, fileExplorerBackButton);
        } else {
          splitPathCheck(1, fileExplorerBackButton);
        }
        hideSampleFolders = true;
      }
      if (derivativeSampleCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(3, fileExplorerBackButton);
        } else {
          splitPathCheck(2, fileExplorerBackButton);
        }
      }
      if (derivativePoolCapsule.classList.contains("active")) {
        if (splitPath[0].includes("pool-")) {
          splitPathCheck(1, fileExplorerBackButton);
        }
        hideSubjectFolders = true;
      }
    }
    if (
      currentPageID.includes("code") ||
      currentPageID.includes("protocol") ||
      currentPageID.includes("docs") ||
      currentPageID.includes("helpers")
    ) {
      //for code/protocols/docs we only initially display one folder lvl
      splitPathCheck(1, fileExplorerBackButton);
    }

    for (let i = 0; i < splitPath.length; i++) {
      if (splitPath[i] === "My_dataset_folder" || splitPath[i] === undefined) continue;
      trimmedPath += splitPath[i] + "/";
    }

    //append path to tippy and display path to the file explorer
    pathDisplay.innerText = trimmedPath;
    pathDisplay._tippy.setContent(fullPath);
  }

  var appendString = "";
  var sortedObj = sortObjByKeys(jsonObj);
  let file_elements = [],
    folder_elements = [];
  let count = 0;

  //start creating folder elements to be rendered
  if (Object.keys(sortedObj["folders"]).length > 0) {
    for (var item in sortedObj["folders"]) {
      //hide samples when on the subjects page
      if (hideSampleFolders) {
        let currentSampleFolder = splitPath[0];
        let allSamples = sodaJSONObj.getAllSamplesFromSubjects();
        let noPoolSamples = [];
        let poolSamples = [];
        let skipSubjectFolder = false;
        if (allSamples.length > 1) {
          //subjects within pools and others not
          poolSamples = allSamples[0];
          noPoolSamples = allSamples[1];
          for (let i = 0; i < poolSamples.length; i++) {
            if (item === poolSamples[i]["sampleName"]) {
              skipSubjectFolder = true;
              break;
            }
          }
          if (skipSubjectFolder) continue;
          for (let i = 0; i < noPoolSamples.length; i++) {
            if (item === noPoolSamples[i]["sampleName"]) {
              skipSubjectFolder = true;
              break;
            }
          }
          if (skipSubjectFolder) continue;
        }
        if (allSamples.length === 1) {
          poolSamples = allSamples[1];
          for (let i = 0; i < poolSamples.length; i++) {
            if (item === poolSamples[i]["sampleName"]) {
              skipSubjectFolder = true;
              break;
            }
          }
          if (skipSubjectFolder) continue;
        }
      }
      if (hideSubjectFolders) {
        //hide subject folders when displaying pool page
        const currentPoolName = splitPath[0];
        let currentSubjects = sodaJSONObj.getAllSubjects();
        let poolSubjects = [];
        let noPoolSubjects = [];
        let skipSubjectFolder = false;
        if (currentSubjects.length === 1) {
          poolSubjects = currentSubjects[0];
          for (let i = 0; i < poolSubjects.length; i++) {
            if (item === poolSubjects[i]["subjectName"]) {
              skipSubjectFolder = true;
              break;
            }
          }
          if (skipSubjectFolder) continue;
        }
        if (currentSubjects.length > 1) {
          //some subjects in pools and some not
          poolSubjects = currentSubjects[0];
          noPoolSubjects = currentSubjects[1];
          for (let i = 0; i < noPoolSubjects.length; i++) {
            if (item === noPoolSubjects[i]["subjectName"]) {
              skipSubjectFolder = true;
              break;
            }
          }
          if (skipSubjectFolder) continue;
          for (let i = 0; i < poolSubjects.length; i++) {
            if (item === poolSubjects[i]["subjectName"]) {
              skipSubjectFolder = true;
              break;
            }
          }
        }
        if (skipSubjectFolder) continue;
      }

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
          if (sortedObj["folders"][item]["action"].includes("recursive_deleted")) {
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

        appendString = appendString + elem_creation;
        if (count === 100) {
          //every one hundred elements created we put it into one element within the array
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

        appendString = appendString + element_creation;
        if (count === 100) {
          //every one hundred elements created we put it into one element within the array
          folder_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      }
    }
    if (count < 100) {
      //if items to be rendered is less than 100 we push whatever we have to the array element
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
          var extension = path.extname(sortedObj["files"][item]["path"]).slice(1);
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
          if (sortedObj["files"][item]["action"].includes("recursive_deleted")) {
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

  //check if folder_elements is an empty object and file_elements is an empty array
  if (folder_elements.length == 0 && file_elements.length == 0) {
    //Fired when no folders are to be appended to the folder structure element.
    //Gets the name of the current folder from organizeDSglobalPath and instructs the user
    //on what to do in the empty folder.
    let currentFolder = "";
    let folderType;

    if (organizeDSglobalPath.value == undefined) {
      currentFolder = "My_dataset_folder";
    } else {
      //Get the name of the folder the user is currently in.
      currentFolder = organizeDSglobalPath.value.split("/").slice(-2)[0];
      if (currentFolder.startsWith("sub-")) {
        folderType = "subject";
      }
      if (currentFolder.startsWith("sam-")) {
        folderType = "sample";
      }
      if (currentFolder.startsWith("pool-")) {
        folderType = "pool";
      }
    }

    let dragDropInstructionsText;
    if (folderType === undefined) {
      dragDropInstructionsText = `Drag and Drop folders and files to be included in the <b>${currentFolder}</b> folder.`;
    }
    if (folderType == "subject") {
      dragDropInstructionsText = `Drag and drop folders and files associated with the subject ${currentFolder}`;
    }
    if (folderType === "sample") {
      dragDropInstructionsText = `Drag and drop folders and files associated with the sample ${currentFolder}`;
    }
    if (folderType === "pool") {
      dragDropInstructionsText = `Drag and drop folders and files associated with the pool ${currentFolder}`;
    }

    $("#items").html(
      `<div class="drag-drop-container-instructions">
        <div id="dragDropLottieContainer" style="height: 100px; width: 100px;"></div>
        <p class="text-center large">
          ${dragDropInstructionsText}
        </p>
        <p class="text-center">
          You may also <b>add</b> or <b>import</b> ${
            folderType === undefined ? "folders or files" : folderType + " data"
          } using the buttons in the upper right corner
        </p>
      </div>`
    );
    const dragDropLottieContainer = document.getElementById("dragDropLottieContainer");

    dragDropLottieContainer.innerHTML = ``;

    let dragDropAnimation = lottie.loadAnimation({
      container: dragDropLottieContainer,
      animationData: dragDrop,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });
  }
};

const getInFolder = (singleUIItem, uiItem, currentLocation, globalObj) => {
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
        currentLocation.value = "My_dataset_folder/" + filtered.join("/") + "/";
      }
      $("#items").empty();
      already_created_elem = [];
      let items = loadFileFolder(myPath);
      //we have some items to display
      listItems(myPath, "#items", 500, (reset = true));
      getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);
      organizeLandingUIEffect();
      // reconstruct folders and files (child elements after emptying the Div)
      // getInFolder(singleUIItem, uiItem, currentLocation, globalObj);
    }
  });
};

const sliceStringByValue = (string, endingValue) => {
  var newString = string.slice(string.indexOf(endingValue) + 1);
  return newString;
};

var fileNameForEdit;
///// Option to manage description for files
const manageDesc = (ev) => {
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
};

const updateFileDetails = (ev) => {
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
  getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);
  // find checkboxes here and uncheck them
  for (var ele of $($(ev).siblings().find("input:checkbox"))) {
    document.getElementById(ele.id).checked = false;
  }
  // close the display
  showDetailsFile();
};

const addDetailsForFile = (ev) => {
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
};

$("#inputNewNameDataset").on("click", () => {
  $("#nextBtn").prop("disabled", true);
  $("#inputNewNameDataset").keyup();
});

$("#inputNewNameDataset").keyup(function () {
  let step6 = document.getElementById("generate-dataset-tab");
  if (step6.classList.contains("tab-active")) {
    $("#nextBtn").prop("disabled", true);
  }

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
      document.getElementById("div-confirm-inputNewNameDataset").style.display = "none";
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
    $("#Question-getting-started-locally-destination").nextAll().removeClass("show");
    $("#Question-getting-started-locally-destination").nextAll().removeClass("test2");
    $("#Question-getting-started-locally-destination").nextAll().removeClass("prev");
    document.getElementById("input-destination-getting-started-locally").placeholder =
      "Browse here";
    $("#para-continue-location-dataset-getting-started").text("");
    document.getElementById("nextBtn").disabled = true;
    ipcRenderer.send("open-file-dialog-local-destination-curate");
  });

// Local dataset selected response
ipcRenderer.on("selected-local-destination-datasetCurate", async (event, filepath) => {
  let numb = document.getElementById("local_dataset_number");
  let progressBar_rightSide = document.getElementById("left-side_less_than_50");
  let progressBar_leftSide = document.getElementById("right-side_greater_than_50");
  //create setInterval variable that will keep track of the iterated items
  let local_progress;

  // Function to get the progress of the local dataset every 500ms
  const progressReport = async () => {
    try {
      let monitorProgressResponse = await client.get(`/organize_datasets/datasets/import/progress`);

      let { data } = monitorProgressResponse;
      percentage_amount = data["progress_percentage"].toFixed(2);
      finished = data["create_soda_json_completed"];

      numb.innerText = percentage_amount + "%";
      if (percentage_amount <= 50) {
        progressBar_rightSide.style.transform = `rotate(${percentage_amount * 0.01 * 360}deg)`;
      } else {
        progressBar_rightSide.style.transition = "";
        progressBar_rightSide.classList.add("notransition");
        progressBar_rightSide.style.transform = `rotate(180deg)`;
        progressBar_leftSide.style.transform = `rotate(${percentage_amount * 0.01 * 180}deg)`;
      }

      if (finished === 1) {
        progressBar_leftSide.style.transform = `rotate(180deg)`;
        numb.innerText = "100%";
        clearInterval(local_progress);
        progressBar_rightSide.classList.remove("notransition");
        populate_existing_folders(datasetStructureJSONObj);
        populate_existing_metadata(sodaJSONObj);
        $("#para-continue-location-dataset-getting-started").text("Please continue below.");
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
          document.getElementById("loading_local_dataset").style.display = "none";
        }, 1000);
      }
    } catch (error) {
      clientError(error);
      clearInterval(local_progress);
    }
  };

  // Function begins here
  if (filepath.length > 0) {
    if (filepath != null) {
      sodaJSONObj["starting-point"]["local-path"] = "";
      document.getElementById("input-destination-getting-started-locally").placeholder =
        filepath[0];
      if (
        sodaJSONObj["starting-point"]["type"] === "local" &&
        sodaJSONObj["starting-point"]["local-path"] == ""
      ) {
        valid_dataset = verify_sparc_folder(
          document.getElementById("input-destination-getting-started-locally").placeholder,
          "local"
        );
        if (valid_dataset == true) {
          // Reset variables
          irregularFolderArray = [];
          let replaced = {};

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
              /* Read more about isConfirmed, isDenied below */
              if (result.isConfirmed) {
                action = "replace";
                if (irregularFolderArray.length > 0) {
                  for (let i = 0; i < irregularFolderArray.length; i++) {
                    renamedFolderName = replaceIrregularFolders(irregularFolderArray[i]);
                    replaced[path.basename(irregularFolderArray[i])] = renamedFolderName;
                  }
                }
              } else if (result.isDenied) {
                action = "remove";
                if (irregularFolderArray.length > 0) {
                  for (let i = 0; i < irregularFolderArray.length; i++) {
                    renamedFolderName = removeIrregularFolders(irregularFolderArray[i]);
                    replaced[irregularFolderArray[i]] = renamedFolderName;
                  }
                }
              } else {
                document.getElementById("input-destination-getting-started-locally").placeholder =
                  "Browse here";
                sodaJSONObj["starting-point"]["local-path"] = "";
                $("#para-continue-location-dataset-getting-started").text("");
                return;
              }

              //Reset the progress bar
              progressBar_rightSide.style.transform = `rotate(0deg)`;
              progressBar_leftSide.style.transform = `rotate(0deg)`;
              numb.innerText = "0%";

              // Show the progress bar
              document.getElementById("loading_local_dataset").style.display = "block";

              // Show file path to user in the input box
              sodaJSONObj["starting-point"]["local-path"] = filepath[0];
              let root_folder_path = $("#input-destination-getting-started-locally").attr(
                "placeholder"
              );

              //create setInterval variable that will keep track of the iterated items
              local_progress = setInterval(progressReport, 500);

              try {
                let importLocalDatasetResponse = await client.post(
                  `/organize_datasets/datasets/import`,
                  {
                    sodajsonobject: sodaJSONObj,
                    root_folder_path: root_folder_path,
                    irregular_folders: irregularFolderArray,
                    replaced: replaced,
                  },
                  { timeout: 0 }
                );
                let { data } = importLocalDatasetResponse;
                sodaJSONObj = data;
                datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
              } catch (error) {
                clientError(error);
                clearInterval(local_progress);
              }
            });
          } else {
            // Reset the progress bar
            progressBar_leftSide.style.transform = `rotate(0deg)`;
            progressBar_rightSide.style.transform = `rotate(0deg)`;
            numb.innerText = "0%";

            // Show the progress bar
            document.getElementById("loading_local_dataset").style.display = "block";

            // Show file path to user in the input box
            sodaJSONObj["starting-point"]["local-path"] = filepath[0];
            let root_folder_path = $("#input-destination-getting-started-locally").attr(
              "placeholder"
            );

            //create setInterval variable that will keep track of the iterated items
            local_progress = setInterval(progressReport, 500);

            try {
              let importLocalDatasetResponse = await client.post(
                `/organize_datasets/datasets/import`,
                {
                  sodajsonobject: sodaJSONObj,
                  root_folder_path: root_folder_path,
                  irregular_folders: irregularFolderArray,
                  replaced: replaced,
                },
                { timeout: 0 }
              );
              let { data } = importLocalDatasetResponse;
              sodaJSONObj = data;
              datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
            } catch (error) {
              clientError(error);
              clearInterval(local_progress);
            }
          }
        } else {
          // Invalid dataset due to non-SPARC folder structure
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
              document.getElementById("input-destination-getting-started-locally").placeholder =
                "Browse here";
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
});

ipcRenderer.on("guided-selected-local-destination-datasetCurate", (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      sodaJSONObj["starting-point"]["local-path"] = "";
      sodaJSONObj["starting-point"]["type"] = "local";

      $("#guided-input-destination-getting-started-locally").val(filepath[0]);
      $(".guidedDatasetPath").text(filepath[0]);

      valid_dataset = verify_sparc_folder(filepath[0]);
      if (valid_dataset == true) {
        var action = "";
        irregularFolderArray = [];
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
          }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              action = "replace";
            } else if (result.isDenied) {
              action = "remove";
            } else {
              $("#guided-input-destination-getting-started-locally").val("Browse here");
              sodaJSONObj["starting-point"]["local-path"] = "";
              $("#para-continue-location-dataset-getting-started").text("");
              return;
            }
            sodaJSONObj["starting-point"]["local-path"] = filepath[0];

            let root_folder_path = $("#guided-input-destination-getting-started-locally").val();

            create_json_object(action, sodaJSONObj, root_folder_path);
            datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
            populate_existing_folders(datasetStructureJSONObj);
            populate_existing_metadata(sodaJSONObj);
            enableProgressButton();
          });
        } else {
          action = "";
          let root_folder_path = $("#guided-input-destination-getting-started-locally").val();
          sodaJSONObj["starting-point"]["local-path"] = filepath[0];
          create_json_object(action, sodaJSONObj, root_folder_path);
          datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
          populate_existing_folders(datasetStructureJSONObj);
          populate_existing_metadata(sodaJSONObj);
        }
      } else {
        Swal.fire({
          icon: "warning",
          html: `This folder does not seems to include any SPARC folders. Please select a folder that has a valid SPARC dataset structure.
              <br/>
              If you are trying to create a new dataset folder, select the 'Prepare a new dataset' option.`,
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
            $("#guided-input-destination-getting-started-locally").val("Browse here");
            $(".guidedDatasetPath").text("");
            sodaJSONObj["starting-point"]["local-path"] = "";
          }
        });
      }
    }
  } else {
  }
});

//// Select to choose a local dataset (generate dataset)
document
  .getElementById("input-destination-generate-dataset-locally")
  .addEventListener("click", function () {
    $("#Question-generate-dataset-locally-destination").nextAll().removeClass("show");
    $("#Question-generate-dataset-locally-destination").nextAll().removeClass("test2");
    $("#Question-generate-dataset-locally-destination").nextAll().removeClass("prev");
    document.getElementById("nextBtn").disabled = true;
    ipcRenderer.send("open-file-dialog-local-destination-curate-generate");
  });

ipcRenderer.on("selected-local-destination-datasetCurate-generate", (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      $("#div-confirm-destination-locally").css("display", "flex");
      $("#div-confirm-destination-locally button").show();
      document.getElementById("input-destination-generate-dataset-locally").placeholder =
        filepath[0];
      document.getElementById("input-destination-generate-dataset-locally").value = filepath[0];
      document.getElementById("nextBtn").disabled = true;
    } else {
      $("#div-confirm-destination-locally").css("display", "none");
      $("#div-confirm-destination-locally button").hide();
      document.getElementById("input-destination-generate-dataset-locally").placeholder =
        "Browse here";
    }
  } else {
    $("#div-confirm-destination-locally").css("display", "none");
    $("#div-confirm-destination-locally button").hide();
    document.getElementById("input-destination-generate-dataset-locally").placeholder =
      "Browse here";
  }
});

document.getElementById("button-generate-comeback").addEventListener("click", function () {
  setTimeout(function () {
    document.getElementById("generate-dataset-progress-tab").style.display = "none";
    document.getElementById("div-vertical-progress-bar").style.display = "flex";
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
const divGenerateProgressBar = document.getElementById("div-new-curate-meter-progress");
const generateProgressBar = document.getElementById("progress-bar-new-curate");
var progressStatus = document.getElementById("para-new-curate-progress-bar-status");

const checkEmptyFilesAndFolders = async (sodaJSONObj) => {
  let emptyFilesFoldersResponse;
  try {
    emptyFilesFoldersResponse = await client.post(
      `/curate_datasets/empty_files_and_folders`,
      {
        soda_json_structure: sodaJSONObj,
      },
      { timeout: 0 }
    );
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
    document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
      "<span style='color: red;'> Error: " + emessage + "</span>";
    document.getElementById("para-please-wait-new-curate").innerHTML = "";
    $("#sidebarCollapse").prop("disabled", false);
    return;
  }

  let { data } = emptyFilesFoldersResponse;

  log.info("Continue with curate");
  let errorMessage = "";
  error_files = data["empty_files"];
  //bring duplicate outside
  error_folders = data["empty_folders"];

  if (error_files.length > 0) {
    var error_message_files = backend_to_frontend_warning_message(error_files);
    errorMessage += error_message_files;
  }

  if (error_folders.length > 0) {
    var error_message_folders = backend_to_frontend_warning_message(error_folders);
    errorMessage += error_message_folders;
  }

  return errorMessage;
};

const setSodaJSONStartingPoint = (sodaJSONObj) => {
  if (sodaJSONObj["starting-point"]["type"] === "local") {
    sodaJSONObj["starting-point"]["type"] = "new";
  }
};

const setDatasetNameAndDestination = (sodaJSONObj) => {
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

  return [dataset_name, dataset_destination];
};

const deleteTreeviewFiles = (sodaJSONObj) => {
  // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
  if ("files" in sodaJSONObj["dataset-structure"]) {
    sodaJSONObj["dataset-structure"]["files"] = {};
  }
  // delete manifest files added for treeview
  for (var highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
      sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"][
        "forTreeview"
      ]
    ) {
      delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"];
    }
  }
};

document.getElementById("button-generate").addEventListener("click", async function () {
  $($($(this).parent()[0]).parents()[0]).removeClass("tab-active");
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("prevBtn").style.display = "none";
  document.getElementById("start-over-btn").style.display = "none";
  document.getElementById("div-vertical-progress-bar").style.display = "none";
  document.getElementById("div-generate-comeback").style.display = "none";
  document.getElementById("generate-dataset-progress-tab").style.display = "flex";
  $("#sidebarCollapse").prop("disabled", false);

  // updateJSON structure after Generate dataset tab
  updateJSONStructureGenerate(false, sodaJSONObj);

  setSodaJSONStartingPoint(sodaJSONObj);

  let [dataset_name, dataset_destination] = setDatasetNameAndDestination(sodaJSONObj);

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
  document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
  progressStatus.innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "none";

  progressBarNewCurate.value = 0;

  deleteTreeviewFiles(sodaJSONObj);

  document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";
  let errorMessage = await checkEmptyFilesAndFolders(sodaJSONObj);

  if (errorMessage) {
    errorMessage += "Would you like to continue?";
    errorMessage = "<div style='text-align: left'>" + errorMessage + "</div>";
    Swal.fire({
      icon: "warning",
      html: errorMessage,
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
        document.getElementById("para-please-wait-new-curate").innerHTML = "Return to make changes";
        document.getElementById("div-generate-comeback").style.display = "flex";
      }
    });
  } else {
    initiate_generate();
  }
});

const delete_imported_manifest = () => {
  for (let highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
    if ("manifest.xlsx" in sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]) {
      delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"];
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

// Generates a dataset organized in the Organize Dataset feature locally, or on Pennsieve
async function initiate_generate() {
  // Disable the Guided Mode sidebar button to prevent the sodaJSONObj from being modified
  document.getElementById("guided_mode_view").style.pointerEvents = "none";

  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  // get the amount of files
  document.getElementById("para-new-curate-progress-bar-status").innerHTML = "Preparing files ...";

  progressStatus.innerHTML = "Preparing files ...";

  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "block";
  document.getElementById("div-generate-comeback").style.display = "none";

  let organizeDataset = document.getElementById("organize_dataset_btn");
  let uploadLocally = document.getElementById("upload_local_dataset_btn");
  let curateNewDatasetButton = document.getElementById("guided-button-start-new-curate");
  let curateExistingDatasetButton = document.getElementById("guided-button-start-existing-curate");
  let organizeDataset_option_buttons = document.getElementById("div-generate-comeback");
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

  // Disable the Organize Dataset and Upload Locally buttons
  uploadLocally.disabled = true;
  organizeDataset.disabled = true;
  curateNewDatasetButton.disabled = true;
  curateExistingDatasetButton.disabled = true;

  // Add disabled appearance to the buttons
  curateExistingDatasetButton.className = "button-prompt-container curate-disabled-button";
  curateNewDatasetButton.className = "button-prompt-container curate-disabled-button";
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
    document.getElementById("generate-dataset-progress-tab").style.display = "flex";
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

  if ($("#generate-manifest-curate")[0].checked) {
    sodaJSONObj["manifest-files"]["auto-generated"] = true;
  }

  //dissmisButton.addEventListener("click", dismiss('status-bar-curate-progress'));
  if ("manifest-files" in sodaJSONObj) {
    if ("auto-generated" in sodaJSONObj["manifest-files"]) {
      if (sodaJSONObj["manifest-files"]["auto-generated"] === true) {
        delete_imported_manifest();
      }
    } else {
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
  let uploadedBytes = 0;
  let increaseInFileSize = 0;
  let generated_dataset_id = undefined;
  // when generating a new dataset we need to add its ID to the ID -> Name mapping
  // we need to do this only once
  // TODO: Integrate into modified analytics tracking
  let loggedDatasetNameToIdMapping = false;

  // determine where the dataset will be generated/uploaded
  let nameDestinationPair = determineDatasetDestination();
  dataset_name = nameDestinationPair[0];
  dataset_destination = nameDestinationPair[1];

  if (dataset_destination == "Pennsieve" || dataset_destination == "bf") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }

  client
    .post(
      `/curate_datasets/curation`,
      {
        soda_json_structure: sodaJSONObj,
      },
      { timeout: 0 }
    )
    .then(async (response) => {
      let { data } = response;

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
        uploadedFiles,
        false
      );

      if (dataset_destination == "bf" || dataset_destination == "Pennsieve") {
        // log the difference again to Google Analytics
        let finalFilesCount = uploadedFiles - filesOnPreviousLogPage;
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE + "- Step 7 - Generate - Dataset - Number of Files",
          `${datasetUploadSession.id}`,
          finalFilesCount
        );

        let differenceInBytes = main_total_generate_dataset_size - bytesOnPreviousLogPage;
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE + " - Step 7 - Generate - Dataset - Size",
          `${datasetUploadSession.id}`,
          differenceInBytes
        );
      }

      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";

      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: defaultBfAccount,
          },
        });
        datasetList = [];
        datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
      }
    })
    .catch(async (error) => {
      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";

      clientError(error);
      let emessage = userErrorMessage(error);

      if (dataset_destination == "bf" || dataset_destination == "Pennsieve") {
        // log the difference again to Google Analytics
        let finalFilesCount = uploadedFiles - filesOnPreviousLogPage;
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE + "- Step 7 - Generate - Dataset - Number of Files",
          `${datasetUploadSession.id}`,
          finalFilesCount
        );

        let differenceInBytes = uploadedBytes - bytesOnPreviousLogPage;
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE + " - Step 7 - Generate - Dataset - Size",
          `${datasetUploadSession.id}`,
          differenceInBytes
        );
      }

      // log the curation errors to Google Analytics
      logCurationErrorsToAnalytics(
        0,
        0,
        dataset_destination,
        main_total_generate_dataset_size,
        increaseInFileSize,
        datasetUploadSession,
        false
      );

      //Enable the buttons
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      curateExistingDatasetButton.disabled = false;
      curateNewDatasetButton.disabled = false;
      uploadLocally.disabled = false;
      $("#sidebarCollapse").prop("disabled", false);

      //Add the original classes back to the buttons
      curateExistingDatasetButton.className = "button-prompt-container";
      curateNewDatasetButton.className = "button-prompt-container";
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";

      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
        "<span style='color: red;'>" + emessage + "</span>";

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
          document.getElementById("div-vertical-progress-bar").style.display = "none";
          document.getElementById("div-generate-comeback").style.display = "flex";
          document.getElementById("generate-dataset-progress-tab").style.display = "flex";
        }
      });
      progressStatus.innerHTML = "";
      statusText.innerHTML = "";
      document.getElementById("div-new-curate-progress").style.display = "none";
      generateProgressBar.value = 0;

      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: defaultBfAccount,
          },
        });
        datasetList = [];
        datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
        emessage = userErrorMessage(error);
      }
    });

  // Progress tracking function for main curate
  var timerProgress = setInterval(mainProgressFunction, 50);
  var successful = false;

  async function mainProgressFunction() {
    let mainCurationProgressResponse;
    try {
      mainCurationProgressResponse = await client.get(`/curate_datasets/curation/progress`);
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
        "<span style='color: red;'>" + emessage + "</span>";
      log.error(error);

      //Enable the buttons (organize datasets, upload locally, curate existing dataset, curate new dataset)
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      curateExistingDatasetButton.disabled = false;
      curateNewDatasetButton.disabled = false;
      uploadLocally.disabled = false;

      //Add the original classes back to the buttons
      curateExistingDatasetButton.className = "button-prompt-container";
      curateNewDatasetButton.className = "button-prompt-container";
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
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
          document.getElementById("div-vertical-progress-bar").style.display = "none";
          document.getElementById("div-generate-comeback").style.display = "none";
          document.getElementById("generate-dataset-progress-tab").style.display = "flex";
        }
      });

      //Enable the buttons (organize datasets, upload locally, curate existing dataset, curate new dataset)
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      uploadLocally.disabled = false;
      curateExistingDatasetButton.disabled = false;
      curateNewDatasetButton.disabled = false;

      //Add the original classes back to the buttons
      curateExistingDatasetButton.className = "button-prompt-container";
      curateNewDatasetButton.className = "button-prompt-container";
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";

      console.error(error);
      //Clear the interval to stop the generation of new sweet alerts after intitial error
      clearInterval(timerProgress);
      return;
    }

    let { data } = mainCurationProgressResponse;

    main_curate_status = data["main_curate_status"];
    var start_generate = data["start_generate"];
    var main_curate_progress_message = data["main_curate_progress_message"];
    main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
    var main_generated_dataset_size = data["main_generated_dataset_size"];
    var elapsed_time_formatted = data["elapsed_time_formatted"];
    let total_files_uploaded = data["total_files_uploaded"];

    // used for logging in the error case ( inside /curation's catch block )
    uploadedFiles = total_files_uploaded;
    uploadedBytes = main_generated_dataset_size;

    if (start_generate === 1) {
      var value = (main_generated_dataset_size / main_total_generate_dataset_size) * 100;
      generateProgressBar.value = value;
      statusMeter.value = value;
      if (main_total_generate_dataset_size < displaySize) {
        var totalSizePrint = main_total_generate_dataset_size.toFixed(2) + " B";
      } else if (main_total_generate_dataset_size < displaySize * displaySize) {
        var totalSizePrint = (main_total_generate_dataset_size / displaySize).toFixed(2) + " KB";
      } else if (main_total_generate_dataset_size < displaySize * displaySize * displaySize) {
        var totalSizePrint =
          (main_total_generate_dataset_size / displaySize / displaySize).toFixed(2) + " MB";
      } else {
        var totalSizePrint =
          (main_total_generate_dataset_size / displaySize / displaySize / displaySize).toFixed(2) +
          " GB";
      }
      var progressMessage = "";
      var statusProgressMessage = "";
      progressMessage += main_curate_progress_message + "<br>";
      statusProgressMessage += "Progress: " + value.toFixed(2) + "%" + "<br>";
      statusProgressMessage += "Elapsed time: " + elapsed_time_formatted + "<br>";
      progressMessage +=
        "Progress: " + value.toFixed(2) + "%" + " (total size: " + totalSizePrint + ") " + "<br>";
      progressMessage += "Elapsed time: " + elapsed_time_formatted + "<br>";
      progressMessage += "Total files uploaded: " + total_files_uploaded + "<br>";
      progressStatus.innerHTML = progressMessage;
      statusText.innerHTML = statusProgressMessage;
      divGenerateProgressBar.style.display = "block";

      if (main_curate_progress_message.includes("Success: COMPLETED!")) {
        clearInterval(timerProgress);
        generateProgressBar.value = 100;
        statusMeter.value = 100;
        progressStatus.innerHTML = main_curate_status + smileyCan;
        statusText.innerHTML = main_curate_status + smileyCan;
        successful = true;
      }
    } else {
      statusText.innerHTML =
        main_curate_progress_message + "<br>" + "Elapsed time: " + elapsed_time_formatted + "<br>";
      progressStatus.innerHTML =
        main_curate_progress_message + "<br>" + "Elapsed time: " + elapsed_time_formatted + "<br>";
    }

    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      log.info("Done curate track");
      statusBarClone.remove();
      sparc_container.style.display = "inline";
      if (successful === true) {
        //Enable the buttons (organize datasets, upload locally, curate existing dataset, curate new dataset)
        organizeDataset.disabled = false;
        curateNewDatasetButton.disabled = false;
        curateExistingDatasetButton.disabled = false;
        uploadLocally.disabled = false;

        // Add the original classes back to the buttons
        organizeDataset_option_buttons.style.display = "flex";
        curateExistingDatasetButton.className = "button-prompt-container";
        curateNewDatasetButton.className = "button-prompt-container";
        organizeDataset.className = "content-button is-selected";
        organizeDataset.style = "background-color: #fff";
        uploadLocally.className = "content-button is-selected";
        uploadLocally.style = "background-color: #fff";

        uploadComplete.open({
          type: "success",
          message: "Dataset created successfully",
        });
      } else {
        //enable buttons anyways (organize datasets, upload locally, curate existing dataset, curate new dataset)
        organizeDataset_option_buttons.style.display = "flex";
        organizeDataset.disabled = false;
        curateNewDatasetButton.disabled = false;
        curateExistingDatasetButton.disabled = false;
        uploadLocally.disabled = false;

        // Add the original classes back to the buttons
        curateExistingDatasetButton.className = "button-prompt-container";
        curateNewDatasetButton.className = "button-prompt-container";
        organizeDataset.className = "content-button is-selected";
        organizeDataset.style = "background-color: #fff";
        uploadLocally.className = "content-button is-selected";
        uploadLocally.style = "background-color: #fff";
      }
      // then show the sidebar again
      // forceActionSidebar("show");
    }

    // if a new Pennsieve dataset was generated log it once to the dataset id to name mapping
    let generated_dataset_id = data["generated_dataset_id"];
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

    // if doing a pennsieve upload log as we go ( as well as at the end in failure or success case )
    if (dataset_destination == "Pennsieve" || dataset_destination == "bf") {
      logProgressToAnalytics(total_files_uploaded, main_generated_dataset_size);
    }
  }

  let bytesOnPreviousLogPage = 0;
  let filesOnPreviousLogPage = 0;
  const logProgressToAnalytics = (files, bytes) => {
    // log every 500 files -- will log on success/failure as well so if there are less than 500 files we will log what we uploaded ( all in success case and some of them in failure case )
    if (files >= filesOnPreviousLogPage + 500) {
      filesOnPreviousLogPage += 500;
      ipcRenderer.send(
        "track-event",
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE + "- Step 7 - Generate - Dataset - Number of Files",
        `${datasetUploadSession.id}`,
        500
      );

      let differenceInBytes = bytes - bytesOnPreviousLogPage;
      bytesOnPreviousLogPage = bytes;
      ipcRenderer.send(
        "track-event",
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE + " - Step 7 - Generate - Dataset - Size",
        `${datasetUploadSession.id}`,
        differenceInBytes
      );
    }
  };
} // end initiate_generate

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
    let statusBarContainer = document.getElementById("status-bar-curate-progress");
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
          return [sodaJSONObj["bf-dataset-selected"]["dataset-name"], "Pennsieve"];
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
          return [document.querySelector("#inputNewNameDataset").value, "Local"];
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
var metadataCurationMode = "";

function importMetadataFiles(ev, metadataFile, extensionList, paraEle, curationMode) {
  document.getElementById(paraEle).innerHTML = "";
  metadataIndividualFile = metadataFile;
  metadataAllowedExtensions = extensionList;
  metadataParaElement = paraEle;
  metadataCurationMode = curationMode;
  ipcRenderer.send("open-file-dialog-metadata-curate");
}

function importPennsieveMetadataFiles(ev, metadataFile, extensionList, paraEle) {
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
      let index = sodaJSONObj["metadata-files"][deleted_file_name]["action"].indexOf("deleted");
      sodaJSONObj["metadata-files"][deleted_file_name]["action"].splice(index, 1);
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
      var extension = path.basename(mypath[0]).slice(path.basename(mypath[0]).indexOf("."));

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
          if (metadataCurationMode === "free-form") {
            $($("#" + metadataParaElement).parents()[1])
              .find(".div-metadata-confirm")
              .css("display", "flex");
            $($("#" + metadataParaElement).parents()[1])
              .find(".div-metadata-go-back")
              .css("display", "none");
          }
          if (metadataCurationMode === "guided") {
            //Add success checkmark lottie animation inside metadata card
            const dragDropContainer = document.getElementById(metadataParaElement).parentElement;
            //get the value of data-code-metadata-file-type from dragDropContainer
            const metadataFileType = dragDropContainer.dataset.codeMetadataFileType;
            //save the path of the metadata file to the json object
            sodaJSONObj["dataset-metadata"]["code-metadata"][metadataFileType] = mypath[0];

            const lottieContainer = dragDropContainer.querySelector(
              ".code-metadata-lottie-container"
            );
            lottieContainer.innerHTML = "";
            lottie.loadAnimation({
              container: lottieContainer,
              animationData: successCheck,
              renderer: "svg",
              loop: false,
              autoplay: true,
            });
          }
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

// When mode = "update", the buttons won't be hidden or shown to prevent button flickering effect
const curation_consortium_check = async (mode = "") => {
  let selected_account = defaultBfAccount;
  let selected_dataset = defaultBfDataset;

  $(".spinner.post-curation").show();
  $("#curation-team-unshare-btn").hide();
  $("#sparc-consortium-unshare-btn").hide();
  $("#curation-team-share-btn").hide();
  $("#sparc-consortium-share-btn").hide();

  try {
    let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
      params: {
        selected_account: defaultBfAccount,
      },
    });
    let res = bf_account_details_req.data;
    let organization_id = res["organization_id"];
    // TODO: RE_JOIN: Handle when changing bf_account_details to not return the organization id
    if (organization_id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0") {
      $("#current_curation_team_status").text("None");
      $("#current_sparc_consortium_status").text("None");

      Swal.fire({
        title: "Failed to share with Curation team!",
        text: "This account is not in the SPARC organization. Please switch accounts and try again",
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
        let bf_get_permissions = await api.getDatasetPermissions(
          selected_account,
          selected_dataset,
          true
        );
        // let bf_get_permissions = await client.get(`/manage_datasets/bf_dataset_permissions`, {
        //   params: {
        //     selected_account: selected_account,
        //     selected_dataset: selected_dataset,
        //   },
        // });

        let permissions = bf_get_permissions.permissions;
        let team_ids = bf_get_permissions.team_ids;

        let curation_permission_satisfied = false;
        let consortium_permission_satisfied = false;
        let curation_return_status = false;
        let consortium_return_status = false;

        for (var team of team_ids) {
          // SPARC Data Curation Team's id
          if (team["team_id"] == "N:team:d296053d-91db-46ae-ac80-3c137ea144e4") {
            if (team["team_role"] == "manager") {
              curation_permission_satisfied = true;
            }
          }

          // SPARC Embargoed Data Sharing Group's id
          if (team["team_id"] == "N:team:ee8d665b-d317-40f8-b63d-56874cf225a1") {
            if (team["team_role"] == "viewer") {
              consortium_permission_satisfied = true;
            }
          }
        }

        if (!curation_permission_satisfied) {
          $("#current_curation_team_status").text("Not shared with the curation team");
          curation_return_status = true;
        }
        if (!consortium_permission_satisfied) {
          $("#current_sparc_consortium_status").text("Not shared with the SPARC Consortium");
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
          let bf_dataset_permissions = await client.get(`/manage_datasets/bf_dataset_status`, {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: defaultBfDataset,
            },
          });
          let res = bf_dataset_permissions.data;

          let dataset_status_value = res["current_status"];
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
            $("#current_curation_team_status").text("Not shared with the curation team");
            curation_return_status = true;
          }
          if (!consortium_status_satisfied) {
            $("#current_sparc_consortium_status").text("Not shared with the SPARC Consortium");
            consortium_return_status = true;
          }

          if (curation_return_status) {
            $("#curation-team-unshare-btn").hide();
            $("#curation-team-share-btn").show();
          } else {
            $("#current_curation_team_status").text("Shared with the curation team");
            $("#curation-team-unshare-btn").show();
            $("#curation-team-share-btn").hide();
          }

          if (consortium_return_status) {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
          } else {
            $("#current_sparc_consortium_status").text("Shared with the SPARC Consortium");
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
      await client.post(
        `/curate_datasets/manifest_files`,
        {
          generate_purpose: "",
          soda_json_object: temp_sodaJSONObj,
        },
        { timeout: 0 }
      );

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

async function showBFAddAccountSweetalert() {
  await Swal.fire({
    title: bfaddaccountTitle,
    html: bfAddAccountBootboxMessage,
    showLoaderOnConfirm: true,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Connect to Pennsieve",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: `<a target="_blank" href="https://docs.sodaforsparc.io/docs/manage-dataset/connect-your-pennsieve-account-with-soda#how-to-login-with-api-key" style="text-decoration: none;">Help me get an API key</a>`,
    didOpen: () => {
      let swal_container = document.getElementsByClassName("swal2-popup")[0];
      swal_container.style.width = "43rem";
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: (result) => {
      if (result === true) {
        var name = $("#bootbox-key-name").val();
        var apiKey = $("#bootbox-api-key").val();
        var apiSecret = $("#bootbox-api-secret").val();
        return new Promise(() => {
          client
            .put("/manage_datasets/account/api_key", {
              keyname: name,
              key: apiKey,
              secret: apiSecret,
            })
            .then((response) => {
              $("#bootbox-key-name").val("");
              $("#bootbox-api-key").val("");
              $("#bootbox-api-secret").val("");
              bfAccountOptions[name] = name;
              defaultBfAccount = name;
              defaultBfDataset = "Select dataset";
              return new Promise((resolve, reject) => {
                client
                  .get("/manage_datasets/bf_account_details", {
                    params: {
                      selected_account: name,
                    },
                  })
                  .then((response) => {
                    let accountDetails = response.data.account_details;
                    $("#para-account-detail-curate").html(accountDetails);
                    $("#current-bf-account").text(name);
                    $("#current-bf-account-generate").text(name);
                    $("#create_empty_dataset_BF_account_span").text(name);
                    $(".bf-account-span").text(name);
                    $("#current-bf-dataset").text("None");
                    $("#current-bf-dataset-generate").text("None");
                    $(".bf-dataset-span").html("None");
                    $("#para-account-detail-curate-generate").html(accountDetails);
                    $("#para_create_empty_dataset_BF_account").html(accountDetails);
                    $("#para-account-detail-curate-generate").html(accountDetails);
                    $(".bf-account-details-span").html(accountDetails);
                    $("#para-continue-bf-dataset-getting-started").text("");
                    showHideDropdownButtons("account", "show");
                    confirm_click_account_function();
                    updateBfAccountList();
                  })
                  .catch((error) => {
                    Swal.showValidationMessage(userErrorMessage(error));
                    document.getElementsByClassName(
                      "swal2-actions"
                    )[0].children[1].disabled = false;
                    document.getElementsByClassName(
                      "swal2-actions"
                    )[0].children[3].disabled = false;
                    document.getElementsByClassName("swal2-actions")[0].children[0].style.display =
                      "none";
                    document.getElementsByClassName("swal2-actions")[0].children[1].style.display =
                      "inline-block";
                    showHideDropdownButtons("account", "hide");
                    confirm_click_account_function();
                  });

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
              });
            })
            .catch((error) => {
              clientError(error);
              Swal.showValidationMessage(userErrorMessage(error));
              document.getElementsByClassName("swal2-actions")[0].children[1].disabled = false;
              document.getElementsByClassName("swal2-actions")[0].children[3].disabled = false;
              document.getElementsByClassName("swal2-actions")[0].children[0].style.display =
                "none";
              document.getElementsByClassName("swal2-actions")[0].children[1].style.display =
                "inline-block";
            });
        });
      }
    },
  });
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
      ipcRenderer.send("track-event", `${category}`, actionName, defaultBfDatasetId);
    } else {
      ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
    }
  }
}

// Log the size of a metadata file that was created locally or uploaded to Pennsieve
// Inputs:
//    uploadBFBoolean: boolean - True when the metadata file was created on Pennsieve; false when the Metadata file was created locally
//    metadataFileName: string - the name of the metadata file that was created along with its extension
async function logMetadataSizeForAnalytics(uploadBFBoolean, metadataFileName, size) {
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
  let metadataFileWithoutExtension = metadataFileName.slice(0, metadataFileName.indexOf("."));

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
  MANAGE_DATASETS_RENAME_DATASET: "Manage Datasets - Rename an existing dataset",
  MANAGE_DATASETS_MAKE_PI_OWNER: "Manage Datasets - Make PI owner of dataset",
  MANAGE_DATASETS_ADD_EDIT_PERMISSIONS: "Manage Datasets - Add/Edit Permissions",
  MANAGE_DATASETS_ADD_EDIT_SUBTITLE: "Manage Datasets - Add/Edit Subtitle",
  MANAGE_DATASETS_ADD_EDIT_README: "Manage Datasets - Add/Edit Readme",
  MANAGE_DATASETS_ADD_EDIT_BANNER: "Manage Datasets - Upload a Banner Image",
  MANAGE_DATASETS_ADD_EDIT_TAGS: "Manage Datasets - Add/Edit Tags",
  MANAGE_DATASETS_ASSIGN_LICENSE: "Manage Datasets - Assign a License",
  MANAGE_DATASETS_UPLOAD_LOCAL_DATASET: "Manage Datasets - Upload Local Dataset",
  MANAGE_DATASETS_CHANGE_STATUS: "Manage Datasets - Change Dataset Status",
};

const DisseminateDatasetsAnalyticsPrefix = {
  DISSEMINATE_REVIEW: "Disseminate Datasets - Pre-publishing Review",
  DISSEMINATE_CURATION_TEAM: "Disseminate Datasets - Share with Curation Team",
  DISSEMINATE_SPARC_CONSORTIUM: "Disseminate Datasets - Share with SPARC Consortium",
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
      ipcRenderer.send("track-event", `${category}`, actionName, actions[idx], 1);
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
      ipcRenderer.send("track-event", `${category}`, actionName, defaultBfDatasetId);
    } else {
      // log the location as a label and add an aggregation value
      ipcRenderer.send("track-event", `${category}`, actionName, location, 1);
    }
  }
}

const getMetadataFileNameFromStatus = (metadataFileStatus) => {
  // get the UI text that displays the file path
  let filePath = metadataFileStatus.text();

  let fileName = path.basename(filePath);

  // remove the extension
  fileName = fileName.slice(0, fileName.indexOf("."));

  return fileName;
};

const determineLocationFromStatus = (metadataFileStatus) => {
  let filePath = metadataFileStatus.text();

  // determine if the user imported from Pennsieve or Locally
  let pennsieveFile = filePath.toUpperCase().includes("Pennsieve".toUpperCase());

  return pennsieveFile;
};

const logGeneralOperationsForAnalytics = (category, analyticsPrefix, granularity, actions) => {
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
      ipcRenderer.send("track-event", `${category}`, actionName, defaultBfDatasetId);
    }
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
    throw new Error("Error: Must provide a valid dataset to check permissions for.");
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
      throw new Error(`${statusCode} - You do not have access to this dataset. `);

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
    throw new Error("Error: Must provide a valid dataset to check permissions for.");
  }

  // get the dataset the user wants to edit
  let role = await getCurrentUserPermissions(datasetIdOrName);

  return userIsOwner(role);
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

  $("#dataset_validator_status").text("Please wait while we retrieve the dataset...");
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
    $("#dataset_validator_status").html(`<span style='color: red;'> ${error}</span>`);
  }

  $("#dataset_validator_status").text("Please wait while we validate the dataset...");

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
    $("#dataset_validator_spinner").hide();
    $("#dataset_validator_status").html(`<span style='color: red;'> ${error}</span>`);
  }

  create_validation_report(res);
  $("#dataset_validator_status").html("");
  $("#dataset_validator_spinner").hide();
});

//function used to scale banner images
const scaleBannerImage = async (imagePath) => {
  try {
    let imageScaled = await client.post(
      `/manage_datasets/scale_image`,
      {
        image_file_path: imagePath,
      },
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: defaultBfDataset,
        },
      }
    );
    return imageScaled.data.scaled_image_path;
  } catch (error) {
    clientError(error);
    return error.response;
  }
};

function openFeedbackForm() {
  let feedback_btn = document.getElementById("feedback-btn");
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
function gatherLogs() {
  //function will be used to gather all logs on all OS's
  let homedir = os.homedir();
  let file_path = "";
  let clientLogsPath = "";
  let serverLogsPath = path.join(homedir, "SODA", "logs");
  let logFiles = ["main.log", "renderer.log", "agent.log", "api.log"];

  if (os.platform() === "darwin") {
    clientLogsPath = path.join(homedir, "/Library/Logs/SODA for SPARC/");
  } else if (os.platform() === "win32") {
    clientLogsPath = path.join(homedir, "AppData", "Roaming", "SODA for SPARC", "logs");
  } else {
    clientLogsPath = path.join(homedir, ".config", "SODA for SPARC", "logs");
  }

  Swal.fire({
    title: "Select a destination to create log folder",
    html: `<div style="margin-bottom:1rem;"><p>Please note that any log files that are in your destination already will be overwritten.</p></div><input class="form-control" id="selected-log-destination" type="text" readonly="" placeholder="Select a destination">`,
    heightAuto: false,
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: true,
    didOpen: () => {
      let swal_alert_confirm = document.getElementsByClassName("swal2-confirm swal2-styled")[0];
      swal_alert_confirm.setAttribute("disabled", true);

      let log_destination_input = document.getElementById("selected-log-destination");
      log_destination_input.addEventListener("click", function () {
        ipcRenderer.send("open-file-dialog-log-destination");
      });
      ipcRenderer.on("selected-log-folder", (event, result) => {
        file_path = result["filePaths"][0];
        if (file_path != undefined) {
          log_destination_input.value = file_path;
          swal_alert_confirm.removeAttribute("disabled");
        } else {
          Swal.showValidationMessage(`Please enter a destination`);
        }
      });
    },
    preConfirm: () => {
      let log_destination_input = document.getElementById("selected-log-destination");
      if (log_destination_input.value === "" || log_destination_input.value === undefined) {
        Swal.showValidationMessage(`Please enter a destination`);
      }
    },
  }).then((result) => {
    if (result.isConfirmed === true) {
      if (file_path !== undefined || file_path !== "") {
        Swal.fire({
          title: "Creating log folder",
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

        let log_folder = path.join(file_path, "/SODA-For-SPARC-Logs/");
        try {
          fs.mkdirSync(log_folder, { recursive: true });
          // destination will be created or overwritten by default.
          for (const logFile of logFiles) {
            let logFilePath;
            let missingLog = false;
            if (logFile === "agent.log") {
              logFilePath = path.join(homedir, ".pennsieve", logFile);
              if (!fs.existsSync(logFilePath)) missingLog = true;
            } else if (logFile === "api.log") {
              logFilePath = path.join(serverLogsPath, logFile);
              if (!fs.existsSync(logFilePath)) missingLog = true;
            } else {
              logFilePath = path.join(clientLogsPath, logFile);
              if (!fs.existsSync(logFilePath)) missingLog = true;
            }
            if (!missingLog) {
              let log_copy = path.join(log_folder, logFile);

              fs.copyFileSync(logFilePath, log_copy);
            }
          }
          Swal.close();

          Swal.fire({
            title: "Success!",
            text: `Successfully created SODA-For-SPARC-Logs in ${file_path}`,
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              if (document.getElementsByClassName("swal2-loader").length > 0) {
                document.getElementsByClassName("swal2-loader")[0].style.display = "none";
                document.getElementsByClassName("swal2-confirm swal2-styled")[0].style.display =
                  "block";
              }
            },
          });
        } catch (error) {
          clientError(error);
          Swal.fire({
            title: "Failed to create log folder!",
            text: error,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              if (document.getElementsByClassName("swal2-loader").length > 0) {
                document.getElementsByClassName("swal2-loader")[0].style.display = "none";
                document.getElementsByClassName("swal2-confirm swal2-styled")[0].style.display =
                  "block";
              }
            },
          });
        }
      }
    }
  });
}

const gettingStarted = () => {
  let getting_started = document.getElementById("main_tabs_view");
  getting_started.click();
};

const sodaVideo = () => {
  document.getElementById("overview-column-1").blur();
  shell.openExternal("https://docs.sodaforsparc.io/docs/getting-started/user-interface");
};

const directToDocumentation = () => {
  shell.openExternal(
    "https://docs.sodaforsparc.io/docs/getting-started/organize-and-submit-sparc-datasets-with-soda"
  );
  document.getElementById("overview-column-2").blur();
  // window.open('https://docs.sodaforsparc.io', '_blank');
};
const directToGuidedMode = () => {
  const guidedModeLinkButton = document.getElementById("guided_mode_view");
  guidedModeLinkButton.click();
};
const directToFreeFormMode = () => {
  const freeFormModeLinkButton = document.getElementById("main_tabs_view");
  freeFormModeLinkButton.click();
};
document.getElementById("doc-btn").addEventListener("click", directToDocumentation);
document
  .getElementById("home-button-interface-instructions-link")
  .addEventListener("click", sodaVideo);
document
  .getElementById("home-button-guided-mode-link")
  .addEventListener("click", directToGuidedMode);
document
  .getElementById("home-button-free-form-mode-link")
  .addEventListener("click", directToFreeFormMode);

tippy("#datasetPathDisplay", {
  placement: "top",
  theme: "soda",
  maxWidth: "100%",
});

const createSpreadSheetWindow = async (spreadsheet) => {
  ipcRenderer.send("spreadsheet", spreadsheet);
};
