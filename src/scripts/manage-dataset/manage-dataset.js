var forbidden_characters_bf = '/:*?"<>';

const check_forbidden_characters_bf = (my_string) => {
  // Args:
  // my_string: string with characters (string)
  // Returns:
  // False: no forbidden character
  // True: presence of forbidden character(s)
  let check = false;

  for (let i = 0; i < forbidden_characters_bf.length; i++) {
    if (my_string.indexOf(forbidden_characters_bf[i]) > -1) {
      return true;
    }
  }

  return check;
};

const determineSwalLoadingMessage = (addEditButton) => {
  let loadingMessage = "";
  switch (addEditButton.text()) {
    case "Add subtitle":
      loadingMessage = "Adding subtitle to dataset";
      break;
    case "Edit subtitle":
      loadingMessage = "Editing your dataset's subtitle";
      break;
    case "Add description":
      loadingMessage = "Adding description to dataset";
      break;
    case "Edit description":
      loadingMessage = "Editing your dataset's description";
      break;
    case "Add tags":
      loadingMessage = "Adding tags to dataset";
      break;
    case "Edit tags":
      loadingMessage = "Editing your dataset's tags";
      break;
  }
  return loadingMessage;
};

const determineSwalSuccessMessage = (addEditButton) => {
  let successMessage = "";
  switch (addEditButton.text()) {
    case "Add subtitle":
      successMessage = "Successfully added subtitle to dataset";
      break;
    case "Edit subtitle":
      successMessage = "Successfully edited dataset's subtitle";
      break;
    case "Add description":
      successMessage = "Successfully added description to dataset";
      break;
    case "Edit description":
      successMessage = "Successfully edited dataset's description";
      break;
    case "Add tags":
      successMessage = "Successfully added tags to dataset";
      break;
    case "Edit tags":
      successMessage = "Successfully edited dataset's tags";
      break;
  }
  return successMessage;
};

// illegal character name warning for new dataset names
$("#bf-new-dataset-name").on("keyup", () => {
  let newName = $("#bf-new-dataset-name").val().trim();

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      Swal.fire({
        title:
          "A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>.",
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });

      $("#button-create-bf-new-dataset").hide();
    } else {
      $("#button-create-bf-new-dataset").show();
    }
  } else {
    $("#button-create-bf-new-dataset").hide();
  }
});

$("#bf-rename-dataset-name").on("keyup", () => {
  let newName = $("#bf-rename-dataset-name").val().trim();

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      Swal.fire({
        title:
          "A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>.",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
      });

      $("#button-rename-dataset").hide();
    } else {
      $("#button-rename-dataset").show();
    }
  } else {
    $("#button-rename-dataset").hide();
  }
});

// Add new dataset folder (empty) on bf //
$("#button-create-bf-new-dataset").click(() => {
  setTimeout(() => {
    let selectedbfaccount = defaultBfAccount;
    let bfNewDatasetName = $("#bf-new-dataset-name").val();

    log.info(`Creating a new dataset with the name: ${bfNewDatasetName}`);

    $("#button-create-bf-new-dataset").prop("disabled", true);

    Swal.fire({
      title: `Creating a new dataset named: ${bfNewDatasetName}`,
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

    client.invoke(
      "api_bf_new_dataset_folder",
      bfNewDatasetName,
      selectedbfaccount,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          let emessage = userError(error);

          Swal.fire({
            title: `Failed to create a new dataset.`,
            text: emessage,
            showCancelButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            icon: "error",
          });

          $("#button-create-bf-new-dataset").prop("disabled", false);

          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Create Empty Dataset",
            bfNewDatasetName
          );
        } else {
          Swal.fire({
            title: `Dataset ${bfNewDatasetName} was created successfully`,
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          });

          log.info(`Created dataset successfully`);

          $("#button-create-bf-new-dataset").hide();

          defaultBfDataset = bfNewDatasetName;
          refreshDatasetList();
          currentDatasetPermission.innerHTML = "";
          currentAddEditDatasetPermission.innerHTML = "";
          $("#button-create-bf-new-dataset").prop("disabled", false);

          addNewDatasetToList(bfNewDatasetName);
          ipcRenderer.send(
            "track-event",
            "Success",
            "Manage Dataset - Create Empty Dataset",
            bfNewDatasetName
          );

          log.info(`Requesting list of datasets`);

          client.invoke(
            "api_bf_dataset_account",
            defaultBfAccount,
            (error, result) => {
              if (error) {
                log.error(error);
                console.log(error);
              } else {
                log.info(`Requested list of datasets successfully`);
                datasetList = [];
                datasetList = result;
              }
            }
          );
          $(".bf-dataset-span").html(bfNewDatasetName);

          refreshDatasetList();
          updateDatasetList();

          $(".confirm-button").click();
          $("#bf-new-dataset-name").val("");
        }
      }
    );
  }, delayAnimation);
});

/// add new datasets to dataset List without calling Python to retrieve new list from Pennsieve
const addNewDatasetToList = (newDataset) => {
  datasetList.push({ name: newDataset, role: "owner" });
};

// Rename dataset on bf //
$("#button-rename-dataset").click(() => {
  setTimeout(function () {
    var selectedbfaccount = defaultBfAccount;
    var currentDatasetName = defaultBfDataset;
    var renamedDatasetName = $("#bf-rename-dataset-name").val();

    Swal.fire({
      title: `Renaming dataset ${currentDatasetName} to ${renamedDatasetName}`,
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

    log.info(
      `Requesting dataset name change from '${currentDatasetName}' to '${renamedDatasetName}'`
    );

    if (currentDatasetName === "Select dataset") {
      emessage = "Please select a valid dataset";
      Swal.fire({
        title: "Failed to rename dataset",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    } else {
      $("#button-rename-dataset").prop("disabled", true);

      client.invoke(
        "api_bf_rename_dataset",
        selectedbfaccount,
        currentDatasetName,
        renamedDatasetName,
        (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            var emessage = userError(error);
            Swal.fire({
              title: "Failed to rename dataset",
              text: emessage,
              icon: "error",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
            $("#button-rename-dataset").prop("disabled", false);

            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Rename Existing Dataset",
              currentDatasetName + " to " + renamedDatasetName
            );
          } else {
            log.info("Dataset rename success");
            defaultBfDataset = renamedDatasetName;
            $(".bf-dataset-span").html(renamedDatasetName);
            refreshDatasetList();
            $("#bf-rename-dataset-name").val(renamedDatasetName);
            Swal.fire({
              title: `Renamed dataset ${currentDatasetName} to ${renamedDatasetName}`,
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              didOpen: () => {
                Swal.hideLoading();
              },
            });
            $("#button-rename-dataset").prop("disabled", false);

            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Rename Existing Dataset",
              currentDatasetName + " to " + renamedDatasetName
            );
            log.info("Requesting list of datasets");
            client.invoke(
              "api_bf_dataset_account",
              defaultBfAccount,
              (error, result) => {
                if (error) {
                  log.error(error);
                  console.log(error);
                } else {
                  log.info("Request successful");
                  datasetList = [];
                  datasetList = result;
                  refreshDatasetList();
                }
              }
            );
          }
        }
      );
    }
  }, delayAnimation);
});

// Make PI owner //
$("#button-add-permission-pi").click(() => {
  Swal.fire({
    icon: "warning",
    text: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    heightAuto: false,
    showCancelButton: true,
    cancelButtonText: "No",
    focusCancel: true,
    confirmButtonText: "Yes",
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      log.info("Changing PI Owner of datset");

      Swal.fire({
        title: "Changing PI Owner of dataset",
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

      let selectedBfAccount = defaultBfAccount;
      let selectedBfDataset = defaultBfDataset;
      let selectedUser = $("#bf_list_users_pi").val();
      let selectedRole = "owner";

      client.invoke(
        "api_bf_add_permission",
        selectedBfAccount,
        selectedBfDataset,
        selectedUser,
        selectedRole,
        (error, res) => {
          if (error) {
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Change PI Owner",
              selectedBfDataset
            );

            log.error(error);
            console.error(error);
            let emessage = userError(error);

            Swal.fire({
              title: "Failed to change PI permission!",
              text: emessage,
              icon: "error",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          } else {
            log.info("Changed PI Owner of datset");

            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Change PI Owner",
              selectedBfDataset
            );

            let nodeStorage = new JSONStorage(app.getPath("userData"));
            nodeStorage.setItem("previously_selected_PI", selectedUser);

            showCurrentPermission();
            changeDatasetRolePI(selectedBfDataset);

            Swal.fire({
              title: "Successfully changed PI Owner of dataset",
              text: res,
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          }
        }
      );
    }
  });
});

/// change PI owner status to manager
const changeDatasetRolePI = (selectedDataset) => {
  for (var i = 0; i < datasetList.length; i++) {
    if (datasetList[i].name === selectedDataset) {
      datasetList[i].role = "manager";
    }
  }
};

const showCurrentPermission = () => {
  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  currentAddEditDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;

  if (selectedBfDataset === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    currentAddEditDatasetPermission.innerHTML = "None";
  } else {
    client.invoke(
      "api_bf_get_permission",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
        } else {
          let permissionList = "";
          let datasetOwner = "";

          for (let i in res) {
            permissionList = permissionList + res[i] + "<br>";

            if (res[i].indexOf("owner") != -1) {
              let first_position = res[i].indexOf(":");
              let second_position = res[i].indexOf(",");

              datasetOwner = res[i].substring(
                first_position + 2,
                second_position
              );
            }
          }

          currentDatasetPermission.innerHTML = datasetOwner;
          currentAddEditDatasetPermission.innerHTML = permissionList;

          curation_consortium_check();
        }
      }
    );
  }
};

const addPermissionUser = (
  selectedBfAccount,
  selectedBfDataset,
  selectedUser,
  selectedRole
) => {
  client.invoke(
    "api_bf_add_permission",
    selectedBfAccount,
    selectedBfDataset,
    selectedUser,
    selectedRole,
    (error, res) => {
      if (error) {
        log.error(error);
        console.error(error);
        let emessage = userError(error);

        Swal.fire({
          title: "Failed to change permission!",
          text: emessage,
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        log.info("Dataset permission added");

        Swal.fire({
          title: "Successfully changed permission!",
          text: res,
          icon: "success",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        showCurrentPermission();

        // refresh dataset lists with filter
        client.invoke("api_get_username", selectedBfAccount, (error, res1) => {
          if (error) {
            log.error(error);
            console.error(error);
          } else {
            if (selectedRole === "owner") {
              for (var i = 0; i < datasetList.length; i++) {
                if (datasetList[i].name === selectedBfDataset) {
                  datasetList[i].role = "manager";
                }
              }
            }

            if (selectedUser === res1) {
              // then change role of dataset and refresh dataset list
              for (var i = 0; i < datasetList.length; i++) {
                if (datasetList[i].name === selectedBfDataset) {
                  datasetList[i].role = selectedRole.toLowerCase();
                }
              }
            }
          }
        });
      }
    }
  );
};

// Add permission for user //
$("#button-add-permission-user").click(() => {
  setTimeout(() => {
    log.info("Adding a permission for a user on a dataset");

    Swal.fire({
      title: `Adding a permission for your selected user`,
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

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let selectedUser = $("#bf_list_users").val();
    let selectedRole = $("#bf_list_roles_user").val();

    addPermissionUser(
      selectedBfAccount,
      selectedBfDataset,
      selectedUser,
      selectedRole
    );
  }, delayAnimation);
});

// Add permission for team
$("#button-add-permission-team").click(() => {
  setTimeout(() => {
    log.info("Adding a permission for a team on a dataset");

    Swal.fire({
      title: `Adding a permission for your selected team`,
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

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let selectedTeam = $("#bf_list_teams").val();
    let selectedRole = $("#bf_list_roles_team").val();

    client.invoke(
      "api_bf_add_permission_team",
      selectedBfAccount,
      selectedBfDataset,
      selectedTeam,
      selectedRole,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          let emessage = userError(error);

          Swal.fire({
            title: "Failed to change permission",
            text: emessage,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
        } else {
          log.info("Added permission for the team");

          Swal.fire({
            title: "Successfully changed permission",
            text: res,
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          showCurrentPermission();
        }
      }
    );
  }, delayAnimation);
});

// Character count for subtitle //
function countCharacters(textelement, pelement) {
  var textEntered = textelement.value;
  var counter = 255 - textEntered.length;
  pelement.innerHTML = counter + " characters remaining";
  return textEntered.length;
}

$(document).ready(() => {
  bfDatasetSubtitle.addEventListener("keyup", function () {
    countCharacters(bfDatasetSubtitle, bfDatasetSubtitleCharCount);
  });
});

// Add subtitle //
$("#button-add-subtitle").click(() => {
  setTimeout(function () {
    Swal.fire({
      title: determineSwalLoadingMessage($("#button-add-subtitle")),
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

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let inputSubtitle = $("#bf-dataset-subtitle").val();

    log.info("Adding subtitle to dataset");
    log.info(inputSubtitle);

    client.invoke(
      "api_bf_add_subtitle",
      selectedBfAccount,
      selectedBfDataset,
      inputSubtitle,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          let emessage = userError(error);

          Swal.fire({
            title: "Failed to add subtitle!",
            text: emessage,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          $("#ds-description").val("");

          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Add/Edit Subtitle",
            defaultBfDataset
          );
        } else {
          log.info("Added subtitle to dataset");

          $("#ds-description").val(inputSubtitle);

          Swal.fire({
            title: determineSwalSuccessMessage($("#button-add-subtitle")),
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          }).then(
            //check if subtitle text is empty and set Add/Edit button appropriately
            !$("#bf-dataset-subtitle").val()
              ? $("#button-add-subtitle").html("Add subtitle")
              : $("#button-add-subtitle").html("Edit subtitle")
          );

          ipcRenderer.send(
            "track-event",
            "Success",
            "Manage Dataset - Add/Edit Subtitle",
            defaultBfDataset
          );
        }
      }
    );
  }, delayAnimation);
});

const showCurrentSubtitle = () => {
  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $("#bf-dataset-subtitle").val("");
  } else {
    document.getElementById("ds-description").innerHTML = "Loading...";
    document.getElementById("ds-description").disabled = true;
    client.invoke(
      "api_bf_get_subtitle",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          $("#ds-description").val("");
        } else {
          $("#bf-dataset-subtitle").val(res);
          $("#ds-description").val(res);
          let result = countCharacters(
            bfDatasetSubtitle,
            bfDatasetSubtitleCharCount
          );
          if (result === 0) {
            $("#button-add-subtitle > .btn_animated-inside").html(
              "Add subtitle"
            );
          } else {
            $("#button-add-subtitle > .btn_animated-inside").html(
              "Edit subtitle"
            );
          }
        }
      }
    );
    document.getElementById("ds-description").disabled = false;
  }
};

// Add description //

const requiredSections = {
  studyPurpose: "study purpose",
  dataCollection: "data collection",
  primaryConclusion: "primary conclusion",
  invalidText: "invalid text",
};

// open the first section of the accordion for first time user navigation to the section
let dsAccordion = $("#dd-accordion").accordion();
dsAccordion.accordion("open", 0);

// fires whenever a user selects a dataset, from any card
const showCurrentDescription = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    return;
  }

  // check if the warning message for invalid text is showing on the page
  let warningDisplayProperty = $("#ds-isa-warning").css("display");
  if (warningDisplayProperty === "flex") {
    // hide the warning message to prevent the user from seeing the warning for a new dataset
    $("#ds-isa-warning").css("display", "none");
  }

  // get the dataset readme
  let readme;
  try {
    readme = await getDatasetReadme(selectedBfDataset);
  } catch (error) {
    log.error(error);
    console.error(error);

    ipcRenderer.send(
      "track-event",
      "Error",
      "Manage Dataset - Add/Edit Description",
      selectedBfDataset
    );
    return;
  }

  // create the parsed dataset read me object
  let parsedReadme;
  try {
    parsedReadme = createParsedReadme(readme);
  } catch (error) {
    // log the error and send it to analytics
    log.error(error);
    console.error(error);

    ipcRenderer.send(
      "track-event",
      "Error",
      "Manage Dataset - Add/Edit Description",
      selectedBfDataset
    );
    return;
  }
  // check if any of the fields have data
  if (
    parsedReadme[requiredSections.studyPurpose] ||
    parsedReadme[requiredSections.dataCollection] ||
    parsedReadme[requiredSections.primaryConclusion]
  ) {
    //if so make the button say edit description
    $("#button-add-description > .btn_animated-inside").html(
      "Edit description"
    );
  } else {
    //make the button say add description
    $("#button-add-description > .btn_animated-inside").html("Add description");
  }

  // remove any text that was already in the section
  $("#ds-description-study-purpose").val("");
  $("#ds-description-data-collection").val("");
  $("#ds-description-primary-conclusion").val("");

  // place the text into the text area for that field
  $("#ds-description-study-purpose").val(
    parsedReadme[requiredSections.studyPurpose].replace(/\r?\n|\r/g, "")
  );

  // place the text into the text area for that field
  $("#ds-description-data-collection").val(
    parsedReadme[requiredSections.dataCollection].replace(/\r?\n|\r/g, "")
  );

  // place the text into the text area for that field
  $("#ds-description-primary-conclusion").val(
    parsedReadme[requiredSections.primaryConclusion].replace(/\r?\n|\r/g, "")
  );

  // check if there is any invalid text remaining
  if (parsedReadme[requiredSections.invalidText]) {
    // show the UI warning message
    // that informs the user their invalid data has been added to
    // the first section so they can place it in the correct section
    $("#ds-isa-warning").css("display", "flex");

    // make the study purpose section visible instead of whatever section the user has open
    // this ensures when they come back to the description after loading a dataset in a different card
    // that the warning is visible
    $("#dd-accordion").accordion("open", 0);

    // if so add it to the first section
    $("#ds-description-study-purpose").val(
      parsedReadme[requiredSections.studyPurpose].replace(/\r?\n|\r/g, "") +
        parsedReadme[requiredSections.invalidText].replace(/\r?\n|\r/g, "")
    );
  }
};

$("#button-add-description").click(() => {
  setTimeout(() => {
    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;

    // get the text from the three boxes and store them in their own variables
    let requiredFields = [];

    // read and sanatize the input for spaces and reintroduced bolded keywords
    let studyPurpose = $("#ds-description-study-purpose").val().trim();
    studyPurpose.replace("**Study Purpose:**", "");
    if (studyPurpose.length) {
      requiredFields.push("**Study Purpose:** " + studyPurpose + "\n");
    }

    let dataCollection = $("#ds-description-data-collection").val().trim();
    dataCollection.replace("**Data Collection:**", "");
    if (dataCollection.length) {
      requiredFields.push("**Data Collection:** " + dataCollection + "\n");
    }
    let primaryConclusion = $("#ds-description-primary-conclusion")
      .val()
      .trim();
    primaryConclusion.replace("**Primary Conclusion:**", "");
    if (primaryConclusion.length) {
      requiredFields.push(
        "**Primary Conclusion:** " + primaryConclusion + "\n"
      );
    }
    // validate the new markdown description the user created
    let response = validateDescription(requiredFields.join(""));

    if (!response) {
      Swal.fire({
        icon: "warning",
        title: "This description does not follow SPARC guidelines.",
        html: `
        Your description should include all of the mandatory sections. Additionally, each section should be no longer than one paragraph.
        <br> 
        <br>
        Are you sure you want to continue?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Continue",
        cancelButtonText: "No, I want to edit my description",
        reverseButtons: true,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        // hide the warning message if it exists
        $("#ds-isa-warning").css("display", "none");
        addDescription(selectedBfDataset, requiredFields.join("\n"));
      });
    } else {
      // hide the warning message if it exists
      $("#ds-isa-warning").css("display", "none");
      // add the user's description to Pennsieve
      addDescription(selectedBfDataset, requiredFields.join("\n"));
    }
  }, delayAnimation);
});

// closes the warning message that appears when a user has invalid text
$("#ds-close-btn").click(() => {
  $("#ds-isa-warning").css("display", "none");
});

// I: user_markdown_input: A string that holds the user's markdown text.
// Merges user readme file changes with the original readme file.
const addDescription = async (selectedBfDataset, userMarkdownInput) => {
  // get the dataset readme
  let readme;
  try {
    Swal.fire({
      title: determineSwalLoadingMessage($("#button-add-description")),
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
    readme = await getDatasetReadme(selectedBfDataset);
  } catch (err) {
    log.error(err);
    console.error(err);
    let emessage = userError(err);

    Swal.fire({
      title: "Failed to get description!",
      text: emessage,
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    ipcRenderer.send(
      "track-event",
      "Error",
      "Manage Dataset - Add/Edit Description",
      selectedBfDataset
    );
    return;
  }

  // strip out the required sections (don't check for errors here because we check for them in showCurrentDescription for the same functions and the same readme)
  readme = stripRequiredSectionFromReadme(
    readme,
    requiredSections.studyPurpose
  );

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  readme = stripRequiredSectionFromReadme(
    readme,
    requiredSections.dataCollection
  );

  // search for the "Primary Conclusion" and basic variations of spacing
  readme = stripRequiredSectionFromReadme(
    readme,
    requiredSections.primaryConclusion
  );

  // remove any invalid text
  readme = stripInvalidTextFromReadme(readme);

  // join the user_markdown_input with untouched sections of the original readme
  // because markdown on the Pennsieve side is strange add two spaces so the curator's notes section does not bold the section directly above it
  let completeReadme = userMarkdownInput + "\n" + "\n" + readme;

  // update the readme file
  try {
    await updateDatasetReadme(selectedBfDataset, completeReadme);
  } catch (error) {
    log.error(error);
    console.error(error);
    let emessage = userError(error);

    Swal.fire({
      title: "Failed to add description!",
      text: emessage,
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    ipcRenderer.send(
      "track-event",
      "Error",
      "Manage Dataset - Add/Edit Description",
      selectedBfDataset
    );
    return;
  }

  // alert the user the data was uploaded successfully
  Swal.fire({
    title: determineSwalSuccessMessage($("#button-add-description")),
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then(
    //check if subtitle text is empty and set Add/Edit button appropriately
    !$("#ds-description-study-purpose").val() &&
      !$("#ds-description-data-collection").val() &&
      !$("#ds-description-primary-conclusion").val()
      ? $("#button-add-description").html("Add description")
      : $("#button-add-description").html("Edit description")
  );

  // alert analytics
  ipcRenderer.send(
    "track-event",
    "Success",
    "Manage Dataset - Add/Edit Description",
    selectedBfDataset
  );
};

// searches the markdown for key sections and returns them as an easily digestible object
// returns: {Study Purpose: text/markdown | "", Data Collection: text/markdown | "", Primary Conclusion: text/markdown | "", invalidText: text/markdown | ""}
const createParsedReadme = (readme) => {
  // read in the readme file and store it in a variable ( it is in markdown )
  let mutableReadme = readme;

  // create the return object
  const parsedReadme = {
    "study purpose": "",
    "data collection": "",
    "primary conclusion": "",
    "invalid text": "",
  };

  // remove the "Study Purpose" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(
    mutableReadme,
    "study purpose",
    parsedReadme
  );

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(
    mutableReadme,
    "data collection",
    parsedReadme
  );

  // search for the "Primary Conclusion" and basic variations of spacing
  mutableReadme = stripRequiredSectionFromReadme(
    mutableReadme,
    "primary conclusion",
    parsedReadme
  );

  // remove the invalid text from the readme contents
  mutableReadme = stripInvalidTextFromReadme(mutableReadme, parsedReadme);

  // return the parsed readme
  return parsedReadme;
};

// strips the required section starting with the given section name from a copy of the given readme string. Returns the mutated string. If given a parsed readme object
// it will also place the section text in that object.
// Inputs:
//      readme: A string with the users dataset description
//      sectionName: The name of the section the user wants to strip from the readme
//      parsedReadme: Optional object that gets the stripped section text if provided
const stripRequiredSectionFromReadme = (
  readme,
  sectionName,
  parsedReadme = undefined
) => {
  // lowercase the readme file text to avoid casing issues with pattern matching
  let mutableReadme = readme.trim().toLowerCase();

  // serch for the start of the given section -- it can have one or more whitespace between the colon
  let searchRegExp = new RegExp(`[*][*]${sectionName}[ ]*:[*][*]`);
  let altSearchRegExp = new RegExp(`[*][*]${sectionName}[*][*][ ]*:`);
  let sectionIdx = mutableReadme.search(searchRegExp);
  if (sectionIdx === -1) {
    sectionIdx = mutableReadme.search(altSearchRegExp);
  }
  // if the section is not found return the readme unchanged
  if (sectionIdx === -1) {
    return mutableReadme;
  }

  // remove the section title text
  mutableReadme = mutableReadme.replace(searchRegExp, "");
  mutableReadme = mutableReadme.replace(altSearchRegExp, "");
  // search for the end of the removed section's text
  let endOfSectionIdx;
  // curator's section is designated by three hyphens in a row
  let curatorsSectionIdx = mutableReadme.search("---");

  for (
    endOfSectionIdx = sectionIdx;
    endOfSectionIdx < mutableReadme.length;
    endOfSectionIdx++
  ) {
    // check if we found the start of a new section
    if (
      mutableReadme[endOfSectionIdx] === "*" ||
      endOfSectionIdx === curatorsSectionIdx
    ) {
      // if so stop
      break;
    }
  }

  // store the value of the given section in the parsed readme if one was provided
  if (parsedReadme) {
    parsedReadme[`${sectionName}`] = mutableReadme.slice(
      sectionIdx,
      endOfSectionIdx >= mutableReadme.length ? undefined : endOfSectionIdx
    );
  }

  // strip the section text from the readme
  mutableReadme =
    mutableReadme.slice(0, sectionIdx) + mutableReadme.slice(endOfSectionIdx);

  return mutableReadme;
};

// find invalid text and strip it from a copy of the given readme string. returns the mutated readme.
// Text is invalid in these scenarios:
//   1. any text that occurs before an auxillary section is invalid text because we cannot assume it belongs to one of the auxillary sections below
//   2. any text in a string where there are no sections
const stripInvalidTextFromReadme = (readme, parsedReadme = undefined) => {
  // ensure the required sections have been taken out
  if (
    readme.search(`[*][*]${requiredSections.studyPurpose}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.studyPurpose}[*][*][ ]*:`) !== -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[ ]*:[*][*]`) !==
      -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[*][*][ ]*:`) !==
      -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[ ]*:[*][*]`) !==
      -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[*][*][ ]*:`) !==
      -1
  ) {
    throw new Error("There was a problem with reading your description file.");
  }

  // search for the first occurring auxillary section -- this is a user defined section
  let auxillarySectionIdx = readme.search("[*][*].*[ ]*:[*][*]");

  // check if there was an auxillary section found that has a colon before the markdown ends
  if (auxillarySectionIdx !== -1) {
    let auxillarySectionIdxAltFormat = readme.search("[*][*].*[ ]*[*][*][ ]*:");
    // check if there is an auxillary section that comes before the current section that uses alternative common syntax
    if (
      auxillarySectionIdxAltFormat !== -1 &&
      auxillarySectionIdx > auxillarySectionIdxAltFormat
    )
      auxillarySectionIdx = auxillarySectionIdxAltFormat;
  } else {
    // no auxillary section could be found using the colon before the closing markdown sytnatx so try the alternative common syntax
    auxillarySectionIdx = readme.search("[*][*].*[ ]*[*][*][ ]*:");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    let curatorsSectionIdx = readme.search("(---)");
    // check if the curator's section appears before the auxillary section that was found
    if (curatorsSectionIdx !== -1 && auxillarySectionIdx > curatorsSectionIdx)
      auxillarySectionIdx = curatorsSectionIdx;
  } else {
    // set the auxillary section idx to the start of the curator's section idx
    auxillarySectionIdx = readme.search("(---)");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    // get the text that comes before the auxillary seciton idx
    let invalidText = readme.slice(0, auxillarySectionIdx);

    // if there is no invalid text then parsing is done
    if (!invalidText.length) return readme;

    // check if the user wants to store the invalid text in a parsed readme
    if (parsedReadme) {
      // place the invalid text into the parsed readme
      parsedReadme[requiredSections.invalidText] = invalidText;
    }

    // remove the text from the readme
    readme = readme.slice(auxillarySectionIdx);

    // return the readme file
    return readme;
  } else {
    // there are no auxillary sections so the rest of the string is invalid text -- if there is any string left
    if (parsedReadme) {
      parsedReadme[requiredSections.invalidText] = readme;
    }

    // remove the text from the readme === return an empty string
    return "";
  }
};

const validateDescription = () => {
  let studyPurpose = $("#ds-description-study-purpose").val().trim();
  let dataCollection = $("#ds-description-data-collection").val().trim();
  let primaryConclusion = $("#ds-description-primary-conclusion").val().trim();

  if (
    !studyPurpose.length ||
    !dataCollection.length ||
    !primaryConclusion.length
  ) {
    return false;
  }

  function hasLineBreak(sectionText) {
    if (
      sectionText.indexOf("\n") !== -1 ||
      sectionText.indexOf("\r") !== -1 ||
      sectionText.indexOf("\r\n") !== -1
    ) {
      return true;
    }

    return false;
  }

  // if one of the sections has a line break it is invalid by SPARC Guidelines
  return (
    !hasLineBreak(studyPurpose) &&
    !hasLineBreak(dataCollection) &&
    !hasLineBreak(primaryConclusion)
  );
};

const changeDatasetUnderDD = () => {
  datasetDescriptionFileDataset.value = defaultBfDataset;
  showDatasetDescription();
};

///// grab dataset name and auto-load current description
const showDatasetDescription = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $("#ds-description").html("");

    setTimeout(() => {
      document.getElementById("description_header_label").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 5);
  } else {
    client.invoke(
      "api_bf_get_subtitle",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
        } else {
          $("#ds-description").html(res);

          setTimeout(() => {
            document.getElementById("description_header_label").scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 5);
        }
      }
    );

    $("#ds-description").prop("disabled", false);
  }
};

const getBase64 = async (url) => {
  const axios = require("axios");
  return axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) =>
      Buffer.from(response.data, "binary").toString("base64")
    );
};

// function for importing a banner image if one already exists
$("#edit_banner_image_button").click(async () => {
  $("#edit_banner_image_modal").modal("show");
  if ($("#para-current-banner-img").text() === "None") {
    //Do nothing... regular import
  } else {
    let img_src = $("#current-banner-img").attr("src");
    let img_base64 = await getBase64(img_src); // encode image to base64

    $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
    $("#save-banner-image").css("visibility", "visible");
    $("#div-img-container-holder").css("display", "none");
    $("#div-img-container").css("display", "block");
    $("#para-path-image").html("path");

    // Look for the security token in the URL. If this this doesn't exist, something went wrong with the aws bucket link.
    let position = img_src.search("X-Amz-Security-Token");

    if (position != -1) {
      // The image url will be before the security token
      let new_img_src = img_src.substring(0, position - 1);
      let new_position = new_img_src.lastIndexOf("."); //

      if (new_position != -1) {
        imageExtension = new_img_src.substring(new_position + 1);

        if (imageExtension.toLowerCase() == "png") {
          $("#image-banner").attr("src", "data:image/png;base64," + img_base64);
        } else if (imageExtension.toLowerCase() == "jpeg") {
          $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
        } else if (imageExtension.toLowerCase() == "jpg") {
          $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
        } else {
          log.error(`An error happened: ${img_src}`);
          console.log(`An error happened: ${img_src}`);
          Swal.fire({
            icon: "error",
            text: "An error occurred when importing the image. Please try again later.",
            showConfirmButton: "OK",
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
          });

          ipcRenderer.send(
            "track-event",
            "Error",
            "Importing Pennsieve Image",
            img_src
          );

          return;
        }
      } else {
        log.error(`An error happened: ${img_src}`);
        console.log(`An error happened: ${img_src}`);

        Swal.fire({
          icon: "error",
          text: "An error occurred when importing the image. Please try again later.",
          showConfirmButton: "OK",
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
        });

        ipcRenderer.send(
          "track-event",
          "Error",
          "Importing Pennsieve Image",
          img_src
        );

        return;
      }
    } else {
      log.error(`An error happened: ${img_src}`);
      console.log(`An error happened: ${img_src}`);

      Swal.fire({
        icon: "error",
        text: "An error occurred when importing the image. Please try again later.",
        showConfirmButton: "OK",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });

      ipcRenderer.send(
        "track-event",
        "Error",
        "Importing Pennsieve Image",
        img_src
      );

      return;
    }

    myCropper.destroy();
    myCropper = new Cropper(
      document.getElementById("image-banner"),
      cropOptions
    );
  }
});

// Action when user click on "Import image" button for banner image
$("#button-import-banner-image").click(() => {
  $("#para-dataset-banner-image-status").html("");
  ipcRenderer.send("open-file-dialog-import-banner-image");
});

const uploadBannerImage = () => {
  $("#para-dataset-banner-image-status").html("Please wait...");
  //Save cropped image locally and check size
  let imageFolder = path.join(homeDirectory, "SODA", "banner-image");
  let imageType = "";

  if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder, { recursive: true });
  }

  if (imageExtension == "png") {
    imageType = "image/png";
  } else {
    imageType = "image/jpeg";
  }

  let imagePath = path.join(imageFolder, "banner-image-SODA." + imageExtension);
  let croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);

  imageDataURI.outputFile(croppedImageDataURI, imagePath).then(() => {
    let image_file_size = fs.statSync(imagePath)["size"];

    if (image_file_size < 5 * 1024 * 1024) {
      let selectedBfAccount = defaultBfAccount;
      let selectedBfDataset = defaultBfDataset;

      client.invoke(
        "api_bf_add_banner_image",
        selectedBfAccount,
        selectedBfDataset,
        imagePath,
        (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            let emessage = userError(error);

            $("#para-dataset-banner-image-status").html(
              "<span style='color: red;'> " + emessage + "</span>"
            );

            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Upload Banner Image",
              selectedBfDataset,
              image_file_size
            );
          } else {
            $("#para-dataset-banner-image-status").html(res);

            showCurrentBannerImage();

            $("#edit_banner_image_modal").modal("hide");

            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Upload Banner Image",
              selectedBfDataset,
              image_file_size
            );
          }
        }
      );
    } else {
      $("#para-dataset-banner-image-status").html(
        "<span style='color: red;'> " +
          "Final image size must be less than 5 MB" +
          "</span>"
      );
    }
  });
};

$("#save-banner-image").click((event) => {
  $("#para-dataset-banner-image-status").html("");
  if (bfViewImportedImage.src.length > 0) {
    if (formBannerHeight.value > 511) {
      Swal.fire({
        icon: "warning",
        text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
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
      }).then((result) => {
        if (formBannerHeight.value < 1024) {
          Swal.fire({
            icon: "warning",
            text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${formBannerHeight.value} px. Would you like to continue?`,
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
          }).then((result) => {
            if (result.isConfirmed) {
              uploadBannerImage();
            }
          });
        } else {
          uploadBannerImage();
        }
      });
    } else {
      $("#para-dataset-banner-image-status").html(
        "<span style='color: red;'> " +
          "Dimensions of cropped area must be at least 512 px" +
          "</span>"
      );
    }
  } else {
    $("#para-dataset-banner-image-status").html(
      "<span style='color: red;'> " + "Please import an image first" + "</span>"
    );
  }
});

$(document).ready(() => {
  ipcRenderer.on("selected-banner-image", async (event, path) => {
    if (path.length > 0) {
      let original_image_path = path[0];
      let image_path = original_image_path;
      let destination_image_path = require("path").join(
        homeDirectory,
        "SODA",
        "banner-image-conversion"
      );
      let converted_image_file = require("path").join(
        destination_image_path,
        "converted-tiff.jpg"
      );
      let conversion_success = true;
      imageExtension = path[0].split(".").pop();

      if (imageExtension.toLowerCase() == "tiff") {
        $("body").addClass("waiting");
        Swal.fire({
          title: "Image conversion in progress!",
          html: "Pennsieve does not support .tiff banner images. Please wait while SODA converts your image to the appropriate format required.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await Jimp.read(original_image_path)
          .then(async (file) => {
            console.log("starting tiff conversion");
            if (!fs.existsSync(destination_image_path)) {
              fs.mkdirSync(destination_image_path);
            }

            try {
              if (fs.existsSync(converted_image_file)) {
                fs.unlinkSync(converted_image_file);
              }
            } catch (err) {
              conversion_success = false;
              console.error(err);
            }

            return file.write(converted_image_file, async () => {
              if (fs.existsSync(converted_image_file)) {
                let stats = fs.statSync(converted_image_file);
                let fileSizeInBytes = stats.size;
                let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                if (fileSizeInMegabytes > 5) {
                  console.log("File size too large. Resizing image");

                  fs.unlinkSync(converted_image_file);

                  await Jimp.read(original_image_path)
                    .then((file) => {
                      return file
                        .resize(1024, 1024)
                        .write(converted_image_file, () => {
                          document.getElementById(
                            "div-img-container-holder"
                          ).style.display = "none";
                          document.getElementById(
                            "div-img-container"
                          ).style.display = "block";

                          $("#para-path-image").html(image_path);
                          bfViewImportedImage.src = converted_image_file;
                          myCropper.destroy();
                          myCropper = new Cropper(
                            bfViewImportedImage,
                            cropOptions
                          );
                          $("#save-banner-image").css("visibility", "visible");
                          $("body").removeClass("waiting");
                        });
                    })
                    .catch((err) => {
                      conversion_success = false;
                      console.error(err);
                    });
                  if (fs.existsSync(converted_image_file)) {
                    let stats = fs.statSync(converted_image_file);
                    let fileSizeInBytes = stats.size;
                    let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                    if (fileSizeInMegabytes > 5) {
                      console.log("File size is too big", fileSizeInMegabytes);
                      conversion_success = false;
                      // SHOW ERROR
                    }
                  }
                }
                console.log("file conversion complete");
                image_path = converted_image_file;
                imageExtension = "jpg";
                $("#para-path-image").html(image_path);
                bfViewImportedImage.src = image_path;
                myCropper.destroy();
                myCropper = new Cropper(bfViewImportedImage, cropOptions);
                $("#save-banner-image").css("visibility", "visible");
              }
            });
          })
          .catch((err) => {
            conversion_success = false;
            console.error(err);
            Swal.fire({
              icon: "error",
              text: "Something went wrong",
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          });
        if (conversion_success == false) {
          $("body").removeClass("waiting");
          return;
        } else {
          Swal.close();
        }
      } else {
        document.getElementById("div-img-container-holder").style.display =
          "none";
        document.getElementById("div-img-container").style.display = "block";

        $("#para-path-image").html(image_path);
        bfViewImportedImage.src = image_path;
        myCropper.destroy();
        myCropper = new Cropper(bfViewImportedImage, cropOptions);

        $("#save-banner-image").css("visibility", "visible");
      }
    } else {
      if ($("#para-current-banner-img").text() === "None") {
        $("#save-banner-image").css("visibility", "hidden");
      } else {
        $("#save-banner-image").css("visibility", "visible");
      }
    }
  });

  ipcRenderer.on("show-banner-image-below-1024", (event, index) => {
    if (index === 0) {
      uploadBannerImage();
    }
  });
});

const showCurrentBannerImage = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $("#banner_image_loader").hide();

    bfCurrentBannerImg.src = "";
    document.getElementById("para-current-banner-img").innerHTML = "None";
    bfViewImportedImage.src = "";

    $("#div-img-container-holder").css("display", "block");
    $("#div-img-container").css("display", "none");
    $("#save-banner-image").css("visibility", "hidden");

    myCropper.destroy();
  } else {
    $("#banner_image_loader").show();

    document.getElementById("para-current-banner-img").innerHTML = "";

    client.invoke(
      "api_bf_get_banner_image",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);

          $("#banner_image_loader").hide();

          bfCurrentBannerImg.src = "assets/img/no-banner-image.png";
          document.getElementById("para-current-banner-img").innerHTML = "None";
          bfViewImportedImage.src = "";

          $("#div-img-container-holder").css("display", "block");
          $("#div-img-container").css("display", "none");
          $("#save-banner-image").css("visibility", "hidden");

          myCropper.destroy();
        } else {
          if (res === "No banner image") {
            bfCurrentBannerImg.src = "";
            document.getElementById("para-current-banner-img").innerHTML =
              "None";
            bfViewImportedImage.src = "";

            $("#div-img-container-holder").css("display", "block");
            $("#div-img-container").css("display", "none");
            $("#save-banner-image").css("visibility", "hidden");

            myCropper.destroy();
          } else {
            document.getElementById("para-current-banner-img").innerHTML = "";
            bfCurrentBannerImg.src = res;
          }
          $("#banner_image_loader").hide();
        }
      }
    );
  }
};

// Add tags //

// add or edit metadata tags for a user's selected dataset in the "add/edit tags" section of the manage-dataset menu
$("#button-add-tags").click(async () => {
  Swal.fire({
    title: determineSwalLoadingMessage($("#button-add-tags")),
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
  }).then((result) => {});

  // get the current tags from the input inside of the manage_datasets.html file inside of the tags section
  const tags = Array.from(datasetTagsTagify.getTagElms()).map((tag) => {
    return tag.textContent;
  });

  // get the name of the currently selected dataset
  var selectedBfDataset = defaultBfDataset;

  // Add tags to dataset
  try {
    await update_dataset_tags(selectedBfDataset, tags);
  } catch (e) {
    // log the error
    log.error(e);
    console.error(e);
    // alert the user of the error
    Swal.fire({
      title: "Failed to edit your dataset tags!",
      icon: "error",
      text: e.message,
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // halt execution
    return;
  }
  // show success or failure to the user in a popup message
  Swal.fire({
    title: determineSwalSuccessMessage($("#button-add-tags")),
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then(
    //check if tags array is empty and set Add/Edit tags appropriately
    tags === undefined || tags.length == 0
      ? $("#button-add-tags").html("Add tags")
      : $("#button-add-tags").html("Edit tags")
  );
});

// fetch a user's metadata tags
// this function fires from two events:
//    1. when a user clicks on the pencil icon to view their list of datasets in any of the manage-dataset sections
//    2. after the user selects a dataset from the very same dropdown list
const showCurrentTags = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    // this code executes when the pencil icon that allows a user to select a dataset is clicked in the tags section
    // for now do nothing
  } else {
    // remove all of the tags from the current input
    datasetTagsTagify.removeAllTags();

    // make the tags input display a loading spinner after a user selects a new dataset
    datasetTagsTagify.loading(true);

    // get the tags from the Pennsieve API
    let tags;
    try {
      tags = await get_dataset_tags(selectedBfDataset);
      if (tags === undefined || tags.length == 0) {
        //if so make the button say add tags
        $("#button-add-tags").html("Add tags");
      } else {
        //make the button say edit tags
        $("#button-add-tags").html("Edit tags");
      }
    } catch (e) {
      // log the error
      log.error(e);
      console.error(e);
      // alert the user of the error
      Swal.fire({
        title: "Failed to retrieve your selected dataset!",
        icon: "error",
        text: e.message,
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      // stop the loader -- no data can be fetched for this dataset
      datasetTagsTagify.loading(false);

      // halt execution
      return;
    }

    // stop displaying the tag loading spinner
    datasetTagsTagify.loading(false);

    // display the retrieved tags
    datasetTagsTagify.addTags(tags);
  }
};

// Add license //
$("#button-add-license").click(() => {
  setTimeout(function () {
    Swal.fire({
      title: "Adding license to dataset",
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

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let selectedLicense = "Creative Commons Attribution";

    client.invoke(
      "api_bf_add_license",
      selectedBfAccount,
      selectedBfDataset,
      selectedLicense,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);

          let emessage = userError(error);

          Swal.fire({
            title: "Failed to add the license to your dataset!",
            text: emessage,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Assign License",
            selectedBfDataset
          );
        } else {
          Swal.fire({
            title: "Successfully added license to dataset!",
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          showCurrentLicense();

          ipcRenderer.send(
            "track-event",
            "Success",
            "Manage Dataset - Assign License",
            selectedBfDataset
          );
        }
      }
    );
  }, delayAnimation);
});

const showCurrentLicense = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  currentDatasetLicense.innerHTML = `Loading current license... <div class="ui active green inline loader tiny"></div>`;

  if (selectedBfDataset === "Select dataset") {
    currentDatasetLicense.innerHTML = "None";
  } else {
    client.invoke(
      "api_bf_get_license",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
        } else {
          currentDatasetLicense.innerHTML = res;
          if (res === "Creative Commons Attribution") {
            $("#button-add-license").hide();
            $("#assign-a-license-header").hide();
            if ($("#add_license-section").hasClass("is-shown")) {
              Swal.fire({
                title:
                  "You are all set. This dataset already has the correct license assigned.",
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                showConfirmButton: true,
                icon: "success",
              });
            }
          } else {
            $("#button-add-license").show();
            $("#assign-a-license-header").show();
          }
        }
      }
    );
  }
};

$("#selected-local-dataset-submit").click(() => {
  ipcRenderer.send("open-file-dialog-submit-dataset");
});

$(document).ready(() => {
  ipcRenderer.on("selected-submit-dataset", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        $("#selected-local-dataset-submit").attr(
          "placeholder",
          `${filepath[0]}`
        );

        valid_dataset = verify_sparc_folder(filepath[0]);

        if (valid_dataset == true) {
          $("#button_upload_local_folder_confirm").click();
          $("#button-submit-dataset").show();
          $("#button-submit-dataset").addClass("pulse-blue");

          // remove pulse class after 4 seconds
          // pulse animation lasts 2 seconds => 2 pulses
          setTimeout(() => {
            $(".pulse-blue").removeClass("pulse-blue");
          }, 4000);
        } else {
          Swal.fire({
            icon: "warning",
            text: "This folder does not seems to be a SPARC dataset folder. Are you sure you want to proceed?",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "Cancel",
            reverseButtons: reverseSwalButtons,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          }).then((result) => {
            if (result.isConfirmed) {
              $("#button_upload_local_folder_confirm").click();
              $("#button-submit-dataset").show();
              $("#button-submit-dataset").addClass("pulse-blue");

              // remove pulse class after 4 seconds
              // pulse animation lasts 2 seconds => 2 pulses
              setTimeout(() => {
                $(".pulse-blue").removeClass("pulse-blue");
              }, 4000);
            } else {
              $("#input-destination-getting-started-locally").attr(
                "placeholder",
                "Browse here"
              );
              $("#selected-local-dataset-submit").attr(
                "placeholder",
                "Browse here"
              );
            }
          });
        }
      }
    }
  });
});

function walk(directory, filepaths = []) {
  const files = fs.readdirSync(directory);
  for (let filename of files) {
    const filepath = path.join(directory, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filepaths);
    } else {
      filepaths.push(filepath);
    }
  }
  return filepaths;
}

const logFilesForUpload = (upload_folder_path) => {
  const foundFiles = walk(upload_folder_path);
  foundFiles.forEach((item) => {
    log.info(item);
  });
};

// Submit dataset to bf //
$("#button-submit-dataset").click(async () => {
  $("#para-please-wait-manage-dataset").html(
    "Please wait while we verify a few things..."
  );

  let supplementary_checks = await run_pre_flight_checks(false);
  if (!supplementary_checks) {
    return;
  }

  var totalFileSize;

  $("#para-please-wait-manage-dataset").html("Please wait...");
  $("#para-progress-bar-error-status").html("");

  progressBarUploadBf.value = 0;

  $("#button-submit-dataset").prop("disabled", true);
  $("#selected-local-dataset-submit").prop("disabled", true);
  $("#button-submit-dataset").popover("hide");
  $("#progress-bar-status").html("Preparing files ...");

  var err = false;
  var completionStatus = "Solving";
  var selectedbfaccount = defaultBfAccount;
  var selectedbfdataset = defaultBfDataset;

  log.info("Files selected for upload:");
  logFilesForUpload(pathSubmitDataset.placeholder);

  client.invoke(
    "api_bf_submit_dataset",
    selectedbfaccount,
    selectedbfdataset,
    pathSubmitDataset.placeholder,
    (error, res) => {
      if (error) {
        let emessage = userError(error);

        $("#para-please-wait-manage-dataset").html("");
        $("#para-progress-bar-status").html("");
        $("#div-progress-submit").css("display", "none");
        $("#para-progress-bar-error-status").html(
          "<span style='color: red;'>" + emessage + sadCan + "</span>"
        );

        progressBarUploadBf.value = 0;

        err = true;
        log.error(error);
        console.error(error);

        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Upload Local Dataset",
          selectedbfdataset
        );

        $("#upload_local_dataset_progress_div")[0].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        $("#button-submit-dataset").prop("disabled", false);
        $("#selected-local-dataset-submit").prop("disabled", false);
      } else {
        $("#upload_local_dataset_progress_div")[0].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        log.info("Completed submit function");
        console.log("Completed submit function");

        ipcRenderer.send(
          "track-event",
          "Success",
          "Manage Dataset - Upload Local Dataset - name - size",
          defaultBfDataset,
          totalFileSize
        );

        ipcRenderer.send(
          "track-event",
          "Success",
          "Upload Local Dataset - size",
          totalFileSize
        );

        ipcRenderer.send(
          "track-event",
          "Success",
          `Upload Local Dataset - ${selectedbfdataset} - size`,
          totalFileSize
        );

        client.invoke(
          "api_get_number_of_files_and_folders_locally",
          pathSubmitDataset.placeholder,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
            } else {
              let num_of_files = res[0];
              let num_of_folders = res[1];

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - ${defaultBfDataset} - Number of Folders`,
                num_of_folders
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - Number of Folders`,
                num_of_folders
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Manage Dataset - Upload Local Dataset - name - Number of files`,
                defaultBfDataset,
                num_of_files
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - ${defaultBfDataset} - Number of Files`,
                num_of_files
              );

              ipcRenderer.send(
                "track-event",
                "Success",
                `Upload Local Dataset - Number of Files`,
                num_of_files
              );
            }
          }
        );
      }
    }
  );

  var countDone = 0;
  var timerProgress = setInterval(progressfunction, 1000);

  function progressfunction() {
    $("#upload_local_dataset_progress_div")[0].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    client.invoke("api_submit_dataset_progress", (error, res) => {
      if (error) {
        let emessage = userError(error);

        log.error(error);
        console.error(error);

        $("#para-progress-bar-error-status").html(
          "<span style='color: red;'>" + emessage + sadCan + "</span>"
        );
      } else {
        completionStatus = res[1];
        let submitprintstatus = res[2];
        totalFileSize = res[3];
        let uploadedFileSize = res[4];

        if (submitprintstatus === "Uploading") {
          $("#div-progress-submit").css("display", "block");

          if (res[0].includes("Success: COMPLETED!")) {
            progressBarUploadBf.value = 100;

            $("#para-please-wait-manage-dataset").html("");
            $("#para-progress-bar-status").html(res[0] + smileyCan);
          } else {
            var value = (uploadedFileSize / totalFileSize) * 100;

            progressBarUploadBf.value = value;

            if (totalFileSize < displaySize) {
              var totalSizePrint = totalFileSize.toFixed(2) + " B";
            } else if (totalFileSize < displaySize * displaySize) {
              var totalSizePrint =
                (totalFileSize / displaySize).toFixed(2) + " KB";
            } else if (
              totalFileSize <
              displaySize * displaySize * displaySize
            ) {
              var totalSizePrint =
                (totalFileSize / displaySize / displaySize).toFixed(2) + " MB";
            } else {
              var totalSizePrint =
                (
                  totalFileSize /
                  displaySize /
                  displaySize /
                  displaySize
                ).toFixed(2) + " GB";
            }

            $("#para-please-wait-manage-dataset").html("");
            $("#para-progress-bar-status").html(
              res[0] +
                "Progress: " +
                value.toFixed(2) +
                "%" +
                " (total size: " +
                totalSizePrint +
                ")"
            );
          }
        }
      }
    });
    if (completionStatus === "Done") {
      countDone++;

      if (countDone > 1) {
        log.info("Done submit track");
        console.log("Done submit track");

        clearInterval(timerProgress);

        $("#para-please-wait-manage-dataset").html("");

        $("#button-submit-dataset").prop("disabled", false);
        $("#selected-local-dataset-submit").prop("disabled", false);
      }
    }
  }
});

const addRadioOption = (ul, text, val) => {
  let li = document.createElement("li");
  let element = `<input type="radio" id="${val}_radio" value="${val}" name="dataset_status_radio"/> <label for="${val}_radio">${text}</label> <div class="check"></div>`;
  $(li).html(element);
  $(`#${ul}`).append(li);
};

const removeRadioOptions = (ele) => {
  $(`#${ele}`).html("");
};

$("body").on("click", ".check", function () {
  $(this).siblings("input[name=dataset_status_radio]:radio").click();
});

$("body").on(
  "change",
  "input[type=radio][name=dataset_status_radio]",
  function () {
    $("#bf_list_dataset_status").val(this.value).trigger("change");
  }
);

// Change dataset status option change
$("#bf_list_dataset_status").on("change", () => {
  $(bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");

  selectOptionColor(bfListDatasetStatus);

  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;
  let selectedStatusOption =
    bfListDatasetStatus.options[bfListDatasetStatus.selectedIndex].text;

  client.invoke(
    "api_bf_change_dataset_status",
    selectedBfAccount,
    selectedBfDataset,
    selectedStatusOption,
    (error, res) => {
      if (error) {
        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Change Dataset Status",
          selectedBfDataset
        );

        log.error(error);
        console.error(error);

        var emessage = userError(error);

        function showErrorDatasetStatus() {
          Swal.fire({
            title: "Failed to change dataset status!",
            text: emessage,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
        }

        showCurrentDatasetStatus(showErrorDatasetStatus);
      } else {
        ipcRenderer.send(
          "track-event",
          "Error",
          "Manage Dataset - Change Dataset Status",
          selectedBfDataset
        );

        $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
        $("#bf-dataset-status-spinner").css("display", "none");

        Swal.fire({
          title: res,
          icon: "success",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      }
    }
  );
});

function showCurrentDatasetStatus(callback) {
  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    removeOptions(bfListDatasetStatus);
    removeRadioOptions("dataset_status_ul");

    bfListDatasetStatus.style.color = "black";
  } else {
    client.invoke(
      "api_bf_get_dataset_status",
      selectedBfAccount,
      selectedBfDataset,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);

          let emessage = userError(error);

          Swal.fire({
            title: "Failed to change dataset status!",
            text: emessage,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");
        } else {
          removeOptions(bfListDatasetStatus);
          removeRadioOptions("dataset_status_ul");

          for (let item in res[0]) {
            let option = document.createElement("option");

            option.textContent = res[0][item]["displayName"];
            option.value = res[0][item]["name"];
            option.style.color = res[0][item]["color"];

            bfListDatasetStatus.appendChild(option);

            addRadioOption(
              "dataset_status_ul",
              res[0][item]["displayName"],
              res[0][item]["name"]
            );
          }
          bfListDatasetStatus.value = res[1];

          $(`input[name=dataset_status_radio][value=${res[1]}]`).prop(
            "checked",
            true
          );

          selectOptionColor(bfListDatasetStatus);

          $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
          $("#bf-dataset-status-spinner").css("display", "none");

          if (callback !== undefined) {
            callback();
          }
        }
      }
    );
  }
}
