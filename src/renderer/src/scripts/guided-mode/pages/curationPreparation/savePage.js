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
    console.log("savePageCurationPreparation called for guided-name-subtitle-tab");
    const datasetNameInput = useGlobalStore.getState().guidedDatasetName.trim();
    const datasetSubtitleInput = useGlobalStore.getState().guidedDatasetSubtitle.trim();
    //Throw error if no dataset name or subtitle were added
    if (!datasetNameInput) {
      errorArray.push({
        type: "notyf",
        message: "Please enter a dataset name.",
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

    // At this point, we are past the validation checks so we're safe to update the JSON object
    window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;

    const sanitizedDatasetName = window.sanitizeGuidedModeProgressFileNameString(datasetNameInput);
    // Check if save-file-name exists (indicating if this is the first time saving the dataset)
    const saveFileName = window.sodaJSONObj?.["save-file-name"];

    // Create a random string used to append to the save file name to ensure uniqueness
    // (for new save files or if the dataset name has changed)
    const randomString = Math.random().toString(16).slice(2, 10);

    // If the saveFileName does not exist, generate it
    if (!saveFileName) {
      window.sodaJSONObj["save-file-random-hash-suffix"] = randomString;
      window.sodaJSONObj["save-file-name"] = `${sanitizedDatasetName}-${randomString}`;
    }

    const currentDatasetName = window.sodaJSONObj?.["digital-metadata"]?.["name"];

    if (!currentDatasetName) {
      // Set the dataset name for the first time
      window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
    } else if (datasetNameInput !== currentDatasetName) {
      console.log(
        "Dataset name has changed, updating guided progress file and banner image path if needed"
      );
      let previousSaveFileName;
      if (window.sodaJSONObj["save-file-name"]) {
        previousSaveFileName = window.sodaJSONObj["save-file-name"];
      } else {
        previousSaveFileName = window.sodaJSONObj["digital-metadata"]["name"];
      }

      // If the dataset name has changed since last save, update it
      const previousDatasetName = window.sodaJSONObj["digital-metadata"]["name"];

      //update old progress file with new dataset name
      const oldProgressFilePath = `${guidedProgressFilePath}/${window.sodaJSONObj["save-file-name"]}.json`;
      const newProgressFilePath = `${guidedProgressFilePath}/${sanitizedDatasetName}-${window.sodaJSONObj["save-file-random-hash-suffix"]}.json`;
      try {
        window.fs.renameSync(oldProgressFilePath, newProgressFilePath);
      } catch (error) {
        console.error(
          `Error renaming guided progress file from ${oldProgressFilePath} to ${newProgressFilePath}:`,
          error
        );
      }
      console.log(
        `Renamed guided progress file from ${oldProgressFilePath} to ${newProgressFilePath}`
      );

      const bannerImagePathToUpdate = window.sodaJSONObj["digital-metadata"]["banner-image-path"];
      if (bannerImagePathToUpdate) {
        const newBannerImagePath = bannerImagePathToUpdate.replace(
          previousDatasetName,
          newDatasetName
        );
        //Rename the old banner image folder to the new dataset name
        window.fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
        //change the banner image path in the JSON obj
        window.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
      }
      window.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
    }
  }
};
