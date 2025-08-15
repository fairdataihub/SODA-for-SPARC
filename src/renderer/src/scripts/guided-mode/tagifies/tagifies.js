import Tagify from "@yaireo/tagify/dist/tagify.esm.js";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const guidedDatasetKeyWordsInput = document.getElementById("guided-ds-dataset-keywords");
export const guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeyWordsInput, {
  duplicates: false,
  maxTags: 5,
});
const guidedOtherFundingSourcesInput = document.getElementById("guided-ds-other-funding");
export const guidedOtherFundingsourcesTagify = new Tagify(guidedOtherFundingSourcesInput, {
  duplicates: false,
});
window.createDragSort(guidedOtherFundingsourcesTagify);
const guidedStudyOrganSystemsInput = document.getElementById("guided-ds-study-organ-system");
export const guidedStudyOrganSystemsTagify = new Tagify(guidedStudyOrganSystemsInput, {
  whitelist: [
    "autonomic ganglion",
    "brain",
    "colon",
    "heart",
    "intestine",
    "kidney",
    "large intestine",
    "liver",
    "lower urinary tract",
    "lung",
    "nervous system",
    "pancreas",
    "peripheral nervous system",
    "small intestine",
    "spinal cord",
    "spleen",
    "stomach",
    "sympathetic nervous system",
    "urinary bladder",
  ],
  duplicates: false,
  dropdown: { maxItems: Infinity, enabled: 0, closeOnSelect: true },
});
window.createDragSort(guidedStudyOrganSystemsTagify);

window.createDragSort(guidedDatasetKeywordsTagify);

const guidedStudyApproachInput = document.getElementById("guided-ds-study-approach");
export const guidedStudyApproachTagify = new Tagify(guidedStudyApproachInput, {
  duplicates: false,
});
window.createDragSort(guidedStudyApproachTagify);

const guidedStudyTechniquesInput = document.getElementById("guided-ds-study-technique");
export const guidedStudyTechniquesTagify = new Tagify(guidedStudyTechniquesInput, {
  duplicates: false,
});
window.createDragSort(guidedStudyTechniquesTagify);
