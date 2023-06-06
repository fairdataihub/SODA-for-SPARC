const guidedWarnBeforeDeletingPoolSubSamList = async (entityBeingDeleted, listOfItemsToDelete) => {
  const continueWithDeletion = await Swal.fire({
    icon: "warning",
    title: `The following ${entityBeingDeleted} did not have any files added to them:`,

    html: warningMessage,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: `Delete ${entityBeingDeleted}`,
    cancelButtonText: "Cancel deletion",
    reverseButtons: reverseSwalButtons,
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
    let sampleHasFilesAdded = false;

    for (const hlf of guidedHighLevelFolders) {
      const samplePathInHLF = getSampleFolderInHighLevelFolder(sample, hlf);
      if (!folderIsEmpty(samplePathInHLF)) {
        sampleHasFilesAdded = true;
        console.log("sample not empty");
        break;
      }
    }
    if (!sampleHasFilesAdded) {
      console.log("sample empty");
      samplesWithoutAnyFolders.push(sample.sampleName);
    }
  }
  return samplesWithoutAnyFolders;
};

const guidedGetSubjectsWithoutAnyFilesAdded = () => {
  let subjectsWithoutAnyFolders = [];

  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  const subjects = [...subjectsInPools, ...subjectsOutsidePools];
  for (const subject of subjects) {
    let subjectHasFilesAdded = false;

    for (const hlf of guidedHighLevelFolders) {
      const subjectPathInHLF = getSubjectFolderInHighLevelFolder(subject, hlf);
      if (!folderIsEmpty(subjectPathInHLF)) {
        subjectHasFilesAdded = true;
        console.log("subject not empty");
        break;
      }
    }
    if (!subjectHasFilesAdded) {
      console.log("subject empty");
      subjectsWithoutAnyFolders.push(subject.subjectName);
    }
  }
  return subjectsWithoutAnyFolders;
};
