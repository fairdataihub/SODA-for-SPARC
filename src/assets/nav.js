const settings = require("electron-settings");
// this variable is here to keep track of when the Organize datasets/Continue button is enabled or disabled

document.body.addEventListener("click", (event) => {
  console.log("body click event listener");
  if (event.target.dataset.section) {
    handleSectionTrigger(event);
    console.log("dataset section");
    console.log(event);
  } else if (event.target.dataset.modal) {
    console.log("dataset modal");
    console.log(event);
    handleModalTrigger(event);
  } else if (event.target.classList.contains("modal-hide")) {
    console.log("modal-hide");
    console.log(event);
    hideAllModals();
  }
});

document.body.addEventListener("custom-back", (e) => {
  handleSectionTrigger(e);
});

function handleSectionTrigger(event) {
  hideAllSectionsAndDeselectButtons();

  if (event.detail.target) {
    console.log(event.detail.target);
    console.log(event.detail.target.dataset.section);
    let previous_section = `${event.detail.target.dataset.section}-section`;
    document.getElementById(previous_section).classList.add("is-shown");
    forceActionSidebar("show");
    return;
  }

  console.log(event.target);
  event.target.classList.add("is-selected");
  // Display the current section
  console.log(event.target.dataset.section);
  const sectionId = `${event.target.dataset.section}-section`;

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
