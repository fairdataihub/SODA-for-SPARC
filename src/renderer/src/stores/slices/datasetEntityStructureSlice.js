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

export const setDatasetEntityArray = (datasetEntityArray) => {
  useGlobalStore.setState({
    datasetEntityArray,
  });
};

export const deleteSubject = (subjectId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.filter(
    (subject) => subject.subjectId !== subjectId
  );
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const getDatasetEntityArray = () => {
  return useGlobalStore.getState().datasetEntityArray;
};
