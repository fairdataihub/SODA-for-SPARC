/*
    Purpose: Logging analytics for our 'main_curation_function' used to generate datasets in Organize Dataset feature is becoming too complicated
             to justify keeping it outside of its own functions. 

*/

const {
  determineDatasetLocation,
} = require("./scripts/others/analytics/utils");

// counts the amount of files in a local dataset's generation location
// FOR NOW ASSUME WE ARE ALWAYS HANDLING NEW GENERATION
const getLocallyGeneratedFileCount = async (generationLocation) => {
  // TODO: make sure that the target location exists

  // get the amount of files in the directory
  let generatedFiles = await fs.readdir(generationLocation);

  console.log("The amount of files generated is: ", generatedFiles);

  return generatedFiles;
};

// Sends detailed information about failures that occur when using the Organize Dataset's upload/generation feature to Analytics; Used for providing usage numbers to NIH
const logCurationErrorsToAnalytics = async () => {
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

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

  // when we fail we want to know the total amount of files we were trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
  ipcRenderer.send(
    "track-event",
    "Error",
    `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
    "Number of Files",
    file_counter
  );

  // when we fail we want to know the total size that we are trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
  ipcRenderer.send(
    "track-event",
    "Error",
    "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
    "Size",
    main_total_generate_dataset_size
  );

  let datasetLocation = determineDatasetLocation();

  // log failed Local, Saved, or New dataset generation to Google Analytics
  if (datasetLocation !== "Pennsieve") {
    let filesGeneratedForDataset = await getLocallyGeneratedFileCount(
      "TODO: Generation location"
    );

    // when we fail we want to know how many files were generated
    ipcRenderer.send(
      "track-event",
      "Success",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      datasetLocation,
      filesGeneratedForDataset
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      datasetLocation,
      file_counter
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
      datasetLocation,
      file_counter
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      main_total_generate_dataset_size
    );

    // get dataset id if available
    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
      datasetLocation,
      main_total_generate_dataset_size
    );
  } else {
    // log the Pennsieve upload session information
    // TODO: Local dataset generation does not have a session ID. Make this conditional.
    // TODO: Check when an upload has started instead of assuming we fail on upload to Pennsieve
    // TODO: Variable for the bucket size -- just need to decide where it should be placed
    // some files have been successfully uploaded before the crash occurred. Reasonable to say half of the bucket.
    ipcRenderer.send(
      "track-event",
      "Success",
      PrepareDatasetsAnalyticsPrefix.CURATE +
        " - Step 7 - Generate - Dataset - Number of Files",
      `${datasetUploadSession.id}`,
      (uploadedFiles += 250)
    );

    // track that a session failed so we can answer: "How many files were uploaded in a session before failure?" and "Did any session fail?"
    // the last question is analagous to "Did any uploads to Pennsieve fail?" but has the benefit of helping us answer question one;
    // without an explicit log of a session failing with the amount of files that were attempted that this provides we couldn't answer
    // the first question.
    ipcRenderer.send(
      "track-event",
      "Error",
      PrepareDatasetsAnalyticsPrefix.CURATE +
        " - Step 7 - Generate - Dataset - Number of Files",
      `${datasetUploadSession.id}`,
      file_counter
    );

    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      `${datasetUploadSession.id}`,
      // doesn't need to be incremented like uploadedFiles as this represents the final amount returned from the upload progress function;
      // or just a little less
      uploadedFilesSize
    );

    // log the size that was attempted to be uploaded for the given session
    // as above this helps us answer how much was uploaded out of the total before the session failed
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      `${datasetUploadSession.id}`,
      main_total_generate_dataset_size
    );
  }
};

const logCurationSuccessToAnalytics = async (manifest_files_requested) => {
  if (manifest_files_requested) {
    let high_level_folder_num = 0;
    if ("dataset-structure" in sodaJSONObj) {
      if ("folders" in sodaJSONObj["dataset-structure"]) {
        for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
          high_level_folder_num += 1;
        }
      }
    }

    // get dataset id if available
    let datasetLocation = determineDatasetLocation();
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest",
      datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
      high_level_folder_num
    );

    ipcRenderer.send(
      "track-event",
      "Success",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest - ${dataset_destination}`,
      datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
      high_level_folder_num
    );
  }

  if (dataset_destination == "Pennsieve") {
    show_curation_shortcut();
  }

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

  logCurationForAnalytics(
    "Success",
    PrepareDatasetsAnalyticsPrefix.CURATE,
    AnalyticsGranularity.PREFIX,
    [],
    determineDatasetLocation()
  );

  if (dataset_destination === "Local") {
    // log the dataset name as a label. Rationale: Easier to get all unique datasets touched when keeping track of the local dataset's name upon creation in a log.
    let datasetName = document.querySelector("#inputNewNameDataset").value;
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Local",
      datasetName
    );
  }

  logCurationForAnalytics(
    "Success",
    PrepareDatasetsAnalyticsPrefix.CURATE,
    AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
    ["Step 7", "Generate", "Dataset", `${dataset_destination}`],
    determineDatasetLocation()
  );

  let datasetLocation = determineDatasetLocation();
  // for tracking the total size of all the "saved", "new", "Pennsieve", "local" datasets by category
  ipcRenderer.send(
    "track-event",
    "Success",
    "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
    datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
    main_total_generate_dataset_size
  );

  // tracks the total size of datasets that have been generated to Pennsieve and on the user machine
  ipcRenderer.send(
    "track-event",
    "Success",
    `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
    datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
    main_total_generate_dataset_size
  );

  // track amount of files for datasets by ID or Local
  ipcRenderer.send(
    "track-event",
    "Success",
    `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
    datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
    file_counter
  );

  ipcRenderer.send(
    "track-event",
    "Success",
    `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
    datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
    file_counter
  );

  // log the preview card instructions for any files and folders being generated on Pennsieve
  Array.from(document.querySelectorAll(".generate-preview")).forEach((card) => {
    let header = card.querySelector("h5");
    if (header.textContent.includes("folders")) {
      let instruction = card.querySelector("p");
      // log the folder instructions to analytics
      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent}`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        1
      );
    } else if (header.textContent.includes("existing files")) {
      let instruction = card.querySelector("p");
      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent} `,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        1
      );
    }
  });
};

module.exports = {
  logCurationErrorsToAnalytics,
  logCurationSuccessToAnalytics,
};
