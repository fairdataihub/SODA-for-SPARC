// determine if we are working with a Local, Saved, or Pennsieve dataset in the current Curation flow
const determineDatasetLocation = () => {
  let location = "";
  let datasetLocation = sodaJSONObj?.["starting-point"]?.["type"];
  console.log("datasetLocation: ", datasetLocation);
  if("save-progress" in sodaJSONObj) {
    return Destinations.SAVED;
  }
  if (datasetLocation === "bf") {
    return Destinations.PENNSIEVE;
  }
  if (datasetLocation === "local" || datasetLocation === "Local") {
    return Destinations.LOCAL;
  }

  // determine if we are using a local or Pennsieve dataset
  // This is checking for destination no? Not starting point
  // Above if statements seem to return before this is reached though
  if ("bf-dataset-selected" in sodaJSONObj) {
    location = Destinations.PENNSIEVE;
  } else if (sodaJSONObj?.["generate-dataset"]?.["destination"] != undefined){
    location = sodaJSONObj?.["generate-dataset"]?.["destination"].toUpperCase();
    if (location === "LOCAL") {
      location = Destinations.LOCAL;
    }
    if (location === "PENNSIEVE") {
      location = Destinations.SAVED;
    }
  }

  return location;
};

module.exports = { determineDatasetLocation };
