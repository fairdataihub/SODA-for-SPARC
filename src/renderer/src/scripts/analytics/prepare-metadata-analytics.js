const createEventDataPrepareMetadata = (destination, value) => {
  if (destination === "Pennsieve") {
    return {
      value,
      destination: "Pennsieve",
      dataset_name: window.defaultBfDataset,
      dataset_id: window.defaultBfDatasetId,
      dataset_int_id: window.defaultBfDatasetIntId,
    };
  }

  return {
    value,
    destination,
  };
};

export default createEventDataPrepareMetadata;
