/*
    Purpose: After running a dataset validation pipeline we get back errors that are not human readable. They get piped through this module 
             to be 'translated' into something an end user can understand. 

*/

/* 
Takes a validation error and parses the features of the error to determine what translation function to use on the error object
@param {blame: string, message: string, pipeline_stage: string, schema_path: string[], validator: string, validator_value: string[], path: string[]} error  
         - A validation error from one of the Validator pipelines (either Pennsieve or Local)
@param string pipeline: "pennsieve" when validating a Pennsieve dataset and "local" when validating a local dataset
*/
const validationErrorPipeline = (error, pipeline) => {
  // get the validation category from the error message
  let validationCategory = error.validator;

  // use the returned error type key to determine what translation function to run
  let translationKey = parseFeature(error, pipeline);

  let { message } = error;

  if (!translationKey) {
    throw new Error(
      `Missing translation key for this error message: ${message}`
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
  }

  // send the translated message back to the user interface
  return translationFunction(message);
};

/* 
Parse features of the given error message to determine what kind of translation needs to occur to make the message human readable
@param string pipeline: "pennsieve" when validating a Pennsieve dataset and "local" when validating a local dataset
*/
const parseFeature = (error, pipeline) => {
  let translationKey = "";
  const { message, path, validator } = error;
  // search the string for a feature that can be used to determine what translation key to return
  translationKey = translationKey || parseMissingSubmission(message);
  translationKey = translationKey || parseMissingAwardNumber(message);
  translationKey = translationKey || parseMissingOrganSystem(message);
  translationKey = translationKey || parseMissingModality(message);
  translationKey = translationKey || parseMissingTechnique(message);
  translationKey = translationKey || parseMissingTechniqueValues(message, path);
  translationKey =
    translationKey ||
    parseIncorrectDatasetName(message, path, validator, pipeline);

  return translationKey;
};

// Parsing functions *************************************************************************************************************************
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

const parseMissingOrganSystem = (errorMessage) => {
  // determine if this is a missing submission file error message
  if (errorMessage === "'organ' is a required property") {
    // if so return the translation key
    return "missingOrganSystem";
  }

  // return nothing to indicate no match has been found
  return "";
};

const parseMissingModality = (errorMessage) => {
  // determine if this is a missing submission file error message
  if (errorMessage === "'modality' is a required property") {
    // if so return the translation key
    return "missingModality";
  }

  // return nothing to indicate no match has been found
  return "";
};

const parseMissingTechnique = (errorMessage) => {
  // determine if this is a missing submission file error message
  if (errorMessage === "'technique' is a required property") {
    // if so return the translation key
    return "missingTechnique";
  }

  // return nothing to indicate no match has been found
  return "";
};

const parseMissingTechniqueValues = (errorMessage, path) => {
  const lastElementOfPath = path[path.length - 1];

  if (lastElementOfPath === "techniques") {
    if (errorMessage === "[] is too short") {
      // if so return the translation key
      return "missingTechnique";
    }
  }

  // return nothing to indicate no match has been found
  return "";
};

// TODO: Expand this to also check for invalid local dataset names
const parseIncorrectDatasetName = (errorMessage, path, validator, pipeline) => {
  let lastElementOfPath = path[path.length - 1];

  // address a bug case wherein the validator parses a local dataset name
  // using a pennsieve dataset pattern
  if (
    validator === "pattern" &&
    lastElementOfPath === "uri_api" &&
    pipeline === "local"
  ) {
    return "";
  }

  // check if all conditions point to dealing with an invalid package/dataset name
  if (
    lastElementOfPath === "uri_api" &&
    pipeline === "pennsieve" &&
    validator === "pattern"
  ) {
    let regExp = new RegExp(
      "does not match ^https://api\\.pennsieve\\.io/(datasets|packages)/"
    );

    let hasIncorrectDatasetName = regExp.test(errorMessage);

    if (!hasIncorrectDatasetName) return "";

    return "invalidDatasetName";
  }

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

const translateMissingOrganSystem = () => {
  return [
    "Your dataset description file is missing information on the organ system of the study",
    "Fix this by visiting your dataset description file and adding an organ system field/column with appropriate data",
    "URL: fix.SODA.page",
  ];
};

const translateMissingModality = () => {
  return [
    "Your dataset description file is missing information on the modality of the study",
    "Fix this by visiting your dataset description file and adding a modality field/column with the appropriate information",
    "URL: fix.SODA.page",
  ];
};

const translateMissingTechnique = () => {
  return [
    "Your dataset description file is missing information on the techniques used in the study",
    "Fix this by visiting your dataset description file and adding a study technique column/field with the appropriate information",
    "URL: fix.SODA.page",
  ];
};

const translateMissingTechniqueValues = () => {
  return [
    "Your dataset description file's techniques field/column is missing study techniques.",
    "Fix this by visiting your dataset description file and adding at least one study technique in the 'Study technique' field/column.",
    "URL: fix.SODA.page",
  ];
};

// TODO: Make it match Local or Pennsieve url/name for the error message translation.
// TODO: Take out idk lol
const translateIncorrectDatasetName = () => {
  return [
    "Your dataset's name/package does not match expectations of the Pennsieve platform/local datasets",
    "Fix this by changing your dataset's name if this is about your dataset. If not idk lol",
    "URL: fix.SODA.page",
  ];
};

// The top level 'required' 'type' and 'pattern' are values from the 'validator' key that is returned by the validator
const pipelineErrorToTranslationTable = {
  required: {
    missingSubmission: translateMissingSubmission,
    missingAwardNumber: translateMissingAwardNumber,
    missingOrganSystem: translateMissingOrganSystem,
    missingModality: translateMissingModality,
    missingTechnique: translateMissingTechnique,
  },
  type: {},
  pattern: {
    invalidDatasetName: translateIncorrectDatasetName,
  },
  minItems: {
    missingTechnique: translateMissingTechniqueValues,
  },
};

// export the validationErrorPipeline function
exports.translatePipelineError = validationErrorPipeline;
