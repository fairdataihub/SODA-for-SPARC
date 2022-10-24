const { VALIDATOR_CATEGORIES } = require("./validator-categories.js");

const ValidationErrorParser = {
  parseMissingSubmission: (errorMessage) => {
    // determine if this is a missing submission file error message
    if (errorMessage === "'submission_file' is a required property") {
      // if so return the translation key
      return "missingSubmission";
    }

    // return nothing to indicate no match has been found
    return "";
  },

  parseMissingAwardNumber: (errorMessage) => {
    // determine if this is a missing submission file error message
    if (errorMessage === "'award_number' is a required property") {
      // if so return the translation key
      return "missingAwardNumber";
    }

    // return nothing to indicate no match has been found
    return "";
  },

  parseMissingOrganSystem: (errorMessage) => {
    // determine if this is a missing submission file error message
    if (errorMessage === "'organ' is a required property") {
      // if so return the translation key
      return "missingOrganSystem";
    }

    // return nothing to indicate no match has been found
    return "";
  },

  parseMissingModality: (errorMessage) => {
    // determine if this is a missing submission file error message
    if (errorMessage === "'modality' is a required property") {
      // if so return the translation key
      return "missingModality";
    }

    // return nothing to indicate no match has been found
    return "";
  },

  parseMissingTechnique: (errorMessage) => {
    // determine if this is a missing submission file error message
    if (errorMessage === "'technique' is a required property") {
      // if so return the translation key
      return "missingTechnique";
    }

    // return nothing to indicate no match has been found
    return "";
  },

  parseMissingSpecies: (errorMessage) => {
    if (errorMessage === "'species' is a required property") {
      return "missingSpecies";
    }

    return "";
  },

  parseMissingFunding: (errorMessage) => {
    if (errorMessage === "'funding' is a required property") {
      return "missingFunding";
    }

    return "";
  },

  parseMissingProtocolUrlOrDoi: (errorMessage) => {
    if (errorMessage === "'protocol_url_or_doi' is a required property") {
      return "missingProtocolUrlOrDoi";
    }

    return "";
  },

  parseMissingTitle: (errorMessage) => {
    if (errorMessage === "'title' is a required property") {
      return "missingTitle";
    }

    return "";
  },

  parseMissingNumberOfSubjects: (errorMessage) => {
    if (errorMessage === "'number_of_subjects' is a required property") {
      return "missingNumberOfSubjects";
    }

    return "";
  },

  parseMissingNumberOfSamples: (errorMessage) => {
    if (errorMessage === "'number_of_samples' is a required property") {
      return "missingNumberOfSamples";
    }

    return "";
  },

  // dataset description 1.2.3 requires a name property. This has been superseded by 'title' in 2.0.0
  parseMissingName: (errorMessage) => {
    if (errorMessage === "'name' is a required property") {
      return "missingName";
    }

    return "";
  },

  parseMissingDescription: (errorMessage) => {
    if (errorMessage === "'description' is a required property") {
      return "missingDescription";
    }

    return "";
  },

  parseMissingSamples: (errorMessage) => {
    if (errorMessage === "'samples' is a required property") {
      return "missingSamples";
    }

    return "";
  },

  parseMissingSubjects: (errorMessage) => {
    if (errorMessage === "'subjects' is a required property") {
      return "missingSubjects";
    }

    return "";
  },

  // TODO: Experiment with this parser for required fields to see if it works with the usual
  parseMissingRequiredFields: (errorMessage) => {
    let missingFieldCharacters = [];
    let encounteredComma = false;

    // take the missing field out of the error message
    for (let idx = 0; idx < errorMessage.length; idx++) {
      // check if comma
      if (errorMessage[idx] === "'") {
        // check if first comma encountered
        if (!encounteredComma) {
          encounteredComma = true;
        } else {
          // second comma encountered indicates we have traversed the entire parameter the user
          // has not entered. field building is done.
          break;
        }
      } else {
        // build up the missing required field
        missingFieldCharacters.push(errorMessage[idx]);
      }
    }

    // create the missing field name
    let missingField = missingFieldCharacters.join("");

    // return the parsed missing required field
    return missingField;
  },

  // end of current required category parsing code ---------------------------------------------------

  // start of other parsing code ---------------------------------------------------------------------
  parseMissingTechniqueValues: (errorMessage, path) => {
    const lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath === "techniques") {
      if (errorMessage === "[] is too short") {
        // if so return the translation key
        return "missingTechnique";
      }
    }

    // return nothing to indicate no match has been found
    return "";
  },

  // TODO: Expand this to also check for invalid local dataset names
  parseIncorrectDatasetName: (errorMessage, path, validator, pipeline) => {
    let lastElementOfPath = path[path.length - 1];

    // address a bug case wherein the validator parses a local dataset name
    // using a pennsieve dataset pattern
    if (validator === "pattern" && lastElementOfPath === "uri_api" && pipeline === "local") {
      return "";
    }

    // check if all conditions point to dealing with an invalid package/dataset name
    if (lastElementOfPath === "uri_api" && pipeline === "pennsieve" && validator === "pattern") {
      let regExp = new RegExp("does not match ^https://api\\.pennsieve\\.io/(datasets|packages)/");

      let hasIncorrectDatasetName = regExp.test(errorMessage);

      if (!hasIncorrectDatasetName) return "";

      return "invalidDatasetName";
    }

    return "";
  },

  parseInvalidDatasetId: (errorMessage, path, validator, pipeline) => {
    let lastElementOfPath = path[path.length - 1];

    // address a bug case wherein the validator parses a local dataset name
    // using a pennsieve dataset pattern and creates an id error
    if (validator === "pattern" && lastElementOfPath === "id" && pipeline === "local") {
      return "";
    }

    // check if all conditions point to dealing with an invalid dataset id
    if (lastElementOfPath === "id" && pipeline === "pennsieve" && validator === "pattern") {
      return "invalidDatasetId";
    }

    return "";
  },

  parseInvalidOrganization: (errorMessage, path, validator, pipeline) => {
    let lastElementOfPath = path[path.length - 1];

    // address a bug case wherein the validator treats a local dataset
    // as if it were a Pennsieve dataset
    if (validator === "pattern" && lastElementOfPath === "uri_human" && pipeline === "local") {
      return "";
    }

    // check if all conditions point to dealing with an invalid organization
    if (lastElementOfPath === "uri_human" && validator === "pattern" && pipeline === "pennsieve") {
      // check if the string has an N:organization pattern included in the message
      let regExp = new RegExp("does not match '^https://app\\.pennsieve\\.io/N:organization:'");

      let hasInvalidOrganization = regExp.test(errorMessage);

      if (hasInvalidOrganization) {
        return "invalidOrganization";
      }
    }

    return "";
  },

  // TODO: Test for any possible variability in the input that can ruin our regular expression for getting the roles that need to be changed
  parseInvalidContributorRole: (errorMessage, validator) => {
    // TODO: Make more robust and yet also more specific
    let searchForContributor = /{'contributor_role':/;
    let hasContributor = searchForContributor.test(errorMessage);

    if (hasContributor && validator === "contains") {
      return "invalidContributorRole";
    }

    return "";
  },

  parseInvalidSubjectIdPattern: (path, validator) => {
    if (validator !== "pattern") return "";

    const lastPathElement = path[path.length - 1];

    // TODO: Make a function that checks for the name of the last element of a path? There will be about 3-5 other validation categories that use any one path ending. If that ending changes that will be a lot of
    //       decentralized rewrites. Something something concrete dependencies
    if (lastPathElement !== "subject_id") return "";

    return "invalidSubjectIdPattern";
  },

  parseInvalidSubjectIdType: (path, validator) => {
    if (validator !== "type") return "";

    const lastPathElement = path[path.length - 1];

    if (lastPathElement !== "subject_id") return "";

    return "invalidSubjectIdType";
  },

  parseInvalidSpeciesAnyOf: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.ANY_OF) {
      return "";
    }

    if (!path) return "";

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "species") {
      return "";
    }

    return "invalidSpeciesAnyOf";
  },

  parseInvalidContributorNamePattern: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.PATTERN) return "";

    let lastElement = path[path.length - 1];

    if (lastElement !== "contributor_name") {
      return "";
    }

    return "invalidContributorNamePattern";
  },

  parseInvalidFundingType: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.TYPE) {
      return "";
    }

    // check if path contains funding b/c when dealing with funding type
    // all the ways I have checked before will not work (different format for path)
    if (!path.includes("funding")) {
      return "";
    }

    return "invalidFundingType";
  },

  parseInvalidAcknowledgmentsType: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.TYPE) return "";

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "acknowledgments") {
      return "";
    }

    return "invalidAcknowledgmentsType";
  },

  parseAdditionalPropertiesDatasetDescription: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.ADDITIONAL_PROPERTIES) {
      return "";
    }

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "dataset_description_file") {
      return "";
    }

    return "datasetDescriptionAdditionalProperties";
  },

  parseInvalidContributorAffiliationAnyOf: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.ANY_OF) return "";

    if (!path) return "";

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "contributor_affiliation") {
      return "";
    }

    return "contributorAffiliationAnyOf";
  },

  // May be (this along with other Contains errors) one of the harder ones to figure out how to generalize.
  // The validator will always have 'contributors' in the schema_path (not the same as path)
  // so perhaps between all of the different fields that can have a contains error
  // looking into schema path when validator === contains will be the key?
  // Another piece of variabiality is the errorMessage itself. For contains it is broken up into
  // objects that are parsed in as strings. So separating out all of the fields and keys is going
  // to require a somewhat involved function. For now I'm just going to
  // log the whole error message and work on the human readbility
  parseInvalidContributorInformationContains: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.CONTAINS) return "";

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "contributors") return "";

    return "invalidContributorsContains";
  },

  parseInvalidIdentifierDescriptionType: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.TYPE) return "";

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "related_identifier_description") return "";

    return "invalidIdentifierDescriptionType";
  },

  parseInvalidRelationTypeEnum: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.ENUM) return "";

    let lastElementOfPath = path[path.length - 1];

    if (lastElementOfPath !== "relation_type") return "";

    return "invalidRelationTypeEnum";
  },

  parseMissingRelatedIdentifier: (errorMessage) => {
    if (errorMessage !== "'related_identifier' is a required property") return "";

    return "missingRelatedIdentifier";
  },

  parseMissingRelatedIdentifierType: (errorMessage) => {
    if (errorMessage !== "'related_identifier_type' is a required property") {
      return "";
    }

    return "missingRelatedIdentifierType";
  },
};

exports.ValidationErrorParser = ValidationErrorParser;

//"None of
// [{'contributor_name': 'Jeff, Salisbury',
// 'contributor_affiliation': '<', 'contributor_role': ['PrincipalInvestigator']},
// {'contributor_role': ['CorrespondingAuthor']}] are valid under the given schema"

/*

"None of [{'contributor_name': 'Jeff, Salisbury', 'contributor_affiliation': '<', 
          'contributor_role': ['PrincipalInvestigator']}, 
          {'contributor_role': ['CorrespondingAuthor']}] are valid under the given schema"


"None of [{'contributor_name': 'Jeff, Salisbury', 'contributor_affiliation': '<', 
        'contributor_role': ['PrincipalInvestigator'], 'first_name': 'Salisbury', 
        'last_name': 'Jeff', 
        'id': 'file:///C:/Users/CMarroquin/temp-datasets/DatasetTemplate/contributors/Salisbury-Jeff'}, 
        {'contributor_name': 'Wallop, San', 'contributor_affiliation': '>>', 
        'contributor_role': ['CorrespondingAuthor'], 'first_name': 'San', 'last_name': 'Wallop', 
        'id': 'file:///C:/Users/CMarroquin/temp-datasets/DatasetTemplate/contributors/San-Wallop'}] 
        are valid under the given schema"

*/
