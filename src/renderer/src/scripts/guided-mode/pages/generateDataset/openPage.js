import { guidedGetDatasetType } from "../../guided-curate-dataset.js";
import {
  setCheckboxCardUnchecked,
  setCheckboxCardChecked,
} from "../../../../stores/slices/checkboxCardSlice.js";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils.js";
import { setSodaTextInputValue } from "../../../../stores/slices/sodaTextInputSlice.js";
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";
import { createStandardizedDatasetStructure } from "../../../utils/datasetStructure.js";
import { setTreeViewDatasetStructure } from "../../../../stores/slices/datasetTreeViewSlice.js";
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
    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      datasetEntityObj
    );
    setTreeViewDatasetStructure(standardizedDatasetStructure, []);

    // Restore the original dataset structure
    window.datasetStructureJSONObj = datasetStructureJSONObjCopy;
    guidedResetLocalGenerationUI();
  }

  if (targetPageID === "guided-pennsieve-generate-target-tab") {
    setPreferredPennsieveDatasetId(null);
    setCheckboxCardUnchecked("generate-on-new-pennsieve-dataset");
    setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");

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
    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      datasetEntityObj
    );
    setTreeViewDatasetStructure(standardizedDatasetStructure, []);
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
      const pennsieveDatasetSubtitle = window.sodaJSONObj["generate-dataset"]["dataset-subtitle"];
      const datasetLicense = window.sodaJSONObj["digital-metadata"]["license"];

      const pennsieveDatasetSubtitleReviewText = document.getElementById(
        "guided-review-dataset-subtitle"
      );
      const datasetLicenseReviewText = document.getElementById("guided-review-dataset-license");

      pennsieveDatasetSubtitleReviewText.innerHTML = pennsieveDatasetSubtitle;
      datasetLicenseReviewText.innerHTML = datasetLicense;
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
  if (targetPageID === "guided-assign-license-tab") {
    // Get the selected dataset type ("computational" or "experimental")
    const datasetType = guidedGetDatasetType();
    // Update the license select instructions based on the selected dataset type
    const licenseSelectInstructions = document.getElementById("license-select-text");
    if (datasetType === "Computational") {
      licenseSelectInstructions.innerHTML = `
            Select a license for your computational dataset from the options below.
          `;
    }
    if (datasetType === "Experimental") {
      licenseSelectInstructions.innerHTML = `
            As per SPARC policy, all experimental datasets must be shared under the
            <b>Creative Commons Attribution (CC-BY)</b> license.
            <br />
            <br />
            Select the button below to consent to sharing your dataset under the Creative Commons Attribution license.
          `;
    }

    const guidedLicenseOptions = [
      {
        licenseName: "Creative Commons Attribution",
        licenseDescription:
          "A permissive license commonly used for open data collections that allows others to use, modify, and distribute your work provided appropriate credit is given.",
        datasetTypes: ["Experimental"],
      },
      {
        licenseName: "MIT",
        licenseDescription:
          "A permissive license that allows others to use, modify, and distribute your work provided they grant you credit.",
        datasetTypes: ["Computational"],
      },
      {
        licenseName: "GNU General Public License v3.0",
        licenseDescription:
          "A copyleft license that allows others to use, modify, and distribute your work provided they grant you credit and distribute their modifications under the GNU GPL license as well.",
        datasetTypes: ["Computational"],
      },
    ];

    // Get the license options that are applicable for the selected dataset type
    const selectableLicenses = guidedLicenseOptions.filter((license) => {
      return license.datasetTypes.includes(datasetType);
    });

    // Render the license radio buttons into their container
    const licenseRadioButtonContainer = document.getElementById(
      "guided-license-radio-button-container"
    );
    const licenseRadioButtonElements = selectableLicenses
      .map((license) => {
        return `
            <button class="guided--simple-radio-button" data-value="${license.licenseName}">
              <input type="radio" name="license" value="${license.licenseName}" style="margin-right: 5px; cursor: pointer; margin-top: 5px;" />
              <div style=" display: flex; flex-direction: column; align-items: flex-start; flex-grow: 1;">
                <p class="help-text mb-0"><b>${license.licenseName}</b></p>
                <p class="guided--text-input-instructions text-left">${license.licenseDescription}</p>
              </div>
            </button>
          `;
      })
      .join("\n");
    licenseRadioButtonContainer.innerHTML = licenseRadioButtonElements;

    // Add event listeners to the license radio buttons that add the selected class to the clicked button
    // and deselects all other buttons
    document.querySelectorAll(".guided--simple-radio-button").forEach((button) => {
      button.addEventListener("click", () => {
        // Remove selected class from all radio buttons
        licenseRadioButtonContainer
          .querySelectorAll(".guided--simple-radio-button")
          .forEach((button) => {
            button.classList.remove("selected");
          });

        // Add selected class to the clicked radio button
        button.classList.add("selected");
        // Click the radio button input
        button.querySelector("input").click();
      });
    });

    // If a license has already been selected, select the corresponding radio button (Only if the license is still selectable)
    const selectedLicense = window.sodaJSONObj["digital-metadata"]["license"];
    if (selectedLicense) {
      const selectedLicenseRadioButton = licenseRadioButtonContainer.querySelector(
        `[data-value="${selectedLicense}"]`
      );
      if (selectedLicenseRadioButton) {
        selectedLicenseRadioButton.click();
      }
    }
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
