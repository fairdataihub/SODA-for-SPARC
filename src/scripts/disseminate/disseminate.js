// Main functions
async function disseminatePublish() {
  // run preassumption checks
  let role;
  try {
    // get the user's dataset permissions
    role = await getCurrentUserPermissions(defaultBfDataset);
  } catch (error) {
    // could not get permissions
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "We had trouble checking if you are the dataset owner",
      text: "Please try to submit your dataset for publication again. If that does not work please contact Bhavesh Patel at bpatel@calmi2.org",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // hide the spinner
    $("#submit_prepublishing_review-spinner").hide();

    // alert Google analytics
    ipcRenderer.send(
      "track-event",
      "Error",
      "Disseminate Datasets - Submit for pre-publishing review",
      defaultBfDataset
    );

    // halt execution
    return;
  }
  // check if they are not the dataset owner
  if (!userIsOwner(role)) {
    // tell the user only the owner of a dataset can publish it
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Only the owner of the dataset can publish!",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // stop the loader
    $("#submit_prepublishing_review-spinner").hide();
    // stop execution
    return;
  }

  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted()) {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot submit dataset for publication!",
      text: "You need to complete all pre-publishing checklist items before you can submit your dataset for publication!",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // hide the spinner
    $("#submit_prepublishing_review-spinner").hide();

    // halt execution
    return;
  }

  // begin the dataset publishing flow
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
        disseminateCurationTeam(defaultBfAccount, defaultBfDataset, "unshare");
      } else if (option === "share-with-sparc-consortium") {
        disseminateConsortium(defaultBfAccount, defaultBfDataset, "unshare");
      }
    }
  });
};

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
        Swal.fire({
          title: "Failed to share with Curation team!",
          text: emessage,
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
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
              Swal.fire({
                title: "Failed to share with Curation team!",
                text: emessage,
                icon: "error",
                showConfirmButton: true,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });
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
              $("#share-curation-team-spinner").hide();

              if (share_status === "unshare") {
                Swal.fire({
                  title: "Successfully shared with Curation team!",
                  text: `Removed the Curation Team's manager permissions and set dataset status to "Work In Progress"`,
                  icon: "success",
                  showConfirmButton: true,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                });
                $("#curation-team-unshare-btn").hide();
                $("#curation-team-share-btn").show();
              } else {
                Swal.fire({
                  title: "Successfully shared with Curation team!",
                  text: 'This provided the Curation Team manager permissions and set your dataset status to "Ready for Curation"',
                  icon: "success",
                  showConfirmButton: true,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                });
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
        Swal.fire({
          title: "Failed to share with SPARC Consortium!",
          text: emessage,
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
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
              Swal.fire({
                title: "Failed to share with Consortium!",
                text: emessage,
                icon: "error",
                showConfirmButton: true,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });
              $("#share-with-sparc-consortium-spinner").hide();
              $("#sparc-consortium-share-btn").prop("disabled", false);
              $("#sparc-consortium-unshare-btn").prop("disabled", false);
              $(".spinner.post-curation").hide();
            } else {
              Swal.fire({
                title: "Successfully shared with Consortium!",
                text: `This provided viewer permissions to Consortium members and set dataset status to "Under Embargo"`,
                icon: "success",
                showConfirmButton: true,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });
              if (share_status === "unshare") {
                Swal.fire({
                  title: "Removed successfully!",
                  text: `Removed the SPARC Consortium's viewer permissions and set dataset status to "Curated & Awaiting PI Approval"`,
                  icon: "success",
                  showConfirmButton: true,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                });
                $("#sparc-consortium-unshare-btn").hide();
                $("#sparc-consortium-share-btn").show();
              } else {
                Swal.fire({
                  title: "Successully shared with Consortium!",
                  text: `This provided viewer permissions to Consortium members and set dataset status to "Under Embargo"`,
                  icon: "success",
                  showConfirmButton: true,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                });
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
    removeOptions(bfListDatasetStatus);
    bfListDatasetStatus.style.color = "black";
  } else {
    client.invoke(
      "api_bf_get_dataset_status",
      account,
      dataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          var emessage = userError(error);
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

// runs after a user selects a dataset
// changes Pre-Publishing checklist elements found in the UI on the "Disseminate Datasets - Submit for pre-publishing review" section
// to green if a user completed that item and red if they did not
const showPrePublishingStatus = async () => {
  if (defaultBfDataset === "Select dataset") {
    return;
  }

  console.log("Running pre-publishing status items");

  // spinners that fit into the checklist icon slots until statuses have been verified for the items
  $(".icon-wrapper").attr("class", "ui mini active inline loader icon-wrapper");
  $(".icon-wrapper").children().css("visibility", "hidden");

  // run the validation checks on each pre-publishing checklist item
  let statuses = await getPrepublishingChecklistStatuses(defaultBfDataset);

  // mark each pre-publishing item red or green to indicate if the item was completed
  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-subtitle",
    statuses.subtitle
  );

  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-description",
    statuses.description
  );

  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-tags",
    statuses.tags
  );

  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-banner",
    statuses.bannerImageURL
  );

  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-license",
    statuses.license
  );

  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-ORCID",
    statuses.ORCID
  );

  // hide the spinner and show the checklist item icons
  $(".icon-wrapper").attr("class", "icon-wrapper");
  $(".icon-wrapper").children().css("visibility", "visible");
};

// Inputs:
//  iconElementId : string - corresponds with the icons in the pre-publishing checklist
//  status: a boolean corresponding to the checklist item
// gets the pre-publishing checklist item element by id and gives it a check or an 'x' based off the value of the pre-publishing item's status
const setPrepublishingChecklistItemIconByStatus = (iconElementId, status) => {
  if (status) {
    $(`#${iconElementId}`).attr("class", "check icon");
    $(`#${iconElementId}`).css("color", "green");
  } else {
    $(`#${iconElementId}`).attr("class", "close icon");
    $(`#${iconElementId}`).css("color", "red");
  }
};

// reads the pre-publishing checklist items from the UI and returns true if all are completed and false otherwise
const allPrepublishingChecklistItemsCompleted = () => {
  // get the icons for the checklist elements
  let prePublishingChecklistItems = $(".icon-wrapper i")

  // filter out the completed items - by classname
  let incompleteChecklistItems = Array.from(prePublishingChecklistItems).filter(
    (checklistItem) => {
      return checklistItem.className === "close icon";
    }
  );

  // if there are any incomplete checklist items then not all items are complete
  return incompleteChecklistItems.length ? false : true;
};
