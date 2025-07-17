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
  window.sodaJSONObj["dataset_metadata"]["subject-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["sample-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["submission-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["consortium-data-standard"] = "";
  window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"] = "";
  window.sodaJSONObj["dataset_metadata"]["description-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["code-metadata"] = {};
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["additional-links"] = [];
  window.sodaJSONObj["dataset_contributors"] = [];
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"] = [];
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"] = {};
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"] = {};
  window.sodaJSONObj["dataset_metadata"]["README"] = "";
  window.sodaJSONObj["dataset_metadata"]["CHANGES"] = "";
  window.sodaJSONObj["related_resources"] = [];
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
