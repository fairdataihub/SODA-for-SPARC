// determine if we are working with a Local, Saved, or Pennsieve dataset in the current Curation flow
function determineDatasetLocation() {
  let location = "";

  if ("starting-point" in sodaJSONObj) {
    // determine if the local dataset was saved or brought imported
    if ("type" in sodaJSONObj["starting-point"]) {
      //if save-progress exists then the user is curating a previously saved dataset
      if ("save-progress" in sodaJSONObj) {
        location = Destinations.SAVED;
        return location;
      } else {
        location = sodaJSONObj["starting-point"]["type"];
        // bf === blackfynn the old name for Pennsieve; bf means dataset was imported from Pennsieve
        if (location === "bf") {
          return Destinations.PENNSIEVE;
        } else if (location === "local" || location === "Local") {
          // imported from the user's machine
          return Destinations.LOCAL;
        } else {
          // if none of the above then the dataset is new
          return Destinations.NEW;
        }
      }
    }
  }

  // determine if we are using a local or Pennsieve dataset
  if ("bf-dataset-selected" in sodaJSONObj) {
    location = Destinations.PENNSIEVE;
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      location = sodaJSONObj["generate-dataset"]["destination"];
      if (location.toUpperCase() === "LOCAL") {
        location = Destinations.LOCAL;
      } else if (location.toUpperCase() === "PENNSIEVE") {
        location = Destinations.SAVED;
      }
    }
  }

  return location;
}

module.exports = { determineDatasetLocation };
