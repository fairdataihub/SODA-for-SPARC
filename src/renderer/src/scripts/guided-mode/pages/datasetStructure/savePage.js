import { countFilesInDatasetStructure } from "../../../utils/datasetStructure";
import useGlobalStore from "../../../../stores/globalStore";
import { contentOptionsMap } from "../../../../components/pages/DatasetContentSelector";
import {
  guidedSkipPage,
  guidedUnSkipPage,
  guidedSkipPageSet,
  guidedUnSkipPageSet,
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

      // If the dataset contains subjects, assume it is experimental by default
      window.sodaJSONObj["dataset-type"] = "experimental";
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

      // If subjects is not selected (only code), assume it is computational by default
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

    // Handle page skipping based on selections
    if (selectedEntities.includes("subjects")) {
      guidedUnSkipPageSet("guided-subjects-metadata-page-set");
    } else {
      // Delete the existing subjects metadata if it exists
      const existingSubjectsMetadata = window.sodaJSONObj["dataset_metadata"]?.["subjects"];
      if (existingSubjectsMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["subjects"];
      }

      guidedSkipPageSet("guided-subjects-metadata-page-set");
    }

    if (selectedEntities.includes("samples")) {
      guidedUnSkipPageSet("guided-samples-metadata-page-set");
    } else {
      // Delete the existing samples metadata if it exists
      const existingSamplesMetadata = window.sodaJSONObj["dataset_metadata"]?.["samples"];
      if (existingSamplesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["samples"];
      }

      guidedSkipPageSet("guided-samples-metadata-page-set");
    }

    if (selectedEntities.includes("sites")) {
      guidedUnSkipPageSet("guided-sites-metadata-page-set");
    } else {
      guidedSkipPageSet("guided-sites-metadata-page-set");

      // Delete the existing sites metadata if it exists
      const existingSitesMetadata = window.sodaJSONObj["dataset_metadata"]?.["sites"];
      if (existingSitesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["sites"];
      }
    }

    if (selectedEntities.includes("performances")) {
      guidedUnSkipPageSet("guided-performances-metadata-page-set");
    } else {
      guidedSkipPageSet("guided-performances-metadata-page-set");
      // Delete the existing performances metadata if it exists
      const existingPerformancesMetadata = window.sodaJSONObj["dataset_metadata"]?.["performances"];
      if (existingPerformancesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["performances"];
      }
    }

    if (selectedEntities.includes("code")) {
      guidedSkipPage("guided-add-code-metadata-tab");
    } else {
      guidedSkipPage("guided-add-code-metadata-tab");
    }
  }

  if (pageBeingLeftID === "guided-entity-addition-method-selection-tab") {
    // Add validation logic for guided-entity-addition-method-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-manual-dataset-entity-and-metadata-tab") {
    // Add validation logic for guided-manual-dataset-entity-and-metadata-tab if needed
  }

  if (pageBeingLeftID === "guided-spreadsheet-import-dataset-entity-and-metadata-tab") {
    // Add validation logic for guided-manual-dataset-entity-and-metadata-tab if needed
  }

  if (pageBeingLeftID === "guided-spreadsheet-import-dataset-entity-and-metadata-tab") {
    // Add validation logic for guided-spreadsheet-import-dataset-entity-and-metadata-tab if needed
  }

  if (pageBeingLeftID === "guided-sites-selection-tab") {
    // Add validation logic for guided-sites-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-samples-selection-tab") {
    // Add validation logic for guided-samples-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-subjects-selection-tab") {
    // Add validation logic for guided-subjects-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-performances-entity-addition-tab") {
    // Add validation logic for guided-performances-entity-addition-tab if needed
  }

  if (pageBeingLeftID === "guided-Performances-selection-tab") {
    // Add validation logic for guided-Performances-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-modalities-selection-tab") {
    // Page logic handled by the component nothing to do here
  }

  if (pageBeingLeftID === "guided-modalities-data-selection-tab") {
    // Add validation logic for guided-modalities-data-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-dataset-structure-and-manifest-review-tab") {
    const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"];
    // console log the first 3 rows of data
    const headerToSchemaKey = {
      filename: "filename",
      timestamp: "timestamp",
      description: "description",
      "file type": "file_type",
      entity: "entity",
      "data modality": "data_modality",
      "also in dataset": "also_in_dataset",
      "data dictionary path": "data_dictionary_path",
      "entity is transitive": "entity_is_transitive",
      "Additional Metadata": "additional_metadata",
    };

    const convertGuidedManifestToSchema = ({ headers, data }) => {
      return data.map((row) => {
        const obj = {};

        headers.forEach((header, index) => {
          const key = headerToSchemaKey[header];
          if (key) {
            let value = row[index] ?? ""; // fallback to empty string if missing
            // Optional fix for timestamp format (replace comma with dot)
            if (key === "timestamp") {
              value = value.replace(",", ".");
            }
            obj[key] = value;
          }
        });

        return obj;
      });
    };

    const manifestObjects = convertGuidedManifestToSchema(guidedManifestData);
    // Set the manifest objects in the sodaJSONObj at where they will be detected by pysoda
    window.sodaJSONObj["dataset_metadata"]["manifest_file"] = manifestObjects;
  }
};
