// Purpose: The front end logic for the Validate Dataset section
const { handleAxiosValidationErrors } = require("./scripts/validator/axios-validator-utility.js");

const { translatePipelineError } = require("./scripts/validator/parse-pipeline-errors.js");

/*
*******************************************************************************************************************
// Logic for talking to the validator
*******************************************************************************************************************
*/

const createValidationReport = async (sodaJSONObj) => {
  const clientUUID = uuid();

  let manifestJSONResponse = await client.post(
    "/skeleton_dataset/manifest_json",
    {
      sodajsonobject: sodaJSONObj,
    },
    {
      timeout: 0,
    }
  );

  let manifestFiles = manifestJSONResponse.data;

  let metadataJSONResponse = await client.post(
    "/skeleton_dataset/metadata_json",
    {
      sodajsonobject: sodaJSONObj,
    },
    {
      timeout: 0,
    }
  );

  let metadataFiles = metadataJSONResponse.data;

  console.log("metadataFiles", metadataFiles);
  console.log("manifestFiles", manifestFiles);
  console.log("localSodaJsonObject", sodaJSONObj);
  console.log("clientUUID", clientUUID);

  try {
    await client.post(
      `https://validation.sodaforsparc.io/validator/validate`,
      {
        clientUUID: clientUUID,
        dataset_structure: sodaJSONObj,
        metadata_files: metadataFiles,
        manifests: manifestFiles,
      },
      {
        timeout: 0,
      }
    );
  } catch (error) {
    if (error.response.status == 503 || error.response.status == 502) {
      await Swal.fire({
        title: "Validation Service Unavailable",
        text: "The validation service is currently too busy to validate your dataset. Please try again shortly.",
        icon: "error",
        confirmButtonText: "Ok",
        backdrop: "rgba(0,0,0, 0.4)",
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    }
    return;
  }

  while (true) {
    console.log("Waiting for the validation to complete...");
    await wait(15000);
    let results = await pollForValidationResults(clientUUID);
    if (!results) {
      continue;
    }
    return results;
  }
};

const pollForValidationResults = async (clientUUID) => {
  let validationResultsResponse;
  try {
    validationResultsResponse = await client.get(
      `https://validation.sodaforsparc.io/validator/results/${clientUUID}`
    );
  } catch (error) {
    if (error.response.status == 503 || error.response.status == 502) {
      // at this point their validation results are still being created so wait until they are finished instead of exiting the polling state
      return undefined;
    }
    throw error;
  }
  let results = validationResultsResponse.data;

  if (results.status == "Complete") {
    return results;
  } else if (results.status == "WIP") {
    return undefined;
  } else {
    // validation report failed to be received mark the validation as failed
    throw new Error("Validation failed");
  }
};

const validateLocalDataset = async () => {
  // grab the local dataset path from the input's placeholder attribute
  let datasetPath = document.querySelector("#validate-local-dataset-path").value;

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


  let totalItems;
  try {
   totalItems = await api.getNumberOfItemsInLocalDataset(datasetPath)
  } catch(error) {
    clientError(error);
      await Swal.fire({
        title: "Could not validate your dataset.",
        message: `Could not determine the size of your dataset before validation. Please try again shortly.`,
        allowEscapeKey: true,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
        icon: "error",
      });
      return;
  }

  console.log(totalItems)


  if(totalItems >= 50000) {
    await Swal.fire({
      title: `Dataset Too Large`,
      text: "At the moment we cannot validate a dataset with 50,000 or more files.",
      allowEscapeKey: true,
      allowOutsideClick: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: "error",
    });
    return;
  }

  // setup the sodaJSONObj for the import endpoint
  let localSodaJsonObject = {
    "bf-account-selected": {
      "account-name": {},
    },
    "bf-dataset-selected": {
      "dataset-name": {},
    },
    "dataset-structure": {},
    "metadata-files": {},
    "manifest-files": {},
    "generate-dataset": {},
    "starting-point": {
      type: "local",
      "local-path": datasetPath,
    },
  };

  // get the dataset structure from the dataset location
  let importLocalDatasetResponse;
  try {
    importLocalDatasetResponse = await client.post(
      `/organize_datasets/datasets/import`,
      {
        sodajsonobject: localSodaJsonObject,
        root_folder_path: datasetPath,
        irregular_folders: [],
        replaced: [],
      },
      { timeout: 0 }
    );
  } catch (error) {
    clientError(error);
    await Swal.fire({
      title: "Could not validate your dataset.",
      message: `SODA is unable to import the selected dataset.`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: "error",
    });
    return;
  }

  localSodaJsonObject = importLocalDatasetResponse.data;

  console.log("localSodaJsonObject", localSodaJsonObject);

  let validationReportData;
  try {
    validationReportData = await createValidationReport(localSodaJsonObject);
    if (validationReportData.status === "Error") throw new Error(validationReportData.error);
  } catch (error) {
    clientError(error);
    file_counter = 0;
    folder_counter = 0;
    get_num_files_and_folders(localSodaJsonObject["dataset-structure"]);
    // log successful validation run to analytics
    ipcRenderer.send(
      "track-event",
      "Error",
      "Validation - Number of Files",
      "Number of Files",
      file_counter
    );
    await Swal.fire({
      title: "Failed to Validate Your Dataset",
      text: "Please try again. If this issue persists contect the SODA for SPARC team at help@fairdataihub.org",
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: "error",
    });
    return;
  }

  // write the full report to the ~/SODA/validation.txt file
  let fullReport = validationReportData.full_report;
  let validationReportPath = path.join(os.homedir(), "SODA", "validation.txt");
  fs.writeFileSync(validationReportPath, fullReport);

  let SODADirectory = path.join(os.homedir(), "SODA");

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(localSodaJsonObject["dataset-structure"]);
  // log successful validation run to analytics
  ipcRenderer.send(
    "track-event",
    "Success",
    "Validation - Number of Files",
    "Number of Files",
    file_counter
  );

  if (validationReportData.status == "Incomplete") {
    // An incomplete validation report happens when the validator is unable to generate
    // a path_error_report upon validating the selected dataset.
    let viewReportResult = await Swal.fire({
      title: "Could Not Generate a Sanitized Validation Report",
      html: `If you repeatedly have this issue please contact the SODA for SPARC team at help@fairdataihub.org. Would you like to view your raw validation report?`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    if (viewReportResult.isConfirmed) {
      // open a shell to the raw validation report
      shell.openPath(validationReportPath);
    }
    return;
  }

  // get the parsed error report since the validation has been completed
  let errors = validationReportData.parsed_report;

  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(errors).length >= 1;

  Swal.fire({
    title: hasValidationErrors ? "Dataset is Invalid" : `Dataset is Valid`,
    text: hasValidationErrors
      ? `Please fix the errors listed in the table below then re-run validation to check that your dataset conforms to the SDS.`
      : `Your dataset conforms to the SPARC Dataset Structure.`,
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
  let tbody = document.querySelector("#validation-errors-container tbody");
  displayValidationErrors(errors, tbody);

  // show the validation errors to the user
  document.querySelector("#validation-errors-container").style.visibility = "visible";
};

const validatePennsieveDatasetStandAlone = async () => {
  // get the dataset name from the dataset selection card
  let datasetName = document.querySelector("#bf_dataset_load_validator").textContent;

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

    // check if the dataset exceeds the maximumn size
    let packageTypeCounts;
    try {
      packageTypeCounts = await api.getNumberOfPackagesInDataset(datasetName);
    } catch (err) {
      clientError(err);
      await Swal.fire({
        title: "Could not validate your dataset.",
        message: `Could not determine the size of your dataset before validation. Please try again shortly.`,
        allowEscapeKey: true,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
        icon: "error",
      });
      return;
    }
  
    // count the number of packages in the packgeTypeCounts dictionary
    let packageCount = 0;
    for (let packageType in packageTypeCounts) {
      packageCount += packageTypeCounts[packageType];
    }
  
    if (packageCount >= 50000) {
      await Swal.fire({
        title: `Dataset Too Large`,
        text: "At the moment we cannot validate a dataset with 50,000 or more files.",
        allowEscapeKey: true,
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
        icon: "error",
      });
      return;
    }

  // create a local SODA JSON object to pass to the import endpoint
  let localSodaJSONObj = {
    "bf-account-selected": {
      "account-name": {},
    },
    "bf-dataset-selected": {
      "dataset-name": {},
    },
    "dataset-structure": {},
    "metadata-files": {},
    "manifest-files": {},
    "generate-dataset": {},
    "starting-point": {
      type: "bf",
    },
  };

  localSodaJSONObj["bf-account-selected"]["account-name"] = $("#current-bf-account").text();
  localSodaJSONObj["bf-dataset-selected"]["dataset-name"] = $("#current-bf-dataset").text();

  console.log("About to import the dataset");

  // import the dataset from Pennsieve
  let datasetPopulationResponse;
  try {
    datasetPopulationResponse = await bf_request_and_populate_dataset(localSodaJSONObj);
  } catch (err) {
    clientError(err);
    await Swal.fire({
      title: `Validation Run Failed`,
      text: "Please try again. If this issue persists contect the SODA for SPARC team at help@fairdataihub.org",
      allowEscapeKey: true,
      allowOutsideClick: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: "error",
    });
    return;
  }

  localSodaJSONObj = datasetPopulationResponse.soda_object;

  console.log("Imported the dataset");

  let validationReport;
  try {
    validationReport = await createValidationReport(localSodaJSONObj);
    if (validationReport.status === "Error") throw new Error(validationReport.error);
  } catch (err) {
    clientError(err);
    file_counter = 0;
    folder_counter = 0;
    get_num_files_and_folders(localSodaJSONObj["dataset-structure"]);
    // log successful validation run to analytics
    ipcRenderer.send(
      "track-event",
      "Error",
      "Validation - Number of Files",
      "Number of Files",
      file_counter
    );
    await Swal.fire({
      title: "Failed to Validate Your Dataset",
      text: "Please try again. If this issue persists contect the SODA for SPARC team at help@fairdataihub.org",
      allowEscapeKey: true,
      allowOutsideClick: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: "error",
    });
    return;
  }

  // write the full report to the ~/SODA/validation.txt file
  let fullReport = validationReport.full_report;
  let validationReportPath = path.join(os.homedir(), "SODA", "validation.txt");
  fs.writeFileSync(validationReportPath, fullReport);

  let SODADirectory = path.join(os.homedir(), "SODA");

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(localSodaJSONObj["dataset-structure"]);
  // log successful validation run to analytics
  ipcRenderer.send(
    "track-event",
    "Success",
    "Validation - Number of Files",
    "Number of Files",
    file_counter
  );

  if (validationReport.status === "Incomplete") {
    // An incomplete validation report happens when the validator is unable to generate
    // a path_error_report upon validating the selected dataset.
    let viewReportResult = await Swal.fire({
      title: "Could Not Generate a Sanitized Validation Report",
      html: `If you repeatedly have this issue please contact the SODA for SPARC team at help@fairdataihub.org. Would you like to view your raw validation report?`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    if (viewReportResult.isConfirmed) {
      // open a shell to the raw validation report
      shell.openPath(validationReportPath);
    }
    return;
  }

  // get the parsed error report since the validation has been completed
  let errors = validationReport.parsed_report;

  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(errors).length >= 1;

  Swal.fire({
    title: hasValidationErrors ? "Dataset is Invalid" : `Dataset is Valid`,
    text: hasValidationErrors
      ? `Please fix the errors listed in the table below then re-run validation to check that your dataset conforms to the SDS.`
      : `Your dataset conforms to the SPARC Dataset Structure.`,
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
  let tbody = document.querySelector("#validation-errors-container tbody");
  displayValidationErrors(errors, tbody);

  // show the validation errors to the user
  document.querySelector("#validation-errors-container").style.visibility = "visible";
};

/*
*******************************************************************************************************************
// Displaying validation errors
*******************************************************************************************************************
*/

const displayValidationErrors = (errors, tableBody) => {
  // get the table body
  //let tableBody = document.querySelector("#validate_dataset-question-4 tbody");

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
const addValidationErrorToTable = (tableBody, errorMessage, validatorStatement) => {
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
  messageDiv.style = "width: 250px; overflow-wrap: break-word; text-align: left;";
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
  let pennsieveSection = document.querySelector("#pennsieve-question-2-container");

  pennsieveSection.style = "display: none !important;";

  let localSection = document.querySelector("#validate_dataset-question-1-local-container");
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
    hideConfirmButton("local");

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

  let otherOptionCard = document.querySelector("#validate_dataset-1-pennsieve");
  console.log(otherOptionCard);
  otherOptionCard.classList.add("non-selected");
  otherOptionCard.classList.remove("checked");
  otherOptionCard.querySelector(".folder-checkbox input").checked = false;

  // reset validation table
  let validationErrorsTable = document.querySelector("#validation-errors-container tbody");
  clearValidationResults(validationErrorsTable);

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

    let otherOptionCard = document.querySelector("#validate_dataset-1-local");
    console.log(otherOptionCard);
    otherOptionCard.classList.add("non-selected");
    otherOptionCard.classList.remove("checked");
    otherOptionCard.querySelector(".folder-checkbox input").checked = false;

    // reset validation table
    let validationErrorsTable = document.querySelector("#validation-errors-container tbody");
    clearValidationResults(validationErrorsTable);

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

    // set the ccurrent section to active by removing prev
    document.querySelector("#validate_dataset-question-2").classList.remove("prev");

    let validationErrorsTable = document.querySelector("#validation-errors-container tbody");

    // reset validation table
    clearValidationResults(validationErrorsTable);

    // clear the input value
    this.value = "";

    // hide the run validator button
    document.querySelector("#validate_dataset-question-4").classList.remove("show");

    // hide the next section
    let questionThreeSection = document.querySelector("#validate_dataset-question-3");
    questionThreeSection.classList.remove("show");
    questionThreeSection.classList.remove("prev");
  }

  // open folder select dialog
  ipcRenderer.send("open-folder-dialog-validate-local-dataset");

  // listen for user's folder path
  ipcRenderer.on("selected-validate-local-dataset", async (evtSender, folderPaths) => {
    // check if a folder was not selected
    if (!folderPaths.length) {
      return;
    }

    // remove prev from the question's class list
    document.querySelector("#validate_dataset-question-2").classList.remove("prev");

    // get the folder path
    let folderPath = folderPaths[0];

    // get the clicked input
    let validationPathInput = evt.target;

    // set the input's placeholder value to the local dataset path
    validationPathInput.value = folderPath;

    hideQuestionThreeLocal();

    showConfirmButton();
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

    showQuestionThreeLocal();
  });

// start dataset validation
document.querySelector("#run_validator_btn").addEventListener("click", async function (evt) {
  // check if validating a local or pennsieve dataset
  let localDatasetCard = document.querySelector("#validate-1-Local");
  let validatingLocalDataset = localDatasetCard.checked;

  // hide the run validator button
  // hideQuestionThreeLocal();

  if (getValidationResultsCount() > 0) {
    let reset = await userWantsToResetValidation();
    if (!reset) {
      return;
    }

    // get validation table body
    let validationErrorsTable = document.querySelector("#validation-errors-container tbody");
    clearValidationResults(validationErrorsTable);

    // hide question 3
    // let questionThreeSection = document.querySelector("#validate_dataset-question-3");
    // questionThreeSection.classList.remove("show");
    // questionThreeSection.classList.remove("prev");

    // hide question 4
    // document.querySelector("#validate_dataset-question-4").classList.remove("show");
  }

  if (validatingLocalDataset) {
    await validateLocalDataset();

    scrollToElement("#validation-errors-container");
  } else {
    await validatePennsieveDatasetStandAlone();
  }
});

document
  .querySelector("#confirm-dataset-selection--validator")
  .addEventListener("click", function () {
    hideConfirmButton("pennsieve");

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

// begin observing the dataset label in question 2
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

      // get validation table body
      let validationErrorsTable = document.querySelector("#validation-errors-container tbody");
      clearValidationResults(validationErrorsTable);

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
  console.log(previousOptionCard);
  previousOptionCard.classList.remove("non-selected");
  previousOptionCard.classList.add("checked");
  previousOptionCard.querySelector(".folder-checkbox input").checked = true;

  // uncheck the selected option card and set it to a non-selected state
  activeOptionCard.querySelector(".folder-checkbox input").checked = false;
  activeOptionCard.classList.add("non-selected");
  activeOptionCard.classList.remove("checked");
};

const clearValidationResults = (validationTableElement) => {
  // remove its children
  while (validationTableElement.firstChild) {
    validationTableElement.removeChild(validationTableElement.firstChild);
  }
};

const getValidationResultsCount = () => {
  console.log("CHecking validation results count");
  let validationErrorsTable = document.querySelector("#validation-errors-container tbody");

  // check if there are any validation results
  return validationErrorsTable.childElementCount;
};

// TODO: Make it differentiate between local and pennsieve confirm buttons
const showConfirmButton = () => {
  // show the confirm button
  let confirmDatasetBtn = document.querySelector("#validator-confirm-local-dataset-btn");
  confirmDatasetBtn.parentElement.style.display = "flex";
};

// TODO: Make it differentiate between local and pennsieve confirm buttons
const hideConfirmButton = (mode) => {
  if (mode == "pennsieve") {
    let confirmDatasetBtn = document.querySelector("#confirm-dataset-selection--validator");
    confirmDatasetBtn.parentElement.style.display = "none";
    return;
  }
  // hide the confirm button
  let confirmDatasetBtn = document.querySelector("#validator-confirm-local-dataset-btn");
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
    clientError(error);
  }
};

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
    clientError(error);
  }
};
