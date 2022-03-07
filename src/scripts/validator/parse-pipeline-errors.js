/*
    Purpose: After running a dataset validation pipeline we get back errors that are not human readable. They get piped through this module 
             to be 'translated' into something an end user can understand. 

*/


// The top level 'required' 'type' and 'pattern' are values from the 'validator' key that is returned by the validator
const pipelineErrorToTranslationTable = {
    required: {
        "missingSubmission": translateMissingSubmission
    },
    type: {

    }, 
    pattern: {

    }
}

/* 
Takes a validation error and parses the features of the error to determine what translation function to use on the error object
@param {blame: string, message: string, pipeline_stage: string, schema_path: string[], validator: string, validator_value: string[]} error  
         - A validation error from one of the Validator pipelines (either Pennsieve or Local)
*/
const validationErrorPipeline = (error) => {

    // get the validation category from the error message 
    let validationCategory = error.validator

    // parse the features of the given error to get a key to the correct error message translation
    let translationKey = parseFeature(error.message)

    // use the returned error type key to determine what translation function to run
    let translationFunction = pipelineErrorToTranslationTable[validationCategory][translationKey]

    // send the translated message back to the user interface 
    return translationFunction(error.message)
}

// Parse features of the given error message to determine what kind of translation needs to occur to make the message human readable
const parseFeature = (errorMessage) => {
    // search the string for a feature that can be used to determine what translation key to return 
    return parseMissingSubmission(errorMessage)
}

const parseMissingSubmission = (errorMessage) => {
    // determine if this is a missing submission file error message 

    // if so return the translation key
    return "missingSubmission"
}

const translateMissingSubmission = () => {
    return ["You are missing a top level submission file", "Fix this by creating a top level submission file for your dataset", "URL: fix.SODA.page"]
}