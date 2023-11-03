const createEventDataPrepareMetadata = (destination, value) => {
  if (destination === "Pennsieve") {
    return {
      value,
      destination: "Pennsieve",
      dataset_name: window.defaultBfDataset,
      dataset_id: window.window.defaultBfDatasetId,
    };
  }

  return {
    value,
    destination,
  };
};

module.exports = {
  createEventDataPrepareMetadata,
};
