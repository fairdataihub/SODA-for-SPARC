/* Functions for advanced features page and options */

import { resetLazyLoading } from "../../assets/nav";
import { hideAllSectionsAndDeselectButtons } from "../../assets/nav";
import { existingDataset, modifyDataset } from "../../assets/lotties/lotties";
import lottie from "lottie-web";
import Swal from "sweetalert2";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let current_advanced_page = "";

// Function to transition between the advanced feature options
window.transitionToAdvancedFeature = (event) => {
  // Get the id of the button clicked
  const button_id = event.target.id;

  // Hide the advanced features selection page
  document.getElementById("advanced-features-selection-page").classList.remove("is-shown");
  document.getElementById("advanced-features-selection-page").classList.remove("full-shown");
  document.getElementById("advanced-features-selection-page").classList.add("hidden");

  current_advanced_page = button_id;

  // Transition to the selected advanced feature
  if (button_id === "create_manifest_btn") {
    // Transition to the create manifest page\
    document.getElementById("manifest-creation-feature").classList.remove("hidden");
    document.getElementById("manifest-creation-feature").classList.add("is-shown");
    // Reveal the start over button
    document.getElementById("advanced-start-over-button").classList.remove("hidden");
  }
  if (button_id === "upload_banner_image_btn") {
    // Transition to the upload banner image page
    document.getElementById("banner-image-feature").classList.remove("hidden");
    document.getElementById("banner-image-feature").classList.add("is-shown");

    // Reset the dataset to None
    let bannerDatasetCard = document.getElementById("top-level-card-container--add-edit-banner")
      .children[0].children[2].children[0].children[0].children[1].children[0];
    bannerDatasetCard.value = "None";
  }
  if (button_id === "validate_dataset_btn") {
    // Transition to the validate dataset page
    document.getElementById("validate-dataset-feature").classList.remove("hidden");
    document.getElementById("validate-dataset-feature").classList.add("is-shown");
    // Reveal the start over button
    document.getElementById("advanced-start-over-button").classList.remove("hidden");
  }
};

const transitionToAdvancedPage = () => {
  //Hide the home screen
  document.getElementById("guided-home").classList.add("hidden");
  document.getElementById("guided_mode-section").classList.remove("is-shown");
  document.getElementById("guided_curate_dataset-tab").classList.remove("show");
  hideAllSectionsAndDeselectButtons();

  // Remove hidden class from the advanced features page to display it
  document.getElementById("advanced_mode-section").classList.remove("hidden");
  document.getElementById("advanced_mode-section").classList.add("is-shown");
  document.getElementById("advanced-features-selection-page").classList.remove("hidden");
  document.getElementById("advanced-features-selection-page").classList.add("is-shown");
  document.getElementById("advanced-features-selection-page").classList.add("full-shown");
  document.getElementById("advanced-footer").classList.remove("hidden");

  // Remove lotties from the home screen to preserve memory
  document.getElementById("existing-dataset-lottie").innerHTML = "";
  document.getElementById("edit-dataset-component-lottie").innerHTML = "";

  current_advanced_page = "advanced-features-selection-page";
};

// Advanced features event listener
$("#direct-to-advanced-features").on("click", () => {
  // Reset the DS global path as it is not needed in advanced features
  window.organizeDSglobalPath.value = "";

  // Reset lazy loading
  resetLazyLoading();

  //Transition to advanced features page
  transitionToAdvancedPage();
});

// Back button event listener
$("#advanced-back-button").on("click", () => {
  // Transition back depending on what current page is being displayed
  if (current_advanced_page === "advanced-features-selection-page") {
    // Transition back to the home screen
    document.getElementById("guided-home").classList.remove("hidden");
    document.getElementById("guided_mode-section").classList.add("is-shown");
    document.getElementById("guided_curate_dataset-tab").classList.add("show");

    // Remove hidden class from the advanced features page to display it
    document.getElementById("advanced-features-selection-page").classList.add("hidden");
    document.getElementById("advanced-features-selection-page").classList.remove("is-shown");
    document.getElementById("advanced_mode-section").classList.remove("is-shown");
    document.getElementById("advanced_mode-section").classList.remove("fullShown");
    document.getElementById("advanced_mode-section").classList.add("hidden");
    document.getElementById("advanced-footer").classList.add("hidden");

    // Add the lotties back to the home screen
    lottie.loadAnimation({
      container: document.getElementById("existing-dataset-lottie"),
      animationData: existingDataset,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });

    lottie.loadAnimation({
      container: document.getElementById("edit-dataset-component-lottie"),
      animationData: modifyDataset,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });
  }

  if (
    current_advanced_page === "create_manifest_btn" ||
    current_advanced_page === "upload_banner_image_btn" ||
    current_advanced_page === "validate_dataset_btn"
  ) {
    // Hide the advanced features to return to the selection page
    document.getElementById("banner-image-feature").classList.add("hidden");
    document.getElementById("banner-image-feature").classList.remove("is-shown");

    document.getElementById("validate-dataset-feature").classList.add("hidden");
    document.getElementById("validate-dataset-feature").classList.remove("is-shown");

    document.getElementById("manifest-creation-feature").classList.add("hidden");
    document.getElementById("manifest-creation-feature").classList.remove("is-shown");

    let localDatasetButton = document.getElementById("validate_dataset-1-local");
    let pennsieveDatasetButton = document.getElementById("validate_dataset-1-pennsieve");

    if (
      !localDatasetButton.classList.contains("checked") &&
      !localDatasetButton.classList.contains("non-selected") &&
      !pennsieveDatasetButton.classList.contains("checked") &&
      !pennsieveDatasetButton.classList.contains("non-selected")
    ) {
      $("#validate_dataset-question-2").removeClass("show");
      $("#validate_dataset-question-1").removeClass("prev");
      $("#validate_dataset-question-2").removeClass("prev");
      $("#validate_dataset-question-3").removeClass("show");
    }

    // Display the advanced features selection page
    document.getElementById("advanced-features-selection-page").classList.add("is-shown");
    document.getElementById("advanced-features-selection-page").classList.remove("hidden");

    // Hide the start over button
    document.getElementById("advanced-start-over-button").classList.add("hidden");

    current_advanced_page = "advanced-features-selection-page";
  }
});

$("#advanced-start-over-button").on("click", async () => {
  // Depending on the current page we will reset the advanced feature's page
  if (current_advanced_page === "create_manifest_btn") {
    // Reset the create manifest page
    if (
      document.getElementById("pennsieve-option-create-manifest").classList.contains("checked") ||
      document.getElementById("local-option-create-manifest").classList.contains("checked")
    ) {
      let resetManifestResult = await Swal.fire({
        icon: "warning",
        text: "This will reset your current manifest creation progress. Do you wish to continue?",
        heightAuto: false,
        showCancelButton: true,
        cancelButtonText: "No",
        focusCancel: true,
        confirmButtonText: "Yes",
        backdrop: "rgba(0,0,0, 0.4)",
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      // user does not want to reset
      if (!resetManifestResult.isConfirmed) {
        return;
      }
    }

    // Remove checked class from buttons
    document.getElementById("pennsieve-option-create-manifest").classList.remove("checked");
    document.getElementById("pennsieve-option-create-manifest").classList.remove("non-selected");
    document.getElementById("local-option-create-manifest").classList.remove("checked");
    document.getElementById("local-option-create-manifest").classList.remove("non-selected");

    // Remove checked from the radio buttons
    document.getElementById("generate-manifest-from-local").checked = false;
    document.getElementById("generate-manifest-from-Penn").checked = false;

    // Reset sub-question fields
    $("#div-confirm-manifest-local-folder-dataset").hide();
    // We reset the display of this child element since it is being set to none somewhere
    document.getElementById(
      "div-confirm-manifest-local-folder-dataset"
    ).children[0].children[0].style.display = "block";
    document.getElementById("input-manifest-local-folder-dataset").placeholder = "Browse here";

    // Hide the all sub-questions for generating manifest
    document.getElementById("Question-prepare-manifest-2").classList.remove("show");
    document.getElementById("Question-prepare-manifest-2").classList.remove("prev");
    document.getElementById("Question-prepare-manifest-3").classList.remove("show");
    document.getElementById("Question-prepare-manifest-3").classList.remove("prev");
    document.getElementById("Question-prepare-manifest-5").classList.remove("show");
    document.getElementById("Question-prepare-manifest-5").classList.remove("prev");
    document.getElementById("Question-prepare-manifest-6").classList.remove("show");
    document.getElementById("Question-prepare-manifest-6").classList.remove("prev");
  }
  if (current_advanced_page === "validate_dataset_btn") {
    // Reset the validate dataset page
    let validationErrorsTable = document.querySelector("#validation-errors-container tbody");

    if (validationErrorsTable.childElementCount > 0) {
      // ask the user to confirm they want to reset their validation progress
      let resetValidationResult = await Swal.fire({
        icon: "warning",
        text: "This will reset your current validation results. Do you wish to continue?",
        heightAuto: false,
        showCancelButton: true,
        cancelButtonText: "No",
        focusCancel: true,
        confirmButtonText: "Yes",
        backdrop: "rgba(0,0,0, 0.4)",
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      // user does not want to reset
      if (!resetValidationResult.isConfirmed) {
        return;
      }

      // get validation table body
      window.clearValidationResults(validationErrorsTable);
    }

    // Reset the validate button options
    document.getElementById("validate_dataset-1-pennsieve").classList.remove("checked");
    document.getElementById("validate_dataset-1-pennsieve").classList.remove("non-selected");
    document.getElementById("validate_dataset-1-local").classList.remove("checked");
    document.getElementById("validate_dataset-1-local").classList.remove("non-selected");

    // Uncheck the radio buttons
    document.getElementById("validate-1-Pennsieve").checked = false;
    document.getElementById("validate-1-Local").checked = false;

    // Reset the sub-question fields
    document.getElementById("validate-local-dataset-path").placeholder = "Browse here";

    // Hide all the sub-questions for validating datasets
    document.getElementById("validate_dataset-question-2").classList.remove("show");
    document.getElementById("validate_dataset-question-2").classList.remove("prev");
    document.getElementById("validate_dataset-question-4").classList.remove("show");
    $("#validate_dataset-question-3").hide();
  }
});
