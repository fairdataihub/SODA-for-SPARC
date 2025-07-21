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
    window.sodaJSONObj["dataset_metadata"]["resources"] = resourceList;
  }

  if (pageBeingLeftID === "guided-subjects-metadata-tab") {
    const subjects = getExistingSubjects();
    const subjectsMetadata = subjects.map((subject) => {
      return subject.metadata;
    });
    console.log("subjectsMetadata", subjectsMetadata);
    window.sodaJSONObj["dataset_metadata"]["subjects"] = subjectsMetadata;
  }

  if (pageBeingLeftID === "guided-samples-metadata-tab") {
    // Prepare the samples metadata
    const samples = getExistingSamples();
    const samplesMetadata = samples.map((sample) => {
      return sample.metadata;
    });
    console.log("samplesMetadata", samplesMetadata);
    window.sodaJSONObj["dataset_metadata"]["samples"] = samplesMetadata;
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
    window.sodaJSONObj["dataset_metadata"]["submission"] = {
      consortium_data_standard: "SPARC", // Hardcoded for now (SODA only supports SPARC data standard)
      funding_consortium: fundingConsortium,
      award_number: awardNumber,
      milestone_achieved: milestonesAchieved,
      milestone_completion_date: milestoneCompletionDate,
    };
    console.log("submission metadata", window.sodaJSONObj["dataset_metadata"]["submission"]);
    console.log("fundingAgency", fundingAgency);

    // Save the funding agency name for the dataset_description metadata
    window.sodaJSONObj["funding_agency"] = fundingAgency;
  }

  if (pageBeingLeftID === "guided-contributors-tab") {
    // Make sure the user has added at least one contributor
    const contributors = window.sodaJSONObj["dataset_contributors"];
    if (contributors.length === 0) {
      errorArray.push({
        type: "notyf",
        message: "Please add at least one contributor to your dataset",
      });
      throw errorArray;
    }

    // Make sure at least one contributor has the contributor_role of "PrincipalInvestigator"
    const hasPrincipalInvestigator = contributors.some(
      (contributor) => contributor.contributor_role === "PrincipalInvestigator"
    );
    if (!hasPrincipalInvestigator) {
      errorArray.push({
        type: "notyf",
        message: "Please assign at least one contributor as Principal Investigator",
      });
      throw errorArray;
    }
  }

  if (pageBeingLeftID === "guided-protocols-tab") {
    const buttonYesUserHasProtocols = document.getElementById("guided-button-user-has-protocols");
    const buttonNoDelayProtocolEntry = document.getElementById(
      "guided-button-delay-protocol-entry"
    );

    if (
      !buttonYesUserHasProtocols.classList.contains("selected") &&
      !buttonNoDelayProtocolEntry.classList.contains("selected")
    ) {
      errorArray.push({
        type: "notyf",
        message: "Please indicate if protocols are ready to be added to your dataset",
      });
      throw errorArray;
    }

    if (buttonYesUserHasProtocols.classList.contains("selected")) {
      const protocols = window.sodaJSONObj["related_resources"] || [];

      if (protocols.length === 0) {
        errorArray.push({
          type: "notyf",
          message: "Please add at least one protocol",
        });
        throw errorArray;
      }
    }

    if (buttonNoDelayProtocolEntry.classList.contains("selected")) {
      window.sodaJSONObj["related_resources"] = []; // Clear protocols if user says they will add later
    }
  }

  if (pageBeingLeftID === "guided-create-description-metadata-tab") {
    const metadataVersion = "3.0.0";
    // Get values from digital_metadata
    const title = getGuidedDatasetName();
    const subtitle = getGuidedDatasetSubtitle();

    const subjectsMetadata = window.sodaJSONObj["dataset_metadata"]["subjects"];
    const samplesMetadata = window.sodaJSONObj["dataset_metadata"]["samples"];
    const sitesMetadata = window.sodaJSONObj["dataset_metadata"]["sites"];
    const performancesMetadata = window.sodaJSONObj["dataset_metadata"]["performances"];

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

    const contributorInformation = window.sodaJSONObj["dataset_contributors"] || [];

    const relatedResourceInformation = window.sodaJSONObj["related_resources"] || [];

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
      contributor_information: contributorInformation,
      related_resource_information: relatedResourceInformation,
      participant_information: {
        number_of_subjects: numSubjects,
        number_of_samples: numSamples,
        number_of_sites: numSites,
        number_of_performances: numPerformances,
      },
    };
  }

  if (pageBeingLeftID === "guided-create-readme-metadata-tab") {
    const readMeTextArea = document.getElementById("guided-textarea-create-readme");
    const readmeTextContent = readMeTextArea.value.trim() || "";
    if (!readmeTextContent) {
      errorArray.push({
        type: "notyf",
        message: "Please add a README for your dataset.",
      });
      throw errorArray;
    }
    // Save the README content to the sodaJSONObj
    window.sodaJSONObj["dataset_metadata"]["README"] = readmeTextContent;
  }
};
