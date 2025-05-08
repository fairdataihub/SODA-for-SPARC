import { countFilesInDatasetStructure } from "../../../utils/datasetStructure";
import useGlobalStore from "../../../../stores/globalStore";
import { contentOptionsMap } from "../../../../components/pages/DatasetContentSelector";
import {
  guidedSkipPage,
  guidedUnSkipPage,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";

export const savePageDatasetStructure = async (pageBeingLeftID) => {
  const errorArray = [];
  if (pageBeingLeftID === "guided-unstructured-data-import-tab") {
    // Count the files imported into the dataset to make sure they imported something
    const datasetFileCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);
    if (datasetFileCount === 0) {
      errorArray.push({
        type: "notyf",
        message:
          "Please select the data you would like to include in the dataset before continuing.",
      });
      throw errorArray;
    }
  }

  if (pageBeingLeftID === "guided-dataset-content-tab") {
    const selectedEntities = useGlobalStore.getState()["selectedEntities"];
    const deSelectedEntities = useGlobalStore.getState()["deSelectedEntities"];

    console.log("selectedEntities", selectedEntities);
    console.log("deSelectedEntities", deSelectedEntities);

    // Check if any selections were made
    if (selectedEntities.length === 0) {
      errorArray.push({
        type: "notyf",
        message: "Please select 'Yes' for at least one dataset content option before continuing.",
      });
      throw errorArray;
    }

    // If subjects is selected, verify all questions that should be visible were answered
    if (selectedEntities.includes("subjects")) {
      // Determine which questions should be visible based on dependencies
      const visibleQuestions = Object.keys(contentOptionsMap).filter((key) => {
        const option = contentOptionsMap[key];
        // If this option has dependencies, check them all
        if (option.dependsOn && option.dependsOn.length > 0) {
          for (const dependency of option.dependsOn) {
            if (deSelectedEntities.includes(dependency) || !selectedEntities.includes(dependency)) {
              return false; // This question shouldn't be visible
            }
          }
        }
        return true; // This question should be visible
      });

      // Now check if all visible questions were answered
      for (const entity of visibleQuestions) {
        if (!selectedEntities.includes(entity) && !deSelectedEntities.includes(entity)) {
          errorArray.push({
            type: "notyf",
            message: "Please answer all questions before continuing.",
          });
          throw errorArray;
        }
      }

      // If the dataset contains subjects but no code, the dataset type must be experimental
      if (!selectedEntities.includes("code")) {
        window.sodaJSONObj["dataset-type"] = "experimental";
      }
    } else {
      // If subjects is not selected, it must be explicitly marked as No
      if (!deSelectedEntities.includes("subjects")) {
        errorArray.push({
          type: "notyf",
          message: "Please answer the question about subjects (select Yes or No).",
        });
        throw errorArray;
      }

      // If subjects is No, code must be Yes
      if (!selectedEntities.includes("code")) {
        errorArray.push({
          type: "notyf",
          message:
            "Your dataset must contain either subjects or code. Please select 'Yes' for at least one of these options.",
        });
        throw errorArray;
      }

      // Code is selected and subjects is not, so the dataset type must be computational
      window.sodaJSONObj["dataset-type"] = "computational";
    }

    // Store selections
    window.sodaJSONObj["selected-entities"] = selectedEntities;
    window.sodaJSONObj["deSelected-entities"] = deSelectedEntities;

    if (!selectedEntities.includes("subjects") && !selectedEntities.includes("code")) {
      errorArray.push({
        type: "notyf",
        message: "You must indicate that your dataset contains subjects and/or code",
      });
      throw errorArray;
    }

    if (selectedEntities.includes("subjects")) {
      guidedUnSkipPage("guided-subjects-entity-addition-tab");
      guidedUnSkipPage("guided-subjects-selection-tab");
      guidedUnSkipPage("guided-unstructured-data-import-tab");
      guidedUnSkipPage("guided-create-subjects-metadata-tab");
    } else {
      guidedSkipPage("guided-subjects-entity-addition-tab");
      guidedSkipPage("guided-subjects-selection-tab");
      guidedSkipPage("guided-unstructured-data-import-tab");
      guidedSkipPage("guided-create-subjects-metadata-tab");
    }

    if (selectedEntities.includes("samples")) {
      guidedUnSkipPage("guided-samples-entity-addition-tab");
      guidedUnSkipPage("guided-samples-selection-tab");
      guidedUnSkipPage("guided-create-samples-metadata-tab");
    } else {
      guidedSkipPage("guided-samples-entity-addition-tab");
      guidedSkipPage("guided-samples-selection-tab");
      guidedSkipPage("guided-create-samples-metadata-tab");
    }

    if (selectedEntities.includes("sites")) {
      guidedUnSkipPage("guided-sites-entity-addition-tab");
      guidedUnSkipPage("guided-sites-selection-tab");
      guidedUnSkipPage("guided-create-sites-metadata-tab");
    } else {
      guidedSkipPage("guided-sites-entity-addition-tab");
      guidedSkipPage("guided-sites-selection-tab");
      guidedSkipPage("guided-create-sites-metadata-tab");
    }

    if (selectedEntities.includes("performances")) {
      guidedUnSkipPage("guided-performances-entity-addition-tab");
      guidedUnSkipPage("guided-Performances-selection-tab");
      guidedUnSkipPage("guided-create-performances-metadata-tab");
    } else {
      guidedSkipPage("guided-performances-entity-addition-tab");
      guidedSkipPage("guided-Performances-selection-tab");
      guidedSkipPage("guided-create-performances-metadata-tab");
    }

    if (selectedEntities.includes("code")) {
      guidedUnSkipPage("guided-code-folder-tab");
    } else {
      guidedSkipPage("guided-code-folder-tab");
    }
  }

  if (pageBeingLeftID === "data-categorization-tab") {
    const datasetFileCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);
    const datasetEntityObj = useGlobalStore.getState()["datasetEntityObj"];
    const categorizedData = datasetEntityObj?.["categorized-data"];
    console.log("dataset file count", datasetFileCount);
    console.log("datasetEntityObj", datasetEntityObj);
    console.log("categorizedData", categorizedData);
    let categorizedFileCount = 0;
    if (categorizedData) {
      categorizedFileCount = Object.keys(categorizedData).reduce((acc, key) => {
        const files = categorizedData[key];
        return acc + Object.keys(files).length;
      }, 0);
    }

    if (categorizedFileCount === 0) {
      errorArray.push({
        type: "notyf",
        message: "Please categorize your data files before continuing.",
      });
      throw errorArray;
    }

    const countOfFilesCategorizedAsCode = Object.keys(categorizedData["Code"]).length;
    const countOfFilesCategorizedAsExperimental = Object.keys(
      categorizedData["Experimental data"]
    ).length;
    const countOfFilesCategorizedAsOther = Object.keys(categorizedData["Other"]).length;

    if (window.sodaJSONObj["selected-entities"].includes("code")) {
      if (countOfFilesCategorizedAsCode === 0) {
        errorArray.push({
          type: "notyf",
          message: "You must classify at least one file in your dataset as code on this step.",
        });
        throw errorArray;
      }
    }

    if (window.sodaJSONObj["selected-entities"].includes("subjects")) {
      if (countOfFilesCategorizedAsExperimental === 0) {
        errorArray.push({
          type: "notyf",
          message:
            "You must classify at least one file in your dataset as experimental data on this step.",
        });
        throw errorArray;
      }
    }
  }
};
