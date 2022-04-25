/*
Purpose: A dictionary/object with translations for a particular (or form of in some more dynamic cases) validator error. The errors are 
         translated into a human readable format that describes what the error is, how to fix it, and when applicable, a link to a place in SODA
         where that error can be fixed.


*/

const ParsedErrorTranslator = {
  translateMissingSubmission: () => {
    return [
      "You are missing a top level submission file",
      "Fix this by creating a top level submission file for your dataset",
      "URL: fix.SODA.page",
    ];
  },

  translateMissingAwardNumber: () => {
    return [
      "Your Submission file is missing an award number",
      "Fix this by visiting your submission file and adding an award number",
      "URL: fix.SODA.page",
    ];
  },

  translateMissingOrganSystem: () => {
    return [
      "Your dataset description file is missing information on the organ system of the study",
      "Fix this by visiting your dataset description file and adding an organ system field/column with appropriate data",
      "URL: fix.SODA.page",
    ];
  },

  translateMissingModality: () => {
    return [
      "Your dataset description file is missing information on the modality of the study",
      "Fix this by visiting your dataset description file and adding a modality field/column with the appropriate information",
      "URL: fix.SODA.page",
    ];
  },

  translateMissingTechnique: () => {
    return [
      "Your dataset description file is missing information on the techniques used in the study",
      "Fix this by visiting your dataset description file and adding a study technique column/field with the appropriate information",
      "URL: fix.SODA.page",
    ];
  },

  translateMissingTechniqueValues: () => {
    return [
      "Your dataset description file's techniques field/column is missing study techniques.",
      "Fix this by visiting your dataset description file and adding at least one study technique in the 'Study technique' field/column.",
      "URL: fix.SODA.page",
    ];
  },

  // TODO: Make it match Local or Pennsieve url/name for the error message translation.
  // TODO: Take out idk lol
  translateIncorrectDatasetName: () => {
    return [
      "Your dataset's name/package does not match expectations of the Pennsieve platform/local datasets",
      "Fix this by changing your dataset's name if this is about your dataset. If not idk lol",
      "URL: fix.SODA.page",
    ];
  },

  translateInvalidDatasetId: () => {
    return [
      "Your Pennsieve dataset does not have a valid UUID",
      "Fix this by contacting the Pennsieve team using the 'Get Help' sidebar menu option.",
      "URL: fpath to Pennsieve",
    ];
  },

  translateInvalidOrganization: () => {
    return [
      "Your organization ID is invalid",
      "Fix this by contacting the Pennsieve team using the 'Get Help' sidebar menu option.",
      "URL: fpath to Pennsieve",
    ];
  },

  translateMissingFunding: () => {
    return [
      "Your dataset description file is missing a Funding field/column",
      "Fix this by adding a Funding field/column to your dataset description column.",
      "URL: path to SODA",
    ];
  },

  translateMissingProtocolUrlOrDoi: () => {
    return [
      "Your samples file is missing a 'protocol url or doi' column/field",
      "Fix this by adding a 'protocol url or doi' field/column to your samples file.",
      "URL: path to SODA",
    ];
  },

  translateMissingTitle: () => {
    return [
      "Your dataset description file is missing a 'title' column/field",
      "Fix this by adding a 'title' field/column to your dataset description file.",
      "URL: path to SODA",
    ];
  },

  translateMissingNumberOfSubjects: () => {
    return [
      "Your dataset description file is missing a 'number_of_subjects' column/field",
      "Fix this by adding a 'number_of_subjects' field/column to your dataset description file.",
      "URL: path to SODA",
    ];
  },

  translateMissingNumberOfSamples: () => {
    return [
      "Your dataset description file is missing a 'number_of_samples' column/field",
      "Fix this by adding a 'number_of_samples' field/column to your dataset description file.",
      "URL: path to SODA",
    ];
  },

  translateInvalidContributorRole: (errorMessage) => {
    // get the contributor role values that are marked as incorrect from the error message
    let searchForContributorValues = /\['*.'\]/g;

    let invalidContributorValues =
      searchForContributorValues.match(errorMessage);

    let errorExplanation = "";
    // handle the case where no contributors are found
    if (!invalidContributorValues.length) {
      errorExplanation =
        "Your dataset description file has invalid contributor role values.";
    } else {
      errorExplanation = `Your dataset description file has these invalid contributor role values: ${invalidContributorValues.join(
        ","
      )}`;
    }

    return [
      errorExplanation,
      "To fix, select one of the valid contributor role values provided by data cite. SODA makes this easy.",
      "URL: Path to SODA",
    ];
  },

  // used in SDS 1.2.3 for dataset description file
  translateMissingName: (errorMessage) => {
    return [
      "Your dataset description file is missing a 'name' column/field",
      "Fix this by adding a 'name' field/column to your dataset description file.",
      "URL: path to SODA",
    ];
  },

  // used in SDS 1.2.3 for dataset description file
  translateMissingDescription: () => {
    return [
      "Your dataset 'description' file is missing a description field/column.",
      "Fix this by adding a 'description' field/column to your dataset description file.",
      "URL: path to SODA",
    ];
  },

  translateMissingSamples: () => {
    return [
      "Your dataset does not have a samples file",
      "To fix this add a samples file and fill in at least one row of required fields.",
      "URL: path to SODA",
    ];
  },

  translateMissingSubjects: () => {
    return [
      "Your dataset does not have a subjects file",
      "To fix this add a subjects file and fill in at least one row of required fields.",
      "URL: path to SODA",
    ];
  },

  translateInvalidSubjectIdPattern: (errorMessage) => {
    // get the user's invalid subject id out of the error message
    // TODO: Make a function that pulls the invalid parameter(s?) out of an error message. I want to show the user what is actually invalid, but since they're returned in the string rather than a list or some other
    //       easily accessible container I'll need to access the parameter by the string's features. These may change. If I do this in a lot of the pattern errors this may result in a lot of changes to deal with.
    let searchForTextFollowingId = /does not match/;

    let indexOfTextFollowingId = searchForTextFollowingId.exec(errorMessage);

    let errorExplanation = "";

    // handle there being no parameters found
    // happens if the regex is bad and doesn't find a result
    if (!indexOfTextFollowingId) {
      errorExplanation =
        "One of your Subject file's subject Ids has an invalid format";
    } else {
      let invalidId = errorMessage.slice(0, indexOfTextFollowingId).trim();
      errorExplanation = `Your subject file has this invalid subject id: ${invalidId}`;
    }

    return [
      errorExplanation,
      'To correct this problem ensure the subject id matches the relevant subject folder name. Ensure it is more than one letter, and that it does not have any of these invalid characters: <>/"\\',
      "URL: path to SODA",
    ];
  },

  translateInvalidSubjectIdType: (errorMessage) => {
    // get the user's invalid subject id out of the error message
    // TODO: Make a function that pulls the invalid parameter(s?) out of an error message. I want to show the user what is actually invalid, but since they're returned in the string rather than a list or some other
    //       easily accessible container I'll need to access the parameter by the string's features. These may change. If I do this in a lot of the pattern errors this may result in a lot of changes to deal with.
    let searchForTextFollowingId = /is not of type/;

    let indexOfTextFollowingId = searchForTextFollowingId.exec(errorMessage);

    let errorExplanation = "";

    // handle there being no parameters found
    // happens if the regex is bad and doesn't find a result
    if (!indexOfTextFollowingId) {
      errorExplanation =
        "One of your Subject file's subject Ids is not formatted as a string";
    } else {
      let invalidId = errorMessage.slice(0, indexOfTextFollowingId).trim();
      errorExplanation = `Your subject file has this ill-formed subject id: ${invalidId}`;
    }

    return [
      errorExplanation,
      "To correct this problem change the invalid subject ID to be formatted as a string rather than a number.",
      "URL: path to SODA",
    ];
  },

  translateMissingSpecies: () => {
    return [
      "Your subjects file is missing a species field/column, or a value for said field/column",
      "Fix this by adding a species field/column if not existing, and adding a valid value.",
      "URL: path to SODA",
    ];
  },

  // TODO: when multiple species are invalid we get back an array in the string rather than just a single param
  //       format this? Probably not but I'll think about it.
  translateInvalidSpeciesAnyOf: (errorMessage) => {
    let searchForTextFollowingSpeciesValue =
      /is not valid under any of the given schemas/;

    let indexOfTextFollowingSpeciesValue =
      searchForTextFollowingSpeciesValue.exec(errorMessage);

    let errorExplanation = "";

    if (!indexOfTextFollowingSpeciesValue) {
      errorExplanation =
        "Your subjects file has an invalid value for one of the species fields/rows.";
    } else {
      let invalidSpecies = errorMessage.slice(
        0,
        indexOfTextFollowingSpeciesValue
      );
      errorExplanation = `Your subjects file has the following invalid species: ${invalidSpecies}`;
    }

    return [
      errorExplanation,
      "To correct this problem change the invalid species field",
    ];
  },

  translateInvalidContributorNamePattern: (errorMessage) => {
    let searchForTextFollowingContributorName = /does not match/;

    let indexOfTextFollowingContributorNameValue =
      searchForTextFollowingContributorName.exec(errorMessage);

    let errorExplanation = "";

    if (!indexOfTextFollowingContributorNameValue) {
      errorExplanation =
        "Your dataset description file has an invalid value for one of the contributor name fields";
    } else {
      let invalidContributorName = errorMessage.slice(
        0,
        indexOfTextFollowingContributorNameValue
      );
      errorExplanation = `Your dataset description file has the following invalid contributor name: ${invalidContributorName}`;
    }

    return [
      errorExplanation,
      "To correct this problem change the contributor name to be a Last, First format.",
      "URL: Path to SODA",
    ];
  },

  translateInvalidFundingType: () => {
    return [
      "Your dataset description file's funding field/column is invalid",
      "To fix this, ensure your grant number is the value for the funding field/column.",
      "URL: Path to SODA",
    ];
  },

  translateAdditionalPropertiesDatasetDescription: (errorMessage) => {
    let findAdditionalPropertiesRegExp = /\(/;

    let additionalPropertiesIndex =
      findAdditionalPropertiesRegExp.exec(errorMessage);

    let errorExplanation = "";

    if (!additionalPropertiesIndex) {
      errorExplanation =
        "Your dataset description file has additional properties";
    } else {
      let additionalProperties = errorExplanation.slice(
        additionalPropertiesIndex
      );
      errorMessage = `Your dataset description file has additional properties: ${additionalProperties}`;
    }

    return [
      errorExplanation,
      "To fix this issue ensure your metadata version number aligns with the headers in your dataset description file. Version options are 1.2.3 or 2.0.0.",
      "URL: Path to SODA",
    ];
  },

  translateContributorAffiliationAnyOf: (errorMessage) => {
    let searchForTextFollowingAffiliationValue =
      /is not valid under any of the given schemas/;

    let textFollowingAffiliationIdx =
      searchForTextFollowingAffiliationValue.exec(errorMessage);

    let errorExplanation = "";

    if (!textFollowingAffiliationIdx) {
      errorExplanation =
        "Your dataset description file has invalid entries for the Contributor affiliation field/column.";
    } else {
      let invalidContributorAffiliations = errorMessage.slice(
        0,
        textFollowingAffiliationIdx
      );
      errorExplanation = `Your dataset description file has the following invalid entries for the Contributor affiliation row/field: ${invalidContributorAffiliations}`;
    }

    return [
      errorExplanation,
      "To fix this issue ensure your contributor affiliation entries are all formatted as strings.",
      "URL: Path to SODA",
    ];
  },

  translateInvalidContributorsContains: (errorMessage) => {
    return [
      "Your dataset description file has invalid contributor information",
      "To fix ensure that all contributor information is valid by the SPARC SDS that matches your version number",
      "URL: Path to SODA",
    ];
  },

  translateInvalidIdentifierDescriptionType: (errorMessage) => {
    let searchForTextFollowingDescriptionParam = /is not of type/;

    let indexOfTextFollowingDescriptionParam =
      searchForTextFollowingDescriptionParam.exec(errorMessage);

    let errorExplanation = "";

    if (!indexOfTextFollowingDescriptionParam) {
      errorExplanation =
        "Your dataset description file has invalid entries for the 'Identifier description' field/row.";
    } else {
      let invalidEntry = errorMessage.slice(
        0,
        indexOfTextFollowingDescriptionParam
      );
      errorExplanation = `Your dataset description file has this invalid entry for the 'Identifier description' field: ${invalidEntry}`;
    }

    return [
      errorExplanation,
      "To fix the issue ensure your 'identifier description' fields are formatted as strings that are accurate descriptions of the referent of the related identifier",
      "URL: Path to SODA",
    ];
  },

  translateInvalidRelationTypeEnum: (errorMessage) => {
    // TODO: Double check this string match
    let searchForTextFollowingInvalidRelationType = /is not one of/;

    let idxForTextFollowingInvalidRelationType =
      searchForTextFollowingInvalidRelationType.exec(errorMessage);

    let errorExplanation = "";
    if (!idxForTextFollowingInvalidRelationType) {
      errorExplanation =
        "Your dataset description file has invalid entries for the 'relation type' field/row.";
    } else {
      let invalidEntries = errorMessage.slice(
        0,
        idxForTextFollowingInvalidRelationType
      );
      errorExplanation = `Your dataset description file has the following invalid entries: ${invalidEntries}`;
    }

    return [
      errorExplanation,
      "To fix this issue use one of the valid 'relation type' values outlined in the SPARC SDS.",
      "URL: Path to SODA",
    ];
  },

  translateMissingRelatedIdentifiers: () => {
    let errorExplanation = "";

    errorExplanation =
      "Your dataset description file is missing a required 'identifier' entry.";

    return [
      errorExplanation,
      "To fix this ensure that all of your 'identifier' fields/rows have a value.",
      "URL: Path to SODA",
    ];
  },

  translateMissingRelatedIdentifierType: () => {
    let errorExplanation =
      "Your description file missing a required 'identifier type' entry";

    return [
      errorExplanation,
      "To fix this ensure that all of your 'identifier type' fields/rows have a value.",
      "URL: Path to SODA",
    ];
  },

  /*
    @param missingField string : represents the required field that was missing from the user's metadata files
    @param metadataFile string : the metadata file that the given missing field belongs to 
  */
  translateMissingRequiredProperties: (missingField, metadataFile) => {
    let errorExplanation = "";
    let errorSolution = "";

    // check if missing field was not provided
    if (!missingField) {
      // the user is missing a required metadata file; not a metadata field
      errorExplanation = `You are missing this required metadata file: ${metadataFile}`;
      errorSolution = `To fix this problem, please create a ${metadataFile} file and/or fill it out according to SDS 2.0.0`;
    } else {
      errorExplanation = `Your ${metadataFile} is missing this required field: ${missingField}`;
      errorSolution = `To fix this problem, please add the ${missingField} to the ${metadataFile}.`;
    }

    // TODO: Add code that uses metadata file to give the correct path to where this can be modified in SDOA
    let pathToSoda = "URL: Path to SODA";

    return [errorExplanation, errorSolution, pathToSoda];
  },
};

exports.ParsedErrorTranslator = ParsedErrorTranslator;
