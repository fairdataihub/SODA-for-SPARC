const createEventDataPrepareMetadata = (destination, value) => {
  if (destination === "Pennsieve") {
    return {
      value,
      destination: "Pennsieve",
      dataset_name: window.defaultBfDataset,
      dataset_id: window.defaultBfDatasetId,
    };
  }

  return {
    value,
    destination,
  };
};

export default createEventDataPrepareMetadata

