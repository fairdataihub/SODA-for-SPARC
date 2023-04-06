/*
******************************************************
******************************************************
Pre-publishing Submission Workflow Section 

Note: Some frontend elements of the workflow are in the renderer.js file as well. They are can be found under postCurationListChange() function.
      All backend requests can be found in the renderer.js file.
******************************************************
******************************************************
*/

// This function will be call after a dataset has been shared with the curation team
// Users will be able to reserve DOI's for their datasets
const reserveDOI = async () => {
  // reference: https://docs.pennsieve.io/reference/reservedoi
  // information: https://docs.pennsieve.io/docs/digital-object-identifiers-dois#assigning-doi-to-your-pennsieve-dataset
  let account = sodaJSONObj["bf-account-selected"]["account-name"];
  let dataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];

  console.log(account);
  console.log(dataset);

  // TODO: Create endpoint to reserve DOI
  try {
    let doiReserve = await client.post(`datasets/${dataset}/reserve-doi`);
    console.log(doiReserve);
    // Save DOI to SODAJSONObj
    sodaJSONObj["digital-metadata"]["dataset-doi"] = doiReserve.data.doi;
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
};

const getDatasetDOI = async (account, dataset) => {
  // reference: https://docs.pennsieve.io/reference/getdoi
  console.log(account);
  console.log(dataset);

  try {
    let doi = await client.get(`datasets/${dataset}/reserve-doi`);

    console.log(doi);
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
};

const disseminatePublish = async () => {
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
};

const refreshDatasetStatus = () => {
  var account = $("#current-bf-account").text();
  var dataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  disseminateShowPublishingStatus("", account, dataset);
};

const disseminateShowPublishingStatus = (callback, account, dataset) => {
  if (dataset !== "None") {
    if (callback == "noClear") {
      var nothing;
    } else {
      $("#para-submit_prepublishing_review-status").text("");
      showPublishingStatus("noClear");
    }
  }
  $("#submit_prepublishing_review-spinner").hide();
};

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

const disseminateCurationTeam = async (account, dataset, share_status = "") => {
  // TODO: Find out what team is needed to share with the curation team
  // Current method is currently not sharing with the curation team
  // Maybe the selectedTeam name was changed?
  var selectedTeam = "SPARC Data Curation Team";
  var selectedRole = "manager";

  $("#curation-team-share-btn").prop("disabled", true);
  $("#curation-team-unshare-btn").prop("disabled", true);

  if (share_status === "unshare") {
    selectedRole = "remove current permissions";
  }

  log.info(`Sharing dataset ${dataset} with ${selectedTeam} as ${selectedRole}`);

  try {
    await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: account,
          selected_dataset: dataset,
          scope: "team",
          name: selectedTeam,
        },
      }
    );

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
      await client.put(`/manage_datasets/bf_dataset_status`, {
        selected_bfaccount: account,
        selected_bfdataset: dataset,
        selected_status: selectedStatusOption,
      });

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
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

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
    let emessage = userErrorMessage(error);

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

const disseminateConsortium = async (bfAcct, bfDS, share_status = "") => {
  var selectedTeam = "SPARC Embargoed Data Sharing Group";
  var selectedRole = "viewer";

  $("#sparc-consortium-share-btn").prop("disabled", true);
  $("#sparc-consortium-unshare-btn").prop("disabled", true);

  if (share_status === "unshare") {
    selectedRole = "remove current permissions";
  }

  log.info(`Sharing dataset ${bfDS} with ${selectedTeam} as ${selectedRole}`);

  try {
    await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: bfAcct,
          selected_dataset: bfDS,
          scope: "team",
          name: selectedTeam,
        },
      }
    );

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
      selectedStatusOption = "10. Curated & Awaiting PI Approval (Curators)";
    }
    try {
      await client.put(`/manage_datasets/bf_dataset_status`, {
        selected_bfaccount: bfAcct,
        selected_bfdataset: bfDS,
        selected_status: selectedStatusOption,
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
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

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
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);

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
};

const disseminateShowCurrentPermission = async (bfAcct, bfDS) => {
  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  if (bfDS === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    return;
  }

  let permissions;
  try {
    permissions = await api.getDatasetPermissions(bfAcct, bfDS, false);
  } catch (error) {
    clientError(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      "Disseminate Datasets - Show current dataset permission",
      defaultBfDatasetId
    );
    return;
  }

  var permissionList = "";
  let datasetOwner = "";
  for (var i in permissions) {
    permissionList = permissionList + permissions[i] + "<br>";
    if (permissions[i].indexOf("owner") != -1) {
      let first_position = permissions[i].indexOf(":");
      let second_position = permissions[i].indexOf(",");
      datasetOwner = permissions[i].substring(first_position, second_position);
    }
  }

  currentDatasetPermission.innerHTML = datasetOwner;

  ipcRenderer.send(
    "track-event",
    "Success",
    "Disseminate Datasets - Show current dataset permission",
    defaultBfDatasetId
  );
};

const disseminiateShowCurrentDatasetStatus = async (callback, account, dataset) => {
  if (dataset === "Select dataset") {
    $(bfCurrentDatasetStatusProgress).css("visbility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");
    removeOptions(bfListDatasetStatus);
    bfListDatasetStatus.style.color = "black";
  } else {
    try {
      let statusOptionsResponse = await client.get(`/manage_datasets/bf_dataset_status`, {
        params: {
          selected_account: account,
          selected_dataset: dataset,
        },
      });

      let res = statusOptionsResponse.data;
      let { current_status } = statusOptionsResponse.data;

      ipcRenderer.send(
        "track-event",
        "Success",
        "Disseminate Datasets - Show current dataset status",
        defaultBfDatasetId
      );
      var myitemselect = [];
      removeOptions(bfListDatasetStatus);
      for (const item in res["status_options"]) {
        var option = document.createElement("option");
        option.textContent = res["status_options"][item]["displayName"];
        option.value = res["status_options"][item]["name"];
        option.style.color = res["status_options"][item]["color"];
        bfListDatasetStatus.appendChild(option);
      }
      bfListDatasetStatus.value = current_status;
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
};

const checkDatasetDisseminate = () => {
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
};
