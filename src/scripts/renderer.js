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

let introStatus = {
  organizeStep3: false,
};

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

    //Load Default/global Pennsieve account if available
    updateBfAccountList();
    checkNewAppVersion(); // Added so that version will be displayed for new users
  }
});

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

// //check user's internet connection and connect to default Pennsieve account //
// require("dns").resolve("www.google.com", (err) => {
//   if (err) {
//     console.error("No internet connection");
//     log.error("No internet connection");
//     // ipcRenderer.send("warning-no-internet-connection");
//   } else {
//     console.log("Connected to the internet");
//     log.info("Connected to the internet");
//     //Check new app version
//     checkNewAppVersion(); // changed this function definition
//     //Load Default/global Pennsieve account if available
//     updateBfAccountList();
//   }
// });

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

/// save airtable api key
const addAirtableKeyBtn = document.getElementById("button-add-airtable-key");

// Save grant information
const presavedAwardArray1 = document.getElementById(
  "select-presaved-grant-info-list"
);
const addAwardBtn = document.getElementById("button-add-award");
const deleteMilestoneBtn = document.getElementById("button-delete-milestone");
const editMilestoneBtn = document.getElementById("button-edit-milestone");
const addMilestoneBtn = document.getElementById("button-add-milestone");
const deleteAwardBtn = document.getElementById("button-delete-award");
const addNewMilestoneBtn = document.getElementById(
  "button-default-save-milestone"
);
const saveInformationBtn = document.getElementById("button-save-milestone");
var sparcAwardEditMessage = $("#div-SPARC-edit-awards");

var currentContributorsLastNames = [];
var currentContributorsFirstNames = [];
var globalContributorNameObject = {};

// Prepare Submission File
const airtableAccountBootboxMessage =
  "<form><div class='form-group row'><label for='bootbox-airtable-key' class='col-sm-3 col-form-label'> API Key:</label><div class='col-sm-9'><input id='bootbox-airtable-key' type='text' class='form-control'/></div></div></form>";
const generateSubmissionBtn = document.getElementById("generate-submission");

// Prepare Dataset Description File
const dsAwardArray = document.getElementById("ds-description-award-list");
const dsContributorArrayLast1 = document.getElementById(
  "ds-description-contributor-list-last-1"
);
const dsContributorArrayFirst1 = document.getElementById(
  "ds-description-contributor-list-first-1"
);

// var contributorRoles = document.getElementById("input-con-role-1");
// const affiliationInput = document.getElementById("input-con-affiliation-1");
const addCurrentContributorsBtn = document.getElementById(
  "button-ds-add-contributor"
);
const contactPerson = document.getElementById("ds-contact-person");
const currentConTable = document.getElementById("table-current-contributors");
const generateDSBtn = document.getElementById("button-generate-ds-description");
const addAdditionalLinkBtn = document.getElementById("button-ds-add-link");
const datasetDescriptionFileDataset = document.getElementById("ds-name");
const parentDSDropdown = document.getElementById("input-parent-ds");

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
const bfNewDatasetName = document.querySelector("#bf-new-dataset-name");
const bfCreateNewDatasetBtn = document.getElementById(
  "button-create-bf-new-dataset"
);
const bfCreateNewDatasetStatus = document.querySelector(
  "#para-add-new-dataset-status"
);
const bfSubmitDatasetBtn = document.getElementById("button-submit-dataset");
const selectLocalDsSubmit = document.getElementById(
  "selected-local-dataset-submit"
);
const pathSubmitDataset = document.querySelector(
  "#selected-local-dataset-submit"
);
const progressUploadBf = document.getElementById("div-progress-submit");
const progressBarUploadBf = document.getElementById("progress-bar-upload-bf");
const bfRenameDatasetBtn = document.getElementById("button-rename-dataset");
const renameDatasetName = document.querySelector("#bf-rename-dataset-name");
const bfRenameDatasetStatus = document.getElementById(
  "para-rename-dataset-status"
);
const datasetPermissionDiv = document.getElementById("div-permission-list-2");

// Pennsieve dataset metadata //
// const bfCurrentMetadataProgress = document.querySelector(
//   "#div-bf-current-metadata-progress"
// );
const bfDatasetSubtitle = document.querySelector("#bf-dataset-subtitle");
const bfDatasetSubtitleCharCount = document.querySelector(
  "#para-char-count-metadata"
);
const bfAddSubtitleBtn = document.getElementById("button-add-subtitle");
const datasetSubtitleStatus = document.querySelector(
  "#para-dataset-subtitle-status"
);
const bfAddDescriptionBtn = document.getElementById("button-add-description");
const datasetDescriptionStatus = document.querySelector(
  "#para-dataset-description-status"
);
const bfCurrentBannerImg = document.getElementById("current-banner-img");
const bfImportBannerImageBtn = document.getElementById(
  "button-import-banner-image"
);
const datasetBannerImagePath = document.querySelector("#para-path-image");
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
const datasetLicenseStatus = document.querySelector(
  "#para-dataset-license-status"
);

// Pennsieve dataset permission //
//const bfPermissionForm = document.querySelector("#pennsieve-permission-form");
//const bfDatasetListPermission = document.querySelector("#bfdatasetlist_permission");
const currentDatasetPermission = document.querySelector(
  "#para-dataset-permission-current"
);
const currentAddEditDatasetPermission = document.querySelector(
  "#para-add-edit-dataset-permission-current"
);
// const bfCurrentPermissionProgress = document.querySelector(
//   "#div-bf-current-permission-progress"
// );
// const bfAddEditCurrentPermissionProgress = document.querySelector(
//   "#div-bf-add-edit-current-permission-progress"
// );
const bfListUsersPI = document.querySelector("#bf_list_users_pi");
const bfAddPermissionPIBtn = document.getElementById(
  "button-add-permission-pi"
);
const datasetPermissionStatusPI = document.querySelector(
  "#para-dataset-permission-status-pi"
);
const bfAddPermissionCurationTeamBtn = document.getElementById(
  "button-add-permission-curation-team"
);
const datasetPermissionStatusCurationTeam = document.querySelector(
  "#para-dataset-permission-status-curation-team"
);
const bfListUsers = document.querySelector("#bf_list_users");
const bfListRoles = document.querySelector("#bf_list_roles");
const bfAddPermissionBtn = document.getElementById("button-add-permission");
const datasetPermissionStatus = document.querySelector(
  "#para-dataset-permission-status"
);
const bfListTeams = document.querySelector("#bf_list_teams");
const bfListRolesTeam = document.querySelector("#bf_list_roles_team");
const bfAddPermissionTeamBtn = document.getElementById(
  "button-add-permission-team"
);
const datasetPermissionStatusTeam = document.querySelector(
  "#para-dataset-permission-status-team"
);

//Pennsieve dataset status
const bfCurrentDatasetStatusProgress = document.querySelector(
  "#div-bf-current-dataset-status-progress"
);
const bfListDatasetStatus = document.querySelector("#bf_list_dataset_status");
const datasetStatusStatus = document.querySelector(
  "#para-dataset-status-status"
);

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

const a_DDD_click_function = () => {
  ipcRenderer.send("open-folder-dialog-save-DDD", templateArray[5]);
};

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

milestoneTagify1.on("add", function () {
  var buttonDiv = $($("#selected-milestone-1").parents()[1]).find(
    ".div-confirm-enter-milestone"
  );
  if (milestoneTagify1.value.length !== 0) {
    if (!$("#Question-prepare-submission-4").hasClass("prev")) {
      $(buttonDiv).show();
      $($(buttonDiv).children()[0]).show();
    }

    console.log(milestoneTagify1.value);

    document.getElementById("selected-milestone-date").value = "";
    document.getElementById("input-milestone-date").value = "";
    actionEnterNewDate("none");
    document.getElementById("para-save-submission-status").innerHTML = "";
    removeOptions(descriptionDateInput);
    addOption(descriptionDateInput, "Select an option", "Select");

    const award =
      presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
    var informationJson = parseJson(milestonePath);

    var completionDateArray = [];
    completionDateArray.push("Enter my own date");

    /// when DD is provided
    if (award in informationJson) {
      var milestoneObj = informationJson[award];
      // Load milestone values once users choose an award number
      var milestoneKey = milestoneTagify1.value[0].value;

      /// add milestones to Tagify suggestion tag list and options to completion date dropdown

      for (var j = 0; j < milestoneObj[milestoneKey].length; j++) {
        completionDateArray.push(
          milestoneObj[milestoneKey][j]["Expected date of completion"]
        );
      }
    }
    for (var i = 0; i < completionDateArray.length; i++) {
      addOption(
        descriptionDateInput,
        completionDateArray[i],
        completionDateArray[i]
      );
    }

    // if ($("#Question-prepare-submission-7").hasClass("show")) {
    //   var res = showPreviewSubmission();
    //   var awardRes = res["awards"];
    //   var dateRes = res["date"];
    //   var milestonesRes = res["milestones"];
    //   var milestoneValues = [];
    //   $("#submission-SPARC-award-span").text(awardRes);
    //   $("#submission-completion-date-span").text(dateRes);
    //   milestonesRes.forEach((item, i) => {
    //     milestoneValues.push(milestonesRes[i].value);
    //   });
    //   $("#submission-milestones-span").text(milestoneValues.join(", \n"));
    // }
  } else {
    $(buttonDiv).hide();
    $("#Question-prepare-submission-4")
      .nextAll()
      .removeClass("show")
      .removeClass("prev");
  }
});

milestoneTagify1.on("remove", function () {
  var buttonDiv = $($("#selected-milestone-1").parents()[1]).find(
    ".div-confirm-enter-milestone"
  );
  if (milestoneTagify1.value.length !== 0) {
    if (!$("#Question-prepare-submission-4").hasClass("prev")) {
      $(buttonDiv).show();
      $($(buttonDiv).children()[0]).show();
    }
    if ($("#Question-prepare-submission-7").hasClass("show")) {
      var res = showPreviewSubmission();
      var awardRes = res["awards"];
      var dateRes = res["date"];
      var milestonesRes = res["milestones"];
      var milestoneValues = [];
      $("#submission-SPARC-award-span").text(awardRes);
      $("#submission-completion-date-span").text(dateRes);
      milestonesRes.forEach((item, i) => {
        milestoneValues.push(milestonesRes[i].value);
      });
      $("#submission-milestones-span").text(milestoneValues.join(", \n"));
    }
  } else {
    $(buttonDiv).hide();
    $("#Question-prepare-submission-4")
      .nextAll()
      .removeClass("show")
      .removeClass("prev");
  }
});

const milestoneInput2 = document.getElementById("selected-milestone-2");
var milestoneTagify2 = new Tagify(milestoneInput2, {
  duplicates: false,
  delimiters: null,
});

milestoneTagify2.on("add", function () {
  var buttonDiv = $($("#selected-milestone-2").parents()[1]).find(
    ".div-confirm-enter-milestone"
  );
  if (milestoneTagify2.value.length !== 0) {
    if (!$("#Question-prepare-submission-no-skip-2").hasClass("prev")) {
      $(buttonDiv).show();
      $($(buttonDiv).children()[0]).show();
    }
    if ($("#Question-prepare-submission-7").hasClass("show")) {
      var res = showPreviewSubmission();
      var awardRes = res["awards"];
      var dateRes = res["date"];
      var milestonesRes = res["milestones"];
      var milestoneValues = [];
      $("#submission-SPARC-award-span").text(awardRes);
      $("#submission-completion-date-span").text(dateRes);
      milestonesRes.forEach((item, i) => {
        milestoneValues.push(milestonesRes[i].value);
      });
      $("#submission-milestones-span").text(milestoneValues.join(", \n"));
    }
  } else {
    $(buttonDiv).hide();
    $("#Question-prepare-submission-no-skip-2").removeClass("prev");
    $("#Question-prepare-submission-no-skip-2")
      .nextAll()
      .removeClass("show")
      .removeClass("prev");
  }
});

milestoneTagify2.on("remove", function () {
  var buttonDiv = $($("#selected-milestone-2").parents()[1]).find(
    ".div-confirm-enter-milestone"
  );
  if (milestoneTagify2.value.length !== 0) {
    if (!$("#Question-prepare-submission-no-skip-2").hasClass("prev")) {
      $(buttonDiv).show();
      $($(buttonDiv).children()[0]).show();
    }
    if ($("#Question-prepare-submission-7").hasClass("show")) {
      var res = showPreviewSubmission();
      var awardRes = res["awards"];
      var dateRes = res["date"];
      var milestonesRes = res["milestones"];
      var milestoneValues = [];
      $("#submission-SPARC-award-span").text(awardRes);
      $("#submission-completion-date-span").text(dateRes);
      milestonesRes.forEach((item, i) => {
        milestoneValues.push(milestonesRes[i].value);
      });
      $("#submission-milestones-span").text(milestoneValues.join(", \n"));
    }
  } else {
    $(buttonDiv).hide();
    $("#Question-prepare-submission-no-skip-2")
      .nextAll()
      .removeClass("show")
      .removeClass("prev");
  }
});

const existingSPARCAwards = document.getElementById("input-existing-grants");
const existingSPARCAwardsTagify = new Tagify(existingSPARCAwards, {
  duplicates: false,
  delimiters: null,
  editTags: false,
  whitelist: [],
  dropdown: {
    enabled: 0,
    closeOnSelect: true,
  },
});

//// when users click on Import
function importMilestoneDocument() {
  $("#upload-DDD-spinner").show();
  if (event.currentTarget.id == "button-import-milestone") {
    document.getElementById("para-milestone-document-info-long").style.display =
      "none";
    document.getElementById("para-milestone-document-info").innerHTML = "";
    var filepath = document.getElementById(
      "input-milestone-select"
    ).placeholder;
    if (filepath === "Browse here") {
      document.getElementById("para-milestone-document-info").innerHTML =
        "<span style='color: red ;'>" +
        "Please select a data deliverables document first!</span>";
      $("#upload-DDD-spinner").hide();
    } else {
      var award =
        presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
      client.invoke("api_extract_milestone_info", filepath, (error, res) => {
        if (error) {
          var emessage = userError(error);
          log.error(error);
          console.error(error);
          document.getElementById(
            "para-milestone-document-info-long"
          ).style.display = "block";
          document.getElementById(
            "para-milestone-document-info-long"
          ).innerHTML = "<span style='color: red;'> " + emessage + ".</span>";
          $("#upload-DDD-spinner").hide();
        } else {
          milestoneObj = res;
          createMetadataDir();
          var informationJson = {};
          informationJson = parseJson(milestonePath);
          informationJson[award] = milestoneObj;
          fs.writeFileSync(milestonePath, JSON.stringify(informationJson));
          document.getElementById("para-milestone-document-info").innerHTML =
            "<span style='color: black ;'>" + "Imported!</span>";
          document.getElementById("input-milestone-select").placeholder =
            "Browse here";
          removeOptions(descriptionDateInput);
          milestoneTagify1.removeAllTags();
          milestoneTagify1.settings.whitelist = [];
          milestoneTagify2.settings.whitelist = [];
          changeAwardInput();
          $("#div-cancel-DDD-import").hide();
          $("#div-confirm-DDD-import button").click();
          $("#upload-DDD-spinner").hide();
        }
      });
    }
  } else if (event.currentTarget.id == "button-import-milestone-reupload") {
  }
}

ipcRenderer.on("selected-milestonedoc", (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      // used to communicate value to button-import-milestone click event-listener
      document.getElementById("input-milestone-select").placeholder =
        filepath[0];
      ipcRenderer.send(
        "track-event",
        "Success",
        "Prepare Metadata - Add DDD",
        defaultBfAccount
      );
    }
  }
  if (
    document.getElementById("input-milestone-select").placeholder !==
    "Browse here"
  ) {
    $("#button-import-milestone").show();
  } else {
    $("#button-import-milestone").hide();
  }
});

// generate subjects file
ipcRenderer.on(
  "selected-generate-metadata-subjects",
  (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" + filename + "' already exists in " + dirpath[0];
        Swal.fire({
          icon: "error",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        Swal.fire({
          title: "Generating the subjects.xlsx file",
          html: "Please wait...",
          timer: 30000,
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
          "api_save_subjects_file",
          destinationPath,
          subjectsTableData,
          (error, res) => {
            if (error) {
              var emessage = userError(error);
              log.error(error);
              console.error(error);
              Swal.fire(
                "Failed to generate the subjects.xlsx file.",
                `${emessage}`,
                "error"
              );
              ipcRenderer.send(
                "track-event",
                "Error",
                "Prepare Metadata - Create subjects.xlsx",
                subjectsTableData
              );
            } else {
              ipcRenderer.send(
                "track-event",
                "Success",
                "Prepare Metadata - Create subjects.xlsx",
                subjectsTableData
              );
              Swal.fire({
                title:
                  "The subjects.xlsx file has been successfully generated at the specified location.",
                icon: "success",
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });
            }
          }
        );
      }
    }
  }
);

// generate samples file
ipcRenderer.on(
  "selected-generate-metadata-samples",
  (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" + filename + "' already exists in " + dirpath[0];
        Swal.fire({
          icon: "error",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        Swal.fire({
          title: "Generating the samples.xlsx file",
          html: "Please wait...",
          timer: 30000,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          allowEscapeKey: false,
          allowOutsideClick: false,
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
          destinationPath,
          samplesTableData,
          (error, res) => {
            if (error) {
              var emessage = userError(error);
              log.error(error);
              console.error(error);
              ipcRenderer.send(
                "track-event",
                "Error",
                "Prepare Metadata - Create samples.xlsx",
                samplesTableData
              );
              Swal.fire(
                "Failed to generate the samples.xlsx file.",
                `${emessage}`,
                "error"
              );
            } else {
              ipcRenderer.send(
                "track-event",
                "Success",
                "Prepare Metadata - Create samples.xlsx",
                samplesTableData
              );
              Swal.fire({
                title:
                  "The samples.xlsx file has been successfully generated at the specified location.",
                icon: "success",
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });
            }
          }
        );
      }
    }
  }
);

// import Primary folder
ipcRenderer.on("selected-local-primary-folder", (event, primaryFolderPath) => {
  if (primaryFolderPath.length > 0) {
    importPrimaryFolderSubjects(primaryFolderPath[0]);
    // $("#primary-folder-destination-input").prop("placeholder", primaryFolderPath[0])
    // $("#div-confirm-primary-folder-import").show()
    // $($("#div-confirm-primary-folder-import").find("button")[0]).show();
  } else {
    // $("#primary-folder-destination-input").prop("placeholder", "Browse here")
    // $("#div-confirm-primary-folder-import").find("button").hide()
  }
});
ipcRenderer.on(
  "selected-local-primary-folder-samples",
  (event, primaryFolderPath) => {
    if (primaryFolderPath.length > 0) {
      importPrimaryFolderSamples(primaryFolderPath[0]);
      // $("#primary-folder-destination-input-samples").prop("placeholder", primaryFolderPath[0])
      // $("#div-confirm-primary-folder-import-samples").show()
      // $($("#div-confirm-primary-folder-import-samples").find("button")[0]).show();
    } else {
      // $("#primary-folder-destination-input-samples").prop("placeholder", "Browse here")
      // $("#div-confirm-primary-folder-import-samples").find("button").hide()
    }
  }
);

function transformImportedExcelFile(type, result) {
  for (var column of result.slice(1)) {
    var indices = getAllIndexes(column, "nan");
    for (var ind of indices) {
      column[ind] = "";
    }
    if (type === "samples") {
      if (!specimenType.includes(column[5])) {
        column[5] = "";
      }
    }
  }
  return result;
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
          text: emessage,
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        // res is a dataframe, now we load it into our subjectsTableData in order to populate the UI
        if (res.length > 1) {
          subjectsTableData = transformImportedExcelFile("subjects", res);
          loadDataFrametoUI();
          ipcRenderer.send(
            "track-event",
            "Success",
            "Prepare Metadata - Create subjects.xlsx - Load existing subjects.xlsx file",
            ""
          );
        } else {
          ipcRenderer.send(
            "track-event",
            "Error",
            "Prepare Metadata - Create subjects.xlsx - Load existing subjects.xlsx file",
            error
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
          text: emessage,
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        // res is a dataframe, now we load it into our samplesTableData in order to populate the UI
        if (res.length > 1) {
          samplesTableData = transformImportedExcelFile("samples", res);
          ipcRenderer.send(
            "track-event",
            "Success",
            "Prepare Metadata - Create samples.xlsx - Load existing samples.xlsx file",
            samplesTableData
          );
          loadDataFrametoUISamples();
        } else {
          ipcRenderer.send(
            "track-event",
            "Error",
            "Prepare Metadata - Create samples.xlsx - Load existing samples.xlsx file",
            samplesTableData
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
    if (type === "subjects") {
      var strain = $("#bootbox-subject-strain").val();
    } else if (type === "samples") {
      var strain = $("#bootbox-sample-strain").val();
    }
    if (strain !== "") {
      populateRRID(strain, type);
    }
    autoCompleteJS4.input.value = selection;
  });
}

$(document).ready(function () {
  createSpeciesAutocomplete("bootbox-subject-species");
  createSpeciesAutocomplete("bootbox-sample-species");
  createStrain("bootbox-sample-strain", "samples");
  createStrain("bootbox-subject-strain", "subjects");
});

async function loadTaxonomySpecies(commonName, destinationInput) {
  Swal.fire({
    title: "Finding the scientific name for " + commonName + "...",
    html: "Please wait...",
    timer: 1500,
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
          Swal.fire(
            "Cannot find a scientific name for '" + commonName + "'",
            "Make sure you enter a correct species name.",
            "error"
          );
        } else {
          $("#" + destinationInput).val(res[commonName]["ScientificName"]);
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

// Function to auto load existing awards
function loadAwards() {
  if (!fs.existsSync(awardPath)) {
    return {};
  }
  var contents = fs.readFileSync(awardPath, "utf8");
  var awards = JSON.parse(contents);
  var awardSpan = "";
  var awardList = [];
  removeOptions(presavedAwardArray1);
  removeOptions(dsAwardArray);
  addOption(presavedAwardArray1, "Select an award", "Select");
  addOption(dsAwardArray, "Select an award", "Select");
  for (var key in awards) {
    // Add options to dropdown lists
    addOption(presavedAwardArray1, eval(JSON.stringify(awards[key])), key);
    addOption(dsAwardArray, eval(JSON.stringify(awards[key])), key);
    awardList.push({
      value: eval(JSON.stringify(awards[key])),
      "award-number": key,
    });
    awardSpan = awardSpan + eval(JSON.stringify(awards[key])) + "\n\n";
  }
  existingSPARCAwardsTagify.removeAllTags();
  existingSPARCAwardsTagify.addTags(awardList);
  $("#current-users-awards").text(awardSpan.slice(0));
  $("#current-users-awards-dd").text(awardSpan.slice(0));
}

loadAwards();

// Save grant information
function addSPARCAwards() {
  var message = "";
  var tagifyArray = existingSPARCAwardsTagify.value;
  var spanMessage = "";
  // create empty milestone json files for newly added award
  createMetadataDir();
  var awardsJson = {};
  awardsJson = parseJson(awardPath);
  if (tagifyArray.length === 0) {
    awardsJson = {};
    fs.writeFileSync(awardPath, JSON.stringify(awardsJson));
    $("#current-users-awards").text("None");
    $("#current-users-awards-dd").text("None");
  } else {
    var awardVal = [];
    for (var i = 0; i < tagifyArray.length; i++) {
      awardVal.push(tagifyArray[i].value);
    }
    var awardNoAray = [];
    for (var award of awardVal) {
      var awardNo = award.slice(0, award.indexOf(" ("));
      var keyValuePair = { "award-number": awardNo, "award-full-title": award };
      awardNoAray.push(keyValuePair);
    }
    removeOptions(presavedAwardArray1);
    removeOptions(dsAwardArray);
    awardsJson = {};
    for (var keyValuePair of awardNoAray) {
      addOption(
        presavedAwardArray1,
        keyValuePair["award-full-title"],
        keyValuePair["award-number"]
      );
      addOption(
        dsAwardArray,
        keyValuePair["award-full-title"],
        keyValuePair["award-number"]
      );
      spanMessage = spanMessage + keyValuePair["award-full-title"] + "\n\n";
      awardsJson[keyValuePair["award-number"]] =
        keyValuePair["award-full-title"];
    }

    fs.writeFileSync(awardPath, JSON.stringify(awardsJson));
    $("#current-users-awards").text(spanMessage);
    $("#current-users-awards-dd").text(spanMessage);
  }
  loadAwards();
  return message;
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
      var base = Airtable.base("appSDqnnxSuM1s2F7");
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
              existingSPARCAwardsTagify.settings.whitelist = resultArray;
            }
          }
        );
    }
  }
}

///////////////// //////////////// //////////////// ////////////////
///////////////////////Submission file //////////////// ////////////////

function changeAwardInput() {
  var ddBolean;
  document.getElementById("selected-milestone-date").value = "";
  document.getElementById("input-milestone-date").value = "";
  actionEnterNewDate("none");
  document.getElementById("para-save-submission-status").innerHTML = "";
  milestoneTagify1.removeAllTags();
  milestoneTagify1.settings.whitelist = [];
  milestoneTagify2.removeAllTags();
  milestoneTagify2.settings.whitelist = [];
  removeOptions(descriptionDateInput);
  addOption(descriptionDateInput, "Select an option", "Select");

  award = presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
  var informationJson = parseJson(milestonePath);

  var completionDateArray = [];
  var milestoneValueArray = [];
  completionDateArray.push("Enter my own date");

  /// when DD is provided
  if (award in informationJson) {
    ddBolean = true;
    var milestoneObj = informationJson[award];
    // Load milestone values once users choose an award number
    var milestoneKey = Object.keys(milestoneObj);

    /// add milestones to Tagify suggestion tag list and options to completion date dropdown
    for (var i = 0; i < milestoneKey.length; i++) {
      milestoneValueArray.push(milestoneKey[i]);
      for (var j = 0; j < milestoneObj[milestoneKey[i]].length; j++) {
        completionDateArray.push(
          milestoneObj[milestoneKey[i]][j]["Expected date of completion"]
        );
      }
    }
    milestoneValueArray.push("Not specified in the Data Deliverables document");
  } else {
    ddBolean = false;
  }
  milestoneTagify1.settings.whitelist = milestoneValueArray;
  milestoneTagify2.settings.whitelist = milestoneValueArray;
  for (var i = 0; i < completionDateArray.length; i++) {
    addOption(
      descriptionDateInput,
      completionDateArray[i],
      completionDateArray[i]
    );
  }
  return ddBolean;
}

const submissionDateInput = document.getElementById("input-milestone-date");

function actionEnterNewDate(action) {
  document.getElementById(
    "div-submission-enter-different-date-1"
  ).style.display = action;
  document.getElementById(
    "div-submission-enter-different-date-3"
  ).style.display = action;
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

  var awardVal = dsAwardArray.options[dsAwardArray.selectedIndex].value;
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"];
    Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appSDqnnxSuM1s2F7");
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

    // delete contributor names from list after it's added
    // delete globalContributorNameObject[conLastname];
    // var newConLastNames = currentContributorsLastNames.filter(function (
    //   value,
    //   index,
    //   arr
    // ) {
    //   return value !== conLastname;
    // });
    // currentContributorsLastNames = newConLastNames;
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
  var base = Airtable.base("appSDqnnxSuM1s2F7");
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
    addOption(list, "Select dataset", "Select dataset");
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
  var length = document.getElementById("table-samples").rows.length;
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
  var length = document.getElementById("contributor-table-dd").rows.length;
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
      contributorObject
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

///// grab datalist name and auto-load current description
const showDatasetDescription = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    // bfCurrentMetadataProgress.style.display = "none";
    $(".synced-progress").css("display", "none");
    document.getElementById("ds-description").innerHTML = "";
    setTimeout(() => {
      document.getElementById("description_header_label").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 5);
  } else {
    client.invoke(
      "api_bf_get_subtitle",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
        } else {
          document.getElementById("ds-description").innerHTML = res;
          setTimeout(() => {
            document.getElementById("description_header_label").scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 5);
        }
      }
    );
    document.getElementById("ds-description").disabled = false;
  }
};

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
      if (
        inforObj[element].length === 0 ||
        inforObj[element] === "Select dataset"
      ) {
        fieldSatisfied = false;
        emptyFieldArray.push(element);
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
    conEmptyField.push("One contact person");
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

/////////////// Generate ds description file ///////////////////
////////////////////////////////////////////////////////////////
generateDSBtn.addEventListener("click", (event) => {
  document.getElementById("para-generate-description-status").innerHTML = "";
  var funding = $("#ds-description-award-input").val().trim();
  var allFieldsSatisfied = detectEmptyRequiredFields(funding)[0];
  var errorMessage = detectEmptyRequiredFields(funding)[1];

  /// raise a warning if empty required fields are found
  if (allFieldsSatisfied === false) {
    var textErrorMessage = "";
    for (var i = 0; i < errorMessage.length; i++) {
      textErrorMessage += errorMessage[i] + "<br>";
    }
    var messageMissingFields = `<div>The following mandatory item(s) is/are missing:<br> ${textErrorMessage} <br>Would you still like to generate the dataset description file?</div>`;
    Swal.fire({
      icon: "warning",
      html: messageMissingFields,
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
        ipcRenderer.send(
          "open-folder-dialog-save-ds-description",
          "dataset_description.xlsx"
        );
      }
    });
  } else {
    ipcRenderer.send(
      "open-folder-dialog-save-ds-description",
      "dataset_description.xlsx"
    );
  }
});

ipcRenderer.on("show-missing-items-ds-description", (event, index) => {
  if (index === 0) {
    ipcRenderer.send(
      "open-folder-dialog-save-ds-description",
      "dataset_description.xlsx"
    );
  }
});

ipcRenderer.on(
  "selected-metadata-ds-description",
  (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      // $("#generate-dd-spinner").show();
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" + filename + "' already exists in " + dirpath[0];
        Swal.fire({
          icon: "error",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        // $("#generate-dd-spinner").hide();
      } else {
        Swal.fire({
          title: "Generating the dataset_description.xlsx file",
          html: "Please wait...",
          timer: 300000,
          allowEscapeKey: false,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {});

        var datasetInfoValueArray = grabDSInfoEntries();

        //// process obtained values to pass to an array ///
        ///////////////////////////////////////////////////
        var keywordVal = [];
        for (var i = 0; i < datasetInfoValueArray["keywords"].length; i++) {
          keywordVal.push(datasetInfoValueArray["keywords"][i].value);
        }
        /// replace keywordArray with keywordVal array
        datasetInfoValueArray["keywords"] = keywordVal;

        //// push to all ds info values to dsSectionArray
        var dsSectionArray = [];
        for (let elementDS in datasetInfoValueArray) {
          dsSectionArray.push(datasetInfoValueArray[elementDS]);
        }
        //// grab entries from contributor info section and pass values to conSectionArray
        var contributorObj = grabConInfoEntries();
        /// grab entries from other misc info section
        var miscObj = combineLinksSections();

        /// grab entries from other optional info section
        var completenessSectionObj = grabCompletenessInfo();

        ///////////// stringify JSON objects //////////////////////
        json_str_ds = JSON.stringify(dsSectionArray);
        json_str_misc = JSON.stringify(miscObj);
        json_str_completeness = JSON.stringify(completenessSectionObj);
        json_str_con = JSON.stringify(contributorObj);

        /// get current, selected Pennsieve account
        var bfaccountname = $("#current-bf-account").text();

        /// call python function to save file
        if (dirpath != null) {
          client.invoke(
            "api_save_ds_description_file",
            bfaccountname,
            destinationPath,
            json_str_ds,
            json_str_misc,
            json_str_completeness,
            json_str_con,
            (error, res) => {
              if (error) {
                var emessage = userError(error);
                log.error(error);
                console.error(error);
                Swal.fire({
                  title: "Failed to generate the dataset_description file.",
                  text: emessage,
                  icon: "error",
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                });
                ipcRenderer.send(
                  "track-event",
                  "Error",
                  "Prepare Metadata - Create dataset_description",
                  defaultBfDataset
                );
              } else {
                Swal.fire({
                  title:
                    "The dataset_description.xlsx file has been successfully generated at the specified location.",
                  icon: "success",
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                });
                ipcRenderer.send(
                  "track-event",
                  "Success",
                  "Prepare Metadata - Create dataset_description",
                  defaultBfDataset
                );
                // $("#generate-dd-spinner").hide();
              }
            }
          );
        }
      }
    }
  }
);

//////////////////////////End of Ds description section ///////////////////////////////////
//////////////// //////////////// //////////////// //////////////// ////////////////////////

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

// Character count for subtitle //
function countCharacters(textelement, pelement) {
  var textEntered = textelement.value;
  var counter = 255 - textEntered.length;
  pelement.innerHTML = counter + " characters remaining";
  return textEntered.length;
}

bfDatasetSubtitle.addEventListener("keyup", function () {
  countCharacters(bfDatasetSubtitle, bfDatasetSubtitleCharCount);
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

// Add new dataset folder (empty) on bf //
bfCreateNewDatasetBtn.addEventListener("click", () => {
  setTimeout(function () {
    log.info(`Creating a new dataset with the name: ${bfNewDatasetName.value}`);
    bfCreateNewDatasetBtn.disabled = true;
    $("#para-new-name-dataset-message").html("");
    $("#para-add-new-dataset-status").html("");
    $("#bf-create-new-dataset-spinner").css("visibility", "visible");
    var selectedbfaccount = defaultBfAccount;
    client.invoke(
      "api_bf_new_dataset_folder",
      bfNewDatasetName.value,
      selectedbfaccount,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          $("#bf-create-new-dataset-spinner").css("visibility", "hidden");
          bfCreateNewDatasetStatus.innerHTML =
            "<span style='color: red; font-size: 15px;'> " +
            emessage +
            ". </span>" +
            sadCan;
          bfCreateNewDatasetBtn.disabled = false;
          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Create Empty Dataset",
            bfNewDatasetName.value
          );
        } else {
          log.info(`Created dataset successfully`);
          $("#bf-create-new-dataset-spinner").css("visibility", "hidden");
          $(bfCreateNewDatasetBtn).hide();
          defaultBfDataset = bfNewDatasetName.value;
          refreshDatasetList();
          bfCreateNewDatasetStatus.innerHTML =
            "<span style='font-size: 15px; color: #13716D;'>Success: Created dataset" +
            " '" +
            bfNewDatasetName.value +
            "'. </span>" +
            smileyCan;
          currentDatasetPermission.innerHTML = "";
          currentAddEditDatasetPermission.innerHTML = "";
          bfCreateNewDatasetBtn.disabled = false;
          addNewDatasetToList(bfNewDatasetName.value);
          ipcRenderer.send(
            "track-event",
            "Success",
            "Manage Dataset - Create Empty Dataset",
            bfNewDatasetName.value
          );
          log.info(`Requesting list of datasets`);
          client.invoke(
            "api_bf_dataset_account",
            defaultBfAccount,
            (error, result) => {
              if (error) {
                log.error(error);
                console.log(error);
                var emessage = error;
              } else {
                log.info(`Requested list of datasets successfully`);
                datasetList = [];
                datasetList = result;
              }
            }
          );
          $(".bf-dataset-span").html(bfNewDatasetName.value);
          refreshDatasetList();
          updateDatasetList();
          $(".confirm-button").click();
          bfNewDatasetName.value = "";
        }
      }
    );
  }, delayAnimation);
});

// Rename dataset on bf //
bfRenameDatasetBtn.addEventListener("click", () => {
  setTimeout(function () {
    var selectedbfaccount = defaultBfAccount;
    var currentDatasetName = defaultBfDataset;
    var renamedDatasetName = renameDatasetName.value;

    log.info(
      `Requesting dataset name change from '${currentDatasetName}' to '${renamedDatasetName}'`
    );

    if (currentDatasetName === "Select dataset") {
      emessage = "Please select a valid dataset";
      bfRenameDatasetStatus.innerHTML =
        "<span style='color: red;'> " + emessage + ". </span>" + sadCan;
    } else {
      $("#bf-rename-dataset-spinner").css("visibility", "visible");
      bfRenameDatasetBtn.disabled = true;
      bfRenameDatasetStatus.innerHTML = "";
      client.invoke(
        "api_bf_rename_dataset",
        selectedbfaccount,
        currentDatasetName,
        renamedDatasetName,
        (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            var emessage = userError(error);
            $("#bf-rename-dataset-spinner").css("visibility", "hidden");
            bfRenameDatasetStatus.innerHTML =
              "<span style='color: red;'> " + emessage + ". </span>" + sadCan;
            bfRenameDatasetBtn.disabled = false;
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Rename Existing Dataset",
              currentDatasetName + " to " + renamedDatasetName
            );
          } else {
            log.info("Dataset rename success");
            defaultBfDataset = renamedDatasetName;
            $(".bf-dataset-span").html(renamedDatasetName);
            refreshDatasetList();
            renameDatasetName.value = renamedDatasetName;
            bfRenameDatasetStatus.innerHTML =
              "Success: Renamed dataset" +
              " '" +
              currentDatasetName +
              "'" +
              " to" +
              " '" +
              renamedDatasetName +
              "'. " +
              smileyCan;
            bfRenameDatasetBtn.disabled = false;
            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Rename Existing Dataset",
              currentDatasetName + " to " + renamedDatasetName
            );
            $("#bf-rename-dataset-spinner").css("visibility", "hidden");
            log.info("Requesting list of datasets");
            client.invoke(
              "api_bf_dataset_account",
              defaultBfAccount,
              (error, result) => {
                if (error) {
                  log.error(error);
                  console.log(error);
                  var emessage = error;
                } else {
                  log.info("Request successful");
                  datasetList = [];
                  datasetList = result;
                  refreshDatasetList();
                }
              }
            );
          }
        }
      );
    }
  }, delayAnimation);
});

function walk(directory, filepaths = []) {
  const files = fs.readdirSync(directory);
  for (let filename of files) {
    const filepath = path.join(directory, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filepaths);
    } else {
      filepaths.push(filepath);
    }
  }
  return filepaths;
}

const logFilesForUpload = (upload_folder_path) => {
  const foundFiles = walk(upload_folder_path);
  foundFiles.forEach((item) => {
    log.info(item);
  });
};

// Submit dataset to bf //
bfSubmitDatasetBtn.addEventListener("click", async () => {
  document.getElementById("para-please-wait-manage-dataset").innerHTML =
    "Please wait while we verify a few things...";
  let supplementary_checks = await run_pre_flight_checks(false);
  if (!supplementary_checks) {
    return;
  }

  var totalFileSize;

  document.getElementById("para-please-wait-manage-dataset").innerHTML =
    "Please wait...";
  document.getElementById("para-progress-bar-error-status").innerHTML = "";

  progressBarUploadBf.value = 0;
  bfSubmitDatasetBtn.disabled = true;
  pathSubmitDataset.disabled = true;
  $("#button-submit-dataset").popover("hide");

  var err = false;
  var completionStatus = "Solving";
  document.getElementById("para-progress-bar-status").innerHTML =
    "Preparing files ...";
  var selectedbfaccount = defaultBfAccount;
  var selectedbfdataset = defaultBfDataset;

  // prevent_sleep_id = electron.powerSaveBlocker.start('prevent-display-sleep')
  log.info("Files selected for upload:");
  logFilesForUpload(pathSubmitDataset.placeholder);

  client.invoke(
    "api_bf_submit_dataset",
    selectedbfaccount,
    selectedbfdataset,
    pathSubmitDataset.placeholder,
    (error, res) => {
      if (error) {
        document.getElementById("para-please-wait-manage-dataset").innerHTML =
          "";
        var emessage = userError(error);
        document.getElementById("para-progress-bar-error-status").innerHTML =
          "<span style='color: red;'>" + emessage + sadCan + "</span>";
        document.getElementById("para-progress-bar-status").innerHTML = "";
        $("#div-progress-submit").css("display", "none");
        progressBarUploadBf.value = 0;
        err = true;
        log.error(error);
        console.error(error);
        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Upload Local Dataset",
          selectedbfdataset
        );
        $("#upload_local_dataset_progress_div")[0].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        bfSubmitDatasetBtn.disabled = false;
        pathSubmitDataset.disabled = false;
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      } else {
        $("#upload_local_dataset_progress_div")[0].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        log.info("Completed submit function");
        console.log("Completed submit function");
        ipcRenderer.send(
          "track-event",
          "Success",
          "Manage Dataset - Upload Local Dataset - name - size",
          defaultBfDataset,
          totalFileSize
        );

        ipcRenderer.send(
          "track-event",
          "Success",
          "Upload Local Dataset - size",
          totalFileSize
        );

        ipcRenderer.send(
          "track-event",
          "Success",
          `Upload Local Dataset - ${selectedbfdataset} - size`,
          totalFileSize
        );

        client.invoke(
          "api_get_number_of_files_and_folders_locally",
          pathSubmitDataset.placeholder,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
            } else {
              let num_of_files = res[0];
              let num_of_folders = res[1];

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - ${defaultBfDataset} - Number of Folders`,
                num_of_folders
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - Number of Folders`,
                num_of_folders
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Manage Dataset - Upload Local Dataset - name - Number of files`,
                defaultBfDataset,
                num_of_files
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - ${defaultBfDataset} - Number of Files`,
                num_of_files
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - Number of Files`,
                num_of_files
              );
            }
          }
        );

        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    }
  );

  var countDone = 0;
  var timerProgress = setInterval(progressfunction, 1000);
  function progressfunction() {
    $("#upload_local_dataset_progress_div")[0].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    client.invoke("api_submit_dataset_progress", (error, res) => {
      if (error) {
        var emessage = userError(error);
        document.getElementById("para-progress-bar-error-status").innerHTML =
          "<span style='color: red;'> " + emessage + sadCan + "</span>";
        log.error(error);
        console.error(error);
        // prevent_sleep_id = electron.powerSaveBlocker.start('prevent-display-sleep')
      } else {
        completionStatus = res[1];
        var submitprintstatus = res[2];
        totalFileSize = res[3];
        var uploadedFileSize = res[4];
        if (submitprintstatus === "Uploading") {
          $("#div-progress-submit").css("display", "block");
          if (res[0].includes("Success: COMPLETED!")) {
            progressBarUploadBf.value = 100;
            document.getElementById(
              "para-please-wait-manage-dataset"
            ).innerHTML = "";
            document.getElementById("para-progress-bar-status").innerHTML =
              res[0] + smileyCan;
            // electron.powerSaveBlocker.stop(prevent_sleep_id)
          } else {
            var value = (uploadedFileSize / totalFileSize) * 100;
            progressBarUploadBf.value = value;
            if (totalFileSize < displaySize) {
              var totalSizePrint = totalFileSize.toFixed(2) + " B";
            } else if (totalFileSize < displaySize * displaySize) {
              var totalSizePrint =
                (totalFileSize / displaySize).toFixed(2) + " KB";
            } else if (
              totalFileSize <
              displaySize * displaySize * displaySize
            ) {
              var totalSizePrint =
                (totalFileSize / displaySize / displaySize).toFixed(2) + " MB";
            } else {
              var totalSizePrint =
                (
                  totalFileSize /
                  displaySize /
                  displaySize /
                  displaySize
                ).toFixed(2) + " GB";
            }
            document.getElementById(
              "para-please-wait-manage-dataset"
            ).innerHTML = "";
            document.getElementById("para-progress-bar-status").innerHTML =
              res[0] +
              "Progress: " +
              value.toFixed(2) +
              "%" +
              " (total size: " +
              totalSizePrint +
              ")";
            // console.log(value, totalFileSize, uploadedFileSize)
          }
        }
      }
    });
    if (completionStatus === "Done") {
      countDone++;
      if (countDone > 1) {
        log.info("Done submit track");
        console.log("Done submit track");
        document.getElementById("para-please-wait-manage-dataset").innerHTML =
          "";
        clearInterval(timerProgress);
        bfSubmitDatasetBtn.disabled = false;
        pathSubmitDataset.disabled = false;
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    }
  }
});

selectLocalDsSubmit.addEventListener("click", function () {
  ipcRenderer.send("open-file-dialog-submit-dataset");
});

ipcRenderer.on("selected-submit-dataset", (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      $("#para-info-local-submit").html("");
      $("#selected-local-dataset-submit").attr("placeholder", `${filepath[0]}`);

      valid_dataset = verify_sparc_folder(filepath[0]);
      if (valid_dataset == true) {
        $("#button_upload_local_folder_confirm").click();
        $("#button-submit-dataset").show();
        $("#button-submit-dataset").addClass("pulse-blue");
        // remove pulse class after 4 seconds
        // pulse animation lasts 2 seconds => 2 pulses
        setTimeout(() => {
          $(".pulse-blue").removeClass("pulse-blue");
        }, 4000);
      } else {
        Swal.fire({
          icon: "warning",
          text: "This folder does not seems to be a SPARC dataset folder. Are you sure you want to proceed?",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            $("#button_upload_local_folder_confirm").click();
            $("#button-submit-dataset").show();
            $("#button-submit-dataset").addClass("pulse-blue");
            // remove pulse class after 4 seconds
            // pulse animation lasts 2 seconds => 2 pulses
            setTimeout(() => {
              $(".pulse-blue").removeClass("pulse-blue");
            }, 4000);
          } else {
            document.getElementById(
              "input-destination-getting-started-locally"
            ).placeholder = "Browse here";
            $("#selected-local-dataset-submit").attr(
              "placeholder",
              "Browse here"
            );
          }
        });
      }
    }
  }
});

const metadataDatasetlistChange = () => {
  // bfCurrentMetadataProgress.style.display = "block";
  $(".synced-progress").css("display", "block");
  datasetSubtitleStatus.innerHTML = "";
  datasetLicenseStatus.innerHTML = "";
  bfDatasetSubtitle.value = "";
  // datasetDescriptionStatus.innerHTML = "";
  datasetBannerImageStatus.innerHTML = "";
  showCurrentSubtitle();
  showCurrentDescription();
  showCurrentLicense();
  showCurrentBannerImage();
};

// Manage dataset permission

const permissionDatasetlistChange = () => {
  //console.log("permission")
  // bfCurrentPermissionProgress.style.display = "block";
  // bfAddEditCurrentPermissionProgress.style.display = "block";
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

// Change dataset status option change
$(bfListDatasetStatus).on("change", () => {
  $(bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");

  datasetStatusStatus.innerHTML = "";
  selectOptionColor(bfListDatasetStatus);

  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;
  var selectedStatusOption =
    bfListDatasetStatus.options[bfListDatasetStatus.selectedIndex].text;

  client.invoke(
    "api_bf_change_dataset_status",
    selectedBfAccount,
    selectedBfDataset,
    selectedStatusOption,
    (error, res) => {
      if (error) {
        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Change Dataset Status",
          selectedBfDataset
        );
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        function showErrorDatasetStatus() {
          datasetStatusStatus.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
        }
        showCurrentDatasetStatus(showErrorDatasetStatus);
      } else {
        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Change Dataset Status",
          selectedBfDataset
        );
        $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
        $("#bf-dataset-status-spinner").css("display", "none");
        datasetStatusStatus.innerHTML = res;
      }
    }
  );
});

// Add subtitle //
bfAddSubtitleBtn.addEventListener("click", () => {
  setTimeout(function () {
    log.info("Adding subtitle to dataset");
    log.info(bfDatasetSubtitle.value);

    $(".synced-progress").css("display", "block");
    $("#bf-add-subtitle-dataset-spinner").show();

    var selectedBfAccount = defaultBfAccount;
    var selectedBfDataset = defaultBfDataset;
    var inputSubtitle = bfDatasetSubtitle.value;

    client.invoke(
      "api_bf_add_subtitle",
      selectedBfAccount,
      selectedBfDataset,
      inputSubtitle,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          $("#bf-add-subtitle-dataset-spinner").hide();
          datasetSubtitleStatus.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          // bfCurrentMetadataProgress.style.display = "none";
          $(".synced-progress").css("display", "none");
          $("#ds-description").val("");
          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Add/Edit Subtitle",
            defaultBfDataset
          );
        } else {
          log.info("Added subtitle to dataset");
          $("#bf-add-subtitle-dataset-spinner").hide();
          $("#ds-description").val(inputSubtitle);
          datasetSubtitleStatus.innerHTML = res;
          // bfCurrentMetadataProgress.style.display = "none";
          $(".synced-progress").css("display", "none");
          ipcRenderer.send(
            "track-event",
            "Success",
            "Manage Dataset - Add/Edit Subtitle",
            defaultBfDataset
          );
        }
      }
    );
  }, delayAnimation);
});

const validateDescription = (description) => {
  description = description.trim();

  if (
    description.search("[*][*]Study Purpose[*][*]") == -1 &&
    description.search("[*][*]Study Purpose:[*][*]") == -1 &&
    description.search("[*][*]Study Purpose :[*][*]") == -1
  ) {
    return false;
  }
  if (
    description.search("[*][*]Data Collection[*][*]") == -1 &&
    description.search("[*][*]Data Collection:[*][*]") == -1 &&
    description.search("[*][*]Data Collection :[*][*]") == -1
  ) {
    return false;
  }
  if (
    description.search("[*][*]Primary Conclusion[*][*]") == -1 &&
    description.search("[*][*]Primary Conclusion:[*][*]") == -1 &&
    description.search("[*][*]Primary Conclusion :[*][*]") == -1
  ) {
    return false;
  }
  return true;
};

// Add description //
bfAddDescriptionBtn.addEventListener("click", () => {
  setTimeout(() => {
    $(".synced-progress").css("display", "block");
    $("#bf-add-description-dataset-spinner").show();

    var selectedBfAccount = defaultBfAccount;
    var selectedBfDataset = defaultBfDataset;
    var markdownDescription = tuiInstance.getMarkdown();

    let response = validateDescription(markdownDescription);

    if (!response) {
      Swal.fire({
        icon: "warning",
        html: `This description does not seem to follow the SPARC guidelines. 
          Your descriptions should looke like this:
          <br> <br> 
          <p style="text-align:left">
            <strong> Study Purpose: </strong> <br>
            <strong> Data Collection: </strong> <br>
            <strong> Primary Conclusion: </strong> 
          </p>
          <br> <br>
          Are you sure you want to continue?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Continue",
        cancelButtonText: "No, I want to edit my description",
        reverseButtons: true,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then(() => {
        addDescription(
          selectedBfAccount,
          selectedBfDataset,
          markdownDescription
        );
      });
    } else {
      addDescription(selectedBfAccount, selectedBfDataset, markdownDescription);
    }
  }, delayAnimation);
});

const addDescription = (
  selectedBfAccount,
  selectedBfDataset,
  markdownDescription
) => {
  client.invoke(
    "api_bf_add_description",
    selectedBfAccount,
    selectedBfDataset,
    markdownDescription,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        $("#bf-add-description-dataset-spinner").hide();
        datasetDescriptionStatus.innerHTML =
          "<span style='color: red;'> " + emessage + "</span>";
        // bfCurrentMetadataProgress.style.display = "none";
        $(".synced-progress").css("display", "none");
        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Add/Edit Description",
          selectedBfDataset
        );
      } else {
        $("#bf-add-description-dataset-spinner").hide();
        datasetDescriptionStatus.innerHTML = res;
        // bfCurrentMetadataProgress.style.display = "none";
        $(".synced-progress").css("display", "none");
        showDatasetDescription();
        changeDatasetUnderDD();
        ipcRenderer.send(
          "track-event",
          "Success",
          "Manage Dataset - Add/Edit Description",
          selectedBfDataset
        );
      }
    }
  );
};

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
// Action when user click on "Import image" button for banner image
bfImportBannerImageBtn.addEventListener("click", (event) => {
  datasetBannerImageStatus.innerHTML = "";
  ipcRenderer.send("open-file-dialog-import-banner-image");
});

ipcRenderer.on("selected-banner-image", async (event, path) => {
  if (path.length > 0) {
    let original_image_path = path[0];
    let image_path = original_image_path;
    let destination_image_path = require("path").join(
      homeDirectory,
      "SODA",
      "banner-image-conversion"
    );
    let converted_image_file = require("path").join(
      destination_image_path,
      "converted-tiff.jpg"
    );
    let conversion_success = true;
    imageExtension = path[0].split(".").pop();

    if (imageExtension.toLowerCase() == "tiff") {
      $("body").addClass("waiting");
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
          console.log("starting tiff conversion");
          if (!fs.existsSync(destination_image_path)) {
            fs.mkdirSync(destination_image_path);
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
                console.log("File size too large. Resizing image");

                fs.unlinkSync(converted_image_file);

                await Jimp.read(original_image_path)
                  .then((file) => {
                    return file
                      .resize(1024, 1024)
                      .write(converted_image_file, () => {
                        document.getElementById(
                          "div-img-container-holder"
                        ).style.display = "none";
                        document.getElementById(
                          "div-img-container"
                        ).style.display = "block";

                        datasetBannerImagePath.innerHTML = image_path;
                        bfViewImportedImage.src = converted_image_file;
                        myCropper.destroy();
                        myCropper = new Cropper(
                          bfViewImportedImage,
                          cropOptions
                        );
                        $("#save-banner-image").css("visibility", "visible");
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
                    console.log("File size is too big", fileSizeInMegabytes);
                    conversion_success = false;
                    // SHOW ERROR
                  }
                }
              }
              console.log("file conversion complete");
              image_path = converted_image_file;
              imageExtension = "jpg";
              datasetBannerImagePath.innerHTML = image_path;
              bfViewImportedImage.src = image_path;
              myCropper.destroy();
              myCropper = new Cropper(bfViewImportedImage, cropOptions);
              $("#save-banner-image").css("visibility", "visible");
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
      document.getElementById("div-img-container-holder").style.display =
        "none";
      document.getElementById("div-img-container").style.display = "block";

      datasetBannerImagePath.innerHTML = image_path;
      bfViewImportedImage.src = image_path;
      myCropper.destroy();
      myCropper = new Cropper(bfViewImportedImage, cropOptions);
      $("#save-banner-image").css("visibility", "visible");
    }
  } else {
    if ($("#para-current-banner-img").text() === "None") {
      $("#save-banner-image").css("visibility", "hidden");
    } else {
      $("#save-banner-image").css("visibility", "visible");
    }
  }
});

function uploadBannerImage() {
  // bfCurrentMetadataProgress.style.display = "block";
  $(".synced-progress").css("display", "block");
  datasetBannerImageStatus.innerHTML = "Please wait...";
  //Save cropped image locally and check size
  var imageFolder = path.join(homeDirectory, "SODA", "banner-image");
  if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder, { recursive: true });
  }
  if (imageExtension == "png") {
    var imageType = "image/png";
  } else {
    var imageType = "image/jpeg";
  }
  var imagePath = path.join(imageFolder, "banner-image-SODA." + imageExtension);
  var croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);
  imageDataURI.outputFile(croppedImageDataURI, imagePath).then(() => {
    let image_file_size = fs.statSync(imagePath)["size"];
    if (image_file_size < 5 * 1024 * 1024) {
      var selectedBfAccount = defaultBfAccount;
      var selectedBfDataset = defaultBfDataset;

      client.invoke(
        "api_bf_add_banner_image",
        selectedBfAccount,
        selectedBfDataset,
        imagePath,
        (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            var emessage = userError(error);
            datasetBannerImageStatus.innerHTML =
              "<span style='color: red;'> " + emessage + "</span>";
            // bfCurrentMetadataProgress.style.display = "none";
            $(".synced-progress").css("display", "none");
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Upload Banner Image",
              selectedBfDataset,
              image_file_size
            );
          } else {
            datasetBannerImageStatus.innerHTML = res;
            showCurrentBannerImage();
            // bfCurrentMetadataProgress.style.display = "none";
            $(".synced-progress").css("display", "none");
            $("#edit_banner_image_modal").modal("hide");
            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Upload Banner Image",
              selectedBfDataset,
              image_file_size
            );
          }
        }
      );
    } else {
      datasetBannerImageStatus.innerHTML =
        "<span style='color: red;'> " +
        "Final image size must be less than 5 MB" +
        "</span>";
    }
  });
}

bfSaveBannerImageBtn.addEventListener("click", (event) => {
  datasetBannerImageStatus.innerHTML = "";
  if (bfViewImportedImage.src.length > 0) {
    if (formBannerHeight.value > 511) {
      Swal.fire({
        icon: "warning",
        text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
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
        if (formBannerHeight.value < 1024) {
          // ipcRenderer.send(
          //   "warning-banner-image-below-1024",
          //   formBannerHeight.value
          // );

          Swal.fire({
            icon: "warning",
            text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${formBannerHeight.value} px. Would you like to continue?`,
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
              uploadBannerImage();
            }
          });
        } else {
          uploadBannerImage();
        }
      });
    } else {
      datasetBannerImageStatus.innerHTML =
        "<span style='color: red;'> " +
        "Dimensions of cropped area must be at least 512 px" +
        "</span>";
    }
  } else {
    datasetBannerImageStatus.innerHTML =
      "<span style='color: red;'> " +
      "Please import an image first" +
      "</span>";
  }
});

ipcRenderer.on("show-banner-image-below-1024", (event, index) => {
  if (index === 0) {
    uploadBannerImage();
  }
});

// Add license //
bfAddLicenseBtn.addEventListener("click", () => {
  setTimeout(function () {
    // bfCurrentMetadataProgress.style.display = "block";
    $(".synced-progress").css("display", "block");
    $("#bf-add-license-dataset-spinner").show();
    datasetLicenseStatus.innerHTML = "";

    var selectedBfAccount = defaultBfAccount;
    var selectedBfDataset = defaultBfDataset;
    var selectedLicense = "Creative Commons Attribution";

    client.invoke(
      "api_bf_add_license",
      selectedBfAccount,
      selectedBfDataset,
      selectedLicense,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          $("#bf-add-license-dataset-spinner").hide();
          datasetLicenseStatus.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          // bfCurrentMetadataProgress.style.display = "none";
          $(".synced-progress").css("display", "none");
          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Assign License",
            selectedBfDataset
          );
        } else {
          $("#bf-add-license-dataset-spinner").hide();
          datasetLicenseStatus.innerHTML = res;
          showCurrentLicense();
          ipcRenderer.send(
            "track-event",
            "Success",
            "Manage Dataset - Assign License",
            selectedBfDataset
          );
        }
      }
    );
  }, delayAnimation);
});

// Make PI owner //
bfAddPermissionPIBtn.addEventListener("click", () => {
  datasetPermissionStatusPI.innerHTML = "";
  Swal.fire({
    icon: "warning",
    text: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    heightAuto: false,
    showCancelButton: true,
    cancelButtonText: "No",
    focusCancel: true,
    confirmButtonText: "Yes",
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      log.info("Changing PI Owner of datset");
      $("#bf-add-permission-pi-spinner").css("visibility", "visible");
      datasetPermissionStatusPI.innerHTML = "";
      //disableform(bfPermissionForm);

      var selectedBfAccount = defaultBfAccount;
      var selectedBfDataset = defaultBfDataset;
      var selectedUser =
        bfListUsersPI.options[bfListUsersPI.selectedIndex].value;
      var selectedRole = "owner";

      client.invoke(
        "api_bf_add_permission",
        selectedBfAccount,
        selectedBfDataset,
        selectedUser,
        selectedRole,
        (error, res) => {
          if (error) {
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Change PI Owner",
              selectedBfDataset
            );
            $("#bf-add-permission-pi-spinner").css("visibility", "hidden");
            log.error(error);
            console.error(error);
            var emessage = userError(error);
            datasetPermissionStatusPI.innerHTML =
              "<span style='color: red;'> " + emessage + "</span>";
            // bfCurrentPermissionProgress.style.display = "none";
            // bfAddEditCurrentPermissionProgress.style.display = "none";
          } else {
            log.info("Changed PI Owner of datset");
            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Change PI Owner",
              selectedBfDataset
            );
            let nodeStorage = new JSONStorage(app.getPath("userData"));
            nodeStorage.setItem("previously_selected_PI", selectedUser);
            $("#bf-add-permission-pi-spinner").css("visibility", "hidden");
            datasetPermissionStatusPI.innerHTML = res;
            showCurrentPermission();
            changeDatasetRolePI(selectedBfDataset);
          }
        }
      );
    }
  });
});

// ipcRenderer.on("warning-add-permission-owner-selection-PI", (event, index) => {
//   $("#bf-add-permission-pi-spinner").css("visibility", "visible");
//   datasetPermissionStatusPI.innerHTML = "";
//   //disableform(bfPermissionForm);

//   var selectedBfAccount = defaultBfAccount;
//   var selectedBfDataset = defaultBfDataset;
//   var selectedUser = bfListUsersPI.options[bfListUsersPI.selectedIndex].value;
//   var selectedRole = "owner";

//   if (index === 0) {
//     client.invoke(
//       "api_bf_add_permission",
//       selectedBfAccount,
//       selectedBfDataset,
//       selectedUser,
//       selectedRole,
//       (error, res) => {
//         if (error) {
//           ipcRenderer.send(
//             "track-event",
//             "Error",
//             "Manage Dataset - Change PI Owner",
//             selectedBfDataset
//           );
//           $("#bf-add-permission-pi-spinner").css("visibility", "hidden");
//           log.error(error);
//           console.error(error);
//           var emessage = userError(error);
//           datasetPermissionStatusPI.innerHTML =
//             "<span style='color: red;'> " + emessage + "</span>";
//           // bfCurrentPermissionProgress.style.display = "none";
//           // bfAddEditCurrentPermissionProgress.style.display = "none";
//         } else {
//           ipcRenderer.send(
//             "track-event",
//             "Success",
//             "Manage Dataset - Change PI Owner",
//             selectedBfDataset
//           );
//           let nodeStorage = new JSONStorage(app.getPath("userData"));
//           nodeStorage.setItem("previously_selected_PI", selectedUser);
//           $("#bf-add-permission-pi-spinner").css("visibility", "hidden");
//           datasetPermissionStatusPI.innerHTML = res;
//           showCurrentPermission();
//           changeDatasetRolePI(selectedBfDataset);
//         }
//       }
//     );
//   } else {
//     // bfCurrentPermissionProgress.style.display = "none";
//     // bfAddEditCurrentPermissionProgress.style.display = "none";
//     $("#bf-add-permission-pi-spinner").css("visibility", "hidden");
//   }
// });

// Add permission for user //
bfAddPermissionBtn.addEventListener("click", () => {
  setTimeout(function () {
    log.info("Adding a permission for a user on a dataset");
    $("#bf-add-permission-user-spinner").show();
    datasetPermissionStatus.innerHTML = "";
    // bfCurrentPermissionProgress.style.display = "block";
    // bfAddEditCurrentPermissionProgress.style.display = "block";
    //disableform(bfPermissionForm);

    var selectedBfAccount = defaultBfAccount;
    var selectedBfDataset = defaultBfDataset;
    var selectedUser = bfListUsers.options[bfListUsers.selectedIndex].value;
    var selectedRole = bfListRoles.options[bfListRoles.selectedIndex].text;

    addPermissionUser(
      selectedBfAccount,
      selectedBfDataset,
      selectedUser,
      selectedRole
    );

    // if (selectedRole === "owner") {
    //   ipcRenderer.send("warning-add-permission-owner");
    // } else {
    // }
  }, delayAnimation);
});

// ipcRenderer.on("warning-add-permission-owner-selection", (event, index) => {
//   var selectedBfAccount = defaultBfAccount;
//   var selectedBfDataset = defaultBfDataset;
//   var selectedUser = bfListUsers.options[bfListUsers.selectedIndex].value;
//   var selectedRole = bfListRoles.options[bfListRoles.selectedIndex].text;

//   datasetPermissionStatus.innerHTML = "";

//   if (index === 0) {
//     addPermissionUser(
//       selectedBfAccount,
//       selectedBfDataset,
//       selectedUser,
//       selectedRole
//     );
//     ipcRenderer.send(
//       "track-event",
//       "Success",
//       "Manage Dataset - Add User Permission",
//       selectedBfDataset
//     );
//     $("#bf-add-permission-user-spinner").hide();
//   } else {
//     $("#bf-add-permission-user-spinner").hide();
//     // bfCurrentPermissionProgress.style.display = "none";
//     // bfAddEditCurrentPermissionProgress.style.display = "none";
//   }
// });

// Add permission for team
bfAddPermissionTeamBtn.addEventListener("click", () => {
  setTimeout(function () {
    log.info("Adding a permission for a team on a dataset");
    $("#bf-add-permission-team-spinner").show();
    datasetPermissionStatusTeam.innerHTML = "";

    var selectedBfAccount = defaultBfAccount;
    var selectedBfDataset = defaultBfDataset;
    var selectedTeam = bfListTeams.options[bfListTeams.selectedIndex].text;
    var selectedRole =
      bfListRolesTeam.options[bfListRolesTeam.selectedIndex].text;

    client.invoke(
      "api_bf_add_permission_team",
      selectedBfAccount,
      selectedBfDataset,
      selectedTeam,
      selectedRole,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          $("#bf-add-permission-team-spinner").hide();
          datasetPermissionStatusTeam.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          // bfCurrentPermissionProgress.style.display = "none";
          // bfAddEditCurrentPermissionProgress.style.display = "none";
        } else {
          log.info("Added permission for the team");
          $("#bf-add-permission-team-spinner").hide();
          datasetPermissionStatusTeam.innerHTML = res + ". " + smileyCan;
          showCurrentPermission();
        }
      }
    );
  }, delayAnimation);
});

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

// function clearStrings() {
//   document.getElementById("para-save-file-organization-status").innerHTML = "";
//   document.getElementById(
//     "para-preview-organization-status-metadata"
//   ).innerHTML = "";
//   document.getElementById("para-selected-dataset").innerHTML = "";
// }

function userError(error) {
  var myerror = error.message;
  return myerror;
}

// Manage Datasets //

function showCurrentSubtitle() {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    // bfCurrentMetadataProgress.style.display = "none";
    $(".synced-progress").css("display", "none");
    bfDatasetSubtitle.value = "";
  } else {
    document.getElementById("ds-description").innerHTML = "Loading...";
    document.getElementById("ds-description").disabled = true;
    client.invoke(
      "api_bf_get_subtitle",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          $("#ds-description").val("");
        } else {
          bfDatasetSubtitle.value = res;
          $("#ds-description").val(res);
          let result = countCharacters(
            bfDatasetSubtitle,
            bfDatasetSubtitleCharCount
          );
          if (result === 0) {
            $("#button-add-subtitle > .btn_animated-inside").html(
              "Add subtitle"
            );
          } else {
            $("#button-add-subtitle > .btn_animated-inside").html(
              "Edit subtitle"
            );
          }
        }
      }
    );
    document.getElementById("ds-description").disabled = false;
  }
}

function showCurrentDescription() {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;
  if (selectedBfDataset === "Select dataset") {
    // bfCurrentMetadataProgress.style.display = "none";
    $(".synced-progress").css("display", "none");
    tuiInstance.setMarkdown("");
  } else {
    client.invoke(
      "api_bf_get_description",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
        } else {
          if (res == "") {
            res = `**Study Purpose:** &nbsp; \n \n **Data Collection:** &nbsp; \n \n **Primary Conclusion:** &nbsp; `;
            tuiInstance.setMarkdown(res);
            $("#button-add-description > .btn_animated-inside").html(
              "Add description"
            );
          } else {
            tuiInstance.setMarkdown(res);
            $("#button-add-description > .btn_animated-inside").html(
              "Edit description"
            );
          }
        }
      }
    );
  }
}

const showCurrentBannerImage = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    // bfCurrentMetadataProgress.style.display = "none";
    $(".synced-progress").css("display", "none");
    $("#banner_image_loader").hide();
    bfCurrentBannerImg.src = "";
    document.getElementById("para-current-banner-img").innerHTML = "None";
    bfViewImportedImage.src = "";
    $("#div-img-container-holder").css("display", "block");
    $("#div-img-container").css("display", "none");
    $("#save-banner-image").css("visibility", "hidden");
    myCropper.destroy();
  } else {
    $("#banner_image_loader").show();
    document.getElementById("para-current-banner-img").innerHTML = "";
    client.invoke(
      "api_bf_get_banner_image",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          // bfCurrentMetadataProgress.style.display = "none";
          $(".synced-progress").css("display", "none");
          $("#banner_image_loader").hide();
          bfCurrentBannerImg.src = "assets/img/no-banner-image.png";
          document.getElementById("para-current-banner-img").innerHTML = "None";
          bfViewImportedImage.src = "";
          $("#div-img-container-holder").css("display", "block");
          $("#div-img-container").css("display", "none");
          $("#save-banner-image").css("visibility", "hidden");
          myCropper.destroy();
        } else {
          if (res === "No banner image") {
            bfCurrentBannerImg.src = "";
            document.getElementById("para-current-banner-img").innerHTML =
              "None";
            bfViewImportedImage.src = "";
            $("#div-img-container-holder").css("display", "block");
            $("#div-img-container").css("display", "none");
            $("#save-banner-image").css("visibility", "hidden");
            myCropper.destroy();
          } else {
            document.getElementById("para-current-banner-img").innerHTML = "";
            bfCurrentBannerImg.src = res;
          }
          // bfCurrentMetadataProgress.style.display = "none";
          $(".synced-progress").css("display", "none");
          $("#banner_image_loader").hide();
        }
      }
    );
  }
};

function showCurrentLicense() {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  currentDatasetLicense.innerHTML = `Loading current license... <div class="ui active green inline loader tiny"></div>`;

  if (selectedBfDataset === "Select dataset") {
    currentDatasetLicense.innerHTML = "None";
    // bfCurrentMetadataProgress.style.display = "none";
    $(".synced-progress").css("display", "none");
  } else {
    client.invoke(
      "api_bf_get_license",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          // bfCurrentMetadataProgress.style.display = "none";
          $(".synced-progress").css("display", "none");
        } else {
          currentDatasetLicense.innerHTML = res;
          if (res === "Creative Commons Attribution") {
            $("#button-add-license").hide();
            $("#assign-a-license-header").hide();
            $("#para-dataset-license-status").html(
              "You are all set. This dataset already has the correct license assigned."
            );
          } else {
            $("#button-add-license").show();
            $("#assign-a-license-header").show();
          }
          $(".synced-progress").css("display", "none");
        }
      }
    );
  }
}

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
        $("#button-add-permission").hide();
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

function showCurrentPermission() {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  currentAddEditDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;

  if (selectedBfDataset === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    currentAddEditDatasetPermission.innerHTML = "None";
    // bfCurrentPermissionProgress.style.display = "none";
    // bfAddEditCurrentPermissionProgress.style.display = "none";
  } else {
    client.invoke(
      "api_bf_get_permission",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          // bfCurrentPermissionProgress.style.display = "none";
          // bfAddEditCurrentPermissionProgress.style.display = "none";
        } else {
          var permissionList = "";
          let datasetOwner = "";
          for (var i in res) {
            permissionList = permissionList + res[i] + "<br>";
            if (res[i].indexOf("owner") != -1) {
              let first_position = res[i].indexOf(":");
              let second_position = res[i].indexOf(",");
              datasetOwner = res[i].substring(
                first_position + 2,
                second_position
              );
            }
          }
          currentDatasetPermission.innerHTML = datasetOwner;
          currentAddEditDatasetPermission.innerHTML = permissionList;
          // bfCurrentPermissionProgress.style.display = "none";
          // bfAddEditCurrentPermissionProgress.style.display = "none";
          curation_consortium_check();
        }
      }
    );
  }
}

function addPermissionUser(
  selectedBfAccount,
  selectedBfDataset,
  selectedUser,
  selectedRole
) {
  client.invoke(
    "api_bf_add_permission",
    selectedBfAccount,
    selectedBfDataset,
    selectedUser,
    selectedRole,
    (error, res) => {
      if (error) {
        $("#bf-add-permission-user-spinner").hide();
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        datasetPermissionStatus.innerHTML =
          "<span style='color: red;'> " + emessage + "</span>";
        // bfCurrentPermissionProgress.style.display = "none";
        // bfAddEditCurrentPermissionProgress.style.display = "none";
      } else {
        log.info("Dataset permission added");
        datasetPermissionStatus.innerHTML = res;
        showCurrentPermission();

        // refresh dataset lists with filter
        client.invoke("api_get_username", selectedBfAccount, (error, res1) => {
          if (error) {
            $("#bf-add-permission-user-spinner").hide();
            log.error(error);
            console.error(error);
          } else {
            if (selectedRole === "owner") {
              for (var i = 0; i < datasetList.length; i++) {
                if (datasetList[i].name === selectedBfDataset) {
                  datasetList[i].role = "manager";
                }
              }
            }

            if (selectedUser === res1) {
              // then change role of dataset and refresh dataset list
              for (var i = 0; i < datasetList.length; i++) {
                if (datasetList[i].name === selectedBfDataset) {
                  datasetList[i].role = selectedRole.toLowerCase();
                }
              }
            }
            $("#bf-add-permission-user-spinner").hide();
          }
        });
      }
    }
  );
}

const removeRadioOptions = (ele) => {
  $(`#${ele}`).html("");
};

const addRadioOption = (ul, text, val) => {
  let li = document.createElement("li");
  let element = `<input type="radio" id="${val}_radio" value="${val}" name="dataset_status_radio"/> <label for="${val}_radio">${text}</label> <div class="check"></div>`;
  $(li).html(element);
  $(`#${ul}`).append(li);
};

function showCurrentDatasetStatus(callback) {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");
    datasetStatusStatus.innerHTML = "";
    removeOptions(bfListDatasetStatus);
    removeRadioOptions("dataset_status_ul");
    bfListDatasetStatus.style.color = "black";
  } else {
    datasetStatusStatus.innerHTML = "";
    client.invoke(
      "api_bf_get_dataset_status",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          datasetStatusStatus.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
        } else {
          var myitemselect = [];
          removeOptions(bfListDatasetStatus);
          removeRadioOptions("dataset_status_ul");
          for (var item in res[0]) {
            var option = document.createElement("option");
            option.textContent = res[0][item]["displayName"];
            option.value = res[0][item]["name"];
            option.style.color = res[0][item]["color"];
            bfListDatasetStatus.appendChild(option);
            addRadioOption(
              "dataset_status_ul",
              res[0][item]["displayName"],
              res[0][item]["name"]
            );
          }
          bfListDatasetStatus.value = res[1];
          $(`input[name=dataset_status_radio][value=${res[1]}]`).prop(
            "checked",
            true
          );
          selectOptionColor(bfListDatasetStatus);
          $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
          datasetStatusStatus.innerHTML = "";
          if (callback !== undefined) {
            callback();
          }
        }
      }
    );
  }
}

function selectOptionColor(mylist) {
  mylist.style.color = mylist.options[mylist.selectedIndex].style.color;
}

////////////////////////////////DATASET FILTERING FEATURE/////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

/// add new datasets to dataset List without calling Python to retrieve new list from Pennsieve
function addNewDatasetToList(newDataset) {
  datasetList.push({ name: newDataset, role: "owner" });
}

/// change PI owner status to manager
function changeDatasetRolePI(selectedDataset) {
  for (var i = 0; i < datasetList.length; i++) {
    if (datasetList[i].name === selectedDataset) {
      datasetList[i].role = "manager";
    }
  }
}
// this function now is only used to load all datasets ("All" permission)
// onto the dataset_description file ds-name select
function refreshDatasetList() {
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
}

/// populate the dropdowns with refreshed dataset list
function populateDatasetDropdowns(mylist) {
  clearDatasetDropdowns();
  for (myitem in mylist) {
    var myitemselect = mylist[myitem];
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    var option1 = option.cloneNode(true);
    var option2 = option.cloneNode(true);

    // datasetDescriptionFileDataset.appendChild(option1);
    curateDatasetDropdown.appendChild(option2);
  }
  metadataDatasetlistChange();
  permissionDatasetlistChange();
  postCurationListChange();
  datasetStatusListChange();
  // changeDatasetUnderDD();
}

function changeDatasetUnderDD() {
  datasetDescriptionFileDataset.value = defaultBfDataset;
  showDatasetDescription();
}
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
  } else {
    $("#para-share-curation_team-status").text("");
    $("#para-share-with-sparc-consortium-status").text("");
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
function populateJSONObjFolder(jsonObject, folderPath) {
  var myitems = fs.readdirSync(folderPath);
  myitems.forEach((element) => {
    var statsObj = fs.statSync(path.join(folderPath, element));
    var addedElement = path.join(folderPath, element);
    if (statsObj.isDirectory() && !/(^|\/)\.[^\/\.]/g.test(element)) {
      jsonObject["folders"][element] = {
        type: "local",
        folders: {},
        files: {},
        action: ["new"],
      };
      populateJSONObjFolder(jsonObject["folders"][element], addedElement);
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

var editSPARCAwardsTitle =
  "<h3 style='text-align:center'> Add/Remove your SPARC Award(s) below: <i class='fas fa-info-circle popover-tooltip' data-content='The list of active SPARC awards in this dropdown list is generated automatically from the SPARC Airtable sheet once SODA is connected with your Airtable account. Select your award(s) and click on Add to save it/them in SODA. You will only have to do this once. SODA will automatically load these awards next time you launch SODA.' rel='popover' data-placement='right' data-html='true' data-trigger='hover'></i></h3>";

function editSPARCAwardsBootbox() {
  $(sparcAwardEditMessage).css("display", "block");
  var bootb = bootbox.dialog({
    title: editSPARCAwardsTitle,
    message: sparcAwardEditMessage,
    buttons: {
      cancel: {
        label: "Cancel",
      },
      confirm: {
        label: "Confirm",
        className: "btn btn-primary bootbox-add-airtable-class",
        callback: function () {
          $(bootb).find(".modal-footer span").remove();
          var message = addSPARCAwards();
          bootb.find(".modal-footer").prepend(message);
          if (
            $(".bootbox-add-airtable-class").text() == "Confirm" &&
            $(bootb).find(".modal-footer span").text() == ""
          ) {
            return true;
          } else {
            return false;
          }
        },
      },
    },
    size: "medium",
    centerVertical: true,
    onShown: function (e) {
      $(".popover-tooltip").each(function () {
        var $this = $(this);
        $this.popover({
          trigger: "hover",
          container: $this,
        });
      });
    },
  });
}

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

ipcRenderer.on("selected-folders-organize-datasets", (event, path) => {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  addFoldersfunction(path, myPath);
});

function addFoldersfunction(folderArray, currentLocation) {
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
    // check for duplicates/folders with the same name
    for (var i = 0; i < folderArray.length; i++) {
      var j = 1;
      var originalFolderName = path.basename(folderArray[i]);
      var renamedFolderName = originalFolderName;
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

async function drop(ev) {
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
    /// Get all the file information
    var itemPath = ev.dataTransfer.files[i].path;
    var itemName = path.parse(itemPath).base;
    var duplicate = false;
    var statsObj = fs.statSync(itemPath);
    // check for duplicate or files with the same name
    for (var j = 0; j < ev.target.children.length; j++) {
      if (itemName === ev.target.children[j].innerText) {
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
      $(appendString).appendTo(ev.target);
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
      $(placeholderString).appendTo(ev.target);
      await listItems(myPath, "#items");
      if (element !== originalName) {
        myPath["folders"][element]["action"].push("renamed");
      }
      populateJSONObjFolder(
        myPath["folders"][element],
        importedFolders[element]["path"]
      );
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        element +
        "</div></div>";
      $("#placeholder_element").remove();
      $(appendString).appendTo(ev.target);
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

$("#bf-rename-dataset-name").keyup(function () {
  let newName = $("#bf-rename-dataset-name").val().trim();

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      $("#para-rename-dataset-message").html(
        "Error: A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>."
      );
      $("#button-rename-dataset").hide();
    } else {
      $("#para-rename-dataset-message").html("");
      $("#button-rename-dataset").show();
    }
  } else {
    if (newName == "") {
      $("#para-rename-dataset-message").html("");
    }
    $("#button-rename-dataset").hide();
  }
});

$("#bf-new-dataset-name").keyup(function () {
  let newName = $("#bf-new-dataset-name").val().trim();
  $("#para-add-new-dataset-status").text("");

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      $("#para-new-name-dataset-message").html(
        "Error: A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>."
      );
      $("#button-create-bf-new-dataset").hide();
    } else {
      $("#para-new-name-dataset-message").html("");
      $("#button-create-bf-new-dataset").show();
    }
  } else {
    $("#button-create-bf-new-dataset").hide();
  }
});

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
      // $("#nextBtn").prop("disabled", false);
    }
  } else {
    $("#div-confirm-inputNewNameDataset").css("display", "none");
    $("#btn-confirm-new-dataset-name").hide();
    // $("#nextBtn").prop("disabled", true);
  }
});

// Defined above
// $("#inputNewNameDataset").click(function () {
//   var newName = $("#inputNewNameDataset").val().trim();

//   if (newName !== "") {
//     if (check_forbidden_characters_bf(newName)) {
//       document.getElementById("div-confirm-inputNewNameDataset").style.display =
//         "none";
//       $("#btn-confirm-new-dataset-name").hide();
//       $("#nextBtn").prop("disabled", true);
//       $("#Question-generate-dataset-generate-div-old").removeClass("show");
//     } else {
//       $("#div-confirm-inputNewNameDataset").css("display", "flex");
//       $("#btn-confirm-new-dataset-name").show();
//       $("#Question-generate-dataset-generate-div").show();
//       $("#Question-generate-dataset-generate-div").children().show();

//       $("#Question-generate-dataset-generate-div-old").addClass("show");
//       document.getElementById("para-new-name-dataset-message").innerHTML = "";
//       $("#nextBtn").prop("disabled", false);
//     }
//   } else {
//     $("#nextBtn").prop("disabled", true);
//   }
// });

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
          sodaJSONObj["starting-point"]["local-path"] = filepath[0];
          create_json_object(sodaJSONObj);
          datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
          populate_existing_folders(datasetStructureJSONObj);
          populate_existing_metadata(sodaJSONObj);
          if (valid_dataset == true) {
            $("#para-continue-location-dataset-getting-started").text(
              "Please continue below."
            );
            $("#nextBtn").prop("disabled", false);
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
                $("#nextBtn").prop("disabled", false);
                $("#para-continue-location-dataset-getting-started").text(
                  "Please continue below."
                );
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
    // setTimeout(function () {
    $($($(this).parent()[0]).parents()[0]).removeClass("tab-active");
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("start-over-btn").style.display = "none";
    document.getElementById("div-vertical-progress-bar").style.display = "none";
    document.getElementById("div-generate-comeback").style.display = "none";
    document.getElementById("generate-dataset-progress-tab").style.display =
      "flex";
    $("#sidebarCollapse").prop("disabled", true);

    // forceActionSidebar("hide");

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

          // $("#save-progress-btn").hide();

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
                // then show the sidebar again
                // forceActionSidebar("show");
                // $("#save-progress-btn").show();
                document.getElementById(
                  "para-please-wait-new-curate"
                ).innerHTML = "Return to make changes";
                document.getElementById("div-generate-comeback").style.display =
                  "flex";
              }
            });
            // ipcRenderer.send('warning-empty-files-folders-generate', message)
          } else {
            initiate_generate();
          }
        }
      }
    );
    // }, 250);
  });

// ipcRenderer.on('warning-empty-files-folders-generate-selection', (event, index) => {
//   if (index === 0) {
//     console.log("Continue")
//     initiate_generate()
//   } else {
//     console.log("Stop")
//     // then show the sidebar again
//     forceActionSidebar('show')
//     document.getElementById("para-please-wait-new-curate").innerHTML = "Return to make changes";
//     document.getElementById('div-generate-comeback').style.display = "flex"
//   }
// })

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
  // Initiate curation by calling Python funtion
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

var forbidden_characters_bf = '/:*?"<>';

function check_forbidden_characters_bf(my_string) {
  // Args:
  // my_string: string with characters (string)
  // Returns:
  // False: no forbidden character
  // True: presence of forbidden character(s)
  var check = false;
  for (var i = 0; i < forbidden_characters_bf.length; i++) {
    if (my_string.indexOf(forbidden_characters_bf[i]) > -1) {
      return true;
      break;
    }
  }
  return check;
}

var metadataIndividualFile = "";
var metadataAllowedExtensions = [];
var metadataParaElement = "";

function importMetadataFiles(ev, metadataFile, extentionList, paraEle) {
  document.getElementById(paraEle).innerHTML = "";
  metadataIndividualFile = metadataFile;
  metadataAllowedExtensions = extentionList;
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
            "Retreive Dataset - Pennsieve",
            sodaJSONObj["bf-dataset-selected"]["dataset-name"]
          );
        } else {
          resolve(res);
          ipcRenderer.send(
            "track-event",
            "Success",
            "Retreive Dataset - Pennsieve",
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
  $("#para-share-curation_team-status").css(
    "color",
    "var(--color-light-green)"
  );
  $("#para-share-with-sparc-consortium-status").css(
    "color",
    "var(--color-light-green)"
  );

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

        $("#para-share-curation_team-status").css("color", "red");
        $("#para-share-curation_team-status").text(
          "This account is not in the SPARC Consortium organization. Please switch accounts and try again"
        );
        $("#para-share-with-sparc-consortium-status").css("color", "red");
        $("#para-share-with-sparc-consortium-status").text(
          "This account is not in the SPARC Consortium organization. Please switch accounts and try again"
        );

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
                      if (mode != "update") {
                        $("#para-share-curation_team-status").text(
                          "You are all set! This dataset has already been shared with the Curation team."
                        );
                      }
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
                      if (mode != "update") {
                        $("#para-share-with-sparc-consortium-status").text(
                          "You are all set! This dataset has already been shared with the SPARC Consortium."
                        );
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
            "Retreive Dataset - Pennsieve",
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
            "Retreive Dataset - Pennsieve",
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
          // showClass: {
          //   popup: ''
          // },
          // hideClass: {
          //   popup: ''
          // }
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

function showAddAirtableAccountSweetalert(keyword) {
  var htmlTitle = `<h4 style="text-align:center">Please specify a key name and enter your Airtable API key below: <i class="fas fa-info-circle swal-popover" data-tippy-content="Note that the key will be stored locally on your computer and the SODA Team will not have access to it." rel="popover" data-placement="right" data-html="true" data-trigger="hover" ></i></h4>`;

  var bootb = Swal.fire({
    title: htmlTitle,
    html: airtableAccountBootboxMessage,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add Account",
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    reverseButtons: reverseSwalButtons,
    customClass: "swal-wide",
    footer:
      "<a href='https://github.com/bvhpatel/SODA/wiki/Connect-your-Airtable-account-with-SODA' target='_blank' style='text-decoration:none'> Where do i find my Airtable API key.</a>",
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    didOpen: () => {
      // $(".swal-popover").popover();
      tippy("[data-tippy-content]", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
      });
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addAirtableAccountInsideSweetalert(keyword);
    }
  });
}

function addAirtableAccountInsideSweetalert(keyword) {
  // var name = $("#bootbox-airtable-key-name").val();
  var name = "SODA-Airtable";
  var key = $("#bootbox-airtable-key").val();
  if (name.length === 0 || key.length === 0) {
    var errorMessage =
      "<span>Please fill in both required fields to add.</span>";
    Swal.fire({
      icon: "error",
      html: errorMessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    }).then((result) => {
      if (result.isConfirmed) {
        showAddAirtableAccountSweetalert(keyword);
      }
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Connect to Airtable",
      text: "This will erase your previous manual input under the submission and/or dataset description file(s). Would you like to continue??",
      heightAuto: false,
      showCancelButton: true,
      focusCancel: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
      reverseButtons: reverseSwalButtons,
      backdrop: "rgba(0,0,0,0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const optionsSparcTable = {
          hostname: airtableHostname,
          port: 443,
          path: "/v0/appSDqnnxSuM1s2F7/sparc_members",
          headers: { Authorization: `Bearer ${key}` },
        };
        var sparcTableSuccess;
        https.get(optionsSparcTable, (res) => {
          if (res.statusCode === 200) {
            /// updating api key in SODA's storage
            createMetadataDir();
            var content = parseJson(airtableConfigPath);
            content["api-key"] = key;
            content["key-name"] = name;
            fs.writeFileSync(airtableConfigPath, JSON.stringify(content));
            checkAirtableStatus(keyword);
            document.getElementById(
              "para-generate-description-status"
            ).innerHTML = "";
            // $("#span-airtable-keyname").html(name);
            $("#current-airtable-account").html(name);
            // $("#bootbox-airtable-key-name").val("");
            $("#bootbox-airtable-key").val("");
            loadAwardData();
            ddNoAirtableMode("Off");
            Swal.fire({
              title: "Successfully connected. Loading your Airtable account...",
              timer: 15000,
              timerProgressBar: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              allowEscapeKey: false,
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });
            ipcRenderer.send(
              "track-event",
              "Success",
              "Prepare Metadata - Add Airtable account",
              defaultBfAccount
            );
          } else if (res.statusCode === 403) {
            $("#current-airtable-account").html("None");
            Swal.fire({
              icon: "error",
              text: "Your account doesn't have access to the SPARC Airtable sheet. Please obtain access (email Dr. Charles Horn at chorn@pitt.edu)!",
              heightAuto: false,
              backdrop: "rgba(0,0,0,0.4)",
            }).then((result) => {
              if (result.isConfirmed) {
                showAddAirtableAccountSweetalert(keyword);
              }
            });
          } else {
            log.error(res);
            console.error(res);
            ipcRenderer.send(
              "track-event",
              "Error",
              "Prepare Metadata - Add Airtable account",
              defaultBfAccount
            );
            Swal.fire({
              icon: "error",
              text: "Failed to connect to Airtable. Please check your API Key and try again!",
              heightAuto: false,
              backdrop: "rgba(0,0,0,0.4)",
            }).then((result) => {
              if (result.isConfirmed) {
                showAddAirtableAccountSweetalert(keyword);
              }
            });
          }
          res.on("error", (error) => {
            log.error(error);
            console.error(error);
            ipcRenderer.send(
              "track-event",
              "Error",
              "Prepare Metadata - Add Airtable account",
              defaultBfAccount
            );
            Swal.fire({
              icon: "error",
              text: "Failed to connect to Airtable. Please check your API Key and try again!",
              heightAuto: false,
              backdrop: "rgba(0,0,0,0.4)",
            }).then((result) => {
              if (result.isConfirmed) {
                showAddAirtableAccountSweetalert(keyword);
              }
            });
          });
        });
      }
    });
  }
}

$("#resetSODASettings").on("click", () => {
  let currentPath = path.join(homeDirectory, ".pennsieve");
  let newPath = path.join(homeDirectory, ".pennsieve2");

  if (fs.existsSync(currentPath)) {
    fs.rename(currentPath, newPath, function (err) {
      if (err) {
        console.log(err);
      }
    });
  }

  currentPath = path.join(homeDirectory, "SODA");
  newPath = path.join(homeDirectory, "SODA2");

  if (fs.existsSync(currentPath)) {
    fs.rename(currentPath, newPath, function (err) {
      if (err) {
        Swal.fire({
          icon: "error",
          text: `Reset failed! - ${err}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
        });
      } else {
        Swal.fire({
          icon: "success",
          text: "Reset successful!",
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
        });
      }
    });
  }
});

$("#restoreSODASettings").on("click", async () => {
  let currentPath = path.join(homeDirectory, ".pennsieve2");
  let newPath = path.join(homeDirectory, ".pennsieve");

  if (fs.existsSync(currentPath)) {
    if (fs.existsSync(newPath)) {
      await fs.removeSync(newPath);
    }
    fs.rename(currentPath, newPath, function (err) {
      if (err) {
        console.log(err);
      }
    });
  }

  currentPath = path.join(homeDirectory, "SODA2");
  newPath = path.join(homeDirectory, "SODA");

  if (fs.existsSync(currentPath)) {
    if (fs.existsSync(newPath)) {
      await fs.removeSync(newPath);
    }
    fs.rename(currentPath, newPath, function (err) {
      if (err) {
        Swal.fire({
          icon: "error",
          text: `Restore failed! - ${err}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
        });
      } else {
        Swal.fire({
          icon: "success",
          text: "Restore successful!",
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
        });
      }
    });
  }
});
