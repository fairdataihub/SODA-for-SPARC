/*
    Purpose: Logging analytics for our 'main_curation_function' used to generate datasets in Organize Dataset feature is becoming too complicated
             to justify keeping it outside of its own functions. 

*/
const { determineDatasetLocation } = require("./analytics-utils");

const BUCKET_SIZE = 500;

// check if the user is modifying an existing local dataset for Curation
// Has to be called after Step 6
const editingExistingLocalDataset = () => {
  // check if the dataset is being generated locally
  if (sodaJSONObj["generate-dataset"]["destination"] !== "local") {
    return false;
  }

  // check if the dataset has merge set as the value for handling existing files
  if (sodaJSONObj["generate-dataset"]["if-existing"] === "merge") {
    return true;
  }

  // else this is a new local dataset generation
  return false;
};

// Sends detailed information about failures that occur when using the Organize Dataset's upload/generation feature to Analytics; Used for providing usage numbers to NIH
const logCurationErrorsToAnalytics = async (
  uploadedFiles,
  uploadedFilesSize,
  dataset_destination,
  mainTotalGenerateDatasetSize,
  increaseInFileSize,
  guidedMode
) => {
  if (!guidedMode) {
    logCurationForAnalytics(
      "Error",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.PREFIX,
      [],
      determineDatasetLocation()
    );

    logCurationForAnalytics(
      "Error",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      ["Step 7", "Generate", "dataset", `${dataset_destination}`],
      determineDatasetLocation()
    );
  } else {
    // track that an Error in the upload has occurred
    let kombuchaEventData = {
      value: 1,
      dataset_id: getDatasetId(sodaJSONObj),
      dataset_name: getDatasetName(sodaJSONObj),
      origin: getDatasetOrigin(sodaJSONObj),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );

    ipcRenderer.send("track-event", "Error", `Guided Mode - Generate - Dataset`, "Generate", 1);
  }

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

  if (!guidedMode) {
    let datasetName = "";

    if (sodaJSONObj?.["bf-dataset-selected"]?.["dataset-name"] === undefined) {
      // Existing dataset for Pennsieve
      datasetName = sodaJSONObj?.["bf-dataset-selected"]?.["dataset-name"];
    } else {
      // New dataset for Pennsieve
      datasetName = sodaJSONObj?.["generate-dataset"]?.["dataset-name"];
    }
    // when we fail we want to know the total amount of files we were trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    let kombuchaEventData = {
      value: file_counter,
      dataset_name: datasetName,
      origin: determineDatasetLocation(),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_DATASETS,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.FILES,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      "Number of Files",
      file_counter
    );

    // when we fail we want to know the total size that we are trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    // does not need to be logged for Success as that isn't a good way to log the size of the aggregate successful uploads
    kombuchaEventData = {
      value: mainTotalGenerateDatasetSize,
      dataset_name: datasetName,
      origin: determineDatasetLocation(),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_DATASETS,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      "Size",
      mainTotalGenerateDatasetSize
    );
  } else {
    // when we fail we want to know the total amount of files we were trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    let kombuchaEventData = {
      value: file_counter,
      dataset_name: datasetName,
      origin: getDatasetOrigin(sodaJSONObj),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.FILES,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      `Guided Mode - Generate - Dataset - Number of Files`,
      "Number of Files",
      file_counter
    );

    // when we fail we want to know the total size that we are trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    // does not need to be logged for Success as that isn't a good way to log the size of the aggregate successful uploads
    kombuchaEventData = {
      value: mainTotalGenerateDatasetSize,
      dataset_name: datasetName,
      origin: getDatasetOrigin(sodaJSONObj),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      "Guided Mode - Generate - Dataset - Size",
      "Size",
      mainTotalGenerateDatasetSize
    );
  }
};

const logSelectedUpdateExistingDatasetOptions = (origin) => {
  Array.from(document.querySelectorAll(".generate-preview")).forEach((card) => {
    let header = card.querySelector("h5");
    if (header.textContent.includes("folders")) {
      let action = "";
      let instruction = card.querySelector("p");
      if (instruction.textContent === "Replace") {
        action = kombuchaEnums.Action.REPLACE_ITEM;
      } else if (instruction.textContent === "Merge") {
        action = kombuchaEnums.Action.MERGE_ITEMS;
      } else if (instruction.textContent === "Skip") {
        action = kombuchaEnums.Action.SKIP_ITEMS;
      }

      // log the folder instructions to analytics
      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        action,
        kombuchaEnums.Label.FOLDERS,
        {
          value: 1,
          origin: origin,
        }
      );
    } else if (header.textContent.includes("existing files")) {
      let action = "";
      let instruction = card.querySelector("p");
      if (instruction.textContent === "Replace") {
        action = kombuchaEnums.Action.REPLACE_ITEM;
      } else if (instruction.textContent === "Merge") {
        action = kombuchaEnums.Action.MERGE_ITEMS;
      } else if (instruction.textContent === "Skip") {
        action = kombuchaEnums.Action.SKIP_ITEMS;
      } else if (instruction.textContent === "Duplicate") {
        action = kombuchaEnums.Action.DUPLICATE_ITEMS;
      }

      ipcRenderer.send(
        "track-kombucha",
        "Success",
        kombuchaEnums.Category.PREPARE_DATASETS,
        action,
        kombuchaEnums.Label.FILES,
        {
          value: 1,
          origin: origin,
        }
      );
    }
  });
};

const createEventData = (value, destination, origin, dataset_name) => {
  if (destination === "Pennsieve") {
    return {
      value: value,
      dataset_id: defaultBfDatasetId,
      dataset_name: dataset_name,
      origin: origin,
      destination: destination,
    };
  }

  return {
    value: value,
    dataset_name: dataset_name,
    origin: origin,
    destination: destination,
  };
};

module.exports = {
  logCurationErrorsToAnalytics,
  createEventData,
  logSelectedUpdateExistingDatasetOptions,
};
