import { countFilesInDatasetStructure } from "../../../utils/datasetStructure";
import useGlobalStore from "../../../../stores/globalStore";
import { contentOptionsMap } from "../../../../components/pages/DatasetContentSelector";
import {
  guidedSkipPage,
  guidedUnSkipPage,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";

export const savePageDatasetStructure = async (pageBeingLeftID) => {
  console.log(`Saving dataset structure page: ${pageBeingLeftID}`);

  const errorArray = [];

  if (pageBeingLeftID === "guided-unstructured-data-import-tab") {
    console.log("Validating data import page");
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
    console.log("Validating dataset content selections");
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
    console.log("Setting up page skipping based on content selections");

    if (selectedEntities.includes("subjects")) {
      guidedUnSkipPage("guided-subjects-entity-addition-tab");
      guidedUnSkipPage("guided-subjects-selection-tab");
      guidedUnSkipPage("guided-unstructured-data-import-tab");
      guidedUnSkipPage("guided-subjects-metadata-tab");
    } else {
      guidedSkipPage("guided-subjects-entity-addition-tab");
      guidedSkipPage("guided-subjects-selection-tab");
      guidedSkipPage("guided-unstructured-data-import-tab");
      guidedSkipPage("guided-subjects-metadata-tab");
    }

    if (selectedEntities.includes("samples")) {
      guidedUnSkipPage("guided-samples-entity-addition-tab");
      guidedUnSkipPage("guided-samples-selection-tab");
      guidedUnSkipPage("guided-samples-metadata-tab");
    } else {
      guidedSkipPage("guided-samples-entity-addition-tab");
      guidedSkipPage("guided-samples-selection-tab");
      guidedSkipPage("guided-samples-metadata-tab");
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
      guidedSkipPage("guided-add-code-metadata-tab");
    } else {
      guidedSkipPage("guided-code-folder-tab");
      guidedSkipPage("guided-add-code-metadata-tab");
    }
  }

  if (pageBeingLeftID === "guided-entity-addition-method-selection-tab") {
    console.log("Validating Entity Addition Method selection page");
    // Add validation logic for guided-entity-addition-method-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-manual-dataset-entity-and-metadata-tab") {
    console.log("Validating manual dataset entity and metadata page");
    // Add validation logic for guided-manual-dataset-entity-and-metadata-tab if needed
  }

  if (pageBeingLeftID === "guided-spreadsheet-import-dataset-entity-and-metadata-tab") {
    console.log("Validating spreadsheet import dataset entity and metadata page");
    // Add validation logic for guided-spreadsheet-import-dataset-entity-and-metadata-tab if needed
  }

  if (pageBeingLeftID === "guided-sites-selection-tab") {
    console.log("Validating sites selection page");
    // Add validation logic for guided-sites-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-samples-selection-tab") {
    console.log("Validating samples selection page");
    // Add validation logic for guided-samples-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-subjects-selection-tab") {
    console.log("Validating subjects selection page");
    // Add validation logic for guided-subjects-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-performances-entity-addition-tab") {
    console.log("Validating performances entity addition page");
    // Add validation logic for guided-performances-entity-addition-tab if needed
  }

  if (pageBeingLeftID === "guided-Performances-selection-tab") {
    console.log("Validating performances selection page");
    // Add validation logic for guided-Performances-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-modalities-selection-tab") {
    // Page logic handled by the component nothing to do here
  }

  if (pageBeingLeftID === "guided-modalities-data-selection-tab") {
    console.log("Validating modalities data selection page");
    // Add validation logic for guided-modalities-data-selection-tab if needed
  }

  if (pageBeingLeftID === "guided-dataset-structure-and-manifest-review-tab") {
    const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"];
    console.log("guidedManifestData", guidedManifestData);
    console.log("manifestHeaders", guidedManifestData["headers"]);
    // console log the first 3 rows of data
    console.log("manifestData", guidedManifestData["data"].slice(0, 3));

    const headerToSchemaKey = {
      filename: "file_name",
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
