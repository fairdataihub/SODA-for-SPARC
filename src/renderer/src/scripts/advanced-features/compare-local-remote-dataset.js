// Purpose: Front end script for the compare local and remote dataset feature in the Advanced Features tab. 
while (!window.baseHtmlLoaded) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }


document.querySelector("#compare-local-remote-dataset-local-path").addEventListener("click", () => {
    console.log("Clicked")

    document.querySelector("#compare-local-remote-confirm-local-dataset-btn").style.display = "flex";
})

document.querySelector("#compare-local-remote-confirm-local-dataset-btn").addEventListener("click", (e) => {
    console.log("clicked")
    let nextQuestion = document.querySelector("#compare-local-remote-confirm-local-dataset-btn").dataset.next; 
    document.querySelector(`#${nextQuestion}`).style.display = "flex";
})

const questionTwoDatasetSelectionObserver = new MutationObserver(() => {
    if ($("#bf_dataset_load_compare_local_remote").text().trim() !== "None") {
      $("#div-compare-local-remote-dataset-ps-ds-confirm").css("display", "flex");
    //   $($("#div-check-bf-import-validator").children()[0]).show();
    } else {
      $("#div-compare-local-remote-dataset-ps-ds-confirm").css("display", "none");
    }
  });

// begin observing the dataset label inn question 2
questionTwoDatasetSelectionObserver.observe(document.querySelector("#compare-local-remote-dataset-ds-name"), {
    childList: true,
  });