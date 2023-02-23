// Purpose: Logic for Organize Dataset Step 7: Validate Dataset

// Validate the dataset that has just been organized in Organize Dataset Step 6: Validate Dataset
// TODO: Pennsieve vs local considerations for result parsing and error handling
const validateOrganizedDataset = async () => {
  console.log("entered");
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

  let metadataJSON = metadataJSONResponse.data;

  console.log(metadataJSON);

  // // call the soda api with the path to the skeleton dataset to validate the dataset
  // let validationResponse;
  // try {
  //   validationResponse = await client.get(
  //     "/validator/local_dataset_validation_result",
  //     {
  //       params: {
  //         path: pathToSkeletonDataset,
  //       },
  //     },
  //     {
  //       timeout: 0,
  //     }
  //   );
  // } catch (error) {
  //   clientError(error);
  //   await Swal.fire({
  //     title: "Could not validate your dataset.",
  //     message: `SODA has encountered the following problem: ${userErrorMessage(error)}`,
  //     allowEscapeKey: true,
  //     allowOutsideClick: false,
  //     heightAuto: false,
  //     backdrop: "rgba(0,0,0, 0.4)",
  //     timerProgressBar: false,
  //     showConfirmButton: true,
  //     icon: hasValidationErrors ? "error" : "success",
  //   });
  // }

  // let errors = validationResponse.data;
  // console.log(errors);

  // // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
  // let hasValidationErrors = Object.getOwnPropertyNames(errors).length >= 1;

  // await Swal.fire({
  //   title: hasValidationErrors ? "Dataset is Invalid" : `Dataset is Valid`,
  //   text: hasValidationErrors
  //     ? `Please fix the errors listed in the table below.
  //              That your dataset passes validation before it is shared with the SPARC Curation Consortium is highly encouraged.`
  //     : `Your dataset conforms to the SPARC Dataset Structure. Continue to the next step to upload your dataset.`,
  //   allowEscapeKey: true,
  //   allowOutsideClick: false,
  //   heightAuto: false,
  //   backdrop: "rgba(0,0,0, 0.4)",
  //   timerProgressBar: false,
  //   showConfirmButton: true,
  //   icon: hasValidationErrors ? "error" : "success",
  // });

  // // list the results in a table ( ideally the one used in the validate feature )
  // if (!validationErrorsOccurred(errors)) {
  //   return;
  // }

  // // get validation table body
  // let validationErrorsTable = document.querySelector("#organize--table-validation-errors tbody");

  // clearValidationResults(validationErrorsTable);

  // // display errors onto the page
  // displayValidationErrors(
  //   errors,
  //   document.querySelector("#organize--table-validation-errors tbody")
  // );

  // // show the validation errors to the user
  // document.querySelector("#organize--table-validation-errors").style.visibility = "visible";

  // // TODO:
  // // lock the continue button if results are not valid ( for now since the validator is incomplete just show a warning message instead ) -- Maybe never lock it? WIP datasets may not be
  // // able to pass validation? Well not really just add make things valid as you go. NO metadata equals no validation errors in any case. But in those situations the
  // // dataset isn't even ready yet. ( validator-phase-4-simple )

  // // scroll so that the table is in the viewport
  // document
  //   .querySelector("#organize--table-validation-errors")
  //   .scrollIntoView({ behavior: "smooth" });
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
