import useGlobalStore from "../../../../stores/globalStore";
import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";

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
    const startingNewCuration = isCheckboxCardChecked("guided-button-start-new-curation");
    const resumingExistingProgress = isCheckboxCardChecked("guided-button-resume-progress-file");

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

    if (!datasetNameInput) {
      errorArray.push({ type: "notyf", message: "Please enter a dataset name." });
    }
    if (!datasetSubtitleInput) {
      errorArray.push({
        type: "notyf",
        message: "Please enter a dataset brief description of your dataset.",
      });
    }

    if (errorArray.length > 0) {
      throw errorArray;
    }

    window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;

    const sanitizedDatasetName = window.sanitizeStringForSaveFileSystemSave(datasetNameInput);

    const prevSaveFileName = window.sodaJSONObj?.["save-file-name"];
    const prevRandomSuffix = window.sodaJSONObj?.["save-file-random-hash-suffix"];
    const prevDatasetName = window.sodaJSONObj?.["digital-metadata"]?.["name"];

    window.log.info("[guided-name-subtitle-tab] Previous save info:", {
      prevDatasetName,
      prevSaveFileName,
      prevRandomSuffix,
    });

    if (!prevDatasetName) {
      const existingProgressFileNames = getGuidedProgressFileNames();
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
    const newSaveFileName = `${sanitizedDatasetName}-${prevRandomSuffix || randomString}`;

    window.log.info("[guided-name-subtitle-tab] New save file info:", {
      sanitizedDatasetName,
      randomString,
      newSaveFileName,
    });

    window.sodaJSONObj["save-file-name"] = newSaveFileName;
    if (!prevRandomSuffix) {
      window.sodaJSONObj["save-file-random-hash-suffix"] = randomString;
    }

    const shouldRename =
      prevSaveFileName && prevDatasetName && prevDatasetName !== datasetNameInput;

    window.log.info("[guided-name-subtitle-tab] Rename check:", {
      prevDatasetName,
      prevSaveFileName,
      shouldRename,
    });

    if (shouldRename) {
      window.log.info(
        `[guided-name-subtitle-tab] Dataset name change detected: ${prevDatasetName} → ${datasetNameInput}`
      );

      const existingProgressFileNames = getGuidedProgressFileNames();
      const filteredExistingProgressFileNames = existingProgressFileNames.filter(
        (name) => name !== prevDatasetName
      );

      if (filteredExistingProgressFileNames.includes(datasetNameInput)) {
        errorArray.push({
          type: "notyf",
          message: "A dataset with this name already exists. Please choose a different name.",
        });
        throw errorArray;
      }

      const oldProgressFilePath = `${guidedProgressFilePath}/${prevSaveFileName}.json`;
      const newProgressFilePath = `${guidedProgressFilePath}/${newSaveFileName}.json`;

      window.log.info("[guided-name-subtitle-tab] Renaming progress file:", {
        oldProgressFilePath,
        newProgressFilePath,
      });

      if (oldProgressFilePath !== newProgressFilePath) {
        try {
          window.fs.renameSync(oldProgressFilePath, newProgressFilePath);
          window.log.info(
            `[guided-name-subtitle-tab] Successfully renamed progress file: ${prevSaveFileName} → ${newSaveFileName}`
          );
        } catch (error) {
          window.log.error(
            `[guided-name-subtitle-tab] Error renaming guided progress file from ${oldProgressFilePath} → ${newProgressFilePath}:`,
            error
          );
        }

        const bannerImagePathToUpdate = window.sodaJSONObj["digital-metadata"]["banner-image-path"];
        if (bannerImagePathToUpdate) {
          const newBannerImagePath = bannerImagePathToUpdate.replace(
            prevSaveFileName,
            newSaveFileName
          );

          window.log.info("[guided-name-subtitle-tab] Renaming banner image folder:", {
            old: bannerImagePathToUpdate,
            new: newBannerImagePath,
          });

          try {
            window.fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
            window.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
            window.log.info(
              `[guided-name-subtitle-tab] Successfully renamed banner image folder: ${bannerImagePathToUpdate} → ${newBannerImagePath}`
            );
          } catch (error) {
            window.log.error(
              `[guided-name-subtitle-tab] Error renaming banner image folder from ${bannerImagePathToUpdate} → ${newBannerImagePath}:`,
              error
            );
          }
        }
      }
    } else {
      window.log.info("[guided-name-subtitle-tab] Skipping rename (no previous save or no change)");
    }

    window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
    window.log.info("[guided-name-subtitle-tab] Finalized dataset name:", datasetNameInput);
  }

  if (pageBeingLeftID === "guided-data-standard-selection-tab") {
    console.log("Validating Data Standard Selection...");
    const sparcDatasetStandardChecked = isCheckboxCardChecked("sparc-data-standard");
    const healRejoinDatasetStandardChecked = isCheckboxCardChecked("heal-rejoin-data-standard");
    const healPrecisionDatasetStandardChecked = isCheckboxCardChecked(
      "heal-precision-data-standard"
    );
    if (
      !sparcDatasetStandardChecked &&
      !healRejoinDatasetStandardChecked &&
      !healPrecisionDatasetStandardChecked
    ) {
      errorArray.push({
        type: "notyf",
        message: "Please select a dataset standard to use for organizing your dataset.",
      });
      throw errorArray;
    }

    const currentSodaVersion = useGlobalStore.getState().appVersion || "";

    const sparcStandardInfo = {
      data_standard: "SPARC",
      data_standard_version: "2025.05.01",
    };
    const healStandardInfo = {
      data_standard: "HEAL",
      data_standard_version: "2024.10.01",
    };
    const sodaStandardInfo = {
      data_standard: "SODA",
      data_standard_version: currentSodaVersion,
    };

    if (sparcDatasetStandardChecked) {
      window.sodaJSONObj["data-standard"] = "SPARC";
      window.sodaJSONObj["standards-information"] = [sparcStandardInfo, sodaStandardInfo];
    }

    if (healRejoinDatasetStandardChecked) {
      window.sodaJSONObj["data-standard"] = "HEAL-REJOIN";
      window.sodaJSONObj["standards-information"] = [
        sparcStandardInfo,
        healStandardInfo,
        {
          data_standard: "HEAL-REJOIN",
          data_standard_version: "2025.01.14",
        },
        sodaStandardInfo,
      ];
    }

    if (healPrecisionDatasetStandardChecked) {
      window.sodaJSONObj["data-standard"] = "HEAL-PRECISION";
      window.sodaJSONObj["standards-information"] = [
        sparcStandardInfo,
        healStandardInfo,
        {
          data_standard: "HEAL-PRECISION",
          data_standard_version: "2025.02.05",
        },
        sodaStandardInfo,
      ];
    }
  }
};
