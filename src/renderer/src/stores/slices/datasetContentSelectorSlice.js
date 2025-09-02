import useGlobalStore from "../globalStore";

// Define the slice with just the state properties
export const datasetContentSelectorSlice = (set, get) => ({
  selectedEntities: [],
  deSelectedEntities: [],
  selectedHierarchyEntity: null,
  currentSelectedHierarchyEntityParentSubject: null,
  currentSelectedHierarchyEntityParentSample: null,
});

export const setSelectedEntities = (selectedEntities) => {
  useGlobalStore.setState({ selectedEntities });
};

export const setDeSelectedEntities = (deSelectedEntities) => {
  useGlobalStore.setState({ deSelectedEntities });
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
      console.error("Unknown entity type:", entityObj?.type);
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
