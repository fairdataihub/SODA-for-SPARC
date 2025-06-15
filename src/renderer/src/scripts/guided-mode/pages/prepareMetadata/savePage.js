import { getEntityObjForEntityType } from "../../../../stores/slices/datasetEntitySelectorSlice";
import { guidedSkipPage, guidedUnSkipPage } from "../navigationUtils/pageSkipping";
import {
  guidedDatasetKeywordsTagify,
  guidedStudyOrganSystemsTagify,
  guidedStudyApproachTagify,
  guidedStudyTechniquesTagify,
  guidedOtherFundingsourcesTagify,
} from "../../../../scripts/guided-mode/tagifies/tagifies";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils";
import useGlobalStore from "../../../../stores/globalStore";
import { error } from "jquery";

export const savePagePrepareMetadata = async (pageBeingLeftID) => {
  const errorArray = [];
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
  if (pageBeingLeftID === "guided-resources-entity-addition-tab") {
    const resourceList = useGlobalStore.getState()["resourceList"];
    window.sodaJSONObj["dataset_metadata"]["resources_metadata"] = resourceList;
  }

  if (pageBeingLeftID === "guided-create-description-metadata-tab") {
    const metadataVersion = "3.0.0";
    // Get values from digital_metadata
    const title = getGuidedDatasetName();
    const subtitle = getGuidedDatasetSubtitle();

    // Get keywords
    const keywordArray = window.getTagsFromTagifyElement(guidedDatasetKeywordsTagify);

    // Get subject and sample counts
    const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
    const numSubjects = [...subjectsInPools, ...subjectsOutsidePools].length;

    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    const numSamples = [...samplesInPools, ...samplesOutsidePools].length;

    // Get study description inputs
    const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
    const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
    const studyPrimaryConclusionInput = document.getElementById(
      "guided-ds-study-primary-conclusion"
    );
    const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");

    const studyPurpose = studyPurposeInput.value.trim();
    const studyDataCollection = studyDataCollectionInput.value.trim();
    const studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim();
    const studyCollectionTitle = studyCollectionTitleInput.value.trim();

    // Get tagify study fields
    const studyOrganSystemTags = window.getTagsFromTagifyElement(guidedStudyOrganSystemsTagify);
    const studyApproachTags = window.getTagsFromTagifyElement(guidedStudyApproachTagify);
    const studyTechniqueTags = window.getTagsFromTagifyElement(guidedStudyTechniquesTagify);

    // Get acknowledgments and funding
    const acknowledgmentsInput = document.getElementById("guided-ds-acknowledgments");
    const acknowledgments = acknowledgmentsInput.value.trim();
    const otherFunding = window.getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);
    console.log("otherFunding", otherFunding);
    // Populate dataset_metadata > dataset_description
    window.sodaJSONObj["dataset_metadata"]["dataset_description"] = {
      metadata_version: metadataVersion,
      type: "Experimental",
      standards_information: {
        data_standard: "SPARC",
        data_standard_version: "SODA Metadata Standards",
      },
      basic_information: {
        title,
        subtitle,
        description: subtitle,
        keywords: keywordArray,
        funding: otherFunding,
        acknowledgments: acknowledgments,
        license: "CC-BY-4.0",
      },
      funding_information: {
        funding_consortium: otherFunding,
        funding_agency: ["SPARC Program"],
        award_number: ["123"],
      },
      participant_information: {
        number_of_subjects: numSubjects,
        number_of_samples: numSamples,
        number_of_sites: 0,
        number_of_performance: 0,
      },
      study_information: {
        study_purpose: studyPurpose,
        study_data_collection: studyDataCollection,
        study_primary_conclusion: studyPrimaryConclusion,
        study_organ_system: studyOrganSystemTags,
        study_approach: studyApproachTags,
        study_technique: studyTechniqueTags,
        study_collection_title: studyCollectionTitle,
      },
      contributor_information: [],
    };
  }
};
