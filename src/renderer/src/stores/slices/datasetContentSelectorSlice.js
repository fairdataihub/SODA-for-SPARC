import useGlobalStore from "../globalStore";

// Define the slice with just the state properties
export const datasetContentSelectorSlice = (set, get) => ({
  selectedEntities: [],
  deSelectedEntities: [],
  selectedHierarchyEntity: null,
});

// Selectors
export const getSelectedEntities = (state) => state.selectedEntities;
export const getDeSelectedEntities = (state) => state.deSelectedEntities;
export const getSelectedHierarchyEntity = (state) => state.selectedHierarchyEntity;

// Actions
export const setEntitySelection = (entityId, isSelected) => {
  const { selectedEntities, deSelectedEntities } = useGlobalStore.getState();

  if (isSelected) {
    // Mark as selected (Yes)
    useGlobalStore.setState({
      selectedEntities: selectedEntities.includes(entityId)
        ? selectedEntities
        : [...selectedEntities, entityId],
      deSelectedEntities: deSelectedEntities.filter((id) => id !== entityId),
    });
  } else {
    // Mark as deselected (No)
    useGlobalStore.setState({
      deSelectedEntities: deSelectedEntities.includes(entityId)
        ? deSelectedEntities
        : [...deSelectedEntities, entityId],
      selectedEntities: selectedEntities.filter((id) => id !== entityId),
    });
  }
};

// Keep this for backward compatibility, but it might not be needed
export const toggleEntitySelection = (entityId) => {
  const { selectedEntities, deSelectedEntities } = useGlobalStore.getState();

  if (selectedEntities.includes(entityId)) {
    // If currently selected, mark as deselected
    setEntitySelection(entityId, false);
  } else if (deSelectedEntities.includes(entityId)) {
    // If currently deselected, clear both (neutral state)
    useGlobalStore.setState({
      selectedEntities: selectedEntities.filter((id) => id !== entityId),
      deSelectedEntities: deSelectedEntities.filter((id) => id !== entityId),
    });
  } else {
    // If neutral, mark as selected
    setEntitySelection(entityId, true);
  }
};

export const clearSelections = () => {
  useGlobalStore.setState({
    selectedEntities: [],
    deSelectedEntities: [],
  });
};

export const removeEntityAndDependents = (entityId) => {
  const { selectedEntities, deSelectedEntities } = useGlobalStore.getState();

  // Find dependent entities
  const dependentEntities = Object.entries(contentOptionsMap)
    .filter(
      ([key, option]) => option.dependsOn?.includes(entityId) && selectedEntities.includes(key)
    )
    .map(([key]) => key);

  // Process dependents recursively
  const allToRemove = [...dependentEntities];
  dependentEntities.forEach((depId) => {
    const moreDeps = removeEntityAndDependents(depId);
    allToRemove.push(...moreDeps);
  });

  // Update the state
  useGlobalStore.setState({
    selectedEntities: selectedEntities.filter((id) => id !== entityId && !allToRemove.includes(id)),
    deSelectedEntities: [
      ...deSelectedEntities.filter((id) => id !== entityId),
      entityId,
      ...allToRemove,
    ],
  });

  return allToRemove;
};

export const setSelectedEntities = (selectedEntities) => {
  useGlobalStore.setState({ selectedEntities });
};

export const setSelectedHierarchyEntity = (entityObj) => {
  useGlobalStore.setState({ selectedHierarchyEntity: entityObj });
};
