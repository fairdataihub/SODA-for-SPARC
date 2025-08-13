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
import { pennsieveDatasetSelectSlice } from "../../../../stores/slices/pennsieveDatasetSelectSlice";

export const savePagePrepareMetadata = async (pageBeingLeftID) => {
  const errorArray = [];
  if (pageBeingLeftID === "guided-manifest-subject-entity-selector-tab") {
    window.sodaJSONObj["subject-related-folders-and-files"] = getEntityObjForEntityType(
      "subject-related-folders-and-files"
    );
  }
  if (pageBeingLeftID === "guided-manifest-performance-entity-selector-tab") {
    window.sodaJSONObj["performance-related-folders-and-files"] = getEntityObjForEntityType(
      "performance-related-folders-and-files"
    );
  }
  if (pageBeingLeftID === "guided-resources-entity-addition-tab") {
    const resourceList = useGlobalStore.getState()["resourceList"];
    if (!resourceList || resourceList.length === 0) {
      // Delete the resources metadata if no resources are added
      if (window.sodaJSONObj["dataset_metadata"]?.["resources"]) {
        delete window.sodaJSONObj["dataset_metadata"]["resources"];
      }
    } else {
      window.sodaJSONObj["dataset_metadata"]["resources"] = resourceList;
    }
  }

  if (pageBeingLeftID === "guided-subjects-metadata-tab") {
    const subjects = getExistingSubjects();

    const subjectsMetadata = subjects.map((subject) => {
      const metadata = { ...subject.metadata };

      if (metadata.age_numeric_value && metadata.age_unit) {
        metadata.age = `${metadata.age_numeric_value} ${metadata.age_unit}`;
      }
      if (metadata.age_range_min_numeric_value && metadata.age_range_unit) {
        metadata.age_range_min = `${metadata.age_range_min_numeric_value} ${metadata.age_range_unit}`;
      }

      if (metadata.age_range_max_numeric_value && metadata.age_range_unit) {
        metadata.age_range_max = `${metadata.age_range_max_numeric_value} ${metadata.age_range_unit}`;
      }

      if (metadata.body_mass_numeric_value && metadata.body_mass_unit) {
        metadata.body_mass = `${metadata.body_mass_numeric_value} ${metadata.body_mass_unit}`;
      }

      // Remove the extraneous fields to prevent schema validation errors
      delete metadata.age_numeric_value;
      delete metadata.age_unit;
      delete metadata.age_range_min_numeric_value;
      delete metadata.age_range_max_numeric_value;
      delete metadata.age_range_unit;
      delete metadata.body_mass_numeric_value;
      delete metadata.body_mass_unit;

      return metadata;
    });
    window.sodaJSONObj["dataset_metadata"]["subjects"] = subjectsMetadata;
  }

  if (pageBeingLeftID === "guided-samples-metadata-tab") {
    // Prepare the samples metadata
    const samples = getExistingSamples();
    const samplesMetadata = samples.map((sample) => {
      return sample.metadata;
    });
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
    if (fundingAgencyDropDownValue !== null) {
      if (fundingAgencyDropDownValue === "NIH") {
        if (fundingConsortiumDropDownValue !== null) {
          fundingConsortium = fundingConsortiumDropDownValue;
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
    // Combine the last and first names of contributors
    contributorInformation.forEach((contributor) => {
      contributor.contributor_name = `${contributor.contributor_last_name}, ${contributor.contributor_first_name}`;
    });

    // Get the properties from the submission page to re-use in the dataset_description metadata
    const fundingConsortium =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["funding_consortium"] || "";
    const fundingAgency = window.sodaJSONObj["funding_agency"] || "";
    const awardNumber =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["award_number"] || "";

    const relatedResourceInformation = window.sodaJSONObj["related_resources"] || [];

    // Populate dataset_metadata > dataset_description
    window.sodaJSONObj["dataset_metadata"]["dataset_description"] = {
      metadata_version: metadataVersion,
      type: numSubjects > 0 ? "experimental" : "computational", // Per curation team, datasets with subjects are experimental, otherwise computational
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
        license: "", // The license key is set on the dedicated license page
      },
      funding_information: {
        funding_consortium: fundingConsortium,
        funding_agency: fundingAgency,
        award_number: awardNumber,
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
    window.sodaJSONObj["dataset_metadata"]["README.md"] = readmeTextContent;
  }

  if (pageBeingLeftID === "guided-create-license-metadata-tab") {
    const datasetLicense = getDropDownState("license-select");
    if (datasetLicense) {
      // Save the selected license to the sodaJSONObj
      window.sodaJSONObj["dataset-license"] = datasetLicense;

      const licenseConfig = {
        "CDLA-Permissive-1.0 – Community Data License Agreement – Permissive": {
          licenseType: "CDLA-Permissive-1.0",
          pennsieveString: "Community Data License Agreement – Permissive",
        },
        "CDLA-Sharing-1.0 – Community Data License Agreement – Sharing": {
          licenseType: "CDLA-Sharing-1.0",
          pennsieveString: "Community Data License Agreement – Sharing",
        },
        "ODbL – Open Data Commons Open Database License": {
          licenseType: "ODbL-1.0",
          pennsieveString: "Open Data Commons Open Database",
        },
        "ODC-By – Open Data Commons Attribution License": {
          licenseType: "ODC-By-1.0",
          pennsieveString: "Open Data Commons Attribution",
        },
        "PDDL – Open Data Commons Public Domain Dedication and License": {
          licenseType: "PDDL-1.0",
          pennsieveString: "Open Data Commons Public Domain Dedication and License",
        },
        "CC-0 – Creative Commons Zero 1.0 Universal": {
          licenseType: "CC0-1.0",
          pennsieveString: "Creative Commons Zero 1.0 Universal",
        },
        "CC-BY – Creative Commons Attribution": {
          licenseType: "CC-BY-4.0",
          pennsieveString: "Creative Commons Attribution",
        },
        "CC-BY-SA – Creative Commons Attribution-ShareAlike": {
          licenseType: "CC-BY-SA-2.0",
          pennsieveString: "Creative Commons Attribution - ShareAlike",
        },
        "CC-BY-NC-SA – Creative Commons Attribution-NonCommercial-ShareAlike": {
          licenseType: "CC-BY-NC-SA-2.0",
          pennsieveString: "Creative Commons Attribution - NonCommercial-ShareAlike",
        },
        "Apache-2.0 – Apache License 2.0": {
          licenseType: "Apache-2.0",
          pennsieveString: "Apache 2.0",
        },
        "GPL – GNU General Public License": {
          licenseType: "GPL-3.0",
          pennsieveString: "GNU General Public License v3.0",
        },
        "LGPL – GNU Lesser General Public License": {
          licenseType: "LGPL-3.0",
          pennsieveString: "GNU Lesser General Public License",
        },
        "MIT – MIT License": {
          licenseType: "MIT",
          pennsieveString: "MIT",
        },
        "MPL-2.0 – Mozilla Public License 2.0": {
          licenseType: "MPL-2.0",
          pennsieveString: "Mozilla Public License 2.0",
        },
      };

      const datasetMetadataLicenseValue = licenseConfig?.[datasetLicense]?.["licenseType"] || "";
      const pennsieveLicenseString = licenseConfig?.[datasetLicense]?.["pennsieveString"] || null;

      // Overwrite the default value in the dataset_description metadata with the selected license
      window.sodaJSONObj["dataset_metadata"]["dataset_description"]["basic_information"][
        "license"
      ] = datasetMetadataLicenseValue;

      // Save the license string to the sodaJSONObj for Pennsieve upload
      window.sodaJSONObj["digital-metadata"]["license"] = pennsieveLicenseString;
    } else {
      // Overwrite the default value in the dataset_description metadata with an empty string
      window.sodaJSONObj["dataset_metadata"]["dataset_description"]["basic_information"][
        "license"
      ] = "";
      window.sodaJSONObj["digital-metadata"]["license"] = null;
    }
  }
};
