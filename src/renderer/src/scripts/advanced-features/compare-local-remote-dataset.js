// Purpose: Front end script for the compare local and remote dataset feature in the Advanced Features tab.
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

import api from "../others/api/api";
import { addRows } from "../../stores/slices/tableRowSlice";
import { clientError } from "../others/http-error-handler/error-handler";
import { swalConfirmAction, swalShowError, swalShowInfo } from "../utils/swal-utils";

document.querySelector(".prepare-comparison").addEventListener("click", async () => {
  window.openDropdownPrompt("null", "dataset");
});

document
  .querySelector("#compare-local-remote-dataset-local-path")
  .addEventListener("click", async () => {
    window.electron.ipcRenderer.send("open-file-dialog-newdataset");
    window.electron.ipcRenderer.on("selected-new-dataset", (event, path) => {
      document.querySelector("#compare-local-remote-dataset-local-path").value = path;
      document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display =
        "flex";
    });
  });

document
  .querySelector("#compare-local-remote-confirm-local-dataset-btn")
  .addEventListener("click", () => {
    document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display =
      "none";
    let nextQuestion = document.querySelector("#compare-local-remote-confirm-local-dataset-btn")
      .dataset.next;
    document.querySelector(`#${nextQuestion}`).style.display = "flex";

    // if a Pennsieve dataset has already been selected then show question 3 as well
    if ($("#bf_dataset_load_compare_local_remote").text().trim() !== "None") {
      showQuestion3();
    }
  });

const showQuestion3 = () => {
  let nextQuestion = document.querySelector("#compare-local-remote-dataset-question-3");
  nextQuestion.style.display = "flex";
  nextQuestion.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#comparison-results-container").style.display = "none";
};

// observer for the selected dataset label in the dataset selection card in question 2
const datasetChangedObserver = new MutationObserver(() => {
  // once a dataset has been selected show the run validator button if the current question is active
  if (
    $("#bf_dataset_load_compare_local_remote").text().trim() !== "None" &&
    $("#compare-local-remote-dataset-local-path").val() !== ""
  ) {
    showQuestion3();
  } else {
    $("#compare-local-remote-dataset-question-3").css("display", "none");
  }
});

// begin observing the dataset label in question 2
datasetChangedObserver.observe(document.querySelector("#bf_dataset_load_compare_local_remote"), {
  childList: true,
});

document
  .querySelector("#compare-local-remote-begin-comparison-btn")
  .addEventListener("click", async function () {
    // hide self
    this.style.display = "none";

    // start the spinner
    document.querySelector("#comparing-local-remote-dataset-roller").classList.remove("hidden");

    await new Promise((resolve) => setTimeout(resolve, 4000));

    // get results
    try {
      await compareLocalRemoteDataset();
    } catch (error) {
      clientError(error);
      await swalShowError(
        "Error",
        "An error occurred while comparing the datasets. Please try again."
      );
      // hide the spinner
      document.querySelector("#comparing-local-remote-dataset-roller").classList.add("hidden");
      // show the confirm button
      document.querySelector("#compare-local-remote-begin-comparison-btn").style.display = "flex";
    }

    // hide the spinner
    document.querySelector("#comparing-local-remote-dataset-roller").classList.add("hidden");
    document.querySelector("#comparison-results-container").style.display = "flex";
  });

let comparisonResults;

const compareLocalRemoteDataset = async () => {
  const localDatasetPath = document.querySelector("#compare-local-remote-dataset-local-path").value;
  const remoteDatasetPath = window.defaultBfDatasetId;

  comparisonResults = await getComparisonResults(localDatasetPath, remoteDatasetPath);

  // check if there are any results
  if (
    comparisonResults.files_only_on_local.length === 0 &&
    comparisonResults.files_only_on_pennsieve.length === 0
  ) {
    // no differences
    document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "flex";
    return;
  } else if (comparisonResults.files_only_on_local.length === 0) {
    document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "none";
    document.querySelector("#only-on-local-btn-div").style.display = "none";
  } else if (comparisonResults.files_only_on_pennsieve.length === 0) {
    document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "none";
    document.querySelector("#only-on-pennsieve-btn-div").style.display = "none";
  } else {
    document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "none";
    document.querySelector("#only-on-pennsieve-btn-div").style.display = "flex";
    document.querySelector("#only-on-local-btn-div").style.display = "flex";
  }

  let normalizedPaths = comparisonResults.files_only_on_local.map((path) => {
    return window.path.normalize(path);
  });

  addRows("comparison-results-only-on-pennsieve-table", comparisonResults.files_only_on_pennsieve);
  addRows("comparison-results-only-on-local-table", normalizedPaths);
};

const getComparisonResults = async (localDatasetPath, remoteDatasetPath) => {
  let comparisonReults = await api.getLocalRemoteComparisonResults(
    remoteDatasetPath,
    localDatasetPath
  );
  return comparisonReults;
};

document.querySelector("#only-on-pennsieve-get-list").addEventListener("click", async () => {
  const savePath = await window.electron.ipcRenderer.invoke(
    "open-folder-path-select",
    "Select a location to save your list of files"
  );

  if (!savePath) {
    // If no path selected, exit the function
    return;
  }

  const csvData = comparisonResults.files_only_on_pennsieve.join("\n");

  const csvFilePath = `${savePath}/files_only_on_pennsieve_dataset.csv`;

  // make a csv with the csvData and save it to the csvFilePath
  window.fs.writeFileSync(csvFilePath, csvData);

  // open the file in the default CSV viewer
  window.electron.ipcRenderer.send("open-file-at-path", csvFilePath);
});

document.querySelector("#only-on-local-get-list").addEventListener("click", async () => {
  const savePath = await window.electron.ipcRenderer.invoke(
    "open-folder-path-select",
    "Select a location to save your list of files"
  );

  if (!savePath) {
    // If no path selected, exit the function
    return;
  }

  let normalizedPaths = comparisonResults.files_only_on_local.map((path) => {
    return window.path.normalize(path);
  });

  const csvData = normalizedPaths.join("\n");

  const csvFilePath = `${savePath}/files_only_on_local_drive.csv`;

  // make a csv with the csvData and save it to the csvFilePath
  window.fs.writeFileSync(csvFilePath, csvData);

  // open the file in the default CSV viewer
  window.electron.ipcRenderer.send("open-file-at-path", csvFilePath);
});

document.querySelector("#only-on-local-upload-selected").addEventListener("click", async () => {
  let res = await swalConfirmAction(
    "warning",
    "Navigate to Upload Dataset and Upload Files",
    "Clicking this button will take you to the Upload Dataset feature where we will upload the listed files to the selected Pennsieve dataset for you. All steps will have the options pre-selected for you to correctly upload only these files. Please note if some of your files are not SDS-compliant the dataset cannot be uploaded. Are you sure you want to do this?",
    "yes",
    "no"
  );

  document.getElementById("compare-local-remote-feature").classList.add("hidden"); // Compare local remote feature
  document.getElementById("compare-local-remote-feature").classList.remove("is-shown");

  if (!res) return;

  document.querySelector("#button-homepage-freeform-mode").click();

  // get the local dataset path
  const localDatasetPath = document.querySelector("#compare-local-remote-dataset-local-path").value;
  await window.importLocalDataset(localDatasetPath);

  document.querySelector("#confirm-account-workspace").click();

  document.querySelector("#confirm-account-workspace").click();

  document.querySelector("#dataset-upload-existing-dataset").click();
});

document.querySelector("#only-on-pennsieve-delete-selected").addEventListener("click", async () => {
  let filesToDelete = comparisonResults.files_only_on_pennsieve_ids;
  try {
    await api.deleteFilesFromDataset(window.defaultBfDatasetId, filesToDelete);
    // removeRows("comparison-results-only-on-pennsieve-table")
    await swalShowInfo(
      "Files Deleted",
      `${filesToDelete} files have been deleted from the dataset.`
    );
  } catch (e) {
    clientError(e);
    await swalShowError("Error", "An error occurred while deleting the files. Please try again.");
    return;
  }
});
