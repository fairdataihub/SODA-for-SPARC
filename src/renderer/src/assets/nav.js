import Swal from "sweetalert2";
import { swalConfirmAction, swalShowInfo } from "../scripts/utils/swal-utils";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../assets/lotties/lotties";
import { setActiveSidebarTab } from "../stores/slices/sideBarSlice";

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

// Variable used to determine the disabled status of the organize datasets next button
let boolNextButtonDisabled = true;

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

const resetLazyLoading = () => {
  window.already_created_elem = [];
  window.listed_count = 0;
  window.start = 0;
  window.preprended_items = 0;
  window.amount = 500;
};

const guidedUnLockSideBar = () => {
  const sidebar = document.getElementById("sidebarCollapse");
  const guidedModeSection = document.getElementById("guided_mode-section");
  const guidedDatsetTab = document.getElementById("guided_curate_dataset-tab");
  const guidedNav = document.getElementById("guided-nav");

  if (sidebar.classList.contains("active")) {
    sidebar.click();
  }
  sidebar.disabled = false;
  guidedModeSection.style.marginLeft = "-15px";
  //remove the marginLeft style from guidedDatasetTab
  guidedDatsetTab.style.marginLeft = "";
  guidedNav.style.display = "none";
};

window.handleSideBarTabClick = async (id, section) => {
  console.log("HandleSectionTrigger called with id:", id, "and section:", section);
  const leavingUpload = window.leavingUploadDatasets();
  const hasProgress = window.sodaJSONHasProgress();
  const uploadDone = window.uploadComplete();

  // Handle confirmation when leaving upload datasets
  if (leavingUpload && hasProgress) {
    const leaveUploadDataset = await swalConfirmAction(
      "warning",
      "Are you sure you want to exit?",
      uploadDone
        ? "" // after upload complete
        : "Any progress made importing your dataset and creating manifest files will not be saved. Do you want to continue?", // during upload
      "Yes",
      "Cancel"
    );
    if (!leaveUploadDataset) return;
    window.resetCurationTabs();
  }

  console.log("Setting active sidebar tab to:", id);
  setActiveSidebarTab(section);
  const sectionId = `${section}-section`;

  const freeFormItemsContainer = document.getElementById("free-form-folder-structure-container");
  const freeFormButtons = document.getElementById("organize-path-and-back-button-div");
  const sectionRenderFileExplorer = event.target.dataset.render;

  // --- Organize section ---
  if (sectionId === "organize-section") {
    resetLazyLoading();
    window.hasFiles = false;

    window.scroll_box = document.querySelector("#organize-dataset-tab");
    document.querySelectorAll(".shared-folder-structure-element").forEach((el) => {
      freeFormItemsContainer.appendChild(el);
    });

    freeFormItemsContainer.classList.add("freeform-file-explorer");
    freeFormButtons.classList.add("freeform-file-explorer-buttons");

    window.organizeDSglobalPath = document.getElementById("input-global-path");
    window.dataset_path = window.organizeDSglobalPath;
    document.getElementById("nextBtn").disabled = boolNextButtonDisabled;
  }

  // --- Guided mode section ---
  if (sectionId === "guided_mode-section") {
    // Block transition if upload in progress
    if (document.getElementById("returnButton") !== null) {
      Swal.fire({
        icon: "warning",
        text: "You cannot curate another dataset while an upload is in progress but you can still modify dataset components.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "OK",
        showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
        hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
      });
      document.getElementById("main_tabs_view").click();
      document.getElementById("organize_dataset_btn").click();
    }

    // Reset objects if not rendering file explorer
    if (sectionRenderFileExplorer !== "file-explorer") {
      window.sodaJSONObj = {};
      window.datasetStructureJSONObj = {};
      window.subjectsTableData = [];
      window.samplesTableData = [];
    }

    window.organizeDSglobalPath = document.getElementById("guided-input-global-path");
    window.organizeDSglobalPath.value = "";
    window.dataset_path = window.organizeDSglobalPath;
    window.scroll_box = document.querySelector("#guided-body");
    resetLazyLoading();

    freeFormItemsContainer.classList.remove("freeform-file-explorer");
    freeFormButtons.classList.remove("freeform-file-explorer-buttons");

    document.querySelectorAll(".shared-folder-structure-element").forEach((el) => {
      document.querySelector("#guided-folder-structure-container").appendChild(el);
    });

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

    guidedUnLockSideBar();
  }

  // --- Handle section switching ---
  hideAllSectionsAndDeselectButtons();

  if (event.detail.target) {
    const previousSection = sectionId;
    document.getElementById(previousSection).classList.add("is-shown");
    forceActionSidebar("show");
    return;
  }

  document.getElementById(sectionId).classList.add("is-shown");

  const showSidebarSections = [
    "main_tabs-section",
    "guided_mode-section",
    "documentation-section",
    "contact-us-section",
    "about-us-section",
  ];
  forceActionSidebar(showSidebarSections.includes(sectionId) ? "show" : "hide");

  boolNextButtonDisabled = document.getElementById("nextBtn").disabled;

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

export { resetLazyLoading, guidedUnLockSideBar, hideAllSectionsAndDeselectButtons };
