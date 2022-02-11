// Purpose: The front end logic for the Validate Dataset section

const {
  handleAxiosValidationErrors,
} = require("./scripts/validator/axios-validator-utility.js");

// check the local dataset input
document
  .querySelector("#validate_dataset-1-local")
  .addEventListener("click", () => {
    console.log("Event emitted");
    // check the input
    document.querySelector("#validate-1-Local").checked = true;

    document.querySelector("#validate-1-Pennsieve").checked = false;
  });

// check the pennsieve dataset input
document
  .querySelector("#validate_dataset-1-pennsieve")
  .addEventListener("click", () => {
    console.log("Event emitted");
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
    // grab the local dataset path from the input's placeholder attribute
    let datasetPath = document.querySelector(
      "#validate-local-dataset-path"
    ).value;

    const axiosInstance = axios.create({
      baseURL: "http://127.0.0.1:5000/",
      timeout: 0,
    });

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
      validationResponse = await axiosInstance(
        `api_validate_dataset_pipeline?dataset-path=${datasetPath}`
      );
    } catch (err) {
      // hide the validation errors table
      document.querySelector("#validation-errors-container").style.visiility =
        "hidden";

      // display message to user
      return handleAxiosValidationErrors(err);
    }
    let validationErrors = validationResponse.data;

    Swal.fire({
      title: `Your dataset has been successfully validated`,
      text: validationErrors.length
        ? `Your dataset has been found to violate SPARC Guidelines. Please view the table below to see what is non-conforming so that you may fix it.`
        : `Your dataset is valid according to SPAR guidelines.`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
    });

    if (!validationErrors.length) return;

    // for now place all of the errors into the page
    displayValidationErrors(validationErrors);

    // show the validation errors table
    document.querySelector("#validation-errors-container").style.visiility =
      "visible";
  });

const displayValidationErrors = (errors) => {
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
};

/*
*******************************************************************************************************************
// Presentation logic regarding transitioning from one question to another and/or resetting state upon user action 
*******************************************************************************************************************
*/

// as part of the transition from
const transitionToValidateQuestionThree = () => {
  // hide the confirm button
  let confirmDatasetBtn = document.querySelector(
    "#validator-confirm-local-dataset-btn"
  );

  // set the field display property to none to remove the margins
  confirmDatasetBtn.parentElement.style.display = "none";
};

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

  console.log("Validation is: ", validatingLocalDataset);

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
    console.log("Stuff is happening");

    // hide the local dataset section
    localSection.style = "display: none !important;";

    // transition for pennsieve dataset
    pennsieveSection.style = "display: flex;";
  }
};
