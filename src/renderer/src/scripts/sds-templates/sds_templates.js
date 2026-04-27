import { hideAllSectionsAndDeselectButtons } from "../../assets/nav";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

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
};

$("#sds-templates").on("click", () => {
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
});
