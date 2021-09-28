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

// let introStatus = {
//   organizeStep3: true,
//   // metadataSubjects: true,
// };

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
          text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connect to Pennsieve. Would you like to do it now?",
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

  // reset onboarding show status
  let nodeStorage = new JSONStorage(app.getPath("userData"));
  nodeStorage.setItem("ShowOnboardingOrganizeStep3", true);

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
  "#button-withdraw-review-dataset"
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
var milestoneFileName = "milestones.json";
var airtableConfigFileName = "airtable-config.json";
var protocolConfigFileName = "protocol-config.json";
var awardPath = path.join(metadataPath, awardFileName);
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

var parentDSTagify = new Tagify(parentDSDropdown, {
  enforceWhitelist: true,
  whitelist: [],
  duplicates: false,
  dropdown: {
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});

var completenessInput = document.getElementById("ds-completeness"),
  completenessTagify = new Tagify(completenessInput, {
    whitelist: ["hasChildren", "hasNext"],
    enforceWhitelist: true,
    duplicates: false,
    maxTags: 2,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
    },
  });

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

// Function to add options to dropdown list
function addOption(selectbox, text, value) {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
}

var awardObj = {};
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

// New instance for description editor
const tuiInstance = new Editor({
  el: document.querySelector("#editorSection"),
  initialEditType: "wysiwyg",
  previewStyle: "vertical",
  height: "400px",
  hideModeSwitch: true,
  placeholder: "Add a description here: ",
  toolbarItems: [
    "heading",
    "bold",
    "italic",
    "strike",
    "link",
    "hr",
    "divider",
    "ul",
    "ol",
  ],
});

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
  showPublishingStatus();
}

// upload banner image //
const Cropper = require("cropperjs");
const { default: Swal } = require("sweetalert2");
const { waitForDebugger } = require("inspector");
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

function submitReviewDatasetCheck(res) {
  $("#submit_prepublishing_review-spinner").show();
  var reviewstatus = res[0];
  var publishingStatus = res[1];
  if (publishingStatus === "PUBLISH_IN_PROGRESS") {
    emessage =
      "Your dataset is currently being published. Please wait until it is completed.";
    $("#submit_prepublishing_review-spinner").hide();
  } else if (reviewstatus === "requested") {
    emessage =
      "Your dataset is already under review. Please wait until the Publishers within your organization make a decision.";
    $("#submit_prepublishing_review-spinner").hide();
  } else if (publishingStatus === "PUBLISH_SUCCEEDED") {
    Swal.fire({
      icon: "warning",
      text: "This dataset has already been published. This action will submit the dataset again for review to the Publishers. While under review, the dataset will become locked until it has either been approved or rejected for publication. If accepted a new version of your dataset will be published. Would you like to continue?",
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
    }).then((result) => {
      if (result.isConfirmed) {
        submitReviewDataset();
      } else {
        $("#submit_prepublishing_review-spinner").hide();
      }
    });
  } else {
    // ipcRenderer.send("warning-publish-dataset");
    Swal.fire({
      icon: "warning",
      text: "Your dataset will be submitted for review to the Publishers within your organization. While under review, the dataset will become locked until it has either been approved or rejected for publication. Would you like to continue?",
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
    }).then((result) => {
      if (result.isConfirmed) {
        submitReviewDataset();
      } else {
        $("#submit_prepublishing_review-spinner").hide();
      }
    });
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

function submitReviewDataset() {
  $("#para-submit_prepublishing_review-status").text("");
  bfRefreshPublishingDatasetStatusBtn.disabled = true;
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;
  client.invoke(
    "api_bf_submit_review_dataset",
    selectedBfAccount,
    selectedBfDataset,
    (error, res) => {
      if (error) {
        ipcRenderer.send(
          "track-event",
          "Error",
          "Disseminate Dataset - Pre-publishing Review",
          selectedBfDataset
        );
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        $("#para-submit_prepublishing_review-status").css("color", "red");
        $("#para-submit_prepublishing_review-status").text(emessage);
      } else {
        ipcRenderer.send(
          "track-event",
          "Success",
          "Disseminate Dataset - Pre-publishing Review",
          selectedBfDataset
        );
        $("#para-submit_prepublishing_review-status").css(
          "color",
          "var(--color-light-green)"
        );
        $("#para-submit_prepublishing_review-status").text(
          "Success: Dataset has been submitted for review to the Publishers within your organization"
        );
        showPublishingStatus("noClear");
      }
      bfRefreshPublishingDatasetStatusBtn.disabled = false;
      bfWithdrawReviewDatasetBtn.disabled = false;
      $("#submit_prepublishing_review-spinner").hide();
    }
  );
}

// //Withdraw dataset from review
function withdrawDatasetSubmission() {
  $("#submit_prepublishing_review-spinner").show();
  showPublishingStatus(withdrawDatasetCheck);
}

function withdrawDatasetCheck(res) {
  var reviewstatus = res[0];
  if (reviewstatus !== "requested") {
    emessage = "Your dataset is not currently under review";
    $("#para-submit_prepublishing_review-status").css("color", "red");
    $("#para-submit_prepublishing_review-status").text(emessage);
    $("#submit_prepublishing_review-spinner").hide();
  } else {
    Swal.fire({
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
    }).then((result) => {
      if (result.isConfirmed) {
        withdrawReviewDataset();
      } else {
        $("#submit_prepublishing_review-spinner").hide();
      }
    });
  }
}

// ipcRenderer.on("warning-withdraw-dataset-selection", (event, index) => {
//   if (index === 0) {
//     withdrawReviewDataset();
//   }
//   $("#submit_prepublishing_review-spinner").hide();
// });

function withdrawReviewDataset() {
  bfWithdrawReviewDatasetBtn.disabled = true;
  var selectedBfAccount = $("#current-bf-account").text();
  var selectedBfDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  client.invoke(
    "api_bf_withdraw_review_dataset",
    selectedBfAccount,
    selectedBfDataset,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        $("#para-submit_prepublishing_review-status").css("color", "red");
        $("#para-submit_prepublishing_review-status").text(emessage);
      } else {
        $("#para-submit_prepublishing_review-status").css(
          "color",
          "var(--color-light-green)"
        );
        $("#para-submit_prepublishing_review-status").text(
          "Success: Dataset has been withdrawn from review"
        );
        showPublishingStatus("noClear");
      }
      bfRefreshPublishingDatasetStatusBtn.disabled = false;
      bfWithdrawReviewDatasetBtn.disabled = false;
      $("#submit_prepublishing_review-spinner").hide();
    }
  );
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
  parentDSTagify.settings.whitelist = getParentDatasets();
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

function showPublishingStatus(callback) {
  if (callback == "noClear") {
    var nothing;
  }
  var selectedBfAccount = $("#current-bf-account").text();
  var selectedBfDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  if (selectedBfDataset === "None") {
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
          $("#para-submit_prepublishing_review-status").css("color", "red");
          $("#para-submit_prepublishing_review-status").text(emessage);
        } else {
          $("#para-review-dataset-info-disseminate").text(
            publishStatusOutputConversion(res)
          );
          if (
            callback === submitReviewDatasetCheck ||
            callback === withdrawDatasetCheck
          ) {
            callback(res);
          }
        }
      }
    );
  }
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

var bfaddaccountTitle = `<h3 style="text-align:center">Please specify a key name and enter your Pennsieve API key and secret below: <i class="fas fa-info-circle swal-popover" data-content="See our dedicated <a target='_blank' href='https://github.com/bvhpatel/SODA/wiki/Connect-your-Pennsieve-account-with-SODA'> help page </a>for generating API key and secret and setting up your Pennsieve account in SODA during your first use.<br><br>The account will then be remembered by SODA for all subsequent uses and be accessible under the 'Select existing account' tab. You can only use Pennsieve accounts under the SPARC Consortium organization with SODA." rel="popover" data-placement="right" data-html="true" data-trigger="hover" ></i></h3>`;

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
                create_json_object(action, sodaJSONObj);
                datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
                populate_existing_folders(datasetStructureJSONObj);
                populate_existing_metadata(sodaJSONObj);
                $("#para-continue-location-dataset-getting-started").text(
                  "Please continue below."
                );
                $("#nextBtn").prop("disabled", false);
              });
            } else {
              action = "";
              sodaJSONObj["starting-point"]["local-path"] = filepath[0];
              create_json_object(action, sodaJSONObj);
              datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
              populate_existing_folders(datasetStructureJSONObj);
              populate_existing_metadata(sodaJSONObj);
              $("#para-continue-location-dataset-getting-started").text(
                "Please continue below."
              );
              $("#nextBtn").prop("disabled", false);
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
    // if (!$("#main-nav").hasClass("active")) {
    //   $("#sidebarCollapse").click();
    // }
    // $("#sidebarCollapse").prop("disabled", true);
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
                console.log("Continue");
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
      ipcRenderer.send(
        "track-event",
        "Error",
        "Generate Dataset",
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination}`,
        dataset_name
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      ipcRenderer.send(
        "track-event",
        "Error",
        "Generate Dataset - Size",
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination} - Size`,
        dataset_name,
        main_total_generate_dataset_size
      );

      // ipcRenderer.send(
      //   "track-event",
      //   "Error",
      //   `Generate Dataset - ${dataset_name} - Number of Folders`,
      //   folder_counter
      // );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - Number of Files`,
        dataset_name,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination} - Number of Files`,
        dataset_name,
        file_counter
      );

      // electron.powerSaveBlocker.stop(prevent_sleep_id)

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

        ipcRenderer.send(
          "track-event",
          "Success",
          "Manifest Files Created",
          dataset_name,
          high_level_folder_num
        );
        ipcRenderer.send(
          "track-event",
          "Success",
          `Manifest Files Created - ${dataset_destination}`,
          dataset_name,
          high_level_folder_num
        );
      }

      if (dataset_destination == "Pennsieve") {
        show_curation_shortcut();
      }

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset`,
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination}`,
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        "Generate Dataset - Size",
        dataset_name,
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination} - Size`,
        dataset_name,
        main_total_generate_dataset_size
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      // ipcRenderer.send(
      //   "track-event",
      //   "Success",
      //   `Generate Dataset - ${dataset_name} - Number of Folders`,
      //   folder_counter
      // );

      // ipcRenderer.send(
      //   "track-event",
      //   "Success",
      //   "Generate Dataset - Number of Folders",
      //   folder_counter
      // );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - Number of Files`,
        dataset_name,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination} - Number of Files`,
        dataset_name,
        file_counter
      );

      // electron.powerSaveBlocker.stop(prevent_sleep_id)

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
            sodaJSONObj["bf-dataset-selected"]["dataset-name"]
          );
        } else {
          resolve(res);
          ipcRenderer.send(
            "track-event",
            "Success",
            "Retrieve Dataset - Pennsieve",
            sodaJSONObj["bf-dataset-selected"]["dataset-name"]
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
          ipcRenderer.send(
            "track-event",
            "Error",
            "Retrieve Dataset - Pennsieve",
            sodaJSONObj["bf-dataset-selected"]["dataset-name"]
          );
          $("body").removeClass("waiting");
          ipcRenderer.send(
            "track-event",
            "Error",
            "Generate Manifest - Local Preview",
            dataset_name
          );
        } else {
          $("body").removeClass("waiting");
          ipcRenderer.send(
            "track-event",
            "Success",
            "Retrieve Dataset - Pennsieve",
            sodaJSONObj["bf-dataset-selected"]["dataset-name"]
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
      $(".swal-popover").popover();
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
        // myBootboxDialog.modal("hide");
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
