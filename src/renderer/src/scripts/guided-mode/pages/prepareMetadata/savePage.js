import { getEntityObjForEntityType } from "../../../../stores/slices/datasetEntitySelectorSlice";

export const savePagePrepareMetadata = async (pageBeingLeftID) => {
  if (pageBeingLeftID === "guided-manifest-subject-entity-selector-tab") {
    window.sodaJSONObj["subject-related-folders-and-files"] = getEntityObjForEntityType(
      "subject-related-folders-and-files"
    );
    console.log(
      "subject-related-folders-and-files",
      window.sodaJSONObj["subject-related-folders-and-files"]
    );
  }
  if (pageBeingLeftID === "guided-manifest-performance-entity-selector-tab") {
    window.sodaJSONObj["performance-related-folders-and-files"] = getEntityObjForEntityType(
      "performance-related-folders-and-files"
    );
    console.log(
      "performance-related-folders-and-files",
      window.sodaJSONObj["performance-related-folders-and-files"]
    );
  }
};
