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

    // list the results in a table ( ideally the one used in the validate feature )
    if (!validationErrorsOccurred(errors)) {
        return;
    }

    // display errors onto the page
    displayValidationErrors(errors, document.querySelector("#organize--table-validation-errors tbody"));

    // show the validation errors to the user
    document.querySelector("#organize--table-validation-errors").style.visibility = "visible";

    // lock the continue button if results are not valid ( for now since the validator is incomplete just show a warning message instead )

}