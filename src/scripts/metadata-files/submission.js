/*
This file contains all of the functions related to the submission.xlsx file
*/

/// save airtable api key
const addAirtableKeyBtn = document.getElementById("button-add-airtable-key");

// Save grant information
const presavedAwardArray1 = document.getElementById(
  "select-presaved-grant-info-list"
);
const addAwardBtn = document.getElementById("button-add-award");
const deleteMilestoneBtn = document.getElementById("button-delete-milestone");
const editMilestoneBtn = document.getElementById("button-edit-milestone");
const addMilestoneBtn = document.getElementById("button-add-milestone");
const deleteAwardBtn = document.getElementById("button-delete-award");
const addNewMilestoneBtn = document.getElementById(
  "button-default-save-milestone"
);
const saveInformationBtn = document.getElementById("button-save-milestone");
var sparcAwardEditMessage = $("#div-SPARC-edit-awards");

// Prepare Submission File
const airtableAccountBootboxMessage =
  "<form><div class='form-group row'><label for='bootbox-airtable-key' class='col-sm-3 col-form-label'> API Key:</label><div class='col-sm-9'><input id='bootbox-airtable-key' type='text' class='form-control'/></div></div></form>";
const generateSubmissionBtn = document.getElementById("generate-submission");

function resetSubmission() {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over!",
    focusCancel: true,
    heightAuto: false,
    icon: "warning",
    reverseButtons: reverseSwalButtons,
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
      $("#Question-prepare-submission-1").removeClass("prev");
      $("#Question-prepare-submission-1").nextAll().removeClass("show");
      $("#Question-prepare-submission-1").nextAll().removeClass("prev");
      $("#Question-prepare-submission-1-new")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-submission-1-new .folder-input-check").prop(
        "checked",
        false
      );

      var inputFields = $("#Question-prepare-submission-1")
        .nextAll()
        .find("input");
      var textAreaFields = $("#Question-prepare-submission-1")
        .nextAll()
        .find("textarea");
      var selectFields = $("#Question-prepare-submission-1")
        .nextAll()
        .find("select");

      for (var field of inputFields) {
        $(field).val("");
      }
      for (var field of textAreaFields) {
        $(field).val("");
      }
      milestoneTagify1.removeAllTags();
      for (var field of selectFields) {
        $(field).val("Select");
      }
      checkAirtableStatus("");
    }
  });
}

function helpMilestoneSubmission() {
  var filepath = "";
  // var award = $("#submission-sparc-award").val();
  // read from milestonePath to see if associated milestones exist or not
  var informationJson = {};
  // informationJson = parseJson(milestonePath);
  // if (Object.keys(informationJson).includes(award)) {
  //   informationJson[award] = milestoneObj;
  // } else {
  Swal.fire({
    title: "Do you have the Data Deliverables document ready to import?",
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: "Yes, let's import it",
    cancelButtonText: "No",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: "Importing the Data Deliverables document",
        html: `<div class="container-milestone-upload" style="display: flex;margin:10px"><input class="milestone-upload-text" id="input-milestone-select" onclick="openDDDimport()" style="text-align: center;height: 40px;border-radius: 0;background: #f5f5f5; border: 1px solid #d0d0d0; width: 100%" type="text" readonly placeholder="Browse here"/></div>`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        preConfirm: () => {
          if (
            $("#input-milestone-select").attr("placeholder") === "Browse here"
          ) {
            Swal.showValidationMessage("Please select a file");
          } else {
            filepath = $("#input-milestone-select").attr("placeholder");
            return {
              filepath: filepath,
            };
          }
        },
      }).then((result) => {
        Swal.close();

        const filepath = result.value.filepath;
        var award = $("#submission-sparc-award");
        client.invoke("api_extract_milestone_info", filepath, (error, res) => {
          if (error) {
            var emessage = userError(error);
            log.error(error);
            console.error(error);
            Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              icon: "error",
              text: `${emessage}`,
            });
          } else {
            milestoneObj = res;
            createMetadataDir();
            var informationJson = {};
            informationJson = parseJson(milestonePath);
            informationJson[award] = milestoneObj;
            fs.writeFileSync(milestonePath, JSON.stringify(informationJson));
            Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              timer: 3000,
              timerProgressBar: true,
              icon: "success",
              text: `Successfully loaded your DataDeliverables.docx document`,
            });
            removeOptions(descriptionDateInput);
            milestoneTagify1.removeAllTags();
            milestoneTagify1.settings.whitelist = [];
            changeAwardInput();
          }
        });
      });
    }
  });
  // }
}

function openDDDimport() {
  const dialog = require("electron").remote.dialog;
  const BrowserWindow = require("electron").remote.BrowserWindow;

  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "DOCX", extensions: ["docx"] }],
    },
    (filepath) => {
      if (filepath) {
        if (filepath.length > 0) {
          if (filepath != null) {
            document.getElementById("input-milestone-select").placeholder =
              filepath[0];
            ipcRenderer.send(
              "track-event",
              "Success",
              "Prepare Metadata - Add DDD",
              defaultBfAccount
            );
          }
        }
      }
    }
  );
}

// onboarding for submission file
function onboardingSubmission() {
  setTimeout(function () {
    introJs()
      .setOptions({
        steps: [
          {
            // title: "1. Help with your SPARC Award number",
            element: document.querySelector("#a-help-submission-Airtable"),
            intro:
              "Click here to connect SODA with your Airtable account and automatically retrieve your SPARC award number.",
          },
          {
            // title: "2. Help with your milestone information",
            element: document.querySelector("#a-help-submission-milestones"),
            intro:
              "Click here to import your Data Deliverables document for SODA to automatically retrieve your milestone and completion date.",
          },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        disableInteraction: false,
      })
      .start();
  }, 500);
}

// generateSubmissionFile function takes all the values from the preview card's spans
function generateSubmissionFile() {
  var awardRes = $("#submission-sparc-award").val();
  var dateRes = $("#submission-completion-date").val();
  var milestonesRes = $("#selected-milestone-1").val();
  let milestoneValue = [""];
  if (milestonesRes !== "") {
    milestoneValue = JSON.parse(milestonesRes);
  }
  if (awardRes === "" || dateRes === "Select" || milestonesRes === "") {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: "Please fill in all of the required fields.",
      title: "Incomplete information",
    });
  } else {
    ipcRenderer.send("open-folder-dialog-save-submission", "submission.xlsx");
  }
}

function changeAwardInput() {
  var ddBolean;
  document.getElementById("input-milestone-date").value = "";
  actionEnterNewDate("none");
  milestoneTagify1.removeAllTags();
  milestoneTagify1.settings.whitelist = [];
  removeOptions(descriptionDateInput);
  addOption(descriptionDateInput, "Select an option", "Select");

  award = $("#submission-sparc-award");
  var informationJson = parseJson(milestonePath);

  var completionDateArray = [];
  var milestoneValueArray = [];
  completionDateArray.push("Enter my own date");

  /// when DD is provided
  if (award in informationJson) {
    ddBolean = true;
    var milestoneObj = informationJson[award];
    // Load milestone values once users choose an award number
    var milestoneKey = Object.keys(milestoneObj);

    /// add milestones to Tagify suggestion tag list and options to completion date dropdown
    for (var i = 0; i < milestoneKey.length; i++) {
      milestoneValueArray.push(milestoneKey[i]);
      for (var j = 0; j < milestoneObj[milestoneKey[i]].length; j++) {
        completionDateArray.push(
          milestoneObj[milestoneKey[i]][j]["Expected date of completion"]
        );
      }
    }
    milestoneValueArray.push("Not specified in the Data Deliverables document");
  } else {
    ddBolean = false;
  }
  milestoneTagify1.settings.whitelist = milestoneValueArray;
  for (var i = 0; i < completionDateArray.length; i++) {
    addOption(
      descriptionDateInput,
      completionDateArray[i],
      completionDateArray[i]
    );
  }
  return ddBolean;
}

function actionEnterNewDate(action) {
  document.getElementById(
    "div-submission-enter-different-date-1"
  ).style.display = action;
  document.getElementById(
    "div-submission-enter-different-date-3"
  ).style.display = action;
}

const submissionDateInput = document.getElementById("input-milestone-date");

$(document).ready(function () {
  ipcRenderer.on("selected-metadata-submission", (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" +
          filename +
          "' already exists in " +
          dirpath[0] +
          ". Do you want to replace it?";
        Swal.fire({
          icon: "warning",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showConfirmButton: true,
          showCancelButton: true,
          cancelButtonText: "No",
          confirmButtonText: "Yes",
        }).then((result) => {
          if (result.isConfirmed) {
            generateSubmissionHelper(dirpath, destinationPath);
          }
        });
      } else {
        Swal.fire({
          title: "Generating the submission.xlsx file",
          html: "Please wait...",
          timer: 15000,
          allowEscapeKey: false,
          allowOutsideClick: false,
          showConfirmButton: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {});
        generateSubmissionHelper(dirpath, destinationPath);
      }
    }
  });

  ipcRenderer.on("selected-existing-submission", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById(
          "existing-submission-file-destination"
        ).placeholder = filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing submission.xlsx",
          defaultBfAccount
        );
        if (
          document.getElementById("existing-submission-file-destination")
            .placeholder !== "Browse here"
        ) {
          $("#div-confirm-existing-submission-import").show();
          $($("#div-confirm-existing-submission-import button")[0]).show();
        } else {
          $("#div-confirm-existing-submission-import").hide();
          $($("#div-confirm-existing-submission-import button")[0]).hide();
        }
      } else {
        document.getElementById(
          "existing-submission-file-destination"
        ).placeholder = "Browse here";
        $("#div-confirm-existing-submission-import").hide();
      }
    } else {
      document.getElementById(
        "existing-submission-file-destination"
      ).placeholder = "Browse here";
      $("#div-confirm-existing-submission-import").hide();
    }
  });
});

function generateSubmissionHelper(fullpath, destinationPath) {
  var awardRes = $("#submission-sparc-award").val();
  var dateRes = $("#submission-completion-date").val();
  var milestonesRes = $("#selected-milestone-1").val();
  let milestoneValue = [""];
  if (milestonesRes !== "") {
    milestoneValue = JSON.parse(milestonesRes);
  }
  var json_arr = [];
  json_arr.push({
    award: awardRes,
    date: dateRes,
    milestone: milestoneValue[0].value,
  });
  if (milestoneValue.length > 0) {
    for (var index = 1; index < milestoneValue.length; index++) {
      json_arr.push({
        award: "",
        date: "",
        milestone: milestoneValue[index].value,
      });
    }
  }
  json_str = JSON.stringify(json_arr);
  if (fullpath != null) {
    client.invoke(
      "api_save_submission_file",
      destinationPath,
      json_str,
      (error, res) => {
        if (error) {
          var emessage = userError(error);
          log.error(error);
          console.error(error);
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "error",
            text: emessage,
            title: "Failed to generate the submission file",
          });
          ipcRenderer.send(
            "track-event",
            "Error",
            "Prepare Metadata - Create Submission",
            defaultBfDataset
          );
        } else {
          Swal.fire({
            title:
              "The submission.xlsx file has been successfully generated at the specified location.",
            icon: "success",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          ipcRenderer.send(
            "track-event",
            "Success",
            "Prepare Metadata - Create Submission",
            defaultBfDataset
          );
        }
      }
    );
  }
}

$("#submission-completion-date").change(function () {
  const text = $("#submission-completion-date").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate =
          new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById(
          "milestone_date_picker"
        ).value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        $("#submission-completion-date").append(
          $("<option>", {
            value: input_date,
            text: input_date,
          })
        );
        var $option = $("#submission-completion-date").children().last();
        $option.prop("selected", true);
      }
    });
  }
});

$("#input-milestone-select-reupload").click(function () {
  document.getElementById(
    "para-milestone-document-info-long-reupload"
  ).style.display = "none";
  ipcRenderer.send("open-file-dialog-milestone-doc-reupload");
});

$("#cancel-reupload-DDD").click(function () {
  $("#Question-prepare-submission-reupload-DDD").removeClass("show prev");
  $("#div-confirm-select-SPARC-awards").show();
  $("#div-confirm-select-SPARC-awards button").show();
  $("#div-confirm-select-SPARC-awards button").click();
});

// show which Airtable first div to show -< based on Airtable connection status
function changeAirtableDiv(divHide, divShow, buttonHide, buttonShow) {
  $("#" + divHide).css("display", "none");
  $("#" + buttonHide).css("display", "none");
  $("#" + divShow).css("display", "flex");
  $("#" + buttonShow).css("display", "flex");
  $("#" + buttonShow + " button").show();
  $("#submission-connect-Airtable").text("Yes, let's connect");
}

// import existing Changes/README file
function showExistingSubmissionFile(type) {
  if (
    $(`#existing-submission-file-destination`).prop("placeholder") !==
      "Browse here" &&
    $(`#Question-prepare-submission-2`).hasClass("show")
  ) {
    Swal.fire({
      title: `Are you sure you want to import a different submission file?`,
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        ipcRenderer.send(`open-file-dialog-existing-submission`);
        document.getElementById(
          `existing-submission-file-destination`
        ).placeholder = "Browse here";
        $(`#div-confirm-existing-submission-import`).hide();
        $($(`#div-confirm-existing-submission-import button`)[0]).hide();
        $(`#Question-prepare-submission-2`).removeClass("show");
      }
    });
  } else {
    ipcRenderer.send(`open-file-dialog-existing-submission`);
  }
}

function importExistingSubmissionFile(type) {
  var filePath = $(`#existing-submission-file-destination`).prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      `Please select a path to your submission.xlsx file`,
      "error"
    );
  } else {
    if (path.parse(filePath).base !== "submission.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: `Your file must be named submission.xlsx to be imported to SODA.`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });
    } else {
      Swal.fire({
        title: `Loading an existing submission.xlsx file`,
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
      setTimeout(loadExistingSubmissionFile(filePath), 1000);
    }
  }
}

// function to load existing README/CHANGES files
function loadExistingSubmissionFile(filepath) {
  client.invoke("api_load_existing_submission_file", filepath, (error, res) => {
    if (error) {
      var emessage = userError(error);
      console.log(error);
      Swal.fire({
        title: "Failed to load the existing submission.xlsx file.",
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });
    } else {
      loadSubmissionFileToUI(res);
    }
  });
}

function loadSubmissionFileToUI(data) {
  milestoneTagify1.removeAllTags();
  $("#submission-completion-date").val("Select");
  $("#submission-sparc-award").val("");
  // 1. populate milestones
  for (var milestone in data["Milestone achieved"]) {
    milestoneTagify1.addTags(milestone);
  }
  if (data["SPARC Award number"] !== "") {
    $("#submission-sparc-award").val(data["SPARC Award number"]);
  }
  if (data["Milestone completion date"] !== "") {
    $("#submission-completion-date").val(data["Milestone completion date"]);
  }
  Swal.hideLoading();
}
