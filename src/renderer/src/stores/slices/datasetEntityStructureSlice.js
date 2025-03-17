import { produce } from "immer";
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

// Subject management functions
export const addSubject = (subjectId) => {
  // Ensure subject ID starts with "sub-"
  const normalizedSubjectId = subjectId.trim().startsWith("sub-")
    ? subjectId.trim()
    : `sub-${subjectId.trim()}`;

  useGlobalStore.setState(
    produce((state) => {
      state.datasetEntityArray.push({
        id: normalizedSubjectId, // Changed from subjectId to id
        type: "subject", // Add type field to identify entity type
        metadata: {},
        samples: [],
        subjectSites: [],
        subjectPerformances: [],
      });
    })
  );
};

export const deleteSubject = (subjectId) => {
  useGlobalStore.setState(
    produce((state) => {
      state.datasetEntityArray = state.datasetEntityArray.filter(
        (subject) => subject.id !== subjectId // Changed from subjectId to id
      );
    })
  );
};

export const modifySubjectId = (oldSubjectId, newSubjectId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === oldSubjectId); // Changed from subjectId to id
      if (subject) {
        subject.id = newSubjectId; // Changed from subjectId to id
      }
    })
  );
};

export const getExistingSubjectIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.map((subject) => subject.id); // Changed from subjectId to id
};

// Sample management functions
export const addSampleToSubject = (subjectId, sampleId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject) {
        if (!subject.samples) subject.samples = [];
        subject.samples.push({
          id: sampleId, // Changed from sampleId to id
          type: "sample", // Add type field to identify entity type
          parentSubject: subject.id, // Add explicit reference to parent subject
          metadata: {},
          sites: [],
          performances: [],
        });
      }
    })
  );
};

export const deleteSampleFromSubject = (subjectId, sampleId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        subject.samples = subject.samples.filter((sample) => sample.id !== sampleId); // Changed from sampleId to id
      }
    })
  );
};

export const getExistingSampleIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) => subject.samples.map((sample) => sample.id)); // Changed from sampleId to id
};

export const modifySampleId = (subjectId, oldSampleId, newSampleId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject) {
        const sample = subject.samples.find((s) => s.id === oldSampleId); // Changed from sampleId to id
        if (sample) {
          sample.id = newSampleId; // Changed from sampleId to id
        }
      }
    })
  );
};

// Subject site management functions
export const addSiteToSubject = (subjectId, siteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject) {
        if (!subject.subjectSites) subject.subjectSites = [];
        subject.subjectSites.push({
          id: siteId, // Changed from siteId to id
          type: "site", // Add type field to identify entity type
          parentSubject: subject.id, // Add explicit reference to parent subject
          metadata: {},
        });
      }
    })
  );
};

export const deleteSiteFromSubject = (subjectId, siteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.subjectSites) {
        subject.subjectSites = subject.subjectSites.filter((site) => site.id !== siteId); // Changed from siteId to id
      }
    })
  );
};

export const getExistingPerformanceIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap(
    (subject) => subject.subjectPerformances.map((perf) => perf.id) // Changed from performanceId to id
  );
};

// Subject performance management functions
export const addPerformanceToSubject = (subjectId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject) {
        if (!subject.subjectPerformances) subject.subjectPerformances = [];
        subject.subjectPerformances.push({
          id: performanceId, // Changed from performanceId to id
          type: "performance", // Add type field to identify entity type
          parentSubject: subject.id, // Add explicit reference to parent subject
          metadata: {},
        });
      }
    })
  );
};

export const addPerformanceToSample = (subjectId, sampleId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId); // Changed from sampleId to id
        if (sample) {
          if (!sample.performances) sample.performances = [];
          sample.performances.push({
            id: performanceId, // Changed from performanceId to id
            type: "performance", // Add type field to identify entity type
            parentSubject: subject.id, // Add explicit reference to top-level subject
            parentSample: sample.id, // Add explicit reference to parent sample
            metadata: {},
          });
        }
      }
    })
  );
};

export const deletePerformanceFromSubject = (subjectId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.subjectPerformances) {
        subject.subjectPerformances = subject.subjectPerformances.filter(
          (perf) => perf.id !== performanceId // Changed from performanceId to id
        );
      }
    })
  );
};

export const getExistingSiteIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap(
    (subject) => subject.samples.flatMap((sample) => sample.sites.map((site) => site.id)) // Changed from siteId to id
  );
};

// Sample site management functions
export const addSiteToSample = (subjectId, sampleId, siteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId); // Changed from sampleId to id
        if (sample) {
          if (!sample.sites) sample.sites = [];
          sample.sites.push({
            id: siteId, // Changed from siteId to id
            type: "site", // Add type field to identify entity type
            parentSubject: subject.id, // Add explicit reference to top-level subject
            parentSample: sample.id, // Add explicit reference to parent sample
            metadata: {},
          });
        }
      }
    })
  );
};

export const deleteSiteFromSample = (subjectId, sampleId, siteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId); // Changed from sampleId to id
        if (sample && sample.sites) {
          sample.sites = sample.sites.filter((site) => site.id !== siteId); // Changed from siteId to id
        }
      }
    })
  );
};

export const deletePerformanceFromSample = (subjectId, sampleId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId); // Changed from sampleId to id
        if (sample && sample.performances) {
          sample.performances = sample.performances.filter(
            (perf) => perf.id !== performanceId // Changed from performanceId to id
          );
        }
      }
    })
  );
};

// Subject performance management functions
export const modifySubjectPerformanceId = (subjectId, oldPerformanceId, newPerformanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.subjectPerformances) {
        const performance = subject.subjectPerformances.find(
          (p) => p.id === oldPerformanceId // Changed from performanceId to id
        );
        if (performance) {
          performance.id = newPerformanceId; // Changed from performanceId to id
        }
      }
    })
  );
};

// Sample performance management functions
export const modifySamplePerformanceId = (
  subjectId,
  sampleId,
  oldPerformanceId,
  newPerformanceId
) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId); // Changed from sampleId to id
        if (sample && sample.performances) {
          const performance = sample.performances.find((p) => p.id === oldPerformanceId); // Changed from performanceId to id
          if (performance) {
            performance.id = newPerformanceId; // Changed from performanceId to id
          }
        }
      }
    })
  );
};

// Subject site management functions
export const modifySubjectSiteId = (subjectId, oldSiteId, newSiteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.subjectSites) {
        const site = subject.subjectSites.find((site) => site.id === oldSiteId); // Changed from siteId to id
        if (site) {
          site.id = newSiteId; // Changed from siteId to id
        }
      }
    })
  );
};

// Sample site management functions
export const modifySampleSiteId = (subjectId, sampleId, oldSiteId, newSiteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId); // Changed from sampleId to id
        if (sample && sample.sites) {
          const site = sample.sites.find((site) => site.id === oldSiteId); // Changed from siteId to id
          if (site) {
            site.id = newSiteId; // Changed from siteId to id
          }
        }
      }
    })
  );
};

// Helper functions for entity metadata access and updates
/**
 * Gets entity data for a selected hierarchy entity
 * @param {Object} selectedEntity - The flattened selected entity object
 * @returns {Object|null} The complete entity data object or null if not found
 */
export const getEntityDataFromSelection = (selectedEntity) => {
  if (!selectedEntity) return null;

  const { entityType, entityId, parentId, parentType, grandParentId } = selectedEntity;
  const { datasetEntityArray } = useGlobalStore.getState();

  // For subject entities
  if (entityType === "subject") {
    return datasetEntityArray.find((subject) => subject.id === entityId) || null; // Changed from subjectId to id
  }

  // Find parent subject (needed for all other entity types)
  const parentSubjectId = grandParentId || parentId;
  const subject = datasetEntityArray.find((subject) => subject.id === parentSubjectId); // Changed from subjectId to id
  if (!subject) return null;

  // For sample entities
  if (entityType === "sample") {
    return subject.samples?.find((sample) => sample.id === entityId) || null; // Changed from sampleId to id
  }

  // For site entities
  if (entityType === "site") {
    if (parentType === "sample") {
      const sample = subject.samples?.find((sample) => sample.id === parentId); // Changed from sampleId to id
      return sample?.sites?.find((site) => site.id === entityId) || null; // Changed from siteId to id
    } else {
      return subject.subjectSites?.find((site) => site.id === entityId) || null; // Changed from siteId to id
    }
  }

  // For performance entities
  if (entityType === "performance") {
    if (parentType === "sample") {
      const sample = subject.samples?.find((sample) => sample.id === parentId); // Changed from sampleId to id
      return sample?.performances?.find((perf) => perf.id === entityId) || null; // Changed from performanceId to id
    } else {
      return subject.subjectPerformances?.find((perf) => perf.id === entityId) || null; // Changed from performanceId to id
    }
  }

  return null;
};

/**
 * Updates metadata for a specific entity in the global store
 * @param {Object} entity - The entity object to update
 * @param {Object} metadataChanges - Object containing the metadata key/value pairs to update
 */
export const updateEntityMetadata = (entity, metadataChanges) => {
  if (!entity || !entity.id || !entity.type) {
    console.error("Invalid entity provided to updateEntityMetadata", entity);
    return;
  }

  console.log("Updating metadata for entity:", entity.id, "Changes:", metadataChanges);

  useGlobalStore.setState(
    produce((state) => {
      // Find the entity in the array
      const entityArray = state.datasetEntityArray;
      if (!entityArray || !Array.isArray(entityArray)) return;

      // Handle different entity types
      if (entity.type === "subject") {
        // Find the subject directly in the array
        const subjectIndex = entityArray.findIndex((s) => s.id === entity.id);
        if (subjectIndex === -1) return;

        // Initialize metadata object if it doesn't exist
        if (!entityArray[subjectIndex].metadata) {
          entityArray[subjectIndex].metadata = {};
        }

        // Apply each metadata change
        Object.entries(metadataChanges).forEach(([key, value]) => {
          entityArray[subjectIndex].metadata[key] = value;
        });
      } else if (entity.type === "sample") {
        // Find the parent subject
        const subjectIndex = entityArray.findIndex((s) => s.id === entity.parentSubject);
        if (subjectIndex === -1) return;

        // Find the sample in the subject
        const sample = entityArray[subjectIndex].samples?.find((s) => s.id === entity.id);
        if (!sample) return;

        // Initialize metadata object if it doesn't exist
        if (!sample.metadata) {
          sample.metadata = {};
        }

        // Apply each metadata change
        Object.entries(metadataChanges).forEach(([key, value]) => {
          sample.metadata[key] = value;
        });
      }
      // Similar handling for site and performance entities
      else if (entity.type === "site" || entity.type === "performance") {
        // Implementation details based on your data structure
        // ...handle site and performance entities similarly...
      }
    })
  );
};

/**
 * Gets metadata value for an entity
 * @param {Object} selectedEntity - The flattened selected entity object
 * @param {string} key - The metadata key to retrieve
 * @param {*} defaultValue - Default value if metadata doesn't exist
 * @returns {*} The metadata value or default value
 */
export const getEntityMetadataValue = (selectedEntity, key, defaultValue = "") => {
  if (!selectedEntity) return defaultValue;

  const entityData = getEntityDataFromSelection(selectedEntity);
  if (!entityData) return defaultValue;

  if (!entityData.metadata) return entityData[key] || defaultValue;

  return entityData.metadata[key] || entityData[key] || defaultValue;
};

export const getDatasetEntityArray = () => {
  return useGlobalStore.getState().datasetEntityArray;
};

export const getAllEntityIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();

  return datasetEntityArray.flatMap((subject) => {
    // Start with subject ID
    const ids = [subject.id];

    // Add all sample IDs from this subject
    if (subject.samples) {
      ids.push(...subject.samples.map((sample) => sample.id));

      // Add all sample sites and performances
      subject.samples.forEach((sample) => {
        if (sample.sites) {
          ids.push(...sample.sites.map((site) => site.id));
        }
        if (sample.performances) {
          ids.push(...sample.performances.map((perf) => perf.id));
        }
      });
    }

    // Add subject-level sites and performances
    if (subject.subjectSites) {
      ids.push(...subject.subjectSites.map((site) => site.id));
    }
    if (subject.subjectPerformances) {
      ids.push(...subject.subjectPerformances.map((perf) => perf.id));
    }

    return ids;
  });
};
