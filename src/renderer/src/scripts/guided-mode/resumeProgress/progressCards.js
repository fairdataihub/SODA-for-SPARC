import { guidedGetCurrentUserWorkSpace } from "../workspaces/workspaces";
import { getAllProgressFileData } from "./progressFile";
import tippy from "tippy.js";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

/**
 *  @description - Associated with a the 'Continue a dataset saved in SODA' button in the Prepare Dataset Step-by-Step menu page.
 *  Once clicked it displays a list of saved progress files that the user can use to resume any workflow progress they have made.
 */
document
  .getElementById("guided-button-resume-progress-file")
  .addEventListener("click", async () => {
    await guidedRenderProgressCards();
  });

const readDirAsync = async (path) => {
  let result = await window.fs.readdir(path);
  return result;
};

export const guidedRenderProgressCards = async () => {
  const progressCardsContainer = document.getElementById("guided-container-progress-cards");
  const progressCardLoadingDiv = document.getElementById("guided-section-loading-progress-cards");
  const progressCardLoadingDivText = document.getElementById(
    "guided-section-loading-progress-cards-para"
  );

  // Show the loading div and hide the progress cards container
  progressCardsContainer.classList.add("hidden");
  progressCardLoadingDiv.classList.remove("hidden");

  // if the user has an account connected with Pennsieve then verify the profile and workspace
  if (
    window.defaultBfAccount !== undefined ||
    (window.defaultBfAccount === undefined && hasConnectedAccountWithPennsieve())
  ) {
    try {
      progressCardLoadingDivText.textContent = "Verifying account information";
      await window.verifyProfile();
      progressCardLoadingDivText.textContent = "Verifying workspace information";
      await window.synchronizePennsieveWorkspace();
    } catch (e) {
      clientError(e);
      await swalShowInfo(
        "Something went wrong while verifying your profile",
        "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
      );
      loadingDiv.classList.add("hidden");
      return;
    }
  }

  //Check if Guided-Progress folder exists. If not, create it.
  if (!window.fs.existsSync(guidedProgressFilePath)) {
    window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  }

  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);

  // Filter out non .json files
  const jsonProgressFiles = guidedSavedProgressFiles.filter((file) => {
    return file.endsWith(".json");
  });

  const progressFileData = await getAllProgressFileData(jsonProgressFiles);

  // Sort by last modified date
  progressFileData.sort((a, b) => {
    return new Date(b["last-modified"]) - new Date(a["last-modified"]);
  });

  // If the workspace hasn't loaded yet, wait for it to load
  // This will stop after 6 seconds
  if (!guidedGetCurrentUserWorkSpace()) {
    for (let i = 0; i < 60; i++) {
      // If the workspace loaded, break out of the loop
      if (guidedGetCurrentUserWorkSpace()) {
        break;
      }
      // If the workspace didn't load, wait 100ms and try again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // If there are progress cards to display, display them
  if (progressFileData.length > 0) {
    // Add the title to the container
    progressCardsContainer.innerHTML = `
        <h2 class="text-sub-step-title">
          Select the dataset that you would like to continue working with and click "Continue"
        </h2>
      `;
    //Add the progress cards that have already been uploaded to Pennsieve
    //to their container (datasets that have the window.sodaJSONObj["previous-guided-upload-dataset-name"] property)
    progressCardsContainer.innerHTML += progressFileData
      .map((progressFile) => generateProgressCardElement(progressFile))
      .join("\n");

    tippy(".progress-card-popover", {
      allowHTML: true,
      interactive: true,
    });
  } else {
    progressCardsContainer.innerHTML = `
        <h2 class="guided--text-user-directions" style="color: var(--color-bg-plum) !important">
          No datasets in progress found.
        </h2>
      `;
  }

  // Hide the loading div and show the progress cards container
  progressCardsContainer.classList.remove("hidden");
  progressCardLoadingDiv.classList.add("hidden");
};

const generateProgressCardElement = (progressFileJSONObj) => {
  let progressFileImage = progressFileJSONObj["digital-metadata"]["banner-image-path"] || "";

  if (progressFileImage === "") {
    progressFileImage = `
        <img
          src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
          alt="Dataset banner image placeholder"
          style="height: 80px; width: 80px"
        />
      `;
  } else {
    progressFileImage = `
        <img
          src='file://${progressFileImage}'
          alt="Dataset banner image"
          style="height: 80px; width: 80px"
        />
      `;
  }
  const progressFileName = progressFileJSONObj["digital-metadata"]["name"] || "";
  const progressFileSubtitle =
    progressFileJSONObj["digital-metadata"]["subtitle"] || "No designated subtitle";
  const progressFileLastModified = new Date(progressFileJSONObj["last-modified"]).toLocaleString(
    [],
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }
  );
  const savedUploadDataProgress =
    progressFileJSONObj["previously-uploaded-data"] &&
    Object.keys(progressFileJSONObj["previously-uploaded-data"]).length > 0;

  const datasetStartingPoint = progressFileJSONObj?.["starting-point"]?.["origin"];

  let workspaceUserNeedsToSwitchTo = false;
  const datasetWorkspace = progressFileJSONObj?.["digital-metadata"]?.["dataset-workspace"];
  const currentWorkspace = guidedGetCurrentUserWorkSpace();
  if (datasetWorkspace && datasetWorkspace !== currentWorkspace) {
    workspaceUserNeedsToSwitchTo = datasetWorkspace;
  }

  // True if the progress file has already been uploaded to Pennsieve
  const alreadyUploadedToPennsieve = !!progressFileJSONObj["previous-guided-upload-dataset-name"];

  // Function to generate the button used to resume progress
  const generateProgressResumptionButton = (
    datasetStartingPoint,
    boolAlreadyUploadedToPennsieve,
    progressFileName,
    workspaceUserNeedsToSwitchTo
  ) => {
    if (workspaceUserNeedsToSwitchTo) {
      // If the progress file has an organization set but the user is no longer logged in,
      // prompt the user to log in
      if (!window.defaultBfAccount) {
        return `
            <button
              class="ui positive button guided--progress-button-login-to-pennsieve"
              data-reset-guided-mode-page="true"
              onclick="window.openDropdownPrompt(this, 'ps')"
            >
              Log in to Pennsieve to resume curation
            </button>
          `;
      }
      // If the user is logged in but the user needs to switch to a different workspace,
      // prompt the user to switch to the correct workspace
      return `
          <button
            class="ui positive button guided-change-workspace guided--progress-button-switch-workspace"
            onClick="window.openDropdownPrompt(this, 'organization')"
          >
            Switch to ${workspaceUserNeedsToSwitchTo} workspace to resume curation
          </button>
        `;
    }

    let buttonText;
    let buttonClass;

    console.log("datasetStartingPoint", datasetStartingPoint);
    if (boolAlreadyUploadedToPennsieve) {
      buttonText = "Share with the curation team";
      buttonClass = "guided--progress-button-share";
    } else if (datasetStartingPoint === "new") {
      buttonText = "Resume curation";
      buttonClass = "guided--progress-button-resume-curation";
    } else {
      buttonText = "Continue updating Pennsieve dataset";
      buttonClass = "guided--progress-button-resume-pennsieve";
    }

    return `
      <button
        class="ui positive button ${buttonClass}"
        onClick="guidedResumeProgress('${progressFileName}')"
      >
        ${buttonText}
      </button>
    `;
  };

  return `
      <div class="dataset-card">
        ${progressFileImage /* banner image */}     
  
        <div class="dataset-card-body">
          <div class="dataset-card-row">
            <h1
              class="dataset-card-title-text progress-file-name progress-card-popover"
              data-tippy-content="Dataset name: ${progressFileName}"
              rel="popover"
              placement="bottom"
              data-trigger="hover"
            >${progressFileName}</h1>
          </div>
          <div class="dataset-card-row">
            <h1 
              class="dataset-card-subtitle-text progress-card-popover"
              data-tippy-content="Dataset subtitle: ${progressFileSubtitle}"
              rel="popover"
              data-placement="bottom"
              data-trigger="hover"
              style="font-weight: 400;"
            >
                ${
                  progressFileSubtitle.length > 70
                    ? `${progressFileSubtitle.substring(0, 70)}...`
                    : progressFileSubtitle
                }
            </h1>
          </div>
          <div class="dataset-card-row">
            <h2 class="dataset-card-clock-icon">
              <i
                class="fas fa-clock-o progress-card-popover"
                data-tippy-content="Last modified: ${progressFileLastModified}"
                rel="popover"
                data-placement="bottom"
                data-trigger="hover"
              ></i>
            </h2>
            <h1 class="dataset-card-date-text">${progressFileLastModified}</h1>
            ${
              savedUploadDataProgress
                ? `
                  <span class="badge badge-warning mx-2">Incomplete upload</span>
                `
                : ``
            }
          </div>
        </div>
        <div class="dataset-card-button-container align-right">
          ${generateProgressResumptionButton(
            datasetStartingPoint,
            alreadyUploadedToPennsieve,
            progressFileName,
            workspaceUserNeedsToSwitchTo
          )}
          <h2 class="dataset-card-button-delete" onclick="window.deleteProgressCard(this)">
            <i
              class="fas fa-trash mr-sm-1"
            ></i>
            Delete progress file
          </h2>
        </div>
      </div>
    `;
};
