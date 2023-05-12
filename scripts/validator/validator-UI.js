/*
*******************************************************************************************************************
// Purpose: Presentation logic regarding transitioning from one question to another and/or resetting state upon user action in the validator
*******************************************************************************************************************
*/

// Presentation logic for transitioning from question one to question two
const transitionToValidateQuestionTwo = async () => {
  // hide both local and pennsieve sections
  let pennsieveSection = document.querySelector("#pennsieve-question-2-container");

  pennsieveSection.style = "display: none !important;";

  let localSection = document.querySelector("#validate_dataset-question-1-local-container");
  localSection.style = "display: none !important";

  // allow time for the check box to get checked
  await wait(300);

  // check if the local validation option has been checked
  let localDatasetCard = document.querySelector("#validate-1-Local");
  let validatingLocalDataset = localDatasetCard.checked;
  console.lod("validatingLocalDataset: ", validatingLocalDataset);
  console.log("local dataset card: ", localDatasetCard);

  // perform the transition for a local dataset
  if (validatingLocalDataset) {
    // show local section
    localSection.style = "display: flex;";

    // show the confirm button if it was hidden
    let confirmDatasetBtn = document.querySelector("#validator-confirm-local-dataset-btn");

    confirmDatasetBtn.parentElement.style.display = "none";

    // hide the confirm dataset btn -- it will appear after the user selects a local folder
    // confirmDatasetBtn.style.display = "none"

    // confirm that the input holding the local dataset path's placeholder is reset
    let input = document.querySelector("#validate-local-dataset-path");
    input.setAttribute("placeholder", "Browse here");
    input.value = "";
  } else {
    // hide the local dataset section
    localSection.style = "display: none !important;";

    // transition for pennsieve dataset
    pennsieveSection.style = "display: flex;";

    // show the pennsieve track's confirm button
    document.querySelector("#confirm-dataset-selection--validator").style.visibility = "visible";
  }

  return true;
};

// Presentation logic for transitioning from question 2 to question 3
const transitionToValidateQuestionThree = async () => {
  let userWantsToReset = await userWantsToResetValidation();

  if (userWantsToReset === false) return userWantsToReset;

  // hide the confirm buttons
  let confirmDatasetBtn = document.querySelector("#validator-confirm-local-dataset-btn");

  // set the field display property to none to remove the margins
  confirmDatasetBtn.parentElement.style.display = "none";

  return true;
};

// check the local dataset input
document.querySelector("#validate_dataset-1-local").addEventListener("click", async (e) => {
  // if there is validation work done check if the user wants to reset progress
  let userWantsToReset = await userWantsToResetValidation();
  if (!userWantsToReset) {
    // deselect local option card and reselect pennsieve option card
    undoOptionCardSelection(this);
    // user does not want to reset
    return;
  }

  // reset validation table
  clearValidationResults();

  // transition to the next question - uses transitionToValidateQuestionTwo
  transitionFreeFormMode(
    document.querySelector("#validate_dataset-1-local"),
    "validate_dataset-question-1",
    "validate_dataset-tab",
    "",
    "individual-question "
  );

  // check the input
  document.querySelector("#validate-1-Local").checked = true;

  document.querySelector("#validate-1-Pennsieve").checked = false;
});

// check the pennsieve dataset input
document
  .querySelector("#validate_dataset-1-pennsieve")
  .addEventListener("click", async function () {
    // if there is validation work done check if the user wants to reset progress
    let userWantsToReset = await userWantsToResetValidation();
    if (!userWantsToReset) {
      undoOptionCardSelection(this);
      // user does not want to reset
      return;
    }

    // reset validation table
    clearValidationResults();

    // move to next question
    transitionFreeFormMode(
      this,
      "validate_dataset-question-1",
      "validate_dataset-tab",
      "",
      "individual-question"
    );

    // check the input
    document.querySelector("#validate-1-Pennsieve").checked = true;

    // uncheck the other card's input
    document.querySelector("#validate-1-Local").checked = false;
  });

// open folder selection dialog so the user can choose which local dataset they would like to validate
// also handles a user selecting a dataset when there are already validation results on the screen
document.querySelector("#validate-local-dataset-path").addEventListener("click", async (evt) => {
  let validationResults = getValidationResultsCount();
  if (validationResults > 0) {
    // if there is validation work done check if the user wants to reset progress
    let userWantsToReset = await userWantsToResetValidation();
    if (!userWantsToReset) {
      // user does not want to reset
      return;
    }

    // reset validation table
    clearValidationResults();

    // clear the input value
    this.value = "";

    // hide the next section
    let questionThreeSection = document.querySelector("#validate_dataset-question-3");
    questionThreeSection.classList.remove("show");
    questionThreeSection.classList.remove("prev");

    // hide the run validator button
    document.querySelector("#validate_dataset-question-4").classList.remove("show");

    // show the confirm button
    let confirmDatasetBtn = document.querySelector("#validator-confirm-local-dataset-btn");
    confirmDatasetBtn.parentElement.style.display = "flex";
  } else {
    // hide question 3
    document.querySelector("#validate_dataset-question-3").style.visibility = "hidden";

    // show confirm button found under the input
    let confirmDatasetBtn = document.querySelector("#validator-confirm-local-dataset-btn");

    // set the field display property to none to remove the field margings
    confirmDatasetBtn.parentElement.style.display = "flex";
  }

  // open folder select dialog
  ipcRenderer.send("open-folder-dialog-validate-local-dataset");

  // listen for user's folder path
  ipcRenderer.on("selected-validate-local-dataset", (evtSender, folderPaths) => {
    // check if a folder was not selected
    if (!folderPaths.length) return;

    // get the folder path
    let folderPath = folderPaths[0];

    // get the clicked input
    let validationPathInput = evt.target;

    // set the input's placeholder value to the local dataset path
    validationPathInput.value = folderPath;
  });
});

document
  .querySelector("#validator-confirm-local-dataset-btn")
  .addEventListener("click", async function () {
    // transition to question 4
    transitionFreeFormMode(
      this,
      "validate_dataset-question-2",
      "validate_dataset-tab",
      "",
      "individual-question validate_dataset"
    );

    // set question 3's visibility to visible
    document.querySelector("#validate_dataset-question-3").style.visibility = "visible";
  });

// start dataset validation
document.querySelector("#run_validator_btn").addEventListener("click", async (evt) => {
  // check if validating a local or pennsieve dataset
  let localDatasetCard = document.querySelector("#validate-1-Local");
  let validatingLocalDataset = localDatasetCard.checked;

  if (validatingLocalDataset) {
    await validateLocalDataset();
  } else {
    await validatePennsieveDataset();
  }
});

document
  .querySelector("#confirm-dataset-selection--validator")
  .addEventListener("click", function () {
    // hide the confirm button
    this.style.visibility = "hidden";

    // transition to the next question
    transitionFreeFormMode(
      this,
      "validate_dataset-question-2",
      "validate_dataset-tab",
      "",
      "individual-question validate_dataset"
    );
  });

// observer for the selected dataset label in the dataset selection card in question 2
const questionTwoDatasetSelectionObserver = new MutationObserver(() => {
  if ($("#bf_dataset_load_validator").text().trim() !== "None") {
    $("#div-check-bf-import-validator").css("display", "flex");
    $($("#div-check-bf-import-validator").children()[0]).show();
  } else {
    $("#div-check-bf-import-validator").css("display", "none");
  }
});

// begin observing the dataset label inn question 2
questionTwoDatasetSelectionObserver.observe(document.querySelector("#bf_dataset_load_validator"), {
  childList: true,
});

document
  .querySelector("#select-dataset-container--validator")
  .addEventListener("click", async () => {
    // check for validation results
    if (getValidationResultsCount() > 0) {
      let reset = await userWantsToResetValidation();
      if (!reset) {
        return;
      }

      clearValidationResults();

      // hide question 3
      let questionThreeSection = document.querySelector("#validate_dataset-question-3");
      questionThreeSection.classList.remove("show");
      questionThreeSection.classList.remove("prev");

      // hide question 4
      document.querySelector("#validate_dataset-question-4").classList.remove("show");
    }

    openDropdownPrompt(null, "dataset");
  });

// verifies if the user wants to reset any current validation table results to run the validator on a different validation track
// (local vs pennsieve) or to choose another dataset to validate
const userWantsToResetValidation = async () => {
  // get validation table body
  let validationErrorsTable = document.querySelector("#validation-errors-container tbody");

  // check if there are any validation results
  if (validationErrorsTable.childElementCount > 0) {
    // ask the user to confirm they want to reset their validation progress
    let resetValidationResult = await Swal.fire({
      icon: "warning",
      text: "This will reset your current validation results. Do you wish to continue?",
      heightAuto: false,
      showCancelButton: true,
      cancelButtonText: "No",
      focusCancel: true,
      confirmButtonText: "Yes",
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // user does not want to reset
    if (!resetValidationResult.isConfirmed) {
      return false;
    }
  }

  // user wants to reset
  return true;
};

// Deselect the active option card and reselect the previously active option card
// Input:
//   targetOptionCard: HTMLElement
const undoOptionCardSelection = (activeOptionCard) => {
  // reactivate the previously active option card
  let previousOptionCard = document.querySelector(
    "#validate_dataset-section .option-card.non-selected"
  );
  previousOptionCard.classList.remove("non-selected");
  previousOptionCard.classList.add("checked");
  previousOptionCard.querySelector(".folder-checkbox input").checked = true;

  // uncheck the selected option card and set it to a non-selected state
  activeOptionCard.querySelector(".folder-checkbox input").checked = false;
  activeOptionCard.classList.add("non-selected");
  activeOptionCard.classList.remove("checked");
};

const clearValidationResults = () => {
  // get validation table body
  let validationErrorsTable = document.querySelector("#validation-errors-container tbody");

  // remove its children
  while (validationErrorsTable.firstChild) {
    validationErrorsTable.removeChild(validationErrorsTable.firstChild);
  }
};

const getValidationResultsCount = () => {
  let validationErrorsTable = document.querySelector("#validation-errors-container tbody");

  // check if there are any validation results
  return validationErrorsTable.childElementCount;
};
