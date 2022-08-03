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
      $("#Question-prepare-submission-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-submission-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );
      resetSubmissionFields();
    }
  });
}

const renderMilestoneSelectionTable = (milestoneData) => {
  //create a table row element for each description array element for each milestone key in guidedMilestoneData
  const milestoneTableRows = Object.keys(milestoneData)
    .map((milestoneKey) => {
      const milestoneDescriptionArray = milestoneData[milestoneKey];
      const milestoneDescriptionTableRows = milestoneDescriptionArray.map(
        (milestoneDescription) => {
          console.log(milestoneDescription);
          const descriptionString = milestoneDescription["Description of data"];
          const milestoneString = milestoneKey;
          const completionDateString =
            milestoneDescription["Expected date of completion"];
          return generateMilestoneRowElement(
            descriptionString,
            milestoneString,
            completionDateString
          );
        }
      );
      return milestoneDescriptionTableRows.join("");
    })
    .join("\n");
  const milestonesTableContainer = document.getElementById(
    "milestones-table-container"
  );
  milestonesTableContainer.innerHTML = milestoneTableRows;
};

function resetSubmissionFields() {
  $("#existing-submission-file-destination").attr("placeholder", "Browse here");

  $("#div-confirm-existing-submission-import").hide();

  if ($("#bf_dataset_load_submission").text().trim() !== "None") {
    $($("#div-check-bf-import-submission").children()[0]).show();
    $("#div-check-bf-import-submission").css("display", "flex");
  } else {
    $("#div-check-bf-import-submission").hide();
  }

  var inputFields = $("#Question-prepare-submission-1").nextAll().find("input");
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

  // make accordion active again
  $("#submission-title-accordion").addClass("active");
  $("#submission-accordion").addClass("active");

  // show generate button again
  $("#button-generate-submission").show();

  for (var field of selectFields) {
    $(field).val("Select");
  }
  $("#submission-completion-date")
    .empty()
    .append('<option value="Select">Select an option</option>');
  $("#submission-completion-date").append(
    $("<option>", {
      text: "Enter my own date",
    })
  );
  checkAirtableStatus("");
}

async function helpMilestoneSubmission(curationMode) {
  var filepath = "";
  var informationJson = {};
  Swal.fire({
    title: "Do you have the Data Deliverables document ready to import?",
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: "Yes, let's import it",
    cancelButtonText: "No",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then(async (result) => {
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
      }).then(async (result) => {
        Swal.close();

        const filepath = result.value.filepath;
        var award = $("#submission-sparc-award");
        log.info(`Importing Data Deliverables document: ${filepath}`);
        try {
          let extract_milestone = await client.get(
            `/prepare_metadata/import_milestone`,
            {
              params: {
                path: filepath,
              },
            }
          );
          let res = extract_milestone.data;
          milestoneObj = res;

          //Handle free-form mode submission data
          if (curationMode === "free-form") {
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

          //Handle guided mode submission data
          if (curationMode === "guided") {
            const guidedMilestoneData = res;
            //create a string with today's date in the format xxxx/xx/xx
            const today = new Date();
            const todayString = `
              ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}
            `;
            //add a custom milestone row for when the user wants to add a custom milestone
            //not included in the dataset deliverables document
            guidedMilestoneData[
              "Not included in the Dataset Deliverables document"
            ] = [
              {
                "Description of data":
                  "Select this option when the dataset you are submitting is not related to a pre-agreed milestone",
                "Expected date of completion": "N/A",
              },
            ];
            console.log(guidedMilestoneData);

            //save the unselected milestones into sodaJSONObj
            sodaJSONObj["dataset-metadata"]["submission-metadata"][
              "unselected-milestones"
            ] = guidedMilestoneData;

            renderMilestoneSelectionTable(guidedMilestoneData);

            guidedSubmissionTagsTagify.settings.whitelist = [];

            unHideAndSmoothScrollToElement(
              "guided-div-data-deliverables-import"
            );
          }
        } catch (error) {
          clientError(error);
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "error",
            text: userErrorMessage(error),
          });
        }
      });
    } else {
      if (curationMode === "guided") {
      }
    }
  });
}

let guidedMilestoneData = {};

const createCompletionDateRadioElement = (name, label) => {
  return `
    <div class="field" style="width: auto !important">
      <div class="ui radio checkbox">
        <input type="radio" name='${name}' value='${label}'>
        <label>${label}</label>
      </div>
    </div>
  `;
};

// function that removes hidden class from js element by id and smooth scrolls to it
const unHideAndSmoothScrollToElement = (id) => {
  elementToUnhideAndScrollTo = document.getElementById(id);
  elementToUnhideAndScrollTo.classList.remove("hidden");
  elementToUnhideAndScrollTo.scrollIntoView({
    behavior: "smooth",
  });
};

const smoothScrollToElement = (idOrElement) => {
  //check if idOrElement is an element
  if (typeof idOrElement === "string") {
    elementToScrollTo = document.getElementById(id);
    elementToScrollTo.scrollIntoView({
      behavior: "smooth",
    });
  } else {
    idOrElement.scrollIntoView({
      behavior: "smooth",
    });
  }
};

const handleMilestoneClick = () => {
  //get all checked checkboxes with name "milestone" vanilla js
  const checkedMilestones = document.querySelectorAll(
    "input[name='milestone']:checked"
  );
  //convert checkMilestones to array of checkMilestones values
  const checkedMilestonesArray = Array.from(checkedMilestones);
  //get the values of checkedMilestonesArray
  const checkedMilestonesValues = checkedMilestonesArray.map(
    (checkMilestone) => checkMilestone.value
  );
  const completionDatesToCheck = [];
  for (const milestone of checkedMilestonesValues) {
    console.log(milestone);
    for (const task of guidedMilestoneData[milestone]) {
      completionDatesToCheck.push(task["Expected date of completion"]);
    }
  }
  console.log(completionDatesToCheck);

  const completionDatesToCheckArray = Array.from(
    new Set(completionDatesToCheck)
  );
  console.log(completionDatesToCheckArray);
  const completionDateRadioElements = completionDatesToCheckArray
    .map((completionDate) =>
      createCompletionDateRadioElement("completion-date", completionDate)
    )
    .join("\n");
  //replace the current completion-date-radio-elements with the new ones
  const completionDateRadioElementContainer = document.getElementById(
    "guided-completion-date-checkbox-container"
  );
  completionDateRadioElementContainer.innerHTML = completionDateRadioElements;
};

const generateMilestoneRowElement = (
  dataDescription,
  milestoneString,
  dateString
) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <div class="ui fitted checkbox">
          <input type="checkbox" name="milestone" value="${dataDescription}">
          <label></label>
        </div>
      </td>
      <td class="middle aligned">
        ${dataDescription}
      </td>
      <td class="middle aligned">
        ${milestoneString}
      </td>
      <td class="middle aligned collapsing"> 
        ${dateString}
      </td>
    </tr>
  `;
};

//create an array of values for checked checkboxes with the name "milestone"
const getCheckedMilestones = () => {
  const checkedMilestones = document.querySelectorAll(
    "input[name='milestone']:checked"
  );
  const checkedMilestonesArray = Array.from(checkedMilestones);
  console.log(checkedMilestonesArray);
  //get first tr parent for each checkedMilestonesArray element
  const checkedMilestoneData = checkedMilestonesArray.map((checkMilestone) => {
    const tableRow = checkMilestone.parentElement.parentElement.parentElement;
    const description = tableRow.children[1].innerHTML.trim();
    const milestone = tableRow.children[2].innerHTML.trim();
    const completionDate = tableRow.children[3].innerHTML.trim();

    return {
      description: description,
      milestone: milestone,
      completionDate: completionDate,
    };
  });
  return checkedMilestoneData;
};

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

            // log the successful attempt to import a data deliverables document from the user's computer
            ipcRenderer.send(
              "track-event",
              "Success",
              "Prepare Metadata - submission - import-DDD",
              "Data Deliverables Document",
              1
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
    if (!introStatus.submission) {
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
        .onbeforeexit(function () {
          introStatus.submission = true;
        })
        .start();
    }
  }, 1300);
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
    return "empty";
  }
}

function changeAwardInput() {
  var ddBolean;
  document.getElementById("submission-completion-date").value = "";
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

const submissionDateInput = document.getElementById(
  "submission-completion-date"
);
var submissionDestinationPath = "";

$(document).ready(function () {
  ipcRenderer.on("selected-existing-submission", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById(
          "existing-submission-file-destination"
        ).placeholder = filepath[0];

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
  // generate submission file
  ipcRenderer.on(
    "selected-destination-generate-submission-locally",
    (event, dirpath) => {
      if (dirpath.length > 0) {
        document.getElementById(
          "input-destination-generate-submission-locally"
        ).placeholder = dirpath[0];
        var destinationPath = path.join(dirpath[0], "submission.xlsx");
        submissionDestinationPath = destinationPath;
        $("#div-confirm-destination-submission-locally").css("display", "flex");
        $($("#div-confirm-destination-submission-locally").children()[0]).css(
          "display",
          "flex"
        );
      } else {
        document.getElementById(
          "input-destination-generate-submission-locally"
        ).placeholder = "Browse here";
        $("#div-confirm-destination-submission-locally").css("display", "none");
      }
    }
  );

  $("#bf_dataset_load_submission").on("DOMSubtreeModified", function () {
    if (
      $("#Question-prepare-submission-2").hasClass("show") &&
      !$("#Question-prepare-submission-6").hasClass("show")
    ) {
      $("#Question-prepare-submission-2").removeClass("show");
    }
    if ($("#bf_dataset_load_submission").text().trim() !== "None") {
      $("#div-check-bf-import-submission").css("display", "flex");
      $($("#div-check-bf-import-submission").children()[0]).show();
    } else {
      $("#div-check-bf-import-submission").css("display", "none");
    }
  });

  $("#bf_dataset_generate_submission").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_submission").text().trim() !== "None") {
      $("#div-check-bf-generate-submission").css("display", "flex");
    } else {
      $("#div-check-bf-generate-submission").css("display", "none");
    }
  });
});

//Function is used for when user is creating Metadata files locally
//At most the metadata files should be no bigger than 3MB
//Function checks the selected storage device to ensure at least 3MB are available
const checkStorage = (id) => {
  var location = id;
  var threeMB = 3145728;
  checkDiskSpace(location).then((diskSpace) => {
    freeMem = diskSpace.free;
    if (freeMem < threeMB) {
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "OK",
        heightAuto: false,
        icon: "warning",
        showCancelButton: false,
        title: "Not enough space",
        text: "Please free up at least 3MB",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      ipcRenderer.send(
        "track-event",
        "Error",
        "Prepare Metadata - Generate - Check Storage Space",
        "Free memory: " + freeMem + "\nMemory needed: " + threeMB,
        1
      );

      // stop execution to avoid logging a success case for the storage space check
      return;
    }

    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Metadata - Generate - Check Storage Space",
      "Free memory: " + freeMem + "\nMemory needed: " + threeMB,
      1
    );
  });
};
const localSubmissionBtn = document.getElementById(
  "btn-confirm-local-submission-destination"
);
const localDDBtn = document.getElementById("btn-confirm-local-dd-destination");
const localSubjectsBtn = document.getElementById(
  "btn-confirm-local-subjects-destination"
);
const localSamplesBtn = document.getElementById(
  "btn-confirm-local-samples-destination"
);
const localChangesBtn = document.getElementById(
  "btn-confirm-local-changes-destination"
);
const localReadmeBtn = document.getElementById(
  "btn-confirm-local-readme-destination"
);
//event listeners for each button since each one uses a different ID
localSubmissionBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-submission-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localDDBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-dd-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localSubjectsBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-subjects-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localSamplesBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-samples-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localChangesBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-changes-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localReadmeBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-readme-locally")
        .getAttribute("placeholder")
    );
  },
  false
);

async function generateSubmissionHelper(uploadBFBoolean) {
  if (uploadBFBoolean) {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing submission.xlsx file in the high-level folder of the selected dataset will be replaced.",
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
  } else {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing submission.xlsx file in the specified location will be replaced.",
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
    title: "Generating the submission.xlsx file",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  var awardRes = $("#submission-sparc-award").val();
  var dateRes = $("#submission-completion-date").val();
  var milestonesRes = $("#selected-milestone-1").val();
  let milestoneValue = [{ value: "" }];
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

  let datasetName = $("#bf_dataset_load_submission").text().trim();
  console.log(json_arr);
  console.log(submissionDestinationPath);
  console.log(typeof submissionDestinationPath);
  console.log(uploadBFBoolean);
  console.log(defaultBfAccount);
  console.log(datasetName);
  client
    .post(
      `/prepare_metadata/submission_file`,
      {
        submission_file_rows: json_arr,
        filepath: submissionDestinationPath,
        upload_boolean: uploadBFBoolean,
      },
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: datasetName,
        },
      }
    )
    .then((res) => {
      if (uploadBFBoolean) {
        var successMessage =
          "Successfully generated the submission.xlsx file on your Pennsieve dataset.";
      } else {
        var successMessage =
          "Successfully generated the submission.xlsx file at the specified location.";
      }
      Swal.fire({
        title: successMessage,
        icon: "success",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        allowOutsideClick: true,
      });

      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SUBMISSION,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );

      // get the size of the uploaded file from the result
      const size = res;

      // log the size of the metadata file that was generated at varying levels of granularity
      logMetadataSizeForAnalytics(uploadBFBoolean, "submission.xlsx", size);
    })
    .catch((error) => {
      clientError(error);
      let emessage = userErrorMessage(error);
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        html: emessage,
        title: "Failed to generate the submission file",
      });

      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBMISSION,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );
    });
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

function openFileBrowserDestination(metadataType) {
  ipcRenderer.send(`open-destination-generate-${metadataType}-locally`);
}

function importExistingSubmissionFile(type) {
  var filePath = $(`#existing-submission-file-destination`).prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      `Please select a path to your submission.xlsx file`,
      "error"
    );

    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBMISSION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
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

      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBMISSION,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
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

// function to load existing submission files
async function loadExistingSubmissionFile(filepath) {
  log.info(`Loading existing submission file: ${filepath}`);
  try {
    let load_submission_file = await client.get(
      `/prepare_metadata/submission_file`,
      {
        params: {
          filepath,
        },
      }
    );

    let res = load_submission_file.data;
    loadSubmissionFileToUI(res, "local");
  } catch (error) {
    clientError(error);

    Swal.fire({
      title: "Failed to load the existing submission.xlsx file.",
      html: userErrorMessage(error),
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBMISSION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

function loadSubmissionFileToUI(data, type) {
  milestoneTagify1.removeAllTags();
  removeOptions(descriptionDateInput);
  addOption(descriptionDateInput, "Select an option", "Select");
  $("#submission-completion-date").val("Select");
  $("#submission-sparc-award").val("");
  // 1. populate milestones
  if (typeof data["Milestone achieved"] === "string") {
    milestoneTagify1.addTags(data["Milestone achieved"]);
  } else {
    for (var milestone of data["Milestone achieved"]) {
      milestoneTagify1.addTags(milestone);
    }
  }
  // 2. populate SPARC award
  if (data["SPARC Award number"] !== "") {
    $("#submission-sparc-award").val(data["SPARC Award number"]);
  }
  // 3. populate Completion date
  if (data["Milestone completion date"] !== "") {
    addOption(
      descriptionDateInput,
      data["Milestone completion date"],
      data["Milestone completion date"]
    );
    $("#submission-completion-date").val(data["Milestone completion date"]);
  }
  Swal.fire({
    title: "Loaded successfully!",
    icon: "success",
    showConfirmButton: false,
    timer: 500,
    timerProgressBar: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.hideLoading();
    },
  });

  logMetadataForAnalytics(
    "Success",
    MetadataAnalyticsPrefix.SUBMISSION,
    AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
    "Existing",
    type === "local" ? Destinations.LOCAL : Destinations.PENNSIEVE
  );

  if (type === "local") {
    $("#div-confirm-existing-submission-import").hide();
    $($("#div-confirm-existing-submission-import button")[0]).hide();
    $("#button-fake-confirm-existing-submission-file-load").click();
  } else {
    $("#div-check-bf-import-submission").hide();
    $($("#div-check-bf-import-submission button")[0]).hide();
    $("#button-fake-confirm-existing-bf-submission-file-load").click();
  }
}

// function to check for existing submission file on Penn
async function checkBFImportSubmission() {
  Swal.fire({
    title: "Importing the submission.xlsx file",
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
  let bfDataset = $("#bf_dataset_load_submission").text().trim();
  log.info(`Loading submission file from Pennsieve dataset: ${bfDataset}`);
  try {
    let import_metadata = await client.get(
      `/prepare_metadata/import_metadata_file`,
      {
        params: {
          file_type: "submission.xlsx",
          selected_account: defaultBfAccount,
          selected_dataset: bfDataset,
        },
      }
    );
    let res = import_metadata.data;

    loadSubmissionFileToUI(res, "bf");
  } catch (error) {
    clientError(error);

    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: error.response.data.message,
    });
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBMISSION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
}
