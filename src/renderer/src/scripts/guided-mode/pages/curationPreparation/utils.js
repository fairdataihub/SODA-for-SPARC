// Funding information (SDS3)
// model
// Subtitle and dataset name
export const getGuidedDatasetName = () => {
  return window.sodaJSONObj["digital-metadata"]["name"] || "";
};

export const getGuidedDatasetSubtitle = () => {
  return window.sodaJSONObj["digital-metadata"]["subtitle"] || "";
};
