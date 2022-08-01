const settings = require("electron-settings");
const { existsSync } = require("original-fs");
const { default: Swal } = require("sweetalert2");
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
  function saveTempSodaProgress(progressFileName, sodaObject) {
    try {
      fs.mkdirSync(progressFilePath, { recursive: true });
    } catch (error) {
      log.error(error);
      console.log(error);
    }
    var filePath = path.join(progressFilePath, progressFileName + ".json");
    //update json obj progress

    // delete sodaObject["dataset-structure"] value that was added only for the Preview tree view
    if ("files" in sodaObject["dataset-structure"]) {
      sodaObject["dataset-structure"]["files"] = {};
    }
    //delete manifest files added for treeview
    // delete manifest files added for treeview
    for (var highLevelFol in sodaObject["dataset-structure"]["folders"]) {
      if (
        "manifest.xlsx" in
          sodaObject["dataset-structure"]["folders"][highLevelFol]["files"] &&
        sodaObject["dataset-structure"]["folders"][highLevelFol]["files"][
          "manifest.xlsx"
        ]["forTreeview"] === true
      ) {
        delete sodaObject["dataset-structure"]["folders"][highLevelFol][
          "files"
        ]["manifest.xlsx"];
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(sodaObject));

    Swal.fire({
      icon: "success",
      text: "Successfully saved progress!",
      showConfirmButton: "OK",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });
  }

  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`;
  const itemsContainer = document.getElementById("items");

  console.log(sectionId);
  console.log(previousCurationMode);

  if (sectionId === "guided_mode-section") {
    if (previousCurationMode === "free-form" || previousCurationMode === "") {
      //TRANSITION FROM FREE-FORM => GUIDED MODE
      let soda_temp = {};

      if (itemsContainer.children.length > 0) {
        updateJSONObjectProgress();
        soda_temp = sodaJSONObj;
        console.log(soda_temp);
        //step 3 has already been started so warn user about leaving
        const { value: switchToGuidedFromFreeFormMode } = await Swal.fire({
          title: "Save progress before you go?",
          text: `Transitioning from free form mode to guided mode will cause you to lose
            any progess you have made unless you save your progress.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          cancelButtonText: "Cancel",
          confirmButtonText: "Save progress",
          backdrop: "rgba(0,0,0,0.4)",
        });
        if (switchToGuidedFromFreeFormMode) {
          if ("save-progresss" in soda_temp) {
            saveTempSodaProgress(soda_temp["save-progress"], soda_temp);
          } else {
            const { value: saveProgressName } = await Swal.fire({
              icon: "info",
              title: "Saving progress as...",
              text: "Enter a name for your progress below:",
              heightAuto: false,
              input: "text",
              showCancelButton: true,
              cancelButtonText: "Cancel",
              confirmButtonText: "OK",
              reverseButtons: reverseSwalButtons,
              backdrop: "rgba(0,0,0, 0.4)",
              showClass: {
                popup: "animate__animated animate__fadeInDown animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__fadeOutUp animate__faster",
              },
              preConfirm: (inputValue) => {
                if (inputValue === "") {
                  Swal.showValidationMessage(
                    "Please enter a name to save your progress under."
                  );
                }
              },
            });
            if (saveProgressName) {
              console.log(saveProgressName);
              soda_temp["save-progress"] = saveProgressName;
              saveTempSodaProgress(saveProgressName, soda_temp);
              addOption(
                progressFileDropdown,
                saveProgressName,
                saveProgressName + ".json"
              );
              $(".vertical-progress-bar-step").removeClass("is-current");
              $(".vertical-progress-bar-step").removeClass("done");
              $(".getting-started").removeClass("prev");
              $(".getting-started").removeClass("show");
              $(".getting-started").removeClass("test2");
              $("#Question-getting-started-1").addClass("show");
              $("#generate-dataset-progress-tab").css("display", "none");

              currentTab = 0;
              wipeOutCurateProgress();
              // $("#main_tabs_view")[0].click();
              globalGettingStarted1stQuestionBool = false;
            } else {
              $("#main_tabs_view").click();
              return;
            }
          }
        } else {
          $("#main_tabs_view").click();
          return;
        }
      }
      //reset organize dataset
      // exitCurate(false);
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
    itemsContainer.innerHTML = "";
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
          heightAuto: "false",
          backDrop: "rgba(0,0,0,0.4)",
        });
        if (switchToFreeFormModeFromGuided) {
          traverseToTab("guided-dataset-starting-point-tab");
          hideSubNavAndShowMainNav("back");
          $("#guided-button-dataset-intro-back").click();
        } else {
          $("#guided_mode_view").click();
          return;
        }
      } else if (
        !document
          .getElementById("guided-mode-starting-container")
          .classList.contains("hidden")
      ) {
        console.log("user in rename");
        $("#guided-button-dataset-intro-back").click();
      }
    }
    organizeDSglobalPath = document.getElementById("input-global-path");
    organizeDSglobalPath.value = "My_dataset_folder/";
    dataset_path = document.getElementById("input-global-path");
    scroll_box = document.querySelector("#organize-dataset-tab");
    sodaJSONObj = {};
    datasetStructureJSONObj = {};
    subjectsTableData = [];
    samplesTableData = [];
    previousCurationMode = "free-form";
    // move the folder structuring elements back to free-form mode if they were borrowed
    // for guided mode
    $(".shared-folder-structure-element").appendTo(
      $("#free-form-folder-structure-container")
    );
    itemsContainer.innerHTML = "";
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
