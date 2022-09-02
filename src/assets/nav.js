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
let saveOrganizeDsState = false;

let prevSideBarSection;
let OdsTempDsJSONObj;
let OdsTempSodaJSONObj;
let prevSection;
let savedOrganizeDsSate = {};

async function handleSectionTrigger(event) {
  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`;
  prevSection = sectionId;
  console.log(sectionId);
  const itemsContainer = document.getElementById("items");
  const freeFormItemsContainer = document.getElementById(
    "free-form-folder-structure-container"
  );
  const freeFormButtons = document.getElementById(
    "organize-path-and-back-button-div"
  );

  if (sectionId === "organize-section") {
    /************ Happens every time user clicks organize dataset ****************************/
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
  }

  if (sectionId === "guided_mode-section") {
    if (document.getElementById("returnButton") !== null) {
      alert("can't switch to gm when ff upload is in progress");
    } else {
      const confirmBeforeExitOrganizeDS = await Swal.fire({
        icon: "warning",
        text: 'You will lose your progress in the "Organize datasets" section',
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
      if (confirmBeforeExitOrganizeDS.isConfirmed) {
        $("#dataset-loaded-message").hide();
        // if exit Btn is clicked after Generate

        $(".vertical-progress-bar-step").removeClass("is-current");
        $(".vertical-progress-bar-step").removeClass("done");
        $(".getting-started").removeClass("prev");
        $(".getting-started").removeClass("show");
        $(".getting-started").removeClass("test2");
        $("#Question-getting-started-1").addClass("show");
        $("#generate-dataset-progress-tab").css("display", "none");

        currentTab = 0;
        wipeOutCurateProgress();
        $("#main_tabs_view")[0].click();
        globalGettingStarted1stQuestionBool = false;
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

  if (sectionId === "main_tabs-section") {
    //Reset variables shared between guided and free form mode
    subjectsTableData = [];
    samplesTableData = [];
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

  considerNextBtn();
}

function considerNextBtn() {
  console.log(nextBtnDisabledVariable);
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
