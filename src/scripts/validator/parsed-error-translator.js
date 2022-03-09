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

  translateMissingSubjects: () => {
    return [
      "Your dataset description file is missing a 'number_of_subjects' column/field",
      "Fix this by adding a 'number_of_subjects' field/column to your dataset description file.",
      "URL: path to SODA",
    ];
  },

  translateMissingSamples: () => {
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
};

exports.ParsedErrorTranslator = ParsedErrorTranslator;
