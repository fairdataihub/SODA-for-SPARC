/*
    Purpose: After running a dataset validation pipeline we get back errors that are not human readable. They get piped through this module 
             to be 'translated' into something an end user can understand. 

*/

const { ValidationErrorParser } = require("./validation-error-parser.js");

const { ParsedErrorTranslator } = require("./parsed-error-translator.js");
const { VALIDATOR_CATEGORIES } = require("./validator-categories.js");

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
  if (validator === VALIDATOR_CATEGORIES.REQUIRED) {
    translationKey =
      translationKey || ValidationErrorParser.parseMissingSubmission(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingAwardNumber(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingOrganSystem(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingModality(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingTechnique(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingFunding(message);
    translationKey =
      translationKey ||
      ValidationErrorParser.parseMissingProtocolUrlOrDoi(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingTitle(message);
    translationKey =
      translationKey ||
      ValidationErrorParser.parseMissingNumberOfSubjects(message);
    translationKey =
      translationKey ||
      ValidationErrorParser.parseMissingNumberOfSamples(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingName(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingDescription(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingSamples(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingSubjects(message);
    translationKey =
      translationKey || ValidationErrorParser.parseMissingSpecies(message);
  } else if (validator === VALIDATOR_CATEGORIES.PATTERN) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseIncorrectDatasetName(
        message,
        path,
        validator,
        pipeline
      );
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidDatasetId(
        message,
        path,
        validator,
        pipeline
      );
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidOrganization(
        message,
        path,
        validator,
        pipeline
      );
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidSubjectIdPattern(path, validator);

    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidContributorNamePattern(path, validator);
  } else if (validator === VALIDATOR_CATEGORIES.MIN_ITEMS) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseMissingTechniqueValues(message, path);
  } else if (validator === VALIDATOR_CATEGORIES.CONTAINS) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidContributorRole(message, validator);
  } else if (validator === VALIDATOR_CATEGORIES.TYPE) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidSubjectIdType(path, validator);
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidFundingType(path, validator);
  } else if (validator === VALIDATOR_CATEGORIES.ANY_OF) {
    translationKey =
      translationKey || ValidationErrorParser.parseInvalidSpeciesAnyOf;
  } else if (validator === VALIDATOR_CATEGORIES.ADDITIONAL_PROPERTIES) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseAdditionalPropertiesDatasetDescription(
        path,
        validator
      );
  }

  return translationKey;
};

// The top level 'required' 'type' and 'pattern' are values from the 'validator' key that is returned by the validator
const pipelineErrorToTranslationTable = {
  required: {
    missingSubmission: ParsedErrorTranslator.translateMissingSubmission,
    missingAwardNumber: ParsedErrorTranslator.translateMissingAwardNumber,
    missingOrganSystem: ParsedErrorTranslator.translateMissingOrganSystem,
    missingModality: ParsedErrorTranslator.translateMissingModality,
    missingTechnique: ParsedErrorTranslator.translateMissingTechnique,
    missingFunding: ParsedErrorTranslator.translateMissingFunding,
    missingProtocolUrlOrDoi:
      ParsedErrorTranslator.translateMissingProtocolUrlOrDoi,
    missingTitle: ParsedErrorTranslator.translateMissingTitle,
    missingNumberOfSubjects:
      ParsedErrorTranslator.translateMissingNumberOfSubjects,
    missingNumberOfSamples:
      ParsedErrorTranslator.translateMissingNumberOfSamples,
    missingName: ParsedErrorTranslator.translateMissingName,
    missingDescription: ParsedErrorTranslator.translateMissingDescription,
    missingSamples: ParsedErrorTranslator.missingSamples,
    missingSubjects: ParsedErrorTranslator.missingSubjects,
    missingSpecies: ParsedErrorTranslator.missingSpecies,
  },
  type: {
    invalidSubjectIdType: ParsedErrorTranslator.translateInvalidSubjectIdType,
    invalidFundingType: ParsedErrorTranslator.translateInvalidFundingType,
    invalidAcknowledgmentsType:
      ParsedErrorTranslator.translateInvalidFundingType,
  },
  pattern: {
    invalidDatasetName: ParsedErrorTranslator.translateIncorrectDatasetName,
    invalidDatasetId: ParsedErrorTranslator.translateInvalidDatasetId,
    invalidOrganization: ParsedErrorTranslator.translateInvalidOrganization,
    invalidSubjectIdPattern:
      ParsedErrorTranslator.translateInvalidSubjectIdPattern,
    invalidContributorNamePattern:
      ParsedErrorTranslator.translateInvalidContributorNamePattern,
  },
  minItems: {
    missingTechnique: ParsedErrorTranslator.translateMissingTechniqueValues,
  },
  anyOf: {
    invalidSpeciesAnyOf: ParsedErrorTranslator.translateInvalidSpeciesAnyOf,
  },
  contains: {
    invalidContributorRole:
      ParsedErrorTranslator.translateInvalidContributorRole,
  },
  additionalProperties: {
    datasetDescriptionAdditionalProperties:
      ParsedErrorTranslator.translateAdditionalPropertiesDatasetDescription,
  },
};

// export the validationErrorPipeline function
exports.translatePipelineError = validationErrorPipeline;
