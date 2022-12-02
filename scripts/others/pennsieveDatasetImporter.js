// Tracks if bf_request_and_populate_dataset has has an error
let importError = false;

/**
 *  Tracks and displays the progress of the current Pennsieve dataset import. Progress is displayed in the provided progress container.
 *  @param {HTMLElement} progressContainer - Displays the progress of the import. Progress containers need to have class 'circular'
 *  @param {boolean} hide - Determines whether or not the progress container will be hidden after the import is complete. Default = true; hides after 2 seconds. (optional)
 */
const trackPennsieveImportProgress = async (progressContainer, hide) => {
  let { percentage_text, left_progress_bar, right_progress_bar } =
    getProgressContainerElements(progressContainer);

  resetProgressContainer(progressContainer, percentage_text, left_progress_bar, right_progress_bar);

  // * Update the progress container to properly display the progress of their dataset import.
  // * Once the import has been completed (i.e. the progress is 100%), the progress container will be hidden. The interval will be cleared.
  // * NOTE: The interval also clears on error.
  const updateProgress = async () => {
    let progressResponse;
    try {
      progressResponse = await client.get("/organize_datasets/dataset_files_and_folders/progress");
    } catch (error) {
      clientError(error);
      clearInterval(interval);
      return;
    }

    let progressReport = progressResponse.data;

    updateProgressContainer(
      progressContainer,
      percentage_text,
      left_progress_bar,
      right_progress_bar,
      progressReport,
      "pennsieve_import",
      hide
    );

    let finished = progressReport["import_completed_items"];

    if (finished === 1 || importError) {
      clearInterval(interval);
      // reset the import error flag
      importError = false;
    }
  };

  // update the import's progress every 500 ms if the import is not complete
  let interval = setInterval(updateProgress, 800);
};

/**
 *
 * @param {object} sodaJSONObj - The SODA json object used for tracking files, folders, and basic dataset curation information such as providence (local or Pennsieve).
 * @param {HTMLElement} progressContainer - The progress container element that will be used to display the progress of the import. (optional)
 * @param {boolean} hide - Determines whether or not the progress container will be hidden after the import is complete. Default = true; hides after 2 seconds. (optional)
 * @returns {
 *    "soda_json_structure": {}
 *    "success_message": ""
 *    "manifest_error_message": ""
 * }
 */
const bf_request_and_populate_dataset = async (
  sodaJSONObj,
  progressContainer = undefined,
  hide = true
) => {
  // track the import progress if appropriate
  if (!!progressContainer) trackPennsieveImportProgress(progressContainer, hide);

  try {
    let filesFoldersResponse = await client.post(
      `/organize_datasets/dataset_files_and_folders`,
      {
        sodajsonobject: sodaJSONObj,
      },
      { timeout: 0 }
    );

    let data = filesFoldersResponse.data;

    ipcRenderer.send("track-event", "Success", "Retrieve Dataset - Pennsieve", defaultBfDatasetId);

    return data;
  } catch (error) {
    importError = true;
    progressContainer.style.display = "none";
    clientError(error);
    ipcRenderer.send("track-event", "Error", "Retrieve Dataset - Pennsieve", defaultBfDatasetId);
    throw Error(userErrorMessage(error));
  }
};
