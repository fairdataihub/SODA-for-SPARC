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
        title: "Could not submit dataset for publication",
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

      // log the failure to publish to analytics
      logCurationForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Publish"],
        Destinations.PENNSIEVE,
        true
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
  try {
    let share_sparc_team = await client.patch(
      `/manage_datasets/bf_dataset_permissions`, {
        params: {
          selected_account: account,
          selected_dataset: dataset,
          scope: "team",
          name: selectedTeam,
        },
        payload: {
          input_role: selectedRole
        }
      }
    );

    let res = share_sparc_team.data.message;

    logGeneralOperationsForAnalytics(
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_CURATION_TEAM,
      AnalyticsGranularity.ACTION,
      [
        share_status === "unshare"
          ? "Remove Consortium's Team Permissions"
          : "Give Consortium Team Permissions",
      ]
    );

    disseminateShowCurrentPermission(account, dataset);
    var selectedStatusOption = "03. Ready for Curation (Investigator)";

    if (share_status === "unshare") {
      selectedStatusOption = "02. Work In Progress (Investigator)";
    }
    try {
      let change_dataset_status = await client.put(
        `/manage_datasets/bf_dataset_status`,
        {
          payload: {
            selected_bfaccount: account,
            selected_bfdataset: dataset,
            selected_status: selectedStatusOption
          }
        }
      );
      let res = change_dataset_status.data.message;

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
        logGeneralOperationsForAnalytics(
          "Success",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_CURATION_TEAM,
          AnalyticsGranularity.ALL_LEVELS,
          ["Change Dataset Status to Work In Progress"]
        );
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

        logGeneralOperationsForAnalytics(
          "Success",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_CURATION_TEAM,
          AnalyticsGranularity.ALL_LEVELS,
          ["Change Dataset Status to Ready for Curation"]
        );
      }

      curation_consortium_check("update");
      showCurrentPermission();
      showCurrentDatasetStatus();

      disseminiateShowCurrentDatasetStatus("", account, dataset);
      $(".spinner.post-curation").hide();
      $("#curation-team-share-btn").prop("disabled", false);
      $("#curation-team-unshare-btn").prop("disabled", false);
    }catch(error) {
      clientError(error);
      let emessage = error.response.data.message;

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

      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_CURATION_TEAM,
        AnalyticsGranularity.ALL_LEVELS,
        [
          share_status === "unshare"
            ? "Change Dataset Status to Work In Progress"
            : "Change Dataset Status to Ready for Curation",
        ]
      );
      $(".spinner.post-curation").hide();
    }

  } catch (error) {
    clientError(error);
    let emessage = error.response.data.message;

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

    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_CURATION_TEAM,
      AnalyticsGranularity.ALL_LEVELS,
      [
        share_status === "unshare"
          ? "Remove Consortium's Team Permissions"
          : "Give Consortium Team Permissions",
      ]
    );
  }
};

function disseminateConsortium(bfAcct, bfDS, share_status = "") {
  var selectedTeam = "SPARC Embargoed Data Sharing Group";
  var selectedRole = "viewer";

  $("#sparc-consortium-share-btn").prop("disabled", true);
  $("#sparc-consortium-unshare-btn").prop("disabled", true);

  if (share_status === "unshare") {
    selectedRole = "remove current permissions";
  }
  try {
    let share_with_sparc = await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        params: {
          selected_account: bfAcct,
          selected_dataset: bfDS,
          scope: "team",
          name: selectedTeam
        },
        payload: {
          input_role: selectedRole
        }
      }
    );
    
    let res = share_with_sparc.data.message;

    // log the success to SPARC
    logGeneralOperationsForAnalytics(
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_SPARC_CONSORTIUM,
      AnalyticsGranularity.ACTION,
      [
        share_status === "unshare"
          ? "Removed Team Permissions SPARC Consortium"
          : "Add Team Permissions SPARC Consortium",
      ]
    );
      
    disseminateShowCurrentPermission(bfAcct, bfDS);
    var selectedStatusOption = "11. Complete, Under Embargo (Investigator)";
    if (share_status === "unshare") {
      selectedStatusOption =
        "10. Curated & Awaiting PI Approval (Curators)";
    }
    try {
      let change_dataset_status = await client.put(
        `/manage_datasets/bf_dataset_status`,
        {
          selected_bfaccount: bfAcct,
          selected_bfdataset: bfDS,
          selected_status: selectedStatusOption,
        },
      );
      
      let res = change_dataset_status.data.message;

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
        logGeneralOperationsForAnalytics(
          "Success",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_SPARC_CONSORTIUM,
          AnalyticsGranularity.ALL_LEVELS,
          [
            share_status === "unshare"
              ? "Curated & Awaiting PI Approval"
              : "Change Dataset Status to Under Embargo",
          ]
        );
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
        logGeneralOperationsForAnalytics(
          "Success",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_SPARC_CONSORTIUM,
          AnalyticsGranularity.ALL_LEVELS,
          [
            share_status === "unshare"
              ? "Curated & Awaiting PI Approval"
              : "Change Dataset Status to Under Embargo",
          ]
        );
      }
      curation_consortium_check("update");
      showCurrentPermission();
      showCurrentDatasetStatus();
      disseminiateShowCurrentDatasetStatus("", bfAcct, bfDS);
      $("#sparc-consortium-share-btn").prop("disabled", false);
      $("#sparc-consortium-unshare-btn").prop("disabled", false);
      $("#share-with-sparc-consortium-spinner").hide();
      $(".spinner.post-curation").hide();
    } catch(error) {
      clientError(error);
      let emessage = error.response.data.message;

      Swal.fire({
        title: "Failed to share with Consortium!",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
  
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_SPARC_CONSORTIUM,
        AnalyticsGranularity.All_LEVELS,
        [
          share_status === "unshare"
            ? "Curated & Awaiting PI Approval"
            : "Change Dataset Status to Under Embargo",
        ]
      );
  
      $("#share-with-sparc-consortium-spinner").hide();
      $("#sparc-consortium-share-btn").prop("disabled", false);
      $("#sparc-consortium-unshare-btn").prop("disabled", false);
      $(".spinner.post-curation").hide();
    }
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

        } else {

        }
      }
    );
  } catch(error) {
    clientError(error);
    let emessage = error.response.data.message;

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

    // log the error to SPARC
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_SPARC_CONSORTIUM,
      AnalyticsGranularity.ALL_LEVELS,
      [
        share_status === "unshare"
          ? "Removed Team Permissions SPARC Consortium"
          : "Add Team Permissions SPARC Consortium",
      ]
    );
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

      } else {
        try {

  
    } catch(error) {
      clientError(error);
      let emessage = error.response.data.message;
  
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
  
      // log the error to SPARC
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_SPARC_CONSORTIUM,
        AnalyticsGranularity.ALL_LEVELS,
        [
          share_status === "unshare"
            ? "Removed Team Permissions SPARC Consortium"
            : "Add Team Permissions SPARC Consortium",
        ]
      );
    }

      }
    }
  );
}

async function disseminateShowCurrentPermission(bfAcct, bfDS) {
  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  if (bfDS === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    // bfCurrentPermissionProgress.style.display = "none";
  } else {
    try {
      let dataset_permissions = await client.get(
        `/manage_datasets/bf_dataset_permissions`,
        {
          params: {
            selected_account: bfAcct,
            selected_dataset: bfDS,
          },
        }
      );
      let res = dataset_permissions.data.permissions;

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

      ipcRenderer.send(
        "track-event",
        "Success",
        "Disseminate Datasets - Show current dataset permission",
        defaultBfDatasetId
      );
    } catch (error) {
      clientError(error);
      ipcRenderer.send(
        "track-event",
        "Error",
        "Disseminate Datasets - Show current dataset permission",
        defaultBfDatasetId
      );
    }
  }
}

async function disseminiateShowCurrentDatasetStatus(
  callback,
  account,
  dataset
) {
  if (dataset === "Select dataset") {
    $(bfCurrentDatasetStatusProgress).css("visbility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");
    removeOptions(bfListDatasetStatus);
    bfListDatasetStatus.style.color = "black";
  } else {
    try {
      let dataset_permissions = await client.get(
        `/manage_datasets/bf_dataset_permissions`,
        {
          params: {
            selected_account: account,
            selected_dataset: dataset,
          },
        }
      );
      let res = dataset_permissions.data.status_options;

      ipcRenderer.send(
        "track-event",
        "Success",
        "Disseminate Datasets - Show current dataset status",
        defaultBfDatasetId
      );
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
    } catch (error) {
      clientError(error);
      $(bfCurrentDatasetStatusProgress).css("visbility", "hidden");
      $("#bf-dataset-status-spinner").css("display", "none");
      ipcRenderer.send(
        "track-event",
        "Error",
        "Disseminate Datasets - Show current dataset status",
        defaultBfDatasetId
      );
    }
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

// $(".bf-dataset-span.submit-review").on("DOMSubtreeModified", function () {
//   if ($(this).html() !== "None") {
//     $("#submit-withdraw-prepublishing-btns-container").show();
//     $("#submit-withdraw-prepublishing-btns-container button").show();
//   } else {
//     $("#submit-withdraw-prepublishing-btns-container").hide();
//     $("#submit-withdraw-prepublishing-btns-container button").hide();
//   }
// });

/*
******************************************************
******************************************************
Pre-publishing Submission Workflow Section 

Note: Some frontend elements of the workflow are in the renderer.js file as well. They are can be found under postCurationListChange() function.
      All backend requests can be found in the renderer.js file.
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
  ipcRenderer.on("orcid-reply", async (event, accessCode) => {
    if (!accessCode || accessCode === "") {
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

    try {
      // TODO: Replace with Flask
      await integrateORCIDWithPennsieve(accessCode);
    } catch (error) {
      clientError(error);
      let emessage = error.response.data.message;
      Swal.fire({
        title: "Unable to integrate your ORCID iD with Pennsieve",
        text: emessage,
        icon: "error",
        allowEscapeKey: true,
        allowOutsideClick: true,
        confirmButtonText: "Ok",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
      });

      log.error(error);
      console.error(error);
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ALL_LEVELS,
        ["Integrate ORCID iD"]
      );

      return;
    }

    // show a success message
    await Swal.fire({
      title: "ORCID iD integrated with Pennsieve",
      icon: "success",
      allowEscapeKey: true,
      allowOutsideClick: true,
      confirmButtonText: "Ok",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    // track success
    ipcRenderer.send(
      "track-event",
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW +
        " - Integrate ORCID iD",
      defaultBfDatasetId
    );

    // mark the orcid item green
    setPrepublishingChecklistItemIconByStatus(
      "prepublishing-checklist-icon-ORCID",
      true
    );
  });
});

// changes Pre-Publishing checklist elements found in the UI on the "Disseminate Datasets - Submit for pre-publishing review" section
// to green if a user completed that item and red if they did not.
// I:
//  inPrePublishing: boolean - True when the function is ran in the pre-publishing submission flow; false otherwise
const showPrePublishingStatus = async (inPrePublishing = false) => {
  if (defaultBfDataset === "Select dataset") {
    return;
  }

  // spinners that fit into the checklist icon slots until statuses have been verified for the items
  $(".icon-wrapper").attr("class", "ui mini active inline loader icon-wrapper");
  $(".icon-wrapper").children().css("visibility", "hidden");

  // run the validation checks on each pre-publishing checklist item
  let statuses;
  try {
    statuses = await getPrepublishingChecklistStatuses(defaultBfDataset);
  } catch (error) {
    if (inPrePublishing) {
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        confirmButtonText: "Ok",
        title: "Cannot get pre-publication checklist statuses",
        text: `Without the statuses you will not be able to publish your dataset. Please try again. `,
        icon: "error",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    }
    log.error(error);
    console.error(error);
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Fetch Pre-publishing Checklist Statuses"]
    );

    // set the status icons to red crosses
    Array.from(document.querySelectorAll(".icon-wrapper i")).forEach((icon) => {
      icon.classList.remove("check");
      icon.classList.add("cross");
      icon.style.color = "red";
    });

    return;
  }

  logGeneralOperationsForAnalytics(
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    AnalyticsGranularity.ACTION,
    ["Fetch Pre-publishing Checklist Statuses"]
  );

  // mark each pre-publishing item red or green to indicate if the item was completed
  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-subtitle",
    statuses.subtitle
  );

  setPrepublishingChecklistItemIconByStatus(
    "prepublishing-checklist-icon-readme",
    statuses.readme
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

// update a prepublishing checklist item by its Pennsieve value
// const updatePrepublishingChecklistIcon = async (getMetadataFunction, iconElementId) => {
//   let result;

//   try {
//     result = await getMetadataFunction(defaultBfDataset)
//   } catch(error) {
//     log.error(error)
//     console.error(error)
//     ipcRenderer.send("track-event", "Error", "Updating prepublishing checklist item", defaultBfDataset)
//   }

//   if(result.length <  1) {
//     setPrepublishingChecklistItemIconByStatus(iconElementId)
//   }
// }

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

// once the user clicks the Begin Submission button check if they are the data set owner'
// show the next section - which has the pre-publishing checklist - if so
const transitionToPrepublishingQuestionThree = async () => {
  // hide the begin publishing button
  $("#begin-prepublishing-btn").hide();

  // hide the excluded files container
  // because the Submit button transitions back to question three after showing this container
  // it needs to be hidden
  $("#excluded-files-container").hide();

  // check what the pre-publishing status is
  if (
    $("#para-review-dataset-info-disseminate").text() ===
    "Dataset is currently under review by your Publishing Team"
  ) {
    // show the withdraw button
    $("#prepublishing-withdraw-btn-container").show();
    $("#prepublishing-withdraw-btn-container button").show();
    $(".pre-publishing-continue-container").hide();
    $("#prepublishing-checklist-container").hide();

    return;
  }

  // show the pre-publishing checklist and the continue button
  $("#prepublishing-checklist-container").show();
  $(".pre-publishing-continue-container").show();
  $("#prepublishing-withdraw-btn-container").hide();
  $("#prepublishing-withdraw-btn-container button").hide();
};

// user clicks on the 'Continue' button and navigates to the file tree wherein they can decide which
// files will be excluded from the dataset upon publishing
const transitionToPrePublishingSubmit = async () => {
  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted()) {
    // alert the user they must complete all checklist items before beginning the prepublishing process
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot continue this pre-publication review submission",
      text: "You need to complete all pre-publishing checklist items before you can continue to the next step of the pre-publication review flow.",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // halt execution
    return false;
  }

  // hide the continue button
  $(".pre-publishing-continue-container").hide();

  // show the submit button
  $("#prepublishing-submit-btn-container").show();

  // show the excluded files section
  $("#excluded-files-container").show();

  return true;
};

// bold a metadata file once the user checks it
$("#items-pre-publication").on("click", function (evt) {
  let target = evt.target;

  if (target.nodeName && target.nodeName.toLowerCase() === "input") {
    // if target has a checked property and it is set to true
    if (target.checked) {
      // add a selected class to the label
      let label = target.nextSibling;
      label.classList.add("pre-publishing-file-viewer-file-selected");
    } else if (target.checked !== undefined && target.checked === false) {
      // remove the selected styling
      let label = target.nextSibling;
      label.classList.remove("pre-publishing-file-viewer-file-selected");
    }
  }
});

// transition to the final question and populate the file tree
$(".pre-publishing-continue").on("click", async function () {
  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted()) {
    // alert the user they must complete all checklist items before beginning the prepublishing process
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot continue this pre-publication review submission",
      text: "You need to complete all pre-publishing checklist items before you can continue to the next step of the pre-publication review flow.",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    return;
  }

  // transition to the final section
  transitionFreeFormMode(
    this,
    "submit_prepublishing_review-question-3",
    "submit_prepublishing_review-tab",
    "",
    "individual-question post-curation"
  );

  // reset the file viewer so no duplicates appear
  removeChildren(document.querySelector("#items-pre-publication"));

  // show a spinner on the file tree
  $(".items-spinner").show();

  let excludedFileObjects;
  try {
    // read in the excluded files
    // TODO: Replace with Flask call
    excludedFileObjects = await getFilesExcludedFromPublishing(
      defaultBfDataset
    );
  } catch (error) {
    // tell the user something went wrong getting access to their datasets ignored files
    await Swal.fire({
      title: "Failed to get information on any ignored files you may have",
      text: "If you have dataset files you already set to be ignored and would like to add more, please try publishing again later.",
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    // log the error information then continue execution -- this is because they may not want to ignore files when they publish
    log.error(error);
    console.error(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW +
        " - Get Excluded Files",
      defaultBfDatasetId
    );
  }

  ipcRenderer.send(
    "track-event",
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW +
      " - Get Excluded Files",
    defaultBfDatasetId
  );

  let metadataFiles;
  try {
    // read in all of the metadata files for the dataset
    // TODO: Replace with Flask call
    metadataFiles = await getDatasetMetadataFiles(defaultBfDataset);
  } catch (error) {
    // tell the user something went wrong getting access to their datasets ignored files
    await Swal.fire({
      title: "Failed to get your dataset's files",
      text: "If you would like to select files from your dataset to be ignored in the publishing process, please try again later.",
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    // log the error information then continue execution -- this is because they may not want to ignore files when they publish
    log.error(error);
    console.error(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW +
        " - Get Metadata Files",
      defaultBfDatasetId
    );
  }

  ipcRenderer.send(
    "track-event",
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW +
      " - Get Metadata Files",
    defaultBfDatasetId
  );

  // place the metadata files in the file viewer - found in step 3 of the pre-publishing submission worfklow
  populateFileViewer(
    metadataFiles,
    excludedFileObjects.map((fileObject) => fileObject.fileName)
  );

  // hide the spinner for the file tree
  $(".items-spinner").hide();
});

// check if the user is the dataset owner and transition to the prepublishing checklist question if so
$("#begin-prepublishing-btn").on("click", async function () {
  // check if the user is the dataset owner
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
  let owner;
  try {
    owner = await userIsDatasetOwner(defaultBfDataset);
  } catch (error) {
    // tell the user something went wrong getting access to their dataset permissions
    await Swal.fire({
      title: "Failed to determine if you are the dataset owner",
      text: `${error}`,
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    // log the error information then continue execution -- this is because they may not want to ignore files when they publish
    log.error(error);
    console.error(error);
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Determine User's Dataset Role"]
    );

    return;
  }

  logGeneralOperationsForAnalytics(
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    AnalyticsGranularity.ACTION,
    ["Determine User's Dataset Role"]
  );

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

  // transition to the next question
  transitionFreeFormMode(
    this,
    "submit_prepublishing_review-question-2",
    "submit_prepublishing_review-tab",
    "",
    "individual-question post-curation"
  );

  // load the next question's data
  await showPrePublishingStatus(true);
});

// Takes an array of file names and places the files inside of the file viewer found in step 3 of the pre-publicaiton submission process
const populateFileViewer = (metadataFiles, excludedFiles) => {
  // get the file viewer element
  let fileViewer = document.querySelector("#items-pre-publication");

  // // traverse the given files
  metadataFiles.forEach((file) => {
    // create a top level container
    let div = document.createElement("div");
    div.classList.add("pre-publishing-metadata-file-container");

    // create the checkbox
    let input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("name", `${file}`);
    input.classList.add("pre-publishing-metadata-file-input");
    // check if the user already has this file marked as ecluded
    if (excludedFiles.includes(file)) {
      input.checked = true;
    }

    // create the label
    let label = document.createElement("label");
    label.setAttribute("for", `${file}`);
    label.textContent = `${file}`;
    label.classList.add("pre-publishing-metadata-file-label");
    if (excludedFiles.includes(file)) {
      label.classList.add("pre-publishing-file-viewer-file-selected");
    }

    // add the input and label to the container
    div.appendChild(input);
    div.appendChild(label);

    // add the struture to the file viewer
    fileViewer.appendChild(div);
  });
};

// Check if there are excluded files in the excluded files list found in step 3 of the pre-publication submission workflow
const excludedFilesInPublicationFlow = () => {
  // get the checked UI elements in step 3 of the pre-publication submission flow
  let excludedFilesList = document.querySelectorAll(
    "#items-pre-publication input[type='checkbox']:checked"
  );

  //return true if the list has children and false otherwise
  return excludedFilesList.length >= 1 ? true : false;
};

// retrieves the file path and name from the list of excluded files found in step 3 of the pre-publication submission workflow
// Output:
//  [{fileName: string}]
const getExcludedFilesFromPublicationFlow = () => {
  // get the list items
  let excludedFilesListItems = document.querySelectorAll(
    "#items-pre-publication input[type='checkbox']:checked"
  );

  // iterate through each item
  let fileNames = Array.from(excludedFilesListItems).map((listItem) => {
    // get the Span element's text from the current list item
    let fileName = listItem.nextSibling.textContent;

    // return the filename in an object
    return { fileName };
  });

  // return the file names list
  return fileNames;
};

const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
