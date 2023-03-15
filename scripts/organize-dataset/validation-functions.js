// Purpose: Logic for Organize Dataset Step 7: Validate Dataset
const { v4: uuid } = require("uuid");

// Validate the dataset that has just been organized in Organize Dataset Step 6: Validate Dataset
// TODO: Pennsieve vs local considerations for result parsing and error handling
const validateOrganizedDataset = async () => {
  swal.fire({
    title: "Validating Dataset",
    text: "Please wait while your dataset is validated.",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  let sodaJSONObjCopy = JSON.parse(JSON.stringify(sodaJSONObj));
  formatForDatasetGeneration(sodaJSONObjCopy);

  if (sodaJSONObjCopy["starting-point"]["type"] === "bf") {
    await api.performUserActions(sodaJSONObjCopy);
  }

  let manifestJSONResponse;
  try {
    manifestJSONResponse = await client.post(
      "/skeleton_dataset/manifest_json",
      {
        sodajsonobject: sodaJSONObjCopy,
      },
      {
        timeout: 0,
      }
    );
  } catch (error) {
    clientError(error);
    await Swal.fire({
      title: "Could not validate your dataset.",
      message: `SODA has encountered the following problem: ${userErrorMessage(error)}`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: hasValidationErrors ? "error" : "success",
    });
    return;
  }

  let manifestsJSON = manifestJSONResponse.data;

  console.log(manifestsJSON);

  let metadataJSONResponse;
  try {
    metadataJSONResponse = await client.post(
      "/skeleton_dataset/metadata_json",
      {
        sodajsonobject: sodaJSONObjCopy,
      },
      {
        timeout: 0,
      }
    );
  } catch (error) {
    clientError(error);
    await Swal.fire({
      title: "Could not validate your dataset.",
      message: `SODA has encountered the following problem: ${userErrorMessage(error)}`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: hasValidationErrors ? "error" : "success",
    });
    return;
  }

  console.log("Here");

  let metadataJSON = metadataJSONResponse.data;

  const clientUUID = uuid();


  // intervale that runs every 15 seconds
  let validationReportResponse;

  try {
    validationReportResponse = await client.post(
      "http://localhost:9009/validator/validate",
      {
        clientUUID: clientUUID,
        manifests: manifestsJSON,
        metadata_files: metadataJSON,
        dataset_structure: sodaJSONObjCopy,
      }
    );
  } catch (e) {
    clientError(e);
    await Swal.fire({
      title: "Could not validate your dataset",
      text: `Please try again.`,
      allowEscapeKey: true,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      icon: "error",
    });
  }

  let report = validationReportResponse.data;


  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(report).length >= 1;

  await Swal.fire({
    title: hasValidationErrors ? "Dataset is Invalid" : `Dataset is Valid`,
    text: hasValidationErrors
      ? `Please fix the errors listed in the table below.
                That your dataset passes validation before it is shared with the SPARC Curation Consortium is highly encouraged.`
      : `Your dataset conforms to the SPARC Dataset Structure. Continue to the next step to upload your dataset.`,
    allowEscapeKey: true,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
    icon: hasValidationErrors ? "error" : "success",
  });

  // list the results in a table ( ideally the one used in the validate feature )
  if (!validationErrorsOccurred(report)) {
    return;
  }

  // get validation table body
  let validationErrorsTable = document.querySelector("#organize--table-validation-errors tbody");

  clearValidationResults(validationErrorsTable);

  // display errors onto the page
  displayValidationErrors(
    report,
    document.querySelector("#organize--table-validation-errors tbody")
  );

  // show the validation errors to the user
  document.querySelector("#organize--table-validation-errors").style.visibility = "visible";

  // scroll so that the table is in the viewport
  document
    .querySelector("#organize--table-validation-errors")
    .scrollIntoView({ behavior: "smooth" });
};

const validateOrganizedDatasetBase = async () => {
  swal.fire({
    title: "Validating Dataset",
    text: "Please wait while your dataset is validated.",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  let sodaJSONObjCopy = JSON.parse(JSON.stringify(sodaJSONObj));
  formatForDatasetGeneration(sodaJSONObjCopy);

  if (sodaJSONObjCopy["starting-point"]["type"] === "bf") {
    await api.performUserActions(sodaJSONObjCopy);
  }

  // create a dataset skeleton
  let skeletonDatasetPath = await api.createSkeletonDataset(sodaJSONObj);

  // call the local validation backend function
  let validationReport = await api.validateLocalDataset(skeletonDatasetPath);

  let report = validationReport;

  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(report).length >= 1;

  await Swal.fire({
    title: hasValidationErrors ? "Dataset is Invalid" : `Dataset is Valid`,
    text: hasValidationErrors
      ? `Please fix the errors listed in the table below.
               That your dataset passes validation before it is shared with the SPARC Curation Consortium is highly encouraged.`
      : `Your dataset conforms to the SPARC Dataset Structure. Continue to the next step to upload your dataset.`,
    allowEscapeKey: true,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
    icon: hasValidationErrors ? "error" : "success",
  });

  // list the results in a table ( ideally the one used in the validate feature )
  if (!validationErrorsOccurred(report)) {
    return;
  }

  // get validation table body
  let validationErrorsTable = document.querySelector("#organize--table-validation-errors tbody");

  clearValidationResults(validationErrorsTable);

  // display errors onto the page
  displayValidationErrors(
    report,
    document.querySelector("#organize--table-validation-errors tbody")
  );

  // show the validation errors to the user
  document.querySelector("#organize--table-validation-errors").style.visibility = "visible";

  // scroll so that the table is in the viewport
  document
    .querySelector("#organize--table-validation-errors")
    .scrollIntoView({ behavior: "smooth" });
};

/**
 *
 * @returns {Promise} Validation report object
 */
const validatePennsieveDataset = async () => {
  sodaJSONObj = {
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

  sodaJSONObj["bf-account-selected"]["account-name"] = $("#current-bf-account").text();
  sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $("#current-bf-dataset").text();

  // import the dataset from Pennsieve
  // TODO: Explicityly set the sodaJSONObj?
  let datasetPopulationResponse = await bf_request_and_populate_dataset(sodaJSONObj);

  sodaJSONObj = datasetPopulationResponse.soda_object;

  console.log(sodaJSONObj);

  // create a dataset skeleton
  let skeletonDatasetPath = await api.createSkeletonDataset(sodaJSONObj);

  // call the local validation backend function
  let validationReport = await api.validateLocalDataset(skeletonDatasetPath);

  return validationReport;
};

const displayValidationReportErrors = (validationReport, tableBody, validationErrorsContainer) => {
  // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  let hasValidationErrors = Object.getOwnPropertyNames(validationReport).length >= 1;

  Swal.fire({
    title: hasValidationErrors ? "Dataset is Invalid" : `Dataset is Valid`,
    text: hasValidationErrors
      ? `Please fix the errors listed in the table below to pass validation.`
      : `Your dataset conforms to the SPARC Dataset Structure.`,
    allowEscapeKey: true,
    allowOutsideClick: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    showConfirmButton: true,
    icon: hasValidationErrors ? "error" : "success",
  });

  // check if there are validation errors
  if (!validationErrorsOccurred(validationReport)) {
    return;
  }

  // display errors onto the page
  displayValidationErrors(validationReport, tableBody);

  // show the validation errors to the user
  validationErrorsContainer.style.visibility = "visible";
};

// {
//   if (dataset_destination == "Pennsieve" && "bf" === sodaJSONObjCopy["starting-point"]["type"]) {
//   }

//   let errorMessage = await checkEmptyFilesAndFolders(sodaJSONObjCopy);

//   if (errorMessage) {
//     Swal.fire({
//       icon: "error",
//       title: "Empty Files or Folders Detected",
//       text: "Cannot validate a dataset with empty files or folders.",
//       confirmButtonText: "Ok",
//       backdrop: "rgba(0,0,0, 0.4)",
//       reverseButtons: reverseSwalButtons,
//       heightAuto: false,
//       showClass: {
//         popup: "animate__animated animate__zoomIn animate__faster",
//       },
//       hideClass: {
//         popup: "animate__animated animate__zoomOut animate__faster",
//       },
//     });
//   }

//   return sodaJSONObjCopy;
// }

/**
 * @param {Object} sodaJSONObj - The global soda json object or a copy of it
 *
 * Formats the soda json object based off the user state in the Organize Datasets workflow.
 * Once formatted, it can be used for generating a dataset in the /curate or /skeleton_dataset endpoint.
 */
const formatForDatasetGeneration = (sodaJSONObj) => {
  // update the copy of the json structure to get its state post generation initialization
  console.log("here");
  updateJSONStructureGenerate(false, sodaJSONObj);
  console.log("test");
  setSodaJSONStartingPoint(sodaJSONObj);
};
