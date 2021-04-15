var subjectsFormDiv = document.getElementById("form-add-a-subject");
var subjectsTableData = {};
var subjectsFileData = {};

function showForm() {
  subjectsFormDiv.style.display = "block"
  var bootb = bootbox.dialog({
    title: "<p style='text-align=center'>Adding a subject</p>",
    message: subjectsFormDiv,
    buttons: {
      cancel: {
        label: "Cancel",
      },
      confirm: {
        label: "Add",
        className: "btn btn-primary bootbox-add-bf-class",
        callback: function () {
          addSubjectIDtoDataBase(bootb);
          return false;
        },
      },
    },
    size: "large",
    centerVertical: true,
    onShown: function (e) {
      $(".popover-tooltip").each(function () {
        var $this = $(this);
        $this.popover({
          trigger: "hover",
          container: $this,
        });
      });
    },
  });
}

function addSubjectIDtoTable(newSubject) {
  table = document.getElementById("table-subjects");
  var rowcount = table.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var indexNumber = rowIndex;
  var currentRow = table.rows[table.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-subject", rowIndex);
  var row = (table.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-subject" + newRowIndex +"' class='row-subjects'><td class='contributor-table-row'>"+indexNumber+"</td><td>"+newSubject+"</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='view_current_subject_id(this)'><i class='eye outline icon' style='color: blue'></i></button><button class='ui button' onclick='edit_current_subject_id(this)'><i class='pen icon' style='color: black'></i></button><button class='ui button' onclick='delete_current_subject_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

function addSubjectIDtoDataBase(bootb) {
  var subjectID = $("#bootbox-subject-id").val();
  if (subjectID !== "") {
    addSubjectIDtoTable(subjectID)
    addSubjectIDToJSON(subjectID);
    bootb.modal("hide");
    $("#table-subjects").css("display", "block")
    clearAllSubjectFormFields("form-add-a-subject")
  }
}

function clearAllSubjectFormFields(formID) {
  if ($("#"+formID).length > 0) {
    for (var field of $("#"+formID).children().find("input")) {
      $(field).val("");
    }
    for (var field of $("#"+formID).children().find("select")) {
      $(field).val("Select");
    }
  }
}

// add new subject ID to JSON file (main file to be converted to excel)
function addSubjectIDToJSON(subjectID) {
  if ($("#form-add-a-subject").length > 0) {
    for (var field of $("#form-add-a-subject").children().find("input")) {
      if (field.value !== "" && field.value !== undefined) {
        subjectsFileData[field.name] = field.value
      }
    }
    if ($("#bootbox-subject-sex").val() !== "Select") {
      subjectsFileData["Sex"] = $("#bootbox-subject-sex").val()
    }
    subjectsTableData[subjectID] = subjectsFileData
  }
}

// associated with the view icon (view a subject)
function view_current_subject_id(ev) {
  var currentRow = $(ev).parents().find(".row-subjects")
  subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(subjectID, "view")
}

// associated with the edit icon (edit a subject)
function edit_current_subject_id(ev) {
  var currentRow = $(ev).parents().find(".row-subjects")
  subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(subjectID, "edit")
}

function loadSubjectInformation(subjectID, type) {
  // 1. load fields for form
  // 2. For type===view: make all fields contenteditable=false
  // 3. For type===edit: make all fields contenteditable=true
  subjectsFormDiv.style.display = "block"
  var infoJson = subjectsTableData[subjectID];
  for (var field of $(subjectsFormDiv).children().find("input")) {
    for (var key of Object.keys(infoJson)) {
      if (field.name === key) {
        field.value = infoJson[key]
      }
      $("#bootbox-subject-sex").val(infoJson["Sex"])
    }
    if (type === "view") {
      $(field).prop("disabled", true);
      $("#bootbox-subject-sex").prop("disabled", true);
      var label = "Done"
    } else if (type === "edit") {
      $(field).prop("disabled", false);
      $("#bootbox-subject-sex").prop("disabled", false);
      var label = "Edit"
    }
  }
  var bootb = bootbox.dialog({
    title: "<p style='text-align=center'>"+label+"ing a subject</p>",
    message: subjectsFormDiv,
    buttons: {
      cancel: {
        label: "Cancel",
      },
      confirm: {
        label: label,
        className: "btn btn-primary bootbox-add-bf-class",
        callback: function () {
          if (type === "edit") {
            addSubjectIDtoDataBase(bootb);
            return false;
          }
        },
      },
    },
    size: "large",
    centerVertical: true,
    onShown: function (e) {
      $(".popover-tooltip").each(function () {
        var $this = $(this);
        $this.popover({
          trigger: "hover",
          container: $this,
        });
      });
    },
  });
 }

 function delete_current_subject_id(ev) {
   var currentRow = $(ev).parents().find(".row-subjects");
   var currentRowid = $(currentRow).prop("id");
   document.getElementById(currentRowid).outerHTML = "";
   updateIndexForTable()
 }

 function updateIndexForTable() {
   table = document.getElementById("table-subjects");
   var rowcount = table.rows.length;
   var index = 1;
   for (var i=1;i<rowcount;i++) {
     table.rows[i].cells[0].innerText = index
     index = index + 1
   }
 }
