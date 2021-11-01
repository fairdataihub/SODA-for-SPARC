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
    $("#bf-create-new-dataset-spinner").css("visibility", "visible");

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

          $("#bf-create-new-dataset-spinner").css("visibility", "hidden");
          $("#button-create-bf-new-dataset").prop("disabled", false);

          ipcRenderer.send(
            "track-event",
            "Error",
            "Manage Dataset - Create Empty Dataset",
            bfNewDatasetName
          );
        } else {
          Swal.fire({
            title: "Created successfully!",
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

          log.info(`Created dataset successfully`);

          $("#bf-create-new-dataset-spinner").css("visibility", "hidden");
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
      $("#bf-rename-dataset-spinner").css("visibility", "visible");
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
            $("#bf-rename-dataset-spinner").css("visibility", "hidden");
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
              title: "Renamed successfully!",
              text:
                "Renamed dataset" +
                " '" +
                currentDatasetName +
                "'" +
                " to" +
                " '" +
                renamedDatasetName +
                "'. ",
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
            $("#button-rename-dataset").prop("disabled", false);

            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Rename Existing Dataset",
              currentDatasetName + " to " + renamedDatasetName
            );
            $("#bf-rename-dataset-spinner").css("visibility", "hidden");
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

      $("#bf-add-permission-pi-spinner").css("visibility", "visible");

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

            $("#bf-add-permission-pi-spinner").css("visibility", "hidden");

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
            $("#bf-add-permission-pi-spinner").css("visibility", "hidden");

            showCurrentPermission();
            changeDatasetRolePI(selectedBfDataset);

            Swal.fire({
              title: "Loaded successfully!",
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
        $("#bf-add-permission-user-spinner").hide();

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
            $("#bf-add-permission-user-spinner").hide();
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

            $("#bf-add-permission-user-spinner").hide();
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

    $("#bf-add-permission-user-spinner").show();

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

    $("#bf-add-permission-team-spinner").show();

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

          $("#bf-add-permission-team-spinner").hide();

          Swal.fire({
            title: "Failed to change permission!",
            text: emessage,
            icon: "error",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
        } else {
          log.info("Added permission for the team");

          $("#bf-add-permission-team-spinner").hide();

          Swal.fire({
            title: "Successfully changed permission!",
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
    $("#bf-add-subtitle-dataset-spinner").show();

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

          $("#bf-add-subtitle-dataset-spinner").hide();

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

          $("#bf-add-subtitle-dataset-spinner").hide();
          $("#ds-description").val(inputSubtitle);

          Swal.fire({
            title: "Successfully added!",
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });

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

const validateDescription = (description) => {
  description = description.trim();

  if (
    description.search("[*][*]Study Purpose[*][*]") == -1 &&
    description.search("[*][*]Study Purpose:[*][*]") == -1 &&
    description.search("[*][*]Study Purpose :[*][*]") == -1
  ) {
    return false;
  }
  if (
    description.search("[*][*]Data Collection[*][*]") == -1 &&
    description.search("[*][*]Data Collection:[*][*]") == -1 &&
    description.search("[*][*]Data Collection :[*][*]") == -1
  ) {
    return false;
  }
  if (
    description.search("[*][*]Primary Conclusion[*][*]") == -1 &&
    description.search("[*][*]Primary Conclusion:[*][*]") == -1 &&
    description.search("[*][*]Primary Conclusion :[*][*]") == -1
  ) {
    return false;
  }
  return true;
};

// Add description //
// $("#button-add-description").click(() => {
//   setTimeout(() => {
//     $("#bf-add-description-dataset-spinner").show();

//     let selectedBfAccount = defaultBfAccount;
//     let selectedBfDataset = defaultBfDataset;
//     let markdownDescription = tuiInstance.getMarkdown();

//     let response = validateDescription(markdownDescription);

//     if (!response) {
//       Swal.fire({
//         icon: "warning",
//         html: `This description does not seem to follow the SPARC guidelines.
//             Your descriptions should looke like this:
//             <br> <br>
//             <p style="text-align:left">
//               <strong> Study Purpose: </strong> <br>
//               <strong> Data Collection: </strong> <br>
//               <strong> Primary Conclusion: </strong>
//             </p>
//             <br> <br>
//             Are you sure you want to continue?`,
//         heightAuto: false,
//         backdrop: "rgba(0,0,0, 0.4)",
//         showCancelButton: true,
//         focusCancel: true,
//         confirmButtonText: "Continue",
//         cancelButtonText: "No, I want to edit my description",
//         reverseButtons: true,
//         showClass: {
//           popup: "animate__animated animate__zoomIn animate__faster",
//         },
//         hideClass: {
//           popup: "animate__animated animate__zoomOut animate__faster",
//         },
//       }).then(() => {
//         addDescription(
//           selectedBfAccount,
//           selectedBfDataset,
//           markdownDescription
//         );
//       });
//     } else {
//       addDescription(selectedBfAccount, selectedBfDataset, markdownDescription);
//     }
//   }, delayAnimation);
// });

$("#button-add-description").click(() => {
  setTimeout(() => {
    $("#bf-add-description-dataset-spinner").show();

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;

    // get the text from the three boxes and store them in their own variables
    let requiredFields = [];
    requiredFields.push(
      "**Study Purpose:**" + $("#ds-description-study-purpose").val()
    );
    requiredFields.push(
      "**Data Collection:**" + $("#ds-description-data-collection").val()
    );
    requiredFields.push(
      "**Primary Conclusion:**" + $("#ds-description-primary-conclusion").val()
    );

    // validate the new markdown description the user created
    let response = validateDescription(requiredFields.join("\n"));

    if (!response) {
      Swal.fire({
        icon: "warning",
        html: `This description does not seem to follow the SPARC guidelines.
        Your descriptions should look like this:
        <br> <br>
        <p style="text-align:left">
          <strong> Study Purpose: </strong> <br>
          <strong> Data Collection: </strong> <br>
          <strong> Primary Conclusion: </strong>
        </p>
        <br> <br>
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
      }).then(() => {
        addDescription()(
          selectedBfAccount,
          selectedBfDataset,
          requiredFields.join("\n")
        );
      });
    } else {
      addDescription(
        selectedBfAccount,
        selectedBfDataset,
        requiredFields.join("\n")
      );
    }
  }, delayAnimation);
});

// const showCurrentDescription = () => {
//   var selectedBfAccount = defaultBfAccount;
//   var selectedBfDataset = defaultBfDataset;

//   if (selectedBfDataset === "Select dataset") {
//     tuiInstance.setMarkdown("");
//   } else {
//     client.invoke(
//       "api_bf_get_description",
//       selectedBfAccount,
//       selectedBfDataset,
//       (error, res) => {
//         if (error) {
//           log.error(error);
//           console.error(error);
//         } else {
//           if (res == "") {
//             res = `**Study Purpose:** &nbsp; \n \n **Data Collection:** &nbsp; \n \n **Primary Conclusion:** &nbsp; `;
//             tuiInstance.setMarkdown(res);

//             $("#button-add-description > .btn_animated-inside").html(
//               "Add description"
//             );
//           } else {
//             tuiInstance.setMarkdown(res);
//             $("#button-add-description > .btn_animated-inside").html(
//               "Edit description"
//             );
//           }
//         }
//       }
//     );
//   }
// };

// fires when a user selects a dataset in the add/edit description page
const showCurrentDescription = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  // check if the user is selecting a dataset
  if (selectedBfDataset == "Select dataset") {
    // remove the text from the boxes? Probably not
  } else {
    // get the dataset readme
    let readme = await get_dataset_readme(selectedBfDataset);

    // create the parsed dataset read me object
    let parsedReadme = create_parsed_readme(readme);

    // check if any of the fields have data
    if (
      parsedReadme["Study Purpose"] ||
      parsedReadme["Data Collection"] ||
      parsedReadme["Primary Conclusion"]
    ) {
      //if so make the button say edit description
      $("#button-add-description > .btn_animated-inside").html(
        "Edit description"
      );
    } else {
      //make the button say add description
      $("#button-add-description > .btn_animated-inside").html(
        "Add description"
      );
    }

    //  check if there is any study purpose text || Data Collection || Primary Conclusion
    if (parsedReadme["Study Purpose"]) {
      // if so place the text into the text area for that field
      $("#ds-description-study-purpose").val(parsedReadme["Study Purpose"]);
    }

    if (parsedReadme["Data Collection"]) {
      // if so place the text into the text area for that field
      $("#ds-description-data-collection").val(parsedReadme["Data Collection"]);
    }

    if (parsedReadme["Primary Conclusion"]) {
      // if so place the text into the text area for that field
      $("#ds-description-primary-conclusion").val(
        parsedReadme["Primary Conclusion"]
      );
    }

    // check if there is any invalid text remaining
    if (parsedReadme["Invalid Text"]) {
      // fire an alert that informs the user their invalid data has been added to the first section so they can place it in the correct boxes

      // if so add it to the first section
      $("#ds-description-study-purpose").val(
        parsedReadme["Study Purpose"] + parsedReadme["Invalid Text"]
      );
    }
  }
};

// searches the markdown for key sections and returns them divided into an easily digestible object
// returns: {Study Purpose: text/markdown | "", Data Collection: text/markdown | "", Primary Conclusion: text/markdown | "", invalidText: text/markdown | ""}
const create_parsed_readme = (readme) => {
  // read in the readme file and store it in a variable ( it is in markdown )
  let mutableReadme = readme;
  // create the return object
  const parsedReadme = {
    "Study Purpose": "",
    "Data Collection": "",
    "Primary Conclusion": "",
    "Invalid Text": "",
  };

  // search for the **Study Purpose:** and basic variations of spacing
  let study_purpose_idx = mutableReadme.search("[*][*]Study Purpose:[*][*]");

  // If found place the following text into the studyPurpose property without the Study Purpose section title and markdown
  if (study_purpose_idx !== -1) {
    let endOfSectionIdx;
    mutableReadme = mutableReadme.replace("**Study Purpose:**", "");
    for (let idx = study_purpose_idx; idx < mutableReadme.length; idx++) {
      if (mutableReadme[idx] === "*") {
        endOfSectionIdx = idx;
        break;
      }
    }

    // store the value of the Study Purpose in the parsed readme
    parsedReadme["Study Purpose"] = mutableReadme.slice(
      study_purpose_idx,
      endOfSectionIdx
    );

    // Set description to a new string that does not have the Study Purpose section ( desc = str.slice(0, idx) + str.slice(endSectionIdx))
    mutableReadme =
      mutableReadme.slice(0, study_purpose_idx) +
      mutableReadme.slice(endOfSectionIdx);
  }

  // search for the **Data Collection** and basic variations of spacing
  let data_collection_idx = mutableReadme.search(
    "[*][*]Data Collection:[*][*]"
  );

  // If found place the text into the data_collection property  without the Data Collection section title and markdown
  if (data_collection_idx !== -1) {
    let endOfSectionIdx;
    mutableReadme = mutableReadme.replace("**Data Collection:**", "");
    for (let idx = data_collection_idx; idx < mutableReadme.length; idx++) {
      if (mutableReadme[idx] === "*") {
        endOfSectionIdx = idx;
        break;
      }
    }
    // store the value of the Data Collection in the parsed readme
    parsedReadme["Data Collection"] = mutableReadme.slice(
      data_collection_idx,
      endOfSectionIdx
    );

    // Set description to a new string that does not have the Study Purpose section ( desc = str.slice(0, idx) + str.slice(endSectionIdx))
    mutableReadme =
      mutableReadme.slice(0, data_collection_idx) +
      mutableReadme.slice(endOfSectionIdx);
  }

  // search for the **Primary Conclusion** and basic variations of spacing
  let primary_conclusion_idx = mutableReadme.search(
    "[*][*]Primary Conclusion:[*][*]"
  );

  // If found place the text into the primary_conclusion property  without the Primary Conclusion section title and markdown
  if (primary_conclusion_idx !== -1) {
    let endOfSectionIdx;
    mutableReadme = mutableReadme.replace("**Primary Conclusion:**", "");
    for (let idx = primary_conclusion_idx; idx < mutableReadme.length; idx++) {
      if (mutableReadme[idx] === "*") {
        endOfSectionIdx = idx;
        break;
      }
    }
    // store the value of the Data Collection in the parsed readme
    parsedReadme["Primary Conclusion"] = mutableReadme.slice(
      primary_conclusion_idx,
      endOfSectionIdx
    );

    // Set description to a new string that does not have the Study Purpose section ( desc = str.slice(0, idx) + str.slice(endSectionIdx))
    mutableReadme =
      mutableReadme.slice(0, primary_conclusion_idx) +
      mutableReadme.slice(endOfSectionIdx);
  }

  // strip out the Curator's Notes section
  let curators_section_idx = mutableReadme.search(
    "[*][*]Curator's Notes[*][*]"
  );
  if (curators_section_idx !== -1) {
    // remove the curators notes from the current readme
    mutableReadme = mutableReadme.slice(0, curators_section_idx);
  }

  // strip out any unrequired sections -- user does not edit these on SODA for now
  while (mutableReadme.search("[*][*].*[*][*]") !== -1) {
    let auxillary_section_idx = mutableReadme.search("[*][*].*[*][*]");
    let start_of_section_text_idx = auxillary_section_idx;

    // skip the first two markdown * characters
    start_of_section_text_idx += 2;
    // move to end of section title -- the end of the section is indicated by two closing markdown '**' characters
    while (
      start_of_section_text_idx < mutableReadme.length &&
      (mutableReadme[start_of_section_text_idx] !== "*" ||
        mutableReadme[start_of_section_text_idx - 1] !== "*")
    ) {
      start_of_section_text_idx += 1;
    }
    // move off the final * character
    start_of_section_text_idx += 1;

    end_of_section_text_idx = start_of_section_text_idx;

    // check if auxillary section idx is still in bounds
    if (end_of_section_text_idx < mutableReadme.length) {
      // search for the next title if one exists
      while (
        end_of_section_text_idx < mutableReadme.length &&
        (mutableReadme[end_of_section_text_idx] !== "*" ||
          mutableReadme[end_of_section_text_idx - 1] !== "*")
      ) {
        end_of_section_text_idx += 1;
      }

      // strip the section out of the current readme
      mutableReadme =
        mutableReadme.slice(0, auxillary_section_idx) +
        mutableReadme.slice(end_of_section_text_idx - 1);
    } else {
      // TODO: get rid of the section header
    }
  }

  //check if final version of the description has any more text
  if (mutableReadme.length) {
    //store it as invalid text -- this is because it is does not belong to a section or because we cannot assume it belongs to a section
    //this only occurs when a user has no section in their readme or has text before any of their sections in the readme.
    parsedReadme["Invalid Text"] = mutableReadme;
  }

  //return the parsed readme object
  return parsedReadme;
};

// I: user_markdown_input: A string that holds the user's markdown text
//    static_markdown_input: A string that contains curators notes or any other field we do not support editing.
const addDescription = async (
  selectedBfAccount,
  selectedBfDataset,
  userMarkdownInput
) => {
  console.log(userMarkdownInput);
  // get access token for the current user
  let jwt = await get_access_token();

  // get the dataset the user wants to edit
  let dataset = await get_dataset_by_name_id(selectedBfDataset, jwt);

  // get the id out of the dataset
  let id = dataset.content.id;

  // get the user's permissions
  let roleResponse = await fetch(
    `https://api.pennsieve.io/datasets/${id}/role`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  const { role } = await roleResponse.json();
  console.log("My role is:", role);

  // check if the user permissions do not include "owner" or "manager"
  if (!["owner", "manager"].includes(role)) {
    // throw a permission error: "You don't have permissions for editing metadata on this Pennsieve dataset"
    throw new Error(
      "You don't have permissions for editing metadata on this Pennsieve dataset"
    );
  }

  // get the readme of the dataset

  // add the markdown titles back to the study purpose, data collection, and primary conclusion section

  // pull out the static_sections -- curators notes and other sections we do not allow the user to edit -- use the functon that finds all headers that aren't required (ignores invalid text )

  // join the user_markdown_input with the static_markdown_input

  // put the new readme data in the readme on Pennsieve
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ readme: userMarkdownInput }),
  };
  await fetch(`https://api.pennsieve.io/datasets/${id}/readme`, options);
};

// const addDescription = (
//   selectedBfAccount,
//   selectedBfDataset,
//   markdownDescription
// ) => {
//   client.invoke(
//     "api_bf_add_description",
//     selectedBfAccount,
//     selectedBfDataset,
//     markdownDescription,
//     (error, res) => {
//       if (error) {
//         log.error(error);
//         console.error(error);
//         let emessage = userError(error);

//         $("#bf-add-description-dataset-spinner").hide();

//         Swal.fire({
//           title: "Failed to add description!",
//           text: emessage,
//           icon: "error",
//           showConfirmButton: true,
//           heightAuto: false,
//           backdrop: "rgba(0,0,0, 0.4)",
//         });

//         ipcRenderer.send(
//           "track-event",
//           "Error",
//           "Manage Dataset - Add/Edit Description",
//           selectedBfDataset
//         );
//       } else {
//         $("#bf-add-description-dataset-spinner").hide();

//         Swal.fire({
//           title: "Successfully added description!",
//           icon: "success",
//           showConfirmButton: true,
//           heightAuto: false,
//           backdrop: "rgba(0,0,0, 0.4)",
//         });

//         showDatasetDescription();
//         changeDatasetUnderDD();

//         ipcRenderer.send(
//           "track-event",
//           "Success",
//           "Manage Dataset - Add/Edit Description",
//           selectedBfDataset
//         );
//       }
//     }
//   );
// };

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
  // show a loading spinner to the user
  $("#bf-add-tags-dataset-spinner").show();

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
    // hide the loading spinner
    $("#bf-add-tags-dataset-spinner").hide();

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

  // once the result has been retrieved hide the spinner
  $("#bf-add-tags-dataset-spinner").hide();

  // show success or failure to the user in a popup message
  Swal.fire({
    title: "Successfully edited tags!",
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });
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
    $("#bf-add-license-dataset-spinner").show();

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

          $("#bf-add-license-dataset-spinner").hide();

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
          $("#bf-add-license-dataset-spinner").hide();

          Swal.fire({
            title: "Successfully added license to your dataset!",
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
