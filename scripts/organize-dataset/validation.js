// Purpose: Logic for Organize Dataset Step 6: Validate Dataset

// Validate the dataset that has just been organized in Organize Dataset Step 6: Validate Dataset
// TODO: Pennsieve vs local considerations for result parsing and error handling
const validateOrganizedDataset = async () => {
    // send the soda json object to the soda api to create a skeleton dataset
    let skeletonDatasetResponse
    try {
        skeletonDatasetResponse = await client.post("/skeleton-dataset", {
            sodaJSONObj
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
        validationResponse = await client.post("/validate", {
            // TODO: Dynamic path depending upon OS
            path: '/home/SODA/skeleton'
        }, {
            timeout: 0
        })
    } catch(error) {
        clientError(error)
        //TODO: SWAL
    }

    // list the results in a table ( ideally the one used in the validate feature )
    console.log(validationResponse)

    // lock the continue button if results are not valid (for now since the validator is incomplete just show a warning message instead)
}