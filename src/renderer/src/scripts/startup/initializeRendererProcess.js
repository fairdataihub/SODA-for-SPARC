/**
 * Contains the application initialization and startup logic for the renderer process.
 * These functions are called in the renderer.js file.
 */

import {
  clientBlockedByExternalFirewall,
  blockedMessage,
  hostFirewallMessage,
} from "../check-firewall/checkFirewall";
import { bfAccountOptions, showHideDropdownButtons, updateDatasetList } from "../globals";
import hasConnectedAccountWithPennsieve from "../others/authentication/auth";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import client from "../client";
import { swalShowError, swalShowInfo } from "../utils/swal-utils";
import checkForAnnouncements from "../others/announcements";
import kombuchaEnums from "../analytics/analytics-enums";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import { setAppVersion } from "../../stores/slices/appConfigSlice";

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

export const startBackgroundServices = async () => {
  try {
    await connectToServer();
    await ensureUsernameExists();

    try {
      initializePennsieveAccountList();
    } catch (error) {
      console.error("Error retrieving ps accounts: ", error);
    }

    window.notyf.open({
      duration: "2000",
      type: "success",
      message: `Connected to SODA's background services successfully.`,
    });
  } catch (error) {
    console.error("Error connecting to server: ", error);
    await showErrorAndRestart(error);
  }
};

const initializePennsieveAccountList = async () => {
  // Clear the bfAccountOptions array
  bfAccountOptions.length = 0;
  window.bfAccountOptionsStatus = "";

  if (!hasConnectedAccountWithPennsieve()) {
    window.bfAccountOptionsStatus = "No account connected";
    return;
  }

  try {
    const res = await client.get("manage_datasets/bf_account_list");
    const accounts = res.data;
    for (const myitem in accounts) {
      bfAccountOptions[accounts[myitem]] = accounts[myitem];
    }
    await setDefaultPennsieveAccountUI();
  } catch (error) {
    window.bfAccountOptionsStatus = error;
  }
};

const connectToServer = async () => {
  const maxWaitTime = 300000; // 5 minutes in milliseconds
  const retryInterval = 3000; // 3 seconds in milliseconds
  const totalNumberOfRetries = Math.floor(maxWaitTime / retryInterval);
  for (let i = 0; i < totalNumberOfRetries; i++) {
    try {
      await client.get("/startup/echo?arg=server ready");

      // Log the successful connection to the server
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
      return;
    } catch (e) {
      console.error("Error connecting to server: ", e);
      await window.wait(retryInterval);
    }
  }

  // If we get to this point, it means we were unable to connect to the server
  // Report the event and throw an error
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
  throw new Error("Unable to connect to server within the max wait time.");
};

const ensureUsernameExists = async () => {
  try {
    // get the current user profile name using electron
    const { username } = window.os.userInfo();

    // check if a shortened uuid exists in local storage
    let usernameExists = await window.electron.ipcRenderer.invoke("get-nodestorage-item", username);

    // if the username does not exist in local storage, create a shortened uuid and store it
    if (!usernameExists) {
      const shortenedUUID = uuidv4().substring(0, 4);
      await window.electron.ipcRenderer.invoke("set-nodestorage-key", username, shortenedUUID);
    }
  } catch (error) {
    const errorMessage = "Error creating a new user profile name.";
    clientError(errorMessage);
    throw new Error(errorMessage);
  }
};

const showErrorAndRestart = async (errorMessage) => {
  await swalShowError(
    "Error connecting to SODA's background services",
    `Something went wrong while initializing SODA's background services. Please restart SODA and try again. If this issue occurs multiple times, please email <a target="_blank" href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`
  );
  await window.electron.ipcRenderer.invoke("relaunch-soda");
};

const launchAnnouncements = async () => {
  if (launchAnnouncement) {
    await checkForAnnouncements("announcements");
    launchAnnouncement = false;
    await window.electron.ipcRenderer.invoke("set-nodestorage-key", "announcements", false);
  }
};

// check that the client connected to the server using exponential backoff
// verify the api versions match
const startupServerAndApiCheck = async () => {
  const maxWaitTime = 300000; // 5 minutes in milliseconds
  const retryInterval = 3000; // 3 seconds in milliseconds
  const totalNumberOfRetries = Math.floor(maxWaitTime / retryInterval);

  Swal.fire({
    icon: "info",
    title: `Initializing SODA's background services<br /><br />This may take several minutes...`,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "Restart now",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    didOpen: () => Swal.showLoading(),
  });

  await window.wait(3000);

  for (let i = 0; i < totalNumberOfRetries; i++) {
    try {
      await client.get("/startup/echo?arg=server ready");
      window.log.info("Connected to Python back-end successfully");
      window.electron.ipcRenderer.send("track-event", "Success", "Establishing Python Connection");
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.STARTUP,
        kombuchaEnums.Action.APP_LAUNCHED,
        kombuchaEnums.Label.PYTHON_CONNECTION,
        kombuchaEnums.Status.SUCCESS,
        { value: 1 }
      );
      ensureUsernameExists();
      Swal.close();
      return;
    } catch (e) {
      console.error("Error connecting to server: ", e);
      await window.wait(retryInterval);
    }
  }

  window.electron.ipcRenderer.send("track-event", "Error", "Establishing Python Connection");
  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.STARTUP,
    kombuchaEnums.Action.APP_LAUNCHED,
    kombuchaEnums.Label.PYTHON_CONNECTION,
    kombuchaEnums.Status.FAIL,
    { value: 1 }
  );

  let serverIsLive = await window.server.serverIsLive();
  if (serverIsLive) {
    // notify the user that there may be a firewall issue preventing the client from connecting to the server
    Swal.close();
    await Swal.fire({
      icon: "info",
      title: "Potential Network Issues",
      html: hostFirewallMessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Restart SODA To Try Again",
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: 800,
    });
    await window.electron.ipcRenderer.invoke("relaunch-soda");
  }

  Swal.close();
  await Swal.fire({
    icon: "error",
    html: `Something went wrong while initializing SODA's background services. SODA will relaunch to try to fix the problem. If this issue occurs multiple times, please email <a target="_blank" href='mailto:help@fairdataihub.org'>help@fairdataihub.org</a>.`,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "Restart now",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  await window.electron.ipcRenderer.invoke("relaunch-soda");
};

/**
 *  @description Essential startup functionality. Validates and starts the server. Checks if the user has
 *               a Pennsieve account connected with SODA and loads and displays any announcements. Finally,
 *               ensures the SDS template files are accessible. Run after running startBackgroundServices.
 */
export const initializeSODARenderer = async () => {
  // TODO: Add check for internal firewall that blocks us from talking to the server here (detect-firewall)
  // check that the server is live and the api versions match
  // If this fails after the allotted time, the app will restart
  await startupServerAndApiCheck();

  // check if the API versions match
  // If they do not match, the app will restart to attempt to fix the issue
  await ensureServerVersionMatchesClientVersion();

  //Refresh the Pennsieve account list if the user has connected their Pennsieve account in the past
  if (hasConnectedAccountWithPennsieve()) {
    // check for external firewall interference (aspirational in that may not be foolproof)
    const pennsieveURL = "https://api.pennsieve.io/discover/datasets";
    const blocked = await clientBlockedByExternalFirewall(pennsieveURL);
    if (blocked) {
      swalShowInfo("Potential Network Issue Detected", blockedMessage);
    }
  }

  // Set the app version in the sidebar for the user to see
  setSidebarAppVersion();

  // await warnUserIfBetaVersionAndDntNotEnabled();

  // Launch announcements if the user has not seen them yet
  await launchAnnouncements();

  // Set the template paths for dataset metadata generation
  await setTemplatePaths();

  window.log.info("Successfully initialized SODA renderer process");
};

// Check if the Pysoda server API version and the package.json versions match
const ensureServerVersionMatchesClientVersion = async () => {
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

    await swalShowError(
      "Unable to verify Server API Version",
      `SODA will restart to attempt to fix the issue. If the issue persists, please contact the SODA team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>`
    );
    await window.electron.ipcRenderer.invoke("relaunch-soda");
  }

  let serverAppVersion = responseObject.data.version;

  window.log.info(`Server version is ${serverAppVersion}`);
  const appVersion = await window.electron.ipcRenderer.invoke("app-version");

  if (serverAppVersion !== appVersion) {
    window.log.info("Server version does not match client version");
    console.error("Server version does not match client version");
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      "Verifying App Version",
      "Server version does not match client version"
    );

    await swalShowError(
      "SODA Server version and Client version mismatch",
      `SODA will restart to attempt to fix the issue. If the issue persists, please contact the SODA team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>`
    );
    await window.electron.ipcRenderer.invoke("relaunch-soda");
  }

  window.electron.ipcRenderer.send("track-event", "Success", "Verifying App Version");
};

const setTemplatePaths = async () => {
  try {
    // get apps base path
    const basepath = await window.electron.ipcRenderer.invoke("get-app-path", undefined);
    const resourcesPath = window.process.resourcesPath();
    await client.put("prepare_metadata/template_paths", {
      basepath: basepath,
      resourcesPath: resourcesPath,
    });
    window.electron.ipcRenderer.send("track-event", "Success", "Setting Templates Path");
  } catch (error) {
    window.electron.ipcRenderer.send("track-event", "Error", "Setting Templates Path");
    await swalShowError(
      "Error setting template paths",
      `SODA will restart to attempt to fix the issue. If the issue persists, please contact the SODA team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>`
    );
    await window.electron.ipcRenderer.invoke("relaunch-soda");
  }
};

const setSidebarAppVersion = async () => {
  let currentAppVersion = await window.electron.ipcRenderer.invoke("app-version");
  setAppVersion(currentAppVersion);
};

// Warn the user if they are on a beta version of the app
const warnUserIfBetaVersionAndDntNotEnabled = async () => {
  try {
    let currentAppVersion = await window.electron.ipcRenderer.invoke("app-version");
    const homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");
    const dntFilePath = window.path.join(homeDirectory, ".soda-config", "dnt.soda");
    if (currentAppVersion.includes("beta") && !window.fs.existsSync(dntFilePath)) {
      await swalShowInfo(
        "You are on a beta version of SODA",
        "When you are finished using this special version of SODA, please download the latest stable version<a href='https://docs.sodaforsparc.io/' target='_blank'> by clicking here</a>"
      );
    }
  } catch (err) {
    window.log.error("Error determing if beta pop up should exist:", err);
  }
};

const setDefaultPennsieveAccountUI = async () => {
  try {
    const bfDefaultAccRes = await client.get("manage_datasets/bf_default_account_load");
    const accounts = bfDefaultAccRes.data.defaultAccounts;

    if (accounts.length === 0) {
      return;
    }

    const defaultAccount = accounts[0];
    window.defaultBfAccount = defaultAccount;

    try {
      const bfAccountDetailsRes = await client.get("/manage_datasets/bf_account_details", {
        params: { selected_account: defaultAccount },
      });

      const { email, organization } = bfAccountDetailsRes.data;

      $("#current-ps-account").text(email);
      $("#current-ps-account-generate").text(email);
      $("#create_empty_dataset_BF_account_span").text(email);
      $(".ps-account-span").text(email);
      $(".ps-organization-span").text(organization);

      $("#div-ps-account-load-progress").hide();
      showHideDropdownButtons("account", "show");
      window.refreshDatasetList();
      updateDatasetList();
      window.updateOrganizationList();
    } catch (error) {
      clientError(error);

      $("#para-account-detail-curate").text("None");
      $("#current-ps-account").text("None");
      $("#current-ps-account-generate").text("None");
      $("#create_empty_dataset_BF_account_span").text("None");
      $(".ps-account-span").text("None");
      $("#para-account-detail-curate-generate").text("None");
      $("#para_create_empty_dataset_BF_account").text("None");
      $(".ps-account-details-span").text("None");

      $("#div-ps-account-load-progress").hide();
      showHideDropdownButtons("account", "hide");
    }
  } catch (error) {
    clientError(error);
  }
};
