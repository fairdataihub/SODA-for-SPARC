import useGlobalStore from "../globalStore";

// Define the slice with just the state properties
export const datasetContentSelectorSlice = (set, get) => ({
  selectedEntities: [],
  deSelectedEntities: [],
  selectedDataCategories: [],
  deSelectedDataCategories: [],
  selectedHierarchyEntity: null,
  currentSelectedHierarchyEntityParentSubject: null,
  currentSelectedHierarchyEntityParentSample: null,
  selectedDataCategoriesByEntityType: {},
});

export const setSelectedDataCategoriesByEntityType = (selectedDataCategoriesByEntityType) => {
  useGlobalStore.setState({ selectedDataCategoriesByEntityType });
};

export const addSelectedDataCategoryForEntityType = (entityType, dataCategory) => {
  const currentState = useGlobalStore.getState();
  const updatedMap = { ...currentState.selectedDataCategoriesByEntityType };

  if (!updatedMap[entityType]) {
    updatedMap[entityType] = [];
  }
  if (!updatedMap[entityType].includes(dataCategory)) {
    updatedMap[entityType] = [...updatedMap[entityType], dataCategory];
  }

  useGlobalStore.setState({ selectedDataCategoriesByEntityType: updatedMap });
};

export const getOxfordCommaSeperatedListOfEntities = (separator) => {
  const selectedEntities = useGlobalStore.getState().selectedEntities || [];
  const hierarchyEntities = selectedEntities.filter((entity) =>
    ["subjects", "samples", "sites"].includes(entity)
  );

  if (!hierarchyEntities || hierarchyEntities.length === 0) return "";
  if (hierarchyEntities.length === 1) return hierarchyEntities[0];

  const finalSeparator = separator || " or ";
  if (hierarchyEntities.length === 2) return hierarchyEntities.join(finalSeparator);
  return (
    hierarchyEntities.slice(0, -1).join(", ") +
    "," +
    finalSeparator +
    hierarchyEntities[hierarchyEntities.length - 1]
  );
};

export const removeSelectedDataCategoryForEntityType = (entityType, dataCategory) => {
  const currentState = useGlobalStore.getState();
  const updatedMap = { ...currentState.selectedDataCategoriesByEntityType };

  if (updatedMap[entityType]) {
    updatedMap[entityType] = updatedMap[entityType].filter((cat) => cat !== dataCategory);
    if (updatedMap[entityType].length === 0) {
      delete updatedMap[entityType];
    }
  }

  useGlobalStore.setState({ selectedDataCategoriesByEntityType: updatedMap });
};

export const getSelectedDataCategoriesByEntityType = (entityType) => {
  const selectedDataCategoriesByEntityType =
    useGlobalStore.getState().selectedDataCategoriesByEntityType || {};
  return selectedDataCategoriesByEntityType[entityType] || [];
};

export const setSelectedEntities = (selectedEntities) => {
  useGlobalStore.setState({ selectedEntities });
};

export const setDeSelectedEntities = (deSelectedEntities) => {
  useGlobalStore.setState({ deSelectedEntities });
};

export const setSelectedDataCategories = (selectedDataCategories) => {
  useGlobalStore.setState({ selectedDataCategories });
};

export const setDeSelectedDataCategories = (deSelectedDataCategories) => {
  useGlobalStore.setState({ deSelectedDataCategories });
};

export const setSelectedHierarchyEntity = (entityObj) => {
  useGlobalStore.setState({ selectedHierarchyEntity: entityObj });

  switch (entityObj?.type) {
    case "subject":
      setCurrentSelectedHierarchyEntityParentSubject(null);
      setCurrentSelectedHierarchyEntityParentSample(null);
      break;

    case "sample":
      setCurrentSelectedHierarchyEntityParentSubject(entityObj?.metadata?.subject_id);
      setCurrentSelectedHierarchyEntityParentSample(null);
      break;

    case "site":
      setCurrentSelectedHierarchyEntityParentSubject(entityObj?.metadata?.subject_id);
      setCurrentSelectedHierarchyEntityParentSample(entityObj?.metadata?.sample_id);
      break;

    default:
      setCurrentSelectedHierarchyEntityParentSubject(null);
      setCurrentSelectedHierarchyEntityParentSample(null);
      break;
  }
};

export const setCurrentSelectedHierarchyEntityParentSubject = (subjectId) => {
  useGlobalStore.setState({
    currentSelectedHierarchyEntityParentSubject: subjectId,
  });
};

export const setCurrentSelectedHierarchyEntityParentSample = (sampleId) => {
  useGlobalStore.setState({
    currentSelectedHierarchyEntityParentSample: sampleId,
  });
};
