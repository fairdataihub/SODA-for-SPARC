//SHARED VARIABLES

const guided_dataset_name = $("#guided-dataset-name-input");
const guided_dataset_subtitle = document.getElementById(
  "guided-dataset-subtitle-input"
);
const guided_dataset_subtitle_char_count = document.getElementById(
  "guided-subtitle-char-count"
);

const create_dataset_button = $("#guided-create-empty-dataset");
let current_selected_folder = $("#code-card");
let current_progression_tab = $("#prepare-dataset-progression-tab");
let current_sub_step = $("#guided-basic-description-tab");
let current_sub_step_capsule = $("#guided-basic-description-capsule");

const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};
const disableProgressButton = () => {
  $("#guided-next-button").prop("disabled", true);
};

const validateGuidedBasicDescriptionTabInput = () => {
  //True if dataset name and dataset subtitle inputs are valid
  if (
    check_forbidden_characters_bf(
      $("#guided-dataset-name-input").val().trim()
    ) ||
    $("#guided-dataset-name-input").val().trim().length == 0 ||
    $("#guided-dataset-subtitle-input").val().trim().length == 0
  ) {
    $("#guided-next-button").prop("disabled", true);
  } else {
    $("#guided-next-button").prop("disabled", false);
  }
};

var guidedFilesElement;
var guidedTargetElement;
const guidedDrop = (ev) => {
  irregularFolderArray = [];
  var action = "";
  guidedFilesElement = ev.dataTransfer.files;
  guidedTargetElement = ev.target;
  // get global path from guided-input-global-path element
  var currentPath = guidedOrganizeDSglobalPath.val();
  console.log(currentPath);
  var jsonPathArray = currentPath.split("/");
  console.log(jsonPathArray);
  var filtered = jsonPathArray.slice(1).filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
  console.log(datasetStructureJSONObj);
  console.log(myPath);
  var importedFiles = {};
  var importedFolders = {};
  var nonAllowedDuplicateFiles = [];
  ev.preventDefault();
  var uiFiles = {};
  var uiFolders = {};

  for (var file in myPath["files"]) {
    uiFiles[path.parse(file).base] = 1;
  }
  for (var folder in myPath["folders"]) {
    uiFolders[path.parse(folder).name] = 1;
  }
  for (var i = 0; i < ev.dataTransfer.files.length; i++) {
    var ele = ev.dataTransfer.files[i].path;
    detectIrregularFolders(path.basename(ele), ele);
  }
  var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contain any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
  if (irregularFolderArray.length > 0) {
    Swal.fire({
      title:
        "The following folders contain non-allowed characters in their names. How should we handle them?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        irregularFolderArray.join("</br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Replace characters with (-)",
      denyButtonText: "Remove characters",
      cancelButtonText: "Cancel",
      footer: footer,
      didOpen: () => {
        $(".swal-popover").popover();
      },
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        action = "replace";
      } else if (result.isDenied) {
        action = "remove";
      } else {
        return;
      }
      guidedDropHelper(
        guidedFilesElement,
        guidedTargetElement,
        action,
        myPath,
        importedFiles,
        importedFolders,
        nonAllowedDuplicateFiles,
        uiFiles,
        uiFolders
      );
    });
  } else {
    guidedDropHelper(
      guidedFilesElement,
      guidedTargetElement,
      "",
      myPath,
      importedFiles,
      importedFolders,
      nonAllowedDuplicateFiles,
      uiFiles,
      uiFolders
    );
  }
  console.log("drop allowed");
};

function guidedDropHelper(
  ev1,
  ev2,
  action,
  myPath,
  importedFiles,
  importedFolders,
  nonAllowedDuplicateFiles,
  uiFiles,
  uiFolders
) {
  for (var i = 0; i < ev1.length; i++) {
    /// Get all the file information
    var itemPath = ev1[i].path;
    var itemName = path.parse(itemPath).base;
    var duplicate = false;
    var statsObj = fs.statSync(itemPath);
    // check for duplicate or files with the same name
    for (var j = 0; j < ev2.children.length; j++) {
      if (itemName === ev2.children[j].innerText) {
        duplicate = true;
        break;
      }
    }
    /// check for File duplicate
    if (statsObj.isFile()) {
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
        Swal.fire({
          icon: "error",
          html: "<p>This interface is only for including files in the SPARC folders. If you are trying to add SPARC metadata file(s), you can do so in the next Step.</p>",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
        break;
      } else {
        if (
          JSON.stringify(myPath["files"]) === "{}" &&
          JSON.stringify(importedFiles) === "{}"
        ) {
          importedFiles[path.parse(itemPath).base] = {
            path: itemPath,
            basename: path.parse(itemPath).base,
          };
        } else {
          for (var objectKey in myPath["files"]) {
            if (objectKey !== undefined) {
              var nonAllowedDuplicate = false;
              if (itemPath === myPath["files"][objectKey]["path"]) {
                nonAllowedDuplicateFiles.push(itemPath);
                nonAllowedDuplicate = true;
                break;
              }
            }
          }
          if (!nonAllowedDuplicate) {
            var j = 1;
            var fileBaseName = itemName;
            var originalFileNameWithoutExt = path.parse(fileBaseName).name;
            var fileNameWithoutExt = originalFileNameWithoutExt;
            while (fileBaseName in uiFiles || fileBaseName in importedFiles) {
              fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
              fileBaseName = fileNameWithoutExt + path.parse(fileBaseName).ext;
              j++;
            }
            importedFiles[fileBaseName] = {
              path: itemPath,
              basename: fileBaseName,
            };
          }
        }
      }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
        Swal.fire({
          icon: "error",
          text: "Only SPARC folders can be added at this level. To add a new SPARC folder, please go back to Step 2.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        var j = 1;
        var originalFolderName = itemName;
        var renamedFolderName = originalFolderName;

        if (irregularFolderArray.includes(itemPath)) {
          if (action !== "ignore" && action !== "") {
            if (action === "remove") {
              renamedFolderName = removeIrregularFolders(itemName);
            } else if (action === "replace") {
              renamedFolderName = replaceIrregularFolders(itemName);
            }
            importedFolders[renamedFolderName] = {
              path: itemPath,
              "original-basename": originalFolderName,
            };
          }
        } else {
          while (
            renamedFolderName in uiFolders ||
            renamedFolderName in importedFolders
          ) {
            renamedFolderName = `${originalFolderName} (${j})`;
            j++;
          }
          importedFolders[renamedFolderName] = {
            path: itemPath,
            "original-basename": originalFolderName,
          };
        }
      }
    }
  }
  if (nonAllowedDuplicateFiles.length > 0) {
    var listElements = showItemsAsListBootbox(nonAllowedDuplicateFiles);
    Swal.fire({
      icon: "warning",
      html:
        "The following files are already imported into the current location of your dataset: <p><ul>" +
        listElements +
        "</ul></p>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }
  // // now append to UI files and folders
  if (Object.keys(importedFiles).length > 0) {
    for (var element in importedFiles) {
      myPath["files"][importedFiles[element]["basename"]] = {
        path: importedFiles[element]["path"],
        type: "local",
        description: "",
        "additional-metadata": "",
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(
        myPath["files"][importedFiles[element]["basename"]]["path"]
      ).base;
      if (element !== originalName) {
        myPath["files"][importedFiles[element]["basename"]]["action"].push(
          "renamed"
        );
      }
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)"  style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        importedFiles[element]["basename"] +
        "</div></div>";
      $(appendString).appendTo(ev2);
      listItems(myPath, "#items");
      getInFolder(
        ".single-item",
        "#items",
        organizeDSglobalPath,
        datasetStructureJSONObj
      );
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
    }
  }
  if (Object.keys(importedFolders).length > 0) {
    for (var element in importedFolders) {
      myPath["folders"][element] = {
        type: "local",
        path: importedFolders[element]["path"],
        folders: {},
        files: {},
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(myPath["folders"][element]["path"]).name;
      let placeholderString =
        '<div id="placeholder_element" class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="fas fa-file-import"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">Loading ' +
        element +
        "... </div></div>";
      $(placeholderString).appendTo(ev2);
      // await listItems(myPath, "#items");
      listItems(myPath, "#items");
      if (element !== originalName) {
        myPath["folders"][element]["action"].push("renamed");
      }
      populateJSONObjFolder(
        action,
        myPath["folders"][element],
        importedFolders[element]["path"]
      );
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        element +
        "</div></div>";
      $("#placeholder_element").remove();
      $(appendString).appendTo(ev2);
      listItems(myPath, "#items");
      getInFolder(
        ".single-item",
        "#items",
        organizeDSglobalPath,
        datasetStructureJSONObj
      );
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
    }
  }
  $("body").removeClass("waiting");
}

$(document).ready(() => {
  //Handles high-level progress and their respective panels opening and closing
  $(".guided--progression-tab").on("click", function () {
    const selectedTab = $(this);
    selectedTab.siblings().removeClass("selected-tab");
    selectedTab.addClass("selected-tab");

    const tabPanelId = selectedTab
      .attr("id")
      .replace("progression-tab", "parent-tab");
    const tabPanel = $("#" + tabPanelId);
    tabPanel.siblings().hide();
    tabPanel.show();
  });
  //click new dataset card until from existing and from Pennsieve functionalities are built.
  $("#guided-curate-new-dataset-card").click();
  $("#guided-dataset-name-input").on("keyup", () => {
    let newName = $("#guided-dataset-name-input").val().trim();
    if (newName !== "") {
      if (check_forbidden_characters_bf(newName)) {
        $("#guided-dataset-name-input-warning-message").text(
          "A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>."
        );
        $("#guided-dataset-name-input-warning-message").show();
        disableProgressButton();
      } else {
        /*change this to continue button $("#create-pennsieve-dataset").hide(); */
        $("#guided-dataset-name-input-warning-message").hide();
        validateGuidedBasicDescriptionTabInput();
      }
    } else {
      $("#guided-dataset-name-input-warning-message").hide();
    }
  });

  $("#guided-dataset-subtitle-input").on("keyup", () => {
    countCharacters(
      guided_dataset_subtitle,
      guided_dataset_subtitle_char_count
    );
    validateGuidedBasicDescriptionTabInput();
  });

  $("#prepare-dataset-tab").on("click", () => {
    $("#guided-basic-description-tab").hide();
    $("#guided-prepare-dataset-parent-tab").css("display", "flex");
  });

  $("#guided-input-destination-getting-started-locally").on("click", () => {
    ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
  });

  $(".guided--card-container > div").on("click", function () {
    const selectedTab = $(this);
    if (selectedTab.attr("id") == "guided-generate-dataset-new-card") {
      enableProgressButton();
      $("#guided-next-button").click();
    }
    selectedTab.siblings().removeClass("checked");
    selectedTab.siblings().addClass("non-selected");
    selectedTab.removeClass("non-selected");
    selectedTab.addClass("checked");

    const tabPanelId = selectedTab.attr("id").replace("-card", "-panel");
    const tabPanel = $("#" + tabPanelId);
    tabPanel.siblings().hide();
    tabPanel.css("display", "flex");
  });

  $("#pennsieve-account-confirm-button").on("click", () => {
    sodaJSONObj["generate-dataset"]["destination"] = "bf";
    enableProgressButton();
    $("#guided-next-button").click();
  });

  const complete_curr_question = (questionID) => {
    questionID.css("opacity", ".5");
    nextQuestion = questionID.next();
    nextQuestion.css("display", "flex");
    nextId = nextQuestion.attr("id");
    document.getElementById(nextId).scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  //next button click handler
  $("#guided-next-button").on("click", () => {
    //individual sub step processes
    if (current_sub_step.attr("id") == "guided-basic-description-tab") {
      sodaJSONObj["mode"] = "guided";
      sodaJSONObj["starting-point"] = {};
      sodaJSONObj["starting-point"]["type"] = "new";
      sodaJSONObj["dataset-structure"] = {};
      datasetStructureJSONObj = { folders: {}, files: {} };
      sodaJSONObj["metadata-files"] = {};
      sodaJSONObj["manifest-files"] = {};
      sodaJSONObj["generate-dataset"] = {};

      sodaJSONObj["metadata"] = {};
      sodaJSONObj["generate-dataset"]["dataset-name"] = $(
        "#guided-dataset-name-input"
      )
        .val()
        .trim();
      sodaJSONObj["metadata"]["subtitle"] = $("#guided-dataset-subtitle-input")
        .val()
        .trim();

      console.log(sodaJSONObj);
    }

    if (current_sub_step.attr("id") == "guided-dataset-generation-tab") {
      if ($("#generate-dataset-local-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "local";
      }
      if ($("#generate-dataset-pennsieve-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "bf";
      }
    }

    //if more tabs in parent tab, go to next tab and update capsule
    if (current_sub_step.next().attr("id") !== undefined) {
      current_sub_step.hide();
      current_sub_step = current_sub_step.next();
      current_sub_step_capsule.css("background-color", "#ddd");
      current_sub_step_capsule = current_sub_step_capsule.next();
      current_sub_step_capsule.css(
        "background-color",
        "var(--color-light-green)"
      );
      current_sub_step.css("display", "flex");
    } else {
      //go to next tab
      current_progression_tab.next().click();
    }
    disableProgressButton();
    console.log(sodaJSONObj);
    console.log(current_sub_step);
    console.log(current_progression_tab);
  });

  $("#guided-generate-dataset-button").on("click", async function () {
    alert("guided generate dataset button pushed");
    //updateJSONStructureGenerate();
    if (sodaJSONObj["starting-point"]["type"] === "local") {
      sodaJSONObj["starting-point"]["type"] = "new";
    }

    let dataset_name = "";
    let dataset_destination = "";

    if ("bf-dataset-selected" in sodaJSONObj) {
      dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
      dataset_destination = "Pennsieve";
    } else if ("generate-dataset" in sodaJSONObj) {
      if ("destination" in sodaJSONObj["generate-dataset"]) {
        let destination = sodaJSONObj["generate-dataset"]["destination"];
        if (destination == "local") {
          dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
          dataset_destination = "Local";
        }
        if (destination == "bf") {
          dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
          dataset_destination = "Pennsieve";
        }
      }
    }
    /*
    generateProgressBar.value = 0;
    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "Please wait while we verify a few things...";*/

    if (dataset_destination == "Pennsieve") {
      let supplementary_checks = await run_pre_flight_checks(false);
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }
    }

    //  from here you can modify
    document.getElementById("para-please-wait-new-curate").innerHTML =
      "Please wait...";
    document.getElementById(
      "para-new-curate-progress-bar-error-status"
    ).innerHTML = "";
    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "";
    document.getElementById("div-new-curate-progress").style.display = "none";

    progressBarNewCurate.value = 0;

    // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
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
        ]["forTreeview"]
      ) {
        delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol][
          "files"
        ]["manifest.xlsx"];
      }
    }

    client.invoke(
      "api_check_empty_files_folders",
      sodaJSONObj,
      (error, res) => {
        if (error) {
          var emessage = userError(error);
          document.getElementById(
            "para-new-curate-progress-bar-error-status"
          ).innerHTML =
            "<span style='color: red;'> Error: " + emessage + "</span>";
          document.getElementById("para-please-wait-new-curate").innerHTML = "";
          console.error(error);
          $("#sidebarCollapse").prop("disabled", false);
        } else {
          document.getElementById("para-please-wait-new-curate").innerHTML =
            "Please wait...";
          log.info("Continue with curate");
          var message = "";
          error_files = res[0];
          error_folders = res[1];

          if (error_files.length > 0) {
            var error_message_files =
              backend_to_frontend_warning_message(error_files);
            message += error_message_files;
          }

          if (error_folders.length > 0) {
            var error_message_folders =
              backend_to_frontend_warning_message(error_folders);
            message += error_message_folders;
          }

          if (message) {
            message += "Would you like to continue?";
            message = "<div style='text-align: left'>" + message + "</div>";
            Swal.fire({
              icon: "warning",
              html: message,
              showCancelButton: true,
              cancelButtonText: "No, I want to review my files",
              focusCancel: true,
              confirmButtonText: "Yes, Continue",
              backdrop: "rgba(0,0,0, 0.4)",
              reverseButtons: reverseSwalButtons,
              heightAuto: false,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then((result) => {
              if (result.isConfirmed) {
                console.log("Continue");
                initiate_generate();
              } else {
                console.log("Stop");
                $("#sidebarCollapse").prop("disabled", false);
                document.getElementById(
                  "para-please-wait-new-curate"
                ).innerHTML = "Return to make changes";
                document.getElementById("div-generate-comeback").style.display =
                  "flex";
              }
            });
          } else {
            initiate_generate();
          }
        }
      }
    );
  });
});
