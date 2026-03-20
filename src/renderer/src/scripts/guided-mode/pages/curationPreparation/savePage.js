import useGlobalStore from "../../../../stores/globalStore";
import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";
import { createOrUpdateProgressFileSaveInfo } from "../../resumeProgress/progressFile";

export const savePageCurationPreparation = async (pageBeingLeftID) => {
  const errorArray = [];

  if (pageBeingLeftID === "guided-name-subtitle-tab") {
    const datasetNameInput = useGlobalStore.getState().guidedDatasetName.trim();
    const datasetSubtitleInput = useGlobalStore.getState().guidedDatasetSubtitle.trim();

    if (!datasetNameInput) {
      errorArray.push({ type: "notyf", message: "Please enter a dataset name." });
    }
    if (!datasetSubtitleInput) {
      errorArray.push({ type: "notyf", message: "Please enter a dataset subtitle." });
    }

    if (errorArray.length > 0) {
      throw errorArray;
    }

    window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;

    try {
      createOrUpdateProgressFileSaveInfo(datasetNameInput);
    } catch (error) {
      errorArray.push({
        type: "notyf",
        message: error.message,
      });
      throw errorArray;
    }

    window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
    window.log.info("[guided-name-subtitle-tab] Finalized dataset name:", datasetNameInput);
  }
};
