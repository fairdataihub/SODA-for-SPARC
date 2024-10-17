const initialState = {
  datasetStructureJSONObj: null,
  manifestEntityStructure: {},
};

export const manifestEntitySelectorSlice = (set) => ({
  ...initialState,
  resetManifestEntitySelectorState: () => {
    set(() => ({
      ...initialState,
    }));
  },
  setDatasetStructureJSONObj: (datasetStructureJSONObj) => {
    set((state) => ({
      ...state,
      datasetStructureJSONObj,
    }));
  },
});
