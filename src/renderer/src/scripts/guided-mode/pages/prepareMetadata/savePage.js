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
import {
  getExistingSubjects,
  getExistingSamples,
} from "../../../../stores/slices/datasetEntityStructureSlice";

import { getDropDownState } from "../../../../stores/slices/dropDownSlice";

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

  if (pageBeingLeftID === "guided-subjects-metadata-tab") {
    const subjects = getExistingSubjects();
    const subjectsMetadata = subjects.map((subject) => {
      return subject.metadata;
    });
    console.log("subjectsMetadata", subjectsMetadata);
    window.sodaJSONObj["dataset_metadata"]["subjects_metadata"] = subjectsMetadata;
  }

  if (pageBeingLeftID === "guided-samples-metadata-tab") {
    // Prepare the samples metadata
    const samples = getExistingSamples();
    const samplesMetadata = samples.map((sample) => {
      return sample.metadata;
    });
    console.log("samplesMetadata", samplesMetadata);
    window.sodaJSONObj["dataset_metadata"]["samples_metadata"] = samplesMetadata;
  }

  if (pageBeingLeftID === "guided-submission-metatdata-tab") {
    const fundingAgencyDropDownValue = getDropDownState("guided-funding-agency");
    const fundingConsortiumDropDownValue = getDropDownState("guided-nih-funding-consortium");
    const awardNumber = useGlobalStore.getState().awardNumber || "";

    let fundingAgency = "";
    let fundingConsortium = "EXTERNAL";
    let milestonesAchieved = [];
    let milestoneCompletionDate = "";

    console.log("fundingAgencyDropDownValue", fundingAgencyDropDownValue);
    console.log("fundingConsortiumDropDownValue", fundingConsortiumDropDownValue);

    if (fundingAgencyDropDownValue !== null) {
      if (fundingAgencyDropDownValue === "NIH") {
        if (fundingConsortiumDropDownValue !== null) {
          fundingConsortium = fundingConsortiumDropDownValue;
          console.log("Setting NIH funding consortium to", fundingConsortium);
          if (fundingConsortium === "SPARC") {
            // If SPARC is selected, store the input for milestones and completion date
            milestonesAchieved = useGlobalStore.getState().milestones || [];
            milestoneCompletionDate = useGlobalStore.getState().milestoneDate || "";
          }
        }
      }
      if (fundingAgencyDropDownValue === "Other") {
        // Get the value from the other funding agency input
        fundingAgency = useGlobalStore.getState().manualFudingAgency || "";
      } else {
        // Use the selected value from the dropdown
        fundingAgency = fundingAgencyDropDownValue;
      }
    }

    // Prepare the submission metadata
    window.sodaJSONObj["dataset_metadata"]["submission_metadata"] = {
      consortium_data_standard: "SPARC", // Hardcoded for now (SODA only supports SPARC data standard)
      funding_consortium: fundingConsortium,
      award_number: awardNumber,
      milestone_achieved: milestonesAchieved,
      milestone_completion_date: milestoneCompletionDate,
    };
    console.log(
      "submission_metadata",
      window.sodaJSONObj["dataset_metadata"]["submission_metadata"]
    );
    console.log("fundingAgency", fundingAgency);

    // Save the funding agency name for the dataset_description metadata
    window.sodaJSONObj["funding_agency"] = fundingAgency;
  }

  if (pageBeingLeftID === "guided-create-description-metadata-tab") {
    const metadataVersion = "3.0.0";
    // Get values from digital_metadata
    const title = getGuidedDatasetName();
    const subtitle = getGuidedDatasetSubtitle();

    const subjectsMetadata = window.sodaJSONObj["dataset_metadata"]["subjects_metadata"];
    const samplesMetadata = window.sodaJSONObj["dataset_metadata"]["samples_metadata"];
    const sitesMetadata = window.sodaJSONObj["dataset_metadata"]["sites_metadata"];
    const performancesMetadata = window.sodaJSONObj["dataset_metadata"]["performance_metadata"];

    const numSubjects = subjectsMetadata ? subjectsMetadata.length : 0;
    const numSamples = samplesMetadata ? samplesMetadata.length : 0;
    const numSites = sitesMetadata ? sitesMetadata.length : 0;
    const numPerformances = performancesMetadata ? performancesMetadata.length : 0;

    console.log("subjectsMetadata", subjectsMetadata);
    console.log("samplesMetadata", samplesMetadata);
    console.log("sitesMetadata", sitesMetadata);
    console.log("performancesMetadata", performancesMetadata);

    // Get keywords
    const keywordArray = window.getTagsFromTagifyElement(guidedDatasetKeywordsTagify);
    // Get study description inputs
    const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
    const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
    const studyPrimaryConclusionInput = document.getElementById(
      "guided-ds-study-primary-conclusion"
    );
    const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");

    const studyPurpose = studyPurposeInput.value.trim() || "";
    const studyDataCollection = studyDataCollectionInput.value.trim() || "";
    const studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim() || "";
    const studyCollectionTitle = studyCollectionTitleInput.value.trim() || "";

    // Get tagify study fields
    const studyOrganSystemTags = window.getTagsFromTagifyElement(guidedStudyOrganSystemsTagify);
    const studyApproachTags = window.getTagsFromTagifyElement(guidedStudyApproachTagify);
    const studyTechniqueTags = window.getTagsFromTagifyElement(guidedStudyTechniquesTagify);

    // Get acknowledgments and funding
    const acknowledgmentsInput = document.getElementById("guided-ds-acknowledgments");
    const acknowledgments = acknowledgmentsInput.value.trim() || "";
    let fundingString = "";
    const otherFunding = window.getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);
    if (otherFunding.length > 0) {
      fundingString = otherFunding.join(", ");
    }
    console.log("fundingString", fundingString);
    console.log("studyCollectionTitle", studyCollectionTitle);

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
        funding: fundingString,
        acknowledgments: acknowledgments,
        license: "CC-BY-4.0",
      },
      funding_information: {
        funding_consortium: "ASDF Consortium",
        funding_agency: "ASDF Program",
        award_number: "123",
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
      related_resource_information: [],
      participant_information: {
        number_of_subjects: numSubjects,
        number_of_samples: numSamples,
        number_of_sites: numSites,
        number_of_performances: numPerformances,
      },
    };
  }
};
