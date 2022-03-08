/*
    Purpose: After running a dataset validation pipeline we get back errors that are not human readable. They get piped through this module 
             to be 'translated' into something an end user can understand. 

*/

/* 
Takes a validation error and parses the features of the error to determine what translation function to use on the error object
@param {blame: string, message: string, pipeline_stage: string, schema_path: string[], validator: string, validator_value: string[], path: string[]} error  
         - A validation error from one of the Validator pipelines (either Pennsieve or Local)
*/
const validationErrorPipeline = (error) => {
  let { message } = error;

  // get the validation category from the error message
  let validationCategory = error.validator;

  // use the returned error type key to determine what translation function to run
  let translationKey = parseFeature(message);

  if (!translationKey) {
    throw new Error(
      `Missing translation key for this error message ${message}`
    );
  }

  // use the returned error type key to determine what translation function to run
  let validationCategoryTable =
    pipelineErrorToTranslationTable[validationCategory];

  if (!validationCategoryTable) {
    throw new Error(
      `Missing validation type from table: ${validationCategory}`
    );
  }

  // get the translation function from the table
  let translationFunction = validationCategoryTable[translationKey];

  // this error has not been considered so send back Empty to denote that I missed a case
  if (!translationFunction) {
    throw new Error(
      `Missing translation function for this translation key: ${translationKey}`
    );
    //return ["Empty", "Empty", "Empty"]
  }

  // send the translated message back to the user interface
  return translationFunction(message);
};

// Parse features of the given error message to determine what kind of translation needs to occur to make the message human readable
const parseFeature = (errorMessage) => {
  let translationKey = "";
  // search the string for a feature that can be used to determine what translation key to return
  translationKey = parseMissingSubmission(errorMessage) || translationKey;
  translationKey = parseMissingAwardNumber(errorMessage) || translationKey;

  return translationKey;
};

// Parsing functionality *************************************************************************************************************************
const parseMissingSubmission = (errorMessage) => {
  // determine if this is a missing submission file error message
  if (errorMessage === "'submission_file' is a required property") {
    // if so return the translation key
    return "missingSubmission";
  }

  // return nothing to indicate no match has been found
  return "";
};

const parseMissingAwardNumber = (errorMessage) => {
  // determine if this is a missing submission file error message
  if (errorMessage === "'award_number' is a required property") {
    // if so return the translation key
    return "missingAwardNumber";
  }

  // return nothing to indicate no match has been found
  return "";
};

// Translation functions **************************************************************************************************************************

const translateMissingSubmission = () => {
  return [
    "You are missing a top level submission file",
    "Fix this by creating a top level submission file for your dataset",
    "URL: fix.SODA.page",
  ];
};

const translateMissingAwardNumber = () => {
  return [
    "Your Submission file is missing an award number",
    "Fix this by visiting your submission file and adding an award number",
    "URL: fix.SODA.page",
  ];
};

// The top level 'required' 'type' and 'pattern' are values from the 'validator' key that is returned by the validator
const pipelineErrorToTranslationTable = {
  required: {
    missingSubmission: translateMissingSubmission,
    missingAwardNumber: translateMissingAwardNumber,
  },
  type: {},
  pattern: {},
  minItems: {},
};

// export the validationErrorPipeline function
exports.translatePipelineError = validationErrorPipeline;
