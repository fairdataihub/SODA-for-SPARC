import { error } from "jquery";
import useGlobalStore from "../../../../stores/globalStore";

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}

export const getGuidedProgressFileNames = () => {
  return window.fs
    .readdirSync(guidedProgressFilePath)
    .map((progressFileName) => progressFileName.replace(".json", ""));
};

const updateGuidedDatasetName = (newDatasetName) => {
  const previousDatasetName = window.sodaJSONObj["digital-metadata"]["name"];

  //update old progress file with new dataset name
  const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
  const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
  window.fs.renameSync(oldProgressFilePath, newProgressFilePath);

  const bannerImagePathToUpdate = window.sodaJSONObj["digital-metadata"]["banner-image-path"];
  if (bannerImagePathToUpdate) {
    const newBannerImagePath = bannerImagePathToUpdate.replace(previousDatasetName, newDatasetName);
    //Rename the old banner image folder to the new dataset name
    window.fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
    //change the banner image path in the JSON obj
    window.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
  }
  window.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
};

export const savePageCurationPreparation = async (pageBeingLeftID) => {
  const errorArray = [];
  if (pageBeingLeftID === "guided-select-starting-point-tab") {
    const startingNewCuration = document
      .getElementById("guided-button-start-new-curation")
      .classList.contains("selected");
    const resumingExistingProgress = document
      .getElementById("guided-button-resume-progress-file")
      .classList.contains("selected");

    if (!startingNewCuration && !resumingExistingProgress) {
      errorArray.push({
        type: "notyf",
        message: "Please select a dataset start location",
      });
      throw errorArray;
    }

    if (resumingExistingProgress) {
      errorArray.push({
        type: "notyf",
        message: "Select a dataset in progress to resume curation",
      });
      throw errorArray;
    }
  }

  if (pageBeingLeftID === "guided-name-subtitle-tab") {
    const datasetNameInput = useGlobalStore.getState().guidedDatasetName.trim();
    const datasetSubtitleInput = useGlobalStore.getState().guidedDatasetSubtitle.trim();

    //Throw error if no dataset name or subtitle were added
    if (!datasetNameInput) {
      errorArray.push({
        type: "notyf",
        message: "Please enter a dataset name.",
      });
    }

    const datasetNameContainsForbiddenCharacters = window.evaluateStringAgainstSdsRequirements(
      datasetNameInput,
      "string-contains-forbidden-characters"
    );
    if (datasetNameContainsForbiddenCharacters) {
      errorArray.push({
        type: "notyf",
        message: `A Pennsieve dataset name cannot contain any of the following characters: @#$%^&*()+=/\|"'~;:<>{}[]?`,
      });
    }
    if (!datasetSubtitleInput) {
      errorArray.push({
        type: "notyf",
        message: "Please enter a dataset subtitle.",
      });
    }

    if (errorArray.length > 0) {
      throw errorArray;
    }

    const currentDatasetName = window.sodaJSONObj["digital-metadata"]["name"];
    if (currentDatasetName) {
      // Update the progress file path name and banner image path if needed
      if (datasetNameInput !== currentDatasetName) {
        const currentProgressFileNames = getGuidedProgressFileNames();
        if (currentProgressFileNames.includes(datasetNameInput)) {
          errorArray.push({
            type: "notyf",
            message: `Unable to change dataset name to: ${datasetNameInput}. A dataset with that name already exists.`,
          });
          throw errorArray;
        }
        updateGuidedDatasetName(datasetNameInput);
        window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
      } else {
        window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
      }
    } else {
      const currentProgressFileNames = getGuidedProgressFileNames();
      if (currentProgressFileNames.includes(datasetNameInput)) {
        errorArray.push({
          type: "notyf",
          message: `A progress file already exists for the dataset: ${datasetNameInput}. Please enter a different dataset name.`,
        });
        throw errorArray;
      }
      window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
      window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
    }
  }
};
