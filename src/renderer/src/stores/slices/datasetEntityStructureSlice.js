import { produce } from "immer";
import useGlobalStore from "../globalStore";

export const datasetEntityStructureSlice = (set, get) => ({
  speciesList: [],
  datasetEntityArray: [],
  activeFormType: null,
  entityBeingAddedParentSubject: null,
  entityBeingAddedParentSample: null,
  temporaryEntityMetadata: {
    subject: {},
    sample: {},
    site: {},
    performance: {},
  },
  activeImportStep: 0,
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

// Add new action to update the active import step
export const setActiveImportStep = (stepIndex) => {
  useGlobalStore.setState({
    activeImportStep: stepIndex,
  });
};

// Subject management functions
export const addSubject = (subjectId, metadata = {}) => {
  const normalizedSubjectId = subjectId.trim().startsWith("sub-")
    ? subjectId.trim()
    : `sub-${subjectId.trim()}`;

  if (!normalizedSubjectId) {
    throw new Error("Subject ID cannot be empty");
  }

  console.log("Adding subject with metadata:", metadata);

  useGlobalStore.setState(
    produce((state) => {
      const mergedMetadata = {
        ...metadata,
        "subject id": normalizedSubjectId,
      };

      state.datasetEntityArray.push({
        id: normalizedSubjectId,
        type: "subject",
        metadata: mergedMetadata,
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
        (subject) => subject.id !== subjectId
      );
    })
  );
};

export const modifySubjectId = (oldSubjectId, newSubjectId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === oldSubjectId);
      if (subject) {
        subject.id = newSubjectId;
      }
    })
  );
};

export const getExistingSubjectIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.map((subject) => subject.id);
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
        const mergedMetadata = {
          ...metadata,
          "subject id": subjectId,
          "sample id": normalizedSampleId,
        };

        subject.samples.push({
          id: normalizedSampleId,
          type: "sample",
          parentSubject: subjectId,
          metadata: mergedMetadata,
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
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        subject.samples = subject.samples.filter((sample) => sample.id !== sampleId);
      }
    })
  );
};

export const getExistingSampleIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) => subject.samples.map((sample) => sample.id));
};

export const modifySampleId = (subjectId, oldSampleId, newSampleId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject) {
        const sample = subject.samples.find((s) => s.id === oldSampleId);
        if (sample) {
          sample.id = newSampleId;
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
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.subjectSites) {
        subject.subjectSites = subject.subjectSites.filter((site) => site.id !== siteId);
      }
    })
  );
};

export const getExistingPerformanceIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) =>
    subject.subjectPerformances.map((perf) => perf.id)
  );
};

// Subject performance management functions
export const addPerformanceToSubject = (subjectId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject) {
        if (!subject.subjectPerformances) subject.subjectPerformances = [];
        subject.subjectPerformances.push({
          id: performanceId,
          type: "performance",
          parentSubject: subject.id,
          metadata: {},
        });
      }
    })
  );
};

export const addPerformanceToSample = (subjectId, sampleId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId);
        if (sample) {
          if (!sample.performances) sample.performances = [];
          sample.performances.push({
            id: performanceId,
            type: "performance",
            parentSubject: subject.id,
            parentSample: sample.id,
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
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.subjectPerformances) {
        subject.subjectPerformances = subject.subjectPerformances.filter(
          (perf) => perf.id !== performanceId
        );
      }
    })
  );
};

export const getExistingSiteIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) =>
    subject.samples.flatMap((sample) => sample.sites.map((site) => site.id))
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
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId);
        if (sample && sample.sites) {
          sample.sites = sample.sites.filter((site) => site.id !== siteId);
        }
      }
    })
  );
};

export const deletePerformanceFromSample = (subjectId, sampleId, performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId);
        if (sample && sample.performances) {
          sample.performances = sample.performances.filter((perf) => perf.id !== performanceId);
        }
      }
    })
  );
};

// Subject performance management functions
export const modifySubjectPerformanceId = (subjectId, oldPerformanceId, newPerformanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.subjectPerformances) {
        const performance = subject.subjectPerformances.find((p) => p.id === oldPerformanceId);
        if (performance) {
          performance.id = newPerformanceId;
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
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId);
        if (sample && sample.performances) {
          const performance = sample.performances.find((p) => p.id === oldPerformanceId);
          if (performance) {
            performance.id = newPerformanceId;
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
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.subjectSites) {
        const site = subject.subjectSites.find((site) => site.id === oldSiteId);
        if (site) {
          site.id = newSiteId;
        }
      }
    })
  );
};

// Sample site management functions
export const modifySampleSiteId = (subjectId, sampleId, oldSiteId, newSiteId) => {
  useGlobalStore.setState(
    produce((state) => {
      const subject = state.datasetEntityArray.find((s) => s.id === subjectId);
      if (subject && subject.samples) {
        const sample = subject.samples.find((s) => s.id === sampleId);
        if (sample && sample.sites) {
          const site = sample.sites.find((site) => site.id === oldSiteId);
          if (site) {
            site.id = newSiteId;
          }
        }
      }
    })
  );
};

// Helper functions for entity metadata access and updates
export const getEntityDataFromSelection = (selectedEntity) => {
  if (!selectedEntity) return null;

  const { entityType, entityId, parentId, parentType, grandParentId } = selectedEntity;
  const { datasetEntityArray } = useGlobalStore.getState();

  if (entityType === "subject") {
    return datasetEntityArray.find((subject) => subject.id === entityId) || null;
  }

  const parentSubjectId = grandParentId || parentId;
  const subject = datasetEntityArray.find((subject) => subject.id === parentSubjectId);
  if (!subject) return null;

  if (entityType === "sample") {
    return subject.samples?.find((sample) => sample.id === entityId) || null;
  }

  if (entityType === "site") {
    if (parentType === "sample") {
      const sample = subject.samples?.find((sample) => sample.id === parentId);
      return sample?.sites?.find((site) => site.id === entityId) || null;
    } else {
      return subject.subjectSites?.find((site) => site.id === entityId) || null;
    }
  }

  if (entityType === "performance") {
    if (parentType === "sample") {
      const sample = subject.samples?.find((sample) => sample.id === parentId);
      return sample?.performances?.find((perf) => perf.id === entityId) || null;
    } else {
      return subject.subjectPerformances?.find((perf) => perf.id === entityId) || null;
    }
  }

  return null;
};

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
        const subject = state.datasetEntityArray.find((s) => s.id === entity.id);
        if (!subject) {
          console.error(`Subject with ID ${entity.id} not found in array`);
          return;
        }

        if (!subject.metadata) subject.metadata = {};

        Object.entries(metadataChanges).forEach(([key, value]) => {
          subject.metadata[key] = value;

          if (key === "subject id") {
            subject.id = value.startsWith("sub-") ? value : `sub-${value}`;
          }
        });

        updatedEntity = subject;
      } else if (entity.type === "sample") {
        const subject = state.datasetEntityArray.find((s) => s.id === entity.parentSubject);
        if (!subject) {
          console.error(
            `Parent subject with ID ${entity.parentSubject} not found for sample ${entity.id}`
          );
          return;
        }

        const sample = subject.samples?.find((s) => s.id === entity.id);
        if (!sample) {
          console.error(`Sample with ID ${entity.id} not found in subject ${subject.id}`);
          return;
        }

        if (!sample.metadata) sample.metadata = {};

        Object.entries(metadataChanges).forEach(([key, value]) => {
          sample.metadata[key] = value;
          console.log(`Updated sample metadata: ${key} = ${value}`);

          if (key === "sample id") {
            sample.id = value.startsWith("sam-") ? value : `sam-${value}`;
          }
        });

        updatedEntity = sample;
        console.log("Updated sample entity:", updatedEntity);
      } else if (entity.type === "site") {
        console.log("Updating site entity:", entity.id);
        console.log("Site entity data:", entity);

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

        if (entity.parentSample) {
          sample = subject.samples?.find((s) => s.id === entity.parentSample);
          console.log("Found parent sample:", sample?.id);

          if (!sample) {
            console.error(
              `Parent sample ${entity.parentSample} not found in subject ${subject.id}`
            );
            return;
          }

          const site = sample.sites?.find((s) => s.id === entity.id);
          if (!site) {
            console.error(`Site ${entity.id} not found in sample ${sample.id}`);
            return;
          }

          if (!site.metadata) site.metadata = {};

          Object.entries(metadataChanges).forEach(([key, value]) => {
            site.metadata[key] = value;
            console.log(`Updated site metadata: ${key} = ${value}`);

            if (key === "site id") {
              site.id = value.startsWith("site-") ? value : `site-${value}`;
            }
          });

          updatedEntity = site;
        } else {
          const site = subject.subjectSites?.find((s) => s.id === entity.id);
          if (!site) {
            console.error(`Site ${entity.id} not found in subject's direct sites`);
            return;
          }

          if (!site.metadata) site.metadata = {};

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

      if (state.selectedHierarchyEntity && state.selectedHierarchyEntity.id === entity.id) {
        state.selectedHierarchyEntity = updatedEntity || state.selectedHierarchyEntity;
        console.log("Updated selectedHierarchyEntity reference:", state.selectedHierarchyEntity);
      }
    })
  );
};

export const updateTemporaryMetadata = (entityType, metadataChanges) => {
  console.log("Updating temporary metadata for", entityType, "Changes:", metadataChanges);

  useGlobalStore.setState(
    produce((state) => {
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

      Object.entries(metadataChanges).forEach(([key, value]) => {
        state.temporaryEntityMetadata[entityType][key] = value;
      });
    })
  );
};

export const getEntityMetadataValue = (entity, key, entityType = null, defaultValue = "") => {
  if (entity) {
    if (entity.metadata && key in entity.metadata) {
      return entity.metadata[key];
    }

    if (key in entity) {
      return entity[key];
    }

    if (key === "subject id" && entity.type === "subject") {
      return entity.id.startsWith("sub-") ? entity.id.substring(4) : entity.id;
    }

    if (key === "sample id" && entity.type === "sample") {
      return entity.id.startsWith("sam-") ? entity.id.substring(4) : entity.id;
    }

    return defaultValue;
  }

  if (entityType) {
    const state = useGlobalStore.getState();
    const tempMeta = state.temporaryEntityMetadata?.[entityType];

    if (tempMeta && key in tempMeta) {
      return tempMeta[key];
    }
  }

  return defaultValue;
};

export const clearTemporaryMetadata = (entityType) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.temporaryEntityMetadata && state.temporaryEntityMetadata[entityType]) {
        state.temporaryEntityMetadata[entityType] = {};
      }
    })
  );
};

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
    const ids = [subject.id];

    if (subject.samples) {
      ids.push(...subject.samples.map((sample) => sample.id));

      subject.samples.forEach((sample) => {
        if (sample.sites) {
          ids.push(...sample.sites.map((site) => site.id));
        }
        if (sample.performances) {
          ids.push(...sample.performances.map((perf) => perf.id));
        }
      });
    }

    if (subject.subjectSites) {
      ids.push(...subject.subjectSites.map((site) => site.id));
    }
    if (subject.subjectPerformances) {
      ids.push(...subject.subjectPerformances.map((perf) => perf.id));
    }

    return ids;
  });
};
