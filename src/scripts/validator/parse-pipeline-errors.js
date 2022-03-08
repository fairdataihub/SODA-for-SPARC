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

  // check the required category if applicable
  if (validator === "required") {
    translationKey = translationKey || parseMissingSubmission(message);
    translationKey = translationKey || parseMissingAwardNumber(message);
    translationKey = translationKey || parseMissingOrganSystem(message);
    translationKey = translationKey || parseMissingModality(message);
    translationKey = translationKey || parseMissingTechnique(message);
    translationKey = translationKey || parseMissingFunding(message);
    translationKey = translationKey || parseMissingProtocolUrlOrDoi(message);
  } else if (validator === "pattern") {
    translationKey =
      translationKey ||
      parseIncorrectDatasetName(message, path, validator, pipeline);
    translationKey =
      translationKey ||
      parseInvalidDatasetId(message, path, validator, pipeline);
    translationKey =
      translationKey ||
      parseInvalidOrganization(message, path, validator, pipeline);
  } else if (validator === "minItems") {
    translationKey =
      translationKey || parseMissingTechniqueValues(message, path);
  }

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

const parseInvalidDatasetId = (errorMessage, path, validator, pipeline) => {
  let lastElementOfPath = path[path.length - 1];

  // address a bug case wherein the validator parses a local dataset name
  // using a pennsieve dataset pattern and creates an id error
  if (
    validator === "pattern" &&
    lastElementOfPath === "id" &&
    pipeline === "local"
  ) {
    return "";
  }

  // check if all conditions point to dealing with an invalid dataset id
  if (
    lastElementOfPath === "id" &&
    pipeline === "pennsieve" &&
    validator === "pattern"
  ) {
    return "invalidDatasetId";
  }

  return "";
};

const parseInvalidOrganization = (errorMessage, path, validator, pipeline) => {
  let lastElementOfPath = path[path.length - 1];

  // address a bug case wherein the validator treats a local dataset
  // as if it were a Pennsieve dataset
  if (
    validator === "pattern" &&
    lastElementOfPath === "uri_human" &&
    pipeline === "local"
  ) {
    return "";
  }

  // check if all conditions point to dealing with an invalid organization
  if (
    lastElementOfPath === "uri_human" &&
    validator === "pattern" &&
    pipeline === "pennsieve"
  ) {
    // check if the string has an N:organization pattern included in the message
    let regExp = new RegExp(
      "does not match '^https://app\\.pennsieve\\.io/N:organization:'"
    );

    let hasInvalidOrganization = regExp.test(errorMessage);

    if (hasInvalidOrganization) {
      return "invalidOrganization";
    }
  }

  return "";
};

const parseMissingFunding = (errorMessage) => {
  if (errorMessage === "'funding' is a required property") {
    return "missingFunding";
  }

  return "";
};

const parseMissingProtocolUrlOrDoi = (errorMessage) => {
  if(errorMessage === "'protocol_url_or_doi' is a required property") {
    return "missingProtocolUrlOrDoi"
  }

  return ""
}

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

const translateInvalidDatasetId = () => {
  return [
    "Your Pennsieve dataset does not have a valid UUID",
    "Fix this by contacting the Pennsieve team using the 'Get Help' sidebar menu option.",
    "URL: fpath to Pennsieve",
  ];
};

const translateInvalidOrganization = () => {
  return [
    "Your organization ID is invalid",
    "Fix this by contacting the Pennsieve team using the 'Get Help' sidebar menu option.",
    "URL: fpath to Pennsieve",
  ];
};

const translateMissingFunding = () => {
  return [
    "Your dataset description file is missing a Funding field/column",
    "Fix this by adding a Funding field/column to your dataset description column.",
    "URL: path to SODA",
  ];
};

const translateMissingProtocolUrlOrDoi = () => {
  return [
    "Your samples file is missing a 'protocol url or doi' column/field",
    "Fix this by adding a 'protocol url or doi' field/column to your samples file.",
    "URL: path to SODA",
  ]
}

// The top level 'required' 'type' and 'pattern' are values from the 'validator' key that is returned by the validator
const pipelineErrorToTranslationTable = {
  required: {
    missingSubmission: translateMissingSubmission,
    missingAwardNumber: translateMissingAwardNumber,
    missingOrganSystem: translateMissingOrganSystem,
    missingModality: translateMissingModality,
    missingTechnique: translateMissingTechnique,
    missingFunding: translateMissingFunding,
    missingProtocolUrlOrDoi: translateMissingProtocolUrlOrDoi
  },
  type: {},
  pattern: {
    invalidDatasetName: translateIncorrectDatasetName,
    invalidDatasetId: translateInvalidDatasetId,
    invalidOrganization: translateInvalidOrganization,
  },
  minItems: {
    missingTechnique: translateMissingTechniqueValues,
  },
};

// export the validationErrorPipeline function
exports.translatePipelineError = validationErrorPipeline;
