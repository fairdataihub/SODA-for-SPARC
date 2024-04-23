// //////////////////////////////////
// // Import required modules
// //////////////////////////////////

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

import * as os from "os";
import * as path from "path";
import Editor from "@toast-ui/editor";
// const remote = require("@electron/remote");
import { Notyf } from "notyf";
import { v4 as uuidv4 } from "uuid";
import Tagify from "@yaireo/tagify/dist/tagify.esm";
// const https = require("https");
// const electron = require("electron");
import jQuery from "jquery";
import bootstrap from "bootstrap";
import * as popper from "@popperjs/core";
import "bootstrap-select";
import * as select2 from "select2"; // TODO: select2()
// import * as bootbox from "bootbox";
import DragSelect from "dragselect";
import excelToJson from "convert-excel-to-json";
import csvToJson from "convert-csv-to-json";
import tippy from "tippy.js";
import introJs from "intro.js";
// import selectpicker  from "bootstrap-select";
import validator from "validator";
import doiRegex from "doi-regex";
import lottie from "lottie-web";
import { dragDrop, successCheck } from "../../assets/lotties/lotties";
import autoComplete from "@tarekraafat/autocomplete.js/dist/autoComplete.min.js";
import Cropper from "cropperjs";
import DragSort from "@yaireo/dragsort";
import axios from "axios";
import Swal from "sweetalert2";
import DatePicker from "tui-date-picker";
import datasetUploadSession from "../analytics/upload-session-tracker";
import kombuchaEnums from "../analytics/analytics-enums";
import client from "../client";
import {
  createEventData,
  logSelectedUpdateExistingDatasetOptions,
} from "../analytics/curation-analytics";
import createEventDataPrepareMetadata from "../analytics/prepare-metadata-analytics";
import determineDatasetLocation, { Destinations } from "../analytics/analytics-utils";
import { clientError, userErrorMessage } from "./http-error-handler/error-handler";
import hasConnectedAccountWithPennsieve from "./authentication/auth";
import api from "./api/api";
import {
  confirm_click_account_function,
  showHideDropdownButtons,
  updateDatasetList,
  bfAccountOptions,
} from "../globals";
import checkForAnnouncements from "./announcements";
import {
  swalFileListSingleAction,
  swalFileListTripleAction,
  swalFileListDoubleAction,
  swalShowError,
  swalConfirmAction,
} from "../utils/swal-utils";
import canSmiley from "/img/can-smiley.png";
import canSad from "/img/can-sad.png";

// add jquery to the window object
window.$ = jQuery;
window.jQuery = jQuery;
window.select2 = select2;

document.addEventListener("DOMContentLoaded", function () {
  $("select").select2();
});

// // const prevent_sleep_id = "";
// // const electron_app = electron.app;
// const { app } = remote;
// const Clipboard = electron.clipboard;

window.nextBtnDisabledVariable = true;

window.datasetStructureJSONObj = {
  folders: {},
  files: {},
  type: "",
};

window.introStatus = {
  organizeStep3: true,
  submission: false,
  subjects: false,
  samples: false,
};

// //////////////////////////////////
// // App launch actions
// //////////////////////////////////

// // Log file settings //
window.log.setupRendererLogOptions();
window.homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");

// set to true once the SODA server has been connected to
// TODO: Fix this since we removed updating this variable in the startup logic
let sodaIsConnected = false;
// set to true once the API version has been confirmed
let apiVersionChecked = false;

//log user's OS version //
window.log.info(
  "User OS:",
  window.os.type(),
  window.os.platform(),
  "version:",
  window.os.release()
);

// // Check current app version //
const appVersion = await window.electron.ipcRenderer.invoke("app-version");
window.log.info("Current SODA version:", appVersion);

document.getElementById("guided_mode_view").click();

// check for announcements on startup; if the user is in the auto update workflow do not check for announcements
// Rationale: The auto update workflow involves refreshing the DOM which will cause a re-run of
//            the renderer process. One potential outcome of this is the renderer reaches this code block before the refresh
//            and sets the launch_announcements flag to false. On the second run, the one which the user will have time to see announcements
//            before the DOM reloads, the announcements will not be checked or displayed at all.
let autoUpdateLaunch = await window.electron.ipcRenderer.invoke(
  "get-nodestorage-key",
  "auto_update_launch"
);
let launchAnnouncement = await window.electron.ipcRenderer.invoke(
  "get-nodestorage-key",
  "launch_announcements"
);
if (autoUpdateLaunch == false || autoUpdateLaunch == null || autoUpdateLaunch == undefined) {
  // if launchAnnouncements is undefined/null then announcements havent been launched yet; set launch_announcements to true
  // later code will reference this flag to determine if announcements should be checked for
  if (launchAnnouncement === undefined || launchAnnouncement === null) {
    launchAnnouncement = true;
  }
  // do not check for announcements on the next launch
  await window.electron.ipcRenderer.invoke("set-nodestorage-key", "launch_announcements", false); // NOTE: launch_announcements is only set to true during the auto update process ( see main.js )
}

// //////////////////////////////////
// // Connect to Python back-end
// //////////////////////////////////

window.notyf = new Notyf({
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
      type: "info-grey",
      background: "grey",
      icon: {
        className: "fas fa-info-circle",
        tagName: "i",
        color: "white",
      },
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
window.wait = async (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// check that the client connected to the server using exponential backoff
// verify the api versions match
const startupServerAndApiCheck = async () => {
  // wait for SWAL to be loaded in
  await window.wait(2000);

  // notify the user that the application is starting connecting to the server
  Swal.fire({
    icon: "info",
    title: `Initializing SODA's background services<br /><br />This may take several minutes...`,
    heightAuto: true,
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
    let time_pass = new Date() - time_start;
    if (status) {
      break;
    }
    if (time_pass > 300000) {
      break;
    } //break after five minutes
    await window.wait(2000);
  }

  if (!status) {
    //two minutes pass then handle connection error
    // SWAL that the server needs to be restarted for the app to work
    clientError(error);
    window.electron.ipcRenderer.send("track-event", "Error", "Establishing Python Connection");
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.STARTUP,
      kombuchaEnums.Action.APP_LAUNCHED,
      kombuchaEnums.Label.PYTHON_CONNECTION,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
      }
    );

    await Swal.fire({
      icon: "error",
      html: `Something went wrong while initializing SODA's background services. Please restart SODA and try again. If this issue occurs multiple times, please email <a target="_blank" href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Restart now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // Restart the app
    await window.electron.ipcRenderer.invoke("relaunch-soda");
  }

  sodaIsConnected = true;

  window.log.info("Connected to Python back-end successfully");
  window.electron.ipcRenderer.send("track-event", "Success", "Establishing Python Connection");
  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.STARTUP,
    kombuchaEnums.Action.APP_LAUNCHED,
    kombuchaEnums.Label.PYTHON_CONNECTION,
    kombuchaEnums.Status.SUCCESS,
    {
      value: 1,
    }
  );

  // dismiss the Swal
  Swal.close();

  // check if the API versions match
  try {
    await apiVersionsMatch();
  } catch (e) {
    // api versions do not match
    await window.electron.ipcRenderer.invoke("exit-soda");
  }

  if (launchAnnouncement) {
    await Swal.close();
    await checkForAnnouncements("announcements");
    launchAnnouncement = false;
    window.electron.ipcRenderer.invoke("set-nodestorage-key", "announcements", false);
  }

  apiVersionChecked = true;

  // get apps base path
  const basepath = await window.electron.ipcRenderer.invoke("get-app-path", undefined);
  const resourcesPath = window.process.resourcesPath();
  // set the templates path
  try {
    await client.put("prepare_metadata/template_paths", {
      basepath: basepath,
      resourcesPath: resourcesPath,
    });
  } catch (error) {
    clientError(error);

    window.electron.ipcRenderer.send("track-event", "Error", "Setting Templates Path");
    return;
  }

  window.electron.ipcRenderer.send("track-event", "Success", "Setting Templates Path");
};
startupServerAndApiCheck().then(async () => {
  // get the current user profile name using electron
  const { username } = window.os.userInfo();

  let usernameExists = await window.electron.ipcRenderer.invoke("get-nodestorage-item", username);

  // check if a shortened uuid exists in local storage
  if (usernameExists) {
    return;
  }

  // generate a UUID
  const uuid = uuidv4();

  // get the first 4 characters of the UUID
  const uuidShort = uuid.substring(0, 4);

  // store the shortened uuid in local storage
  // RATIONALE: this is used as a prefix that is unique per each client machine + profile name combination
  await window.electron.ipcRenderer.invoke("set-nodestorage-key", username, uuidShort);
});

// Check if we are connected to the Pysoda server
// Check app version on current app and display in the side bar
// Also check the core systems to make sure they are all operational
const initializeSODARenderer = async () => {
  // check that the server is live and the api versions match
  await startupServerAndApiCheck();

  window.log.info("Server is live and API versions match");

  // check integrity of all the core systems
  await window.run_pre_flight_checks();

  window.log.info("Pre flight checks finished");
};

initializeSODARenderer();

const stopPennsieveAgent = async () => {
  try {
    let agentStopSpawn = await window.spawn.stopPennsieveAgent();
  } catch (error) {
    window.log.info(error);
    throw error;
  }
};
const startPennsieveAgent = async () => {
  try {
    let agentStartSpawn = await window.spawn.startPennsieveAgentStart();
    return agentStartSpawn;
  } catch (e) {
    window.log.error(e);
    throw e;
  }
};

const getPennsieveAgentVersion = async () => {
  window.log.info("Getting Pennsieve agent version");

  try {
    let agentVersion = await window.spawn.getPennsieveAgentVersion();
    return agentVersion;
  } catch (error) {
    clientError(error);
    throw error;
  }
};

let preFlightCheckNotyf = null;

const agent_installed = async () => {
  try {
    let agentStartSpawn = await window.spawn.startPennsieveAgent();
    return agentStartSpawn;
  } catch (e) {
    window.log.info(e);
    throw e;
  }
};
let userHasSelectedTheyAreOkWithOutdatedAgent = false;

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
window.run_pre_flight_checks = async (check_update = true) => {
  try {
    window.log.info("Running pre flight checks");

    if (!preFlightCheckNotyf) {
      preFlightCheckNotyf = window.notyf.open({
        duration: 25000,
        type: "info",
        duration: "15000",
        message: "Checking SODA's connection to Pennsieve...",
      });
    }

    // Check the internet connection and if available check the rest.
    const userConnectedToInternet = await checkInternetConnection();
    if (!userConnectedToInternet) {
      throw new Error(
        "It seems that you are not connected to the internet. Please check your connection and try again."
      );
    }

    // Check for an API key pair in the default profile and ensure it is not obsolete.
    // NOTE: Calling the agent startup command without a profile setup in the config.ini file causes it to crash.
    // TODO: Ensure we clear the cache here
    const account_present = await window.check_api_key();

    // Add a new api key and secret for validating the user's account in the current workspace.
    if (!account_present) {
      // Dismiss the preflight check notification if it is still open
      if (preFlightCheckNotyf) {
        window.notyf.dismiss(preFlightCheckNotyf);
        preFlightCheckNotyf = null;
      }

      if (check_update) {
        checkNewAppVersion();
      }

      // If there is no API key pair, show the warning and let them add a key. Messages are dissmisable.
      const { value: userChoseToLogIn } = await Swal.fire({
        icon: "warning",
        text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connected to Pennsieve. Would you like to do it now?",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Yes",
        showCancelButton: true,
        reverseButtons: window.reverseSwalButtons,
        cancelButtonText: "I'll do it later",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      // If user chose to log in, open the dropdown prompt
      if (userChoseToLogIn) {
        // TODO: The user can cancel at anytime without adding an account. We return false in that case
        await window.addBfAccount(null, false);
      } else {
        return false;
      }

      // user did not add an account so return false
      // TODO: Add notyf
      if (!window.defaultBfAccount) return false;

      // check that the valid api key in the default profile is for the user's current workspace
      // IMP NOTE: There can be different API Keys for each workspace and the user can switch between workspaces. Therefore a valid api key
      //           under the default profile does not mean that key is associated with the user's current workspace.
      let matching = await window.defaultProfileMatchesCurrentWorkspace();
      if (!matching) {
        log.info("Default api key is for a different workspace");
        await window.switchToCurrentWorkspace();
        return false;
      }
    }

    // check if the Pennsieve agent is installed [ here ]
    try {
      let installed = await agent_installed();
      if (!installed) {
        const downloadUrl = await getPlatformSpecificAgentDownloadURL();
        const { value: restartSoda } = await Swal.fire({
          icon: "info",
          title: "Pennsieve Agent Not Found",
          html: `
                  It looks like the Pennsieve Agent is not installed on your computer. It is recommended that you install the Pennsieve Agent now if you want to upload datasets to Pennsieve through SODA.
                  <br />
                  To install the Pennsieve Agent, please visit the link below and follow the instructions.
                  <br /> 
                  <br />
                  <a href="${downloadUrl}" target="_blank">Download the Pennsieve agent</a>
                  <br />
                  <br />
                  Once you have installed the Pennsieve Agent, you will need to close and restart SODA before you can upload datasets. Would you like to close SODA now?
                `,
          width: 800,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: true,
          showCloseButton: true,
          reverseButtons: window.reverseSwalButtons,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });

        if (restartSoda) {
          await window.electron.ipcRenderer.invoke("exit-soda");
        }

        // Dismiss the preflight check notification if it is still open
        if (preFlightCheckNotyf) {
          window.notyf.dismiss(preFlightCheckNotyf);
          preFlightCheckNotyf = null;
        }

        // If the user clicks doesn't want to close SODA return false so the client code knows the pre flight checks failed
        return false;
      }
    } catch (error) {
      clientError(error);
      const emessage = userErrorMessage(error);

      const { value: restartSoda } = await Swal.fire({
        icon: "error",
        title: "Error Determining if the Pennsieve Agent is Installed",
        html: `
          <br />
          <div class="div--code-block-error">${emessage}</div>
          <br />
          Please view the <a href="https://docs.sodaforsparc.io/docs/common-errors/installing-the-pennsieve-agent" target="_blank">SODA documentation</a>
          for Pennsieve Agent installation instructions. Once installed restart SODA for SPARC. If you continue to receive this issue after  
          restarting SODA for SPARC please reach out to the SODA team using the "Contact Us" button in the side bar. 
        `,
        width: 800,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        showCloseButton: true,
        reverseButtons: window.reverseSwalButtons,
        confirmButtonText: "Close SODA for SPARC",
        cancelButtonText: "Skip for now",
      });
      // If the user clicks the retry button, rerun the pre flight checks
      if (restartSoda) {
        await window.electron.ipcRenderer.invoke("quit-app");
      }

      // Dismiss the preflight check notification if it is still open
      if (preFlightCheckNotyf) {
        window.notyf.dismiss(preFlightCheckNotyf);
        preFlightCheckNotyf = null;
      }

      // user selected skip for now
      return false;
    }

    // Stop the Pennsieve agent if it is running
    // This is to ensure that the agent is not running when we try to start it so no funny business happens
    try {
      await stopPennsieveAgent();
    } catch (error) {
      // Note: This error is not critical so we do not need to throw it
      clientError(error);
    }

    // Start the Pennsieve agent
    try {
      await startPennsieveAgent();
    } catch (error) {
      clientError(error);
      const emessage = userErrorMessage(error);

      // check if the Agent is failing to start due to Unique constraint violation or due to the Agent caching an outdated username and password after the user updates their Key + Secret
      // if so then we prompt the user to allow us to remove the pennsieve Agent DB files and try again
      if (
        emessage.includes("UNIQUE constraint failed:") ||
        emessage.includes("NotAuthorizedException: Incorrect username or password.") ||
        emessage.includes("401 Error Creating new UserSettings")
      ) {
        const { value: deleteFilesRerunChecks } = await Swal.fire({
          icon: "error",
          title: "The Pennsieve Agent Failed to Start",
          html: `
                <br />
                <div class="div--code-block-error">${emessage}</div>
                <br />
                <p style="text-align: left">This is a known issue with the Pennsieve Agent and is typically resolved by deleting the local Pennsieve Agent database files from your computer. Would you like SODA to do that and restart the Agent?</p>`,
          width: 800,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: true,
          showCloseButton: true,
          reverseButtons: reverseSwalButtons,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });

        if (!deleteFilesRerunChecks) {
          return false;
        }

        // wait for the Agent to stop using the db files so they may be deleted
        await wait(1000);
        // delete any db files that exist
        if (window.fs.existsSync(`${window.homeDirectory}/.pennsieve/pennsieve_agent.db`))
          await window.fs.unlink(`${window.homeDirectory}/.pennsieve/pennsieve_agent.db`);
        if (window.fs.existsSync(`${window.homeDirectory}/.pennsieve/pennsieve_agent.db-shm`))
          await window.fs.unlink(`${window.homeDirectory}/.pennsieve/pennsieve_agent.db-shm`);
        if (window.fs.existsSync(`${window.homeDirectory}/.pennsieve/pennsieve_agent.db-wal`))
          await window.fs.unlink(`${window.homeDirectory}/.pennsieve/pennsieve_agent.db-wal`);

        // rerun checks
        return await run_pre_flight_checks();
      }

      const { value: rerunPreFlightChecks } = await Swal.fire({
        icon: "info",
        title: "The Pennsieve Agent failed to start",
        html: `
          <br />
          <div class="div--code-block-error">${emessage}</div>
          <br />
          Please view the <a href="https://docs.sodaforsparc.io/docs/common-errors/trouble-starting-the-pennsieve-agent-in-soda" target="_blank">SODA documentation</a>
          to troubleshoot this issue. Then click the "Try again" button below to ensure the issue has been fixed.
        `,
        width: 800,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        showCloseButton: true,
        reverseButtons: window.reverseSwalButtons,
        confirmButtonText: "Try again",
        cancelButtonText: "Skip for now",
      });
      // If the user clicks the retry button, rerun the pre flight checks
      if (rerunPreFlightChecks) {
        return await window.run_pre_flight_checks();
      }

      // Dismiss the preflight check notification if it is still open
      if (preFlightCheckNotyf) {
        window.notyf.dismiss(preFlightCheckNotyf);
        preFlightCheckNotyf = null;
      }
      // If the user clicks the skip button, return false which will cause the pre flight checks to fail
      return false;
    }

    // Get the version of the Pennsieve agent
    let usersPennsieveAgentVersion;
    try {
      const versionObj = await getPennsieveAgentVersion();
      usersPennsieveAgentVersion = versionObj["Agent Version"];
    } catch (error) {
      clientError(error);
      const emessage = userErrorMessage(error);
      const { value: rerunPreFlightChecks } = await Swal.fire({
        icon: "info",
        title: "Soda was unable to get the Pennsieve Agent Version",
        html: `
          <br />
          <div class="div--code-block-error">${emessage}</div>
          <br />
          Please view the <a href="https://docs.sodaforsparc.io/docs/common-errors/trouble-starting-the-pennsieve-agent-in-soda" target="_blank">SODA documentation</a>
          to troubleshoot this issue. Then click the "Try again" button below to ensure the issue has been fixed.
        `,
        width: 800,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        showCloseButton: true,
        reverseButtons: window.reverseSwalButtons,
        confirmButtonText: "Try again",
        cancelButtonText: "Skip for now",
      });
      // If the user clicks the retry button, rerun the pre flight checks
      if (rerunPreFlightChecks) {
        return await window.run_pre_flight_checks();
      }

      // Dismiss the preflight check notification if it is still open
      if (preFlightCheckNotyf) {
        window.notyf.dismiss(preFlightCheckNotyf);
        preFlightCheckNotyf = null;
      }
      // If the user clicks the skip button, return false which will cause the pre flight checks to fail
      return false;
    }

    let agentDownloadUrl;
    let latestPennsieveAgentVersion;

    // Note: We only want to check the Pennsieve agent version if the user has not already selected that they are ok with an outdated agent
    if (!userHasSelectedTheyAreOkWithOutdatedAgent) {
      // First get the latest Pennsieve agent version on GitHub
      // This is to ensure the user has the latest version of the agent
      try {
        [agentDownloadUrl, latestPennsieveAgentVersion] = await getLatestPennsieveAgentVersion();
      } catch (error) {
        const emessage = userErrorMessage(error);
        const retryAgentVersionCheck = await swalConfirmAction(
          "warning",
          "",
          `
            <br />
            <b>${emessage}</b>
            <br /><br />
            Would you like to retry or continue with the currently installed version of the Pennsieve agent?
          `,
          "Retry",
          "Contrinue with current version"
        );
        if (retryAgentVersionCheck) {
          return await run_pre_flight_checks();
        } else {
          userHasSelectedTheyAreOkWithOutdatedAgent = true;
        }
      }
    }

    if (
      !userHasSelectedTheyAreOkWithOutdatedAgent &&
      usersPennsieveAgentVersion !== latestPennsieveAgentVersion
    ) {
      // Stop the Pennsieve agent if it is running to prevent any issues when updating while the agent is running
      try {
        await stopPennsieveAgent();
      } catch (error) {
        // Note: This error is not critical so we do not need to throw it
        clientError(error);
      }
      const { value: rerunPreFlightChecks } = await Swal.fire({
        icon: "info",
        title: "Installed Pennsieve agent out of date",
        html: `
          Your Pennsieve agent version: <b>${usersPennsieveAgentVersion}</b>
          <br />
          Latest Pennsieve agent version: <b>${latestPennsieveAgentVersion}</b>
          <br />
          <br />
          To update your Pennsieve Agent, please visit the link below and follow the instructions.
          <br />
          <br />
          <a href="${agentDownloadUrl}" target="_blank" rel="noopener noreferrer">Download the latest Pennsieve agent</a>
          <br />
          <br />
          Once you have updated your Pennsieve agent, please click the button below to ensure that the Pennsieve agent was updated correctly.
        `,
        width: 800,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        showCloseButton: true,
        reverseButtons: window.reverseSwalButtons,
        confirmButtonText: "Check updated Pennsieve agent version",
        cancelButtonText: "Skip for now",
      });
      // If the user clicks the retry button, rerun the pre flight checks
      if (rerunPreFlightChecks) {
        return await window.run_pre_flight_checks();
      }
      // Dismiss the preflight check notification if it is still open
      if (preFlightCheckNotyf) {
        window.notyf.dismiss(preFlightCheckNotyf);
        preFlightCheckNotyf = null;
      }

      // If the user clicks the skip button, return false which will cause the pre flight checks to fail
      return false;
    }

    if (check_update) {
      checkNewAppVersion();
    }

    // IMP NOTE: There can be different API Keys for each workspace and the user can switch between workspaces. Therefore a valid api key
    //           under the default profile does not mean that key is associated with the user's current workspace.
    let matching = await window.defaultProfileMatchesCurrentWorkspace();
    if (!matching) {
      log.info("Default api key is for a different workspace");
      await window.switchToCurrentWorkspace();
      return false;
    }

    if (launchAnnouncement) {
      await checkForAnnouncements("announcements");
      launchAnnouncement = false;
    }

    // Dismiss the preflight check notification if it is still open
    if (preFlightCheckNotyf) {
      window.notyf.dismiss(preFlightCheckNotyf);
      preFlightCheckNotyf = null;
    }

    window.notyf.open({
      type: "final",
      message: "SODA connected to Pennsieve successfully!",
    });

    window.log.info("All pre flight checks passed");

    // All pre flight checks passed, return true
    return true;
  } catch (error) {
    clientError(error);
    // Dismiss the preflight check notification if it is still open
    if (preFlightCheckNotyf) {
      window.notyf.dismiss(preFlightCheckNotyf);
      preFlightCheckNotyf = null;
    }
    // Stop the Pennsieve agent if it is running
    try {
      await stopPennsieveAgent();
    } catch (error) {
      // Note: This error is not critical so we do not need to throw it
      clientError(error);
    }

    const emessage = userErrorMessage(error);
    const { value: retryChecks } = await Swal.fire({
      icon: "info",
      title: `Error checking SODA's connection to Pennsieve`,
      html: `${emessage}`,
      width: 600,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "Retry",
      cancelButtonText: "Skip for now",
      reverseButtons: window.reverseSwalButtons,
    });
    // If the user clicks retry, then run the preflight checks again
    if (retryChecks) {
      return await window.run_pre_flight_checks();
    }
    // If the user clicks skip for now, then return false
    return false;
  }
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

  return !!(echoResponse === "server ready");
};

// Check if the Pysoda server API version and the package.json versions match
const apiVersionsMatch = async () => {
  // window.notyf that tells the user that the server is checking the versions
  let notification = window.notyf.open({
    message: "Checking API Version",
    type: "checking_server_api_version",
  });

  let responseObject;

  try {
    responseObject = await client.get("/startup/minimum_api_version");
  } catch (e) {
    clientError(e);
    window.log.info("Minimum API Versions do not match");
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      "Verifying App Version",
      userErrorMessage(e)
    );

    await Swal.fire({
      icon: "error",
      html: `Something went wrong while initializing SODA's background services. Please try restarting your computer and reinstalling the latest version of SODA. If this issue occurs multiple times, please email <a target="_blank" href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Close now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    throw e;
  }

  let serverAppVersion = responseObject.data.version;

  window.log.info(`Server version is ${serverAppVersion}`);
  const apiVersionMismatchDocsLink = `https://docs.sodaforsparc.io/docs/common-errors/api-version-mismatch`;

  if (serverAppVersion !== appVersion) {
    window.log.info("Server version does not match client version");
    console.error("Server version does not match client version");
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      "Verifying App Version",
      "Server version does not match client version"
    );

    await Swal.fire({
      icon: "error",
      title: "Minimum App Version Mismatch",
      html: `
          Your API version: <b>${appVersion}</b>
          <br />
          Latest API version: <b>${serverAppVersion}</b>
          <br />
          <br />
          To resolve this issue, please visit the link below and follow the instructions.
          <br />
          <br />
          <a href="${apiVersionMismatchDocsLink}" target="_blank">API Version Mismatch</a>
          <br />
          <br />
          Once you have updated the SODA Server, please restart SODA.
        `,
      width: 800,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      showCloseButton: false,
      reverseButtons: window.reverseSwalButtons,
      confirmButtonText: "Close Application",
    });

    //await checkForAnnouncements("update")

    throw new Error();
  }

  window.electron.ipcRenderer.send("track-event", "Success", "Verifying App Version");

  window.notyf.dismiss(notification);

  // create a success window.notyf for api version check
  window.notyf.open({
    message: "API Versions match",
    type: "success",
  });

  //Load Default/global Pennsieve account if available
  if (hasConnectedAccountWithPennsieve()) {
    try {
      window.updateBfAccountList();
    } catch (error) {
      clientError(error);
    }
  }
  checkNewAppVersion(); // Added so that version will be displayed for new users
};

const checkInternetConnection = async () => {
  try {
    await axios.get("https://www.google.com");
    return true;
  } catch (error) {
    console.error("No internet connection");
    window.log.error("No internet connection");
    return false;
  }
};

window.check_api_key = async () => {
  let notification = null;
  notification = window.notyf.open({
    type: "api_key_search",
    message: "Checking for Pennsieve account...",
  });
  await window.wait(800);
  // If no accounts are found, return false.
  let responseObject;

  if (!hasConnectedAccountWithPennsieve()) {
    window.notyf.dismiss(notification);
    window.notyf.open({
      type: "error",
      message: "No account was found",
    });
    return false;
  }

  try {
    responseObject = await client.get("manage_datasets/bf_account_list");
  } catch (e) {
    log.info("Current default profile API Key is obsolete");
    clientError(e);
    window.notyf.dismiss(notification);
    window.notyf.open({
      type: "error",
      message: "No account was found",
    });
    return false;
  }

  let res = responseObject.data["accounts"];

  if (res[0] === "Select" && res.length === 1) {
    log.info("No api keys found");
    //no api key found
    window.notyf.dismiss(notification);
    window.notyf.open({
      type: "error",
      message: "No account was found",
    });
    return false;
  } else {
    log.info("Found non obsolete api key in default profile");

    window.notyf.dismiss(notification);
    window.notyf.open({
      type: "success",
      message: "Connected to Pennsieve",
    });
    return true;
  }
};

const getPlatformSpecificAgentDownloadURL = async () => {
  // Try to the direct download url for the platform specific agent
  // If that fails, then return the generic download url
  try {
    const [directDownloadUrl, latestPennsieveAgentVersion] = await getLatestPennsieveAgentVersion();
    return directDownloadUrl;
  } catch (error) {
    return "https://github.com/Pennsieve/pennsieve-agent/releases";
  }
};

const findDownloadURL = (extension, assets) => {
  for (const asset of assets) {
    const fileName = asset.name;
    if (window.path.extname(fileName) === extension) {
      return asset.browser_download_url;
    }
  }
  return undefined;
};
const getLatestPennsieveAgentVersion = async () => {
  const res = await axios.get(
    "https://api.github.com/repos/Pennsieve/pennsieve-agent/releases/latest"
  );

  const latestReleaseAssets = res.data?.assets;
  const latestPennsieveAgentVersion = res.data?.tag_name;

  if (!latestReleaseAssets) {
    throw new Error("Failed to extract assets from the latest Pennsieve agent release");
  }

  if (!latestPennsieveAgentVersion) {
    throw new Error("Failed to retrieve the latest Pennsieve agent version");
  }

  // Find the platform specific agent download url based on the user's platform
  const usersPlatform = window.process.platform();
  let platformSpecificAgentDownloadURL;
  switch (usersPlatform) {
    case "darwin":
      platformSpecificAgentDownloadURL = findDownloadURL(".pkg", latestReleaseAssets);
      break;
    case "win32":
      platformSpecificAgentDownloadURL =
        findDownloadURL(".msi", latestReleaseAssets) ||
        findDownloadURL(".exe", latestReleaseAssets);
      break;
    case "linux":
      platformSpecificAgentDownloadURL = findDownloadURL(".deb", latestReleaseAssets);
      break;
    default:
      throw new Error(`Unsupported platform: ${usersPlatform}`);
  }

  // Throw an error if a download url for the user's platform could not be found in the latest release
  if (!platformSpecificAgentDownloadURL) {
    throw new Error(
      `SODA has detected that a new version of the Pennsieve agent has been released, but could not find the ${usersPlatform} version.`
    );
  }

  return [platformSpecificAgentDownloadURL, latestPennsieveAgentVersion];
};

const checkNewAppVersion = async () => {
  let currentAppVersion = await window.electron.ipcRenderer.invoke("app-version");
  const version = document.getElementById("version");
  version.innerText = currentAppVersion;
};

// Check app version on current app and display in the side bar
window.electron.ipcRenderer.on("app_version", (event, arg) => {
  window.electron.ipcRenderer.removeAllListeners("app_version");
});

// Check for update and show the pop up box
window.electron.ipcRenderer.on("update_available", async () => {
  let appVersion = await window.electron.ipcRenderer.invoke("app-version");
  window.electron.ipcRenderer.removeAllListeners("update_available");
  window.electron.ipcRenderer.send(
    "track-event",
    "App Update",
    "Update Requested",
    `User OS-${window.os.platform()}-${window.os.release()}- SODAv${appVersion}`
  );
  update_available_notification = window.notyf.open({
    type: "app_update",
    message: "A new update is available. Downloading now...",
  });
});

// When the update is downloaded, show the restart notification
window.electron.ipcRenderer.on("update_downloaded", async () => {
  let appVersion = await window.electron.ipcRenderer.invoke("app-version");
  window.electron.ipcRenderer.removeAllListeners("update_downloaded");
  window.electron.ipcRenderer.send(
    "track-event",
    "App Update",
    "Update Downloaded",
    `User OS-${window.os.platform()}-${window.os.release()}- SODAv${appVersion}`
  );
  window.notyf.dismiss(update_available_notification);
  if (window.process.platform == "darwin") {
    update_downloaded_notification = window.notyf.open({
      type: "app_update_warning",
      message:
        "Update downloaded. It will be installed when you close and relaunch the app. Click here to close SODA now.",
    });
  } else {
    update_downloaded_notification = window.notyf.open({
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
  window.notyf.open({
    type: "app_update_warning",
    message: "Closing SODA now...",
  });

  let appVersion = await window.electron.ipcRenderer.invoke("app-version");

  window.electron.ipcRenderer.send(
    "track-event",
    "App Update",
    "App Restarted",
    `User OS-${window.os.platform()}-${window.os.release()}- SODAv${appVersion}`
  );
  window.electron.ipcRenderer.send("restart_app");
};

// //////////////////////////////////
// // Get html elements from UI
// //////////////////////////////////

// // Navigator button //
// const buttonSidebar = document.getElementById("button-hamburger");
// const buttonSidebarIcon = document.getElementById("button-soda-icon");
// const buttonSidebarBigIcon = document.getElementById("button-soda-big-icon");

// /////// New Organize Datasets /////////////////////

const organizeDSbackButton = document.getElementById("button-back");
const organizeDSaddFiles = document.getElementById("add-files");
const organizeDSaddNewFolder = document.getElementById("new-folder");
const organizeDSaddFolders = document.getElementById("add-folders");
const contextMenu = document.getElementById("mycontext");
const fullNameValue = document.querySelector(".hoverFullName");
const homePathButton = document.getElementById("home-path");
window.menuFolder = document.querySelector(".menu.reg-folder");
window.menuFile = document.querySelector(".menu.file");
window.menuHighLevelFolders = document.querySelector(".menu.high-level-folder");
const organizeNextStepBtn = document.getElementById("button-organize-confirm-create");
const organizePrevStepBtn = document.getElementById("button-organize-prev");
window.manifestFileCheck = document.getElementById("generate-manifest-curate");

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
// var window.subjectsTableData = [];
// var window.samplesTableData = [];

const newDatasetName = document.querySelector("#new-dataset-name");
const manifestStatus = document.querySelector("#generate-manifest");

// Manage datasets //

window.sodaCopy = {};
let datasetStructCopy = {};
const bfUploadRefreshDatasetBtn = document.getElementById("button-upload-refresh-dataset-list");

window.pathSubmitDataset = document.querySelector("#selected-local-dataset-submit");
// const progressUploadBf = document.getElementById("div-progress-submit");
window.progressBarUploadBf = document.getElementById("progress-bar-upload-bf");
window.datasetPermissionDiv = document.getElementById("div-permission-list-2");

window.bfDatasetSubtitleCharCount = document.querySelector("#para-char-count-metadata");

window.bfCurrentBannerImg = document.getElementById("current-banner-img");

window.bfViewImportedImage = document.querySelector("#image-banner");
window.guidedBfViewImportedImage = document.querySelector("#guided-image-banner");

const bfSaveBannerImageBtn = document.getElementById("save-banner-image");
const datasetBannerImageStatus = document.querySelector("#para-dataset-banner-image-status");
window.formBannerHeight = document.getElementById("form-banner-height");
window.guidedFormBannerHeight = document.getElementById("guided-form-banner-height");
window.currentDatasetLicense = document.querySelector("#para-dataset-license-current");
const bfListLicense = document.querySelector("#bf-license-list");
const bfAddLicenseBtn = document.getElementById("button-add-license");

// // Pennsieve dataset permission //
window.currentDatasetPermission = document.querySelector("#para-dataset-permission-current");
window.currentAddEditDatasetPermission = document.querySelector(
  "#para-add-edit-dataset-permission-current"
);
const bfListUsersPI = document.querySelector("#bf_list_users_pi");

// const bfAddPermissionCurationTeamBtn = document.getElementById(
//   "button-add-permission-curation-team"
// );
// const datasetPermissionStatusCurationTeam = document.querySelector(
//   "#para-dataset-permission-status-curation-team"
// );
const bfListUsers = document.querySelector("#bf_list_users");
const bfListTeams = document.querySelector("#bf_list_teams");
const bfListRolesTeam = document.querySelector("#bf_list_roles_team");
const bfAddPermissionTeamBtn = document.getElementById("button-add-permission-team");

//Pennsieve dataset status
window.bfCurrentDatasetStatusProgress = document.querySelector(
  "#div-bf-current-dataset-status-progress"
);
window.bfListDatasetStatus = document.querySelector("#bf_list_dataset_status");

//Pennsieve post curation
const bfRefreshPublishingDatasetStatusBtn = document.querySelector(
  "#button-refresh-publishing-status"
);
const bfWithdrawReviewDatasetBtn = document.querySelector("#btn-withdraw-review-dataset");

// //////////////////////////////////
// // Constant parameters
// //////////////////////////////////
// const blackColor = "#000";
// const redColor = "#ff1a1a";
// const sparcFolderNames = ["code", "derivative", "docs", "primary", "protocol", "source"];
window.smileyCan = `<img class="message-icon" src=${canSmiley}>`;
window.sadCan = `<img class="message-icon" src=${canSad}>`;
window.delayAnimation = 250;

//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////

// Sidebar Navigation //
let open = false;
const openSidebar = (buttonElement) => {
  if (!open) {
    window.electron.ipcRenderer.send("resize-window", "up");
    $("#main-nav").css("width", "250px");
    $("#SODA-logo").css("display", "block");
    $(buttonSidebarIcon).css("display", "none");
    open = true;
  } else {
    window.electron.ipcRenderer.send("resize-window", "down");
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

// ///////////////////// Prepare Metadata Section ////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////

// ///// Global variables for this section

// /////// Save and load award and milestone info
let metadataPath = window.path.join(window.homeDirectory, "SODA", "METADATA");
// let awardFileName = "awards.json";
let affiliationFileName = "affiliations.json";
// let milestoneFileName = "milestones.json";
// let protocolConfigFileName = "protocol-config.json";
window.affiliationConfigPath = window.path.join(metadataPath, affiliationFileName);
// let milestonePath = window.path.join(metadataPath, milestoneFileName);
window.progressFilePath = window.path.join(window.homeDirectory, "SODA", "Progress");
// let guidedProgressFilePath = window.path.join(window.homeDirectory, "SODA", "Guided-Progress");
window.guidedManifestFilePath = window.path.join(
  window.homeDirectory,
  "SODA",
  "guided_manifest_files"
);
// let protocolConfigPath = window.path.join(metadataPath, protocolConfigFileName);
window.allCollectionTags = {};
window.currentTags = {};
window.currentCollectionTags = [];

if (window.process.platform() === "linux") {
  //check if data exists inside of the Soda folder, and if it does, move it into the capitalized SODA folder
  if (window.fs.existsSync(window.path.join(window.homeDirectory, "Soda"))) {
    //copy the folder contents of home/Soda to home/SODA
    window.fs.copySync(
      window.path.join(window.homeDirectory, "Soda"),
      window.path.join(window.homeDirectory, "SODA")
    );
    //delete the old folder
    window.fs.removeSync(window.path.join(window.homeDirectory, "Soda"));
  }
}

const guidedSubmissionTagsInputManual = document.getElementById(
  "guided-tagify-submission-milestone-tags-manual"
);
window.guidedSubmissionTagsTagifyManual = new Tagify(guidedSubmissionTagsInputManual, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});
window.createDragSort(window.guidedSubmissionTagsTagifyManual);

// initiate Tagify input fields for Dataset description file
var keywordInput = document.getElementById("ds-keywords");
window.keywordTagify = new Tagify(keywordInput, {
  duplicates: false,
});

window.createDragSort(window.keywordTagify);

var otherFundingInput = document.getElementById("ds-other-funding");
window.otherFundingTagify = new Tagify(otherFundingInput, {
  duplicates: false,
});
window.createDragSort(window.otherFundingTagify);

var collectionDatasetInput = document.getElementById("tagify-collection-tags");
window.collectionDatasetTags = new Tagify(collectionDatasetInput, {
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
window.createDragSort(window.collectionDatasetTags);

var studyOrganSystemsInput = document.getElementById("ds-study-organ-system");
window.studyOrganSystemsTagify = new Tagify(studyOrganSystemsInput, {
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
window.createDragSort(window.studyOrganSystemsTagify);

var studyTechniquesInput = document.getElementById("ds-study-technique");
window.studyTechniquesTagify = new Tagify(studyTechniquesInput, {
  duplicates: false,
});
window.createDragSort(window.studyTechniquesTagify);

var studyApproachesInput = document.getElementById("ds-study-approach");
window.studyApproachesTagify = new Tagify(studyApproachesInput, {
  duplicates: false,
});
window.createDragSort(window.studyApproachesTagify);

// tagify the input inside of the "Add/edit tags" manage dataset section
var datasetTagsInput = document.getElementById("tagify-dataset-tags");
// initialize Tagify on the above input node reference
window.datasetTagsTagify = new Tagify(datasetTagsInput);
window.createDragSort(window.datasetTagsTagify);

/////////////////// Provide Grant Information section /////////////////////////
//////////////// //////////////// //////////////// //////////////// ///////////

////////////////////////Import Milestone Info//////////////////////////////////
window.descriptionDateInput = document.getElementById("submission-completion-date");

const milestoneInput1 = document.getElementById("selected-milestone-1");
window.milestoneTagify1 = new Tagify(milestoneInput1, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});

window.hideElementsWithClass = (className) => {
  const elements = document.querySelectorAll(`.${className}`);
  elements.forEach((element) => {
    element.classList.add("hidden");
  });
};

window.showElementsWithClass = (className) => {
  const elements = document.querySelectorAll(`.${className}`);
  elements.forEach((element) => {
    element.classList.remove("hidden");
  });
};

// Listen to the changes of the milestone tagify
window.milestoneTagify1.on("change", (e) => {
  // If e.detail.value.length string is greater than 0, then there are milestone tags entered in the tagify
  if (e.detail.value.length > 0) {
    // Filter out the N/A milestone tag
    // Note: If only N/A is entered, the completion date will be set to N/A and remain hidden so user doesn't have to fill it out
    const filteredMilestones = JSON.parse(e.detail.value)
      .map((milestone) => {
        return milestone.value;
      })
      .filter((milestone) => {
        return milestone !== "N/A";
      });

    // If there are milestone tags other than N/A, then show the completion date form component
    if (filteredMilestones.length > 0) {
      window.showElementsWithClass("completion-date-form-component");
    } else {
      // If there are no milestone tags other than N/A, then hide the completion date form component
      window.hideElementsWithClass("completion-date-form-component");
      $("#submission-completion-date").val("");
    }
  } else {
    window.hideElementsWithClass("completion-date-form-component");
    $("#submission-completion-date").val("");
  }
});

window.createDragSort(window.milestoneTagify1);

// generate subjects file
window.electron.ipcRenderer.on(
  "selected-generate-metadata-subjects",
  (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = window.path.join(dirpath[0], filename);
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
            window.generateSubjectsFileHelper(false);
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
        window.generateSubjectsFileHelper(false);
      }
    }
  }
);

window.generateSubjectsFileHelper = async (uploadBFBoolean) => {
  let bfdataset = document.getElementById("bf_dataset_load_subjects").innerText.trim();
  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the subjects file to Pennsieve
    let supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // Check if dataset is locked after running pre-flight checks
    const isLocked = await api.isDatasetLocked(window.defaultBfAccount, bfdataset);

    if (isLocked) {
      await Swal.fire({
        icon: "info",
        title: `${bfdataset} is locked from editing`,
        html: `
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>
            `,
        width: 600,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        focusConfirm: true,
        allowOutsideClick: false,
      });

      return;
    }

    let { value: continueProgress } = await Swal.fire({
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
    let { value: continueProgress } = await Swal.fire({
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

  try {
    window.log.info(`Generating a subjects file.`);
    let save_locally = await client.post(
      `/prepare_metadata/subjects_file`,
      {
        filepath: window.subjectsDestinationPath,
        selected_account: window.defaultBfAccount,
        selected_dataset: bfdataset,
        subjects_header_row: window.subjectsTableData,
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
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBJECTS_XLSX,
      kombuchaEnums.Status.SUCCESS,
      createEventDataPrepareMetadata(
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL,
        1
      )
    );

    const size = res;
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBJECTS_XLSX_SIZE,
      kombuchaEnums.Status.SUCCESS,
      createEventDataPrepareMetadata(
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL,
        size
      )
    );
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
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBJECTS_XLSX,
      kombuchaEnums.Status.FAIL,
      createEventDataPrepareMetadata(
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL,
        1
      )
    );
  }
};

// generate samples file
window.electron.ipcRenderer.on("selected-generate-metadata-samples", (event, dirpath, filename) => {
  if (dirpath.length > 0) {
    var destinationPath = window.path.join(dirpath[0], filename);
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
          window.generateSamplesFileHelper(uploadBFBoolean);
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
      window.generateSamplesFileHelper(uploadBFBoolean);
    }
  }
});

window.generateSamplesFileHelper = async (uploadBFBoolean) => {
  let bfDataset = $("#bf_dataset_load_samples").text().trim();
  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the samples file to Pennsieve
    const supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // Check if dataset is locked after running pre-flight checks
    const isLocked = await api.isDatasetLocked(window.defaultBfAccount, bfDataset);
    if (isLocked) {
      await Swal.fire({
        icon: "info",
        title: `${bfDataset} is locked from editing`,
        html: `
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>
            `,
        width: 600,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        focusConfirm: true,
        allowOutsideClick: false,
      });

      return;
    }

    let { value: continueProgress } = await Swal.fire({
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
    let { value: continueProgress } = await Swal.fire({
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
        filepath: window.samplesDestinationPath,
        selected_account: window.defaultBfAccount,
        selected_dataset: $("#bf_dataset_load_samples").text().trim(),
        samples_str: window.samplesTableData,
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

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SAMPLES_XLSX,
      kombuchaEnums.Status.SUCCESS,
      createEventDataPrepareMetadata(
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL,
        1
      )
    );

    // log the size of the metadata file that was generated at varying levels of granularity
    const { size } = samplesFileResponse.data;
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SAMPLES_XLSX_SIZE,
      kombuchaEnums.Status.SUCCESS,
      createEventDataPrepareMetadata(
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL,
        size
      )
    );
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

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SAMPLES_XLSX,
      kombuchaEnums.Status.FAIL,
      createEventDataPrepareMetadata(
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL,
        1
      )
    );
  }
};

// import Primary folder
window.electron.ipcRenderer.on("selected-local-primary-folder", (event, primaryFolderPath) => {
  if (primaryFolderPath.length > 0) {
    window.importPrimaryFolderSubjects(primaryFolderPath[0]);
  }
});
window.electron.ipcRenderer.on(
  "selected-local-primary-folder-samples",
  (event, primaryFolderPath) => {
    if (primaryFolderPath.length > 0) {
      window.importPrimaryFolderSamples(primaryFolderPath[0]);
    }
  }
);

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
window.loadSubjectsFileToDataframe = async (filePath) => {
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
    // res is a dataframe, now we load it into our window.subjectsTableData in order to populate the UI
    if (res.length > 1) {
      let result = transformImportedExcelFile("subjects", res);
      if (result !== false) {
        window.subjectsTableData = result;
      } else {
        Swal.fire({
          title: "Couldn't load existing subjects.xlsx file",
          text: "Please make sure the imported file follows the latest SPARC Dataset Structure 2.0.0 and try again.",
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        window.logMetadataForAnalytics(
          "Error",
          window.MetadataAnalyticsPrefix.SUBJECTS,
          window.AnalyticsGranularity.ALL_LEVELS,
          "Existing",
          Destinations.LOCAL
        );
        return;
      }
      window.logMetadataForAnalytics(
        "Success",
        window.MetadataAnalyticsPrefix.SUBJECTS,
        window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );
      window.loadDataFrametoUI("local");
    } else {
      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.SUBJECTS,
        window.AnalyticsGranularity.ALL_LEVELS,
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

    window.logMetadataForAnalytics(
      "Error",
      window.MetadataAnalyticsPrefix.SUBJECTS,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
};

// import existing subjects.xlsx info (calling python to load info to a dataframe)
window.loadSamplesFileToDataframe = async (filePath) => {
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
    // res is a dataframe, now we load it into our window.samplesTableData in order to populate the UI
    if (res.length > 1) {
      let result = transformImportedExcelFile("samples", res);
      if (result !== false) {
        window.samplesTableData = result;
      } else {
        Swal.fire({
          title: "Couldn't load existing samples.xlsx file",
          text: "Please make sure the imported file follows the latest SPARC Dataset Structure 2.0.0 and try again.",
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        window.logMetadataForAnalytics(
          "Error",
          window.MetadataAnalyticsPrefix.SAMPLES,
          window.AnalyticsGranularity.ALL_LEVELS,
          "Existing",
          Destinations.LOCAL
        );

        return;
      }
      window.logMetadataForAnalytics(
        "Success",
        window.MetadataAnalyticsPrefix.SAMPLES,
        window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );

      window.loadDataFrametoUISamples("local");
    } else {
      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.SAMPLES,
        window.AnalyticsGranularity.ALL_LEVELS,
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

    window.logMetadataForAnalytics(
      "Error",
      window.MetadataAnalyticsPrefix.SAMPLES,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
};

// load and parse json file
window.parseJson = (path) => {
  if (!window.fs.existsSync(path)) {
    return {};
  }
  try {
    var content = window.fs.readFileSync(path, "utf8");
    let contentJson = JSON.parse(content);
    return contentJson;
  } catch (error) {
    window.log.error(error);
    console.log(error);
    return {};
  }
};

// function to make directory if metadata path does not exist
window.createMetadataDir = () => {
  try {
    window.fs.mkdirSync(metadataPath, { recursive: true });
  } catch (error) {
    window.log.error(error);
    console.log(error);
  }
};

window.createMetadataDir();

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

//////////////// Dataset description file ///////////////////////
//////////////// //////////////// //////////////// ////////////////

//// get datasets and append that to option list for parent datasets
function getParentDatasets() {
  var parentDatasets = [];
  for (var i = 0; i < window.datasetList.length; i++) {
    parentDatasets.push(window.datasetList[i].name);
  }
  return parentDatasets;
}

window.changeAwardInputDsDescription = () => {
  if (dsContributorArrayLast1) {
    window.removeOptions(dsContributorArrayLast1);
  }
  if (dsContributorArrayFirst1) {
    window.removeOptions(dsContributorArrayFirst1);
    window.addOption(dsContributorArrayFirst1, "Select an option", "Select an option");
  }

  window.currentContributorsLastNames = [];
  currentContributorsFirstNames = [];
  window.globalContributorNameObject = {};

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
    window.removeOptions(selectID);
    $($($("#table-current-contributors").find("tr")[1].cells[1]).find("select")[0]).prop(
      "disabled",
      true
    );
  }
};

// on change event when users choose a contributor's last name
window.onchangeLastNames = () => {
  $("#dd-contributor-first-name").attr("disabled", true);
  var conLastname = $("#dd-contributor-last-name").val();
  window.removeOptions(document.getElementById("dd-contributor-first-name"));
  if (conLastname in window.globalContributorNameObject) {
    window.addOption(
      document.getElementById("dd-contributor-first-name"),
      window.globalContributorNameObject[conLastname],
      window.globalContributorNameObject[conLastname]
    );
    $("#dd-contributor-first-name")
      .val(window.globalContributorNameObject[conLastname])
      .trigger("onchange");
  }
  $("#dd-contributor-first-name").attr("disabled", false);
};

//// De-populate dataset dropdowns to clear options
window.clearDatasetDropdowns = () => {
  for (let list of [window.curateDatasetDropdown]) {
    window.removeOptions(list);
    window.addOption(list, "Search here...", "Select dataset");
    list.options[0].disabled = true;
  }
};

const clearOrganizationDropdowns = () => {
  for (let list of [window.curateOrganizationDropdown]) {
    window.removeOptions(list);
    window.addOption(list, "Search here...", "Select organization");
    list.options[0].disabled = true;
  }
};

// //////////////////////// Current Contributor(s) /////////////////////

// const delete_current_con = (no) => {
//   // after a contributor is deleted, add their name back to the contributor last name dropdown list
//   if (
//     $("#ds-description-contributor-list-last-" + no).length > 0 &&
//     $("#ds-description-contributor-list-first-" + no).length > 0
//   ) {
//     var deletedLastName = $("#ds-description-contributor-list-last-" + no).val();
//     var deletedFirstName = $("#ds-description-contributor-list-first-" + no).val();
//     window.globalContributorNameObject[deletedLastName] = deletedFirstName;
//     window.currentContributorsLastNames.push(deletedLastName);
//   }
//   document.getElementById("row-current-name" + no + "").outerHTML = "";
// };

// const delete_link = (no) => {
//   document.getElementById("row-current-link" + no + "").outerHTML = "";
// };

// //////////////////////// Article(s) and Protocol(s) /////////////////////

// //// function to leave fields empty if no data is found on Airtable
// const leaveFieldsEmpty = (field, element) => {
//   if (field !== undefined) {
//     element.value = field;
//   } else {
//     element.value = "";
//   }
// };

// $(currentConTable).mousedown(function (e) {
//   var length = currentConTable.rows.length - 1;
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
//   }
//   $(document).mousemove(move).mouseup(up);
// });

// $("#table-subjects").mousedown(function (e) {
//   var length = document.getElementById("table-subjects").rows.length;
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
//     // the below functions updates the row index accordingly and update the order of subject IDs in json
//     window.updateIndexForTable(document.getElementById("table-subjects"));
//     updateOrderIDTable(document.getElementById("table-subjects"), window.subjectsTableData, "subjects");
//   }
//   $(document).mousemove(move).mouseup(up);
// });

// $("#table-samples").mousedown(function (e) {
//   var length = document.getElementById("table-samples").rows.length - 1;
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
//     // the below functions updates the row index accordingly and update the order of sample IDs in json
//     window.updateIndexForTable(document.getElementById("table-samples"));
//     updateOrderIDTable(document.getElementById("table-samples"), window.samplesTableData, "samples");
//   }
//   $(document).mousemove(move).mouseup(up);
// });

// // $("#contributor-table-dd").mousedown(function (e) {
// //   var length = document.getElementById("contributor-table-dd").rows.length - 1;
// //   var tr = $(e.target).closest("tr"),
// //     sy = e.pageY,
// //     drag;
// //   if ($(e.target).is("tr")) tr = $(e.target);
// //   var index = tr.index();
// //   $(tr).addClass("grabbed");
// //   function move(e) {
// //     if (!drag && Math.abs(e.pageY - sy) < 10) return;
// //     drag = true;
// //     tr.siblings().each(function () {
// //       var s = $(this),
// //         i = s.index(),
// //         y = s.offset().top;
// //       if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
// //         if (i !== 0) {
// //           if ($(e.target).closest("tr")[0].rowIndex !== length) {
// //             if (i < tr.index()) {
// //               s.insertAfter(tr);
// //             } else {
// //               s.insertBefore(tr);
// //             }
// //             return false;
// //           }
// //         }
// //       }
// //     });
// //   }
// //   function up(e) {
// //     if (drag && index != tr.index() && tr.index() !== length) {
// //       drag = false;
// //     }
// //     $(document).unbind("mousemove", move).unbind("mouseup", up);
// //     $(tr).removeClass("grabbed");
// //     window.updateIndexForTable(document.getElementById("contributor-table-dd"));
// //     updateOrderContributorTable(document.getElementById("contributor-table-dd"), window.contributorArray);
// //   }
// //   $(document).mousemove(move).mouseup(up);
// // });

// $("#protocol-link-table-dd").mousedown(function (e) {
//   var length = document.getElementById("protocol-link-table-dd").rows.length;
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
//     window.updateIndexForTable(document.getElementById("protocol-link-table-dd"));
//   }
//   $(document).mousemove(move).mouseup(up);
// });

// $("#additional-link-table-dd").mousedown(function (e) {
//   var length = document.getElementById("additional-link-table-dd").rows.length;
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
//     window.updateIndexForTable(document.getElementById("additional-link-table-dd"));
//   }
//   $(document).mousemove(move).mouseup(up);
// });

const emptyDSInfoEntries = () => {
  var fieldSatisfied = true;
  var inforObj = window.grabDSInfoEntries();
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
window.detectEmptyRequiredFields = (funding) => {
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
  var contactPersonExists = window.checkAtLeastOneContactPerson();
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
  let errorMessage = [];
  for (var i = 0; i < emptyArray.length; i++) {
    if (!emptyArray[i]) {
      errorMessage.push(emptyMessageArray[i]);
      allFieldsSatisfied = false;
    }
  }
  return [allFieldsSatisfied, errorMessage];
};

// //////////////////////////End of Ds description section ///////////////////////////////////
// //////////////// //////////////// //////////////// //////////////// ////////////////////////

window.displaySIze = 1000;

// //////////////////////////////////
// // Manage Dataset
// //////////////////////////////////

// /////////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////// This is the part where similar functions are being modified for the new ///////////////
// //////////////////////////////////// Prepare dataset UI ////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////

/// Add all BF accounts to the dropdown list, and then choose by default one option ('global' account)
window.curateDatasetDropdown = document.getElementById("curatebfdatasetlist");
window.curateOrganizationDropdown = document.getElementById("curatebforganizationlist");

async function updateDatasetCurate(datasetDropdown, bfaccountDropdown) {
  window.defaultBfAccount = bfaccountDropdown.options[bfaccountDropdown.selectedIndex].text;
  try {
    let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
      params: {
        selected_account: window.defaultBfAccount,
      },
    });
    window.datasetList = [];
    window.datasetList = responseObject.data.datasets;
    populateDatasetDropdownCurate(datasetDropdown, window.datasetList);
    window.refreshDatasetList();
  } catch (error) {
    clientError(error);
    curateBFAccountLoadStatus.innerHTML = `<span style='color: red'>${userErrorMessage(
      error
    )}</span>`;
  }
}

//// De-populate dataset dropdowns to clear options for CURATE
function populateDatasetDropdownCurate(datasetDropdown, datasetList) {
  window.removeOptions(datasetDropdown);

  /// making the first option: "Select" disabled
  window.addOption(datasetDropdown, "Select dataset", "Select dataset");
  var options = datasetDropdown.getElementsByTagName("option");
  options[0].disabled = true;

  for (let myitem of datasetList) {
    var myitemselect = myitem.name;
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    datasetDropdown.appendChild(option);
  }
}
// ///////////////////////////////END OF NEW CURATE UI CODE ADAPTATION ///////////////////////////////////////////////////

const metadataDatasetlistChange = () => {
  $("#bf-dataset-subtitle").val("");
  $("#para-dataset-banner-image-status").html("");
  window.showCurrentSubtitle();
  window.showCurrentDescription();
  window.showCurrentLicense();
  window.showCurrentBannerImage();
  window.showCurrentTags();
};

// Manage dataset permission
const permissionDatasetlistChange = () => {
  window.showCurrentPermission();
};

const datasetStatusListChange = () => {
  $(window.bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");
  window.showCurrentDatasetStatus();
};

// This function is called when the user selects a dataset from the dropdown list
// It is called to update the UI elements that are related to the publishing status
// of the dataset and displaying the correct UI elements
const postCurationListChange = () => {
  // display the pre-publishing page
  showPrePublishingPageElements();
  window.showPublishingStatus();
};

// // upload banner image //
// const Cropper = require("cropperjs");
// const { waitForDebugger } = require("inspector");
// const { resolve } = require("path");
// const { background } = require("jimp");
// const { rename } = require("fs");
// const { resolveSoa } = require("dns");
// const internal = require("stream");
window.cropOptions = {
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

    window.formBannerHeight.value = image_height;
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

window.guidedCropOptions = {
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

    window.guidedFormBannerHeight.value = image_height;

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

window.imageExtension;
window.myCropper = new Cropper(window.bfViewImportedImage, window.cropOptions);

const setupPublicationOptionsPopover = () => {
  // setup the calendar that is in the popup
  const container = document.getElementById("tui-date-picker-container");
  const target = document.getElementById("tui-date-picker-target");

  // calculate one year from now
  let oneYearFromNow = new Date();
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
  $("input[id='embargo-date-check']").on("change", (e) => {
    let tuiCalendarWrapper = document.getElementById("calendar-wrapper");
    if ($(`#${e.target.value}`).is(":checked")) {
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

window.submitReviewDatasetCheck = async (res, curationMode) => {
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
      title: "Cannot submit the dataset at this time!",
      text: "Your dataset is already submitted. Please wait until the Curation Team within your organization make a decision.",
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
      reverseButtons: window.reverseSwalButtons,
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
        const checkedRadioButton = $("input:radio[id ='confirm-to-awknowledge']:checked").val();

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
    // submit the dataset for review with the given embargoReleaseDate
    await window.submitReviewDataset(embargoReleaseDate, curationMode);
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
      reverseButtons: window.reverseSwalButtons,
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

    if (userResponse.isConfirmed) {
      return [true, embargoReleaseDate];
    }
  }
};

// window.electron.ipcRenderer.on("warning-publish-dataset-selection", (event, index) => {
//   if (index === 0) {
//     window.submitReviewDataset();
//   }
//   $("#submit_prepublishing_review-spinner").hide();
// });

// window.electron.ipcRenderer.on("warning-publish-dataset-again-selection", (event, index) => {
//   if (index === 0) {
//     window.submitReviewDataset();
//   }
//   $("#submit_prepublishing_review-spinner").hide();
// });

// Go about removing the feature and see how it effects dataset submissions
window.submitReviewDataset = async (embargoReleaseDate, curationMode) => {
  let currentAccount = window.defaultBfAccount;
  let currentDataset = window.defaultBfDataset;

  if (curationMode === "guided") {
    currentAccount = window.sodaJSONObj["bf-account-selected"]["account-name"];
    currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
  } else {
    $("#pre-publishing-continue-btn").removeClass("loading");
    $("#pre-publishing-continue-btn").disabled = false;
  }

  // show a SWAL loading message until the submit for prepublishing flow is successful or fails
  Swal.fire({
    title: "Submitting dataset to Curation Team",
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

  try {
    await api.submitDatasetForPublication(
      currentAccount,
      currentDataset,
      embargoReleaseDate,
      embargoReleaseDate === "" ? "publication" : "embargo"
    );
  } catch (error) {
    clientError(error);
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.DISSEMINATE_DATASETS,
      kombuchaEnums.Action.SHARE_WITH_CURATION_TEAM,
      kombuchaEnums.Label.SUBMISSION,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_id: window.defaultBfDatasetId,
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );

    // alert the user of an error
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: `Could not submit your dataset to Curation Team`,
      icon: "error",
      reverseButtons: window.reverseSwalButtons,
      text: userErrorMessage(error),
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
  await window.showPublishingStatus("noClear", curationMode);

  // track success
  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.DISSEMINATE_DATASETS,
    kombuchaEnums.Action.SHARE_WITH_CURATION_TEAM,
    kombuchaEnums.Label.SUBMISSION,
    kombuchaEnums.Status.SUCCESS,
    {
      value: 1,
      dataset_id: window.defaultBfDatasetId,
      dataset_int_id: window.defaultBfDatasetIntId,
    }
  );

  // alert the user the submission was successful
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    confirmButtonText: "Ok",
    title: `Dataset has been submitted for review to the SPARC Curation Team!`,
    icon: "success",
    reverseButtons: window.reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  });

  if (curationMode != "guided") {
    await window.resetffmPrepublishingUI();
  } else {
    // Update the UI again and hide the flow
    $("#guided--prepublishing-checklist-container").addClass("hidden");
    $("#guided-button-share-dataset-with-curation-team").removeClass("hidden");
    $("#guided-button-share-dataset-with-curation-team").removeClass("loading");
    $("#guided-button-share-dataset-with-curation-team").disabled = false;

    window.guidedSetCurationTeamUI();
  }
};

// // //Withdraw dataset from review
// const withdrawDatasetSubmission = async (curationMode = "") => {
//   // show a SWAL loading message until the submit for prepublishing flow is successful or fails

//   if (curationMode != "guided") {
//     document.getElementById("btn-withdraw-review-dataset").disabled = true;
//     $("#btn-withdraw-review-dataset").addClass("loading");
//     $("#btn-withdraw-review-dataset").addClass("text-transparent");

//     const { value: withdraw } = await Swal.fire({
//       title: "Withdraw this dataset from review?",
//       icon: "warning",
//       showDenyButton: true,
//       confirmButtonText: "Yes",
//       denyButtonText: "No",
//       allowEscapeKey: false,
//       allowOutsideClick: false,
//       heightAuto: false,
//       backdrop: "rgba(0,0,0, 0.4)",
//       timerProgressBar: false,
//     });

//     if (!withdraw) {
//       document.getElementById("btn-withdraw-review-dataset").disabled = false;
//       $("#btn-withdraw-review-dataset").removeClass("loading");
//       $("#btn-withdraw-review-dataset").removeClass("text-transparent");
//       return false;
//     }
//   }

//   // get the publishing status of the currently selected dataset
//   // then check if it can be withdrawn, then withdraw it
//   // catch any uncaught errors at this level (aka greacefully catch any exceptions to alert the user we cannot withdraw their dataset)
//   let status = await window.showPublishingStatus(withdrawDatasetCheck, curationMode).catch((error) => {
//     window.log.error(error);
//     console.error(error);
//     Swal.fire({
//       title: "Could not withdraw dataset from publication!",
//       text: `${userErrorMessage(error)}`,
//       heightAuto: false,
//       icon: "error",
//       confirmButtonText: "Ok",
//       backdrop: "rgba(0,0,0, 0.4)",
//       confirmButtonText: "Ok",
//       showClass: {
//         popup: "animate__animated animate__fadeInDown animate__faster",
//       },
//       hideClass: {
//         popup: "animate__animated animate__fadeOutUp animate__faster",
//       },
//     });

//     // track the error for analysis
//     window.logGeneralOperationsForAnalytics(
//       "Error",
//       window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
//       window.AnalyticsGranularity.ALL_LEVELS,
//       ["Withdraw dataset"]
//     );
//     // This helps signal guided mode to update the UI
//     if (curationMode === "guided") {
//       return false;
//     }
//   });

//   // This helps signal guided mode to update the UI
//   if (curationMode === "guided") {
//     return true;
//   } else {
//     document.getElementById("btn-withdraw-review-dataset").disabled = false;
//     $("#btn-withdraw-review-dataset").removeClass("loading");
//     $("#btn-withdraw-review-dataset").removeClass("text-transparent");
//   }
// };

// // TODO: Dorian -> Remove this feature as we don't allow withdraws anymore
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
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else {
    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    await withdrawReviewDataset(curationMode);
  }
};

// TODO: Dorian -> Remove this feature as we don't allow withdraws anymore
const withdrawReviewDataset = async (curationMode) => {
  // bfWithdrawReviewDatasetBtn.disabled = true;

  let currentAccount = $("#current-bf-account").text();
  let currentDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");

  if (curationMode == "guided") {
    currentAccount = window.sodaJSONObj["bf-account-selected"]["account-name"];
    currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
  }

  try {
    await api.withdrawDatasetReviewSubmission(currentDataset, currentAccount);

    window.logGeneralOperationsForAnalytics(
      "Success",
      window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );

    // show the user their dataset's updated publishing status
    await window.showPublishingStatus("noClear", curationMode);

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
      // TODO : INCLUDE for bundling
      await window.resetffmPrepublishingUI();

      bfRefreshPublishingDatasetStatusBtn.disabled = false;
      bfWithdrawReviewDatasetBtn.disabled = false;
    } else {
      const guidedUnshareWithCurationTeamButton = document.getElementById(
        "guided-button-unshare-dataset-with-curation-team"
      );

      guidedUnshareWithCurationTeamButton.disabled = false;
      guidedUnshareWithCurationTeamButton.classList.remove("loading");
      guidedUnshareWithCurationTeamButton.classList.remove("hidden");

      window.guidedSetCurationTeamUI();
    }

    // scroll to the submit button
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
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
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );
  }
};

// //////////////////////////////////
// // Helper functions
// //////////////////////////////////

// General //

// // Manage Datasets //

const refreshBfUsersList = () => {
  let accountSelected = window.defaultBfAccount;

  window.removeOptions(bfListUsers);
  let optionUser = document.createElement("option");
  optionUser.textContent = "Select user";
  bfListUsers.appendChild(optionUser);

  window.removeOptions(bfListUsersPI);
  let optionUserPI = document.createElement("option");
  optionUserPI.textContent = "Select PI";
  bfListUsersPI.appendChild(optionUserPI);

  if (accountSelected !== "Select") {
    client
      .get(`manage_datasets/ps_get_users?selected_account=${accountSelected}`)
      .then((res) => {
        let users = res.data["users"];
        // The window.removeOptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
        $("#bf_list_users").selectpicker("refresh");
        $("#bf_list_users").find("option:not(:first)").remove();

        $("#button-add-permission-user").hide();
        $("#bf_list_users_pi").selectpicker("refresh");
        $("#bf_list_users_pi").find("option:not(:first)").remove();
        for (let myItem in users) {
          // returns like [..,''fname lname email !!**!! pennsieve_id',',..]
          let sep_pos = users[myItem].lastIndexOf("!|**|!");
          let myUser = users[myItem].substring(0, sep_pos);
          let optionUser = document.createElement("option");
          let optionUser2 = document.createElement("option");

          optionUser.textContent = myUser;
          optionUser.value = users[myItem].substring(sep_pos + 6);
          optionUser2 = optionUser.cloneNode(true);
          bfListUsers.appendChild(optionUser);
          bfListUsersPI.appendChild(optionUser2);
        }
      })
      .catch((error) => {
        clientError(error);
      });
  }
};

// Takes in a pennsieve teams JSON response and returns a sorted list of team strings
window.getSortedTeamStrings = (pennsieveTeamsJsonResponse) => {
  const teamStrings = pennsieveTeamsJsonResponse.map((teamElement) => {
    return teamElement.team.name;
  });
  return teamStrings.sort();
};

const refreshBfTeamsList = async (teamList) => {
  window.removeOptions(teamList);

  let accountSelected = window.defaultBfAccount;
  let optionTeam = document.createElement("option");

  optionTeam.textContent = "Select team";
  teamList.appendChild(optionTeam);

  if (accountSelected !== "Select") {
    try {
      let teamsThatCanBeGrantedPermissions = [];
      try {
        const teamsReq = await client.get(
          `manage_datasets/ps_get_teams?selected_account=${window.defaultBfAccount}`
        );
        teamsThatCanBeGrantedPermissions = window.getSortedTeamStrings(teamsReq.data.teams);
      } catch (error) {
        const emessage = userErrorMessage(error);
      }

      // The window.removeOptions() wasn't working in some instances (creating a double list) so second removal for everything but the first element.
      $("#bf_list_teams").selectpicker("refresh");
      $("#bf_list_teams").find("option:not(:first)").remove();
      $("#guided_bf_list_users_and_teams").selectpicker("refresh");
      $("#button-add-permission-team").hide();

      for (const teamName of teamsThatCanBeGrantedPermissions) {
        const optionTeam = document.createElement("option");
        optionTeam.textContent = teamName;
        optionTeam.value = teamName;
        teamList.appendChild(optionTeam);
      }
      confirm_click_account_function();
    } catch (error) {
      window.log.error(error);
      console.error(error);
      confirm_click_account_function();
    }
  }
};

window.selectOptionColor = (mylist) => {
  mylist.style.color = mylist.options[mylist.selectedIndex].style.color;
};

// ////////////////////////////////DATASET FILTERING FEATURE/////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////

// this function now is only used to load all datasets ("All" permission)
// onto the dataset_description file ds-name select
window.refreshDatasetList = () => {
  let datasetPermission = "All";
  let filteredDatasets = [];

  if (datasetPermission.toLowerCase() === "all") {
    for (let i = 0; i < window.datasetList.length; i++) {
      filteredDatasets.push(window.datasetList[i].name);
    }
  }
  filteredDatasets.sort((a, b) => {
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
window.refreshOrganizationList = () => {
  window.organizationList.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  populateOrganizationDropdowns(window.organizationList);

  // parentDSTagify.settings.whitelist = getParentDatasets();
  return window.organizationList.length;
};

/// populate the dropdowns with refreshed dataset list
const populateDatasetDropdowns = (mylist) => {
  window.clearDatasetDropdowns();
  for (const myitem in mylist) {
    let myitemselect = mylist[myitem];
    let option = document.createElement("option");
    let option2 = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    option2 = option.cloneNode(true);

    window.curateDatasetDropdown.appendChild(option2);
  }
  metadataDatasetlistChange();
  permissionDatasetlistChange();
  postCurationListChange();
  datasetStatusListChange();
};

const populateOrganizationDropdowns = (organizations) => {
  clearOrganizationDropdowns();

  for (const organization in organizations) {
    let myitemselect = organizations[organization];
    let option = document.createElement("option");
    let option1 = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    option1 = option.cloneNode(true);

    window.curateOrganizationDropdown.appendChild(option1);
  }
};
// ////////////////////////////////////END OF DATASET FILTERING FEATURE//////////////////////////////

window.updateBfAccountList = async () => {
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
  for (const myitem in accountList) {
    let myitemselect = accountList[myitem];
    let option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
  }
  await window.loadDefaultAccount();
  if (accountList[0] === "Select" && accountList.length === 1) {
    // todo: no existing accounts to load
  }
  refreshBfUsersList();
  refreshBfTeamsList(bfListTeams);
};

window.loadDefaultAccount = async () => {
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
    // TODO: Look into if this can be at times wrong?  If so this may be why they are having passing the teams authrization check but successfully retrieving the default account and user information.
    let myitemselect = accounts[0];
    // keep the window.defaultBfAccount value as the user's profile config key value for reference later
    window.defaultBfAccount = myitemselect;

    // fetch the user's email and set that as the account field's value
    let userInformation = await api.getUserInformation();
    let userEmail = userInformation.email;

    log.info(`Loading default account user organization: ${userInformation.preferredOrganization}`);
    log.info(`Loading default account user default profile is: ${defaultBfAccount}`);

    // remove the N:organization from the account name

    $("#current-bf-account").text(userEmail);
    $("#current-bf-account-generate").text(userEmail);
    $("#create_empty_dataset_BF_account_span").text(userEmail);
    $(".bf-account-span").text(userEmail);

    showHideDropdownButtons("account", "show");
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);
  }
};

const showPrePublishingPageElements = () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    return;
  }

  // show the "Begin Publishing" button and hide the checklist and submission section
  $("#begin-prepublishing-btn").removeClass("hidden");
  $("#submit_prepublishing_review-question-2").addClass("hidden");
  $("#curation-dataset-status-loading").removeClass("hidden");
  $("#prepublishing-checklist-container").hide();
  $("#prepublishing-submit-btn-container").hide();
  $(".pre-publishing-continue-container").hide();
};

// The callback argument is used to determine whether or not to publish or unpublish the dataset
// If callback is empty then the dataset status will only be fetched and displayed
window.showPublishingStatus = async (callback, curationMode = "") => {
  return new Promise(async function (resolve, reject) {
    if (callback == "noClear") {
      let nothing;
    }

    let curationModeID = "";
    let currentAccount = $("#current-bf-account").text();
    let currentDataset = $(".bf-dataset-span")
      .html()
      .replace(/^\s+|\s+$/g, "");

    if (curationMode === "guided") {
      curationModeID = "guided--";
      currentAccount = window.sodaJSONObj["bf-account-selected"]["account-name"];
      currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    }

    if (currentDataset === "None") {
      if (curationMode === "" || curationMode === "freeform") {
        $("#button-refresh-publishing-status").addClass("hidden");
        $("#curation-dataset-status-loading").addClass("hidden");
      }
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

          if (callback === window.submitReviewDatasetCheck || callback === withdrawDatasetCheck) {
            return resolve(callback(res, curationMode));
          }
          if (curationMode === "" || curationMode === "freeform") {
            $("#submit_prepublishing_review-question-2").removeClass("hidden");
            $("#curation-dataset-status-loading").addClass("hidden");
            // $("#button-refresh-publishing-status").removeClass("hidden");
            $("#button-refresh-publishing-status").removeClass("fa-spin");
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
          reverseButtons: window.reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
        });

        window.logGeneralOperationsForAnalytics(
          "Error",
          window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
          window.AnalyticsGranularity.ALL_LEVELS,
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

// const allowedMedataFiles = [
//   "submission.xlsx",
//   "submission.csv",
//   "submission.json",
//   "dataset_description.xlsx",
//   "dataset_description.csv",
//   "dataset_description.json",
//   "subjects.xlsx",
//   "subjects.csv",
//   "subjects.json",
//   "samples.xlsx",
//   "samples.csv",
//   "samples.json",
//   "README.txt",
//   "CHANGES.txt",
// ];

// //////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////
// ////////////////// ORGANIZE DATASETS NEW FEATURE /////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////

// var backFolder = [];
// var forwardFolder = [];

window.highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"];
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

window.sodaJSONObj = {};

/// back button Curate
organizeDSbackButton.addEventListener("click", function () {
  let slashCount = window.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    let filtered = window.getGlobalPath(window.organizeDSglobalPath);

    if (filtered.length === 1) {
      window.organizeDSglobalPath.value = filtered[0] + "/";
    } else {
      window.organizeDSglobalPath.value = filtered.slice(0, filtered.length - 1).join("/") + "/";
    }
    let myPath = window.datasetStructureJSONObj;
    for (var item of filtered.slice(1, filtered.length - 1)) {
      myPath = myPath["folders"][item];
    }
    // construct UI with files and folders
    $("#items").empty();
    window.already_created_elem = [];
    let items = window.loadFileFolder(myPath); //array -
    //we have some items to display
    window.listItems(myPath, "#items", 500, true);
    window.organizeLandingUIEffect();
    // reconstruct div with new elements
    window.getInFolder(
      ".single-item",
      "#items",
      window.organizeDSglobalPath,
      window.datasetStructureJSONObj
    );
  }
});

// Add folder button
organizeDSaddNewFolder.addEventListener("click", function (event) {
  event.preventDefault();
  let slashCount = window.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    let newFolderName = "New Folder";
    Swal.fire({
      title: "Add new folder...",
      text: "Enter a name below:",
      heightAuto: false,
      input: "text",
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: "Cancel",
      confirmButtonText: "Add folder",
      reverseButtons: window.reverseSwalButtons,
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
          let val = $("#add-new-folder-input").val();
          const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
            val,
            "folder-and-file-name-is-valid"
          );

          if (folderNameIsValid) {
            $("#add-new-folder-button").attr("disabled", false);
          } else {
            Swal.showValidationMessage(`The folder name contains non-allowed characters.`);
            $("#add-new-folder-button").attr("disabled", true);
            return;
          }
        });
      },
      didDestroy: () => {
        $(".swal2-confirm").attr("id", "");
        $(".swal2-input").attr("id", "");
      },
    }).then((result) => {
      if (result.value && result.value !== null && result.value !== "") {
        newFolderName = result.value.trim();
        // check for duplicate or files with the same name
        let duplicate = false;
        let itemDivElements = document.getElementById("items").children;
        for (let i = 0; i < itemDivElements.length; i++) {
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

          window.logCurationForAnalytics(
            "Error",
            window.PrepareDatasetsAnalyticsPrefix.CURATE,
            window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
            ["Step 3", "Add", "Folder"],
            determineDatasetLocation()
          );
        } else {
          /// update window.datasetStructureJSONObj
          let currentPath = window.organizeDSglobalPath.value;
          let jsonPathArray = currentPath.split("/");
          let filtered = jsonPathArray.slice(1).filter(function (el) {
            return el != "";
          });

          let myPath = window.getRecursivePath(filtered, window.datasetStructureJSONObj);
          let renamedNewFolder = newFolderName;
          // update Json object with new folder created
          myPath["folders"][renamedNewFolder] = {
            folders: {},
            files: {},
            type: "virtual",
            action: ["new"],
          };

          window.listItems(myPath, "#items", 500, true);
          window.getInFolder(
            ".single-item",
            "#items",
            window.organizeDSglobalPath,
            window.datasetStructureJSONObj
          );

          // log that the folder was successfully added
          window.logCurationForAnalytics(
            "Success",
            window.PrepareDatasetsAnalyticsPrefix.CURATE,
            window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
            ["Step 3", "Add", "Folder"],
            determineDatasetLocation()
          );

          window.hideMenu(
            "folder",
            window.menuFolder,
            window.menuHighLevelFolders,
            window.menuFile
          );
          window.hideMenu(
            "high-level-folder",
            window.menuFolder,
            window.menuHighLevelFolders,
            window.menuFile
          );
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
// When importing folders to the file expolorer this function will import the content within the folder
window.populateJSONObjFolder = (action, jsonObject, folderPath) => {
  let folderContent = window.fs.readdirSync(folderPath);
  folderContent.forEach((itemWithinFolder) => {
    //prevented here
    let statsObj = window.fs.statSync(window.path.join(folderPath, itemWithinFolder));
    let addedElement = window.path.join(folderPath, itemWithinFolder);

    if (statsObj.isDirectory && !/(^|\/)\[^\/\.]/g.test(itemWithinFolder)) {
      if (window.irregularFolderArray.includes(addedElement)) {
        let renamedFolderName = "";
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = window.removeIrregularFolders(itemWithinFolder);
          } else if (action === "replace") {
            renamedFolderName = window.replaceIrregularFolders(itemWithinFolder);
          }
          jsonObject["folders"][renamedFolderName] = {
            type: "local",
            folders: {},
            files: {},
            path: addedElement,
            action: ["new", "renamed"],
          };
          itemWithinFolder = renamedFolderName;
        }
      } else {
        jsonObject["folders"][itemWithinFolder] = {
          type: "local",
          folders: {},
          files: {},
          path: addedElement,
          action: ["new"],
        };
      }
      window.populateJSONObjFolder(action, jsonObject["folders"][itemWithinFolder], addedElement);
    } else if (
      statsObj.isFile &&
      !/(!\/[^\/]+)/g.test(itemWithinFolder) &&
      itemWithinFolder !== ".DS_Store" &&
      itemWithinFolder !== "Thumbs.db"
    ) {
      // The check here will prevent files with a foward slash, .DS_Store and Thumbs.db files from being imported
      jsonObject["files"][itemWithinFolder] = {
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

window.hideFullName = () => {
  full_name_show = false;
  fullNameValue.style.display = "none";
  fullNameValue.style.top = "-250%";
  fullNameValue.style.left = "-250%";
};

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
const showFullName = (ev, element, text) => {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  full_name_show = true;
  let mouseX = ev.pageX - 200;
  let mouseY = ev.pageY;
  let isOverflowing =
    element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
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
window.hoverForFullName = (ev) => {
  let fullPath = ev.innerText;
  // ev.children[1] is the child element folder_desc of div.single-item,
  // which we will put through the overflowing check in showFullName function
  showFullName(event, ev.children[1], fullPath);
};

document.addEventListener("onmouseover", function (e) {
  if (e.target.classList.value === "fas fa-folder") {
    window.hoverForFullName(e);
  } else {
    window.hideFullName();
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
const showDetailsFile = () => {
  $(".div-display-details.file").toggleClass("show");
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
    await window.wait(1000);
  }

  retrieveBFAccounts();
})();

// // this function is called in the beginning to load bf accounts to a list
// // which will be fed as dropdown options
const retrieveBFAccounts = async () => {
  // remove all elements from the array
  bfAccountOptions.length = 0;
  window.bfAccountOptionsStatus = "";

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
      let myitemselect = accounts[0];
      window.defaultBfAccount = myitemselect;
      try {
        let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
          params: {
            selected_account: window.defaultBfAccount,
          },
        });
        let user_email = bf_account_details_req.data.email;
        $("#current-bf-account").text(user_email);
        $("#current-bf-account-generate").text(user_email);
        $("#create_empty_dataset_BF_account_span").text(user_email);
        $(".bf-account-span").text(user_email);

        // show the preferred organization
        let organization = bf_account_details_req.data.organization;
        $(".bf-organization-span").text(organization);

        $("#div-bf-account-load-progress").css("display", "none");
        showHideDropdownButtons("account", "show");
        window.refreshDatasetList();
        updateDatasetList();
        window.updateOrganizationList();
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
window.hideMenu = (category, menu1, menu2, menu3) => {
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

// var newDSName;
// const generateDataset = (button) => {
//   document.getElementById("para-organize-datasets-success").style.display = "none";
//   document.getElementById("para-organize-datasets-error").style.display = "none";
//   if (button.id === "btn-generate-locally") {
//     $("#btn-generate-BF").removeClass("active");
//     $(button).toggleClass("active");
//     Swal.fire({
//       title: "Generate dataset locally",
//       text: "Enter a name for the dataset:",
//       input: "text",
//       showCancelButton: true,
//       cancelButtonText: "Cancel",
//       confirmButtonText: "Confirm and Choose Location",
//       heightAuto: false,
//       backdrop: "rgba(0,0,0, 0.4)",
//       reverseButtons: window.reverseSwalButtons,
//       showClass: {
//         popup: "animate__animated animate__zoomIn animate__faster",
//       },
//       hideClass: {
//         popup: "animate__animated animate__zoomOut animate_fastest",
//       },
//     }).then((result) => {
//       if (result.isConfirmed) {
//         newDSName = result.value.trim();
//         window.electron.ipcRenderer.send("open-file-dialog-newdataset");
//       }
//     });
//   } else {
//     $("#btn-generate-locally").removeClass("active");
//     $(button).toggleClass("active");
//   }
// };

// window.electron.ipcRenderer.on("selected-new-dataset", async (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null) {
//       document.getElementById("para-organize-datasets-loading").style.display = "block";
//       document.getElementById("para-organize-datasets-loading").innerHTML =
//         "<span>Please wait...</span>";

//       window.log.info("Generating a new dataset organize datasets at ${filepath}");

//       try {
//         await client.post(
//           `/organize_datasets/datasets`,

//           {
//             generation_type: "create-new",
//             generation_destination_path: filepath[0],
//             dataset_name: newDSName,
//             soda_json_directory_structure: window.datasetStructureJSONObj,
//           },
//           {
//             timeout: 0,
//           },
//           {
//             timeout: 0,
//           }
//         );

//         document.getElementById("para-organize-datasets-error").style.display = "none";
//         document.getElementById("para-organize-datasets-success").style.display = "block";
//         document.getElementById("para-organize-datasets-success").innerHTML =
//           "<span>Generated successfully!</span>";
//       } catch (error) {
//         clientError(error);
//         document.getElementById("para-organize-datasets-success").style.display = "none";
//         document.getElementById("para-organize-datasets-error").style.display = "block";
//         document.getElementById("para-organize-datasets-error").innerHTML =
//           "<span> " + userErrorMessage(error) + "</span>";
//       }
//     }
//   }
// });

window.CheckFileListForServerAccess = async (fileList) => {
  try {
    const res = await client.post(`/curate_datasets/check_server_access_to_files`, {
      file_list_to_check: fileList,
    });
    //const accessible_files = res.data.accessible_files;
    const inaccessible_files = res.data.inaccessible_files;
    return inaccessible_files;
  } catch (error) {
    clientError(error);
    window.notyf.open({
      type: "error",
      message: `Unable to determine file/folder accessibility`,
      duration: 7000,
    });
    return [];
  }
};

//////////// FILE BROWSERS to import existing files and folders /////////////////////
organizeDSaddFiles.addEventListener("click", function () {
  window.electron.ipcRenderer.send("open-files-organize-datasets-dialog");
});

window.electron.ipcRenderer.on("selected-files-organize-datasets", async (event, importedFiles) => {
  await addDataArrayToDatasetStructureAtPath(importedFiles);
});

organizeDSaddFolders.addEventListener("click", function () {
  window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog");
});

// Event listener for when folder(s) are imported into the file explorer
window.electron.ipcRenderer.on(
  "selected-folders-organize-datasets",
  async (event, importedFolders) => {
    // Add the imported folders to the dataset structure
    await addDataArrayToDatasetStructureAtPath(importedFolders);
  }
);

/* ################################################################################## */
/* ################################################################################## */
/* ################################################################################## */

const getNestedObjectsFromDatasetStructureByPath = (datasetStructure, path) => {
  const pathArray = window.path.split("/").filter((item) => item !== "");
  let currentObject = datasetStructure;
  for (const item of pathArray) {
    currentObject = currentObject["folders"][item];
  }
  return currentObject;
};

const removeHiddenFilesFromDatasetStructure = (datasetStructure) => {
  const currentFilesAtPath = Object.keys(datasetStructure.files);
  for (const fileKey of currentFilesAtPath) {
    const fileIsHidden = window.evaluateStringAgainstSdsRequirements(fileKey, "file-is-hidden");
    if (fileIsHidden) {
      delete datasetStructure["files"][fileKey];
    }
  }

  const currentFoldersAtPath = Object.keys(datasetStructure.folders);
  for (const folderKey of currentFoldersAtPath) {
    removeHiddenFilesFromDatasetStructure(datasetStructure["folders"][folderKey]);
  }
};

const replaceProblematicFoldersWithSDSCompliantNames = (datasetStructure) => {
  const currentFoldersAtPath = Object.keys(datasetStructure.folders);
  for (const folderKey of currentFoldersAtPath) {
    const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
      folderKey,
      "folder-and-file-name-is-valid"
    );
    if (!folderNameIsValid) {
      const newFolderName = folderKey.replace(sparcFolderAndFileRegex, "-");
      const newFolderObj = { ...datasetStructure["folders"][folderKey] };
      if (!newFolderObj["action"].includes("renamed")) {
        newFolderObj["action"].push("renamed");
      }
      datasetStructure["folders"][newFolderName] = newFolderObj;
      delete datasetStructure["folders"][folderKey];
      replaceProblematicFoldersWithSDSCompliantNames(datasetStructure["folders"][newFolderName]);
    }
  }
};

const replaceProblematicFilesWithSDSCompliantNames = (datasetStructure) => {
  const currentFilesAtPath = Object.keys(datasetStructure.files);
  for (const fileKey of currentFilesAtPath) {
    const fileNameIsValid = window.evaluateStringAgainstSdsRequirements(
      fileKey,
      "folder-and-file-name-is-valid"
    );
    if (!fileNameIsValid) {
      const newFileName = fileKey.replace(sparcFolderAndFileRegex, "-");
      const newFileObj = { ...datasetStructure["files"][fileKey] };
      if (!newFileObj["action"].includes("renamed")) {
        newFileObj["action"].push("renamed");
      }
      datasetStructure["files"][newFileName] = newFileObj;
      delete datasetStructure["files"][fileKey];
    }
  }
  const currentFoldersAtPath = Object.keys(datasetStructure.folders);
  for (const folderKey of currentFoldersAtPath) {
    replaceProblematicFilesWithSDSCompliantNames(datasetStructure["folders"][folderKey]);
  }
};

// const deleteProblematicFilesFromDatasetStructure = (datasetStructure) => {
//   const currentFilesAtPath = Object.keys(datasetStructure.files);
//   for (const fileKey of currentFilesAtPath) {
//     const fileNameIsValid = window.evaluateStringAgainstSdsRequirements(
//       fileKey,
//       "folder-and-file-name-is-valid"
//     );
//     if (!fileNameIsValid) {
//       delete datasetStructure["files"][fileKey];
//     }
//   }

//   const currentFoldersAtPath = Object.keys(datasetStructure.folders);
//   for (const folderKey of currentFoldersAtPath) {
//     deleteProblematicFilesFromDatasetStructure(datasetStructure["folders"][folderKey]);
//   }
// };

const namesOfForbiddenFiles = {
  ".DS_Store": true,
  "Thumbs.db": true,
};

const sparcFolderAndFileRegex = /[\+&\%#]/;
const identifierConventionsRegex = /^[a-zA-Z0-9-_]+$/;

window.evaluateStringAgainstSdsRequirements = (stringToTest, stringCase) => {
  const testCases = {
    "folder-and-file-name-is-valid": !sparcFolderAndFileRegex.test(stringToTest), // returns true if the string is valid
    "file-is-hidden": stringToTest.startsWith("."), // returns true if the string is hidden
    "file-is-in-forbidden-files-list": namesOfForbiddenFiles?.[stringToTest], // returns true if the string is in the forbidden files list
    "string-adheres-to-identifier-conventions": identifierConventionsRegex.test(stringToTest), // returns true if the string adheres to the identifier conventions
  };
  return testCases[stringCase];
};
let loadingSweetAlert;
let loadingSweetAlertTimer;

const showFileImportLoadingSweetAlert = (delayBeforeShowingSweetAlert) => {
  // Close any existing loading sweet alert if it exists
  closeFileImportLoadingSweetAlert();

  // Show the loading sweet alert after a short deleay to avoid flickering
  // if the loading is quick, the closeFileImportLoadingSweetAlert() function should
  // be called so that the loading sweet alert is not shown at all
  loadingSweetAlertTimer = setTimeout(() => {
    loadingSweetAlert = Swal.fire({
      title: "Importing your files and folders into SODA...",
      html: `
        <div class="lds-roller">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      `,
      width: 800,
      heightAuto: false,
      width: 800,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      showConfirmButton: false,
      showCloseButton: false,
    });
  }, delayBeforeShowingSweetAlert);
};

const closeFileImportLoadingSweetAlert = () => {
  // Clear any existing timer
  if (loadingSweetAlertTimer) {
    clearTimeout(loadingSweetAlertTimer);
  }

  if (loadingSweetAlert) {
    loadingSweetAlert.close();
  }
};

const buildDatasetStructureJsonFromImportedData = async (itemPaths, currentFileExplorerPath) => {
  const inaccessibleItems = [];
  const forbiddenFileNames = [];
  const problematicFolderNames = [];
  const problematicFileNames = [];
  const datasetStructure = {};
  const hiddenItems = [];

  showFileImportLoadingSweetAlert(500);

  // Function to traverse and build JSON structure
  const traverseAndBuildJson = async (pathToExplore, currentStructure, currentStructurePath) => {
    currentStructure["folders"] = currentStructure["folders"] || {};
    currentStructure["files"] = currentStructure["files"] || {};

    try {
      if (await window.fs.isDirectory(pathToExplore)) {
        const folderName = window.path.basename(pathToExplore);

        const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
          folderName,
          "folder-and-file-name-is-valid"
        );
        if (!folderNameIsValid) {
          problematicFolderNames.push(`${currentStructurePath}${folderName}`);
        }

        // Add the folder to the JSON structure
        currentStructure["folders"][folderName] = {
          path: pathToExplore,
          type: "local",
          files: {},
          folders: {},
          action: ["new"],
        };

        // Recursively traverse the folder and build the JSON structure
        const folderContents = await window.fs.readdir(pathToExplore);
        await Promise.all(
          folderContents.map(async (item) => {
            const itemPath = window.path.join(pathToExplore, item);
            await traverseAndBuildJson(
              itemPath,
              currentStructure["folders"][folderName],
              `${currentStructurePath}${folderName}/`
            );
          })
        );
      } else if (await window.fs.isFile(pathToExplore)) {
        const fileName = window.path.basename(pathToExplore);
        const fileExtension = window.path.extname(pathToExplore);
        const relativePathToFileObject = currentStructurePath;
        const fileObject = {
          relativePath: `${relativePathToFileObject}${fileName}`,
          localFilePath: pathToExplore,
          fileName: fileName,
        };

        const fileIsInForbiddenFilesList = window.evaluateStringAgainstSdsRequirements(
          fileName,
          "file-is-in-forbidden-files-list"
        );

        if (fileIsInForbiddenFilesList) {
          forbiddenFileNames.push(fileObject);
        } else {
          // Check if the file name has any characters that do not comply with SPARC naming requirements
          const fileNameIsValid = window.evaluateStringAgainstSdsRequirements(
            fileName,
            "folder-and-file-name-is-valid"
          );
          if (!fileNameIsValid) {
            problematicFileNames.push(fileObject);
          }

          const fileIsHidden = window.evaluateStringAgainstSdsRequirements(
            fileName,
            "file-is-hidden"
          );
          if (fileIsHidden) {
            hiddenItems.push(fileObject);
          }

          // Add the file to the current structure
          currentStructure["files"][fileName] = {
            path: pathToExplore,
            type: "local",
            description: "",
            "additional-metadata": "",
            action: ["new"],
            extension: fileExtension,
          };
        }
      }
    } catch (error) {
      console.error(error);
      inaccessibleItems.push(pathToExplore);
    }
  };

  // Process itemPaths in parallel
  await Promise.all(
    itemPaths.map(async (itemPath) => {
      await traverseAndBuildJson(itemPath, datasetStructure, currentFileExplorerPath);
    })
  );

  closeFileImportLoadingSweetAlert();

  if (inaccessibleItems.length > 0) {
    await swalFileListSingleAction(
      inaccessibleItems,
      "SODA was unable to access some of your imported files",
      "The files listed below will not be imported into SODA:",
      false
    );
  }

  if (forbiddenFileNames.length > 0) {
    await swalFileListSingleAction(
      forbiddenFileNames.map((file) => file.relativePath),
      "Forbidden file names detected",
      "The files listed below do not comply with the SPARC data standards and will not be imported:",
      false
    );
  }

  if (problematicFolderNames.length > 0) {
    const userResponse = await swalFileListTripleAction(
      problematicFolderNames,
      "<p>Folder name modifications</p>",
      `The folders listed below contain the special characters "#", "&", "%", or "+"
      which are typically not recommended per the SPARC data standards.
      You may choose to either keep them as is, or replace the characters with '-'.
      `,
      "Replace the special characters with '-'",
      "Keep the folder names as they are",
      "Cancel import",
      "What would you like to do with the folders with special characters?"
    );
    if (userResponse === "confirm") {
      replaceProblematicFoldersWithSDSCompliantNames(datasetStructure);
    }
    // If the userResponse is "deny", nothing needs to be done
    if (userResponse === "cancel") {
      throw new Error("Importation cancelled");
    }
  }

  if (problematicFileNames.length > 0) {
    const userResponse = await swalFileListTripleAction(
      problematicFileNames.map((file) => file.relativePath),
      "<p>File name modifications</p>",
      `The files listed below contain the special characters "#", "&", "%", or "+"
      which are typically not recommended per the SPARC data standards.
      You may choose to either keep them as is, or replace the characters with '-'.
      `,
      "Replace the special characters with '-'",
      "Keep the file names as they are",
      "Cancel import",
      "What would you like to do with the files with special characters?"
    );
    if (userResponse === "confirm") {
      replaceProblematicFilesWithSDSCompliantNames(datasetStructure);
    }
    // If the userResponse is "deny", nothing needs to be done
    if (userResponse === "cancel") {
      throw new Error("Importation cancelled");
    }
  }

  if (hiddenItems.length > 0) {
    const userResponse = await swalFileListTripleAction(
      hiddenItems.map((file) => file.relativePath),
      "<p>Hidden files detected</p>",
      `Hidden files are typically not recommend per the SPARC data standards, but you can choose to keep them if you wish.`,
      "Import the hidden files into SODA",
      "Do not import the hidden files",
      "Cancel import",
      "What would you like to do with the hidden files?"
    );
    // If the userResponse is "confirm", nothing needs to be done
    if (userResponse === "deny") {
      removeHiddenFilesFromDatasetStructure(datasetStructure);
    }
    if (userResponse === "cancel") {
      throw new Error("Importation cancelled");
    }
  }

  // If the dataset structure is empty after processing the imported files and folders, throw an error
  if (
    Object.keys(datasetStructure?.["folders"]).length === 0 &&
    Object.keys(datasetStructure?.["files"]).length === 0
  ) {
    throw new Error("Error building dataset structure");
  }

  return datasetStructure;
};

const mergeLocalAndRemoteDatasetStructure = async (
  datasetStructureToMerge,
  currentFileExplorerPath
) => {
  const duplicateFiles = [];

  const traverseAndMergeDatasetJsonObjects = async (datasetStructureToMerge, recursedFilePath) => {
    const currentNestedPathArray = window.getGlobalPathFromString(recursedFilePath);
    const existingDatasetJsonAtPath = window.getRecursivePath(
      currentNestedPathArray.slice(1),
      window.datasetStructureJSONObj
    ); // {folders: {...}, files: {...}} (The actual file object of the folder 'code')

    const ExistingFoldersAtPath = Object.keys(existingDatasetJsonAtPath["folders"]);
    const ExistingFilesAtPath = Object.keys(existingDatasetJsonAtPath["files"]);
    const foldersBeingMergedToPath = Object.keys(datasetStructureToMerge["folders"]);
    const filesBeingMergedToPath = Object.keys(datasetStructureToMerge["files"]);

    for (const folder of foldersBeingMergedToPath) {
      if (ExistingFoldersAtPath.includes(folder)) {
        // If the folder already exists, leave it as is...
      } else {
        // Otherwise add a new folder to the existing dataset structure
        existingDatasetJsonAtPath["folders"][folder] = {
          type: "local",
          files: {},
          folders: {},
          action: ["new"],
        };
      }
    }

    for (const file of filesBeingMergedToPath) {
      if (ExistingFilesAtPath.includes(file)) {
        duplicateFiles.push({
          fileName: file,
          virtualFilePath: recursedFilePath,
          fileObject: datasetStructureToMerge["files"][file],
        });
      } else {
        existingDatasetJsonAtPath["files"][file] = datasetStructureToMerge["files"][file];
      }
    }

    for (const folder of foldersBeingMergedToPath) {
      await traverseAndMergeDatasetJsonObjects(
        datasetStructureToMerge["folders"][folder],
        `${recursedFilePath}${folder}/`
      );
    }
  };

  showFileImportLoadingSweetAlert(500);

  // DO THE MERGING
  await traverseAndMergeDatasetJsonObjects(datasetStructureToMerge, currentFileExplorerPath);

  closeFileImportLoadingSweetAlert();

  if (duplicateFiles.length > 0) {
    const userConfirmedFileOverwrite = await swalFileListDoubleAction(
      duplicateFiles.map((file) => `${file.virtualFilePath}${file.fileName}`),
      `Duplicate files detected  <p>You have two options for the duplicate files:</p>`,
      ` 
        <span
          class="text-left"
          style="display: flex; flex-direction: column; margin-bottom: 1em">
          <b>Overwrite the existing files:</b> This option will completely replace existing files with the files being imported.
          This option is recommended if the files have changed since they were last imported into SODA.
          <br />
          <b>Skip the duplicate files:</b> This option will not import the duplicate files into SODA.
          This option is recommended if the files have not changed since they were last imported into SODA.
        </span>
      `,
      "Overwrite the existing files",
      "Skip the duplicate files",
      "What would you like to do with the duplicate files?"
    );
    if (userConfirmedFileOverwrite) {
      for (const file of duplicateFiles) {
        const currentNestedPathArray = window.getGlobalPathFromString(file.virtualFilePath);
        // remove first and last elements from array
        currentNestedPathArray.shift();
        const folderContainingFileToOverwrite = window.getRecursivePath(
          currentNestedPathArray,
          window.datasetStructureJSONObj
        );

        const fileTypeOfObjectToOverwrite =
          folderContainingFileToOverwrite["files"][file.fileName]?.["type"];

        // overwrite the existing file with the new file
        folderContainingFileToOverwrite["files"][file.fileName] = file.fileObject;

        // if the file being overwritten was from Pennsieve, add the "updated" action to the file
        if (
          fileTypeOfObjectToOverwrite === "bf" &&
          !folderContainingFileToOverwrite["files"][file.fileName]["action"].includes("updated")
        ) {
          folderContainingFileToOverwrite["files"][file.fileName]["action"].push("updated");
        }
      }
    }
  }
};

const checkForDuplicateFolderAndFileNames = async (importedFolders, itemsAtPath) => {
  const duplicateFolderNames = [];
  const duplicateFileNames = [];

  const checkForDuplicateNames = async (importedFolders, itemsAtPath) => {
    const currentFoldersAtPath = Object.keys(itemsAtPath.folders);
    const currentFilesAtPath = Object.keys(itemsAtPath.files);
    fg;
    for (const folder of importedFolders) {
      folderName = window.path.basename(folder);
      if (currentFoldersAtPath.includes(folderName)) {
        duplicateFolderNames.push(folderName);
      }
      const folderContents = await fs.readdir(folder);
    }
    for (const fileName of importedFiles) {
      if (currentFilesAtPath.includes(fileName)) {
        duplicateFileNames.push(fileName);
      }
    }
  };
};

const addDataArrayToDatasetStructureAtPath = async (importedData) => {
  // If no data was imported ()
  const numberOfItemsToImport = importedData.length;
  if (numberOfItemsToImport === 0) {
    window.notyf.open({
      type: "info",
      message: "No folders/files were selected to import",
      duration: 4000,
    });
    return;
  }
  try {
    // STEP 1: Build the JSON object from the imported data
    // (This function handles bad folders/files, inaccessible folders/files, etc and returns a clean dataset structure)
    const currentFileExplorerPath = window.organizeDSglobalPath.value.trim();

    const builtDatasetStructure = await buildDatasetStructureJsonFromImportedData(
      importedData,
      currentFileExplorerPath
    );

    // Step 2: Add the imported data to the dataset structure (This function handles duplicate files, etc)
    await mergeLocalAndRemoteDatasetStructure(builtDatasetStructure, currentFileExplorerPath);

    // Step 3: Update the UI
    const currentPathArray = window.getGlobalPath(window.organizeDSglobalPath); // ['dataset_root', 'code']
    const nestedJsonDatasetStructure = window.getRecursivePath(
      currentPathArray.slice(1),
      window.datasetStructureJSONObj
    );
    window.listItems(nestedJsonDatasetStructure, "#items", 500, true);
    window.getInFolder(
      ".single-item",
      "#items",
      window.organizeDSglobalPath,
      window.datasetStructureJSONObj
    );

    // Step 4: Update successful, show success message
    window.notyf.open({
      type: "success",
      message: `Data successfully imported`,
      duration: 3000,
    });
  } catch (error) {
    closeFileImportLoadingSweetAlert();
    window.notyf.open({
      type: error.message === "Importation cancelled" ? "info-grey" : "error",
      message: error.message || "Error importing data",
      duration: 3000,
    });
  }
};

window.allowDrop = (ev) => {
  ev.preventDefault();
};
// This function is called when the user drops files into the file explorer
window.drop = async (ev) => {
  ev.preventDefault();

  // If the user is trying to drag/drop files at the root level of the dataset, show an error
  const slashCount = window.getPathSlashCount();
  if (slashCount === 1) {
    await swalShowError(
      "You cannot import files at the root level of your dataset",
      `To import data, please navigate to a SPARC folder and try again.
      <br /><br />
      If you are trying to add SPARC metadata file(s), you can do so in the next Step.`
    );
    return;
  }
  const itemsDroppedInFileExplorer = ev.dataTransfer.files;
  // Convert the FileList object to an array of paths
  const droppedItemsArray = Array.from(itemsDroppedInFileExplorer).map((item) => item.path);

  if (droppedItemsArray.length === 0) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "No folders/files were able to be imported",
    });
    return;
  }

  let accessibleItems = [];
  let inaccessibleItems = [];
  for (const path of droppedItemsArray) {
    try {
      fs.statSync(path);
      accessibleItems.push(path);
    } catch (error) {
      inaccessibleItems.push(path);
    }
  }

  if (inaccessibleItems.length > 0) {
    if (accessibleItems.length === 0) {
      await swalFileListSingleAction(
        inaccessibleItems,
        "SODA was unable import your dropped files/folders",
        "The files listed below will not be imported into SODA. If this issue persists, please try importing the folders/files via the import button.",
        false
      );
      return;
    } else {
      const importAccessibleItemsOnly = await swalFileListDoubleAction(
        accessibleItems,
        "<p>SODA was unable to import some of your dropped files/folders</p>",
        "A list of the folders/files that SODA was not able to import is shown below:",
        "Yes, continue with the import",
        "No, cancel the import",
        "Would you like to continue the import without these folders/files?"
      );

      if (!importAccessibleItemsOnly) {
        return;
      }
    }
  }

  // Add the items to the dataset structure (This handles problematic files/folders, duplicate files etc)
  await addDataArrayToDatasetStructureAtPath(accessibleItems);
};

window.irregularFolderArray = [];
window.detectIrregularFolders = (folderName, pathEle) => {
  if (checkIrregularNameBoolean(folderName)) {
    window.irregularFolderArray.push(pathEle);
  }
  if (window.fs.lstatSyncIsDirectory(pathEle)) {
    window.fs.readdirSync(pathEle).forEach(function (folder) {
      var existsAndDirectory = window.fs.statSyncAndDirectory(window.path.join(pathEle, folder));
      if (existsAndDirectory) {
        window.detectIrregularFolders(folder, window.path.join(pathEle, folder));
      }
      return window.irregularFolderArray;
    });
  }
};

const checkIrregularNameBoolean = (folderName) => {
  //window.nonAllowedCharacters modified to only allow a-z A-z 0-9 and hyphen "-"
  const nonAllowedFolderCharacters = /[^a-zA-Z0-9-]/;
  return nonAllowedFolderCharacters.test(folderName);
};

/* The following functions aim at ignore folders with irregular characters, or replace the characters with (-),
  or remove the characters from the names.
  All return an object in the form {"type": empty for now, will be confirmed once users click an option at the popup,
  "paths": array of all the paths with special characters detected}
*/

window.replaceIrregularFolders = (pathElement) => {
  const reg = /[^a-zA-Z0-9-]/g;
  const str = window.path.basename(pathElement);
  const newFolderName = str.replace(reg, "-");
  return newFolderName;
};

window.removeIrregularFolders = (pathElement) => {
  const reg = /[^a-zA-Z0-9-]/g;
  const str = window.path.basename(pathElement);
  const newFolderName = str.replace(reg, "");
  return newFolderName;
};

// // SAVE FILE ORG
// window.electron.ipcRenderer.on("save-file-organization-dialog", (event) => {
//   const options = {
//     title: "Save File Organization",
//     filters: [{ name: "JSON", extensions: ["json"] }],
//   };
//   diawindow.log.showSaveDialog(null, options, (filename) => {
//     event.sender.send("selected-saveorganizationfile", filename);
//   });
// });

const handleFileImport = (containerID, filePath) => {
  if (containerID === "guided-container-subjects-pools-samples-structure-import") {
    // read the contents of the first worksheet in the excel file at the path using excelToJson
    const excelFile = excelToJson({
      sourceFile: filePath,
    });
    // log the columnn headers of the first sheet
  }
};
const fileNamesWithExtensions = {
  subjects_pools_samples_structure: ["xlsx"],
};

document.querySelectorAll(".file-import-container").forEach((fileImportContainer) => {
  const fileImportContainerId = fileImportContainer.id;
  const fileName = fileImportContainer.dataset.fileName;
  fileImportContainer.addEventListener("dragover", (ev) => {
    ev.preventDefault();
  });
  fileImportContainer.addEventListener("drop", (ev) => {
    ev.preventDefault();
    const droppedFilePath = ev.dataTransfer.files[0].path;
    const dropedFileName = path.basename(droppedFilePath).split(".")[0];
    const droppedFileExtension = path.extname(droppedFilePath).slice(1);
    // Throw an error if the dropped file is not the expected file
    if (fileName !== dropedFileName) {
      notyf.open({
        duration: "4000",
        type: "error",
        message: `Please drop the ${fileName} file`,
      });
      return;
    }
    //Throw an error if the dropped file does not have an expected extension
    if (!fileNamesWithExtensions[dropedFileName].includes(droppedFileExtension)) {
      notyf.open({
        duration: "4000",
        type: "error",
        message: `File extension must be ${fileNamesWithExtensions[dropedFileName].join(", ")}`,
      });
      return;
    }

    // File name and extension has been validated, not handle the file import
    handleFileImport(fileImportContainerId, droppedFilePath);
  });
});

// displays the user selected banner image using Jimp in the edit banner image modal
//path: array
//curationMode: string (guided-moded) (freeform)
window.handleSelectedBannerImage = async (path, curationMode) => {
  let imgContainer = "";
  let imgHolder = "";
  let paraImagePath = "";
  let viewImportedImage = "";
  let saveBannerImage = "";
  let cropperOptions = "";
  if (curationMode === "guided-mode") {
    imgHolder = document.getElementById("guided-div-img-container-holder");
    imgContainer = document.getElementById("guided-div-img-container");
    viewImportedImage = window.guidedBfViewImportedImage;
    paraImagePath = "#guided-para-path-image";
    saveBannerImage = "#guided-save-banner-image";
    cropperOptions = window.guidedCropOptions;
  }
  if (curationMode === "freeform") {
    cropperOptions = window.cropOptions;
    paraImagePath = "#para-path-image";
    saveBannerImage = "#save-banner-image";
    viewImportedImage = window.bfViewImportedImage;
    imgHolder = document.getElementById("div-img-container-holder");
    imgContainer = document.getElementById("div-img-container");
  }

  if (path.length > 0) {
    let original_image_path = path[0];
    let image_path = original_image_path;
    let destination_image_path = window.path.join(
      window.homeDirectory,
      "SODA",
      "banner-image-conversion"
    );
    let converted_image_file = window.path.join(destination_image_path, "converted-tiff.jpg");
    let conversion_success = true;
    window.imageExtension = path[0].split(".").pop();

    if (window.imageExtension.toLowerCase() == "tiff") {
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

      await window.Jimp.read(original_image_path)
        .then(async (file) => {
          if (!window.fs.existsSync(destination_image_path)) {
            window.fs.mkdirSync(destination_image_path, { recursive: true });
          }

          try {
            if (window.fs.existsSync(converted_image_file)) {
              window.fs.unlinkSync(converted_image_file);
            }
          } catch (err) {
            conversion_success = false;
            console.error(err);
          }

          return file.write(converted_image_file, async () => {
            if (window.fs.existsSync(converted_image_file)) {
              let stats = window.fs.statSync(converted_image_file);
              let fileSizeInBytes = stats.size;
              let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

              if (fileSizeInMegabytes > 5) {
                window.fs.unlinkSync(converted_image_file);

                await window.Jimp.read(original_image_path)
                  .then((file) => {
                    return file.resize(1024, 1024).write(converted_image_file, () => {
                      imgHolder.style.display = "none";
                      imgContainer.style.display = "block";

                      $(paraImagePath).html(image_path);
                      viewImportedImage.src = converted_image_file;
                      window.myCropper.destroy();
                      window.myCropper = new Cropper(viewImportedImage, cropperOptions);
                      $(saveBannerImage).css("visibility", "visible");
                      $("body").removeClass("waiting");
                    });
                  })
                  .catch((err) => {
                    conversion_success = false;
                    console.error(err);
                  });
                if (window.fs.existsSync(converted_image_file)) {
                  let stats = window.fs.statSync(converted_image_file);
                  let fileSizeInBytes = stats.size;
                  let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                  if (fileSizeInMegabytes > 5) {
                    conversion_success = false;
                    // SHOW ERROR
                  }
                }
              }
              image_path = converted_image_file;
              window.imageExtension = "jpg";
              $(paraImagePath).html(image_path);
              viewImportedImage.src = image_path;
              window.myCropper.destroy();
              window.myCropper = new Cropper(viewImportedImage, cropperOptions);

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
      // console.log("Image path being passed into cropper")
      // prepend the file protocol to the image_path
      // TODO: Only do on dev serevrs?
      image_path = "file://" + image_path;
      viewImportedImage.src = image_path;
      window.myCropper.destroy();
      window.myCropper = new Cropper(viewImportedImage, cropperOptions);
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
      $(window.menuFolder)
        .children("#reg-folder-delete")
        .html("<i class='fas fa-undo-alt'></i> Restore");
      $(window.menuFolder).children("#reg-folder-rename").hide();
      $(window.menuFolder).children("#folder-move").hide();
      $(window.menuFolder).children("#folder-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(window.menuFolder)
          .children("#reg-folder-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(window.menuFolder)
          .children("#folder-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(window.menuFolder).children("#reg-folder-rename").hide();
        $(window.menuFolder).children("#folder-description").hide();
      } else {
        $(window.menuFolder)
          .children("#reg-folder-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(window.menuFolder)
          .children("#folder-move")
          .html('<i class="fas fa-external-link-alt"></i> Move');
        $(window.menuFolder).children("#folder-move").show();
        $(window.menuFolder).children("#reg-folder-rename").show();
        $(window.menuFolder).children("#folder-description").show();
      }
    }
    // This is where regular folders context menu will appear
    window.menuFolder.style.display = "block";
    if (guidedModeFileExporer) {
      // $(".menu.reg-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
    }
    $(".menu.reg-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  } else if (category === "high-level-folder") {
    if (deleted) {
      $(window.menuHighLevelFolders)
        .children("#high-folder-delete")
        .html("<i class='fas fa-undo-alt'></i> Restore");
      $(window.menuHighLevelFolders).children("#high-folder-rename").hide();
      $(window.menuHighLevelFolders).children("#folder-move").hide();
      $(window.menuHighLevelFolders).children("#tooltip-folders").show();
    } else {
      if ($(".selected-item").length > 2) {
        $(window.menuHighLevelFolders)
          .children("#high-folder-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(window.menuHighLevelFolders).children("#high-folder-delete").show();
        $(window.menuHighLevelFolders).children("#high-folder-rename").hide();
        $(window.menuHighLevelFolders).children("#folder-move").hide();
        $(window.menuHighLevelFolders).children("#tooltip-folders").show();
      } else {
        $(window.menuHighLevelFolders)
          .children("#high-folder-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(window.menuHighLevelFolders).children("#high-folder-delete").show();
        $(window.menuHighLevelFolders).children("#high-folder-rename").hide();
        $(window.menuHighLevelFolders).children("#folder-move").hide();
        $(window.menuHighLevelFolders).children("#tooltip-folders").show();
      }
    }
    window.menuHighLevelFolders.style.display = "block";
    if (guidedModeFileExporer) {
      // $(".menu.high-level-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
    }
    $(".menu.high-level-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  } else {
    if (deleted) {
      $(window.menuFile).children("#file-delete").html("<i class='fas fa-undo-alt'></i> Restore");
      $(window.menuFile).children("#file-rename").hide();
      $(window.menuFile).children("#file-move").hide();
      $(window.menuFile).children("#file-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(window.menuFile)
          .children("#file-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(window.menuFile)
          .children("#file-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(window.menuFile).children("#file-rename").hide();
        $(window.menuFile).children("#file-description").hide();
      } else {
        $(window.menuFile)
          .children("#file-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(window.menuFile)
          .children("#file-move")
          .html('<i class="fas fa-external-link-alt"></i> Move');
        $(window.menuFile).children("#file-rename").show();
        $(window.menuFile).children("#file-move").show();
        $(window.menuFile).children("#file-description").show();
      }
    }

    // This is where the context menu for regular files will be displayed
    window.menuFile.style.display = "block";
    $(".menu.file").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  }
};

/// options for regular sub-folders
window.folderContextMenu = (event) => {
  $(".menu.reg-folder li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "reg-folder-rename") {
        var itemDivElements = document.getElementById("items").children;
        window.renameFolder(
          event,
          window.organizeDSglobalPath,
          itemDivElements,
          window.datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "reg-folder-delete") {
        window.delFolder(
          event,
          window.organizeDSglobalPath,
          "#items",
          ".single-item",
          window.datasetStructureJSONObj
        );
      } else if ($(this).attr("id") === "folder-move") {
        window.moveItems(event, "folders");
      }
      // Hide it AFTER the action was triggered
      window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
      window.hideMenu(
        "high-level-folder",
        window.menuFolder,
        window.menuHighLevelFolders,
        window.menuFile
      );
      window.hideFullName();
    });

  /// options for high-level folders
  $(".menu.high-level-folder li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "high-folder-rename") {
        var itemDivElements = document.getElementById("items").children;
        window.renameFolder(
          event,
          window.organizeDSglobalPath,
          itemDivElements,
          window.datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "high-folder-delete") {
        window.delFolder(
          event,
          window.organizeDSglobalPath,
          "#items",
          ".single-item",
          window.datasetStructureJSONObj
        );
      } else if ($(this).attr("id") === "tooltip-folders") {
        showTooltips(event);
      }
      // Hide it AFTER the action was triggered
      window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
      window.hideMenu(
        "high-level-folder",
        window.menuFolder,
        window.menuHighLevelFolders,
        window.menuFile
      );
      window.hideFullName();
    });
  /// hide both menus after an option is clicked
  window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
  window.hideMenu(
    "high-level-folder",
    window.menuFolder,
    window.menuHighLevelFolders,
    window.menuFile
  );
  window.hideFullName();
};

//////// options for files
window.fileContextMenu = (event) => {
  try {
    if ($(".div-display-details.file").hasClass("show")) {
      $(".div-display-details.file").removeClass("show");
    }
    $(".menu.file li")
      .unbind()
      .click(function () {
        if ($(this).attr("id") === "file-rename") {
          var itemDivElements = document.getElementById("items").children;
          window.renameFolder(
            event,
            window.organizeDSglobalPath,
            itemDivElements,
            window.datasetStructureJSONObj,
            "#items",
            ".single-item"
          );
        } else if ($(this).attr("id") === "file-delete") {
          window.delFolder(
            event,
            window.organizeDSglobalPath,
            "#items",
            ".single-item",
            window.datasetStructureJSONObj
          );
        } else if ($(this).attr("id") === "file-move") {
          window.moveItems(event, "files");
        } else if ($(this).attr("id") === "file-description") {
          manageDesc(event);
        }
        // Hide it AFTER the action was triggered
        window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
      });
    window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
  } catch (e) {
    console.log(e);
  }
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
  if (window.highLevelFolders.includes(folderName)) {
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
      window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
    } else {
      if (event.target.classList.contains("deleted_folder")) {
        showmenu(event, "folder", true);
      } else {
        showmenu(event, "folder");
      }
      window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
    }
  } else if (event.target.classList[0] === "myFile") {
    if (event.target.classList.contains("deleted_file")) {
      showmenu(event, "file", true);
    } else {
      showmenu(event, "file");
    }
    window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
    window.hideMenu(
      "high-level-folder",
      window.menuFolder,
      window.menuHighLevelFolders,
      window.menuFile
    );
    // otherwise, do not show any menu
  } else {
    window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
    window.hideMenu(
      "high-level-folder",
      window.menuFolder,
      window.menuHighLevelFolders,
      window.menuFile
    );
    window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
    // hideFullPath()
    window.hideFullName();
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
  // If there is weird right click menu behaviour, check the window.hideMenu block
  window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
  window.hideMenu(
    "high-level-folder",
    window.menuFolder,
    window.menuHighLevelFolders,
    window.menuFile
  );
  window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
  // hideFullPath()
  window.hideFullName();

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
window.sortObjByKeys = (object) => {
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

window.listItems = async (jsonObj, uiItem, amount_req, reset) => {
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

  if (window.organizeDSglobalPath.id === "guided-input-global-path") {
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

    let currentPageID = window.CURRENT_PAGE.id;
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
    if (splitPath[0] === "dataset_root") splitPath.shift();
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
      if (splitPath[i] === "dataset_root" || splitPath[i] === undefined) continue;
      trimmedPath += splitPath[i] + "/";
    }

    //append path to tippy and display path to the file explorer
    pathDisplay.innerText = trimmedPath;
    pathDisplay._tippy.setContent(fullPath);
  }

  var appendString = "";
  var sortedObj = window.sortObjByKeys(jsonObj);
  let file_elements = [],
    folder_elements = [];
  let count = 0;
  let cloud_item = "";
  let deleted_folder = false;
  let deleted_file = false;

  //start creating folder elements to be rendered
  if (Object.keys(sortedObj["folders"]).length > 0) {
    for (var item in sortedObj["folders"]) {
      //hide samples when on the subjects page
      if (hideSampleFolders) {
        let currentSampleFolder = splitPath[0];
        let allSamples = window.sodaJSONObj.getAllSamplesFromSubjects();
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
        let currentSubjects = window.sodaJSONObj.getAllSubjects();
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
      if (!window.highLevelFolders.includes(item)) {
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
          '<div class="single-item updated-file" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 oncontextmenu="window.folderContextMenu(this)" class="myFol' +
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
          '<div class="single-item" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 oncontextmenu="window.folderContextMenu(this)" class="myFol' +
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
          var extension = window.path.extname(sortedObj["files"][item]["path"]).slice(1);
        } else {
          var extension = "other";
        }
        if (sortedObj["files"][item]["type"] == "bf") {
          if (sortedObj["files"][item]["action"].includes("deleted")) {
            let original_file_name = item.substring(0, item.lastIndexOf("-"));
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
          '<div class="single-item" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="window.fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
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
          '<div class="single-item updated-file" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="window.fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
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
          '<div class="single-item" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="window.fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
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
        await window.add_items_to_view(items, amount_req, reset);
        resolved();
      } else {
        await window.add_items_to_view(items, amount_req);
        resolved();
      }
    });
  } else {
    //load everything in place
    let itemDisplay = new Promise(async (resolved) => {
      // $(uiItem).empty();
      await window.add_items_to_view(items, 500);
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
    //Gets the name of the current folder from window.organizeDSglobalPath and instructs the user
    //on what to do in the empty folder.
    let currentFolder = "";
    let folderType;

    if (window.organizeDSglobalPath.value == undefined) {
      currentFolder = "dataset_root";
    } else {
      //Get the name of the folder the user is currently in.
      currentFolder = window.organizeDSglobalPath.value.split("/").slice(-2)[0];
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

window.getInFolder = (singleUIItem, uiItem, currentLocation, globalObj) => {
  $(singleUIItem).dblclick(async function () {
    if ($(this).children("h1").hasClass("myFol")) {
      window.start = 0;
      window.listed_count = 0;
      window.amount = 0;
      var folderName = this.innerText;
      currentLocation.value = currentLocation.value + folderName + "/";

      var currentPath = currentLocation.value;
      var jsonPathArray = currentPath.split("/");
      var filtered = jsonPathArray.slice(1).filter(function (el) {
        return el.trim() != "";
      });
      var myPath = window.getRecursivePath(filtered, globalObj);
      if (myPath.length === 2) {
        filtered = myPath[1];
        currentLocation.value = "dataset_root/" + filtered.join("/") + "/";
      }
      $("#items").empty();
      window.already_created_elem = [];
      // let items = window.loadFileFolder(myPath);
      //we have some items to display
      window.listItems(myPath, "#items", 500, true);
      window.getInFolder(
        ".single-item",
        "#items",
        window.organizeDSglobalPath,
        window.datasetStructureJSONObj
      );
      window.organizeLandingUIEffect();
      // reconstruct folders and files (child elements after emptying the Div)
      // window.getInFolder(singleUIItem, uiItem, currentLocation, globalObj);
    }
  });
};

// const sliceStringByValue = (string, endingValue) => {
//   var newString = string.slice(string.indexOf(endingValue) + 1);
//   return newString;
// };

var fileNameForEdit;
///// Option to manage description for files
const manageDesc = (ev) => {
  var fileName = ev.parentElement.innerText;
  /// get current location of files in JSON object
  var filtered = window.getGlobalPath(window.organizeDSglobalPath);
  var myPath = window.getRecursivePath(filtered.slice(1), window.datasetStructureJSONObj);
  //// load existing metadata/description
  window.loadDetailsContextMenu(
    fileName,
    myPath,
    "textarea-file-description",
    "textarea-file-metadata",
    "para-local-path-file"
  );
  $("#button-confirm-display-details-file").html("Confirm");
  showDetailsFile();
  window.hideMenu("folder", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
  window.hideMenu(
    "high-level-folder",
    window.menuFolder,
    window.menuHighLevelFolders,
    window.menuFile
  );
  fileNameForEdit = fileName;
};

const updateFileDetails = (ev) => {
  var fileName = fileNameForEdit;
  var filtered = window.getGlobalPath(window.organizeDSglobalPath);
  var myPath = window.getRecursivePath(filtered.slice(1), window.datasetStructureJSONObj);
  triggerManageDetailsPrompts(
    ev,
    fileName,
    myPath,
    "textarea-file-description",
    "textarea-file-metadata"
  );
  /// list Items again with new updated JSON structure
  window.listItems(myPath, "#items");
  window.getInFolder(
    ".single-item",
    "#items",
    window.organizeDSglobalPath,
    window.datasetStructureJSONObj
  );
  // find checkboxes here and uncheck them
  for (var ele of $($(ev).siblings().find("input:checkbox"))) {
    document.getElementById(ele.id).checked = false;
  }
  // close the display
  showDetailsFile();
};

window.addDetailsForFile = (ev) => {
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
      reverseButtons: window.reverseSwalButtons,
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
    if (window.check_forbidden_characters_ps(newName)) {
      document.getElementById("div-confirm-inputNewNameDataset").style.display = "none";
      $("#btn-confirm-new-dataset-name").hide();
      document.getElementById("para-new-name-dataset-message").innerHTML =

        "Error: A Pennsieve dataset name cannot contain any of the following characters: \\/:*?'<>.,";

      // $("#nextBtn").prop("disabled", true)
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
    window.electron.ipcRenderer.send("open-file-dialog-local-destination-curate");
  });

// TODO: Possibly no longer needed after org dataset rework
// Local dataset selected response
// window.electron.ipcRenderer.on(
//   "selected-local-destination-datasetCurate",
//   async (event, filepath) => {
//     let numb = document.getElementById("local_dataset_number");
//     let progressBar_rightSide = document.getElementById("left-side_less_than_50");
//     let progressBar_leftSide = document.getElementById("right-side_greater_than_50");
//     //create setInterval variable that will keep track of the iterated items
//     let local_progress;

//     // Function to get the progress of the local dataset every 500ms
//     const progressReport = async () => {
//       try {
//         let monitorProgressResponse = await client.get(
//           `/organize_datasets/datasets/import/progress`
//         );

//         let { data } = monitorProgressResponse;
//         let percentage_amount = data["progress_percentage"].toFixed(2);
//         let finished = data["create_soda_json_completed"];

//         numb.innerText = percentage_amount + "%";
//         if (percentage_amount <= 50) {
//           progressBar_rightSide.style.transform = `rotate(${percentage_amount * 0.01 * 360}deg)`;
//         } else {
//           progressBar_rightSide.style.transition = "";
//           progressBar_rightSide.classList.add("notransition");
//           progressBar_rightSide.style.transform = `rotate(180deg)`;
//           progressBar_leftSide.style.transform = `rotate(${percentage_amount * 0.01 * 180}deg)`;
//         }

//         if (finished === 1) {
//           progressBar_leftSide.style.transform = `rotate(180deg)`;
//           numb.innerText = "100%";
//           clearInterval(local_progress);
//           progressBar_rightSide.classList.remove("notransition");
//           window.populate_existing_folders(window.datasetStructureJSONObj);
//           window.populate_existing_metadata(window.sodaJSONObj);
//           $("#para-continue-location-dataset-getting-started").text("Please continue below.");
//           $("#nextBtn").prop("disabled", false);
//           // log the success to analytics
//           window.logMetadataForAnalytics(
//             "Success",
//             window.PrepareDatasetsAnalyticsPrefix.CURATE,
//             window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
//             window.Actions.EXISTING,
//             Destinations.LOCAL
//           );
//           setTimeout(() => {
//             document.getElementById("loading_local_dataset").style.display = "none";
//           }, 1000);
//         }
//       } catch (error) {
//         clientError(error);
//         clearInterval(local_progress);
//       }
//     };

//     // Function begins here
//     if (filepath.length > 0) {
//       if (filepath != null) {
//         window.sodaJSONObj["starting-point"]["local-path"] = "";
//         document.getElementById("input-destination-getting-started-locally").placeholder =
//           filepath[0];
//         if (
//           window.sodaJSONObj["starting-point"]["type"] === "local" &&
//           window.sodaJSONObj["starting-point"]["local-path"] == ""
//         ) {
//           let valid_dataset = window.verify_sparc_folder(
//             document.getElementById("input-destination-getting-started-locally").placeholder,
//             "local"
//           );
//           if (valid_dataset == true) {
//             // Reset variables
//             window.irregularFolderArray = [];
//             let replaced = {};

//             window.detectIrregularFolders(window.path.basename(filepath[0]), filepath[0]);

//             var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${window.nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
//             if (window.irregularFolderArray.length > 0) {
//               Swal.fire({
//                 title:
//                   "The following folders contain non-allowed characters in their names. How should we handle them?",
//                 html:
//                   "<div style='max-height:300px; overflow-y:auto'>" +
//                   window.irregularFolderArray.join("</br>") +
//                   "</div>",
//                 heightAuto: false,
//                 backdrop: "rgba(0,0,0, 0.4)",
//                 showDenyButton: true,
//                 showCancelButton: true,
//                 confirmButtonText: "Replace characters with (-)",
//                 denyButtonText: "Remove characters",
//                 cancelButtonText: "Cancel",
//                 didOpen: () => {
//                   $(".swal-popover").popover();
//                 },
//                 footer: footer,
//               }).then(async (result) => {
//                 /* Read more about isConfirmed, isDenied below */
//                 if (result.isConfirmed) {
//                   action = "replace";
//                   if (window.irregularFolderArray.length > 0) {
//                     for (let i = 0; i < window.irregularFolderArray.length; i++) {
//                       renamedFolderName = window.replaceIrregularFolders(
//                         window.irregularFolderArray[i]
//                       );
//                       replaced[window.path.basename(window.irregularFolderArray[i])] =
//                         renamedFolderName;
//                     }
//                   }
//                 } else if (result.isDenied) {
//                   action = "remove";
//                   if (window.irregularFolderArray.length > 0) {
//                     for (let i = 0; i < window.irregularFolderArray.length; i++) {
//                       renamedFolderName = window.removeIrregularFolders(
//                         window.irregularFolderArray[i]
//                       );
//                       replaced[window.irregularFolderArray[i]] = renamedFolderName;
//                     }
//                   }
//                 } else {
//                   document.getElementById("input-destination-getting-started-locally").placeholder =
//                     "Browse here";
//                   window.sodaJSONObj["starting-point"]["local-path"] = "";
//                   $("#para-continue-location-dataset-getting-started").text("");
//                   return;
//                 }

//                 //Reset the progress bar
//                 progressBar_rightSide.style.transform = `rotate(0deg)`;
//                 progressBar_leftSide.style.transform = `rotate(0deg)`;
//                 numb.innerText = "0%";

//                 // Show the progress bar
//                 document.getElementById("loading_local_dataset").style.display = "block";

//                 // Show file path to user in the input box
//                 window.sodaJSONObj["starting-point"]["local-path"] = filepath[0];
//                 let root_folder_path = $("#input-destination-getting-started-locally").attr(
//                   "placeholder"
//                 );

//                 //create setInterval variable that will keep track of the iterated items
//                 local_progress = setInterval(progressReport, 500);

//                 try {
//                   let importLocalDatasetResponse = await client.post(
//                     `/organize_datasets/datasets/import`,
//                     {
//                       sodajsonobject: window.sodaJSONObj,
//                       root_folder_path: root_folder_path,
//                       irregular_folders: window.irregularFolderArray,
//                       replaced: replaced,
//                     },
//                     { timeout: 0 }
//                   );
//                   let { data } = importLocalDatasetResponse;
//                   window.sodaJSONObj = data;
//                   window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
//                 } catch (error) {
//                   clientError(error);
//                   clearInterval(local_progress);
//                 }
//               });
//             } else {
//               // Reset the progress bar
//               progressBar_leftSide.style.transform = `rotate(0deg)`;
//               progressBar_rightSide.style.transform = `rotate(0deg)`;
//               numb.innerText = "0%";

//               // Show the progress bar
//               document.getElementById("loading_local_dataset").style.display = "block";

//               // Show file path to user in the input box
//               window.sodaJSONObj["starting-point"]["local-path"] = filepath[0];
//               let root_folder_path = $("#input-destination-getting-started-locally").attr(
//                 "placeholder"
//               );

//               //create setInterval variable that will keep track of the iterated items
//               local_progress = setInterval(progressReport, 500);

//               try {
//                 let importLocalDatasetResponse = await client.post(
//                   `/organize_datasets/datasets/import`,
//                   {
//                     sodajsonobject: window.sodaJSONObj,
//                     root_folder_path: root_folder_path,
//                     irregular_folders: window.irregularFolderArray,
//                     replaced: replaced,
//                   },
//                   { timeout: 0 }
//                 );
//                 let { data } = importLocalDatasetResponse;
//                 window.sodaJSONObj = data;
//                 window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
//               } catch (error) {
//                 clientError(error);
//                 clearInterval(local_progress);
//               }
//             }
//           } else {
//             // Invalid dataset due to non-SPARC folder structure
//             Swal.fire({
//               icon: "warning",
//               html: `This folder seem to have non-SPARC folders. Please select a folder that has a valid SPARC dataset structure.
//               <br/>
//               See the "Data Organization" section of the SPARC documentation for more
//               <a target="_blank" href="https://sparc.science/help/3FXikFXC8shPRd8xZqhjVT#top"> details</a>`,
//               heightAuto: false,
//               backdrop: "rgba(0,0,0, 0.4)",
//               showConfirmButton: false,
//               showCancelButton: true,
//               focusCancel: true,
//               cancelButtonText: "Okay",
//               reverseButtons: window.reverseSwalButtons,
//               showClass: {
//                 popup: "animate__animated animate__zoomIn animate__faster",
//               },
//               hideClass: {
//                 popup: "animate__animated animate__zoomOut animate__faster",
//               },
//             }).then((result) => {
//               if (result.isConfirmed) {
//               } else {
//                 document.getElementById("input-destination-getting-started-locally").placeholder =
//                   "Browse here";
//                 window.sodaJSONObj["starting-point"]["local-path"] = "";
//                 $("#para-continue-location-dataset-getting-started").text("");
//               }
//             });

//             // log the failure to select an appropriate folder to analytics
//             window.logMetadataForAnalytics(
//               "Error",
//               window.PrepareDatasetsAnalyticsPrefix.CURATE,
//               window.AnalyticsGranularity.ALL_LEVELS,
//               window.Actions.EXISTING,
//               Destinations.LOCAL
//             );
//           }
//         }
//       }
//     } else {
//       document.getElementById("nextBtn").disabled = true;
//       $("#para-continue-location-dataset-getting-started").text("");
//     }
//   }
// );

window.electron.ipcRenderer.on(
  "guided-selected-local-destination-datasetCurate",
  (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        window.sodaJSONObj["starting-point"]["local-path"] = "";
        window.sodaJSONObj["starting-point"]["type"] = "local";

        $("#guided-input-destination-getting-started-locally").val(filepath[0]);
        $(".guidedDatasetPath").text(filepath[0]);

        let valid_dataset = window.verify_sparc_folder(filepath[0]);
        if (valid_dataset == true) {
          var action = "";
          window.irregularFolderArray = [];
          window.detectIrregularFolders(window.path.basename(filepath[0]), filepath[0]);
          var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${window.nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
          if (window.irregularFolderArray.length > 0) {
            Swal.fire({
              title:
                "The following folders contain non-allowed characters in their names. How should we handle them?",
              html:
                "<div style='max-height:300px; overflow-y:auto'>" +
                window.irregularFolderArray.join("</br>") +
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
                window.sodaJSONObj["starting-point"]["local-path"] = "";
                $("#para-continue-location-dataset-getting-started").text("");
                return;
              }
              window.sodaJSONObj["starting-point"]["local-path"] = filepath[0];

              let root_folder_path = $("#guided-input-destination-getting-started-locally").val();

              window.create_json_object(action, window.sodaJSONObj, root_folder_path);
              window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
              window.populate_existing_folders(window.datasetStructureJSONObj);
              window.populate_existing_metadata(window.sodaJSONObj);
              enableProgressButton();
            });
          } else {
            action = "";
            let root_folder_path = $("#guided-input-destination-getting-started-locally").val();
            window.sodaJSONObj["starting-point"]["local-path"] = filepath[0];
            window.create_json_object(action, window.sodaJSONObj, root_folder_path);
            window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
            window.populate_existing_folders(window.datasetStructureJSONObj);
            window.populate_existing_metadata(window.sodaJSONObj);
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
            reverseButtons: window.reverseSwalButtons,
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
              window.sodaJSONObj["starting-point"]["local-path"] = "";
            }
          });
        }
      }
    } else {
    }
  }
);

//// Select to choose a local dataset (generate dataset)
// document
//   .getElementById("input-destination-generate-dataset-locally")
//   .addEventListener("click", function () {
//     $("#Question-generate-dataset-locally-destination").nextAll().removeClass("show");
//     $("#Question-generate-dataset-locally-destination").nextAll().removeClass("test2");
//     $("#Question-generate-dataset-locally-destination").nextAll().removeClass("prev");
//     document.getElementById("nextBtn").disabled = true;
//     window.electron.ipcRenderer.send("open-file-dialog-local-destination-curate-generate");
//   });

window.electron.ipcRenderer.on(
  "selected-local-destination-datasetCurate-generate",
  (event, filepath) => {
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
  }
);


document.getElementById("button-generate-validate").addEventListener("click", function () {
  // setTimeout(function () {
  //   document.getElementById("generate-dataset-progress-tab").style.display = "none";
  //   document.getElementById("div-vertical-progress-bar").style.display = "flex";
  //   document.getElementById("prevBtn").style.display = "inline";
  //   document.getElementById("nextBtn").style.display = "inline";
  //   document.getElementById("start-over-btn").style.display = "inline-block";
  //   window.showParentTab(window.currentTab, 1);
  //   if (
  //     window.sodaJSONObj["starting-point"]["type"] == "new" &&
  //     "local-path" in window.sodaJSONObj["starting-point"]
  //   ) {
  //     window.sodaJSONObj["starting-point"]["type"] = "local";
  //   }
  // }, window.delayAnimation);
});


// function to hide the sidebar and disable the sidebar expand button
// function forceActionSidebar(action) {
//   if (action === "show") {
//     $("#sidebarCollapse").removeClass("active");
//     $("#main-nav").removeClass("active");
//   } else {
//     $("#sidebarCollapse").addClass("active");
//     $("#main-nav").addClass("active");
//     // $("#sidebarCollapse").prop("disabled", false);
//   }
// }

// /// MAIN CURATE NEW ///

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

  window.log.info("Continue with curate");
  let errorMessage = "";
  let error_files = data["empty_files"];
  //bring duplicate outside
  let error_folders = data["empty_folders"];

  if (error_files.length > 0) {
    const errorFilesHtml = generateHtmlListFromArray(error_files);
    errorMessage += errorFilesHtml;
  }

  if (error_folders.length > 0) {
    const errorFoldersHtml = generateHtmlListFromArray(error_folders);
    errorMessage += errorFoldersHtml;
  }

  return errorMessage;
};

window.setSodaJSONStartingPoint = (sodaJSONObj) => {
  if (window.sodaJSONObj["starting-point"]["type"] === "local") {
    window.sodaJSONObj["starting-point"]["type"] = "new";
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

const preGenerateSetup = async (e, elementContext) => {
  $($($(elementContext).parent()[0]).parents()[0]).removeClass("tab-active");
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("prevBtn").style.display = "none";
  document.getElementById("start-over-btn").style.display = "none";
  document.getElementById("div-vertical-progress-bar").style.display = "none";
  document.getElementById("div-generate-comeback").style.display = "none";
  document.getElementById("wrapper-wrap").style.display = "none";
  document.getElementById("generate-dataset-progress-tab").style.display = "flex";
  $("#sidebarCollapse").prop("disabled", false);

  // updateJSON structure after Generate dataset tab
  window.updateJSONStructureGenerate(false, sodaJSONObj);

  window.setSodaJSONStartingPoint(sodaJSONObj);

  let [dataset_name, dataset_destination] = setDatasetNameAndDestination(sodaJSONObj);

  let resume = e.target.textContent.trim() == "Retry";
  if (!resume) {
    progressStatus.innerHTML = "Please wait while we verify a few things...";
    generateProgressBar.value = 0;
  } else {
    // NOTE: This only works if we got to the upload. SO add more code to check for this.
    progressStatus.innerHTML = `Please wait while we perform setup for retrying the upload...`;
    // replace the first line with the following
  }
  document.getElementById("wrapper-wrap").style.display = "none";

  if (dataset_destination == "Pennsieve") {
    setTimeout(() => {
      document.getElementById("wrapper-wrap").style.display = "none";
    }, 500);
    let supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      $("#sidebarCollapse").prop("disabled", false);

      // return to the prior page
      $($($(this).parent()[0]).parents()[0]).addClass("tab-active");
      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
      document.getElementById("para-please-wait-new-curate").innerHTML = "";
      document.getElementById("prevBtn").style.display = "inline";
      document.getElementById("start-over-btn").style.display = "inline-block";
      document.getElementById("div-vertical-progress-bar").style.display = "flex";
      document.getElementById("div-generate-comeback").style.display = "flex";
      document.getElementById("generate-dataset-progress-tab").style.display = "none";
      return;
    }
  }

  // from here you can modify

  if (!resume) {
    progressBarNewCurate.value = 0;
    progressStatus.innerHTML = "";
    document.getElementById("div-new-curate-progress").style.display = "none";
    progressStatus.innerHTML = "Please wait...";
  }

  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";

  deleteTreeviewFiles(sodaJSONObj);

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
      reverseButtons: window.reverseSwalButtons,
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      didOpen: () => {
        document.getElementById("swal2-html-container").style.maxHeight = "19rem";
        document.getElementById("swal2-html-container").style.overflowY = "auto";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        initiate_generate(e);
      } else {
        $("#sidebarCollapse").prop("disabled", false);
        document.getElementById("para-please-wait-new-curate").innerHTML = "Return to make changes";
        document.getElementById("div-generate-comeback").style.display = "flex";
      }
    });
  } else {
    initiate_generate(e);
  }
};

document.getElementById("button-generate").addEventListener("click", async function (e) {
  preGenerateSetup(e, this);
});

document.getElementById("button-retry").addEventListener("click", async function (e) {
  preGenerateSetup(e, this);
});

window.delete_imported_manifest = () => {
  for (let highLevelFol in window.sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in window.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]
    ) {
      delete window.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
};

window.dismissStatus = (id) => {
  document.getElementById(id).style = "display: none;";
  //document.getElementById("dismiss-status-bar").style = "display: none;";
};

let file_counter = 0;
let folder_counter = 0;
window.uploadComplete = new Notyf({
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
const initiate_generate = async (e) => {
  let resume = e.target.textContent.trim() == "Retry";

  // Disable the Guided Mode sidebar button to prevent the sodaJSONObj from being modified
  document.getElementById("guided_mode_view").style.pointerEvents = "none";

  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  // get the amount of files
  if (!resume) {
    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "Preparing files ...";
    progressStatus.innerHTML = "Preparing files ...";
    document.getElementById("para-please-wait-new-curate").innerHTML = "";
    document.getElementById("div-new-curate-progress").style.display = "block";
  }

  document.getElementById("div-generate-comeback").style.display = "none";
  document.getElementById("wrapper-wrap").style.display = "none";

  // Create the progress bar clone for the navigation bar
  let organizeDataset = document.getElementById("organize_dataset_btn");
  let curateAndShareNavButton = document.getElementById("guided_mode_view");
  let documentationNavButton = document.getElementById("documentation-view");
  let contactNavButton = document.getElementById("contact-us-view");
  let uploadLocally = document.getElementById("upload_local_dataset_btn");
  let guidedModeHomePageButton = document.getElementById("button-homepage-guided-mode");
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
  guidedModeHomePageButton.disabled = true;

  // Add disabled appearance to the buttons
  guidedModeHomePageButton.className = "button-prompt-container curate-disabled-button";
  organizeDataset.className = "disabled-content-button";
  uploadLocally.className = "disabled-content-button";
  organizeDataset.style = "background-color: #f6f6f6;  border: #fff;";
  uploadLocally.style = "background-color: #f6f6f6; border: #fff;";

  returnButton.type = "button";
  returnButton.id = "returnButton";
  returnButton.innerHTML = "Return to progress";

  // Event handler for navigation menu's progress bar clone
  returnButton.onclick = function () {
    organizeDataset.disabled = false;
    contactNavButton.classList.remove("is-selected");
    documentationNavButton.classList.remove("is-selected");
    curateAndShareNavButton.classList.add("is-selected");
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

  let sparc_container = document.getElementById("sparc-logo-container");
  sparc_container.style.display = "none";
  navContainer.appendChild(statusBarClone);
  let navbar = document.getElementById("main-nav");
  if (navbar.classList.contains("active")) {
    document.getElementById("sidebarCollapse").click();
  }

  if ($("#generate-manifest-curate")[0].checked && !window.hasFiles) {
    window.sodaJSONObj["manifest-files"]["auto-generated"] = true;
  } else {
    delete window.sodaJSONObj["manifest-files"];
  }

  if ("manifest-files" in window.sodaJSONObj) {
    if (
      "auto-generated" in window.sodaJSONObj["manifest-files"] &&
      window.sodaJSONObj["manifest-files"]["auto-generated"] === true
    ) {
      window.delete_imported_manifest();
    } else if (window.sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
      manifest_files_requested = true;
      window.delete_imported_manifest();
    }
  }

  let dataset_destination = "";
  let dataset_name = "";

  // track the amount of files that have been uploaded/generated
  let uploadedFiles = 0;
  let uploadedBytes = 0;
  let increaseInFileSize = 0;
  let generated_dataset_id = undefined;
  let loggedDatasetNameToIdMapping = false;

  // determine where the dataset will be generated/uploaded
  let nameDestinationPair = determineDatasetDestination();
  let datasetLocation = determineDatasetLocation();
  dataset_name = nameDestinationPair[0];
  dataset_destination = nameDestinationPair[1];

  if (dataset_destination == "Pennsieve" || dataset_destination == "bf") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }

  let start = performance.now();
  client
    .post(
      `/curate_datasets/curation`,
      {
        soda_json_structure: window.sodaJSONObj,
        resume,
      },
      { timeout: 0 }
    )
    .then(async (response) => {
      let end = performance.now();
      let time = (end - start) / 1000;
      let { data } = response;

      main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
      uploadedFiles = data["main_curation_uploaded_files"];

      $("#sidebarCollapse").prop("disabled", false);
      window.log.info("Completed curate function");

      // log high level confirmation that a dataset was generated - helps answer how many times were datasets generated in FFMs organize dataset functionality
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.TOTAL_UPLOADS,
        kombuchaEnums.Status.SUCCESS,
        createEventData(1, dataset_destination, datasetLocation, dataset_name)
      );

      // get the correct value for files and file size for analytics
      let fileValueToLog = 0;
      let fileSizeValueToLog = 0;
      if (dataset_destination == "bf" || dataset_destination == "Pennsieve") {
        // log the difference again to Google Analytics
        let finalFilesCount = uploadedFiles - filesOnPreviousLogPage;
        let differenceInBytes = main_total_generate_dataset_size - bytesOnPreviousLogPage;
        fileValueToLog = finalFilesCount;
        fileSizeValueToLog = differenceInBytes;
      } else {
        // when generating locally we doo not log in increments so we log the total number of files and the total size generated in one go
        fileValueToLog = uploadedFiles;
        fileSizeValueToLog = main_total_generate_dataset_size;
      }

      // log the file and file size values to analytics
      if (fileValueToLog > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.PREPARE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.SUCCESS,
          createEventData(fileValueToLog, dataset_destination, datasetLocation, dataset_name)
        );
      }

      if (fileSizeValueToLog > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.PREPARE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.SIZE,
          kombuchaEnums.Status.SUCCESS,
          createEventData(fileSizeValueToLog, dataset_destination, datasetLocation, dataset_name)
        );
      }

      // log folder and file options selected ( can be merge, skip, replace, duplicate)
      logSelectedUpdateExistingDatasetOptions(datasetLocation);

      // update dataset list; set the dataset id and int id
      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: window.defaultBfAccount,
          },
        });
        window.datasetList = [];
        window.datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
      }

      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";
    })
    .catch(async (error) => {
      clearInterval(timerProgress);

      // set the first line of progressStatus to 'Upload Failed'
      if (progressStatus.innerHTML.split("<br>").length > 1) {
        progressStatus.innerHTML = `Upload Failed<br>${progressStatus.innerHTML
          .split("<br>")
          .slice(1)
          .join("<br>")}`;
      } else {
        progressStatus.innerHTML = `Upload Failed`;
      }

      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";

      clientError(error);
      let emessage = userErrorMessage(error);

      // log high level confirmation that a dataset was generation run failed
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.TOTAL_UPLOADS,
        kombuchaEnums.Status.FAIL,
        createEventData(1, dataset_destination, datasetLocation, dataset_name)
      );

      // log the file and file size values to analytics for the amount that we managed to upload before we failed
      if (dataset_destination == "bf" || dataset_destination == "Pennsieve") {
        // log the difference again to Google Analytics
        let finalFilesCount = uploadedFiles - filesOnPreviousLogPage;
        let differenceInBytes = uploadedBytes - bytesOnPreviousLogPage;

        if (finalFilesCount > 0) {
          window.electron.ipcRenderer.send(
            "track-kombucha",
            kombuchaEnums.Category.PREPARE_DATASETS,
            kombuchaEnums.Action.GENERATE_DATASET,
            kombuchaEnums.Label.FILES,
            kombuchaEnums.Status.SUCCESS,
            createEventData(finalFilesCount, dataset_destination, datasetLocation, dataset_name)
          );
        }

        if (differenceInBytes > 0) {
          window.electron.ipcRenderer.send(
            "track-kombucha",
            kombuchaEnums.Category.PREPARE_DATASETS,
            kombuchaEnums.Action.GENERATE_DATASET,
            kombuchaEnums.Label.SIZE,
            kombuchaEnums.Status.SUCCESS,
            createEventData(differenceInBytes, dataset_destination, datasetLocation, dataset_name)
          );
        }
      }

      // log folder and file options selected ( can be merge, skip, replace, duplicate)
      logSelectedUpdateExistingDatasetOptions(datasetLocation);

      // log the amount of files, and the total size, that we failed to upload
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.FILES,
        kombuchaEnums.Status.FAIL,
        createEventData(uploadedFiles, dataset_destination, datasetLocation, dataset_name)
      );

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.SIZE,
        kombuchaEnums.Status.FAIL,
        createEventData(
          main_total_generate_dataset_size,
          dataset_destination,
          datasetLocation,
          dataset_name
        )
      );

      //Enable the buttons
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      guidedModeHomePageButton.disabled = false;
      uploadLocally.disabled = false;
      $("#sidebarCollapse").prop("disabled", false);

      //Add the original classes back to the buttons
      guidedModeHomePageButton.className = "button-prompt-container";
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";

      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
        `<span style='color: red;'>${emessage}</span>`;

      Swal.fire({
        icon: "error",
        title: "An Error Occurred While Uploading Your Dataset",
        html: "Check the error message on the progress page to learn more.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
        didOpen: () => {
          document.getElementById("swal2-html-container").style.maxHeight = "19rem";
          document.getElementById("swal2-html-container").style.overflowY = "auto";
        },
      }).then((result) => {
        statusBarClone.remove();
        sparc_container.style.display = "inline";
        if (result.isConfirmed) {
          let button = document.getElementById("button-generate");
          $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
          document.getElementById("prevBtn").style.display = "none";
          document.getElementById("start-over-btn").style.display = "none";
          document.getElementById("div-vertical-progress-bar").style.display = "none";
          document.getElementById("wrapper-wrap").style.display = "flex";
          document.getElementById("div-generate-comeback").style.display = "flex";
          document.getElementById("generate-dataset-progress-tab").style.display = "flex";
        }
      });

      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: window.defaultBfAccount,
          },
        });
        window.datasetList = [];
        window.datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
        emessage = userErrorMessage(error);
      }
    });

  // Progress tracking function for main curate
  var timerProgress = setInterval(mainProgressFunction, 1000);
  var successful = false;

  async function mainProgressFunction() {
    let mainCurationProgressResponse;
    try {
      mainCurationProgressResponse = await client.get(`/curate_datasets/curation/progress`);
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      if (progressStatus.innerHTML.split("<br>").length > 1) {
        progressStatus.innerHTML = `Upload Failed<br>${progressStatus.innerHTML
          .split("<br>")
          .slice(1)
          .join("<br>")}`;
      } else {
        progressStatus.innerHTML = `Upload Failed`;
      }

      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
        `<span style='color: red;'>${emessage}</span>`;
      window.log.error(error);

      //Enable the buttons (organize datasets, upload locally, curate existing dataset, curate new dataset)
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      guidedModeHomePageButton.disabled = false;
      uploadLocally.disabled = false;

      //Add the original classes back to the buttons
      guidedModeHomePageButton.className = "button-prompt-container";
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";

      Swal.fire({
        icon: "error",
        title: "An Error Occurred While Uploading Your Dataset",
        html: "Check the error message on the progress page to learn more.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
        didOpen: () => {
          document.getElementById("swal2-content").style.maxHeight = "19rem";
          document.getElementById("swal2-content").style.overflowY = "auto";
        },
      }).then((result) => {
        //statusBarClone.remove();
        if (result.isConfirmed) {
          let button = document.getElementById("button-generate");
          $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
          document.getElementById("prevBtn").style.display = "none";
          document.getElementById("start-over-btn").style.display = "none";
          document.getElementById("div-vertical-progress-bar").style.display = "none";
          document.getElementById("wrapper-wrap").style.display = "flex";
          document.getElementById("div-generate-comeback").style.display = "none";
          document.getElementById("generate-dataset-progress-tab").style.display = "flex";
        }
      });

      //Enable the buttons (organize datasets, upload locally, curate existing dataset, curate new dataset)
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      uploadLocally.disabled = false;
      guidedModeHomePageButton.disabled = false;

      //Add the original classes back to the buttons
      guidedModeHomePageButton.className = "button-prompt-container";
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
      if (main_total_generate_dataset_size < window.displaySIze) {
        var totalSizePrint = main_total_generate_dataset_size.toFixed(2) + " B";
      } else if (main_total_generate_dataset_size < window.displaySIze * window.displaySIze) {
        var totalSizePrint =
          (main_total_generate_dataset_size / window.displaySIze).toFixed(2) + " KB";
      } else if (
        main_total_generate_dataset_size <
        window.displaySIze * window.displaySIze * window.displaySIze
      ) {
        var totalSizePrint =
          (main_total_generate_dataset_size / window.displaySIze / window.displaySIze).toFixed(2) +
          " MB";
      } else {
        var totalSizePrint =
          (
            main_total_generate_dataset_size /
            window.displaySIze /
            window.displaySIze /
            window.displaySIze
          ).toFixed(2) + " GB";
      }

      progressStatus.innerHTML = `${main_curate_progress_message}<br>
      Elapsed time: ${elapsed_time_formatted}
      <br>Progress: ${value.toFixed(2)}% (total size: ${totalSizePrint})<br>
      Total files uploaded: ${total_files_uploaded}<br>`;

      statusText.innerHTML = `Progress: ${value.toFixed(2)}%
      <br>Elapsed time: ${elapsed_time_formatted}<br>`;

      divGenerateProgressBar.style.display = "block";

      if (main_curate_progress_message.includes("Success: COMPLETED!")) {
        clearInterval(timerProgress);
        generateProgressBar.value = 100;
        statusMeter.value = 100;
        progressStatus.innerHTML = main_curate_status + window.smileyCan;
        statusText.innerHTML = main_curate_status + window.smileyCan;
        successful = true;
      }
    } else {
      statusText.innerHTML = `${main_curate_progress_message}<br>Elapsed time: ${elapsed_time_formatted}`;
      progressStatus.innerHTML = `${main_curate_progress_message}<br>Elapsed time: ${elapsed_time_formatted}`;
    }

    if (main_curate_progress_message.includes("Preparing files to be renamed...")) {
      statusMeter.value = 0;
      generateProgressBar.value = 0;
      progressStatus.innerHTML = `Preparing files to be renamed...<br>Elapsed time: ${elapsed_time_formatted}`;
      statusText.innerHTML = `Preparing files to be renamed... <br>Elapsed time: ${elapsed_time_formatted}`;
    }

    if (main_curate_progress_message.includes("Renaming files...")) {
      statusMeter.value = value;
      generateProgressBar.value = value;
      progressStatus.innerHTML = `Renaming files...<br>
      Elapsed time: ${elapsed_time_formatted}<br>
      Progress: ${value.toFixed(2)}% 
      (${main_generated_dataset_size} of ${main_total_generate_dataset_size})`;

      statusText.innerHTML = `Renaming files...<br>Elapsed time: ${elapsed_time_formatted}<br>
      Progress: ${value.toFixed(2)}%`;
    }

    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      window.log.info("Done curate track");
      statusBarClone.remove();
      sparc_container.style.display = "inline";
      if (successful === true) {
        //Enable the buttons (organize datasets, upload locally, curate existing dataset, curate new dataset)
        organizeDataset.disabled = false;
        guidedModeHomePageButton.disabled = false;
        uploadLocally.disabled = false;

        // Add the original classes back to the buttons
        document.getElementById("wrapper-wrap").style.display = "flex";
        organizeDataset_option_buttons.style.display = "flex";
        guidedModeHomePageButton.className = "button-prompt-container";
        organizeDataset.className = "content-button is-selected";
        organizeDataset.style = "background-color: #fff";
        uploadLocally.className = "content-button is-selected";
        uploadLocally.style = "background-color: #fff";

        window.uploadComplete.open({
          type: "success",
          message: "Dataset created successfully",
        });
      } else {
        //enable buttons anyways (organize datasets, upload locally, curate existing dataset, curate new dataset)
        organizeDataset_option_buttons.style.display = "flex";
        organizeDataset.disabled = false;
        guidedModeHomePageButton.disabled = false;
        uploadLocally.disabled = false;

        // Add the original classes back to the buttons
        guidedModeHomePageButton.className = "button-prompt-container";
        organizeDataset.className = "content-button is-selected";
        organizeDataset.style = "background-color: #fff";
        uploadLocally.className = "content-button is-selected";
        uploadLocally.style = "background-color: #fff";
      }
    }

    // if a new Pennsieve dataset was generated log it once to the dataset id to name mapping
    let generated_dataset_id = data["generated_dataset_id"];
    let generated_dataset_int_id = data["generated_dataset_int_id"];
    if (
      !loggedDatasetNameToIdMapping &&
      generated_dataset_id !== null &&
      generated_dataset_id !== undefined
    ) {
      window.defaultBfDatasetId = generated_dataset_id;
      window.defaultBfDatasetIntId = generated_dataset_int_id;

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
    let nameDestinationPair = determineDatasetDestination();
    let datasetLocation = determineDatasetLocation();
    let dataset_name = nameDestinationPair[0];
    let dataset_destination = nameDestinationPair[1];
    // log every 500 files -- will log on success/failure as well so if there are less than 500 files we will log what we uploaded ( all in success case and some of them in failure case )
    if (files >= filesOnPreviousLogPage + 500) {
      filesOnPreviousLogPage += 500;
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.FILES,
        kombuchaEnums.Status.SUCCESS,
        createEventData(500, dataset_destination, datasetLocation, dataset_name)
      );

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.PrepareDatasetsAnalyticsPrefix.CURATE +
          "- Step 7 - Generate - Dataset - Number of Files",
        `${datasetUploadSession.id}`,
        500
      );

      let differenceInBytes = bytes - bytesOnPreviousLogPage;
      bytesOnPreviousLogPage = bytes;
      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.PrepareDatasetsAnalyticsPrefix.CURATE + " - Step 7 - Generate - Dataset - Size",
        `${datasetUploadSession.id}`,
        differenceInBytes
      );

      if (differenceInBytes > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.PREPARE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.SIZE,
          kombuchaEnums.Status.SUCCESS,
          createEventData(differenceInBytes, dataset_destination, datasetLocation, dataset_name)
        );
      }
    }
  };
}; // end initiate_generate

const show_curation_shortcut = async () => {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "No. I'll do it later",
    confirmButtonText: "Yes, I want to share it",
    heightAuto: false,
    icon: "success",
    allowOutsideClick: false,
    reverseButtons: window.reverseSwalButtons,
    showCancelButton: true,
    text: "Now that your dataset is uploaded, do you want to share it with the Curation Team?",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then(async (result) => {
    //window.dismissStatus("status-bar-curate-progress");
    window.uploadComplete.open({
      type: "success",
      message: "Upload to Pennsieve completed",
    });
    let statusBarContainer = document.getElementById("status-bar-curate-progress");
    //statusBarContainer.remove();

    if (result.isConfirmed) {
      let datasetName = "";
      if (!sodaJSONObj["generate-dataset"].hasOwnProperty("dataset-name")) {
        datasetName = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
      } else {
        datasetName = sodaJSONObj["generate-dataset"]["dataset-name"];
      }
      $(".bf-dataset-span").html(datasetName);
      $("#current-bf-dataset").text(datasetName);
      $("#current-bf-dataset-generate").text(datasetName);
      $(".bf-dataset-span").html(datasetName);
      confirm_click_function();

      window.defaultBfDataset = datasetName;
      // document.getElementById("ds-description").innerHTML = "";
      window.refreshDatasetList();
      $("#dataset-loaded-message").hide();

      // showHideDropdownButtons("dataset", "show");
      confirm_click_function();
      $("#guided_mode_view").click();
      $(".swal2-confirm").click();
      $(".vertical-progress-bar-step").removeClass("is-current");
      $(".vertical-progress-bar-step").removeClass("done");
      $(".getting-started").removeClass("prev");
      $(".getting-started").removeClass("show");
      $(".getting-started").removeClass("test2");
      $("#Question-getting-started-1").addClass("show");
      $("#generate-dataset-progress-tab").css("display", "none");

      console.log("Resetting current tab value");
      window.currentTab = 0;
      window.wipeOutCurateProgress();
      $("#guided-button-start-modify-component").click();
      $("#disseminate_dataset_tab").click();
      $("#submit_prepublishing_review_btn").click();
    }
  });
};

window.get_num_files_and_folders = (dataset_folders) => {
  if ("files" in dataset_folders) {
    for (let file in dataset_folders["files"]) {
      file_counter += 1;
    }
  }
  if ("folders" in dataset_folders) {
    for (let folder in dataset_folders["folders"]) {
      folder_counter += 1;
      window.get_num_files_and_folders(dataset_folders["folders"][folder]);
    }
  }
  return;
};

const determineDatasetDestination = () => {
  if (window.sodaJSONObj["generate-dataset"]) {
    if (window.sodaJSONObj["generate-dataset"]["destination"]) {
      let destination = window.sodaJSONObj["generate-dataset"]["destination"];
      if (destination === "bf" || destination === "Pennsieve") {
        // updating an existing dataset on Pennsieve
        if (window.sodaJSONObj["bf-dataset-selected"]) {
          return [window.sodaJSONObj["bf-dataset-selected"]["dataset-name"], "Pennsieve"];
        } else {
          return [
            // get dataset name,
            document.querySelector("#inputNewNameDataset-upload-dataset").value,
            "Pennsieve",
          ];
        }
      } else {
        // replacing files in an existing local dataset
        if (window.sodaJSONObj["generate-dataset"]["dataset-name"]) {
          return [window.sodaJSONObj["generate-dataset"]["dataset-name"], "Local"];
        } else {
          // creating a new dataset from an existing local dataset
          return [document.querySelector("#inputNewNameDataset-upload-dataset").value, "Local"];
        }
      }
    }
  } else {
    return [document.querySelector("#inputNewNameDataset-upload-dataset").value, "Local"];
  }
};

function generateHtmlListFromArray(error_array) {
  const htmlList = `
    <ul>
      ${error_array.map((error) => `<li>${error}</li>`).join("")}
    </ul>
  `;
  return htmlList;
}

var metadataIndividualFile = "";
var metadataAllowedExtensions = [];
var metadataParaElement = "";
var metadataCurationMode = "";

window.importMetadataFiles = (ev, metadataFile, extensionList, paraEle, curationMode) => {
  document.getElementById(paraEle).innerHTML = "";
  metadataIndividualFile = metadataFile;
  metadataAllowedExtensions = extensionList;
  metadataParaElement = paraEle;
  metadataCurationMode = curationMode;
  window.electron.ipcRenderer.send("open-file-dialog-metadata-curate");
};

window.importPennsieveMetadataFiles = (ev, metadataFile, extensionList, paraEle) => {
  extensionList.forEach((file_type) => {
    let file_name = metadataFile + file_type;
    if (
      file_name in window.sodaJSONObj["metadata-files"] &&
      window.sodaJSONObj["metadata-files"][file_name]["type"] != "bf"
    ) {
      delete window.sodaJSONObj["metadata-files"][file_name];
    }
    let deleted_file_name = file_name + "-DELETED";
    if (
      deleted_file_name in window.sodaJSONObj["metadata-files"] &&
      window.sodaJSONObj["metadata-files"][deleted_file_name]["type"] === "bf"
    ) {
      // update Json object with the restored object
      let index =
        window.sodaJSONObj["metadata-files"][deleted_file_name]["action"].indexOf("deleted");
      window.sodaJSONObj["metadata-files"][deleted_file_name]["action"].splice(index, 1);
      let deleted_file_name_new_key = deleted_file_name.substring(
        0,
        deleted_file_name.lastIndexOf("-")
      );
      window.sodaJSONObj["metadata-files"][deleted_file_name_new_key] =
        window.sodaJSONObj["metadata-files"][deleted_file_name];
      delete window.sodaJSONObj["metadata-files"][deleted_file_name];
    }
  });
  window.populate_existing_metadata(window.sodaJSONObj);
};

window.electron.ipcRenderer.on("selected-metadataCurate", (event, mypath) => {
  if (mypath.length > 0) {
    var dotCount = window.path.basename(mypath[0]).trim().split(".").length - 1;
    if (dotCount === 1) {
      var metadataWithoutExtension = window.path
        .basename(mypath[0])
        .slice(0, window.path.basename(mypath[0]).indexOf("."));
      var extension = window.path
        .basename(mypath[0])
        .slice(window.path.basename(mypath[0]).indexOf("."));

      let file_size = 0;

      try {
        if (window.fs.existsSync(mypath[0])) {
          let stats = window.fs.fileSizeSync(mypath[0]);
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

window.showBFAddAccountSweetalert = async (ev) => {
  let target = ev.target;
  await Swal.fire({
    title: bfaddaccountTitle,
    html: bfAddAccountBootboxMessage,
    showLoaderOnConfirm: true,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Connect to Pennsieve",
    reverseButtons: window.reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: `<a target="_blank" href="https://docs.sodaforsparc.io/docs/connecting-to-pennsieve/connecting-with-api-key" style="text-decoration: none;">Help me get an API key</a>`,
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
              window.defaultBfAccount = name;
              window.defaultBfDataset = "Select dataset";
              return new Promise((resolve, reject) => {
                client
                  .get("/manage_datasets/bf_account_details", {
                    params: {
                      selected_account: name,
                    },
                  })
                  .then(async (response) => {
                    let user_email = response.data.email;
                    $("#current-bf-account").text(user_email);
                    $("#current-bf-account-generate").text(user_email);
                    $("#create_empty_dataset_BF_account_span").text(user_email);
                    $(".bf-account-span").text(user_email);
                    $("#current-bf-dataset").text("None");
                    $("#current-bf-dataset-generate").text("None");
                    $(".bf-dataset-span").html("None");
                    $("#para-continue-bf-dataset-getting-started").text("");
                    // set the workspace field values to the user's current workspace
                    let org = response.data.organization;
                    $(".bf-organization-span").text(org);
                    showHideDropdownButtons("account", "show");
                    confirm_click_account_function();
                    window.updateBfAccountList();

                    // If the clicked button has the data attribute "reset-guided-mode-page" and the value is "true"
                    // then reset the guided mode page
                    if (target?.getAttribute("data-reset-guided-mode-page") == "true") {
                      // Get the current page that the user is on in the guided mode
                      const currentPage = window.CURRENT_PAGE.id;
                      if (currentPage) {
                        await window.openPage(currentPage);
                      }
                    }

                    // reset the selected dataset to None
                    $(".bf-dataset-span").html("None");
                    // reset the current owner span in the manage dataset make pi owner of a dataset tab
                    $(".current-permissions").html("None");

                    window.refreshOrganizationList();

                    // If the button that triggered the organization has the class
                    // guided-change-workspace (from guided mode), handle changes based on the ev id
                    // otherwise, reset the FFM UI based on the ev class
                    // NOTE: For API Key sign in flow it is more simple to just reset the UI as the new user may be in a separate workspace than the prior user.
                    target?.classList.contains("data-reset-guided-mode-page")
                      ? window.handleGuidedModeOrgSwitch(target)
                      : window.resetFFMUI(target);

                    window.datasetList = [];
                    window.defaultBfDataset = null;
                    window.clearDatasetDropdowns();
                  })
                  .catch((error) => {
                    Swal.showValidationMessage(userErrorMessage(error));
                    document.getElementsByClassName("swal2-actions")[0].children[1].disabled =
                      false;
                    document.getElementsByClassName("swal2-actions")[0].children[3].disabled =
                      false;
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
};
// /*
// ******************************************************
// ******************************************************
// Analytics Logging Section
// ******************************************************
// ******************************************************
// */

// // Log the dataset description Successes and Errors as the user moves through the process of Preparing their metadata file
// // Inputs:
// //  category: string - "Success" indicates a successful operation; "Error" indicates a failed operation
// //  analyticsActionPrefix: string - One of the analytics action prefixes defined below in an enum
// //  window.AnalyticsGranularity: string - Determines what levels of granularity get logged; options are: "prefix", "action", "action with destination", "all levels of granularity."
// //  action: string - Optional. Indicates the step in the metadata preparation process the Success or Failure occurs
// //  destination: string - Optional. The destination where the action is occurring; defined below in an enum

// TEST comment for build spawn

window.logMetadataForAnalytics = (
  category,
  analyticsActionPrefix,
  granularity,
  action,
  destination
) => {
  // the name of the action being logged
  let actionName = analyticsActionPrefix;

  // check if only logging the prefix or all levels of granularity
  if (
    granularity === window.AnalyticsGranularity.PREFIX ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS
  ) {
    // log the prefix, category of the event
    window.electron.ipcRenderer.send("track-event", `${category}`, actionName);
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
    granularity === window.AnalyticsGranularity.ACTION ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS ||
    granularity === window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // track every time the user wanted to generate a metadata file or everytime the user wanted to use a pre-existing metadata file
    window.electron.ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
  }

  if (
    granularity === window.AnalyticsGranularity.ACTION_WITH_DESTINATION ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS ||
    granularity === window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // add the destination to the action
    actionName = actionName + " - " + destination;
    // log only the action with the destination added
    if (destination === Destinations.PENNSIEVE) {
      window.electron.ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        window.defaultBfDatasetId
      );
    } else {
      window.electron.ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
    }
  }
};

// Log the size of a metadata file that was created locally or uploaded to Pennsieve
// Inputs:
//    uploadBFBoolean: boolean - True when the metadata file was created on Pennsieve; false when the Metadata file was created locally
//    metadataFileName: string - the name of the metadata file that was created along with its extension
window.logMetadataSizeForAnalytics = async (uploadBFBoolean, metadataFileName, size) => {
  // get the destination of the metadata file
  let destination = uploadBFBoolean ? "Pennsieve" : "Local";

  window.electron.ipcRenderer.send(
    "track-event",
    "Success",
    "Prepare Metadata - Generate",
    "Size of Total Metadata Files Generated",
    size
  );

  // TODO: Dorian -> verify information is correct on the analytics side
  // TODO: Aaron -> change to Ps and add dataset id field
  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.PREPARE_METADATA,
    kombuchaEnums.Action.GENERATE,
    kombuchaEnums.Label.SIZE,
    kombuchaEnums.Status.SUCCESS,
    {
      value: size,
      destination: destination,
      origin: uploadBFBoolean ? window.defaultBfDatasetId : "Local",
      dataset_name: window.defaultBfDataset,
      dataset_int_id: window.defaultBfDatasetIntId,
    }
  );

  let fileNameToPrefixMapping = {
    dataset_description: window.MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
    submission: window.MetadataAnalyticsPrefix.SUBMISSION,
    subjects: window.MetadataAnalyticsPrefix.SUBJECTS,
    samples: window.MetadataAnalyticsPrefix.SAMPLES,
    readme: window.MetadataAnalyticsPrefix.README,
    changes: window.MetadataAnalyticsPrefix.CHANGES,
    manifest: window.MetadataAnalyticsPrefix.MANIFEST,
  };

  // remove the extension from the metadata file's name
  let metadataFileWithoutExtension = metadataFileName.slice(0, metadataFileName.indexOf("."));

  // get the appropriate prefix for logging the given metadata file's size
  let currentMetadataLoggingPrefix =
    fileNameToPrefixMapping[`${metadataFileWithoutExtension.toLowerCase()}`];

  // log the size to analytics using the Action as a root logging level
  // that aggregates the size of all metadata files of a particular type created through SODA
  window.electron.ipcRenderer.send(
    "track-event",
    "Success",
    currentMetadataLoggingPrefix + " - Generate - Size",
    "Size",
    size
  );

  // log the size of the metadata file along with its location; label is the selected dataset's ID or a note informing us the dataset is stored locally
  window.electron.ipcRenderer.send(
    "track-event",
    "Success",
    currentMetadataLoggingPrefix + ` - Generate - ${destination} - Size`,
    uploadBFBoolean ? window.defaultBfDatasetId : "Local",
    size
  );
};

// get the size of a file in bytes given a path to a file
window.getFileSizeInBytes = (path) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(window.fs.fileSizeSync(path));
    } catch (e) {
      reject(e);
    }
  });
};

window.MetadataAnalyticsPrefix = {
  DATASET_DESCRIPTION: "Prepare Metadata - dataset_description",
  MANIFEST: "Prepare Metadata - manifest",
  SUBJECTS: "Prepare Metadata - subjects",
  SAMPLES: "Prepare Metadata - samples",
  README: "Prepare Metadata - readme",
  CHANGES: "Prepare Metadata - changes",
  SUBMISSION: "Prepare Metadata - submission",
};

window.ManageDatasetsAnalyticsPrefix = {
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

window.DisseminateDatasetsAnalyticsPrefix = {
  DISSEMINATE_REVIEW: "Disseminate Datasets - Pre-publishing Review",
  DISSEMINATE_CURATION_TEAM: "Disseminate Datasets - Share with Curation Team",
  DISSEMINATE_SPARC_CONSORTIUM: "Disseminate Datasets - Share with SPARC Consortium",
};

window.PrepareDatasetsAnalyticsPrefix = {
  CURATE: "Prepare Datasets - Organize dataset",
};

window.AnalyticsGranularity = {
  PREFIX: "prefix",
  ACTION: "action",
  ACTION_WITH_DESTINATION: "action with destination",
  ACTION_AND_ACTION_WITH_DESTINATION: "action and action with destination",
  ALL_LEVELS: "all levels of granularity",
};

window.Actions = {
  GENERATE: "Generate",
  EXISTING: "Existing",
  NEW: "New",
};

window.logCurationForAnalytics = (
  category,
  analyticsActionPrefix,
  granularity,
  actions,
  location,
  generalLog
) => {
  // if no actions to log return
  if (!actions) {
    return;
  }

  // the name of the action being logged
  let actionName = analyticsActionPrefix;

  // check if only logging the prefix or all levels of granularity
  if (
    granularity === window.AnalyticsGranularity.PREFIX ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS
  ) {
    // log the prefix, category of the event
    window.electron.ipcRenderer.send("track-event", `${category}`, actionName);
  }

  // check if the user wants to log the action(s)
  if (
    granularity === window.AnalyticsGranularity.ACTION ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS ||
    granularity === window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
  ) {
    // iterate through the actions
    for (let idx = 0; idx < actions.length; idx++) {
      // track the action
      actionName = actionName + " - " + actions[idx];
      window.electron.ipcRenderer.send("track-event", `${category}`, actionName, actions[idx], 1);
    }

    // reset the action's name
    actionName = analyticsActionPrefix;
  }

  // check if the user wants to log the action(s) with the destination
  if (
    granularity === window.AnalyticsGranularity.ACTION_WITH_DESTINATION ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS ||
    granularity === window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
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
      window.electron.ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        window.defaultBfDatasetId
      );
    } else {
      // log the location as a label and add an aggregation value
      window.electron.ipcRenderer.send("track-event", `${category}`, actionName, location, 1);
    }
  }
};

window.getMetadataFileNameFromStatus = (metadataFileStatus) => {
  // get the UI text that displays the file path
  let filePath = metadataFileStatus.text();

  let fileName = window.path.basename(filePath);

  // remove the extension
  fileName = fileName.slice(0, fileName.indexOf("."));

  return fileName;
};

window.determineLocationFromStatus = (metadataFileStatus) => {
  let filePath = metadataFileStatus.text();

  // determine if the user imported from Pennsieve or Locally
  let pennsieveFile = filePath.toUpperCase().includes("Pennsieve".toUpperCase());

  return pennsieveFile;
};

window.logGeneralOperationsForAnalytics = (category, analyticsPrefix, granularity, actions) => {
  // if no actions to log return
  if (!actions) {
    return;
  }

  // the name of the action being logged
  let actionName = analyticsPrefix;

  // check if only logging the prefix or all levels of granularity
  if (
    granularity === window.AnalyticsGranularity.PREFIX ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS
  ) {
    // log the prefix, category of the event
    window.electron.ipcRenderer.send("track-event", `${category}`, actionName);
  }

  // check if the user wants to log the action(s)
  if (
    granularity === window.AnalyticsGranularity.ACTION ||
    granularity === window.AnalyticsGranularity.ALL_LEVELS
  ) {
    // iterate through the actions
    for (let idx = 0; idx < actions.length; idx++) {
      // track the action
      actionName = analyticsPrefix + " - " + actions[idx];
      window.electron.ipcRenderer.send(
        "track-event",
        `${category}`,
        actionName,
        window.defaultBfDatasetId
      );
    }
  }
};

// /*
// ******************************************************
// ******************************************************
// Manage Datasets Add/Edit Banner Image With Nodejs
// ******************************************************
// ******************************************************
// */

// // I: Dataset name or id
// // O: Presigned URL for the banner image or an empty string
// const getDatasetBannerImageURL = async (datasetIdOrName) => {
//   // check that a dataset name or id is provided
//   if (!datasetIdOrName || datasetIdOrName === "") {
//     throw new Error("Error: Must provide a valid dataset to pull tags from.");
//   }

//   // fetch the banner url from the Pennsieve API at the readme endpoint (this is because the description is the subtitle not readme )

//   let { banner } = bannerResponse.data;

//   return banner;
// };

// /*
// ******************************************************
// ******************************************************
// Get User Dataset Permissions With Nodejs
// ******************************************************
// ******************************************************
// */

// // returns the user's permissions/role for the given dataset. Options are : owner, manager, editor, viewer
// const getCurrentUserPermissions = async (datasetIdOrName) => {
//   // check that a dataset name or id is provided
//   if (!datasetIdOrName || datasetIdOrName === "") {
//     throw new Error("Error: Must provide a valid dataset to check permissions for.");
//   }

//   // get access token for the current user
//   let jwt = await get_access_token();

//   // get the dataset the user wants to edit
//   let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

//   // get the id out of the dataset
//   let id = dataset.content.id;

//   // get the user's permissions

//   // get the status code out of the response
//   let statusCode = dataset_roles.status;

//   // check the status code of the response
//   switch (statusCode) {
//     case 200:
//       // success do nothing
//       break;
//     case 404:
//       throw new Error(
//         `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset to check your permissions.`
//       );
//     case 401:
//       throw new Error(
//         `${statusCode} - You cannot check your dataset permissions while unauthenticated. Please reauthenticate and try again.`
//       );
//     case 403:
//       throw new Error(`${statusCode} - You do not have access to this dataset. `);

//     default:
//       // something unexpected happened
//       let statusText = dataset_roles.statusText;
//       throw new Error(`${statusCode} - ${statusText}`);
//   }

//   // get the permissions object
//   const { role } = dataset_roles.data;

//   // return the permissions
//   return role;
// };

// // I: role: string - A user's permissions indicated by their role. Can be: owner, manager, editor, viewer.
// // O: boolean - true if role is owner or manager, false otherwise
// const userIsOwnerOrManager = (role) => {
//   // check if the user permissions do not include "owner" or "manager"
//   if (!["owner", "manager"].includes(role)) {
//     // throw a permission error: "You don't have permissions for editing metadata on this Pennsieve dataset"
//     return false;
//   }

//   return true;
// };

// const userIsOwner = (role) => {
//   // check if the user permissions do not include "owner"
//   if (role !== "owner") {
//     // throw a permission error: "You don't have permissions for editing metadata on this Pennsieve dataset"
//     return false;
//   }

//   return true;
// };

// const userIsDatasetOwner = async (datasetIdOrName) => {
//   // check that a dataset name or id is provided
//   if (!datasetIdOrName || datasetIdOrName === "") {
//     throw new Error("Error: Must provide a valid dataset to check permissions for.");
//   }

//   // get the dataset the user wants to edit
//   let role = await getCurrentUserPermissions(datasetIdOrName);

//   return userIsOwner(role);
// };

// const create_validation_report = (error_report) => {
//   // let accordion_elements = ` <div class="title active"> `;
//   let accordion_elements = "";
//   let elements = Object.keys(error_report).length;

//   if ((elements = 0)) {
//     accordion_elements += `<ul> <li>No errors found </li> </ul>`;
//   } else if (elements == 1) {
//     let key = Object.keys(error_report)[0];
//     accordion_elements += `<ul> `;
//     if ("messages" in error_report[key]) {
//       for (let i = 0; i < error_report[key]["messages"].length; i++) {
//         accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </li>`;
//       }
//     }
//     accordion_elements += `</ul>`;
//   } else {
//     let keys = Object.keys(error_report);
//     for (key_index in keys) {
//       key = keys[key_index];
//       if (key == keys[0]) {
//         accordion_elements += `<ul> `;
//         if ("messages" in error_report[key]) {
//           for (let i = 0; i < error_report[key]["messages"].length; i++) {
//             accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </p> </li>`;
//           }
//         }
//         accordion_elements += `</ul> `;
//       } else {
//         accordion_elements += `<ul> `;
//         if ("messages" in error_report[key]) {
//           for (let i = 0; i < error_report[key]["messages"].length; i++) {
//             accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </p></li>`;
//           }
//         }
//         accordion_elements += `</ul>`;
//       }
//     }
//     // accordion_elements += `</div>`;
//   }
//   $("#validation_error_accordion").html(accordion_elements);
//   // $("#validation_error_accordion").accordion();
// };

// $("#validate_dataset_bttn").on("click", async () => {
//   const axiosInstance = axios.create({
//     baseURL: "http://127.0.0.1:5000/",
//     timeout: 0,
//   });

//   window.log.info("validating dataset");
//   window.log.info(window.bfDatasetSubtitle.value);

//   $("#dataset_validator_status").text("Please wait while we retrieve the dataset...");
//   $("#dataset_validator_spinner").show();

//   let selectedBfAccount = window.defaultBfAccount;
//   let selectedBfDataset = window.defaultBfDataset;

//   temp_object = {
//     "bf-account-selected": {
//       "account-name": selectedBfAccount,
//     },
//     "bf-dataset-selected": {
//       "dataset-name": selectedBfDataset,
//     },
//   };

//   let datasetResponse;

//   try {
//     datasetResponse = await axiosInstance("api_ps_retrieve_dataset", {
//       params: {
//         obj: JSON.stringify(temp_object),
//       },
//       responseType: "json",
//       method: "get",
//     });
//   } catch (err) {
//     window.log.error(error);
//     console.error(error);
//     $("#dataset_validator_spinner").hide();
//     $("#dataset_validator_status").html(`<span style='color: red;'> ${error}</span>`);
//   }

//   $("#dataset_validator_status").text("Please wait while we validate the dataset...");

//   try {
//     datasetResponse = axiosInstance("api_validate_dataset_pipeline", {
//       params: {
//         selectedBfAccount,
//         selectedBfDataset,
//       },
//       responseType: "json",
//       method: "get",
//     });
//   } catch (error) {
//     window.log.error(error);
//     console.error(error);
//     $("#dataset_validator_spinner").hide();
//     $("#dataset_validator_status").html(`<span style='color: red;'> ${error}</span>`);
//   }

//   create_validation_report(res);
//   $("#dataset_validator_status").html("");
//   $("#dataset_validator_spinner").hide();
// });

//function used to scale banner images
window.scaleBannerImage = async (imagePath) => {
  try {
    let imageScaled = await client.post(
      `/manage_datasets/scale_image`,
      {
        image_file_path: imagePath,
      },
      {
        params: {
          selected_account: window.defaultBfAccount,
          selected_dataset: window.defaultBfDataset,
        },
      }
    );
    return imageScaled.data.scaled_image_path;
  } catch (error) {
    clientError(error);
    return error.response;
  }
};

window.gatherLogs = () => {
  //function will be used to gather all logs on all OS's
  let homedir = window.os.homedir();
  let file_path = "";
  let clientLogsPath = "";
  let serverLogsPath = window.path.join(homedir, "SODA", "logs");
  let logFiles = ["main.log", "renderer.log", "agent.log", "api.log"];

  if (window.os.platform() === "darwin") {
    clientLogsPath = window.path.join(homedir, "/Library/Logs/soda-for-sparc/");
  } else if (window.os.platform() === "win32") {
    clientLogsPath = window.path.join(homedir, "AppData", "Roaming", "soda-for-sparc", "logs");
  } else {
    clientLogsPath = window.path.join(homedir, ".config", "soda-for-sparc", "logs");
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
        window.electron.ipcRenderer.send("open-file-dialog-log-destination");
      });
      window.electron.ipcRenderer.on("selected-log-folder", (event, result) => {
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

        let log_folder = window.path.join(file_path, "/SODA-For-SPARC-Logs/");
        try {
          window.fs.mkdirSync(log_folder, { recursive: true });
          // destination will be created or overwritten by default.
          for (const logFile of logFiles) {
            let logFilePath;
            let missingLog = false;
            if (logFile === "agent.log") {
              logFilePath = window.path.join(homedir, ".pennsieve", logFile);
              if (!window.fs.existsSync(logFilePath)) missingLog = true;
            } else if (logFile === "api.log") {
              logFilePath = window.path.join(serverLogsPath, logFile);
              if (!window.fs.existsSync(logFilePath)) missingLog = true;
            } else {
              logFilePath = window.path.join(clientLogsPath, logFile);
              if (!window.fs.existsSync(logFilePath)) missingLog = true;
            }
            if (!missingLog) {
              let log_copy = window.path.join(log_folder, logFile);

              window.fs.copyFileSync(logFilePath, log_copy);
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
};

/**
 * Gather the client's analytics ID and save it in a file of the user's choosing. The user can then send this to use when requesting to have their data
 * removed from our analytics database. For each computer/profile the user has they may have to perform this operation if they want all of their data
 * purged.
 */
window.displayClientId = async () => {
  let clientId = await window.electron.ipcRenderer.invoke("get-nodestorage-key", "userId");

  const copyClientIdToClipboard = () => {
    window.electron.ipcRenderer.invoke("clipboard-write", clientId, "clipboard");
  };

  copyClientIdToClipboard();
  let copyIcon = `<i class="fas fa-copy" id="copy-icon-client-id" click="${copyClientIdToClipboard()}" ></i>`;
  Swal.fire({
    title: "Click the Copy Icon to Copy Your Client ID",
    html: `<div style="margin-bottom:1rem;">${clientId} ${copyIcon}</div>`,
    heightAuto: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
  });
};

const gettingStarted = () => {
  let getting_started = document.getElementById("main_tabs_view");
  getting_started.click();
};

const sodaVideo = () => {
  document.getElementById("overview-column-1").blur();
  window.electron.ipcRenderer.invoke(
    "shell-open-external",
    "https://docs.sodaforsparc.io/docs/getting-started/user-interface"
  );
};

const directToDocumentation = () => {
  window.electron.ipcRenderer.invoke(
    "shell-open-external",
    "https://docs.sodaforsparc.io/docs/getting-started/organize-and-submit-sparc-datasets-with-soda"
  );

  document.getElementById("overview-column-2").blur();
  // window.open('https://docs.sodaforsparc.io', '_blank');
};
const directToGuidedMode = () => {
  const guidedModeLinkButton = document.getElementById("guided_mode_view");
  guidedModeLinkButton.click();
};
window.directToFreeFormMode = () => {
  const freeFormModeLinkButton = document.getElementById("main_tabs_view");
  const directToOrganize = document.getElementById("organize_dataset_btn");
  directToOrganize.click();
  // freeFormModeLinkButton.click();
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

// const createSpreadSheetWindow = async (spreadsheet) => {
//   window.electron.ipcRenderer.send("spreadsheet", spreadsheet);
// };
