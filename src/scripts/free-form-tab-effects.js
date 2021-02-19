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
    bfCurrentDatasetStatusProgress.style.display = "none";
    datasetStatusStatus.innerHTML = "";
    removeOptions(bfListDatasetStatus);
    bfListDatasetStatus.style.color = "black";
  } else {
    datasetStatusStatus.innerHTML = "Please wait...";
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
          bfCurrentDatasetStatusProgress.style.display = "none";
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
          bfCurrentDatasetStatusProgress.style.display = "none";
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
    changeAirtableDiv("div-field-already-connected", "div-field-not-connected", "div-airtable-confirm-button", "div-airtable-award-button")
  } else {
    var airKeyInput = airKeyContent["api-key"];
    var airKeyName = airKeyContent["key-name"];
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
            log.error(err);
            console.log(err);
            return;
          } else {
            // create set to remove duplicates
            var awardSet = new Set(sparcAwards);
            var resultArray = [...awardSet];
            awardArrayTagify.settings.whitelist = resultArray;
            $("#current-airtable-account").text(airKeyName);
            changeAirtableDiv("div-field-not-connected", "div-field-already-connected", "div-airtable-award-button", "div-airtable-confirm-button")
          }
        }
      );
  }
}

checkAirtableStatus()

function changeAirtableDiv(divHide, divShow, buttonHide, buttonShow) {
  $("#"+divHide).hide();
  $("#"+buttonHide).hide();
  $("#"+divShow).show();
  $("#"+buttonShow).show();
}
