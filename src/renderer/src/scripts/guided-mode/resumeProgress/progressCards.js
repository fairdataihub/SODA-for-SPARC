import { guidedGetCurrentUserWorkSpace } from "../workspaces/workspaces";
import { getAllProgressFileData } from "./progressFile";
import hasConnectedAccountWithPennsieve from "../../others/authentication/auth";
import { swalShowInfo } from "../../utils/swal-utils";
import tippy from "tippy.js";
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

  const progressFileData = await getAllProgressFileData(jsonProgressFiles);

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
