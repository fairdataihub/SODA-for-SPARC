// "use strict";

var metadataFile = "";

$(".button-individual-metadata.remove").click(() => {
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  $(metadataFileStatus).text("");
  $($(this).parents()[1]).find(".div-metadata-confirm").css("display", "none");
  $($(this).parents()[1]).find(".div-metadata-go-back").css("display", "flex");
});

$(".metadata-button").click(() => {
  metadataFile = $(this);
  $(".div-organize-generate-dataset.metadata").addClass("hide");
  var target = $(this).attr("data-next");
  $("#" + target).toggleClass("show");
  // document.getElementById("save-progress-btn").style.display = "none";
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("prevBtn").style.display = "none";
});

const confirmMetadataFilePath = (ev) => {
  $($(ev).parents()[1]).removeClass("show");
  $(".div-organize-generate-dataset.metadata").removeClass("hide");
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  // document.getElementById("save-progress-btn").style.display = "block";

  // Checking if metadata files are imported
  //// once users click "Confirm" or "Cancel", check if file is specified
  //// if yes: addClass 'done'
  //// if no: removeClass 'done'
  var errorMetadataFileMessages = [
    "",
    "Please only drag and drop a file!",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];
  var metadataFileStatus = $($(ev).parents()[1]).find(
    ".para-metadata-file-status"
  );
  if (!errorMetadataFileMessages.includes($(metadataFileStatus).text())) {
    $(metadataFile).addClass("done");
  } else {
    $(metadataFile).removeClass("done");
    $(metadataFileStatus).text("");
  }
};

$(".button-individual-metadata.go-back").click(() => {
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  $(metadataFileStatus).text("");
  $($(this).parents()[1]).removeClass("show");
  $(".div-organize-generate-dataset.metadata").removeClass("hide");
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  var errorMetadataFileMessages = [
    "",
    "Please only drag and drop a file!",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  if (!errorMetadataFileMessages.includes($(metadataFileStatus).text())) {
    $(metadataFile).addClass("done");
  } else {
    $(metadataFile).removeClass("done");
    $(metadataFileStatus).text("");
  }
});

const dropHandler = (ev, paraElement, metadataFile) => {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  document.getElementById(paraElement).innerHTML = "";

  if (ev.dataTransfer.items) {
    /// if users drag multiple files, only show first file
    var file = ev.dataTransfer.items[0];
    // If dropped items aren't files, reject them
    if (ev.dataTransfer.items[0].kind === "file") {
      var file = ev.dataTransfer.items[0].getAsFile();
      var metadataWithoutExtension = file.name.slice(0, file.name.indexOf("."));
      if (metadataWithoutExtension === metadataFile) {
        document.getElementById(paraElement).innerHTML = file.path;
        $($("#" + paraElement).parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#" + paraElement).parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
      } else {
        document.getElementById(paraElement).innerHTML =
          "<span style='color:red'>Your SPARC metadata file must be named and formatted exactly as listed above!</span>";
      }
    } else {
      document.getElementById(paraElement).innerHTML =
        "<span style='color:red'>Please only drag and drop a file!</span>";
    }
  }
};

////////////////// IMPORT EXISTING PROGRESS FILES ////////////////////////////////
const progressFileDropdown = document.getElementById("progress-files-dropdown");

/////////////////////////////// Helpers function for Import progress function /////////////////////////////
// function to load SODA with progress file
const progressFileParse = (ev) => {
  var fileName = $(ev).val();
  if (fileName !== "Select") {
    var filePath = path.join(progressFilePath, fileName);
    try {
      var content = fs.readFileSync(filePath);
      contentJson = JSON.parse(content);
      return contentJson;
    } catch (error) {
      log.error(error);
      console.log(error);
      document.getElementById("para-progress-file-status").innerHTML =
        "<span style='color:red'>" + error + "</span>";
      return {};
    }
  } else {
    return {};
  }
};

const importManifest = (object) => {
  if ("manifest-files" in object) {
    manifestFileCheck.checked = true;
  } else {
    manifestFileCheck.checked = false;
  }
};

const importMetadataFilesProgress = (object) => {
  populateMetadataProgress(false, "", "");
  if ("metadata-files" in object) {
    var metadataFileArray = Object.keys(object["metadata-files"]);
    metadataFileArray.forEach((element) => {
      var fullPath = object["metadata-files"][element]["path"];
      populateMetadataProgress(true, path.parse(element).name, fullPath);
    });
  }
};

const importDatasetStructure = (object) => {
  if ("dataset-structure" in object) {
    datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
    highLevelFoldersDisableOptions();
  } else {
    datasetStructureJSONObj = { folders: {}, files: {}, type: "" };
  }
};

const importGenerateDatasetStep = (object) => {
  if ("generate-dataset" in sodaJSONObj) {
    // Step 1: Where to generate the dataset
    if (sodaJSONObj["generate-dataset"]["destination"] === "local") {
      $("#generate-local-desktop").prop("checked", true);
      $($("#generate-local-desktop").parents()[2]).click();
      // Step 2: if generate locally, name and path
      $("#input-destination-generate-dataset-locally").prop(
        "placeholder",
        sodaJSONObj["generate-dataset"]["path"]
      );
      $("#input-destination-generate-dataset-locally").val(
        sodaJSONObj["generate-dataset"]["path"]
      );
      $("#btn-confirm-local-destination").click();
      $("#inputNewNameDataset").val(
        sodaJSONObj["generate-dataset"]["dataset-name"]
      );
      $("#btn-confirm-new-dataset-name").click();
    } else if (sodaJSONObj["generate-dataset"]["destination"] === "bf") {
      $("#generate-upload-BF").prop("checked", true);
      $($("#generate-upload-BF").parents()[2]).click();
      // Step 2: if generate on bf, choose bf account
      if (
        "bf-account-selected" in sodaJSONObj &&
        sodaJSONObj["bf-account-selected"]["account-name"] !== ""
      ) {
        var bfAccountSelected =
          sodaJSONObj["bf-account-selected"]["account-name"];
        $("#current-bf-account-generate").text(bfAccountSelected);
        $("#para-account-detail-curate").html("");
        client.invoke(
          "api_bf_account_details",
          bfAccountSelected,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
              showHideDropdownButtons("account", "hide");
            } else {
              $("#para-account-detail-curate").html(res);
              updateBfAccountList();
              // checkPrevDivForConfirmButton("account");
            }
          }
        );
        // $("#div-bf-account-btns").css("display", "flex");
        $("#btn-bf-account").trigger("click");
        // Step 3: choose to generate on an existing or new dataset
        if (
          "bf-dataset-selected" in sodaJSONObj &&
          sodaJSONObj["bf-dataset-selected"]["dataset-name"] !== ""
        ) {
          $("#generate-BF-dataset-options-existing").prop("checked", true);
          $($("#generate-BF-dataset-options-existing").parents()[2]).click();
          var bfDatasetSelected =
            sodaJSONObj["bf-dataset-selected"]["dataset-name"];
          setTimeout(() => {
            $("#current-bf-dataset-generate").text(bfDatasetSelected);
            $("#button-confirm-bf-dataset").click();
            // Step 4: Handle existing files and folders
            if ("if-existing" in sodaJSONObj["generate-dataset"]) {
              var existingFolderOption =
                sodaJSONObj["generate-dataset"]["if-existing"];
              $("#existing-folders-" + existingFolderOption).prop(
                "checked",
                true
              );
              $(
                $("#existing-folders-" + existingFolderOption).parents()[2]
              ).click();
            }
            if ("if-existing-files" in sodaJSONObj["generate-dataset"]) {
              var existingFileOption =
                sodaJSONObj["generate-dataset"]["if-existing-files"];
              $("#existing-files-" + existingFileOption).prop("checked", true);
              $(
                $("#existing-files-" + existingFileOption).parents()[2]
              ).click();
            }
          }, 3000);
        } else {
          $("#generate-BF-dataset-options-new").prop("checked", true);
          $($("#generate-BF-dataset-options-new").parents()[2]).click();
          $("#inputNewNameDataset").val(
            sodaJSONObj["generate-dataset"]["dataset-name"]
          );
          $("#inputNewNameDataset").keyup();
        }
      }
    }
  } else {
    // the block of code below reverts all the checks to option cards if applicable
    exitCurate();
    $("#previous-progress").prop("checked", true);
    $($("#previous-progress").parents()[2]).addClass("checked");
    $(
      $(
        $(
          $("#div-getting-started-previous-progress").parents()[0]
        ).siblings()[0]
      ).children()[0]
    ).toggleClass("non-selected");
  }
};

// check metadata files
const populateMetadataProgress = (
  populateBoolean,
  metadataFileName,
  localPath
) => {
  var metadataButtonsArray = $(".metadata-button.button-generate-dataset");
  var correspondingMetadataParaElement = {
    submission: ["para-submission-file-path", metadataButtonsArray[0]],
    dataset_description: [
      "para-ds-description-file-path",
      metadataButtonsArray[1],
    ],
    subjects: ["para-subjects-file-path", metadataButtonsArray[2]],
    samples: ["para-samples-file-path", metadataButtonsArray[3]],
    README: ["para-readme-file-path", metadataButtonsArray[4]],
    CHANGES: ["para-changes-file-path", metadataButtonsArray[5]],
  };
  if (populateBoolean) {
    if (metadataFileName in correspondingMetadataParaElement) {
      var paraElement = correspondingMetadataParaElement[metadataFileName];
      $("#" + paraElement[0]).text(localPath);
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-confirm")
        .css("display", "flex");
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-go-back")
        .css("display", "none");
      $(paraElement[1]).addClass("done");
    }
  } else {
    for (var key in correspondingMetadataParaElement) {
      var paraElement = correspondingMetadataParaElement[key];
      $("#" + paraElement[0]).text("");
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-confirm")
        .css("display", "none");
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-go-back")
        .css("display", "flex");
      $(paraElement[1]).removeClass("done");
    }
  }
};

//////////////////////// Main Import progress function
const loadProgressFile = (ev) => {
  document.getElementById("para-progress-file-status").innerHTML = "";
  document.getElementById("nextBtn").disabled = true;
  document.getElementById("div-progress-file-loader").style.display = "block";
  // create loading effect
  var jsonContent = progressFileParse(ev);
  if (JSON.stringify(jsonContent) !== "{}") {
    sodaJSONObj = jsonContent;
    setTimeout(() => {
      sodaJSONObj = jsonContent;
      importManifest(sodaJSONObj);
      importMetadataFilesProgress(sodaJSONObj);
      importDatasetStructure(sodaJSONObj);
      importGenerateDatasetStep(sodaJSONObj);
      document.getElementById("div-progress-file-loader").style.display =
        "none";
      document.getElementById("nextBtn").disabled = false;
      document.getElementById("para-progress-file-status").innerHTML =
        "<span style='color:var(--color-light-green)'>Previous work loaded successfully! Continue below.</span>";
    }, 1300);
  } else {
    sodaJSONObj =
      '{"starting-point":"new","dataset-structure":{},"metadata-files":{}}';
    setTimeout(() => {
      importManifest(sodaJSONObj);
      importMetadataFilesProgress(sodaJSONObj);
      importDatasetStructure(sodaJSONObj);
      importGenerateDatasetStep(sodaJSONObj);
      document.getElementById("div-progress-file-loader").style.display =
        "none";
      document.getElementById("para-progress-file-status").innerHTML = "";
    }, 500);
  }
};

function removeOptions(selectbox) {
  for (let i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
}

// Function to add options to dropdown list
function addOption(selectbox, text, value) {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
}

// function to load Progress dropdown
const importOrganizeProgressPrompt = () => {
  document.getElementById("para-progress-file-status").innerHTML = "";
  removeOptions(progressFileDropdown);
  addOption(progressFileDropdown, "Select", "Select");
  if (fs.existsSync(progressFilePath)) {
    var fileNames = fs.readdirSync(progressFilePath);
    if (fileNames.length > 0) {
      fileNames.forEach((item, i) => {
        addOption(progressFileDropdown, path.parse(item).name, item);
      });
    } else {
      document.getElementById("para-progress-file-status").innerHTML =
        "<span style='color:var(--color)'>There is no existing progress to load. Please choose one of the other options above!</span>";
    }
  } else {
    document.getElementById("para-progress-file-status").innerHTML =
      "<span style='color:var(--color)'>There is no existing progress to load. Please choose one of the other options above!</span>";
  }
};

importOrganizeProgressPrompt();

const openDropdownPrompt = async (dropdown) => {
  // if users edit current account
  if (dropdown === "bf") {
    var resolveMessage = "";
    if (bfAccountOptionsStatus === "") {
      if (Object.keys(bfAccountOptions).length === 1) {
        footerMessage = "No existing accounts to load. Please add an account.";
      } else {
        footerMessage =
          "<a href='https://github.com/bvhpatel/SODA/wiki/Connect-to-your-Blackfynn-account'>Need help?</a>";
      }
    } else {
      footerMessage = bfAccountOptionsStatus;
    }
    var bfacct;
    const { value: bfAccountSwal } = await Swal.fire({
      title: "Select your Blackfynn account",
      input: "select",
      showCloseButton: true,
      inputOptions: bfAccountOptions,
      confirmButtonText: "Confirm",
      denyButtonText: "Add account",
      showDenyButton: true,
      showCancelButton: false,
      inputValue: defaultBfAccount,
      reverseButtons: true,
      footer: footerMessage,
      didOpen: (ele) => {
        $(ele).find(".swal2-select").attr("id", "bfaccountdropdown");
        $("#bfaccountdropdown").removeClass("swal2-select");
        $("#bfaccountdropdown").addClass("w-100");
        $("#bfaccountdropdown").attr("data-live-search", "true");
        $("#bfaccountdropdown").wrap("<div class='search-select-box'></div>");
        $("#bfaccountdropdown").selectpicker();
        $("#bfaccountdropdown").attr("disabled", false);
      },
      inputValidator: (value) => {
        value = $("#bfaccountdropdown").val();
        return new Promise((resolve) => {
          if (value && value !== "Select") {
            bfacct = $("#bfaccountdropdown").val();
            resolve();
          } else {
            bfacct = undefined;
            resolve("You need to select an account!");
          }
        });
      },
    });
    if (bfAccountSwal === null) {
      if (bfacct !== "Select") {
        Swal.fire({
          title: "Loading your account details...",
          timer: 2000,
          timerProgressBar: true,
          allowEscapeKey: false,
          showConfirmButton: false,
        });
        $("#current-bf-account").text("");
        $("#current-bf-account-generate").text("");
        $("#current-bf-dataset").text("None");
        $("#current-bf-dataset-generate").text("None");
        defaultBfDataset = "Select dataset";
        tempDatasetListsSync();
        $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
          "display",
          "none"
        );
        $("#button-confirm-bf-dataset-getting-started").hide();

        $("#para-account-detail-curate").html("");
        $("#current-bf-dataset").text("None");
        showHideDropdownButtons("dataset", "hide");
        client.invoke("api_bf_account_details", bfacct, (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            Swal.fire({
              icon: "error",
              text: error,
              footer:
                "<a href='https://help.blackfynn.com/en/articles/1488536-creating-an-api-key-for-the-blackfynn-clients'>Why do I have this issue?</a>",
            });
            showHideDropdownButtons("account", "hide");
          } else {
            $("#para-account-detail-curate").html(res);
            $("#current-bf-account").text(bfacct);
            $("#current-bf-account-generate").text(bfacct);
            updateBfAccountList();
            client.invoke("api_bf_dataset_account", bfacct, (error, result) => {
              if (error) {
                log.error(error);
                console.log(error);
                var emessage = error;
                document.getElementById(
                  "para-filter-datasets-status-2"
                ).innerHTML =
                  "<span style='color: red'>" + emessage + "</span>";
              } else {
                datasetList = [];
                datasetList = result;
              }
            });
            showHideDropdownButtons("account", "hide");
            // checkPrevDivForConfirmButton("account");
          }
        });
      } else {
        Swal.showValidationMessage("Please select an account!");
      }
    } else if (bfAccountSwal === false) {
      // // else, if users click Add account
      showBFAddAccountBootbox();
    }
  } else if (dropdown === "dataset") {
    var bfDataset = "";
    // if users edit Current dataset
    datasetPermissionDiv.style.display = "block";
    $(datasetPermissionDiv)
      .find("#curatebfdatasetlist")
      .find("option")
      .empty()
      .append('<option value="Select dataset">Select dataset</option>')
      .val("Select dataset");
    $(datasetPermissionDiv)
      .find("#div-filter-datasets-progress-2")
      .css("display", "block");
    $(datasetPermissionDiv).find("#para-filter-datasets-status-2").text("");
    $("#para-continue-bf-dataset-getting-started").text("");
    $(datasetPermissionDiv)
      .find("#select-permission-list-2")
      .val("All")
      .trigger("change");
    $(datasetPermissionDiv)
      .find("#curatebfdatasetlist")
      .val("Select dataset")
      .trigger("change");
    initializeBootstrapSelect("#curatebfdatasetlist", "disabled");
    const { value: bfDS } = await Swal.fire({
      title:
        "<h3 style='margin-bottom:20px !important'>Please choose a dataset</h3>",
      html: datasetPermissionDiv,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        bfDataset = $("#curatebfdatasetlist").val();
        if (!bfDataset) {
          Swal.showValidationMessage("Please select a dataset!");
          return undefined;
        } else {
          if (bfDataset === "Select dataset") {
            Swal.showValidationMessage("Please select a dataset!");
            return undefined;
          } else {
            return bfDataset;
          }
        }
      },
    });
    // check return value
    if (bfDS) {
      $("#current-bf-dataset").text(bfDataset);
      $("#current-bf-dataset-generate").text(bfDataset);
      defaultBfDataset = bfDataset;
      tempDatasetListsSync();
      $("#dataset-loaded-message").hide();
      showHideDropdownButtons("dataset", "show");
      // checkPrevDivForConfirmButton("dataset");
    }
    // hide "Confirm" button if Current dataset set to None
    if ($("#current-bf-dataset-generate").text() === "None") {
      showHideDropdownButtons("dataset", "hide");
    } else {
      showHideDropdownButtons("dataset", "show");
    }
    // hide "Confirm" button if Current dataset under Getting started set to None
    if ($("#current-bf-dataset").text() === "None") {
      showHideDropdownButtons("dataset", "hide");
    } else {
      showHideDropdownButtons("dataset", "show");
    }
  }
};

$("#select-permission-list-2").change((e) => {
  $("#div-filter-datasets-progress-2").css("display", "block");
  // var datasetPermission = $("#select-permission-list-2").val();
  var bfacct = $("#current-bf-account").text();
  if (bfacct === "None") {
    document.getElementById("para-filter-datasets-status-2").innerHTML =
      "<span style='color:red'>Please select a Blackfynn account first!</span>";
    $(datasetPermissionDiv)
      .find("#div-filter-datasets-progress-2")
      .css("display", "none");
  } else {
    $("#curatebfdatasetlist").selectpicker();
    updateDatasetList(bfacct);
  }
});

const checkPrevDivForConfirmButton = (category) => {
  if (category === "account") {
    if (!$("#Question-generate-dataset-BF-account").hasClass("prev")) {
      $("#div-bf-account-btns").css("display", "flex");
      $("#div-bf-account-btns button").show();
    } else {
      $("#div-bf-account-btns").css("display", "none");
      $("#div-bf-account-btns button").hide();
    }
    if (!$("#Question-getting-started-BF-account").hasClass("prev")) {
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    } else {
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    }
  } else if (category === "dataset") {
    if (!$("#Question-generate-dataset-BF-dataset").hasClass("prev")) {
      $($("#button-confirm-bf-dataset").parent()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
    } else {
      $($("#button-confirm-bf-dataset").parent()[0]).css("display", "none");
      $("#button-confirm-bf-dataset").hide();
    }
    if (!$("#Question-getting-started-BF-dataset").hasClass("prev")) {
      $($("#button-confirm-bf-dataset-getting-started").parent()[0]).css(
        "display",
        "flex"
      );
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      $($("#button-confirm-bf-dataset-getting-started").parent()[0]).css(
        "display",
        "none"
      );
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  }
};

const tempDatasetListsSync = () => {
  $("#bfdatasetlist_renamedataset").val(defaultBfDataset);
  currentDatasetDropdowns = [
    bfDatasetListMetadata,
    bfUploadDatasetList,
    bfDatasetList,
    bfDatasetListDatasetStatus,
    bfDatasetListPermission,
    bfDatasetListPostCurationCuration,
    bfDatasetListPostCurationConsortium,
    bfDatasetListPostCurationPublish,
    datasetDescriptionFileDataset,
  ];
  var listSelectedIndex = bfDatasetListRenameDataset.selectedIndex;
  for (var list of currentDatasetDropdowns) {
    list.selectedIndex = listSelectedIndex;
  }
  postCurationListChange();
  showDatasetDescription();
  metadataDatasetlistChange();
  permissionDatasetlistChange();
  datasetStatusListChange();
  renameDatasetlistChange();
  postCurationListChange();
  showDatasetDescription();
};

const updateDatasetList = (bfaccount) => {
  $("#div-filter-datasets-progress-2").css("display", "block");
  removeOptions(curateDatasetDropdown);
  addOption(curateDatasetDropdown, "Select dataset", "Select dataset");
  initializeBootstrapSelect("#curatebfdatasetlist", "disabled");
  var filteredDatasets = [];
  // waiting for dataset list to load first before initiating BF dataset dropdown list
  setTimeout(() => {
    var myPermission = $(datasetPermissionDiv)
      .find("#select-permission-list-2")
      .val();
    if (myPermission.toLowerCase() === "all") {
      for (var i = 0; i < datasetList.length; i++) {
        filteredDatasets.push(datasetList[i].name);
      }
    } else {
      for (var i = 0; i < datasetList.length; i++) {
        if (datasetList[i].role === myPermission.toLowerCase()) {
          filteredDatasets.push(datasetList[i].name);
        }
      }
    }
    filteredDatasets.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    for (myitem in filteredDatasets) {
      var myitemselect = filteredDatasets[myitem];
      var option = document.createElement("option");
      option.textContent = myitemselect;
      option.value = myitemselect;
      curateDatasetDropdown.appendChild(option);
    }
    initializeBootstrapSelect("#curatebfdatasetlist", "show");
    document.getElementById("div-permission-list-2").style.display = "block";
    $("#div-filter-datasets-progress-2").css("display", "none");
    document.getElementById("para-filter-datasets-status-2").innerHTML =
      filteredDatasets.length +
      " dataset(s) where you have " +
      myPermission.toLowerCase() +
      " permissions were loaded successfully below.";
  }, 3000);
};

/// helper function to refresh live search dropdowns per dataset permission on change event
const initializeBootstrapSelect = (dropdown, action) => {
  if (action === "disabled") {
    $(dropdown).attr("disabled", true);
    $(".dropdown.bootstrap-select button").addClass("disabled");
    $(".dropdown.bootstrap-select").addClass("disabled");
    $(dropdown).selectpicker("refresh");
  } else if (action === "show") {
    $(dropdown).selectpicker();
    $(dropdown).selectpicker("refresh");
    $(dropdown).attr("disabled", false);
    $(".dropdown.bootstrap-select button").removeClass("disabled");
    $(".dropdown.bootstrap-select").removeClass("disabled");
  }
};

// function to show dataset or account Confirm buttons
const showHideDropdownButtons = (category, action) => {
  if (category === "dataset") {
    if (action === "show") {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
        "display",
        "flex"
      );
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset").hide();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
        "display",
        "none"
      );
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  } else if (category === "account") {
    if (action === "show") {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "flex");
      $("#div-bf-account-btns button").show();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    } else {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "none");
      $("#div-bf-account-btns button").hide();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    }
  }
};

const create_child_node = (
  oldFormatNode,
  nodeName,
  type,
  ext,
  openedState,
  selectedState,
  disabledState,
  selectedOriginalLocation,
  viewOptions
) => {
  /*
  oldFormatNode: node in the format under "dataset-structure" key in SODA object
  nodeName: text to show for each node (name)
  type: "folder" or "file"
  ext: track ext of files to match with the right CSS icons
  openedState, selectedState: states of a jstree node
  selectedOrginalLocation: current folder of selected items
  viewOptions: preview or moveItems
  */
  var newFormatNode = {
    text: nodeName,
    state: {
      opened: openedState,
      selected: selectedState,
      disabled: disabledState,
    },
    children: [],
    type: type + ext,
  };
  if (viewOptions === "moveItems") {
  } else {
    selectedOriginalLocation = "";
  }
  for (const [key, value] of Object.entries(oldFormatNode["folders"])) {
    if ("action" in oldFormatNode["folders"][key]) {
      if (!oldFormatNode["folders"][key]["action"].includes("deleted")) {
        if (key === selectedOriginalLocation) {
          newFormatNode.state.selected = true;
          newFormatNode.state.opened = true;
          var new_node = create_child_node(
            value,
            key,
            "folder",
            "",
            true,
            true,
            true,
            selectedOriginalLocation,
            viewOptions
          );
        } else {
          // newFormatNode.state.selected = false;
          // newFormatNode.state.opened = false;
          var new_node = create_child_node(
            value,
            key,
            "folder",
            "",
            false,
            false,
            false,
            selectedOriginalLocation,
            viewOptions
          );
        }
        newFormatNode["children"].push(new_node);
      }
    } else {
      if (key === selectedOriginalLocation) {
        newFormatNode.state.selected = true;
        newFormatNode.state.opened = true;
        var new_node = create_child_node(
          value,
          key,
          "folder",
          "",
          true,
          true,
          true,
          selectedOriginalLocation,
          viewOptions
        );
      } else {
        // newFormatNode.state.selected = false;
        // newFormatNode.state.opened = false;
        var new_node = create_child_node(
          value,
          key,
          "folder",
          "",
          false,
          false,
          false,
          selectedOriginalLocation,
          viewOptions
        );
      }
      newFormatNode["children"].push(new_node);
    }
  }
  if ("files" in oldFormatNode) {
    for (const [key, value] of Object.entries(oldFormatNode["files"])) {
      if (
        [
          ".png",
          ".PNG",
          ".xls",
          ".xlsx",
          ".pdf",
          ".txt",
          ".jpeg",
          ".JPEG",
          ".csv",
          ".CSV",
          ".DOC",
          ".DOCX",
          ".doc",
          ".docx",
        ].includes(path.parse(key).ext)
      ) {
        nodeType = "file " + path.parse(key).ext.slice(1);
      } else {
        nodeType = "file other";
      }
      if ("action" in oldFormatNode["files"][key]) {
        if (!oldFormatNode["files"][key]["action"].includes("deleted")) {
          var new_node = {
            text: key,
            state: { disabled: true },
            type: nodeType,
          };
          newFormatNode["children"].push(new_node);
        }
      } else {
        var new_node = { text: key, state: { disabled: true }, type: nodeType };
        newFormatNode["children"].push(new_node);
      }
    }
  }
  return newFormatNode;
};

const recursiveExpandNodes = (object) => {
  // var newFormatNode = {"text": nodeName,
  // "state": {"opened": openedState, "selected": selectedState},
  // "children": [], "type": type + ext}
  if (object.state.selected) {
  }
};

// var selected = false;
var selectedPath;
var selectedNode;
var jsTreeData = create_child_node(
  datasetStructureJSONObj,
  "My_dataset_folder",
  "folder",
  "",
  true,
  true,
  true,
  "",
  "moveItems"
);
var jstreeInstance = document.getElementById("data");
$(document).ready(() => {
  $("#data").jstree({
    core: {
      check_callback: true,
      data: {},
      expand_selected_onload: true,
    },
    plugins: ["types", "changed"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });
});

const moveItems = async (ev, category) => {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  var selectedOrginalLocation = filtered[filtered.length - 1];
  /*
  Reset previously selected items first, create jsTreeData again with updated dataset structure JSON object.
  Always remember to exclude/delete:
      1. metadata files added for preview show
      2. added manifest files for show (for preview) before showing the tree here
  */
  if ("files" in datasetStructureJSONObj) {
    datasetStructureJSONObj["files"] = {};
  }
  for (var highLevelFol in datasetStructureJSONObj["folders"]) {
    if (
      "manifest.xlsx" in
        datasetStructureJSONObj["folders"][highLevelFol]["files"] &&
      datasetStructureJSONObj["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ]["forTreeview"]
    ) {
      delete datasetStructureJSONObj["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
  jsTreeData = create_child_node(
    datasetStructureJSONObj,
    "My_dataset_folder",
    "folder",
    "",
    true,
    true,
    true,
    selectedOrginalLocation,
    "moveItems"
  );
  // Note: somehow, html element "#data" was destroyed after closing the Swal popup.
  // Creating the element again after it was destroyed.
  if (!jstreeInstance) {
    $("#items").prepend('<div id="data"></div>');
    jstreeInstance = document.getElementById("data");
  } else {
    jstreeInstance.style.display = "block";
  }
  $(jstreeInstance).jstree(true).settings.core.data = jsTreeData;
  $(jstreeInstance).jstree(true).refresh();
  selectedPath = undefined;
  selectedNode = "";

  // first, convert datasetStructureJSONObj to jsTree's json structure
  // show swal2 with jstree in here
  const { value: folderDestination } = await Swal.fire({
    title:
      "<h3 style='margin-bottom:20px !important'>Please choose a folder destination:</h3>",
    html: jstreeInstance,
    showCloseButton: true,
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      Swal.resetValidationMessage();
      if (!selectedPath) {
        Swal.showValidationMessage("Please select a folder destination!");
        return undefined;
      } else {
        if (selectedNode === "My_dataset_folder") {
          Swal.showValidationMessage(
            "Items cannot be moved to this level of the dataset!"
          );
          return undefined;
        } else {
          return selectedPath;
        }
      }
    },
  });
  if (folderDestination) {
    Swal.fire({
      title:
        "Are you sure you want to move selected item(s) to: " +
        selectedPath +
        "?",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        // loading effect
        Swal.fire({
          title: "Moving items...",
          timer: 1500,
          timerProgressBar: true,
          allowEscapeKey: false,
          showConfirmButton: false,
        });
        // action to move and delete here
        // multiple files/folders
        if ($("div.single-item.selected-item").toArray().length > 1) {
          $("div.single-item.selected-item")
            .toArray()
            .forEach((element) => {
              let itemToMove = element.textContent;
              var itemType;
              if ($(element.firstElementChild).hasClass("myFile")) {
                itemType = "files";
              } else if ($(element.firstElementChild).hasClass("myFol")) {
                itemType = "folders";
              }
              moveItemsHelper(itemToMove, selectedPath, itemType);
            });
          // only 1 file/folder
        } else {
          let itemToMove = ev.parentElement.textContent;
          var itemType;
          if ($(ev).hasClass("myFile")) {
            itemType = "files";
          } else if ($(ev).hasClass("myFol")) {
            itemType = "folders";
          }
          moveItemsHelper(itemToMove, selectedPath, itemType);
        }
      }
    });
  }
};

const moveItemsHelper = (item, destination, category) => {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  var selectedNodeList = destination.split("/").slice(1);
  var destinationPath = getRecursivePath(
    selectedNodeList,
    datasetStructureJSONObj
  );

  // handle duplicates in destination folder
  if (category === "files") {
    var uiFilesWithoutExtension = {};
    if (JSON.stringify(destinationPath["files"]) !== "{}") {
      for (var file in destinationPath["files"]) {
        uiFilesWithoutExtension[path.parse(file).name] = 1;
      }
    }
    var fileBaseName = path.basename(item);
    var originalFileNameWithoutExt = path.parse(fileBaseName).name;
    var fileNameWithoutExt = originalFileNameWithoutExt;
    var j = 1;
    while (fileNameWithoutExt in uiFilesWithoutExtension) {
      fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
      j++;
    }
    if ("action" in myPath[category][item]) {
      if (!myPath[category][item]["action"].includes("moved")) {
        myPath[category][item]["action"].push("moved");
      }
      if (fileNameWithoutExt !== originalFileNameWithoutExt) {
        myPath[category][item]["action"].push("renamed");
      }
    } else {
      myPath[category][item]["action"] = ["moved"];
      if (fileNameWithoutExt !== originalFileNameWithoutExt) {
        myPath[category][item]["action"].push("renamed");
      }
    }
    destinationPath[category][
      fileNameWithoutExt + path.parse(fileBaseName).ext
    ] = myPath[category][item];
  } else if (category === "folders") {
    var uiFolders = {};
    if (JSON.stringify(destinationPath["folders"]) !== "{}") {
      for (var folder in destinationPath["folders"]) {
        uiFolders[folder] = 1;
      }
    }
    var originalFolderName = path.basename(item);
    var renamedFolderName = originalFolderName;
    var j = 1;
    while (renamedFolderName in uiFolders) {
      renamedFolderName = `${originalFolderName} (${j})`;
      j++;
    }
    if ("action" in myPath[category][item]) {
      myPath[category][item]["action"].push("moved");
      addMovedRecursively(myPath[category][item]);
      if (renamedFolderName !== originalFolderName) {
        myPath[category][item]["action"].push("renamed");
      }
    } else {
      myPath[category][item]["action"] = ["moved"];
      addMovedRecursively(myPath[category][item]);
      if (renamedFolderName !== originalFolderName) {
        myPath[category][item]["action"].push("renamed");
      }
    }
    destinationPath[category][renamedFolderName] = myPath[category][item];
  }
  //delete item from the original location
  delete myPath[category][item];
  listItems(myPath, "#items");
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );
};

// helper functions to add "moved" to leaf nodes a.k.a files
const addMovedRecursively = (object) => {
  Object.keys(object["files"]).forEach((key) => {
    var file = object["files"][key];
    if ("action" in file) {
      if (!file["action"].includes("moved")) {
        file["action"].push("moved");
      }
    } else {
      file["action"] = ["moved"];
    }
  });
  Object.keys(object["folders"]).forEach((key) => {
    var folder = object["folders"][key];
    if ("action" in folder) {
      folder["action"].push("moved");
    } else {
      folder["action"] = ["moved"];
    }
    if (Object.keys(folder["files"]).length > 0) {
      Object.keys(folder["files"]).forEach((ele) => {
        if ("action" in folder["files"][ele]) {
          if (!folder["files"][ele]["action"].includes("moved")) {
            folder["files"][ele]["action"].push("moved");
          }
        } else {
          folder["files"][ele]["action"] = ["moved"];
        }
      });
    }
    if (Object.keys(folder["folders"]).length > 0) {
      addMovedRecursively(folder);
    }
  });
};

$(jstreeInstance).on("changed.jstree", (e, data) => {
  if (data.node) {
    selectedNode = data.node.text;
    selectedPath = data.instance.get_path(data.node, "/");
    var parentNode = $(jstreeInstance).jstree("get_selected");
  }
});

$(jstreeInstance).on("open_node.jstree", (event, data) => {
  data.instance.set_type(data.node, "folder open");
});

$(jstreeInstance).on("close_node.jstree", (event, data) => {
  data.instance.set_type(data.node, "folder closed");
});

var jstreePreview = document.getElementById("div-dataset-tree-preview");
$(document).ready(() => {
  $(jstreePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });
});

$(jstreePreview).on("open_node.jstree", (event, data) => {
  data.instance.set_type(data.node, "folder open");
});

$(jstreePreview).on("close_node.jstree", (event, data) => {
  data.instance.set_type(data.node, "folder closed");
});

const showTreeViewPreview = () => {
  datasetStructureJSONObj["files"] = sodaJSONObj["metadata-files"];
  if (manifestFileCheck.checked) {
    for (var key in datasetStructureJSONObj["folders"]) {
      if (highLevelFolders.includes(key)) {
        if (
          !("manifest.xlsx" in datasetStructureJSONObj["folders"][key]["files"])
        ) {
          datasetStructureJSONObj["folders"][key]["files"]["manifest.xlsx"] = {
            forTreeview: true,
          };
        }
      }
    }
  }
  var jsTreePreviewData = create_child_node(
    datasetStructureJSONObj,
    "My_dataset_folder",
    "folder",
    "",
    true,
    false,
    false,
    "",
    "preview"
  );
  $(jstreePreview).jstree(true).settings.core.data = jsTreePreviewData;
  $(jstreePreview).jstree(true).refresh();
};
