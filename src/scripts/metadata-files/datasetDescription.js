// opendropdown event listeners
document.querySelectorAll(".dd-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "bf");
  });
});

document.querySelectorAll(".dd-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "dataset");
  });
});

// Prepare Dataset Description File
const dsAwardArray = document.getElementById("ds-description-award-list");
const dsContributorArrayLast1 = document.getElementById(
  "ds-description-contributor-list-last-1"
);
const dsContributorArrayFirst1 = document.getElementById(
  "ds-description-contributor-list-first-1"
);

var currentContributorsLastNames = [];
var currentContributorsFirstNames = [];
var globalContributorNameObject = {};

// const affiliationInput = document.getElementById("input-con-affiliation-1");
const addCurrentContributorsBtn = document.getElementById(
  "button-ds-add-contributor"
);
const contactPerson = document.getElementById("ds-contact-person");
const generateDSBtn = document.getElementById("button-generate-ds-description");
const addAdditionalLinkBtn = document.getElementById("button-ds-add-link");
const datasetDescriptionFileDataset = document.getElementById("ds-name");
const parentDSDropdown = document.getElementById("input-parent-ds");

// Main function to check Airtable status upon loading soda
///// config and load live data from Airtable
var sparcAwards = [];
var airtableRes = [];

var ddDestinationPath = "";

$(document).ready(function () {
  $("#add-other-contributors").on("click", function () {
    if ($(this).text() == "Add contributors not listed above") {
      addOtherContributors("table-current-contributors");
      $(this).text("Cancel manual typing");
    } else {
      cancelOtherContributors("table-current-contributors");
      $(this).text("Add contributors not listed above");
    }
  });
  // ipcRenderer.on(
  //   "selected-metadata-ds-description",
  //   (event, dirpath, filename) => {
  //     if (dirpath.length > 0) {
  //       var destinationPath = path.join(dirpath[0], filename);
  //       if (fs.existsSync(destinationPath)) {
  //         var emessage =
  //           "File '" +
  //           filename +
  //           "' already exists in " +
  //           dirpath[0] +
  //           ". Do you want to replace it?";
  //         Swal.fire({
  //           icon: "warning",
  //           title: "Metadata file already exists",
  //           text: `${emessage}`,
  //           heightAuto: false,
  //           backdrop: "rgba(0,0,0, 0.4)",
  //           showConfirmButton: true,
  //           showCancelButton: true,
  //           cancelButtonText: "No",
  //           confirmButtonText: "Yes",
  //         }).then((result) => {
  //           if (result.isConfirmed) {
  //             generateDDFile(false);
  //           }
  //         });
  //       } else {
  //         generateDDFile(false);
  //       }
  //     }
  //   }
  // );
  checkAirtableStatus("");
  ipcRenderer.on("show-missing-items-ds-description", (event, index) => {
    if (index === 0) {
      ipcRenderer.send(
        "open-folder-dialog-save-ds-description",
        "dataset_description.xlsx"
      );
    }
  });

  // generate dd file
  ipcRenderer.on(
    "selected-destination-generate-dd-locally",
    (event, dirpath) => {
      if (dirpath.length > 0) {
        document.getElementById(
          "input-destination-generate-dd-locally"
        ).placeholder = dirpath[0];
        var destinationPath = path.join(dirpath[0], "dataset_description.xlsx");
        ddDestinationPath = destinationPath;
        $("#div-confirm-destination-dd-locally").css("display", "flex");
        $($("#div-confirm-destination-dd-locally").children()[0]).css(
          "display",
          "flex"
        );
      } else {
        document.getElementById(
          "input-destination-generate-dd-locally"
        ).placeholder = "Browse here";
        $("#div-confirm-destination-dd-locally").css("display", "none");
      }
    }
  );

  $(".prepare-dd-cards").click(function () {
    $("create_dataset_description-tab").removeClass("show");
    var target = $(this).attr("data-next");
    $("#" + target).toggleClass("show");
    document.getElementById("prevBtn").style.display = "none";
  });

  $("#bf_dataset_load_dd").on("DOMSubtreeModified", function () {
    if (
      $("#Question-prepare-dd-2").hasClass("show") &&
      !$("#Question-prepare-dd-6").hasClass("show")
    ) {
      $("#Question-prepare-dd-2").removeClass("show");
    }
    if ($("#bf_dataset_load_dd").text().trim() !== "None") {
      $("#div-check-bf-import-dd").css("display", "flex");
      $($("#div-check-bf-import-dd").children()[0]).show();
    } else {
      $("#div-check-bf-import-dd").css("display", "none");
    }
  });

  $("#bf_dataset_generate_dd").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_dd").text().trim() !== "None") {
      $("#div-check-bf-generate-dd").css("display", "flex");
    } else {
      $("#div-check-bf-generate-dd").css("display", "none");
    }
  });
});

function checkAirtableStatus(keyword) {
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length === 0) {
    airtableRes = [false, ""];
    $("#current-airtable-account").html("None");
    return airtableRes;
  } else {
    var airKeyInput = airKeyContent["api-key"];
    var airKeyName = airKeyContent["key-name"];
    if (airKeyInput !== "" && airKeyName !== "") {
      Airtable.configure({
        endpointUrl: "https://" + airtableHostname,
        apiKey: airKeyInput,
      });
      var base = Airtable.base("appiYd1Tz9Sv857GZ");
      base("sparc_members")
        .select({
          view: "All members (ungrouped)",
        })
        .eachPage(
          function page(records, fetchNextPage) {
            records.forEach(function (record) {
              if (record.get("Project_title") !== undefined) {
                item = record
                  .get("SPARC_Award_#")
                  .concat(" (", record.get("Project_title"), ")");
                sparcAwards.push(item);
              }
            }),
              fetchNextPage();
          },
          function done(err) {
            if (err) {
              log.error(err);
              console.log(err);
              $("#current-airtable-account").html("None");
              ipcRenderer.send(
                "track-event",
                "Error",
                "Prepare Metadata - Add Airtable account - Check Airtable status",
                "Airtable",
                1
              );

              airtableRes = [false, ""];
              return airtableRes;
            } else {
              ipcRenderer.send(
                "track-event",
                "Success",
                "Prepare Metadata - Add Airtable account - Check Airtable status",
                "Airtable",
                1
              );
              $("#current-airtable-account").text(airKeyName);
              var awardSet = new Set(sparcAwards);
              var resultArray = [...awardSet];
              airtableRes = [true, airKeyName];
              if (keyword === "dd") {
                helpSPARCAward("dd", "free-form");
              }
              return airtableRes;
            }
          }
        );
    } else {
      $("#current-airtable-account").text(airKeyName);
      airtableRes = [true, airKeyName];
      return airtableRes;
    }
  }
}

/* The below function is needed because
  when users add a row and then delete it, the ID for such row is deleted (row-name-2),
  but the row count for the table (used for naming row ID) is changed and that messes up the naming and ID retrieval process
*/
function checkForUniqueRowID(rowID, no) {
  if ($("#" + rowID + no.toString()).length == 0) {
    return no;
  } else {
    no = no + 1;
    return checkForUniqueRowID(rowID, no);
  }
}

function populateProtocolLink(ev) {
  if ($(ev).val() === "Protocol URL or DOI*") {
    // display dropdown to select protocol titles
    if ($("#select-misc-links").length > 0) {
      $("#select-misc-links").css("display", "block");
    } else {
      var divElement =
        '<select id="select-misc-links" class="form-container-input-bf" style="font-size:13px; line-height:2;margin-top: 20px" onchange="autoPopulateProtocolLink(this, \'\', \'dd\')"></select>';
      $($(ev).parents()[0]).append(divElement);
      // populate dropdown with protocolResearcherList
      removeOptions(document.getElementById("select-misc-links"));
      addOption(
        document.getElementById("select-misc-links"),
        "Select protocol title",
        "Select"
      );
      for (var key of Object.keys(protocolResearcherList)) {
        $("#select-misc-links").append(
          '<option value="' +
          protocolResearcherList[key] +
          '">' +
          key +
          "</option>"
        );
      }
    }
  } else {
    if ($("#select-misc-links").length > 0) {
      $("#select-misc-links").css("display", "none");
    }
  }
}

// check for duplicates in names of contributors
function checkContributorNameDuplicates(table, currentRow) {
  var duplicate = false;
  var currentConLastName = $("#" + currentRow.cells[0].children[0].id).val();
  var currentConFirstName = $("#" + currentRow.cells[1].children[0].id).val();
  var rowcount = document.getElementById(table).rows.length;
  for (var i = 1; i < rowcount - 1; i++) {
    if (
      $(
        "#" + document.getElementById(table).rows[i].cells[0].children[0].id
      ).val() === currentConLastName &&
      $(
        "#" + document.getElementById(table).rows[i].cells[1].children[0].id
      ).val() === currentConFirstName
    ) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

// clone Last names of contributors (from a global Airtable Contributor array) to subsequent selects so we don't have to keep calling Airtable API
function cloneConNamesSelect(selectLast) {
  removeOptions(document.getElementById(selectLast));
  addOption(document.getElementById(selectLast), "Select an option", "Select");
  for (var i = 0; i < currentContributorsLastNames.length; i++) {
    var opt = currentContributorsLastNames[i];
    if (document.getElementById(selectLast)) {
      addOption(document.getElementById(selectLast), opt, opt);
    }
  }
}

// the below 2 functions initialize Tagify for each input field for a new added row (Role and Affiliation)
function createConsRoleTagify(inputField) {
  var input = document.getElementById(inputField);
  // initialize Tagify on the above input node reference
  var tagify = new Tagify(input, {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      enabled: 1,
      closeOnSelect: true,
    },
  });
}

function createConsAffliationTagify(inputField) {
  var input = document.getElementById(inputField);
  var tagify = new Tagify(input, {
    dropdown: {
      classname: "color-blue",
      enabled: 0, // show the dropdown immediately on focus
      maxItems: 25,
      closeOnSelect: true, // keep the dropdown open after selecting a suggestion
    },
    duplicates: false,
  });
}

/*
cancelOtherContributors() and addOtherContributors() are needed when users want to
manually type Contributor names instead of choosing from the Airtable retrieved dropdown list
*/

function cancelOtherContributors(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount - 1;
  var currentRow =
    document.getElementById(table).rows[
    document.getElementById(table).rows.length - 1
    ];
  currentRow.cells[0].outerHTML =
    "<td class='grab'><select id='ds-description-contributor-list-last-" +
    rowIndex +
    "' onchange='onchangeLastNames(" +
    rowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td>";
  currentRow.cells[1].outerHTML =
    "<td class='grab'><select disabled id='ds-description-contributor-list-first-" +
    rowIndex +
    "' onchange='onchangeFirstNames(" +
    rowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td>";
  cloneConNamesSelect(
    "ds-description-contributor-list-last-" + rowIndex.toString()
  );
}

function addOtherContributors(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount;
  var currentRow =
    document.getElementById(table).rows[
    document.getElementById(table).rows.length - 1
    ];
  currentRow.cells[0].outerHTML =
    "<td><input type='text' placeholder='Type here' contenteditable='true' id='other-contributors-last-" +
    rowIndex +
    "'></input></td>";
  currentRow.cells[1].outerHTML =
    "<td><input type='text' placeholder='Type here' contenteditable='true' id='other-contributors-first-" +
    rowIndex +
    "'></input></td>";
  createConsRoleTagify("input-con-role-" + currentRow.rowIndex.toString());
  createConsAffliationTagify(
    "input-con-affiliation-" + currentRow.rowIndex.toString()
  );
}

function convertDropdownToTextBox(dropdown) {
  if (document.getElementById(dropdown)) {
    $($("#" + dropdown).parents()[1]).css("display", "none");
    if (dropdown == "ds-description-award-list") {
      $("#SPARC-Award-raw-input-div-dd").css("display", "flex");
    }
  }
}

/* The functions ddNoAirtableMode() and resetDDUI() is needed to track when Airtable connection status is changed within
  a SODA session -> SODA will accordingly update what to show under Submission and DD files
*/

function ddNoAirtableMode(action) {
  if (action == "On") {
    noAirtable = true;
    $("#add-other-contributors").css("display", "none");
    convertDropdownToTextBox("ds-description-award-list");
    convertDropdownToTextBox("ds-description-contributor-list-last-1");
    convertDropdownToTextBox("ds-description-contributor-list-first-1");
    $("#table-current-contributors").find("tr").slice(1).remove();
    rowIndex = 1;
    newRowIndex = 1;
    var row = (document
      .getElementById("table-current-contributors")
      .insertRow(rowIndex).outerHTML =
      "<tr id='row-current-name" +
      newRowIndex +
      "'><td class='grab'><input id='ds-description-raw-contributor-list-last-" +
      newRowIndex +
      "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input id='ds-description-raw-contributor-list-first-" +
      newRowIndex +
      "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input type='text' id='input-con-ID-" +
      newRowIndex +
      "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
      newRowIndex +
      "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
      newRowIndex +
      "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
      newRowIndex +
      ")' id='ds-contact-person-" +
      newRowIndex +
      "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
      newRowIndex +
      ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
    createConsRoleTagify("input-con-role-" + newRowIndex.toString());
    createConsAffliationTagify(
      "input-con-affiliation-" + newRowIndex.toString()
    );
  } else if (action == "Off") {
    noAirtable = false;
    loadAwards();
  }
}

// resetting the dataset_description file
function resetDDUI(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount - 1;
  var currentRow =
    document.getElementById(table).rows[
    document.getElementById(table).rows.length - 1
    ];

  $("#SPARC-Award-raw-input-div-dd").css("display", "none");
  $("#dd-description-raw-contributor-list-last-1").css("display", "none");
  $("#ds-description-contributor-list-last-1").remove();
  $("#ds-description-contributor-list-first-1").remove();
  $("#dd-description-raw-contributor-list-first-1").css("display", "none");
  $($("#ds-description-award-list").parents()[1]).css("display", "flex");
  $("#add-other-contributors").css("display", "block");
  $("#add-other-contributors").text("Add contributors not listed above");
  $("#table-current-contributors").find("tr").slice(1).remove();

  // show generate button again
  $("#button-generate-dd").show();

  rowIndex = 1;
  newRowIndex = 1;
  var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
    "<tr id='row-current-name" +
    newRowIndex +
    "'><td class='grab'><select id='ds-description-contributor-list-last-" +
    newRowIndex +
    "' onchange='onchangeLastNames(" +
    newRowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><select disabled id='ds-description-contributor-list-first-" +
    newRowIndex +
    "' onchange='onchangeFirstNames(" +
    newRowIndex +
    ")'  class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><input type='text' id='input-con-ID-" +
    newRowIndex +
    "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
    newRowIndex +
    "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
    newRowIndex +
    "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
    newRowIndex +
    ")' id='ds-contact-person-" +
    newRowIndex +
    "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
    newRowIndex +
    ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
  changeAwardInputDsDescription();
  cloneConNamesSelect(
    "ds-description-contributor-list-last-" + rowIndex.toString()
  );
}

function checkEmptyConRowInfo(table, row) {
  var empty = false;
  var type = ["select", "input"];
  for (var i = 0; i < row.cells.length - 2; i++) {
    if (row.cells[i].style.display !== "none") {
      var cell = $(row.cells[i]);
      for (var item of type) {
        if ($(cell).find(item).length > 0) {
          if (
            $(cell).find(item).val() == "" ||
            $(cell).find(item).val() == "Select an option" ||
            $(cell).find(item).val() == "Select"
          ) {
            empty = true;
            $(cell).find(item).addClass("invalid");
            if ($(cell).find("tags").length > 0) {
              $(cell).find("tags").addClass("invalid");
            }
          } else {
            $(cell).find(item).removeClass("invalid");
            if ($(cell).find("tags").length > 0) {
              $(cell).find("tags").removeClass("invalid");
            }
          }
        }
      }
    }
  }
  return empty;
}

function showExistingDDFile() {
  if (
    $("#existing-dd-file-destination").prop("placeholder") !== "Browse here" &&
    $("#Question-prepare-dd-2").hasClass("show")
  ) {
    Swal.fire({
      title:
        "Are you sure you want to import a different dataset_description file?",
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
        ipcRenderer.send("open-file-dialog-existing-DD");
        document.getElementById("existing-dd-file-destination").placeholder =
          "Browse here";
        $("#div-confirm-existing-dd-import").hide();
        $($("#div-confirm-existing-dd-import button")[0]).hide();
        $("#Question-prepare-dd-2").removeClass("show");
      }
    });
  } else {
    ipcRenderer.send("open-file-dialog-existing-DD");
  }
}

function resetDD() {
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
      $("#Question-prepare-dd-1").removeClass("prev");
      $("#Question-prepare-dd-1").nextAll().removeClass("show");
      $("#Question-prepare-dd-1").nextAll().removeClass("prev");
      $("#Question-prepare-dd-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-dd-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );
      resetDDFields();
    }
  });
}

function resetDDFields() {
  // 1. empty all input, textarea, select, para-elements
  // 2. delete all rows from table Contributor
  // 3. delete all rows from table Links
  var inputFields = $("#Question-prepare-dd-2").find("input");
  var textAreaFields = $("#Question-prepare-dd-2").find("textarea");

  // var selectFields = $("#Question-prepare-dd-4-sections").find("select");

  for (var field of inputFields) {
    $(field).val("");
  }
  for (var field of textAreaFields) {
    $(field).val("");
  }

  $("#existing-dd-file-destination").attr("placeholder", "Browse here");

  $("#div-confirm-existing-dd-import").hide();

  if ($("#bf_dataset_load_dd").text().trim() !== "None") {
    $($("#div-check-bf-import-dd").children()[0]).show();
    $("#div-check-bf-import-dd").css("display", "flex");
  } else {
    $("#div-check-bf-import-dd").hide();
  }

  // show generate button again
  $("#button-generate-dd").show();

  keywordTagify.removeAllTags();
  otherFundingTagify.removeAllTags();
  studyTechniquesTagify.removeAllTags();
  studyOrganSystemsTagify.removeAllTags();
  studyApproachesTagify.removeAllTags();

  // 3. deleting table rows
  globalContributorNameObject = {};
  currentContributorsLastNames = [];
  contributorArray = [];
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#protocol-link-table-dd tr:gt(0)").remove();
  $("#other-link-table-dd tr:gt(0)").remove();

  $("#div-contributor-table-dd").css("display", "none");
  document.getElementById("protocol-link-table-dd").style.display = "none";
  document.getElementById("div-protocol-link-table-dd").style.display = "none";
  document.getElementById("div-other-link-table-dd").style.display = "none";
  document.getElementById("other-link-table-dd").style.display = "none";

  $("#dd-accordion").find(".title").removeClass("active");
  $("#dd-accordion").find(".content").removeClass("active");

  $("#input-destination-generate-dd-locally").attr(
    "placeholder",
    "Browse here"
  );
  $("#div-confirm-destination-dd-locally").css("display", "none");
}

/////////////// Generate ds description file ///////////////////
////////////////////////////////////////////////////////////////
async function generateDatasetDescription() {
  var funding = $("#ds-description-award-input").val().trim();
  var allFieldsSatisfied = detectEmptyRequiredFields(funding)[0];
  var errorMessage = detectEmptyRequiredFields(funding)[1];

  /// raise a warning if empty required fields are found
  if (allFieldsSatisfied === false) {
    var textErrorMessage = "";
    for (var i = 0; i < errorMessage.length; i++) {
      textErrorMessage += errorMessage[i] + "<br>";
    }
    var messageMissingFields = `<div>The following mandatory item(s) is/are missing:<br> ${textErrorMessage} <br>Would you still like to generate the dataset description file?</div>`;
    var { value: continueProgressGenerateDD } = await Swal.fire({
      icon: "warning",
      html: messageMissingFields,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
    if (continueProgressGenerateDD) {
      $("#dd-accordion").removeClass("active");
      $("#dd-accordion").find(".title").removeClass("active");
      $("#dd-accordion").find(".content").removeClass("active");
      return true;
    } else {
      return false;
    }
  } else {
    $("#dd-accordion").removeClass("active");
    $("#dd-accordion").find(".title").removeClass("active");
    $("#dd-accordion").find(".content").removeClass("active");
    return true;
  }
}

async function generateDDFile(uploadBFBoolean) {
  if (uploadBFBoolean) {
    var { value: continueProgress } = await Swal.fire({
      title:
        "Any existing dataset_description.xlsx file in the high-level folder of the selected dataset will be replaced.",
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
        "Any existing dataset_description.xlsx file in the specified location will be replaced.",
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
    title: "Generating the dataset_description.xlsx file",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => { });
  var datasetInfoValueObj = grabDSInfoEntries();
  var studyInfoValueObject = grabStudyInfoEntries();
  //// grab entries from contributor info section and pass values to conSectionArray
  var contributorObj = grabConInfoEntries();
  // grab related information (protocols and additional links)
  var relatedInfoArr = combineLinksSections();
  //// process obtained values to pass to an array ///
  ///////////////////////////////////////////////////

  // process multiple Study info tagify values - keywords
  var keywordVal = [];
  for (var i = 0; i < datasetInfoValueObj["keywords"].length; i++) {
    keywordVal.push(datasetInfoValueObj["keywords"][i].value);
  }
  /// replace raw tagify values with processed tagify values
  datasetInfoValueObj["keywords"] = keywordVal;

  // process multiple Study info tagify values - Study techniques, approaches, and study organ systems
  var studyTechniqueArr = [];
  for (var i = 0; i < studyInfoValueObject["study technique"].length; i++) {
    studyTechniqueArr.push(studyInfoValueObject["study technique"][i].value);
  }
  var studyOrganSystemsArr = [];
  for (var i = 0; i < studyInfoValueObject["study organ system"].length; i++) {
    studyOrganSystemsArr.push(
      studyInfoValueObject["study organ system"][i].value
    );
  }
  var studyApproachesArr = [];
  for (var i = 0; i < studyInfoValueObject["study approach"].length; i++) {
    studyApproachesArr.push(studyInfoValueObject["study approach"][i].value);
  }
  /// replace raw tagify values with processed tagify values
  studyInfoValueObject["study organ system"] = studyOrganSystemsArr;
  studyInfoValueObject["study technique"] = studyTechniqueArr;
  studyInfoValueObject["study approach"] = studyApproachesArr;

  /// get current, selected Pennsieve account
  var bfaccountname = $("#current-bf-account").text();
  let bf_dataset = document
    .getElementById("bf_dataset_load_dd")
    .innerText.trim();

  log.info(`Generating a dataset description file.`);
  /// call python function to save file
  try {
    let save_ds_desc_file = await client.post(
      `/prepare_metadata/dataset_description_file`,
      {
        selected_account: bfaccountname,
        selected_dataset: bf_dataset,
        filepath: ddDestinationPath,
        dataset_str: datasetInfoValueObj,
        study_str: studyInfoValueObject,
        contributor_str: contributorObj,
        related_info_str: relatedInfoArr,
      },
      {
        params: {
          upload_boolean: uploadBFBoolean,
        },
      }
    );

    let res = save_ds_desc_file.data.size;

    if (uploadBFBoolean) {
      var successMessage =
        "Successfully generated the dataset_description.xlsx file on your Pennsieve dataset.";
    } else {
      var successMessage =
        "Successfully generated the dataset_description.xlsx file at the specified location.";
    }

    Swal.fire({
      title: successMessage,
      icon: "success",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // log the successful attempt to generate the description file in analytics at this step in the Generation process
    logMetadataForAnalytics(
      "Success",
      MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
    );

    // log the size of the metadata file that was generated at varying levels of granularity
    const size = res;
    logMetadataSizeForAnalytics(
      uploadBFBoolean,
      "dataset_description.xlsx",
      size
    );
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);

    Swal.fire({
      title: "Failed to generate the dataset_description file",
      html: emessage,
      icon: "warning",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // log the failure to generate the description file to analytics at this step in the Generation process
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
    );
  }
}

///// Functions to grab each piece of info to generate the dd file

// contributor info
function grabConInfoEntries() {
  var funding = $("#ds-description-award-input").val();
  var acknowledgment = $("#ds-description-acknowledgments").val();

  var fundingArray = [];
  if (funding === "") {
    fundingArray = [""];
  } else {
    fundingArray = [funding];
  }
  /// other funding sources
  var otherFunding = otherFundingTagify.value;
  for (var i = 0; i < otherFunding.length; i++) {
    fundingArray.push(otherFunding[i].value);
  }

  var contributorInfo = {};

  contributorInfo["funding"] = fundingArray;
  contributorInfo["acknowledgment"] = acknowledgment;
  contributorInfo["contributors"] = contributorArray;
  return contributorInfo;
}

function grabAdditionalLinkSection() {
  var table = document.getElementById("other-link-table-dd");
  var rowcountLink = table.rows.length;
  var additionalLinkInfo = [];
  for (i = 1; i < rowcountLink; i++) {
    var additionalLink = {
      link: table.rows[i].cells[1].innerText,
      type: table.rows[i].cells[2].innerText,
      relation: table.rows[i].cells[3].innerText,
      description: table.rows[i].cells[4].innerText,
    };
    additionalLinkInfo.push(additionalLink);
  }
  return additionalLinkInfo;
}

function grabProtocolSection() {
  var table = document.getElementById("protocol-link-table-dd");
  var rowcountLink = table.rows.length;
  var protocolLinkInfo = [];
  for (i = 1; i < rowcountLink; i++) {
    var protocol = {
      link: table.rows[i].cells[1].innerText,
      type: table.rows[i].cells[2].innerText,
      relation: table.rows[i].cells[3].innerText,
      description: table.rows[i].cells[4].innerText,
    };
    protocolLinkInfo.push(protocol);
  }
  return protocolLinkInfo;
}

function combineLinksSections() {
  var protocolLinks = grabProtocolSection();
  var otherLinks = grabAdditionalLinkSection();
  protocolLinks.push.apply(protocolLinks, otherLinks);
  return protocolLinks;
}

// add protocol function for DD file
async function addProtocol() {
  const { value: values } = await Swal.fire({
    title: "Add a protocol",
    html:
      '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL">' +
      '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    width: "38rem",
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      var link = $("#DD-protocol-link").val();
      let protocolLink = "";
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      } else {
        if (doiRegex.declared({ exact: true }).test(link) === true) {
          protocolLink = "DOI";
        } else {
          //check if link is valid
          if (validator.isURL(link) != true) {
            Swal.showValidationMessage(`Please enter a valid link`);
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
      if ($("#DD-protocol-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
      }
      var duplicate = checkLinkDuplicate(
        $("#DD-protocol-link").val(),
        document.getElementById("protocol-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage(
          "Duplicate protocol. The protocol you entered is already added."
        );
      }
      return [
        $("#DD-protocol-link").val(),
        protocolLink,
        "IsProtocolFor",
        $("#DD-protocol-description").val(),
      ];
    },
  });
  if (values) {
    addProtocolLinktoTableDD(values[0], values[1], values[2], values[3]);
  }
}

function addExistingProtocol() {
  var credentials = loadExistingProtocolInfo();
  if (credentials[0]) {
    // show email for protocol account
    showProtocolCredentials(credentials[1], "DD");
  } else {
    protocolAccountQuestion("DD", false);
  }
}

function addProtocolLinktoTableDD(
  protocolLink,
  protocolType,
  protocolRelation,
  protocolDesc
) {
  var protocolTable = document.getElementById("protocol-link-table-dd");
  protocolTable.style.display = "block";
  document.getElementById("div-protocol-link-table-dd").style.display = "block";
  var rowcount = protocolTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = protocolTable.rows[protocolTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-protocol", rowIndex);
  var indexNumber = rowIndex;
  var row = (protocolTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-protocol" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td><a href='" +
    protocolLink +
    "' target='_blank'>" +
    protocolLink +
    "</a></td><td class='contributor-table-row' style='display:none'>" +
    protocolType +
    "</td><td class='contributor-table-row'>" +
    protocolRelation +
    "</td><td class='contributor-table-row' style='display:none'>" +
    protocolDesc +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_protocol_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_protocol_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

function addAdditionalLinktoTableDD(link, linkType, linkRelation, description) {
  var linkTable = document.getElementById("other-link-table-dd");
  linkTable.style.display = "block";
  document.getElementById("div-other-link-table-dd").style.display = "block";
  var rowcount = linkTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = linkTable.rows[linkTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID(
    "row-current-additional-link",
    rowIndex
  );
  var indexNumber = rowIndex;
  var row = (linkTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-other" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td><a href='" +
    link +
    "' target='_blank'>" +
    link +
    "</a></td><td class='contributor-table-row' style='display:none'>" +
    linkType +
    "</td><td class='contributor-table-row'>" +
    linkRelation +
    "</td><td class='contributor-table-row' style='display:none'>" +
    description +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_additional_link_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_additional_link_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

const guidedSetImportedSPARCAward = (awardString) => {
  // save the award string to JSONObj to be shared with other award inputs
  sodaJSONObj["dataset-metadata"]["shared-metadata"]["imported-sparc-award"] =
    awardString;

  $("#guided-input-submission-sparc-award-import").val(awardString);

  document
    .getElementById("guided-div-imported-SPARC-award")
    .classList.remove("hidden");
  //change the button text of guided-button-import-airtable-award
  document.getElementById("guided-button-import-airtable-award").innerHTML =
    "Edit award information from Airtable";
};

async function helpSPARCAward(filetype, curationMode) {
  var award = "";
  if (filetype === "dd") {
    var res = airtableRes;
    if (curationMode === "free-form") {
      $("#select-sparc-award-dd-spinner").css("display", "block");
    }
    if (res[0]) {
      var keyname = res[1];
      var htmlEle = `<div><h2>Airtable information: </h2><h4 style="text-align:left;display:flex; flex-direction: row; justify-content: space-between">Airtable keyname: <span id="span-airtable-keyname" style="font-weight:500; text-align:left">${keyname}</span><span style="width: 40%; text-align:right"><a onclick="showAddAirtableAccountSweetalert(\'dd\', '${curationMode}')" style="font-weight:500;text-decoration: underline">Change</a></span></h4><h4 style="text-align:left">Select your award: </h4><div
        class="search-select-box"><select id="select-SPARC-award" class="w-100" data-live-search="true"style="width: 450px;border-radius: 7px;padding: 8px;"data-none-selected-text="Loading awards..."></select></div></div>`;
      const { value: awardVal } = await Swal.fire({
        html: htmlEle,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        inputPlaceholder: "Select an award",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        reverseButtons: reverseSwalButtons,
        didOpen: () => {
          $("#select-sparc-award-dd-spinner").css("display", "none");
          populateSelectSPARCAward(awardObj, "select-SPARC-award");
          $("#select-SPARC-award").selectpicker();
          $("#select-SPARC-award").selectpicker("refresh");
        },
        preConfirm: () => {
          if ($("#select-SPARC-award").val() === "Select") {
            Swal.showValidationMessage("Please select an award.");
          } else {
            award = $("#select-SPARC-award").val();
            globalSPARCAward = $("#select-SPARC-award").val();
          }
        },
      });
      if (awardVal) {
        if (curationMode === "free-form") {
          if (contributorArray.length !== 0) {
            Swal.fire({
              title:
                "Are you sure you want to delete all of the previous contributor information?",
              showCancelButton: true,
              reverseButtons: reverseSwalButtons,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              cancelButtonText: `No!`,
              cancelButtonColor: "#f44336",
              confirmButtonColor: "#3085d6",
              confirmButtonText: "Yes",
            }).then((boolean) => {
              if (boolean.isConfirmed) {
                changeAward(award, "free-form");
              }
            });
          } else {
            changeAward(award, "free-form");
          }
        }
        if (curationMode === "guided") {
          changeAward(award, "guided");
        }
      }
    } else {
      Swal.fire({
        title:
          "At this moment, SODA is not connected with your Airtable account.",
        text: "Would you like to connect your Airtable account with SODA?",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: `No!`,
        cancelButtonColor: "#f44336",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Yes",
      }).then((boolean) => {
        if (boolean.isConfirmed) {
          showAddAirtableAccountSweetalert("dd", curationMode);
        }
      });
      $("#select-sparc-award-dd-spinner").css("display", "none");
    }
  }
  if (filetype === "submission") {
    var res = airtableRes;
    let currentMilestonesInTextArea = null;
    if (curationMode == "free-form") {
      $("#select-sparc-award-submission-spinner").css("display", "block");
      currentMilestonesInTextArea = $("#selected-milestone-1");
    }
    currentMilestonesInTextArea = $("#selected-milestone-1");

    if (res[0]) {
      var keyname = res[1];
      var htmlEle = `<div><h2>Airtable information: </h2><h4 style="text-align:left;display:flex; flex-direction: row; justify-content: space-between">Airtable keyname: <span id="span-airtable-keyname" style="font-weight:500; text-align:left">${keyname}</span><span style="width: 40%; text-align:right"><a onclick="showAddAirtableAccountSweetalert(\'submission\', '${curationMode}')" style="font-weight:500;text-decoration: underline">Change</a></span></h4><h4 style="text-align:left">Select your award: </h4><div
        class="search-select-box"><select id="select-SPARC-award-submission" class="w-100" data-live-search="true"style="width: 450px;border-radius: 7px;padding: 8px;"data-none-selected-text="Loading awards..."></select></div></div>`;
      const { value: awardVal } = await Swal.fire({
        html: htmlEle,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        inputPlaceholder: "Select an award",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        didOpen: () => {
          $("#select-sparc-award-submission-spinner").css("display", "none");
          populateSelectSPARCAward(awardObj, "select-SPARC-award-submission");
          $("#select-SPARC-award-submission").selectpicker();
          $("#select-SPARC-award-submission").selectpicker("refresh");
        },
        preConfirm: () => {
          if ($("#select-SPARC-award-submission").val() === "Select") {
            Swal.showValidationMessage("Please select an award.");
          } else {
            award = $("#select-SPARC-award-submission").val();
          }
        },
      });
      if (awardVal) {
        if (currentMilestonesInTextArea.val() !== "") {
          Swal.fire({
            title:
              "Are you sure you want to delete all of the previous milestone information?",
            showCancelButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            cancelButtonText: `No!`,
            cancelButtonColor: "#f44336",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Yes",
          }).then((boolean) => {
            if (boolean.isConfirmed) {
              if (curationMode === "free-form") {
                milestoneTagify1.removeAllTags();
                $("#submission-sparc-award").val(award);
                $("#ds-description-award-input").val(award);
                document.getElementById("submission-completion-date").value =
                  "";
                loadContributorInfofromAirtable(award, "free-form");
              }

              if (curationMode === "guided") {
                guidedSetImportedSPARCAward(award);
                loadContributorInfofromAirtable(award, "guided");
              }
            }
          });
        } else {
          if (curationMode === "free-form") {
            milestoneTagify1.removeAllTags();
            $("#submission-sparc-award").val(award);
            $("#ds-description-award-input").val(award);
            document.getElementById("submission-completion-date").value = "";
          }

          if (curationMode === "guided") {
            guidedSetImportedSPARCAward(award);
            loadContributorInfofromAirtable(award, "guided");
          }
        }
      }
    } else {
      Swal.fire({
        title:
          "At this moment, SODA is not connected with your Airtable account.",
        text: "Would you like to connect your Airtable account with SODA?",
        showCancelButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: `No!`,
        cancelButtonColor: "#f44336",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Yes",
      }).then((boolean) => {
        if (boolean.isConfirmed) {
          showAddAirtableAccountSweetalert("submission", curationMode);
        }
      });
      $("#select-sparc-award-submission-spinner").css("display", "none");
    }
  }
}

function populateSelectSPARCAward(object, id) {
  removeOptions(document.getElementById(id));
  addOption(document.getElementById(id), "Select an award", "Select");
  for (var award of Object.keys(object)) {
    addOption(document.getElementById(id), object[award], award);
  }
  if (globalSPARCAward.trim() !== "") {
    if (Object.keys(object).includes(globalSPARCAward.trim())) {
      $("#select-SPARC-award").val(globalSPARCAward.trim());
    }
  }
}

function changeAward(award, curationMode) {
  Swal.fire({
    title: "Loading your award and contributor information.",
    html: "Please wait...",
    timer: 3000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => { });
  $("#ds-description-award-input").val(award);
  $("#submission-sparc-award").val(award);
  loadContributorInfofromAirtable(award, curationMode);
}

const generateContributorRowElement = (
  contributorLastName,
  contributorFirstName
) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <div class="ui fitted checkbox">
          <input type="checkbox" name="contributor">
          <label></label>
        </div>
      </td>
      <td class="middle aligned">
        ${contributorLastName}
      </td>
      <td class="middle aligned">
        ${contributorFirstName}
      </td>
    </tr>
  `;
};

const addContributorRowElement = () => {
  const newContributorRowElement = `
    <tr>
      <td class="middle aligned collapsing text-center">
        <div class="ui fitted checkbox">
          <input type="checkbox" name="contributor" checked>
          <label></label>
        </div>
      </td>
      <td class="middle aligned">
        <input
          class="guided--input"
          type="text"
          name="contributor-last-name"
          placeholder="Enter last name"
        />
      </td>
      <td class="middle aligned">
        <input
          class="guided--input"
          type="text"
          name="contributor-first-name"
          placeholder="Enter first name"
        />
      </td>
    </tr>
  `;
  //insert divToAdd before the element with id="guided-add-contributor-row"
  const divAfter = document.getElementById("guided-add-contributor-row");
  divAfter.insertAdjacentHTML("beforebegin", newContributorRowElement);
};

const loadContributorInfofromAirtable = async (award, curationMode) => {
  globalContributorNameObject = {};
  currentContributorsLastNames = [];
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#div-contributor-table-dd").css("display", "none");
  contributorArray = [];
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"];
    Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appiYd1Tz9Sv857GZ");
    await base("sparc_members")
      .select({
        filterByFormula: `({SPARC_Award_#} = "${award}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          const firstName = record.get("First_name");
          const lastName = record.get("Last_name");
          const email = record.get("Email");

          if (firstName !== undefined && lastName !== undefined) {
            globalContributorNameObject[lastName] = firstName;
            currentContributorsLastNames.push(lastName);
          }
        }),
          fetchNextPage();
      });

    function done(err) {
      if (err) {
        log.error(err);
        console.error(err);
        return;
      }
    }
  }
  if (curationMode === "guided") {
    // render the contributors table on the contributors page
    let contributorTableRows = Object.keys(globalContributorNameObject)
      .map((contributor) => {
        const contributorLast = contributor;
        const contributorFirst = globalContributorNameObject[contributor];
        return generateContributorRowElement(contributorLast, contributorFirst);
      })
      .join("\n");

    //If the response is empty, hide the contributor selection table
    //and allow the user to add contributors manually
    if (contributorTableRows.length === 0) {
      //create a notyf
      notyf.error("No contributors found for this award.");
      //hide AirTable contributor table and show contributor information fields
      document
        .getElementById("guided-div-contributors-imported-from-airtable")
        .classList.add("hidden");
      document
        .getElementById("guided-div-contributor-field-set")
        .classList.remove("hidden");

      document.getElementById("contributors-container").innerHTML = "";
      //add an empty contributor information fieldset
      addContributorField();
      return;
    }

    const contributorsTableContainer = document.getElementById(
      "contributors-table-container"
    );
    contributorsTableContainer.innerHTML = contributorTableRows;
  }
};

function addContributortoTableDD(name, contactStatus) {
  var conTable = document.getElementById("contributor-table-dd");
  document.getElementById("div-contributor-table-dd").style.display = "block";
  var rowcount = conTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = conTable.rows[conTable.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-con", rowIndex);
  var indexNumber = rowIndex;

  var conName = name;
  var conContactPerson = contactStatus;
  var row = (conTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-con" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td>" +
    conName +
    "</td><td class='contributor-table-row'>" +
    conContactPerson +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_con_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_con_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

var contributorElement =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><select id="dd-contributor-last-name" class="form-container-input-bf" onchange="onchangeLastNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div><div class="div-child"><label>First name </label><select id="dd-contributor-first-name" disabled class="form-container-input-bf" onchange="onchangeFirstNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Corresponding Author <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Check if the contributor is a corresponding author for the dataset. At least one and only one of the contributors should be the corresponding author." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div> ';

var contributorElementRaw =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><input id="dd-contributor-last-name" class="form-container-input-bf" style="line-height: 2"></input></div><div class="div-child"><label>First name</label><input id="dd-contributor-first-name" class="form-container-input-bf" style="line-height: 2"></input></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Corresponding Author <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Check if the contributor is a corresponding author for the dataset. At least one and only one of the contributors should be the corresponding author." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div>';

var contributorArray = [];
var affiliationSuggestions = [];

function showContributorSweetalert(key) {
  var currentContributortagify;
  var currentAffliationtagify;
  if (key === false) {
    if (Object.keys(globalContributorNameObject).length !== 0) {
      var footer =
        "<a style='text-decoration: none !important' onclick='showContributorSweetalert(\"pass\")' target='_blank'>I want to add a contributor not listed above</a>";
      var element = contributorElement;
    } else {
      var footer = "";
      var element = contributorElementRaw;
    }
  } else if (key === "pass") {
    var element = contributorElementRaw;
    var footer = "";
  }
  Swal.fire({
    title: "Add a contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add contributor",
    width: "max-content",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: footer,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy(".tippy-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(
        document.getElementById("input-con-role"),
        {
          whitelist: [
            "PrincipleInvestigator",
            "Creator",
            "CoInvestigator",
            "DataCollector",
            "DataCurator",
            "DataManager",
            "Distributor",
            "Editor",
            "Producer",
            "ProjectLeader",
            "ProjectManager",
            "ProjectMember",
            "RelatedPerson",
            "Researcher",
            "ResearchGroup",
            "Sponsor",
            "Supervisor",
            "WorkPackageLeader",
            "Other",
          ],
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          enforceWhitelist: true,
          duplicates: false,
        }
      );
      currentAffliationtagify = new Tagify(
        document.getElementById("input-con-affiliation"),
        {
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          whitelist: affiliationSuggestions,
          delimiters: null,
          duplicates: false,
        }
      );
      // load contributor names onto Select
      if (Object.keys(globalContributorNameObject).length !== 0) {
        if (key === false) {
          cloneConNamesSelect("dd-contributor-last-name");
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      var affValues = grabCurrentTagifyContributor(currentAffliationtagify);
      // store affiliation info as suggestions
      affiliationSuggestions.push.apply(affiliationSuggestions, affValues);
      var affSet = new Set(affiliationSuggestions);
      var affArray = [...affSet];
      affiliationSuggestions = affArray;
      var affiliationVals = affValues.join(", ");
      var roleVals = grabCurrentTagifyContributor(
        currentContributortagify
      ).join(", ");

      var firstName = $("#dd-contributor-first-name").val().trim();
      var lastName = $("#dd-contributor-last-name").val().trim();
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        firstName === "Select" ||
        lastName === "Select" ||
        firstName === "" ||
        lastName === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var duplicateConName = checkDuplicateContributorName(
          firstName,
          lastName
        );
        if (!duplicateConName) {
          if ($("#ds-contact-person").prop("checked")) {
            var contactPersonExists = checkContactPersonStatus("add", null);
            if (contactPersonExists) {
              Swal.showValidationMessage(
                "One corresponding author is already added. Only one corresponding author is allowed for a dataset."
              );
            } else {
              var myCurrentCon = {
                conName: lastName + ", " + firstName,
                conID: $("#input-con-ID").val().trim(),
                conAffliation: affiliationVals,
                conRole: roleVals + ", CorrespondingAuthor",
              };
              contributorArray.push(myCurrentCon);
              return [myCurrentCon.conName, "Yes"];
            }
          } else {
            var myCurrentCon = {
              conName: lastName + ", " + firstName,
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals,
            };
            contributorArray.push(myCurrentCon);
            return [myCurrentCon.conName, "No"];
          }
        } else {
          Swal.showValidationMessage(
            `The contributor ${lastName + ", " + firstName} is already added.`
          );
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addContributortoTableDD(result.value[0], result.value[1]);
      // memorize Affiliation info for next time as suggestions
      memorizeAffiliationInfo(affiliationSuggestions);
    }
  });
}

var contributorElement =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><select id="dd-contributor-last-name" class="form-container-input-bf" onchange="onchangeLastNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div><div class="div-child"><label>First name </label><select id="dd-contributor-first-name" disabled class="form-container-input-bf" onchange="onchangeFirstNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Corresponding Author <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Check if the contributor is a corresponding author for the dataset. At least one and only one of the contributors should be the corresponding author." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div> ';

var contributorElementRaw =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><input id="dd-contributor-last-name" class="form-container-input-bf" style="line-height: 2"></input></div><div class="div-child"><label>First name</label><input id="dd-contributor-first-name" class="form-container-input-bf" style="line-height: 2"></input></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Corresponding Author <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Check if the contributor is a corresponding author for the dataset. At least one and only one of the contributors should be the corresponding author." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div>';

var contributorArray = [];
var affiliationSuggestions = [];

//Curation  passed in should be "free-form" for free-form mode or "guided" for guided-mode
function showContributorSweetalert(key) {
  var currentContributortagify;
  var currentAffliationtagify;
  if (key === false) {
    if (Object.keys(globalContributorNameObject).length !== 0) {
      var footer =
        "<a style='text-decoration: none !important' onclick='showContributorSweetalert(\"pass\", \"guided\")' target='_blank'>I want to add a contributor not listed above</a>";
      var element = contributorElement;
    } else {
      var footer = "";
      var element = contributorElementRaw;
    }
  } else if (key === "pass") {
    var element = contributorElementRaw;
    var footer = "";
  }
  Swal.fire({
    title: "Add a contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add contributor",
    width: "max-content",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: footer,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy(".tippy-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(
        document.getElementById("input-con-role"),
        {
          whitelist: [
            "PrincipleInvestigator",
            "Creator",
            "CoInvestigator",
            "DataCollector",
            "DataCurator",
            "DataManager",
            "Distributor",
            "Editor",
            "Producer",
            "ProjectLeader",
            "ProjectManager",
            "ProjectMember",
            "RelatedPerson",
            "Researcher",
            "ResearchGroup",
            "Sponsor",
            "Supervisor",
            "WorkPackageLeader",
            "Other",
          ],
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          enforceWhitelist: true,
          duplicates: false,
        }
      );
      currentAffliationtagify = new Tagify(
        document.getElementById("input-con-affiliation"),
        {
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          whitelist: affiliationSuggestions,
          delimiters: null,
          duplicates: false,
        }
      );
      // load contributor names onto Select
      if (Object.keys(globalContributorNameObject).length !== 0) {
        if (key === false) {
          cloneConNamesSelect("dd-contributor-last-name");
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      var affValues = grabCurrentTagifyContributor(currentAffliationtagify);
      // store affiliation info as suggestions
      affiliationSuggestions.push.apply(affiliationSuggestions, affValues);
      var affSet = new Set(affiliationSuggestions);
      var affArray = [...affSet];
      affiliationSuggestions = affArray;
      var affiliationVals = affValues.join(", ");
      var roleVals = grabCurrentTagifyContributor(
        currentContributortagify
      ).join(", ");

      var firstName = $("#dd-contributor-first-name").val().trim();
      var lastName = $("#dd-contributor-last-name").val().trim();
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        firstName === "Select" ||
        lastName === "Select" ||
        firstName === "" ||
        lastName === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var contributorTable = document.getElementById("contributor-table-dd");
        var duplicateConName = checkDuplicateContributorName(
          firstName,
          lastName,
          contributorTable
        );
        if (!duplicateConName) {
          if ($("#ds-contact-person").prop("checked")) {
            var contactPersonExists = checkContactPersonStatus("add", null);
            if (contactPersonExists) {
              Swal.showValidationMessage(
                "One corresponding author is already added. Only one corresponding author is allowed for a dataset."
              );
            } else {
              var myCurrentCon = {
                conName: lastName + ", " + firstName,
                conID: $("#input-con-ID").val().trim(),
                conAffliation: affiliationVals,
                conRole: roleVals + ", CorrespondingAuthor",
              };
              contributorArray.push(myCurrentCon);
              return [myCurrentCon.conName, "Yes"];
            }
          } else {
            var myCurrentCon = {
              conName: lastName + ", " + firstName,
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals,
            };
            contributorArray.push(myCurrentCon);
            return [myCurrentCon.conName, "No"];
          }
        } else {
          Swal.showValidationMessage(
            `The contributor ${lastName + ", " + firstName} is already added.`
          );
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addContributortoTableDD(result.value[0], result.value[1], "free-form");
      // memorize Affiliation info for next time as suggestions
      memorizeAffiliationInfo(affiliationSuggestions);
    }
  });
}

function delete_current_con_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this contributor?",
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
      updateIndexForTable(document.getElementById("contributor-table-dd"));
      // 2. Delete from JSON
      var contributorName = $(currentRow)[0].cells[1].innerText;
      for (var i = 0; i < contributorArray.length; i++) {
        if (contributorArray[i].conName === contributorName) {
          contributorArray.splice(i, 1);
          break;
        }
      }
    }
  });
}

function edit_current_con_id(ev) {
  var currentContributortagify;
  var currentAffliationtagify;
  var element = contributorElementRaw;
  var currentRow = $(ev).parents()[2];
  var name = $(currentRow)[0].cells[1].innerText;
  Swal.fire({
    text: "Edit contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Edit",
    width: "max-content",
    customClass: "contributor-popup",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy(".tippy-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // disable first and last names (cannot edit these fields)
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(
        document.getElementById("input-con-role"),
        {
          whitelist: [
            "PrincipleInvestigator",
            "Creator",
            "CoInvestigator",
            "DataCollector",
            "DataCurator",
            "DataManager",
            "Distributor",
            "Editor",
            "Producer",
            "ProjectLeader",
            "ProjectManager",
            "ProjectMember",
            "RelatedPerson",
            "Researcher",
            "ResearchGroup",
            "Sponsor",
            "Supervisor",
            "WorkPackageLeader",
            "Other",
          ],
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          enforceWhitelist: true,
          duplicates: false,
        }
      );
      currentAffliationtagify = new Tagify(
        document.getElementById("input-con-affiliation"),
        {
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          // delimiters: ",",
          whitelist: affiliationSuggestions,
          duplicates: false,
        }
      );
      for (var contributor of contributorArray) {
        if (contributor.conName === name) {
          // add existing tags to tagifies
          for (var affiliation of contributor.conAffliation.split(" ,")) {
            currentAffliationtagify.addTags(affiliation);
          }
          for (var role of contributor.conRole.split(" ,")) {
            currentContributortagify.addTags(role);
          }
          if (contributor.conRole.includes("CorrespondingAuthor")) {
            $("#ds-contact-person").prop("checked", true);
          } else {
            $("#ds-contact-person").prop("checked", false);
          }
          var splitNames = name.split(", ");
          $("#dd-contributor-last-name").val(splitNames[0].trim());
          $("#dd-contributor-first-name").val(splitNames[1].trim());
          $("#dd-contributor-last-name").attr("disabled", true);
          $("#dd-contributor-first-name").attr("disabled", true);
          $("#input-con-ID").val(contributor.conID);
          break;
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        $("#dd-contributor-last-name").val().trim() === "Select" ||
        $("#dd-contributor-first-name").val().trim() === "Select" ||
        $("#dd-contributor-last-name").val().trim() === "" ||
        $("#dd-contributor-first-name").val().trim() === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var affValues = grabCurrentTagifyContributor(currentAffliationtagify);
        affiliationSuggestions.push.apply(affiliationSuggestions, affValues);
        var affSet = new Set(affiliationSuggestions);
        var affArray = [...affSet];
        affiliationSuggestions = affArray;
        var affiliationVals = affValues.join(", ");
        var roleVals = grabCurrentTagifyContributor(
          currentContributortagify
        ).join(", ");
        if ($("#ds-contact-person").prop("checked")) {
          var contactPersonExists = checkContactPersonStatus("edit", ev);
          if (contactPersonExists) {
            Swal.showValidationMessage(
              "One corresponding author is already added above. Only corresponding author person is allowed for a dataset."
            );
          } else {
            var myCurrentCon = {
              conName:
                $("#dd-contributor-last-name").val().trim() +
                ", " +
                $("#dd-contributor-first-name").val().trim(),
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals + ", CorrespondingAuthor",
              // conContact: "Yes",
            };
            for (var contributor of contributorArray) {
              if (contributor.conName === name) {
                contributorArray[contributorArray.indexOf(contributor)] =
                  myCurrentCon;
                break;
              }
            }

            return [myCurrentCon.conName, "Yes"];
          }
        } else {
          var myCurrentCon = {
            conName:
              $("#dd-contributor-last-name").val().trim() +
              ", " +
              $("#dd-contributor-first-name").val().trim(),
            conID: $("#input-con-ID").val().trim(),
            conAffliation: affiliationVals,
            conRole: roleVals,
            // conContact: "No",
          };
          for (var contributor of contributorArray) {
            if (contributor.conName === name) {
              contributorArray[contributorArray.indexOf(contributor)] =
                myCurrentCon;
              break;
            }
          }
          return [myCurrentCon.conName, "No"];
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      $(currentRow)[0].cells[2].innerText = result.value[1];
      memorizeAffiliationInfo(affiliationSuggestions);
    }
  });
}

function memorizeAffiliationInfo(values) {
  createMetadataDir();
  var content = parseJson(affiliationConfigPath);
  content["affiliation"] = values;
  fs.writeFileSync(affiliationConfigPath, JSON.stringify(content));
}

function grabCurrentTagifyContributor(tagify) {
  var infoArray = [];
  // var element = document.getElementById(id)
  var values = tagify.DOM.originalInput.value;
  if (values.trim() !== "") {
    var valuesArray = JSON.parse(values.trim());
    if (valuesArray.length > 0) {
      for (var val of valuesArray) {
        infoArray.push(val.value);
      }
    }
  }
  return infoArray;
}

function checkContactPersonStatus(type, ev) {
  var allConTable = document.getElementById("contributor-table-dd");
  if (type === "edit") {
    var contactPersonExists = false;
    var currentRow = $(ev).parents()[2];
    var name = $(currentRow)[0].cells[1].innerText;
    var rowcount = allConTable.rows.length;
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      var currentContributorName = allConTable.rows[i].cells[1].innerText;
      if (currentContributorName !== name) {
        if (contactLabel === "Yes") {
          contactPersonExists = true;
          break;
        }
      }
    }
    return contactPersonExists;
  } else {
    var contactPersonExists = false;
    var rowcount = allConTable.rows.length;
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      if (contactLabel === "Yes") {
        contactPersonExists = true;
        break;
      }
    }
    return contactPersonExists;
  }
}

function checkAtLeastOneContactPerson() {
  var contactPersonExists = false;
  var allConTable = document.getElementById("contributor-table-dd");
  var rowcount = allConTable.rows.length;
  if (allConTable.rows.length > 1) {
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      if (contactLabel === "Yes") {
        contactPersonExists = true;
        break;
      }
    }
  }
  return contactPersonExists;
}

function checkDuplicateContributorName(first, last, contributorsTable) {
  var contributorsTable;

  var duplicate = false;
  var name = last + ", " + first;
  var rowcount = contributorsTable.rows.length;
  for (var i = 1; i < rowcount; i++) {
    var currentContributorName = contributorsTable.rows[i].cells[1].innerText;
    if (currentContributorName === name) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

function checkDuplicateLink(link, table) {
  var duplicate = false;
  var rowcount = document.getElementById(table).rows.length;
  for (var i = 1; i < rowcount; i++) {
    var currentLink = document.getElementById(table).rows[i].cells[1].innerText;
    if (currentLink === link) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

///// Functions to grab each piece of info to generate the dd file

// dataset and participant info
function grabDSInfoEntries() {
  var name = document.getElementById("ds-name").value;
  var description = document.getElementById("ds-description").value;
  var type = $("#ds-type").val();
  var keywordArray = keywordTagify.value;
  var samplesNo = document.getElementById("ds-samples-no").value;
  var subjectsNo = document.getElementById("ds-subjects-no").value;

  return {
    name: name,
    description: description,
    type: type,
    keywords: keywordArray,
    "number of samples": samplesNo,
    "number of subjects": subjectsNo,
  };
}

// study info
function grabStudyInfoEntries() {
  var studyOrganSystem = studyOrganSystemsTagify.value;
  var studyApproach = studyApproachesTagify.value;
  var studyTechnique = studyTechniquesTagify.value;
  var studyPurpose = document.getElementById("ds-study-purpose").value;
  var studyDataCollection = document.getElementById(
    "ds-study-data-collection"
  ).value;
  var studyPrimaryConclusion = document.getElementById(
    "ds-study-primary-conclusion"
  ).value;
  var studyCollectionTitle = document.getElementById(
    "ds-study-collection-title"
  ).value;

  return {
    "study organ system": studyOrganSystem,
    "study approach": studyApproach,
    "study technique": studyTechnique,
    "study purpose": studyPurpose,
    "study data collection": studyDataCollection,
    "study primary conclusion": studyPrimaryConclusion,
    "study collection title": studyCollectionTitle,
  };
}

function showAddAirtableAccountSweetalert(keyword, curationMode) {
  var htmlTitle = `<h4 style="text-align:center">Please enter your Airtable API key below: <i class="fas fa-info-circle swal-popover" data-tippy-content="Note that the key will be stored locally on your computer and the SODA Team will not have access to it." rel="popover" data-placement="right" data-html="true" data-trigger="hover" ></i></h4>`;

  var bootb = Swal.fire({
    title: htmlTitle,
    html: airtableAccountBootboxMessage,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add Account",
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    reverseButtons: reverseSwalButtons,
    customClass: "swal-wide",
    footer:
      "<a href='https://docs.sodaforsparc.io/docs/prepare-metadata/connect-your-airtable-account-with-soda'  target='_blank' style='text-decoration:none'> Where do I find my Airtable API key?</a>",
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    didOpen: () => {
      // $(".swal-popover").popover();
      tippy("#airtable-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        content:
          "Note that the key will be stored locally on your computer and the SODA Team will not have access to it.",
      });
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addAirtableAccountInsideSweetalert(keyword, curationMode);
    }
  });
}

// adding row for contributor table
function addNewRow(table) {
  $("#para-save-link-status").text("");
  $("#para-save-contributor-status").text("");
  var rowcount = document.getElementById(table).rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow =
    document.getElementById(table).rows[
    document.getElementById(table).rows.length - 1
    ];
  if (table === "doi-table") {
    if (
      $(document.getElementById("doi-table").rows[rowIndex - 1].cells[1])
        .find("input")
        .val() === "" ||
      $(document.getElementById("doi-table").rows[rowIndex - 1].cells[0])
        .find("select")
        .val() === "Select"
    ) {
      $("#para-save-link-status").text("Please enter a link to add!");
    } else {
      $(".doi-helper-buttons").css("display", "inline-flex");
      $(".doi-add-row-button").css("display", "none");
      $("#select-misc-links").remove();
      // check for unique row id in case users delete old rows and append new rows (same IDs!)
      var newRowIndex = checkForUniqueRowID("row-current-link", rowIndex);
      var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
        "<tr id='row-current-link" +
        newRowIndex +
        "'><td><select id='select-misc-link' class='form-container-input-bf' onchange='populateProtocolLink(this)' style='font-size:13px;line-height:2;'><option value='Select'>Select an option</option><option value='Protocol URL or DOI*'>Protocol URL or DOI*</option><option value='Originating Article DOI'>Originating Article DOI</option><option value='Additional Link'>Additional Link</option></select></td><td><input type='text' contenteditable='true'></input></td><td><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"doi-table\")' class='ui right floated medium primary labeled icon button doi-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons doi-helper-buttons' style='display:none'><button onclick='delete_link(" +
        rowIndex +
        ")'' class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
    }
  } else if (table === "table-current-contributors") {
    // check if all the fields are populated before Adding
    var empty = checkEmptyConRowInfo(table, currentRow);
    if (empty) {
      $("#para-save-contributor-status").text(
        "Please fill in all the fields to add!"
      );
      return;
    }
    if ($(currentRow).find("label").find("input")[0].checked) {
      var currentContactPersonIDNumber = $(
        $(currentRow).find("label").find("input")[0]
      )
        .prop("id")
        .slice(-1);
      var contactPersonBoolean = contactPersonCheck(
        currentContactPersonIDNumber
      );
      if (contactPersonBoolean) {
        $("#para-save-contributor-status").text(
          "One corresponding author is already added above. Only one corresponding author is allowed for a dataset."
        );
        return;
      }
    }
    var nameDuplicateBoolean = checkContributorNameDuplicates(
      table,
      currentRow
    );
    if (nameDuplicateBoolean) {
      $("#para-save-contributor-status").text("Contributor already added!");
      return;
    }
    $("#table-current-contributors .contributor-helper-buttons").css(
      "display",
      "inline-flex"
    );
    $("#table-current-contributors .contributor-add-row-button").css(
      "display",
      "none"
    );
    // check for unique row id in case users delete old rows and append new rows (same IDs!)
    var newRowIndex = checkForUniqueRowID("row-current-name", rowIndex);
    if (noAirtable) {
      var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
        "<tr id='row-current-name" +
        newRowIndex +
        "'><td class='grab'><input id='ds-description-raw-contributor-list-last-" +
        newRowIndex +
        "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input id='ds-description-raw-contributor-list-first-" +
        newRowIndex +
        "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input name='id' type='text' id='input-con-ID-" +
        newRowIndex +
        "' contenteditable='true'></input></td><td class='grab'><input name='affiliation' id='input-con-affiliation-" +
        newRowIndex +
        "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
        newRowIndex +
        "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
        newRowIndex +
        ")' id='ds-contact-person-" +
        newRowIndex +
        "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
        newRowIndex +
        ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
      createConsRoleTagify("input-con-role-" + newRowIndex.toString());
      createConsAffliationTagify(
        "input-con-affiliation-" + newRowIndex.toString()
      );
    } else {
      if ($("#add-other-contributors").text() == "Cancel manual typing") {
        var row = (document
          .getElementById(table)
          .insertRow(rowIndex).outerHTML =
          "<tr id='row-current-name" +
          newRowIndex +
          "'><td class='grab'><input placeholder='Type here' id='ds-description-raw-contributor-list-last-" +
          newRowIndex +
          "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input placeholder='Type here' id='ds-description-raw-contributor-list-first-" +
          newRowIndex +
          "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input type='text' id='input-con-ID-" +
          newRowIndex +
          "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
          newRowIndex +
          "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
          newRowIndex +
          "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
          newRowIndex +
          ")' id='ds-contact-person-" +
          newRowIndex +
          "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
          newRowIndex +
          ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
        createConsRoleTagify("input-con-role-" + newRowIndex.toString());
        createConsAffliationTagify(
          "input-con-affiliation-" + newRowIndex.toString()
        );
      } else {
        var row = (document
          .getElementById(table)
          .insertRow(rowIndex).outerHTML =
          "<tr id='row-current-name" +
          newRowIndex +
          "'><td class='grab'><select id='ds-description-contributor-list-last-" +
          newRowIndex +
          "' onchange='onchangeLastNames(" +
          newRowIndex +
          ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><select disabled id='ds-description-contributor-list-first-" +
          newRowIndex +
          "' onchange='onchangeFirstNames(" +
          newRowIndex +
          ")' disabled class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><input type='text' id='input-con-ID-" +
          newRowIndex +
          "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
          newRowIndex +
          "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
          newRowIndex +
          "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
          newRowIndex +
          ")' id='ds-contact-person-" +
          newRowIndex +
          "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
          newRowIndex +
          ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
        cloneConNamesSelect(
          "ds-description-contributor-list-last-" + newRowIndex.toString()
        );
      }
    }
  }
}

function addAirtableAccountInsideSweetalert(keyword, curationMode) {
  // var name = $("#bootbox-airtable-key-name").val();
  var name = "SODA-Airtable";
  var key = $("#bootbox-airtable-key").val();
  if (name.length === 0 || key.length === 0) {
    var errorMessage =
      "<span>Please fill in both required fields to add.</span>";
    Swal.fire({
      icon: "error",
      html: errorMessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    }).then((result) => {
      if (result.isConfirmed) {
        showAddAirtableAccountSweetalert(keyword, curationMode);
      }
    });
  } else {
    if (curationMode === "free-form") {
      Swal.fire({
        icon: "warning",
        title: "Connect to Airtable",
        text: "This will erase your previous manual input under the submission and/or dataset description file(s). Would you like to continue?",
        heightAuto: false,
        showCancelButton: true,
        focusCancel: true,
        cancelButtonText: "Cancel",
        confirmButtonText: "Yes",
        reverseButtons: reverseSwalButtons,
        backdrop: "rgba(0,0,0,0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const optionsSparcTable = {
            hostname: airtableHostname,
            port: 443,
            path: "/v0/appiYd1Tz9Sv857GZ/sparc_members",
            headers: { Authorization: `Bearer ${key}` },
          };
          var sparcTableSuccess;
          https.get(optionsSparcTable, (res) => {
            if (res.statusCode === 200) {
              /// updating api key in SODA's storage
              createMetadataDir();
              var content = parseJson(airtableConfigPath);
              content["api-key"] = key;
              content["key-name"] = name;
              fs.writeFileSync(airtableConfigPath, JSON.stringify(content));
              checkAirtableStatus(keyword);
              // document.getElementById(
              //   "para-generate-description-status"
              // ).innerHTML = "";
              // $("#span-airtable-keyname").html(name);
              $("#current-airtable-account").html(name);
              // $("#bootbox-airtable-key-name").val("");
              $("#bootbox-airtable-key").val("");
              loadAwardData();
              // ddNoAirtableMode("Off");
              Swal.fire({
                title:
                  "Successfully connected. Loading your Airtable account...",
                timer: 10000,
                timerProgressBar: false,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
                allowEscapeKey: false,
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                  Swal.showLoading();
                },
              }).then((result) => {
                helpSPARCAward("submission", curationMode);
              });
              ipcRenderer.send(
                "track-event",
                "Success",
                "Prepare Metadata - Add Airtable account",
                "Airtable",
                1
              );
            } else if (res.statusCode === 403) {
              $("#current-airtable-account").html("None");
              Swal.fire({
                icon: "error",
                text: "Your account doesn't have access to the SPARC Airtable sheet. Please obtain access (email Dr. Charles Horn at chorn@pitt.edu)!",
                heightAuto: false,
                backdrop: "rgba(0,0,0,0.4)",
              }).then((result) => {
                if (result.isConfirmed) {
                  showAddAirtableAccountSweetalert(keyword, curationMode);
                }
              });
            } else {
              log.error(res);
              console.error(res);
              ipcRenderer.send(
                "track-event",
                "Error",
                "Prepare Metadata - Add Airtable account",
                "Airtable",
                1
              );
              Swal.fire({
                icon: "error",
                text: "Failed to connect to Airtable. Please check your API Key and try again!",
                heightAuto: false,
                backdrop: "rgba(0,0,0,0.4)",
              }).then((result) => {
                if (result.isConfirmed) {
                  showAddAirtableAccountSweetalert(keyword, curationMode);
                }
              });
            }
            res.on("error", (error) => {
              log.error(error);
              console.error(error);
              ipcRenderer.send(
                "track-event",
                "Error",
                "Prepare Metadata - Add Airtable account",
                "Airtable",
                1
              );
              Swal.fire({
                icon: "error",
                text: "Failed to connect to Airtable. Please check your API Key and try again!",
                heightAuto: false,
                backdrop: "rgba(0,0,0,0.4)",
              }).then((result) => {
                if (result.isConfirmed) {
                  showAddAirtableAccountSweetalert(keyword, curationMode);
                }
              });
            });
          });
        }
      });
    }

    if (curationMode === "guided") {
      const optionsSparcTable = {
        hostname: airtableHostname,
        port: 443,
        path: "/v0/appiYd1Tz9Sv857GZ/sparc_members",
        headers: { Authorization: `Bearer ${key}` },
      };
      let sparcTableSuccess;
      https.get(optionsSparcTable, (res) => {
        if (res.statusCode === 200) {
          /// updating api key in SODA's storage
          createMetadataDir();
          var content = parseJson(airtableConfigPath);
          content["api-key"] = key;
          content["key-name"] = name;
          fs.writeFileSync(airtableConfigPath, JSON.stringify(content));
          checkAirtableStatus(keyword);

          $("#current-airtable-account").html(name);
          $("#bootbox-airtable-key").val("");
          loadAwardData();
          Swal.fire({
            title: "Successfully connected. Loading your Airtable account...",
            timer: 10000,
            timerProgressBar: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          }).then((result) => {
            helpSPARCAward("submission", curationMode);
          });
          ipcRenderer.send(
            "track-event",
            "Success",
            "Prepare Metadata - Add Airtable account",
            "Airtable",
            1
          );
        } else if (res.statusCode === 403) {
          $("#current-airtable-account").html("None");
          Swal.fire({
            icon: "error",
            text: "Your account doesn't have access to the SPARC Airtable sheet. Please obtain access (email Dr. Charles Horn at chorn@pitt.edu)!",
            heightAuto: false,
            backdrop: "rgba(0,0,0,0.4)",
          }).then((result) => {
            if (result.isConfirmed) {
              showAddAirtableAccountSweetalert(keyword, curationMode);
            }
          });
        } else {
          log.error(res);
          console.error(res);
          ipcRenderer.send(
            "track-event",
            "Error",
            "Prepare Metadata - Add Airtable account",
            "Airtable",
            1
          );
          Swal.fire({
            icon: "error",
            text: "Failed to connect to Airtable. Please check your API Key and try again!",
            heightAuto: false,
            backdrop: "rgba(0,0,0,0.4)",
          }).then((result) => {
            if (result.isConfirmed) {
              showAddAirtableAccountSweetalert(keyword, curationMode);
            }
          });
        }
        res.on("error", (error) => {
          log.error(error);
          console.error(error);
          ipcRenderer.send(
            "track-event",
            "Error",
            "Prepare Metadata - Add Airtable account",
            "Airtable",
            1
          );
          Swal.fire({
            icon: "error",
            text: "Failed to connect to Airtable. Please check your API Key and try again!",
            heightAuto: false,
            backdrop: "rgba(0,0,0,0.4)",
          }).then((result) => {
            if (result.isConfirmed) {
              showAddAirtableAccountSweetalert(keyword, curationMode);
            }
          });
        });
      });
    }
  }
}

function importExistingDDFile() {
  var filePath = $("#existing-dd-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your dataset_description.xlsx file,",
      "error"
    );
  } else {
    if (path.parse(filePath).base !== "dataset_description.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'dataset_description.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });
    } else {
      Swal.fire({
        title: "Loading an existing dataset_description.xlsx file",
        html: "Please wait...",
        // timer: 5000,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then((result) => { });
      setTimeout(loadDDfileDataframe(filePath), 1000);
    }
  }
}

async function checkBFImportDD() {
  Swal.fire({
    title: "Importing the dataset_description.xlsx file",
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
  });

  let bf_dataset = document.getElementById("bf_dataset_load_dd").innerText;
  log.info(
    `Importing dataset_description.xlsx file from Pennsieve for dataset ${bf_dataset}`
  );
  try {
    let metadata_import = await client.get(
      `/prepare_metadata/import_metadata_file`,
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: bf_dataset,
          file_type: "dataset_description.xlsx",
        },
      }
    );
    let res = metadata_import.data;
    loadDDFileToUI(res, "bf");

    // log the import action success to analytics
    logMetadataForAnalytics(
      "Success",
      MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.PENNSIEVE
    );
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
      MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
}

async function loadDDfileDataframe(filePath) {
  try {
    let ddFileResponse = await client.get(
      "/prepare_metadata/dataset_description_file",
      {
        params: {
          filepath: filePath,
          import_type: "local",
        },
      }
    );

    let ddFileData = ddFileResponse.data;

    loadDDFileToUI(ddFileData, "local");
    // log the import action success to analytics
    logMetadataForAnalytics(
      "Success",
      MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.LOCAL
    );
  } catch (error) {
    clientError(error);
    var emessage = userErrorMessage(error);
    Swal.fire({
      title: "Failed to load the existing dataset_description.xlsx file",
      html: emessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });

    // log the import action failure to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

function loadDDFileToUI(object, file_type) {
  var basicInfoObj = object["Basic information"];
  var studyInfoObj = object["Study information"];
  var conInfo = object["Contributor information"];
  var awardInfoObj = object["Award information"];
  var relatedInfo = object["Related information"];

  ///// populating Basic info UI
  for (var arr of basicInfoObj) {
    if (arr[0] === "Type") {
      $("#ds-type").val(arr[1].toLowerCase());
    } else if (arr[0] === "Title") {
      $("#ds-name").val(arr[1]);
    } else if (arr[0] === "Subtitle") {
      $("#ds-description").val(arr[1]);
    } else if (arr[0] === "Number of subjects") {
      $("#ds-subjects-no").val(arr[1]);
    } else if (arr[0] === "Number of samples") {
      $("#ds-samples-no").val(arr[1]);
    } else if (arr[0] === "Keywords") {
      // populate keywords
      populateTagifyDD(keywordTagify, arr.splice(1));
    }
  }
  //// populating Study info UI
  for (var arr of studyInfoObj) {
    if (arr[0] === "Study purpose") {
      $("#ds-study-purpose").val(arr[1]);
    } else if (arr[0] === "Study data collection") {
      $("#ds-study-data-collection").val(arr[1]);
    } else if (arr[0] === "Study primary conclusion") {
      $("#ds-study-primary-conclusion").val(arr[1]);
    } else if (arr[0] === "Study organ system") {
      // populate organ systems
      populateTagifyDD(studyOrganSystemsTagify, arr.splice(1));
    } else if (arr[0] === "Study approach") {
      // populate approach
      populateTagifyDD(studyApproachesTagify, arr.splice(1));
    } else if (arr[0] === "Study technique") {
      // populate technique
      populateTagifyDD(studyTechniquesTagify, arr.splice(1));
    } else if (arr[0] === "Study collection title") {
      // populate collection title
      $("#ds-study-collection-title").val(arr[1]);
    }
  }

  for (var arr of awardInfoObj) {
    if (arr[0] === "Acknowledgments") {
      $("#ds-description-acknowledgments").val(arr[1]);
    } else if (arr[0] === "Funding") {
      // populate awards
      globalSPARCAward = arr[1];
      $("#ds-description-award-input").val(arr[1]);
      changeAward(globalSPARCAward, "free-form");
      populateTagifyDD(otherFundingTagify, arr.splice(2));
    }
  }

  /// populating Con info UI
  loadContributorsToTable(conInfo);

  /// populating Related info UI
  loadRelatedInfoToTable(relatedInfo);

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
  $("#button-generate-dd").show();
  if (file_type === "local") {
    $("#div-confirm-existing-dd-import").hide();
    $($("#div-confirm-existing-dd-import button")[0]).hide();
    $("#button-fake-confirm-existing-dd-file-load").click();
  } else {
    $("#div-check-bf-import-dd").hide();
    $($("#div-check-bf-import-dd button")[0]).hide();
    // $($("#button-fake-confirm-existing-bf-dd-file-load").siblings()[0]).hide();
    $("#button-fake-confirm-existing-bf-dd-file-load").click();
  }
}

function populateTagifyDD(tagify, values) {
  tagify.removeAllTags();
  for (var value of values) {
    if (value.trim() !== "") {
      tagify.addTags(value.trim());
    }
  }
}

function loadContributorsToTable(array) {
  contributorArray = [];
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#div-contributor-table-dd").css("display", "none");
  for (var arr of array.splice(1)) {
    if (arr[0].trim() !== "") {
      var myCurrentCon = {
        conName: arr[0].trim(),
        conID: arr[1].trim(),
        conAffliation: arr[2].trim(),
        conRole: arr[3].trim(),
      };
      contributorArray.push(myCurrentCon);
      var contact = "";
      if (myCurrentCon.conRole.includes("CorrespondingAuthor")) {
        contact = "Yes";
      } else {
        contact = "No";
      }
      addContributortoTableDD(myCurrentCon.conName, contact, "free-form");
    }
  }
}

function loadRelatedInfoToTable(array) {
  $("#protocol-link-table-dd tr:gt(0)").remove();
  $("#div-protocol-link-table-dd").css("display", "none");
  $("#other-link-table-dd tr:gt(0)").remove();
  $("#div-other-link-table-dd").css("display", "none");
  for (var arr of array.splice(1)) {
    if (arr[2].trim() !== "") {
      var protocolBoolean = protocolCheck(arr);
      if (protocolBoolean) {
        addProtocolLinktoTableDD(arr[2], arr[3], arr[1], arr[0]);
      } else {
        addAdditionalLinktoTableDD(arr[2], arr[3], arr[1], arr[0]);
      }
    }
  }
}

// check if a link is a protocol for UI import purpose (Basic version, could be improved further for accuracy)
// (nothing will be changed for the generating purpose, just for the UI link separation between protocols and other links)
function protocolCheck(array) {
  var boolean = false;
  // if relation includes IsProtocolFor, HasProtocol OR if description includes the word "protocol"(s) at all
  if (
    array[1].includes("IsProtocolFor") ||
    array[1].includes("HasProtocol") ||
    array[0].includes("protocol") ||
    array[0].includes("protocols")
  ) {
    boolean = true;
  }
  return boolean;
}
