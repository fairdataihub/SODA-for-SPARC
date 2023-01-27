// Purpose: Logic for Organize Dataset Step 7: Validate Dataset

// Validate the dataset that has just been organized in Organize Dataset Step 6: Validate Dataset
// TODO: Pennsieve vs local considerations for result parsing and error handling
const validateOrganizedDataset = async () => {
  let sodaJSONObject = await getFormattedSodaJSON();

  // let skeletonDatasetResponse;
  // try {
  //   skeletonDatasetResponse = await client.post(
  //     "/skeleton_dataset/",
  //     {
  //       sodajsonobject: sodaJSONObject,
  //       selected_account: defaultBfAccount,
  //       selected_dataset: defaultBfDataset,
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
  //   return;
  // }

  // let pathToSkeletonDataset = skeletonDatasetResponse.data["path_to_skeleton_dataset"];

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

/**
 * Create a deep copy of the soda json object and format it so it can be used to generate a skeleton dataset.
 * @returns {Object} The formatted soda json object; ready for being used to generate a skeleton dataset
 */
const getFormattedSodaJSON = async () => {
  // send the soda json object to the soda api to create a skeleton dataset
  // TODO: Massage the soda_json_object to match the state it is in when it is sent to the /curate endpoint
  // TODO: Ensure no data loss with this method of creating a deep copy. Should be fine since we only use simple types.
  // TODO: break out this 'formatSodaJSON' code into separate function; use get as a wrapper; add this last section as a hook
  //       We do use timestamps I believe but this shouldnt cause issue. Will test.
  let sodaJSONObjCopy = JSON.parse(JSON.stringify(sodaJSONObj));

  // update the copy of the json structure to get its state post generation initialization 
  updateJSONStructureGenerate(false, sodaJSONObjCopy);

  setSodaJSONStartingPoint(sodaJSONObjCopy);

  let [dataset_name, dataset_destination] = setDatasetNameAndDestination(sodaJSONObjCopy);

  if (dataset_destination == "Pennsieve" && "bf" === sodaJSONObjCopy["starting-point"]["type"]) {
    // handle renaming, moving, and deleting files and folders
    let cleanCopyResponse = await client.post("/curate_datasets/clean-dataset", { soda_json_structure: sodaJSONObjCopy})
    sodaJSONObjCopy = cleanCopyResponse.data.soda_json_structure
    console.log(sodaJSONObjCopy)
  }


  document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";
  let errorMessage = await checkEmptyFilesAndFolders(sodaJSONObjCopy);

  if (errorMessage) {
    errorMessage += "Would you like to continue?";
    errorMessage = "<div style='text-align: left'>" + errorMessage + "</div>";
    Swal.fire({
      icon: "warning",
      html: errorMessage,
      showCancelButton: true,
      cancelButtonText: "No, I want to review my files",
      focusCancel: true,
      confirmButtonText: "Yes, Continue",
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        initiate_generate();
      } else {
        $("#sidebarCollapse").prop("disabled", false);
        document.getElementById("para-please-wait-new-curate").innerHTML = "Return to make changes";
        document.getElementById("div-generate-comeback").style.display = "flex";
      }
    });
  }

  return sodaJSONObjCopy;
};
