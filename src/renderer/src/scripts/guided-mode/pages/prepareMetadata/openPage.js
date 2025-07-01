import { setPageLoadingState } from "../navigationUtils/pageLoading";
import {
  addContributor,
  renderDatasetDescriptionContributorsTable,
} from "../../metadata/contributors";
import { addGuidedProtocol } from "../../metadata/protocols";
import Swal from "sweetalert2";
import Cropper from "cropperjs";
import client from "../../../client";
import api from "../../../others/api/api";
import { clientError, userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { createParsedReadme } from "../../../metadata-files/datasetDescription";
import { renderManifestCards } from "../../manifests/manifest";
import { setTreeViewDatasetStructure } from "../../../../stores/slices/datasetTreeViewSlice";
import {
  setEntityType,
  setEntityListForEntityType,
  setActiveEntity,
} from "../../../../stores/slices/datasetEntitySelectorSlice";
import {
  guidedStudyOrganSystemsTagify,
  guidedStudyApproachTagify,
  guidedStudyTechniquesTagify,
  guidedOtherFundingsourcesTagify,
} from "../../tagifies/tagifies";
import { setResourceList } from "../../../../stores/slices/resourceMetadataSlice";
import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";
import { dragDrop, successCheck } from "../../../../assets/lotties/lotties";
import { renderProtocolsTable } from "../../metadata/protocols";
import { swalFileListSingleAction, swalShowInfo } from "../../../utils/swal-utils";
import { guidedDatasetKeywordsTagify } from "../../tagifies/tagifies";
import lottie from "lottie-web";
import { renderAdditionalLinksTable } from "../../guided-curate-dataset";
import { datasetIsSparcFunded } from "../../utils/sodaJSONObj";
import { createStandardizedDatasetStructure } from "../../../../scripts/utils/datasetStructure";
import { setDropdownState } from "../../../../stores/slices/dropDownSlice";
import {
  setManualFundingAgency,
  setAwardNumber,
  setMilestones,
  setMilestoneDate,
} from "../../../../stores/slices/datasetMetadataSlice";
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const openPagePrepareMetadata = async (targetPageID) => {
  console.log(`Opening prepare metadata page: ${targetPageID}`);

  if (targetPageID === "guided-pennsieve-metadata-intro-tab") {
    console.log("Opening Pennsieve metadata intro page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "guided-pennsieve-intro-tab") {
    const elementsToShowWhenLoggedInToPennsieve = document.querySelectorAll(".show-when-logged-in");
    const elementsToShowWhenNotLoggedInToPennsieve =
      document.querySelectorAll(".show-when-logged-out");
    if (!window.defaultBfAccount) {
      elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
        element.classList.add("hidden");
      });
      elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
        element.classList.remove("hidden");
      });
    } else {
      elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
        element.classList.remove("hidden");
      });
      elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
        element.classList.add("hidden");
      });

      const pennsieveIntroText = document.getElementById("guided-pennsive-intro-ps-account");
      // fetch the user's email and set that as the account field's value
      const userInformation = await api.getUserInformation();
      const userEmail = userInformation.email;
      pennsieveIntroText.innerHTML = userEmail;

      try {
        if (window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"]) {
          if (
            window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] ===
            guidedGetCurrentUserWorkSpace()
          ) {
            document.getElementById("guided-confirm-pennsieve-organization-button").click();
          }
        }
      } catch (error) {
        pennsieveIntroAccountDetailsText.innerHTML = "Error loading account details";
      }
    }
  }

  if (targetPageID === "guided-submission-metatdata-tab") {
    console.log("submission metadata when opening submission metadata page");
    console.log(window.sodaJSONObj["dataset_metadata"]?.["submission_metadata"]);
    console.log("Funding agency when opening submission metadata page");
    console.log(window.sodaJSONObj["funding_agency"]);
    // Set the funding agency (currently either NIH or Other)
    const fundingAgency = window.sodaJSONObj["funding_agency"] || "";
    const fundingConsortium =
      window.sodaJSONObj["dataset_metadata"]?.["submission_metadata"]?.["funding_consortium"] || "";

    const awardNumber =
      window.sodaJSONObj["dataset_metadata"]?.["submission_metadata"]?.["award_number"] || "";
    const milestoneAchieved =
      window.sodaJSONObj["dataset_metadata"]?.["submission_metadata"]?.["milestone_achieved"] || [];
    const milestoneCompletionDate =
      window.sodaJSONObj["dataset_metadata"]?.["submission_metadata"]?.[
        "milestone_completion_date"
      ] || "";

    if (fundingAgency) {
      // Set the funding agency dropdown state

      if (fundingAgency === "NIH") {
        setDropdownState("guided-funding-agency", fundingAgency);
        setDropdownState("guided-nih-funding-consortium", fundingConsortium);
        setManualFundingAgency("");
      } else {
        setDropdownState("guided-funding-agency", "Other");
        setDropdownState("guided-nih-funding-consortium", "");
        setManualFundingAgency(fundingAgency);
      }
    } else {
      setDropdownState("guided-funding-agency", "");
      setDropdownState("guided-nih-funding-consortium", "");
      setManualFundingAgency("");
    }

    // If the consortium is SPARC, set the milestones and milestone date
    if (fundingConsortium === "SPARC") {
      setMilestones(milestoneAchieved);
      setMilestoneDate(milestoneCompletionDate);
    } else {
      setMilestones([]);
      setMilestoneDate(null);
    }

    // Set the award number for all funding agencies
    setAwardNumber(awardNumber);
  }

  if (targetPageID === "guided-contributors-tab") {
    renderDatasetDescriptionContributorsTable();
  }

  if (targetPageID === "guided-protocols-tab") {
    renderProtocolsTable();
  }

  if (targetPageID === "guided-create-readme-metadata-tab") {
    const readMeTextArea = document.getElementById("guided-textarea-create-readme");

    const readMe = window.sodaJSONObj["dataset_metadata"]["README"];

    if (readMe) {
      readMeTextArea.value = readMe;
    } else {
      readMeTextArea.value = "";
    }
  }

  if (targetPageID === "guided-add-code-metadata-tab") {
    const startNewCodeDescYesNoContainer = document.getElementById(
      "guided-section-start-new-code-metadata-query"
    );
    const startPennsieveCodeDescYesNoContainer = document.getElementById(
      "guided-section-start-from-pennsieve-code-metadata-query"
    );

    // If the code_description file has been detected on the dataset on Pennsieve, show the
    // "Start from Pennsieve" option, otherwise show the "Start new" option
    if (window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] === "yes") {
      startNewCodeDescYesNoContainer.classList.add("hidden");
      startPennsieveCodeDescYesNoContainer.classList.remove("hidden");
    } else {
      startNewCodeDescYesNoContainer.classList.remove("hidden");
      startPennsieveCodeDescYesNoContainer.classList.add("hidden");
    }

    const codeDescriptionPath =
      window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"];

    const codeDescriptionLottieContainer = document.getElementById(
      "code-description-lottie-container"
    );
    const codeDescriptionParaText = document.getElementById("guided-code-description-para-text");

    if (codeDescriptionPath) {
      codeDescriptionLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: codeDescriptionLottieContainer,
        animationData: successCheck,
        renderer: "svg",
        loop: false,
        autoplay: true,
      });
      codeDescriptionParaText.innerHTML = codeDescriptionPath;
    } else {
      //reset the code metadata lotties and para text
      codeDescriptionLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: codeDescriptionLottieContainer,
        animationData: dragDrop,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      codeDescriptionParaText.innerHTML = "";
    }
  }

  if (targetPageID === "guided-resources-entity-addition-tab") {
    const existingResources = window.sodaJSONObj["dataset_metadata"]["resources_metadata"] || [];
    setResourceList(existingResources);
  }

  if (targetPageID === "guided-create-description-metadata-tab") {
    console.log("Opening dataset description metadata page");
    console.log(
      "Dataset Description Metadata:",
      window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]
    );
    // Load dataset information fields
    const guidedLoadDescriptionDatasetInformation = () => {
      guidedDatasetKeywordsTagify.removeAllTags();
      const datasetInfo =
        window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]?.["dataset-information"] ||
        {};
      if (datasetInfo["keywords"]) {
        guidedDatasetKeywordsTagify.addTags(datasetInfo["keywords"]);
      }
      // Set title, subtitle, description, license, funding, acknowledgments
      const titleInput = document.getElementById("guided-ds-title");
      const subtitleInput = document.getElementById("guided-ds-subtitle");
      const descriptionInput = document.getElementById("guided-ds-description");
      const licenseInput = document.getElementById("guided-ds-license");
      if (titleInput) titleInput.value = datasetInfo["title"] || "";
      if (subtitleInput) subtitleInput.value = datasetInfo["subtitle"] || "";
      if (descriptionInput) descriptionInput.value = datasetInfo["description"] || "";
      if (licenseInput) licenseInput.value = datasetInfo["license"] || "";
      // Funding and acknowledgments
      guidedOtherFundingsourcesTagify.removeAllTags();
      if (datasetInfo["funding"]) guidedOtherFundingsourcesTagify.addTags(datasetInfo["funding"]);
      const acknowledgmentsInput = document.getElementById("guided-ds-acknowledgments");
      if (acknowledgmentsInput) acknowledgmentsInput.value = datasetInfo["acknowledgments"] || "";
    };
    guidedLoadDescriptionDatasetInformation();

    // Load study information fields
    const guidedLoadDescriptionStudyInformation = () => {
      const studyInfo =
        window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]?.["study-information"] ||
        {};
      const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
      const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
      const studyPrimaryConclusionInput = document.getElementById(
        "guided-ds-study-primary-conclusion"
      );
      const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");
      if (studyPurposeInput) studyPurposeInput.value = studyInfo["study_purpose"] || "";
      if (studyDataCollectionInput)
        studyDataCollectionInput.value = studyInfo["study_data_collection"] || "";
      if (studyPrimaryConclusionInput)
        studyPrimaryConclusionInput.value = studyInfo["study_primary_conclusion"] || "";
      if (studyCollectionTitleInput)
        studyCollectionTitleInput.value = studyInfo["study_collection_title"] || "";
      guidedStudyOrganSystemsTagify.removeAllTags();
      guidedStudyApproachTagify.removeAllTags();
      guidedStudyTechniquesTagify.removeAllTags();
      if (studyInfo["study_organ_system"])
        guidedStudyOrganSystemsTagify.addTags(studyInfo["study_organ_system"]);
      if (studyInfo["study_approach"])
        guidedStudyApproachTagify.addTags(studyInfo["study_approach"]);
      if (studyInfo["study_technique"])
        guidedStudyTechniquesTagify.addTags(studyInfo["study_technique"]);
      // Load participant information using savePage keys
      const participantInfo =
        window.sodaJSONObj["dataset_metadata"]?.["description_metadata"]?.[
          "participant-information"
        ] || {};
      const numSubjectsInput = document.getElementById("guided-ds-num-subjects");
      const numSamplesInput = document.getElementById("guided-ds-num-samples");
      const numSitesInput = document.getElementById("guided-ds-num-sites");
      const numPerformanceInput = document.getElementById("guided-ds-num-performance");
      if (numSubjectsInput) numSubjectsInput.value = participantInfo["number_of_subjects"] ?? "";
      if (numSamplesInput) numSamplesInput.value = participantInfo["number_of_samples"] ?? "";
      if (numSitesInput) numSitesInput.value = participantInfo["number_of_sites"] ?? "";
      if (numPerformanceInput)
        numPerformanceInput.value = participantInfo["number_of_performance"] ?? "";
    };
    guidedLoadDescriptionStudyInformation();

    // No contributor_information fields to load here (handled elsewhere)
    renderAdditionalLinksTable();

    const otherFundingLabel = document.getElementById("SPARC-award-other-funding-label");
    if (datasetIsSparcFunded()) {
      otherFundingLabel.innerHTML = ` besides the SPARC Award: ${window.sodaJSONObj["dataset_metadata"]["shared-metadata"]["sparc-award"]}`;
    } else {
      otherFundingLabel.innerHTML = "";
    }
  }

  if (targetPageID === "guided-dataset-metadata-intro-tab") {
    console.log("Opening dataset metadata intro page");
    // Initialize any required components or state for the intro page
  }

  if (targetPageID === "guided-subjects-metadata-tab") {
    console.log("Opening subjects metadata page");
    // This has componentType "entity-metadata-page" which likely handles most of the page functionality
    setEntityType("subjects");
  }

  if (targetPageID === "guided-samples-metadata-tab") {
    console.log("Opening samples metadata page");
    // This has componentType "entity-metadata-page" which likely handles most of the page functionality
    setEntityType("samples");
  }

  if (targetPageID === "guided-create-changes-metadata-tab") {
    console.log("Opening CHANGES metadata page");

    // Handle loading existing CHANGES content if available
    const changesMetadata = window.sodaJSONObj["dataset_metadata"]["CHANGES"];
    const changesTextArea = document.getElementById("guided-textarea-create-changes");

    if (changesTextArea && changesMetadata) {
      changesTextArea.value = changesMetadata;
    } else if (changesTextArea) {
      changesTextArea.value = "";
    }
  }
};

const getContributorFullNames = () => {
  return window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributors"].map(
    (contributor) => {
      return contributor.conName;
    }
  );
};

const getGuidedAdditionalLinks = () => {
  return window.sodaJSONObj["dataset_metadata"]["description-metadata"]["additional-links"].map(
    (link) => link.link
  );
};
