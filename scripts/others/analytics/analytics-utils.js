// determine if we are working with a Local, Saved, or Pennsieve dataset in the current Curation flow
const determineDatasetLocation = () => {
  let location = "";
  let datasetLocation = sodaJSONObj?.["starting-point"]?.["type"];
  if ("save-progress" in sodaJSONObj) {
    return Destinations.SAVED;
  }
  if (datasetLocation === "bf") {
    return Destinations.PENNSIEVE;
  }
  if (
    datasetLocation === "local" ||
    datasetLocation === "Local" ||
    sodaJSONObj?.["starting-point"]?.["local-path"]
  ) {
    return Destinations.LOCAL;
  }
  if (datasetLocation === "new") {
    return Destinations.NEW;
  }

  return location;
};

module.exports = { determineDatasetLocation };
