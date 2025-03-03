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
export const addSubject = (subjectId) => {
  const { datasetEntityArray } = useGlobalStore.getState();

  // Ensure subject ID starts with "sub-"
  const normalizedSubjectId = subjectId.trim().startsWith("sub-")
    ? subjectId.trim()
    : `sub-${subjectId.trim()}`;

  const newSubject = {
    subjectId: normalizedSubjectId,
    metadata: {},
    samples: [],
    subjectSites: [],
    subjectPerformances: [],
  };

  const updatedDatasetEntityArray = [...datasetEntityArray, newSubject];
  useGlobalStore.setState({
    datasetEntityArray: updatedDatasetEntityArray,
  });
  return newSubject;
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
export const addSampleToSubject = (subjectId, sampleId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId) {
      const samples = subject.samples || [];
      return {
        ...subject,
        samples: [
          ...samples,
          {
            sampleId,
            metadata: {},
            sites: [],
            performances: [],
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

// Subject site management functions
export const addSiteToSubject = (subjectId, siteId) => {
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
            metadata: {},
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
export const addPerformanceToSubject = (subjectId, performanceId) => {
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
            metadata: {},
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

export const addPerformanceToSample = (subjectId, sampleId, performanceId) => {
  const { datasetEntityArray } = useGlobalStore.getState();
  const updatedDatasetEntityArray = datasetEntityArray.map((subject) => {
    if (subject.subjectId === subjectId && subject.samples) {
      return {
        ...subject,
        samples: subject.samples.map((sample) => {
          if (sample.sampleId === sampleId) {
            const performances = sample.performances || [];
            return {
              ...sample,
              performances: [...performances, { performanceId, metadata: {} }],
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
export const addSiteToSample = (subjectId, sampleId, siteId) => {
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
              sites: [...sites, { siteId, metadata: {} }],
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

export const getDatasetEntityArray = () => {
  return useGlobalStore.getState().datasetEntityArray;
};
