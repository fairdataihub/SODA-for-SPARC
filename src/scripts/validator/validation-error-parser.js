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
      if(errorMessage === "'title' is a required property") {
          return "missingTitle"
      }

      return ""
  },

  parseMissingSubjects: (errorMessage) => {
    if(errorMessage === "'number_of_subjects' is a required property") {
        return "missingSubjects"
    }

    return ""
  },

  parseMissingSamples: (errorMessage) => {
    if(errorMessage === "'number_of_samples' is a required property") {
        return "missingSamples"
    }

    return ""
  }
};

exports.ValidationErrorParser = ValidationErrorParser;
