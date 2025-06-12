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
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";
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
import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";
import { dragDrop, successCheck } from "../../../../assets/lotties/lotties";
import { renderProtocolsTable } from "../../metadata/protocols";
import { swalFileListSingleAction, swalShowInfo } from "../../../utils/swal-utils";
import { guidedDatasetKeywordsTagify } from "../../tagifies/tagifies";
import lottie from "lottie-web";
import { renderAdditionalLinksTable } from "../../guided-curate-dataset";
import { datasetIsSparcFunded } from "../../utils/sodaJSONObj";
import { createStandardizedDatasetStructure } from "../../../../scripts/utils/datasetStructure";
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

  if (targetPageID === "guided-assign-license-tab") {
    console.log("Opening sharing license page");
    // Page-specific initialization code will go here
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

  if (targetPageID === "guided-create-description-metadata-tab") {
    const guidedLoadDescriptionDatasetInformation = () => {
      // Reset the keywords tags and add the stored ones if they exist in the JSON
      guidedDatasetKeywordsTagify.removeAllTags();
      const datasetKeyWords =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"]?.[
          "keywords"
        ];
      if (datasetKeyWords) {
        guidedDatasetKeywordsTagify.addTags(datasetKeyWords);
      }
    };
    guidedLoadDescriptionDatasetInformation();

    const guidedLoadDescriptionStudyInformation = () => {
      const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
      const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
      const studyPrimaryConclusionInput = document.getElementById(
        "guided-ds-study-primary-conclusion"
      );
      const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");

      //reset the inputs
      studyPurposeInput.value = "";
      studyDataCollectionInput.value = "";
      studyPrimaryConclusionInput.value = "";
      studyCollectionTitleInput.value = "";
      guidedStudyOrganSystemsTagify.removeAllTags();
      guidedStudyApproachTagify.removeAllTags();
      guidedStudyTechniquesTagify.removeAllTags();

      // Set the inputs if their respective keys exist in the JSON
      // (if not, the input will remain blank)
      const studyPurpose =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study purpose"
        ];
      if (studyPurpose) {
        studyPurposeInput.value = studyPurpose;
      }

      const studyDataCollection =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study data collection"
        ];
      if (studyDataCollection) {
        studyDataCollectionInput.value = studyDataCollection;
      }

      const studyPrimaryConclusion =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study primary conclusion"
        ];
      if (studyPrimaryConclusion) {
        studyPrimaryConclusionInput.value = studyPrimaryConclusion;
      }

      const studyCollectionTitle =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study collection title"
        ];
      if (studyCollectionTitle) {
        studyCollectionTitleInput.value = studyCollectionTitle;
      }

      const studyOrganSystems =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study organ system"
        ];
      if (studyOrganSystems) {
        guidedStudyOrganSystemsTagify.addTags(studyOrganSystems);
      }

      const studyApproach =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study approach"
        ];
      if (studyApproach) {
        guidedStudyApproachTagify.addTags(studyApproach);
      }

      const studyTechniques =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study technique"
        ];
      if (studyTechniques) {
        guidedStudyTechniquesTagify.addTags(studyTechniques);
      }
    };
    guidedLoadDescriptionStudyInformation();

    const guidedLoadDescriptionContributorInformation = () => {
      const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
      const contributorInformationMetadata =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributor-information"];

      guidedOtherFundingsourcesTagify.removeAllTags();

      if (contributorInformationMetadata) {
        acknowledgementsInput.value = contributorInformationMetadata["acknowledgment"];
        guidedOtherFundingsourcesTagify.addTags(contributorInformationMetadata["funding"]);
      } else {
        acknowledgementsInput.value = "";
        guidedOtherFundingsourcesTagify.removeAllTags();
      }
    };
    guidedLoadDescriptionContributorInformation();

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

  if (targetPageID === "guided-resources-entity-addition-tab") {
    console.log("Opening experimental resources page");
    // This has componentType "resources-management-page" which likely handles most of the page functionality
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

  if (targetPageID === "guided-create-local-copy-tab") {
    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

    // Create a deep copy of the dataset structure JSON object
    const datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));
    console.log("datasetStructureJSONObjCopy", datasetStructureJSONObjCopy);

    const starndardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      datasetEntityObj
    );
    setTreeViewDatasetStructure(starndardizedDatasetStructure, []);

    // Restore the original dataset structure
    window.datasetStructureJSONObj = datasetStructureJSONObjCopy;
    console.log("datasetStructureJSONObj restored", window.datasetStructureJSONObj);

    const guidedResetLocalGenerationUI = () => {
      // Hide the local dataset copy generation section that containst the table/generation progress
      document
        .getElementById("guided-section-local-generation-status-table")
        .classList.add("hidden");
      // Hide the local dataset generation success section
      document
        .getElementById("guided-section-post-local-generation-success")
        .classList.add("hidden");
      // Hide the local dataset generation retry section
      document.getElementById("guided-section-retry-local-generation").classList.add("hidden");
    };

    guidedResetLocalGenerationUI();
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
