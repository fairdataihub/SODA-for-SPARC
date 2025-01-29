import useGlobalStore from "../globalStore";

export const datasetContentSelectorSlice = (set) => ({
  selectedEntities: [],
});

export const getSelectedEntities = (state) => state.selectedEntities;

export const setSelectedEntities = (selectedEntities) => {
  useGlobalStore.setState({
    selectedEntities,
  });
};

export const toggleEntitySelection = (entity) => {
  useGlobalStore.setState((state) => {
    const updatedSelectedEntities = [...state.selectedEntities];
    const entityIndex = updatedSelectedEntities.indexOf(entity);

    if (entityIndex === -1) {
      updatedSelectedEntities.push(entity);
    } else {
      updatedSelectedEntities.splice(entityIndex, 1);
    }

    return {
      ...state,
      selectedEntities: updatedSelectedEntities,
    };
  });
};
