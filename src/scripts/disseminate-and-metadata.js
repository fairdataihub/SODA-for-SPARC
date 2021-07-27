// Main functions
function disseminatePublish() {
  showPublishingStatus(submitReviewDatasetCheck);
}

function refreshDatasetStatus() {
  var account = $("#current-bf-account").text();
  var dataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  disseminateShowPublishingStatus("", account, dataset);
}

function disseminateShowPublishingStatus(callback, account, dataset) {
  if (dataset !== "None") {
    if (callback == "noClear") {
      var nothing;
    } else {
      $("#para-submit_prepublishing_review-status").text("");
      showPublishingStatus("noClear");
    }
  }
  $("#submit_prepublishing_review-spinner").hide();
}

// Helper functions
const disseminateDataset = (option) => {
  if (option === "share-with-curation-team") {
    $("#share-curation-team-spinner").show();
    $("#para-share-curation_team-status").text("");
    // ipcRenderer.send(
    //   "warning-share-with-curation-team",
    //   formBannerHeight.value
    // );
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      focusCancel: true,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "This will inform the Curation Team that your dataset is ready to be reviewed. It is then advised not to make changes to the dataset until the Curation Team contacts you. Would you like to continue?",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var account = $("#current-bf-account").text();
        var dataset = $(".bf-dataset-span")
          .html()
          .replace(/^\s+|\s+$/g, "");
        disseminateCurationTeam(account, dataset);
      } else {
        $("#share-curation-team-spinner").hide();
      }
    });
  } else if (option === "share-with-sparc-consortium") {
    $("#share-with-sparc-consortium-spinner").show();
    $("#para-share-with-sparc-consortium-status").text("");
    // ipcRenderer.send("warning-share-with-consortium", formBannerHeight.value);
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      focusCancel: true,
      heightAuto: false,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "Sharing will give viewer permissions to any SPARC investigator who has signed the SPARC Non-disclosure form and will allow them to see your data. This step must be done only once your dataset has been approved by the Curation Team. Would you like to continue?",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var account = $("#current-bf-account").text();
        var dataset = $(".bf-dataset-span")
          .html()
          .replace(/^\s+|\s+$/g, "");
        disseminateConsortium(account, dataset);
      } else {
        $("#share-with-sparc-consortium-spinner").hide();
      }
    });
  } else if (option === "submit-pre-publishing") {
    $("#submit_prepublishing_review-spinner").show();
    $("#para-submit_prepublishing_review-status").text("");
    disseminatePublish();
  }
  return;
};

const unshareDataset = (option) => {
  let message_text = "";
  if (option === "share-with-curation-team") {
    message_text =
      "Are you sure you want to remove SPARC Data Curation Team from this dataset and revert the status of this dataset back to 'Work In Progress (Investigator)'?";
  } else if (option === "share-with-sparc-consortium") {
    message_text =
      "Are you sure you want to remove SPARC Embargoed Data Sharing Group from this dataset and revert the status of this dataset back to 'Curated & Awaiting PI Approval (Curators)'?";
  }

  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "Continue",
    focusCancel: true,
    heightAuto: false,
    icon: "warning",
    reverseButtons: reverseSwalButtons,
    showCancelButton: true,
    text: message_text,
  }).then((result) => {
    if (result.isConfirmed) {
      $(".spinner.post-curation").show();
      if (option === "share-with-curation-team") {
        $("#para-share-curation_team-status").text("");
        disseminateCurationTeam(defaultBfAccount, defaultBfDataset, "unshare");
      } else if (option === "share-with-sparc-consortium") {
        $("#para-share-with-sparc-consortium-status").text("");
        disseminateConsortium(defaultBfAccount, defaultBfDataset, "unshare");
      }
    }
  });
};

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
  //   "warning-share-with-curation-team-selection",
  //   (event, index) => {
  //     if (index === 0) {
  //       var account = $("#current-bf-account").text();
  //       var dataset = $(".bf-dataset-span")
  //         .html()
  //         .replace(/^\s+|\s+$/g, "");
  //       disseminateCurationTeam(account, dataset);
  //     } else {
  //       $("#share-curation-team-spinner").hide();
  //     }
  //   }
  // );

  // ipcRenderer.on("warning-share-with-consortium-selection", (event, index) => {
  //   if (index === 0) {
  //     var account = $("#current-bf-account").text();
  //     var dataset = $(".bf-dataset-span")
  //       .html()
  //       .replace(/^\s+|\s+$/g, "");
  //     disseminateConsortium(account, dataset);
  //   } else {
  //     $("#share-with-sparc-consortium-spinner").show();
  //   }
  // });

  checkAirtableStatus("");

  ipcRenderer.on("selected-metadata-submission", (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      // $("#generate-submission-spinner").show();
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" + filename + "' already exists in " + dirpath[0];
        Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          icon: "error",
          text: `${emessage}`,
          title: "Metadata file already exists",
        });
        // $("#generate-submission-spinner").hide();
      } else {
        Swal.fire({
          title: "Generating the submission.xlsx file",
          html: "Please wait...",
          timer: 15000,
          allowEscapeKey: false,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {});
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
                Swal.fire(
                  "Failed to generate the submission file",
                  emessage,
                  "warning"
                );
                // document.getElementById(
                //   "para-save-submission-status"
                // ).innerHTML =
                //   "<span style='color: red;'> " + emessage + "</span>";
                ipcRenderer.send(
                  "track-event",
                  "Error",
                  "Prepare Metadata - Create Submission",
                  defaultBfDataset
                );
                // $("#generate-submission-spinner").hide();
              } else {
                // document.getElementById(
                //   "para-save-submission-status"
                // ).innerHTML =
                //   "<span style='color: black ;'>" +
                //   "Done!" +
                //   smileyCan +
                //   "</span>";
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
                // $("#generate-submission-spinner").hide();
              }
            }
          );
        }
      }
    }
  });
  ipcRenderer.on("selected-milestonedocreupload", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        // used to communicate value to button-import-milestone click event-listener
        document.getElementById("input-milestone-select-reupload").placeholder =
          filepath[0];
        $("#div-confirm-select-SPARC-awards").show();
        $("#div-cancel-reupload-DDD").hide();
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Add DDD",
          defaultBfAccount
        );
      }
    }
  });
});

const disseminateCurationTeam = (account, dataset, share_status = "") => {
  var selectedTeam = "SPARC Data Curation Team";
  var selectedRole = "manager";

  $("#curation-team-share-btn").prop("disabled", true);
  $("#curation-team-unshare-btn").prop("disabled", true);

  if (share_status === "unshare") {
    selectedRole = "remove current permissions";
  }
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
        $("#para-share-curation_team-status").css("color", "red");
        $("#para-share-curation_team-status").text(emessage);
        $("#share-curation-team-spinner").hide();
        $(".spinner.post-curation").hide();
        $("#curation-team-share-btn").prop("disabled", false);
        $("#curation-team-unshare-btn").prop("disabled", false);

        ipcRenderer.send(
          "track-event",
          "Error",
          "Disseminate Dataset - Share with Curation Team",
          dataset
        );
      } else {
        disseminateShowCurrentPermission(account, dataset);
        var selectedStatusOption = "03. Ready for Curation (Investigator)";

        if (share_status === "unshare") {
          selectedStatusOption = "02. Work In Progress (Investigator)";
        }

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
              $("#para-share-curation_team-status").css("color", "red");
              $("#para-share-curation_team-status").text(emessage);
              $("#share-curation-team-spinner").hide();
              $("#curation-team-share-btn").prop("disabled", false);
              $("#curation-team-unshare-btn").prop("disabled", false);

              ipcRenderer.send(
                "track-event",
                "Error",
                "Disseminate Dataset - Share with Curation Team",
                dataset
              );
              $(".spinner.post-curation").hide();
            } else {
              $("#para-share-curation_team-status").css(
                "color",
                "var(--color-light-green)"
              );

              $("#share-curation-team-spinner").hide();

              if (share_status === "unshare") {
                $("#para-share-curation_team-status").text(
                  `Success - Removed the Curation Team's manager permissions and set dataset status to "Work In Progress"`
                );
                $("#curation-team-unshare-btn").hide();
                $("#curation-team-share-btn").show();
              } else {
                $("#para-share-curation_team-status").text(
                  'Success - Shared with Curation Team: provided them manager permissions and set dataset status to "Ready for Curation"'
                );
                $("#curation-team-unshare-btn").show();
                $("#curation-team-share-btn").hide();
              }

              curation_consortium_check("update");
              showCurrentPermission();
              showCurrentDatasetStatus();

              ipcRenderer.send(
                "track-event",
                "Success",
                "Disseminate Dataset - Share with Curation Team",
                dataset
              );
              disseminiateShowCurrentDatasetStatus("", account, dataset);
              $(".spinner.post-curation").hide();
              $("#curation-team-share-btn").prop("disabled", false);
              $("#curation-team-unshare-btn").prop("disabled", false);
            }
          }
        );
      }
    }
  );
};

function disseminateConsortium(bfAcct, bfDS, share_status = "") {
  var selectedTeam = "SPARC Embargoed Data Sharing Group";
  var selectedRole = "viewer";

  $("#sparc-consortium-share-btn").prop("disabled", true);
  $("#sparc-consortium-unshare-btn").prop("disabled", true);

  if (share_status === "unshare") {
    selectedRole = "remove current permissions";
  }
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
        $("#para-share-with-sparc-consortium-status").css("color", "red");
        $("#para-share-with-sparc-consortium-status").text(emessage);
        $("#share-with-sparc-consortium-spinner").hide();
        $(".spinner.post-curation").hide();
        $("#sparc-consortium-share-btn").prop("disabled", false);
        $("#sparc-consortium-unshare-btn").prop("disabled", false);
        ipcRenderer.send(
          "track-event",
          "Error",
          "Disseminate Dataset - Share with Consortium",
          bfDS
        );
      } else {
        disseminateShowCurrentPermission(bfAcct, bfDS);
        var selectedStatusOption = "11. Complete, Under Embargo (Investigator)";
        if (share_status === "unshare") {
          selectedStatusOption =
            "10. Curated & Awaiting PI Approval (Curators)";
        }
        ipcRenderer.send(
          "track-event",
          "Success",
          "Disseminate Dataset - Share with Consortium",
          bfDS
        );
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
              $("#para-share-with-sparc-consortium-status").css("color", "red");
              $("#para-share-with-sparc-consortium-status").text(emessage);
              $("#share-with-sparc-consortium-spinner").hide();
              $("#sparc-consortium-share-btn").prop("disabled", false);
              $("#sparc-consortium-unshare-btn").prop("disabled", false);
              $(".spinner.post-curation").hide();
            } else {
              $("#para-share-with-sparc-consortium-status").css(
                "color",
                "var(--color-light-green)"
              );
              $("#para-share-with-sparc-consortium-status").text(
                'Success - Shared with Consortium: provided viewer permissions to Consortium members and set dataset status to "Under Embargo"'
              );
              if (share_status === "unshare") {
                $("#para-share-with-sparc-consortium-status").text(
                  `Success - Removed the SPARC Consortium's viewer permissions and set dataset status to "Curated & Awaiting PI Approval"`
                );
                $("#sparc-consortium-unshare-btn").hide();
                $("#sparc-consortium-share-btn").show();
              } else {
                $("#para-share-with-sparc-consortium-status").text(
                  'Success - Shared with Consortium: provided viewer permissions to Consortium members and set dataset status to "Under Embargo"'
                );
                $("#sparc-consortium-unshare-btn").show();
                $("#sparc-consortium-share-btn").hide();
              }
              curation_consortium_check("update");
              showCurrentPermission();
              showCurrentDatasetStatus();
              disseminiateShowCurrentDatasetStatus("", bfAcct, bfDS);
              $("#sparc-consortium-share-btn").prop("disabled", false);
              $("#sparc-consortium-unshare-btn").prop("disabled", false);
              $("#share-with-sparc-consortium-spinner").hide();
              $(".spinner.post-curation").hide();
            }
          }
        );
      }
    }
  );
}

function disseminateShowCurrentPermission(bfAcct, bfDS) {
  $("#para-share-curation_team-status").css("color", "#000");
  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  if (bfDS === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    // bfCurrentPermissionProgress.style.display = "none";
  } else {
    client.invoke("api_bf_get_permission", bfAcct, bfDS, (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        // bfCurrentPermissionProgress.style.display = "none";
      } else {
        var permissionList = "";
        let datasetOwner = "";
        for (var i in res) {
          permissionList = permissionList + res[i] + "<br>";
          if (res[i].indexOf("owner") != -1) {
            let first_position = res[i].indexOf(":");
            let second_position = res[i].indexOf(",");
            datasetOwner = res[i].substring(first_position, second_position);
          }
        }
        currentDatasetPermission.innerHTML = datasetOwner;
        // bfCurrentPermissionProgress.style.display = "none";
      }
    });
  }
}

function disseminiateShowCurrentDatasetStatus(callback, account, dataset) {
  if (dataset === "Select dataset") {
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

function checkDatasetDisseminate() {
  if (
    $(".bf-dataset-span.disseminate")
      .html()
      .replace(/^\s+|\s+$/g, "") !== "None"
  ) {
    if (
      $("#Post-curation-question-1").hasClass("prev") &&
      !$("#Post-curation-question-4").hasClass("show")
    ) {
      $("#disseminate-dataset-confirm-button").click();
    }
  }
}

$(".bf-dataset-span.submit-review").on("DOMSubtreeModified", function () {
  if ($(this).html() !== "None") {
    $("#div-confirm-submit-review").show();
    $("#div-confirm-submit-review button").show();
  } else {
    $("#div-confirm-submit-review").hide();
    $("#div-confirm-submit-review button").hide();
  }
});

/*
  The below is for Prepare metadata section
*/

// Main function to check Airtable status upon loading soda
///// config and load live data from Airtable
var sparcAwards = [];
var airtableRes = [];
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
      var base = Airtable.base("appW7lVO177HpnrP2");
      base("soda_sparc_members")
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
              airtableRes = [false, ""];
              return airtableRes;
            } else {
              $("#current-airtable-account").text(airKeyName);
              var awardSet = new Set(sparcAwards);
              var resultArray = [...awardSet];
              existingSPARCAwardsTagify.settings.whitelist = resultArray;
              airtableRes = [true, airKeyName];
              if (keyword === "dd") {
                helpSPARCAward("dd");
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

// Related to Upload DDD part (Show and Import and Cancel DDD upload)
function showDDDUploadDiv() {
  document.getElementById("para-milestone-document-info").innerHTML = "";
  document.getElementById("para-milestone-document-info-long").innerHTML = "";
  $("#Question-prepare-submission-DDD").removeClass("prev");
  $("#Question-prepare-submission-DDD")
    .nextAll()
    .removeClass("show")
    .removeClass("prev");
  $("#div-buttons-show-DDD").hide();
  $("#input-milestone-select").prop("placeholder", "Browse here");
  $("#button-import-milestone").hide();
  $("#div-upload-DDD").show();
  $("#div-cancel-DDD-import").css("display", "flex");
}

$("#btn-cancel-DDD-import").click(function () {
  $("#div-cancel-DDD-import").css("display", "none");
  $("#div-upload-DDD").hide();
  $("#div-buttons-show-DDD").show();
});

$("#reupload-DDD").click(function () {
  // 1. current individual question hide & reupload individual question added (maybe onclick on transitionFreeFormMode)
  $("#Question-prepare-submission-4").removeClass("show prev");
  $("#Question-prepare-submission-4").nextAll().removeClass("show prev");
  // first, handle target or the next div to show
  var target = document.getElementById(
    "Question-prepare-submission-reupload-DDD"
  );
  // display the target tab (data-next tab)
  if (!$(target).hasClass("show")) {
    $(target).addClass("show");
  }
  // append to parentDiv
  document.getElementById("create_submission-tab").appendChild(target);
  // auto-scroll to bottom of div
  document.getElementById("create_submission-tab").scrollTop =
    document.getElementById("create_submission-tab").scrollHeight;
  $("#div-cancel-reupload-DDD").show();
});
// 2. clone import DDD button
$("#button-import-milestone-reupload").click(function () {
  document.getElementById(
    "para-milestone-document-info-long-reupload"
  ).style.display = "none";
  document.getElementById("para-milestone-document-info-reupload").innerHTML =
    "";
  var filepath = document.getElementById(
    "input-milestone-select-reupload"
  ).placeholder;
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
        document.getElementById(
          "para-milestone-document-info-reupload"
        ).innerHTML = "<span style='color: black ;'>" + "Imported!</span>";
        document.getElementById("input-milestone-select-reupload").placeholder =
          "Select a file";
        removeOptions(descriptionDateInput);
        milestoneTagify1.removeAllTags();
        changeAwardInput();
        $("#div-confirm-DDD-reupload").show();
        $("#div-cancel-reupload-DDD").hide();
        $($("#div-confirm-DDD-reupload").children()[0]).show();
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

// Below is all the actions that show/hide Confirm buttons per the onclick/onchange/keyup... events
// under Prepare metadata

// 1A. Select SPARC award
$("#select-presaved-grant-info-list").change(function () {
  $("#Question-prepare-submission-3")
    .nextAll()
    .removeClass("show")
    .removeClass("prev");
  if ($("#select-presaved-grant-info-list").val() !== "Select") {
    $("#div-confirm-select-SPARC-awards").show();
    $($("#div-confirm-select-SPARC-awards").children()[0]).show();
    var existingDDDBoolean = changeAwardInput();
    if (existingDDDBoolean) {
      $("#btn-confirm-select-SPARC-awards").attr(
        "data-next",
        "Question-prepare-submission-4"
      );
    } else {
      $("#btn-confirm-select-SPARC-awards").attr(
        "data-next",
        "Question-prepare-submission-DDD"
      );
    }
  } else {
    $("#div-confirm-select-SPARC-awards").hide();
    $($("#div-confirm-select-SPARC-awards").children()[0]).hide();
  }
});
// 1B. Manually enter SPARC award
$("#textarea-SPARC-award-raw-input").keyup(function () {
  if ($("#textarea-SPARC-award-raw-input").val() !== "") {
    $("#div-confirm-enter-SPARC-award").show();
    $($("#div-confirm-enter-SPARC-award").children()[0]).show();
  } else {
    $("#div-confirm-enter-SPARC-award").hide();
    $($("#div-confirm-enter-SPARC-award").children()[0]).hide();
  }
});

// 3A. Select a completion date
$("#input-milestone-date").change(function () {
  if ($(this).val() !== "") {
    if (!$("#Question-prepare-submission-6").hasClass("prev")) {
      $("#div-confirm-completion-date").show();
      $($("#div-confirm-completion-date").children()[0]).show();
    }
    var res = showPreviewSubmission();
    var awardRes = res["awards"];
    var dateRes = res["date"];
    var milestonesRes = res["milestones"];
    var milestoneValues = [];
    $("#submission-SPARC-award-span").text(awardRes);
    $("#submission-completion-date-span").text(dateRes);
    milestonesRes.forEach((item, i) => {
      milestoneValues.push(milestonesRes[i].value);
    });
    $("#submission-milestones-span").text(milestoneValues.join(", \n"));
  } else {
    $("#div-confirm-completion-date").hide();
  }
});

$("#selected-milestone-date").change(function () {
  document.getElementById("input-milestone-date").value = "";
  if ($("#selected-milestone-date").val() !== "") {
    if (descriptionDateInput.value === "Enter a date") {
      actionEnterNewDate("flex");
    } else {
      actionEnterNewDate("none");
      if (!$("#Question-prepare-submission-6").hasClass("prev")) {
        $("#div-confirm-completion-date").show();
        $($("#div-confirm-completion-date").children()[0]).show();
      }
      var res = showPreviewSubmission();
      var awardRes = res["awards"];
      var dateRes = res["date"];
      var milestonesRes = res["milestones"];
      var milestoneValues = [];
      $("#submission-SPARC-award-span").text(awardRes);
      $("#submission-completion-date-span").text(dateRes);
      milestonesRes.forEach((item, i) => {
        milestoneValues.push(milestonesRes[i].value);
      });
      $("#submission-milestones-span").text(milestoneValues.join(", \n"));
    }
  } else {
    $("#div-confirm-completion-date").hide();
  }
});
// 3B. Manually type a completion date
$("#input-milestone-date-raw").change(function () {
  if ($("#input-milestone-date-raw").val() !== "mm/dd/yyyy") {
    if (!$("#Question-prepare-submission-no-skip-3").hasClass("prev")) {
      $("#div-confirm-completion-date-raw").show();
      $($("#div-confirm-completion-date-raw").children()[0]).show();
    }
    var res = showPreviewSubmission();
    var awardRes = res["awards"];
    var dateRes = res["date"];
    var milestonesRes = res["milestones"];
    var milestoneValues = [];
    $("#submission-SPARC-award-span").text(awardRes);
    $("#submission-completion-date-span").text(dateRes);
    milestonesRes.forEach((item, i) => {
      milestoneValues.push(milestonesRes[i].value);
    });
    $("#submission-milestones-span").text(milestoneValues.join(", \n"));
  } else {
    $("#div-confirm-completion-date-raw").hide();
  }
});

$(document).ready(function () {
  $("#a-SPARC-awards-not-listed").click(editSPARCAwardsBootbox);
});

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
      if ($("#selected-milestone-date").val() === "Enter a date") {
        dateRes = $("#input-milestone-date").val();
      } else {
        dateRes = $("#selected-milestone-date").val();
      }
    } else if (div.id == "Question-prepare-submission-no-skip-3") {
      dateRes = $("#input-milestone-date-raw").val();
    } else if (div.id == "Question-prepare-submission-no-skip-2") {
      milestonesRes = milestoneTagify2.value;
    } else if (div.id == "Question-prepare-submission-4") {
      milestonesRes = milestoneTagify1.value;
    }
  }
  return { awards: sparcAwardRes, date: dateRes, milestones: milestonesRes };
}

// generateSubmissionFile function takes all the values from the preview card's spans
function generateSubmissionFile() {
  document.getElementById("para-save-submission-status").innerHTML = "";
  ipcRenderer.send("open-folder-dialog-save-submission", "submission.xlsx");
}

// prepare dataset description each section (go in and out effects)
$(".button-individual-dd-section.remove").click(function () {
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  $($(this).parents()[1])
    .find(".div-dd-section-confirm")
    .css("display", "none");
  $($(this).parents()[1])
    .find(".div-dd-section-go-back")
    .css("display", "flex");
});

$(".prepare-dd-cards").click(function () {
  $("create_dataset_description-tab").removeClass("show");
  var target = $(this).attr("data-next");
  $("#" + target).toggleClass("show");
  document.getElementById("prevBtn").style.display = "none";
});

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
          "One contact person is already added above. Only one contact person is allowed for a dataset."
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
    resetDDUI("table-current-contributors");
    loadAwards();
  }
}
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
      milestoneTagify2.removeAllTags();
      milestoneTagify1.removeAllTags();
      for (var field of selectFields) {
        $(field).val("Select");
      }

      document.getElementById("para-milestone-document-info").innerHTML = "";
      document.getElementById("para-milestone-document-info-long").innerHTML =
        "";
      document.getElementById("para-save-submission-status").innerHTML = "";
      checkAirtableStatus("");
    }
  });
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
      // for (var field of selectFields) {
      //   $(field).prop("selectedIndex", 0);
      // }

      keywordTagify.removeAllTags();
      otherFundingTagify.removeAllTags();
      parentDSTagify.removeAllTags();
      completenessTagify.removeAllTags();

      $("#input-metadata-ver").val("1.2.3");

      // 3. deleting table rows
      globalContributorNameObject = {};
      currentContributorsLastNames = [];
      contributorObject = [];
      $("#contributor-table-dd tr:gt(0)").remove();
      $("#protocol-link-table-dd tr:gt(0)").remove();
      $("#additional-link-table-dd tr:gt(0)").remove();

      $("#div-contributor-table-dd").css("display", "none");
      document.getElementById("protocol-link-table-dd").style.display = "none";
      document.getElementById("additional-link-table-dd").style.display =
        "none";
    }
  });
}
