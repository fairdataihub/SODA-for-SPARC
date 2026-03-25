import { swalShowInfo, swalConfirmAction } from "../../utils/swal-utils";

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}
export const getProgressFileData = async (progressFile) => {
  let progressFilePath = window.path.join(guidedProgressFilePath, progressFile + ".json");
  return readFileAsync(progressFilePath);
};

export const getAllProgressFileData = async (progressFiles) => {
  return Promise.all(
    progressFiles.map((progressFile) => {
      let progressFilePath = window.path.join(guidedProgressFilePath, progressFile);
      return readFileAsync(progressFilePath);
    })
  );
};

const readFileAsync = async (path) => {
  let result = await window.fs.readFile(path, "utf-8");

  // Parse if it's a string, otherwise assume it's already parsed
  let parsedResult = typeof result === "string" ? JSON.parse(result) : result;

  // Apply patches to fix any compatibility issues
  const patched = await patchProgressFile(parsedResult);

  // Create variable for the patched result
  const patchedResult = parsedResult;

  // Write the patched result back to disk only if it was patched
  if (patched) {
    try {
      await window.fs.writeFile(path, JSON.stringify(patchedResult, null, 2));
    } catch (error) {
      console.warn(`Failed to save progress file at ${path}:`, error);
    }
  }

  return patchedResult;
};

const patchProgressFile = async (progressFile) => {
  let patched = false;

  // If the json key was misspelled as "cuartion-mode" in previous versions, correct it to "curation-mode"
  if (progressFile["cuartion-mode"] && !progressFile["curation-mode"]) {
    progressFile["curation-mode"] = progressFile["cuartion-mode"];
    delete progressFile["cuartion-mode"];
    patched = true;
  }

  return patched;
};

export const deleteProgressFile = async (progressFilePath) => {
  try {
    window.fs.unlinkSync(progressFilePath);
  } catch (error) {
    console.error(`Error deleting progress file at ${progressFilePath}:`, error);
  }
};

export const getGuidedProgressFileNames = (curationMode) => {
  const progressFileNames = window.fs
    .readdirSync(guidedProgressFilePath)
    .filter((fileName) => fileName.endsWith(".json"));

  const progressFiles = [];

  for (const fileName of progressFileNames) {
    try {
      const filePath = window.path.join(guidedProgressFilePath, fileName);
      const fileContent = window.fs.readFileSync(filePath, "utf-8");
      const progressData = JSON.parse(fileContent);
      const datasetName = progressData?.["digital-metadata"]?.["name"];
      const datasetCurationMode = progressData?.["curation-mode"];
      const saveFileName = progressData?.["save-file-name"];
      if (datasetName && datasetCurationMode === curationMode) {
        progressFiles.push({
          datasetName,
          saveFileName,
          filePath,
        });
      }
    } catch (error) {
      console.error(`Error reading progress file ${fileName}:`, error);
    }
  }

  return progressFiles;
};

export const createOrUpdateProgressFileSaveInfo = async (datasetNameInput) => {
  const sanitizedDatasetName = window.sanitizeStringForSaveFileSystemSave(datasetNameInput);

  const prevSaveFileName = window.sodaJSONObj?.["save-file-name"];
  const prevRandomSuffix = window.sodaJSONObj?.["save-file-random-hash-suffix"];
  const prevDatasetName = window.sodaJSONObj?.["digital-metadata"]?.["name"];
  const curationMode = window.sodaJSONObj?.["curation-mode"];
  const curationModeHomePageName =
    curationMode === "guided" ? "Prepare a Dataset Step-by-Step" : "Upload a SDS Compliant Dataset";
  const uploadingToExistingDatasetFreeFormDataset =
    window.sodaJSONObj?.["pennsieve-generation-target"] === "existing" &&
    curationMode === "free-form";
  const existingProgressFiles = getGuidedProgressFileNames(curationMode);
  const existingProgressFileObj = existingProgressFiles.find(
    (file) => file.datasetName === datasetNameInput
  );

  window.log.info("[guided-name-subtitle-tab] Previous save info:", {
    prevDatasetName,
    prevSaveFileName,
    prevRandomSuffix,
  });

  if (!prevDatasetName) {
    if (existingProgressFileObj) {
      if (uploadingToExistingDatasetFreeFormDataset) {
        const result = await swalConfirmAction(
          "warning",
          `You already have a dataset in progress named "${datasetNameInput}".`,
          `
            The existing progress file will be deleted if you proceed. If you do not want to lose progress on the
            existing dataset in progress, please navigate back to the ${curationModeHomePageName} page and click
            "Resume Curation" on the corresponding card.
          `,
          "Delete existing progress and continue",
          "Cancel"
        );
        if (result) {
          deleteProgressFile(existingProgressFileObj.filePath);
        } else {
          throw new Error(
            `Please navigate back to the ${curationModeHomePageName} page to continue working on your existing dataset in progress.`
          );
        }
      } else {
        const result = await swalConfirmAction(
          "warning",
          `You have a dataset in progress named "${datasetNameInput}".`,
          `
            The existing progress file will be deleted if you proceed. If you do not want to lose progress on the
            existing dataset in progress, please navigate back to the ${curationModeHomePageName} page and click
            "Resume Curation" on the corresponding card.
          `,
          "Delete existing progress and continue",
          "Cancel"
        );
        if (result) {
          deleteProgressFile(existingProgressFileObj.filePath);
        } else {
          throw new Error("Please choose a different dataset name.");
        }
      }
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

  const shouldRename = prevSaveFileName && prevDatasetName && prevDatasetName !== datasetNameInput;

  window.log.info("[guided-name-subtitle-tab] Rename check:", {
    prevDatasetName,
    prevSaveFileName,
    shouldRename,
  });

  if (shouldRename) {
    window.log.info(
      `[guided-name-subtitle-tab] Dataset name change detected: ${prevDatasetName} → ${datasetNameInput}`
    );

    const filteredExistingProgressFiles = existingProgressFiles.filter(
      (file) => file.datasetName !== prevDatasetName
    );

    const filteredProgressFileObj = filteredExistingProgressFiles.find(
      (file) => file.datasetName === datasetNameInput
    );

    if (filteredProgressFileObj) {
      throw new Error("A dataset with this name already exists. Please choose a different name.");
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
  if (!prevDatasetName) {
    // Alert the user that a progress file has been created with the new dataset name
    await swalShowInfo(
      "Your progress is now being saved!",
      `A progress file has been created for your dataset "${datasetNameInput}". You can resume your progress on this dataset at any time by navigating back to the ${curationModeHomePageName} page and clicking "Resume Curation" on the corresponding card.`
    );
  }
};
