import useGlobalStore from "../../../../stores/globalStore";

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}

export const getGuidedProgressFileNames = () => {
  const progressFileNames = window.fs
    .readdirSync(guidedProgressFilePath)
    .filter((fileName) => fileName.endsWith(".json"));

  const datasetNames = [];

  for (const fileName of progressFileNames) {
    try {
      const filePath = window.path.join(guidedProgressFilePath, fileName);
      const fileContent = window.fs.readFileSync(filePath, "utf-8");
      const progressData = JSON.parse(fileContent);
      const datasetName = progressData?.["digital-metadata"]?.["name"];
      if (datasetName) {
        console.log("Found dataset name in progress file:", datasetName);
        datasetNames.push(datasetName);
      }
    } catch (error) {
      console.error(`Error reading progress file ${fileName}:`, error);
    }
  }

  return datasetNames;
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
    // 1. Retrieve user inputs
    const datasetNameInput = useGlobalStore.getState().guidedDatasetName.trim();
    const datasetSubtitleInput = useGlobalStore.getState().guidedDatasetSubtitle.trim();

    // 2. Validate required inputs
    if (!datasetNameInput) {
      errorArray.push({ type: "notyf", message: "Please enter a dataset name." });
    }
    if (!datasetSubtitleInput) {
      errorArray.push({ type: "notyf", message: "Please enter a dataset subtitle." });
    }

    if (errorArray.length > 0) {
      throw errorArray;
    }

    // 3. Update subtitle
    window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;

    // 4. Sanitize dataset name
    const sanitizedDatasetName = window.sanitizeStringForSaveFileSystemSave(datasetNameInput);

    // 5. Retrieve previous save info
    const prevSaveFileName = window.sodaJSONObj?.["save-file-name"];
    const prevRandomSuffix = window.sodaJSONObj?.["save-file-random-hash-suffix"];
    const prevDatasetName = window.sodaJSONObj?.["digital-metadata"]?.["name"];
    if (!prevDatasetName) {
      const existingProgressFileNames = getGuidedProgressFileNames();
      console.log("Existing guided progress dataset names:", existingProgressFileNames);
      if (existingProgressFileNames.includes(datasetNameInput)) {
        errorArray.push({
          type: "notyf",
          message:
            "A dataset with this name already exists. Please choose a different name or resume your previous progress by navigating back.",
        });
        throw errorArray;
      }
    }

    const randomString = Math.random().toString(16).slice(2, 10);
    const newSaveFileName = `${sanitizedDatasetName}-${
      prevRandomSuffix ? prevRandomSuffix : randomString
    }`;

    window.sodaJSONObj["save-file-name"] = newSaveFileName;
    if (!prevRandomSuffix) {
      window.sodaJSONObj["save-file-random-hash-suffix"] = randomString;
    }

    // 6. Rename progress file and banner folder if dataset name changed
    if ((prevDatasetName && prevDatasetName !== datasetNameInput) || !prevSaveFileName) {
      // Check to see an existing dataset name does not already exist with this name
      const existingProgressFileNames = getGuidedProgressFileNames();
      // Filter out dataset with the same name as the previous one
      const filteredExistingProgressFileNames = existingProgressFileNames.filter(
        (name) => name !== prevDatasetName
      );
      console.log(
        "Filtered existing guided progress dataset names:",
        filteredExistingProgressFileNames
      );
      if (filteredExistingProgressFileNames.includes(datasetNameInput)) {
        errorArray.push({
          type: "notyf",
          message: "A dataset with this name already exists. Please choose a different name.",
        });
        throw errorArray;
      }

      const previousSaveFileName = prevSaveFileName || prevDatasetName;

      const oldProgressFilePath = `${guidedProgressFilePath}/${previousSaveFileName}.json`;
      const newProgressFilePath = `${guidedProgressFilePath}/${newSaveFileName}.json`;

      if (oldProgressFilePath !== newProgressFilePath) {
        try {
          window.fs.renameSync(oldProgressFilePath, newProgressFilePath);
        } catch (error) {
          console.error(
            `Error renaming guided progress file from ${oldProgressFilePath} → ${newProgressFilePath}:`,
            error
          );
        }

        const bannerImagePathToUpdate = window.sodaJSONObj["digital-metadata"]["banner-image-path"];
        if (bannerImagePathToUpdate) {
          const newBannerImagePath = bannerImagePathToUpdate.replace(
            previousSaveFileName,
            newSaveFileName
          );
          try {
            window.fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
            window.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
          } catch (error) {
            console.error(
              `Error renaming banner image folder from ${bannerImagePathToUpdate} → ${newBannerImagePath}:`,
              error
            );
          }
        }
      }
    }

    // 7. Finalize dataset name
    window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
  }
};
