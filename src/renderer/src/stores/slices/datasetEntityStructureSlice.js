import { produce } from "immer";
import useGlobalStore from "../globalStore";

export const datasetEntityStructureSlice = (set) => ({
  speciesList: [],
  datasetEntityArray: [],
  activeFormType: null, // Add this line for form type tracking
  temporaryEntityMetadata: {
    // Add storage for temporary metadata
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
export const addSubject = (subjectId, metadata = {}) => {
  // Ensure subject ID starts with "sub-"
  const normalizedSubjectId = subjectId.trim().startsWith("sub-")
    ? subjectId.trim()
    : `sub-${subjectId.trim()}`;

  if (!normalizedSubjectId) {
    throw new Error("Subject ID cannot be empty");
  }

  // Log the metadata being passed in
  console.log("Adding subject with metadata:", metadata);

  useGlobalStore.setState(
    produce((state) => {
      // Create merged metadata object with ID guaranteed
      const mergedMetadata = {
        ...metadata,
        "subject id": normalizedSubjectId, // Ensure ID is always set correctly
      };

      state.datasetEntityArray.push({
        id: normalizedSubjectId,
        type: "subject",
        metadata: mergedMetadata, // Use the merged metadata object
        samples: [],
        subjectSites: [],
        subjectPerformances: [],
      });

      console.log("Subject added successfully with metadata:", mergedMetadata);
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
export const addSampleToSubject = (subjectId, sampleId, metadata = {}) => {
  const normalizedSampleId = sampleId.trim().startsWith("sam-")
    ? sampleId.trim()
    : `sam-${sampleId.trim()}`;

  if (!normalizedSampleId) {
    throw new Error("Sample ID cannot be empty");
  }

  console.log("Adding sample with metadata:", metadata);

  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject) {
        // Create merged metadata object for the sample
        const mergedMetadata = {
          ...metadata,
          "subject id": subjectId,
          "sample id": normalizedSampleId,
        };

        subject.samples.push({
          id: normalizedSampleId,
          type: "sample",
          parentSubject: subjectId,
          metadata: mergedMetadata, // Use the merged metadata
          sites: [],
          performances: [],
        });

        console.log("Sample added successfully with metadata:", mergedMetadata);
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
export const addSiteToSubject = (subjectId, siteId, metadata = {}) => {
  const normalizedSiteId = siteId.trim().startsWith("site-")
    ? siteId.trim()
    : `site-${siteId.trim()}`;

  if (!normalizedSiteId) {
    throw new Error("Site ID cannot be empty");
  }

  console.log("Adding site to subject with metadata:", metadata);

  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject) {
        if (!subject.subjectSites) subject.subjectSites = [];

        // Create merged metadata object for the site
        const mergedMetadata = {
          ...metadata,
          "site id": normalizedSiteId,
          "subject id": subjectId,
        };

        subject.subjectSites.push({
          id: normalizedSiteId,
          type: "site",
          parentSubject: subject.id,
          metadata: mergedMetadata,
        });

        console.log("Site added to subject successfully with metadata:", mergedMetadata);
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
export const addSiteToSample = (subjectId, sampleId, siteId, metadata = {}) => {
  const normalizedSiteId = siteId.trim().startsWith("site-")
    ? siteId.trim()
    : `site-${siteId.trim()}`;

  if (!normalizedSiteId) {
    throw new Error("Site ID cannot be empty");
  }

  console.log("Adding site to sample with metadata:", metadata);

  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId);
        if (sample) {
          if (!sample.sites) sample.sites = [];

          // Create merged metadata object for the site
          const mergedMetadata = {
            ...metadata,
            "site id": normalizedSiteId,
            "subject id": subjectId,
            "sample id": sampleId,
          };

          sample.sites.push({
            id: normalizedSiteId,
            type: "site",
            parentSubject: subject.id,
            parentSample: sample.id,
            metadata: mergedMetadata,
          });

          console.log("Site added to sample successfully with metadata:", mergedMetadata);
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
 * Updates metadata for an existing entity
 *
 * Applies metadata changes to an existing entity in the dataset structure.
 * Handles special cases like updating IDs and ensures proper reference updates.
 *
 * @param {Object} entity - The entity object to update
 * @param {Object} metadataChanges - Object containing the metadata key/value pairs to update
 */
export const updateExistingEntityMetadata = (entity, metadataChanges) => {
  if (!entity || !entity.id || !entity.type) {
    console.error("Invalid entity provided to updateExistingEntityMetadata", entity);
    return;
  }

  console.log("Updating metadata for entity:", entity.id, "Changes:", metadataChanges);

  useGlobalStore.setState(
    produce((state) => {
      let updatedEntity = null;

      if (entity.type === "subject") {
        // Find subject by ID in the array
        const subject = state.datasetEntityArray.find((s) => s.id === entity.id);
        if (!subject) {
          console.error(`Subject with ID ${entity.id} not found in array`);
          return;
        }

        // Ensure metadata object exists
        if (!subject.metadata) subject.metadata = {};

        // Apply changes directly
        Object.entries(metadataChanges).forEach(([key, value]) => {
          subject.metadata[key] = value;

          // Update ID at top level if needed
          if (key === "subject id") {
            subject.id = value.startsWith("sub-") ? value : `sub-${value}`;
          }
        });

        // Keep track of the updated entity
        updatedEntity = subject;
      } else if (entity.type === "sample") {
        // Handle sample metadata updates
        // Find the parent subject
        const subject = state.datasetEntityArray.find((s) => s.id === entity.parentSubject);
        if (!subject) {
          console.error(
            `Parent subject with ID ${entity.parentSubject} not found for sample ${entity.id}`
          );
          return;
        }

        // Find the sample
        const sample = subject.samples?.find((s) => s.id === entity.id);
        if (!sample) {
          console.error(`Sample with ID ${entity.id} not found in subject ${subject.id}`);
          return;
        }

        // Ensure metadata exists
        if (!sample.metadata) sample.metadata = {};

        // Apply changes
        Object.entries(metadataChanges).forEach(([key, value]) => {
          sample.metadata[key] = value;
          console.log(`Updated sample metadata: ${key} = ${value}`);

          // Handle ID updates if needed
          if (key === "sample id") {
            sample.id = value.startsWith("sam-") ? value : `sam-${value}`;
          }
        });

        // Set updatedEntity to the sample we just modified
        updatedEntity = sample;
        console.log("Updated sample entity:", updatedEntity);
      } else if (entity.type === "site") {
        console.log("Updating site entity:", entity.id);
        console.log("Site entity data:", entity);

        // Find the parent subject
        let subject = null;
        let sample = null;

        if (entity.parentSubject) {
          subject = state.datasetEntityArray.find((s) => s.id === entity.parentSubject);
          console.log("Found parent subject:", subject?.id);
        }

        if (!subject) {
          console.error(`Parent subject not found for site ${entity.id}`);
          return;
        }

        // Check if site belongs to a sample or directly to the subject
        if (entity.parentSample) {
          // Site belongs to a sample
          sample = subject.samples?.find((s) => s.id === entity.parentSample);
          console.log("Found parent sample:", sample?.id);

          if (!sample) {
            console.error(
              `Parent sample ${entity.parentSample} not found in subject ${subject.id}`
            );
            return;
          }

          // Find the site within the sample
          const site = sample.sites?.find((s) => s.id === entity.id);
          if (!site) {
            console.error(`Site ${entity.id} not found in sample ${sample.id}`);
            return;
          }

          // Ensure metadata exists
          if (!site.metadata) site.metadata = {};

          // Apply changes
          Object.entries(metadataChanges).forEach(([key, value]) => {
            site.metadata[key] = value;
            console.log(`Updated site metadata: ${key} = ${value}`);

            if (key === "site id") {
              site.id = value.startsWith("site-") ? value : `site-${value}`;
            }
          });

          updatedEntity = site;
        } else {
          // Site belongs directly to the subject
          const site = subject.subjectSites?.find((s) => s.id === entity.id);
          if (!site) {
            console.error(`Site ${entity.id} not found in subject's direct sites`);
            return;
          }

          // Ensure metadata exists
          if (!site.metadata) site.metadata = {};

          // Apply changes
          Object.entries(metadataChanges).forEach(([key, value]) => {
            site.metadata[key] = value;
            console.log(`Updated subject site metadata: ${key} = ${value}`);

            if (key === "site id") {
              site.id = value.startsWith("site-") ? value : `site-${value}`;
            }
          });

          updatedEntity = site;
        }

        console.log("Updated site entity:", updatedEntity);
      }

      // If this is the currently selected entity, update our reference to it
      if (state.selectedHierarchyEntity && state.selectedHierarchyEntity.id === entity.id) {
        state.selectedHierarchyEntity = updatedEntity || state.selectedHierarchyEntity;
        console.log("Updated selectedHierarchyEntity reference:", state.selectedHierarchyEntity);
      }
    })
  );
};

/**
 * Updates temporary metadata for a new entity being created
 *
 * Stores metadata entries in a temporary location until the entity is actually created.
 * This separates the concerns of editing existing entities vs. creating new ones.
 *
 * @param {string} entityType - The type of entity (subject, sample, site, performance)
 * @param {Object} metadataChanges - Object containing the metadata key/value pairs to update
 */
export const updateTemporaryMetadata = (entityType, metadataChanges) => {
  console.log("Updating temporary metadata for", entityType, "Changes:", metadataChanges);

  useGlobalStore.setState(
    produce((state) => {
      // Ensure the temporary metadata object structure exists
      if (!state.temporaryEntityMetadata) {
        state.temporaryEntityMetadata = {
          subject: {},
          sample: {},
          site: {},
          performance: {},
        };
      }

      if (!state.temporaryEntityMetadata[entityType]) {
        state.temporaryEntityMetadata[entityType] = {};
      }

      // Apply the changes to temporary metadata
      Object.entries(metadataChanges).forEach(([key, value]) => {
        state.temporaryEntityMetadata[entityType][key] = value;
      });
    })
  );
};

/**
 * Gets metadata value from either an entity or temporary metadata
 *
 * Single access point for metadata that handles both existing entities and
 * temporary metadata for entities being created. Includes special handling
 * for ID fields with prefixes like "sub-" or "sam-".
 *
 * @param {Object|null} entity - The entity object or null for temporary metadata
 * @param {string} key - The metadata key to retrieve
 * @param {string} entityType - Required when entity is null to get from temporary metadata
 * @param {*} defaultValue - Default value if metadata doesn't exist
 * @returns {*} The metadata value or default value
 */
export const getEntityMetadataValue = (entity, key, entityType = null, defaultValue = "") => {
  // For existing entities
  if (entity) {
    // First check if metadata object exists and has the key
    if (entity.metadata && key in entity.metadata) {
      return entity.metadata[key];
    }

    // Then check if the entity itself has the key (top-level property)
    if (key in entity) {
      return entity[key];
    }

    // Special ID handling
    if (key === "subject id" && entity.type === "subject") {
      return entity.id.startsWith("sub-") ? entity.id.substring(4) : entity.id;
    }

    if (key === "sample id" && entity.type === "sample") {
      return entity.id.startsWith("sam-") ? entity.id.substring(4) : entity.id;
    }

    return defaultValue;
  }

  // For new entities (using temporary metadata)
  if (entityType) {
    const state = useGlobalStore.getState();
    const tempMeta = state.temporaryEntityMetadata?.[entityType];

    if (tempMeta && key in tempMeta) {
      return tempMeta[key];
    }
  }

  return defaultValue;
};

/**
 * Clears temporary metadata for a specific entity type
 *
 * Used after entity creation is complete or canceled to clean up state.
 *
 * @param {string} entityType - The type of entity (subject, sample, site, performance)
 */
export const clearTemporaryMetadata = (entityType) => {
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
export const clearAllTemporaryMetadata = () => {
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

// Add the missing function that was referenced in index.jsx
export const setActiveFormType = (formType) => {
  useGlobalStore.setState({
    activeFormType: formType,
  });
};

// Add these missing functions as well
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
