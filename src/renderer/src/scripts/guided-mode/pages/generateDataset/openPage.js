import { guidedShowTreePreview } from "../../datasetStructureTreePreview/treePreview.js";

export const openGenerateDatasetPage = async (targetPageID) => {
  if (targetPageID === "guided-dataset-generation-confirmation-tab") {
    //Set the inner text of the generate/retry pennsieve dataset button depending on
    //whether a dataset has bee uploaded from this progress file
    const generateOrRetryDatasetUploadButton = document.getElementById(
      "guided-generate-dataset-button"
    );
    const reviewGenerateButtionTextElement = document.getElementById("review-generate-button-text");
    if (
      window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] &&
      !window.sodaJSONObj["starting-point"]["origin"] === "ps"
    ) {
      const generateButtonText = "Resume Pennsieve upload in progress";
      generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
      reviewGenerateButtionTextElement.innerHTML = generateButtonText;
    } else {
      const generateButtonText = "Generate dataset on Pennsieve";
      generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
      reviewGenerateButtionTextElement.innerHTML = generateButtonText;
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

  if (targetPageID === "guided-dataset-generation-tab") {
    document.getElementById("guided--verify-files").classList.add("hidden");
  }
};
