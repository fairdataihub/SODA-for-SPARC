import { produce } from "immer";
import useGlobalStore from "../globalStore";

// Update the initial slice to include temporary metadata state
export const datasetEntityStructureSlice = (set) => ({
  speciesList: [],
  datasetEntityArray: [],
  activeFormType: null,
  // New field to store temporary metadata for entities being created
  temporaryEntityMetadata: {
    subject: {},
    sample: {},
    site: {},
    performance: {},
  },
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
export const addSubject = (subjectId, subjectMetadata) => {
  console.log("subject id", subjectId);
  console.log("subject metadata", subjectMetadata);
  // Ensure subject ID starts with "sub-"
  const normalizedSubjectId = subjectId.trim().startsWith("sub-")
    ? subjectId.trim()
    : `sub-${subjectId.trim()}`;

  useGlobalStore.setState(
    produce((state) => {
      state.datasetEntityArray.push({
        id: normalizedSubjectId, // Changed from subjectId to id
        type: "subject", // Add type field to identify entity type
        metadata: {
          "subject id": normalizedSubjectId,
        },
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
export const addSampleToSubject = (subjectId, sampleId, sampleMetadata) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId); // Changed from subjectId to id
      if (subject) {
        subject.samples.push({
          id: sampleId, // Changed from sampleId to id
          type: "sample", // Add type field to identify entity type
          parentSubject: subjectId, // Add explicit reference to parent subject
          metadata: {
            "subject id": subjectId,
            "sample id": sampleId,
          },
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
          metadata: {
            "site id": siteId,
            "specimen id": subjectId,
          },
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
            metadata: {
              "site id": siteId,
              "specimen id": `${subjectId} ${sampleId}`, // Add combined subject/sample ID to site metadata
            },
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
 * Updates metadata for a specific entity in the global store or temporary store for new entities
 * @param {Object|null} entity - The entity object to update or null for new entity
 * @param {Object} metadataChanges - Object containing the metadata key/value pairs to update
 * @param {string} [entityType] - The type of entity, required when entity is null
 */
export const updateEntityMetadata = (entity, metadataChanges, entityType = null) => {
  // Check if we're updating an existing entity or a new one
  const updatingExistingEntity = entity && entity.id && entity.type;

  // If updating a new entity, entityType must be provided
  if (!updatingExistingEntity && !entityType) {
    console.error("When updating a new entity, entityType must be provided");
    return;
  }

  // Determine the type to use
  const typeToUse = updatingExistingEntity ? entity.type : entityType;

  if (updatingExistingEntity) {
    console.log("Updating metadata for existing entity:", entity.id, "Changes:", metadataChanges);

    // Get current state for logging
    const beforeState = useGlobalStore.getState().datasetEntityArray;
    console.log("Before update state:", JSON.stringify(beforeState));

    useGlobalStore.setState(
      produce((state) => {
        // Find the entity in the array
        const entityArray = state.datasetEntityArray;
        if (!entityArray || !Array.isArray(entityArray)) {
          console.error("Entity array not found in state");
          return;
        }

        // Find entity based on its type and ID
        if (entity.type === "subject") {
          // Find subject by ID
          const subjectIndex = entityArray.findIndex((s) => s.id === entity.id);
          console.log(`Finding subject with id ${entity.id}, index: ${subjectIndex}`);

          if (subjectIndex === -1) {
            console.error(`Subject with ID ${entity.id} not found in array`);
            return;
          }

          // Make sure metadata object exists
          if (!entityArray[subjectIndex].metadata) {
            entityArray[subjectIndex].metadata = {};
          }

          // Apply each metadata change
          Object.entries(metadataChanges).forEach(([key, value]) => {
            console.log(`Setting ${key}=${value} on subject ${entity.id}`);
            entityArray[subjectIndex].metadata[key] = value;
          });

          console.log(`Updated subject metadata:`, entityArray[subjectIndex].metadata);
        } else if (entity.type === "sample") {
          // Find parent subject
          const parentSubjectId = entity.parentSubject;
          const subject = entityArray.find((s) => s.id === parentSubjectId);

          if (!subject) {
            console.error(`Parent subject ${parentSubjectId} not found for sample ${entity.id}`);
            return;
          }

          // Find sample in subject's samples array
          const sampleIndex = subject.samples?.findIndex((s) => s.id === entity.id);
          if (sampleIndex === -1 || sampleIndex === undefined) {
            console.error(`Sample ${entity.id} not found in subject ${parentSubjectId}`);
            return;
          }

          // Ensure metadata object exists
          if (!subject.samples[sampleIndex].metadata) {
            subject.samples[sampleIndex].metadata = {};
          }

          // Apply changes
          Object.entries(metadataChanges).forEach(([key, value]) => {
            console.log(`Setting ${key}=${value} on sample ${entity.id}`);
            subject.samples[sampleIndex].metadata[key] = value;
          });

          console.log(`Updated sample metadata:`, subject.samples[sampleIndex].metadata);
        }
        // Similar handling for site and performance entities
        else if (entity.type === "site") {
          // Handle site entity updates
          // ...implement similar to subject and sample...
        } else if (entity.type === "performance") {
          // Handle performance entity updates
          // ...implement similar to subject and sample...
        }
      })
    );

    // Log state after update for debugging
    const afterState = useGlobalStore.getState().datasetEntityArray;
    console.log("After update state:", JSON.stringify(afterState));

    // Force component update by triggering a small state change
    // This ensures components re-render when metadata changes
    useGlobalStore.setState(
      produce((state) => {
        state._lastMetadataUpdate = Date.now();
      })
    );
  } else {
    // Updating temporary metadata for a new entity
    console.log(
      "Updating temporary metadata for new entity of type:",
      typeToUse,
      "Changes:",
      metadataChanges
    );

    useGlobalStore.setState(
      produce((state) => {
        // Ensure temporary metadata exists
        if (!state.temporaryEntityMetadata) {
          state.temporaryEntityMetadata = {
            subject: {},
            sample: {},
            site: {},
            performance: {},
          };
        }

        if (!state.temporaryEntityMetadata[typeToUse]) {
          state.temporaryEntityMetadata[typeToUse] = {};
        }

        // Apply metadata changes
        Object.entries(metadataChanges).forEach(([key, value]) => {
          state.temporaryEntityMetadata[typeToUse][key] = value;
        });
      })
    );
  }
};

/**
 * Gets the temporary metadata for a specific entity type
 * @param {string} entityType - The type of entity (subject, sample, site, performance)
 * @returns {Object} The temporary metadata for the entity type
 */
export const getTemporaryEntityMetadata = (entityType) => {
  const state = useGlobalStore.getState();
  return state.temporaryEntityMetadata?.[entityType] || {};
};

/**
 * Clears temporary metadata for a specific entity type
 * @param {string} entityType - The type of entity (subject, sample, site, performance)
 */
export const clearTemporaryEntityMetadata = (entityType) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.temporaryEntityMetadata && state.temporaryEntityMetadata[entityType]) {
        state.temporaryEntityMetadata[entityType] = {};
      }
    })
  );
};

/**
 * Clears all temporary metadata
 */
export const clearAllTemporaryEntityMetadata = () => {
  useGlobalStore.setState(
    produce((state) => {
      state.temporaryEntityMetadata = {
        subject: {},
        sample: {},
        site: {},
        performance: {},
      };
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
      ids.push(...subject.subjectPerformances.map((perf) => subject.id));
    }

    return ids;
  });
};

export const setActiveFormType = (formType) => {
  useGlobalStore.setState({
    activeFormType: formType,
  });
};

export const setEntityBeingAddedParentSubject = (subjectId) => {
  useGlobalStore.setState(
    produce((state) => {
      state.entityBeingAddedParentSubject = subjectId;
    })
  );
};

export const setEntityBeingAddedParentSample = (sampleId) => {
  useGlobalStore.setState(
    produce((state) => {
      state.entityBeingAddedParentSample = sampleId;
    })
  );
};
