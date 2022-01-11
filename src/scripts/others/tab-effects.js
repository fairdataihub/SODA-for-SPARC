const { rgba } = require("jimp");
const { relative } = require("path");

// JSON object of all the tabs
var allParentStepsJSON = {
  "getting-started": "getting-started-tab",
  "high-level-folders": "high-level-folders-tab",
  "organize-dataset": "organize-dataset-tab",
  "metadata-files": "metadata-files-tab",
  "manifest-file": "manifest-file-tab",
  "generate-dataset": "generate-dataset-tab",
};

var currentTab = 0; // Current tab is set to be the first tab (0)
// showParentTab(0, 1);

const delay = 250;

const showParentTab = (tabNow, nextOrPrev) => {
  $("#nextBtn").prop("disabled", true);
  // check to show Save progress btn (only after step 2)
  if (tabNow >= 2) {
    // check if users are Continuing with an existing BF ds. If so, hide Save progress btn
    if (
      $('input[name="getting-started-1"]:checked').prop("id") === "existing-bf"
    ) {
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
    highLevelFoldersDisableOptions();
  } else {
    if (tabNow === 3) {
      if (Object.keys(datasetStructureJSONObj["folders"]).includes("code")) {
        $(".metadata-button.button-generate-dataset.code-metadata").css(
          "display",
          "block"
        );
        $(".flex-row-container.code-metadata").css("display", "flex");
      } else {
        $(".metadata-button.button-generate-dataset.code-metadata").css(
          "display",
          "none"
        );
        $(".flex-row-container.code-metadata").css("display", "none");
      }
    }
    $("#nextBtn").prop("disabled", false);
  }
  if (tabNow == 5) {
    // Disable the continue button if a destination has not been selected
    // Used when traversing back and forth between tabs
    if (
      $("#inputNewNameDataset").val() !== "" ||
      ($("#Question-generate-dataset-existing-files-options")
        .find(".option-card")
        .hasClass("checked") &&
        $("#Question-generate-dataset-existing-folders-options")
          .find(".option-card")
          .hasClass("checked")) ||
      $("#generate-dataset-replace-existing")
        .find(".option-card")
        .hasClass("checked") ||
      $("#input-destination-generate-dataset-locally")[0].placeholder !==
        "Browse here"
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
              intro:
                "This is where you will organize your dataset for curation",
            },
            {
              title: "Expand folders",
              element: document.querySelector(".div-organize-items"),
              intro: "Double click on any of the folders to expand them.",
            },
            {
              title: "More options",
              element: document.querySelector(".single-item"),
              intro:
                "You can rename, delete and move folders and files by right clicking here.",
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
    // If in step 6, show the generate button and the preview tab
    $("#nextBtn").css("display", "none");

    let dataset_name = fill_info_details();
    showTreeViewPreview(dataset_name);
    $("#Question-preview-dataset-details").show();
    $("#Question-preview-dataset-details").children().show();
    $("#Question-generate-dataset-generate-div").show();
    $("#Question-generate-dataset-generate-div").children().show();
    //$("#preview-dataset-structure-btn").show();
  }
};

// function to fill the card details in the preview tab of step 7
const fill_info_details = () => {
  let new_dataset_name = "My_dataset_folder";
  $(".card-container.generate-preview").remove();
  if (sodaJSONObj["starting-point"]["type"] === "bf") {
    add_card_detail(
      "Pennsieve account",
      sodaJSONObj["bf-account-selected"]["account-name"]
    );
    add_card_detail(
      "Dataset name",
      sodaJSONObj["bf-dataset-selected"]["dataset-name"]
    );
    new_dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    if (manifestFileCheck.checked) {
      add_card_detail(
        "Manifest files",
        "Requested from SODA",
        1,
        "pulse-manifest-checkbox",
        true
      );
    } else {
      add_card_detail(
        "Manifest files",
        "Not requested",
        1,
        "pulse-manifest-checkbox",
        true
      );
    }
  }
  if (
    sodaJSONObj["starting-point"]["type"] === "local" ||
    sodaJSONObj["starting-point"]["type"] === "new"
  ) {
    // replace existing dataset when starting from local
    if (
      $('input[name="generate-1"]:checked')[0].id === "generate-local-existing"
    ) {
      add_card_detail(
        "Current dataset location",
        sodaJSONObj["starting-point"]["local-path"],
        1,
        "Question-generate-dataset",
        true
      );
      new_dataset_name = require("path").basename(
        sodaJSONObj["starting-point"]["local-path"]
      );
      if (manifestFileCheck.checked) {
        add_card_detail(
          "Manifest files",
          "Requested from SODA",
          2,
          "pulse-manifest-checkbox",
          true
        );
      } else {
        add_card_detail(
          "Manifest files",
          "Not requested",
          2,
          "pulse-manifest-checkbox",
          true
        );
      }
    } else if (
      $('input[name="generate-1"]:checked')[0].id === "generate-local-desktop"
    ) {
      if (sodaJSONObj["starting-point"]["type"] === "local") {
        add_card_detail(
          "Original dataset location",
          sodaJSONObj["starting-point"]["local-path"]
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
      if (manifestFileCheck.checked) {
        add_card_detail(
          "Manifest files",
          "Requested from SODA",
          2,
          "pulse-manifest-checkbox",
          true
        );
      } else {
        add_card_detail(
          "Manifest files",
          "Not requested",
          2,
          "pulse-manifest-checkbox",
          true
        );
      }
    } else if (
      $('input[name="generate-1"]:checked')[0].id === "generate-upload-BF"
    ) {
      if (sodaJSONObj["starting-point"]["type"] === "local") {
        add_card_detail(
          "Original dataset location",
          sodaJSONObj["starting-point"]["local-path"]
        );
      }

      add_card_detail(
        "New dataset location",
        "Pennsieve",
        1,
        "Question-generate-dataset",
        true
      );
      add_card_detail(
        "Pennsieve account",
        $("#current-bf-account-generate").text(),
        1,
        "Question-generate-dataset-BF-account",
        true
      );
      add_card_detail(
        "Account details",
        $("#para-account-detail-curate-generate").html(),
        1,
        "Question-generate-dataset-BF-account",
        true
      );
      if (
        $('input[name="generate-4"]:checked')[0].id ===
        "generate-BF-dataset-options-existing"
      ) {
        add_card_detail(
          "Dataset name",
          $("#current-bf-dataset-generate").text(),
          1,
          "Question-generate-dataset-BF-dataset",
          true
        );
        new_dataset_name = $("#current-bf-dataset-generate").text();
        if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-duplicate"
        ) {
          add_card_detail(
            "For existing folders",
            "Create a duplicate",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        } else if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-replace"
        ) {
          add_card_detail(
            "For existing folders",
            "Replace",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        } else if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-merge"
        ) {
          add_card_detail(
            "For existing folders",
            "Merge",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        } else if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-skip"
        ) {
          add_card_detail(
            "For existing folders",
            "Skip",
            1,
            "Question-generate-dataset-existing-folders-options",
            true
          );
        }
        if (
          $('input[name="generate-6"]:checked')[0].id ===
          "existing-files-duplicate"
        ) {
          add_card_detail(
            "For existing files",
            "Create a duplicate",
            1,
            "Question-generate-dataset-existing-files-options",
            true
          );
        } else if (
          $('input[name="generate-6"]:checked')[0].id ===
          "existing-files-replace"
        ) {
          add_card_detail(
            "For existing files",
            "Replace",
            1,
            "Question-generate-dataset-existing-files-options",
            true
          );
        } else if (
          $('input[name="generate-6"]:checked')[0].id === "existing-files-skip"
        ) {
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
      if (manifestFileCheck.checked) {
        add_card_detail(
          "Manifest files",
          "Requested from SODA",
          2,
          "pulse-manifest-checkbox",
          true
        );
      } else {
        add_card_detail(
          "Manifest files",
          "Not requested",
          2,
          "pulse-manifest-checkbox",
          true
        );
      }
    }
  }
  return new_dataset_name;
};

// called when edit button is clicked
// amount => how many times the back button is clicked
// element => element to scroll to in the page
// pulse_animation => whether to pulse the element
const traverse_back = (amount, element = "", pulse_animation = false) => {
  if (element === "Question-generate-dataset-existing-folders-options") {
    $("#button-confirm-bf-dataset").click();
    $("nextBtn").prop("disabled", true);
  }
  for (i = 0; i < amount; i++) {
    nextPrev(-1);
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
  let link_item = "<i class='far fa-edit jump-back' onclick='traverse_back(";
  link_item += parent_tab.toString();
  temp = ', "' + element_id + '", ' + pulse + ")";
  link_item += temp;
  link_item += "'></i>";

  let parent_element = $("#div-preview-dataset-details");

  let new_card_element =
    "<div class='card-container generate-preview'><h5 class='card-left'>" +
    card_left +
    ":</h5><p class='card-right'>" +
    card_right;

  if (parent_tab === -1) {
    new_card_element += "</p></div>";
  } else {
    new_card_element += link_item + "</p></div>";
  }

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
  var optionCards = document.getElementsByClassName(
    "option-card high-level-folders"
  );
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

// function associated with the Back/Continue buttons
const nextPrev = (n) => {
  var x = document.getElementsByClassName("parent-tabs");

  if (n == -1 && x[currentTab].id === "getting-started-tab") {
    let event = new CustomEvent("custom-back", {
      detail: {
        target: { dataset: { section: "main_tabs" }, classList: ["someclass"] },
      },
    });
    // $("#sidebarCollapse").click();
    // forceActionSidebar("show");
    document.body.dispatchEvent(event);
    if ($("#nextBtn").prop("disabled") === true) {
      nextBtnDisabledVariable = true;
    } else {
      nextBtnDisabledVariable = false;
    }
    return;
  }

  // update JSON structure
  updateOverallJSONStructure(x[currentTab].id);

  // reset datasetStructureObject["files"] back to {},
  // and delete ui preview-added manifest files
  if (
    x[currentTab].id === "high-level-folders-tab" ||
    x[currentTab].id === "metadata-files-tab"
  ) {
    organizeLandingUIEffect();
    // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
    if ("files" in datasetStructureJSONObj) {
      datasetStructureJSONObj["files"] = {};
    }
    // delete manifest files added for treeview
    for (var highLevelFol in datasetStructureJSONObj["folders"]) {
      if (
        "manifest.xlsx" in
          datasetStructureJSONObj["folders"][highLevelFol]["files"] &&
        datasetStructureJSONObj["folders"][highLevelFol]["files"][
          "manifest.xlsx"
        ]["forTreeview"] === true
      ) {
        delete datasetStructureJSONObj["folders"][highLevelFol]["files"][
          "manifest.xlsx"
        ];
      }
    }
  }

  if (
    n === 1 &&
    x[currentTab].id === "organize-dataset-tab" &&
    sodaJSONObj["dataset-structure"] === { folders: {} }
  ) {
    Swal.fire({
      icon: "warning",
      text: "The current dataset folder is empty. Are you sure you want to continue?",
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Continue",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        $(x[currentTab]).removeClass("tab-active");
        // Increase or decrease the current tab by 1:
        currentTab = currentTab + n;
        // For step 1,2,3, check for High level folders input to disable Continue button
        if (currentTab === 1 || currentTab === 2 || currentTab === 3) {
          highLevelFoldersDisableOptions();
        }
        // Display the correct tab:
        showParentTab(currentTab, n);
      }
    });
    // check if required metadata files are included
  } else if (n === 1 && x[currentTab].id === "metadata-files-tab") {
    var requiredFiles = ["submission", "dataset_description", "subjects"];
    if (
      $(".metadata-button.button-generate-dataset.code-metadata").css(
        "display"
      ) === "block"
    ) {
      requiredFiles.push("code_description");
    }
    var withoutExtMetadataArray = [];
    if (!("metadata-files" in sodaJSONObj)) {
      sodaJSONObj["metadata-files"] = {};
    }
    Object.keys(sodaJSONObj["metadata-files"]).forEach((element) => {
      if (!element.includes("-DELETED")) {
        withoutExtMetadataArray.push(path.parse(element).name);
      }
    });
    var subArrayBoolean = requiredFiles.every((val) =>
      withoutExtMetadataArray.includes(val)
    );
    if (requiredFiles.includes("code_description")) {
      var extraRequiredFile = "<li> code_description</li>";
    } else {
      var extraRequiredFile = "";
    }
    if (!subArrayBoolean) {
      var notIncludedMessage = `<div style='text-align: left'>You did not include all of the following required metadata files: <br><ol style='text-align: left'><li> submission</li><li> dataset_description</li> <li> subjects</li> ${extraRequiredFile} </ol>Are you sure you want to continue?</div>`;
      Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: "warning",
        html: notIncludedMessage,
        showConfirmButton: true,
        confirmButtonText: "Continue",
        showCancelButton: "No",
        focusCancel: true,
        reverseButtons: reverseSwalButtons,
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
          $(x[currentTab]).removeClass("tab-active");
          // Increase or decrease the current tab by 1:
          currentTab = currentTab + n;
          // Display the correct tab:
          showParentTab(currentTab, n);
        }
      });
    } else {
      // Hide the current tab:
      $(x[currentTab]).removeClass("tab-active");
      // Increase or decrease the current tab by 1:
      currentTab = currentTab + n;
      // Display the correct tab:
      showParentTab(currentTab, n);
    }
  } else if (
    x[currentTab].id === "preview-dataset-tab" &&
    sodaJSONObj["starting-point"]["type"] == "bf"
  ) {
    $(x[currentTab]).removeClass("tab-active");

    currentTab = currentTab - 2;
    showParentTab(currentTab, n);
    $("#nextBtn").prop("disabled", false);
  } else if (
    x[currentTab].id === "manifest-file-tab" &&
    sodaJSONObj["starting-point"]["type"] == "bf"
  ) {
    // cj -skip step 6
    $(x[currentTab]).removeClass("tab-active");
    if (n == -1) {
      currentTab = currentTab + n;
      $("#nextBtn").prop("disabled", false);
    } else {
      currentTab = currentTab + 2;
      fixStepDone(4);
      $("#nextBtn").prop("disabled", true);
    }
    showParentTab(currentTab, n);
  } else if (
    x[currentTab].id === "manifest-file-tab" &&
    (sodaJSONObj["starting-point"]["type"] === "new" ||
      sodaJSONObj["starting-point"]["type"] === "local")
  ) {
    $(x[currentTab]).removeClass("tab-active");
    currentTab = currentTab + n;
    $("#Question-generate-dataset").show();
    $("#Question-generate-dataset").children().show();
    $("#Question-generate-dataset-generate-div").hide();
    $("#Question-generate-dataset-generate-div").children().hide();

    let dataset_location = document.querySelector(
      "#Question-generate-dataset-locally-destination > div > div.grouped.fields > label"
    );
    $(dataset_location).text(
      "At which location should we generate the dataset?"
    );

    // Show/or hide the replace existing button
    if (sodaJSONObj["starting-point"]["type"] === "local") {
      $("#generate-dataset-replace-existing").show();
      $("#generate-dataset-replace-existing").children().show();
    } else {
      $("#generate-dataset-replace-existing").hide();
      $("#generate-dataset-replace-existing").children().hide();
    }
    $("#nextBtn").prop("disabled", true);
    showParentTab(currentTab, n);
  } else {
    // Hide the current tab:
    $(x[currentTab]).removeClass("tab-active");
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // For step 1,2,3, check for High level folders input to disable Continue button
    if (currentTab === 1 || currentTab === 2 || currentTab === 3) {
      highLevelFoldersDisableOptions();
    }
    // Display the correct tab:
    showParentTab(currentTab, n);
  }
};

const fixStepIndicator = (n) => {
  // This function removes the "is-current" class of all steps...
  var i,
    x = document.getElementsByClassName("vertical-progress-bar-step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" is-current", "");
  }
  //... and adds the "active" class to the current step:
  x[n].className += " is-current";
};

const fixStepDone = (n) => {
  var x = document.getElementsByClassName("vertical-progress-bar-step");
  $(x[n]).addClass("done");
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

var globalGettingStarted1stQuestionBool = false;

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
const highLevelFoldersDisableOptions = () => {
  var highLevelFolderOptions = datasetStructureJSONObj["folders"];
  if (highLevelFolderOptions) {
    for (var folder of highLevelFolders) {
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

// raise warning before wiping out existing sodaJSONObj
// show warning message
const raiseWarningGettingStarted = (ev) => {
  return new Promise((resolve) => {
    if (
      !(
        JSON.stringify(sodaJSONObj) === "{}" ||
        JSON.stringify(sodaJSONObj) ===
          '{"starting-point":{"type":"new"},"dataset-structure":{},"metadata-files":{}}' ||
        JSON.stringify(sodaJSONObj) ===
          '{"starting-point":{"type":""},"dataset-structure":{},"metadata-files":{}}' ||
        JSON.stringify(sodaJSONObj) ===
          '{"bf-account-selected":{},"bf-dataset-selected":{},"dataset-structure":{},"metadata-files":{},"manifest-files":{},"generate-dataset":{},"starting-point":{ "type": "local","local-path":""}}' ||
        JSON.stringify(sodaJSONObj) ===
          '{"bf-account-selected":{"account-name":{}}, "bf-dataset-selected":{"dataset-name":{}}, "dataset-structure":{},"metadata-files":{}, "manifest-files":{}, "generate-dataset":{}, "starting-point": {"type": "bf"}}'
      )
    ) {
      Swal.fire({
        icon: "warning",
        text: "This will reset your progress so far. Are you sure you want to continue?",
        showCancelButton: "Cancel",
        focusCancel: true,
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
      }).then((result) => {
        if (result.isConfirmed) {
          globalGettingStarted1stQuestionBool = true;
          resolve(globalGettingStarted1stQuestionBool);
        } else {
          globalGettingStarted1stQuestionBool = false;
          resolve(globalGettingStarted1stQuestionBool);
        }
      });
    } else {
      globalGettingStarted1stQuestionBool = true;
      resolve(globalGettingStarted1stQuestionBool);
    }
  });
};

var divList = [];
async function transitionSubQuestions(
  ev,
  currentDiv,
  parentDiv,
  button,
  category
) {
  if (currentDiv === "Question-getting-started-1") {
    // log the start of a new curation process from scratch
    // logCurationForAnalytics(
    //   "Success",
    //   PrepareDatasetsAnalyticsPrefix.CURATE,
    //   AnalyticsGranularity.ACTION,
    //   ["New"],
    //   "Local",
    //   true
    // );
    globalGettingStarted1stQuestionBool = await raiseWarningGettingStarted(ev);
    if (globalGettingStarted1stQuestionBool) {
      $("#progress-files-dropdown").val("Select");
      $("#para-progress-file-status").text("");
      $("#nextBtn").prop("disabled", true);
      exitCurate(false);
      globalGettingStarted1stQuestionBool = false;
    } else {
      globalGettingStarted1stQuestionBool = false;
      return;
    }
  }

  // add "non-selected" to current option-card so users cannot keep selecting it
  $(ev).removeClass("non-selected");
  $(ev).children().find(".folder-input-check").prop("checked", true);
  $(ev).addClass("checked");

  // uncheck the other radio buttons
  $($(ev).parents()[0])
    .siblings()
    .find(".option-card.radio-button")
    .removeClass("checked");
  $($(ev).parents()[0])
    .siblings()
    .find(".option-card.radio-button")
    .addClass("non-selected");

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
  if (ev.getAttribute("data-next") === "Question-generate-dataset-BF-dataset") {
    if ($("#current-bf-dataset-generate").text() !== "None") {
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
    }
  }
  // under Step 1
  if (ev.getAttribute("data-next") === "Question-getting-started-BF-dataset") {
    if ($("#current-bf-dataset").text() !== "None") {
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
        "display",
        "flex"
      );
      $("#button-confirm-bf-dataset-getting-started").show();
    }
  }

  if (
    ev.getAttribute("data-next") === "Question-generate-dataset-generate-div"
  ) {
    $("#Question-generate-dataset-generate-div").show();
    $("#Question-generate-dataset-generate-div").children().show();
  }

  if (
    !(ev.getAttribute("data-next") === "Question-generate-dataset-generate-div")
  ) {
    // create moving effects when new questions appear
    $("#Question-generate-dataset-generate-div").hide();
    $("#Question-generate-dataset-generate-div").children().hide();
    setTimeout(() => target.classList.add("test2"), 100);
  }

  // here, handling existing folders and files tabs are independent of each other
  if (
    !(
      ev.getAttribute("data-next") ===
        "Question-generate-dataset-existing-files-options" &&
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
  document.getElementById(parentDiv).scrollTop =
    document.getElementById(parentDiv).scrollHeight;

  // when we hit the last question under Step 1, hide and disable Next button
  if (ev.getAttribute("data-next") === "Question-getting-started-final") {
    $("#progress-files-dropdown").val("Select");
    $("#para-progress-file-status").text("");
    $("#nextBtn").prop("disabled", true);
    $("#para-continue-prepare-new-getting-started").text("");
    if ($("#prepare-new").prop("checked")) {
      exitCurate(false);
      $("#prepare-new").prop("checked", true);
      $($("#prepare-new").parents()[2]).addClass("checked");
      $(
        $($("#div-getting-started-prepare-new").parents()[0])
          .siblings()
          .children()
      ).addClass("non-selected");
      sodaJSONObj["starting-point"] = {};
      sodaJSONObj["starting-point"]["type"] = "new";
      sodaJSONObj["dataset-structure"] = {};
      datasetStructureJSONObj = { folders: {}, files: {} };
      sodaJSONObj["metadata-files"] = {};
      reset_ui();
      setTimeout(() => {
        $("#nextBtn").prop("disabled", false);
        $("#para-continue-prepare-new-getting-started").text(
          "Please continue below."
        );
      }, 600);
    } else if ($("#existing-bf").is(":checked")) {
      $("#nextBtn").prop("disabled", true);
      // this exitCurate function gets called in the beginning here
      // in case users have existing, non-empty SODA object structure due to previous progress option was selected prior to this "existing-bf" option
      $("#Question-getting-started-existing-BF-account").show();
      $("#Question-getting-started-existing-BF-account").children().show();
      if (sodaJSONObj["dataset-structure"] != {}) {
        reset_ui();
        $("#nextBtn").prop("disabled", false);
      }
    }
  }

  if (
    ev.getAttribute("data-next") ===
    "Question-generate-dataset-generate-div-old"
  ) {
    if (
      $("#generate-local-existing").is(":checked") &&
      currentDiv === "Question-generate-dataset"
    ) {
      let starting_point = sodaJSONObj["starting-point"]["local-path"];

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
        $("#para-continue-existing-files-generate").text(
          "Please continue below."
        );
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

  if (
    ev.getAttribute("data-next") ===
    "Question-getting-started-locally-destination"
  ) {
    if (
      $("#existing-local").is(":checked") &&
      currentDiv == "Question-getting-started-1"
    ) {
      sodaJSONObj = {
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
}

// Create the dataset structure for sodaJSONObj
const create_json_object = (action, sodaJSONObj, root_folder_path) => {
  high_level_metadata_sparc = [
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
  fs.readdirSync(root_folder_path).forEach((file) => {
    full_current_path = path.join(root_folder_path, file);
    stats = fs.statSync(full_current_path);
    if (stats.isDirectory()) {
      if (highLevelFolders.includes(file) && !/(^|\/)\.[^\/\.]/g.test(file)) {
        sodaJSONObj["dataset-structure"]["folders"][file] = {
          folders: {},
          files: {},
          path: full_current_path,
          type: "local",
          action: ["existing"],
        };
      }
    }
    if (stats.isFile()) {
      if (
        high_level_metadata_sparc.includes(file) &&
        !/(^|\/)\.[^\/\.]/g.test(file)
      ) {
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
  for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
    sodaJSONObj["starting-point"][folder] = {};
    sodaJSONObj["starting-point"][folder]["path"] = "";
    temp_file_path_xlsx = path.join(root_folder_path, folder, "manifest.xlsx");
    temp_file_path_csv = path.join(root_folder_path, folder, "manifest.csv");
    if (fs.existsSync(temp_file_path_xlsx)) {
      sodaJSONObj["starting-point"][folder]["path"] = temp_file_path_xlsx;
      sodaJSONObj["starting-point"][folder]["manifest"] = excelToJson({
        sourceFile: sodaJSONObj["starting-point"][folder]["path"],
      })["Sheet1"];
    } else if (fs.existsSync(temp_file_path_csv)) {
      sodaJSONObj["starting-point"][folder]["path"] = temp_file_path_csv;
      sodaJSONObj["starting-point"][folder]["manifest"] = csvToJson
        .parseSubArray(";", ",")
        .getJsonFromCsv(sodaJSONObj["starting-point"][folder]["path"]);
    }
    recursive_structure_create(
      action,
      sodaJSONObj["dataset-structure"]["folders"][folder],
      folder,
      path.join(root_folder_path, folder)
    );
  }
};

// replace any duplicate file names
// Modify for consistency with Pennsieve naming when the update their system
const check_file_name_for_pennsieve_duplicate = (dataset_folder, filepath) => {
  file_name = path.parse(filepath).base;
  file_extension = path.parse(filepath).ext;
  var duplicateFileArray = [];

  for (var item in dataset_folder) {
    if (dataset_folder[item]["path"] !== filepath) {
      duplicateFileArray.push(item);
    }
  }

  var j = 1;
  var fileBaseName = file_name;
  var originalFileNameWithoutExt = path.parse(fileBaseName).name;
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
  current_folder_path = dataset_folder["path"];
  let manifest_object = {
    filename: "",
    timestamp: "",
    description: "",
    "file-type": "",
    "additional-metadata": "",
  };
  fs.readdirSync(current_folder_path).forEach((file) => {
    current_file_path = path.join(current_folder_path, file);
    let stats = fs.statSync(current_file_path);
    if (
      stats.isFile() &&
      path.parse(current_file_path).name != "manifest" &&
      !/(^|\/)\.[^\/\.]/g.test(file) && //not a hidden file
      high_level_folder != dataset_folder
    ) {
      if (sodaJSONObj["starting-point"][high_level_folder]["path"] !== "") {
        extension = path.extname(
          sodaJSONObj["starting-point"][high_level_folder]["path"]
        );
        if (extension == ".xlsx") {
          temp_current_file_path = current_file_path.replace("\\", "/");
          relative_path = temp_current_file_path.replace(
            root_folder_path + "/",
            ""
          );
          for (item in sodaJSONObj["starting-point"][high_level_folder][
            "manifest"
          ]) {
            if (
              sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                item
              ]["A"] == relative_path
            ) {
              if (
                sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                  item
                ]["C"] != undefined
              ) {
                manifest_object["description"] =
                  sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                    item
                  ]["C"];
              } else {
                manifest_object["description"] = "";
              }
              if (
                sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                  item
                ]["E"] != undefined
              ) {
                manifest_object["additional-metadata"] =
                  sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                    item
                  ]["E"];
              } else {
                manifest_object["additional-metadata"] = "";
              }
            }
          }
        } else if (extension == ".csv") {
          temp_current_file_path = current_file_path.replace("\\", "/");
          relative_path = temp_current_file_path.replace(
            root_folder_path + "/",
            ""
          );
          for (item in sodaJSONObj["starting-point"][high_level_folder][
            "manifest"
          ]) {
            if (
              sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                item
              ]["filename"] == relative_path
            ) {
              if (
                sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                  item
                ]["description"] != undefined
              ) {
                manifest_object["description"] =
                  sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                    item
                  ]["description"];
              } else {
                manifest_object["description"] = "";
              }
              if (
                sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                  item
                ]["AdditionalMetadata"] != undefined
              ) {
                manifest_object["additional-metadata"] =
                  sodaJSONObj["starting-point"][high_level_folder]["manifest"][
                    item
                  ]["AdditionalMetadata"];
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
      projected_file_name = check_file_name_for_pennsieve_duplicate(
        dataset_folder["files"],
        current_file_path
      );
      if (file !== projected_file_name) {
        dataset_folder["files"][projected_file_name] =
          dataset_folder["files"][file];
        dataset_folder["files"][projected_file_name]["action"].push("renamed");
        delete dataset_folder["files"][file];
      }
    }
    if (stats.isDirectory() && !/(^|\/)\.[^\/\.]/g.test(file)) {
      if (irregularFolderArray.includes(current_file_path)) {
        var renamedFolderName = "";
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = removeIrregularFolders(file);
          } else if (action === "replace") {
            renamedFolderName = replaceIrregularFolders(file);
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
  for (folder in dataset_folder["folders"]) {
    recursive_structure_create(
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
const verify_sparc_folder = (root_folder_path) => {
  possible_metadata_files = [
    "submission",
    "dataset_description",
    "subjects",
    "samples",
    "README",
    "CHANGES",
  ];
  valid_dataset = false;
  fs.readdirSync(root_folder_path).forEach((file) => {
    if (highLevelFolders.includes(file)) {
      valid_dataset = true;
    }
    for (item in possible_metadata_files) {
      if (item.indexOf(file) != -1) {
        valid_dataset = true;
      }
    }
  });
  return valid_dataset;
};

// function similar to transitionSubQuestions, but for buttons
async function transitionSubQuestionsButton(
  ev,
  currentDiv,
  parentDiv,
  button,
  category
) {
  /*
    ev: the button being clicked
    currentDiv: current option-card (question)
    parentDiv: current parent-tab (step)
    category: either getting-started or generate-dataset (currently only these 2 have multiple sub questions)
  */

  if (currentDiv === "Question-getting-started-BF-dataset") {
    $("#nextBtn").prop("disabled", true);
    // $("#button-confirm-bf-dataset-getting-started").prop("disabled", true);
    sodaJSONObj = {
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

    sodaJSONObj["bf-account-selected"]["account-name"] = $(
      "#current-bf-account"
    ).text();
    sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $(
      "#current-bf-dataset"
    ).text();
    $("#para-continue-bf-dataset-getting-started").text("");
    $("body").addClass("waiting");
    $("#button-confirm-bf-dataset-getting-started").prop("disabled", true);
    $("#bf-dataset-spinner").show();
    $("#bf-dataset-spinner").children().show();
    $("#bf-dataset-spinner").css("visibility", "visible");
    var result;
    try {
      var res = await bf_request_and_populate_dataset(sodaJSONObj);
      result = [true, res];
    } catch (err) {
      result = [false, err];
    }

    if (!result[0]) {
      Swal.fire({
        icon: "error",
        html:
          "<p style='color:red'>" +
          result[1] +
          ".<br>Please choose another dataset!</p>",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      $("#nextBtn").prop("disabled", true);
      $("#para-continue-bf-dataset-getting-started").text("");
      $("body").removeClass("waiting");
      $("#bf-dataset-spinner").css("visibility", "hidden");
      showHideDropdownButtons("dataset", "hide");
      $("#current-bf-dataset").text("None");
      $(datasetPermissionDiv)
        .find("#curatebfdatasetlist")
        .val("Select dataset")
        .trigger("change");
      sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";
      $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
      $("body").removeClass("waiting");

      // // log the error to analytics
      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION,
        ["Existing"],
        "Pennsieve",
        false
      );

      return;
    } else {
      if (result[1][2].length > 0) {
        // if any manifest files could not be read
        let missing_files = result[1][2];
        let message_text = "";
        message_text =
          "The manifest files in the following folders could not be read due to formatting issues. Would you like SODA to ignore these manifest files and continue? <br><ul>";

        for (let item in missing_files) {
          message_text += `<li>${missing_files[item]}</li>`;
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
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then((response) => {
          if (response.isConfirmed) {
            sodaJSONObj = result[1][0];
            if (JSON.stringify(sodaJSONObj["dataset-structure"]) !== "{}") {
              datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
            } else {
              datasetStructureJSONObj = { folders: {}, files: {} };
            }
            populate_existing_folders(datasetStructureJSONObj);
            populate_existing_metadata(sodaJSONObj);
            $("#nextBtn").prop("disabled", false);
            $("#para-continue-bf-dataset-getting-started").text(
              "Please continue below."
            );
            showHideDropdownButtons("dataset", "show");
            // log the successful Pennsieve import to analytics- no matter if the user decided to cancel
            logCurationForAnalytics(
              "Success",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Existing"],
              "Pennsieve",
              false
            );
          } else {
            exitCurate();
          }
        });
      } else {
        sodaJSONObj = result[1][0];
        if (JSON.stringify(sodaJSONObj["dataset-structure"]) !== "{}") {
          datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
        } else {
          datasetStructureJSONObj = { folders: {}, files: {} };
        }
        populate_existing_folders(datasetStructureJSONObj);
        populate_existing_metadata(sodaJSONObj);
        $("#nextBtn").prop("disabled", false);
        $("#para-continue-bf-dataset-getting-started").text(
          "Please continue below."
        );
        showHideDropdownButtons("dataset", "show");

        // log the successful Pennsieve import to analytics

        logCurationForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          ["Existing"],
          "Pennsieve",
          false
        );
        // $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
      }
    }
    $("body").removeClass("waiting");
    $("#bf-dataset-spinner").css("visibility", "hidden");
    $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
    $("#dataset-loaded-message").show();
    // $("#button-confirm-bf-dataset-getting-started").prop("disabled", false);
  }

  // first, handle target or the next div to show
  var target = document.getElementById(ev.getAttribute("data-next"));
  hidePrevDivs(currentDiv, category);
  // display the target tab (data-next tab)
  if (!target.classList.contains("show")) {
    target.classList.add("show");
  }

  // here, handling existing folders and files tabs are independent of each other
  if (
    !(
      ev.getAttribute("data-next") ===
        "Question-generate-dataset-existing-files-options" &&
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

  if (
    ev.getAttribute("data-next") ===
    "Question-generate-dataset-generate-div-old"
  ) {
    $("#nextBtn").prop("disabled", false);
  } else {
    // create moving effects when new questions appear
    $("#nextBtn").prop("disabled", true);
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
  document.getElementById(parentDiv).scrollTop =
    document.getElementById(parentDiv).scrollHeight;

  if (ev.getAttribute("data-next") === "Question-getting-started-final") {
    if ($("#existing-bf").is(":checked")) {
      $("#nextBtn").prop("disabled", true);
      if (sodaJSONObj["dataset-structure"] != {}) {
        $("#nextBtn").prop("disabled", false);
      }
    }
  }

  if (
    ev.getAttribute("data-next") === "input-destination-getting-started-locally"
  ) {
    if (
      $("#existing-local").is(":checked") &&
      currentDiv == "Question-getting-started-1"
    ) {
      sodaJSONObj = {
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
  }
}

async function transitionFreeFormMode(
  ev,
  currentDiv,
  parentDiv,
  button,
  category
) {
  let continueProgressRC = true;
  let continueProgressDD = true;

  let continueProgressSubSam = true;
  let continueProgressSubmission = true;
  let continueProgressGenerateDD = true;

  let continueProgressGenerateManifest = true;

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
      var res = generateSubmissionFile();
      if (res === "empty") {
        return;
      }
      $("#submission-accordion").removeClass("active");
      $("#submission-title-accordion").removeClass("active");
      break;
    case "Generate-dd":
      continueProgressGenerateDD = await generateDatasetDescription();
      break;
    case "Generate-changes":
      var res = generateRCFilesHelper("changes");
      if (res === "empty") {
        return;
      }
      break;
    case "Generate-readme":
      var res = generateRCFilesHelper("readme");
      if (res === "empty") {
        return;
      }
      break;
    case "submit_prepublishing_review-question-2":
      transitionToPrepublishingQuestionThree();
      break;
    case "submit_prepublishing_review-question-3":
      transitionToPrePublishingSubmit();
    case "Question-prepare-manifest-1":
      continueProgressGenerateManifest = await switchMetadataManifestQuestion();
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
  // add "non-selected" to current option-card so users cannot keep selecting it
  $(ev).removeClass("non-selected");
  $(ev).children().find(".folder-input-check").prop("checked", true);
  $(ev).addClass("checked");

  // uncheck the other radio buttons
  $($(ev).parents()[0])
    .siblings()
    .find(".option-card.radio-button")
    .removeClass("checked");
  $($(ev).parents()[0])
    .siblings()
    .find(".option-card.radio-button")
    .addClass("non-selected");

  // empty para elements (TODO: will convert these para elements to a swal2 alert so we dont have to clear them out)
  $("#para-submit_prepublishing_review-status").text("");

  if (ev.getAttribute("data-next") === "div_make_pi_owner_permissions") {
    let nodeStorage = new JSONStorage(app.getPath("userData"));
    let previous_choice = nodeStorage.getItem("previously_selected_PI");
    if ($(`#bf_list_users_pi option[value='${previous_choice}']`).length > 0) {
      $("#bf_list_users_pi").val(previous_choice);
      $("#bf_list_users_pi").selectpicker("refresh");
    }
  }

  if (ev.getAttribute("data-next") === "div-rename-bf-dataset") {
    let dataset_name = $("#rename_dataset_name").text();
    $("#bf-rename-dataset-name").val(dataset_name);
  }

  // first, handle target or the next div to show
  var target = document.getElementById(ev.getAttribute("data-next"));
  // hide related previous divs
  hidePrevDivs(currentDiv, category);
  // display the target tab (data-next tab)
  if (!$(target).hasClass("show")) {
    setTimeout(function () {
      $(target).addClass("show");
      // auto-scroll to bottom of div
      if (ev.getAttribute("data-next") !== "Question-prepare-dd-4-sections") {
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
    document.getElementById(parentDiv).scrollTop =
      document.getElementById(parentDiv).scrollHeight;
    if (ev.getAttribute("data-next") === "Question-prepare-submission-2") {
      onboardingSubmission();
    }
  }

  if (ev.getAttribute("data-next") === "Question-prepare-subjects-2") {
    $("#Question-prepare-subjects-2 button").show();
  }

  if (ev.getAttribute("data-next") === "Question-prepare-samples-2") {
    $("#Question-prepare-samples-2 button").show();
  }
}

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
      reverseButtons: reverseSwalButtons,
    });
    if (!continueProgress) {
      return;
    } else {
      $(`#existing-${metadataRCFileType}-file-destination`).attr(
        "placeholder",
        "Browse here"
      );
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
      reverseButtons: reverseSwalButtons,
    });
    if (continueProgress) {
      $(`#existing-${metadataRCFileType}-file-destination`).attr(
        "placeholder",
        "Browse here"
      );
      $(`#textarea-create-${metadataRCFileType}`).val("");
      if (
        $(`#bf_dataset_load_${metadataRCFileType}`).text().trim() !== "None"
      ) {
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
  var tableData = subjectsTableData;
  var singularName = "subject";
  if (metadataSubSamFile === "samples") {
    tableData = samplesTableData;
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
      reverseButtons: reverseSwalButtons,
    });
    if (continueProgress) {
      $(`#existing-${metadataSubSamFile}-file-destination`).val("");
      tableData = [];
      if (metadataSubSamFile === "samples") {
        samplesTableData = tableData;
      } else {
        subjectsTableData = tableData;
      }
      // delete table rows except headers
      $(`#table-${metadataSubSamFile} tr:gt(0)`).remove();
      $(`#table-${metadataSubSamFile}`).css("display", "none");
      // show Add a subject button
      $(`#button-add-a-${singularName}`).show();
      // Hide Generate button
      $(`#button-generate-${metadataSubSamFile}`).css("display", "none");
      $(`#div-import-primary-folder-${metadataSubSamFile}`).show();
      $(`#existing-${metadataSubSamFile}-file-destination`).attr(
        "placeholder",
        "Browse here"
      );
      // delete custom fields (if any)
      var fieldLength = $(`.${metadataSubSamFile}-form-entry`).length;
      if (fieldLength > 21) {
        for (var field of $(`.${metadataSubSamFile}-form-entry`).slice(
          21,
          fieldLength
        )) {
          $($(field).parents()[2]).remove();
        }
      }
      if (
        $(`#bf_dataset_load_${metadataSubSamFile}`).text().trim() !== "None"
      ) {
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
      reverseButtons: reverseSwalButtons,
    });
    if (continueProgressDD) {
      $("#existing-dd-file-destination").val("");
      $("#div-check-bf-import-dd").css("display", "flex");
      $($("#div-check-bf-import-dd").children()[0]).show();
      resetDDFields();
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
      reverseButtons: reverseSwalButtons,
    });
    if (continueProgressSubmission) {
      $("#existing-submission-file-destination").val("");
      $("#existing-submission-file-destination").attr(
        "placeholder",
        "Browse here"
      );
      $($("#div-check-bf-import-submission").children()[0]).show();
      $("#div-check-bf-import-submission").css("display", "flex");
      resetSubmissionFields();
    }
    return continueProgressSubmission;
  } else {
    return true;
  }
}

// 5. manifest
async function switchMetadataManifestQuestion() {
  if ($("#Question-prepare-manifest-2").hasClass("show")) {
    var { value: continueProgressManifest } = await Swal.fire({
      title:
        "This will reset your progress so far with the manifest.xlsx file. Are you sure you want to continue?",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: reverseSwalButtons,
    });
    if (continueProgressManifest) {
      $("#input-manifest-local-folder-dataset").val("");
      $("#input-manifest-local-folder-dataset").attr(
        "placeholder",
        "Browse here"
      );
      // $($("#div-confirm-manifest-local-folder-dataset").children()[0]).show();
      $("#div-confirm-manifest-local-folder-dataset").css("display", "none");
    }
    return continueProgressManifest;
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
};

const populate_existing_folders = (dataset_folders) => {
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
      populate_existing_folders(dataset_folders["folders"][folder]);
    }
  }
  return;
};

const populate_existing_metadata = (datasetStructureJSONObj) => {
  let metadataobject = datasetStructureJSONObj["metadata-files"];
  if (metadataobject == null || metadataobject == undefined) {
    return;
  }
  for (var key of Object.keys(metadataobject)) {
    let file_name = require("path").parse(key).name;
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
        $(".metadata-button[data-next='datasetDescriptionUpload']").addClass(
          "done"
        );
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
          $("#metadata-ds-description-pennsieve").css(
            "display",
            "inline-block"
          );
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
          $("#metadata-subjects-pennsieve").css("display", "inline-block");
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
          $("#metadata-samples-pennsieve").css("display", "inline-block");
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
          $("#metadata-README-pennsieve").css("display", "inline-block");
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
          $("#metadata-CHANGES-pennsieve").css("display", "inline-block");
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-changes-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "code_description":
        $(".metadata-button[data-next='codeDescriptionUpload']").addClass(
          "done"
        );
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
          $("#metadata-codeDescription-pennsieve").css(
            "display",
            "inline-block"
          );
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-codeDescription-file-path").text(
            metadataobject[key]["path"]
          );
        }
        break;
      case "inputs_metadata":
        $(".metadata-button[data-next='inputsMetadataUpload']").addClass(
          "done"
        );
        $($("#para-inputsMetadata-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-inputsMetadata-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        if (metadataobject[key]["type"] == "bf") {
          $("#para-inputsMetadata-file-path").html(
            "Using file present on Pennsieve. <br> File name: " + key
          );
          $("#metadata-inputsMetadata-pennsieve").css(
            "display",
            "inline-block"
          );
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-inputsMetadata-file-path").text(metadataobject[key]["path"]);
        }
        break;
      case "outputs_metadata":
        $(".metadata-button[data-next='outputsMetadataUpload']").addClass(
          "done"
        );
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
          $("#metadata-outputsMetadata-pennsieve").css(
            "display",
            "inline-block"
          );
        } else if (
          metadataobject[key]["type"] == "local" &&
          metadataobject[key]["action"].includes("existing")
        ) {
          $("#para-outputsMetadata-file-path").text(
            metadataobject[key]["path"]
          );
        }
        break;
      default:
        break;
    }
  }
};

function obtainDivsbyCategory(category) {
  var individualQuestions = document.getElementsByClassName(
    "individual-question"
  );
  var categoryQuestionList = [];
  for (var i = 0; i < individualQuestions.length; i++) {
    var question = individualQuestions[i];

    if (question.getAttribute("data-id") !== null) {
      if (question.getAttribute("data-id").includes(category)) {
        categoryQuestionList.push(question.id);
      }
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
      if (
        !(currentDiv === "Question-generate-dataset-existing-folders-options")
      ) {
        $(`#${currentDiv}`).nextAll().removeClass("show");
        $(`#${currentDiv}`).nextAll().removeClass("prev");
        $(`#${currentDiv}`).nextAll().removeClass("test2");

        // /// remove all checkmarks and previous data input
        $(`#${currentDiv}`)
          .nextAll()
          .find(".option-card.radio-button")
          .removeClass("checked");
        $(`#${currentDiv}`)
          .nextAll()
          .find(".option-card.radio-button")
          .removeClass("non-selected");
        $(`#${currentDiv}`)
          .nextAll()
          .find(".folder-input-check")
          .prop("checked", false);
        $(`#${currentDiv}`)
          .nextAll()
          .find("#curatebfdatasetlist")
          .prop("selectedIndex", 0);

        var childElements2 = $(`#${currentDiv}`)
          .nextAll()
          .find(".form-control");

        for (var child of childElements2) {
          if (
            child.id === "inputNewNameDataset" ||
            child.id === "bf-rename-dataset-name"
          ) {
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
  document.getElementById("input-global-path").value = "My_dataset_folder/";
};

// function to populate metadata files
const populateMetadataObject = (
  optionList,
  metadataFilePath,
  metadataFile,
  object
) => {
  if (!("metadata-files" in object)) {
    object["metadata-files"] = {};
  }
  for (let item in object["metadata-files"]) {
    if (
      item.search(metadataFile) != -1 &&
      object["metadata-files"][item]["type"] == "bf"
    ) {
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
    var mypath = path.basename(metadataFilePath);
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
  var baseName = path.basename(datasetFolder);
  currentLocation = {
    type: "local",
    folders: {},
    files: {},
    action: ["existing"],
  };

  var myitems = fs.readdirSync(datasetFolder);
  myitems.forEach((element) => {
    var statsObj = fs.statSync(path.join(datasetFolder, element));
    var addedElement = path.join(datasetFolder, element);
    if (statsObj.isDirectory()) {
      currentLocation["folders"][element] = {
        type: "local",
        folders: {},
        files: {},
        action: ["existing"],
      };
      populateJSONObjFolder(jsonObject["folders"][element], addedElement);
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

    listItems(currentLocation, "#items");
    getInFolder(
      ".single-item",
      "#items",
      organizeDSglobalPath,
      datasetStructureJSONObj
    );
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  });
};

////////////////////// Functions to update JSON object after each step //////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Step 3: Dataset structure

const updateJSONStructureDSstructure = () => {
  sodaJSONObj["dataset-structure"] = datasetStructureJSONObj;
  // check if dataset-structure key is empty (no high-level folders are included)
  if (
    JSON.stringify(sodaJSONObj["dataset-structure"]) === "{}" ||
    JSON.stringify(sodaJSONObj["dataset-structure"]["folders"]) === "{}"
  ) {
    delete sodaJSONObj["dataset-structure"];
  }
};

// Step 4: Metadata files
/// function to obtain metadata file paths from UI and then populate JSON obj
const updateJSONStructureMetadataFiles = () => {
  var submissionFilePath = document.getElementById(
    "para-submission-file-path"
  ).innerHTML;
  var dsDescriptionFilePath = document.getElementById(
    "para-ds-description-file-path"
  ).innerHTML;
  var subjectsFilePath = document.getElementById(
    "para-subjects-file-path"
  ).innerHTML;
  var samplesFilePath = document.getElementById(
    "para-samples-file-path"
  ).innerHTML;
  var readmeFilePath = document.getElementById(
    "para-readme-file-path"
  ).innerHTML;
  var changesFilePath = document.getElementById(
    "para-changes-file-path"
  ).innerHTML;

  var invalidOptionsList = [
    "Please drag a file!",
    "Please only import SPARC metadata files!",
    "",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];

  if (
    $(".metadata-button.button-generate-dataset.code-metadata").css(
      "display"
    ) === "block"
  ) {
    var codeDescriptionFilePath = document.getElementById(
      "para-codeDescription-file-path"
    ).innerHTML;
    var inputsMetadataFilePath = document.getElementById(
      "para-inputsMetadata-file-path"
    ).innerHTML;
    var outputsMetadataFilePath = document.getElementById(
      "para-outputsMetadata-file-path"
    ).innerHTML;
    populateMetadataObject(
      invalidOptionsList,
      codeDescriptionFilePath,
      "code_description",
      sodaJSONObj
    );
    populateMetadataObject(
      invalidOptionsList,
      inputsMetadataFilePath,
      "inputs_metadata",
      sodaJSONObj
    );
    populateMetadataObject(
      invalidOptionsList,
      outputsMetadataFilePath,
      "outputs_metadata",
      sodaJSONObj
    );
  }

  populateMetadataObject(
    invalidOptionsList,
    submissionFilePath,
    "submission",
    sodaJSONObj
  );
  populateMetadataObject(
    invalidOptionsList,
    dsDescriptionFilePath,
    "dataset_description",
    sodaJSONObj
  );
  populateMetadataObject(
    invalidOptionsList,
    subjectsFilePath,
    "subjects",
    sodaJSONObj
  );
  populateMetadataObject(
    invalidOptionsList,
    samplesFilePath,
    "samples",
    sodaJSONObj
  );
  populateMetadataObject(
    invalidOptionsList,
    readmeFilePath,
    "README",
    sodaJSONObj
  );
  populateMetadataObject(
    invalidOptionsList,
    changesFilePath,
    "CHANGES",
    sodaJSONObj
  );

  if (JSON.stringify(sodaJSONObj["metadata-files"]) === "{}") {
    delete sodaJSONObj["metadata-files"];
  }
};

// Step 5: Manifest file
// update JSON object with manifest file information
const updateJSONStructureManifest = () => {
  if (manifestFileCheck.checked) {
    if ("manifest-files" in sodaJSONObj) {
      // cj this might need to be changed
      sodaJSONObj["manifest-files"]["destination"] = "generate-dataset";
    } else {
      sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    }
  } else {
    delete sodaJSONObj["manifest-files"];
  }
};

const recursive_remove_local_deleted_files = (dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let file in dataset_folder["files"]) {
      if ("forTreeview" in dataset_folder["files"][file]) {
        continue;
      }
      if (
        dataset_folder["files"][file]["action"].includes("recursive_deleted")
      ) {
        let index =
          dataset_folder["files"][file]["action"].indexOf("recursive_deleted");
        dataset_folder["files"][file]["action"].splice(index, 1);
      }
      if (dataset_folder["files"][file]["action"].includes("deleted")) {
        delete dataset_folder["files"][file];
      }
    }
  }
  if (
    "folders" in dataset_folder &&
    Object.keys(dataset_folder["folders"]).length !== 0
  ) {
    for (let folder in dataset_folder["folders"]) {
      recursive_remove_local_deleted_files(dataset_folder["folders"][folder]);
      if ("action" in dataset_folder["folders"][folder]) {
        if (
          dataset_folder["folders"][folder]["action"].includes(
            "recursive_deleted"
          )
        ) {
          let index =
            dataset_folder["folders"][folder]["action"].indexOf(
              "recursive_deleted"
            );
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
const updateJSONStructureGenerate = (progress = false) => {
  let starting_point = sodaJSONObj["starting-point"]["type"];
  if (sodaJSONObj["starting-point"]["type"] == "bf") {
    sodaJSONObj["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing-bf",
    };
  }
  if (sodaJSONObj["starting-point"]["type"] == "local") {
    var localDestination = require("path").dirname(
      sodaJSONObj["starting-point"]["local-path"]
    );
    var newDatasetName = require("path").basename(
      sodaJSONObj["starting-point"]["local-path"]
    );
    // if (progress == false) {
    //   delete sodaJSONObj["starting-point"]["local-path"];
    // }
    sodaJSONObj["generate-dataset"] = {
      destination: "local",
      path: localDestination,
      "dataset-name": newDatasetName,
      "if-existing": "merge",
      "generate-option": "new",
    };
    // delete bf account and dataset keys
    if ("bf-account-selected" in sodaJSONObj) {
      delete sodaJSONObj["bf-account-selected"];
    }
    if ("bf-dataset-selected" in sodaJSONObj) {
      delete sodaJSONObj["bf-dataset-selected"];
    }
    sodaJSONObj["starting-point"]["type"] = "new";
    recursive_remove_local_deleted_files(sodaJSONObj["dataset-structure"]);
  }
  if (sodaJSONObj["starting-point"]["type"] == "new") {
    if ($('input[name="generate-1"]:checked').length > 0) {
      if (
        $('input[name="generate-1"]:checked')[0].id === "generate-local-desktop"
      ) {
        var localDestination = $(
          "#input-destination-generate-dataset-locally"
        )[0].placeholder;
        if (localDestination === "Browse here") {
          localDestination = "";
        }
        var newDatasetName = $("#inputNewNameDataset").val().trim();
        // if (progress == false) {
        //   delete sodaJSONObj["starting-point"]["local-path"];
        // }
        sodaJSONObj["generate-dataset"] = {
          destination: "local",
          path: localDestination,
          "dataset-name": newDatasetName,
          "generate-option": "new",
          "if-existing": "new",
        };
        // delete bf account and dataset keys
        if ("bf-account-selected" in sodaJSONObj) {
          delete sodaJSONObj["bf-account-selected"];
        }
        if ("bf-dataset-selected" in sodaJSONObj) {
          delete sodaJSONObj["bf-dataset-selected"];
        }
      } else if (
        $('input[name="generate-1"]:checked')[0].id === "generate-upload-BF"
      ) {
        sodaJSONObj["generate-dataset"] = {
          destination: "bf",
          "generate-option": "new",
        };
        if ($("#current-bf-account-generate").text() !== "None") {
          if ("bf-account-selected" in sodaJSONObj) {
            sodaJSONObj["bf-account-selected"]["account-name"] = $(
              "#current-bf-account-generate"
            ).text();
          } else {
            sodaJSONObj["bf-account-selected"] = {
              "account-name": $("#current-bf-account-generate").text(),
            };
          }
        }
        // answer to Question if generate on BF, then: how to handle existing files and folders
        if ($('input[name="generate-4"]:checked').length > 0) {
          if (
            $('input[name="generate-4"]:checked')[0].id ===
            "generate-BF-dataset-options-existing"
          ) {
            if ($('input[name="generate-5"]:checked').length > 0) {
              if (
                $('input[name="generate-5"]:checked')[0].id ===
                "existing-folders-duplicate"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing"] =
                  "create-duplicate";
              } else if (
                $('input[name="generate-5"]:checked')[0].id ===
                "existing-folders-replace"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing"] = "replace";
              } else if (
                $('input[name="generate-5"]:checked')[0].id ===
                "existing-folders-merge"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing"] = "merge";
              } else if (
                $('input[name="generate-5"]:checked')[0].id ===
                "existing-folders-skip"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing"] = "skip";
              }
            }
            if ($('input[name="generate-6"]:checked').length > 0) {
              if (
                $('input[name="generate-6"]:checked')[0].id ===
                "existing-files-duplicate"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing-files"] =
                  "create-duplicate";
              } else if (
                $('input[name="generate-6"]:checked')[0].id ===
                "existing-files-replace"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing-files"] =
                  "replace";
              } else if (
                $('input[name="generate-6"]:checked')[0].id ===
                "existing-files-skip"
              ) {
                sodaJSONObj["generate-dataset"]["if-existing-files"] = "skip";
              }
            }
            // populate JSON obj with BF dataset and account
            if ($("#current-bf-dataset-generate").text() !== "None") {
              if ("bf-dataset-selected" in sodaJSONObj) {
                sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $(
                  "#current-bf-dataset-generate"
                ).text();
              } else {
                sodaJSONObj["bf-dataset-selected"] = {
                  "dataset-name": $("#current-bf-dataset-generate").text(),
                };
              }
            }
            // if generate to a new dataset, then update JSON object with a new dataset
          } else if (
            $('input[name="generate-4"]:checked')[0].id ===
            "generate-BF-dataset-options-new"
          ) {
            var newDatasetName = $("#inputNewNameDataset").val().trim();
            sodaJSONObj["generate-dataset"]["dataset-name"] = newDatasetName;
            sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
            sodaJSONObj["generate-dataset"]["if-existing-files"] =
              "create-duplicate";
            // if upload to a new bf dataset, then delete key below from JSON object
            if ("bf-dataset-selected" in sodaJSONObj) {
              delete sodaJSONObj["bf-dataset-selected"];
            }
          }
        }
      }
    }
    if (progress == true) {
      sodaJSONObj["starting-point"]["type"] = starting_point;
    }
  }
};

// function to call when users click on Continue at each step
const updateOverallJSONStructure = (id) => {
  if (id === allParentStepsJSON["high-level-folders"]) {
    document.getElementById("input-global-path").value = "My_dataset_folder/";
    var optionCards = document.getElementsByClassName(
      "option-card high-level-folders"
    );
    var newDatasetStructureJSONObj = { folders: {}, files: {} };
    var keys = [];
    for (var card of optionCards) {
      if ($(card).hasClass("checked")) {
        keys.push($(card).children()[0].innerText);
      }
    }
    // keys now have all the high-level folders from Step 2
    // datasetStructureJSONObj["folders"] have all the folders both from the old step 2 and -deleted folders in step 3

    // 1st: check if folder in keys, not in datasetStructureJSONObj["folders"], then add an empty object
    // 2nd: check if folder in datasetStructureJSONObj["folders"], add that to newDatasetStructureJSONObj["folders"]
    // 3rd: assign old to new
    // 1st
    keys.forEach((folder) => {
      if ("folders" in datasetStructureJSONObj) {
        if (Object.keys(datasetStructureJSONObj["folders"]).includes(folder)) {
          // clone a new json object
          newDatasetStructureJSONObj["folders"][folder] =
            datasetStructureJSONObj["folders"][folder];
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
    if ("folders" in datasetStructureJSONObj) {
      Object.keys(datasetStructureJSONObj["folders"]).forEach((folderKey) => {
        if (!keys.includes(folderKey)) {
          newDatasetStructureJSONObj["folders"][folderKey] =
            datasetStructureJSONObj["folders"][folderKey];
        }
      });
    }
    // 3rd
    datasetStructureJSONObj = newDatasetStructureJSONObj;
    listItems(datasetStructureJSONObj, "#items");
    getInFolder(
      ".single-item",
      "#items",
      organizeDSglobalPath,
      datasetStructureJSONObj
    );
  } else if (id === allParentStepsJSON["getting-started"]) {
    updateJSONStructureGettingStarted();
  } else if (id === allParentStepsJSON["metadata-files"]) {
    updateJSONStructureMetadataFiles();
  } else if (id === allParentStepsJSON["manifest-file"]) {
    updateJSONStructureManifest();
  } else if (id === allParentStepsJSON["organize-dataset"]) {
    updateJSONStructureDSstructure();
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
      reverseButtons: reverseSwalButtons,
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

const exitCurate = async (resetProgressTabs, start_over = false) => {
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

      currentTab = 0;
      wipeOutCurateProgress();
      $("#main_tabs_view")[0].click();
      globalGettingStarted1stQuestionBool = false;
      if (start_over) {
        $("#organize_dataset_btn").click();
      } else {
        // forceActionSidebar("show");
      }
    } else {
      globalGettingStarted1stQuestionBool = false;
      return;
    }
  } else {
    wipeOutCurateProgress();
  }
};

const wipeOutCurateProgress = () => {
  // set SODA json object back
  sodaJSONObj = {
    "starting-point": { type: "" },
    "dataset-structure": {},
    "metadata-files": {},
  };
  // uncheck all radio buttons and checkboxes
  $("#organize-section").find(".option-card").removeClass("checked");
  $("#organize-section")
    .find(".option-card.radio-button")
    .removeClass("non-selected");
  $("#organize-section")
    .find(".option-card.high-level-folders")
    .removeClass("disabled");
  $("#organize-section")
    .find(".option-card .folder-input-check")
    .prop("checked", false);
  $("#organize-section")
    .find(".parent-tabs.option-card")
    .removeClass("checked");
  $("#organize-section")
    .find(".parent-tabs.option-card.radio-button")
    .removeClass("non-selected");
  $("#organize-section")
    .find(".parent-tabs.option-card.high-level-folders")
    .removeClass("disabled");
  $("#organize-section")
    .find(".parent-tabs.option-card.folder-input-check")
    .prop("checked", false);
  $(".metadata-button.button-generate-dataset").removeClass("done");
  $("#organize-section input:checkbox").prop("checked", false);
  $("#organize-section input:radio").prop("checked", false);

  // set back local destination for folders to empty
  $("#input-destination-generate-dataset-locally").val("");
  $("#input-destination-getting-started-locally").val("");
  $("#input-destination-getting-started-locally").prop(
    "placeholder",
    "Browse here"
  );
  $("#input-destination-generate-dataset-locally").prop(
    "placeholder",
    "Browse here"
  );

  // set metadata file paths to empty
  $(".para-metadata-file-status").text("");

  // hide the generate manifest locally button
  $("#button-generate-manifest-locally").hide();

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
  datasetStructureJSONObj = { folders: {}, files: {} };

  // uncheck auto-generated manifest checkbox
  $("#generate-manifest-curate").prop("checked", false);
};

// once users click on option card: Organize dataset
document
  .getElementById("button-section-organize-dataset")
  .addEventListener("click", () => {
    $(".vertical-progress-bar").css("display", "flex");
    document.getElementById("generate-dataset-progress-tab").style.display =
      "none";
    showParentTab(currentTab, 1);
  });

document
  .getElementById("organize_dataset_btn")
  .addEventListener("click", () => {
    $(".vertical-progress-bar").css("display", "flex");
    document.getElementById("generate-dataset-progress-tab").style.display =
      "none";
    $("#save-progress-btn").css("display", "none");
    $("#start-over-btn").css("display", "none");
    showParentTab(currentTab, 1);
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
  updateJSONStructureGettingStarted();
  updateJSONStructureMetadataFiles();
  updateJSONStructureManifest();
  updateJSONStructureDSstructure();
  updateJSONStructureGenerate(true);
};

const saveSODAJSONProgress = (progressFileName) => {
  try {
    fs.mkdirSync(progressFilePath, { recursive: true });
  } catch (error) {
    log.error(error);
    console.log(error);
  }
  var filePath = path.join(progressFilePath, progressFileName + ".json");
  // record all information listed in SODA JSON Object before saving
  updateJSONObjectProgress();
  // delete sodaJSONObj["dataset-structure"] value that was added only for the Preview tree view
  if ("files" in sodaJSONObj["dataset-structure"]) {
    sodaJSONObj["dataset-structure"]["files"] = {};
  }
  // delete manifest files added for treeview
  for (var highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in
        sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
      sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ]["forTreeview"] === true
    ) {
      delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(sodaJSONObj));

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
const saveOrganizeProgressPrompt = () => {
  // check if "save-progress" key is in JSON object
  // if yes, keep saving to that file
  if ("save-progress" in sodaJSONObj) {
    // save to file
    saveSODAJSONProgress(sodaJSONObj["save-progress"]);
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
      reverseButtons: reverseSwalButtons,
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
          sodaJSONObj["save-progress"] = result.value.trim();
          saveSODAJSONProgress(result.value.trim());
          addOption(
            progressFileDropdown,
            result.value.trim(),
            result.value.trim() + ".json"
          );
        }
      }
    });
  }
};

$("#start-over-btn").click(() => {
  exitCurate(true, true);
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

  $(".ui.accordion").accordion();
  $(".content-button").click(function () {
    let section = $(this).data("section");

    if (section === "rename_existing_bf_dataset") {
      let rename_dataset_name = $("#rename_dataset_name").html();
      if (rename_dataset_name != "None" && rename_dataset_name != "") {
        $("#bf-rename-dataset-name").val(rename_dataset_name);
      } else {
        $("#bf-rename-dataset-name").val("");
      }
    }

    $("#main-nav").addClass("active");
    $("#sidebarCollapse").addClass("active");
    $(".section").addClass("fullShown");
  });

  $(".footer-div div button").click(() => {
    $("#main-nav").removeClass("active");
    if ($("#sidebarCollapse").hasClass("active")) {
      $("#sidebarCollapse").removeClass("active");
    }
    $(".section").removeClass("fullShown");
  });

  // Blackfynn transition warning message
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

initRipple = function (buttonEle) {
  var inside = document.createElement("div");
  inside.classList.add("btn_animated-inside");
  inside.innerHTML = buttonEle.innerHTML;
  buttonEle.innerHTML = "";
  buttonEle.appendChild(inside);
  inside.addEventListener("mousedown", function () {
    ripple(event, this);
  });
};
ripple = function (event, buttonEle) {
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
  button = buttons[i];
  initRipple(button);
}

// Input:
//  elementId:  string - id selector of the section the user will transition to from the Submit for pre-publishing tab
// transition from the pre-publishing review tab to the given prepare metadata tabs
const transitionFromPrePublishingChecklist = (elementId) => {
  // change is shown to the subtitle section
  $(".section.is-shown").removeClass("is-shown");

  // show the subtitle section instead
  $(`#${elementId}`).addClass("is-shown");

  $(".main-tabs-section").removeClass("show");
  $(".main-tabs-section").addClass("hide");

  // when a user clicks return change the tab they see
  document
    .getElementById("disseminate_dataset_section")
    .classList.remove("show");
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
