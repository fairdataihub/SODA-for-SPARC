var subjectsFormDiv = document.getElementById("form-add-a-subject");
var subjectsTableData = [];
var subjectsFileData = [];

function showForm() {
  clearAllSubjectFormFields(subjectsFormDiv);
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
  var table = document.getElementById("table-subjects");
  var duplicate = false;
  var error = "";
  var rowcount = table.rows.length;
  for (var i=1;i<rowcount;i++) {
    if (subjectID === table.rows[i].cells[1].innerText) {
      duplicate = true
      break
    }
  }
  if (subjectID !== "") {
    if (!duplicate) {
      addSubjectIDtoTable(subjectID)
      addSubjectIDToJSON(subjectID);
      bootb.modal("hide");
      $("#table-subjects").css("display", "block")
      clearAllSubjectFormFields(subjectsFormDiv)
    } else {
      error = "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id!"
    }
  } else {
    error = "Please provide a subject_id!"
    }
  if (error !== "") {
    $(bootb).find(".modal-footer span").remove();
    bootb
      .find(".modal-footer")
      .prepend(
        "<span style='color:red;padding-right:10px;display:inline-block;'>" +
          error +
          "</span>"
      );
  }
}

function clearAllSubjectFormFields(form) {
  for (var field of $(form).children().find("input")) {
    $(field).val("");
    $(field).prop("disabled", false)
  }
  for (var field of $(form).children().find("select")) {
    $(field).val("Select");
    $(field).prop("disabled", false)
  }
}

// add new subject ID to JSON file (main file to be converted to excel)
function addSubjectIDToJSON(subjectID) {
  var dataLength = subjectsTableData.length;
  if ($("#form-add-a-subject").length > 0) {
    var valuesArr = [];
    var headersArr = [];
    for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
      if (field.value === "" || field.value === undefined || field.value === "Select") {
        field.value = null
      }
      headersArr.push(field.name);
      valuesArr.push(field.value);
    }
    subjectsTableData[0] = headersArr
    if (valuesArr !== undefined && valuesArr.length !== 0) {
      if (subjectsTableData[dataLength] !== undefined) {
        subjectsTableData[dataLength + 1] = valuesArr
      } else {
        subjectsTableData[dataLength] = valuesArr
      }
    }
  }
}

// associated with the view icon (view a subject)
function view_current_subject_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(ev, subjectID, "view")
}

// associated with the edit icon (edit a subject)
function edit_current_subject_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(ev, subjectID, "edit")
}

function loadSubjectInformation(ev, subjectID, type) {
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
    } else if (type === "edit") {
      $(field).prop("disabled", false);
    }
  }
  if (type === "view") {
    $(subjectsFormDiv).find("#bootbox-subject-sex").prop("disabled", true);
    var label = "Done"
  } else {
    $(subjectsFormDiv).find("#bootbox-subject-sex").prop("disabled", false);
    var label = "Edit"
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
            editSubject(ev, bootb, subjectID);
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

 function editSubject(ev, bootbox, subjectID) {
   for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
     if (field.value !== "" && field.value !== undefined) {
       subjectsFileData[field.name] = field.value
     } else {
       subjectsFileData[field.name] = null
     }
   }
   var currentRow = $(ev).parents()[2];
   if ($("#bootbox-subject-id").val() === subjectID) {
    subjectsTableData[subjectID] = subjectsFileData
    bootbox.modal("hide");
   } else {
      var newID = $("#bootbox-subject-id").val();
      var table = document.getElementById("table-subjects");
      var duplicate = false;
      var error = "";
      var rowcount = table.rows.length;
      for (var i=1;i<rowcount;i++) {
        if (newID === table.rows[i].cells[1].innerText) {
          duplicate = true
          break
        }
      }
      if (duplicate) {
        error = "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id!"
        $(bootbox).find(".modal-footer span").remove();
        bootbox
          .find(".modal-footer")
          .prepend(
            "<span style='color:red;padding-right:10px;display:inline-block;'>" +
              error +
              "</span>"
          );
      } else {
        subjectsTableData[newID] = subjectsFileData
        delete subjectsTableData[subjectID]
        $(currentRow)[0].cells[1].innerText = newID;
        subjectsFileData = {}
        bootbox.modal("hide");
      }
    }
 }

 function delete_current_subject_id(ev) {
   // 1. Delete from table
   var currentRow = $(ev).parents()[2];
   var currentRowid = $(currentRow).prop("id");
   document.getElementById(currentRowid).outerHTML = "";
   updateIndexForTable()
   // 2. Delete from JSON
   var subjectID = $(currentRow)[0].cells[1].innerText;
   for (var i=1; i<subjectsTableData.length; i++) {
     if (subjectsTableData[i][0] === subjectID) {
       subjectsTableData.splice(i, 1);
       break
     }
   }
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

 function generateSubjects() {
   ipcRenderer.send("open-folder-dialog-save-subjects", "subjects.xlsx");
 }
