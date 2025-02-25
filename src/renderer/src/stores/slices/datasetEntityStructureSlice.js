import useGlobalStore from "../globalStore";

export const datasetEntityStructureSlice = (set) => ({
  speciesList: [],
  datasetEntityArray: [],
});

export const setSpeciesList = (speciesList) => {
  useGlobalStore.setState({
    speciesList,
  });
};

export const setDatasetEntityArray = (subjects) => {
  useGlobalStore.setState({
    subjects,
  });
};

export const setZustandStoreDatasetEntityStructure = (datasetEntityStructure) => {
  useGlobalStore.setState({
    datasetEntityStructure,
  });
};

export const getZustandStoreDatasetEntityStructure = () => {
  return useGlobalStore.getState().datasetEntityStructure;
};
