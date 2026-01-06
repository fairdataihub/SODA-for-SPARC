import { countFilesInDatasetStructure } from "../../../utils/datasetStructure";
import useGlobalStore from "../../../../stores/globalStore";
import { contentOptionsMap } from "../../../../components/pages/DatasetContentSelector";
import {
  guidedSkipPage,
  guidedUnSkipPage,
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import {
  addEntityNameToEntityType,
  removeEntityFromEntityList,
  removeEntityType,
} from "../../../../stores/slices/datasetEntitySelectorSlice";

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
    // At this point, we know all visible questions were answered
    // Now determine the workflow based on selected and de-selected answers
    const selectedEntities = useGlobalStore.getState()["selectedEntities"];
    const deSelectedEntities = useGlobalStore.getState()["deSelectedEntities"];

    // Validate that all questions that should be visible were answered
    const visibleQuestions = Object.keys(contentOptionsMap).filter((key) => {
      const option = contentOptionsMap[key];

      // Check requiresAnswer dependencies (need "yes" answers)
      if (option.requiresAnswer && option.requiresAnswer.length > 0) {
        for (const dependency of option.requiresAnswer) {
          if (!selectedEntities.includes(dependency)) {
            return false; // Hide if dependency doesn't have a "yes" answer
          }
        }
      }

      // Check requiresSelection dependencies (need any answer)
      if (option.requiresSelection && option.requiresSelection.length > 0) {
        // ALL dependencies need to be answered (either yes or no)
        for (const dependency of option.requiresSelection) {
          if (!selectedEntities.includes(dependency) && !deSelectedEntities.includes(dependency)) {
            return false; // Hide if any dependency hasn't been answered
          }
        }
      }

      return true; // This question should be visible
    });

    for (const entity of visibleQuestions) {
      const isSelected = selectedEntities.includes(entity);
      const isDeselected = deSelectedEntities.includes(entity);
      const isUnanswered = !isSelected && !isDeselected;

      if (isUnanswered) {
        console.error(`VALIDATION FAILED: Question '${entity}' is unanswered!`);
        errorArray.push({
          type: "notyf",
          message: "Please answer all questions before continuing.",
        });
        throw errorArray;
      }
    }

    // Determine which high-level folders to include based on selections
    const possibleNonDataFolders = ["Code", "Protocol", "Docs"];

    // Filter selected entities to get the actual folder selections
    const nonDataFolders = possibleNonDataFolders.filter((folder) =>
      selectedEntities.includes(folder)
    );

    // Set up supporting data categorization entities and page visibility
    // Show/hide the supporting data categorization page based on whether user has any supporting folders
    if (nonDataFolders.length > 0) {
      guidedUnSkipPage("non-data-categorization-tab");
    } else {
      guidedSkipPage("non-data-categorization-tab");
    }

    window.sodaJSONObj["non-data-folders"] = nonDataFolders;

    // Update entity list: add selected folders, remove unselected ones
    for (const folder of possibleNonDataFolders) {
      if (nonDataFolders.includes(folder)) {
        addEntityNameToEntityType("non-data-folders", folder);
      } else {
        removeEntityFromEntityList("non-data-folders", folder);
      }
    }

    // Per the sparc team, if the dataset contains subjects, it's experimental, otherwise computational
    // (Further follow up required regarding "device" type datasets...)
    const datasetType = selectedEntities.includes("subjects") ? "experimental" : "computational";
    window.sodaJSONObj["dataset-type"] = datasetType;

    if (selectedEntities.includes("subjects")) {
      // Unskip all of the experimental pages

      addEntityNameToEntityType("experimental", "experimental");

      guidedUnSkipPageSet("guided-subject-related-page-set");
      guidedUnSkipPageSet("guided-subjects-metadata-page-set");
    } else {
      removeEntityType("experimental");
      removeEntityType("subjects");

      // Skip all of the experimental pages
      guidedSkipPageSet("guided-subject-related-page-set");

      // Delete the existing subjects metadata if it exists
      const existingSubjectsMetadata = window.sodaJSONObj["dataset_metadata"]?.["subjects"];
      if (existingSubjectsMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["subjects"];
      }

      guidedSkipPageSet("guided-subjects-metadata-page-set");
    }

    // Store selections
    window.sodaJSONObj["selected-entities"] = selectedEntities;
    window.sodaJSONObj["deSelected-entities"] = deSelectedEntities;

    if (selectedEntities.includes("code")) {
      guidedSkipPage("guided-add-code-metadata-tab");
    } else {
      guidedSkipPage("guided-add-code-metadata-tab");
    }

    if (selectedEntities.includes("subjects") && selectedEntities.includes("samples")) {
      guidedUnSkipPageSet("guided-samples-metadata-page-set");
    } else {
      removeEntityType("samples");
      // Delete the existing samples metadata if it exists
      const existingSamplesMetadata = window.sodaJSONObj["dataset_metadata"]?.["samples"];
      if (existingSamplesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["samples"];
      }

      guidedSkipPageSet("guided-samples-metadata-page-set");
    }

    if (selectedEntities.includes("samples") && selectedEntities.includes("derivedSamples")) {
      console.log("Unskipping derived samples page");
      guidedUnSkipPageSet("guided-derived-samples-metadata-page-set");
    } else {
      console.log("Skipping derived samples page");
      removeEntityType("derived-samples");
      guidedSkipPageSet("guided-derived-samples-metadata-page-set");
    }

    if (
      (selectedEntities.includes("subjects") && selectedEntities.includes("subjectSites")) ||
      selectedEntities.includes("sampleSites")
    ) {
      guidedUnSkipPageSet("guided-sites-metadata-page-set");
    } else {
      removeEntityType("sites");
      guidedSkipPageSet("guided-sites-metadata-page-set");

      // Delete the existing sites metadata if it exists
      const existingSitesMetadata = window.sodaJSONObj["dataset_metadata"]?.["sites"];
      if (existingSitesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["sites"];
      }
    }

    if (selectedEntities.includes("subjects") && selectedEntities.includes("performances")) {
      guidedUnSkipPageSet("guided-performances-metadata-page-set");
    } else {
      removeEntityType("performances");
      guidedSkipPageSet("guided-performances-metadata-page-set");
      // Delete the existing performances metadata if it exists
      const existingPerformancesMetadata = window.sodaJSONObj["dataset_metadata"]?.["performances"];
      if (existingPerformancesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["performances"];
      }
    }
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
