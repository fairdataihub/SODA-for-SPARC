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
const validationErrorPipeline = (path, errorMessage) => {
  // get translated error message
  let translatedErrorMessage = getTranslatedErrorMessage(path, errorMessage);

  return translatedErrorMessage;
};

/* 
Parse features of the given error message to determine what kind of translation needs to occur to make the message human readable
@param object error: A validation error from the Validator. 
@param string pipeline: "pennsieve" when validating a Pennsieve dataset and "local" when validating a local dataset
*/
const getTranslatedErrorMessage = (path, errorMessage) => {
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
    missingProtocolUrlOrDoi: ParsedErrorTranslator.translateMissingProtocolUrlOrDoi,
    missingTitle: ParsedErrorTranslator.translateMissingTitle,
    missingNumberOfSubjects: ParsedErrorTranslator.translateMissingNumberOfSubjects,
    missingNumberOfSamples: ParsedErrorTranslator.translateMissingNumberOfSamples,
    missingName: ParsedErrorTranslator.translateMissingName,
    missingDescription: ParsedErrorTranslator.translateMissingDescription,
    missingSamples: ParsedErrorTranslator.missingSamples,
    missingSubjects: ParsedErrorTranslator.missingSubjects,
    missingSpecies: ParsedErrorTranslator.missingSpecies,
    missingRelatedIdentifier: ParsedErrorTranslator.translateMissingRelatedIdentifiers,
    missingRelatedIdentifierType: ParsedErrorTranslator.translateMissingRelatedIdentifierType,
  },
  type: {
    invalidSubjectIdType: ParsedErrorTranslator.translateInvalidSubjectIdType,
    invalidFundingType: ParsedErrorTranslator.translateInvalidFundingType,
    invalidAcknowledgmentsType: ParsedErrorTranslator.translateInvalidFundingType,
    invalidIdentifierDescriptionType:
      ParsedErrorTranslator.translateInvalidIdentifierDescriptionType,
  },
  pattern: {
    invalidDatasetName: ParsedErrorTranslator.translateIncorrectDatasetName,
    invalidDatasetId: ParsedErrorTranslator.translateInvalidDatasetId,
    invalidOrganization: ParsedErrorTranslator.translateInvalidOrganization,
    invalidSubjectIdPattern: ParsedErrorTranslator.translateInvalidSubjectIdPattern,
    invalidContributorNamePattern: ParsedErrorTranslator.translateInvalidContributorNamePattern,
  },
  minItems: {
    missingTechnique: ParsedErrorTranslator.translateMissingTechniqueValues,
  },
  anyOf: {
    invalidSpeciesAnyOf: ParsedErrorTranslator.translateInvalidSpeciesAnyOf,
    contributorAffiliationAnyOf: ParsedErrorTranslator.translateContributorAffiliationAnyOf,
  },
  contains: {
    invalidContributorRole: ParsedErrorTranslator.translateInvalidContributorRole,
    invalidContributorsContains: ParsedErrorTranslator.translateInvalidContributorsContains,
  },
  additionalProperties: {
    datasetDescriptionAdditionalProperties:
      ParsedErrorTranslator.translateAdditionalPropertiesDatasetDescription,
  },
  enum: {
    invalidRelationTypeEnum: ParsedErrorTranslator.translateInvalidRelationTypeEnum,
  },
};

const METADATA_FILES = {
  DATASET_DESCRIPTION: "dataset description",
  SUBMISSION_FILE: "submission file",
};

const MissingFieldNameToMetadataFileMap = {
  type: METADATA_FILES.DATASET_DESCRIPTION,
  title: METADATA_FILES.DATASET_DESCRIPTION,
  subtitle: METADATA_FILES.DATASET_DESCRIPTION,
  keywords: METADATA_FILES.DATASET_DESCRIPTION,
  funding: METADATA_FILES.DATASET_DESCRIPTION,
  acknowledgments: METADATA_FILES.DATASET_DESCRIPTION,
  "study purpose": METADATA_FILES.DATASET_DESCRIPTION,
  "study data collection": METADATA_FILES.DATASET_DESCRIPTION,
  "study primary conclusion": METADATA_FILES.DATASET_DESCRIPTION,
  "study organ system": METADATA_FILES.DATASET_DESCRIPTION,
  "study approach": METADATA_FILES.DATASET_DESCRIPTION,
  "study technique": METADATA_FILES.DATASET_DESCRIPTION,
  "study collection title": METADATA_FILES.DATASET_DESCRIPTION,
  "contributor name": METADATA_FILES.DATASET_DESCRIPTION,
  "contributor orcid": METADATA_FILES.DATASET_DESCRIPTION,
  "contributor affiliation": METADATA_FILES.DATASET_DESCRIPTION,
  "contributor role": METADATA_FILES.DATASET_DESCRIPTION,
  "identifier description": METADATA_FILES.DATASET_DESCRIPTION,
  "relation type": METADATA_FILES.DATASET_DESCRIPTION,
  identifier: METADATA_FILES.DATASET_DESCRIPTION,
  "identifier type": METADATA_FILES.DATASET_DESCRIPTION,
  "number of subjects": METADATA_FILES.DATASET_DESCRIPTION,
  "number of samples": METADATA_FILES.DATASET_DESCRIPTION,
  // 1.2.3 properties
  name: METADATA_FILES.DATASET_DESCRIPTION,
  description: METADATA_FILES.DATASET_DESCRIPTION,
  contributors: METADATA_FILES.DATASET_DESCRIPTION,
  "contributor orcid id": METADATA_FILES.DATASET_DESCRIPTION,
  "is contact person": METADATA_FILES.DATASET_DESCRIPTION,
  "originating article doi": METADATA_FILES.DATASET_DESCRIPTION,
  "protocol url or doi": METADATA_FILES.DATASET_DESCRIPTION,
  "additional links": METADATA_FILES.DATASET_DESCRIPTION,
  "link description": METADATA_FILES.DATASET_DESCRIPTION,
  "completeness of data set": METADATA_FILES.DATASET_DESCRIPTION,
  "parent dataset id": METADATA_FILES.DATASET_DESCRIPTION,
  "title for complete data set": METADATA_FILES.DATASET_DESCRIPTION,
};

// export the validationErrorPipeline function
exports.translatePipelineError = validationErrorPipeline;
