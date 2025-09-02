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
      console.log("entityObj for sample", entityObj);
      setCurrentSelectedHierarchyEntityParentSubject(entityObj?.metadata?.subject_id);
      setCurrentSelectedHierarchyEntityParentSample(null);
      break;

    case "site":
      setCurrentSelectedHierarchyEntityParentSubject(entityObj?.metadata?.subject_id);
      setCurrentSelectedHierarchyEntityParentSample(entityObj?.metadata?.sample_id);
      break;

    default:
      console.log("Unknown entity type:", entityObj?.type);
  }
};

export const setCurrentSelectedHierarchyEntityParentSubject = (subjectId) => {
  console.log("Setting currentSelectedHierarchyEntityParentSubject to:", subjectId);
  useGlobalStore.setState({
    currentSelectedHierarchyEntityParentSubject: subjectId,
  });
};

export const setCurrentSelectedHierarchyEntityParentSample = (sampleId) => {
  console.log("Setting currentSelectedHierarchyEntityParentSample to:", sampleId);
  useGlobalStore.setState({
    currentSelectedHierarchyEntityParentSample: sampleId,
  });
};
