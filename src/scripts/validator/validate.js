// Purpose: The front end logic for the Validate Dataset section
const {
  handleAxiosValidationErrors,
} = require("./scripts/validator/axios-validator-utility.js");

const {
  translatePipelineError,
} = require("./scripts/validator/parse-pipeline-errors.js");

/*
*******************************************************************************************************************
// Logic for talking to the validator
*******************************************************************************************************************
*/

const validateLocalDataset = async () => {
  // grab the local dataset path from the input's placeholder attribute
  let datasetPath = document.querySelector(
    "#validate-local-dataset-path"
  ).value;

  Swal.fire({
    title: `Validating your dataset`,
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  let validationResponse;
  try {
    // send the dataset path to the validator endpoint
    validationResponse = await client.get(
      `validator/local_dataset_validation_result`,
      {
        params: {
          path: datasetPath,
        },
      }
    );

    // track that a local validation succeeded
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Validate your dataset - Local",
      "Local Validation",
      1
    );

    // track that a validation (local or pennsieve) succeeded
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Validate your dataset",
      "Dataset Validation",
      1
    );
  } catch (err) {
    // hide the validation errors table
    document.querySelector("#validation-errors-container").style.visiility =
      "hidden";

    // display message to user
    handleAxiosValidationErrors(err);

    // reset the input field to 'Browse Here'
    let datasetLocationInput = document.querySelector(
      "#validate-local-dataset-path"
    );

    datasetLocationInput.value = "";

    // track that a local validation failed
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Validate your dataset - Local",
      "Local Validation",
      1
    );

    // track that a validation (local or pennsieve) failed to help with aggregating total dataset validation failures
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Validate your dataset",
      "Dataset Validation",
      1
    );

    return;
  }

  let errors = validationResponse.data;

  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(errors).length >= 1;

  Swal.fire({
    title: hasValidationErrors
      ? "Your dataset has validation errors"
      : `Your dataset has been successfully validated`,
    text: hasValidationErrors
      ? `Your dataset has been found to violate SPARC Guidelines. Please view the Validation Errors table to see what is non-conforming so that you may fix it.`
      : ``,
    allowEscapeKey: true,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
    icon: hasValidationErrors ? "error" : "success",
  });

  if (!validationErrorsOccurred(errors)) {
    return;
  }

  // display errors onto the page
  displayValidationErrors(errors);

  // show the validation errors to the user
  document.querySelector("#validation-errors-container").style.visibility =
    "visible";
};

const validatePennsieveDataset = async () => {
  // get the dataset name from the dataset selection card
  let datasetName = document.querySelector(
    "#bf_dataset_load_validator"
  ).textContent;

  Swal.fire({
    title: `Validating your dataset`,
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  let validationResponse;

  try {
    // request validation for the current pennsieve dataset
    validationResponse = await client.get(
      `validator/pennsieve_dataset_validation_result`,
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: defaultBfDatasetId,
        },
      }
    );

    // track that a local validation succeeded
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Validate your dataset - Pennsieve",
      "Pennsieve Validation",
      1
    );

    // track that a validation (local or pennsieve) succeeded
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Validate your dataset",
      "Dataset Validation",
      1
    );
  } catch (err) {
    // hide the validation errors table
    document.querySelector("#validation-errors-container").style.visiility =
      "hidden";

    // track that a local validation succeeded
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Validate your dataset - Pennsieve",
      "Pennsieve Validation",
      1
    );

    // track that a validation (local or pennsieve) succeeded
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Validate your dataset",
      "Dataset Validation",
      1
    );

    // display error message to user
    return handleAxiosValidationErrors(err);
  }

  let errors = validationResponse.data;

  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(errors).length >= 1;

  Swal.fire({
    title: hasValidationErrors
      ? "Your dataset has validation errors"
      : `Your dataset has been successfully validated`,
    text: hasValidationErrors
      ? `Your dataset has been found to violate SPARC Guidelines. Please view the Validation Errors table to see what is non-conforming so that you may fix it.`
      : ``,
    allowEscapeKey: true,
    allowOutsideClick: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
    icon: hasValidationErrors ? "error" : "success",
  });

  // check if there are validation errors
  if (!validationErrorsOccurred(errors)) {
    return;
  }

  // display errors onto the page
  displayValidationErrors(errors);

  // show the validation errors to the user
  document.querySelector("#validation-errors-container").style.visibility =
    "visible";
};

/*
*******************************************************************************************************************
// Displaying validation errors
*******************************************************************************************************************
*/

const displayValidationErrors = (errors) => {
  // get the table body
  let tableBody = document.querySelector("#validate_dataset-question-4 tbody");

  for (const [key, value] of Object.entries(errors)) {
    let error = {
      path: key,
      error: value,
    };

    const { messages } = error.error;

    // some errors have multiple error messages
    for (const message of messages) {
      // get back a user friendly error message using the path and the message text
      // let translatedMessage = translatePipelineError(error.path, message);

      // add message and validator to the display
      addValidationErrorToTable(tableBody, error.path, message);
    }
  }
};

// adds a single validation error to the errors display
const addValidationErrorToTable = (
  tableBody,
  errorMessage,
  validatorStatement
) => {
  // create a row
  let row = document.createElement("tr");

  // create three table data elements
  let tableDataList = [
    document.createElement("td"),
    document.createElement("td"),
    // document.createElement("td"),
  ];

  /// add the message to the first td
  let pathDiv = document.createElement("div");
  pathDiv.style = "width: 200px; overflow-wrap: break-word; text-align: left;";
  pathDiv.textContent = errorMessage;
  tableDataList[0].appendChild(pathDiv);

  // add the validator statement to the second td
  let messageDiv = document.createElement("div");
  messageDiv.style =
    "width: 250px; overflow-wrap: break-word; text-align: left;";
  messageDiv.textContent = validatorStatement;
  tableDataList[1].appendChild(messageDiv);

  // add a dummy link to the last td
  // tableDataList[2].textContent = "Dummy Link";

  // add table data to the row
  row.appendChild(tableDataList[0]);
  row.appendChild(tableDataList[1]);
  // row.appendChild(tableDataList[2]);

  // append the row to the table body
  tableBody.appendChild(row);
};

const validationErrorsOccurred = (errors) =>
  Object.getOwnPropertyNames(errors).length >= 1 ? true : false;

/*
*******************************************************************************************************************
// Purpose: Presentation logic regarding transitioning from one question to another and/or resetting state upon user action in the validator
*******************************************************************************************************************
*/

// Presentation logic for transitioning from question one to question two
const transitionToValidateQuestionTwo = async () => {
  // hide both local and pennsieve sections
  let pennsieveSection = document.querySelector(
    "#pennsieve-question-2-container"
  );

  pennsieveSection.style = "display: none !important;";

  let localSection = document.querySelector(
    "#validate_dataset-question-1-local-container"
  );
  localSection.style = "display: none !important";

  // allow time for the check box to get checked
  await wait(300);

  // check if the local validation option has been checked
  let localDatasetCard = document.querySelector("#validate-1-Local");
  let validatingLocalDataset = localDatasetCard.checked;

  // perform the transition for a local dataset
  if (validatingLocalDataset) {
    // show local section
    localSection.style = "display: flex;";

    // hide the confirm button
    hideConfirmButton();

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
    document.querySelector(
      "#confirm-dataset-selection--validator"
    ).style.visibility = "visible";
  }

  return true;
};

// Presentation logic for transitioning from question 2 to question 3
const transitionToValidateQuestionThree = async () => {
  let userWantsToReset = await userWantsToResetValidation();

  if (userWantsToReset === false) return userWantsToReset;

  // hide the confirm buttons
  let confirmDatasetBtn = document.querySelector(
    "#validator-confirm-local-dataset-btn"
  );

  // set the field display property to none to remove the margins
  confirmDatasetBtn.parentElement.style.display = "none";

  return true;
};

// check the local dataset input
document
  .querySelector("#validate_dataset-1-local")
  .addEventListener("click", async (e) => {
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
document
  .querySelector("#validate-local-dataset-path")
  .addEventListener("click", async (evt) => {
    let validationResults = getValidationResultsCount();
    if (validationResults > 0) {
      // if there is validation work done check if the user wants to reset progress
      let userWantsToReset = await userWantsToResetValidation();
      if (!userWantsToReset) {
        // user does not want to reset
        return;
      }

      // set the ccurrent section to active by removing prev
      document
        .querySelector("#validate_dataset-question-2")
        .classList.remove("prev");

      // reset validation table
      clearValidationResults();

      // clear the input value
      this.value = "";

      // hide the run validator button
      document
        .querySelector("#validate_dataset-question-4")
        .classList.remove("show");

      // hide the next section
      let questionThreeSection = document.querySelector(
        "#validate_dataset-question-3"
      );
      questionThreeSection.classList.remove("show");
      questionThreeSection.classList.remove("prev");
    }

    // open folder select dialog
    ipcRenderer.send("open-folder-dialog-validate-local-dataset");

    // listen for user's folder path
    ipcRenderer.on(
      "selected-validate-local-dataset",
      async (evtSender, folderPaths) => {
        // check if a folder was not selected
        if (!folderPaths.length) {
          return;
        }

        // remove prev from the question's class list
        document
          .querySelector("#validate_dataset-question-2")
          .classList.remove("prev");

        // get the folder path
        let folderPath = folderPaths[0];

        // get the clicked input
        let validationPathInput = evt.target;

        // set the input's placeholder value to the local dataset path
        validationPathInput.value = folderPath;

        hideQuestionThreeLocal();

        showConfirmButton();
      }
    );
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

    showQuestionThreeLocal();
  });

// start dataset validation
document
  .querySelector("#run_validator_btn")
  .addEventListener("click", async function (evt) {
    // check if validating a local or pennsieve dataset
    let localDatasetCard = document.querySelector("#validate-1-Local");
    let validatingLocalDataset = localDatasetCard.checked;

    // hide the run validator button
    hideQuestionThreeLocal();

    if (validatingLocalDataset) {
      await validateLocalDataset();

      scrollToElement("#validation-errors-container");
    } else {
      await validatePennsieveDataset();
    }
  });

document
  .querySelector("#confirm-dataset-selection--validator")
  .addEventListener("click", function () {
    hideConfirmButton();

    // transition to the next question
    transitionFreeFormMode(
      this,
      "validate_dataset-question-2",
      "validate_dataset-tab",
      "",
      "individual-question validate_dataset"
    );
  });

document
  .querySelector("#scicrunch button")
  .addEventListener("click", async function () {
    // get the api key from the first of two inputs field nested in the scicrunch div
    let apiKey = document.querySelector("#scicrunch input").value;

    // get the api key name from the last input element  nested in the scicrunch div
    let apiKeyName = document.querySelector(
      "#scicrunch input:last-of-type"
    ).value;

    // send the api key and api key name as params to the server using the endpoint /validator/scicrunch [ use the axios client stored in variable 'client']
    let response;
    try {
      response = await client.post("/validator/scicrunch_config", {
        api_key: apiKey,
        api_key_name: apiKeyName,
        selected_account: defaultBfAccount,
      });
    } catch (error) {
      clientError(error);
      await Swal.fire({
        title: "Error",
        text: "There was an error adding your scicrunch api key. Pleas try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }

    console.log("Congrats that worked!");
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

// begin observing the dataset label in question 2
questionTwoDatasetSelectionObserver.observe(
  document.querySelector("#bf_dataset_load_validator"),
  { childList: true }
);

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
      let questionThreeSection = document.querySelector(
        "#validate_dataset-question-3"
      );
      questionThreeSection.classList.remove("show");
      questionThreeSection.classList.remove("prev");

      // hide question 4
      document
        .querySelector("#validate_dataset-question-4")
        .classList.remove("show");
    }

    openDropdownPrompt(null, "dataset");
  });

// verifies if the user wants to reset any current validation table results to run the validator on a different validation track
// (local vs pennsieve) or to choose another dataset to validate
const userWantsToResetValidation = async () => {
  // get validation table body
  let validationErrorsTable = document.querySelector(
    "#validation-errors-container tbody"
  );

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
  let validationErrorsTable = document.querySelector(
    "#validation-errors-container tbody"
  );

  // remove its children
  while (validationErrorsTable.firstChild) {
    validationErrorsTable.removeChild(validationErrorsTable.firstChild);
  }
};

const getValidationResultsCount = () => {
  let validationErrorsTable = document.querySelector(
    "#validation-errors-container tbody"
  );

  // check if there are any validation results
  return validationErrorsTable.childElementCount;
};

// TODO: Make it differentiate between local and pennsieve confirm buttons
const showConfirmButton = () => {
  // show the confirm button
  let confirmDatasetBtn = document.querySelector(
    "#validator-confirm-local-dataset-btn"
  );
  confirmDatasetBtn.parentElement.style.display = "flex";
};

// TODO: Make it differentiate between local and pennsieve confirm buttons
const hideConfirmButton = () => {
  // hide the confirm button
  let confirmDatasetBtn = document.querySelector(
    "#validator-confirm-local-dataset-btn"
  );
  confirmDatasetBtn.parentElement.style.display = "none";
};

const showQuestionThreeLocal = () => {
  // set question 3's visibility to visible
  document.querySelector("#validate_dataset-question-3").style.display = "flex";
};

const hideQuestionThreeLocal = () => {
  // set question 3's visibility to none
  document.querySelector("#validate_dataset-question-3").style.display = "none";
};

const setCurationTeamAsManagers = async () => {

  var selectedTeam = "SPARC Data Curation Team";
  var selectedRole = "manager";

  try {
    await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: defaultBfDataset,
          scope: "team",
          name: selectedTeam,
        },
      }
    );
  } catch (error) {
    clientError(error)
  }


  console.log("Curation team has management permissions")
  console.log("The dataset ID to look for is: ", defaultBfDatasetId)
}

const removeCurationTeamAsManagers = async () => {
  var selectedTeam = "SPARC Data Curation Team";
  var selectedRole = "viewer";

  try {
    await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: defaultBfDataset,
          scope: "team",
          name: selectedTeam,
        },
      }
    );
  } catch (error) {
    clientError(error)
  }


  console.log("Curation team does not have management permissions")
  console.log("The dataset ID to look for is: ", defaultBfDatasetId)
}


document.querySelector("#click-me").addEventListener("click", async () => {
  setCurationTeamAsManagers();
})


document.querySelector("#remove-me").addEventListener("click", async () => {
  removeCurationTeamAsManagers();
})