
// An Enum for determining the type of algorithm to use for updating the progress container.
const ProgressContainerType = {
    MANIFEST: "manifest",
    PENNSIEVE_IMPORT: "pennsieve_import",
}


/**
 * Update the progress display of a given progress tracking container.
 * @param {HTMLElement} progress_container - The progress container to update.
 * @param {HTMLElement} percentage_text - The percentage text element.
 * @param {HTMLElement} left_progress_bar - The left progress bar element.
 * @param {HTMLElement} right_progress_bar - The right progress bar element.
 * @param {} res  - The upload information used for updating the given progress container
 * @param {Enumerator} progressContainerType - Enumerator of the type of progress container to update.
 */
const updateProgressContainer = (progress_container, percentage_text, left_progress_bar, right_progress_bar, res, progressContainerType) => {
    if (progressContainerType === ProgressContainerType.MANIFEST) {
        updateProgressContainerManifest(progress_container, percentage_text, left_progress_bar, right_progress_bar, res);
    } else {
        updateProgressContainerPennsieveImport(progress_container, percentage_text, left_progress_bar, right_progress_bar, res);
    }
}

/**
 * 
 * Use this when updating a progress container for a manifest generation.
 * @param {*} progress_container 
 * @param {*} percentage_text 
 * @param {*} left_progress_bar 
 * @param {*} right_progress_bar 
 * @param {*} manifestProgress 
 */
const updateProgressContainerManifest = (progress_container, percentage_text, left_progress_bar, right_progress_bar, manifestProgress) => {
    let totalManifestFiles = manifestProgress.total_manifest_files;
    let totalManifestFilesCreated = manifestProgress.manifest_files_uploaded;

    let manifestProgressPercentage = Math.round(
        (totalManifestFilesCreated / totalManifestFiles) * 100
    );
    percentage_text.innerText = manifestProgressPercentage + "%";
    if (manifestProgressPercentage <= 50) {
        left_progress_bar.style.transform = `rotate(${manifestProgressPercentage * 0.01 * 360
            }deg)`;
    } else {
        left_progress_bar.style.transition = "";
        left_progress_bar.classList.add("notransition");
        left_progress_bar.style.transform = `rotate(180deg)`;
        right_progress_bar.style.transform = `rotate(${manifestProgressPercentage * 0.01 * 180
            }deg)`;
    }

    if (totalManifestFiles === totalManifestFilesCreated) {
        percentage_text.innerText = "100%";
        left_progress_bar.style.transform = `rotate(180deg)`;
        right_progress_bar.style.transform = `rotate(180deg)`;
        right_progress_bar.classList.remove("notransition");

        setTimeout(() => {
            progress_container.style.display = "none";
        }, 2000);
    }
}


/**
 * 
 * Use this when updating a progress container for a Pennsieve import.
 * @param {*} progress_container 
 * @param {*} percentage_text 
 * @param {*} left_progress_bar 
 * @param {*} right_progress_bar 
 * @param {*} pennsieveImportProgress 
 */
const updateProgressContainerPennsieveImport = (progress_container, percentage_text, left_progress_bar, right_progress_bar, pennsieveImportProgress) => {
    let percentage_amount = pennsieveImportProgress["import_progress_percentage"].toFixed(2);
    finished = pennsieveImportProgress["import_completed_items"];
    percentage_text.innerText = percentage_amount + "%";
    if (percentage_amount <= 50) {
        left_progress_bar.style.transform = `rotate(${percentage_amount * 0.01 * 360
            }deg)`;
    } else {
        left_progress_bar.style.transition = "";
        left_progress_bar.classList.add("notransition");
        left_progress_bar.style.transform = `rotate(180deg)`;
        right_progress_bar.style.transform = `rotate(${percentage_amount * 0.01 * 180
            }deg)`;
    }

    if (finished === 1) {
        percentage_text.innerText = "100%";
        left_progress_bar.style.transform = `rotate(180deg)`;
        right_progress_bar.style.transform = `rotate(180deg)`;
        right_progress_bar.classList.remove("notransition");
        setTimeout(() => {
            progress_container.style.display = "none";
        }, 2000);
    }
}



/**
 * Reset the progress display of a given progress tracking container.
 * @param {HTMLElement} progress_container
 * @param {HTMLElement} percentage_text
 * @param {HTMLElement} left_progress_bar
 * @param {HTMLElement} right_progress_bar
 */
const resetProgressContainer = (
    progress_container,
    percentage_text,
    left_progress_bar,
    right_progress_bar
) => {
    percentage_text.innerText = "0%";
    progress_container.style.display = "block";
    left_progress_bar.style.transform = `rotate(0deg)`;
    right_progress_bar.style.transform = `rotate(0deg)`;

    // dispaly the progress container again
    progress_container.style.display = "flex";
};

/**
 * 
 * @param {HTMLElement} progress_container 
 * @returns 
 */
const getProgressContainerElements = (progress_container) => {
    let percentage_text = progress_container.querySelector(
        ".pennsieve_loading_dataset_percentage"
    );
    
    let left_progress_bar = progress_container.querySelector(
        ".pennsieve_left-side_less_than_50"
    );

    let right_progress_bar = progress_container.querySelector(
        ".pennsieve_right-side_greater_than_50"
    );

    return {
        percentage_text,
        left_progress_bar,
        right_progress_bar
    }

}