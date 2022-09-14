// An Enum for determining the type of algorithm to use for updating the progress container.
const ProgressContainerType = {
  MANIFEST: "manifest",
  PENNSIEVE_IMPORT: "pennsieve_import",
};

/**
 * Update the progress display of a given progress tracking container.
 * @param {HTMLElement} progress_container - The progress container to update.
 * @param {HTMLElement} percentage_text - The percentage text element.
 * @param {HTMLElement} left_progress_bar - The left progress bar element.
 * @param {HTMLElement} right_progress_bar - The right progress bar element.
 * @param {} res  - The upload information used for updating the given progress container
 * @param {Enumerator} progressContainerType - Enumerator of the type of progress container to update.
 * @param {boolean} hide - Determines whether or not the progress container will be hidden after the import is complete. Default = true; hides after 2 seconds. (optional)
 *
 */
const updateProgressContainer = (
  progress_container,
  percentage_text,
  left_progress_bar,
  right_progress_bar,
  res,
  progressContainerType,
  hide
) => {
  if (progressContainerType == ProgressContainerType.MANIFEST) {
    updateProgressContainerManifest(
      progress_container,
      percentage_text,
      left_progress_bar,
      right_progress_bar,
      res,
      hide
    );
  } else {
    updateProgressContainerPennsieveImport(
      progress_container,
      percentage_text,
      left_progress_bar,
      right_progress_bar,
      res,
      hide
    );
  }
};

/**
 *
 * Use this when updating a progress container for a manifest generation.
 * @param {*} progress_container
 * @param {*} percentage_text
 * @param {*} left_progress_bar
 * @param {*} right_progress_bar
 * @param {*} manifestProgress
 * @param {number} hide - Determines whether or not the progress container will be hidden after the import is complete. Default = true; hides after 2 seconds. (optional)
 */
const updateProgressContainerManifest = (
  progress_container,
  percentage_text,
  left_progress_bar,
  right_progress_bar,
  manifestProgress,
  hide = true
) => {
  let totalManifestFiles = manifestProgress.total_manifest_files;
  let totalManifestFilesCreated = manifestProgress.manifest_files_uploaded;
  let manifestProgressPercentage = 0.0;

  if (totalManifestFilesCreated > 0) {
    manifestProgressPercentage = Math.round(
      (totalManifestFilesCreated / totalManifestFiles) * 100
    );
  }
  percentage_text.innerText = manifestProgressPercentage + "%";
  if (manifestProgressPercentage <= 50) {
    left_progress_bar.style.transform = `rotate(${
      manifestProgressPercentage * 0.01 * 360
    }deg)`;
  } else {
    left_progress_bar.style.transition = "";
    left_progress_bar.classList.add("notransition");
    left_progress_bar.style.transform = `rotate(180deg)`;
    right_progress_bar.style.transform = `rotate(${
      manifestProgressPercentage * 0.01 * 180
    }deg)`;
  }


  let finished = manifestProgress.finished;

  if (finished) {
    percentage_text.innerText = "100%";
    left_progress_bar.style.transform = `rotate(180deg)`;
    right_progress_bar.style.transform = `rotate(180deg)`;
    right_progress_bar.classList.remove("notransition");

    if (!hide) return;

    setTimeout(() => {
      progress_container.style.display = "none";
    }, 2000);
  }
};

/**
 *
 * Use this when updating a progress container for a Pennsieve import.
 * @param {*} progress_container
 * @param {*} percentage_text
 * @param {*} left_progress_bar
 * @param {*} right_progress_bar
 * @param {*} pennsieveImportProgress
 * @param {number} hide - Determines whether or not the progress container will be hidden after the import is complete. Default = true; hides after 2 seconds. (optional)
 */
const updateProgressContainerPennsieveImport = (
  progress_container,
  percentage_text,
  left_progress_bar,
  right_progress_bar,
  pennsieveImportProgress,
  hide
) => {
  let percentage_amount =
    pennsieveImportProgress["import_progress_percentage"].toFixed(2);

  if (percentage_amount === 0) {
    percentage_amount = 0.0;
  }
  let finished = pennsieveImportProgress["import_completed_items"];
  percentage_text.innerText = percentage_amount + "%";
  if (percentage_amount <= 50) {
    left_progress_bar.style.transform = `rotate(${
      percentage_amount * 0.01 * 360
    }deg)`;
  } else {
    //left_progress_bar.style.transition = "";
    left_progress_bar.classList.add("notransition");
    left_progress_bar.style.transform = `rotate(180deg)`;
    right_progress_bar.style.transform = `rotate(${
      percentage_amount * 0.01 * 180
    }deg)`;
  }

  if (finished) {
    percentage_text.innerText = "100%";
    left_progress_bar.style.transform = `rotate(180deg)`;
    right_progress_bar.style.transform = `rotate(180deg)`;
    right_progress_bar.classList.remove("notransition");

    if (!hide) return;

    setTimeout(() => {
      progress_container.style.display = "none";
    }, 2000);
  }
};

/**
 * Reset the progress display of a given progress tracking container.
 * @param {HTMLElement} progress_container
 * @param {HTMLElement} percentage_text
 * @param {HTMLElement} left_progress_bar
 * @param {HTMLElement} right_progress_bar
 */
const resetProgressContainer = async (
  progress_container,
  percentage_text,
  left_progress_bar,
  right_progress_bar
) => {
  percentage_text.innerText = "0%";
  right_progress_bar.style.transform = `rotate(0deg)`;
  progress_container.style.display = "block";
  progress_container.style.visibility = "visible";
  await wait(480);
  left_progress_bar.style.transition = "transform 600ms ease;";
  left_progress_bar.classList.remove("notransition");
  left_progress_bar.style.transform = `rotate(0deg)`;
  await wait(700);
  left_progress_bar.classList.add("notransition");
};

/**
 *
 * @param {HTMLElement} progress_container
 * @returns
 */
const getProgressContainerElements = (progressContainer) => {
  let percentage_text = progressContainer.querySelector(
    ".pennsieve_loading_dataset_percentage"
  );

  let left_progress_bar = progressContainer.querySelector(
    ".pennsieve_left-side_less_than_50"
  );

  let right_progress_bar = progressContainer.querySelector(
    ".pennsieve_right-side_greater_than_50"
  );

  return {
    percentage_text,
    left_progress_bar,
    right_progress_bar,
  };
};


const hideProgressContainer = (progressContainer) => {
  progressContainer.style.display = "none";
}
