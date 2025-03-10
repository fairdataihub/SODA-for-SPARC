import { use } from "react";
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
export const addSubject = (subjectId, protocolLink = "") => {
  useGlobalStore.setState((state) => {
    const updatedEntities = [...state.datasetEntityArray];

    // Add the new subject with protocol link in metadata
    const newSubject = {
      subjectId,
      samples: [],
      subjectSites: [],
      subjectPerformances: [],
      metadata: {
        protocolLink,
      },
    };

    updatedEntities.push(newSubject);

    return { datasetEntityArray: updatedEntities };
  });
};

export const deleteSubject = (subjectId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.filter(
    (subject) => subject.subjectId !== subjectId
  );
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const modifySubjectId = (oldSubjectId, newSubjectId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === oldSubjectId) {
      return {
        ...subject,
        subjectId: newSubjectId,
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const getExistingSubjectIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.map((subject) => subject.subjectId);
};

// Sample management functions
export const addSampleToSubject = (subjectId, sampleId, protocolLink = "") => {
  useGlobalStore.setState((state) => {
    const updatedEntities = [...state.datasetEntityArray];
    const subjectIndex = updatedEntities.findIndex((subject) => subject.subjectId === subjectId);

    if (subjectIndex >= 0) {
      const newSample = {
        sampleId,
        sites: [],
        performances: [],
        metadata: {
          protocolLink,
        },
      };

      // Add the sample if it doesn't exist already
      if (!updatedEntities[subjectIndex].samples.some((sample) => sample.sampleId === sampleId)) {
        updatedEntities[subjectIndex].samples.push(newSample);
      }
    }

    return { datasetEntityArray: updatedEntities };
  });
};

export const deleteSampleFromSubject = (subjectId, sampleId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.samples) {
      return {
        ...subject,
        samples: subject.samples.filter((sample) => sample.sampleId !== sampleId),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const getExistingSampleIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) => subject.samples.map((sample) => sample.sampleId));
};

// Additional sample management functions
export const modifySampleId = (subjectId, oldSampleId, newSampleId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === oldSampleId) {
            return {
              ...sample,
              sampleId: newSampleId,
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

// Subject site management functions
export const addSiteToSubject = (subjectId, siteId, protocolLink = "") => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      const subjectSites = subject.subjectSites || [];
      return {
        ...subject,
        subjectSites: [
          ...subjectSites,
          {
            siteId,
            metadata: {
              protocolLink,
            },
          },
        ],
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const deleteSiteFromSubject = (subjectId, siteId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.subjectSites) {
      return {
        ...subject,
        subjectSites: subject.subjectSites.filter((site) => site.siteId !== siteId),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const getExistingPerformanceIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) =>
    subject.subjectPerformances.map((perf) => perf.performanceId)
  );
};

// Subject performance management functions
export const addPerformanceToSubject = (subjectId, performanceId, protocolLink = "") => {
  console.log(`Adding performance ${performanceId} to subject ${subjectId}`);
  const { datasetEntityArray } = useGlobalStore.getState();
  console.log("datasetEntityArray", datasetEntityArray);
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      const subjectPerformances = subject.subjectPerformances || [];
      return {
        ...subject,
        subjectPerformances: [
          ...subjectPerformances,
          {
            performanceId,
            metadata: {
              protocolLink,
            },
          },
        ],
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
  // log the updated datasetEntityArray
  console.log("updatedDatasetEntityArray", useGlobalStore.getState().datasetEntityArray);
};

export const addPerformanceToSample = (subjectId, sampleId, performanceId, protocolLink = "") => {
  console.log(`Adding performance ${performanceId} to sample ${sampleId} of subject ${subjectId}`);
  const { datasetEntityArray } = useGlobalStore.getState();
  console.log("Before update:", JSON.stringify(datasetEntityArray, null, 2));

  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.samples) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId) {
            const performances = sample.performances || [];
            return {
              ...sample,
              performances: [
                ...performances,
                {
                  performanceId,
                  metadata: {
                    protocolLink,
                  },
                },
              ],
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });

  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });

  console.log(
    "After update:",
    JSON.stringify(useGlobalStore.getState().datasetEntityArray, null, 2)
  );
};

export const deletePerformanceFromSubject = (subjectId, performanceId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.subjectPerformances) {
      return {
        ...subject,
        subjectPerformances: subject.subjectPerformances.filter(
          (perf) => perf.performanceId !== performanceId
        ),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const getExistingSiteIds = () => {
  const { datasetEntityArray } = useGlobalStore.getState();
  return datasetEntityArray.flatMap((subject) =>
    subject.samples.flatMap((sample) => sample.sites.map((site) => site.siteId))
  );
};

// Sample site management functions
export const addSiteToSample = (subjectId, sampleId, siteId, protocolLink = "") => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.samples) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId) {
            const sites = sample.sites || [];
            return {
              ...sample,
              sites: [
                ...sites,
                {
                  siteId,
                  metadata: {
                    protocolLink,
                  },
                },
              ],
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const deleteSiteFromSample = (subjectId, sampleId, siteId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.samples) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId && sample.sites) {
            return {
              ...sample,
              sites: sample.sites.filter((site) => site.siteId !== siteId),
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const deletePerformanceFromSample = (subjectId, sampleId, performanceId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.samples) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId && sample.performances) {
            return {
              ...sample,
              performances: sample.performances.filter(
                (perf) => perf.performanceId !== performanceId
              ),
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

// Subject performance management - missing functions
export const modifySubjectPerformanceId = (subjectId, oldPerformanceId, newPerformanceId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      return {
        ...subject,
        subjectPerformances: subject.subjectPerformances.map((performance) => {
          if (performance.performanceId === oldPerformanceId) {
            return {
              ...performance,
              performanceId: newPerformanceId,
            };
          }
          return performance;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

// Sample performance management - missing functions
export const modifySamplePerformanceId = (
  subjectId,
  sampleId,
  oldPerformanceId,
  newPerformanceId
) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId) {
            return {
              ...sample,
              performances: sample.performances.map((performance) => {
                if (performance.performanceId === oldPerformanceId) {
                  return {
                    ...performance,
                    performanceId: newPerformanceId,
                  };
                }
                return performance;
              }),
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

// Subject site management - missing functions
export const modifySubjectSiteId = (subjectId, oldSiteId, newSiteId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      return {
        ...subject,
        subjectSites: subject.subjectSites.map((site) => {
          if (site.siteId === oldSiteId) {
            return {
              ...site,
              siteId: newSiteId,
            };
          }
          return site;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

// Sample site management - missing functions
export const modifySampleSiteId = (subjectId, sampleId, oldSiteId, newSiteId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId) {
            return {
              ...sample,
              sites: sample.sites.map((site) => {
                if (site.siteId === oldSiteId) {
                  return {
                    ...site,
                    siteId: newSiteId,
                  };
                }
                return site;
              }),
            };
          }
          return sample;
        }),
      };
    }
    return subject;
  });
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
};

export const getDatasetEntityArray = () => {
  return useGlobalStore.getState().datasetEntityArray;
};
