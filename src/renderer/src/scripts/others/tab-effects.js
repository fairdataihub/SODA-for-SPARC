// event listeners for opening dataset or account selection dropdown
import Accordion from "accordion-js";
// TODO: Follow up that this is the way to import it
import "accordion-js/dist/accordion.min.css";
import { showHideDropdownButtons } from "../globals";
import client from "../client";
import { clientError, userErrorMessage } from "./http-error-handler/error-handler";
import introJs from "intro.js";
import Swal from "sweetalert2";
import api from "../others/api/api";
import { swalShowInfo } from "../utils/swal-utils";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// JSON object of all the tabs
var allParentStepsJSON = {
  "getting-started": "getting-started-tab",
  "high-level-folders": "high-level-folders-tab",
  "organize-dataset": "organize-dataset-tab",
  "metadata-files": "metadata-files-tab",
  "manifest-file": "manifest-file-tab",
  "validate-dataset": "validate-dataset-tab",
  "generate-dataset": "generate-dataset-tab",
};

window.currentTab = 0; // Current tab is set to be the first tab (0)
// window.showParentTab(0, 1);

const delay = 250;

window.showParentTab = async (tabNow, nextOrPrev) => {
  $("#nextBtn").prop("disabled", true);
  // check to show Save progress btn (only after step 2)
  if (tabNow >= 2) {
    // check if users are Continuing with an existing BF ds. If so, hide Save progress btn
    if ($('input[name="getting-started-1"]:checked').prop("id") === "existing-bf") {
      $("#save-progress-btn").css("display", "none");
    } else {
      $("#save-progress-btn").css("display", "block");
    }
    $("#start-over-btn").css("display", "inline-block");
  } else {
    $("#save-progress-btn").css("display", "none");
    $("#start-over-btn").css("display", "none");
  }

  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("parent-tabs");
  fixStepIndicator(tabNow);
  if (tabNow === 0) {
    fixStepDone(tabNow);
  } else {
    fixStepDone(tabNow - 1);
  }

  $(x[tabNow]).addClass("tab-active");
  setTimeout(() => {
    $(x[tabNow]).css("overflow", "auto");
  }, 1200);

  var inActiveTabArray = [0, 1, 2, 3, 4, 5, 6, 7].filter((element) => {
    return ![tabNow].includes(element);
  });

  for (var i of inActiveTabArray) {
    $(x[i]).removeClass("tab-active");
    $(x[tabNow]).css("overflow", "hidden");
  }

  $("#nextBtn").css("display", "inline");
  $("#prevBtn").css("display", "inline");
  $("#nextBtn").html("Continue");

  if (nextOrPrev === -1) {
    $("#nextBtn").prop("disabled", false);
  }

  if (tabNow == 0) {
    //$("#prevBtn").css("display", "none");

    // disable continue button if none of the options in step 1 have been clicked
    if ($('input[name="getting-started-1"]:checked').length === 1) {
      $("#nextBtn").prop("disabled", false);
    } else if ($('input[name="getting-started-1"]:checked').length === 0) {
      $("#nextBtn").prop("disabled", true);
    }
  } else if (tabNow == 1) {
    checkHighLevelFoldersInput();
    window.highLevelFoldersDisableOptions();
  } else {
    if (tabNow === 3) {
      if (Object.keys(window.datasetStructureJSONObj["folders"]).includes("code")) {
        $(".metadata-button.button-generate-dataset.code-metadata").css("display", "block");
        $(".flex-row-container.code-metadata").css("display", "flex");
      } else {
        $(".metadata-button.button-generate-dataset.code-metadata").css("display", "none");
        $(".flex-row-container.code-metadata").css("display", "none");
      }
    }
    $(".div-organize-generate-dataset.metadata").removeClass("hide");
    $(".div-individual-metadata").removeClass("show");
    $("#nextBtn").prop("disabled", false);
  }
  if (tabNow == 4) {
    if (nextOrPrev === -1) {
      return;
    }

    // if the user has files already on their dataset when starting from new/local and merging to existing pennsieve then
    // show them a message detailing why they cannot create manifest files
    if (window.hasFiles) {
      $("#manifest-creation-prohibited").show();
      if ($("#generate-manifest-curate").prop("checked")) {
        $("#generate-manifest-curate").click();
      }
      $("#generate-manifest-curate").prop("disabled", true);
      $("#nextBtn").prop("disabled", false);
      // disable the manifest file checkbox
      $("#generate-manifest-curate").prop("disabled", true);
    } else {
      $("#manifest-creation-prohibited").hide();
      $("#generate-manifest-curate").prop("disabled", false);
    }

    if (document.getElementById("generate-manifest-curate").checked) {
      // need to run manifest creation
      //Hide the UI until the manifest card are created
      $("#manifest-creating-loading").removeClass("hidden");
      $("#manifest-items-container").addClass("hidden");
      await window.ffmCreateManifest(window.sodaJSONObj);
      $("#manifest-items-container").removeClass("hidden");
      $("#manifest-creating-loading").addClass("hidden");
    } else {
      document.getElementById("ffm-container-manifest-file-cards").innerHTML = "";
    }
  }

  if (tabNow == 5) {
    // Disable the continue button if a destination has not been selected
    // Used when traversing back and forth between tabs
    // TODO: Update code to show Continue if the para for empty dataset is showing
    if (
      $("#inputNewNameDataset").val() !== "" ||
      ($("#Question-generate-dataset-existing-files-options")
        .find(".option-card")
        .hasClass("checked") &&
        $("#Question-generate-dataset-existing-folders-options")
          .find(".option-card")
          .hasClass("checked")) ||
      $("#generate-dataset-replace-existing").find(".option-card").hasClass("checked") ||
      $("#input-destination-generate-dataset-locally")[0].placeholder !== "Browse here" ||
      $("#para-continue-empty-ds-selected").is(":visible")
    ) {
      $("#nextBtn").prop("disabled", false);
    } else {
      $("#nextBtn").prop("disabled", true);
    }
  }

  if (tabNow == 2) {
    if (!introStatus.organizeStep3) {
      introJs()
        .setOptions({
          steps: [
            {
              title: "Welcome",
              intro: "This is where you will organize your dataset for curation",
            },
            {
              title: "Expand folders",
              element: document.querySelector(".div-organize-items"),
              intro: "Double click on any of the folders to expand them.",
            },
            {
              title: "More options",
              element: document.querySelector(".single-item"),
              intro: "You can rename, delete and move folders and files by right clicking here.",
            },
            {
              title: "Manifest info",
              element: document.querySelector(".single-item"),
              intro:
                "You can also add descriptions to your manifest file by clicking the 'More details' options after right click.",
            },
            {
              title: "Adding metadata",
              element: document.querySelector("#nextBtn"),
              intro:
                "Click here after you are done organizing to add your metadata files to this dataset.",
            },
          ],
          exitOnEsc: false,
          exitOnOverlayClick: false,
          disableInteraction: false,
        })
        .onbeforeexit(function () {
          introStatus.organizeStep3 = true;
        })
        .start();
    }
  }

  if (tabNow == x.length - 1) {
    let step5Bubble = document.getElementsByClassName("vertical-progress-bar-step")[4];
    // if (step5Bubble.classList.contains("is-current")) {
    //   step5Bubble.classList.remove("is-current");
    // }
    // step5Bubble.classList.add("done");
    // If in step 6, show the generate button and the preview tab
    $("#nextBtn").css("display", "none");

    let dataset_name = fill_info_details();
    window.datasetStructureJSONObj["files"] = window.sodaJSONObj["metadata-files"];
    window.showTreeViewPreview(
      false,
      false,
      false,
      dataset_name,
      window.jstreePreview,
      window.datasetStructureJSONObj
    );
    $("#Question-preview-dataset-details").show();
    $("#Question-preview-dataset-details").children().show();
    $("#Question-generate-dataset-generate-div").show();
    $("#Question-generate-dataset-generate-div").children().show();
    //$("#preview-dataset-structure-btn").show();
  }
};

// function to fill the card details in the preview tab of step 7
const fill_info_details = () => {
  let new_dataset_name = "dataset_root";
  $(".card-container.generate-preview").remove();
  if (window.sodaJSONObj["starting-point"]["type"] === "bf") {
    add_card_detail("Pennsieve account", $("#current-bf-account-generate").text());
    add_card_detail("Dataset name", window.sodaJSONObj["bf-dataset-selected"]["dataset-name"]);
    let workspace = $("#bf-organization-curate-first-question").text();
    add_card_detail("Selected workspace", workspace);

    new_dataset_name = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    if (window.manifestFileCheck.checked) {
      add_card_detail("Manifest files", "Requested from SODA", 1, "pulse-manifest-checkbox", true);
    } else {
      add_card_detail("Manifest files", "Not requested", 1, "pulse-manifest-checkbox", true);
    }
  }
  if (
    window.sodaJSONObj["starting-point"]["type"] === "local" ||
    window.sodaJSONObj["starting-point"]["type"] === "new"
  ) {
    // replace existing dataset when starting from local
    if ($('input[name="generate-1"]:checked')[0].id === "generate-local-existing") {
      add_card_detail(
        "Current dataset location",
        window.sodaJSONObj["starting-point"]["local-path"],
        1,
        "Question-generate-dataset",
        true
      );
      new_dataset_name = window.path.basename(window.sodaJSONObj["starting-point"]["local-path"]);
      if (window.manifestFileCheck.checked) {
        add_card_detail(
          "Manifest files",
          "Requested from SODA",
          2,
          "pulse-manifest-checkbox",
          true
        );
      } else {
        add_card_detail("Manifest files", "Not requested", 2, "pulse-manifest-checkbox", true);
      }
    } else if ($('input[name="generate-1"]:checked')[0].id === "generate-local-desktop") {
      if (window.sodaJSONObj["starting-point"]["type"] === "local") {
        add_card_detail(
          "Original dataset location",
          window.sodaJSONObj["starting-point"]["local-path"]
        );
      }
      add_card_detail(
        "New dataset location",
        $("#input-destination-generate-dataset-locally")[0].placeholder,
        1,
        "input-destination-generate-dataset-locally",
        true
      );
      add_card_detail(
        "New dataset name",
        $("#inputNewNameDataset").val().trim(),
        1,
        "inputNewNameDataset",
        true
      );
      new_dataset_name = $("#inputNewNameDataset").val().trim();
      if (window.manifestFileCheck.checked) {
        add_card_detail(
          "Manifest files",
          "Requested from SODA",
          2,
          "pulse-manifest-checkbox",
          true
        );
      } else {
        add_card_detail("Manifest files", "Not requested", 2, "pulse-manifest-checkbox", true);
      }
    } else if ($('input[name="generate-1"]:checked')[0].id === "generate-upload-BF") {
      if (window.sodaJSONObj["starting-point"]["type"] === "local") {
        add_card_detail(
          "Original dataset location",
          window.sodaJSONObj["starting-point"]["local-path"]
        );
      }

      add_card_detail("New dataset location", "Pennsieve", 1, "Question-generate-dataset", true);
      add_card_detail(
        "Pennsieve account",
        $("#current-bf-account-generate").text(),
        1,
        "Question-generate-dataset-BF-account",
        true
      );
      let workspace = $("#organization-bf-curation").text();
      add_card_detail(
        "Selected workspace",
        workspace,
        1,
        "Question-generate-dataset-BF-account",
        true
      );
      if ($('input[name="generate-4"]:checked')[0].id === "generate-BF-dataset-options-existing") {
        add_card_detail(
          "Dataset name",
          $("#current-bf-dataset-generate").text(),
          1,
          "Question-generate-dataset-BF-dataset",
          true
        );
        new_dataset_name = $("#current-bf-dataset-generate").text();
        if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-duplicate") {
          add_card_detail(
            "For existing folders",
            "Create a duplicate",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-replace") {
          add_card_detail(
            "For existing folders",
            "Replace",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-merge") {
          add_card_detail(
            "For existing folders",
            "Merge",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-skip") {
          add_card_detail(
            "For existing folders",
            "Skip",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        }
        if ($('input[name="generate-6"]:checked')[0].id === "existing-files-duplicate") {
          add_card_detail(
            "For existing files",
            "Create a duplicate",
            1,
            "Question-generate-dataset-existing-files-options",
            true
          );
        } else if ($('input[name="generate-6"]:checked')[0].id === "existing-files-replace") {
          add_card_detail(
            "For existing files",
            "Replace",
            1,
            "Question-generate-dataset-existing-files-options",
            true
          );
        } else if ($('input[name="generate-6"]:checked')[0].id === "existing-files-skip") {
          add_card_detail(
            "For existing files",
            "Skip",
            1,
            "Question-generate-dataset-existing-files-options",
            true
          );
        }
      } else {
        add_card_detail(
          "New Dataset name ",
          $("#inputNewNameDataset").val().trim(),
          1,
          "inputNewNameDataset",
          true
        );
        new_dataset_name = $("#inputNewNameDataset").val().trim();
      }
      // generate manifest files only when user has checked manifest file generation and they are not starting from new/local and merging
      // into an existing dataset that already has files
      if (window.manifestFileCheck.checked && !window.hasFiles) {
        add_card_detail(
          "Manifest files",
          "Requested from SODA",
          2,
          "pulse-manifest-checkbox",
          true
        );
      } else {
        add_card_detail("Manifest files", "Not requested", 2, "pulse-manifest-checkbox", true);
      }
    }
  }
  return new_dataset_name;
};

// called when edit button is clicked
// amount => how many times the back button is clicked
// element => element to scroll to in the page
// pulse_animation => whether to pulse the element
window.traverse_back = (amount, element = "", pulse_animation = false) => {
  if (element === "Question-generate-dataset-existing-folders-options") {
    $("#button-confirm-bf-dataset").click();
    $("nextBtn").prop("disabled", true);
  }
  for (i = 0; i < amount; i++) {
    window.nextPrev(-1);
  }

  // wait 550 milliseconds to allow for the scroll tab animation to finish
  // add the pulse class after scrolling to element
  if (element != "") {
    setTimeout(() => {
      document.getElementById(element).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (pulse_animation == true) {
        $(`#${element}`).addClass("pulse-blue");
      }
    }, 550);
  }

  // remove pulse class after 4 seconds
  // pulse animation lasts 2 seconds => 2 pulses
  setTimeout(() => {
    $(".pulse-blue").removeClass("pulse-blue");
  }, 4000);
};

// Add a new item to the card container
// card_left => left side text
// card_right => right side text
// parent_tab => how many times to click back
// element_id => element to scroll to
// pulse => show pulse animation
const add_card_detail = (
  card_left,
  card_right,
  parent_tab = -1,
  element_id = "",
  pulse = false
) => {
  let link_item = "<i class='far fa-edit jump-back' onclick='window.traverse_back(";
  link_item += parent_tab.toString();
  let temp = ', "' + element_id + '", ' + pulse + ")";
  link_item += temp;
  link_item += "'></i>";

  let parent_element = $("#other-dataset-information-container");

  let new_card_element =
    "<div class='card-container generate-preview'><h5 class='card-left' style='text-align: left;'>" +
    card_left +
    ":</h5><p class='card-right' style='width: 300px;'>" +
    card_right;

  if (parent_tab === -1) {
    new_card_element += "</p></div>";
  } else {
    new_card_element += link_item + "</p></div>";
  }
  // let cardContainer = document.createElement("div");

  $(parent_element).append(new_card_element);
};

// helper function to delete empty keys from objects
const deleteEmptyKeysFromObject = (object) => {
  for (var key in object) {
    if (
      object[key] === null ||
      object[key] === undefined ||
      object[key] === "" ||
      JSON.stringify(object[key]) === "{}"
    ) {
      delete object[key];
    }
  }
};

const checkHighLevelFoldersInput = () => {
  $("#nextBtn").prop("disabled", true);
  var optionCards = document.getElementsByClassName("option-card high-level-folders");
  var checked = false;
  for (var card of optionCards) {
    if ($(card).hasClass("checked")) {
      checked = true;
      break;
    }
  }
  if (checked) {
    $("#nextBtn").prop("disabled", false);
  }
  return checked;
};

/**
 *
 * @param {number} pageIndex - 1 for next, -1 for previous
 * @returns
 * Associated with the Back/Continue buttons of FreeForm Mode
 * in the Organize dataset section of the app. Moves to the next or previous page/tab.
 * Also performs events or actions (such as update window.sodaJSONObj) based off the state of the Organize Datasets section
 * currently being displayed after pressing the Continue button/back button.
 */
window.nextPrev = (pageIndex) => {
  // var x = document.getElementsByClassName("parent-tabs");
  let parentTabs = document.getElementsByClassName("parent-tabs");

  if (pageIndex == -1 && parentTabs[window.currentTab].id === "getting-started-tab") {
    // let event = new CustomEvent("custom-back", {
    //   detail: {
    //     target: { dataset: { section: "guided_mode-section" }, classList: ["someclass"] },
    //   },
    // });

    // document.body.dispatchEvent(event);
    window.returnToGuided();
    if ($("#nextBtn").prop("disabled") === true) {
      window.nextBtnDisabledVariable = true;
    } else {
      window.nextBtnDisabledVariable = false;
    }
    return;
  }

  // update JSON structure
  updateOverallJSONStructure(parentTabs[window.currentTab].id);

  // reset datasetStructureObject["files"] back to {},
  // and delete ui preview-added manifest files
  if (parentTabs[window.currentTab].id === "high-level-folders-tab") {
    $("#items").empty();
    $("#items").append(already_created_elem);
    getInFolder(".single-item", "#items", dataset_path, window.datasetStructureJSONObj);
  }
  if (
    parentTabs[window.currentTab].id === "high-level-folders-tab" ||
    parentTabs[window.currentTab].id === "metadata-files-tab"
  ) {
    window.organizeLandingUIEffect();
    // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
    if ("files" in window.datasetStructureJSONObj) {
      window.datasetStructureJSONObj["files"] = {};
    }
    // delete manifest files added for treeview
    for (var highLevelFol in window.datasetStructureJSONObj["folders"]) {
      if (
        "manifest.xlsx" in window.datasetStructureJSONObj["folders"][highLevelFol]["files"] &&
        window.datasetStructureJSONObj["folders"][highLevelFol]["files"]["manifest.xlsx"][
          "forTreeview"
        ] === true
      ) {
        delete window.datasetStructureJSONObj["folders"][highLevelFol]["files"]["manifest.xlsx"];
      }
    }
  }

  // TODO: Fix comparison by reference bug in 3rd condition
  if (
    pageIndex === 1 &&
    parentTabs[window.currentTab].id === "organize-dataset-tab" &&
    window.sodaJSONObj["dataset-structure"] === { folders: {} }
  ) {
    Swal.fire({
      icon: "warning",
      text: "The current dataset folder is empty. Are you sure you want to continue?",
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Continue",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        $(parentTabs[window.currentTab]).removeClass("tab-active");
        // Increase or decrease the current tab by 1:
        window.currentTab = window.currentTab + pageIndex;
        // For step 1,2,3, check for High level folders input to disable Continue button
        if (window.currentTab === 1 || window.currentTab === 2 || window.currentTab === 3) {
          window.highLevelFoldersDisableOptions();
        }
        // Display the correct tab:
        window.showParentTab(window.currentTab, pageIndex);
      }
    });
    // check if required metadata files are included
  } else if (pageIndex === 1 && parentTabs[window.currentTab].id === "metadata-files-tab") {
    var requiredFiles = ["submission", "dataset_description", "subjects", "README"];
    let missingFiles = [];
    var withoutExtMetadataArray = [];
    if (!("metadata-files" in window.sodaJSONObj)) {
      window.sodaJSONObj["metadata-files"] = {};
    }
    if (Object.keys(window.sodaJSONObj["dataset-structure"]["folders"]).includes("code")) {
      requiredFiles.push("code_description");
    }

    if (Object.keys(window.sodaJSONObj["metadata-files"]).length > 0) {
      Object.keys(window.sodaJSONObj["metadata-files"]).forEach((element) => {
        let file_name = window.path.parse(element).name;
        if (!element.includes("-DELETED")) {
          withoutExtMetadataArray.push(window.path.parse(element).name);
        }
        if (requiredFiles.includes(file_name)) {
          let element_index = requiredFiles.indexOf(file_name);
          requiredFiles.splice(element_index, 1);
          missingFiles = [];
        }
      });
      for (let element in requiredFiles) {
        let swal_element = `<li>${requiredFiles[element]}</li>`;
        missingFiles.push(swal_element);
      }
    } else {
      for (let element in requiredFiles) {
        let swal_element = `<li>${requiredFiles[element]}</li>`;
        missingFiles.push(swal_element);
      }
    }

    if (missingFiles.length > 0) {
      var notIncludedMessage = `
        <div style='text-align: left'>
          You did not include the following metadata files that are typically expected for all SPARC datasets:
          <br>
          <ol style='text-align: left'>
            ${missingFiles.join("")}
          </ol>
          Are you sure you want to continue?
        </div>
      `;
      Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: "warning",
        html: notIncludedMessage,
        showConfirmButton: true,
        confirmButtonText: "Continue",
        showCancelButton: "No",
        focusCancel: true,
        reverseButtons: window.reverseSwalButtons,
        heightAuto: false,
        customClass: "swal-wide",
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          // Hide the current tab:
          $(parentTabs[window.currentTab]).removeClass("tab-active");
          // Increase or decrease the current tab by 1:
          window.currentTab = window.currentTab + pageIndex;
          // Display the correct tab:
          window.showParentTab(window.currentTab, pageIndex);
        }
      });
    } else {
      // Hide the current tab:
      $(parentTabs[window.currentTab]).removeClass("tab-active");
      // Increase or decrease the current tab by 1:
      window.currentTab = window.currentTab + pageIndex;
      // Display the correct tab:
      window.showParentTab(window.currentTab, pageIndex);
    }
  } else if (
    parentTabs[window.currentTab].id === "preview-dataset-tab" &&
    window.sodaJSONObj["starting-point"]["type"] == "bf"
  ) {
    $(parentTabs[window.currentTab]).removeClass("tab-active");
    window.currentTab = window.currentTab - 1;
    window.showParentTab(window.currentTab, pageIndex);
    $("#nextBtn").prop("disabled", false);
  } else if (
    parentTabs[window.currentTab].id === "manifest-file-tab" &&
    window.sodaJSONObj["starting-point"]["type"] == "bf"
  ) {
    // skip step 6 ( options irrelevant for existing bf/pennsieve workflow)
    $(parentTabs[window.currentTab]).removeClass("tab-active");
    if (pageIndex == 1) {
      window.currentTab = window.currentTab + 2;
      $("#nextBtn").prop("disabled", false);
      fixStepDone(4);

      window.showParentTab(window.currentTab, pageIndex);

      // check if skip card or the validate card have been checked
      const validationOptionSelected = document.querySelector(
        "#validate-dataset-tab input[type=radio]:checked"
      );

      if (validationOptionSelected) {
        // enable the continue button
        $("#nextBtn").prop("disabled", false);
      } else {
        // disable the continue button
        $("#nextBtn").prop("disabled", true);
      }
    } else {
      window.currentTab = window.currentTab - 1;
      // fixStepDone(4);
      $("#nextBtn").prop("disabled", true);
      window.showParentTab(window.currentTab, pageIndex);
    }
  } else if (
    parentTabs[window.currentTab].id === "manifest-file-tab" &&
    (window.sodaJSONObj["starting-point"]["type"] === "new" ||
      window.sodaJSONObj["starting-point"]["type"] === "local")
  ) {
    $(parentTabs[window.currentTab]).removeClass("tab-active");
    window.currentTab = window.currentTab + pageIndex;
    $("#Question-generate-dataset").show();
    $("#Question-generate-dataset").children().show();
    $("#Question-generate-dataset-generate-div").hide();
    $("#Question-generate-dataset-generate-div").children().hide();

    let dataset_location = document.querySelector(
      "#Question-generate-dataset-locally-destination > div > div.grouped.fields > label"
    );
    $(dataset_location).text("At which location should we generate the dataset?");

    // Show/or hide the replace existing button
    if (window.sodaJSONObj["starting-point"]["type"] === "local") {
      $("#generate-dataset-replace-existing").show();
      $("#generate-dataset-replace-existing").children().show();
    } else {
      $("#generate-dataset-replace-existing").hide();
      $("#generate-dataset-replace-existing").children().hide();
    }
    $("#nextBtn").prop("disabled", true);
    window.showParentTab(window.currentTab, pageIndex);
  } else if (
    parentTabs[window.currentTab].id === "validate-dataset-tab" &&
    window.sodaJSONObj["starting-point"]["type"] == "bf" &&
    pageIndex === -1
  ) {
    // if moving backwards fron the validate step
    $(parentTabs[window.currentTab]).removeClass("tab-active");
    // skip step 6 ( options irrelevant for existing bf/pennsieve workflow)
    window.currentTab = window.currentTab - 2;
    window.showParentTab(window.currentTab, pageIndex);
    $("#nextBtn").prop("disabled", false);
  } else if (parentTabs[window.currentTab].id === "generate-dataset-tab") {
    // Hide the current tab:
    $(parentTabs[window.currentTab]).removeClass("tab-active");
    // Increase or decrease the current tab by 1:
    window.currentTab = window.currentTab + pageIndex;
    // For step 1,2,3, check for High level folders input to disable Continue button
    if (window.currentTab === 1 || window.currentTab === 2 || window.currentTab === 3) {
      window.highLevelFoldersDisableOptions();
    }
    // Display the correct tab:
    window.showParentTab(window.currentTab, pageIndex);

    // check if skip card or the validate card have been checked
    const validationOptionSelected = document.querySelector(
      "#validate-dataset-tab input[type=radio]:checked"
    );

    if (validationOptionSelected) {
      // enable the continue button
      $("#nextBtn").prop("disabled", false);
    } else {
      // disable the continue button
      $("#nextBtn").prop("disabled", true);
    }

    // check if we are moving to the previous tab from the current tab and if we are starting local or new
    if (
      (window.sodaJSONObj["starting-point"]["type"] === "new" ||
        window.sodaJSONObj["starting-point"]["type"] === "local") &&
      pageIndex === -1
    ) {
      if (window.hasFiles) {
        $("#manifest-creation-prohibited").show();
        // uncheck the manifest file checkbox if it is currently checked
        if ($("#generate-manifest-curate").prop("checked")) {
          $("#generate-manifest-curate").click();
        }
        $("#generate-manifest-curate").prop("disabled", true);
        $("#nextBtn").prop("disabled", false);
      } else {
        $("#manifest-creation-prohibited").hide();
        $("#generate-manifest-curate").prop("disabled", false);
      }
    }
  } else if (window.currentTab === 4) {
    window.showParentTab(window.currentTab, pageIndex);
    // generate dataset tab
  } else {
    // Hide the current tab:
    $(parentTabs[window.currentTab]).removeClass("tab-active");
    // Increase or decrease the current tab by 1:
    window.currentTab = window.currentTab + pageIndex;
    // For step 1,2,3, check for High level folders input to disable Continue button
    if (window.currentTab === 1 || window.currentTab === 2 || window.currentTab === 3) {
      window.highLevelFoldersDisableOptions();
    }
    // Display the correct tab:
    window.showParentTab(window.currentTab, pageIndex);
  }
};

const fixStepIndicator = (pageIndex) => {
  // This function removes the "is-current" class of all steps...
  let progressSteps = document.getElementsByClassName("vertical-progress-bar-step");
  for (let step of progressSteps) {
    step.className = step.className.replace(" is-current", "");
  }
  progressSteps[pageIndex].className += " is-current";
};

const fixStepDone = (pageIndex) => {
  let progressSteps = document.getElementsByClassName("vertical-progress-bar-step");
  $(progressSteps[pageIndex]).addClass("done");
};

//// High level folders check mark effect
$(".option-card.high-level-folders").click(function () {
  $(this).toggleClass("checked");
  if ($(this).hasClass("checked")) {
    $(this).children()[0].children[1].children[0].checked = true;
  } else {
    $(this).children()[0].children[1].children[0].checked = false;
  }
  checkHighLevelFoldersInput();
});

window.globalGettingStarted1stQuestionBool = false;

$(".parent-tabs.folder-input-check").click(function () {
  var parentCard = $(this).parents()[2];
  $(parentCard).toggleClass("checked");
  if ($(this).checked) {
    $(this).checked = false;
    $(parentCard).removeClass("non-selected");
  } else {
    $(this).checked = true;
  }
  checkHighLevelFoldersInput();
});

$(".main-tabs.folder-input-check").click(function () {
  var parentCard = $(this).parents()[2];
  $(parentCard).toggleClass("checked");
  if ($(this).checked) {
    $(this).checked = false;
    $(parentCard).removeClass("non-selected");
  } else {
    $(this).checked = true;
  }
});

// function associated with metadata files (show individual metadata file upload div on button click)
function showSubTab(section, tab, input) {
  var tabArray;
  if (section === "metadata") {
    tabArray = [
      "div-submission-metadata-file",
      "div-dataset-description-metadata-file",
      "div-subjects-metadata-file",
      "div-samples-metadata-file",
      "div-changes-metadata-file",
      "div-readme-metadata-file",
      "div-manifest-metadata-file",
    ];
  }
  var inActiveTabArray = tabArray.filter((element) => {
    return ![tab].includes(element);
  });
  for (var id of inActiveTabArray) {
    document.getElementById(id).style.display = "none";
  }
  document.getElementById(input).checked = true;
  document.getElementById(tab).style.display = "block";
}

// function to check if certain high level folders already chosen and have files/sub-folders
// then disable the option (users cannot un-choose)
window.highLevelFoldersDisableOptions = () => {
  var highLevelFolderOptions = window.datasetStructureJSONObj["folders"];
  if (highLevelFolderOptions) {
    for (var folder of window.highLevelFolders) {
      if (Object.keys(highLevelFolderOptions).includes(folder)) {
        var optionCard = $("#" + folder + "-check").parents()[2];
        $(optionCard).addClass("disabled");
        if (!$(optionCard).hasClass("checked")) {
          $(optionCard).addClass("checked");
        }
        if (!$("#" + folder + "-check").prop("checked")) {
          $("#" + folder + "-check").prop("checked", true);
        }
      } else {
        var optionCard = $("#" + folder + "-check").parents()[2];
        $(optionCard).removeClass("disabled");
        $(optionCard).removeClass("checked");
        $(optionCard).children()[0].children[1].children[0].checked = false;
      }
    }
  }
};

// // // High level folders check mark effect
$(".parent-tabs, .folder-input-check").click(function () {
  var highLevelFolderCard = $(this).parents()[2];
  $(highLevelFolderCard).toggleClass("checked");
  if ($(this).checked) {
    $(this).checked = false;
  } else {
    $(this).checked = true;
  }
});

// ////////////// THIS IS FOR THE SUB-TABS OF GETTING STARTED and GENERATE DATASET sections /////////////////////////
/*
  Transition between tabs under Step 1 and Step 6;
  *** Note: This onclick function below is only used for div: option-card and not buttons
  due to some unique element restrictions the option-card div has
*/

// raise warning before wiping out existing window.sodaJSONObj
// show warning message
const raiseWarningGettingStarted = (ev) => {
  return new Promise((resolve) => {
    if (
      !(
        JSON.stringify(window.sodaJSONObj) === "{}" ||
        JSON.stringify(window.sodaJSONObj) ===
          '{"starting-point":{"type":"new"},"dataset-structure":{},"metadata-files":{}}' ||
        JSON.stringify(window.sodaJSONObj) ===
          '{"starting-point":{"type":""},"dataset-structure":{},"metadata-files":{}}' ||
        JSON.stringify(window.sodaJSONObj) ===
          '{"bf-account-selected":{},"bf-dataset-selected":{},"dataset-structure":{},"metadata-files":{},"manifest-files":{},"generate-dataset":{},"starting-point":{ "type": "local","local-path":""}}' ||
        JSON.stringify(window.sodaJSONObj) ===
          '{"bf-account-selected":{"account-name":{}}, "bf-dataset-selected":{"dataset-name":{}}, "dataset-structure":{},"metadata-files":{}, "manifest-files":{}, "generate-dataset":{}, "starting-point": {"type": "bf"}}'
      )
    ) {
      Swal.fire({
        icon: "warning",
        text: "This will reset your progress so far. Are you sure you want to continue?",
        showCancelButton: "Cancel",
        focusCancel: true,
        confirmButtonText: "Continue",
        reverseButtons: window.reverseSwalButtons,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.globalGettingStarted1stQuestionBool = true;
          window.wipeOutCurateProgress();
          resolve(window.globalGettingStarted1stQuestionBool);
        } else {
          window.globalGettingStarted1stQuestionBool = false;
          resolve(window.globalGettingStarted1stQuestionBool);
        }
      });
    } else {
      window.globalGettingStarted1stQuestionBool = true;
      resolve(window.globalGettingStarted1stQuestionBool);
    }
  });
};

window.handleValidateCardSelection = async (ev) => {
  $(ev).children().find(".folder-input-check").prop("checked", true);
  $(ev).addClass("checked");

  // uncheck the other radio buttons
  $($(ev).parents()[0]).siblings().find(".option-card.radio-button").removeClass("checked");
  $($(ev).parents()[0]).siblings().find(".option-card.radio-button").addClass("non-selected");

  // check which card is selected
  let selectedCard = document.querySelector("#validate-dataset-tab input[type=radio]:checked");

  if (selectedCard.id === "validate-organize-1-A") {
    // run validation
    await window.validateOrganizedDataset();

    // scroll to the results table
    document.querySelector("#organize--table-validation-errors").scrollIntoView();
  } // else the user skipped validation

  // enable the continue button
  $("#nextBtn").prop("disabled", false);
};

var divList = [];
window.transitionSubQuestions = async (ev, currentDiv, parentDiv, button, category) => {
  if (currentDiv === "Question-getting-started-1") {
    // log the start of a new curation process from scratch
    // window.logCurationForAnalytics(
    //   "Success",
    //   window.PrepareDatasetsAnalyticsPrefix.CURATE,
    //   window.AnalyticsGranularity.ACTION,
    //   ["New"],
    //   "Local",
    //   true
    // );
    window.globalGettingStarted1stQuestionBool = await raiseWarningGettingStarted(ev);
    if (window.globalGettingStarted1stQuestionBool) {
      $("#progress-files-dropdown").val("Select");
      $("#para-progress-file-status").text("");
      $("#nextBtn").prop("disabled", true);
      window.exitCurate(false);
      window.globalGettingStarted1stQuestionBool = false;
    } else {
      window.globalGettingStarted1stQuestionBool = false;
      return;
    }
  }

  // add "non-selected" to current option-card so users cannot keep selecting it
  $(ev).removeClass("non-selected");
  $(ev).children().find(".folder-input-check").prop("checked", true);
  $(ev).addClass("checked");

  // uncheck the other radio buttons
  $($(ev).parents()[0]).siblings().find(".option-card.radio-button").removeClass("checked");
  $($(ev).parents()[0]).siblings().find(".option-card.radio-button").addClass("non-selected");

  // first, handle target or the next div to show
  var target = document.getElementById(ev.getAttribute("data-next"));
  // hide related previous divs
  hidePrevDivs(currentDiv, category);
  // display the target tab (data-next tab)
  if (!$(target).hasClass("show")) {
    setTimeout(function () {
      $(target).addClass("show");
      // auto-scroll to bottom of div (except the dataset_description 4 sections)
      if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
        document.getElementById(parentDiv).scrollTop =
          document.getElementById(parentDiv).scrollHeight;
      }
    }, delay);
  }

  if (currentDiv == "Question-generate-dataset") {
    $("#inputNewNameDataset").val("");
    $("#inputNewNameDataset").click();
  }

  // if buttons: Confirm account were hidden, show them again here
  // under Step 6
  if (ev.getAttribute("data-next") === "Question-generate-dataset-BF-account") {
    let temp = $(".bf-account-span")
      .html()
      .replace(/^\s+|\s+$/g, "");
    if (temp == "None" || temp == "") {
      $("#div-bf-account-btns").css("display", "none");
      $("#btn-bf-account").hide();
    } else {
      $("#div-bf-account-btns").css("display", "flex");
      $("#btn-bf-account").show();
      $("#" + ev.getAttribute("data-next") + " button").show();
    }
  }
  // under Step 1
  if (ev.getAttribute("data-next") === "Question-getting-started-BF-account") {
    let temp = $(".bf-account-span")
      .html()
      .replace(/^\s+|\s+$/g, "");
    if (temp == "None" || temp == "") {
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    } else {
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    }
  }

  // If Confirm dataset btn was hidden, show it again here
  // under Step 6
  let step6 = document.getElementById("generate-dataset-tab");
  if (ev.getAttribute("data-next") === "Question-generate-dataset-BF-dataset") {
    // $("#nextBtn").prop("disabled", true);
    if (step6.classList.contains("tab-active")) {
      $("#nextBtn").prop("disabled", true);
    }

    // hide the para para-continue-empty-ds-selected
    $("#para-continue-empty-ds-selected").hide();

    if ($("#current-bf-dataset-generate").text() !== "None") {
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
    }
  }
  // under Step 1
  if (ev.getAttribute("data-next") === "Question-getting-started-BF-dataset") {
    if ($("#current-bf-dataset").text() !== "None") {
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset-getting-started").show();
    }
  }
  if (ev.getAttribute("data-next") === "Question-generate-dataset-choose-ds-name") {
    if (step6.classList.contains("tab-active")) {
      $("#nextBtn").prop("disabled", true);
      if (document.getElementById("inputNewNameDataset").val != "") {
        document.getElementById("btn-confirm-new-dataset-name").style.display = "inline-block";
      }
    }
  }

  if (ev.getAttribute("data-next") === "Question-generate-dataset-generate-div") {
    $("#Question-generate-dataset-generate-div").show();
    $("#Question-generate-dataset-generate-div").children().show();
  }

  if (!(ev.getAttribute("data-next") === "Question-generate-dataset-generate-div")) {
    // create moving effects when new questions appear
    $("#Question-generate-dataset-generate-div").hide();
    $("#Question-generate-dataset-generate-div").children().hide();
    setTimeout(() => target.classList.add("test2"), 100);
  }

  // here, handling existing folders and files tabs are independent of each other
  if (
    !(
      ev.getAttribute("data-next") === "Question-generate-dataset-existing-files-options" &&
      target.classList.contains("prev")
    )
  ) {
    // append to parentDiv
    document.getElementById(parentDiv).appendChild(target);
    $("#para-continue-existing-files-generate").text("");
  } else {
    // disable Next button if all questions are not fully answered by users
    $("#nextBtn").prop("disabled", false);
  }

  // add "prev" to previous questions just so the text becomes gray -> take the attention away from those questions
  document.getElementById(currentDiv).classList.add("prev");

  // handle buttons (if buttons are confirm buttons -> delete after users confirm)
  if (button === "delete") {
    if ($(ev).siblings().length > 0) {
      setTimeout(function () {
        $(ev).siblings().hide();
        // auto-scroll to bottom of div
        if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
          document.getElementById(parentDiv).scrollTop =
            document.getElementById(parentDiv).scrollHeight;
        }
      }, delay);
    }
    setTimeout(function () {
      $(ev).hide();
      // auto-scroll to bottom of div
      if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
        document.getElementById(parentDiv).scrollTop =
          document.getElementById(parentDiv).scrollHeight;
      }
    }, delay);
  }

  // auto-scroll to bottom of div
  document.getElementById(parentDiv).scrollTop = document.getElementById(parentDiv).scrollHeight;

  // when we hit the last question under Step 1, hide and disable Next button
  if (ev.getAttribute("data-next") === "Question-getting-started-final") {
    $("#progress-files-dropdown").val("Select");
    $("#para-progress-file-status").text("");
    $("#nextBtn").prop("disabled", true);
    $("#para-continue-prepare-new-getting-started").text("");
    if ($("#prepare-new").prop("checked")) {
      window.exitCurate(false);
      $("#prepare-new").prop("checked", true);
      $($("#prepare-new").parents()[2]).addClass("checked");
      $($($("#div-getting-started-prepare-new").parents()[0]).siblings().children()).addClass(
        "non-selected"
      );
      window.sodaJSONObj["starting-point"] = {};
      window.sodaJSONObj["starting-point"]["type"] = "new";
      window.sodaJSONObj["dataset-structure"] = {};
      window.datasetStructureJSONObj = { folders: {}, files: {} };
      window.sodaJSONObj["metadata-files"] = {};
      reset_ui();
      setTimeout(() => {
        $("#nextBtn").prop("disabled", false);
        $("#para-continue-prepare-new-getting-started").text("Please continue below.");
      }, 600);
    } else if ($("#existing-bf").is(":checked")) {
      $("#nextBtn").prop("disabled", true);
      // this window.exitCurate function gets called in the beginning here
      // in case users have existing, non-empty SODA object structure due to previous progress option was selected prior to this "existing-bf" option
      $("#Question-getting-started-existing-BF-account").show();
      $("#Question-getting-started-existing-BF-account").children().show();
      if (window.sodaJSONObj["dataset-structure"] != {}) {
        reset_ui();
        $("#nextBtn").prop("disabled", false);
      }
    }
  }

  if (ev.getAttribute("data-next") === "Question-generate-dataset-generate-div-old") {
    if (
      $("#generate-local-existing").is(":checked") &&
      currentDiv === "Question-generate-dataset"
    ) {
      let starting_point = window.sodaJSONObj["starting-point"]["local-path"];

      Swal.fire({
        icon: "info",
        text: `The following local folder '${starting_point}' will be modified as instructed.`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      $("#para-continue-replace-local-generate").show();
      $("#para-continue-replace-local-generate").text("Please continue below.");
    } else {
      if (currentDiv === "Question-generate-dataset-existing-files-options") {
        $("#para-continue-existing-files-generate").show();
        $("#para-continue-existing-files-generate").text("Please continue below.");
      } else {
        $("#para-continue-existing-files-generate").hide();
        $("#para-continue-existing-files-generate").text("");
      }
    }
    $("#nextBtn").prop("disabled", false);
  } else {
    $("#para-continue-replace-local-generate").hide();
    $("#para-continue-replace-local-generate").text("");
  }

  if (ev.getAttribute("data-next") === "Question-getting-started-locally-destination") {
    if ($("#existing-local").is(":checked") && currentDiv == "Question-getting-started-1") {
      window.sodaJSONObj = {
        "bf-account-selected": {},
        "bf-dataset-selected": {},
        "dataset-structure": {},
        "metadata-files": {},
        "manifest-files": {},
        "generate-dataset": {},
        "starting-point": {
          type: "local",
          "local-path": "",
        },
      };
      // reset the UI back to fresh new
      reset_ui();
      $("#nextBtn").prop("disabled", true);
    }
  }
};

// Create the dataset structure for window.sodaJSONObj
window.create_json_object = async (action, sodaJSONObj, root_folder_path) => {
  let high_level_sparc_folders = ["code", "derivative", "docs", "primary", "protocol", "source"];
  let high_level_metadata_sparc = [
    "submission.xlsx",
    "submission.csv",
    "submission.json",
    "dataset_description.xlsx",
    "dataset_description.csv",
    "dataset_description.json",
    "subjects.xlsx",
    "subjects.csv",
    "subjects.json",
    "samples.xlsx",
    "samples.csv",
    "samples.json",
    "README.txt",
    "CHANGES.txt",
    "code_description.xlsx",
    "inputs_metadata.xlsx",
    "outputs_metadata.xlsx",
  ];
  sodaJSONObj["dataset-structure"] = { folders: {} };
  let stats = "";
  // Get high level folders and metadata files first
  window.fs.readdirSync(root_folder_path).forEach((file) => {
    let full_current_path = window.path.join(root_folder_path, file);
    stats = window.fs.statSync(full_current_path);
    if (stats.isDirectory) {
      if (window.highLevelFolders.includes(file) && !/(^|\/)\.[^\/\.]/g.test(file)) {
        sodaJSONObj["dataset-structure"]["folders"][file] = {
          folders: {},
          files: {},
          path: full_current_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
    if (stats.isFile) {
      if (high_level_metadata_sparc.includes(file) && !/(^|\/)\.[^\/\.]/g.test(file)) {
        //ignore hidden files
        sodaJSONObj["metadata-files"][file] = {
          path: full_current_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
  });

  // go through each individual high level folder and create the structure
  // If a manifest file exists, read information from the manifest file into a json object
  for (const folder in sodaJSONObj["dataset-structure"]["folders"]) {
    sodaJSONObj["starting-point"][folder] = {};
    sodaJSONObj["starting-point"][folder]["path"] = "";
    let temp_file_path_xlsx = window.path.join(root_folder_path, folder, "manifest.xlsx");
    let temp_file_path_csv = window.path.join(root_folder_path, folder, "manifest.csv");
    if (window.fs.existsSync(temp_file_path_xlsx)) {
      sodaJSONObj["starting-point"][folder]["path"] = temp_file_path_xlsx;
      sodaJSONObj["starting-point"][folder]["manifest"] = await window.electron.ipcRenderer.invoke(
        "excelToJsonSheet1",
        sodaJSONObj["starting-point"][folder]["path"]
      );
    } else if (window.fs.existsSync(temp_file_path_csv)) {
      sodaJSONObj["starting-point"][folder]["path"] = temp_file_path_csv;
      sodaJSONObj["starting-point"][folder]["manifest"] = csvToJson
        .parseSubArray(";", ",")
        .getJsonFromCsv(sodaJSONObj["starting-point"][folder]["path"]);
    }

    recursive_structure_create(
      action,
      sodaJSONObj["dataset-structure"]["folders"][folder],
      folder,
      window.path.join(root_folder_path, folder)
    );
  }
};

// Create the dataset structure for window.sodaJSONObj (similar to window.create_json_object but includes manifest files in json structure)
window.create_json_object_include_manifest = (action, sodaJSONObj, root_folder_path) => {
  let high_level_metadata_sparc = [
    "submission.xlsx",
    "submission.csv",
    "submission.json",
    "dataset_description.xlsx",
    "dataset_description.csv",
    "dataset_description.json",
    "subjects.xlsx",
    "subjects.csv",
    "subjects.json",
    "samples.xlsx",
    "samples.csv",
    "samples.json",
    "README.txt",
    "CHANGES.txt",
    "code_description.xlsx",
    "inputs_metadata.xlsx",
    "outputs_metadata.xlsx",
  ];
  sodaJSONObj["dataset-structure"] = { folders: {} };
  let stats = "";
  // Get high level folders and metadata files first
  window.fs.readdirSync(root_folder_path).forEach((file) => {
    let full_current_path = window.path.join(root_folder_path, file);
    stats = window.fs.statSync(full_current_path);
    if (stats.isDirectory) {
      if (window.highLevelFolders.includes(file) && !/(^|\/)\.[^\/\.]/g.test(file)) {
        sodaJSONObj["dataset-structure"]["folders"][file] = {
          folders: {},
          files: {},
          path: full_current_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
    if (stats.isFile) {
      if (high_level_metadata_sparc.includes(file) && !/(^|\/)\.[^\/\.]/g.test(file)) {
        //ignore hidden files
        sodaJSONObj["metadata-files"][file] = {
          path: full_current_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
  });
  // go through each individual high level folder and create the structure
  // If a manifest file exists, read information from the manifest file into a json object
  for (const folder in sodaJSONObj["dataset-structure"]["folders"]) {
    sodaJSONObj["starting-point"][folder] = {};
    sodaJSONObj["starting-point"][folder]["path"] = "";
    // temp_file_path_xlsx = window.path.join(root_folder_path, folder, "manifest.xlsx");
    // temp_file_path_csv = window.path.join(root_folder_path, folder, "manifest.csv");
    // if (fs.existsSync(temp_file_path_xlsx)) {
    //   window.sodaJSONObj["starting-point"][folder]["path"] = temp_file_path_xlsx;
    //   window.sodaJSONObj["starting-point"][folder]["manifest"] = excelToJson({
    //     sourceFile: window.sodaJSONObj["starting-point"][folder]["path"],
    //   })["Sheet1"];
    // } else if (fs.existsSync(temp_file_path_csv)) {
    //   window.sodaJSONObj["starting-point"][folder]["path"] = temp_file_path_csv;
    //   window.sodaJSONObj["starting-point"][folder]["manifest"] = csvToJson
    //     .parseSubArray(";", ",")
    //     .getJsonFromCsv(window.sodaJSONObj["starting-point"][folder]["path"]);
    // }
    recursive_structure_create_include_manifest(
      action,
      sodaJSONObj["dataset-structure"]["folders"][folder],
      folder,
      window.path.join(root_folder_path, folder)
    );
  }
};

// replace any duplicate file names
// Modify for consistency with Pennsieve naming when the update their system
const check_file_name_for_pennsieve_duplicate = (dataset_folder, filepath) => {
  let file_name = window.path.parse(filepath).base;
  let file_extension = window.path.parse(filepath).ext;
  var duplicateFileArray = [];

  for (var item in dataset_folder) {
    if (dataset_folder[item]["path"] !== filepath) {
      duplicateFileArray.push(item);
    }
  }

  var j = 1;
  var fileBaseName = file_name;
  var originalFileNameWithoutExt = window.path.parse(fileBaseName).name;
  var fileNameWithoutExt = originalFileNameWithoutExt;
  while (fileBaseName in duplicateFileArray) {
    fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
    fileBaseName = fileNameWithoutExt + file_extension;
    j++;
  }
  return fileBaseName;
};

// Create the dataset structure for each high level folder.
// If a manifest file exists, read the file to get any additional metadata from the file.
const recursive_structure_create = (
  action,
  dataset_folder,
  high_level_folder,
  root_folder_path
) => {
  let current_folder_path = dataset_folder["path"];
  window.fs.readdirSync(current_folder_path).forEach((file) => {
    let manifest_object = {
      filename: "",
      timestamp: "",
      description: "",
      "file-type": "",
      "additional-metadata": "",
    };
    let current_file_path = window.path.join(current_folder_path, file);
    let stats = window.fs.statSync(current_file_path);
    if (
      stats.isFile &&
      window.path.parse(current_file_path).name != "manifest" &&
      !/(^|\/)\.[^\/\.]/g.test(file) && //not a hidden file
      high_level_folder != dataset_folder
    ) {
      if (window.sodaJSONObj["starting-point"][high_level_folder]["path"] !== "") {
        let extension = window.path.extname(
          window.sodaJSONObj["starting-point"][high_level_folder]["path"]
        );
        if (extension == ".xlsx") {
          let temp_current_file_path = current_file_path.replace(/\\/g, "/");
          root_folder_path = root_folder_path.replace(/\\/g, "/");

          let relative_path = temp_current_file_path.replace(root_folder_path + "/", "");
          let manifestContent = window.sodaJSONObj["starting-point"][high_level_folder]["manifest"];
          let manifestHeaders = Object.values(manifestContent[0]);
          let manifestData = Object.values(manifestContent[1]);

          for (const item in window.sodaJSONObj["starting-point"][high_level_folder]["manifest"]) {
            if (
              window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["A"] ==
              relative_path
            ) {
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["C"] !=
                undefined
              ) {
                manifest_object["description"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["C"];
              } else {
                manifest_object["description"] = "";
              }
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["E"] !=
                undefined
              ) {
                manifest_object["additional-metadata"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["E"];
              } else {
                manifest_object["additional-metadata"] = "";
              }
              if (manifestHeaders.length > 5) {
                //preserve extra columns
                let extraColumnHeaders = manifestHeaders.slice(5);
                let extraColumnValues = manifestData.slice(5);
                for (let i = 0; i < extraColumnHeaders.length; i++) {
                  manifest_object["extra_columns"] = {
                    [extraColumnHeaders[i]]: extraColumnValues[i],
                  };
                }
                // manifest_object["extra-columns"] = {
                // [extraColumnHeaders]: extraColumnValues
                // };
              }
            }
          }
        } else if (extension == ".csv") {
          let temp_current_file_path = current_file_path.replace("\\", "/");
          let relative_path = temp_current_file_path.replace(root_folder_path + "/", "");
          for (item in window.sodaJSONObj["starting-point"][high_level_folder]["manifest"]) {
            if (
              window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                "filename"
              ] == relative_path
            ) {
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                  "description"
                ] != undefined
              ) {
                manifest_object["description"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                    "description"
                  ];
              } else {
                manifest_object["description"] = "";
              }
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                  "Additional Metadata"
                ] != undefined
              ) {
                manifest_object["additional-metadata"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                    "AdditionalMetadata"
                  ];
              } else {
                manifest_object["additional-metadata"] = "";
              }
            }
          }
        }
      }

      dataset_folder["files"][file] = {
        path: current_file_path,
        type: "local",
        action: ["existing"],
        description: manifest_object["description"],
        "additional-metadata": manifest_object["additional-metadata"],
      };
      if ("extra_columns" in manifest_object) {
        dataset_folder["files"][file]["extra_columns"] = manifest_object["extra_columns"];
      }
      let projected_file_name = check_file_name_for_pennsieve_duplicate(
        dataset_folder["files"],
        current_file_path
      );
      if (file !== projected_file_name) {
        dataset_folder["files"][projected_file_name] = dataset_folder["files"][file];
        dataset_folder["files"][projected_file_name]["action"].push("renamed");
        delete dataset_folder["files"][file];
      }
    }

    if (stats.isDirectory && !/(^|\/)\.[^\/\.]/g.test(file)) {
      if (window.irregularFolderArray.includes(current_file_path)) {
        var renamedFolderName = "";
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = window.removeIrregularFolders(file);
          } else if (action === "replace") {
            renamedFolderName = window.replaceIrregularFolders(file);
          }
          dataset_folder["folders"][renamedFolderName] = {
            folders: {},
            files: {},
            path: current_file_path,
            type: "local",
            action: ["existing"],
          };
          // file = renamedFolderName
        }
      } else {
        dataset_folder["folders"][file] = {
          folders: {},
          files: {},
          path: current_file_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
  });
  for (const folder in dataset_folder["folders"]) {
    recursive_structure_create(
      action,
      dataset_folder["folders"][folder],
      high_level_folder,
      root_folder_path
    );
  }
  return;
};

// similar function to recursive_structure_create but includes manifest files in structure instead of just parsing their info into json object
const recursive_structure_create_include_manifest = (
  action,
  dataset_folder,
  high_level_folder,
  root_folder_path
) => {
  let current_folder_path = dataset_folder["path"];
  let manifest_object = {
    filename: "",
    timestamp: "",
    description: "",
    "file-type": "",
    "additional-metadata": "",
  };
  window.fs.readdirSync(current_folder_path).forEach((file) => {
    let current_file_path = window.path.join(current_folder_path, file);
    let stats = window.fs.statSync(current_file_path);
    if (
      stats.isFile &&
      !/(^|\/)\.[^\/\.]/g.test(file) && //not a hidden file
      high_level_folder != dataset_folder
    ) {
      if (window.sodaJSONObj["starting-point"][high_level_folder]["path"] !== "") {
        let extension = window.path.extname(
          window.sodaJSONObj["starting-point"][high_level_folder]["path"]
        );
        if (extension == ".xlsx") {
          let temp_current_file_path = current_file_path.replace("\\", "/");
          let relative_path = temp_current_file_path.replace(root_folder_path + "/", "");
          for (const item in window.sodaJSONObj["starting-point"][high_level_folder]["manifest"]) {
            if (
              window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["A"] ==
              relative_path
            ) {
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["C"] !=
                undefined
              ) {
                manifest_object["description"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["C"];
              } else {
                manifest_object["description"] = "";
              }
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["E"] !=
                undefined
              ) {
                manifest_object["additional-metadata"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item]["E"];
              } else {
                manifest_object["additional-metadata"] = "";
              }
            }
          }
        } else if (extension == ".csv") {
          let temp_current_file_path = current_file_path.replace("\\", "/");
          let relative_path = temp_current_file_path.replace(root_folder_path + "/", "");
          for (item in window.sodaJSONObj["starting-point"][high_level_folder]["manifest"]) {
            if (
              window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                "filename"
              ] == relative_path
            ) {
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                  "description"
                ] != undefined
              ) {
                manifest_object["description"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                    "description"
                  ];
              } else {
                manifest_object["description"] = "";
              }
              if (
                window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                  "AdditionalMetadata"
                ] != undefined
              ) {
                manifest_object["additional-metadata"] =
                  window.sodaJSONObj["starting-point"][high_level_folder]["manifest"][item][
                    "AdditionalMetadata"
                  ];
              } else {
                manifest_object["additional-metadata"] = "";
              }
            }
          }
        }
      }

      dataset_folder["files"][file] = {
        path: current_file_path,
        type: "local",
        action: ["existing"],
        description: manifest_object["description"],
        "additional-metadata": manifest_object["additional-metadata"],
      };
      let projected_file_name = check_file_name_for_pennsieve_duplicate(
        dataset_folder["files"],
        current_file_path
      );
      if (file !== projected_file_name) {
        dataset_folder["files"][projected_file_name] = dataset_folder["files"][file];
        dataset_folder["files"][projected_file_name]["action"].push("renamed");
        delete dataset_folder["files"][file];
      }
    }
    if (stats.isDirectory && !/(^|\/)\.[^\/\.]/g.test(file)) {
      if (window.irregularFolderArray.includes(current_file_path)) {
        var renamedFolderName = "";
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = window.removeIrregularFolders(file);
          } else if (action === "replace") {
            renamedFolderName = window.replaceIrregularFolders(file);
          }
          dataset_folder["folders"][renamedFolderName] = {
            folders: {},
            files: {},
            path: current_file_path,
            type: "local",
            action: ["existing"],
          };
          // file = renamedFolderName
        }
      } else {
        dataset_folder["folders"][file] = {
          folders: {},
          files: {},
          path: current_file_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
  });
  for (const folder in dataset_folder["folders"]) {
    recursive_structure_create_include_manifest(
      action,
      dataset_folder["folders"][folder],
      high_level_folder,
      root_folder_path
    );
  }
  return;
};

// Function to verify if a local folder is a SPARC folder
// If no high level folders or any possible metadata files
// are found the folder is marked as invalid
window.verify_sparc_folder = (root_folder_path, type) => {
  let high_level_sparc_folders = ["code", "derivative", "docs", "primary", "protocol", "source"];
  let possible_metadata_files = [
    "submission",
    "dataset_description",
    "subjects",
    "samples",
    "README",
    "CHANGES",
  ];
  let valid_dataset = false;
  let entries = window.fs.readdirSync(root_folder_path);
  for (let i = 0; i < entries.length; i++) {
    let item = entries[i];
    if (type === "local") {
      if (
        window.highLevelFolders.includes(item) ||
        possible_metadata_files.includes(window.path.parse(item).name)
      ) {
        valid_dataset = true;
        break;
      } else {
        valid_dataset = false;
      }
    } else {
      if (
        window.highLevelFolders.includes(item) ||
        possible_metadata_files.includes(window.path.parse(item).name) ||
        item.substring(0, 1) != "."
      ) {
        valid_dataset = true;
        break;
      } else {
        valid_dataset = false;
      }
    }
  }
  return valid_dataset;
};

// function similar to window.transitionSubQuestions, but for buttons
window.transitionSubQuestionsButton = async (ev, currentDiv, parentDiv, button, category) => {
  /*
    ev: the button being clicked
    currentDiv: current option-card (question)
    parentDiv: current parent-tab (step)
    category: either getting-started or generate-dataset (currently only these 2 have multiple sub questions)
  */

  if (currentDiv === "Question-getting-started-BF-dataset") {
    let selectedDataset = $("#current-bf-dataset").text();
    $("#nextBtn").prop("disabled", true);
    window.sodaJSONObj = {
      "bf-account-selected": {
        "account-name": {},
      },
      "bf-dataset-selected": {
        "dataset-name": {},
      },
      "dataset-structure": {},
      "metadata-files": {},
      "manifest-files": {},
      "generate-dataset": {},
      "starting-point": {
        type: "bf",
      },
    };

    // Set the default Pennsieve account and dataset
    window.sodaJSONObj["bf-account-selected"]["account-name"] = window.defaultBfAccount;
    window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = selectedDataset;

    $("#para-continue-bf-dataset-getting-started").text("");
    $("body").addClass("waiting");
    $("#button-confirm-bf-dataset-getting-started").prop("disabled", true);
    $("#bf-dataset-spinner").show();
    $("#bf-dataset-spinner").children().show();
    $("#bf-dataset-spinner").css("visibility", "visible");

    // Check if dataset is locked before trying to import
    const isDatasetLocked = await api.isDatasetLocked(window.defaultBfAccount, selectedDataset);
    if (isDatasetLocked) {
      Swal.fire({
        icon: "info",
        title: `${selectedDataset} is locked from editing`,
        html: `
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>
            `,
        width: 600,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        focusConfirm: true,
        allowOutsideClick: false,
      });

      $("#nextBtn").prop("disabled", true);
      $("#para-continue-bf-dataset-getting-started").text("");
      $("body").removeClass("waiting");
      showHideDropdownButtons("dataset", "hide");
      $("#current-bf-dataset").text("None");
      $(datasetPermissionDiv).find("#curatebfdatasetlist").val("Select dataset").trigger("change");
      window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";
      $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
      $("body").removeClass("waiting");

      // log the event to analytics
      window.logCurationForAnalytics(
        "Error",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ACTION,
        ["Dataset Locked"],
        "Pennsieve",
        true
      );

      return;
    }

    let sodaObject = {};
    let manifestErrorMessage = [];
    try {
      let data = await window.bf_request_and_populate_dataset(
        window.sodaJSONObj,
        document.querySelector("#loading_pennsieve_dataset-organize"),
        true
      );
      sodaObject = data.soda_object;
      manifestErrorMessage = data.manifest_error_message;
    } catch (err) {
      Swal.fire({
        icon: "error",
        html:
          "<p style='color:red'>" +
          "Could not retrieve this Pennsieve dataset" +
          ".<br>Please choose another dataset!</p>",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      $("#nextBtn").prop("disabled", true);
      $("#para-continue-bf-dataset-getting-started").text("");
      $("body").removeClass("waiting");
      // $("#bf-dataset-spinner").css("visibility", "hidden");
      showHideDropdownButtons("dataset", "hide");
      $("#current-bf-dataset").text("None");
      $(datasetPermissionDiv).find("#curatebfdatasetlist").val("Select dataset").trigger("change");
      window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";
      $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
      $("body").removeClass("waiting");

      // log the error to analytics
      window.logCurationForAnalytics(
        "Error",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ACTION,
        ["Existing"],
        "Pennsieve",
        false
      );

      return;
    }

    if (manifestErrorMessage.length > 0) {
      // if any manifest files could not be read
      let message_text = "";
      message_text =
        "The manifest files in the following folders could not be read due to formatting issues. Would you like SODA to ignore these manifest files and continue? <br><ul>";

      for (let item in manifestErrorMessage) {
        message_text += `<li>${manifestErrorMessage[item]}</li>`;
      }
      message_text += "</ul>";

      Swal.fire({
        icon: "warning",
        text: message_text,
        showCancelButton: true,
        cancelButtonText: "No",
        confirmButtonText: "Continue",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((response) => {
        if (response.isConfirmed) {
          window.sodaJSONObj = sodaObject;
          if (JSON.stringify(window.sodaJSONObj["dataset-structure"]) !== "{}") {
            window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
          } else {
            window.datasetStructureJSONObj = { folders: {}, files: {} };
          }
          window.populate_existing_folders(window.datasetStructureJSONObj);
          window.populate_existing_metadata(window.sodaJSONObj);
          $("#nextBtn").prop("disabled", false);
          $("#para-continue-bf-dataset-getting-started").text("Please continue below.");
          showHideDropdownButtons("dataset", "show");
          // log the successful Pennsieve import to analytics- no matter if the user decided to cancel
          window.logCurationForAnalytics(
            "Success",
            window.PrepareDatasetsAnalyticsPrefix.CURATE,
            window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
            ["Existing"],
            "Pennsieve",
            false
          );
        } else {
          window.exitCurate();
        }
      });
    } else {
      window.sodaJSONObj = sodaObject;
      if (JSON.stringify(window.sodaJSONObj["dataset-structure"]) !== "{}") {
        window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
      } else {
        window.datasetStructureJSONObj = { folders: {}, files: {} };
      }

      window.populate_existing_folders(window.datasetStructureJSONObj);
      window.populate_existing_metadata(window.sodaJSONObj);
      $("#nextBtn").prop("disabled", false);
      $("#para-continue-bf-dataset-getting-started").text("Please continue below.");
      showHideDropdownButtons("dataset", "show");

      window.logCurationForAnalytics(
        "Success",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Existing"],
        "Pennsieve",
        false
      );
    }

    $("body").removeClass("waiting");
    $("#bf-dataset-spinner").css("visibility", "hidden");
    $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
    $("#dataset-loaded-message").show();

    // clear the validation table results
    let validationErrorsTable = document.querySelector("#organize--table-validation-errors tbody");
    window.clearValidationResults(validationErrorsTable);
    // hide the table
    document.querySelector("#organize--table-validation-errors").style.visibility = "hidden";
    // $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
  }

  // first, handle target or the next div to show
  let target = document.getElementById(ev.getAttribute("data-next"));
  hidePrevDivs(currentDiv, category);
  // display the target tab (data-next tab)
  if (!target.classList.contains("show")) {
    target.classList.add("show");
  }

  // Step 6 - The Merge/Skip/Replace options for selecting how to upload data to an existing Pennsieve dataset
  if (ev.getAttribute("data-next") === "Question-generate-dataset-existing-folders-options") {
    if (!window.hasFiles) {
      // select the Merge option for Folders
      document.getElementById("existing-folders-merge").checked = true;
      $("#existing-folders-merge").hide();
      $("#Question-generate-dataset-existing-folders-options").hide();
      // select the Skip option for Files
      document.getElementById("existing-files-replace").checked = true;

      // enable the continue button
      $("#nextBtn").prop("disabled", false);

      $("#para-continue-empty-ds-selected").text("Please continue below.");
      $("#para-continue-empty-ds-selected").show();

      // hide the confirm button
      $("#button-confirm-bf-dataset").hide();

      return;
    }

    $("#Question-generate-dataset-existing-folders-options").show();
    document.getElementById("existing-folders-merge").checked = false;
    document.getElementById("existing-files-replace").checked = false;

    // alert the user that manifest files will not be uploaded
    await swalShowInfo(
      "Manifest files will not be uploaded to Pennsieve",
      'The selected Pennsieve dataset already includes data files. To prevent conflicts, SODA will not generate manifest files. You can generate manifest files after the upload is complete by navigating to the home page, selecting "Advanced features", and then selecting the "Create manifest files" option.'
    );
    // continue as usual otherwise
  }

  // here, handling existing folders and files tabs are independent of each other
  if (
    !(
      ev.getAttribute("data-next") === "Question-generate-dataset-existing-files-options" &&
      target.classList.contains("prev")
    )
  ) {
    // append to parentDiv
    document.getElementById(parentDiv).appendChild(target);
  }

  // if buttons: Add account and Confirm account were hidden, show them again here
  if (ev.getAttribute("data-next") === "Question-generate-dataset-BF-account") {
    $("#" + ev.getAttribute("data-next") + " button").show();
  }

  if (ev.getAttribute("data-next") === "Question-generate-dataset-BF-workspace") {
    document.getElementById("btn-bf-workspace").style.display = "block";
  }

  if (ev.getAttribute("data-next") === "Question-generate-dataset-generate-div-old") {
    $("#nextBtn").prop("disabled", false);
  } else {
    // create moving effects when new questions appear
    let step6 = document.getElementById("generate-dataset-tab");
    if (step6.classList.contains("tab-active")) {
      $("#nextBtn").prop("disabled", true);
    }
    // $("#nextBtn").prop("disabled", false);
    setTimeout(() => target.classList.add("test2"), 100);
  }

  document.getElementById(currentDiv).classList.add("prev");

  // handle buttons (if buttons are confirm buttons -> delete after users confirm)
  if (button === "delete") {
    if ($(ev).siblings().length > 0) {
      $(ev).siblings().hide();
    }
    $(ev).hide();
  }

  if (ev.getAttribute("id") === "btn-confirm-new-dataset-name") {
    $("#para-continue-name-dataset-generate").show();
    $("#para-continue-name-dataset-generate").text("Please continue below.");
  } else {
    $("#para-continue-name-dataset-generate").text("");
  }

  // auto-scroll to bottom of div
  document.getElementById(parentDiv).scrollTop = document.getElementById(parentDiv).scrollHeight;

  if (
    ev.getAttribute("data-next") === "Question-getting-started-final" &&
    $("#existing-bf").is(":checked")
  ) {
    $("#nextBtn").prop("disabled", true);
    if (window.sodaJSONObj["dataset-structure"] != {}) {
      $("#nextBtn").prop("disabled", false);
    }
  }

  if (
    ev.getAttribute("data-next") === "input-destination-getting-started-locally" &&
    $("#existing-local").is(":checked") &&
    currentDiv == "Question-getting-started-1"
  ) {
    window.sodaJSONObj = {
      "bf-account-selected": {},
      "bf-dataset-selected": {},
      "dataset-structure": {},
      "metadata-files": {},
      "manifest-files": {},
      "generate-dataset": {},
      "starting-point": {
        type: "local",
        "local-path": "",
      },
    };

    // this should run after a folder is selected
    reset_ui();
    $("#nextBtn").prop("disabled", true);
  }
};

window.transitionFreeFormMode = async (ev, currentDiv, parentDiv, button, category) => {
  let continueProgressRC = true;
  let continueProgressDD = true;

  let continueProgressSubSam = true;
  let continueProgressSubmission = true;
  let continueProgressGenerateDD = true;

  let continueProgressGenerateManifest = true;

  let continueProgressValidateDataset = true;

  const dataCurrent = $(ev).attr("data-current");

  switch (dataCurrent) {
    case "Question-prepare-changes-1":
      continueProgressRC = await switchMetadataRCQuestion("changes");
      break;
    case "Question-prepare-readme-1":
      continueProgressRC = await switchMetadataRCQuestion("readme");
      break;
    case "Question-prepare-readme-4":
      continueProgressRC = await switchMetadataRCQuestion("readme");
      break;
    case "Question-prepare-changes-4":
      continueProgressRC = await switchMetadataRCQuestion("changes");
      break;
    case "Question-prepare-subjects-1":
      continueProgressSubSam = await switchMetadataSubSamQuestions("subjects");
      break;
    case "Question-prepare-samples-1":
      continueProgressSubSam = await switchMetadataSubSamQuestions("samples");
      break;
    case "Question-prepare-subjects-2":
      continueProgressSubSam = await switchMetadataSubSamQuestions("subjects");
      break;
    case "Question-prepare-samples-2":
      continueProgressSubSam = await switchMetadataSubSamQuestions("samples");
      break;
    case "Question-prepare-dd-4":
      continueProgressDD = await switchMetadataDDQuestion();
      break;
    case "Question-prepare-dd-1":
      continueProgressDD = await switchMetadataDDQuestion();
      break;
    case "Question-prepare-submission-1":
      continueProgressSubmission = await switchMetadataSubmissionQuestion();
      break;
    case "Question-prepare-submission-3":
      continueProgressSubmission = await switchMetadataSubmissionQuestion();
      break;
    case "Generate-submission":
      const checkedRadioButton = $("input:radio[name ='submission-1']:checked").attr("id");
      if (checkedRadioButton === "submission-1-B") {
        $("#submission-organization-field").show();
      } else {
        $("#submission-organization-field").hide();
      }

      // check if the user has selected start from existing pennsieve
      // if so then hide the workspace selection field
      const submissionFieldsAreValid = window.validateSubmissionFileInputs();
      if (!submissionFieldsAreValid) {
        return;
      }
      $("#submission-accordion").removeClass("active");
      $("#submission-title-accordion").removeClass("active");
      break;
    case "Generate-dd":
      const checkedRadioButtonDDFirstQuestion = $("input:radio[name ='dd-1']:checked").attr("id");

      // check if we selected start a new subjects file
      if (checkedRadioButtonDDFirstQuestion === "dd-1-B") {
        // allow users to select an organization
        $("#dd-organization-field").show();
      } else {
        // starting from an existing subjects file
        const checkedRadioButtonDDSecondQuestion = $("input:radio[name ='dd-4']:checked").attr(
          "id"
        );
        // check if file is from Pennsieve
        if (checkedRadioButtonDDSecondQuestion === "dd-4-A") {
          // do not allow organization switching
          $("#dd-organization-field").hide();
        } else {
          // show organization field to allow switching
          $("#dd-organization-field").show();
        }
      }
      continueProgressGenerateDD = await window.generateDatasetDescription();
      break;
    case "Generate-changes":
      const checkedRadioButtonChangesFirstQuestion = $(
        "input:radio[name ='changes-1']:checked"
      ).attr("id");

      // check if we selected start a new subjects file
      if (checkedRadioButtonChangesFirstQuestion === "changes-1-B") {
        // allow users to select an organization
        $("#changes-organization-field").show();
      } else {
        // starting from an existing subjects file
        const checkedRadioButtonChangesSecondQuestion = $(
          "input:radio[name ='changes-3']:checked"
        ).attr("id");
        // check if file is from Pennsieve
        if (checkedRadioButtonChangesSecondQuestion === "changes-3-A") {
          // do not allow organization switching
          $("#changes-organization-field").hide();
        } else {
          // show organization field to allow switching
          $("#changes-organization-field").show();
        }
      }
      let changesFilesHelper = window.generateRCFilesHelper("changes");
      if (changesFilesHelper === "empty") {
        return;
      }
      break;
    case "Generate-readme":
      const checkedRadioButtonReadmeFirstQuestion = $("input:radio[name ='readme-1']:checked").attr(
        "id"
      );

      // check if we selected start a new subjects file
      if (checkedRadioButtonReadmeFirstQuestion === "readme-1-B") {
        // allow users to select an organization
        $("#readme-organization-field").show();
      } else {
        // starting from an existing subjects file
        const checkedRadioButtonReadmeSecondQuestion = $(
          "input:radio[name ='readme-3']:checked"
        ).attr("id");
        // check if file is from Pennsieve
        if (checkedRadioButtonReadmeSecondQuestion === "readme-3-A") {
          // do not allow organization switching
          $("#readme-organization-field").hide();
        } else {
          // show organization field to allow switching
          $("#readme-organization-field").show();
        }
      }
      let readMeFilesHelper = window.generateRCFilesHelper("readme");
      if (readMeFilesHelper === "empty") {
        return;
      }
      break;
    case "Question-prepare-manifest-1":
      continueProgressGenerateManifest = await switchMetadataManifestQuestion();
      break;
    case "validate_dataset-question-1":
      continueProgressValidateDataset = await window.transitionToValidateQuestionTwo();
      break;
    case "validate_dataset-question-2":
      continueProgressValidateDataset = await window.transitionToValidateQuestionThree();
      break;
    case "Question-prepare-subjects-3":
      const checkedRadioButtonSubjectsFirstQuestion = $(
        "input:radio[name ='subjects-1']:checked"
      ).attr("id");

      // check if we selected start a new subjects file
      if (checkedRadioButtonSubjectsFirstQuestion === "subjects-1-B") {
        // allow users to select an organization
        $("#subjects-organization-field").show();
      } else {
        // starting from an existing subjects file
        const checkedRadioButtonSubjectsSecondQuestion = $(
          "input:radio[name ='subjects-3']:checked"
        ).attr("id");
        // check if file is from Pennsieve
        if (checkedRadioButtonSubjectsSecondQuestion === "subjects-3-A") {
          // do not allow organization switching
          $("#subjects-organization-field").hide();
        } else {
          // show organization field to allow switching
          $("#subjects-organization-field").show();
        }
      }
      break;
    case "Question-prepare-samples-3":
      const checkedRadioButtonSamplesFirstQuestion = $(
        "input:radio[name ='samples-1']:checked"
      ).attr("id");

      // check if we selected start a new subjects file
      if (checkedRadioButtonSamplesFirstQuestion === "samples-1-B") {
        // allow users to select an organization
        $("#samples-organization-field").show();
      } else {
        // starting from an existing subjects file
        const checkedRadioButtonSamplesSecondQuestion = $(
          "input:radio[name ='samples-3']:checked"
        ).attr("id");
        // check if file is from Pennsieve
        if (checkedRadioButtonSamplesSecondQuestion === "samples-3-A") {
          // do not allow organization switching
          $("#samples-organization-field").hide();
        } else {
          // show organization field to allow switching
          $("#samples-organization-field").show();
        }
      }
      break;
  }

  if (!continueProgressRC) {
    return;
  }

  if (!continueProgressSubSam) {
    return;
  }

  if (!continueProgressDD) {
    return;
  }

  if (!continueProgressSubmission) {
    return;
  }

  if (!continueProgressGenerateDD) {
    return;
  }

  if (!continueProgressGenerateManifest) {
    return;
  }

  if (!continueProgressValidateDataset) {
    return;
  }

  // add "non-selected" to current option-card so users cannot keep selecting it
  $(ev).removeClass("non-selected");
  $(ev).children().find(".folder-input-check").prop("checked", true);
  $(ev).addClass("checked");

  // uncheck the other radio buttons
  $($(ev).parents()[0]).siblings().find(".option-card.radio-button").removeClass("checked");
  $($(ev).parents()[0]).siblings().find(".option-card.radio-button").addClass("non-selected");

  // empty para elements (TODO: will convert these para elements to a swal2 alert so we don't have to clear them out)
  if (ev.getAttribute("data-next") === "div_make_pi_owner_permissions") {
    let previous_choice = window.electron.ipcRenderer.invoke(
      "get-nodestorage-item",
      "previously_selected_PI"
    );
    if ($(`#bf_list_users_pi option[value='${previous_choice}']`).length > 0) {
      $("#bf_list_users_pi").val(previous_choice);
      $("#bf_list_users_pi").selectpicker("refresh");
    }
  }

  if (ev.getAttribute("data-next") === "div-rename-bf-dataset") {
    let dataset_name = $(
      "#rename_dataset_BF_account_tab .change-current-account.ds-dd.dataset-name h5"
    ).text();
    $("#bf-rename-dataset-name").val(dataset_name);
  }

  // first, handle target or the next div to show
  var target = document.getElementById(ev.getAttribute("data-next"));
  if (ev.getAttribute("data-next") === "Question-prepare-dd-2") {
    let newDatasetButtonSelected = document.getElementById("newDatasetDescription-selection");
    if (newDatasetButtonSelected.classList.contains("checked")) {
      document.getElementById("dd-select-pennsieve-dataset").style.display = "block";
    } else {
      document.getElementById("dd-select-pennsieve-dataset").style.display = "none";
    }
  }
  // hide related previous divs
  hidePrevDivs(currentDiv, category);
  // display the target tab (data-next tab)
  if (!$(target).hasClass("show")) {
    setTimeout(function () {
      $(target).addClass("show");

      // scroll to the 'Review/Edit manifest files' About section rather than the
      // bottom of the div so all instructional text is viewable to the user.
      if (ev.getAttribute("data-next") === "Question-prepare-manifest-5") {
        let label = document.querySelector("#Question-prepare-manifest-5 label:first-of-type");
        label.scrollIntoView({ behavior: "smooth" });
      } // auto-scroll to bottom of div
      else if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
        document.getElementById(parentDiv).scrollTop =
          document.getElementById(parentDiv).scrollHeight;
      }
    }, delay);
  }

  document.getElementById(currentDiv).classList.add("prev");

  // handle buttons (if buttons are confirm buttons -> delete after users confirm)
  if (button === "delete") {
    if ($(ev).siblings().length > 0) {
      setTimeout(function () {
        $(ev).siblings().hide();
        // auto-scroll to bottom of div
        if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
          document.getElementById(parentDiv).scrollTop =
            document.getElementById(parentDiv).scrollHeight;
        }
      }, delay);
    }
    setTimeout(function () {
      $(ev).hide();
      // auto-scroll to bottom of div
      if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
        document.getElementById(parentDiv).scrollTop =
          document.getElementById(parentDiv).scrollHeight;
      }
    }, delay);
  } else {
    if (
      $(".bf-dataset-span")
        .html()
        .replace(/^\s+|\s+$/g, "") !== "None"
    ) {
      $(target).children().find(".div-confirm-button button").show();
    }
  }

  if (ev.getAttribute("data-next") === "Question-prepare-submission-DDD") {
    $("#button-skip-DDD").show();
  }

  if (ev.getAttribute("data-next") === "Post-curation-question-2") {
    //checkDatasetDisseminate()
    setTimeout(function () {
      $(target).addClass("test2");
    }, 300);
  }

  if (ev.getAttribute("data-next") === "Question-prepare-dd-4-sections") {
    setTimeout(function () {
      $(target).addClass("test2");
    }, 300);
  }

  if (ev.id === "button-skip-DDD") {
    $($(ev).parents()[0]).css("display", "flex");
    $($(ev).siblings()[0]).show();
  }

  // auto-scroll to bottom of div
  if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
    document.getElementById(parentDiv).scrollTop = document.getElementById(parentDiv).scrollHeight;
  }

  if (ev.getAttribute("data-next") === "Question-prepare-subjects-2") {
    $("#Question-prepare-subjects-2 button").show();
  }

  if (ev.getAttribute("data-next") === "Question-prepare-samples-2") {
    $("#Question-prepare-samples-2 button").show();
  }
};

// handles it when users switch options between Locally and on Pennsieve (Question 2 for each metadata file)
// 1. Readme and Changes (MetadataRC)
const switchMetadataRCImportBFQuestions = async (metadataRCFileType) => {
  if ($(`#textarea-create-${metadataRCFileType}`).val().trim() !== "") {
    var { value: continueProgress } = await Swal.fire({
      title: `This will reset your progress so far with the ${metadataRCFileType.toUpperCase()}.txt file. Are you sure you want to continue?`,
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
    });
    if (!continueProgress) {
      return;
    } else {
      $(`#existing-${metadataRCFileType}-file-destination`).attr("placeholder", "Browse here");
      $(`#textarea-create-${metadataRCFileType}`).val("");
    }
  }
};

// handles it when users switch options in the first question (Metadata files)
// 1. Readme and Changes (MetadataRC)
async function switchMetadataRCQuestion(metadataRCFileType) {
  if ($(`#textarea-create-${metadataRCFileType}`).val().trim() !== "") {
    var { value: continueProgress } = await Swal.fire({
      title: `This will reset your progress so far with the ${metadataRCFileType.toUpperCase()}.txt file. Are you sure you want to continue?`,
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
    });
    if (continueProgress) {
      $(`#existing-${metadataRCFileType}-file-destination`).attr("placeholder", "Browse here");
      $(`#textarea-create-${metadataRCFileType}`).val("");
      if ($(`#bf_dataset_load_${metadataRCFileType}`).text().trim() !== "None") {
        $($(`#div-check-bf-import-${metadataRCFileType}`).children()[0]).show();
        $(`#div-check-bf-import-${metadataRCFileType}`).css("display", "flex");
      } else {
        $(`#div-check-bf-import-${metadataRCFileType}`).hide();
      }
      $(`#button-generate-${metadataRCFileType}`).css("display", "flex");
    }
    return continueProgress;
  } else {
    return true;
  }
}
// 2. Subjects and Samples (MetadataSubSam)
async function switchMetadataSubSamQuestions(metadataSubSamFile) {
  var tableData = window.subjectsTableData;
  var singularName = "subject";
  if (metadataSubSamFile === "samples") {
    tableData = window.samplesTableData;
    singularName = "sample";
  }

  if (tableData.length !== 0) {
    var { value: continueProgress } = await Swal.fire({
      title: `This will reset your progress so far with the ${metadataSubSamFile}.xlsx file. Are you sure you want to continue?`,
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
    });
    if (continueProgress) {
      $(`#existing-${metadataSubSamFile}-file-destination`).val("");
      tableData = [];
      if (metadataSubSamFile === "samples") {
        window.samplesTableData = tableData;
      } else {
        window.subjectsTableData = tableData;
      }
      // delete table rows except headers
      $(`#table-${metadataSubSamFile} tr:gt(0)`).remove();
      $(`#table-${metadataSubSamFile}`).css("display", "none");
      // show Add a subject button
      $(`#button-add-a-${singularName}`).show();
      // Hide Generate button
      $(`#button-generate-${metadataSubSamFile}`).css("display", "none");
      $(`#div-import-primary-folder-${metadataSubSamFile}`).show();
      $(`#existing-${metadataSubSamFile}-file-destination`).attr("placeholder", "Browse here");
      // delete custom fields (if any)
      var fieldLength = $(`.${metadataSubSamFile}-form-entry`).length;
      if (fieldLength > 21) {
        for (var field of $(`.${metadataSubSamFile}-form-entry`).slice(21, fieldLength)) {
          $($(field).parents()[2]).remove();
        }
      }
      if ($(`#bf_dataset_load_${metadataSubSamFile}`).text().trim() !== "None") {
        $($(`#div-check-bf-import-${metadataSubSamFile}`).children()[0]).show();
        $(`#div-check-bf-import-${metadataSubSamFile}`).css("display", "flex");
      } else {
        $(`#div-check-bf-import-${metadataSubSamFile}`).hide();
      }
    }
    return continueProgress;
  } else {
    $(`#existing-${metadataSubSamFile}-file-destination`).val("");
    return true;
  }
}

//// 3. dataset_description
async function switchMetadataDDQuestion() {
  if ($("#Question-prepare-dd-2").hasClass("show")) {
    var { value: continueProgressDD } = await Swal.fire({
      title:
        "This will reset your progress so far with the dataset_description.xlsx file. Are you sure you want to continue?",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
    });
    if (continueProgressDD) {
      $("#existing-dd-file-destination").val("");
      $("#div-check-bf-import-dd").css("display", "flex");
      $($("#div-check-bf-import-dd").children()[0]).show();
      window.resetDDFields();
    }
    return continueProgressDD;
  } else {
    return true;
  }
}

//// 4. submission
async function switchMetadataSubmissionQuestion() {
  if ($("#Question-prepare-submission-2").hasClass("show")) {
    var { value: continueProgressSubmission } = await Swal.fire({
      title:
        "This will reset your progress so far with the submission.xlsx file. Are you sure you want to continue?",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
    });
    if (continueProgressSubmission) {
      $("#existing-submission-file-destination").val("");
      $("#existing-submission-file-destination").attr("placeholder", "Browse here");
      $($("#div-check-bf-import-submission").children()[0]).show();
      $("#div-check-bf-import-submission").css("display", "flex");
      window.resetSubmissionFields();
    }
    return continueProgressSubmission;
  } else {
    return true;
  }
}

// 5. manifest
async function switchMetadataManifestQuestion() {
  var userpath1 = window.path.join(window.homeDirectory, "SODA", "SODA Manifest Files");
  var userpath2 = window.path.join(window.homeDirectory, "SODA", "manifest_files");
  if (
    $("#Question-prepare-manifest-2").hasClass("show") ||
    $("#Question-prepare-manifest-3").hasClass("show")
  ) {
    var { value: continueProgressManifest } = await Swal.fire({
      title:
        "This will reset your progress so far with the manifest.xlsx file. Are you sure you want to continue?",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
    });
    if (continueProgressManifest) {
      // deleting manifest file folders in user/SODA path that were generated half-way before users switch.
      try {
        await client.delete(`prepare_metadata/manifest_dummy_folders`, {
          // Axios delete API specifies config as the second parameter; which is why we use the data keyword here.
          data: {
            paths: [userpath1, userpath2],
          },
          timeout: 0,
        });

        window.sodaJSONObj = {
          "starting-point": { type: "" },
          "dataset-structure": {},
          "metadata-files": {},
        };
        window.datasetStructureJSONObj = {
          folders: {},
          files: {},
          type: "",
        };
        $("#bf_dataset_create_manifest").text("None");
        window.defaultBfDataset = "Select dataset";
        $("#input-manifest-local-folder-dataset").val("");
        $("#input-manifest-local-folder-dataset").attr("placeholder", "Browse here");
        $("#div-confirm-manifest-local-folder-dataset").css("display", "none");
      } catch (error) {
        clientError(error);
        return true;
      }

      return continueProgressManifest;
    }
  } else {
    return true;
  }
}

const reset_ui = () => {
  $(".option-card.high-level-folders").each(function (i, obj) {
    $(obj).removeClass("checked");
    $(obj).removeClass("disabled");
  });
  $(".metadata-button.button-generate-dataset").each(function (i, obj) {
    $(obj).removeClass("done");
  });
  $(".button-individual-metadata.remove").each(function (i, obj) {
    $(obj).click();
  });
  $(".div-file-import.pennsieve").css("display", "none");

  $("#Question-getting-started-existing-BF-account").hide();
  $("#Question-getting-started-existing-BF-account").children().hide();
  $("#Question-getting-started-existing-BF-dataset").hide();
  $("#Question-getting-started-existing-BF-dataset").children().hide();
  $("#nextBtn").prop("disabled", true);

  // clear the validation table results
  let validationErrorsTable = document.querySelector("#organize--table-validation-errors tbody");
  window.clearValidationResults(validationErrorsTable);
  // hide the table
  document.querySelector("#organize--table-validation-errors").style.visibility = "hidden";
};

window.populate_existing_folders = (dataset_folders) => {
  // currently handled by old function
  if ("files" in dataset_folders) {
    for (let file in dataset_folders["files"]) {
      if ("action" in dataset_folders["files"][file]) {
        continue;
      } else {
        dataset_folders["files"][file]["action"] = ["existing"];
      }
    }
  }
  if ("folders" in dataset_folders) {
    for (let folder in dataset_folders["folders"]) {
      if ("action" in dataset_folders["folders"][folder]) {
      } else {
        dataset_folders["folders"][folder]["action"] = ["existing"];
      }
      window.populate_existing_folders(dataset_folders["folders"][folder]);
    }
  }
  return;
};

// This function populates the UI with the existing metadata files
window.populate_existing_metadata = (datasetStructureJSONObj) => {
  let metadataobject = datasetStructureJSONObj?.["metadata-files"];
  if (metadataobject == null || metadataobject == undefined) {
    return;
  }
  for (var key of Object.keys(metadataobject)) {
    let file_name = window.path.parse(key).name;
    switch (file_name) {
      case "submission":
        $(".metadata-button[data-next='submissionUpload']").addClass("done");
        $($("#para-submission-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-submission-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-submission-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-submission-pennsieve").css("display", "inline-block");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-submission-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "dataset_description":
        $(".metadata-button[data-next='datasetDescriptionUpload']").addClass("done");
        $($("#para-ds-description-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-ds-description-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-ds-description-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-ds-description-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-ds-description-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "subjects":
        $(".metadata-button[data-next='subjectsUpload']").addClass("done");

        $($("#para-subjects-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-subjects-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-subjects-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-subjects-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-subjects-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "samples":
        $(".metadata-button[data-next='samplesUpload']").addClass("done");
        $($("#para-samples-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-samples-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-samples-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-samples-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-samples-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "README":
        $(".metadata-button[data-next='readmeUpload']").addClass("done");
        $($("#para-readme-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-readme-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-readme-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-README-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-readme-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "CHANGES":
        $(".metadata-button[data-next='changesUpload']").addClass("done");
        $($("#para-changes-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-changes-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-changes-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-CHANGES-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-changes-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "code_description":
        $(".metadata-button[data-next='codeDescriptionUpload']").addClass("done");
        $($("#para-codeDescription-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-codeDescription-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-codeDescription-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-codeDescription-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-codeDescription-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "inputs_metadata":
        $(".metadata-button[data-next='inputsMetadataUpload']").addClass("done");
        $($("#para-codeParamMetadata-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-codeParamMetadata-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-codeParamMetadata-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-inputsMetadata-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-codeParamMetadata-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "outputs_metadata":
        $(".metadata-button[data-next='outputsMetadataUpload']").addClass("done");
        $($("#para-outputsMetadata-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-outputsMetadata-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-outputsMetadata-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-outputsMetadata-pennsieve").addClass("d-flex");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-outputsMetadata-file-path").text(metadataobject[key]["path"]);
        }
        break;
      default:
        break;
    }
  }
};

// TODO: Dorian see if this function is ever used,
// (not being called anywhere that I can see)
function obtainDivsbyCategory(category) {
  let individualQuestions = document.getElementsByClassName("individual-question");
  let categoryQuestionList = [];
  for (let i = 0; i < individualQuestions.length; i++) {
    let question = individualQuestions[i];

    if (
      question.getAttribute("data-id") !== null &&
      question.getAttribute("data-id").includes(category)
    ) {
      categoryQuestionList.push(question.id);
    }
  }
  return categoryQuestionList;
}

// Hide showing divs when users click on different option
const hidePrevDivs = (currentDiv, category) => {
  var individualQuestions = document.getElementsByClassName(category);
  // hide all other div siblings
  for (var i = 0; i < individualQuestions.length; i++) {
    if (currentDiv === individualQuestions[i].id) {
      if (!(currentDiv === "Question-generate-dataset-existing-folders-options")) {
        $(`#${currentDiv}`).nextAll().removeClass("show");
        $(`#${currentDiv}`).nextAll().removeClass("prev");
        $(`#${currentDiv}`).nextAll().removeClass("test2");

        // /// remove all checkmarks and previous data input
        $(`#${currentDiv}`).nextAll().find(".option-card.radio-button").removeClass("checked");
        $(`#${currentDiv}`).nextAll().find(".option-card.radio-button").removeClass("non-selected");
        $(`#${currentDiv}`).nextAll().find(".folder-input-check").prop("checked", false);
        $(`#${currentDiv}`).nextAll().find("#curatebfdatasetlist").prop("selectedIndex", 0);

        var childElements2 = $(`#${currentDiv}`).nextAll().find(".form-control");

        for (var child of childElements2) {
          if (child.id === "inputNewNameDataset" || child.id === "bf-rename-dataset-name") {
            if (child.id === "bf-rename-dataset-name") {
              if (
                $(".bf-dataset-span")
                  .html()
                  .replace(/^\s+|\s+$/g, "") == "None" ||
                $(".bf-dataset-span")
                  .html()
                  .replace(/^\s+|\s+$/g, "") == ""
              ) {
                $("#bf-rename-dataset-name").val(
                  `${$(".bf-dataset-span")
                    .html()
                    .replace(/^\s+|\s+$/g, "")}`
                );
              }
            } else {
              $(`${child.id}`).val("");
              $(`${child.id}`).attr("placeholder", "Type here");
            }
          } else {
            if (document.getElementById(child.id)) {
              $(`${child.id}`).val("");
              $(`${child.id}`).attr("placeholder", "Browse here");
            }
          }
        }
      }
      break;
    }
  }
};

const updateJSONStructureGettingStarted = () => {
  document.getElementById("input-global-path").value = "dataset_root/";
};

// function to populate metadata files
const populateMetadataObject = (optionList, metadataFilePath, metadataFile, object) => {
  if (!("metadata-files" in object)) {
    object["metadata-files"] = {};
  }
  for (let item in object["metadata-files"]) {
    if (item.search(metadataFile) != -1 && object["metadata-files"][item]["type"] == "bf") {
      if (
        metadataFilePath == "" ||
        metadataFilePath.indexOf("Using file present on Pennsieve") == -1
      ) {
        if (!object["metadata-files"][item]["action"].includes("deleted")) {
          object["metadata-files"][item]["action"].push("deleted");
          let new_item = item + "-DELETED";
          object["metadata-files"][new_item] = object["metadata-files"][item];
          delete object["metadata-files"][item];
          break;
        }
      }
    }
  }
  if (metadataFilePath.indexOf("Using file present on Pennsieve") != -1) {
    return;
  }
  if (!optionList.includes(metadataFilePath)) {
    var mypath = window.path.basename(metadataFilePath);
    object["metadata-files"][mypath] = {
      type: "local",
      action: ["new"],
      path: metadataFilePath,
      destination: "generate-dataset",
    };
  } else {
    for (var key in object["metadata-files"]) {
      if (key.includes(metadataFile)) {
        if (!key.includes("-DELETED")) {
          delete object["metadata-files"][key];
        }
      }
    }
  }
};

/// function to populate/reload Organize dataset UI when users move around between tabs and make changes
// (to high-level folders)
const populateOrganizeDatasetUI = (currentLocation, datasetFolder) => {
  var baseName = window.path.basename(datasetFolder);
  currentLocation = {
    type: "local",
    folders: {},
    files: {},
    action: ["existing"],
  };

  var myitems = fs.readdirSync(datasetFolder);
  myitems.forEach((element) => {
    var statsObj = fs.statSync(window.path.join(datasetFolder, element));
    var addedElement = window.path.join(datasetFolder, element);
    if (statsObj.isDirectory()) {
      currentLocation["folders"][element] = {
        type: "local",
        folders: {},
        files: {},
        action: ["existing"],
      };
      window.populateJSONObjFolder(jsonObject["folders"][element], addedElement);
    } else if (statsObj.isFile()) {
      currentLocation["files"][element] = {
        path: addedElement,
        description: "",
        "additional-metadata": "",
        type: "local",
        action: ["existing"],
      };
    }
    var appendString =
      '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
      element +
      "</div></div>";
    $("#items").html(appendString);

    //dont know here
    listItems(currentLocation, "#items");
    getInFolder(".single-item", "#items", organizeDSglobalPath, window.datasetStructureJSONObj);
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  });
};

////////////////////// Functions to update JSON object after each step //////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Step 3: Dataset structure

window.updateJSONStructureDSstructure = () => {
  window.sodaJSONObj["dataset-structure"] = window.datasetStructureJSONObj;
  // check if dataset-structure key is empty (no high-level folders are included)
  if (
    JSON.stringify(window.sodaJSONObj["dataset-structure"]) === "{}" ||
    JSON.stringify(window.sodaJSONObj["dataset-structure"]["folders"]) === "{}"
  ) {
    delete window.sodaJSONObj["dataset-structure"];
  }
};

// Step 4: Metadata files
/// function to obtain metadata file paths from UI and then populate JSON obj
const updateJSONStructureMetadataFiles = () => {
  var submissionFilePath = document.getElementById("para-submission-file-path").innerHTML;
  var dsDescriptionFilePath = document.getElementById("para-ds-description-file-path").innerHTML;
  var subjectsFilePath = document.getElementById("para-subjects-file-path").innerHTML;
  var samplesFilePath = document.getElementById("para-samples-file-path").innerHTML;
  var readmeFilePath = document.getElementById("para-readme-file-path").innerHTML;
  var changesFilePath = document.getElementById("para-changes-file-path").innerHTML;

  var invalidOptionsList = [
    "Please drag a file!",
    "Please only import SPARC metadata files!",
    "",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];

  if ($(".metadata-button.button-generate-dataset.code-metadata").css("display") === "block") {
    var codeDescriptionFilePath = document.getElementById(
      "para-codeDescription-file-path"
    ).innerHTML;
    var codeParamMetadataFilePath = document.getElementById(
      "para-codeParamMetadata-file-path"
    ).innerHTML;
    var outputsMetadataFilePath = document.getElementById(
      "para-outputsMetadata-file-path"
    ).innerHTML;
    populateMetadataObject(
      invalidOptionsList,
      codeDescriptionFilePath,
      "code_description",
      window.sodaJSONObj
    );
    populateMetadataObject(
      invalidOptionsList,
      codeParamMetadataFilePath,
      "code_parameters",
      window.sodaJSONObj
    );
    populateMetadataObject(
      invalidOptionsList,
      outputsMetadataFilePath,
      "outputs_metadata",
      window.sodaJSONObj
    );
  }

  populateMetadataObject(invalidOptionsList, submissionFilePath, "submission", window.sodaJSONObj);
  populateMetadataObject(
    invalidOptionsList,
    dsDescriptionFilePath,
    "dataset_description",
    window.sodaJSONObj
  );
  populateMetadataObject(invalidOptionsList, subjectsFilePath, "subjects", window.sodaJSONObj);
  populateMetadataObject(invalidOptionsList, samplesFilePath, "samples", window.sodaJSONObj);
  populateMetadataObject(invalidOptionsList, readmeFilePath, "README", window.sodaJSONObj);
  populateMetadataObject(invalidOptionsList, changesFilePath, "CHANGES", window.sodaJSONObj);

  if (JSON.stringify(window.sodaJSONObj["metadata-files"]) === "{}") {
    delete window.sodaJSONObj["metadata-files"];
  }
};

// Step 5: Manifest file
// update JSON object with manifest file information
const updateJSONStructureManifest = () => {
  if (window.manifestFileCheck.checked) {
    if ("manifest-files" in window.sodaJSONObj) {
      // cj this might need to be changed
      window.sodaJSONObj["manifest-files"]["destination"] = "generate-dataset";
    } else {
      window.sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    }
  } else {
    delete window.sodaJSONObj["manifest-files"];
  }
};

const recursive_remove_local_deleted_files = (dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let file in dataset_folder["files"]) {
      if ("forTreeview" in dataset_folder["files"][file]) {
        continue;
      }
      if (dataset_folder["files"][file]["action"].includes("recursive_deleted")) {
        let index = dataset_folder["files"][file]["action"].indexOf("recursive_deleted");
        dataset_folder["files"][file]["action"].splice(index, 1);
      }
      if (dataset_folder["files"][file]["action"].includes("deleted")) {
        delete dataset_folder["files"][file];
      }
    }
  }
  if ("folders" in dataset_folder && Object.keys(dataset_folder["folders"]).length !== 0) {
    for (let folder in dataset_folder["folders"]) {
      recursive_remove_local_deleted_files(dataset_folder["folders"][folder]);
      if ("action" in dataset_folder["folders"][folder]) {
        if (dataset_folder["folders"][folder]["action"].includes("recursive_deleted")) {
          let index = dataset_folder["folders"][folder]["action"].indexOf("recursive_deleted");
          dataset_folder["folders"][folder]["action"].splice(index, 1);
        }
        if (dataset_folder["folders"][folder]["action"].includes("deleted")) {
          delete dataset_folder["folders"][folder];
        }
      }
    }
  }
};

// Step 6: Generate dataset
// update JSON object after users finish Generate dataset step
window.updateJSONStructureGenerate = (progress = false, sodaJSONObject) => {
  let starting_point = sodaJSONObject["starting-point"]["type"];
  if (sodaJSONObject["starting-point"]["type"] == "bf") {
    sodaJSONObject["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing-bf",
    };
  }

  if (sodaJSONObject["starting-point"]["type"] == "local") {
    var localDestination = window.path.dirname(sodaJSONObject["starting-point"]["local-path"]);
    var newDatasetName = window.path.basename(sodaJSONObject["starting-point"]["local-path"]);
    // if (progress == false) {
    //   delete window.sodaJSONObj["starting-point"]["local-path"];
    // }
    sodaJSONObject["generate-dataset"] = {
      destination: "local",
      path: localDestination,
      "dataset-name": newDatasetName,
      "if-existing": "merge",
      "generate-option": "new",
    };
    // delete bf account and dataset keys
    if ("bf-account-selected" in sodaJSONObject) {
      delete sodaJSONObject["bf-account-selected"];
    }
    if ("bf-dataset-selected" in sodaJSONObject) {
      delete sodaJSONObject["bf-dataset-selected"];
    }
    sodaJSONObject["starting-point"]["type"] = "new";
    // TODO: Do not delete local files if user is in validation step and not in initiate_generate step (validator-phase-4-simple)
    recursive_remove_local_deleted_files(sodaJSONObject["dataset-structure"]);
  }

  if (sodaJSONObject["starting-point"]["type"] == "new") {
    if ($('input[name="generate-1"]:checked').length > 0) {
      if ($('input[name="generate-1"]:checked')[0].id === "generate-local-desktop") {
        var localDestination = $("#input-destination-generate-dataset-locally")[0].placeholder;
        if (localDestination === "Browse here") {
          localDestination = "";
        }
        var newDatasetName = $("#inputNewNameDataset").val().trim();
        sodaJSONObject["generate-dataset"] = {
          destination: "local",
          path: localDestination,
          "dataset-name": newDatasetName,
          "generate-option": "new",
          "if-existing": "new",
        };
        // delete bf account and dataset keys
        if ("bf-account-selected" in sodaJSONObject) {
          delete sodaJSONObject["bf-account-selected"];
        }
        if ("bf-dataset-selected" in sodaJSONObject) {
          delete sodaJSONObject["bf-dataset-selected"];
        }
      } else if ($('input[name="generate-1"]:checked')[0].id === "generate-upload-BF") {
        sodaJSONObject["generate-dataset"] = {
          destination: "bf",
        };

        if ($("#current-bf-account-generate").text() !== "None") {
          if ("bf-account-selected" in sodaJSONObject) {
            sodaJSONObject["bf-account-selected"]["account-name"] = window.defaultBfAccount;
          } else {
            sodaJSONObject["bf-account-selected"] = {
              "account-name": window.defaultBfAccount,
            };
          }
        }
        // answer to Question if generate on BF, then: how to handle existing files and folders
        if ($('input[name="generate-4"]:checked').length > 0) {
          if (
            $('input[name="generate-4"]:checked')[0].id === "generate-BF-dataset-options-existing"
          ) {
            // The user selected to generate to an existing dataset on Pennsieve
            // Set the generate option to existing-bf
            sodaJSONObject["generate-dataset"]["generate-option"] = "existing-bf";
            if ($('input[name="generate-5"]:checked').length > 0) {
              if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-duplicate") {
                sodaJSONObject["generate-dataset"]["if-existing"] = "create-duplicate";
              } else if (
                $('input[name="generate-5"]:checked')[0].id === "existing-folders-replace"
              ) {
                sodaJSONObject["generate-dataset"]["if-existing"] = "replace";
              } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-merge") {
                sodaJSONObject["generate-dataset"]["if-existing"] = "merge";
              } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-skip") {
                sodaJSONObject["generate-dataset"]["if-existing"] = "skip";
              }
            }
            if ($('input[name="generate-6"]:checked').length > 0) {
              if ($('input[name="generate-6"]:checked')[0].id === "existing-files-duplicate") {
                sodaJSONObject["generate-dataset"]["if-existing-files"] = "create-duplicate";
              } else if ($('input[name="generate-6"]:checked')[0].id === "existing-files-replace") {
                sodaJSONObject["generate-dataset"]["if-existing-files"] = "replace";
              } else if ($('input[name="generate-6"]:checked')[0].id === "existing-files-skip") {
                sodaJSONObject["generate-dataset"]["if-existing-files"] = "skip";
              }
            }
            // populate JSON obj with BF dataset and account
            if ($("#current-bf-dataset-generate").text() !== "None") {
              if ("bf-dataset-selected" in sodaJSONObject) {
                sodaJSONObject["bf-dataset-selected"]["dataset-name"] = $(
                  "#current-bf-dataset-generate"
                ).text();
              } else {
                sodaJSONObject["bf-dataset-selected"] = {
                  "dataset-name": $("#current-bf-dataset-generate").text(),
                };
              }
            }
            // if generate to a new dataset, then update JSON object with a new dataset
          } else if (
            $('input[name="generate-4"]:checked')[0].id === "generate-BF-dataset-options-new"
          ) {
            // The user chose to generate to a new dataset on Pennsieve
            // Set the generate option to new (we're creating a new dataset)
            sodaJSONObject["generate-dataset"]["generate-option"] = "new";
            var newDatasetName = $("#inputNewNameDataset").val().trim();
            sodaJSONObject["generate-dataset"]["dataset-name"] = newDatasetName;
            sodaJSONObject["generate-dataset"]["if-existing"] = "create-duplicate";
            sodaJSONObject["generate-dataset"]["if-existing-files"] = "create-duplicate";
            // if upload to a new bf dataset, then delete key below from JSON object
            if ("bf-dataset-selected" in sodaJSONObject) {
              delete sodaJSONObject["bf-dataset-selected"];
            }
          }
        }
      }
    }
    if (progress == true) {
      sodaJSONObject["starting-point"]["type"] = starting_point;
    }
  }
};

// function to call when users click on Continue at each step
const updateOverallJSONStructure = (id) => {
  if (id === allParentStepsJSON["high-level-folders"]) {
    document.getElementById("input-global-path").value = "dataset_root/";
    var optionCards = document.getElementsByClassName("option-card high-level-folders");
    var newDatasetStructureJSONObj = { folders: {}, files: {} };
    var keys = [];
    for (var card of optionCards) {
      if ($(card).hasClass("checked")) {
        keys.push($(card).children()[0].innerText);
      }
    }
    // keys now have all the high-level folders from Step 2
    // window.datasetStructureJSONObj["folders"] have all the folders both from the old step 2 and -deleted folders in step 3

    // 1st: check if folder in keys, not in window.datasetStructureJSONObj["folders"], then add an empty object
    // 2nd: check if folder in window.datasetStructureJSONObj["folders"], add that to newDatasetStructureJSONObj["folders"]
    // 3rd: assign old to new
    // 1st
    keys.forEach((folder) => {
      if ("folders" in window.datasetStructureJSONObj) {
        if (Object.keys(window.datasetStructureJSONObj["folders"]).includes(folder)) {
          // clone a new json object
          newDatasetStructureJSONObj["folders"][folder] =
            window.datasetStructureJSONObj["folders"][folder];
        } else {
          newDatasetStructureJSONObj["folders"][folder] = {
            folders: {},
            files: {},
            type: "",
            action: [],
          };
        }
      }
    });
    // 2nd
    if ("folders" in window.datasetStructureJSONObj) {
      Object.keys(window.datasetStructureJSONObj["folders"]).forEach((folderKey) => {
        if (!keys.includes(folderKey)) {
          newDatasetStructureJSONObj["folders"][folderKey] =
            window.datasetStructureJSONObj["folders"][folderKey];
        }
      });
    }
    // 3rd
    window.datasetStructureJSONObj = newDatasetStructureJSONObj;
    //dont know here
    listItems(window.datasetStructureJSONObj, "#items");
    getInFolder(".single-item", "#items", organizeDSglobalPath, window.datasetStructureJSONObj);
  } else if (id === allParentStepsJSON["getting-started"]) {
    updateJSONStructureGettingStarted();
  } else if (id === allParentStepsJSON["metadata-files"]) {
    updateJSONStructureMetadataFiles();
  } else if (id === allParentStepsJSON["manifest-file"]) {
    updateJSONStructureManifest();
  } else if (id === allParentStepsJSON["organize-dataset"]) {
    window.updateJSONStructureDSstructure();
  }
};
//////////////////////////////// END OF Functions to update JSON object //////////////////////////////////////////

var generateExitButtonBool = false;
function raiseWarningExit(message) {
  // function associated with the Exit button (Step 6: Generate dataset -> Generate div)
  return new Promise((resolve) => {
    Swal.fire({
      icon: "warning",
      text: message,
      showCancelButton: true,
      focusCancel: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Continue",
      reverseButtons: window.reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        generateExitButtonBool = true;
        resolve(generateExitButtonBool);
      } else {
        generateExitButtonBool = false;
        resolve(generateExitButtonBool);
      }
    });
  });
}

window.resetCuration = () => {
  $("#dataset-loaded-message").hide();
  $(".vertical-progress-bar-step").removeClass("is-current");
  $(".vertical-progress-bar-step").removeClass("done");
  $(".getting-started").removeClass("prev");
  $(".getting-started").removeClass("show");
  $(".getting-started").removeClass("test2");
  $("#Question-getting-started-1").addClass("show");
  $("#generate-dataset-progress-tab").css("display", "none");

  window.currentTab = 0;
  // uncheck all radio buttons and checkboxes
  $("#organize-section").find(".option-card").removeClass("checked");
  $("#organize-section").find(".option-card.radio-button").removeClass("non-selected");
  $("#organize-section").find(".option-card.high-level-folders").removeClass("disabled");
  $("#organize-section").find(".option-card .folder-input-check").prop("checked", false);
  $("#organize-section").find(".parent-tabs.option-card").removeClass("checked");
  $("#organize-section").find(".parent-tabs.option-card.radio-button").removeClass("non-selected");
  $("#organize-section")
    .find(".parent-tabs.option-card.high-level-folders")
    .removeClass("disabled");
  $("#organize-section").find(".parent-tabs.option-card.folder-input-check").prop("checked", false);
  $(".metadata-button.button-generate-dataset").removeClass("done");
  $(".metadata-button.button-generate-dataset").removeClass("d-flex");
  $("#organize-section input:checkbox").prop("checked", false);
  $("#organize-section input:radio").prop("checked", false);

  // set back local destination for folders to empty
  $("#input-destination-generate-dataset-locally").val("");
  $("#input-destination-getting-started-locally").val("");
  $("#input-destination-getting-started-locally").prop("placeholder", "Browse here");
  $("#input-destination-generate-dataset-locally").prop("placeholder", "Browse here");

  // set metadata file paths to empty
  $(".para-metadata-file-status").text("");

  // hide the generate manifest locally button
  document.getElementById("ffm-container-local-manifest-file-generation").classList.add("hidden");

  // set back Please continue para element
  $("#para-continue-prepare-new-getting-started").text("");
  $("#para-continue-bf-dataset-getting-started").text("");
  $("#para-continue-location-dataset-getting-started").text("");

  // un-show all divs from Generate dataset step
  $($("#Question-generate-dataset").siblings()).removeClass("show");

  $(".generate-dataset").removeClass("prev");
  $(".generate-dataset").removeClass("show");
  $(".generate-dataset").removeClass("test2");
  $("#generate-manifest-curate").prop("checked", false);

  // $("#main_tabs_view")[0].click();
  window.globalGettingStarted1stQuestionBool = false;
};

window.exitCurate = async (resetProgressTabs, start_over = false) => {
  $("#dataset-loaded-message").hide();
  // if exit Btn is clicked after Generate
  if (resetProgressTabs) {
    var message;

    if ($("#save-progress-btn").css("display") === "block") {
      message =
        "This will reset your progress so far. We recommend saving your progress before exiting. Are you sure you want to continue?";
    } else {
      message = "Are you sure you want to start over?";
    }

    var res = await raiseWarningExit(message);

    if (res) {
      $(".vertical-progress-bar-step").removeClass("is-current");
      $(".vertical-progress-bar-step").removeClass("done");
      $(".getting-started").removeClass("prev");
      $(".getting-started").removeClass("show");
      $(".getting-started").removeClass("test2");
      $("#Question-getting-started-1").addClass("show");
      $("#generate-dataset-progress-tab").css("display", "none");

      window.hasFiles = false;
      window.currentTab = 0;
      window.wipeOutCurateProgress();
      window.showParentTab(0, 1);
      window.globalGettingStarted1stQuestionBool = false;
      if (start_over) {
        $("#organize_dataset_btn").click();
      } else {
        window.returnToGuided();
        if ($("#nextBtn").prop("disabled") === true) {
          window.nextBtnDisabledVariable = true;
        } else {
          window.nextBtnDisabledVariable = false;
        }
        // $("#guided_mode_view").click();
      }
    } else {
      window.globalGettingStarted1stQuestionBool = false;
      return;
    }
  } else {
    window.wipeOutCurateProgress();
  }
};

window.wipeOutCurateProgress = () => {
  // set SODA json object back
  window.sodaJSONObj = {
    "starting-point": { type: "" },
    "dataset-structure": {},
    "metadata-files": {},
  };
  // uncheck all radio buttons and checkboxes
  $("#organize-section").find(".option-card").removeClass("checked");
  $("#organize-section").find(".option-card.radio-button").removeClass("non-selected");
  $("#organize-section").find(".option-card.high-level-folders").removeClass("disabled");
  $("#organize-section").find(".option-card .folder-input-check").prop("checked", false);
  $("#organize-section").find(".parent-tabs.option-card").removeClass("checked");
  $("#organize-section").find(".parent-tabs.option-card.radio-button").removeClass("non-selected");
  $("#organize-section")
    .find(".parent-tabs.option-card.high-level-folders")
    .removeClass("disabled");
  $("#organize-section").find(".parent-tabs.option-card.folder-input-check").prop("checked", false);
  $(".metadata-button.button-generate-dataset").removeClass("done");
  $(".metadata-button.button-generate-dataset").removeClass("d-flex");
  $("#organize-section input:checkbox").prop("checked", false);
  $("#organize-section input:radio").prop("checked", false);

  // set back local destination for folders to empty
  $("#input-destination-generate-dataset-locally").val("");
  $("#input-destination-getting-started-locally").val("");
  $("#input-destination-getting-started-locally").prop("placeholder", "Browse here");
  $("#input-destination-generate-dataset-locally").prop("placeholder", "Browse here");

  // set metadata file paths to empty
  $(".para-metadata-file-status").text("");

  // hide the generate manifest locally button
  document.getElementById("ffm-container-local-manifest-file-generation").classList.add("hidden");

  // set back Please continue para element
  $("#para-continue-prepare-new-getting-started").text("");
  $("#para-continue-bf-dataset-getting-started").text("");
  $("#para-continue-location-dataset-getting-started").text("");

  // un-show all divs from Generate dataset step
  $($("#Question-generate-dataset").siblings()).removeClass("show");

  $(".generate-dataset").removeClass("prev");
  $(".generate-dataset").removeClass("show");
  $(".generate-dataset").removeClass("test2");

  // reset dataset structure JSON
  window.datasetStructureJSONObj = { folders: {}, files: {} };

  // uncheck auto-generated manifest checkbox
  $("#generate-manifest-curate").prop("checked", false);

  // reset dataset selection options
  $("#current-bf-dataset").text("None"); // step 1
  $("#current-bf-dataset-generate").text("None"); // step 6 for when merging a new dataset into an existing dataset
  $("#button-confirm-bf-dataset").hide(); // hide step 6 confirm button until the user selects the dataset again
  //
};

// once users click on option card: Organize dataset
document.getElementById("button-section-organize-dataset").addEventListener("click", () => {
  $(".vertical-progress-bar").css("display", "flex");
  document.getElementById("generate-dataset-progress-tab").style.display = "none";
  window.showParentTab(window.currentTab, 1);
});

document.getElementById("organize_dataset_btn").addEventListener("click", () => {
  $(".vertical-progress-bar").css("display", "flex");
  document.getElementById("generate-dataset-progress-tab").style.display = "none";
  $("#save-progress-btn").css("display", "none");
  $("#start-over-btn").css("display", "none");
  window.showParentTab(window.currentTab, 1);
});

const hideNextDivs = (currentDiv) => {
  // make currentDiv current class
  $(`#${currentDiv}`).removeClass("prev");
  $(`#${currentDiv}`).removeClass("test2");
  // hide subsequent divs
  $($(`#${currentDiv}`).nextAll()).removeClass("prev");
  $($(`#${currentDiv}`).nextAll()).removeClass("show");
  $($(`#${currentDiv}`).nextAll()).removeClass("test2");
};

// save progress up until step 5 for now
const updateJSONObjectProgress = () => {
  // updateJSONStructureGettingStarted();
  updateJSONStructureMetadataFiles();
  updateJSONStructureManifest();
  window.updateJSONStructureDSstructure();
  window.updateJSONStructureGenerate(true, window.sodaJSONObj);
};

const saveSODAJSONProgress = (progressFileName) => {
  try {
    window.fs.mkdirSync(progressFilePath, { recursive: true });
  } catch (error) {
    log.error(error);
    console.log(error);
  }
  var filePath = window.path.join(progressFilePath, progressFileName + ".json");
  // record all information listed in SODA JSON Object before saving
  updateJSONObjectProgress();
  // delete window.sodaJSONObj["dataset-structure"] value that was added only for the Preview tree view
  if ("files" in window.sodaJSONObj["dataset-structure"]) {
    window.sodaJSONObj["dataset-structure"]["files"] = {};
  }
  // delete manifest files added for treeview
  for (var highLevelFol in window.sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in
        window.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
      window.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"][
        "forTreeview"
      ] === true
    ) {
      delete window.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
  window.fs.writeFileSync(filePath, JSON.stringify(window.sodaJSONObj));

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
};

// function to save Progress
window.saveOrganizeProgressPrompt = () => {
  // check if "save-progress" key is in JSON object
  // if yes, keep saving to that file
  if ("save-progress" in window.sodaJSONObj) {
    // save to file
    saveSODAJSONProgress(window.sodaJSONObj["save-progress"]);
    // if no, ask users what to name it, and create file
  } else {
    Swal.fire({
      icon: "info",
      title: "Saving progress as...",
      text: "Enter a name for your progress below:",
      heightAuto: false,
      input: "text",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "OK",
      reverseButtons: window.reverseSwalButtons,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    }).then((result) => {
      if (result.value) {
        if (result.value !== null && result.value !== "") {
          window.sodaJSONObj["save-progress"] = result.value.trim();
          saveSODAJSONProgress(result.value.trim());
          window.addOption(
            window.progressFileDropdown,
            result.value.trim(),
            result.value.trim() + ".json"
          );
        }
      }
    });
  }
};

$("#start-over-btn").click(() => {
  window.exitCurate(true, true);
});

const description_text = {
  manage_dataset_section:
    "This interface provides a convenient window to accomplish all required curation steps on your Pennsieve datasets",
  prepare_metadata_section:
    "This interface will help you in preparing the SPARC metadata files for your datasets",
  prepare_dataset_section:
    "This interface will help you in organizing your datasets according to the SPARC Data Structure",
  disseminate_dataset_section:
    "This interface will assist you in completing steps required once your datasets have been fully prepared",
};

$("input:radio[name=main_tabs]").click(function () {
  let option = $(this).val();
  $("#tab_info_text").text(description_text[option]);
  $(".main-tabs-section").removeClass("show");
  $(".main-tabs-section").addClass("hide");
  document.getElementById(option).classList.remove("hide");
  document.getElementById(option).classList.add("show");
});

$(document).ready(() => {
  // Enable the popover content for the main-tab buttons
  $(".option-card-disseminate-dataset").each(function () {
    var $this = $(this);
    $this.popover({
      trigger: "hover",
      container: $this,
    });
  });
  $(".coming-soon-div").popover();
  $("#button-submit-dataset").popover();
  $(".popover-tooltip").each(function () {
    var $this = $(this);
    $this.popover({
      trigger: "hover",
      container: $this,
    });
  });

  // let dsAccordion = new Accordion("#dd-accordion")
  // TODO: What does this do? BUNDLING CHANGE WAS TO COMMENT THIS CHANGE BACK IF NECESSARY
  // $(".ui.accordion").accordion();
  $(".content-button").click(function () {
    let section = $(this).data("section");

    if (section === "rename_existing_bf_dataset") {
      let rename_dataset_name = $(
        "#rename_dataset_BF_account_tab .change-current-account.ds-dd.dataset-name h5"
      ).html();
      if (rename_dataset_name.trim() != "None" && rename_dataset_name != "") {
        $("#bf-rename-dataset-name").val(rename_dataset_name);
      } else {
        $("#bf-rename-dataset-name").val("");
      }
    }

    $("#main-nav").addClass("active");
    $("#sidebarCollapse").addClass("active");
    $(".section").addClass("fullShown");
  });

  $(".footer-div div button").click((ev) => {
    if (ev.currentTarget.id === "reset-local-upload") {
      return;
    }
    $("#main-nav").removeClass("active");
    if ($("#sidebarCollapse").hasClass("active")) {
      $("#sidebarCollapse").removeClass("active");
    }
    $(".section").removeClass("fullShown");
  });

  // Blackfynn transition warning message
  //TODO: Dorian -> Remove this as it is no longer needed
  const url =
    "https://raw.githubusercontent.com/bvhpatel/SODA/master/src/assets/blackfynn-warning-message.txt";
  fetch(url).then(function (response) {
    response.text().then(function (text) {
      let warning_obj = JSON.parse(text);

      if (warning_obj["show-warning-message"]) {
        Swal.fire({
          icon: "info",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          html: `${warning_obj["warning-message"]}`,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        });
      }
    });
  });
  $(".content-button").popover();
});

$("#manage_dataset_tab").click();

$("#bf_list_users").on("change", () => {
  let user_val = $("#bf_list_users").val();
  let user_role = $("#bf_list_roles_user").val();

  if (user_val == "Select user" || user_role == "Select role") {
    $("#button-add-permission-user").hide();
  } else {
    $("#button-add-permission-user").show();
  }
});

$("#bf_list_roles_user").on("change", () => {
  let user_val = $("#bf_list_users").val();
  let user_role = $("#bf_list_roles_user").val();

  if (user_val == "Select user" || user_role == "Select role") {
    $("#button-add-permission-user").hide();
  } else {
    $("#button-add-permission-user").show();
  }
});

$("#bf_list_teams").on("change", () => {
  let team_val = $("#bf_list_teams").val();
  let team_role = $("#bf_list_roles_teams").val();

  if (team_val == "Select team" || team_role == "Select role") {
    $("#button-add-permission-team").hide();
  } else {
    $("#button-add-permission-team").show();
  }
});

$("#bf_list_roles_teams").on("change", () => {
  let team_val = $("#bf_list_teams").val();
  let team_role = $("#bf_list_roles_teams").val();

  if (team_val == "Select team" || team_role == "Select role") {
    $("#button-add-permission-team").hide();
  } else {
    $("#button-add-permission-team").show();
  }
});

const initRipple = function (buttonEle) {
  var inside = document.createElement("div");
  inside.classList.add("btn_animated-inside");
  inside.innerHTML = buttonEle.innerHTML;
  buttonEle.innerHTML = "";
  buttonEle.appendChild(inside);
  inside.addEventListener("mousedown", function () {
    ripple(event, this);
  });
};
const ripple = function (event, buttonEle) {
  var rippleEle = document.createElement("span");
  rippleEle.setAttribute("class", "ripple");
  rippleEle.style.top = event.offsetY + "px";
  rippleEle.style.left = event.offsetX + "px";
  buttonEle.appendChild(rippleEle);
  setTimeout(
    function () {
      rippleEle.classList.add("effect");
    },
    0,
    rippleEle
  );

  setTimeout(
    function () {
      rippleEle.remove();
    },
    1000,
    rippleEle
  );
};

var buttons = document.getElementsByClassName("btn_animated");
for (var i = 0; i < buttons.length; i++) {
  let button = buttons[i];
  initRipple(button);
}

// Input:
//  elementId:  string - id selector of the section the user will transition to from the Submit for pre-publishing tab
// transition from the pre-publishing review tab to the given prepare metadata tabs
window.transitionFromPrePublishingChecklist = (ev, elementId) => {
  if (ev.classList.contains("no-pointer")) {
    return;
  }
  // change is shown to the subtitle section
  $(".section.is-shown").removeClass("is-shown");

  // show the subtitle section instead
  $(`#${elementId}`).addClass("is-shown");

  $(".main-tabs-section").removeClass("show");
  $(".main-tabs-section").addClass("hide");

  // when a user clicks return change the tab they see
  document.getElementById("disseminate_dataset_section").classList.remove("show");
  document.getElementById("disseminate_dataset_section").classList.add("hide");
  document.getElementById("manage_dataset_section").classList.add("show");

  // mark the tab as checked to get the appropriate tab styling
  $("#disseminate_dataset_tab").prop("checked", false);
  $("#manage_dataset_tab").prop("checked", true);
};

const scrollToElement = (elementIdOrClassname) => {
  let element = document.querySelector(elementIdOrClassname);

  element.scrollIntoView(true);
};
