// determine if we are working with a Local, Saved, or Pennsieve dataset in the current Curation flow
const determineDatasetLocation = () => {
  let location = "";
  let datasetLocation = sodaJSONObj?.["starting-point"]?.["type"];
  console.log("datasetLocation: ", datasetLocation);
  if ("save-progress" in sodaJSONObj) {
    return Destinations.SAVED;
  }
  if (datasetLocation === "bf") {
    return Destinations.PENNSIEVE;
  }
  if (
    datasetLocation === "local" ||
    datasetLocation === "Local" ||
    "local-path" in sodaJSONObj?.["starting-point"]
  ) {
    return Destinations.LOCAL;
  }
  if (datasetLocation === "new") {
    return Destinations.NEW;
  }

  return location;
};

module.exports = { determineDatasetLocation };
