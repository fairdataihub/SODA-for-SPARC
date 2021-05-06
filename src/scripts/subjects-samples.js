var subjectsFormDiv = document.getElementById("form-add-a-subject");
var samplesFormDiv = document.getElementById("form-add-a-sample");
var subjectsTableData = [];
var subjectsFileData = [];
var samplesTableData = [];
var samplesFileData = [];
var headersArrSubjects = [];
var headersArrSamples = [];

function showForm() {
  clearAllSubjectFormFields(subjectsFormDiv);
  subjectsFormDiv.style.display = "block"
  $("#btn-add-custom-field").show();
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
      // auto-click first area (mandatory fields) when opening the form
      $(subjectsFormDiv).find("#subjects-mandatory-fields").click();
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

function showFormSamples() {
  clearAllSubjectFormFields(samplesFormDiv);
  samplesFormDiv.style.display = "block"
  $("#btn-add-custom-field-samples").show();
  var bootb = bootbox.dialog({
    title: "<p style='text-align=center'>Adding a sample</p>",
    message: samplesFormDiv,
    buttons: {
      cancel: {
        label: "Cancel",
      },
      confirm: {
        label: "Add",
        className: "btn btn-primary bootbox-add-bf-class",
        callback: function () {
          addSampleIDtoDataBase(bootb);
          return false;
        },
      },
    },
    size: "large",
    centerVertical: true,
    onShown: function (e) {
      // auto-click first area (mandatory fields) when opening the form
      $(samplesFormDiv).find("#samples-mandatory-fields").click();
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
    "<tr id='row-current-subject" + newRowIndex +"' class='row-subjects'><td class='contributor-table-row'>"+indexNumber+"</td><td>"+newSubject+"</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='view_current_subject_id(this)'><i class='eye outline icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='edit_current_subject_id(this)'><i class='pen icon' style='color: black'></i></button><button class='ui button' onclick='delete_current_subject_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

function addSampleIDtoTable(newSample) {
  table = document.getElementById("table-samples");
  var rowcount = table.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var indexNumber = rowIndex;
  var currentRow = table.rows[table.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-sample", rowIndex);
  var row = (table.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-sample" + newRowIndex +"' class='row-subjects'><td class='contributor-table-row'>"+indexNumber+"</td><td>"+newSample+"</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='view_current_sample_id(this)'><i class='eye outline icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='edit_current_sample_id(this)'><i class='pen icon' style='color: black'></i></button><button class='ui button' onclick='delete_current_sample_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

function addSubjectIDtoDataBase(bootb) {
  var subjectID = $("#bootbox-subject-id").val();
  var poolID = $("#bootbox-subject-pool-id").val();
  var expGroup = $("#bootbox-subject-exp-group").val();

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
  if (subjectID !== "" && poolID !== "" && expGroup !== "") {
    if (!duplicate) {
      addSubjectIDtoTable(subjectID)
      addSubjectIDToJSON(subjectID);
      bootb.modal("hide");
      $("#table-subjects").css("display", "block");
      $("#button-generate-subjects").css("display", "block");
      clearAllSubjectFormFields(subjectsFormDiv)
    } else {
      error = "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id!"
    }
  } else {
    error = "Please fill in all of the required fields!"
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

function addSampleIDtoDataBase(bootb) {
  var sampleID = $("#bootbox-sample-id").val();
  var subjectID = $("#bootbox-subject-id-samples").val();
  var wasDerivedFromSample = $("#bootbox-wasDerivedFromSample").val();
  var poolID = $("#bootbox-sample-pool-id").val();
  var expGroup = $("#bootbox-sample-exp-group").val();

  var table = document.getElementById("table-samples");
  var duplicate = false;
  var error = "";
  var rowcount = table.rows.length;
  for (var i=1;i<rowcount;i++) {
    if (sampleID === table.rows[i].cells[1].innerText) {
      duplicate = true
      break
    }
  }
  if (sampleID !== "" && subjectID !== "" && wasDerivedFromSample !== "" && poolID !== "" && expGroup !== "") {
    if (!duplicate) {
      addSampleIDtoTable(sampleID)
      addSampleIDtoJSON(sampleID);
      bootb.modal("hide");
      $("#table-samples").css("display", "block");
      $("#button-generate-samples").css("display", "block");
      clearAllSubjectFormFields(samplesFormDiv)
    } else {
      error = "A similar sample_id already exists. Please either delete the existing sample_id or choose a different sample_id!"
    }
  } else {
    error = "Please fill in all of the required fields!"
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
    headersArrSubjects = [];
    for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
      if (field.value === "" || field.value === undefined || field.value === "Select") {
        field.value = null
      }
      headersArrSubjects.push(field.name);
      valuesArr.push(field.value);
    }
    subjectsTableData[0] = headersArrSubjects
    if (valuesArr !== undefined && valuesArr.length !== 0) {
      if (subjectsTableData[dataLength] !== undefined) {
        subjectsTableData[dataLength + 1] = valuesArr
      } else {
        subjectsTableData[dataLength] = valuesArr
      }
    }
  }
}
function addSampleIDtoJSON(sampleID) {
  var dataLength = samplesTableData.length;
  if ($("#form-add-a-sample").length > 0) {
    var valuesArr = [];
    headersArrSamples = [];
    for (var field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
      if (field.value === "" || field.value === undefined || field.value === "Select") {
        field.value = null
      }
      headersArrSamples.push(field.name);
      valuesArr.push(field.value);
    }
    samplesTableData[0] = headersArrSamples
    if (valuesArr !== undefined && valuesArr.length !== 0) {
      if (samplesTableData[dataLength] !== undefined) {
        samplesTableData[dataLength + 1] = valuesArr
      } else {
        samplesTableData[dataLength] = valuesArr
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
// associated with the view icon (view a subject)
function view_current_sample_id(ev) {
  var currentRow = $(ev).parents()[2];
  var sampleID = $(currentRow)[0].cells[1].innerText;
  loadSampleInformation(ev, sampleID, "view")
}

// associated with the edit icon (edit a subject)
function edit_current_subject_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(ev, subjectID, "edit")
}
function edit_current_sample_id(ev) {
  var currentRow = $(ev).parents()[2];
  var sampleID = $(currentRow)[0].cells[1].innerText;
  loadSampleInformation(ev, sampleID, "edit")
}

function loadSubjectInformation(ev, subjectID, type) {
  // 1. load fields for form
  // 2. For type===view: make all fields contenteditable=false
  // 3. For type===edit: make all fields contenteditable=true
  subjectsFormDiv.style.display = "block"
  var infoJson = [];
  if (subjectsTableData.length > 1) {
    for (var i=1; i<subjectsTableData.length;i++) {
      if (subjectsTableData[i][0] === subjectID) {
        infoJson = subjectsTableData[i];
        break
      }
    }
  }
  // populate form
  var fieldArr = $(subjectsFormDiv).children().find(".subjects-form-entry")
  var emptyEntries = ["nan", "nat"]
  var c = fieldArr.map(function(i, field) {
    if (infoJson[i]) {
      if (!emptyEntries.includes(infoJson[i].toLowerCase())) {
        field.value = infoJson[i];
      } else {
        field.value = "";
      }
    }
    if (type === "view") {
      $(field).prop("disabled", true);
    } else if (type === "edit") {
      $(field).prop("disabled", false);
    }
  });
  if (type === "view") {
    var label1 = "View";
    var label2 = "Done"
    // $("#btn-add-custom-field").hide();
  } else {
    var label1 = "Edit"
    var label2 = "Confirm"
    $("#btn-add-custom-field").show();
  }
  var bootb = bootbox.dialog({
    title: "<p style='text-align=center'>"+label1+"ing a subject</p>",
    message: subjectsFormDiv,
    buttons: {
      cancel: {
        label: "Cancel",
      },
      confirm: {
        label: label2,
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
      $("#new-custom-header-name").keyup(function () {
        var customName = $(this).val();
        if (customName !== "") {
          $("#button-confirm-custom-header-name").show();
        } else {
          $("#button-confirm-custom-header-name").hide();
        }
      })
    },
  });
 }


 function loadSampleInformation(ev, sampleID, type) {
   // 1. load fields for form
   // 2. For type===view: make all fields contenteditable=false
   // 3. For type===edit: make all fields contenteditable=true
   samplesFormDiv.style.display = "block"
   var infoJson = [];
   if (samplesTableData.length > 1) {
     for (var i=1; i<samplesTableData.length;i++) {
       if (samplesTableData[i][1] === sampleID) {
         infoJson = samplesTableData[i];
         break
       }
     }
   }
   // populate form
   var fieldArr = $(samplesFormDiv).children().find(".samples-form-entry")
   var emptyEntries = ["nan", "nat"]
   var c = fieldArr.map(function(i, field) {
     if (infoJson[i]) {
       if (!emptyEntries.includes(infoJson[i].toLowerCase())) {
         field.value = infoJson[i];
       } else {
         field.value = "";
       }
     }
     if (type === "view") {
       $(field).prop("disabled", true);
     } else if (type === "edit") {
       $(field).prop("disabled", false);
     }
   });
   if (type === "view") {
     var label1 = "View";
     var label2 = "Done"
     // $("#btn-add-custom-field").hide();
   } else {
     var label1 = "Edit"
     var label2 = "Confirm"
     $("#btn-add-custom-field-samples").show();
   }
   var bootb = bootbox.dialog({
     title: "<p style='text-align=center'>"+label1+"ing a sample</p>",
     message: samplesFormDiv,
     buttons: {
       cancel: {
         label: "Cancel",
       },
       confirm: {
         label: label2,
         className: "btn btn-primary bootbox-add-bf-class",
         callback: function () {
           if (type === "edit") {
             editSample(ev, bootb, sampleID);
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
       $("#new-custom-header-name-samples").keyup(function () {
         var customName = $(this).val();
         if (customName !== "") {
           $("#button-confirm-custom-header-name-samples").show();
         } else {
           $("#button-confirm-custom-header-name-samples").hide();
         }
       })
     },
   });
  }

function editSubject(ev, bootbox, subjectID) {
 for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
   if (field.value !== "" && field.value !== undefined) {
     subjectsFileData.push(field.value)
   } else {
     subjectsFileData.push("")
   }
 }
 var currentRow = $(ev).parents()[2];
 if ($("#bootbox-subject-id").val() === subjectID) {
   for (var i=1; i<subjectsTableData.length;i++) {
     if (subjectsTableData[i][0] === subjectID) {
       subjectsTableData[i] = subjectsFileData
       break
     }
   }
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
      for (var i=1; i<subjectsTableData.length;i++) {
        if (subjectsTableData[i][0] === subjectID) {
          subjectsTableData[i] = subjectsFileData
          break
        }
      }
      $(currentRow)[0].cells[1].innerText = newID;
      bootbox.modal("hide");
    }
  }
  subjectsFileData = []
}

function editSample(ev, bootbox, sampleID) {
 for (var field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
   if (field.value !== "" && field.value !== undefined) {
     samplesFileData.push(field.value)
   } else {
     samplesFileData.push("")
   }
 }
 var currentRow = $(ev).parents()[2];
 if ($("#bootbox-subject-id").val() === sampleID) {
   for (var i=1; i<samplesTableData.length;i++) {
     if (samplesTableData[i][0] === sampleID) {
       samplesTableData[i] = samplesFileData
       break
     }
   }
  bootbox.modal("hide");
 } else {
    var newID = $("#bootbox-sample-id").val();
    var table = document.getElementById("table-samples");
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
      error = "A similar sample_id already exists. Please either delete the existing sample_id or choose a different sample_id!"
      $(bootbox).find(".modal-footer span").remove();
      bootbox
        .find(".modal-footer")
        .prepend(
          "<span style='color:red;padding-right:10px;display:inline-block;'>" +
            error +
            "</span>"
        );
    } else {
      for (var i=1; i<samplesTableData.length;i++) {
        if (samplesTableData[i][0] === sampleID) {
          samplesTableData[i] = samplesFileData
          break
        }
      }
      $(currentRow)[0].cells[1].innerText = newID;
      bootbox.modal("hide");
    }
  }
  samplesFileData = []
}

function delete_current_subject_id(ev) {
 // 1. Delete from table
 var currentRow = $(ev).parents()[2];
 var currentRowid = $(currentRow).prop("id");
 document.getElementById(currentRowid).outerHTML = "";
 updateIndexForTable(document.getElementById("table-subjects"))
 // 2. Delete from JSON
 var subjectID = $(currentRow)[0].cells[1].innerText;
 for (var i=1; i<subjectsTableData.length; i++) {
   if (subjectsTableData[i][0] === subjectID) {
     subjectsTableData.splice(i, 1);
     break
   }
 }
}

function delete_current_sample_id(ev) {
 // 1. Delete from table
 var currentRow = $(ev).parents()[2];
 var currentRowid = $(currentRow).prop("id");
 document.getElementById(currentRowid).outerHTML = "";
 updateIndexForTable(document.getElementById("table-samples"))
 // 2. Delete from JSON
 var subjectID = $(currentRow)[0].cells[1].innerText;
 for (var i=1; i<subjectsTableData.length; i++) {
   if (subjectsTableData[i][0] === subjectID) {
     subjectsTableData.splice(i, 1);
     break
   }
 }
}

function updateIndexForTable(table) {
 var rowcount = table.rows.length;
 var index = 1;
 for (var i=1;i<rowcount;i++) {
   table.rows[i].cells[0].innerText = index
   index = index + 1
 }
 if (rowcount === 1) {
   table.style.display = "none";
   if (table === document.getElementById("table-subjects")) {
     $("#button-generate-subjects").css("display", "none");
   } else if (table === document.getElementById("table-samples")) {
     $("#button-generate-samples").css("display", "none");
   }
 }
}

function generateSubjects() {
 ipcRenderer.send("open-folder-dialog-save-subjects", "subjects.xlsx");
}

function generateSamples() {
 ipcRenderer.send("open-folder-dialog-save-samples", "samples.xlsx");
}

function showPrimaryBrowseFolder() {
  ipcRenderer.send("open-file-dialog-local-primary-folder");
}
function showPrimaryBrowseFolderSamples() {
  ipcRenderer.send("open-file-dialog-local-primary-folder-samples");
}

function importPrimaryFolderSubjects() {
  var folderPath = $("#primary-folder-destination-input").prop("placeholder");
  if (folderPath === "Browse here") {
    Swal.fire("No folder chosen!", "Please select a path to your primary folder", "error");
  } else {
    if (path.parse(folderPath).base !== "primary") {
      Swal.fire("Incorrect folder name!", "Your folder must be named 'primary' to be imported to SODA!", "error");
    } else {
      var folders = fs.readdirSync(folderPath);
      var j = 1;
      subjectsTableData[0] = headersArrSubjects;
      for (var folder of folders) {
        subjectsFileData = []
        var stats = fs.statSync(path.join(folderPath, folder));
        if (stats.isDirectory()) {
          subjectsFileData[0] = folder
          for (var i=1; i<18; i++) {
            subjectsFileData.push("")
          }
          subjectsTableData[j] = subjectsFileData
          j += 1
        }
      }
      if (subjectsTableData.length > 1) {
        loadSubjectsDataToTable();
        $("#table-subjects").show();
        $("#div-confirm-primary-folder-import").hide();
        $("#button-fake-confirm-primary-folder-load").click();
      } else {
        Swal.fire(
          'Could not load subject IDs from the imported primary folder!',
          'Please check that you provided the correct path to a SPARC primary folder that has at least 1 subject folder.',
          'error')
        }
    }
  }
  subjectsFileData = []
}
function importPrimaryFolderSamples() {
  var folderPath = $("#primary-folder-destination-input-samples").prop("placeholder");
  if (folderPath === "Browse here") {
    Swal.fire("No folder chosen!", "Please select a path to your primary folder", "error");
  } else {
    if (path.parse(folderPath).base !== "primary") {
      Swal.fire("Incorrect folder name!", "Your folder must be named 'primary' to be imported to SODA!", "error");
    } else {
      var folders = fs.readdirSync(folderPath);
      var j = 1;
      samplesTableData[0] = headersArrSamples;
      for (var folder of folders) {
        samplesFileData = []
        var statsSubjectID = fs.statSync(path.join(folderPath, folder));
        if (statsSubjectID.isDirectory()) {
          samplesFileData[0] = folder
          var subjectFolder = fs.readdirSync(path.join(folderPath, folder));
          for (var subfolder of subjectFolder) {
            var statsSampleID = fs.statSync(path.join(folderPath, folder, subfolder))
            if (statsSampleID.isDirectory()) {
              samplesFileData[1] = subfolder
            }
          }
          for (var i=2; i<22; i++) {
            samplesFileData.push("")
          }
          samplesTableData[j] = samplesFileData
          j += 1
        }
      }
      if (samplesTableData.length > 1) {
        loadSamplesDataToTable();
        $("#table-samples").show();
        $("#div-confirm-primary-folder-import-samples").hide();
        $("#button-fake-confirm-primary-folder-load-samples").click();
      } else {
        Swal.fire(
          'Could not load samples IDs from the imported primary folder!',
          'Please check that you provided the correct path to a SPARC primary folder that has at least 1 subject folder and 1 sample folder.',
          'error')
        }
    }
  }
  samplesFileData = []
}

function loadSubjectsDataToTable() {
  // delete table rows except headers
  $("#table-subjects tr:gt(0)").remove();

  for (var i=1; i<subjectsTableData.length; i++) {
    addSubjectIDtoTable(subjectsTableData[i][0])
  }
  Swal.fire(
  'Loaded successfully!',
  'Please add or edit your subject_id(s) in the following subjects table.',
  'success')
  $("#button-generate-subjects").css("display", "block");
}

function loadSamplesDataToTable() {
  // delete table rows except headers
  $("#table-samples tr:gt(0)").remove();

  for (var i=1; i<samplesTableData.length; i++) {
    addSampleIDtoTable(samplesTableData[i][1])
  }
  Swal.fire(
  'Loaded successfully!',
  'Please add or edit your sample_id(s) in the following samples table.',
  'success')
  $("#button-generate-samples").css("display", "block");
}

function resetSubjects() {
  Swal.fire({
    text: "Are you sure you want to start over and reset your progress?",
    icon: "warning",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over!",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-subjects-1").removeClass("prev");
      $("#Question-prepare-subjects-1").nextAll().removeClass("show");
      $("#Question-prepare-subjects-1").nextAll().removeClass("prev");
      $("#Question-prepare-subjects-1 .option-card").removeClass("checked").removeClass("disabled").removeClass("non-selected");
      $("#Question-prepare-subjects-1 .option-card .folder-input-check").prop("checked", false);
      $("#Question-prepare-subjects-2").find("button").show()
      $("#div-confirm-primary-folder-import").find("button").hide()

      $("#Question-prepare-subjects-primary-import").find("input").prop("placeholder", "Browse here")
      subjectsFileData = []
      subjectsTableData = []

      // delete table rows except headers
      $("#table-subjects tr:gt(0)").remove();
      $("#table-subjects").css("display", "none")
      // Hide Generate button
      $("#button-generate-subjects").css("display", "none")
    }
  });
}

function resetSamples() {
  Swal.fire({
    text: "Are you sure you want to start over and reset your progress?",
    icon: "warning",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over!",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-samples-1").removeClass("prev");
      $("#Question-prepare-samples-1").nextAll().removeClass("show");
      $("#Question-prepare-samples-1").nextAll().removeClass("prev");
      $("#Question-prepare-samples-1 .option-card").removeClass("checked").removeClass("disabled").removeClass("non-selected");
      $("#Question-prepare-samples-1 .option-card .folder-input-check").prop("checked", false);
      $("#Question-prepare-samples-2").find("button").show()
      $("#div-confirm-primary-folder-import-samples").find("button").hide()

      $("#Question-prepare-subjects-primary-import-samples").find("input").prop("placeholder", "Browse here")
      samplesFileData = []
      samplesTableData = []

      // delete table rows except headers
      $("#table-samples tr:gt(0)").remove();
      $("#table-samples").css("display", "none")
      // Hide Generate button
      $("#button-generate-samples").css("display", "none")
    }
  });
}

// functions below are to show/add/cancel a custom header
function showEnterCustomHeaderDiv(ev, action) {
  if (action === "show") {
    $(ev).hide();
    $("#div-new-custom-headers").hide()
    $("#div-enter-custom-header-name").show();
    $($("#div-enter-custom-header-name button")[0]).show()
  } else if (action === "hide") {
    $("#btn-add-custom-field").show()
    $("#div-new-custom-headers").show()
    $("#btn-add-custom-field").parents().show()
    $("#new-custom-header-name").val("");
    $(ev).hide();
    $(ev).nextAll().hide();
    $("#div-enter-custom-header-name").hide()
  }
}

// functions below are to show/add/cancel a custom header
function showEnterCustomHeaderDivSamples(ev, action) {
  if (action === "show") {
    $(ev).hide();
    $("#div-new-custom-headers-samples").hide()
    $("#div-enter-custom-header-name-samples").show();
    $($("#div-enter-custom-header-name-samples button")[0]).show()
  } else if (action === "hide") {
    $("#btn-add-custom-field-samples").show()
    $("#div-new-custom-headers-samples").show()
    $("#btn-add-custom-field-samples").parents().show()
    $("#new-custom-header-name-samples").val("");
    $(ev).hide();
    $(ev).nextAll().hide();
    $("#div-enter-custom-header-name-samples").hide()
  }
}

function addCustomHeader(ev) {
  var customName = $("#new-custom-header-name").val();
  var divElement = '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">'+customName+':</font></div></div><div class="demo-controls-body"><input class="form-container-input-bf subjects-form-entry" id="bootbox-subject-'+customName+'" name='+customName+'></input></div></div>'
  showEnterCustomHeaderDiv(ev, "hide");
  if (!headersArrSubjects.includes(customName)) {
    $("#div-new-custom-headers").append(divElement);
    headersArrSubjects.push(customName);
  } else {
    Swal.fire("Duplicate header name!", "You entered a name that is already listed under the current fields", "error");
    $("#button-confirm-custom-header-name").hide();
  }
}

function addCustomHeaderSamples(ev) {
  var customName = $("#new-custom-header-name-samples").val();
  var divElement = '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">'+customName+':</font></div></div><div class="demo-controls-body"><input class="form-container-input-bf samples-form-entry" id="bootbox-sample-'+customName+'" name='+customName+'></input></div></div>'
  showEnterCustomHeaderDivSamples(ev, "hide");
  if (!headersArrSamples.includes(customName)) {
    $("#div-new-custom-headers-samples").append(divElement);
    headersArrSamples.push(customName);
  } else {
    Swal.fire("Duplicate header name!", "You entered a name that is already listed under the current fields", "error");
    $("#button-confirm-custom-header-name-samples").hide();
  }
}


function addExistingCustomHeader(customName) {
  var divElement = '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">'+customName+':</font></div></div><div class="demo-controls-body"><input class="form-container-input-bf subjects-form-entry" id="bootbox-subject-'+customName+'" name='+customName+'></input></div></div>'
  $("#div-new-custom-headers").append(divElement);
}

function addExistingCustomHeaderSamples(customName) {
  var divElement = '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">'+customName+':</font></div></div><div class="demo-controls-body"><input class="form-container-input-bf samples-form-entry" id="bootbox-sample-'+customName+'" name='+customName+'></input></div></div>'
  $("#div-new-custom-headers-samples").append(divElement);
}

$(document).ready(function() {
  for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
    if (field.value === "" || field.value === undefined || field.value === "Select") {
      field.value = null
    }
    headersArrSubjects.push(field.name);
  }
  for (var field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
    if (field.value === "" || field.value === undefined || field.value === "Select") {
      field.value = null
    }
    headersArrSamples.push(field.name);
  }

  ipcRenderer.on("selected-existing-subjects", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        document.getElementById("existing-subjects-file-destination").placeholder =
          filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing subjects.xlsx",
          defaultBfAccount
        );
      }
    }
    if (
      document.getElementById("existing-subjects-file-destination").placeholder !==
      "Browse here"
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
        document.getElementById("existing-samples-file-destination").placeholder =
          filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing samples.xlsx",
          defaultBfAccount
        );
      }
    }
    if (
      document.getElementById("existing-samples-file-destination").placeholder !==
      "Browse here"
    ) {
      $("#div-confirm-existing-samples-import").show();
      $($("#div-confirm-existing-samples-import button")[0]).show();
    } else {
      $("#div-confirm-existing-samples-import").hide();
      $($("#div-confirm-existing-samples-import button")[0]).hide();
    }
  });
})

function showExistingSubjectsFile() {
  ipcRenderer.send("open-file-dialog-existing-subjects");
}

function showExistingSamplesFile() {
  ipcRenderer.send("open-file-dialog-existing-samples");
}

function importExistingSubjectsFile() {
  var filePath = $("#existing-subjects-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire("No file chosen!", "Please select a path to your subjects.xlsx file!", "error");
  } else {
    if (path.parse(filePath).base !== "subjects.xlsx") {
      Swal.fire("Incorrect file name!", "Your file must be named 'subjects.xlsx' to be imported to SODA!", "error");
    } else {
      loadSubjectsFileToDataframe(filePath);
    }
  }
}

function importExistingSamplesFile() {
  var filePath = $("#existing-samples-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire("No file chosen!", "Please select a path to your samples.xlsx file!", "error");
  } else {
    if (path.parse(filePath).base !== "samples.xlsx") {
      Swal.fire("Incorrect file name!", "Your file must be named 'samples.xlsx' to be imported to SODA!", "error");
    } else {
      loadSamplesFileToDataframe(filePath);
    }
  }
}

function loadDataFrametoUI() {
  // separate regular headers and custom headers
  const lowercasedHeaders = subjectsTableData[0].map(header => header.toLowerCase());
  var fieldSubjectEntries = []
  for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase())
  }
  const customHeaders = [];
  for (var field of lowercasedHeaders) {
    if (!fieldSubjectEntries.includes(field)) {
      customHeaders.push(field)
    }
  }
  headersArrSubjects = headersArrSubjects.concat(customHeaders);
  for (var headerName of customHeaders) {
    addExistingCustomHeader(headerName)
  }
  // load sub-ids to table
  loadSubjectsDataToTable()
  $("#table-subjects").show();
  $("#button-fake-confirm-existing-subjects-file-load").click();
}

function loadDataFrametoUISamples() {
  // separate regular headers and custom headers
  const lowercasedHeaders = samplesTableData[0].map(header => header.toLowerCase());
  var fieldSampleEntries = []
  for (var field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase())
  }
  const customHeaders = [];
  for (var field of lowercasedHeaders) {
    if (!fieldSampleEntries.includes(field)) {
      customHeaders.push(field)
    }
  }
  headersArrSamples = headersArrSamples.concat(customHeaders);
  for (var headerName of customHeaders) {
    addExistingCustomHeaderSamples(headerName)
  }
  // load sub-ids to table
  loadSamplesDataToTable()
  $("#table-samples").show();
  $("#button-fake-confirm-existing-samples-file-load").click();
}
