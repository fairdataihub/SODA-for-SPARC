import { hideAllSectionsAndDeselectButtons } from "../../assets/nav";
import { resetLazyLoading } from "../../assets/nav";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../../assets/lotties/lotties";
import fs from "fs";
import path from "path";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

window.downloadTemplate = (template) => {
  if (template === "manifest-only") {
    // Create a zip file with the metadata files only
  }
  if (template === "high-level-folders") {
    // Create a zip file with the high level folders and the metadata files
  }
};

const transitionToSDSPage = () => {
  //Hide the home screen
  document.getElementById("soda-home-page").classList.add("hidden");
  document.getElementById("guided_mode-section").classList.remove("is-shown");
  document.getElementById("guided_curate_dataset-tab").classList.remove("show");
  hideAllSectionsAndDeselectButtons();

  // Remove hidden class from the sds templates page to display it
  document.getElementById("sds_templates-section").classList.remove("hidden");
  document.getElementById("sds_templates-section").classList.add("is-shown");
  document.getElementById("sds_templates-selection-page").classList.remove("hidden");
  document.getElementById("sds_templates-selection-page").classList.add("is-shown");
  document.getElementById("sds-templates-footer").classList.remove("hidden");

  // Remove lotties from the home screen to preserve memory
  document.getElementById("existing-dataset-lottie").innerHTML = "";
  document.getElementById("edit-dataset-component-lottie").innerHTML = "";
};

$("#sds-templates").on("click", () => {
  window.organizeDSglobalPath.value = "";

  // Reset lazy loading
  resetLazyLoading();

  // Transition to sds templates page
  transitionToSDSPage();
});

$("#sds-templates-back-button").on("click", () => {
  // Transition back to the home screen
  // Transition back to the home screen
  document.getElementById("soda-home-page").classList.remove("hidden");
  document.getElementById("guided_mode-section").classList.add("is-shown");
  document.getElementById("guided_curate_dataset-tab").classList.add("show");

  // Remove hidden class from the advanced features page to display it
  document.getElementById("sds_templates-selection-page").classList.add("hidden");
  document.getElementById("sds_templates-selection-page").classList.remove("is-shown");
  document.getElementById("sds_templates-section").classList.remove("is-shown");
  document.getElementById("sds_templates-section").classList.remove("fullShown");
  document.getElementById("sds_templates-section").classList.add("hidden");
  document.getElementById("sds-templates-footer").classList.add("hidden");

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
});
