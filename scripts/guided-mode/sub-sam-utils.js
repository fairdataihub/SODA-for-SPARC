const swalWarnBeforeDoingActionOnAList = async (
  itemList,
  swalTitle,
  confirmButtonText,
  cancelButtonText
) => {
  const itemListHTML = itemList
    .map(
      (item) =>
        `
          <div class="div--list-item-in-swal-container">
            ${item}
          </div>
        `
    )
    .join("");
  const continueWithDeletion = await Swal.fire({
    icon: "warning",
    width: "700px",
    title: swalTitle,
    html: `
      <div class="container--scrollable-swal-content">
        ${itemListHTML}
      </div>
    `,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return continueWithDeletion.isConfirmed;
};

const getSampleFolderInHighLevelFolder = (sampleObj, highLevelFolder) => {
  const sampleName = sampleObj.sampleName;
  const subjectName = sampleObj.subjectName;
  const poolName = sampleObj.poolName || null;
  if (poolName) {
    return datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
      "folders"
    ]?.[subjectName]?.["folders"]?.[sampleName];
  } else {
    return datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName]?.[
      "folders"
    ]?.[sampleName];
  }
};

const getSubjectFolderInHighLevelFolder = (subjectObj, highLevelFolder) => {
  const subjectName = subjectObj.subjectName;
  const poolName = subjectObj.poolName || null;
  if (poolName) {
    return datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
      "folders"
    ]?.[subjectName];
  } else {
    return datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName];
  }
};

getPoolFolderInHighLevelFolder = (poolObj, highLevelFolder) => {
  return datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[pool];
};

const guidedGetSamplesWithoutAnyFilesAdded = () => {
  let samplesWithoutAnyFolders = [];

  const [samplesInPools, samplesOutsidePools] = sodaJSONObj.getAllSamplesFromSubjects();
  const samples = [...samplesInPools, ...samplesOutsidePools];
  for (const sample of samples) {
    if (!sampleHasFilesAdded(sample)) {
      samplesWithoutAnyFolders.push(sample.sampleName);
    }
  }
  return samplesWithoutAnyFolders;
};

const sampleHasFilesAdded = (sampleObj) => {
  for (const hlf of guidedHighLevelFolders) {
    const samplePathInHLF = getSampleFolderInHighLevelFolder(sampleObj, hlf);
    if (!folderIsEmpty(samplePathInHLF)) {
      return true;
    }
  }
  return false;
};

const guidedGetSubjectsWithoutAnyFilesAdded = () => {
  let subjectsWithoutAnyFolders = [];

  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  const subjects = [...subjectsInPools, ...subjectsOutsidePools];
  for (const subject of subjects) {
    if (!subjectHasFilesAdded(subject)) {
      subjectsWithoutAnyFolders.push(subject.subjectName);
    }
  }
  return subjectsWithoutAnyFolders;
};

const subjectHasFilesAdded = (subjectObj) => {
  for (const hlf of guidedHighLevelFolders) {
    const subjectPathInHLF = getSubjectFolderInHighLevelFolder(subjectObj, hlf);
    if (!folderIsEmpty(subjectPathInHLF)) {
      return true;
    }
  }
  return false;
};
