// Purpose: Front end script for the compare local and remote dataset feature in the Advanced Features tab.
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

import api from "../others/api/api";
import { addRows, removeRows } from "../../stores/slices/tableRowSlice";

document.querySelector("#compare-local-remote-dataset-local-path").addEventListener("click", async () => {
  console.log("Clicked");

  window.electron.ipcRenderer.send("open-file-dialog-newdataset")
  window.electron.ipcRenderer.on("selected-new-dataset", (event, path) => {
    document.querySelector("#compare-local-remote-dataset-local-path").value = path;
    document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display = "flex";
  })
});

document
  .querySelector("#compare-local-remote-confirm-local-dataset-btn")
  .addEventListener("click", (e) => {
    document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display = "none";
    let nextQuestion = document.querySelector("#compare-local-remote-confirm-local-dataset-btn")
      .dataset.next;
    document.querySelector(`#${nextQuestion}`).style.display = "flex";
  });

const questionTwoDatasetSelectionObserver = new MutationObserver(() => {
  if ($("#bf_dataset_load_compare_local_remote").text().trim() !== "None") {
    $("#div-compare-local-remote-dataset-ps-ds-confirm").css("display", "flex");
    //   $($("#div-check-bf-import-validator").children()[0]).show();
  } else {
    $("#div-compare-local-remote-dataset-ps-ds-confirm").css("display", "none");
  }
});

// begin observing the dataset label inn question 2
questionTwoDatasetSelectionObserver.observe(
  document.querySelector("#compare-local-remote-dataset-ds-name"),
  {
    childList: true,
  }
);

document
  .querySelector("#compare-local-remote-begin-comparison-btn")
  .addEventListener("click", async () => {
    // start the spinner
    document.querySelector("#comparing-local-remote-dataset-roller").classList.remove("hidden");

    await new Promise((resolve) => setTimeout(resolve, 4000));

    // get results
    await compareLocalRemoteDataset();

    // hide the spinner
    document.querySelector("#comparing-local-remote-dataset-roller").classList.add("hidden");
  });

const compareLocalRemoteDataset = async () => {
  const localDatasetPath = document.querySelector("#compare-local-remote-dataset-local-path").value;
  const remoteDatasetPath = window.defaultBfDatasetId;

  const comparisonResults = await getComparisonResults(localDatasetPath, remoteDatasetPath);

  // check if there are any results
  if (
    comparisonResults.files_only_on_local.length === 0 &&
    comparisonResults.files_only_on_pennsieve.length === 0
  ) {
    // no differences
    document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "flex";
    return;
  }

  addRows("comparison-results-only-on-pennsieve-table", comparisonResults.files_only_on_pennsieve);
  addRows("comparison-results-only-on-local-table", comparisonResults.files_only_on_local);
};

const getComparisonResults = async (localDatasetPath, remoteDatasetPath) => {
  let comparisonReults = await api.getLocalRemoteComparisonResults(
    remoteDatasetPath,
    localDatasetPath
  );
  return comparisonReults;
};
