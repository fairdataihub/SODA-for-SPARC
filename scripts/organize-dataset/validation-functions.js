// Purpose: Logic for Organize Dataset Step 7: Validate Dataset
const { v4: uuid } = require("uuid");

// Validate the dataset that has just been organized in Organize Dataset Step 6: Validate Dataset
// TODO: Pennsieve vs local considerations for result parsing and error handling
const validateOrganizedDataset = async () => {
  let validationErrorsTable = document.querySelector("#organize--table-validation-errors tbody");

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
      return;
    }

    // get validation table body
    clearValidationResults(validationErrorsTable);
  }

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

  // if the user performed move, rename, delete on files in an imported dataset we need to perform those actions before creating the validation report;
  // rationale for this can be found in the function definition
  if (sodaJSONObjCopy["starting-point"]["type"] === "bf") {
    await api.performUserActions(sodaJSONObjCopy);
  }

  let validationReport;
  try {
    validationReport = await createValidationReport(sodaJSONObjCopy);
  } catch (error) {
    clientError(error);
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

  let SODADirectory = path.join(os.homedir(), "SODA");
  let validationReportPath = path.join(SODADirectory, "validation.txt");
  let fullReport = validationReport.full_report;
  fs.writeFileSync(validationReportPath, fullReport);

  if (validationReport.status === "Incomplete") {
    // An incomplete validation report happens when the validator is unable to generate
    // a path_error_report upon validating the selected dataset.
    let viewReportResult = await Swal.fire({
      title: "Could Not Generate a Sanitized Validation Report",
      html: `If you repeatedly have this issue please contact the SPARC Curation Team for support at curation@sparc.science. Would you like to view your raw validation report?`,
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

  // write the full report to the ~/SODA/validation.txt file
  let report = validationReport.parsed_report;

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

document.querySelector(".validate-raw-report_btn").addEventListener("click", (e) => {
  console.log("Clicked on raw report button");
  // open the text file stored at the raw validation report path
  let pathToRawReport = path.join(os.homedir(), "SODA", "validation.txt");

  shell.openPath(pathToRawReport);
});

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
