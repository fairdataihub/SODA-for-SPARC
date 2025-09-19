import { setPageLoadingState } from "../navigationUtils/pageLoading";
import useGlobalStore from "../../../../stores/globalStore";
import { addContributor, renderContributorsTable } from "../../metadata/contributors";
import { addGuidedProtocol } from "../../metadata/protocols";
import Swal from "sweetalert2";
import Cropper from "cropperjs";
import client from "../../../client";
import api from "../../../others/api/api";
import { clientError, userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { createParsedReadme } from "../../../metadata-files/datasetDescription";
import { reRenderTreeView } from "../../../../stores/slices/datasetTreeViewSlice";
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
  if (targetPageID === "guided-pennsieve-metadata-intro-tab") {
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
            console.log("Clicking the confirm button automatically");
            document.getElementById("guided-confirm-pennsieve-organization-button").click();
          }
        }
      } catch (error) {
        pennsieveIntroAccountDetailsText.innerHTML = "Error loading account details";
      }
    }
  }

  if (targetPageID === "guided-submission-metatdata-tab") {
    // Set the funding agency (currently either NIH or Other)
    const fundingAgency = window.sodaJSONObj["funding_agency"] || "";
    const fundingConsortium =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["funding_consortium"] || "";

    const awardNumber =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["award_number"] || "";
    const milestoneAchieved =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["milestone_achieved"] || [];
    const milestoneCompletionDate =
      window.sodaJSONObj["dataset_metadata"]?.["submission"]?.["milestone_completion_date"] || "";

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
      setMilestoneDate(milestoneCompletionDate ? new Date(milestoneCompletionDate) : null);
    } else {
      setMilestones([]);
      setMilestoneDate(null);
    }

    // Set the award number for all funding agencies
    setAwardNumber(awardNumber);
  }

  if (targetPageID === "guided-contributors-tab") {
    renderContributorsTable();
  }

  if (targetPageID === "guided-protocols-tab") {
    renderProtocolsTable();
  }

  if (targetPageID === "guided-create-readme-metadata-tab") {
    const readMeTextArea = document.getElementById("guided-textarea-create-readme");

    // If a README was stored in the old format, convert it to the new format and delete the old one.
    if (window.sodaJSONObj["dataset_metadata"]?.["README"]) {
      window.sodaJSONObj["dataset_metadata"]["README.md"] =
        window.sodaJSONObj["dataset_metadata"]["README"];
      delete window.sodaJSONObj["dataset_metadata"]["README"];
    }

    // get the README content from the sodaJSONObj and set it in the textarea
    const readMe = window.sodaJSONObj["dataset_metadata"]["README.md"] || "";
    readMeTextArea.value = readMe;
  }

  if (targetPageID === "guided-create-license-metadata-tab") {
    setDropdownState("license-select", window.sodaJSONObj["dataset-license"] || "");
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
    const existingResources = window.sodaJSONObj["dataset_metadata"]["resources"] || [];
    setResourceList(existingResources);
  }

  if (targetPageID === "guided-create-description-metadata-tab") {
    const datasetMetadata = window.sodaJSONObj["dataset_metadata"]?.["dataset_description"] || {};
    const basicInformation = datasetMetadata?.["basic_information"] || {};
    const studyInformation = datasetMetadata?.["study_information"] || {};
    const fundingInformation = datasetMetadata?.["funding_information"] || {};

    // Set basic information fields
    guidedDatasetKeywordsTagify.removeAllTags();
    const keywords = basicInformation["keywords"] || [];
    guidedDatasetKeywordsTagify.addTags(keywords);

    // Set the Study information fields
    const studyPurpose = studyInformation["study_purpose"] || "";
    document.getElementById("guided-ds-study-purpose").value = studyPurpose;
    const studyDataCollection = studyInformation["study_data_collection"] || "";
    document.getElementById("guided-ds-study-data-collection").value = studyDataCollection;
    const studyPrimaryConclusion = studyInformation["study_primary_conclusion"] || "";
    document.getElementById("guided-ds-study-primary-conclusion").value = studyPrimaryConclusion;

    guidedStudyOrganSystemsTagify.removeAllTags();
    const studyOrganSystems = studyInformation["study_organ_system"] || [];
    guidedStudyOrganSystemsTagify.addTags(studyOrganSystems);

    guidedStudyApproachTagify.removeAllTags();
    const studyApproach = studyInformation["study_approach"] || [];
    guidedStudyApproachTagify.addTags(studyApproach);

    guidedStudyTechniquesTagify.removeAllTags();
    const studyTechniques = studyInformation["study_technique"] || [];
    guidedStudyTechniquesTagify.addTags(studyTechniques);

    // Set additional information fields
    const studyCollectionTitle = studyInformation["study_collection_title"] || "";
    document.getElementById("guided-ds-study-collection-title").value = studyCollectionTitle;

    guidedOtherFundingsourcesTagify.removeAllTags();
    ///////////

    const acknowledgments = basicInformation["acknowledgments"] || "";
    document.getElementById("guided-ds-acknowledgments").value = acknowledgments;

    const license = basicInformation["license"] || "";

    renderAdditionalLinksTable();
  }

  if (targetPageID === "guided-dataset-metadata-intro-tab") {
    // Initialize any required components or state for the intro page
  }

  if (targetPageID === "guided-subjects-metadata-tab") {
    // This has componentType "entity-metadata-page" which likely handles most of the page functionality
    setEntityType("subjects");
  }

  if (targetPageID === "guided-samples-metadata-tab") {
    // This has componentType "entity-metadata-page" which likely handles most of the page functionality
    setEntityType("samples");
  }

  if (targetPageID === "guided-create-changes-metadata-tab") {
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
