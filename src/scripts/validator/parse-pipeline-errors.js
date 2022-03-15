/*
    Purpose: After running a dataset validation pipeline we get back errors that are not human readable. They get piped through this module 
             to be 'translated' into something an end user can understand. 

*/

// TODO: It should be relatively easy to generalize the Type errors. I need to watch for edge cases
//       but based off the duplication in the code and the standardization ( mostly) of the 'Type'
//       errors one function should be able to handle them.

// TODO: It should be relatively easy to generalize 'required' category errors as well. One function with
//       handling for the different string values (each representing a field or metadata file ) should be simple
//       enough.

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
  // get translated error message
  let translatedErrorMessage = getTranslatedErrorMessage(error, pipeline);

  console.log("Current translated error message: ", translatedErrorMessage);

  return translatedErrorMessage;
};

/* 
Parse features of the given error message to determine what kind of translation needs to occur to make the message human readable
@param string pipeline: "pennsieve" when validating a Pennsieve dataset and "local" when validating a local dataset
*/
const getTranslatedErrorMessage = (error, pipeline) => {
  let translationKey = "";
  const { message, path, validator } = error;
  let translatedErrorMessage = "";
  // search the string for a feature that can be used to determine what translation key to return

  // check the required category if applicable
  if (validator === VALIDATOR_CATEGORIES.REQUIRED) {
    // get the name of the missing required field
    let missingField =
      ValidationErrorParser.parseMissingRequiredFields(message);

    // get the metadata file name that the missing field belongs to
    let metadataFile = fieldToMetadataFileMap[missingField];

    // using the missing field and metadata file create an error message for the user
    translatedErrorMessage = ParsedErrorTranslator.parseMissingRequiredFields(
      missingField,
      metadataFile
    );
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
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidContributorInformationContains(
        path,
        validator
      );
  } else if (validator === VALIDATOR_CATEGORIES.TYPE) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidSubjectIdType(path, validator);
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidFundingType(path, validator);

    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidIdentifierDescriptionType(
        path,
        validator
      );
  } else if (validator === VALIDATOR_CATEGORIES.ANY_OF) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidSpeciesAnyOf(path, validator);
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidContributorAffiliationAnyOf(
        path,
        validator
      );
  } else if (validator === VALIDATOR_CATEGORIES.ADDITIONAL_PROPERTIES) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseAdditionalPropertiesDatasetDescription(
        path,
        validator
      );
  } else if (validator === VALIDATOR_CATEGORIES.ENUM) {
    translationKey =
      translationKey ||
      ValidationErrorParser.parseInvalidRelationTypeEnum(path, validator);
  } else {
    throw new Error("The given category wasn't accounted for: ", validator);
  }

  return translatedErrorMessage;
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
    missingRelatedIdentifier:
      ParsedErrorTranslator.translateMissingRelatedIdentifiers,
    missingRelatedIdentifierType:
      ParsedErrorTranslator.translateMissingRelatedIdentifierType,
  },
  type: {
    invalidSubjectIdType: ParsedErrorTranslator.translateInvalidSubjectIdType,
    invalidFundingType: ParsedErrorTranslator.translateInvalidFundingType,
    invalidAcknowledgmentsType:
      ParsedErrorTranslator.translateInvalidFundingType,
    invalidIdentifierDescriptionType:
      ParsedErrorTranslator.translateInvalidIdentifierDescriptionType,
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
    contributorAffiliationAnyOf:
      ParsedErrorTranslator.translateContributorAffiliationAnyOf,
  },
  contains: {
    invalidContributorRole:
      ParsedErrorTranslator.translateInvalidContributorRole,
    invalidContributorsContains:
      ParsedErrorTranslator.translateInvalidContributorsContains,
  },
  additionalProperties: {
    datasetDescriptionAdditionalProperties:
      ParsedErrorTranslator.translateAdditionalPropertiesDatasetDescription,
  },
  enum: {
    invalidRelationTypeEnum:
      ParsedErrorTranslator.translateInvalidRelationTypeEnum,
  },
};

const missingFieldNameToPipelineErrorKeyTable = {
  funding: "missing",
};

// export the validationErrorPipeline function
exports.translatePipelineError = validationErrorPipeline;
