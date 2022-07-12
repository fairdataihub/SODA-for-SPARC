var subjectsFormDiv = document.getElementById("form-add-a-subject");
var guidedSubjectsFormDiv = document.getElementById(
  "guided-form-add-a-subject"
);
var samplesFormDiv = document.getElementById("form-add-a-sample");
var guidedSamplesFormDiv = document.getElementById("guided-form-add-a-sample");
var subjectsTableData = [];
var subjectsFileData = [];
var samplesTableData = [];
var samplesFileData = [];
var headersArrSubjects = [];
var headersArrSamples = [];
let guidedHeadersArrSubjects = [];
let guidedHeadersArrSamples = [];
let guidedSamplesTableData = [];

function showForm(type, editBoolean) {
  if (type !== "edit") {
    clearAllSubjectFormFields(subjectsFormDiv);
  }
  subjectsFormDiv.style.display = "flex";
  $("#create_subjects-tab").removeClass("show");
  $("#create_subjects-tab").css("display", "none");
  $("#footer-div-subjects").css("display", "none");
  $("#btn-add-custom-field").show();
  $("#sidebarCollapse").prop("disabled", "true");
}

function showFormSamples(type, editBoolean) {
  if (type !== "edit") {
    clearAllSubjectFormFields(samplesFormDiv);
  }
  samplesFormDiv.style.display = "flex";
  $("#create_samples-tab").removeClass("show");
  $("#create_samples-tab").css("display", "none");
  $("#footer-div-samples").css("display", "none");
  $("#btn-add-custom-field-samples").show();
  $("#sidebarCollapse").prop("disabled", "true");
}

var selectHTMLSamples =
  "<div><select id='previous-subject' class='swal2-input' onchange='displayPreviousSample()'></select><select style='display:none' id='previous-sample' class='swal2-input' onchange='confirmSample()'></select></div>";
var prevSubID = "";
var prevSamID = "";
var prevSubIDSingle = "";
var selectHTMLSubjects =
  "<div><select id='previous-subject-single' class='swal2-input'></select></div>";

function promptImportPrevInfoSamples(arr1, arr2) {
  Swal.fire({
    title: "Choose a previous sample:",
    html: selectHTMLSamples,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    reverseButtons: reverseSwalButtons,
    customClass: {
      confirmButton: "confirm-disabled",
    },
    onOpen: function () {
      $(".swal2-confirm").attr("id", "btn-confirm-previous-import");
      removeOptions(document.getElementById("previous-subject"));
      removeOptions(document.getElementById("previous-sample"));
      $("#previous-subject").append(
        `<option value="Select">Select a subject</option>`
      );
      $("#previous-sample").append(
        `<option value="Select">Select a sample</option>`
      );
      for (var ele of arr1) {
        $("#previous-subject").append(`<option value="${ele}">${ele}</option>`);
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      if (
        $("#previous-subject").val() !== "Select" &&
        $("#previous-sample").val() !== "Select"
      ) {
        populateFormsSamples(prevSubID, prevSamID, "import", "free-form");
      }
    } else {
      hideForm("sample");
    }
  });
}

// onboarding for subjects/samples file
function onboardingMetadata(type) {
  var helperButtons = $(
    $($(`#table-${type}s`).children()[1]).find(`.row-${type}s`)[0]
  ).find(".contributor-helper-buttons")[0];

  if (!introStatus[type]) {
    introJs()
      .setOptions({
        steps: [
          {
            title: "Buttons",
            element: helperButtons,
            intro: "Click on these buttons to manipulate a " + type + ".",
          },
          {
            title: `1. Edit a ${type}`,
            element: $(helperButtons).children()[0],
            intro:
              "Click here to edit the information about a corresponding " +
              type +
              ".",
          },
          {
            title: `2. Copy a ${type}`,
            element: $(helperButtons).children()[1],
            intro:
              "Click here to copy information from the corresponding " +
              type +
              " onto a new " +
              type +
              ". Note: You have to enter an ID for the new " +
              type +
              " after clicking on this.",
          },
          {
            title: `3. Delete a ${type}`,
            element: $(helperButtons).children()[2],
            intro:
              "Click here to delete a corresponding " +
              type +
              " from the table. This will permanently delete the " +
              type +
              " from SODA and cannot be reverted.",
          },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        disableInteraction: false,
      })
      .onbeforeexit(function () {
        introStatus[type] = true;
      })
      .start();
  }
}

function promptImportPrevInfoSubject(arr1) {
  Swal.fire({
    title: "Choose a previous subject:",
    html: selectHTMLSubjects,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    reverseButtons: reverseSwalButtons,
    onOpen: function () {
      removeOptions(document.getElementById("previous-subject-single"));
      $("#previous-subject-single").append(
        `<option value="Select">Select a subject</option>`
      );
      for (var ele of arr1) {
        $("#previous-subject-single").append(
          `<option value="${ele}">${ele}</option>`
        );
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      if ($("#previous-subject-single").val() !== "Select") {
        prevSubIDSingle = $("#previous-subject-single").val();
        populateForms(prevSubIDSingle, "import", "free-form");
      }
    } else {
      hideForm("subject");
    }
  });
}

function displayPreviousSample() {
  if ($("#previous-subject").val() !== "Select") {
    $("#previous-sample").css("display", "block");
    prevSubID = $("#previous-subject").val();
    // load previous sample ids accordingly for a particular subject
    var prevSampleArr = [];
    for (var subject of samplesTableData.slice(1)) {
      if (subject[0] === prevSubID) {
        prevSampleArr.push(subject[1]);
      }
    }
    for (var ele of prevSampleArr) {
      $("#previous-sample").append(`<option value="${ele}">${ele}</option>`);
    }
  } else {
    $("#previous-sample").css("display", "none");
    prevSubID = "";
  }
}

function confirmSample() {
  if ($("#previous-sample").val() !== "Select") {
    $("#btn-confirm-previous-import").removeClass("confirm-disabled");
    prevSamID = $("#previous-sample").val();
  } else {
    $("#btn-confirm-previous-import").addClass("confirm-disabled");
    prevSamID = "";
  }
}

// for "Done adding" button - subjects
function addSubject(curationMode) {
  let subjectID = "";
  if (curationMode === "free-form") {
    subjectID = $("#bootbox-subject-id").val();
    addSubjectIDtoDataBase(subjectID);
    if (subjectsTableData.length !== 0) {
      $("#div-import-primary-folder-subjects").hide();
    }
    if (subjectsTableData.length === 2) {
      onboardingMetadata("subject");
    }
  }
  if (curationMode === "guided") {
    addSubjectMetadataEntriesIntoJSON("guided");
  }
}

// for "Done adding" button - samples
function addSample(curationMode) {
  let sampleID = "";
  let subjectID = "";
  if (curationMode === "free-form") {
    sampleID = $("#bootbox-sample-id").val();
    subjectID = $("#bootbox-subject-id-samples").val();
    addSampleIDtoDataBase(sampleID, subjectID);
    if (samplesTableData.length !== 0) {
      $("#div-import-primary-folder-samples").hide();
    }
    if (samplesTableData.length === 2) {
      onboardingMetadata("sample");
    }
  }

  if (curationMode === "guided") {
    addSampleMetadataEntriesIntoJSON("guided");
  }
}

function warningBeforeHideForm(type) {
  Swal.fire({
    title: "Are you sure you want to cancel?",
    text: "This will reset your progress with the current subject_id.",
    icon: "warning",
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "No, stay here",
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then((result) => {
    if (result.isConfirmed) {
      if (type === "subjects") {
        hideForm("subject");
      } else {
        hideForm("sample");
      }
    }
  });
}

function hideForm(type) {
  var formDiv;
  if (type === "subject") {
    formDiv = subjectsFormDiv;
  } else if (type === "sample") {
    formDiv = samplesFormDiv;
  }
  formDiv.style.display = "none";
  $("#create_" + type + "s-tab").addClass("show");
  $("#create_" + type + "s-tab").css("display", "flex");
  $("#footer-div-" + type + "s").css("display", "flex");
  $("#sidebarCollapse").prop("disabled", false);
  $("#btn-edit-" + type + "").css("display", "none");
  $("#btn-add-" + type + "").css("display", "inline-block");
}

function validateSubSamID(ev) {
  var regex = /^[a-zA-Z0-9-_]+$/;
  var id = $(ev).prop("id");
  var value = $("#" + id).val();
  //Validate TextBox value against the Regex.
  var isValid = regex.test(value);
  if (!isValid && value.trim() !== "") {
    $(ev).addClass("invalid");
    $("#para-" + id).css("display", "block");
  } else {
    $(ev).removeClass("invalid");
    $("#para-" + id).css("display", "none");
  }
}

function addNewIDToTable(newID, secondaryID, type) {
  var message = "";
  if (type === "subjects") {
    var keyword = "subject";
    var int = 1;
    var table = document.getElementById("table-subjects");
  } else if (type === "samples") {
    var keyword = "sample";
    var int = 2;
    var table = document.getElementById("table-samples");
  }
  var duplicate = false;
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (newID === table.rows[i].cells[int].innerText) {
      duplicate = true;
      break;
    }
  }
  if (duplicate) {
    var message = `We detect duplicate ${keyword}_id(s). Please make sure ${keyword}_id(s) are unique before you generate.`;
  }
  var rowIndex = rowcount;
  var indexNumber = rowIndex;
  var currentRow = table.rows[table.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-" + keyword, rowIndex);
  if (type === "subjects") {
    var row = (table.insertRow(rowIndex).outerHTML =
      "<tr id='row-current-" +
      keyword +
      newRowIndex +
      "' class='row-" +
      type +
      "'><td class='contributor-table-row'>" +
      indexNumber +
      "</td><td>" +
      newID +
      "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_" +
      keyword +
      "_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='copy_current_" +
      keyword +
      "_id(this)'><i class='fas fa-copy' style='color: orange'></i></button><button class='ui button' onclick='delete_current_" +
      keyword +
      "_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
  } else if (type === "samples") {
    var row = (table.insertRow(rowIndex).outerHTML =
      "<tr id='row-current-" +
      keyword +
      newRowIndex +
      "' class='row-" +
      type +
      "'><td class='contributor-table-row'>" +
      indexNumber +
      "</td><td>" +
      secondaryID +
      "</td><td>" +
      newID +
      "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_" +
      keyword +
      "_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='copy_current_" +
      keyword +
      "_id(this)'><i class='fas fa-copy' style='color: orange'></i></button><button class='ui button' onclick='delete_current_" +
      keyword +
      "_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
  }
  return message;
}

function addNewIDToTableStrict(newID, secondaryID, type) {
  var message = "";
  if (type === "subjects") {
    var keyword = "subject";
    var int = 1;
    var table = document.getElementById("table-subjects");
  } else if (type === "samples") {
    var keyword = "sample";
    var int = 2;
    var table = document.getElementById("table-samples");
  }
  var duplicate = false;
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (newID === table.rows[i].cells[int].innerText) {
      duplicate = true;
      break;
    }
  }
  if (duplicate) {
    var message = `We detect duplicate ${keyword}_id(s). Please make sure ${keyword}_id(s) are unique before you generate.`;
  }
  return message;
}

function addSubjectIDtoDataBase(id) {
  var table = document.getElementById("table-subjects");
  var duplicate = false;
  var error = "";
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (id === table.rows[i].cells[1].innerText) {
      duplicate = true;
      break;
    }
  }
  if (id.trim() !== "") {
    if (!duplicate) {
      var message = addNewIDToTable(id, null, "subjects");
      addSubjectIDToJSON(id);
    } else {
      error =
        "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id.";
    }
  } else {
    error = "The subject_id is required to add a subject.";
  }
  if (error !== "") {
    Swal.fire("Failed to add the subject", error, "error");
  }
}

function addSampleIDtoDataBase(samID, subID) {
  var table = document.getElementById("table-samples");
  var duplicate = false;
  var error = "";
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (samID === table.rows[i].cells[2].innerText) {
      duplicate = true;
      break;
    }
  }
  if (samID !== "" && subID !== "") {
    if (!duplicate) {
      var message = addNewIDToTable(samID, subID, "samples");
      addSampleIDtoJSON(samID);
    } else {
      error =
        "A similar sample_id already exists. Please either delete the existing sample_id or choose a different sample_id.";
    }
  } else {
    error = "The subject_id and sample_id are required to add a sample.";
  }
  if (error !== "") {
    Swal.fire("Failed to add the sample", error, "error");
  }
}

function clearAllSubjectFormFields(form) {
  for (var field of $(form).children().find("input")) {
    $(field).val("");
  }
  for (var field of $(form).children().find("select")) {
    $(field).val("Select");
  }
  $(form).find(".title").removeClass("active");
  $(form).find(".content").removeClass("active");

  // hide Strains and Species
  if (form === subjectsFormDiv) {
    var keyword = "subject";
    $("#bootbox-" + keyword + "-species").css("display", "none");
    $("#bootbox-" + keyword + "-strain").css("display", "none");

    $("#button-add-species-" + keyword + "").html(
      `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
    );
    $("#button-add-strain-" + keyword + "").html(
      `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add strain`
    );
  }
}

// add new subject ID to JSON file (main file to be converted to excel)
function addSubjectIDToJSON(subjectID) {
  if ($("#form-add-a-subject").length > 0) {
    addSubjectMetadataEntriesIntoJSON("free-form");
  }
}

/// function to add Species - subjects + samples
async function addSpecies(ev, type, curationMode) {
  let curationModeSelectorPrefix = "";
  if (curationMode == "guided") {
    curationModeSelectorPrefix = "guided-";
  }

  $(`#${curationModeSelectorPrefix}bootbox-${type}-species`).val("");
  const { value: value } = await Swal.fire({
    title: "Add/Edit a species",
    html: `<input type="text" id="sweetalert-${type}-species" placeholder="Search for species..." style="font-size: 14px;"/>`,
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    customClass: {
      confirmButton: "confirm-disabled",
    },
    didOpen: () => {
      $(".swal2-confirm").attr("id", "btn-confirm-species");
      createSpeciesAutocomplete(`sweetalert-${type}-species`);
    },
    preConfirm: () => {
      if (document.getElementById(`sweetalert-${type}-species`).value === "") {
        Swal.showValidationMessage("Please enter a species.");
      }
      return document.getElementById(`sweetalert-${type}-species`).value;
    },
  });
  if (value) {
    if (value !== "") {
      $(`#${curationModeSelectorPrefix}bootbox-${type}-species`).val(value);
      switchSpeciesStrainInput("species", "edit", curationMode);
    }
  } else {
    switchSpeciesStrainInput("species", "add", curationMode);
  }
}

function switchSpeciesStrainInput(type, mode, curationMode) {
  let curationModeSelectorPrefix = "";
  if (curationMode == "guided") {
    curationModeSelectorPrefix = "guided-";
  }
  if (mode === "add") {
    $(`#${curationModeSelectorPrefix}button-add-${type}-subject`).html(
      `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add ${type}`
    );
    $(`#${curationModeSelectorPrefix}bootbox-subject-${type}`).css(
      "display",
      "none"
    );
    $(`#${curationModeSelectorPrefix}bootbox-subject-${type}`).val("");
  } else if (mode === "edit") {
    $(`#${curationModeSelectorPrefix}bootbox-subject-${type}`).css(
      "display",
      "block"
    );
    $(`#${curationModeSelectorPrefix}bootbox-subject-${type}`).attr(
      "readonly",
      true
    );
    $(`#${curationModeSelectorPrefix}bootbox-subject-${type}`).css(
      "background",
      "#f5f5f5"
    );
    $(`#${curationModeSelectorPrefix}button-add-${type}-subject`).html(
      "<i class='pen icon'></i>Edit"
    );
  }
}

async function addStrain(ev, type, curationMode) {
  let curationModeSelectorPrefix = "";
  if (curationMode == "guided") {
    curationModeSelectorPrefix = "guided-";
  }
  $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).val("");
  const { value: value } = await Swal.fire({
    title: "Add/Edit a strain",
    html: `<input type="text" id="sweetalert-${type}-strain" placeholder="Search for strain..." style="font-size: 14px;"/>`,
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    customClass: {
      confirmButton: "confirm-disabled",
    },
    didOpen: () => {
      $(".swal2-confirm").attr("id", "btn-confirm-strain");
      createStrain("sweetalert-" + type + "-strain", type, curationMode);
    },
    preConfirm: () => {
      if (
        document.getElementById("sweetalert-" + type + "-strain").value === ""
      ) {
        Swal.showValidationMessage("Please enter a strain.");
      }
      return document.getElementById("sweetalert-" + type + "-strain").value;
    },
  });
  if (value) {
    if (value !== "") {
      $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).val(value);
      switchSpeciesStrainInput("strain", "edit", curationMode);
    }
  } else {
    switchSpeciesStrainInput("strain", "add", curationMode);
  }
}

// populate RRID
function populateRRID(strain, type, curationMode) {
  let curationModeSelectorPrefix = "";
  if (curationMode == "guided") {
    curationModeSelectorPrefix = "guided-";
  }
  var rridHostname = "scicrunch.org";
  // this is to handle spaces and other special characters in strain name
  var encodedStrain = encodeURIComponent(strain);
  var rridInfo = {
    hostname: rridHostname,
    port: 443,
    path: `/api/1/dataservices/federation/data/nlx_154697-1?q=${encodedStrain}&key=2YOfdcQRDVN6QZ1V6x3ZuIAsuypusxHD`,
    headers: { accept: "text/xml" },
  };
  Swal.fire({
    title: `Retrieving RRID for ${strain}...`,
    allowEscapeKey: false,
    allowOutsideClick: false,
    html: "Please wait...",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  https.get(rridInfo, (res) => {
    if (res.statusCode === 200) {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (d) => {
        data += d;
      });
      res.on("end", () => {
        var returnRes = readXMLScicrunch(data, type);
        if (!returnRes) {
          Swal.fire({
            title: `Failed to retrieve the RRID for ${strain} from <a target="_blank" href="https://scicrunch.org/resources/Organisms/search">Scicrunch.org</a>.`,
            text: "Please make sure you enter the correct strain.",
            showCancelButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).val("");
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain-RRID`).val(
            ""
          );
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).css(
            "display",
            "none"
          );
          if (type.includes("subject")) {
            $(`#${curationModeSelectorPrefix}button-add-strain-subject`).html(
              `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add strain`
            );
          } else {
            $(`#${curationModeSelectorPrefix}button-add-strain-subject`).html(
              `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add strain`
            );
          }
        } else {
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).val(strain);
          $("#btn-confirm-strain").removeClass("confirm-disabled");
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).css(
            "display",
            "block"
          );
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).attr(
            "readonly",
            true
          );
          $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).css(
            "background",
            "#f5f5f5"
          );
          if (type.includes("subject")) {
            $(`#${curationModeSelectorPrefix}button-add-strain-subject`).html(
              "<i class='pen icon'></i>Edit"
            );
          } else {
            $(`#${curationModeSelectorPrefix}button-add-strain-sample`).html(
              "<i class='pen icon'></i>Edit"
            );
          }
          Swal.fire({
            title: `Successfully retrieved the RRID for "${strain}".`,
            icon: "success",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
        }
      });
    } else {
      $(`#${curationModeSelectorPrefix}bootbox-${type}-strain`).val("");
      $(`#${curationModeSelectorPrefix}bootbox-${type}-strain-RRID`).val("");
      Swal.fire({
        title: `Failed to retrieve the RRID for "${strain}" from <a target="_blank" href="https://scicrunch.org/resources/Organisms/search">Scicrunch.org</a>.`,
        text: "Please check your Internet Connection or contact us at help@fairdataihub.org",
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  });
}

function addSubjectMetadataEntriesIntoJSON(curationMode) {
  let curationModeSelectorPrefix = "";
  let dataLength = subjectsTableData.length;
  console.log(subjectsTableData);
  console.log(dataLength);
  if (curationMode === "free-form") {
    curationModeSelectorPrefix = "";
  }
  if (curationMode === "guided") {
    curationModeSelectorPrefix = "guided-";
  }
  var valuesArr = [];
  headersArrSubjects = [];
  for (var field of $(`#${curationModeSelectorPrefix}form-add-a-subject`)
    .children()
    .find(".subjects-form-entry")) {
    console.log(field.value);
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      console.log("empty");
      field.value = null;
    } else {
      console.log(field);
    }
    headersArrSubjects.push(field.name);
    // if it's age, then add age info input (day/week/month/year)
    if (field.name === "Age") {
      if (
        $(`#${curationModeSelectorPrefix}bootbox-subject-age-info`).val() !==
          "Select" &&
        $(`#${curationModeSelectorPrefix}bootbox-subject-age-info`).val() !==
          "N/A"
      ) {
        field.value =
          field.value +
          " " +
          $(`#${curationModeSelectorPrefix}bootbox-subject-age-info`).val();
      } else {
        field.value = field.value;
      }
    }
    if (field.name === "Sex") {
      if (
        $(`#${curationModeSelectorPrefix}bootbox-subject-sex`).val() ===
        "Unknown"
      ) {
        field.value = "";
      } else {
        field.value = field.value;
      }
    }
    valuesArr.push(field.value);
  }
  subjectsTableData[0] = headersArrSubjects;

  if (valuesArr !== undefined && valuesArr.length !== 0) {
    if (curationMode === "free-form") {
      if (subjectsTableData[dataLength] !== undefined) {
        subjectsTableData[dataLength + 1] = valuesArr;
      } else {
        subjectsTableData[dataLength] = valuesArr;
      }
    }
    if (curationMode === "guided") {
      let subjectID = $("#guided-metadata-subject-id").text();
      subjectsTableData[0].unshift("subject id");
      valuesArr.unshift(subjectID);
      //Check to see if the subject ID is already in the table
      //If so, set duplicateSubjectIndex as the index of matching subject id
      let duplicateSubjectIndex = null;
      for (let i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          duplicateSubjectIndex = i;
        }
      }
      if (duplicateSubjectIndex !== null) {
        //If the subject ID is already in the table, update old subject metadata with new
        subjectsTableData[duplicateSubjectIndex] = valuesArr;
      } else {
        console.log(subjectsTableData);
        console.log(valuesArr);
        console.log(dataLength);
        console.log(subjectsTableData[dataLength]);
        if (subjectsTableData[dataLength] !== undefined) {
          subjectsTableData[dataLength + 1] = valuesArr;
        } else {
          subjectsTableData[dataLength] = valuesArr;
        }
      }
      console.log(subjectsTableData);
    }
  }
  if (curationMode === "free-form") {
    $("#table-subjects").css("display", "block");
    $("#button-generate-subjects").css("display", "block");
    clearAllSubjectFormFields(subjectsFormDiv);
    hideForm("subject");
  }
}

function addSampleMetadataEntriesIntoJSON(curationMode) {
  let curationModeSelectorPrefix = "";
  var dataLength = samplesTableData.length;
  if (curationMode === "free-form") {
    curationModeSelectorPrefix = "";
  }
  if (curationMode === "guided") {
    curationModeSelectorPrefix = "guided-";
  }
  var valuesArr = [];
  headersArrSamples = [];
  for (var field of $(`#${curationModeSelectorPrefix}form-add-a-sample`)
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSamples.push(field.name);
    // if it's age, then add age info input (day/week/month/year)
    if (field.name === "Age") {
      if (
        $(`#${curationModeSelectorPrefix}bootbox-sample-age-info`).val() !==
          "Select" &&
        $(`#${curationModeSelectorPrefix}bootbox-sample-age-info`).val() !==
          "N/A"
      ) {
        field.value =
          field.value +
          " " +
          $(`#${curationModeSelectorPrefix}#bootbox-sample-age-info`).val();
      } else {
        field.value = field.value;
      }
    }
    valuesArr.push(field.value);
  }
  samplesTableData[0] = headersArrSamples;
  if (valuesArr !== undefined && valuesArr.length !== 0) {
    if (curationMode === "free-form") {
      if (samplesTableData[dataLength] !== undefined) {
        samplesTableData[dataLength + 1] = valuesArr;
      } else {
        samplesTableData[dataLength] = valuesArr;
      }
    }
  }
  if (curationMode === "guided") {
    let subjectID = $("#guided-metadata-sample-subject-id").text();
    let sampleID = $("#guided-metadata-sample-id").text();
    samplesTableData[0].unshift("subject id", "sample id");
    valuesArr.unshift(subjectID, sampleID);
    let duplicateSampleIndex = null;
    for (let i = 1; i < samplesTableData.length; i++) {
      if (samplesTableData[i][1] === sampleID) {
        duplicateSampleIndex = i;
      }
    }
    if (duplicateSampleIndex !== null) {
      //If the sample ID is already in the table, update old sample metadata with new
      samplesTableData[duplicateSampleIndex] = valuesArr;
    } else {
      if (samplesTableData[dataLength] !== undefined) {
        samplesTableData[dataLength + 1] = valuesArr;
      } else {
        samplesTableData[dataLength] = valuesArr;
      }
    }
  }
  if (curationMode === "free-form") {
    $("#table-samples").css("display", "block");
    $("#button-generate-samples").css("display", "block");
    clearAllSubjectFormFields(samplesFormDiv);
    hideForm("sample");
  }
}

function addSampleIDtoJSON(sampleID) {
  if ($("#form-add-a-sample").length > 0) {
    addSampleMetadataEntriesIntoJSON("free-form");
  }
}

// associated with the edit icon (edit a subject)
function edit_current_subject_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(ev, subjectID);
}
function edit_current_sample_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[1].innerText;
  var sampleID = $(currentRow)[0].cells[2].innerText;
  loadSampleInformation(ev, subjectID, sampleID);
}
async function edit_current_protocol_id(ev) {
  var currentRow = $(ev).parents()[2];
  var link = $(currentRow)[0].cells[1].innerText;
  var type = $(currentRow)[0].cells[2].innerText;
  var relation = $(currentRow)[0].cells[3].innerText;
  var desc = $(currentRow)[0].cells[4].innerText;
  let protocolLink = "";

  const { value: values } = await Swal.fire({
    title: "Edit protocol",
    html:
      '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL" value="' +
      link +
      '"/>' +
      '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description">' +
      desc +
      "</textarea>",
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    didOpen: () => {
      $("#DD-protocol-link-select").val(type);
      $("#DD-protocol-link-relation").val(relation);
    },
    preConfirm: () => {
      let link = $("#DD-protocol-link").val();
      if ($("#DD-protocol-link").val() === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      } else {
        if (doiRegex.declared({ exact: true }).test(link) === true) {
          //format must begin with doi:
          //example: doi:10.1000/xyz000
          protocolLink = "DOI";
        } else {
          //check if link is a valid URL
          if (validator.isURL(link) != true) {
            Swal.showValidationMessage("Please enter a valid link");
          } else {
            if (link.includes("doi")) {
              //link is valid url and checks for 'doi' in link
              protocolLink = "DOI";
            } else {
              protocolLink = "URL";
            }
          }
        }
      }
      if ($("#DD-protocol-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
      }
      let duplicate = checkLinkDuplicate(
        $("#DD-protocol-link").val(),
        document.getElementById("protocol-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage(
          "Duplicate protocol. The protocol you entered is already added."
        );
      }
      //need to check for duplicates here
      return [
        $("#DD-protocol-link").val(),
        protocolLink,
        "IsProtocolFor",
        $("#DD-protocol-description").val(),
      ];
    },
  });

  if (values) {
    $(currentRow)[0].cells[1].innerHTML =
      "<a href='" + values[0] + "' target='_blank'>" + values[0] + "</a>";
    $(currentRow)[0].cells[2].innerHTML = values[1];
    $(currentRow)[0].cells[3].innerHTML = values[2];
    $(currentRow)[0].cells[4].innerText = values[3];
  }
}

async function edit_current_additional_link_id(ev) {
  var currentRow = $(ev).parents()[2];
  var link = $(currentRow)[0].cells[1].innerText;
  var linkType = $(currentRow)[0].cells[2].innerText;
  var linkRelation = $(currentRow)[0].cells[3].innerText;
  var desc = $(currentRow)[0].cells[4].innerText;
  const { value: values } = await Swal.fire({
    title: "Edit link",
    html:
      '<label>URL or DOI: <i class="fas fa-info-circle swal-popover" data-content="Specify your actual URL (if resource is public) or DOI (if resource is private). This can be web links to repositories or papers (DOI)."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-other-link" class="swal2-input" placeholder="Enter a URL" value="' +
      link +
      '"/>' +
      '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common URLs or DOIs used in SPARC datasets. </br> The value in this field must be read as the \'relationship that this dataset has to the specified URL/DOI\'."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-other-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsCitedBy">IsCitedBy</option><option value="Cites">Cites</option><option value="IsSupplementTo">IsSupplementTo</option><option value="IsSupplementedBy">IsSupplementedBy</option><option value="IsContinuedByContinues">IsContinuedByContinues</option><option value="IsDescribedBy">IsDescribedBy</option><option value="Describes">Describes</option><option value="HasMetadata">HasMetadata</option><option value="IsMetadataFor">IsMetadataFor</option><option value="HasVersion">HasVersion</option><option value="IsVersionOf">IsVersionOf</option><option value="IsNewVersionOf">IsNewVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="HasPart">HasPart</option><option value="IsPublishedIn">IsPublishedIn</option><option value="IsReferencedBy">IsReferencedBy</option><option value="References">References</option><option value="IsDocumentedBy">IsDocumentedBy</option><option value="Documents">Documents</option><option value="IsCompiledBy">IsCompiledBy</option><option value="Compiles">Compiles</option><option value="IsVariantFormOf">IsVariantFormOf</option><option value="IsOriginalFormOf">IsOriginalFormOf</option><option value="IsIdenticalTo">IsIdenticalTo</option><option value="IsReviewedBy">IsReviewedBy</option><option value="Reviews">Reviews</option><option value="IsDerivedFrom">IsDerivedFrom</option><option value="IsSourceOf">IsSourceOf</option><option value="IsRequiredBy">IsRequiredBy</option><option value="Requires">Requires</option><option value="IsObsoletedBy">IsObsoletedBy</option><option value="Obsoletes">Obsoletes</option></select>' +
      '<label>Link description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-other-description" class="swal2-textarea" placeholder="Enter a description">' +
      desc +
      "</textarea>",
    focusConfirm: false,
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $("#DD-other-link-type").val(linkType);
      $("#DD-other-link-relation").val(linkRelation);
    },
    preConfirm: () => {
      if ($("#DD-other-link-type").val() === "Select") {
        Swal.showValidationMessage(`Please select a type of links!`);
      }
      if ($("#DD-other-link").val() === "") {
        Swal.showValidationMessage(`Please enter a link.`);
      }
      if ($("#DD-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please enter a link relation.`);
      }
      if ($("#DD-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
      }
      return [
        $("#DD-other-link").val(),
        $("#DD-other-link-type").val(),
        $("#DD-other-link-relation").val(),
        $("#DD-other-description").val(),
      ];
    },
  });
  if (values) {
    // $(currentRow)[0].cells[1].innerText = values[0];
    $(currentRow)[0].cells[1].innerHTML =
      "<a href='" + values[0] + "' target='_blank'>" + values[0] + "</a>";
    $(currentRow)[0].cells[2].innerText = values[1];
    $(currentRow)[0].cells[3].innerText = values[2];
    $(currentRow)[0].cells[4].innerText = values[3];
  }
}

function loadSubjectInformation(ev, subjectID) {
  // 1. load fields for form
  showForm("display", true);
  $("#btn-edit-subject").css("display", "inline-block");
  $("#btn-add-subject").css("display", "none");
  clearAllSubjectFormFields(subjectsFormDiv);
  populateForms(subjectID, "", "free-form");
  $("#btn-edit-subject").unbind("click");
  $("#btn-edit-subject").click(function () {
    editSubject(ev, subjectID);
  });
  $("#new-custom-header-name").keyup(function () {
    var customName = $(this).val().trim();
    if (customName !== "") {
      $("#button-confirm-custom-header-name").show();
    } else {
      $("#button-confirm-custom-header-name").hide();
    }
  });
}

function populateForms(subjectID, type, curationMode) {
  //Initialize variables shared between different curation modes and set them
  //based on curationMode passed in as parameter
  let fieldArr;
  let curationModeSelectorPrefix;

  if (curationMode === "free-form") {
    curationModeSelectorPrefix = "";
    fieldArr = $(subjectsFormDiv).children().find(".subjects-form-entry");

    if (subjectsTableData.length > 1) {
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          infoJson = subjectsTableData[i];
          break;
        }
      }
    }
  }
  if (curationMode === "guided") {
    curationModeSelectorPrefix = "guided-";
    fieldArr = $(guidedSubjectsFormDiv).children().find(".subjects-form-entry");
    if (subjectsTableData.length > 1) {
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          //Create a copy of matched table element as infoJson and remove the first element
          infoJson = subjectsTableData[i].slice();
          infoJson.shift();
          break;
        }
      }
    }
  }

  if (subjectID !== "clear" && subjectID.trim() !== "") {
    // populate form
    var emptyEntries = ["nan", "nat"];
    var c = fieldArr.map(function (i, field) {
      if (infoJson[i]) {
        if (!emptyEntries.includes(infoJson[i].toLowerCase())) {
          if (field.name === "Age") {
            var fullAge = infoJson[i].split(" ");
            var unitArr = ["hours", "days", "weeks", "months", "years"];
            var breakBoolean = false;
            field.value = fullAge[0];
            for (var unit of unitArr) {
              if (fullAge[1]) {
                if (unit.includes(fullAge[1].toLowerCase())) {
                  $(
                    `#${curationModeSelectorPrefix}bootbox-subject-age-info`
                  ).val(unit);
                  breakBoolean = true;
                  break;
                }
                if (!breakBoolean) {
                  $(
                    `#${curationModeSelectorPrefix}bootbox-subject-age-info`
                  ).val("N/A");
                }
              } else {
                $(`#${curationModeSelectorPrefix}bootbox-subject-age-info`).val(
                  "N/A"
                );
              }
            }
          } else if (field.name === "Species" && infoJson[i] !== "") {
            $(`#${curationModeSelectorPrefix}bootbox-subject-species`).val(
              infoJson[i]
            );
            // manipulate the Add Strains/Species UI accordingly
            switchSpeciesStrainInput("species", "edit", curationMode);
          } else if (field.name === "Strain" && infoJson[i] !== "") {
            $(`#${curationModeSelectorPrefix}bootbox-subject-species`).val(
              infoJson[i]
            );
            switchSpeciesStrainInput("strain", "edit", curationMode);
          } else {
            if (type === "import") {
              if (field.name === "subject id") {
                field.value = "";
              } else {
                field.value = infoJson[i];
              }
            } else {
              field.value = infoJson[i];
            }
          }
        } else {
          field.value = "";
        }
      } else {
        if (field.name === "Sex" && infoJson[i] === "") {
          $("#bootbox-subject-sex").val("Unknown");
        }
      }
    });
  }
}

function populateFormsSamples(subjectID, sampleID, type, curationMode) {
  //Initialize variables shared between different curation modes and set them
  //based on curationMode passed in as parameter
  let fieldArr;
  let curationModeSelectorPrefix;

  if (curationMode === "free-form") {
    curationModeSelectorPrefix = "";
    fieldArr = $(samplesFormDiv).children().find(".samples-form-entry");

    if (samplesTableData.length > 1) {
      for (var i = 1; i < samplesTableData.length; i++) {
        if (
          samplesTableData[i][0] === subjectID &&
          samplesTableData[i][1] === sampleID
        ) {
          infoJson = samplesTableData[i];
          break;
        }
      }
    }
  }
  if (curationMode === "guided") {
    curationModeSelectorPrefix = "guided-";
    fieldArr = $(guidedSamplesFormDiv).children().find(".samples-form-entry");
    if (samplesTableData.length > 1) {
      for (var i = 1; i < samplesTableData.length; i++) {
        if (
          samplesTableData[i][0] === subjectID &&
          samplesTableData[i][1] === sampleID
        ) {
          //Create a copy of matched table element as infoJson and remove the first 2 elements
          infoJson = samplesTableData[i].slice();
          infoJson.shift();
          infoJson.shift();
          break;
        }
      }
    }
  }

  if (sampleID !== "clear" && sampleID.trim() !== "") {
    // populate form
    console.log(fieldArr);
    var emptyEntries = ["nan", "nat"];
    var c = fieldArr.map(function (i, field) {
      if (infoJson[i]) {
        if (!emptyEntries.includes(infoJson[i].toLowerCase())) {
          if (field.name === "Age") {
            var fullAge = infoJson[i].split(" ");
            var unitArr = ["hours", "days", "weeks", "months", "years"];
            var breakBoolean = false;
            field.value = fullAge[0];
            if (fullAge[1]) {
              for (var unit of unitArr) {
                if (unit.includes(fullAge[1].toLowerCase())) {
                  $(`#${curationModePrefix}bootbox-sample-age-info`).val(unit);
                  breakBoolean = true;
                  break;
                }
                if (!breakBoolean) {
                  $(`#${curationModePrefix}bootbox-sample-age-info`).val("N/A");
                }
              }
            } else {
              $(`#${curationModePrefix}bootbox-sample-age-info`).val("N/A");
            }
          } else {
            if (type === "import") {
              if (field.name === "subject id") {
                field.value = "";
              } else if (field.name === "sample id") {
                field.value = "";
              } else {
                field.value = infoJson[i];
              }
            } else {
              field.value = infoJson[i];
            }
          }
        } else {
          field.value = "";
        }
      }
    });
  }
}

function loadSampleInformation(ev, subjectID, sampleID) {
  // 1. load fields for form
  showFormSamples("display", true);
  $("#btn-edit-sample").css("display", "inline-block");
  $("#btn-add-sample").css("display", "none");
  clearAllSubjectFormFields(samplesFormDiv);
  populateFormsSamples(subjectID, sampleID, "", "free-form");
  $("#btn-edit-sample").unbind("click");
  $("#btn-edit-sample").click(function () {
    editSample(ev, sampleID);
  });
  $("#new-custom-header-name-samples").keyup(function () {
    var customName = $(this).val().trim();
    if (customName !== "") {
      $("#button-confirm-custom-header-name-samples").show();
    } else {
      $("#button-confirm-custom-header-name-samples").hide();
    }
  });
}

function editSubject(ev, subjectID) {
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value.trim() !== "" &&
      field.value !== undefined &&
      field.value !== "Select"
    ) {
      // if it's age, then add age info input (day/week/month/year)
      if (field.name === "Age") {
        if ($("#bootbox-subject-age-info").val() !== "Select") {
          field.value =
            field.value + " " + $("#bootbox-subject-age-info").val();
        }
      }
      if (field.name === "Sex") {
        if ($("#bootbox-subject-sex").val() === "Unknown") {
          field.value = "";
        } else {
          field.value = field.value;
        }
      }
      subjectsFileData.push(field.value);
    } else {
      subjectsFileData.push("");
    }
  }
  var currentRow = $(ev).parents()[2];
  var newID = $("#bootbox-subject-id").val();
  if (newID === subjectID) {
    for (var i = 1; i < subjectsTableData.length; i++) {
      if (subjectsTableData[i][0] === subjectID) {
        subjectsTableData[i] = subjectsFileData;
        break;
      }
    }
    hideForm("subject");
  } else {
    var table = document.getElementById("table-subjects");
    var duplicate = false;
    var error = "";
    var rowcount = table.rows.length;
    for (var i = 1; i < rowcount; i++) {
      if (newID === table.rows[i].cells[1].innerText) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      error =
        "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id.";
      Swal.fire("Duplicate subject_id", error, "error");
    } else {
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          subjectsTableData[i] = subjectsFileData;
          break;
        }
      }
      $(currentRow)[0].cells[1].innerText = newID;
      hideForm("subject");
    }
  }
  subjectsFileData = [];
}

function editSample(ev, sampleID) {
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value.trim() !== "" &&
      field.value !== undefined &&
      field.value !== "Select"
    ) {
      samplesFileData.push(field.value);
    } else {
      samplesFileData.push("");
    }
  }
  var currentRow = $(ev).parents()[2];
  var newID = $("#bootbox-sample-id").val();
  if (newID === sampleID) {
    for (var i = 1; i < samplesTableData.length; i++) {
      if (samplesTableData[i][1] === sampleID) {
        samplesTableData[i] = samplesFileData;
        break;
      }
    }
    $(currentRow)[0].cells[1].innerText = samplesFileData[0];
    hideForm("sample");
  } else {
    var table = document.getElementById("table-samples");
    var duplicate = false;
    var error = "";
    var rowcount = table.rows.length;
    for (var i = 1; i < rowcount; i++) {
      if (newID === table.rows[i].cells[1].innerText) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      error =
        "A similar sample_id already exists. Please either delete the existing sample_id or choose a different sample_id.";
      Swal.fire("Duplicate sample_id", error, "error");
    } else {
      for (var i = 1; i < samplesTableData.length; i++) {
        if (samplesTableData[i][1] === sampleID) {
          samplesTableData[i] = samplesFileData;
          break;
        }
      }
      $(currentRow)[0].cells[1].innerText = newID;
      hideForm("sample");
    }
  }
  samplesFileData = [];
}

function delete_current_subject_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this subject?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    reverseButtons: reverseSwalButtons,
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("table-subjects"));
      // 2. Delete from JSON
      var subjectID = $(currentRow)[0].cells[1].innerText;
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          subjectsTableData.splice(i, 1);
          break;
        }
      }
    }
  });
}

function delete_current_sample_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this sample?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    reverseButtons: reverseSwalButtons,
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("table-samples"));
      // 2. Delete from JSON
      var sampleId = $(currentRow)[0].cells[1].innerText;
      for (var i = 1; i < samplesTableData.length; i++) {
        if (samplesTableData[i][1] === sampleId) {
          samplesTableData.splice(i, 1);
          break;
        }
      }
    }
  });
}

function delete_current_protocol_id(ev, curationMode) {
  Swal.fire({
    title: "Are you sure you want to delete this protocol?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    reverseButtons: reverseSwalButtons,
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      let protocolLinkTable;
      if (curationMode === "free-form") {
        protocolLinkTable = document.getElementById("protocol-link-table-dd");
      }
      if (curationMode === "guided") {
        protocolLinkTable = document.getElementById(
          "guided-protocol-link-table-dd"
        );
      }

      updateIndexForTable(protocolLinkTable);
    }
  });
}

function delete_current_additional_link_id(ev, curationMode) {
  Swal.fire({
    title: "Are you sure you want to delete this link?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Yes",
    reverseButtons: reverseSwalButtons,
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      if (curationMode === "free-form") {
        updateIndexForTable(document.getElementById("other-link-table-dd"));
      }
      if (curationMode === "guided") {
        updateIndexForTable(
          document.getElementById("guided-other-link-table-dd")
        );
      }
    }
  });
}

async function copy_current_subject_id(ev) {
  const { value: newSubject } = await Swal.fire({
    title: "Enter an ID for the new subject:",
    input: "text",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    inputValidator: (value) => {
      if (!value) {
        return "Please enter an ID";
      }
    },
  });
  if (newSubject && newSubject !== "") {
    // // add new row to table
    var message = addNewIDToTableStrict(newSubject, null, "subjects");
    if (message !== "") {
      Swal.fire(message, "", "warning");
    } else {
      var res = addNewIDToTable(newSubject, null, "subjects");
      // add new subject_id to JSON
      // 1. copy from current ev.id (the whole array)
      var currentRow = $(ev).parents()[2];
      var id = currentRow.cells[1].innerText;
      // 2. append that to the end of matrix
      for (var subArr of subjectsTableData.slice(1)) {
        if (subArr[0] === id) {
          var ind = subjectsTableData.indexOf(subArr);
          var newArr = [...subjectsTableData[ind]];
          subjectsTableData.push(newArr);
          // 3. change first entry of that array
          subjectsTableData[subjectsTableData.length - 1][0] = newSubject;
          break;
        }
      }
    }
  }
}

async function copy_current_sample_id(ev) {
  const { value: newSubSam } = await Swal.fire({
    title: "Enter an ID for the new subject and sample: ",
    html:
      '<input id="new-subject" class="swal2-input" placeholder="Subject ID">' +
      '<input id="new-sample" class="swal2-input" placeholder="Sample ID">',
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    preConfirm: () => {
      return [
        document.getElementById("new-subject").value,
        document.getElementById("new-sample").value,
      ];
    },
  });
  if (newSubSam && (newSubSam[0] !== "") & (newSubSam[1] !== "")) {
    var message = addNewIDToTableStrict(newSubSam[1], newSubSam[0], "samples");
    if (message !== "") {
      Swal.fire(message, "", "warning");
    } else {
      var res = addNewIDToTable(newSubSam[1], newSubSam[0], "samples");
      // // add new row to table
      // add new subject_id to JSON
      // 1. copy from current ev.id (the whole array)
      var currentRow = $(ev).parents()[2];
      var id1 = currentRow.cells[1].innerText;
      var id2 = currentRow.cells[2].innerText;
      // 2. append that to the end of matrix
      for (var samArr of samplesTableData.slice(1)) {
        if (samArr[0] === id1 && samArr[1] === id2) {
          var ind = samplesTableData.indexOf(samArr);
          var newArr = [...samplesTableData[ind]];
          samplesTableData.push(newArr);
          // 3. change first entry of that array
          samplesTableData[samplesTableData.length - 1][0] = newSubSam[0];
          samplesTableData[samplesTableData.length - 1][1] = newSubSam[1];
          break;
        }
      }
    }
  }
}

function updateIndexForTable(table) {
  console.log(table);
  // disable table to prevent further row-moving action before the updateIndexForTable finishes

  if (table === document.getElementById("table-subjects")) {
    $("#table-subjects").css("pointer-events", "none");
  } else if (table === document.getElementById("table-samples")) {
    $("#table-samples").css("pointer-events", "none");
  }
  var rowcount = table.rows.length;
  var index = 1;
  for (var i = 1; i < rowcount; i++) {
    table.rows[i].cells[0].innerText = index;
    index = index + 1;
  }
  if (rowcount === 1) {
    table.style.display = "none";
    console.log(table);
    if (table === document.getElementById("table-subjects")) {
      $("#button-generate-subjects").css("display", "none");
    } else if (table === document.getElementById("table-samples")) {
      $("#button-generate-samples").css("display", "none");
    } else if (
      table === document.getElementById("table-current-contributors")
    ) {
      document.getElementById("div-contributor-table-dd").style.display =
        "none";
    } else if (table === document.getElementById("protocol-link-table-dd")) {
      document.getElementById("protocol-link-table-dd").style.display = "none";
      document.getElementById("div-protocol-link-table-dd").style.display =
        "none";
    } else if (
      table === document.getElementById("guided-protocol-link-table-dd")
    ) {
      document.getElementById("guided-protocol-link-table-dd").style.display =
        "none";
      document.getElementById(
        "guided-div-protocol-link-table-dd"
      ).style.display = "none";
    } else if (table === document.getElementById("other-link-table-dd")) {
      document.getElementById("other-link-table-dd").style.display = "none";
      document.getElementById("div-other-link-table-dd").style.display = "none";
    } else if (
      table === document.getElementById("guided-other-link-table-dd")
    ) {
      document.getElementById("guided-other-link-table-dd").style.display =
        "none";
      document.getElementById("guided-div-other-link-table-dd").style.display =
        "none";
    }
  }
  $("#table-subjects").css("pointer-events", "auto");
  $("#table-samples").css("pointer-events", "auto");
}

function updateOrderIDTable(table, json, type) {
  var length = table.rows.length;
  // 1. make a new json object - orderedTableData
  var orderedTableData = [];
  // 2. add headers as the first array
  orderedTableData[0] = json[0];
  // 3. loop through the UI table by index -> grab subject_id accordingly, find subject_id in json, append that to orderedSubjectsTableData
  i = 1;
  if (type === "subjects") {
    j = 0;
  } else if (type === "samples") {
    j = 1;
  }
  for (var index = 1; index < length; index++) {
    var id = table.rows[index].cells[j + 1].innerText;
    for (var ind of json.slice(1)) {
      if (ind[j] === id) {
        orderedTableData[i] = ind;
        i += 1;
        break;
      }
    }
  }
  if (type === "subjects") {
    subjectsTableData = orderedTableData;
  } else if (type === "samples") {
    samplesTableData = orderedTableData;
  }
}

function updateOrderContributorTable(table, json) {
  var length = table.rows.length;
  // 1. make a new json object - orderedTableData
  var orderedTableData = [];
  // 2. loop through the UI table by index -> grab subject_id accordingly, find subject_id in json, append that to orderedSubjectsTableData
  i = 0;
  for (var index = 1; index < length; index++) {
    var name = table.rows[index].cells[1].innerText;
    for (var con of json) {
      if (con.conName === name) {
        orderedTableData[i] = con;
        i += 1;
        break;
      }
    }
  }
  contributorArray = orderedTableData;
}
//
// function generateSubjects() {
//   ipcRenderer.send("open-folder-dialog-save-subjects", "subjects.xlsx");
// }
//
// function generateSamples() {
//   ipcRenderer.send("open-folder-dialog-save-samples", "samples.xlsx");
// }

function showPrimaryBrowseFolder() {
  ipcRenderer.send("open-file-dialog-local-primary-folder");
}
function showPrimaryBrowseFolderSamples() {
  ipcRenderer.send("open-file-dialog-local-primary-folder-samples");
}

function importPrimaryFolderSubjects(folderPath) {
  headersArrSubjects = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSubjects.push(field.name);
  }
  if (folderPath === "Browse here") {
    Swal.fire({
      title: "No folder chosen",
      text: "Please select a path to your primary folder.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });
  } else {
    if (path.parse(folderPath).base !== "primary") {
      Swal.fire({
        title: "Incorrect folder name",
        text: "Your folder must be named 'primary' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });
    } else {
      var folders = fs.readdirSync(folderPath);
      var j = 1;
      subjectsTableData[0] = headersArrSubjects;
      for (var folder of folders) {
        subjectsFileData = [];
        var stats = fs.statSync(path.join(folderPath, folder));
        if (stats.isDirectory()) {
          subjectsFileData[0] = folder;
          for (var i = 1; i < 27; i++) {
            subjectsFileData.push("");
          }
          subjectsTableData[j] = subjectsFileData;
          j += 1;
        }
      }
      subjectsFileData = [];
      var subIDArray = [];
      // grab and confirm with users about their sub-ids
      for (var index of subjectsTableData.slice(1)) {
        subIDArray.push(index[0]);
      }
      Swal.fire({
        title: "Please confirm the subject id(s) below:",
        text: "The subject_ids are: " + subIDArray.join(", "),
        icon: "warning",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        showConfirmButton: true,
        confirmButtonText: "Yes, correct",
        cancelButtonText: "No",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      }).then((result) => {
        if (result.isConfirmed) {
          if (subjectsTableData.length > 1) {
            loadSubjectsDataToTable();
            $("#table-subjects").show();
            $("#div-import-primary-folder-subjects").hide();
          } else {
            Swal.fire(
              "Could not load subject IDs from the imported primary folder!",
              "Please check that you provided the correct path to a SPARC primary folder that has at least 1 subject folder.",
              "error"
            );
          }
        }
      });
    }
  }
}
function importPrimaryFolderSamples(folderPath) {
  headersArrSamples = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSamples.push(field.name);
  }
  // var folderPath = $("#primary-folder-destination-input-samples").prop("placeholder");
  if (folderPath === "Browse here") {
    Swal.fire({
      title: "No folder chosen",
      text: "Please select a path to your primary folder.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });
  } else {
    if (path.parse(folderPath).base !== "primary") {
      Swal.fire({
        title: "Incorrect folder name",
        text: "Your folder must be named 'primary' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });
    } else {
      var folders = fs.readdirSync(folderPath);
      var j = 1;
      samplesTableData[0] = headersArrSamples;
      for (var folder of folders) {
        var statsSubjectID = fs.statSync(path.join(folderPath, folder));
        if (statsSubjectID.isDirectory()) {
          var subjectFolder = fs.readdirSync(path.join(folderPath, folder));
          for (var subfolder of subjectFolder) {
            var statsSampleID = fs.statSync(
              path.join(folderPath, folder, subfolder)
            );
            if (statsSampleID.isDirectory()) {
              samplesFileData = [];
              samplesFileData[0] = folder;
              samplesFileData[1] = subfolder;
              for (var i = 2; i < 18; i++) {
                samplesFileData.push("");
              }
              samplesTableData[j] = samplesFileData;
              j += 1;
            }
          }
        }
      }
      samplesFileData = [];
      var subIDArray = [];
      var samIDArray = [];
      // grab and confirm with users about their sub-ids
      for (var index of samplesTableData.slice(1)) {
        subIDArray.push(index[0]);
        samIDArray.push(index[1]);
      }
      Swal.fire({
        title: "Please confirm the subject id(s) and sample id(s) below:",
        html:
          "The subject_id(s) are: " +
          subIDArray.join(", ") +
          "<br> The sample_id(s) are: " +
          samIDArray.join(", "),
        icon: "warning",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        showConfirmButton: true,
        confirmButtonText: "Yes, correct",
        cancelButtonText: "No",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      }).then((result) => {
        if (result.isConfirmed) {
          if (samplesTableData.length > 1) {
            loadSamplesDataToTable();
            $("#table-samples").show();
            $("#div-import-primary-folder-samples").hide();
            // $("#div-confirm-primary-folder-import-samples").hide();
            // $("#button-fake-confirm-primary-folder-load-samples").click();
          } else {
            Swal.fire(
              "Could not load samples IDs from the imported primary folder!",
              "Please check that you provided the correct path to a SPARC primary folder that has at least 1 subject folder and 1 sample folder.",
              "error"
            );
          }
        }
      });
    }
  }
}

function loadSubjectsDataToTable() {
  var iconMessage = "success";
  var showConfirmButtonBool = false;
  // var text =
  //   "Please add or edit your subject_id(s) in the following subjects table.";
  // delete table rows except headers
  $("#table-subjects tr:gt(0)").remove();
  for (var i = 1; i < subjectsTableData.length; i++) {
    var message = addNewIDToTable(subjectsTableData[i][0], null, "subjects");
  }
  if (message !== "") {
    Swal.fire({
      title: "Loaded successfully!",
      text: message,
      icon: "warning",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  } else {
    Swal.fire({
      title: "Loaded successfully!",
      html: 'Add or edit your subject_id(s) in the following table. <br><br><b>Note</b>: Any value that does not follow SPARC standards (For example: Values for the fields: "Sex", "Age category", and "Handedness") will be not be imported by SODA.',
      icon: "success",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  }
  Swal.fire({
    title: "Loaded successfully!",
    html: 'Add or edit your subject_id(s) in the following table. <br><br><b>Note</b>: Any value that does not follow SPARC standards (For example: Values for the fields: "Sex", "Age category", and "Handedness") will be not be imported by SODA.',
    icon: iconMessage,
    showConfirmButton: true,
    // timer: 1200,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });
  $("#button-generate-subjects").css("display", "block");
  $("#div-import-primary-folder-subjects").hide();
}

function loadSamplesDataToTable() {
  // delete table rows except headers
  $("#table-samples tr:gt(0)").remove();
  for (var i = 1; i < samplesTableData.length; i++) {
    var message = addNewIDToTable(
      samplesTableData[i][1],
      samplesTableData[i][0],
      "samples"
    );
  }
  if (message !== "") {
    Swal.fire({
      title: "Loaded successfully!",
      text: message,
      icon: "warning",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  } else {
    Swal.fire({
      title: "Loaded successfully!",
      html: 'Add or edit your sample_id(s) in the following table. <br><br><b>Note</b>: Any value that does not follow SPARC standards (For example: Values for the fields: "Sample type", "Laterality", and "Plane of section") will be not be imported by SODA.',
      icon: "success",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  }
  $("#button-generate-samples").css("display", "block");
  $("#div-import-primary-folder-samples").hide();
}

function resetSubjects() {
  Swal.fire({
    text: "Are you sure you want to start over and reset your progress?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-subjects-1").removeClass("prev");
      $("#Question-prepare-subjects-1").nextAll().removeClass("show");
      $("#Question-prepare-subjects-1").nextAll().removeClass("prev");
      $("#Question-prepare-subjects-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-subjects-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );
      $("#Question-prepare-subjects-2").find("button").show();
      $("#div-confirm-primary-folder-import").find("button").hide();

      $("#Question-prepare-subjects-primary-import")
        .find("input")
        .prop("placeholder", "Browse here");
      subjectsFileData = [];
      subjectsTableData = [];

      $("#existing-subjects-file-destination").attr(
        "placeholder",
        "Browse here"
      );

      $("#div-confirm-existing-subjects-import").hide();

      // hide Strains and Species
      $("#bootbox-subject-species").css("display", "none");
      $("#bootbox-subject-strain").css("display", "none");

      // delete custom fields (if any)
      var fieldLength = $(".subjects-form-entry").length;
      if (fieldLength > 18) {
        for (var field of $(".subjects-form-entry").slice(18, fieldLength)) {
          $($(field).parents()[2]).remove();
        }
      }
      // show Primary import hyperlink again
      $("#div-import-primary-folder-subjects").show();

      // delete table rows except headers
      $("#table-subjects tr:gt(0)").remove();
      $("#table-subjects").css("display", "none");

      $("#div-import-primary-folder-subjects").show();

      // Hide Generate button
      $("#button-generate-subjects").css("display", "none");

      $("#button-add-a-subject").show();

      $("#input-destination-generate-subjects-locally").attr(
        "placeholder",
        "Browse here"
      );
      $("#div-confirm-destination-subjects-locally").css("display", "none");
    }
  });
}

function resetSamples() {
  Swal.fire({
    text: "Are you sure you want to start over and reset your progress?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-samples-1").removeClass("prev");
      $("#Question-prepare-samples-1").nextAll().removeClass("show");
      $("#Question-prepare-samples-1").nextAll().removeClass("prev");
      $("#Question-prepare-samples-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-samples-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );
      $("#Question-prepare-samples-2").find("button").show();
      $("#div-confirm-primary-folder-import-samples").find("button").hide();

      $("#Question-prepare-subjects-primary-import-samples")
        .find("input")
        .prop("placeholder", "Browse here");
      samplesFileData = [];
      samplesTableData = [];

      $("#existing-samples-file-destination").attr(
        "placeholder",
        "Browse here"
      );
      $("#div-confirm-existing-samples-import").hide();

      // hide Strains and Species
      $("#bootbox-sample-species").css("display", "none");
      $("#bootbox-sample-strain").css("display", "none");

      // delete custom fields (if any)
      var fieldLength = $(".samples-form-entry").length;
      if (fieldLength > 21) {
        for (var field of $(".samples-form-entry").slice(21, fieldLength)) {
          $($(field).parents()[2]).remove();
        }
      }
      $("#div-import-primary-folder-samples").show();
      // delete table rows except headers
      $("#table-samples tr:gt(0)").remove();
      $("#table-samples").css("display", "none");
      // Hide Generate button
      $("#button-generate-samples").css("display", "none");

      $("#button-add-a-sample").show();

      $("#input-destination-generate-samples-locally").attr(
        "placeholder",
        "Browse here"
      );
      $("#div-confirm-destination-samples-locally").css("display", "none");
    }
  });
}

// functions below are to show/add/cancel a custom header
async function addCustomField(type, curationMode) {
  let subjectsHeaderArray = null;
  let samplesHeaderArray = null;
  if (curationMode == "free-form") {
    subjectsHeaderArray = headersArrSubjects;
    samplesHeaderArray = headersArrSamples;
  }
  if (curationMode == "guided") {
    subjectsHeaderArray = guidedHeadersArrSubjects;
    samplesHeaderArray = guidedHeadersArrSamples;
  }
  if (type === "subjects") {
    var lowercaseCasedArray = $.map(
      subjectsHeaderArray,
      function (item, index) {
        return item.toLowerCase();
      }
    );
    const { value: customField } = await Swal.fire({
      title: "Enter a custom field:",
      input: "text",
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a custom field";
        } else {
          if (lowercaseCasedArray.includes(value.toLowerCase())) {
            return "Duplicate field name! <br> You entered a custom field that is already listed.";
          }
        }
      },
    });
    if (customField) {
      addCustomHeader("subjects", customField, curationMode);
    }
  } else if (type === "samples") {
    var lowercaseCasedArray = $.map(samplesHeaderArray, function (item, index) {
      return item.toLowerCase();
    });
    const { value: customField } = await Swal.fire({
      title: "Enter a custom field:",
      input: "text",
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a custom field";
        } else {
          if (samplesHeaderArray.includes(value.toLowerCase())) {
            return "Duplicate field name! <br> You entered a custom field that is already listed.";
          }
        }
      },
    });
    if (customField) {
      addCustomHeader("samples", customField, curationMode);
    }
  }
}

function addCustomHeader(type, customHeaderValue, curationMode) {
  let curationModeSelectorPrefix = "";
  if (curationMode == "guided") {
    curationModeSelectorPrefix = "guided-";
  }
  var customName = customHeaderValue.trim();
  if (type === "subjects") {
    var divElement =
      '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
      customName +
      ':</font></div></div><div class="demo-controls-body"><div class="ui input modified"><input class="subjects-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
      customName +
      '" name="' +
      customName +
      '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
      customName +
      '\', 0)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
    $(`#${curationModeSelectorPrefix}accordian-custom-fields`).append(
      divElement
    );
    if (curationMode == "free-form") {
      headersArrSubjects.push(customName);
      // add empty entries for all of the other sub_ids to normalize the size of matrix
      for (var subId of subjectsTableData.slice(1, subjectsTableData.length)) {
        subId.push("");
      }
    }
    if (curationMode == "guided") {
      guidedHeadersArrSubjects.push(customName);
      // add empty entries for all of the other sub_ids to normalize the size of matrix
      for (var subId of subjectsTableData.slice(1, subjectsTableData.length)) {
        subId.push("");
      }
    }
  } else if (type === "samples") {
    var divElement =
      '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
      customName +
      ':</font></div></div><div class="demo-controls-body"><div class="ui input modified"><input class="samples-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
      customName +
      '" name="' +
      customName +
      '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
      customName +
      '\', 1)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
    $(`#${curationModeSelectorPrefix}accordian-custom-fields-samples`).append(
      divElement
    );
    if (curationMode == "free-form") {
      headersArrSamples.push(customName);
      // add empty entries for all of the other sub_ids to normalize the size of matrix
      for (var sampleId of samplesTableData.slice(1, samplesTableData.length)) {
        sampleId.push("");
      }
    }
    if (curationMode == "guided") {
      guidedHeadersArrSamples.push(customName);
      for (var sampleId of guidedSamplesTableData.slice(
        1,
        guidedSamplesTableData.length
      )) {
        sampleId.push("");
      }
    }
  }
}

function deleteCustomField(ev, customField, category) {
  //  category 0 => subjects;
  // category 1 => samples
  Swal.fire({
    text: "Are you sure you want to delete this custom field?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      $(ev).parents()[1].remove();
      if (category === 0) {
        if (headersArrSubjects.includes(customField)) {
          headersArrSubjects.splice(headersArrSubjects.indexOf(customField), 1);
        }
      } else {
        if (headersArrSamples.includes(customField)) {
          headersArrSamples.splice(headersArrSamples.indexOf(customField), 1);
        }
      }
    }
  });
}

function addExistingCustomHeader(customName) {
  var divElement =
    '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
    customName +
    ':</font></div></div><div class="demo-controls-body"><div class="ui input"><input class="subjects-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
    customName +
    '" name="' +
    customName +
    '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
    customName +
    '\', 0)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
  $("#accordian-custom-fields").append(divElement);
  headersArrSubjects.push(customName);
}

function addExistingCustomHeaderSamples(customName) {
  var divElement =
    '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
    customName +
    ':</font></div></div><div class="demo-controls-body"><div class="ui input"><input class="samples-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
    customName +
    '" name="' +
    customName +
    '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
    customName +
    '\', 1)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
  $("#accordian-custom-fields-samples").append(divElement);
  headersArrSamples.push(customName);
}

var subjectsDestinationPath = "";
var samplesDestinationPath = "";

$(document).ready(function () {
  loadExistingProtocolInfo();
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSubjects.push(field.name);
  }
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSamples.push(field.name);
  }

  ipcRenderer.on("selected-existing-subjects", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        document.getElementById(
          "existing-subjects-file-destination"
        ).placeholder = filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing subjects.xlsx",
          defaultBfAccount
        );
      } else {
        document.getElementById(
          "existing-subjects-file-destination"
        ).placeholder = "Browse here";
        $("#div-confirm-existing-subjects-import").hide();
      }
    } else {
      document.getElementById(
        "existing-subjects-file-destination"
      ).placeholder = "Browse here";
      $("#div-confirm-existing-subjects-import").hide();
    }
    if (
      document.getElementById("existing-subjects-file-destination")
        .placeholder !== "Browse here"
    ) {
      $("#div-confirm-existing-subjects-import").show();
      $($("#div-confirm-existing-subjects-import button")[0]).show();
    } else {
      $("#div-confirm-existing-subjects-import").hide();
      $($("#div-confirm-existing-subjects-import button")[0]).hide();
    }
  });

  ipcRenderer.on("selected-existing-samples", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        document.getElementById(
          "existing-samples-file-destination"
        ).placeholder = filepath[0];
        // log the successful import to analytics
        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.SAMPLES,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          "Existing",
          Destinations.LOCAL
        );
      } else {
        document.getElementById(
          "existing-samples-file-destination"
        ).placeholder = "Browse here";
        $("#div-confirm-existing-samples-import").hide();
      }
    } else {
      document.getElementById("existing-samples-file-destination").placeholder =
        "Browse here";
      $("#div-confirm-existing-samples-import").hide();
    }
    if (
      document.getElementById("existing-samples-file-destination")
        .placeholder !== "Browse here"
    ) {
      $("#div-confirm-existing-samples-import").show();
      $($("#div-confirm-existing-samples-import button")[0]).show();
    } else {
      $("#div-confirm-existing-samples-import").hide();
      $($("#div-confirm-existing-samples-import button")[0]).hide();
    }
  });

  ipcRenderer.on("selected-existing-DD", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById("existing-dd-file-destination").placeholder =
          filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing dataset_description.xlsx",
          defaultBfAccount
        );
        if (
          document.getElementById("existing-dd-file-destination")
            .placeholder !== "Browse here"
        ) {
          $("#div-confirm-existing-dd-import").show();
          $($("#div-confirm-existing-dd-import button")[0]).show();
        } else {
          $("#div-confirm-existing-dd-import").hide();
          $($("#div-confirm-existing-dd-import button")[0]).hide();
        }
      } else {
        document.getElementById("existing-dd-file-destination").placeholder =
          "Browse here";
        $("#div-confirm-existing-dd-import").hide();
      }
    } else {
      document.getElementById("existing-dd-file-destination").placeholder =
        "Browse here";
      $("#div-confirm-existing-dd-import").hide();
    }
  });

  // generate subjects file
  ipcRenderer.on(
    "selected-destination-generate-subjects-locally",
    (event, dirpath) => {
      if (dirpath.length > 0) {
        document.getElementById(
          "input-destination-generate-subjects-locally"
        ).placeholder = dirpath[0];
        var destinationPath = path.join(dirpath[0], "subjects.xlsx");
        subjectsDestinationPath = destinationPath;
        $("#div-confirm-destination-subjects-locally").css("display", "flex");
      }
    }
  );

  // generate samples file
  ipcRenderer.on(
    "selected-destination-generate-samples-locally",
    (event, dirpath) => {
      if (dirpath.length > 0) {
        document.getElementById(
          "input-destination-generate-samples-locally"
        ).placeholder = dirpath[0];
        var destinationPath = path.join(dirpath[0], "samples.xlsx");
        samplesDestinationPath = destinationPath;
        $("#div-confirm-destination-samples-locally").css("display", "flex");
      }
    }
  );

  $("#bf_dataset_load_subjects").on("DOMSubtreeModified", function () {
    if (
      $("#Question-prepare-subjects-3").hasClass("show") &&
      !$("#Question-prepare-subjects-6").hasClass("show")
    ) {
      $("#Question-prepare-subjects-3").removeClass("show");
    }
    if ($("#bf_dataset_load_subjects").text().trim() !== "None") {
      $("#div-check-bf-import-subjects").css("display", "flex");
      $($("#div-check-bf-import-subjects").children()[0]).show();
    } else {
      $("#div-check-bf-import-subjects").css("display", "none");
    }
  });

  $("#bf_dataset_generate_subjects").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_subjects").text().trim() !== "None") {
      $("#div-check-bf-generate-subjects").css("display", "flex");
    } else {
      $("#div-check-bf-generate-subjects").css("display", "none");
    }
  });

  $("#bf_dataset_load_samples").on("DOMSubtreeModified", function () {
    if (
      $("#Question-prepare-samples-3").hasClass("show") &&
      !$("#Question-prepare-samples-6").hasClass("show")
    ) {
      $("#Question-prepare-samples-3").removeClass("show");
    }
    if ($("#bf_dataset_load_samples").text().trim() !== "None") {
      $("#div-check-bf-import-samples").css("display", "flex");
      $($("#div-check-bf-import-samples").children()[0]).show();
    } else {
      $("#div-check-bf-import-samples").css("display", "none");
    }
  });
  $("#bf_dataset_generate_samples").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_samples").text().trim() !== "None") {
      $("#div-check-bf-generate-samples").css("display", "flex");
    } else {
      $("#div-check-bf-generate-samples").css("display", "none");
    }
  });
});

function showExistingSubjectsFile() {
  if (
    $("#existing-subjects-file-destination").prop("placeholder") !==
    "Browse here"
  ) {
    Swal.fire({
      title: "Are you sure you want to import a different subjects file?",
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
        ipcRenderer.send("open-file-dialog-existing-subjects");
        document.getElementById(
          "existing-subjects-file-destination"
        ).placeholder = "Browse here";
        $("#div-confirm-existing-subjects-import").hide();
        $($("#div-confirm-existing-subjects-import button")[0]).hide();
        $("#Question-prepare-subjects-3").removeClass("show");
      }
    });
  } else {
    ipcRenderer.send("open-file-dialog-existing-subjects");
  }
}

function showExistingSamplesFile() {
  if (
    $("#existing-samples-file-destination").prop("placeholder") !==
    "Browse here"
  ) {
    Swal.fire({
      title: "Are you sure you want to import a different samples file?",
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
        ipcRenderer.send("open-file-dialog-existing-samples");
        document.getElementById(
          "existing-samples-file-destination"
        ).placeholder = "Browse here";
        $("#div-confirm-existing-samples-import").hide();
        $($("#div-confirm-existing-samples-import button")[0]).hide();
        $("#Question-prepare-samples-3").removeClass("show");
      }
    });
  } else {
    ipcRenderer.send("open-file-dialog-existing-samples");
  }
}

function importExistingSubjectsFile() {
  var filePath = $("#existing-subjects-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your subjects.xlsx file,",
      "error"
    );

    // log the error to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  } else {
    if (path.parse(filePath).base !== "subjects.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'subjects.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      // log the error to analytics
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
    } else {
      Swal.fire({
        title: "Loading an existing subjects.xlsx file",
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
      setTimeout(loadSubjectsFileToDataframe, 1000, filePath);
    }
  }
}

function importExistingSamplesFile() {
  var filePath = $("#existing-samples-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your samples.xlsx file.",
      "error"
    );

    // log the error to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SAMPLES,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  } else {
    if (path.parse(filePath).base !== "samples.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'samples.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      // log the error to analytics
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
    } else {
      Swal.fire({
        title: "Loading an existing samples.xlsx file",
        allowEscapeKey: false,
        allowOutsideClick: false,
        html: "Please wait...",
        // timer: 1500,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then((result) => {});
      setTimeout(loadSamplesFileToDataframe(filePath), 1000);
    }
  }
}

async function checkBFImportSubjects() {
  Swal.fire({
    title: "Importing the subjects.xlsx file",
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
  var fieldEntries = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    fieldEntries.push(field.name.toLowerCase());
  }
  let bfDataset = document
    .getElementById("bf_dataset_load_subjects")
    .innerText.trim();

  log.info(`Getting subjects.xlsx for dataset ${bfDataset} from Pennsieve.`);
  try {
    let import_metadata_file = await client.get(
      `/prepare_metadata/import_metadata_file`,
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: bfDataset,
          file_type: "subjects.xlsx",
          ui_fields: fieldEntries.toString(),
        },
      }
    );
    let res = import_metadata_file.data.subject_file_rows;

    // log the success to analytics
    logMetadataForAnalytics(
      "Success",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.PENNSIEVE
    );
    subjectsTableData = res;
    loadDataFrametoUI("bf");
  } catch (error) {
    clientError(error);
    Swal.fire({
      backdrop: "rgba(0, 0, 0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: error.response.data.message,
    });

    // log the error to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
}

async function checkBFImportSamples() {
  Swal.fire({
    title: "Importing the samples.xlsx file",
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
  var fieldEntries = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    fieldEntries.push(field.name.toLowerCase());
  }

  let bfDataset = document.getElementById("bf_dataset_load_samples").innerText;

  log.info(`Getting samples.xlsx for dataset ${bfDataset} from Pennsieve.`);
  try {
    let importMetadataResponse = await client.get(
      `/prepare_metadata/import_metadata_file`,
      {
        params: {
          file_type: "samples.xlsx",
          selected_account: defaultBfAccount,
          selected_dataset: bfDataset,
          ui_fields: fieldEntries.toString(),
        },
      }
    );

    let res = importMetadataResponse.data.sample_file_rows;

    // log the success to analytics
    logMetadataForAnalytics(
      "Success",
      MetadataAnalyticsPrefix.SAMPLES,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.PENNSIEVE
    );
    samplesTableData = res;
    loadDataFrametoUISamples("bf");
  } catch (error) {
    clientError(error);
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: error.response.data.message,
    });

    // log the error to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SAMPLES,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
}

function loadDataFrametoUI(type) {
  var fieldSubjectEntries = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase());
  }
  alert(fieldSubjectEntries);
  // separate regular headers and custom headers
  const lowercasedHeaders = subjectsTableData[0].map((header) =>
    header.toLowerCase()
  );
  const customHeaders = [];
  for (var field of lowercasedHeaders) {
    if (!fieldSubjectEntries.includes(field)) {
      customHeaders.push(field);
    }
  }
  headersArrSubjects = headersArrSubjects.concat(customHeaders);
  for (var headerName of customHeaders) {
    addExistingCustomHeader(headerName);
  }
  // load sub-ids to table
  loadSubjectsDataToTable();
  $("#table-subjects").show();
  if (type === "local") {
    $("#div-confirm-existing-subjects-import").hide();
    $($("#div-confirm-existing-subjects-import button")[0]).hide();
    $("#button-fake-confirm-existing-subjects-file-load").click();
  } else {
    $("#div-check-bf-import-subjects").hide();
    $($("#div-check-bf-import-subjects button")[0]).hide();
    $("#button-fake-confirm-existing-bf-subjects-file-load").click();
    $(
      $("#button-fake-confirm-existing-bf-subjects-file-load").siblings()[0]
    ).hide();
  }
}

function loadDataFrametoUISamples(type) {
  // separate regular headers and custom headers
  const lowercasedHeaders = samplesTableData[0].map((header) =>
    header.toLowerCase()
  );
  var fieldSampleEntries = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase());
  }
  const customHeaders = [];
  for (var field of lowercasedHeaders) {
    if (!fieldSampleEntries.includes(field)) {
      customHeaders.push(field);
    }
  }
  headersArrSamples = headersArrSamples.concat(customHeaders);
  for (var headerName of customHeaders) {
    addExistingCustomHeaderSamples(headerName);
  }
  // load sub-ids to table
  loadSamplesDataToTable();
  $("#table-samples").show();
  if (type === "local") {
    $("#div-confirm-existing-samples-import").hide();
    $($("#div-confirm-existing-samples-import button")[0]).hide();
    $("#button-fake-confirm-existing-samples-file-load").click();
  } else {
    $("#div-check-bf-import-samples").hide();
    $($("#div-check-bf-import-samples button")[0]).hide();
    $("#button-fake-confirm-existing-bf-samples-file-load").click();
    $(
      $("#button-fake-confirm-existing-bf-samples-file-load").siblings()[0]
    ).hide();
  }
}

function preliminaryProtocolStep(type, curationMode) {
  //TODO - add guided mode functionality
  var credentials = loadExistingProtocolInfo();
  if (credentials[0]) {
    // show email for protocol account
    showProtocolCredentials(credentials[1], type, curationMode);
  } else {
    protocolAccountQuestion(type, false);
  }
}

function protocolAccountQuestion(type, changeAccountBoolean) {
  if (changeAccountBoolean) {
    var titleText = "Do you want to connect to a different protocol account?";
  } else {
    var titleText = "Do you have an account with protocol.io?";
  }
  Swal.fire({
    title: titleText,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText:
      '<a target="_blank" href="https://www.protocols.io/developers" style="color:#fff;border-bottom:none">Yes, I do</a>',
    cancelButtonText: "No, I don't",
    allowEscapeKey: false,
    allowOutsideClick: false,
    reverseButtons: reverseSwalButtons,
  }).then(async (result) => {
    if (result.isConfirmed) {
      setTimeout(function () {
        connectProtocol(type);
      }, 1500);
    } else {
      if (!changeAccountBoolean) {
        if (type !== "DD") {
          Swal.fire(
            "Please create an account with protocol.io.",
            "SODA suggests you create an account with protocols.io first. For help with creating and sharing a protocol with SPARC, please visit <a target='_blank' href='https://sparc.science/help/1slXZSS2XtTYQsdY6mEJi5'>this dedicated webpage</a>.",
            "warning"
          );
        } else {
          const { value: formValue } = await Swal.fire({
            title: "Enter a protocol link:",
            text: " For help with creating and sharing a protocol with SPARC, please visit <a target='_blank' href='https://sparc.science/help/1slXZSS2XtTYQsdY6mEJi5'>this dedicated webpage</a>.",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            confirmButtonText: "Add",
            cancelButtonText: "Cancel",
            showCancelButton: true,
            allowEscapeKey: false,
            allowOutsideClick: false,
            html:
              '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL">' +
              '<label>Protocol Type: <i class="fas fa-info-circle swal-popover" data-content="This will state whether your protocol is a \'URL\' or \'DOI\' item. Use one of those two items to reference the type of protocol." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-select" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
              '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common protocols used in SPARC datasets. </br>  The value in this field must be read as the \'relationship that this dataset has to the specified protocol\'." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsProtocolFor">IsProtocolFor</option><option value="HasProtocol">HasProtocol</option><option value="IsSoftwareFor">IsSoftwareFor</option><option value="HasSoftware">HasSoftware</option></select>' +
              '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
            focusConfirm: false,
            preConfirm: () => {
              if ($("#DD-protocol-link").val() === "") {
                Swal.showValidationMessage(`Please enter a link!`);
              }
              if ($("#DD-protocol-link-select").val() === "Select") {
                Swal.showValidationMessage(`Please choose a link type!`);
              }
              if ($("#DD-protocol-link-relation").val() === "Select") {
                Swal.showValidationMessage(`Please choose a link relation!`);
              }
              if ($("#DD-protocol-description").val() === "") {
                Swal.showValidationMessage(`Please enter a short description!`);
              }
              return [
                $("#DD-protocol-link").val(),
                $("#DD-protocol-link-select").val(),
                $("#DD-protocol-link-relation").val(),
                $("#DD-protocol-description").val(),
              ];
            },
          });
          if (formValues) {
            addProtocolLinktoTableDD(
              formValues[0],
              formValues[1],
              formValues[2],
              formValues[3],
              "free-form"
            );
          }
        }
      }
    }
  });
}

async function connectProtocol(type) {
  const { value: protocolCredentials } = await Swal.fire({
    width: "fit-content",
    title:
      "Once you're signed in, grab your <i>private access token</i> and enter it below: ",
    html: '<div class="ui input" style="margin: 10px 0"><i style="margin-top: 12px; margin-right:10px; font-size:20px" class="lock icon"></i><input type="text" id="protocol-password" class="subjects-form-entry" placeholder="Private access token" style="padding-left:5px"></div>',
    imageUrl:
      "https://github.com/fairdataihub/SODA-for-SPARC/blob/main/docs/documentation/Prepare-metadata/subjects/protocol-info.png?raw=true",
    imageWidth: 450,
    imageHeight: 200,
    imageAlt: "Custom image",
    focusConfirm: false,
    confirmButtonText: "Let's connect",
    showCancelButton: true,
    showLoaderOnConfirm: true,
    heightAuto: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    preConfirm: () => {
      var res = document.getElementById("protocol-password").value;
      if (res) {
        return res;
      } else {
        Swal.showValidationMessage("Please provide a access token to connect.");
        return false;
      }
    },
  });
  if (protocolCredentials) {
    sendHttpsRequestProtocol(protocolCredentials.trim(), "first-time", type);
  }
}

const protocolHostname = "www.protocols.io";
var protocolResearcherList = {};

function sendHttpsRequestProtocol(accessToken, accessType, filetype) {
  var protocolList = {};
  var protocolInfo = {
    hostname: protocolHostname,
    port: 443,
    path: `/api/v3/session/profile`,
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  https.get(protocolInfo, (res) => {
    if (res.statusCode === 200) {
      res.setEncoding("utf8");
      res.on("data", async function (body) {
        var bodyRes = JSON.parse(body);
        saveProtocolInfo(accessToken, bodyRes.user.email);
        await grabResearcherProtocolList(
          bodyRes.user.username,
          bodyRes.user.email,
          accessToken,
          accessType,
          filetype
        );
      });
    } else {
      if (accessType === "first-time") {
        Swal.fire(
          "Failed to connect with protocol.io",
          "Please check your access token and try again.",
          "error"
        );
      }
    }
  });
}

function grabResearcherProtocolList(username, email, token, type, filetype) {
  if (type === "first-time") {
    Swal.fire({
      title: "Please wait...",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }
  var protocolInfoList = {
    hostname: protocolHostname,
    port: 443,
    path: `/api/v3/researchers/${username}/protocols?filter="user_all"`,
    headers: { Authorization: `Bearer ${token}` },
  };
  https.get(protocolInfoList, (res) => {
    if (res.statusCode === 200) {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (d) => {
        data += d;
      });
      res.on("end", () => {
        var result = JSON.parse(data);
        protocolResearcherList = {};
        for (var item of result["items"]) {
          protocolResearcherList["https://www.protocols.io/view/" + item.uri] =
            item.title;
        }
        if (Object.keys(protocolResearcherList).length > 0) {
          if (type === "first-time") {
            Swal.fire({
              title:
                "Successfully connected! <br/>Loading your protocol information...",
              timer: 2000,
              timerProgressBar: false,
              allowEscapeKey: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showConfirmButton: false,
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {
              showProtocolCredentials(email, filetype, curationMode);
            });
          }
        } else {
          if (type === "first-time") {
            Swal.fire({
              title: "Successfully connected",
              text: "However, at this moment, you do not have any protocol information for SODA to extract.",
              icon: "success",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          }
        }
      });
    }
  });
}

async function showProtocolCredentials(email, filetype, curationMode) {
  if (Object.keys(protocolResearcherList).length === 0) {
    var warningText = "You currently don't have any protocols.";
  } else {
    var warningText = "Please select a protocol.";
  }
  var htmlEle = `<div><h2>Protocol information: </h2><h3 style="text-align:left;display:flex; flex-direction: row; justify-content: space-between">Email: <span style="font-weight:500; text-align:left">${email}</span><span style="width: 40%; text-align:right"><a onclick="protocolAccountQuestion('${filetype}', true)" style="font-weight:500;text-decoration: underline">Change</a></span></h3><h3 style="text-align:left">Current protocols: </h3></div>`;
  const { value: protocol } = await Swal.fire({
    html: htmlEle,
    input: "select",
    inputOptions: protocolResearcherList,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    inputPlaceholder: "Select a protocol",
    showCancelButton: true,
    confirmButtonText: "Add",
    reverseButtons: reverseSwalButtons,
    inputValidator: (value) => {
      if (value) {
        if (filetype === "DD") {
          if (checkDuplicateLink(value, "protocol-link-table-dd")) {
            return "The link provided is already added to the table. Please provide a different protocol.";
          }
        }
      } else {
        return warningText;
      }
    },
  });
  if (protocol) {
    if (filetype === "subjects") {
      $("#bootbox-subject-protocol-title").val(
        protocolResearcherList[protocol]
      );
      $("#bootbox-subject-protocol-location").val(protocol);
    } else if (filetype === "samples") {
      $("#bootbox-sample-protocol-title").val(protocolResearcherList[protocol]);
      $("#bootbox-sample-protocol-location").val(protocol);
    } else {
      const { value: formValue } = await Swal.fire({
        html:
          '<label>Protocol Type: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-select" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
          '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsProtocolFor">IsProtocolFor</option><option value="HasProtocol">HasProtocol</option><option value="IsSoftwareFor">IsSoftwareFor</option><option value="HasSoftware">HasSoftware</option></select>' +
          '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Optionally provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
        title: "Fill in the below fields to add the protocol: ",
        focusConfirm: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        customClass: "swal-content-additional-link",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          $(".swal-popover").popover();
        },
        preConfirm: () => {
          if ($("#DD-protocol-link-select").val() === "Select") {
            Swal.showValidationMessage(`Please choose a link type!`);
          }
          if ($("#DD-protocol-link-relation").val() === "Select") {
            Swal.showValidationMessage(`Please choose a link relation!`);
          }
          if ($("#DD-protocol-description").val() === "") {
            Swal.showValidationMessage(`Please enter a short description!`);
          }
          var duplicate = checkLinkDuplicate(
            protocol,
            document.getElementById("protocol-link-table-dd")
          );
          if (duplicate) {
            Swal.showValidationMessage(
              "Duplicate protocol. The protocol you entered is already added."
            );
          }
          return [
            protocol,
            $("#DD-protocol-link-select").val(),
            $("#DD-protocol-link-relation").val(),
            $("#DD-protocol-description").val(),
          ];
        },
      });
      if (formValue) {
        addProtocolLinktoTableDD(
          formValue[0],
          formValue[1],
          formValue[2],
          formValue[3],
          "free-form"
        );
      }
    }
  }
}

function saveProtocolInfo(token, email) {
  var content = parseJson(protocolConfigPath);
  content["access-token"] = token;
  content["email"] = email;
  fs.writeFileSync(protocolConfigPath, JSON.stringify(content));
}

function loadExistingProtocolInfo() {
  var protocolExists = false;
  //// config and load live data from Airtable
  var protocolTokenContent = parseJson(protocolConfigPath);
  if (JSON.stringify(protocolTokenContent) !== "{}") {
    var protocolToken = protocolTokenContent["access-token"];
    if (protocolToken.trim() !== "") {
      sendHttpsRequestProtocol(protocolToken.trim(), "upon-loading");
      protocolExists = true;
    }
  }
  return [protocolExists, protocolTokenContent["email"]];
}

async function addAdditionalLink(curationMode) {
  const { value: values } = await Swal.fire({
    title: "Add additional link",
    html:
      '<label>URL or DOI: <i class="fas fa-info-circle swal-popover" data-content="Specify your actual URL (if resource is public) or DOI (if resource is private). This can be web links to repositories or papers (DOI)."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-other-link" class="swal2-input" placeholder="Enter a URL">' +
      '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common URLs or DOIs used in SPARC datasets. </br> The value in this field must be read as the \'relationship that this dataset has to the specified URL/DOI\'."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-other-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsCitedBy">IsCitedBy</option><option value="Cites">Cites</option><option value="IsSupplementTo">IsSupplementTo</option><option value="IsSupplementedBy">IsSupplementedBy</option><option value="IsContinuedByContinues">IsContinuedByContinues</option><option value="IsDescribedBy">IsDescribedBy</option><option value="Describes">Describes</option><option value="HasMetadata">HasMetadata</option><option value="IsMetadataFor">IsMetadataFor</option><option value="HasVersion">HasVersion</option><option value="IsVersionOf">IsVersionOf</option><option value="IsNewVersionOf">IsNewVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="HasPart">HasPart</option><option value="IsPublishedIn">IsPublishedIn</option><option value="IsReferencedBy">IsReferencedBy</option><option value="References">References</option><option value="IsDocumentedBy">IsDocumentedBy</option><option value="Documents">Documents</option><option value="IsCompiledBy">IsCompiledBy</option><option value="Compiles">Compiles</option><option value="IsVariantFormOf">IsVariantFormOf</option><option value="IsOriginalFormOf">IsOriginalFormOf</option><option value="IsIdenticalTo">IsIdenticalTo</option><option value="IsReviewedBy">IsReviewedBy</option><option value="Reviews">Reviews</option><option value="IsDerivedFrom">IsDerivedFrom</option><option value="IsSourceOf">IsSourceOf</option><option value="IsRequiredBy">IsRequiredBy</option><option value="Requires">Requires</option><option value="IsObsoletedBy">IsObsoletedBy</option><option value="Obsoletes">Obsoletes</option></select>' +
      '<label>Link description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-other-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',

    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      var link = $("#DD-other-link").val();
      let confirm_btn = document.getElementsByClassName("swal2-confirm")[0];
      let cancel_btn = document.getElementsByClassName("swal2-cancel")[0];
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
        confirm_btn.removeAttribute("disabled");
        cancel_btn.removeAttribute("disabled");
      } else {
        if (doiRegex.declared({ exact: true }).test(link) === true) {
          protocolLink = "DOI";
        } else {
          //check if link is valid
          if (validator.isURL(link) != true) {
            Swal.showValidationMessage(`Please enter a valid link`);
            confirm_btn.removeAttribute("disabled");
            cancel_btn.removeAttribute("disabled");
          } else {
            //link is valid url and check for 'doi' in link
            if (link.includes("doi")) {
              protocolLink = "DOI";
            } else {
              protocolLink = "URL";
            }
          }
        }
      }

      if ($("#DD-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
      }
      var duplicate = checkLinkDuplicate(
        link,
        document.getElementById("other-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage(
          "Duplicate URL/DOI. The URL/DOI you entered is already added."
        );
      }
      return [
        $("#DD-other-link").val(),
        protocolLink,
        $("#DD-other-link-relation").val(),
        $("#DD-other-description").val(),
      ];
    },
  });
  if (values) {
    addAdditionalLinktoTableDD(
      values[0],
      values[1],
      values[2],
      values[3],
      curationMode
    );
  }
}

function checkLinkDuplicate(link, table) {
  var duplicate = false;
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    var currentLink = table.rows[i].cells[1].innerText;
    if (currentLink === link) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

function hideDescriptionForDOIs() {
  $("#DD-additional-link-description").val("");
  $("#DD-additional-link").val("");
  if ($("#DD-additional-link-type").val() === "Originating Article DOI") {
    $("#DD-additional-link-description").css("display", "none");
    $("#label-additional-link-description").css("display", "none");
  } else if ($("#DD-additional-link-type").val() === "Additional Link") {
    $("#DD-additional-link-description").css("display", "block");
    $("#label-additional-link-description").css("display", "block");
  }
}

function showAgeSection(ev, div, type) {
  var allDivsArr = [];
  if (type === "subjects") {
    allDivsArr = ["div-exact-age", "div-age-category", "div-age-range"];
  } else {
    allDivsArr = [
      "div-exact-age-samples",
      "div-age-category-samples",
      "div-age-range-samples",
    ];
  }
  allDivsArr.splice(allDivsArr.indexOf(div), 1);
  if ($("#" + div).hasClass("hidden")) {
    $("#" + div).removeClass("hidden");
  }
  $(".age.ui").removeClass("positive active");
  $(ev).addClass("positive active");
  for (var divEle of allDivsArr) {
    $("#" + divEle).addClass("hidden");
  }
}

function readXMLScicrunch(xml, type) {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(xml, "text/xml");
  var resultList = xmlDoc.getElementsByTagName("name"); // THE XML TAG NAME.
  var rrid = "";
  var res;
  for (var i = 0; i < resultList.length; i++) {
    if (resultList[i].childNodes[0].nodeValue === "Proper Citation") {
      rrid = resultList[i].nextSibling.childNodes[0].nodeValue;
      break;
    }
  }
  if (type === "subject") {
    if (rrid.trim() !== "") {
      $("#bootbox-subject-strain-RRID").val(rrid.trim());
      res = true;
    } else {
      $("#bootbox-subject-strain-RRID").val("");
      res = false;
    }
  } else {
    if (rrid.trim() !== "") {
      $("#bootbox-sample-strain-RRID").val(rrid.trim());
      res = true;
    } else {
      $("#bootbox-sample-strain-RRID").val("");
      res = false;
    }
  }
  return res;
}
