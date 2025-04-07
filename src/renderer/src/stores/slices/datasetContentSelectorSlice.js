import useGlobalStore from "../globalStore";

// Define the slice with just the state properties
export const datasetContentSelectorSlice = (set, get) => ({
  selectedEntities: [],
  deSelectedEntities: [],
  selectedHierarchyEntity: null,
});

export const setSelectedEntities = (selectedEntities) => {
  useGlobalStore.setState({ selectedEntities });
};

export const setDeSelectedEntities = (deSelectedEntities) => {
  useGlobalStore.setState({ deSelectedEntities });
};

export const setSelectedHierarchyEntity = (entityObj) => {
  useGlobalStore.setState({ selectedHierarchyEntity: entityObj });
};
