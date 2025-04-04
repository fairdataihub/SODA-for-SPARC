import { guidedSkipPage, guidedUnSkipPage } from "../navigationUtils/pageSkipping";

export const openPageDatasetStructure = async (targetPageID) => {
  if (targetPageID === "guided-dataset-structure-intro-tab") {
    // Handle whether or not the spreadsheet importation page should be skipped
    // Note: this is done here to centralize the logic for skipping the page
    // The page is unskipped only if the user has not added any subjects,
    // indicated that they will be adding subjects, and the user is not starting from Pennsieve
    if (
      window.getExistingSubjectNames().length === 0 &&
      window.sodaJSONObj["starting-point"]["origin"] != "ps" &&
      window.sodaJSONObj["button-config"]["dataset-contains-subjects"] === "yes"
    ) {
      guidedUnSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    } else {
      guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    }
  }
};
