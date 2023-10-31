const createEventDataPrepareMetadata = (destination, value) => {
  if (destination === "Pennsieve") {
    return {
      value,
      destination: "Pennsieve",
      dataset_name: defaultBfDataset,
      dataset_id: defaultBfDatasetId,
    };
  }

  return {
    value,
    destination,
  };
};

export default createEventDataPrepareMetadata

