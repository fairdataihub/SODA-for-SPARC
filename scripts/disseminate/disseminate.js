/*
******************************************************
******************************************************
Pre-publishing Submission Workflow Section 

Note: Some frontend elements of the workflow are in the renderer.js file as well. They are can be found under postCurationListChange() function.
      All backend requests can be found in the renderer.js file.
******************************************************
******************************************************
*/

// Helper functions
const disseminatePublish = async (curationMode) => {
  if (curationMode === "freeform") {
    $("#prepublishing-submit-btn").disabled = true;
    $("#prepublishing-submit-btn").addClass("loading");
  }

  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted(curationMode)) {
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

  // begin the dataset publishing flow
  try {
    let status = await showPublishingStatus(submitReviewDatasetCheck, curationMode);
    let embargoReleaseDate = status[1];
    $("#prepublishing-submit-btn").removeClass("loading");

    if (status[0] && curationMode === "freeform") {
      // submit the dataset for review with the given embargoReleaseDate
      await submitReviewDataset(embargoReleaseDate, curationMode);
      $("#prepublishing-submit-btn-container").hide();
      resetffmPrepublishingUI();
    }
  } catch (error) {
    log.error(error);
    console.error(error);
    Swal.fire({
      title: "Could not submit dataset for publication",
      text: `${userErrorMessage(error)}`,
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
  }
};

const refreshDatasetStatus = async (ev) => {
  let account = $("#current-bf-account").text();
  let dataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  if (dataset != "None") {
    $("#para-review-dataset-info-disseminate").text("None");
    $(`#${ev.id}`).addClass("fa-spin");
  }
  await disseminateShowPublishingStatus("", account, dataset);
  $(`#${ev.id}`).removeClass("fa-spin");
};

const disseminateShowPublishingStatus = async (callback, account, dataset) => {
  if (dataset !== "None") {
    if (callback == "noClear") {
      var nothing;
    } else {
      await showPublishingStatus("noClear");
    }
  }
  $("#submit_prepublishing_review-spinner").hide();
};

const disseminateShowCurrentPermission = async (bfAcct, bfDS) => {
  if (bfDS === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    return;
  }
  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;

  let permissions;
  try {
    permissions = await api.getDatasetPermissions(bfAcct, bfDS, false);
  } catch (error) {
    clientError(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      "Disseminate Datasets - Show current dataset permission",
      window.window.defaultBfDatasetId
    );
    return;
  }

  let permissionList = "";
  let datasetOwner = "";
  for (let permissionedAccount of permissions) {
    permissionList = permissionList + permissionedAccount + "<br>";
    if (permissionedAccount.includes("owner")) {
      let first_position = permissionedAccount.indexOf(":");
      let second_position = permissionedAccount.indexOf(",");
      datasetOwner = permissionedAccount.substring(first_position, second_position);
    }
  }

  currentDatasetPermission.innerHTML = datasetOwner;

  ipcRenderer.send(
    "track-event",
    "Success",
    "Disseminate Datasets - Show current dataset permission",
    window.window.defaultBfDatasetId
  );
};

// TODO -> Dorian check if this function is needed
// This function is used to show the current dataset status in freeform mode
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
        window.window.defaultBfDatasetId
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
        window.window.defaultBfDatasetId
      );
    }
  }
};

const checkDatasetDisseminate = () => {
  let datasetDissmeniateStatus = $(".bf-dataset-span.disseminate")
    .html()
    .replace(/^\s+|\s+$/g, "");
  if (
    datasetDissmeniateStatus !== "None" &&
    $("#Post-curation-question-1").hasClass("prev") &&
    !$("#Post-curation-question-4").hasClass("show")
  ) {
    $("#disseminate-dataset-confirm-button").click();
  }
};
