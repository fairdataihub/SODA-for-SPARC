/* Functions for advanced features page and options */

import { resetLazyLoading } from "../../assets/nav";
import { hideAllSectionsAndDeselectButtons } from "../../assets/nav";
import { existingDataset, modifyDataset } from "../../assets/lotties/lotties";
import lottie from "lottie-web";

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
  document.getElementById("advanced-features-selection-page").classList.add("hidden");

  console.log("Button clicked: ", button_id);
  current_advanced_page = button_id;

  // Transition to the selected advanced feature
  if (button_id === "create_manifest_btn") {
    // Transition to the create manifest page
  }
  if (button_id === "upload_banner_image_btn") {
    // Transition to the upload banner image page
    document.getElementById("banner-image-feature").classList.remove("hidden");
    document.getElementById("banner-image-feature").classList.add("is-shown");
  }
  if (button_id === "validate_dataset_btn") {
    // Transition to the validate dataset page
  }
}

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
}

// Advanced features event listener
$("#direct-to-advanced-features").on("click", (() => {
  // Reset the DS global path as it is not needed in advanced features
  window.organizeDSglobalPath.value = "";

  // Reset lazy loading
  resetLazyLoading();

  //Transition to advanced features page
  transitionToAdvancedPage();
}));

// Back button event listener
$("#advanced-back-button").on("click", (() => {
  // Transition back depending on what current page is being displayed
  console.log("Back button clicked");
  if (current_advanced_page === "advanced-features-selection-page") {
    // Transition back to the home screen
    document.getElementById("guided-home").classList.remove("hidden");
    document.getElementById("guided_mode-section").classList.add("is-shown");
    document.getElementById("guided_curate_dataset-tab").classList.add("show");

    // Remove hidden class from the advanced features page to display it
    document.getElementById("advanced-features-selection-page").classList.add("hidden");
    document.getElementById("advanced_mode-section").classList.remove("is-shown");
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

  console.log("Current advanced page: ", current_advanced_page)
  if (current_advanced_page === "create_manifest_btn" || current_advanced_page === "upload_banner_image_btn" || current_advanced_page === "validate_dataset_btn") {
    // Transition back to the advanced features selection page
    document.getElementById("banner-image-feature").classList.add("hidden");
    document.getElementById("banner-image-feature").classList.remove("is-shown");

    // Hide the advanced features selection page
    document.getElementById("advanced-features-selection-page").classList.add("is-shown");
    document.getElementById("advanced-features-selection-page").classList.remove("hidden");

    current_advanced_page = "advanced-features-selection-page";
  }
}));