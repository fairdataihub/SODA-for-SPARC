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
    console.log("=== savePageCurationPreparation called for guided-name-subtitle-tab ===");

    // 1. Retrieve and log user inputs
    const datasetNameInput = useGlobalStore.getState().guidedDatasetName.trim();
    const datasetSubtitleInput = useGlobalStore.getState().guidedDatasetSubtitle.trim();
    console.log("Step 1: Retrieved user inputs:", { datasetNameInput, datasetSubtitleInput });

    // 2. Validate required inputs
    if (!datasetNameInput) {
      console.warn("Step 2: Validation failed — missing dataset name.");
      errorArray.push({ type: "notyf", message: "Please enter a dataset name." });
    }
    if (!datasetSubtitleInput) {
      console.warn("Step 2: Validation failed — missing dataset subtitle.");
      errorArray.push({ type: "notyf", message: "Please enter a dataset subtitle." });
    }

    if (errorArray.length > 0) {
      console.error("Step 2: Validation errors detected, throwing errorArray:", errorArray);
      throw errorArray;
    }

    // 4. Update subtitle
    window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
    console.log("Step 4: Updated subtitle in sodaJSONObj:", datasetSubtitleInput);

    // 5. Sanitize dataset name
    const sanitizedDatasetName = window.sanitizeGuidedModeProgressFileNameString(datasetNameInput);
    console.log("Step 5: Sanitized dataset name:", sanitizedDatasetName);

    // 6. Retrieve previous save info for comparison
    const prevSaveFileName = window.sodaJSONObj?.["save-file-name"];
    console.log("Step 6: Previous save file name:", prevSaveFileName);
    const prevRandomSuffix = window.sodaJSONObj?.["save-file-random-hash-suffix"];
    const prevDatasetName = window.sodaJSONObj?.["digital-metadata"]?.["name"];

    const randomString = Math.random().toString(16).slice(2, 10);
    const newSaveFileName = `${sanitizedDatasetName}-${
      prevRandomSuffix ? prevRandomSuffix : randomString
    }`;

    // Generate the new save file name
    window.sodaJSONObj["save-file-name"] = newSaveFileName;
    if (!prevRandomSuffix) {
      window.sodaJSONObj["save-file-random-hash-suffix"] = randomString;
      console.log("Step 6: Generated new random suffix:", randomString);
    }

    // 8. Log current dataset name
    console.log("Step 8: Current dataset name from metadata:", prevDatasetName);

    // 9. Rename progress file and banner folder if dataset name changed
    if ((prevDatasetName && prevDatasetName !== datasetNameInput) || !prevSaveFileName) {
      console.log("Step 9: Dataset name change detected:", prevDatasetName, "→", datasetNameInput);

      const previousSaveFileName = prevSaveFileName || prevDatasetName;
      console.log("Step 9: Previous save file name determined as:", previousSaveFileName);

      const oldProgressFilePath = `${guidedProgressFilePath}/${previousSaveFileName}.json`;
      const newProgressFilePath = `${guidedProgressFilePath}/${window.sodaJSONObj["save-file-name"]}.json`;

      if (oldProgressFilePath !== newProgressFilePath) {
        console.log(
          "Step 9: Renaming progress file required from:",
          oldProgressFilePath,
          "to:",
          newProgressFilePath
        );
        try {
          window.fs.renameSync(oldProgressFilePath, newProgressFilePath);
          console.log(
            `Step 9: Successfully renamed guided progress file from ${oldProgressFilePath} → ${newProgressFilePath}`
          );
        } catch (error) {
          console.error(
            `Step 9: Error renaming guided progress file from ${oldProgressFilePath} → ${newProgressFilePath}:`,
            error
          );
        }

        const bannerImagePathToUpdate = window.sodaJSONObj["digital-metadata"]["banner-image-path"];
        if (bannerImagePathToUpdate) {
          console.log(
            "Step 9: Banner image path found, preparing to rename:",
            bannerImagePathToUpdate
          );
          console.log("previousSaveFileName:", previousSaveFileName);
          console.log("newSaveFileName:", newSaveFileName);
          const newBannerImagePath = bannerImagePathToUpdate.replace(
            previousSaveFileName,
            newSaveFileName
          );

          try {
            console.log("Step 9: Renaming banner image folder:", {
              old: bannerImagePathToUpdate,
              new: newBannerImagePath,
            });
            window.fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
            window.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
            console.log("Step 9: Updated banner image path in sodaJSONObj:", newBannerImagePath);
          } catch (error) {
            console.error(
              `Step 9: Error renaming banner image folder from ${bannerImagePathToUpdate} → ${newBannerImagePath}:`,
              error
            );
          }
        } else {
          console.log("Step 9: No banner image path to update.");
        }
      } else {
        console.log("Step 9: Progress file path unchanged, no renaming needed.");
      }
    }

    // 12. Finalize metadata updates
    window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
    console.log("Step 12: Finalized dataset name in sodaJSONObj:", datasetNameInput);

    console.log("=== savePageCurationPreparation completed for guided-name-subtitle-tab ===");
  }
};
