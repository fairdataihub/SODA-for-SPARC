// Purpose: Front end script for the compare local and remote dataset feature in the Advanced Features tab.
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

document.querySelector("#compare-local-remote-dataset-local-path").addEventListener("click", () => {
  console.log("Clicked");

  document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display = "flex";
});

document
  .querySelector("#compare-local-remote-confirm-local-dataset-btn")
  .addEventListener("click", (e) => {
    console.log("clicked");
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
  });



document.querySelector("#compare-local-remote-begin-comparison-btn").addEventListener("click", async () => {

  // start the spinner 
  document.querySelector("#comparing-local-remote-dataset-roller").classList.remove("hidden")

  await new Promise((resolve) => setTimeout(resolve, 4000));

  // get results
  await compareLocalRemoteDataset();

  // hide the spinner
  document.querySelector("#comparing-local-remote-dataset-roller").classList.add("hidden")



})


const compareLocalRemoteDataset = async () => {
    const localDatasetPath = document.querySelector("#compare-local-remote-dataset-local-path").value;
    const remoteDatasetPath = window.defaultBfDatasetId; 

    const comparisonResults = await getComparisonResults(localDatasetPath, remoteDatasetPath);

    // check if there are any results 
    if (comparisonResults.onlyLocal.length === 0 && comparisonResults.onlyPennsieve.length === 0) {
        // no differences 
        document.querySelector("#compare-local-remote-dataset-no-differences").style.display = "flex";
        return;
    }

    populateFilePaths(document.querySelector("#comparison-results-only-on-pennsieve-table"), comparisonResults.onlyPennsieve);
    populateFilePaths(document.querySelector("#comparison-results-only-on-local-table"), comparisonResults.onlyLocal);    
}


const populateFilePaths = (targetTableElement, differenceResultsList) => {
  let tableBody = targetTableElement.getElementsByTagName("tbody")[0];
  for (const filePath of differenceResultsList) {
    let row = tableBody.insertRow(-1);
    let cell = row.insertCell(0);
    let newText = document.createTextNode(filePath);
    // left align the text in the cell
    cell.style.textAlign = "left";
    cell.style.color = "black";
    cell.appendChild(newText);
  }
};


const getComparisonResults = async () => {
  // TOOD: Make request to server 

  return {
    "onlyLocal": ["file/one", "file/two"],
    "onlyPennsieve": ["file/three", "file/four"]
  }
}
