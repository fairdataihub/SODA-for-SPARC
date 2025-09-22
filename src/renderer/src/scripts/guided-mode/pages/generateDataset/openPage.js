import { guidedGetDatasetType } from "../../guided-curate-dataset.js";
import {
  setCheckboxCardUnchecked,
  setCheckboxCardChecked,
} from "../../../../stores/slices/checkboxCardSlice.js";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils.js";
import { setSodaTextInputValue } from "../../../../stores/slices/sodaTextInputSlice.js";
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";
import { createStandardizedDatasetStructure } from "../../../utils/datasetStructure.js";
import {
  reRenderTreeView,
  setPathToRender,
} from "../../../../stores/slices/datasetTreeViewSlice.js";
import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedResetLocalGenerationUI,
  guidedSetDOIUI,
  guidedSetPublishingStatusUI,
} from "../../guided-curate-dataset.js";
import { setPreferredPennsieveDatasetId } from "../../../../stores/slices/pennsieveDatasetSelectSlice.js";
import api from "../../../others/api/api.js";

export const openPageGenerateDataset = async (targetPageID) => {
  const targetPageDataset = document.getElementById(targetPageID).dataset;
  if (targetPageID === "guided-dataset-generation-options-tab") {
    ["generate-dataset-locally", "generate-dataset-on-pennsieve"].forEach((key) => {
      const isChecked = window.sodaJSONObj[key] === true;
      isChecked ? setCheckboxCardChecked(key) : setCheckboxCardUnchecked(key);
    });
  }

  if (targetPageID === "guided-generate-dataset-locally") {
    // Create a deep copy of the dataset structure JSON object
    const datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));
    // Restore the original dataset structure
    window.datasetStructureJSONObj = datasetStructureJSONObjCopy;
    guidedResetLocalGenerationUI();
  }

  if (targetPageID === "guided-pennsieve-generate-target-tab") {
    setPreferredPennsieveDatasetId(null);
    setCheckboxCardUnchecked("generate-on-new-pennsieve-dataset");
    setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");

    let isGuest = await api.userIsWorkspaceGuest();
    console.log(isGuest);
    useGlobalStore.setState({ isGuest: isGuest });

    const pennsieveGenerationTarget = window.sodaJSONObj["pennsieve-generation-target"];
    if (pennsieveGenerationTarget === "new") {
      // If the user selected to generate on a new Pennsieve dataset, check the corresponding checkbox card
      setCheckboxCardChecked("generate-on-new-pennsieve-dataset");
    }
    if (pennsieveGenerationTarget === "existing") {
      const previouslySelectedDatasetIdToUploadDataTo =
        window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"] || null;
      // If the user selected to generate on an existing Pennsieve dataset, check the corresponding checkbox card
      setPreferredPennsieveDatasetId(previouslySelectedDatasetIdToUploadDataTo);
      setCheckboxCardChecked("generate-on-existing-pennsieve-dataset");
    }
  }

  if (targetPageID === "guided-pennsieve-settings-tab") {
    // Get the locally saved dataset name and subtitle to use as default values if they have not yet
    // set a dataset name or subtitle for Pennsieve
    const datasetName = getGuidedDatasetName();
    const datasetSubtitle = getGuidedDatasetSubtitle();

    const pennsieveDatasetName = window.sodaJSONObj?.["generate-dataset"]?.["dataset-name"];
    const pennsieveDatasetSubtitle = window.sodaJSONObj["pennsieve-dataset-subtitle"];

    const datasetNameToSet = pennsieveDatasetName || datasetName;
    const datasetSubtitleToSet = pennsieveDatasetSubtitle || datasetSubtitle;

    setSodaTextInputValue("pennsieve-dataset-name", datasetNameToSet);
    setSodaTextInputValue("pennsieve-dataset-subtitle", datasetSubtitleToSet);

    // Handle the banner image preview
    if (window.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
      //added extra param to function to prevent modification of URL
      guidedShowBannerImagePreview(
        window.sodaJSONObj["digital-metadata"]["banner-image-path"],
        true
      );
      document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
    } else {
      //reset the banner image page
      $("#guided-button-add-banner-image").html("Add banner image");
      $("#guided-banner-image-preview-container").hide();
    }
  }
  if (targetPageID === "guided-dataset-generation-confirmation-tab") {
    //Set the inner text of the generate/retry pennsieve dataset button depending on
    //whether a dataset has bee uploaded from this progress file
    const generateOrRetryDatasetUploadButton = document.getElementById(
      "guided-generate-dataset-button"
    );
    const reviewGenerateButtonTextElement = document.getElementById("review-generate-button-text");
    if (
      window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] &&
      !window.sodaJSONObj["starting-point"]["origin"] === "ps"
    ) {
      const generateButtonText = "Resume Pennsieve upload in progress";
      generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
      reviewGenerateButtonTextElement.innerHTML = generateButtonText;
    } else {
      const generateButtonText = "Generate dataset on Pennsieve";
      generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
      reviewGenerateButtonTextElement.innerHTML = generateButtonText;
    }
    const pennsieveDatasetName = window.sodaJSONObj?.["generate-dataset"]?.["dataset-name"];
    const pennsieveDatasetNameReviewText = document.getElementById("guided-review-dataset-name");

    pennsieveDatasetNameReviewText.innerHTML = pennsieveDatasetName;

    // Get all of the elements with class pennsieve-config-info'
    const pennsieveConfigInfoElements = document.querySelectorAll(".pennsieve-config-info");

    if (window.sodaJSONObj["pennsieve-generation-target"] === "new") {
      // unhide the pennsieve config info elements
      pennsieveConfigInfoElements.forEach((element) => {
        element.classList.remove("hidden");
      });
      const pennsieveDatasetSubtitle = window.sodaJSONObj?.["pennsieve-dataset-subtitle"] ?? "";
      const datasetLicense = window.sodaJSONObj["digital-metadata"]["license"];

      const pennsieveDatasetSubtitleReviewText = document.getElementById(
        "guided-review-dataset-subtitle"
      );
      const datasetLicenseReviewText = document.getElementById("guided-review-dataset-license");

      pennsieveDatasetSubtitleReviewText.innerHTML = pennsieveDatasetSubtitle;
      datasetLicenseReviewText.innerHTML = datasetLicense ? datasetLicense : "No license selected";
    } else {
      // Hide the pennsieve config info elements
      pennsieveConfigInfoElements.forEach((element) => {
        element.classList.add("hidden");
      });
    }

    // Hide the Pennsieve agent check section (unhidden if it requires user action)
    document
      .getElementById("guided-mode-pre-generate-pennsieve-agent-check")
      .classList.add("hidden");
  }

  if (targetPageID === "guided-dataset-generation-tab") {
    document.getElementById("guided--verify-files").classList.add("hidden");
  }

  if (targetPageID === "guided-dataset-dissemination-tab") {
    const pennsieveDatasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
    const pennsieveDatasetDOI = await api.getDatasetDOI(pennsieveDatasetID);

    // Set the Pennsieve dataset DOI in the UI
    guidedSetDOIUI(pennsieveDatasetDOI);

    // Set the publishing status UI based on the current state of the dataset
    await guidedSetPublishingStatusUI();
  }
};
