// event listeners for changes open dropdown prompts
document.querySelectorAll(".changes-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "bf");
  });
});

document.querySelectorAll(".changes-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "dataset");
  });
});

// event listeners for readme open dropdown prompts
document.querySelectorAll(".readme-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "bf");
  });
});

document.querySelectorAll(".readme-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "dataset");
  });
});

// function to raise a warning for empty fields before generating changes or readme
const generateRCFilesHelper = (type) => {
  let textValue = $(`#textarea-create-${type}`).val().trim();
  if (textValue === "") {
    Swal.fire({
      title: "Incomplete information",
      text: "Plase fill in the textarea.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
      showCancelButton: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
    return "empty";
  }
};

// generate changes or readme either locally (uploadBFBoolean=false) or onto Pennsieve (uploadBFBoolean=true)
const generateRCFiles = async (uploadBFBoolean, fileType) => {
  let result = generateRCFilesHelper(fileType);
  let bfDataset = document.getElementById(`bf_dataset_load_${fileType}`).innerText.trim();
  let upperCaseLetters = fileType.toUpperCase() + ".txt";

  if (result === "empty") {
    return;
  }

  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the changes or readme file to Pennsieve
    const supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // Check if dataset is locked after running pre-flight checks
    const isLocked = await api.isDatasetLocked(window.defaultBfDataset, bfDataset);
    if (isLocked) {
      await Swal.fire({
        icon: "info",
        title: `${bfDataset} is locked from editing`,
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

      return;
    }

    let { value: continueProgress } = await Swal.fire({
      title: `Any existing ${upperCaseLetters} file in the high-level folder of the selected dataset will be replaced.`,
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
  }
  Swal.fire({
    title: `Generating the ${upperCaseLetters} file`,
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});

  if (uploadBFBoolean) {
    let textValue = $(`#textarea-create-${fileType}`).val().trim();
    //pass in only CHANGES or README (the extension .txt is added in the backend)
    try {
      let upload_rc_file = await client.post(
        "/prepare_metadata/readme_changes_file",
        {
          text: textValue,
        },
        {
          params: {
            file_type: upperCaseLetters,
            selected_account: window.defaultBfDataset,
            selected_dataset: bfDataset,
          },
        }
      );
      let res = upload_rc_file.data;
      const size = res["size"];

      Swal.fire({
        title: `Successfully generated the ${upperCaseLetters} file on your Pennsieve dataset.`,
        icon: "success",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_METADATA,
        kombuchaEnums.Action.GENERATE_METADATA,
        upperCaseLetters === "README.txt"
          ? kombuchaEnums.Label.README_TXT
          : kombuchaEnums.Label.CHANGES_TXT,
        kombuchaEnums.Status.SUCCESS,
        createEventDataPrepareMetadata("Pennsieve", 1)
      );

      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_METADATA,
        kombuchaEnums.Action.GENERATE_METADATA,
        upperCaseLetters === "README.txt"
          ? kombuchaEnums.Label.README_TXT_SIZE
          : kombuchaEnums.Label.CHANGES_TXT_SIZE,
        kombuchaEnums.Status.SUCCESS,
        createEventDataPrepareMetadata("Pennsieve", size)
      );
    } catch (error) {
      clientError(error);
      let emessage = error.response.data.message;

      Swal.fire({
        title: `Failed to generate the ${upperCaseLetters} file`,
        html: emessage,
        icon: "warning",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_METADATA,
        kombuchaEnums.Action.GENERATE_METADATA,
        upperCaseLetters === "README.txt"
          ? kombuchaEnums.Label.README_TXT
          : kombuchaEnums.Label.CHANGES_TXT,
        kombuchaEnums.Status.FAIL,
        createEventDataPrepareMetadata("Pennsieve", 1)
      );
    }
  } else {
    ipcRenderer.send(`open-destination-generate-${fileType}-locally`);
  }
};

var changesDestinationPath = "";
var readmeDestinationPath = "";

$(document).ready(function () {
  ipcRenderer.on("selected-destination-generate-changes-locally", (event, dirpath, filename) => {
    filename = "CHANGES.txt";
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      changesDestinationPath = destinationPath;
      $("#div-confirm-destination-changes-locally").css("display", "flex");
      $($("#div-confirm-destination-changes-locally").children()[0]).css("display", "flex");
      document.getElementById("input-destination-generate-changes-locally").placeholder =
        dirpath[0];
    } else {
      $("#div-confirm-destination-changes-locally").css("display", "none");
      changesDestinationPath = "";
      document.getElementById("input-destination-generate-changes-locally").placeholder =
        "Browse here";
    }
  });
  ipcRenderer.on("selected-destination-generate-readme-locally", (event, dirpath, filename) => {
    filename = "README.txt";
    let data = $("#textarea-create-readme").val().trim();
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      readmeDestinationPath = destinationPath;
      $("#div-confirm-destination-readme-locally").css("display", "flex");
      $($("#div-confirm-destination-readme-locally").children()[0]).css("display", "flex");
      document.getElementById("input-destination-generate-readme-locally").placeholder = dirpath[0];
    } else {
      $("#div-confirm-destination-readme-locally").css("display", "none");
      readmeDestinationPath = "";
      document.getElementById("input-destination-generate-readme-locally").placeholder =
        "Browse here";
    }
  });

  ipcRenderer.on("selected-existing-changes", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById("existing-changes-file-destination").placeholder = filepath[0];

        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.CHANGES,
          window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          "Existing",
          Destinations.PENNSIEVE
        );
        if (
          document.getElementById("existing-changes-file-destination").placeholder !== "Browse here"
        ) {
          $("#div-confirm-existing-changes-import").show();
          $($("#div-confirm-existing-changes-import button")[0]).show();
        } else {
          $("#div-confirm-existing-changes-import").hide();
          $($("#div-confirm-existing-changes-import button")[0]).hide();
        }
      } else {
        document.getElementById("existing-changes-file-destination").placeholder = "Browse here";
        $("#div-confirm-existing-changes-import").hide();
      }
    } else {
      document.getElementById("existing-changes-file-destination").placeholder = "Browse here";
      $("#div-confirm-existing-changes-import").hide();
    }
  });

  ipcRenderer.on("selected-existing-readme", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById("existing-readme-file-destination").placeholder = filepath[0];

        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.README,
          window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          "Existing",
          Destinations.LOCAL
        );
        if (
          document.getElementById("existing-readme-file-destination").placeholder !== "Browse here"
        ) {
          $("#div-confirm-existing-readme-import").show();
          $($("#div-confirm-existing-readme-import button")[0]).show();
        } else {
          $("#div-confirm-existing-readme-import").hide();
          $($("#div-confirm-existing-readme-import button")[0]).hide();
        }
      } else {
        document.getElementById("existing-readme-file-destination").placeholder = "Browse here";
        $("#div-confirm-existing-readme-import").hide();
      }
    } else {
      document.getElementById("existing-readme-file-destination").placeholder = "Browse here";
      $("#div-confirm-existing-readme-import").hide();
    }
  });

  $("#bf_dataset_load_changes").on("DOMSubtreeModified", function () {
    if ($("#Question-prepare-changes-2").hasClass("show")) {
      if (!$("#Question-prepare-changes-6").hasClass("show")) {
        $("#Question-prepare-changes-2").removeClass("show");
        $("#textarea-create-changes").val("");
      }
    }
    if ($("#bf_dataset_load_changes").text().trim() !== "None") {
      $("#div-check-bf-import-changes").css("display", "flex");
      $($("#div-check-bf-import-changes").children()[0]).show();
    } else {
      $("#div-check-bf-import-changes").css("display", "none");
    }
  });

  $("#bf_dataset_load_readme").on("DOMSubtreeModified", function () {
    if ($("#Question-prepare-readme-2").hasClass("show")) {
      if (!$("#Question-prepare-readme-6").hasClass("show")) {
        $("#Question-prepare-readme-2").removeClass("show");
        $("#textarea-create-readme").val("");
      }
    }
    if ($("#bf_dataset_load_readme").text().trim() !== "None") {
      $("#div-check-bf-import-readme").css("display", "flex");
      $($("#div-check-bf-import-readme").children()[0]).show();
    } else {
      $("#div-check-bf-import-readme").css("display", "none");
    }
  });

  $("#bf_dataset_generate_readme").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_readme").text().trim() !== "None") {
      $("#div-check-bf-generate-readme").css("display", "flex");
    } else {
      $("#div-check-bf-generate-readme").css("display", "none");
    }
  });

  $("#bf_dataset_generate_changes").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_changes").text().trim() !== "None") {
      $("#div-check-bf-generate-changes").css("display", "flex");
    } else {
      $("#div-check-bf-generate-changes").css("display", "none");
    }
  });
});

// write Readme or Changes files (save locally)
async function saveRCFile(type) {
  var result = generateRCFilesHelper(type);
  if (result === "empty") {
    return;
  }
  var { value: continueProgress } = await Swal.fire({
    title: `Any existing ${type.toUpperCase()}.txt file in the specified location will be replaced.`,
    text: "Are you sure you want to continue?",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Yes",
  });
  if (!continueProgress) {
    return;
  }
  let data = $(`#textarea-create-${type}`).val().trim();
  let destinationPath;
  if (type === "changes") {
    destinationPath = changesDestinationPath;
  } else {
    destinationPath = readmeDestinationPath;
  }
  fs.writeFile(destinationPath, data, (err) => {
    if (err) {
      console.log(err);
      log.error(err);
      var emessage = userErrorMessage(error);
      Swal.fire({
        title: `Failed to generate the existing ${type}.txt file`,
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
        didOpen: () => {
          Swal.hideLoading();
        },
      });

      logMetadataForAnalytics(
        "Error",
        type === "changes" ? MetadataAnalyticsPrefix.CHANGES : MetadataAnalyticsPrefix.README,
        window.AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.LOCAL
      );
    } else {
      if (type === "changes") {
        var newName = path.join(path.dirname(destinationPath), "CHANGES.txt");
      } else {
        var newName = path.join(path.dirname(destinationPath), "README.txt");
      }
      fs.rename(destinationPath, newName, async (err) => {
        if (err) {
          console.log(err);
          log.error(err);
          Swal.fire({
            title: `Failed to generate the ${type}.txt file`,
            html: err,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            icon: "error",
            didOpen: () => {
              Swal.hideLoading();
            },
          });

          ipcRenderer.send(
            "track-kombucha",
            kombuchaEnums.Category.PREPARE_METADATA,
            kombuchaEnums.Action.GENERATE_METADATA,
            type === "changes" ? kombuchaEnums.Label.CHANGES_TXT : kombuchaEnums.Label.README_TXT,
            kombuchaEnums.Status.FAIL,
            createEventDataPrepareMetadata("Local", 1)
          );
        } else {
          Swal.fire({
            title: `The ${type.toUpperCase()}.txt file has been successfully generated at the specified location.`,
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          });

          // log the size of the metadata file that was generated at varying levels of granularity
          let size = await getFileSizeInBytes(destinationPath);

          ipcRenderer.send(
            "track-kombucha",
            kombuchaEnums.Category.PREPARE_METADATA,
            kombuchaEnums.Action.GENERATE_METADATA,
            type === "changes" ? kombuchaEnums.Label.CHANGES_TXT : kombuchaEnums.Label.README_TXT,
            kombuchaEnums.Status.SUCCESS,
            createEventDataPrepareMetadata("Local", 1)
          );

          ipcRenderer.send(
            "track-kombucha",
            kombuchaEnums.Category.PREPARE_METADATA,
            kombuchaEnums.Action.GENERATE_METADATA,
            type === "changes"
              ? kombuchaEnums.Label.CHANGES_TXT_SIZE
              : kombuchaEnums.Label.README_TXT_SIZE,
            kombuchaEnums.Status.SUCCESS,
            createEventDataPrepareMetadata("Local", size)
          );
        }
      });
    }
  });
}

// show filebrowser for existing local Changes/README file
function showExistingRCFile(type) {
  if (
    $(`#existing-${type}-file-destination`).prop("placeholder") !== "Browse here" &&
    $(`#Question-prepare-${type}-2`).hasClass("show")
  ) {
    Swal.fire({
      title: `Are you sure you want to import a different ${type} file?`,
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: window.reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        ipcRenderer.send(`open-file-dialog-existing-${type}`);
        document.getElementById(`existing-${type}-file-destination`).placeholder = "Browse here";
        $(`#div-confirm-existing-${type}-import`).hide();
        $($(`#div-confirm-existing-${type}-import button`)[0]).hide();
        $(`#Question-prepare-${type}-2`).removeClass("show");
      }
    });
  } else {
    ipcRenderer.send(`open-file-dialog-existing-${type}`);
  }
}

// start over for Readme and Changes
function resetRCFile(type) {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over!",
    focusCancel: true,
    heightAuto: false,
    icon: "warning",
    reverseButtons: window.reverseSwalButtons,
    showCancelButton: true,
    text: "Are you sure you want to start over and reset your progress?",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $(`#Question-prepare-${type}-1`).removeClass("prev");
      $(`#Question-prepare-${type}-1`).nextAll().removeClass("show");
      $(`#Question-prepare-${type}-1`).nextAll().removeClass("prev");
      $(`#Question-prepare-${type}-1`)
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $(`#Question-prepare-${type}-1 .option-card`)
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $(`#Question-prepare-${type}-1 .option-card .folder-input-check`).prop("checked", false);
      $(`#existing-${type}-file-destination`).attr("placeholder", "Browse here");
      $(`#textarea-create-${type}`).val("");

      $(`#input-destination-generate-${type}-locally`).attr("placeholder", "Browse here");
      $(`#div-confirm-destination-${type}-locally`).css("display", "none");

      $(`#button-generate-${type}`).show();
    }
  });
}

// import a Pennsieve Readme or Changes file
const getRC = async (type) => {
  // loading popup
  Swal.fire({
    title: `Loading an existing ${type} file`,
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  if (type === "CHANGES.txt") {
    var shortName = "changes";
  } else {
    var shortName = "readme";
  }
  let datasetName = $(`#bf_dataset_load_${shortName}`).text().trim();

  log.info(`Getting ${type} file for dataset ${datasetName}`);

  //pass in only CHANGES or README (the extension .txt is added in the backend)
  try {
    let import_rc_file = await client.get(`/prepare_metadata/readme_changes_file`, {
      params: {
        file_type: path.parse(type).name,
        selected_account: window.defaultBfDataset,
        selected_dataset: datasetName,
      },
    });
    let res = import_rc_file.data.text;

    logMetadataForAnalytics(
      "Success",
      shortName === "changes" ? MetadataAnalyticsPrefix.CHANGES : MetadataAnalyticsPrefix.README,
      window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.PENNSIEVE
    );
    if (res.trim() !== "") {
      $(`#textarea-create-${shortName}`).val(res.trim());
      Swal.fire({
        title: "Loaded successfully!",
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      });
    } else {
      Swal.fire({
        icon: "warning",
        text: `The current ${type} file is empty. Please edit it in the following textarea.`,
        heightAuto: false,
        backdrop: "rgba(0,0,0,0.4)",
      });
    }
    $($(`#button-fake-confirm-existing-bf-${shortName}-file-load`).siblings()[0]).hide();
    $(`#button-fake-confirm-existing-bf-${shortName}-file-load`).click();
  } catch (error) {
    clientError(error);

    Swal.fire({
      title: `Failed to load existing ${type} file`,
      text: error.response.data.message,
      icon: "warning",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logMetadataForAnalytics(
      "Error",
      shortName === "changes" ? MetadataAnalyticsPrefix.CHANGES : MetadataAnalyticsPrefix.README,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
};

// helper function to import a local readme/changes file
function importExistingRCFile(type) {
  var filePath = $(`#existing-${type}-file-destination`).prop("placeholder");
  if (type === "changes") {
    var upperCaseLetter = "CHANGES";
  } else {
    var upperCaseLetter = "README";
  }
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      `Please select a path to your ${upperCaseLetter}.txt file`,
      "error"
    );

    logMetadataForAnalytics(
      "Error",
      type === "changes" ? MetadataAnalyticsPrefix.CHANGES : MetadataAnalyticsPrefix.README,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  } else {
    if (path.parse(filePath).base !== `${upperCaseLetter}.txt`) {
      Swal.fire({
        title: "Incorrect file name",
        text: `Your file must be named '${upperCaseLetter}.txt' to be imported to SODA.`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      logMetadataForAnalytics(
        "Error",
        type === "changes" ? MetadataAnalyticsPrefix.CHANGES : MetadataAnalyticsPrefix.README,
        window.AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
    } else {
      Swal.fire({
        title: `Loading an existing '${upperCaseLetter}.txt' file`,
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then((result) => {});
      setTimeout(loadExistingRCFile(filePath, type), 1000);
    }
  }
}

// main function to load existing README/CHANGES files
const loadExistingRCFile = (filepath, type) => {
  // read file
  fs.readFile(filepath, "utf8", function (err, data) {
    if (err) {
      let emessage = userErrorMessage(error);
      console.log(err);
      log.error(err);
      Swal.fire({
        title: "Failed to import existing file",
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      ipcRenderer.send(
        "track-event",
        "Error",
        `Prepare Metadata - ${type} - Existing - Local`,
        "Local",
        1
      );

      ipcRenderer.send("track-event", "Error", `Prepare Metadata - ${type}`);
    } else {
      // populate textarea
      $(`#textarea-create-${type}`).val(data);

      Swal.fire({
        title: "Loaded successfully!",
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      });

      logMetadataForAnalytics(
        "Success",
        type === "changes" ? MetadataAnalyticsPrefix.CHANGES : MetadataAnalyticsPrefix.README,
        window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );

      $(`#div-confirm-existing-${type}-import`).hide();
      $($(`#div-confirm-existing-${type}-import button`)[0]).hide();
      $(`#button-fake-confirm-existing-${type}-file-load`).click();
    }
  });
};
