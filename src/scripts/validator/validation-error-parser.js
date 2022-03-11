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
  },

  parseInvalidDatasetId: (errorMessage, path, validator, pipeline) => {
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
  },

  parseInvalidOrganization: (errorMessage, path, validator, pipeline) => {
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

  // dataset description 1.2.3 requires a name property. This has been superceded by 'title' in 2.0.0
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

  parseMissingSpecies: (errorMessage) => {
    if (errorMessage === "'species' is a required property") {
      return "missingSpecies";
    }

    return "";
  },

  parseInvalidSpeciesAnyOf: (path, validator) => {
    if (validator !== VALIDATOR_CATEGORIES.ANY_OF) {
      return "";
    }

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
};

exports.ValidationErrorParser = ValidationErrorParser;
