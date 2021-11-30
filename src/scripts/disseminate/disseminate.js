// Main functions
async function disseminatePublish() {
  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted()) {
    // alert the user they must complete all checklist items before beginning the prepublishing process
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot submit dataset for pre-publication review!",
      text: "You need to complete all pre-publishing checklist items before you can submit your dataset for pre-publication review!",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // halt execution
    return;
  }

  // show a SWAL loading message until the submit popup that asks the user for their approval appears
  Swal.fire({
    title: `Preparing submission for pre-publishing review`,
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
  });

  // begin the dataset publishing flow
  await showPublishingStatus(submitReviewDatasetCheck);
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
    // clear the current status text found under the dataset name in pre-publishing checklist page
    $("#para-submit_prepublishing_review-status").text("");

    // check if the user can publish their dataset
    // if so publish the dataset for them under embargo or under publication
    // any exceptions will be caught here so the user can be alerted if something unexpected happens - and for logging
    disseminatePublish().catch((error) => {
      log.error(error);
      console.error(error);
      var emessage = userError(error);
      Swal.fire({
        title: "Could not withdraw dataset from publication!",
        text: `${emessage}`,
        heightAuto: false,
        icon: "error",
        confirmButtonText: "Ok",
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
      });

      // track the error for analysis
      ipcRenderer.send(
        "track-event",
        "Error",
        "Disseminate Datasets - Submit for pre-publishing review",
        defaultBfDataset
      );
    });
  }
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
    $("#submit-withdraw-prepublishing-btns-container").show();
    $("#submit-withdraw-prepublishing-btns-container button").show();
  } else {
    $("#submit-withdraw-prepublishing-btns-container").hide();
    $("#submit-withdraw-prepublishing-btns-container button").hide();
  }
});

/*
******************************************************
******************************************************
Pre-publishing section 
******************************************************
******************************************************
*/

// take the user to the Pennsieve account to sign up for an ORCID Id
$("#ORCID-btn").on("click", async () => {
  // tell the main process to open a Modal window with the webcontents of the user's Pennsieve profile so they can add an ORCID iD
  ipcRenderer.send(
    "orcid",
    "https://orcid.org/oauth/authorize?client_id=APP-J86O4ZY7LKQGWJ2X&response_type=code&scope=/authenticate&redirect_uri=https://app.pennsieve.io/orcid-redirect"
  );

  // handle the reply from the asynhronous message to sign the user into Pennsieve
  ipcRenderer.on("orcid-reply", async (event, arg) => {
    // run the pre-publishing checklist items
    showPrePublishingStatus();

    // get the access code
    let accessCode = arg;

    // check that the access code is defined
    if (!accessCode || accessCode === "") {
      // no more processing is required because the user closed the window before finishing the OAuth flow
      return;
    }

    // show a loading sweet alert
    Swal.fire({
      title: "Connecting your ORCID iD to Pennsieve.",
      html: "Please wait...",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // integrate the ORCID to PEnnsieve using the access code
    let jwt = await get_access_token();
    let connectOrcidResponse = await fetch(
      "https://api.pennsieve.io/user/orcid",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ authorizationCode: accessCode }),
      }
    );

    // get the status code
    let statusCode = connectOrcidResponse.status;

    // check for any http errors and statuses
    switch (statusCode) {
      case 200:
        // success do nothing
        break;
      case 404:
        throw new Error(
          `${statusCode} - The currently signed in user does not exist on Pennsieve.`
        );
      case 401:
        throw new Error(
          `${statusCode} - You cannot update the dataset description while unauthenticated. Please reauthenticate and try again.`
        );
      default:
        // something unexpected happened -- likely a 400 or something in the 500s
        let statusText = await connectOrcidResponse.json().statusText;
        throw new Error(`${statusCode} - ${statusText}`);
    }

    // show a success message
    Swal.fire({
      title: "ORCID iD integrated with Pennsieve",
      icon: "success",
      allowEscapeKey: true,
      allowOutsideClick: true,
      confirmButtonText: "Ok",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });
  });
});

// runs after a user selects a dataset
// changes Pre-Publishing checklist elements found in the UI on the "Disseminate Datasets - Submit for pre-publishing review" section
// to green if a user completed that item and red if they did not
const showPrePublishingStatus = async () => {
  if (defaultBfDataset === "Select dataset") {
    return;
  }

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
  let prePublishingChecklistItems = $(".icon-wrapper i");

  // filter out the completed items - by classname
  let incompleteChecklistItems = Array.from(prePublishingChecklistItems).filter(
    (checklistItem) => {
      return checklistItem.className === "close icon";
    }
  );

  // if there are any incomplete checklist items then not all items are complete
  return incompleteChecklistItems.length ? false : true;
};

// user clicks on the begin pre-publishing button
$("#begin-prepublishing-btn").on("click", async () => {
  // show a loading popup
  Swal.fire({
    title: "Determining your dataset permissions",
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
  });

  // check if the user is the dataset owner
  let owner = await userIsDatasetOwner(defaultBfDataset);

  // check if the user is the owner
  if (!owner) {
    await Swal.fire({
      title:
        "Only the dataset owner can submit a dataset for pre-publishing review.",
      icon: "error",
      confirmButtonText: "Ok",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    return;
  }

  // close the loading popup
  Swal.close();

  // hide the begin publishing button
  $("#begin-prepublishing-btn").hide();

  $("#submit-withdraw-prepublishing-btns-container").show();

  // check which of the two buttons ( withdrawal or submit ) is showing
  let withdrawBtn = $("#prepublishing-withdraw-btn-container button");

  if (withdrawBtn.css("visibility") === "hidden") {
    // show the pre-publishing checklist and the generate/withdraw button
    $("#prepublishing-checklist-container").show();
  } else {
    $("#prepublishing-checklist-container").hide();
  }

  // make the pre-publishing submit button visible
  scrollToElement("#btn-withdraw-review-dataset");
});

const scrollToElement = (elementIdOrClassname) => {
  let element = document.querySelector(elementIdOrClassname);

  element.scrollIntoView(true);
};
