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
import {
  getExistingSubjects,
  getExistingSamples,
} from "../../../../stores/slices/datasetEntityStructureSlice";
import {
  CONTRIBUTORS_REGEX,
  affiliationRorIsValid,
} from "../../metadata/contributors/contributorsValidation";
import {
  countFilesInDatasetStructure,
  getFileTypesArrayInDatasetStructure,
} from "../../../utils/datasetStructure";
import { bytesToReadableSize } from "../../generateDataset/generate";
import client from "../../../client";
import { swalListSingleAction } from "../../../utils/swal-utils";

import { getDropDownState } from "../../../../stores/slices/dropDownSlice";
import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";
import { sortContributorRoles } from "../../metadata/contributors/contributors";

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
      // Make sure all resources at least have a RRID
      const invalidResources = resourceList.filter(
        (resource) => !resource.rrid || resource.rrid.trim() === ""
      );
      if (invalidResources.length > 0) {
        errorArray.push({
          type: "notyf",
          message: "Please make sure all resources have a valid RRID.",
        });
        throw errorArray;
      }

      // Check for resources with invalid RRID format
      // (This is to throw an error for old progress files that may have invalid RRID formats)
      const resourcesWithInvalidRrid = resourceList
        .filter((resource) => {
          const rridValue = resource.rrid;
          return !window.evaluateStringAgainstSdsRequirements(rridValue, "string-is-valid-rrid");
        })
        .map((resource) => resource.name);
      if (resourcesWithInvalidRrid.length > 0) {
        await swalListSingleAction(
          resourcesWithInvalidRrid,
          "Invalid RRID Format",
          "The following resources have invalid RRID formats. Please update them to use valid RRID format (e.g., RRID:IMSR_JAX:000664, RRID:AB_123456, RRID:SCR_123456).",
          "Please correct the RRID format for each resource in the list above."
        );
        errorArray.push({
          type: "notyf",
          message: `Please correct the RRID format for all resources before continuing.`,
        });
        throw errorArray;
      }

      // Check for resources with invalid URL format
      // (This is to throw an error for old progress files that may have invalid URL formats)
      const resourcesWithInvalidUrl = resourceList
        .filter((resource) => {
          const urlValue = resource.url;
          return (
            urlValue &&
            urlValue.trim() !== "" &&
            !window.evaluateStringAgainstSdsRequirements(urlValue, "string-is-valid-url-or-doi")
          );
        })
        .map((resource) => resource.name);
      if (resourcesWithInvalidUrl.length > 0) {
        await swalListSingleAction(
          resourcesWithInvalidUrl,
          "Invalid URL Format",
          "The following resources have invalid URL formats. Please update them to use valid HTTPS URLs, DOIs (e.g., 10.1000/xyz123), or DOI URLs (e.g., https://doi.org/10.1000/xyz123).",
          "Please correct the URL format for each resource in the list above."
        );
        errorArray.push({
          type: "notyf",
          message: `Please correct the URL format for all resources before continuing.`,
        });
        throw errorArray;
      }
      // Save the resources metadata
      window.sodaJSONObj["dataset_metadata"]["resources"] = resourceList;
    }
  }

  if (
    pageBeingLeftID === "guided-subjects-metadata-tab" ||
    pageBeingLeftID === "guided-manual-dataset-entity-and-metadata-tab"
  ) {
    const subjects = getExistingSubjects();
    // Check for subjects with invalid protocol URL or DOI format
    // (This is to throw an error for old progress files that may have invalid protocol formats)
    const subjectsWithInvalidProtocol = subjects
      .filter((subject) => {
        const protocolValue = subject.metadata.protocol_url_or_doi;
        return (
          protocolValue &&
          protocolValue.trim() !== "" &&
          !window.evaluateStringAgainstSdsRequirements(protocolValue, "string-is-valid-url-or-doi")
        );
      })
      .map((subject) => subject.metadata.subject_id);
    if (subjectsWithInvalidProtocol.length > 0) {
      await swalListSingleAction(
        subjectsWithInvalidProtocol,
        "Invalid Protocol URL or DOI Format",
        "The following subjects have invalid protocol URL or DOI formats. Please update them to use valid HTTPS URLs, DOIs (e.g., 10.1000/xyz123), or DOI URLs (e.g., https://doi.org/10.1000/xyz123).",
        "Please correct the protocol URL or DOI format for each subject in the list above."
      );
      errorArray.push({
        type: "notyf",
        message: `Please correct the protocol URL or DOI format for all subjects before continuing.`,
      });
      throw errorArray;
    }

    // Check for subjects with invalid RRID format
    // (This is to throw an error for old progress files that may have invalid RRID formats)
    const subjectsWithInvalidRrid = subjects
      .filter((subject) => {
        const rridValue = subject.metadata.rrid_for_strain;
        return (
          rridValue &&
          rridValue.trim() !== "" &&
          !window.evaluateStringAgainstSdsRequirements(rridValue, "string-is-valid-rrid")
        );
      })
      .map((subject) => subject.metadata.subject_id);
    if (subjectsWithInvalidRrid.length > 0) {
      await swalListSingleAction(
        subjectsWithInvalidRrid,
        "Invalid RRID Format",
        "The following subjects have invalid RRID formats. Please update them to use valid RRID format (e.g., RRID:IMSR_JAX:000664, RRID:AB_123456, RRID:SCR_123456).",
        "Please correct the RRID format for each subject in the list above."
      );
      errorArray.push({
        type: "notyf",
        message: `Please correct the RRID format for all subjects before continuing.`,
      });
      throw errorArray;
    }
  }

  if (pageBeingLeftID === "guided-subjects-metadata-tab") {
    const subjects = getExistingSubjects();
    const samplesDerivedFromSubjects = getExistingSamples("derived-from-subjects");

    const subjectsMetadata = subjects.map((subject) => {
      const metadata = { ...subject.metadata };

      if (metadata.age_numeric_value && metadata.age_unit) {
        metadata.age = `${metadata.age_numeric_value} ${metadata.age_unit}`;
      } else {
        metadata.age = "";
      }
      if (metadata.age_range_min_numeric_value && metadata.age_range_unit) {
        metadata.age_range_min = `${metadata.age_range_min_numeric_value} ${metadata.age_range_unit}`;
      } else {
        metadata.age_range_min = "";
      }
      if (metadata.age_range_max_numeric_value && metadata.age_range_unit) {
        metadata.age_range_max = `${metadata.age_range_max_numeric_value} ${metadata.age_range_unit}`;
      } else {
        metadata.age_range_max = "";
      }
      if (metadata.body_mass_numeric_value && metadata.body_mass_unit) {
        metadata.body_mass = `${metadata.body_mass_numeric_value} ${metadata.body_mass_unit}`;
      } else {
        metadata.body_mass = "";
      }

      // Get the number of samples derived directly from the subject
      const subjectId = metadata.subject_id;
      const numberOfSamplesDerivedFromThisSubject = samplesDerivedFromSubjects.filter(
        (sample) => sample.metadata.was_derived_from === subjectId
      ).length;

      metadata.number_of_directly_derived_samples = `${numberOfSamplesDerivedFromThisSubject}`;

      // Check if the subject has any files in the dataset-entity-obj
      const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
      const subjectFiles = datasetEntityObj.subjects?.[metadata.subject_id] || {};
      const hasFiles = Object.keys(subjectFiles).length > 0;

      // Set metadata_only field based on whether the subject has associated files
      metadata.metadata_only = hasFiles ? "no" : "yes";

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

  if (
    pageBeingLeftID === "guided-subjects-metadata-tab" ||
    pageBeingLeftID === "guided-manual-dataset-entity-and-metadata-tab"
  ) {
    const samples = getExistingSamples();

    // Check for samples with invalid protocol URL or DOI format
    // (This is to throw an error for old progress files that may have invalid protocol formats)
    const samplesWithInvalidProtocol = samples
      .filter((sample) => {
        const protocolValue = sample.metadata.protocol_url_or_doi;
        return (
          protocolValue &&
          protocolValue.trim() !== "" &&
          !window.evaluateStringAgainstSdsRequirements(protocolValue, "string-is-valid-url-or-doi")
        );
      })
      .map((sample) => sample.metadata.sample_id);
    if (samplesWithInvalidProtocol.length > 0) {
      await swalListSingleAction(
        samplesWithInvalidProtocol,
        "Invalid Protocol URL or DOI Format",
        "The following samples have invalid protocol URL or DOI formats. Please update them to use valid HTTPS URLs, DOIs (e.g., 10.1000/xyz123), or DOI URLs (e.g., https://doi.org/10.1000/xyz123).",
        "Please correct the protocol URL or DOI format for each sample in the list above."
      );
      errorArray.push({
        type: "notyf",
        message: `Please correct the protocol URL or DOI format for all samples before continuing.`,
      });
      throw errorArray;
    }
  }

  if (pageBeingLeftID === "guided-samples-metadata-tab") {
    // Prepare the samples metadata
    const samples = getExistingSamples();

    const samplesMetadata = samples.map((sample) => {
      const metadata = { ...sample.metadata };

      // Check if the sample has any files in the dataset-entity-obj
      const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
      const nonDerivativeSampleFiles = datasetEntityObj?.samples || {};
      const derivedSampleFiles = datasetEntityObj?.["derived-samples"] || {};
      const sampleFiles = { ...nonDerivativeSampleFiles, ...derivedSampleFiles };
      const thisSamplesFiles = sampleFiles[metadata.sample_id] || {};
      const hasFiles = Object.keys(thisSamplesFiles).length > 0;

      // Set metadata_only field based on whether the sample has associated files
      metadata.metadata_only = hasFiles ? "no" : "yes";

      // Get the amount of samples derived from this sample
      const sampleId = metadata.sample_id;
      const derivedSamples = samples.filter((s) => s.metadata.was_derived_from === sampleId);
      const numberOfDirectlyDerivedSamples = derivedSamples.length;

      metadata.number_of_directly_derived_samples = `${numberOfDirectlyDerivedSamples}`;

      return metadata;
    });
    window.sodaJSONObj["dataset_metadata"]["samples"] = samplesMetadata;
  }

  if (pageBeingLeftID === "guided-submission-metatdata-tab") {
    const fundingAgencyDropDownValue = getDropDownState("guided-funding-agency");
    const fundingConsortiumDropDownValue = getDropDownState("guided-nih-funding-consortium");
    const awardNumber = useGlobalStore.getState().awardNumber || "";

    let fundingAgency = "";
    let fundingConsortium = "";
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
    // Ensure milestone_completion_date is stored as an ISO 8601 string (if provided)
    let milestoneCompletionIso = "";
    if (milestoneCompletionDate) {
      try {
        const dateObj =
          milestoneCompletionDate instanceof Date
            ? milestoneCompletionDate
            : new Date(milestoneCompletionDate);
        if (!isNaN(dateObj)) {
          milestoneCompletionIso = dateObj.toISOString();
        }
      } catch (err) {
        // Fallback: leave empty string if it cannot be parsed
        milestoneCompletionIso = "";
      }
    }

    window.sodaJSONObj["dataset_metadata"]["submission"] = {
      consortium_data_standard: "SPARC", // Hardcoded for now (SODA only supports SPARC data standard)
      funding_consortium: fundingConsortium,
      award_number: awardNumber,
      milestone_achieved: milestonesAchieved,
      milestone_completion_date: milestoneCompletionIso,
    };
    // Save the funding agency name for the dataset_description metadata
    window.sodaJSONObj["funding_agency"] = fundingAgency;
  }

  if (pageBeingLeftID === "guided-contributors-tab") {
    const contributorInformation = (window.sodaJSONObj["dataset_contributors"] || []).map(
      (contributor) => ({
        ...contributor,
        contributor_roles: sortContributorRoles(contributor.contributor_roles || []),
      })
    );

    // Make sure the user has added at least one contributor
    if (contributorInformation.length === 0) {
      errorArray.push({
        type: "notyf",
        message: "Please add at least one contributor to your dataset",
      });
      throw errorArray;
    }

    // Make sure one and only one Principal Investigator is assigned
    const principalInvestigators = contributorInformation.filter((contributor) =>
      contributor.contributor_roles.includes("PrincipalInvestigator")
    );
    if (principalInvestigators.length === 0) {
      errorArray.push({
        type: "notyf",
        message: "Please assign at least one contributor as Principal Investigator",
      });
      throw errorArray;
    }

    if (principalInvestigators.length > 1) {
      errorArray.push({
        type: "notyf",
        message: "Please assign only one contributor as Principal Investigator",
      });
      throw errorArray;
    }

    // For contributors that were assigned the "Creator" role, make sure they have at least one other role too
    const creatorsWithNoOtherRole = contributorInformation.filter(
      (contributor) =>
        contributor.contributor_roles.includes("Creator") &&
        contributor.contributor_roles.length === 1
    );
    if (creatorsWithNoOtherRole.length > 0) {
      errorArray.push({
        type: "notyf",
        message: `Please assign at least one additional role to the contributor "${creatorsWithNoOtherRole[0].contributor_name}" who was assigned the "Creator" role.`,
      });
      throw errorArray;
    }

    // Validate the contributor names match the Regular Expression
    contributorInformation.forEach((contributor) => {
      if (!CONTRIBUTORS_REGEX.test(contributor["contributor_name"])) {
        errorArray.push({
          type: "notyf",
          message: `The contributor name "${contributor["contributor_name"]}" is not in the correct format. Please use the format: Last, First Middle.`,
        });
      }

      if (!affiliationRorIsValid(contributor["contributor_affiliation"])) {
        errorArray.push({
          type: "notyf",
          message: `The contributor affiliation "${contributor["contributor_affiliation"]}" is not a valid ROR. Please use a valid ROR format (e.g., https://ror.org/04ttjf776).`,
        });
      }
    });

    // Save the validated contributor information
    window.sodaJSONObj["dataset_contributors"] = contributorInformation;

    if (errorArray.length > 0) {
      throw errorArray;
    }
  }

  if (pageBeingLeftID === "guided-protocols-tab") {
    const userIndicatedTheirProtocolsAreReady = isCheckboxCardChecked(
      "guided-button-user-has-protocols"
    );
    const userIndicatedTheyWillAddProtocolsLater = isCheckboxCardChecked(
      "guided-button-delay-protocol-entry"
    );

    if (!userIndicatedTheirProtocolsAreReady && !userIndicatedTheyWillAddProtocolsLater) {
      errorArray.push({
        type: "notyf",
        message: "Please indicate if protocols are ready to be added to your dataset",
      });
      throw errorArray;
    }

    if (userIndicatedTheirProtocolsAreReady) {
      const protocols = window.sodaJSONObj["related_resources"] || [];

      if (protocols.length === 0) {
        errorArray.push({
          type: "notyf",
          message: "Please add at least one protocol",
        });
        throw errorArray;
      }
    }

    if (userIndicatedTheyWillAddProtocolsLater) {
      window.sodaJSONObj["related_resources"] = []; // Clear protocols if user says they will add later
    }
  }

  if (pageBeingLeftID === "guided-create-description-metadata-tab") {
    const metadataVersion = "3.0.2";
    const currentSodaVersion = useGlobalStore.getState().appVersion || "unknown";
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
    const studyDescriptionInput = document.getElementById("guided-ds-study-description");
    const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
    const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
    const studyPrimaryConclusionInput = document.getElementById(
      "guided-ds-study-primary-conclusion"
    );
    const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");

    const studyDescription = studyDescriptionInput.value.trim() || "";
    // Save the study description as is (to be used in the openPage when re-opening the page)
    window.sodaJSONObj["dataset-description"] = studyDescription;

    const studyPurpose = studyPurposeInput.value.trim() || "";
    const studyDataCollection = studyDataCollectionInput.value.trim() || "";
    const studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim() || "";
    const studyCollectionTitle = studyCollectionTitleInput.value.trim() || "";

    // Get tagify study fields
    const studyOrganSystemTags = window.getTagsFromTagifyElement(guidedStudyOrganSystemsTagify);
    const studyApproachTags = window.getTagsFromTagifyElement(guidedStudyApproachTagify);
    const studyTechniqueTags = window.getTagsFromTagifyElement(guidedStudyTechniquesTagify);

    let studyDescriptionFormattedForDatasetDescription;

    // Use the study description as the dataset description. If the user provided a study description,
    // append the number of files and the dataset size to the end of it.
    if (studyDescription !== "") {
      const numberOfFilesInDataset = countFilesInDatasetStructure(
        window.datasetStructureJSONObj?.["folders"]?.["data"]
      );

      const datasetFileTypesArray = getFileTypesArrayInDatasetStructure(
        window.datasetStructureJSONObj?.["folders"]?.["data"]
      ).join(", ");
      // Get dataset size
      const localDatasetSizeReq = await client.post(
        "/curate_datasets/dataset_size",
        { soda_json_structure: window.sodaJSONObj },
        { timeout: 0 }
      );
      const localDatasetSizeInBytes = localDatasetSizeReq.data.dataset_size;
      const formattedDatasetSize = bytesToReadableSize(localDatasetSizeInBytes);

      const descriptionParts = [studyDescription];
      if (studyTechniqueTags.length > 0) {
        descriptionParts.push("Techniques used: " + studyTechniqueTags.join(", "));
      }
      descriptionParts.push(`Number of files in dataset: ${numberOfFilesInDataset}`);
      descriptionParts.push(`File formats in dataset: ${datasetFileTypesArray}`);
      descriptionParts.push(`Dataset size: ${formattedDatasetSize}`);

      studyDescriptionFormattedForDatasetDescription = descriptionParts.join("\n");
    } else {
      studyDescriptionFormattedForDatasetDescription = "";
    }

    // Get acknowledgments and funding
    const acknowledgmentsInput = document.getElementById("guided-ds-acknowledgments");
    const acknowledgments = acknowledgmentsInput.value.trim() || "";
    const fundingArray = window.getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);

    // Get the properties from the submission page to re-use in the dataset_description metadata
    const fundingConsortium =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["funding_consortium"] || "";
    const fundingAgency = window.sodaJSONObj["funding_agency"] || "";
    const awardNumber =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["award_number"] || "";

    const relatedResourceInformation = window.sodaJSONObj["related_resources"] || [];
    const datasetAdditionalLinks = (window.sodaJSONObj["dataset_additional_links"] || []).map(
      (link) => ({
        identifier: link.link,
        identifier_description: link.description,
        identifier_type: link.type,
        relation_type: link.relation,
      })
    );
    // Combine protocols and additional links into related_resource_information
    relatedResourceInformation.push(...datasetAdditionalLinks);

    const datasetType = window.sodaJSONObj["dataset-type"];
    const contributorInformation = window.sodaJSONObj["dataset_contributors"] || [];

    // Populate dataset_metadata > dataset_description
    window.sodaJSONObj["dataset_metadata"]["dataset_description"] = {
      metadata_version: metadataVersion,
      dataset_type: datasetType,
      standards_information: [
        {
          data_standard: "SPARC",
          data_standard_version: "2025.05.01",
        },
        {
          data_standard: "SODA Version",
          data_standard_version: currentSodaVersion,
        },
      ],
      basic_information: {
        title,
        subtitle,
        description: studyDescriptionFormattedForDatasetDescription,
        keywords: keywordArray,
        funding: fundingArray,
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
        "ODbL-1.0 – Open Data Commons Open Database License": {
          licenseType: "ODbL-1.0",
          pennsieveString: "Open Data Commons Open Database",
        },
        "ODC-By-1.0 – Open Data Commons Attribution License": {
          licenseType: "ODC-By-1.0",
          pennsieveString: "Open Data Commons Attribution",
        },
        "PDDL-1.0 – Open Data Commons Public Domain Dedication and License": {
          licenseType: "PDDL-1.0",
          pennsieveString: "Open Data Commons Public Domain Dedication and License",
        },
        "CC0-1.0 – Creative Commons Zero 1.0 Universal": {
          licenseType: "CC0-1.0",
          pennsieveString: "Creative Commons Zero 1.0 Universal",
        },
        "CC-BY-4.0 – Creative Commons Attribution": {
          licenseType: "CC-BY-4.0",
          pennsieveString: "Creative Commons Attribution",
        },
        "CC-BY-SA-4.0 – Creative Commons Attribution-ShareAlike": {
          licenseType: "CC-BY-SA-4.0",
          pennsieveString: "Creative Commons Attribution - ShareAlike",
        },
        "Apache-2.0 – Apache License 2.0": {
          licenseType: "Apache-2.0",
          pennsieveString: "Apache 2.0",
        },
        "GPL-3.0 – GNU General Public License": {
          licenseType: "GPL-3.0",
          pennsieveString: "GNU General Public License v3.0",
        },
        "LGPL-3.0 – GNU Lesser General Public License": {
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
