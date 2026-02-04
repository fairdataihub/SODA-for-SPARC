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
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
  getEntityDataById,
} from "../../../../stores/slices/datasetEntityStructureSlice";
import {
  deleteSubject,
  deleteSample,
  deleteSite,
} from "../../../../stores/slices/datasetEntityStructureSlice";

import { swalListDoubleAction } from "../../../utils/swal-utils";

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

    // Make local copies so we do not mutate store state directly
    let selectedEntities = [...useGlobalStore.getState().selectedEntities];
    let deSelectedEntities = [...useGlobalStore.getState().deSelectedEntities];

    // Resolve parent-child dependencies until no invalid selections remain
    let changed = true;

    while (changed) {
      changed = false;

      // Iterate over current selections and remove any entity
      // whose required parent entity is no longer selected
      for (const entity of selectedEntities) {
        const parentEntities = contentOptionsMap[entity]?.requiresAnswer || [];

        // If a required parent is missing, this entity cannot remain selected
        const missingParent = parentEntities.some(
          (parentEntity) => !selectedEntities.includes(parentEntity)
        );

        if (missingParent) {
          // Remove the invalid child entity from selected entities
          selectedEntities = selectedEntities.filter((e) => e !== entity);

          // Track it as explicitly de-selected if not already present
          if (!deSelectedEntities.includes(entity)) {
            deSelectedEntities.push(entity);
          }

          // A removal may invalidate additional entities, so run again
          changed = true;
        }
      }
    }
    window.sodaJSONObj["selected-entities"] = selectedEntities;
    window.sodaJSONObj["deSelected-entities"] = deSelectedEntities;

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
      addEntityNameToEntityType("experimental", "experimental");

      guidedUnSkipPageSet("guided-subject-related-page-set");
      guidedUnSkipPageSet("guided-subjects-metadata-page-set");
    } else {
      const existingSubjects = getExistingSubjects().map((subject) => subject.id);
      if (existingSubjects.length > 0) {
        const itemList = [];
        for (const subjId of existingSubjects) {
          const { entityChildren } = getEntityDataById(subjId) || {};

          itemList.push(`Subject: ${subjId}`);
          for (const sampleId of entityChildren?.subjectsSamples || []) {
            itemList.push(`Sample: ${sampleId}`);
          }
          for (const siteId of entityChildren?.subjectsSites || []) {
            itemList.push(`Site: ${siteId}`);
          }
        }
        const isConfirmed = await swalListDoubleAction(
          itemList,
          "Removing Subjects and Related Entities",
          "By de-selecting 'Subjects', all subject-related entities will be removed from the dataset. This includes any samples and sites associated with the subjects. This action cannot be undone. Are you sure you want to proceed?",
          "Yes, remove all subject-related entities",
          "Cancel",
          null
        );
        if (!isConfirmed) {
          errorArray.push({
            type: "notyf",
            message: "Please re-indicate that your dataset includes subjects to continue.",
          });
          throw errorArray;
        }
      }
      for (const subjId of existingSubjects) {
        deleteSubject(subjId);
      }

      removeEntityType("experimental");
      removeEntityType("subjects");
      removeEntityType("samples");
      removeEntityType("derived-samples");
      removeEntityType("sites");
      removeEntityType("performances");

      window.sodaJSONObj["dataset_performances"] = [];

      // Skip all of the experimental pages
      guidedSkipPageSet("guided-subject-related-page-set");

      // Delete the existing subjects related metadata if it exists
      if (window.sodaJSONObj["dataset_metadata"]?.["subjects"]) {
        delete window.sodaJSONObj["dataset_metadata"]["subjects"];
      }

      guidedSkipPageSet("guided-subjects-metadata-page-set");
    }
    if (selectedEntities.includes("samples")) {
      guidedUnSkipPageSet("guided-samples-metadata-page-set");

      if (selectedEntities.includes("derivedSamples")) {
        guidedUnSkipPageSet("guided-derived-samples-metadata-page-set");
      } else {
        const existingDerivedSamples = getExistingSamples("derived-from-samples").map(
          (sample) => sample.id
        );
        if (existingDerivedSamples.length > 0) {
          const itemList = [];
          for (const derivedSampleId of existingDerivedSamples) {
            itemList.push(`Derived Sample: ${derivedSampleId}`);
            const { entityChildren } = getEntityDataById(derivedSampleId) || {};

            for (const siteId of entityChildren?.derivedSamplesSites || []) {
              itemList.push(`Site: ${siteId}`);
            }
          }
          const isConfirmed = await swalListDoubleAction(
            itemList,
            "Removing Derived Samples and Related Entities",
            "By de-selecting 'Derived Samples', all derived sample-related entities will be removed from the dataset. This includes any sites associated with the derived samples. This action cannot be undone. Are you sure you want to proceed?",
            "Yes, remove all derived sample-related entities",
            "Cancel",
            null
          );
          if (!isConfirmed) {
            errorArray.push({
              type: "notyf",
              message: "Please re-indicate that your dataset includes derived samples to continue.",
            });
            throw errorArray;
          }
        }
        for (const derivedSampleId of existingDerivedSamples) {
          deleteSample(derivedSampleId);
        }
        removeEntityType("derived-samples");
        guidedSkipPageSet("guided-derived-samples-metadata-page-set");
      }
    } else {
      const existingSamples = getExistingSamples().map((sample) => sample.id);
      if (existingSamples.length > 0) {
        const itemList = [];
        for (const sampleId of existingSamples) {
          itemList.push(`Sample: ${sampleId}`);
          const { entityChildren } = getEntityDataById(sampleId) || {};

          for (const siteId of entityChildren?.sampleSites || []) {
            itemList.push(`Site: ${siteId}`);
          }
        }
        const isConfirmed = await swalListDoubleAction(
          itemList,
          "Removing Samples and Related Entities",
          "By de-selecting 'Samples', all sample-related entities will be removed from the dataset. This includes any sites associated with the samples. This action cannot be undone. Are you sure you want to proceed?",
          "Yes, remove all sample-related entities",
          "Cancel",
          null
        );
        if (!isConfirmed) {
          errorArray.push({
            type: "notyf",
            message: "Please re-indicate that your dataset includes samples to continue.",
          });
          throw errorArray;
        }
        for (const sampleId of existingSamples) {
          deleteSample(sampleId);
        }
      }

      removeEntityType("samples");
      removeEntityType("derived-samples");
      // Delete the existing samples metadata if it exists
      const existingSamplesMetadata = window.sodaJSONObj["dataset_metadata"]?.["samples"];
      if (existingSamplesMetadata) {
        delete window.sodaJSONObj["dataset_metadata"]["samples"];
      }

      guidedSkipPageSet("guided-samples-metadata-page-set");
      guidedSkipPageSet("guided-derived-samples-metadata-page-set");
    }
    const existingSites = getExistingSites();
    if (selectedEntities.includes("subjectSites") || selectedEntities.includes("sampleSites")) {
      guidedUnSkipPageSet("guided-sites-metadata-page-set");
      const subjectSites = existingSites.filter((site) =>
        site?.metadata?.specimen_id.startsWith("sub-")
      );
      const sampleSites = existingSites.filter((site) =>
        site?.metadata?.specimen_id.startsWith("sam-")
      );

      if (!selectedEntities.includes("subjectSites")) {
        const subjectSiteIds = subjectSites.map((site) => site.id);
        if (subjectSiteIds.length > 0) {
          const isConfirmed = await swalListDoubleAction(
            subjectSiteIds.map((id) => `Site: ${id}`),
            "Removing Subject Sites",
            "By de-selecting 'Subject Sites', all subject sites will be removed from the dataset. This action cannot be undone. Are you sure you want to proceed?",
            "Yes, remove all subject sites",
            "Cancel",
            null
          );
          if (!isConfirmed) {
            errorArray.push({
              type: "notyf",
              message: "Please re-indicate that your dataset includes subject sites to continue.",
            });
            throw errorArray;
          }
          for (const site of subjectSites) {
            deleteSite(site.id);
          }
        }
      }

      if (!selectedEntities.includes("sampleSites")) {
        const sampleSiteIds = sampleSites.map((site) => site.id);
        if (sampleSiteIds.length > 0) {
          const isConfirmed = await swalListDoubleAction(
            sampleSiteIds.map((id) => `Site: ${id}`),
            "Removing Sample Sites",
            "By de-selecting 'Sample Sites', all sample sites will be removed from the dataset. This action cannot be undone. Are you sure you want to proceed?",
            "Yes, remove all sample sites",
            "Cancel",
            null
          );
          if (!isConfirmed) {
            errorArray.push({
              type: "notyf",
              message: "Please re-indicate that your dataset includes sample sites to continue.",
            });
            throw errorArray;
          }
          for (const site of sampleSites) {
            deleteSite(site.id);
          }
        }
      }
    } else {
      if (existingSites.length > 0) {
        const itemList = [];
        for (const site of existingSites) {
          itemList.push(`Site: ${site.id}`);
        }
        const isConfirmed = await swalListDoubleAction(
          itemList,
          "Removing Sites",
          "By de-selecting 'Sites', all sites will be removed from the dataset. This action cannot be undone. Are you sure you want to proceed?",
          "Yes, remove all sites",
          "Cancel",
          null
        );
        if (!isConfirmed) {
          errorArray.push({
            type: "notyf",
            message: "Please re-indicate that your dataset includes sites to continue.",
          });
          throw errorArray;
        }
      }
      for (const site of existingSites) {
        deleteSite(site.id);
      }

      removeEntityType("sites");
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
      const savedPerformances = window.sodaJSONObj?.["dataset_performances"] || [];
      if (savedPerformances.length > 0) {
        const performanceIds = savedPerformances?.map((performance) => performance.performance_id);
        const isConfirmed = await swalListDoubleAction(
          performanceIds.map((id) => `Performance: ${id}`),
          "Removing Performances",
          "By de-selecting 'Performances', all performance entries will be removed from the dataset. This action cannot be undone. Are you sure you want to proceed?",
          "Yes, remove all performances",
          "Cancel",
          null
        );
        if (!isConfirmed) {
          errorArray.push({
            type: "notyf",
            message: "Please re-indicate that your dataset includes performances to continue.",
          });
          throw errorArray;
        }
      }
      window.sodaJSONObj["dataset_performances"] = [];
      removeEntityType("performances");
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
