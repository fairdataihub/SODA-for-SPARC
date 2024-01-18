export const Destinations = {
  LOCAL: "Local",
  PENNSIEVE: "Pennsieve",
  SAVED: "Saved",
  NEW: "New",
};

// determine if we are working with a Local, Saved, or Pennsieve dataset in the current Curation flow
const determineDatasetLocation = () => {
  let location = "";
  let datasetLocation = window.sodaJSONObj?.["starting-point"]?.["type"];
  if ("save-progress" in window.sodaJSONObj) {
    return Destinations.SAVED;
  }
  if (datasetLocation === "bf") {
    return Destinations.PENNSIEVE;
  }
  if (
    datasetLocation === "local" ||
    datasetLocation === "Local" ||
    window.sodaJSONObj?.["starting-point"]?.["local-path"]
  ) {
    return Destinations.LOCAL;
  }
  if (datasetLocation === "new") {
    return Destinations.NEW;
  }

  return location;
};

export default determineDatasetLocation;
