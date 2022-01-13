//////////////////////////////////
// Import required modules
//////////////////////////////////

const zerorpc = require("zerorpc");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { ipcRenderer } = require("electron");
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
const cognitoClient = require("amazon-cognito-identity-js");

const DatePicker = require("tui-date-picker"); /* CommonJS */

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

//////////////////////////////////
// App launch actions
//////////////////////////////////

// Log file settings //
log.transports.console.level = false;
log.transports.file.maxSize = 1024 * 1024 * 10;
const homeDirectory = app.getPath("home");
const SODA_SPARC_API_KEY = "SODA-Pennsieve";

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
let client = new zerorpc.Client({ timeout: 300000 });
client.connect("tcp://127.0.0.1:4242");
client.invoke("echo", "server ready", (error, res) => {
  if (error || res !== "server ready") {
    log.error(error);
    console.error(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      "Establishing Python Connection",
      error
    );
    Swal.fire({
      icon: "error",
      html: `Something went wrong with loading all the backend systems for SODA. Please restart SODA and try again. If this issue occurs multiple times, please email <a href='mailto:bpatel@calmi2.org'>bpatel@calmi2.org</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Restart now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        app.relaunch();
        app.exit();
      }
    });
  } else {
    console.log("Connected to Python back-end successfully");
    log.info("Connected to Python back-end successfully");
    ipcRenderer.send(
      "track-event",
      "Success",
      "Establishing Python Connection"
    );

    // verify backend api versions
    client.invoke("api_version_check", (error, res) => {
      if (error || res !== appVersion) {
        log.error(error);
        console.error(error);
        ipcRenderer.send(
          "track-event",
          "Error",
          "Verifying App Version",
          error
        );

        Swal.fire({
          icon: "error",
          html: `The minimum app versions do not match. Please try restarting your computer and reinstalling the latest version of SODA. If this issue occurs multiple times, please email <a href='mailto:bpatel@calmi2.org'>bpatel@calmi2.org</a>.`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Close now",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(async (result) => {
          if (result.isConfirmed) {
            app.exit();
          }
        });
      } else {
        ipcRenderer.send("track-event", "Success", "Verifying App Version");

        //Load Default/global Pennsieve account if available
        updateBfAccountList();
        checkNewAppVersion(); // Added so that version will be displayed for new users
      }
    });
  }
});

const notyf = new Notyf({
  position: { x: "right", y: "bottom" },
  ripple: true,
  dismissible: true,
  ripple: false,
  types: [
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

// Check app version on current app and display in the side bar
ipcRenderer.on("run_pre_flight_checks", (event, arg) => {
  run_pre_flight_checks();
});

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
const run_pre_flight_checks = async (check_update = true) => {
  return new Promise(async (resolve) => {
    let connection_response = "";
    let agent_installed_response = "";
    let agent_version_response = "";
    let account_present = false;

    // Check the internet connection and if available check the rest.
    connection_response = await check_internet_connection();
    if (!connection_response) {
      Swal.fire({
        icon: "error",
        text: "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of SODA related to Pennsieve and especially none of the features located under the 'Manage Datasets' section.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "I understand",
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Do nothing
        }
      });
      resolve(false);
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
            openDropdownPrompt("bf");
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

const wait = async (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
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
  return new Promise((resolve) => {
    client.invoke("api_bf_account_list", (error, res) => {
      if (error) {
        notyf.dismiss(notification);
        notyf.open({
          type: "error",
          message: "No account was found",
        });
        log.error(error);
        console.error(error);
        resolve(false);
      } else {
        log.info("Found a set of valid API keys");
        if (res[0] === "Select" && res.length === 1) {
          //no api key found
          notyf.dismiss(notification);
          notyf.open({
            type: "error",
            message: "No account was found",
          });
          resolve(false);
        } else {
          notyf.dismiss(notification);
          notyf.open({
            type: "success",
            message: "Connected to Pennsieve",
          });
          resolve(true);
        }
      }
    });
  });
};

const check_agent_installed = async () => {
  let notification = null;
  notification = notyf.open({
    type: "ps_agent",
    message: "Searching for Pennsieve Agent...",
  });
  await wait(800);
  return new Promise((resolve) => {
    client.invoke("api_check_agent_install", (error, res) => {
      if (error) {
        notyf.dismiss(notification);
        notyf.open({
          type: "error",
          message: "Pennsieve agent not found",
        });
        console.log(error);
        log.warn("Pennsieve agent not found");
        var emessage = userError(error);
        resolve([false, emessage]);
      } else {
        notyf.dismiss(notification);
        notyf.open({
          type: "success",
          message: "Pennsieve agent found",
        });
        log.info("Pennsieve agent found");
        resolve([true, res]);
      }
    });
  });
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

  client.invoke(
    "api_save_subjects_file",
    uploadBFBoolean,
    defaultBfAccount,
    $("#bf_dataset_load_subjects").text().trim(),
    subjectsDestinationPath,
    subjectsTableData,
    (error, res) => {
      if (error) {
        var emessage = userError(error);
        log.error(error);
        console.error(error);
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
      } else {
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
      }
    }
  );
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
function loadSubjectsFileToDataframe(filePath) {
  var fieldSubjectEntries = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase());
  }
  client.invoke(
    "api_convert_subjects_samples_file_to_df",
    "subjects",
    filePath,
    fieldSubjectEntries,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        Swal.fire({
          title: "Couldn't load existing subjects.xlsx file",
          html: emessage,
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
      } else {
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
      }
    }
  );
}

// import existing subjects.xlsx info (calling python to load info to a dataframe)
function loadSamplesFileToDataframe(filePath) {
  var fieldSampleEntries = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase());
  }
  client.invoke(
    "api_convert_subjects_samples_file_to_df",
    "samples",
    filePath,
    fieldSampleEntries,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        Swal.fire({
          title: "Couldn't load existing samples.xlsx file",
          html: emessage,
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
      } else {
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
      }
    }
  );
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
  await client.invoke(
    "api_load_taxonomy_species",
    [commonName],
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
      } else {
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
      }
    }
  );
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

// New instance for description editor
// const tuiInstance = new Editor({
//   el: document.querySelector("#editorSection"),
//   initialEditType: "wysiwyg",
//   previewStyle: "vertical",
//   height: "400px",
//   hideModeSwitch: true,
//   placeholder: "Add a description here: ",
//   toolbarItems: [
//     "heading",
//     "bold",
//     "italic",
//     "strike",
//     "link",
//     "hr",
//     "divider",
//     "ul",
//     "ol",
//   ],
// });

var displaySize = 1000;

//////////////////////////////////
// Prepare Dataset
//////////////////////////////////

////////////////// Validate current datasets ////////////////////////////////

// /////// Convert table content into json format for transferring to Python
// function grabCurrentDSValidator() {
//   var jsonvect = tableToJsonWithDescription(tableNotOrganized);
//   var jsonpath = jsonvect[0];
//   var jsondescription = jsonvect[1];
//   var jsonpathMetadata = tableToJsonMetadata(tableMetadata);
//   jsonpath["main"] = jsonpathMetadata["metadata"];
//   return [jsonpath, jsondescription];
// }

//// Check for empty JSON object and remove then
// function checkJSONObj(jsonObj) {
//   var empty = true;
//   for (var key of Object.keys(jsonObj)) {
//     if (jsonObj[key].length !== 0) {
//       empty = false;
//     } else {
//       if (key !== "main") delete jsonObj[key];
//     }
//   }
//   return [empty, jsonObj];
// }

///////// Clicking on Validate current DS
// var checkCategory0 = "High-level folder structure";
// var checkCategory1 = "High-level metadata files";
// var checkCategory2 = "Sub-level organization";
// var checkCategory3 = "submission file";
// var checkCategory4 = "dataset_description file";
// var checkCategory5 = "subjects file";
// var checkCategory6 = "samples file";
// var checkCategories = [
//   checkCategory0,
//   checkCategory1,
//   checkCategory2,
//   checkCategory3,
//   checkCategory4,
//   checkCategory5,
//   checkCategory6,
// ];
//
// validateCurrentDSBtn.addEventListener("click", function () {
//   document.getElementById("div-validation-report-current").style.display =
//     "none";
//   document.getElementById("para-preview-current-ds").innerHTML = "";
//   document.getElementById("para-validate-current-ds").innerHTML = "";
//   document.getElementById("para-generate-report-current-ds").innerHTML = "";
//   var jsonvect = grabCurrentDSValidator();
//   var jsonpath = jsonvect[0];
//   var jsondescription = jsonvect[1];
//   var outCheck = checkJSONObj(jsonpath);
//   var empty = outCheck[0];
//   if (empty === true) {
//     document.getElementById("para-validate-current-ds").innerHTML =
//       "<span style='color: red;'>Please add files or folders to your dataset first!</span>";
//   } else {
//     validateCurrentDSBtn.disabled = true;
//     if (manifestStatus.checked) {
//       validateSODAProgressBar.style.display = "block";
//       client.invoke(
//         "api_create_folder_level_manifest",
//         jsonpath,
//         jsondescription,
//         (error, res) => {
//           if (error) {
//             console.error(error);
//             log.error(error);
//             var emessage = userError(error);
//             document.getElementById("para-validate-current-ds").innerHTML =
//               "<span style='color: red;'>" + emessage + "</span>";
//             validateCurrentDSBtn.disabled = false;
//             validateSODAProgressBar.style.display = "none";
//           } else {
//             var validatorInput = res;
//             localValidator(validatorInput);
//           }
//         }
//       );
//     } else {
//       var validatorInput = jsonpath;
//       console.log(validatorInput);
//       localValidator(validatorInput);
//     }
//   }
// });
//
// function localValidator(validatorInput) {
//   var messageDisplay = "";
//   client.invoke("api_validate_dataset", validatorInput, (error, res) => {
//     if (error) {
//       console.error(error);
//       log.error(error);
//       var emessage = userError(error);
//       document.getElementById("para-validate-current-ds").innerHTML =
//         "<span style='color: red;'>" + emessage + "</span>";
//       validateCurrentDSBtn.disabled = false;
//       validateSODAProgressBar.style.display = "none";
//     } else {
//       for (var i = 0; i < res.length; i++) {
//         messageDisplay = errorMessageCategory(
//           res[i],
//           checkCategories[i],
//           messageDisplay
//         );
//       }
//       document.getElementById("div-validation-report-current").style.display =
//         "block";
//       document.getElementById("div-report-current").style.display = "block";
//       document.getElementById("para-validate-current-ds").innerHTML =
//         "Done, see report below!";
//       validateCurrentDatasetReport.innerHTML = messageDisplay;
//       validateCurrentDSBtn.disabled = false;
//       validateSODAProgressBar.style.display = "none";
//     }
//   });
// }
//

// Generate pdf validator file
// currentDatasetReportBtn.addEventListener("click", function () {
//   document.getElementById("para-generate-report-current-ds").innerHTML = "";
//   ipcRenderer.send("save-file-dialog-validator-current");
// });
// ipcRenderer.on("selected-savedvalidatorcurrent", (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null) {
//       document.getElementById("para-generate-report-current-ds").innerHTML =
//         "Please wait...";
//       currentDatasetReportBtn.disabled = true;
//       // obtain canvas and print to pdf
//       const domElement = validateCurrentDatasetReport;
//       // obtain canvas and print to pdf
//       html2canvas(domElement).then((canvas) => {
//         const img = canvas.toDataURL("image/png", 1.0);
//         var data = img.replace(/^data:image\/\w+;base64,/, "");
//         var buf = new Buffer(data, "base64");
//
//         // obtain canvas and print to pdf
//         pdf = new PDFDocument({ autoFirstPage: false });
//         var image = pdf.openImage(buf);
//         pdf.addPage({ size: [image.width + 100, image.height + 25] });
//         pdf.pipe(fs.createWriteStream(filepath));
//         pdf.image(image, 25, 25);
//
//         pdf.end();
//
//         document.getElementById("para-generate-report-current-ds").innerHTML =
//           "Report saved!";
//       });
//     }
//   }
//   currentDatasetReportBtn.disabled = false;
// });

/////////////////////// Validate local datasets //////////////////////////////
//
// //// when users click on Import local dataset
// document
//   .getElementById("input-local-ds-select")
//   .addEventListener("click", function () {
//     document.getElementById("para-generate-report-local-ds").innerHTML = "";
//     document.getElementById("div-report-local").style.display = "none";
//     ipcRenderer.send("open-file-dialog-validate-local-ds");
//   });
// ipcRenderer.on("selected-validate-local-dataset", (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null) {
//       document.getElementById("para-local-ds-info").innerHTML = "";
//       document.getElementById("div-validation-report-local").style.display =
//         "none";
//       // used to communicate value to button-import-local-ds click eventlistener
//       document.getElementById("input-local-ds-select").placeholder =
//         filepath[0];
//     } else {
//       document.getElementById("para-local-ds-info").innerHTML =
//         "<span style='color: red ;'>Please select a valid local dataset!</span>";
//     }
//   }
// });
//
// validateLocalDSBtn.addEventListener("click", function () {
//   document.getElementById("para-local-ds-info").innerHTML = "";
//   document.getElementById("para-generate-report-local-ds").innerHTML = "";
//   var datasetPath = document.getElementById("input-local-ds-select")
//     .placeholder;
//   var messageDisplay = "";
//   if (datasetPath === "Select a folder") {
//     document.getElementById("para-local-ds-info").innerHTML =
//       "<span style='color: red ;'>Please select a local dataset first</span>";
//   } else {
//     if (datasetPath != null) {
//       validateLocalProgressBar.style.display = "block";
//       validateLocalDSBtn.disabled = true;
//       validatorInput = datasetPath;
//       client.invoke("api_validate_dataset", validatorInput, (error, res) => {
//         if (error) {
//           console.error(error);
//           log.error(error);
//           validateLocalProgressBar.style.display = "none";
//         } else {
//           for (var i = 0; i < res.length; i++) {
//             if (res[i] !== "N/A") {
//               messageDisplay = errorMessageCategory(
//                 res[i],
//                 checkCategories[i],
//                 messageDisplay
//               );
//             }
//           }
//           document.getElementById("div-validation-report-local").style.display =
//             "block";
//           document.getElementById("div-report-local").style.display = "block";
//           document.getElementById("para-local-ds-info").innerHTML =
//             "Done, see report below!";
//           validateLocalDatasetReport.innerHTML = messageDisplay;
//           validateLocalProgressBar.style.display = "none";
//         }
//       });
//       validateLocalDSBtn.disabled = false;
//     }
//   }
// });

// function validateMessageTransform(inString, classSelection, colorSelection) {
//   //outString = inString.split("--").join("<br>")
//   outString = inString.split("--");
//   var msg =
//     "<li class=" +
//     classSelection +
//     ">" +
//     "<span style='color:" +
//     colorSelection +
//     ";'>";
//   msg += outString[0];
//   msg += "</span>" + "</li>";
//   if (outString.length > 1) {
//     msg += "<ul style='margin-top:-10px';>";
//     for (var i = 1; i < outString.length; i++) {
//       msg +=
//         "<li>" +
//         "<span style='color:" +
//         colorSelection +
//         ";'>" +
//         outString[i] +
//         "</span>" +
//         "</li>";
//     }
//     msg += "</ul>";
//   }
//   return msg;
// }

// function errorMessageGenerator(resitem, category, messageDisplay) {
//   if (resitem[category]) {
//     var messageCategory = resitem[category];
//     if (messageCategory.length > 0) {
//       if (category === "fatal") {
//         var colorSelection = "red";
//         var classSelection = "bulleterror";
//       } else if (category === "warnings") {
//         var colorSelection = "#F4B800";
//         var classSelection = "bulletwarning";
//       } else if (category === "pass") {
//         var colorSelection = "green";
//         var classSelection = "bulletpass";
//       }
//       for (var i = 0; i < messageCategory.length; i++) {
//         var message = validateMessageTransform(
//           messageCategory[i],
//           classSelection,
//           colorSelection
//         );
//         messageDisplay += message;
//       }
//     }
//   }
//   return messageDisplay;
// }

// function errorMessageCategory(resitem, checkCategory, messageDisplay) {
//   messageDisplay += "<b>" + checkCategory + "</b>";
//   messageDisplay += "<ul class='validatelist' id='" + checkCategory + "'>";
//   var category = "fatal";
//   messageDisplay = errorMessageGenerator(resitem, category, messageDisplay);
//   category = "warnings";
//   messageDisplay = errorMessageGenerator(resitem, category, messageDisplay);
//   category = "pass";
//   messageDisplay = errorMessageGenerator(resitem, category, messageDisplay);
//   messageDisplay += "</ul>";
//   return messageDisplay;
// }

///// Generate pdf report for local validator report
// localDatasetReportBtn.addEventListener("click", function () {
//   document.getElementById("para-generate-report-local-ds").innerHTML = "";
//   ipcRenderer.send("save-file-dialog-validator-local");
// });
// ipcRenderer.on("selected-savedvalidatorlocal", (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null) {
//       document.getElementById("para-generate-report-local-ds").innerHTML =
//         "Please wait...";
//       localDatasetReportBtn.disabled = true;
//       const domElement = validateLocalDatasetReport;
//       html2canvas(domElement).then((canvas) => {
//         const img = canvas.toDataURL("image/png", 1.0);
//         var data = img.replace(/^data:image\/\w+;base64,/, "");
//         var buf = new Buffer(data, "base64");
//
//         // obtain canvas and print to pdf
//         pdf = new PDFDocument({ autoFirstPage: false });
//         var image = pdf.openImage(buf);
//         pdf.addPage({ size: [image.width + 100, image.height + 25] });
//         pdf.pipe(fs.createWriteStream(filepath));
//         pdf.image(image, 25, 25);
//
//         pdf.end();
//
//         document.getElementById("para-generate-report-local-ds").innerHTML =
//           "Report saved!";
//       });
//     }
//   }
//   localDatasetReportBtn.disabled = false;
// });

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

function updateDatasetCurate(datasetDropdown, bfaccountDropdown) {
  client.invoke(
    "api_bf_dataset_account",
    bfaccountDropdown.options[bfaccountDropdown.selectedIndex].text,
    (error, result) => {
      if (error) {
        log.error(error);
        console.log(error);
        var emessage = error;
        curateBFAccountLoadStatus.innerHTML =
          "<span style='color: red'>" + emessage + "</span>";
      } else {
        // clear and populate dataset list
        populateDatasetDropdownCurate(datasetDropdown, result);
      }
    }
  );
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
      await updateDatasetExcludedFiles(selectedBfDataset, files);
    } catch (error) {
      // log the error
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ALL_LEVELS,
        ["Updating excluded files"]
      );
      log.error(error);
      console.error(error);

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

// ipcRenderer.on("warning-withdraw-dataset-selection", (event, index) => {
//   if (index === 0) {
//     withdrawReviewDataset();
//   }
//   $("#submit_prepublishing_review-spinner").hide();
// });

async function withdrawReviewDataset() {
  bfWithdrawReviewDatasetBtn.disabled = true;
  var selectedBfAccount = $("#current-bf-account").text();
  var selectedBfDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");

  try {
    await withdrawDatasetReviewSubmission(selectedBfDataset);

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

  removeOptions(bfListUsers);
  var optionUser = document.createElement("option");
  optionUser.textContent = "Select user";
  bfListUsers.appendChild(optionUser);

  removeOptions(bfListUsersPI);
  var optionUserPI = document.createElement("option");
  optionUserPI.textContent = "Select PI";
  bfListUsersPI.appendChild(optionUserPI);

  if (accountSelected !== "Select") {
    client.invoke("api_bf_get_users", accountSelected, (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
      } else {
        // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
        $("#bf_list_users").selectpicker("refresh");
        $("#bf_list_users").find("option:not(:first)").remove();
        $("#button-add-permission-user").hide();
        $("#bf_list_users_pi").selectpicker("refresh");
        $("#bf_list_users_pi").find("option:not(:first)").remove();
        for (var myItem in res) {
          // returns like [..,''fname lname email !!**!! pennsieve_id',',..]
          let sep_pos = res[myItem].lastIndexOf("!|**|!");
          var myUser = res[myItem].substring(0, sep_pos);
          var optionUser = document.createElement("option");
          optionUser.textContent = myUser;
          optionUser.value = res[myItem].substring(sep_pos + 6);
          bfListUsers.appendChild(optionUser);
          var optionUser2 = optionUser.cloneNode(true);
          bfListUsersPI.appendChild(optionUser2);
        }
      }
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
    client.invoke("api_bf_get_teams", accountSelected, (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        confirm_click_account_function();
      } else {
        // The removeoptions() wasn't working in some instances (creating a double list) so second removal for everything but the first element.
        $("#bf_list_teams").selectpicker("refresh");
        $("#bf_list_teams").find("option:not(:first)").remove();
        $("#button-add-permission-team").hide();
        for (var myItem in res) {
          var myTeam = res[myItem];
          var optionTeam = document.createElement("option");
          optionTeam.textContent = myTeam;
          optionTeam.value = myTeam;
          teamList.appendChild(optionTeam);
        }
        confirm_click_account_function();
      }
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

function loadDefaultAccount() {
  client.invoke("api_bf_default_account_load", (error, res) => {
    if (error) {
      log.error(error);
      console.error(error);
      confirm_click_account_function();
    } else {
      if (res.length > 0) {
        var myitemselect = res[0];
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
  });
}

function updateBfAccountList() {
  client.invoke("api_bf_account_list", (error, res) => {
    if (error) {
      log.error(error);
      console.error(error);
      var emessage = userError(error);
      confirm_click_account_function();
    } else {
      for (myitem in res) {
        var myitemselect = res[myitem];
        var option = document.createElement("option");
        option.textContent = myitemselect;
        option.value = myitemselect;
        var option2 = option.cloneNode(true);
      }
      loadDefaultAccount();
      if (res[0] === "Select" && res.length === 1) {
        // todo: no existing accounts to load
      }
    }
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);
  });
}

/*
function showCurrentDOI() {
  currentDOI.value = "Please wait...";
  reserveDOIStatus.innerHTML = "";
  bfPostCurationProgressDOI.style.display = "block";
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;
  if (selectedBfDataset === "Select dataset") {
    currentDOI.value = "-------";
    bfPostCurationProgressDOI.style.display = "none";
  } else {
    client.invoke(
      "api_bf_get_doi",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          currentDOI.value = "-------";
          var emessage = userError(error);
          reserveDOIStatus.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          bfPostCurationProgressDOI.style.display = "none";
        } else {
          currentDOI.value = res;
          bfPostCurationProgressDOI.style.display = "none";
        }
      }
    );
  }
}
*/

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

function showPublishingStatus(callback) {
  return new Promise(function (resolve, reject) {
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
      client.invoke(
        "api_bf_get_publishing_status",
        selectedBfAccount,
        selectedBfDataset,
        (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            var emessage = userError(error);
            Swal.fire({
              title: "Could not get your publishing status!",
              text: `${emessage}`,
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
          } else {
            try {
              // update the dataset's publication status and display it onscreen for the user under their dataset name
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
          }
        }
      );
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

listItems(datasetStructureJSONObj, "#items");
getInFolder(
  ".single-item",
  "#items",
  organizeDSglobalPath,
  datasetStructureJSONObj
);

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
    var appendString = loadFileFolder(myPath);

    /// empty the div
    $("#items").empty();
    $("#items").html(appendString);

    organizeLandingUIEffect();
    // reconstruct div with new elements
    listItems(myPath, "#items");
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
            var appendString = "";
            appendString =
              appendString +
              '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">' +
              newFolderName +
              "</div></div>";
            $(appendString).appendTo("#items");

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

            listItems(myPath, "#items");
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
    console.log(regex.test(key), key, regex);
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

var bfaddaccountTitle = `<h3 style="text-align:center">Please specify a key name and enter your Pennsieve API key and secret below: <i class="fas fa-info-circle swal-popover" data-tippy-content="See our dedicated <a target='_blank' href='https://fairdataihub.org/sodaforsparc/docs/manage-dataset/Connect-your-Pennsieve-account-with-SODA'> help page </a>for generating API key and secret and setting up your Pennsieve account in SODA during your first use.<br><br>The account will then be remembered by SODA for all subsequent uses and be accessible under the 'Select existing account' tab. You can only use Pennsieve accounts under the SPARC Consortium organization with SODA." rel="popover" data-placement="right" data-html="true" data-trigger="hover" ></i></h3>`;

retrieveBFAccounts();

// this function is called in the beginning to load bf accounts to a list
// which will be fed as dropdown options
function retrieveBFAccounts() {
  bfAccountOptions = [];
  bfAccountOptionsStatus = "";
  client.invoke("api_bf_account_list", (error, res) => {
    if (error) {
      log.error(error);
      console.error(error);
      bfAccountOptionsStatus = error;
    } else {
      for (myitem in res) {
        bfAccountOptions[res[myitem]] = res[myitem];
      }
      showDefaultBFAccount();
    }
  });
  return [bfAccountOptions, bfAccountOptionsStatus];
}

function showDefaultBFAccount() {
  client.invoke("api_bf_default_account_load", (error, res) => {
    if (error) {
      log.error(error);
      console.error(error);
    } else {
      if (res.length > 0) {
        var myitemselect = res[0];
        defaultBfAccount = myitemselect;
        client.invoke(
          "api_bf_account_details",
          defaultBfAccount,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
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
            } else {
              $("#para-account-detail-curate").html(res);
              $("#current-bf-account").text(defaultBfAccount);
              $("#current-bf-account-generate").text(defaultBfAccount);
              $("#create_empty_dataset_BF_account_span").text(defaultBfAccount);
              $(".bf-account-span").text(defaultBfAccount);
              $("#para-account-detail-curate-generate").html(res);
              $("#para_create_empty_dataset_BF_account").html(res);
              $(".bf-account-details-span").html(res);

              $("#div-bf-account-load-progress").css("display", "none");
              showHideDropdownButtons("account", "show");
              // refreshDatasetList()
              updateDatasetList();
            }
          }
        );
      }
    }
  });
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

ipcRenderer.on("selected-new-dataset", (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      document.getElementById("para-organize-datasets-loading").style.display =
        "block";
      document.getElementById("para-organize-datasets-loading").innerHTML =
        "<span>Please wait...</span>";
      client.invoke(
        "api_generate_dataset_locally",
        "create new",
        filepath[0],
        newDSName,
        datasetStructureJSONObj,
        (error, res) => {
          document.getElementById(
            "para-organize-datasets-loading"
          ).style.display = "none";
          if (error) {
            log.error(error);
            console.error(error);
            document.getElementById(
              "para-organize-datasets-success"
            ).style.display = "none";
            document.getElementById(
              "para-organize-datasets-error"
            ).style.display = "block";
            document.getElementById("para-organize-datasets-error").innerHTML =
              "<span> " + error + "</span>";
          } else {
            document.getElementById(
              "para-organize-datasets-error"
            ).style.display = "none";
            document.getElementById(
              "para-organize-datasets-success"
            ).style.display = "block";
            document.getElementById(
              "para-organize-datasets-success"
            ).innerHTML = "<span>Generated successfully!</span>";
          }
        }
      );
    }
  }
});

//////////// FILE BROWSERS to import existing files and folders /////////////////////
organizeDSaddFiles.addEventListener("click", function () {
  ipcRenderer.send("open-files-organize-datasets-dialog");
});

ipcRenderer.on("selected-files-organize-datasets", (event, path) => {
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
  addFilesfunction(
    path,
    myPath,
    organizeDSglobalPath,
    "#items",
    ".single-item",
    datasetStructureJSONObj
  );
});

organizeDSaddFolders.addEventListener("click", function () {
  ipcRenderer.send("open-folders-organize-datasets-dialog");
});

ipcRenderer.on("selected-folders-organize-datasets", (event, pathElement) => {
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
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        addFoldersfunction(
          "replace",
          irregularFolderArray,
          pathElement,
          myPath
        );
      } else if (result.isDenied) {
        addFoldersfunction("remove", irregularFolderArray, pathElement, myPath);
      }
    });
  } else {
    addFoldersfunction("", irregularFolderArray, pathElement, myPath);
  }
});

function addFoldersfunction(
  action,
  nonallowedFolderArray,
  folderArray,
  currentLocation
) {
  var uiFolders = {};
  var importedFolders = {};

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
        while (
          renamedFolderName in uiFolders ||
          renamedFolderName in importedFolders
        ) {
          renamedFolderName = `${originalFolderName} (${j})`;
          j++;
        }
        importedFolders[renamedFolderName] = {
          path: folderArray[i],
          "original-basename": originalFolderName,
        };
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
        var appendString =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
          element +
          "</div></div>";
        $("#items").html(appendString);
        listItems(currentLocation, "#items");
        getInFolder(
          ".single-item",
          "#items",
          organizeDSglobalPath,
          datasetStructureJSONObj
        );
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
        hideMenu(
          "high-level-folder",
          menuFolder,
          menuHighLevelFolders,
          menuFile
        );
      }

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
function drop(ev) {
  irregularFolderArray = [];
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
    detectIrregularFolders(path.basename(ele), ele);
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
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        action = "replace";
      } else if (result.isDenied) {
        action = "remove";
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
          for (var objectKey in myPath["files"]) {
            if (objectKey !== undefined) {
              var nonAllowedDuplicate = false;
              if (itemPath === myPath["files"][objectKey]["path"]) {
                nonAllowedDuplicateFiles.push(itemPath);
                nonAllowedDuplicate = true;
                break;
              }
            }
          }
          if (!nonAllowedDuplicate) {
            var j = 1;
            var fileBaseName = itemName;
            var originalFileNameWithoutExt = path.parse(fileBaseName).name;
            var fileNameWithoutExt = originalFileNameWithoutExt;
            while (fileBaseName in uiFiles || fileBaseName in importedFiles) {
              fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
              fileBaseName = fileNameWithoutExt + path.parse(fileBaseName).ext;
              j++;
            }
            importedFiles[fileBaseName] = {
              path: itemPath,
              basename: fileBaseName,
            };
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
          while (
            renamedFolderName in uiFolders ||
            renamedFolderName in importedFolders
          ) {
            renamedFolderName = `${originalFolderName} (${j})`;
            j++;
          }
          importedFolders[renamedFolderName] = {
            path: itemPath,
            "original-basename": originalFolderName,
          };
        }
      }
    }
  }
  if (nonAllowedDuplicateFiles.length > 0) {
    var listElements = showItemsAsListBootbox(nonAllowedDuplicateFiles);
    Swal.fire({
      icon: "warning",
      html:
        "The following files are already imported into the current location of your dataset: <p><ul>" +
        listElements +
        "</ul></p>",
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
      listItems(myPath, "#items");
      getInFolder(
        ".single-item",
        "#items",
        organizeDSglobalPath,
        datasetStructureJSONObj
      );
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
    }
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
      listItems(myPath, "#items");
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
      listItems(myPath, "#items");
      getInFolder(
        ".single-item",
        "#items",
        organizeDSglobalPath,
        datasetStructureJSONObj
      );
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
    }
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
  //console.log(event_list);

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

function listItems(jsonObj, uiItem) {
  var appendString = "";
  var sortedObj = sortObjByKeys(jsonObj);

  for (var item in sortedObj["folders"]) {
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

    appendString =
      appendString +
      '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol' +
      emptyFolder +
      '"></h1><div class="folder_desc' +
      cloud_item +
      '">' +
      item +
      "</div></div>";
  }
  for (var item in sortedObj["files"]) {
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

    appendString =
      appendString +
      '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
      extension +
      '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
      cloud_item +
      '">' +
      item +
      "</div></div>";
  }

  $(uiItem).empty();
  $(uiItem).html(appendString);

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

function getInFolder(singleUIItem, uiItem, currentLocation, globalObj) {
  $(singleUIItem).dblclick(function () {
    if ($(this).children("h1").hasClass("myFol")) {
      var folderName = this.innerText;
      var appendString = "";
      currentLocation.value = currentLocation.value + folderName + "/";

      var currentPath = currentLocation.value;
      var jsonPathArray = currentPath.split("/");
      var filtered = jsonPathArray.slice(1).filter(function (el) {
        return el.trim() != "";
      });
      var myPath = getRecursivePath(filtered, globalObj);
      var appendString = loadFileFolder(myPath);

      $(uiItem).empty();
      $(uiItem).html(appendString);
      organizeLandingUIEffect();

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath, uiItem);
      getInFolder(singleUIItem, uiItem, currentLocation, globalObj);
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
  (event, filepath) => {
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
              .placeholder
          );
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
                  document.getElementById(
                    "input-destination-getting-started-locally"
                  ).placeholder = "Browse here";
                  sodaJSONObj["starting-point"]["local-path"] = "";
                  $("#para-continue-location-dataset-getting-started").text("");
                  return;
                }
                sodaJSONObj["starting-point"]["local-path"] = filepath[0];
                let root_folder_path = $(
                  "#input-destination-getting-started-locally"
                ).attr("placeholder");
                create_json_object(action, sodaJSONObj, root_folder_path);
                datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
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
              });
            } else {
              action = "";
              sodaJSONObj["starting-point"]["local-path"] = filepath[0];
              let root_folder_path = $(
                "#input-destination-getting-started-locally"
              ).attr("placeholder");
              create_json_object(action, sodaJSONObj, root_folder_path);
              datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
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
    $("#sidebarCollapse").prop("disabled", true);

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

    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "Please wait while we verify a few things...";

    if (dataset_destination == "Pennsieve") {
      let supplementary_checks = await run_pre_flight_checks(false);
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }
    }

    //  from here you can modify
    document.getElementById("para-please-wait-new-curate").innerHTML =
      "Please wait...";
    document.getElementById(
      "para-new-curate-progress-bar-error-status"
    ).innerHTML = "";
    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "";
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

    client.invoke(
      "api_check_empty_files_folders",
      sodaJSONObj,
      (error, res) => {
        if (error) {
          var emessage = userError(error);
          document.getElementById(
            "para-new-curate-progress-bar-error-status"
          ).innerHTML =
            "<span style='color: red;'> Error: " + emessage + "</span>";
          document.getElementById("para-please-wait-new-curate").innerHTML = "";
          console.error(error);
          $("#sidebarCollapse").prop("disabled", false);
        } else {
          document.getElementById("para-please-wait-new-curate").innerHTML =
            "Please wait...";
          log.info("Continue with curate");
          var message = "";
          error_files = res[0];
          error_folders = res[1];

          if (error_files.length > 0) {
            var error_message_files =
              backend_to_frontend_warning_message(error_files);
            message += error_message_files;
          }

          if (error_folders.length > 0) {
            var error_message_folders =
              backend_to_frontend_warning_message(error_folders);
            message += error_message_folders;
          }

          if (message) {
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
                console.log("Stop");
                $("#sidebarCollapse").prop("disabled", false);
                document.getElementById(
                  "para-please-wait-new-curate"
                ).innerHTML = "Return to make changes";
                document.getElementById("div-generate-comeback").style.display =
                  "flex";
              }
            });
          } else {
            initiate_generate();
          }
        }
      }
    );
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

let file_counter = 0;
let folder_counter = 0;

function initiate_generate() {
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  document.getElementById("para-new-curate-progress-bar-status").innerHTML =
    "Preparing files ...";
  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "block";
  document.getElementById("div-generate-comeback").style.display = "none";

  if ("manifest-files" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["manifest-files"]) {
      if (sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
        manifest_files_requested = true;
        delete_imported_manifest();
      }
    }
  }

  let dataset_name = "";
  let dataset_destination = "";
  // let dataset_id = ""

  if ("bf-dataset-selected" in sodaJSONObj) {
    dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    dataset_destination = "Pennsieve";
    // console.log(sodaJSONObj["bf-dataset-selected"])
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

  // prevent_sleep_id = electron.powerSaveBlocker.start('prevent-display-sleep')

  client.invoke("api_main_curate_function", sodaJSONObj, (error, res) => {
    if (error) {
      $("#sidebarCollapse").prop("disabled", false);
      var emessage = userError(error);
      document.getElementById(
        "para-new-curate-progress-bar-error-status"
      ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
      document.getElementById("para-new-curate-progress-bar-status").innerHTML =
        "";
      document.getElementById("div-new-curate-progress").style.display = "none";
      generateProgressBar.value = 0;
      log.error(error);
      console.error(error);
      // forceActionSidebar('show');

      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.PREFIX,
        [],
        determineDatasetLocation()
      );

      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 7", "Generate", "dataset", `${dataset_destination}`],
        determineDatasetLocation()
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      ipcRenderer.send(
        "track-event",
        "Error",
        "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
        "Size",
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
        main_total_generate_dataset_size
      );

      // get dataset id if available
      let datasetLocation = determineDatasetLocation();
      ipcRenderer.send(
        "track-event",
        "Error",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
        "Number of Files",
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        file_counter
      );

      client.invoke(
        "api_bf_dataset_account",
        defaultBfAccount,
        (error, result) => {
          if (error) {
            log.error(error);
            console.log(error);
            var emessage = error;
          } else {
            datasetList = [];
            datasetList = result;
          }
        }
      );
    } else {
      main_total_generate_dataset_size = res[1];
      $("#sidebarCollapse").prop("disabled", false);
      log.info("Completed curate function");
      console.log("Completed curate function");
      if (manifest_files_requested) {
        let high_level_folder_num = 0;
        if ("dataset-structure" in sodaJSONObj) {
          if ("folders" in sodaJSONObj["dataset-structure"]) {
            for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
              high_level_folder_num += 1;
            }
          }
        }

        // get dataset id if available
        let datasetLocation = determineDatasetLocation();
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest",
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          high_level_folder_num
        );

        ipcRenderer.send(
          "track-event",
          "Success",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest - ${dataset_destination}`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          high_level_folder_num
        );
      }

      if (dataset_destination == "Pennsieve") {
        show_curation_shortcut();
      }

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      logCurationForAnalytics(
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.PREFIX,
        [],
        determineDatasetLocation()
      );

      if (dataset_destination === "Local") {
        // log the dataset name as a label. Rationale: Easier to get all unique datasets touched when keeping track of the local dataset's name upon creation in a log.
        let datasetName = document.querySelector("#inputNewNameDataset").value;
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Local",
          datasetName
        );
      }

      // for tracking the total size of all datasets ever created on SODA
      ipcRenderer.send(
        "track-event",
        "Success",
        "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
        "Size",
        main_total_generate_dataset_size
      );

      logCurationForAnalytics(
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 7", "Generate", "Dataset", `${dataset_destination}`],
        determineDatasetLocation()
      );

      let datasetLocation = determineDatasetLocation();
      // for tracking the total size of all the "saved", "new", "Pennsieve", "local" datasets by category
      ipcRenderer.send(
        "track-event",
        "Success",
        "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        main_total_generate_dataset_size
      );

      // tracks the total size of datasets that have been generated to Pennsieve and on the user machine
      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        main_total_generate_dataset_size
      );

      // track amount of files for all datasets
      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
        "Number of Files",
        file_counter
      );

      // track amount of files for datasets by ID or Local
      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        file_counter
      );

      // log the preview card instructions for any files and folders being generated on Pennsieve
      Array.from(document.querySelectorAll(".generate-preview")).forEach(
        (card) => {
          let header = card.querySelector("h5");
          if (header.textContent.includes("folders")) {
            let instruction = card.querySelector("p");
            // log the folder instructions to analytics
            ipcRenderer.send(
              "track-event",
              "Success",
              `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent}`,
              datasetLocation === "Pennsieve"
                ? defaultBfDatasetId
                : datasetLocation,
              1
            );
          } else if (header.textContent.includes("existing files")) {
            let instruction = card.querySelector("p");
            ipcRenderer.send(
              "track-event",
              "Success",
              `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent} `,
              datasetLocation === "Pennsieve"
                ? defaultBfDatasetId
                : datasetLocation,
              1
            );
          }
        }
      );

      client.invoke(
        "api_bf_dataset_account",
        defaultBfAccount,
        (error, result) => {
          if (error) {
            log.error(error);
            console.log(error);
            var emessage = error;
          } else {
            datasetList = [];
            datasetList = result;
          }
        }
      );
    }
    document.getElementById("div-generate-comeback").style.display = "flex";
  });

  // Progress tracking function for main curate
  var countDone = 0;
  var timerProgress = setInterval(main_progressfunction, 1000);
  function main_progressfunction() {
    client.invoke("api_main_curate_function_progress", (error, res) => {
      if (error) {
        var emessage = userError(error);
        document.getElementById(
          "para-new-curate-progress-bar-error-status"
        ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
        log.error(error);
        console.error(error);
      } else {
        main_curate_status = res[0];
        var start_generate = res[1];
        var main_curate_progress_message = res[2];
        main_total_generate_dataset_size = res[3];
        var main_generated_dataset_size = res[4];
        var elapsed_time_formatted = res[5];

        //console.log(`Data transferred (bytes): ${main_generated_dataset_size}`);

        if (start_generate === 1) {
          divGenerateProgressBar.style.display = "block";
          if (main_curate_progress_message.includes("Success: COMPLETED!")) {
            generateProgressBar.value = 100;
            document.getElementById(
              "para-new-curate-progress-bar-status"
            ).innerHTML = main_curate_status + smileyCan;
          } else {
            var value =
              (main_generated_dataset_size / main_total_generate_dataset_size) *
              100;
            generateProgressBar.value = value;
            if (main_total_generate_dataset_size < displaySize) {
              var totalSizePrint =
                main_total_generate_dataset_size.toFixed(2) + " B";
            } else if (
              main_total_generate_dataset_size <
              displaySize * displaySize
            ) {
              var totalSizePrint =
                (main_total_generate_dataset_size / displaySize).toFixed(2) +
                " KB";
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
            progressMessage += main_curate_progress_message + "<br>";
            progressMessage +=
              "Progress: " +
              value.toFixed(2) +
              "%" +
              " (total size: " +
              totalSizePrint +
              ") " +
              "<br>";
            progressMessage +=
              "Elaspsed time: " + elapsed_time_formatted + "<br>";
            document.getElementById(
              "para-new-curate-progress-bar-status"
            ).innerHTML = progressMessage;
          }
        } else {
          document.getElementById(
            "para-new-curate-progress-bar-status"
          ).innerHTML =
            main_curate_progress_message +
            "<br>" +
            "Elapsed time: " +
            elapsed_time_formatted +
            "<br>";
        }
      }
    });

    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      countDone++;
      if (countDone > 1) {
        log.info("Done curate track");
        console.log("Done curate track");
        // then show the sidebar again
        // forceActionSidebar("show");
        clearInterval(timerProgress);
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    }
  }
}

const show_curation_shortcut = () => {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "No. I'll do it later",
    confirmButtonText: "Yes, I want to share it",
    heightAuto: false,
    icon: "success",
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

var bf_request_and_populate_dataset = (sodaJSONObj) => {
  return new Promise((resolve, reject) => {
    client.invoke(
      "api_bf_get_dataset_files_folders",
      sodaJSONObj,
      (error, res) => {
        if (error) {
          reject(userError(error));
          log.error(error);
          console.error(error);
          ipcRenderer.send(
            "track-event",
            "Error",
            "Retrieve Dataset - Pennsieve",
            defaultBfDatasetId
          );
        } else {
          resolve(res);
          ipcRenderer.send(
            "track-event",
            "Success",
            "Retrieve Dataset - Pennsieve",
            defaultBfDatasetId
          );
        }
      }
    );
  });
};

// When mode = "update", the buttons won't be hidden or shown to prevent button flickering effect
const curation_consortium_check = (mode = "") => {
  let selected_account = defaultBfAccount;
  let selected_dataset = defaultBfDataset;

  $(".spinner.post-curation").show();
  $("#curation-team-unshare-btn").hide();
  $("#sparc-consortium-unshare-btn").hide();
  $("#curation-team-share-btn").hide();
  $("#sparc-consortium-share-btn").hide();

  client.invoke("api_bf_account_details", selected_account, (error, res) => {
    $(".spinner.post-curation").show();
    if (error) {
      log.error(error);
      console.error(error);

      if (mode != "update") {
        $("#curation-team-unshare-btn").hide();
        $("#sparc-consortium-unshare-btn").hide();
        $("#curation-team-share-btn").hide();
        $("#sparc-consortium-share-btn").hide();
      }

      $(".spinner.post-curation").hide();
    } else {
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
        client.invoke(
          "api_bf_get_permission",
          selected_account,
          selected_dataset,
          (error, res) => {
            $(".spinner.post-curation").show();
            if (error) {
              log.error(error);
              console.error(error);
              if (mode != "update") {
                $("#current_curation_team_status").text("None");
                $("#current_sparc_consortium_status").text("None");
              }
              $(".spinner.post-curation").hide();
            } else {
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
                if (
                  permission.search("SPARC Embargoed Data Sharing Group") != -1
                ) {
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

              client.invoke(
                "api_bf_get_dataset_status",
                defaultBfAccount,
                defaultBfDataset,
                (error, res) => {
                  $(".spinner.post-curation").show();
                  if (error) {
                    log.error(error);
                    console.error(error);
                    $("#current_curation_team_status").text("None");
                    $("#current_sparc_consortium_status").text("None");
                    $(".spinner.post-curation").hide();
                  } else {
                    let dataset_status_value = res[1];
                    let dataset_status = parseInt(
                      dataset_status_value.substring(0, 2)
                    );
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
                  }
                }
              );
            }
          }
        );
      }
    }
  });
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

ipcRenderer.on("selected-manifest-folder", (event, result) => {
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

    client.invoke(
      "api_generate_manifest_file_locally",
      temp_sodaJSONObj,
      (error, res) => {
        if (error) {
          var emessage = userError(error);
          log.error(error);
          console.error(error);
          $("body").removeClass("waiting");

          // log the error to analytics
          logCurationForAnalytics(
            "Error",
            PrepareDatasetsAnalyticsPrefix.CURATE,
            AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
            ["Step 5", "Generate", "Manifest"],
            determineDatasetLocation()
          );
        } else {
          $("body").removeClass("waiting");
          logCurationForAnalytics(
            "Success",
            PrepareDatasetsAnalyticsPrefix.CURATE,
            AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
            ["Step 5", "Generate", "Manifest"],
            determineDatasetLocation()
          );
        }
      }
    );
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
      tippy("[data-tippy-content]", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
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

function addBFAccountInsideSweetalert(myBootboxDialog) {
  var name = $("#bootbox-key-name").val();
  var apiKey = $("#bootbox-api-key").val();
  var apiSecret = $("#bootbox-api-secret").val();
  client.invoke(
    "api_bf_add_account_api_key",
    name,
    apiKey,
    apiSecret,
    (error, res) => {
      if (error) {
        Swal.fire({
          icon: "error",
          html: "<span>" + error + "</span>",
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
        }).then((result) => {
          if (result.isConfirmed) {
            showBFAddAccountSweetalert();
          }
        });
        log.error(error);
        console.error(error);
      } else {
        $("#bootbox-key-name").val("");
        $("#bootbox-api-key").val("");
        $("#bootbox-api-secret").val("");
        bfAccountOptions[name] = name;
        defaultBfAccount = name;
        defaultBfDataset = "Select dataset";
        client.invoke("api_bf_account_details", name, (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
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
          } else {
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
          }
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
      }
    }
  );
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

function determineDatasetLocation() {
  let location = "";

  if ("starting-point" in sodaJSONObj) {
    // determine if the local dataset was saved or brought imported
    if ("type" in sodaJSONObj["starting-point"]) {
      //if save-progress exists then the user is curating a previously saved dataset
      if ("save-progress" in sodaJSONObj) {
        location = Destinations.SAVED;
        return location;
      } else {
        location = sodaJSONObj["starting-point"]["type"];
        // bf === blackfynn the old name for Pennsieve; bf means dataset was imported from Pennsieve
        if (location === "bf") {
          return Destinations.PENNSIEVE;
        } else if (location === "local") {
          // imported from the user's machine
          return Destinations.LOCAL;
        } else {
          // if none of the above then the dataset is new
          return Destinations.NEW;
        }
      }
    }
  }

  // determine if we are using a local or Pennsieve dataset
  if ("bf-dataset-selected" in sodaJSONObj) {
    location = Destinations.PENNSIEVE;
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      location = sodaJSONObj["generate-dataset"]["destination"];
      if (location.toUpperCase() === "LOCAL") {
        location = Destinations.LOCAL;
      } else if (location.toUpperCase() === "PENNSIEVE") {
        location = Destinations.SAVED;
      }
    }
  }

  return location;
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

/*
******************************************************
******************************************************
Pennsieve Authentication Section With Nodejs
******************************************************
******************************************************
*/

// Purpose: Functions that take a user through the authentication flow for the Pennsieve APIs.

// retrieve the aws cognito configuration data for authenticating a user with their API key and secret using a Password Auth flow.
const get_cognito_config = async () => {
  const PENNSIEVE_URL = "https://api.pennsieve.io";
  let cognitoConfigResponse;
  try {
    cognitoConfigResponse = await fetch(
      `${PENNSIEVE_URL}/authentication/cognito-config`
    );
  } catch (e) {
    // network error
    throw e;
  }

  // check that there weren't any unexpected errors
  let statusCode = cognitoConfigResponse.status;
  if (statusCode === 404) {
    throw new Error(
      `${cognitoConfigResponse.status} - Resource for authenticating not found.`
    );
  } else if (statusCode !== 200) {
    // something unexpected happened with the request
    let statusText = await cognitoConfigResponse.json().statusText;
    throw new Error(`${cognitoConfigResponse.status} - ${statusText}`);
  }

  let cognitoConfigData = await cognitoConfigResponse.json();
  return cognitoConfigData;
};

// read the .ini file for the current user's api key and secret
// the .ini file is where the current user's information is stored - such as their API key and secret
const get_api_key_and_secret_from_ini = () => {
  // get the path to the configuration file
  const config_path = path.join(
    app.getPath("home"),
    ".pennsieve",
    "config.ini"
  );
  let config;

  // check that the user's configuration file exists
  if (!fs.existsSync(config_path)) {
    throw new Error(
      "Error: Could not read information. No configuration file."
    );
  }

  try {
    // initialize the ini reader
    config = ini.parse(fs.readFileSync(`${config_path}`, "utf-8"));
  } catch (e) {
    throw e;
  }

  // check that an api key and secret does ot exist
  if (
    !config["SODA-Pennsieve"]["api_secret"] ||
    !config["SODA-Pennsieve"]["api_token"]
  ) {
    // throw an error
    throw new Error(
      "Error: User must connect their Pennsieve account to SODA in order to access this feature."
    );
  }

  // return the user's api key and secret
  const { api_token, api_secret } = config["SODA-Pennsieve"];
  return { api_token, api_secret };
};

// authenticate a user with api key and api secret
// this step is to validate that a user is who they say they are
const authenticate_with_cognito = async (
  cognitoConfigurationData,
  usernameOrApiKey,
  passwordOrSecret
) => {
  let cognito_app_client_id =
    cognitoConfigurationData["tokenPool"]["appClientId"];
  let cognito_pool_id = cognitoConfigurationData["tokenPool"]["id"];

  var authParams = {
    Username: `${usernameOrApiKey}`,
    Password: `${passwordOrSecret}`,
  };

  var authenticationDetails = new cognitoClient.AuthenticationDetails(
    authParams
  );

  var poolData = {
    UserPoolId: cognito_pool_id,
    ClientId: cognito_app_client_id, // Your client id here
  };

  var userPool = new cognitoClient.CognitoUserPool(poolData);

  var userData = {
    Username: `${usernameOrApiKey}`,
    Pool: userPool,
  };

  var cognitoUser = new cognitoClient.CognitoUser(userData);

  // tell the cognito user object to login using a user password flow
  cognitoUser.setAuthenticationFlowType("USER_PASSWORD_AUTH");

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
};

// get the currnet Pennsieve user's access token -- this is used before every request to Pennsieve APIs as a bearer token
const get_access_token = async () => {
  // read the current user's ini file and get back their api key and secret
  let userInformation;
  try {
    userInformation = get_api_key_and_secret_from_ini();
  } catch (e) {
    throw e;
  }

  // get the cognito configuration data for the given user
  let configData;
  try {
    configData = await get_cognito_config();
  } catch (e) {
    throw e;
  }

  // get the access token from the cognito service for this user using the api key and secret for the current user
  let cognitoResponse;
  let { api_token, api_secret } = userInformation;
  try {
    cognitoResponse = await authenticate_with_cognito(
      configData,
      api_token,
      api_secret
    );
  } catch (e) {
    throw e;
  }

  if (!cognitoResponse["accessToken"]["jwtToken"])
    throw new Error("Error: No access token available for this user.");

  return cognitoResponse["accessToken"]["jwtToken"];
};

// get_access_token().then((res) => console.log(res));

/*
******************************************************
******************************************************
Manage Datasets Tag Section With Nodejs
******************************************************
******************************************************
*/

// to be used with an authenticated user that has a valid access token
// Inputs:
//    dataset_id_or_name: string
//    jwt: string  (a valid JWT acquired from get_access_token)
const get_dataset_by_name_id = async (dataset_id_or_Name, jwt = undefined) => {
  // a name on the Pennsieve side is not made unqiue by " ","-", or "_" so remove them
  function name_key(n) {
    return n
      .toLowerCase()
      .trim()
      .replace(" ", "")
      .replace("_", "")
      .replace("-", "");
  }

  let search_key = name_key(dataset_id_or_Name);

  // a way to check if the given dataset's name or id matches one on the Pennsieve side
  function is_match(ds) {
    return name_key(ds.name) == search_key || ds.id == dataset_id_or_Name;
  }

  // get the all of datasets from Pennsieve that the user has access to in their organization
  let datasets_response;

  try {
    datasets_response = await fetch("https://api.pennsieve.io/datasets", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwt}`,
      },
    });
  } catch (e) {
    // network error
    throw e;
  }

  // check the status codes
  let statusCode = datasets_response.status;
  if (statusCode == 401) {
    throw new Error(
      `${statusCode} - Please authenticate before accessing this resource by connecting your Pennsieve account to SODA.`
    );
  } else if (statusCode === 403) {
    throw new Error(`${statusCode} - You do not have access to this dataset.`);
  } else if (statusCode !== 200) {
    // something unexpected
    let statusText = await datasets_response.json().statusText;
    throw new Error(`${statusCode} - ${statusText}`);
  }

  // valid datasets result
  let datasets = await datasets_response.json();

  // search through the datasets for a match
  let matches = [];
  for (const dataset of datasets) {
    if (is_match(dataset["content"])) matches.push(dataset);
  }

  // check if there is no matching dataset
  if (!matches.length) {
    // could not find the dataset that matches the user's requested id/name
    throw new Error(
      `The dataset identified as ${dataset_id_or_Name} does not exist.`
    );
  }

  // return the first match
  return matches[0];
};

/*
******************************************************
******************************************************
Manage Datasets Add/Edit Tags Section With Nodejs
******************************************************
******************************************************
*/

// get the tags from the Pennsieve API for a particular dataset
// Inputs:
//    dataset_id_or_name: string
// Outputs:
//     tags: string[]
const get_dataset_tags = async (dataset_id_or_name) => {
  if (dataset_id_or_name === "" || dataset_id_or_name === undefined) {
    throw new Error("Error: Must provide a valid dataset to pull tags from.");
  }

  // get the access token so the user can access the Pennsieve api
  let jwt = await get_access_token();

  // fetch the tags for their dataset using the Pennsieve API
  let dataset = await get_dataset_by_name_id(dataset_id_or_name, jwt);

  // get the tags out of the dataset
  const { tags } = dataset["content"];

  // return the tags
  return tags;
};

// update the tags for a given dataset using the Pennsieve API
// Inputs:
//    dataset_id_or_name: string
//    tags: string[]
//    jwt: string (gathered from get_access_token)
const update_dataset_tags = async (datasetIdOrName, tags) => {
  if (datasetIdOrName === "" || datasetIdOrName === undefined) {
    throw new Error("Must provide a valid dataset to pull tags from.");
  }
  // authenticate the user
  let jwt = await get_access_token();

  // fetch the tags for their dataset using the Pennsieve API
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // check if the user has permission to edit this dataset
  let role = await getCurrentUserPermissions(datasetIdOrName);

  if (!userIsOwnerOrManager(role)) {
    throw new Error(
      "You don't have permissions for editing metadata on this Pennsieve dataset"
    );
  }

  // grab the dataset's id
  const id = dataset["content"]["id"];

  // setup the request options
  let options = {
    method: "PUT",
    headers: {
      Accept: "*/*",
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tags: tags }),
  };

  // update the the user's tags
  let updateResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}`,
    options
  );

  // Check status codes and respond accordingly
  let statusCode = updateResponse.status;
  if (statusCode === 404) {
    throw new Error(
      `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset.`
    );
  } else if (statusCode === 401) {
    throw new Error(
      `${statusCode} - You cannot update dataset tags while unauthenticated. Please reauthenticate then try again.`
    );
  } else if (statusCode === 403) {
    throw new Error(`${statusCode} - You do not have access to this dataset.`);
  } else if (statusCode !== 200) {
    // something unexpected happened
    let statusText = await updateResponse.json().statusText;
    throw new Error(`${statusCode} - ${statusText}`);
  }
};

/*
******************************************************
******************************************************
Manage Datasets Add/Edit Description Section With Nodejs
******************************************************
******************************************************
*/

// returns the readme of a dataset.
// I: dataset_name_or_id : string
// O: a dataset description as a string
const getDatasetReadme = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error("Error: Must provide a valid dataset to pull tags from.");
  }
  // get the user's access token
  let jwt = await get_access_token();

  // get the dataset
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // pull out the id from the result
  const id = dataset["content"]["id"];

  // fetch the readme file from the Pennsieve API at the readme endpoint (this is because the description is the subtitle not readme )
  let readmeResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/readme`,
    {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    }
  );

  // get the status code out of the response
  let statusCode = readmeResponse.status;

  // check the status code of the response
  switch (statusCode) {
    case 200:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot get the dataset readme while unauthenticated. Please reauthenticate and try again.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );

    default:
      // something unexpected happened
      let statusText = await readmeResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }

  // grab the readme out of the response
  let { readme } = await readmeResponse.json();

  return readme;
};

const updateDatasetReadme = async (datasetIdOrName, updatedReadme) => {
  if (datasetIdOrName === "" || datasetIdOrName === undefined) {
    throw new Error(
      "Must provide a valid dataset to get the metadata description."
    );
  }

  // get the user's permissions
  let role = await getCurrentUserPermissions(datasetIdOrName);

  // check if the user permissions do not include "owner" or "manager"
  if (!userIsOwnerOrManager(role)) {
    // throw a permission error: "You don't have permissions for editing metadata on this Pennsieve dataset"
    throw new Error(
      "You don't have permissions for editing metadata on this Pennsieve dataset"
    );
  }

  // get access token for the current user
  let jwt = await get_access_token();

  // get the dataset the user wants to edit
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // get the id out of the dataset
  let id = dataset.content.id;

  // put the new readme data in the readme on Pennsieve
  options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ readme: updatedReadme.trim() }),
  };

  let readmeResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/readme`,
    options
  );

  // get the status code out of the response
  let statusCode = readmeResponse.status;

  // check the status code of the response
  switch (statusCode) {
    case 200:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The selected dataset cannot be found. Please select a valid dataset.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot update the dataset description while unauthenticated. Please reauthenticate and try again.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );

    default:
      // something unexpected happened
      let statusText = await readmeResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }
};

/*
******************************************************
******************************************************
Dissemniate Datasets Submit dataset for pre-publishing
******************************************************
******************************************************
*/

// I: The currently selected dataset - name or by id
// O: A status object that details the state of each pre-publishing checklist item for the given dataset and user
//   {subtitle: boolean, description: boolean, tags: boolean, bannerImageURL: boolean, license: boolean, ORCID: boolean}
const getPrepublishingChecklistStatuses = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to log status of pre-publishing checklist items from."
    );
  }

  // get the dataset
  let jwt = await get_access_token();

  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // construct the statuses object
  const statuses = {};

  // get the description - aka subtitle (unfortunate naming), tags, banner image URL, collaborators, and license
  const { description, tags, license } = dataset["content"];

  // set the subtitle's status
  statuses.subtitle = description && description.length ? true : false;

  // get the readme
  const readme = await getDatasetReadme(datasetIdOrName);

  // set the readme's status
  statuses.readme = readme && readme.length >= 1 ? true : false;

  // set tags's status
  statuses.tags = tags && tags.length ? true : false;

  // get the banner url
  const bannerPresignedUrl = await getDatasetBannerImageURL(datasetIdOrName);

  // set the banner image's url status
  statuses.bannerImageURL =
    bannerPresignedUrl && bannerPresignedUrl.length ? true : false;

  // set the license's status
  statuses.license = license && license.length ? true : false;

  // check if the user is the owner of the dataset
  let owner = await userIsDatasetOwner(datasetIdOrName);

  // declare the orcidId
  let orcidId;

  // check if the user is the owner
  if (owner) {
    // get the user's information
    let user = await getUserInformation();

    // get the orcid object out of the user information
    let orcidObject = user.orcid;

    // check if the owner has an orcid id
    if (orcidObject) {
      orcidId = orcidObject.orcid;
    } else {
      orcidId = undefined;
    }
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

  // create the publication request options
  const options = {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

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
  let publicationResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/publication/request` + queryString,
    options
  );

  // get the status code out of the response
  let statusCode = publicationResponse.status;

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
      let statusText = await publicationResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }
};

// Withdraw any dataset from a pre-publishing review submission
// I:
//  datasetIdOrName: string - the id/name of the dataset being submitted for publication
//  hasEmbargo: boolean - True when the dataset was submotted for publishing under embargo, false otherwise
//  O:
//    void
const withdrawDatasetReviewSubmission = async (datasetIdOrName) => {
  // ensure a valid dataset ir or name has been passed in
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error("A valid dataset must be provided");
  }

  // get the current SODA user's permissions (permissions are indicated by the user's assigned role for a given dataset)
  let userRole = await getCurrentUserPermissions(datasetIdOrName);

  // check that the current SODA user is the owner of the given dataset
  if (!userIsOwnerOrManager(userRole))
    throw new Error(
      "You don't have permissions for withdrawing this dataset from publication. Please have the dataset owner withdraw the dataset."
    );

  // get the dataset id
  let jwt = await get_access_token();

  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  let { id } = dataset.content;

  // create the api call options
  const options = {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  // construct the appropriate query string
  let queryString = "";

  // get the publication type
  let publicationType = dataset.publication.type;

  // if an embargo release date was selected add it to the query string
  if (publicationType === "embargo") {
    queryString = `?publicationType=embargo`;
  } else {
    // add the required publication type
    queryString = `?publicationType=publication`;
  }

  let withdrawResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/publication/cancel${queryString}`,
    options
  );

  // get the status code out of the response
  let statusCode = withdrawResponse.status;

  // check the status code of the response
  switch (statusCode) {
    case 201:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset to withdraw from publication.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot withdraw a dataset from publication while unauthenticated.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );
    default:
      // something unexpected happened
      let statusText = await withdrawResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }
};

/*
******************************************************
******************************************************
Manage Datasets Add/Edit Subtitle Section With Nodejs
******************************************************
******************************************************
*/

const getDatasetSubtitle = async (datasetIdOrName) => {
  // check that a dataset name or id is provided
  if (!datasetIdOrName) {
    throw new Error("Error: Must provide a valid dataset to pull tags from.");
  }

  // get the current user's access token
  let jwt = await get_access_token();

  // get the dataset
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // get the dataset subtitle from the dataset content
  let subtitle = dataset["content"]["description"];

  return subtitle;
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

  // get an access token
  let jwt = await get_access_token();

  // get the dataset to get the id
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  let { id } = dataset["content"];

  // fetch the banner url from the Pennsieve API at the readme endpoint (this is because the description is the subtitle not readme )
  let bannerResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/banner`,
    {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    }
  );

  // get the status code out of the response
  let statusCode = bannerResponse.status;

  // check the status code of the response
  switch (statusCode) {
    case 200:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset to look at the banner image.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot get the dataset banner image without being authenticated. Please reauthenticate and try again.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );

    default:
      // something unexpected happened
      let statusText = await bannerResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }

  let { banner } = await bannerResponse.json();

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
  let permissionsResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/role`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );

  // get the status code out of the response
  let statusCode = permissionsResponse.status;

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
      let statusText = await permissionsResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }

  // get the permissions object
  const { role } = await permissionsResponse.json();

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
  let role = await getCurrentUserPermissions(datasetIdOrName);

  return userIsOwner(role);
};

/*
******************************************************
******************************************************
Get User Information With Nodejs
******************************************************
******************************************************
*/

const getUserInformation = async () => {
  // get the access token
  let jwt = await get_access_token();

  // get the user information
  let userResponse = await fetch("https://api.pennsieve.io/user/", {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  let statusCode = userResponse.status;

  switch (statusCode) {
    case 200:
      break;
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this user information. `
      );
    case 401:
      throw new Error(
        `${statusCode} - Reauthenticate to access this user information. `
      );
    case 404:
      throw new Error(`${statusCode} - Resource could not be found. `);
    default:
      // something unexpected happened
      let pennsieveErrorObject = await userResponse.json();
      let { message } = pennsieveErrorObject;
      throw new Error(`${statusCode} - ${message}`);
  }

  let user = await userResponse.json();

  return user;
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
  let connectOrcidResponse = await fetch(
    "https://api.pennsieve.io/user/orcid",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ authorizationCode: accessCode }),
    }
  );

  // get the status code
  let statusCode = connectOrcidResponse.status;

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
      let statusText = await connectOrcidResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }
};

/*
******************************************************
******************************************************
Get User's Excluded Files with NodeJS
******************************************************
******************************************************
*/

const getFilesExcludedFromPublishing = async (datasetIdOrName) => {
  // check a valid dataset was provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to check permissions for."
    );
  }

  // get the access token
  let jwt = await get_access_token();

  // get the dataset
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // peel out the id
  let { id } = dataset.content;

  // get the excluded files
  let excludedFilesResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/ignore-files`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );

  // get the status code
  let statusCode = excludedFilesResponse.status;

  // check the status code and respond appropriately
  switch (statusCode) {
    case 200:
      break;
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );
    case 401:
      throw new Error(
        `${statusCode} - Reauthenticate to access this dataset. `
      );
    case 404:
      throw new Error(`${statusCode} - Dataset could not be found. `);
    default:
      // something unexpected happened
      let pennsieveErrorObject = await excludedFilesResponse.json();
      let { message } = pennsieveErrorObject;
      throw new Error(`${statusCode} - ${message}`);
  }

  // get the ignored files array
  let { ignoreFiles } = await excludedFilesResponse.json();

  // return the ignored files
  return ignoreFiles;
};

// tell Pennsieve to ignore a set of user selected files when publishing their dataset.
// this keeps those files hidden from the public but visible to publishers and collaboraors.
// I:
//  datasetIdOrName: string - A dataset id or name
//  files: [{fileName: string}] - An array of file name objects
const updateDatasetExcludedFiles = async (datasetIdOrName, files) => {
  // ensure a valid datasetIDOrName is passed in
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to check permissions for."
    );
  }

  // get the dataset ID
  let jwt = await get_access_token();
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);
  let { id } = dataset.content;

  // create the request options
  const options = {
    method: "PUT",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(files),
  };

  // create the request
  let excludeFilesResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/ignore-files`,
    options
  );

  // check the status code
  let { status } = excludeFilesResponse;
  switch (status) {
    //  200 is success do nothing
    case 200:
      break;

    // 403 is forbidden from modifying this resource
    case 403:
      throw new Error(
        `${status} - You are forbidden from accessing this resouce.`
      );

    // 401 is unauthenticated
    case 401:
      throw new Error(
        `${status} - Not authenticated. Please reauthenticate to access this dataset.`
      );

    // else a 400 of some kind or a 500 as default
    default:
      let pennsieveErrorObject = await excludeFilesResponse.json();
      let { message } = pennsieveErrorObject;
      throw new Error(`${status} - ${message}`);
  }

  return;
};

// retrieves the currently selected dataset's metadata files
// I:
//  datasetIdOrName: string - A dataset id or name
const getDatasetMetadataFiles = async (datasetIdOrName) => {
  // check that the datasetIDOrName is provided
  if (!datasetIdOrName || datasetIdOrName === "") {
    throw new Error(
      "Error: Must provide a valid dataset to check permissions for."
    );
  }

  // get the dataset id
  let jwt = await get_access_token();
  let dataset = await get_dataset_by_name_id(datasetIdOrName, jwt);

  // get the id out of the dataset
  let { id } = dataset.content;

  // get the metadata files for the dataset
  let datasetWithChildrenResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );

  // check the status code
  let { status } = datasetWithChildrenResponse;
  switch (status) {
    //  200 is success do nothing
    case 200:
      break;

    // 403 is forbidden from accessing this resource
    case 403:
      throw new Error(
        `${status} - You are forbidden from accessing this resouce.`
      );

    // 401 is unauthenticated
    case 401:
      throw new Error(
        `${status} - Not authenticated. Please reauthenticate to access this dataset.`
      );

    // else a 400 of some kind or a 500 as default
    default:
      let pennsieveErrorObject = await datasetWithChildrenResponse.json();
      let { message } = pennsieveErrorObject;
      throw new Error(`${status} - ${message}`);
  }

  // get the metadata files from the dataset
  let datasetWithChildren = await datasetWithChildrenResponse.json();

  // get the metadata packages
  let topLevelMetadataPackages = datasetWithChildren.children;

  // traverse the top level metadata packages and pull out -- submission.xlsx, code_description.xlsx, dataset_description.xlsx, outputs_metadata.xlsx,
  // inputs_metadata.xlsx, CHANGES.txt, README.txt, samples.xlsx, subjects.xlsx
  const metadataFiles = topLevelMetadataPackages
    .map((packageObject) => {
      // get the content
      const { content } = packageObject;

      // get the file name
      const { name } = content;
      // return only the name
      return name;
    })
    .filter((fileName) => {
      // return the filenames that match a metadata file name
      if (
        fileName === "submission.xlsx" ||
        fileName === "code_description.xlsx" ||
        fileName === "dataset_description.xlsx" ||
        fileName === "outputs_metadata.xlsx" ||
        fileName === "inputs_metadata.xlsx" ||
        fileName === "CHANGES.txt" ||
        fileName === "README.txt" ||
        fileName === "samples.xlsx" ||
        fileName === "subjects.xlsx"
      ) {
        return fileName;
      }
    });

  // return the metdata files to the client
  return metadataFiles;
};
