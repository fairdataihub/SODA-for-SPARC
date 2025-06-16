import Swal from "sweetalert2";
import { swalConfirmAction } from "../scripts/utils/swal-utils";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../assets/lotties/lotties";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const leavingUploadDatasets = () => {
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

const uploadComplete = () => {
  return $("#wrapper-wrap").is(":visible") && $("#validate-upload-status-tab").is(":visible");
};

// this variable is here to keep track of when the Organize datasets/Continue button is enabled or disabled
document.body.addEventListener("click", async (event) => {
  if (event.target.dataset.section) {
    if (leavingUploadDatasets() && window.sodaJSONHasProgress() && !uploadComplete()) {
      let leaveUploadDataset = await swalConfirmAction(
        "warning",
        "Are you sure you want to exit?",
        "Any progress made importing your dataset and creating manifest files will not be saved. Do you want to continue?",
        "Yes",
        "Cancel"
      );
      if (!leaveUploadDataset) return;
      window.resetCurationTabs();
    } else if (leavingUploadDatasets() && window.sodaJSONHasProgress() && uploadComplete()) {
      let leaveUploadDataset = await swalConfirmAction(
        "warning",
        "Are you sure you want to exit?",
        "",
        "Yes",
        "Cancel"
      );
      if (!leaveUploadDataset) return;
      window.resetCurationTabs();
    }
    handleSectionTrigger(event);
  } else if (event.target.dataset.modal) {
    handleModalTrigger(event);
  } else if (event.target.classList.contains("modal-hide")) {
    hideAllModals();
  }
});

document.body.addEventListener("custom-back", (e) => {
  handleSectionTrigger(e);
});
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

const handleSectionTriggerOrganize = async (
  event,
  sectionId,
  freeFormItemsContainer,
  freeFormButtons
) => {};

const handleSectionTrigger = async (event) => {
  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`;
  const itemsContainer = document.getElementById("items");
  const freeFormItemsContainer = document.getElementById("free-form-folder-structure-container");
  const freeFormButtons = document.getElementById("organize-path-and-back-button-div");
  const sectionRenderFileExplorer = event.target.dataset.render;

  // In Free Form Mode -> Organize dataset, the sodaJSONObj has
  // keys if the user has started the first step. The user must
  // be warned because Guided Mode uses shared variables and FF progress
  // must be wiped out.
  //Update: Swal will only pop up if user is on organize datasets page only
  // Update 2: If user has not selected any of the radio buttons in step 1, then swal
  // will not pop up
  let boolRadioButtonsSelected = false;
  let organizeDatasetRadioButtons = Array.from(
    document.querySelectorAll(".getting-started-1st-question")
  );

  organizeDatasetRadioButtons.forEach((radioButton) => {
    if (radioButton.classList.contains("checked")) {
      boolRadioButtonsSelected = true;
    }
  });

  // check if we are entering the organize datasets section
  if (sectionId === "organize-section") {
    //reset lazyloading values
    resetLazyLoading();
    window.hasFiles = false;
    //Transition file explorer elements to freeform mode
    window.scroll_box = document.querySelector("#organize-dataset-tab");
    $(".shared-folder-structure-element").appendTo($("#free-form-folder-structure-container"));
    freeFormItemsContainer.classList.add("freeform-file-explorer"); //add styling for free form mode
    freeFormButtons.classList.add("freeform-file-explorer-buttons");
    window.organizeDSglobalPath = document.getElementById("input-global-path");
    window.dataset_path = document.getElementById("input-global-path");
    document.getElementById("nextBtn").disabled = boolNextButtonDisabled;
  }

  if (sectionId === "guided_mode-section") {
    // check if the
    // Disallow the transition if an upload is in progress
    if (document.getElementById("returnButton") !== null) {
      Swal.fire({
        icon: "warning",
        text: "You cannot curate another dataset while an upload is in progress but you can still modify dataset components.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "OK",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      document.getElementById("main_tabs_view").click();
      document.getElementById("organize_dataset_btn").click();
    }

    if (sectionRenderFileExplorer != "file-explorer") {
      window.sodaJSONObj = {};
      window.datasetStructureJSONObj = {};
      window.subjectsTableData = [];
      window.samplesTableData = [];
    }

    //Transition file explorer elements to guided mode
    window.organizeDSglobalPath = document.getElementById("guided-input-global-path");
    window.organizeDSglobalPath.value = "";
    window.dataset_path = document.getElementById("guided-input-global-path");
    window.scroll_box = document.querySelector("#guided-body");
    itemsContainer.innerHTML = "";
    resetLazyLoading();
    freeFormItemsContainer.classList.remove("freeform-file-explorer"); //add styling for free form mode
    freeFormButtons.classList.remove("freeform-file-explorer-buttons");
    document.querySelectorAll(".shared-folder-structure-element").forEach((folderElement) => {
      document.querySelector("#guided-folder-structure-container").appendChild(folderElement);
    });

    let guidedModeSection = document.getElementById("guided_mode-section");
    if (!guidedModeSection.classList.contains("is-shown")) {
      guidedModeSection.classList.add("is-shown");
    }

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

    // Ensure all sections are hidden and buttons are deselected
    document.getElementById("validate-dataset-feature").classList.add("hidden");
    document.getElementById("validate-dataset-feature").classList.remove("is-shown");
    document.getElementById("banner-image-feature").classList.add("hidden");
    document.getElementById("banner-image-feature").classList.remove("is-shown");
    document.getElementById("manifest-creation-feature").classList.add("hidden");
    document.getElementById("manifest-creation-feature").classList.remove("is-shown");

    // Remove lotties from the home screen to prevent double lotties
    if (document.getElementById("existing-dataset-lottie").innerHTML == "") {
      // Add the lotties back to the home screen
      lottie.loadAnimation({
        container: document.getElementById("existing-dataset-lottie"),
        animationData: existingDataset,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
    }

    if (document.getElementById("edit-dataset-component-lottie").innerHTML == "") {
      lottie.loadAnimation({
        container: document.getElementById("edit-dataset-component-lottie"),
        animationData: modifyDataset,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
    }

    guidedUnLockSideBar();
  }

  hideAllSectionsAndDeselectButtons();
  if (event.detail.target) {
    let previous_section = `${event.detail.target.dataset.section}-section`;
    document.getElementById(previous_section).classList.add("is-shown");
    forceActionSidebar("show");
    return;
  }

  document.getElementById(sectionId).classList.add("is-shown");

  let showSidebarSections = [
    "main_tabs-section", //Free form mode
    "getting_started-section", //Overview page
    "guided_mode-section", //Guided Mode
    "documentation-section", //Documentation
    "contact-us-section", //Contact us
    "about-us-section",
  ];

  if (showSidebarSections.includes(sectionId)) {
    forceActionSidebar("show");
  } else {
    forceActionSidebar("hide");
  }

  boolNextButtonDisabled = document.getElementById("nextBtn").disabled;

  if (sectionId === "validate_dataset-section") {
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
  }
};

function showMainContent() {
  document.querySelector(".js-nav").classList.add("is-shown");
  document.querySelector(".js-content").classList.add("is-shown");
}

function handleModalTrigger(event) {
  hideAllModals();
  const modalId = `${event.target.dataset.modal}-modal`;
  document.getElementById(modalId).classList.add("is-shown");
}

function hideAllModals() {
  const modals = document.querySelectorAll(".modal.is-shown");
  Array.prototype.forEach.call(modals, (modal) => {
    modal.classList.remove("is-shown");
  });
  showMainContent();
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

  $("a").on("click", function () {
    $($(this).parents()[1]).find("a").removeClass("is-selected");
    $(this).addClass("is-selected");
  });
});

export { resetLazyLoading, guidedUnLockSideBar, hideAllSectionsAndDeselectButtons };
