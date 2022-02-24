// Purpose: The front end logic for the Validate Dataset section

const {
  handleAxiosValidationErrors,
} = require("./scripts/validator/axios-validator-utility.js");

/*
*******************************************************************************************************************
// Setup for Axios client that talks to the validator 
*******************************************************************************************************************
*/

let axiosValidatorClient;

const waitForAxios = () => {
  if (typeof axios !== "undefined") {
    //variable exists, do what you want
    axiosValidatorClient = axios.create({
      baseURL: "http://127.0.0.1:5001/",
      timeout: 0,
    });
  } else {
    setTimeout(waitForAxios, 1000);
  }
};

waitForAxios();

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
    validationResponse = await axiosValidatorClient(
      `api_validate_dataset_pipeline?dataset-path=${datasetPath}`
    );
  } catch (err) {
    // hide the validation errors table
    document.querySelector("#validation-errors-container").style.visiility =
      "hidden";

    // display message to user
    return handleAxiosValidationErrors(err);
  }

  Swal.fire({
    title: `Your dataset has been successfully validated`,
    text: validationResponse.data.length
      ? `Your dataset has been found to violate SPARC Guidelines. Please view the table below to see what is non-conforming so that you may fix it.`
      : `Your dataset is valid according to SPARC guidelines.`,
    allowEscapeKey: true,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
  });

  if (!validationErrorsOccurred(validationResponse.data)) {
    return;
  }

  // display errors onto the page
  displayValidationErrors(validationResponse.data);

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
    validationResponse = await axiosValidatorClient(
      `/api_validate_pennsieve_dataset?dataset-name=${datasetName}`
    );
  } catch (err) {
    // hide the validation errors table
    document.querySelector("#validation-errors-container").style.visiility =
      "hidden";

    // display error message to user
    return handleAxiosValidationErrors(err);
  }

  Swal.fire({
    title: `Your dataset has been successfully validated`,
    text: validationResponse.data.length
      ? `Your dataset has been found to violate SPARC Guidelines. Please view the table below to see what is non-conforming so that you may fix it.`
      : `Your dataset is valid according to SPARC guidelines.`,
    allowEscapeKey: true,
    allowOutsideClick: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
  });

  // check if there are validation errors
  if (!validationErrorsOccurred(validationResponse.data)) {
    return;
  }

  // display errors onto the page
  displayValidationErrors(validationResponse.data);

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
  console.log(errors);
  // get the table body
  let tableBody = document.querySelector("#validate_dataset-question-4 tbody");

  for (const error of errors) {
    let { message, validator } = error;

    // add message and validator to the display
    addValidationErrorToTable(tableBody, message, validator);
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
    document.createElement("td"),
  ];

  /// add the message to the first td
  let div = document.createElement("div");
  div.style = "width: 354px; overflow-wrap: break-word; text-align: left;";
  div.textContent = errorMessage;
  tableDataList[0].appendChild(div);

  // add the validator statement to the second td
  tableDataList[1].textContent = validatorStatement;

  // add a dummy link to the last td
  tableDataList[2].textContent = "Dummy Link";

  // add table data to the row
  row.appendChild(tableDataList[0]);
  row.appendChild(tableDataList[1]);
  row.appendChild(tableDataList[2]);

  // append the row to the table body
  tableBody.appendChild(row);

  console.log(row);
};

const validationErrorsOccurred = (validationResult) =>
  validationResult.length ? true : false;

/*
*******************************************************************************************************************
// Presentation logic regarding transitioning from one question to another and/or resetting state upon user action 
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

    // show the confirm button if it was hidden
    let confirmDatasetBtn = document.querySelector(
      "#validator-confirm-local-dataset-btn"
    );

    confirmDatasetBtn.parentElement.style.display = "flex";

    // confirm that the input holding the local dataset path's placeholder is reset
    let input = document.querySelector("#validate-local-dataset-path");
    input.setAttribute("placeholder", "Browse here");
    input.value = "";
  } else {
    // hide the local dataset section
    localSection.style = "display: none !important;";

    // transition for pennsieve dataset
    pennsieveSection.style = "display: flex;";
  }

  return true;
};

// Presentation logic for transitioning from question 2 to question 3
const transitionToValidateQuestionThree = async () => {
  let userWantsToReset = await userWantsToResetValidation();

  if (userWantsToReset === false) return userWantsToReset;

  // hide the confirm button
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

    // check the input
    document.querySelector("#validate-1-Pennsieve").checked = true;

    // uncheck the other card's input
    document.querySelector("#validate-1-Local").checked = false;
  });

// open folder selection dialog so the user can choose which local dataset they would like to validate
document
  .querySelector("#validate-local-dataset-path")
  .addEventListener("click", async (evt) => {
    // check if the validator error results table is visible
    let validatorErrors = document.querySelectorAll(
      "#validate_dataset-question-4 tbody tr"
    );

    if (validatorErrors.length) {
      let userReply = await Swal.fire({
        title: `This will clear your dataset validation results. Are you sure you want to continue?`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
      });

      // user doesn't want to clear their results and reset
      if (!userReply) {
        return;
      }

      // hide question 3
      document.querySelector("#validate_dataset-question-3").style.visibility =
        "hidden";

      // show confirm button found under the input
      let confirmDatasetBtn = document.querySelector(
        "#validator-confirm-local-dataset-btn"
      );

      // set the field display property to none to remove the field margings
      confirmDatasetBtn.parentElement.style.display = "block";
    }

    // open folder select dialog
    ipcRenderer.send("open-folder-dialog-validate-local-dataset");

    // listen for user's folder path
    ipcRenderer.on(
      "selected-validate-local-dataset",
      (evtSender, folderPaths) => {
        // check if a folder was not selected
        if (!folderPaths.length) return;

        // get the folder path
        let folderPath = folderPaths[0];

        // get the clicked input
        let validationPathInput = evt.target;

        // set the input's placeholder value to the local dataset path
        validationPathInput.value = folderPath;
      }
    );
  });

// start dataset validation
document
  .querySelector("#run_validator_btn")
  .addEventListener("click", async (evt) => {
    // check if validating a local or pennsieve dataset
    let localDatasetCard = document.querySelector("#validate-1-Local");
    let validatingLocalDataset = localDatasetCard.checked;

    if (validatingLocalDataset) {
      await validateLocalDataset();
    } else {
      await validatePennsieveDataset();
    }
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
questionTwoDatasetSelectionObserver.observe(
  document.querySelector("#bf_dataset_load_validator"),
  { childList: true }
);

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
