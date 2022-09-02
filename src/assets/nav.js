// this variable is here to keep track of when the Organize datasets/Continue button is enabled or disabled
document.body.addEventListener("click", (event) => {
  if (event.target.dataset.section) {
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

async function handleSectionTrigger(event) {
  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`;
  const itemsContainer = document.getElementById("items");
  const freeFormItemsContainer = document.getElementById(
    "free-form-folder-structure-container"
  );
  const freeFormButtons = document.getElementById(
    "organize-path-and-back-button-div"
  );

  if (sectionId === "organize-section") {
    //reset lazyloading values
    resetLazyLoading();
    //Transition file explorer elements to freeform mode
    scroll_box = document.querySelector("#organize-dataset-tab");
    $(".shared-folder-structure-element").appendTo(
      $("#free-form-folder-structure-container")
    );
    freeFormItemsContainer.classList.add("freeform-file-explorer"); //add styling for free form mode
    freeFormButtons.classList.add("freeform-file-explorer-buttons");
    organizeDSglobalPath = document.getElementById("input-global-path");
    dataset_path = document.getElementById("input-global-path");
    document.getElementById("nextBtn").disabled = boolNextButtonDisabled;
  }

  if (sectionId === "guided_mode-section") {
    // Disallow the transition if an upload is in progress
    if (document.getElementById("returnButton") !== null) {
      Swal.fire({
        icon: "warning",
        text: "You can not enter Guided Mode while an upload is in progress.",
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

    // In Free Form Mode -> Organize dataset, the sodaJSONObj has
    // keys if the user has started the first step. The user must
    // be warned because Guided Mode uses shared variables and FF progress
    // must be wiped out.
    if (Object.keys(sodaJSONObj).length > 0) {
      const warnBeforeExitCurate = await Swal.fire({
        icon: "warning",
        html: `Selecting Continue will take you to Guided Mode but will wipe out the progress you have made organizing your dataset.
        <br><br>
        To save your progress, press Cancel${
          currentTab < 2 ? ", progress to the third step," : ""
        } and press "Save progress" in the Organize Dataset tab.`,
        showCancelButton: true,
        focusCancel: true,
        cancelButtonText: "Cancel",
        confirmButtonText: "Continue",
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      if (warnBeforeExitCurate.isConfirmed) {
        // Wipe out organize dataset progress before entering Guided Mode
        $("#dataset-loaded-message").hide();
        $(".vertical-progress-bar-step").removeClass("is-current");
        $(".vertical-progress-bar-step").removeClass("done");
        $(".getting-started").removeClass("prev");
        $(".getting-started").removeClass("show");
        $(".getting-started").removeClass("test2");
        $("#Question-getting-started-1").addClass("show");
        $("#generate-dataset-progress-tab").css("display", "none");
        currentTab = 0;
        wipeOutCurateProgress();
        globalGettingStarted1stQuestionBool = false;
        document.getElementById("nextBtn").disabled = true;
      } else {
        //Stay in Organize datasets section
        document.getElementById("main_tabs_view").click();
        document.getElementById("organize_dataset_btn").click();
        return;
      }
    }
    sodaJSONObj = {};
    datasetStructureJSONObj = {};
    subjectsTableData = [];
    samplesTableData = [];

    //Transition file explorer elements to guided mode
    organizeDSglobalPath = document.getElementById("guided-input-global-path");
    organizeDSglobalPath.value = "";
    dataset_path = document.getElementById("guided-input-global-path");
    scroll_box = document.querySelector("#guided-body");
    itemsContainer.innerHTML = "";
    resetLazyLoading();
    freeFormItemsContainer.classList.remove("freeform-file-explorer"); //add styling for free form mode
    freeFormButtons.classList.remove("freeform-file-explorer-buttons");
    $(".shared-folder-structure-element").appendTo(
      $("#guided-folder-structure-container")
    );

    guidedPrepareHomeScreen();
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
    "main_tabs-section",
    "getting_started-section",
    "guided_mode-section",
    "help-section",
    "documentation-section",
    "contact-us-section",
  ];

  if (showSidebarSections.includes(sectionId)) {
    forceActionSidebar("show");
  } else {
    forceActionSidebar("hide");
  }

  boolNextButtonDisabled = document.getElementById("nextBtn").disabled;
}

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
$("#shortcut-navigate-to-organize").on("click", () => {
  $("#prepare_dataset_tab").click();
  $("#organize_dataset_btn").click();
});

$("#shortcut-navigate-to-create_submission").on("click", () => {
  $("#prepare_metadata_tab").click();
  $("#create_submission_btn").click();
});
