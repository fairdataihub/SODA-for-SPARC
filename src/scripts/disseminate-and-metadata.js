const disseminateStatusMessage = $("#para-disseminate-status");
const disseminateStatusMessagePublish = $("#para-disseminate-status-publish");

function disseminateDataset() {
  if ($(".bf-dataset-span").text() === "None") {
    $(disseminateStatusMessage).text("<span style='color:red'>Please select a dataset!</span>");
  } else {
    // check radio button to see which share option users choose
    // 1. Share with Curation Team
    if ($('input[name="post-curation-1"]:checked')[0].id === "share-with-curation-team") {
      $(disseminateStatusMessage).text("");
      ipcRenderer.send("warning-share-with-curation-team", formBannerHeight.value);
    }
    // 2. Share with SPARC Consortium
    if ($('input[name="post-curation-1"]:checked')[0].id === "share-with-sparc-consortium") {
      $(disseminateStatusMessage).text("");
      ipcRenderer.send("warning-share-with-consortium", formBannerHeight.value);
    }
    // 3. Submit for pre-publishing
    if ($('input[name="post-curation-1"]:checked')[0].id === "submit-pre-publishing") {
      $(disseminateStatusMessage).text("");
      disseminatePublish()
    }
  }
}

ipcRenderer.on("warning-share-with-curation-team-selection", (event, index) => {
  if (index === 0) {
    var account = $("#current-bf-account").text();
    var dataset = $(".bf-dataset-span").text();
    disseminateCurationTeam(account, dataset);
  }
});

ipcRenderer.on("warning-share-with-consortium-selection", (event, index) => {
  if (index === 0) {
    var account = $("#current-bf-account").text();
    var dataset = $(".bf-dataset-span").text();
    disseminateConsortium(account, dataset);
  }
})

function disseminateCurationTeam(account, dataset) {
  $(disseminateStatusMessage).css("color", "#000")
  $(disseminateStatusMessage).text("Please wait...");
  var selectedTeam = "SPARC Data Curation Team";
  var selectedRole = "manager";
  client.invoke(
    "api_bf_add_permission_team",
    account,
    dataset,
    selectedTeam,
    selectedRole,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        $(disseminateStatusMessage).text(emessage);
      } else {
        disseminateShowCurrentPermission(account, dataset);
        var selectedStatusOption = "03. Ready for Curation (Investigator)";
        client.invoke(
          "api_bf_change_dataset_status",
          account,
          dataset,
          selectedStatusOption,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
              var emessage = userError(error);
              $(disseminateStatusMessage).css("color", "red")
              $(disseminateStatusMessage).text(emessage)
              ipcRenderer.send(
                "track-event",
                "Error",
                "Disseminate Dataset - Share with Curation Team",
                dataset
              );
            } else {
              $(disseminateStatusMessage).css("color", "var(--color-light-green)")
              $(disseminateStatusMessage).text('Success - Shared with Curation Team: provided them manager permissions and set dataset status to "Ready for Curation"');
              ipcRenderer.send(
                "track-event",
                "Success",
                "Disseminate Dataset - Share with Curation Team",
                dataset
              );
              disseminiateShowCurrentDatasetStatus("", account, dataset);
            }
          }
        );
      }
    }
  );
}

function disseminateConsortium(bfAcct, bfDS) {
  $(disseminateStatusMessage).css("color", "#000")
  $(disseminateStatusMessage).text("Please wait...");
  var selectedTeam = "SPARC Embargoed Data Sharing Group";
  var selectedRole = "viewer";
  client.invoke(
    "api_bf_add_permission_team",
    bfAcct,
    bfDS,
    selectedTeam,
    selectedRole,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        var emessage = userError(error);
        $(disseminateStatusMessage).text(emessage)
      } else {
        disseminateShowCurrentPermission(bfAcct, bfDS);
        var selectedStatusOption = "11. Complete, Under Embargo (Investigator)";
        client.invoke(
          "api_bf_change_dataset_status",
          bfAcct,
          bfDS,
          selectedStatusOption,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
              var emessage = userError(error);
              $(disseminateStatusMessage).css("color", "red")
              $(disseminateStatusMessage).text(emessage)
            } else {
              $(disseminateStatusMessage).css("color", "var(--color-light-green)")
              $(disseminateStatusMessage).text('Success - Shared with Consortium: provided viewer permissions to Consortium members and set dataset status to "Under Embargo"')
              disseminiateShowCurrentDatasetStatus("", bfAcct, bfDS);
            }
          }
        )
      }
    }
  )
}

function disseminatePublish() {
  var account = $("#current-bf-account").text();
  var dataset = $(".bf-dataset-span").text();
  disseminateShowPublishingStatus(submitReviewDatasetCheck, account, dataset);
}

function disseminateShowPublishingStatus(callback, account, dataset) {
  $(disseminateStatusMessagePublish).css("color", "#000")
  $(disseminateStatusMessagePublish).text("Please wait...");
  if (dataset !== "None") {
    if (callback == "noClear") {
      var nothing;
    } else {
      $(disseminateStatusMessagePublish).text("");
    }
    client.invoke(
      "api_bf_get_publishing_status",
      account,
      dataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          $(disseminateStatusMessagePublish).css("color", "red")
          $(disseminateStatusMessagePublish).text(emessage)
        } else {
          $("#para-review-dataset-info-disseminate").text(publishStatusOutputConversion(res));
          if (
            callback === submitReviewDatasetCheck ||
            callback === withdrawDatasetCheck
          ) {
            callback(res);
          }
        }
      }
    );
  }
}

function disseminateShowCurrentPermission(bfAcct, bfDS) {
  $(disseminateStatusMessage).css("color", "#000")
  currentDatasetPermission.innerHTML = "Please wait...";
  if (bfDS === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    bfCurrentPermissionProgress.style.display = "none";
  } else {
    client.invoke(
      "api_bf_get_permission",
      bfAcct,
      bfDS,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          bfCurrentPermissionProgress.style.display = "none";
        } else {
          var permissionList = "";
          for (var i in res) {
            permissionList = permissionList + res[i] + "<br>";
          }
          currentDatasetPermission.innerHTML = permissionList;
          bfCurrentPermissionProgress.style.display = "none";
        }
      }
    );
  }
}

function disseminiateShowCurrentDatasetStatus(callback, account, dataset) {
  if (dataset === "Select dataset") {
    //bfCurrentDatasetStatusProgress.style.display = "none";
    $(bfCurrentDatasetStatusProgress).css("visbility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");
    datasetStatusStatus.innerHTML = "";
    removeOptions(bfListDatasetStatus);
    bfListDatasetStatus.style.color = "black";
  } else {
    datasetStatusStatus.innerHTML = "";
    client.invoke(
      "api_bf_get_dataset_status",
      account,
      dataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
          datasetStatusStatus.innerHTML =
            "<span style='color: red;'> " + emessage + "</span>";
          //bfCurrentDatasetStatusProgress.style.display = "none";
          $(bfCurrentDatasetStatusProgress).css("visbility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
        } else {
          var myitemselect = [];
          removeOptions(bfListDatasetStatus);
          for (var item in res[0]) {
            var option = document.createElement("option");
            option.textContent = res[0][item]["displayName"];
            option.value = res[0][item]["name"];
            option.style.color = res[0][item]["color"];
            bfListDatasetStatus.appendChild(option);
          }
          bfListDatasetStatus.value = res[1];
          selectOptionColor(bfListDatasetStatus);
          //bfCurrentDatasetStatusProgress.style.display = "none";
          $(bfCurrentDatasetStatusProgress).css("visbility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
          datasetStatusStatus.innerHTML = "";
          if (callback !== "") {
            callback();
          }
        }
      }
    );
  }
}

function showDDDUploadDiv() {
  $("#div-buttons-show-DDD").hide();
  $("#div-upload-DDD").show();
}

var sparcAwards = [];

function checkAirtableStatus() {
  ///// config and load live data from Airtable
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length === 0) {
    changeAirtableDiv("div-field-already-connected-dd", "div-field-not-connected-dd", "div-airtable-confirm-button-dd", "div-airtable-award-button-dd")
    changeAirtableDiv("div-field-already-connected", "div-field-not-connected", "div-airtable-confirm-button", "div-airtable-award-button")
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
          document.getElementById("div-awards-load-progress").style.display =
          "none";
          if (err) {
            changeAirtableDiv("div-field-already-connected", "div-field-not-connected", "div-airtable-confirm-button", "div-airtable-award-button")
            changeAirtableDiv("div-field-already-connected-dd", "div-field-not-connected-dd", "div-airtable-confirm-button-dd", "div-airtable-award-button-dd")
            log.error(err);
            console.log(err);
            return;
          } else {
            // create set to remove duplicates
            var awardSet = new Set(sparcAwards);
            var resultArray = [...awardSet];
            awardArrayTagify.settings.whitelist = resultArray;
            $("#current-airtable-account").text(airKeyName);
            $("#current-airtable-account-dd").text(airKeyName);
            changeAirtableDiv("div-field-not-connected", "div-field-already-connected", "div-airtable-award-button", "div-airtable-confirm-button")
            changeAirtableDiv("div-field-not-connected-dd", "div-field-already-connected-dd", "div-airtable-award-button-dd", "div-airtable-confirm-button-dd")
          }
        }
      );
    } else {
      changeAirtableDiv("div-field-already-connected", "div-field-not-connected", "div-airtable-confirm-button", "div-airtable-award-button")
      changeAirtableDiv("div-field-already-connected-dd", "div-field-not-connected-dd", "div-airtable-confirm-button-dd", "div-airtable-award-button-dd")
    }
  }
}

checkAirtableStatus()

function changeAirtableDiv(divHide, divShow, buttonHide, buttonShow) {
  $("#"+divHide).hide();
  $("#"+buttonHide).hide();
  $("#"+divShow).show();
  $("#"+buttonShow).show();
}

// Below is all the actions that show/hide Confirm buttons per the onclick/onchange/keyup... events
// under Prepare metadata

// 1A. Select SPARC award
$("#select-presaved-grant-info-list").change(function() {
  $("#Question-prepare-submission-3").nextAll().removeClass("show").removeClass("prev");
  if ($("#select-presaved-grant-info-list").val() !== "Select") {
    $("#div-confirm-select-SPARC-awards").show();
    $($("#div-confirm-select-SPARC-awards").children()[0]).show();
    var existingDDDBoolean = changeAwardInput();
    if (existingDDDBoolean) {
      $("#btn-confirm-select-SPARC-awards").attr("data-next", "Question-prepare-submission-4");
    } else {
      $("#btn-confirm-select-SPARC-awards").attr("data-next", "Question-prepare-submission-DDD");
    }
  } else {
    $("#div-confirm-select-SPARC-awards").hide();
    $($("#div-confirm-select-SPARC-awards").children()[0]).hide();
  }
});
// 1B. Manually enter SPARC award
$("#textarea-SPARC-award-raw-input").keyup(function() {
  if ($("#textarea-SPARC-award-raw-input").val() !== "") {
    $("#div-confirm-enter-SPARC-award").show();
    $($("#div-confirm-enter-SPARC-award").children()[0]).show();
  } else {
    $("#div-confirm-enter-SPARC-award").hide();
    $($("#div-confirm-enter-SPARC-award").children()[0]).hide();
  }
})

// 3A. Select a completion date

$("#selected-milestone-date").change(function() {
  document.getElementById("input-milestone-date").value = "";
  if ($("#selected-milestone-date").val() !== "") {
    if (descriptionDateInput.value === "Enter a date") {
      actionEnterNewDate("flex");
    } else {
      actionEnterNewDate("none");
    }
    $("#div-confirm-completion-date").show();
    $($("#div-confirm-completion-date").children()[0]).show();
  } else {
    $("#div-confirm-completion-date").hide();
  }
});
// 3B. Manually type a completion date
$("#input-milestone-date-raw").change(function() {
  if ($("#input-milestone-date-raw").val() !== "mm/dd/yyyy") {
    $("#div-confirm-completion-date-raw").show();
    $($("#div-confirm-completion-date-raw").children()[0]).show();
  } else {
    $("#div-confirm-completion-date-raw").hide();
  }
});
$("#btn-cancel-DDD-import").click(function() {
  $("#div-cancel-DDD-import").hide();
  $("#div-upload-DDD").hide();
  $("#div-buttons-show-DDD").show()
})

$("#a-SPARC-awards-not-listed").click(editSPARCAwardsBootbox)

$("#reupload-DDD").click(function() {
  // 1. current individual question hide & reupload individual question added (maybe onclick on transitionFreeFormMode)
  $("#Question-prepare-submission-4").removeClass("show prev")
  $("#Question-prepare-submission-4").nextAll().removeClass("show prev")
  // first, handle target or the next div to show
  var target = document.getElementById("Question-prepare-submission-reupload-DDD");
  // display the target tab (data-next tab)
  if (!$(target).hasClass("show")) {
    $(target).addClass("show");
  }
  // append to parentDiv
  document.getElementById("create_submission-tab").appendChild(target);
  // auto-scroll to bottom of div
  document.getElementById("create_submission-tab").scrollTop = document.getElementById(
    "create_submission-tab"
  ).scrollHeight;
  $("#div-cancel-reupload-DDD").show()
})
// 2. clone import DDD button
$("#button-import-milestone-reupload").click(function() {
  document.getElementById("para-milestone-document-info-long-reupload").style.display =
    "none";
  document.getElementById("para-milestone-document-info-reupload").innerHTML = "";
  var filepath = document.getElementById("input-milestone-select-reupload")
    .placeholder;
  if (filepath === "Select a file") {
    document.getElementById("para-milestone-document-info-reupload").innerHTML =
      "<span style='color: red ;'>" +
      "Please select a data deliverables document first!</span>";
    $("#div-confirm-DDD-reupload").hide();
  } else {
    var award =
      presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
    client.invoke("api_extract_milestone_info", filepath, (error, res) => {
      if (error) {
        var emessage = userError(error);
        log.error(error);
        console.error(error);
        document.getElementById(
          "para-milestone-document-info-long-reupload"
        ).style.display = "block";
        document.getElementById(
          "para-milestone-document-info-long-reupload"
        ).innerHTML = "<span style='color: red;'> " + emessage + "</span>";
        $("#div-confirm-DDD-reupload").hide();
      } else {
        milestoneObj = res;
        createMetadataDir();
        var informationJson = {};
        informationJson = parseJson(milestonePath);
        informationJson[award] = milestoneObj;
        fs.writeFileSync(milestonePath, JSON.stringify(informationJson));
        document.getElementById("para-milestone-document-info-reupload").innerHTML =
          "<span style='color: black ;'>" + "Imported!</span>";
        document.getElementById("input-milestone-select-reupload").placeholder =
          "Select a file";
        removeOptions(descriptionDateInput);
        milestoneTagify1.removeAllTags();
        changeAwardInput()
        $("#div-confirm-DDD-reupload").show();
        $("#div-cancel-reupload-DDD").hide()
        $($("#div-confirm-DDD-reupload").children()[0]).show();
      }
    });
  }
})
$("#input-milestone-select-reupload").click(function() {
  document.getElementById("para-milestone-document-info-long-reupload").style.display =
    "none";
  ipcRenderer.send("open-file-dialog-milestone-doc-reupload");
  });
  ipcRenderer.on("selected-milestonedocreupload", (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      // used to communicate value to button-import-milestone click event-listener
      document.getElementById("input-milestone-select-reupload").placeholder =
        filepath[0];
      $("#div-confirm-select-SPARC-awards").show();
      $("#div-cancel-reupload-DDD").hide()
    }
  }
})

$("#cancel-reupload-DDD").click(function() {
  $("#Question-prepare-submission-reupload-DDD").removeClass("show prev");
  $("#div-confirm-select-SPARC-awards").show()
  $("#div-confirm-select-SPARC-awards button").show()
  $("#div-confirm-select-SPARC-awards button").click()
})

// Preview submission file entries before Generating
function showPreviewSubmission() {
  var sparcAwardRes = "";
  var milestonesRes = [];
  var dateRes = "";
  for (var div of $("#create_submission-tab .individual-question.show")) {
    if (div.id == "Question-prepare-submission-3") {
      sparcAwardRes = $("#select-presaved-grant-info-list").val();
    } else if (div.id == "Question-prepare-submission-no-skip-1") {
      sparcAwardRes = $("#textarea-SPARC-award-raw-input").val();
    } else if (div.id == "Question-prepare-submission-6") {
        if (
          $("#selected-milestone-date").val() ===
          "Enter a date"
        ) {
          dateRes = $("#input-milestone-date").val();
        } else {
          dateRes = $("#selected-milestone-date").val();
        }
    } else if (div.id == "Question-prepare-submission-no-skip-3") {
      dateRes = $("#input-milestone-date-raw").val();
    } else if (div.id == "Question-prepare-submission-no-skip-2") {
      milestonesRes = milestoneTagify2.value
    } else if (div.id == "Question-prepare-submission-4") {
      milestonesRes = milestoneTagify1.value
    }
  }
  return {"awards": sparcAwardRes, "date": dateRes, "milestones": milestonesRes}
}

// generateSubmissionFile function takes all the values from the preview card's spans
function generateSubmissionFile() {
  document.getElementById("para-save-submission-status").innerHTML = ""
  ipcRenderer.send("open-folder-dialog-save-submission", "submission.xlsx");
}
ipcRenderer.on("selected-metadata-submission", (event, dirpath, filename) => {
  if (dirpath.length > 0) {
    var destinationPath = path.join(dirpath[0], filename);
    if (fs.existsSync(destinationPath)) {
      var emessage = "File " + filename + " already exists in " + dirpath[0];
      ipcRenderer.send("open-error-metadata-file-exits", emessage);
    } else {
      var awardRes = $("#submission-SPARC-award-span").text();
      var dateRes = $("#submission-completion-date-span").text();
      var milestonesRes = $("#submission-milestones-span").text();
      var milestoneValue = milestonesRes.split(", \n");
      var json_arr = [];
      json_arr.push({
        award: awardRes,
        date: dateRes,
        milestone: milestoneValue[0],
      });
      if (milestoneValue.length > 0) {
        for (var index = 1; index < milestoneValue.length; index++) {
          json_arr.push({
            award: "",
            date: "",
            milestone: milestoneValue[index],
          });
        }
      }
      json_str = JSON.stringify(json_arr);
      if (dirpath != null) {
        client.invoke(
          "api_save_submission_file",
          destinationPath,
          json_str,
          (error, res) => {
            if (error) {
              var emessage = userError(error);
              log.error(error);
              console.error(error);
              document.getElementById("para-save-submission-status").innerHTML =
                "<span style='color: red;'> " + emessage + "</span>";
            } else {
              document.getElementById("para-save-submission-status").innerHTML =
                "<span style='color: black ;'>" +
                "Done!" +
                smileyCan +
                "</span>";
            }
          }
        );
      }
    }
  }
})

// prepare dataset description each section (go in and out effects)
$(".button-individual-dd-section.remove").click(function () {
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  $($(this).parents()[1]).find(".div-dd-section-confirm").css("display", "none");
  $($(this).parents()[1]).find(".div-dd-section-go-back").css("display", "flex");
});

$(".prepare-dd-cards").click(function () {
  $("create_dataset_description-tab").removeClass("show");
  var target = $(this).attr("data-next");
  $("#" + target).toggleClass("show");
  document.getElementById("prevBtn").style.display = "none";
});

function addNewRow(table) {
  $("#add-other-contributors").text("Add contributors not listed above");
  $("#para-save-link-status").text("");
  $("#para-save-contributor-status").text("");
  var rowcount = document.getElementById(table).rows.length;
    /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = document.getElementById(table).rows[document.getElementById(table).rows.length-1]
  if (table==='doi-table') {
    if ($(document.getElementById('doi-table').rows[rowIndex-1].cells[1]).find("input").val() == "") {
      $("#para-save-link-status").text("Please enter a link to add!")
    } else {
      $('.doi-helper-buttons').css('display', 'inline-flex');
      $('.doi-add-row-button').css('display', 'none');
      // check for unique row id in case users delete old rows and append new rows (same IDs!)
      var newRowIndex = checkForUniqueRowID("row-current-link", rowIndex);
      var row = document.getElementById(table).insertRow(rowIndex).outerHTML="<tr id='row-current-link" +newRowIndex +"'><td><select id='select-misc-link' class='form-container-input-bf' style='font-size:13px;line-height:2;'><option value='Select' disabled>Select an option</option><option value='Protocol URL or DOI*'>Protocol URL or DOI*</option><option value='Originating Article DOI'>Originating Article DOI</option><option value='Additional Link'>Additional Link</option></select></td><td><input type='text' contenteditable='true'></input></td><td><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"doi-table\")' class='ui right floated medium primary labeled icon button doi-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons doi-helper-buttons' style='display:none'><button onclick='delete_link(" +
      rowIndex +")'' class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>";
    }
  } else if (table === 'table-current-contributors') {
    // check if all the fields are populated before Adding
    if ($("#"+currentRow.cells[0].children[0].id).val() == "Select an option" || $("#"+currentRow.cells[0].children[0].id).val() == "Select an option" || $("#"+currentRow.cells[0].children[0].id).val() == "" || $("#"+currentRow.cells[1].children[0].id).val() == "" || $("#"+currentRow.cells[2].children[0].id).val() == "" || currentRow.cells[3].innerText == "" || currentRow.cells[4].innerText == "") {
      $("#para-save-contributor-status").text("Please fill in all the fields to add!")
    } else {
      if ($(currentRow).find("label").find("input")[0].checked) {
        var contactPersonBoolean = contactPersonCheck();
        if (contactPersonBoolean) {
          $("#para-save-contributor-status").text("One contact person is already added above. Only one contact person is allowed for a dataset.")
          return
        }
      }
      var nameDuplicateBoolean = checkContributorNameDuplicates(table, currentRow)
      if (nameDuplicateBoolean) {
        $("#para-save-contributor-status").text("Contributor already added!")
        return
      }
      $('#table-current-contributors .contributor-helper-buttons').css('display', 'inline-flex');
      $('#table-current-contributors .contributor-add-row-button').css('display', 'none');
      // check for unique row id in case users delete old rows and append new rows (same IDs!)
      var newRowIndex = checkForUniqueRowID("row-current-name", rowIndex);
      var row = document.getElementById(table).insertRow(rowIndex).outerHTML="<tr id='row-current-name" +newRowIndex +"'><td class='grab'><select id='ds-description-contributor-list-last-"+newRowIndex+"' onchange='onchangeLastNames("+newRowIndex+")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><select id='ds-description-contributor-list-first-"+newRowIndex+"' onchange='onchangeFirstNames("+newRowIndex+")'  class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><input type='text' id='input-con-ID-"+newRowIndex+"' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-"+newRowIndex+"' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-"+newRowIndex+"'></input></td><td class='grab'><label class='switch'><input id='ds-contact-person-"+newRowIndex+"' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
      rowIndex +")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>";
      // createConsRoleTagify('input-con-role-'+newRowIndex.toString());
      // createConsAffliationTagify('input-con-affiliation-'+newRowIndex.toString())
      cloneConNamesSelect('ds-description-contributor-list-last-'+newRowIndex.toString())
      }
    }
}

function checkForUniqueRowID(rowID, no) {
  if ($("#"+rowID+no.toString()).length == 0) {
    return no
  } else {
    no = no + 1
    return checkForUniqueRowID(rowID, no)
  }
}

// check for duplicates in names of contributors
function checkContributorNameDuplicates(table, currentRow) {
  var duplicate = false;
  var currentConLastName = $("#"+currentRow.cells[0].children[0].id).val();
  var currentConFirstName = $("#"+currentRow.cells[1].children[0].id).val();
  var rowcount = document.getElementById(table).rows.length;
  for (var i = 1; i < rowcount - 1; i++) {
    if ($("#"+document.getElementById(table).rows[i].cells[0].children[0].id).val() === currentConLastName
      && $("#"+document.getElementById(table).rows[i].cells[1].children[0].id).val()  === currentConFirstName) {
      duplicate = true;
      break;
    }
  }
  return duplicate
}

function cloneConNamesSelect(selectLast) {
  for (var i = 0; i < currentContributorsLastNames.length; i++) {
    var opt = currentContributorsLastNames[i];
    if (document.getElementById(selectLast)) {
      addOption(document.getElementById(selectLast), opt, opt);
    }
  }
}

function createConsRoleTagify(inputField) {
  var input = document.getElementById(inputField);
  // initialize Tagify on the above input node reference
  var tagify = new Tagify(input, {
    whitelist: ["PrincipleInvestigator", "Creator", "CoInvestigator", "DataCollector", "DataCurator", "DataManager", "Distributor", "Editor", "Producer", "ProjectLeader", "ProjectManager", "ProjectMember", "RelatedPerson", "Researcher", "ResearchGroup", "Sponsor", "Supervisor", "WorkPackageLeader", "Other"],
    enforceWhitelist: true,
    dropdown : {
       enabled   : 0,
       closeOnSelect : true
     }
  })
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
    duplicates: false
  })
}

$(document).ready(function() {
  $("#add-other-contributors").on("click", function() {
    if ($(this).text() == "Add contributors not listed above") {
      addOtherContributors("table-current-contributors");
      $(this).text("Cancel manual typing")
    } else {
      cancelOtherContributors("table-current-contributors")
      $(this).text("Add contributors not listed above")
    }
  })
})

function cancelOtherContributors(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount;
  var currentRow = document.getElementById(table).rows[document.getElementById(table).rows.length-1]
  currentRow.cells[0].outerHTML = "<td class='grab'><select id='ds-description-contributor-list-last-"+rowIndex+"' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td>"
  currentRow.cells[1].outerHTML = "<td class='grab'><select id='ds-description-contributor-list-first-"+rowIndex+"' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td>"
}

function addOtherContributors(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount;
  var currentRow = document.getElementById(table).rows[document.getElementById(table).rows.length-1]
  currentRow.cells[0].outerHTML = "<td><input type='text' placeholder='Type here' contenteditable='true' id='other-contributors-last-"+rowIndex+"'></input></td>"
  currentRow.cells[1].outerHTML = "<td><input type='text' placeholder='Type here' contenteditable='true' id='other-contributors-first-"+rowIndex+"'></input></td>"
}
