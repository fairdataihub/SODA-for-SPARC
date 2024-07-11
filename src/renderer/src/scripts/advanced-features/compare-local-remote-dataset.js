// Purpose: Front end script for the compare local and remote dataset feature in the Advanced Features tab.
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

import api from "../others/api/api";
import { addRows, removeRows } from "../../stores/slices/tableRowSlice";
import { clientError } from "../others/http-error-handler/error-handler";
import { swalShowError } from "../utils/swal-utils";

document.querySelector(".prepare-comparison").addEventListener("click", async () => {
  window.openDropdownPrompt("null", "dataset");
});

document
  .querySelector("#compare-local-remote-dataset-local-path")
  .addEventListener("click", async () => {
    console.log("Clicked");

    window.electron.ipcRenderer.send("open-file-dialog-newdataset");
    window.electron.ipcRenderer.on("selected-new-dataset", (event, path) => {
      document.querySelector("#compare-local-remote-dataset-local-path").value = path;
      document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display =
        "flex";
    });
  });

document
  .querySelector("#compare-local-remote-confirm-local-dataset-btn")
  .addEventListener("click", (e) => {
    document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display =
      "none";
    let nextQuestion = document.querySelector("#compare-local-remote-confirm-local-dataset-btn")
      .dataset.next;
    document.querySelector(`#${nextQuestion}`).style.display = "flex";
  });

document
  .querySelector("#div-compare-local-remote-dataset-ps-ds-confirm")
  .addEventListener("click", async function () {
    // hide this children
    this.style.display = "none";

    window.transitionFreeFormMode(
      this,
      "compare-local-remote-dataset-question-2",
      "compare_local_remote_dataset_tab",
      "",
      "individual-question"
    );

    document.querySelector("#compare-local-remote-dataset-question-3").style.display = "flex";
    // window.scroll
  });

// observer for the selected dataset label in the dataset selection card in question 2
const questionTwoDatasetSelectionObserver = new MutationObserver(() => {
  // once a dataset has been selected show the run validator button if the current question is active
  if ($("#bf_dataset_load_compare_local_remote").text().trim() !== "None") {
    console.log("We activated this here woo woo");
    document.querySelector("#div-compare-local-remote-dataset-ps-ds-confirm").style.display =
      "flex";

    // only show the whole question if the user is on the validate tab and they have selected the ps dataset flow
    if (
      document.querySelector("#validate_dataset-question-2").classList.contains("show") &&
      document.querySelector("#pennsieve-question-2-container").style.display === "flex"
    ) {
      document.querySelector("#validate_dataset-question-3").style.display = "flex";
    } else {
      document.querySelector("#validate_dataset-question-3").style.display = "none";
    }
  } else {
    $("#div-compare-local-remote-dataset-ps-ds-confirm").css("display", "none");
  }
});

// begin observing the dataset label in question 2
questionTwoDatasetSelectionObserver.observe(
  document.querySelector("#bf_dataset_load_compare_local_remote"),
  {
    childList: true,
  }
);

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
  });

const compareLocalRemoteDataset = async () => {
  const localDatasetPath = document.querySelector("#compare-local-remote-dataset-local-path").value;
  const remoteDatasetPath = window.defaultBfDatasetId;

  const comparisonResults = await getComparisonResults(localDatasetPath, remoteDatasetPath);

  console.log(comparisonResults);

  // check if there are any results
  if (
    comparisonResults.folders_only_on_local.length === 0 &&
    comparisonResults.files_only_on_pennsieve.length === 0
  ) {
    // no differences
    document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "flex";
    return;
  }

  addRows("comparison-results-only-on-pennsieve-table", comparisonResults.files_only_on_pennsieve);
  addRows("comparison-results-only-on-local-table", comparisonResults.folders_only_on_local);
};

const getComparisonResults = async (localDatasetPath, remoteDatasetPath) => {
  let comparisonReults = await api.getLocalRemoteComparisonResults(
    remoteDatasetPath,
    localDatasetPath
  );
  return comparisonReults;
};
