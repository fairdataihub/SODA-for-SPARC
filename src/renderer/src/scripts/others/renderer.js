// //////////////////////////////////
// // Import required modules
// //////////////////////////////////

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

import * as path from "path";
// const remote = require("@electron/remote");
import { Notyf } from "notyf";
import Tagify from "@yaireo/tagify/dist/tagify.esm.js";
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
import axios from "axios";
import Swal from "sweetalert2";
import DatePicker from "tui-date-picker";
import datasetUploadSession from "../analytics/upload-session-tracker";
import {
  startBackgroundServices,
  initializeSODARenderer,
} from "../startup/initializeRendererProcess";
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
  swalShowInfo,
} from "../utils/swal-utils";

import useGlobalStore from "../../stores/globalStore";
import { setTreeViewDatasetStructure } from "../../stores/slices/datasetTreeViewSlice";
import {
  resetPennsieveAgentCheckState,
  setPennsieveAgentCheckSuccessful,
  setPennsieveAgentInstalled,
  setPennsieveAgentDownloadURL,
  setPennsieveAgentOutputErrorMessage,
  setPennsieveAgentCheckError,
  setPennsieveAgentOutOfDate,
  setPennsieveAgentCheckInProgress,
  setPostPennsieveAgentCheckAction,
} from "../../stores/slices/backgroundServicesSlice";

// add jquery to the window object
window.$ = jQuery;
window.jQuery = jQuery;
window.select2 = select2;

document.addEventListener("DOMContentLoaded", function () {
  $("select").select2();
});

window.nextBtnDisabledVariable = true;

window.datasetStructureJSONObj = {
  folders: {},
  files: {},
  type: "",
};

// //////////////////////////////////
// // App launch actions
// //////////////////////////////////

// // Log file settings //
window.log.setupRendererLogOptions();
window.homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");

//log user's OS version //
window.log.info(
  "User OS:",
  window.os.type(),
  window.os.platform(),
  "version:",
  window.os.release()
);

// utility function for async style set timeout
window.wait = async (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// // Check current app version //
const appVersion = await window.electron.ipcRenderer.invoke("app-version");
window.log.info("Current SODA version:", appVersion);

document.getElementById("guided_mode_view").click();

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

let update_available_notification = "";
let update_downloaded_notification = "";

// //////////////////////////////////
// // Initialize the renderer process
// //////////////////////////////////
startBackgroundServices();
initializeSODARenderer();

const abortPennsieveAgentCheck = (pennsieveAgentStatusDivId) => {
  setPennsieveAgentCheckSuccessful(false);
  if (!pennsieveAgentStatusDivId) {
    return;
  }
  const agentStatusDivToFocus = document.getElementById(pennsieveAgentStatusDivId);
  if (agentStatusDivToFocus) {
    window.unHideAndSmoothScrollToElement(pennsieveAgentStatusDivId);
  }
};

window.getPennsieveAgentStatus = async () => {
  while (useGlobalStore.getState()["pennsieveAgentCheckInProgress"] === true) {
    await window.wait(100);
  }
  return useGlobalStore.getState()["pennsieveAgentCheckSuccessful"];
};

window.checkPennsieveAgent = async (pennsieveAgentStatusDivId) => {
  try {
    // Step 0: abort if the background services are already running
    if (useGlobalStore.getState()["pennsieveAgentCheckInProgress"] === true) {
      return false;
    }
    // Reset the background services state in the store and set the checks in progress
    resetPennsieveAgentCheckState();
    setPennsieveAgentCheckInProgress(true);

    // Step 1: Check the internet connection
    const userConnectedToInternet = await window.checkInternetConnection();
    if (!userConnectedToInternet) {
      setPennsieveAgentCheckError(
        "No Internet Connection",
        "An internet connection is required to upload to Pennsieve. Please connect to the internet and try again."
      );
      abortPennsieveAgentCheck(pennsieveAgentStatusDivId);

      return false;
    }

    // Step 2: Check if the Pennsieve agent is installed
    const pennsieveAgentInstalled = await window.spawn.checkForPennsieveAgent();
    setPennsieveAgentInstalled(pennsieveAgentInstalled);

    if (!pennsieveAgentInstalled) {
      // If the Pennsieve agent is not installed, get the download URL and set it in the store
      const pennsieveAgentDownloadURL = await getPlatformSpecificAgentDownloadURL();
      setPennsieveAgentDownloadURL(pennsieveAgentDownloadURL);
      abortPennsieveAgentCheck(pennsieveAgentStatusDivId);
      return false;
    }

    // Stop the Pennsieve agent if it is running
    // This is to ensure that the agent is not running when we try to start it so no funny business happens
    try {
      await window.spawn.stopPennsieveAgent();
    } catch (error) {
      // Note: This error is not critical so we do not need to throw it
      clientError(error);
    }

    // Start the Pennsieve agent
    try {
      await window.spawn.startPennsieveAgent();
    } catch (error) {
      const emessage = userErrorMessage(error);
      setPennsieveAgentOutputErrorMessage(emessage);
      abortPennsieveAgentCheck(pennsieveAgentStatusDivId);

      return false;
    }

    // Get the version of the Pennsieve agent
    let usersPennsieveAgentVersion;
    try {
      const versionObj = await window.spawn.getPennsieveAgentVersion();
      usersPennsieveAgentVersion = versionObj["Agent Version"];
    } catch (error) {
      setPennsieveAgentCheckError(
        "Unable to verify the Pennsieve Agent version",
        "Please check the Pennsieve Agent logs for more information."
      );
      abortPennsieveAgentCheck(pennsieveAgentStatusDivId);

      return false;
    }

    let latestPennsieveAgentVersion;

    try {
      const [_, version] = await getLatestPennsieveAgentVersion();
      latestPennsieveAgentVersion = version;
    } catch (error) {
      const emessage = userErrorMessage(error);
      setPennsieveAgentCheckError(
        "Unable to get information about the latest Pennsieve Agent release",
        emessage
      );
      // abortPennsieveAgentCheck(pennsieveAgentStatusDivId);

      // return false;
    }

    if (usersPennsieveAgentVersion !== latestPennsieveAgentVersion) {
      const pennsieveAgentDownloadURL = await getPlatformSpecificAgentDownloadURL();
      setPennsieveAgentDownloadURL(pennsieveAgentDownloadURL);
      setPennsieveAgentOutOfDate(usersPennsieveAgentVersion, latestPennsieveAgentVersion);
      // abortPennsieveAgentCheck(pennsieveAgentStatusDivId);

      // return false;
    }

    // If we get to this point, it means all the background services are operational
    setPennsieveAgentCheckSuccessful(true);
    const postAgentCheckMessages = {
      "guided-mode-post-log-in-pennsieve-agent-check":
        "Click the 'Save and Continue' button below to finish preparing your dataset to be uploaded to Pennsieve.",
      "freeform-mode-pre-generate-pennsieve-agent-check":
        "Click the 'Upload' button below to upload your dataset to Pennsieve.",
      "freeform-mode-post-account-confirmation-pennsieve-agent-check":
        "Click the 'Continue' button below.",
    };
    setPostPennsieveAgentCheckAction(
      postAgentCheckMessages[pennsieveAgentStatusDivId] ||
        "You are ready to upload datasets to Pennsieve!"
    );

    return true;
  } catch (error) {
    setPennsieveAgentCheckError("Error checking Pennsieve background services", error.message);
    abortPennsieveAgentCheck(pennsieveAgentStatusDivId);
    return false;
  }
};

/**
 *  Checks that the API key and secret belong to the user's current default workspace value.
 *  Forces the user to login to the default workspace if not in order to synchronize the two.
 *
 */
window.synchronizePennsieveWorkspace = async () => {
  // IMP NOTE: There can be different API Keys for each workspace and the user can switch between workspaces. Therefore a valid api key
  //           under the default profile does not mean that key is associated with the user's current workspace.
  const profileMatches = await window.defaultProfileMatchesCurrentWorkspace();
  if (!profileMatches) {
    window.log.info("Default api key is for a different workspace");
    await window.switchToCurrentWorkspace();
  }
};

let preFlightCheckNotyf = null;

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
window.run_pre_flight_checks = async (pennsieveAgentStatusDivId) => {
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
    const userConnectedToInternet = await window.checkInternetConnection();
    if (!userConnectedToInternet) {
      throw new Error(
        "It seems that you are not connected to the internet. Please check your connection and try again."
      );
    }

    // Check for an API key pair in the default profile and ensure it is not obsolete.
    // NOTE: Calling the agent startup command without a profile setup in the config.ini file causes it to crash.
    // TODO: Ensure we clear the cache here
    const accountValid = await window.check_api_key(true);

    // Add a new api key and secret for validating the user's account in the current workspace.
    if (!accountValid) {
      // Dismiss the preflight check notification if it is still open
      if (preFlightCheckNotyf) {
        window.notyf.dismiss(preFlightCheckNotyf);
        preFlightCheckNotyf = null;
      }

      await swalShowInfo(
        "You are not connected to Pennsieve",
        "Please connect your Pennsieve account to continue."
      );

      await window.addBfAccount(null, false);

      // If defaultBfAccount is still null after the user has had the ability to sign in,
      // return false
      if (!window.defaultBfAccount) return false;
    }

    // NOTE: If the user signed in above this will pass. If the user is already signed in they may be prompted to synchronize.
    await window.synchronizePennsieveWorkspace();

    // Run the Pennsieve agent checks
    const pennsieveAgentCheckSuccessful =
      await window.checkPennsieveAgent(pennsieveAgentStatusDivId);
    if (!pennsieveAgentCheckSuccessful) {
      await swalShowInfo(
        "The Pennsieve Agent is not running",
        "Please follow the instructions to start the Pennsieve Agent and try again."
      );
      return false;
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
    const emessage = userErrorMessage(error);
    await swalShowError("Error establishing connection to Pennsieve", `${emessage}`);
    return false;
  }
};

window.checkInternetConnection = async () => {
  try {
    await axios.get("https://www.google.com");
    return true;
  } catch (error) {
    window.log.error("No internet connection");
    return false;
  }
};

window.check_api_key = async (showNotyfs = false) => {
  let notification = null;

  if (showNotyfs) {
    notification = window.notyf.open({
      type: "api_key_search",
      message: "Checking for Pennsieve account...",
    });
  }
  await window.wait(800);
  // If no accounts are found, return false.
  let responseObject;
  if (!hasConnectedAccountWithPennsieve()) {
    if (showNotyfs) {
      window.notyf.dismiss(notification);
      window.notyf.open({
        type: "error",
        message: "No account was found",
      });
    }
    return false;
  }

  try {
    responseObject = await client.get("manage_datasets/bf_account_list");
  } catch (e) {
    window.log.info("Current default profile API Key is obsolete");
    clientError(e);
    if (showNotyfs) {
      window.notyf.dismiss(notification);
      window.notyf.open({
        type: "error",
        message: "No account was found",
      });
    }
    return false;
  }

  let res = responseObject.data["accounts"];

  if (res[0] === "Select" && res.length === 1) {
    window.log.info("No api keys found");
    //no api key found
    if (showNotyfs) {
      window.notyf.dismiss(notification);
      window.notyf.open({
        type: "error",
        message: "No account was found",
      });
    }
    return false;
  } else {
    window.log.info("Found non obsolete api key in default profile");

    if (showNotyfs) {
      window.notyf.dismiss(notification);
      window.notyf.open({
        type: "success",
        message: "Connected to Pennsieve",
      });
    }
    return true;
  }
};

const getPlatformSpecificAgentDownloadURL = async () => {
  // Try to the direct download url for the platform specific agent
  // If that fails, then return the generic download url
  try {
    const [directDownloadUrl, _] = await getLatestPennsieveAgentVersion();
    return directDownloadUrl;
  } catch (error) {
    return "https://github.com/Pennsieve/pennsieve-agent/releases";
  }
};

/**
 *
 * @param {*} partialStringToSearch - The partial string to search for in the release name
 * @param {*} releaseList - The list of Pennsieve agent releases to search for the partial string
 * @returns - The download URL for the Pennsieve agent release that contains the partial string
 */

const findDownloadURL = (partialStringToSearch, releaseList) => {
  for (const release of releaseList) {
    const releaseName = release.name;
    if (releaseName.includes(partialStringToSearch)) {
      return release.browser_download_url;
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
      // The Pennsieve has different agent releases for different architectures on MacOS
      const systemArchitecture = window.process.architecture();
      if (systemArchitecture === "x64") {
        platformSpecificAgentDownloadURL = findDownloadURL("x86_64.pkg", latestReleaseAssets);
      }
      if (systemArchitecture === "arm64") {
        platformSpecificAgentDownloadURL = findDownloadURL("arm64.pkg", latestReleaseAssets);
      }
      if (!platformSpecificAgentDownloadURL) {
        platformSpecificAgentDownloadURL = findDownloadURL(".pkg", latestReleaseAssets);
      }
      break;
    case "win32":
      platformSpecificAgentDownloadURL = findDownloadURL(".msi", latestReleaseAssets);
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

// /////// New Organize Datasets /////////////////////

const organizeDSbackButton = document.getElementById("button-back");
const organizeDSaddFiles = document.getElementById("add-files");
const organizeDSaddNewFolder = document.getElementById("new-folder");
const organizeDSaddFolders = document.getElementById("add-folders");
const fullNameValue = document.querySelector(".hoverFullName");
window.menuFolder = document.querySelector(".menu.reg-folder");
window.menuFile = document.querySelector(".menu.file");
window.menuHighLevelFolders = document.querySelector(".menu.high-level-folder");
window.manifestFileCheck = document.getElementById("generate-manifest-curate");

// Manage datasets //
window.sodaCopy = {};

window.pathSubmitDataset = document.querySelector("#selected-local-dataset-submit");
// const progressUploadBf = document.getElementById("div-progress-submit");
window.progressBarUploadBf = document.getElementById("progress-bar-upload-ps");
window.datasetPermissionDiv = document.getElementById("div-permission-list-2");

window.bfDatasetSubtitleCharCount = document.querySelector("#para-char-count-metadata");

window.bfCurrentBannerImg = document.getElementById("current-banner-img");

window.bfViewImportedImage = document.querySelector("#image-banner");
window.guidedBfViewImportedImage = document.querySelector("#guided-image-banner");

window.formBannerHeight = document.getElementById("form-banner-height");
window.guidedFormBannerHeight = document.getElementById("guided-form-banner-height");
window.currentDatasetLicense = document.querySelector("#para-dataset-license-current");

// // Pennsieve dataset permission //
window.currentDatasetPermission = document.querySelector("#para-dataset-permission-current");
window.currentAddEditDatasetPermission = document.querySelector(
  "#para-add-edit-dataset-permission-current"
);
const bfListUsersPI = document.querySelector("#bf_list_users_pi");

const bfListUsers = document.querySelector("#bf_list_users");
const bfListTeams = document.querySelector("#bf_list_teams");

//Pennsieve dataset status
window.bfCurrentDatasetStatusProgress = document.querySelector(
  "#div-ps-current-dataset-status-progress"
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
window.delayAnimation = 250;

//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////

// Sidebar Navigation //

// Assign dragable area in the code to allow for dragging and selecting items//
let drag_event_fired = false;
let dragselect_area = new DragSelect({
  selectables: document.querySelectorAll(".single-item"),
  draggability: false,
  area: document.getElementById("items"),
});

// Assign the callback event for selecting items
dragselect_area.subscribe("callback", ({ items }) => {
  select_items(items);
});

// Assign an additional event to allow for ctrl drag behaviour
dragselect_area.subscribe("dragstart", ({ event }) => {
  select_items_ctrl(event);
});

// ///////////////////// Prepare Metadata Section ////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////

// ///// Global variables for this section

// /////// Save and load award and milestone info
let metadataPath = window.path.join(window.homeDirectory, "SODA", "METADATA");
let affiliationFileName = "affiliations.json";

window.affiliationConfigPath = window.path.join(metadataPath, affiliationFileName);
window.progressFilePath = window.path.join(window.homeDirectory, "SODA", "Progress");
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
      if (window.fs.existsSync(destinationPath)) {
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
            }).then(() => {});
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
    const isLocked = await api.isDatasetLocked(bfdataset);

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

window.generateSamplesFileHelper = async (uploadBFBoolean) => {
  let bfDataset = $("#bf_dataset_load_samples").text().trim();
  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the samples file to Pennsieve
    const supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // Check if dataset is locked after running pre-flight checks
    const isLocked = await api.isDatasetLocked(bfDataset);
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
  }).then(() => {});

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
    return {};
  }
};

// function to make directory if metadata path does not exist
window.createMetadataDir = () => {
  try {
    window.fs.mkdirSync(metadataPath, { recursive: true });
  } catch (error) {
    window.log.error(error);
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

//////////////// Dataset description file ///////////////////////
//////////////// //////////////// //////////////// ////////////////

//// get datasets and append that to option list for parent datasets

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

/// Add all ps accounts to the dropdown list, and then choose by default one option ('global' account)
window.curateDatasetDropdown = document.getElementById("curatebfdatasetlist");
window.curateOrganizationDropdown = document.getElementById("curatebforganizationlist");

// ///////////////////////////////END OF NEW CURATE UI CODE ADAPTATION ///////////////////////////////////////////////////

const metadataDatasetlistChange = () => {
  $("#ps-dataset-subtitle").val("");
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
  $("#ps-dataset-status-spinner").css("display", "block");
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
  new DatePicker(container, {
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

// // TODO: Dorian -> Remove this feature as we don't allow withdraws anymore
const withdrawDatasetCheck = async (res, curationMode) => {
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

  let currentAccount = $("#current-ps-account").text();
  let currentDataset = $(".ps-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");

  if (curationMode == "guided") {
    currentAccount = window.sodaJSONObj["ps-account-selected"]["account-name"];
    currentDataset = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];
  }

  try {
    await api.withdrawDatasetReviewSubmission(currentDataset);

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
        clientError(error);
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
  // metadataDatasetlistChange();
  permissionDatasetlistChange();
  // postCurationListChange();
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

    $("#current-ps-account").text(userEmail);
    $("#current-ps-account-generate").text(userEmail);
    $("#create_empty_dataset_BF_account_span").text(userEmail);
    $(".ps-account-span").text(userEmail);

    showHideDropdownButtons("account", "show");
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);
  }
};

const showPrePublishingPageElements = () => {
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

// The callback argument determines whether to publish/unpublish the dataset.
// If callback is empty, only the dataset status will be fetched and displayed.
window.showPublishingStatus = async (callback, curationMode = "") => {
  let curationModeID = "";
  let currentAccount = $("#current-ps-account").text();
  let currentDataset = $(".ps-dataset-span").html().trim();

  if (curationMode === "guided") {
    curationModeID = "guided--";
    currentAccount = window.sodaJSONObj["ps-account-selected"]["account-name"];
    currentDataset = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
  }

  if (currentDataset === "None") {
    if (curationMode === "" || curationMode === "freeform") {
      $("#button-refresh-publishing-status").addClass("hidden");
      $("#curation-dataset-status-loading").addClass("hidden");
    }
    return;
  }
  try {
    const { data: res } = await client.get(
      `/disseminate_datasets/datasets/${currentDataset}/publishing_status`,
      { params: { selected_account: currentAccount } }
    );
    // Inline publishStatusOutputConversion logic here
    var reviewStatus = res["review_request_status"];
    var outputMessage = "";
    if (reviewStatus === "draft" || reviewStatus === "cancelled") {
      outputMessage = "Dataset is not under review currently";
    } else if (reviewStatus === "requested") {
      outputMessage = "Dataset is currently under review";
    } else if (reviewStatus === "rejected") {
      outputMessage = "Dataset has been rejected by your Publishing Team and may require revision";
    } else if (reviewStatus === "accepted") {
      outputMessage = "Dataset has been accepted for publication by your Publishing Team";
    }

    // Update the dataset's publication status onscreen for the user
    $(`#${curationModeID}para-review-dataset-info-disseminate`).text(outputMessage);

    if (callback === window.submitReviewDatasetCheck || callback === withdrawDatasetCheck) {
      return callback(res, curationMode);
    }

    if (curationMode === "" || curationMode === "freeform") {
      $("#submit_prepublishing_review-question-2").removeClass("hidden");
      $("#curation-dataset-status-loading").addClass("hidden");
      $("#button-refresh-publishing-status").removeClass("fa-spin");
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
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
    });

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Show publishing status"]
    );
  }
};

// //////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////
// ////////////////// ORGANIZE DATASETS NEW FEATURE /////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////

window.highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"];
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
    window.loadFileFolder(myPath); //array -
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
            "folder-or-file-name-is-valid"
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

organizeDSaddFolders.addEventListener("click", function () {
  window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog");
});

// Event listener for when folder(s) are imported into the file explorer
window.electron.ipcRenderer.on(
  "selected-folders-organize-datasets",
  async (event, { filePaths: importedFolders, importRelativePath }) => {
    try {
      if (!importRelativePath) {
        throw new Error("The 'importRelativePath' property is missing in the response.");
      }

      // Use the current file explorer path or the provided relative path
      const currentFileExplorerPath = `dataset_root/${importRelativePath}`;
      const builtDatasetStructureFromImportedFolders =
        await window.buildDatasetStructureJsonFromImportedData(
          importedFolders,
          currentFileExplorerPath
        );

      // Add the imported folders to the dataset structure
      await mergeLocalAndRemoteDatasetStructure(
        builtDatasetStructureFromImportedFolders,
        currentFileExplorerPath
      );

      // Show success message
      window.notyf.open({
        type: "success",
        message: `Data successfully imported`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error importing folders", error);

      // Optionally show an error notification
      window.notyf.open({
        type: "error",
        message: `Error importing data: ${error.message}`,
        duration: 3000,
      });
    }
  }
);
/* ################################################################################## */
/* ################################################################################## */
/* ################################################################################## */

// Function to check if a folder on the user's machine is empty or not
const localFolderPathAndSubFoldersHaveNoFiles = (localFolderPath) => {
  try {
    const items = window.fs.readdirSync(localFolderPath);
    for (const item of items) {
      const itemPath = window.path.join(localFolderPath, item);
      const statsObj = window.fs.statSync(itemPath);

      // Check if the item is a file
      if (statsObj.isFile) {
        // If a file with size > 0 is found, the folder is not considered empty
        if (window.fs.fileSizeSync(itemPath) > 0) {
          return false; // Found a non-empty file
        }
      }
      // Check if the item is a directory
      else if (statsObj.isDirectory) {
        // Recursively check the subdirectory
        const isEmpty = localFolderPathAndSubFoldersHaveNoFiles(itemPath);
        if (!isEmpty) {
          return false; // Found a non-empty subdirectory
        }
      }
    }

    // If no files with size > 0 are found, the folder is considered empty
    return true;
  } catch (error) {
    window.log.error(`Error reading folder: ${error.message}`);
    return false; // Return false on error as we couldn't verify the folder
  }
};

const removeHiddenFilesFromDatasetStructure = (datasetStructure) => {
  const currentFilesAtPath = Object.keys(datasetStructure.files);
  for (const fileKey of currentFilesAtPath) {
    const fileIsHidden = window.evaluateStringAgainstSdsRequirements(fileKey, "is-hidden-file");
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
  const currentFoldersAtPath = Object.keys(datasetStructure["folders"]);

  for (const folderKey of currentFoldersAtPath) {
    const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
      folderKey,
      "folder-or-file-name-is-valid"
    );

    if (!folderNameIsValid) {
      const newFolderName = folderKey.replace(validSparcFolderAndFileNameRegexReplacer, "-");
      const newFolderObj = { ...datasetStructure["folders"][folderKey] };

      if (!newFolderObj["action"].includes("renamed")) {
        newFolderObj["action"].push("renamed");
      }
      if (!newFolderObj["original-name"]) {
        newFolderObj["original-name"] = folderKey;
      }
      newFolderObj["new-name"] = newFolderName;
      datasetStructure["folders"][newFolderName] = newFolderObj;
      delete datasetStructure["folders"][folderKey];

      replaceProblematicFoldersWithSDSCompliantNames(datasetStructure["folders"][newFolderName]);
    } else {
      replaceProblematicFoldersWithSDSCompliantNames(datasetStructure["folders"][folderKey]);
    }
  }
};

window.replaceProblematicFilesWithSDSCompliantNames = (datasetStructure) => {
  const currentFilesAtPath = Object.keys(datasetStructure["files"]);

  for (const fileKey of currentFilesAtPath) {
    const fileNameIsValid = window.evaluateStringAgainstSdsRequirements(
      fileKey,
      "folder-or-file-name-is-valid"
    );

    if (!fileNameIsValid) {
      const newFileName = fileKey.replace(validSparcFolderAndFileNameRegexReplacer, "-");
      const newFileObj = { ...datasetStructure["files"][fileKey] };

      if (!newFileObj["action"].includes("renamed")) {
        newFileObj["action"].push("renamed");
      }
      if (!newFileObj["original-name"]) {
        newFileObj["original-name"] = fileKey;
      }
      newFileObj["new-name"] = newFileName;
      datasetStructure["files"][newFileName] = newFileObj;
      delete datasetStructure["files"][fileKey];
    }
  }

  if (datasetStructure?.["folders"]) {
    const currentFoldersAtPath = Object.keys(datasetStructure["folders"]);
    for (const folderKey of currentFoldersAtPath) {
      window.replaceProblematicFilesWithSDSCompliantNames(datasetStructure["folders"][folderKey]);
    }
  }
};

const validSparcFolderAndFileNameRegexMatcher = /^[0-9A-Za-z,.\-_ ]*$/;
const validSparcFolderAndFileNameRegexReplacer = /[^0-9A-Za-z,.\-_ ]/g;
const identifierConventionsRegex = /^[A-Za-z0-9-]*$/;
const forbiddenFileNameRegex = /^(CON|PRN|AUX|NUL|(COM|LPT)[0-9])$/;
const forbiddenFiles = new Set([".DS_Store", "Thumbs.db"]);
const forbiddenFilesRegex = /^(CON|PRN|AUX|NUL|(COM|LPT)[0-9])$/;
const forbiddenCharacters = /[@#$%^&*()+=\/\\|"'~;:<>{}\[\]?]/;

window.evaluateStringAgainstSdsRequirements = (stringToTest, testType) => {
  const tests = {
    "folder-or-file-name-contains-forbidden-characters": !forbiddenFileNameRegex.test(stringToTest),
    "folder-or-file-name-is-valid": validSparcFolderAndFileNameRegexMatcher.test(stringToTest),
    "string-adheres-to-identifier-conventions": identifierConventionsRegex.test(stringToTest),
    "is-hidden-file": stringToTest.startsWith("."),
    "is-forbidden-file": forbiddenFiles.has(stringToTest) || forbiddenFilesRegex.test(stringToTest),
    "string-contains-forbidden-characters": forbiddenCharacters.test(stringToTest),
  };

  return tests[testType];
};

// Create some test case examples
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
        <div class="flex-center">
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

window.buildDatasetStructureJsonFromImportedData = async (
  itemPaths,
  currentFileExplorerPath,
  datasetImport = false
) => {
  const inaccessibleItems = [];
  const forbiddenFileNames = [];
  const problematicFolderNames = [];
  const problematicFileNames = [];
  const datasetStructure = {};
  const manifestStructure = [];
  const hiddenItems = [];
  const emptyFolders = [];
  const emptyFiles = [];

  showFileImportLoadingSweetAlert(500);

  // Function to traverse and build JSON structure
  const traverseAndBuildJson = async (
    pathToExplore,
    currentStructure,
    manifestStructure,
    currentStructurePath
  ) => {
    // Initialize the current structure if it does not exist
    currentStructure["folders"] = currentStructure["folders"] || {};
    currentStructure["files"] = currentStructure["files"] || {};

    try {
      if (await window.fs.isDirectory(pathToExplore)) {
        const folderIsEmpty = localFolderPathAndSubFoldersHaveNoFiles(pathToExplore);
        // If the folder is not empty, recursively traverse the folder and build the JSON structure

        if (folderIsEmpty) {
          emptyFolders.push(pathToExplore);
        } else {
          const folderName = window.path.basename(pathToExplore);
          const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
            folderName,
            "folder-or-file-name-is-valid"
          );
          if (!folderNameIsValid) {
            problematicFolderNames.push(`${currentStructurePath}${folderName}`);
          }

          // Add the folder to the JSON structure
          currentStructure["folders"][folderName] = {
            path: pathToExplore,
            location: "local",
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
                manifestStructure,
                `${currentStructurePath}${folderName}/`
              );
            })
          );
        }
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

        const fileIsEmpty = window.fs.fileSizeSync(pathToExplore) === 0;

        // If the file is not empty or forbidden, add it to the current dataset structure
        if (fileIsInForbiddenFilesList) {
          forbiddenFileNames.push(fileObject);
        } else if (fileIsEmpty) {
          emptyFiles.push(fileObject);
        } else {
          // Check if the file name has any characters that do not comply with SPARC naming requirements
          const fileNameIsValid = window.evaluateStringAgainstSdsRequirements(
            fileName,
            "folder-or-file-name-is-valid"
          );
          if (!fileNameIsValid) {
            problematicFileNames.push(fileObject);
          }

          const fileIsHidden = window.evaluateStringAgainstSdsRequirements(
            fileName,
            "is-hidden-file"
          );
          if (fileIsHidden) {
            // Hidden files are allowed in the dataset_root/ and dataset_root/code/ directories
            const allowedHiddenFilePaths = new Set(["dataset_root/", "dataset_root/code/"]);

            // Check if the current path is not allowed for hidden files
            if (!allowedHiddenFilePaths.has(currentStructurePath)) {
              hiddenItems.push(fileObject);
            }
          }

          // Add the file to the current structure
          currentStructure["files"][fileName] = {
            path: pathToExplore,
            location: "local",
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
      await traverseAndBuildJson(
        itemPath,
        datasetStructure,
        manifestStructure,
        currentFileExplorerPath
      );
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

  if (emptyFolders.length > 0) {
    await swalFileListSingleAction(
      emptyFolders,
      "Empty folders detected",
      "The following folders are empty or contain only other empty folders or files (0 KB). These will not be imported into SODA:",
      false
    );
  }

  if (emptyFiles.length > 0) {
    await swalFileListSingleAction(
      emptyFiles.map((file) => file.relativePath),
      "Empty files detected",
      "The files listed below are empty (0 KB) and will not be imported into SODA:",
      false
    );
  }

  if (problematicFolderNames.length > 0) {
    const replaceFoldersForUser = await swalFileListDoubleAction(
      problematicFolderNames,
      "Folder names not compliant with SPARC data standards detected",
      `
        The SPARC data standards require folder names to only letters, numbers, spaces,
        hyphens, underscores, commas, and periods.
        <br /><br />
        The following folders contain special characters that are not compliant with the SPARC data standards:
      `,
      "Have SODA replace the special characters with '-'",
      "Cancel the import",
      "What would you like to do with the non-compliant folder names?"
    );

    if (replaceFoldersForUser) {
      replaceProblematicFoldersWithSDSCompliantNames(datasetStructure);
    } else {
      throw new Error("Importation cancelled");
    }
  }

  if (problematicFileNames.length > 0) {
    const replaceFilesForUser = await swalFileListDoubleAction(
      problematicFileNames.map((file) => file.relativePath),
      "File names not compliant with SPARC data standards detected",
      `
        The SPARC data standards require folder names to only letters, numbers, spaces,
        hyphens, underscores, commas, and periods.
        <br /><br />
        The following files contain special characters that are not compliant with the SPARC data standards:
      `,
      "Have SODA replace the special characters with '-'",
      "Cancel the import",
      "What would you like to do with the non-compliant file names?"
    );
    if (replaceFilesForUser) {
      window.replaceProblematicFilesWithSDSCompliantNames(datasetStructure);
    } else {
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

  if (datasetImport) {
    return [datasetStructure, problematicFolderNames, problematicFileNames];
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
    );
    const ExistingFoldersAtPath = Object.keys(existingDatasetJsonAtPath["folders"]) || [];
    const ExistingFilesAtPath = Object.keys(existingDatasetJsonAtPath["files"]) || [];
    const foldersBeingMergedToPath = Object.keys(datasetStructureToMerge["folders"]) || [];
    const filesBeingMergedToPath = Object.keys(datasetStructureToMerge["files"]) || [];

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
          folderContainingFileToOverwrite["files"][file.fileName]?.["location"];

        // overwrite the existing file with the new file
        folderContainingFileToOverwrite["files"][file.fileName] = file.fileObject;

        // if the file being overwritten was from Pennsieve, add the "updated" action to the file
        if (
          fileTypeOfObjectToOverwrite === "ps" &&
          !folderContainingFileToOverwrite["files"][file.fileName]["action"].includes("updated")
        ) {
          folderContainingFileToOverwrite["files"][file.fileName]["action"].push("updated");
        }
      }
    }
  }
  const currentPathArray = window.getGlobalPath(currentFileExplorerPath); // ['dataset_root', 'code']
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
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

const mergeNewDatasetStructureToExistingDatasetStructureAtPath = async (
  builtDatasetStructure,
  relativePathToMergeObjectInto
) => {
  try {
    // Step 2: Add the imported data to the dataset structure (This function handles duplicate files, etc)
    await mergeLocalAndRemoteDatasetStructure(builtDatasetStructure, currentFileExplorerPath);
    console.log(
      "Successfully merged the new dataset structure into the existing dataset structure"
    );
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
    setTreeViewDatasetStructure(window.datasetStructureJSONObj);

    // Step 4: Update successful, show success message
    window.notyf.open({
      type: "success",
      message: `Data successfully imported`,
      duration: 3000,
    });
  } catch (error) {
    console.error(error);
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
  await mergeNewDatasetStructureToExistingDatasetStructureAtPath(accessibleItems);
};

window.irregularFolderArray = [];
window.detectIrregularFolders = (localFolderPath) => {
  // Get the name of the folder and check if it is valid
  const folderName = window.path.basename(localFolderPath);
  const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
    folderName,
    "folder-or-file-name-is-valid"
  );
  if (!folderNameIsValid) {
    window.irregularFolderArray.push(localFolderPath);
  }

  // Recurse through the folder and check for any other irregular folders
  const folderContents = window.fs.readdirSync(localFolderPath);
  for (const child of folderContents) {
    const childPath = window.path.join(localFolderPath, child);
    const childPathIsFolder = window.fs.isDirectorySync(childPath);
    if (childPathIsFolder) {
      window.detectIrregularFolders(childPath);
    }
  }

  return window.irregularFolderArray;
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
    excelToJson({
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
        window.moveItems(event);
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
          window.moveItems(event);
        } else if ($(this).attr("id") === "file-description") {
          manageDesc(event);
        }
        // Hide it AFTER the action was triggered
        window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
      });
    window.hideMenu("file", window.menuFolder, window.menuHighLevelFolders, window.menuFile);
  } catch (e) {
    console.error(e);
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

const select_items_ctrl = (event) => {
  if (event["ctrlKey"]) {
  } else {
    $(".selected-item").removeClass("selected-item");
    dragselect_area.clearSelection();
  }
};

const select_items = (items) => {
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
  let hideSampleFolders = false;
  let hideSubjectFolders = false;
  let splitPath = datasetPath.value.split("/");
  let fullPath = datasetPath.value;

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

      if (sortedObj["folders"][item]["location"] == "ps") {
        cloud_item = " pennsieve_folder";
        if (deleted_folder) {
          cloud_item = " pennsieve_folder_deleted";
        }
      }

      if (
        sortedObj["folders"][item]["location"] == "local" &&
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
        if (sortedObj["files"][item]["location"] == "ps") {
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

      if (sortedObj["files"][item]["location"] == "ps") {
        cloud_item = " pennsieve_file";
        if (deleted_file) {
          cloud_item = " pennsieve_file_deleted";
        }
      }

      if (
        sortedObj["files"][item]["location"] == "local" &&
        sortedObj["files"][item]["action"].includes("existing")
      ) {
        cloud_item = " local_file";
        if (deleted_file) {
          cloud_item = " local_file_deleted";
        }
      }
      if (
        sortedObj["files"][item]["location"] == "local" &&
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
    new Promise(async (resolved) => {
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
    new Promise(async (resolved) => {
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

  dragselect_area.subscribe("dragstart", ({ event }) => {
    select_items_ctrl(event);
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

    lottie.loadAnimation({
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
  //     window.sodaJSONObj["starting-point"]["origin"] == "new" &&
  //     "local-path" in window.sodaJSONObj["starting-point"]
  //   ) {
  //     window.sodaJSONObj["starting-point"]["origin"] = "local";ps-account
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

window.setSodaJSONStartingPoint = () => {
  if (window.sodaJSONObj["starting-point"]["origin"] === "local") {
    window.sodaJSONObj["starting-point"]["origin"] = "new";
  }
};

const setDatasetNameAndDestination = (sodaJSONObj) => {
  let dataset_name = "";
  let dataset_destination = "";

  if ("ps-dataset-selected" in sodaJSONObj) {
    dataset_name = sodaJSONObj["ps-dataset-selected"]["dataset-name"];
    dataset_destination = "Pennsieve";
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      let destination = sodaJSONObj["generate-dataset"]["destination"];
      if (destination == "local") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Local";
      }
      if (destination == "ps") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Pennsieve";
      }
    }
  }

  return [dataset_name, dataset_destination];
};

const deleteTreeviewFiles = (sodaJSONObj) => {
  // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view

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

const setupCode = async (resume = false) => {
  // set tab-active to generate-progress-tab
  $("#generate-dataset-progress-tab").addClass("tab-active");
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("prevBtn").style.display = "none";
  document.getElementById("start-over-btn").style.display = "none";
  document.getElementById("div-vertical-progress-bar").style.display = "none";
  document.getElementById("div-generate-comeback").style.display = "none";
  document.getElementById("wrapper-wrap").style.display = "none";
  document.getElementById("generate-dataset-progress-tab").style.display = "flex";
  $("#party-lottie").hide();
  $("#please-wait-new-curate-div").hide();

  $("#sidebarCollapse").prop("disabled", false);
  // disable guided_mode_view
  document.getElementById("guided_mode_view").style.pointerEvents = "none";
  // disable documentation view to be clicked again
  document.getElementById("documentation-view").style.pointerEvents = "none";
  // disable contact us view to be clicked again
  document.getElementById("contact-us-view").style.pointerEvents = "none";

  document.getElementById("about-view").style.display = "block";

  // updateJSON structure after Generate dataset tab
  window.updateJSONStructureGenerate(window.sodaJSONObj);

  window.setSodaJSONStartingPoint(window.sodaJSONObj);

  let dataset_destination = setDatasetNameAndDestination(window.sodaJSONObj)[1];

  if (!resume) {
    progressStatus.innerHTML = "Please wait while we verify a few things...";
    generateProgressBar.value = 0;
  } else {
    // NOTE: This only works if we got to the upload. SO add more code to check for this.
    progressStatus.innerHTML = `Please wait while we perform setup for retrying the upload...`;
  }
  document.getElementById("wrapper-wrap").style.display = "none";

  if (dataset_destination == "Pennsieve") {
    setTimeout(() => {
      document.getElementById("wrapper-wrap").style.display = "none";
    }, 500);
    let supplementary_checks = await window.run_pre_flight_checks(
      "freeform-mode-pre-generate-pennsieve-agent-check"
    );

    if (!supplementary_checks) {
      $("#sidebarCollapse").prop("disabled", false);

      // return to the prior page
      // $($($(this).parent()[0]).parents()[0]).addClass("tab-active");
      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
      document.getElementById("para-please-wait-new-curate").innerHTML = "";
      document.getElementById("prevBtn").style.display = "inline";
      document.getElementById("start-over-btn").style.display = "inline-block";
      document.getElementById("div-vertical-progress-bar").style.display = "flex";
      document.getElementById("div-generate-comeback").style.display = "flex";
      document.getElementById("generate-dataset-progress-tab").style.display = "none";
      $("#generate-dataset-progress-tab").removeClass("tab-active");
      document.getElementById("preview-dataset-tab").style.display = "flex";
      $("#preview-dataset-tab").addClass("tab-active");

      document.getElementById("guided_mode_view").style.pointerEvents = "";
      // Allow documentation view to be clicked again
      document.getElementById("documentation-view").style.pointerEvents = "";
      // Allow contact us view to be clicked again
      document.getElementById("contact-us-view").style.pointerEvents = "";
      return;
    }
  }

  if (!resume) {
    progressBarNewCurate.value = 0;
    progressStatus.innerHTML = "";
    document.getElementById("div-new-curate-progress").style.display = "none";
    progressStatus.innerHTML = "Please wait...";
  }

  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";

  deleteTreeviewFiles(window.sodaJSONObj);

  initiate_generate(resume);
};

const preGenerateSetup = async (e, elementContext) => {
  $($($(elementContext).parent().parent()[0]).parents()[0]).removeClass("tab-active");
  let resume = e.target.textContent.trim() == "Retry";
  setupCode(resume);
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

window.file_counter = 0;
window.folder_counter = 0;
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

let amountOfTimesPennsieveUploadFailed = 0;

// Generates a dataset organized in the Organize Dataset feature locally, or on Pennsieve
const initiate_generate = async (resume = false) => {
  // Disable the Guided Mode sidebar button to prevent the sodaJSONObj from being modified
  document.getElementById("guided_mode_view").style.pointerEvents = "none";
  // Disable the Docs sidebar button to prevent the sodaJSONObj from being modified
  document.getElementById("documentation-view").style.pointerEvents = "none";
  // Disable the Contact Us sidebar button to prevent the sodaJSONObj from being modified
  document.getElementById("contact-us-view").style.pointerEvents = "none";

  // Initiate curation by calling Python function
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

  let dataset_destination = "";
  let dataset_name = "";

  // track the amount of files that have been uploaded/generated
  let uploadedFiles = 0;
  let uploadedBytes = 0;
  let loggedDatasetNameToIdMapping = false;

  // determine where the dataset will be generated/uploaded
  let nameDestinationPair = determineDatasetDestination();
  let datasetLocation = determineDatasetLocation();
  dataset_name = nameDestinationPair[0];
  dataset_destination = nameDestinationPair[1];

  if (dataset_destination == "Pennsieve" || dataset_destination == "ps") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }

  const manifestCheckbox = document.getElementById("generate-manifest-curate");
  if (!manifestCheckbox.checked) {
    // Checkbox is OFF (not checked)
    delete window.sodaJSONObj["dataset_metadata"]["manifest_file"];
  }

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
      let { data } = response;
      amountOfTimesPennsieveUploadFailed = 0;

      $("#party-lottie").show();

      // check if we updated an existing dataset
      // const mergeSelectedCard = document
      //   .querySelector("#dataset-upload-existing-dataset")
      //   .classList.contains("checked");
      // if (mergeSelectedCard) {
      //   await swalShowInfo(
      //     "Manifest Files Not Updated With New Files",
      //     "Please navigate to the `Advanced Features` tab and use the standalone manifest generator to update your manifest files with the new files."
      //   );
      // }

      main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
      uploadedFiles = data["main_curation_uploaded_files"];
      window.pennsieveAgentManifestId = data["local_manifest_id"];
      window.pennsieveManifestId = data["origin_manifest_id"];

      window.totalFilesCount = data["main_curation_total_files"];

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
      if (dataset_destination == "ps" || dataset_destination == "Pennsieve") {
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

      // hide the retry button
      $("#button-retry").hide();
      $("#button-generate-validate").show();

      // update dataset list; set the dataset id and int id
      try {
        let responseObject = await client.get(`manage_datasets/fetch_user_datasets`, {
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
      // Allow documentation view to be clicked again
      document.getElementById("documentation-view").style.pointerEvents = "";
      // Allow contact us view to be clicked again
      document.getElementById("contact-us-view").style.pointerEvents = "";
    })
    .catch(async (error) => {
      amountOfTimesPennsieveUploadFailed += 1;
      clearInterval(timerProgress);

      $("#party-lottie").hide();

      // set the first line of progressStatus to 'Upload Failed'
      if (progressStatus.innerHTML.split("<br>").length > 1) {
        progressStatus.innerHTML = `Upload Failed<br>${progressStatus.innerHTML
          .split("<br>")
          .slice(1)
          .join("<br>")}`;
      } else {
        progressStatus.innerHTML = `Upload Failed`;
      }

      // show the retry button and hide the verify file status button
      $("#button-generate-validate").hide();

      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";
      // Allow documentation view to be clicked again
      document.getElementById("documentation-view").style.pointerEvents = "";
      // Allow contact us view to be clicked again
      document.getElementById("contact-us-view").style.pointerEvents = "";

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
      if (dataset_destination == "ps" || dataset_destination == "Pennsieve") {
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

      if (amountOfTimesPennsieveUploadFailed > 3) {
        Swal.fire({
          icon: "error",
          title: "An Error Occurred While Uploading Your Dataset",
          html: "Check the error message on the progress page to learn more. If the  issue persists, please contact us by using the Contact Us page in the sidebar.",
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
        // show the retry button so the user can retry the upload manually or decide to contact us
        $("#button-retry").show();

        // do not update the dataset list or automaticallly retry the upload
        return;
      }

      progressStatus.innerHTML = `Retrying the upload automatically ${amountOfTimesPennsieveUploadFailed} of 3 times...`;
      statusBarClone.remove();

      await window.wait(5000);

      setupCode(true);

      // update the dataset list
      try {
        let responseObject = await client.get(`manage_datasets/fetch_user_datasets`, {
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
        progressStatus.innerHTML = main_curate_status;
        statusText.innerHTML = main_curate_status;
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
      $("#please-wait-new-curate-div").hide();

      $("#party-lottie").show();

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
    if (dataset_destination == "Pennsieve" || dataset_destination == "ps") {
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

window.get_num_files_and_folders = (dataset_folders) => {
  if ("files" in dataset_folders) {
    window.file_counter += dataset_folders["files"].length;
  }
  if ("folders" in dataset_folders) {
    for (let folder in dataset_folders["folders"]) {
      window.folder_counter += 1;
      window.get_num_files_and_folders(dataset_folders["folders"][folder]);
    }
  }
  return;
};

const determineDatasetDestination = () => {
  if (window.sodaJSONObj["generate-dataset"]) {
    if (window.sodaJSONObj["generate-dataset"]["destination"]) {
      let destination = window.sodaJSONObj["generate-dataset"]["destination"];
      if (destination === "ps" || destination === "Pennsieve") {
        // updating an existing dataset on Pennsieve
        if (window.sodaJSONObj["ps-dataset-selected"]) {
          return [window.sodaJSONObj["ps-dataset-selected"]["dataset-name"], "Pennsieve"];
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
          return [window.sodaJSONObj["generate-dataset"]["dataset-name"], "local"];
        } else {
          // creating a new dataset from an existing local dataset
          return [document.querySelector("#inputNewNameDataset-upload-dataset").value, "local"];
        }
      }
    }
  } else {
    return [document.querySelector("#inputNewNameDataset-upload-dataset").value, "local"];
  }
};

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
            sodaJSONObj["dataset_metadata"]["code-metadata"][metadataFileType] = mypath[0];

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
            .then(() => {
              $("#bootbox-key-name").val("");
              $("#bootbox-api-key").val("");
              $("#bootbox-api-secret").val("");
              bfAccountOptions[name] = name;
              window.defaultBfAccount = name;
              window.defaultBfDataset = "Select dataset";
              return new Promise(() => {
                client
                  .get("/manage_datasets/bf_account_details", {
                    params: {
                      selected_account: name,
                    },
                  })
                  .then(async (response) => {
                    let user_email = response.data.email;
                    $("#current-ps-account").text(user_email);
                    $("#current-ps-account-generate").text(user_email);
                    $("#create_empty_dataset_BF_account_span").text(user_email);
                    $(".ps-account-span").text(user_email);
                    $("#current-ps-dataset").text("None");
                    $("#current-ps-dataset-generate").text("None");
                    $(".ps-dataset-span").html("None");
                    $("#para-continue-ps-dataset-getting-started").text("");
                    // set the workspace field values to the user's current workspace
                    let org = response.data.organization;
                    $(".ps-organization-span").text(org);
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
                    $(".ps-dataset-span").html("None");
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

document.getElementById("button-view-impact").addEventListener("click", () => {
  // open a new tab pointed towards the following external link: https://docs.sodaforsparc.io/
  window.open("https://docs.sodaforsparc.io#impact/", "_blank");
});

document.getElementById("button-gather-logs").addEventListener("click", () => {
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
});

/**
 * Gather the client's analytics ID and save it in a file of the user's choosing. The user can then send this to use when requesting to have their data
 * removed from our analytics database. For each computer/profile the user has they may have to perform this operation if they want all of their data
 * purged.
 */
document.getElementById("button-display-client-id").addEventListener("click", async () => {
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
});

const directToGuidedMode = () => {
  const guidedModeLinkButton = document.getElementById("guided_mode_view");
  guidedModeLinkButton.click();
};
window.directToFreeFormMode = () => {
  const directToOrganize = document.getElementById("organize_dataset_btn");
  directToOrganize.click();
};

document
  .getElementById("home-button-guided-mode-link")
  .addEventListener("click", directToGuidedMode);
document
  .getElementById("home-button-free-form-mode-link")
  .addEventListener("click", window.directToFreeFormMode);

tippy("#datasetPathDisplay", {
  placement: "top",
  theme: "soda",
  maxWidth: "100%",
});

// const createSpreadSheetWindow = async (spreadsheet) => {
//   window.electron.ipcRenderer.send("spreadsheet", spreadsheet);
// };
