import useGlobalStore from "../globalStore";

export const datasetEntityStructureSlice = (set) => ({
  datasetEntityStructure: { subjects: [] },
});

export const setZustandStoreDatasetEntityStructure = (datasetEntityStructure) => {
  useGlobalStore.setState({
    datasetEntityStructure,
  });
};

export const getZustandStoreDatasetEntityStructure = () => {
  return useGlobalStore.getState().datasetEntityStructure;
};
