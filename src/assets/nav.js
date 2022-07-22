const settings = require("electron-settings");
// this variable is here to keep track of when the Organize datasets/Continue button is enabled or disabled

// variable that keeps track of the previous curation mode (guided or free-form)
// used to handle updation of the folder structuring elements and sodaJSONObj
let previousCurationMode = "";

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

async function handleSectionTrigger(event) {
  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`;

  if (sectionId === "guided_mode-section") {
    if (previousCurationMode === "free-form" || previousCurationMode === "") {
      //TRANSITION FROM FREE-FORM => GUIDED MODE
      organizeDSglobalPath = document.getElementById(
        "guided-input-global-path"
      );
      organizeDSglobalPath.value = "";
      dataset_path = document.getElementById("guided-input-global-path");
      scroll_box = document.querySelector("#guided-body");

      $(".shared-folder-structure-element").appendTo(
        $("#guided-folder-structure-container")
      );
    }
    guidedPrepareHomeScreen();
    previousCurationMode = "guided";
  }

  if (sectionId === "main_tabs-section") {
    if (previousCurationMode === "guided") {
      //TRANSITION FROM GUIDED MODE => FREE-FORM
      if (CURRENT_PAGE) {
        const { value: switchToFreeFormModeFromGuided } = await Swal.fire({
          title: "Are you sure?",
          text: `Transitioning from guided mode to free form mode will cause you to lose
          the progress you have made on the current page. You will still be able to continue
          curating your current dataset by selecting its card on the guided mode homepage.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Exit guided mode",
          backDrop: "rgba(0,0,0,0.4)",
        });
        if (switchToFreeFormModeFromGuided) {
          traverseToTab("guided-dataset-starting-point-tab");
          hideSubNavAndShowMainNav("back");
          $("#guided-button-cancel-create-new-dataset").click();
        } else {
          $("#guided_mode_view").click();
          return;
        }
      } else if (
        !document
          .getElementById("guided-name-subtitle-parent-tab")
          .classList.contains("hidden")
      ) {
        console.log("user in rename");
        $("#guided-button-cancel-create-new-dataset").click();
      }

      organizeDSglobalPath = document.getElementById("input-global-path");
      organizeDSglobalPath.value = "";
      dataset_path = document.getElementById("input-global-path");
      scroll_box = document.querySelector("#organize-dataset-tab");

      // move the folder structuring elements back to free-form mode if they were borrowed
      // for guided mode
      $(".shared-folder-structure-element").appendTo(
        $("#free-form-folder-structure-container")
      );
    }
    sodaJSONObj = {};
    datasetStructureJSONObj = {};
    subjectsTableData = [];
    samplesTableData = [];
    previousCurationMode = "free-form";
  }

  hideAllSectionsAndDeselectButtons();

  if (event.detail.target) {
    let previous_section = `${event.detail.target.dataset.section}-section`;
    document.getElementById(previous_section).classList.add("is-shown");
    forceActionSidebar("show");
    return;
  }

  // Render guided mode resume progress cards if guided mode section is chosen
  // and move the folder structuring elements to guided mode

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

  considerNextBtn();

  // Save currently active button in localStorage
  const buttonId = event.target.getAttribute("id");
  settings.set("activeSectionButtonId", buttonId);
}

function considerNextBtn() {
  if (nextBtnDisabledVariable !== undefined) {
    if (nextBtnDisabledVariable === true) {
      $("#nextBtn").prop("disabled", true);
    } else {
      $("#nextBtn").prop("disabled", false);
    }
  }
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

//function displayAbout () {
//  document.querySelector('#curate-section').classList.add('is-shown')
//}

// Default to the view that was active the last time the app was open
const sectionId = settings.get("activeSectionButtonId");
if (sectionId) {
  showMainContent();
  // const section = document.getElementById(sectionId)
  // if (section) section.click()
} else {
  showMainContent();
  // activateDefaultSection()
  //displayAbout()
}

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
