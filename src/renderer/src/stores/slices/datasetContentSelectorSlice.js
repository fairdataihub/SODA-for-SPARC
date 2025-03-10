import useGlobalStore from "../globalStore";

export const datasetContentSelectorSlice = (set) => ({
  selectedEntities: [],
  selectedHierarchyEntity: null,
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

/**
 * Sets the currently selected hierarchy entity using a flat structure
 * @param {Object} entityObj - The flattened entity object
 * @param {string} entityObj.entityType - Type of entity (subject, sample, site, performance)
 * @param {string} entityObj.entityId - ID of the entity
 * @param {string} [entityObj.parentType] - Type of parent entity, if applicable
 * @param {string} [entityObj.parentId] - ID of parent entity, if applicable
 * @param {string} [entityObj.grandParentType] - Type of grandparent entity, if applicable
 * @param {string} [entityObj.grandParentId] - ID of grandparent entity, if applicable
 */
export const setSelectedHierarchyEntity = (entityObj) => {
  useGlobalStore.setState({
    selectedHierarchyEntity: entityObj,
  });
};
