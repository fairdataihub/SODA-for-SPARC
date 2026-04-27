import Swal from "sweetalert2";
import { swalConfirmAction, swalShowInfo } from "../scripts/utils/swal-utils";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../assets/lotties/lotties";
import { setActiveSidebarTab } from "../stores/slices/sideBarSlice";
import { setNavButtonDisabled } from "../stores/slices/navButtonStateSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

window.leavingUploadDatasets = () => {
  let activeTabs = document.querySelectorAll(".tab-active");
  for (const tab of activeTabs) {
    if (
      tab.id === "getting-started-tab" ||
      tab.id === "high-level-folders-tab" ||
      tab.id === "upload-destination-selection-tab" ||
      tab.id === "manifest-file-tab" ||
      tab.id === "preview-dataset-tab" ||
      tab.id === "generate-dataset-progress-tab" ||
      tab.id === "validate-upload-status-tab"
    ) {
      return true;
    }
  }
  return false;
};

window.uploadComplete = () => {
  return $("#wrapper-wrap").is(":visible") && $("#validate-upload-status-tab").is(":visible");
};

// function to hide the sidebar and disable the sidebar expand button
function forceActionSidebar(action) {
  if (action === "show") {
    document.querySelector("#sidebarCollapse").classList.remove("active");
    document.querySelector("#main-nav").classList.remove("active");
  } else {
    document.querySelector("#sidebarCollapse").classList.remove("active");
    document.querySelector("#main-nav").classList.remove("active");
    // $("#sidebarCollapse").prop("disabled", false);
  }
}

const prepareGuidedSidebar = () => {
  // Click the home page sidebar button if
  const sidebar = document.getElementById("sidebarCollapse");
  if (sidebar.classList.contains("active")) {
    sidebar.click();
  }

  const guidedModeSection = document.getElementById("guided_mode-section");
  const guidedDatsetTab = document.getElementById("guided_curate_dataset-tab");
  const guidedNav = document.getElementById("guided-nav");

  sidebar.disabled = false;
  guidedModeSection.style.marginLeft = "-15px";
  //remove the marginLeft style from guidedDatasetTab
  guidedDatsetTab.style.marginLeft = "";
  guidedNav.style.display = "none";
};

window.handleSideBarTabClick = async (id, section) => {
  // Always set activeTab to section, not id
  setActiveSidebarTab(section);
  const sectionId = `${section}-section`;

  const freeFormItemsContainer = document.getElementById("free-form-folder-structure-container");
  const freeFormButtons = document.getElementById("organize-path-and-back-button-div");

  // --- Organize section ---
  if (sectionId === "organize-section") {
    freeFormItemsContainer.classList.add("freeform-file-explorer");
    freeFormButtons.classList.add("freeform-file-explorer-buttons");

    window.organizeDSglobalPath = document.getElementById("input-global-path");
    window.dataset_path = window.organizeDSglobalPath;
    setNavButtonDisabled("nextBtn", true);
  }

  // --- Guided mode section ---
  if (
    sectionId === "guided_mode-section" ||
    sectionId === "documentation-section" ||
    sectionId === "account-section" ||
    sectionId === "contact-us-section" ||
    sectionId === "about-us-section"
  ) {
    freeFormItemsContainer.classList.remove("freeform-file-explorer");
    freeFormButtons.classList.remove("freeform-file-explorer-buttons");

    // UI visibility updates
    document.getElementById("soda-home-page").classList.remove("hidden");
    document.getElementById("guided_mode-section").classList.add("is-shown");
    document.getElementById("guided_curate_dataset-tab").classList.add("show");

    const advancedFeaturesPage = document.getElementById("advanced-features-selection-page");
    advancedFeaturesPage.classList.add("hidden");
    advancedFeaturesPage.classList.remove("is-shown");

    const advancedModeSection = document.getElementById("advanced_mode-section");
    advancedModeSection.classList.remove("is-shown", "fullShown");
    advancedModeSection.classList.add("hidden");

    document.getElementById("advanced-footer").classList.add("hidden");

    ["validate-dataset-feature", "banner-image-feature", "manifest-creation-feature"].forEach(
      (id) => {
        const el = document.getElementById(id);
        el.classList.add("hidden");
        el.classList.remove("is-shown");
      }
    );

    prepareGuidedSidebar();
  }

  // --- Handle section switching ---
  hideAllSectionsAndDeselectButtons();

  const showSidebarSections = [
    "main_tabs-section",
    "guided_mode-section",
    "documentation-section",
    "contact-us-section",
    "about-us-section",
  ];
  forceActionSidebar(showSidebarSections.includes(sectionId) ? "show" : "hide");

  // --- Validate dataset section ---
  if (sectionId === "validate_dataset-section") {
    const localDatasetButton = document.getElementById("validate_dataset-1-local");
    const pennsieveDatasetButton = document.getElementById("validate_dataset-1-pennsieve");

    if (
      !localDatasetButton.classList.contains("checked") &&
      !localDatasetButton.classList.contains("non-selected") &&
      !pennsieveDatasetButton.classList.contains("checked") &&
      !pennsieveDatasetButton.classList.contains("non-selected")
    ) {
      document.getElementById("validate_dataset-question-2").classList.remove("show", "prev");
      document.getElementById("validate_dataset-question-1").classList.remove("prev");
      document.getElementById("validate_dataset-question-3").classList.remove("show");
    }
  }

  document.getElementById(sectionId).classList.add("is-shown");
};

function showMainContent() {
  document.querySelector(".js-content").classList.add("is-shown");
}

function hideAllSectionsAndDeselectButtons() {
  const sections = document.querySelectorAll(".js-section.is-shown");
  Array.prototype.forEach.call(sections, (section) => {
    section.classList.remove("is-shown");
  });

  const buttons = document.querySelectorAll(".nav-button.is-selected");
  Array.prototype.forEach.call(buttons, (button) => {
    button.classList.remove("is-selected");
  });
}

showMainContent();

// Set of functions for the footer shortcuts between sections
// only required for when switching between section where the menu needs to change
// TO DISCUSS - add these for all return buttons and pulse the button on return maybe?
// Should help if people lose their position
document.querySelector("#shortcut-navigate-to-organize").addEventListener("click", () => {
  document.querySelector("#prepare_dataset_tab").click();
  document.querySelector("#organize_dataset_btn").click();
});

document.querySelector("#shortcut-navigate-to-create_submission").addEventListener("click", () => {
  document.querySelector("#prepare_metadata_tab").click();
  document.querySelector("#create_submission_btn").click();
});

document.querySelector("#button-homepage-freeform-mode").addEventListener("click", async () => {
  //Free form mode will open through here (FROM HOME TO UPLOAD DATASET NOW)
  window.guidedPrepareHomeScreen();
  window.directToFreeFormMode();
});

$(document).ready(() => {
  $("#sidebarCollapse").on("click", function () {
    $("#main-nav").toggleClass("active");
    $(this).toggleClass("active");
    $(".section").toggleClass("fullShown");
  });
});

export { prepareGuidedSidebar, hideAllSectionsAndDeselectButtons };
