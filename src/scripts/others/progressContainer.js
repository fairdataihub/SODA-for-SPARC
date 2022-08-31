/**
 * 
 * @param {} res 
 */
const updateProgressContainer = (progress_container, percentage_text, left_progress_bar, right_progress_bar, res) => {
    
}

const updateProgressContainerManifest = (manifestProgress) => {
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

const updateProgressContainerPennsieveImport = (pennsieveImportProgress) => {
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