import { guidedShowTreePreview } from "../../datasetStructureTreePreview/treePreview.js";
import { guidedGetDatasetType } from "../../guided-curate-dataset.js";
import {
  setCheckboxCardUnchecked,
  setCheckboxCardChecked,
} from "../../../../stores/slices/checkboxCardSlice.js";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils.js";
import { setSodaTextInputValue } from "../../../../stores/slices/sodaTextInputSlice.js";
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";

export const openPageGenerateDataset = async (targetPageID) => {
  if (targetPageID === "guided-dataset-generation-options-tab") {
    ["generate-dataset-locally", "generate-dataset-on-pennsieve"].forEach((key) => {
      const isChecked = window.sodaJSONObj[key] === true;
      isChecked ? setCheckboxCardChecked(key) : setCheckboxCardUnchecked(key);
    });
  }

  if (targetPageID === "guided-pennsieve-settings-tab") {
    // Get the locally saved dataset name and subtitle to use as default values if they have not yet
    // set a dataset name or subtitle for Pennsieve
    const datasetName = getGuidedDatasetName();
    const datasetSubtitle = getGuidedDatasetSubtitle();

    const pennsieveDatasetName = window.sodaJSONObj["pennsieve-dataset-name"];
    const pennsieveDatasetSubtitle = window.sodaJSONObj["pennsieve-dataset-subtitle"];

    const datasetNameToSet = pennsieveDatasetName || datasetName;
    const datasetSubtitleToSet = pennsieveDatasetSubtitle || datasetSubtitle;

    setSodaTextInputValue("pennsieve-dataset-name", datasetNameToSet);
    setSodaTextInputValue("pennsieve-dataset-description", datasetSubtitleToSet);

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

    const datsetName = window.sodaJSONObj["digital-metadata"]["name"];
    const datsetSubtitle = window.sodaJSONObj["digital-metadata"]["subtitle"];
    const datasetUserPermissions = window.sodaJSONObj["digital-metadata"]["user-permissions"];
    const datasetTeamPermissions = window.sodaJSONObj["digital-metadata"]["team-permissions"];
    const datasetTags = window.sodaJSONObj["digital-metadata"]["dataset-tags"];
    const datasetLicense = window.sodaJSONObj["digital-metadata"]["license"];

    const datasetNameReviewText = document.getElementById("guided-review-dataset-name");

    const datasetSubtitleReviewText = document.getElementById("guided-review-dataset-subtitle");
    const datasetDescriptionReviewText = document.getElementById(
      "guided-review-dataset-description"
    );
    const datasetUserPermissionsReviewText = document.getElementById(
      "guided-review-dataset-user-permissions"
    );
    const datasetTeamPermissionsReviewText = document.getElementById(
      "guided-review-dataset-team-permissions"
    );
    const datasetTagsReviewText = document.getElementById("guided-review-dataset-tags");
    const datasetLicenseReviewText = document.getElementById("guided-review-dataset-license");

    datasetNameReviewText.innerHTML = datsetName;
    datasetSubtitleReviewText.innerHTML = datsetSubtitle;

    datasetDescriptionReviewText.innerHTML = Object.keys(
      window.sodaJSONObj["digital-metadata"]["description"]
    )
      .map((key) => {
        //change - to spaces in description and then capitalize
        const descriptionTitle = key
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return `<b>${descriptionTitle}</b>: ${window.sodaJSONObj["digital-metadata"]["description"][key]}<br /><br />`;
      })
      .join("\n");

    if (datasetUserPermissions.length > 0) {
      const datasetUserPermissionsString = datasetUserPermissions
        .map((permission) => permission.userString)
        .join("<br>");
      datasetUserPermissionsReviewText.innerHTML = datasetUserPermissionsString;
    } else {
      datasetUserPermissionsReviewText.innerHTML = "No additional user permissions added";
    }

    if (datasetTeamPermissions.length > 0) {
      const datasetTeamPermissionsString = datasetTeamPermissions
        .map((permission) => permission.teamString)
        .join("<br>");
      datasetTeamPermissionsReviewText.innerHTML = datasetTeamPermissionsString;
    } else {
      datasetTeamPermissionsReviewText.innerHTML = "No additional team permissions added";
    }

    datasetTagsReviewText.innerHTML = datasetTags.join(", ");
    datasetLicenseReviewText.innerHTML = datasetLicense;

    guidedShowTreePreview(
      window.sodaJSONObj["digital-metadata"]["name"],
      "guided-folder-structure-review-generate"
    );

    // Hide the Pennsieve agent check section (unhidden if it requires user action)
    document
      .getElementById("guided-mode-pre-generate-pennsieve-agent-check")
      .classList.add("hidden");
  }
  if (targetPageID === "guided-assign-license-tab") {
    // Get the selected dataset type ("computational" or "experimental")
    const datasetType = guidedGetDatasetType();
    console.log("dtype", datasetType);

    // Update the license select instructions based on the selected dataset type
    const licenseSelectInstructions = document.getElementById("license-select-text");
    if (datasetType === "computational") {
      licenseSelectInstructions.innerHTML = `
            Select a license for your computational dataset from the options below.
          `;
    }
    if (datasetType === "experimental") {
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
        datasetTypes: ["experimental"],
      },
      {
        licenseName: "MIT",
        licenseDescription:
          "A permissive license that allows others to use, modify, and distribute your work provided they grant you credit.",
        datasetTypes: ["computational"],
      },
      {
        licenseName: "GNU General Public License v3.0",
        licenseDescription:
          "A copyleft license that allows others to use, modify, and distribute your work provided they grant you credit and distribute their modifications under the GNU GPL license as well.",
        datasetTypes: ["computational"],
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
};
