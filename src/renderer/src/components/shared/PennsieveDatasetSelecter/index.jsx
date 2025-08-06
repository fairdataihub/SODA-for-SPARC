import { Select } from "@mantine/core";

export const PennsieveDatasetSelecter = ({
  datasetOptions,
  selectedDataset,
  setSelectedDataset,
  isLoading,
}) => {
  return (
    <Select
      placeholder={isLoading ? "Loading datasets..." : "Select an existing dataset"}
      data={datasetOptions}
      value={selectedDataset}
      onChange={setSelectedDataset}
      searchable={!isLoading}
      clearable={!isLoading}
      disabled={isLoading}
      maxDropdownHeight={200}
      comboboxProps={{
        withinPortal: false,
        loading: isLoading,
      }}
    />
  );
};
