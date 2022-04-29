const settings = require("electron-settings");
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

const guidedPrepareHomeScreen = async () => {
  //Wipe out existing progress if it exists
  guidedResetProgressVariables();
  //Check if Guided-Progress folder exists. If not, create it.
  if (!fs.existsSync(guidedProgressFilePath)) {
    fs.mkdirSync(guidedProgressFilePath);
  }
  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);

  //Refresh Home page UI

  $("#guided-button-start-new-curate").css("display", "flex");
  document.getElementById("guided-new-dataset-info").classList.add("hidden");
  document.getElementById("guided-dataset-name-input").value = "";
  document.getElementById("guided-dataset-subtitle-input").value = "";
  $("#continue-curating-existing").css("display", "flex");

  //render progress resumption cards from progress file array on first page of guided mode
  if (guidedSavedProgressFiles.length != 0) {
    $("#guided-continue-curation-header").text(
      "Or continue curating a previously started dataset below."
    );
    const progressFileData = await getAllProgressFileData(
      guidedSavedProgressFiles
    );
    renderProgressCards(progressFileData);
  } else {
    $("#guided-continue-curation-header").text(
      "After creating your dataset, your progress will be saved and be resumable below."
    );
  }
  //empty new-dataset-lottie-container div
  document.getElementById("new-dataset-lottie-container").innerHTML = "";
  lottie.loadAnimation({
    container: document.querySelector("#new-dataset-lottie-container"),
    animationData: newDataset,
    renderer: "svg",
    loop: true,
    autoplay: true,
  });
};

function handleSectionTrigger(event) {
  hideAllSectionsAndDeselectButtons();

  if (event.detail.target) {
    let previous_section = `${event.detail.target.dataset.section}-section`;
    document.getElementById(previous_section).classList.add("is-shown");
    forceActionSidebar("show");
    return;
  }

  event.target.classList.add("is-selected");
  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`;

  // Render guided mode resume progress cards if guided mode section is chosen
  // and move the folder structuring elements to guided mode
  if (sectionId === "guided_mode-section") {
    guidedPrepareHomeScreen();
    organizeDSglobalPath = document.getElementById("guided-input-global-path");
    $(".shared-folder-structure-element").appendTo(
      $("#guided-folder-structure-container")
    );
  }
  // move the folder structuring elements back to free-form mode if they were borrowed
  // for guided mode
  if (sectionId === "main_tabs-section") {
    organizeDSglobalPath = document.getElementById("input-global-path");
    $(".shared-folder-structure-element").appendTo(
      $("#free-form-folder-structure-container")
    );
  }

  document.getElementById(sectionId).classList.add("is-shown");

  let showSidebarSections = [
    "main_tabs-section",
    "getting_started-section",
    "guided_mode-section",
    "help-section",
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
