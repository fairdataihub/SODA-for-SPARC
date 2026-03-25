import { guidedGetCurrentUserWorkSpace } from "../workspaces/workspaces";
import { getAllProgressFileData, deleteProgressFile } from "./progressFile";
import hasConnectedAccountWithPennsieve from "../../others/authentication/auth";
import { swalShowInfo } from "../../utils/swal-utils";
import { clientError } from "../../others/http-error-handler/error-handler";
import {
  setGuidedModeProgressCardsText,
  setGuidedModeProgressCardsDataArray,
} from "../../../stores/slices/guidedModeProgressCardsSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}

const readDirAsync = async (path) => {
  let result = await window.fs.readdir(path);
  return result;
};

export const guidedRenderProgressCards = async (curationMode) => {
  const prefix = curationMode === "ffm" ? "ffm" : "gm";
  const progressCardsContainer = document.getElementById(`${prefix}-container-progress-cards`);
  const progressCardLoadingDiv = document.getElementById(
    `${prefix}-section-loading-progress-cards`
  );
  const progressCardLoadingDivText = document.getElementById(
    `${prefix}-section-loading-progress-cards-para`
  );
  setGuidedModeProgressCardsDataArray([]);

  // Show the loading div and hide the progress cards container
  progressCardsContainer.classList.add("hidden");
  progressCardLoadingDiv.classList.add("hidden");

  // if the user has an account connected with Pennsieve then verify the profile and workspace
  if (
    window.defaultBfAccount !== undefined ||
    (window.defaultBfAccount === undefined && hasConnectedAccountWithPennsieve())
  ) {
    try {
      setGuidedModeProgressCardsText("Verifying account information");
      progressCardLoadingDivText.textContent = "Verifying account information";
      await window.verifyProfile();
      setGuidedModeProgressCardsText("Verifying workspace information");
      progressCardLoadingDivText.textContent = "Verifying workspace information";
      await window.synchronizePennsieveWorkspace();
    } catch (e) {
      clientError(e);
      await swalShowInfo(
        "Something went wrong while checking your connection to Pennsieve",
        "Please try again by clicking the 'Continue a dataset saved in SODA' button. If this issue persists please use our `Contact Us` page to report the issue."
      );
    }
  }

  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);

  // Filter out non .json files
  const jsonProgressFiles = guidedSavedProgressFiles.filter((file) => {
    return file.endsWith(".json");
  });

  let progressFileData = await getAllProgressFileData(jsonProgressFiles);
  console.log("Loaded progress file data:", progressFileData);

  // For free-form mode, delete any already-uploaded dataset progress files (completed uploads).
  // Use the ["save-file-name"] value for the on-disk filename.
  if (curationMode === "ffm") {
    const remainingFiles = [];

    for (const progressFile of progressFileData) {
      if (
        progressFile?.["curation-mode"] === "free-form" &&
        progressFile?.["dataset-successfully-uploaded-to-pennsieve"] === true
      ) {
        const progressFilePath = progressFile?.["save-file-path"];
        console.log(
          `Deleting progress file for already uploaded dataset at path: ${progressFilePath}`
        );
        if (progressFilePath) {
          await deleteProgressFile(progressFilePath);
        }
      } else {
        remainingFiles.push(progressFile);
      }
    }

    // Replace the loaded data with remaining files after deletions
    progressFileData = remainingFiles;
  }

  // Filter progress files based on curation mode
  const targetCurationMode = curationMode === "ffm" ? "free-form" : "guided";
  progressFileData = progressFileData.filter((progressFile) => {
    const progressFileCurationMode = progressFile?.["curation-mode"];
    return progressFileCurationMode === targetCurationMode;
  });

  // Sort by last modified date
  progressFileData.sort((a, b) => {
    return new Date(b["last-modified"]) - new Date(a["last-modified"]);
  });

  // If the workspace hasn't loaded yet, wait for it to load
  // This will stop after 6 seconds
  if (!guidedGetCurrentUserWorkSpace()) {
    setGuidedModeProgressCardsText("Waiting for workspace to load");
    for (let i = 0; i < 40; i++) {
      // If the workspace loaded, break out of the loop
      if (guidedGetCurrentUserWorkSpace()) {
        break;
      }
      // If the workspace didn't load, wait 100ms and try again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  setGuidedModeProgressCardsDataArray(progressFileData);

  // Hide the loading div and show the progress cards container
  progressCardsContainer.classList.add("hidden");
  progressCardLoadingDiv.classList.add("hidden");
  setGuidedModeProgressCardsText(null);
};
