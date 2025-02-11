export const guidedGetDatasetId = (sodaJSON) => {
  let datasetId = sodaJSON?.["digital-metadata"]?.["pennsieve-dataset-id"];
  if (datasetId != undefined) {
    return datasetId;
  }

  return "None";
};

export const guidedGetDatasetName = (sodaJSON) => {
  let datasetName = sodaJSON?.["digital-metadata"]?.["name"];
  if (datasetName != undefined) {
    return datasetName;
  }

  return "None";
};

// Returns a boolean that indicates whether or not the user selected that the dataset is SPARC funded
export const datasetIsSparcFunded = () => {
  return (
    window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] === "SPARC"
  );
};

export const guidedGetDatasetOrigin = (sodaJSON) => {
  let datasetOrigin = sodaJSON?.["generate-dataset"]?.["generate-option"];
  if (datasetOrigin === "existing-bf") {
    // Dataset origin is from Pennsieve
    return "Pennsieve";
  }

  // Otherwise origin is new dataset
  return "New";
};
