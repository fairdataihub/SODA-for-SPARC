import { newEmptyFolderObj } from "../../utils/datasetStructure";

const guidedHighLevelFolders = ["primary", "source", "derivative"];

const guidedWarnBeforeDeletingEntity = async (entityType, entityName) => {
  let warningMessage;
  if (entityType === "pool") {
    warningMessage = `Are you sure you want to delete the pool '${entityName}'? After deleting this pool, all subject folders will be moved directly into their high level folders.`;
  }
  if (entityType === "subject") {
    warningMessage = `Are you sure you want to delete the subject '${entityName}'? ${entityName} has folders and files associated with it, and if you continue with the deletion, the folders and files will be deleted as well.`;
  }
  if (entityType === "sample") {
    warningMessage = `Are you sure you want to delete the sample '${entityName}'? ${entityName} has folders and files associated with it, and if you continue with the deletion, the folders and files will be deleted as well.`;
  }

  const continueWithDeletion = await Swal.fire({
    icon: "warning",
    title: "Are you sure?",
    html: warningMessage,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: `Delete ${entityType}`,
    cancelButtonText: "Cancel deletion",
    reverseButtons: window.reverseSwalButtons,
  });

  return continueWithDeletion.isConfirmed;
};

export const guidedGetDatasetId = (sodaJSON) => {
  let datasetId = sodaJSON?.["digital-metadata"]?.["pennsieve-dataset-id"];
  if (datasetId != undefined) {
    return datasetId;
  }

  return "None";
};

export const guidedGetDatasetName = (sodaJSON) => {
  let datasetName = sodaJSON?.["digital-metadata"]?.["name"];
  if (datasetName != undefined) {
    return datasetName;
  }

  return "None";
};

// Returns a boolean that indicates whether or not the user selected that the dataset is SPARC funded
export const datasetIsSparcFunded = () => {
  return (
    window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"] === "SPARC"
  );
};

export const datasetIsREJOINFunded = () => {
  console.log(
    window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"]
  );
  return (
    window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"].trim() === "HEAL"
  )
}

export const guidedGetDatasetOrigin = (sodaJSON) => {
  let datasetOrigin = sodaJSON?.["generate-dataset"]?.["generate-option"];
  if (datasetOrigin === "existing-ps") {
    // Dataset origin is from Pennsieve
    return "Pennsieve";
  }

  // Otherwise origin is new dataset
  return "New";
};
//dataset description (first page) functions
export const guidedCreateSodaJSONObj = () => {
  window.sodaJSONObj = {};

  window.sodaJSONObj["guided-options"] = {};
  window.sodaJSONObj["cuartion-mode"] = "guided";
  window.sodaJSONObj["ps-account-selected"] = {};
  window.sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
  window.sodaJSONObj["generate-dataset"] = {};
  window.sodaJSONObj["generate-dataset"]["destination"] = "ps";
  window.sodaJSONObj["guided-manifest-file-data"] = {};
  window.sodaJSONObj["starting-point"] = { origin: "new" };
  window.sodaJSONObj["dataset_metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["shared-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["protocol-data"] = [];
  window.sodaJSONObj["dataset_metadata"]["pool-subject-sample-structure"] = {};
  window.sodaJSONObj["dataset_metadata"]["pool-subject-sample-structure"]["pools"] = {};
  window.sodaJSONObj["dataset_metadata"]["pool-subject-sample-structure"]["subjects"] = {};
  window.sodaJSONObj["dataset_metadata"]["subject-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["sample-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["submission-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["consortium-data-standard"] = "";
  window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"] = "";
  window.sodaJSONObj["dataset_metadata"]["description-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["code-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["additional-links"] = [];
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributors"] = [];
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"] = [];
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"] = {};
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"] = {};
  window.sodaJSONObj["dataset_metadata"]["README"] = "";
  window.sodaJSONObj["dataset_metadata"]["CHANGES"] = "";
  window.sodaJSONObj["digital-metadata"] = {};
  window.sodaJSONObj["previously-uploaded-data"] = {};
  window.sodaJSONObj["digital-metadata"]["description"] = {};
  window.sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  window.sodaJSONObj["digital-metadata"]["user-permissions"] = [];
  window.sodaJSONObj["digital-metadata"]["team-permissions"] = [];
  window.sodaJSONObj["digital-metadata"]["license"] = "";
  window.sodaJSONObj["completed-tabs"] = [];
  window.sodaJSONObj["skipped-pages"] = [];
  window.sodaJSONObj["last-modified"] = "";
  window.sodaJSONObj["button-config"] = {};
  window.sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] = "false";
  window.datasetStructureJSONObj = { folders: {}, files: {} };
  window.sodaJSONObj["dataset-validated"] = "false";
};

export const attachGuidedMethodsToSodaJSONObj = () => {
  window.sodaJSONObj.addPool = function (poolName, throwErrorIfPoolExists = true) {
    if (this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName]) {
      if (throwErrorIfPoolExists) {
        throw new Error("Pool names must be unique.");
      } else {
        return;
      }
    }

    this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName] = {};
  };
  window.sodaJSONObj.addSubject = function (subjectName, throwErrorIfSubjectExists = true) {
    //check if subject with the same name already exists
    if (
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][subjectName] ||
      this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName]
    ) {
      if (throwErrorIfSubjectExists) {
        throw new Error("Subject names must be unique.");
      } else {
        return;
      }
    }
    this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName] = {};
  };
  window.sodaJSONObj.addSampleToSubject = function (
    sampleName,
    subjectPoolName,
    subjectName,
    throwErrorIfSubjectAlreadyHasSample = true
  ) {
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    //Check samples already added and throw an error if a sample with the sample name already exists.
    for (const sample of samples) {
      if (sample.sampleName === sampleName) {
        if (throwErrorIfSubjectAlreadyHasSample) {
          throw new Error(
            `Sample names must be unique. \n${sampleName} already exists in ${sample.subjectName}`
          );
        }
      }
    }

    if (subjectPoolName) {
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][subjectPoolName][
        subjectName
      ][sampleName] = {};
    } else {
      this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName][
        sampleName
      ] = {};
    }
  };

  window.sodaJSONObj.renamePool = function (prevPoolName, newPoolName) {
    //check if name already exists
    if (prevPoolName != newPoolName) {
      if (this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][newPoolName]) {
        throw new Error("Pool names must be unique.");
      }

      //Rename the pool folder in the window.datasetStructureJSONObj
      for (const highLevelFolder of guidedHighLevelFolders) {
        const prevNamePoolInHighLevelFolder =
          window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
            prevPoolName
          ];

        if (prevNamePoolInHighLevelFolder) {
          if (folderImportedFromPennsieve(prevNamePoolInHighLevelFolder)) {
            if (!prevNamePoolInHighLevelFolder["action"].includes["renamed"]) {
              prevNamePoolInHighLevelFolder["action"].push("renamed");
            }
          }

          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][newPoolName] =
            prevNamePoolInHighLevelFolder;
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            prevPoolName
          ];
        }
      }

      //Rename the pool in the pool-subject-sample-structure
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][newPoolName] =
        this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName];
      delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName];

      //Rename the pool in the window.subjectsTableData
      for (const subjectDataArray of window.subjectsTableData.slice(1)) {
        if (subjectDataArray[1] === prevPoolName) {
          subjectDataArray[1] = newPoolName;
        }
      }

      //Rename the pool in the window.samplesTableData
      for (const sampleDataArray of window.samplesTableData.slice(1)) {
        if (sampleDataArray[3] === prevPoolName) {
          sampleDataArray[3] = newPoolName;
        }
      }
    }
  };
  window.sodaJSONObj.renameSubject = function (prevSubjectName, newSubjectName) {
    if (prevSubjectName === newSubjectName) {
      return;
    }

    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    const subjects = [...subjectsInPools, ...subjectsOutsidePools];

    //Throw an error if the subject name that the user is changing the old subject name
    //to already exists
    if (subjects.filter((subject) => subject.subjectName === newSubjectName).length > 0) {
      throw new Error("Subject names must be unique.");
    }

    for (const subject of subjects) {
      if (subject.subjectName === prevSubjectName) {
        //if the subject is in a pool
        if (subject.poolName) {
          //Rename the subjects folders in the datasetStructJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const prevNameSubjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subject.poolName
              ]?.["folders"]?.[prevSubjectName];

            if (prevNameSubjectFolderInHighLevelFolder) {
              if (folderImportedFromPennsieve(prevNameSubjectFolderInHighLevelFolder)) {
                if (!prevNameSubjectFolderInHighLevelFolder["action"].includes["renamed"]) {
                  prevNameSubjectFolderInHighLevelFolder["action"].push("renamed");
                }
              }
              window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][newSubjectName] = prevNameSubjectFolderInHighLevelFolder;

              delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][prevSubjectName];
            }
          }
          //Update the pool-sub-sam structure to reflect the subject name change
          this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][subject.poolName][
            newSubjectName
          ] =
            this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][subject.poolName][
              prevSubjectName
            ];
          delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][
            subject.poolName
          ][prevSubjectName];
        } else {
          //Rename the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const prevNameSubjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                prevSubjectName
              ];

            if (prevNameSubjectFolderInHighLevelFolder) {
              if (folderImportedFromPennsieve(prevNameSubjectFolderInHighLevelFolder)) {
                if (!prevNameSubjectFolderInHighLevelFolder["action"].includes["renamed"]) {
                  prevNameSubjectFolderInHighLevelFolder["action"].push("renamed");
                }

                window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  newSubjectName
                ] = prevNameSubjectFolderInHighLevelFolder;

                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  prevSubjectName
                ];
              }
            }
          }

          //Update the pool-sub-sam structure to reflect the subject name change
          this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][newSubjectName] =
            this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][prevSubjectName];
          delete this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][
            prevSubjectName
          ];
        }
        //Update the subjects name in the subjects metadata if it exists
        for (let i = 1; i < window.subjectsTableData.length; i++) {
          if (window.subjectsTableData[i][0] === prevSubjectName) {
            window.subjectsTableData[i][0] = newSubjectName;
          }
        }

        //Update the subjects name for all samples the subject had
        for (let i = 1; i < window.samplesTableData.length; i++) {
          if (window.samplesTableData[i][0] === prevSubjectName) {
            window.samplesTableData[i][0] = newSubjectName;
          }
        }
      }
    }
  };
  window.sodaJSONObj.renameSample = function (prevSampleName, newSampleName) {
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    if (prevSampleName != newSampleName) {
      //Check samples already added and throw an error if a sample with the sample name already exists.
      for (const sample of samples) {
        if (sample.sampleName === newSampleName) {
          throw new Error(
            `Sample names must be unique. \n${newSampleName} already exists in ${sample.subjectName}`
          );
        }
      }

      //find the sample and rename it
      for (const sample of samples) {
        if (sample.sampleName === prevSampleName) {
          if (sample.poolName) {
            //Rename the samples folders in the datasetStructeJSONObj
            for (const highLevelFolder of guidedHighLevelFolders) {
              const prevNameSampleFolderInHighLevelFolder =
                window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                  sample.poolName
                ]?.["folders"]?.[sample.subjectName]?.["folders"]?.[prevSampleName];

              if (prevNameSampleFolderInHighLevelFolder) {
                if (folderImportedFromPennsieve(prevNameSampleFolderInHighLevelFolder)) {
                  if (!prevNameSampleFolderInHighLevelFolder["action"].includes["renamed"]) {
                    prevNameSampleFolderInHighLevelFolder["action"].push("renamed");
                  }
                }

                window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][newSampleName] =
                  prevNameSampleFolderInHighLevelFolder;
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][prevSampleName];
              }
            }

            //Update the pool-sub-sam structure to reflect the sample name change
            this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][sample.poolName][
              sample.subjectName
            ][newSampleName] =
              this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][sample.poolName][
                sample.subjectName
              ][prevSampleName];
            delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][
              sample.poolName
            ][sample.subjectName][prevSampleName];
          } else {
            //Rename the samples folders in the datasetStructeJSONObj
            for (const highLevelFolder of guidedHighLevelFolders) {
              const prevNameSampleFolderInHighLevelFolder =
                window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                  sample.subjectName
                ]?.["folders"]?.[prevSampleName];

              if (prevNameSampleFolderInHighLevelFolder) {
                if (folderImportedFromPennsieve(prevNameSampleFolderInHighLevelFolder)) {
                  if (!prevNameSampleFolderInHighLevelFolder["action"].includes["renamed"]) {
                    prevNameSampleFolderInHighLevelFolder["action"].push("renamed");
                  }
                }

                window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][newSampleName] = prevNameSampleFolderInHighLevelFolder;
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][prevSampleName];
              }
            }

            this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][
              sample.subjectName
            ][newSampleName] =
              this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][
                sample.subjectName
              ][prevSampleName];
            delete this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][
              sample.subjectName
            ][prevSampleName];
          }

          //Update the samples name in the samples metadata if it exists
          for (let i = 1; i < window.samplesTableData.length; i++) {
            if (window.samplesTableData[i][1] === prevSampleName) {
              window.samplesTableData[i][1] = newSampleName;
            }
          }
        }
      }
    }
  };
  window.sodaJSONObj.deletePool = function (poolName) {
    //empty the subjects in the pool back into subjects
    let pool = this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName];

    //Loop through the subjects and remove their folders from the pool in the dataset structure
    //this handles moving the subject folders back to the root of the high level folder
    //and removes the pool from the subject/sample metadata arrays
    for (let subject in pool) {
      window.sodaJSONObj.moveSubjectOutOfPool(subject, poolName);
    }

    for (const highLevelFolder of guidedHighLevelFolders) {
      const poolInHighLevelFolder =
        window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[poolName];

      if (poolInHighLevelFolder) {
        if (folderImportedFromPennsieve(poolInHighLevelFolder)) {
          guidedModifyPennsieveFolder(poolInHighLevelFolder, "delete");
        } else {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
        }
      }
    }

    //delete the pool after copying the subjects back into subjects
    delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName];
  };
  window.sodaJSONObj.deleteSubject = async function (subjectName) {
    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    const subjects = [...subjectsInPools, ...subjectsOutsidePools];
    for (const subject of subjects) {
      // Variable to track if the user has been warned about deleting a subject with folders
      let warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown = false;

      if (subject.subjectName === subjectName) {
        //if the subject is in a pool
        if (subject.poolName) {
          //Delete the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const subjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subject.poolName
              ]?.["folders"]?.[subjectName];

            if (subjectFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a subject with folders
                // If they cancel the deletion, we return and the subject or its folders are not deleted
                const continueWithSubjectDeletion = await guidedWarnBeforeDeletingEntity(
                  "subject",
                  subjectName
                );
                if (continueWithSubjectDeletion) {
                  warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(subjectFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(subjectFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  subject.poolName
                ]["folders"][subjectName];
              }
            }
          }

          delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][
            subject.poolName
          ][subjectName];
        } else {
          //if the subject is not in a pool
          //Delete the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const subjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subjectName
              ];

            if (subjectFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a subject with folders
                // If they cancel the deletion, we return and the subject or its folders are not deleted
                const continueWithSubjectDeletion = await guidedWarnBeforeDeletingEntity(
                  "subject",
                  subjectName
                );
                if (continueWithSubjectDeletion) {
                  warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(subjectFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(subjectFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  subjectName
                ];
              }
            }
          }
          delete this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
        }
        // delete the subject's samples
        for (const sample of subject.samples) {
          await window.sodaJSONObj.deleteSample(sample.sampleName, false);
        }
      }
    }
    for (let i = 1; i < window.subjectsTableData.length; i++) {
      if (window.subjectsTableData[i][0] === subjectName) {
        window.subjectsTableData.splice(i, 1);
      }
    }
  };
  window.sodaJSONObj.deleteSample = async function (sampleName) {
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    for (const sample of samples) {
      // Variable to track if the user has been warned about deleting a subject with folders
      let warningBeforeDeletingSampleWithFoldersSwalHasBeenShown = false;

      if (sample.sampleName === sampleName) {
        if (sample.poolName) {
          //Delete the samples folder in the window.datasetStructureJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const sampleFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                sample.poolName
              ]?.["folders"]?.[sample.subjectName]?.["folders"]?.[sampleName];

            if (sampleFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSampleWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a sample with folders
                // If they cancel the deletion, we return and the sample or its folders are not deleted
                const continueWithSampleDeletion = await guidedWarnBeforeDeletingEntity(
                  "sample",
                  sampleName
                );
                if (continueWithSampleDeletion) {
                  warningBeforeDeletingSampleWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(sampleFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(sampleFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][sampleName];
              }
            }
          }

          // Remove the sample from the guided structure
          delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][
            sample.poolName
          ][sample.subjectName][sampleName];
        } else {
          //Delete the samples folder in the window.datasetStructureJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const sampleFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                sample.subjectName
              ]?.["folders"]?.[sampleName];

            if (sampleFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSampleWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a sample with folders
                // If they cancel the deletion, we return and the sample or its folders are not deleted
                const continueWithSampleDeletion = await guidedWarnBeforeDeletingEntity(
                  "sample",
                  sampleName
                );
                if (continueWithSampleDeletion) {
                  warningBeforeDeletingSampleWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(sampleFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(sampleFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][sampleName];
              }
            }
          }

          // Remove the sample from the guided structure
          delete this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][
            sample.subjectName
          ][sampleName];
        }
      }
    }

    // Remove the sample from the samples metadata
    for (let i = 1; i < window.samplesTableData.length; i++) {
      if (window.samplesTableData[i][1] === sampleName) {
        window.samplesTableData.splice(i, 1);
      }
    }
  };

  window.sodaJSONObj.moveSubjectIntoPool = function (subjectName, poolName) {
    //Move the subjects folders in the datasetStructeJSONObj
    for (const highLevelFolder of guidedHighLevelFolders) {
      const subjectFolderOutsidePool =
        window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName];

      if (subjectFolderOutsidePool) {
        // If the target folder doesn't exist, create it
        if (!window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]) {
          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName] =
            newEmptyFolderObj();
        }

        if (folderImportedFromPennsieve(subjectFolderOutsidePool)) {
          guidedMovePennsieveFolder(
            subjectName,
            window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName],
            window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]
          );
        } else {
          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName] = subjectFolderOutsidePool;
        }
        // Delete the subject folder outside the pool
        delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
      }
    }

    //Add the pool name to the window.subjectsTableData if if an entry exists
    for (const subjectDataArray of window.subjectsTableData.slice(1)) {
      if (subjectDataArray[0] === subjectName) {
        subjectDataArray[1] = poolName;
      }
    }

    this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName][subjectName] =
      this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
    delete this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
  };
  window.sodaJSONObj.moveSubjectOutOfPool = function (subjectName, poolName) {
    //Copy the subject folders from the pool into the root of the high level folder
    for (const highLevelFolder of guidedHighLevelFolders) {
      const subjectFolderInPoolFolder =
        window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName];
      if (subjectFolderInPoolFolder) {
        if (folderImportedFromPennsieve(subjectFolderInPoolFolder)) {
          guidedMovePennsieveFolder(
            subjectName,
            window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
              "folders"
            ][subjectName],
            window.datasetStructureJSONObj["folders"][highLevelFolder]
          );
        } else {
          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName] =
            subjectFolderInPoolFolder;
        }
        delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
          "folders"
        ][subjectName];
      }
    }

    //Remove the pool from the subject's entry in the window.subjectsTableData
    for (let i = 1; i < window.subjectsTableData.length; i++) {
      if (window.subjectsTableData[i][0] === subjectName) {
        window.subjectsTableData[i][1] = "";
      }
    }

    //Remove the pool from the samples that belong to the subject
    for (let i = 1; i < window.samplesTableData.length; i++) {
      if (window.samplesTableData[i][0] === subjectName) {
        window.samplesTableData[i][3] = "";
      }
    }

    //Remove the subject from the pool in the guided structures
    this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"][subjectName] =
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName][subjectName];
    delete this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName][
      subjectName
    ];
  };
  window.sodaJSONObj.getPools = function () {
    return this["dataset_metadata"]["pool-subject-sample-structure"]["pools"];
  };
  window.sodaJSONObj.getPoolSubjects = function (poolName) {
    return Object.keys(
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"][poolName]
    );
  };
  window.sodaJSONObj.getAllSamplesFromSubjects = function () {
    let samplesInPools = [];
    let samplesOutsidePools = [];

    //get all the samples in subjects in pools
    for (const [poolName, poolData] of Object.entries(
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(poolData)) {
        for (const sampleName of Object.keys(subjectData)) {
          samplesInPools.push({
            sampleName: sampleName,
            subjectName: subjectName,
            poolName: poolName,
          });
        }
      }
    }

    //get all the samples in subjects not in pools
    for (const [subjectName, subjectData] of Object.entries(
      this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      for (const sampleName of Object.keys(subjectData)) {
        samplesOutsidePools.push({
          sampleName: sampleName,
          subjectName: subjectName,
        });
      }
    }
    return [samplesInPools, samplesOutsidePools];
  };
  window.sodaJSONObj.getAllSubjects = function () {
    let subjectsInPools = [];
    let subjectsOutsidePools = [];

    for (const [poolName, pool] of Object.entries(
      this["dataset_metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(pool)) {
        subjectsInPools.push({
          subjectName: subjectName,
          poolName: poolName,
          samples: Object.keys(subjectData),
        });
      }
    }

    for (const [subjectName, subjectData] of Object.entries(
      this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      subjectsOutsidePools.push({
        subjectName: subjectName,
        samples: Object.keys(subjectData),
      });
    }
    return [subjectsInPools, subjectsOutsidePools];
  };
  window.sodaJSONObj.getSubjectsOutsidePools = function () {
    let subjectsNotInPools = Object.keys(
      this["dataset_metadata"]["pool-subject-sample-structure"]["subjects"]
    );
    return subjectsNotInPools;
  };
  window.sodaJSONObj.getSubjectsInPools = function () {
    return this["dataset_metadata"]["pool-subject-sample-structure"]["pools"];
  };
};
