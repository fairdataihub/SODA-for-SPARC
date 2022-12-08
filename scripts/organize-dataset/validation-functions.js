// Purpose: Logic for Organize Dataset Step 6: Validate Dataset

// Validate the dataset that has just been organized in Organize Dataset Step 6: Validate Dataset
// TODO: Pennsieve vs local considerations for result parsing and error handling
const validateOrganizedDataset = async () => {
    // send the soda json object to the soda api to create a skeleton dataset
    let skeletonDatasetResponse
    try {
        skeletonDatasetResponse = await client.post("/skeleton_dataset", {
            sodajsonobject: sodaJSONObj,
            selected_account: defaultBfAccount,
            selected_dataset: defaultBfDataset,
        }, {
            timeout: 0
        })
    } catch (error) {
        clientError(error)
        // TODO: SWAL 
        return
    }

    // call the soda api with the path to the skeleton dataset to validate the dataset
    let validationResponse
    try {
        validationResponse = await client.get("/validator/local_dataset_validation_result", {
            // TODO: Dynamic path depending upon OS
            params: {
                path: 'SODA/skeleton'
            }
        }, {
            timeout: 0
        })
    } catch (error) {
        clientError(error)
        //TODO: SWAL
    }

    let errors = validationResponse.data;

    // this works because the returned validation results are in an Object Literal. If the returned object is changed this will break (e.g., an array will have a length property as well)
    let hasValidationErrors = Object.getOwnPropertyNames(errors).length >= 1;

    Swal.fire({
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
    if (!validationErrorsOccurred(errors)) {
        return;
    }

    // display errors onto the page
    displayValidationErrors(errors, document.querySelector("#organize--table-validation-errors tbody"));

    // show the validation errors to the user
    document.querySelector("#organize--table-validation-errors").style.visibility = "visible";

    // lock the continue button if results are not valid ( for now since the validator is incomplete just show a warning message instead ) -- Maybe never lock it? WIP datasets may not be 
    // able to pass validation? Well not really just add make things valid as you go. NO metadata equals no validation errors in any case. But in those situations the 
    // dataset isn't even ready yet. 


}