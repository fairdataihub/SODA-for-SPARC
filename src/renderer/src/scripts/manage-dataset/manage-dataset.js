import axios from "axios";
import Swal from "sweetalert2";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import client from "../client";
import lottie from "lottie-web";
import { licenseLottie } from "../../assets/lotties/license-lottie";
import kombuchaEnums from "../analytics/analytics-enums";
import { updateDatasetList } from "../globals";
import api from "../others/api/api";
import datasetUploadSession from "../analytics/upload-session-tracker";
import {
  createEventData,
  logSelectedUpdateExistingDatasetOptions,
} from "../analytics/curation-analytics";
import Cropper from "cropperjs";

// event listeners for opening dataset or account selection dropdown
import Accordion from "accordion-js";
// TODO: Follow up that this is the way to import it
import "accordion-js/dist/accordion.min.css";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// TODO: Add logic so this doesnt apply to the organization fields
document.querySelectorAll(".ds-dd:not(.organization)").forEach((dropdownElement) => {
  dropdownElement.addEventListener("click", function () {
    window.openDropdownPrompt(this, "dataset");
  });
});

document.querySelectorAll(".md-change-current-account").forEach((dropdownElement) => {
  dropdownElement.addEventListener("click", function () {
    window.openDropdownPrompt(this, "bf");
  });
});

document.querySelectorAll(".ds-dd.organization").forEach((dropdownElement) => {
  dropdownElement.addEventListener("click", function () {
    window.openDropdownPrompt(this, "organization");
  });
});

var forbidden_characters_bf = '/\\:*?"<>.,';

window.check_forbidden_characters_ps = (my_string) => {
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
  // Clear success lottie
  $("#dataset-created-success-lottie").empty();
  $("#dataset-success-container").addClass("hidden");
  let newName = $("#bf-new-dataset-name").val().trim();

  if (newName !== "") {
    if (window.check_forbidden_characters_ps(newName)) {
      Swal.fire({
        title:
          "A Pennsieve dataset name cannot contain any of the following characters: \\/:*?'<>.,",
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
    if (window.check_forbidden_characters_ps(newName)) {
      Swal.fire({
        title:
          "A Pennsieve dataset name cannot contain any of the following characters: \\/:*?'<>.,",
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
$("#button-create-bf-new-dataset").click(async () => {
  setTimeout(async () => {
    let selectedbfaccount = window.defaultBfAccount;
    let bfNewDatasetName = $("#bf-new-dataset-name").val();

    window.log.info(`Creating a new dataset with the name: ${bfNewDatasetName}`);

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

    try {
      let bf_new_dataset = await client.post(
        `/manage_datasets/datasets`,
        {
          input_dataset_name: bfNewDatasetName,
        },
        {
          params: {
            selected_account: selectedbfaccount,
          },
        }
      );
      let res = bf_new_dataset.data.id;
      let intId = bf_new_dataset.data.int_id;

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

      let datasetCreatedLottie = document.getElementById("dataset-created-success-lottie");
      if (datasetCreatedLottie.children.length < 1) {
        // licenseContainer.removeChild(licenseContainer.children[1]);
        lottie.loadAnimation({
          container: datasetCreatedLottie,
          animationData: licenseLottie,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
      }
      $("#dataset-success-container").removeClass("hidden");

      window.log.info(`Created dataset successfully`);

      $("#button-create-bf-new-dataset").hide();

      window.defaultBfDataset = bfNewDatasetName;
      window.defaultBfDatasetId = res;
      window.defaultBfDatasetIntId = intId;
      // log a map of datasetId to dataset name to analytics
      // this will be used to help us track private datasets which are not trackable using a datasetId alone
      window.electron.ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        window.defaultBfDatasetId,
        window.defaultBfDataset
      );
      window.refreshDatasetList();
      window.currentDatasetPermission.innerHTML = "";
      window.currentAddEditDatasetPermission.innerHTML = "";
      $("#button-create-bf-new-dataset").prop("disabled", false);

      window.addNewDatasetToList(bfNewDatasetName);
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.CREATE_NEW_DATASET,
        window.defaultBfDataset,
        kombuchaEnums.Status.SUCCESS,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_int_id: window.defaultBfDatasetIntId,
          dataset_name: bfNewDatasetName,
        }
      );

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CREATE_DATASET,
        bfNewDatasetName
      );

      window.log.info(`Requesting list of datasets`);

      window.datasetList = [];
      window.datasetList = await api.getDatasetsForAccount(window.defaultBfAccount);
      window.log.info(`Requested list of datasets successfully`);

      $(".bf-dataset-span").html(bfNewDatasetName);

      window.refreshDatasetList();
      updateDatasetList();

      $(".confirm-button").click();
      $("#bf-new-dataset-name").val("");
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      Swal.fire({
        title: `Failed to create a new dataset.`,
        text: emessage,
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      $("#button-create-bf-new-dataset").prop("disabled", false);

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.CREATE_NEW_DATASET,
        bfNewDatasetName,
        kombuchaEnums.Status.FAIL,
        {
          value: 1,
        }
      );

      window.electron.ipcRenderer.send(
        "track-event",
        "Error",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CREATE_DATASET,
        bfNewDatasetName
      );
    }
  }, window.delayAnimation);
});

/// add new datasets to dataset List without calling Python to retrieve new list from Pennsieve
window.addNewDatasetToList = (newDataset) => {
  window.datasetList.push({ name: newDataset, role: "owner" });
};

// Rename dataset on pennsieve
$("#button-rename-dataset").on("click", async () => {
  setTimeout(async function () {
    var selectedbfaccount = window.defaultBfAccount;
    var currentDatasetName = window.defaultBfDataset;
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

    window.log.info(
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

      try {
        await client.put(
          `/manage_datasets/ps_rename_dataset`,
          {
            input_new_name: renamedDatasetName,
          },
          {
            params: {
              selected_account: selectedbfaccount,
              selected_dataset: currentDatasetName,
            },
          }
        );
      } catch (error) {
        clientError(error);
        Swal.fire({
          title: "Failed to rename dataset",
          html: userErrorMessage(error),
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
        $("#button-rename-dataset").prop("disabled", false);

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_RENAME_DATASET,
          `${window.defaultBfDatasetId}: ` + currentDatasetName + " to " + renamedDatasetName
        );

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.RENAME_DATASET,
          currentDatasetName,
          kombuchaEnums.Status.FAIL,
          {
            value: 1,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );

        return;
      }

      window.log.info("Dataset rename success");
      window.defaultBfDataset = renamedDatasetName;
      $(".bf-dataset-span").html(renamedDatasetName);
      window.refreshDatasetList();
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

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.RENAME_DATASET,
        window.defaultBfDataset,
        kombuchaEnums.Status.SUCCESS,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_RENAME_DATASET,
        `${window.defaultBfDatasetId}: ` + currentDatasetName + " to " + renamedDatasetName
      );

      // in case the user does not select a dataset after changing the name add the new datasetID to name mapping
      window.electron.ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        window.defaultBfDatasetId,
        renamedDatasetName
      );

      window.log.info("Requesting list of datasets");

      try {
        window.datasetList = [];
        window.datasetList = await api.getDatasetsForAccount(window.defaultBfAccount);
        window.refreshDatasetList();
      } catch (error) {
        clientError(error);
      }
    }
  }, window.delayAnimation);
});

// Make PI owner //
$("#button-add-permission-pi").click(async () => {
  Swal.fire({
    icon: "warning",
    text: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    heightAuto: false,
    showCancelButton: true,
    cancelButtonText: "No",
    focusCancel: true,
    confirmButtonText: "Yes",
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: window.reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    preConfirm: () => {
      let userVal = document.getElementById("bf_list_users_pi").value;
      if (userVal === "Select PI") {
        Swal.showValidationMessage("Please choose a valid user");
      }
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      window.log.info("Changing PI Owner of dataset");

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

      let selectedBfAccount = window.defaultBfAccount;
      let selectedBfDataset = window.defaultBfDataset;
      let selectedUser = $("#bf_list_users_pi").val();
      let selectedRole = "owner";

      try {
        let bf_change_owner = await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: selectedRole,
          },
          {
            params: {
              selected_account: selectedBfAccount,
              selected_dataset: selectedBfDataset,
              scope: "user",
              name: selectedUser,
            },
          }
        );

        let res = bf_change_owner.data.message;
        window.log.info("Change PI Owner of dataset");

        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_MAKE_PI_OWNER,
          window.defaultBfDatasetId
        );

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.PI_OWNER,
          kombuchaEnums.Status.SUCCESS,
          {
            value: selectedUser,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );

        window.electron.ipcRenderer.invoke(
          "set-nodestorage-item",
          "previously_selected_PI",
          selectedUser
        );

        window.showCurrentPermission();
        changeDatasetRolePI(selectedBfDataset);

        Swal.fire({
          title: "Successfully changed PI Owner of dataset",
          text: res,
          icon: "success",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } catch (error) {
        clientError(error);
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.PI_OWNER,
          kombuchaEnums.Status.FAILURE,
          {
            value: selectedUser,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_MAKE_PI_OWNER,
          window.defaultBfDatasetId
        );

        Swal.fire({
          title: "Failed to change PI permission!",
          text: userErrorMessage(error),
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0, 0, 0, 0.4)",
        });
      }
    }
  });
});

/// change PI owner status to manager
const changeDatasetRolePI = (selectedDataset) => {
  for (let i = 0; i < window.datasetList.length; i++) {
    if (window.datasetList[i].name === selectedDataset) {
      window.datasetList[i].role = "manager";
    }
  }
};

window.showCurrentPermission = async () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    window.currentDatasetPermission.innerHTML = "None";
    window.currentAddEditDatasetPermission.innerHTML = "None";
    return;
  }

  window.currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  window.currentAddEditDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  window.log.info(`Requesting current permissions for ${selectedBfDataset}.`);

  try {
    let permissions = await api.getDatasetPermissions(selectedBfAccount, selectedBfDataset, false);
    let permissionList = "";
    let datasetOwner = "";

    for (let i in permissions) {
      permissionList = permissionList + permissions[i] + "<br>";

      if (permissions[i].indexOf("owner") != -1) {
        let first_position = permissions[i].indexOf(":");
        let second_position = permissions[i].indexOf(",");

        datasetOwner = permissions[i].substring(first_position + 2, second_position);
      }
    }

    window.currentDatasetPermission.innerHTML = datasetOwner;
    window.currentAddEditDatasetPermission.innerHTML = permissionList;
  } catch (error) {
    clientError(error);
  }
};

const addPermissionUser = async (
  selectedBfAccount,
  selectedBfDataset,
  selectedUser,
  selectedRole
) => {
  window.log.info(`Adding permission ${selectedRole} to ${selectedUser} for ${selectedBfDataset}`);

  let ps_add_permission;
  try {
    ps_add_permission = await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: selectedBfAccount,
          selected_dataset: selectedBfDataset,
          scope: "user",
          name: selectedUser,
        },
      }
    );
  } catch (error) {
    clientError(error);

    Swal.fire({
      title: "Failed to change permission!",
      text: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Add User Permissions"]
    );

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.MANAGE_DATASETS,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.USER_PERMISSIONS,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_id: window.defaultBfDatasetId,
        dataset_name: window.defaultBfDataset,
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );

    return;
  }

  let res = ps_add_permission.data.message;

  Swal.fire({
    title: "Successfully changed permission!",
    text: res,
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });

  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.MANAGE_DATASETS,
    kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
    kombuchaEnums.Label.USER_PERMISSIONS,
    kombuchaEnums.Status.FAIL,
    {
      value: 1,
      dataset_id: window.defaultBfDatasetId,
      dataset_name: window.defaultBfDataset,
      dataset_int_id: window.defaultBfDatasetIntId,
    }
  );

  window.log.info("Added permission ${selectedRole} to ${selectedUser} for ${selectedBfDataset}");

  window.logGeneralOperationsForAnalytics(
    "Success",
    window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
    window.AnalyticsGranularity.ALL_LEVELS,
    ["Add User Permissions"]
  );

  window.showCurrentPermission();

  try {
    // refresh dataset lists with filter
    let get_username = await client.get(`/manage_datasets/account/username`, {
      params: {
        selected_account: selectedBfAccount,
      },
    });
    let { username } = get_username.data;

    if (selectedRole === "owner") {
      for (let i = 0; i < window.datasetList.length; i++) {
        if (window.datasetList[i].name === selectedBfDataset) {
          window.datasetList[i].role = "manager";
        }
      }
    }
    if (selectedUser === username) {
      // then change role of dataset and refresh dataset list
      for (let i = 0; i < window.datasetList.length; i++) {
        if (window.datasetList[i].name === selectedBfDataset) {
          window.datasetList[i].role = selectedRole.toLowerCase();
        }
      }
    }
  } catch (error) {
    clientError(error);
  }
};

// Add permission for user //
$("#button-add-permission-user").click(() => {
  setTimeout(() => {
    window.log.info("Adding a permission for a user on a dataset");

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

    let selectedBfAccount = window.defaultBfAccount;
    let selectedBfDataset = window.defaultBfDataset;
    let selectedUser = $("#bf_list_users").val();
    let selectedRole = $("#bf_list_roles_user").val();

    addPermissionUser(selectedBfAccount, selectedBfDataset, selectedUser, selectedRole);
  }, window.delayAnimation);
});

// Add permission for team
$("#button-add-permission-team").click(async () => {
  setTimeout(async () => {
    window.log.info("Adding a permission for a team on a dataset");

    let selectedTeam = $("#bf_list_teams").val();
    let selectedRole = $("#bf_list_roles_team").val();

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

    try {
      let bf_add_team_permission = await client.patch(
        `/manage_datasets/bf_dataset_permissions`,
        {
          input_role: selectedRole,
        },
        {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.defaultBfDataset,
            scope: "team",
            name: selectedTeam,
          },
        }
      );

      let res = bf_add_team_permission.data.message;
      window.log.info("Added permission for the team");
      window.logGeneralOperationsForAnalytics(
        "Success",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
        window.AnalyticsGranularity.ALL_LEVELS,
        ["Add Team Permissions"]
      );

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
        kombuchaEnums.Label.TEAM_PERMISSIONS,
        kombuchaEnums.Status.SUCCESS,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      Swal.fire({
        title: "Successfully changed permission",
        text: res,
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      window.showCurrentPermission();
    } catch (error) {
      clientError(error);

      Swal.fire({
        title: "Failed to change permission",
        text: userErrorMessage(error),
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
        kombuchaEnums.Label.TEAM_PERMISSIONS,
        kombuchaEnums.Status.FAIL,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      window.logGeneralOperationsForAnalytics(
        "Error",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
        window.AnalyticsGranularity.ALL_LEVELS,
        ["Add Team Permissions"]
      );
    }
  }, window.delayAnimation);
});

// Character count for subtitle //
window.countCharacters = (textelement, pelement) => {
  let textEntered = textelement.value;
  let counter = 255 - textEntered.length;
  pelement.innerHTML = counter + " characters remaining";
  return textEntered.length;
};

window.bfDatasetSubtitle = document.querySelector("#bf-dataset-subtitle");
window.bfDatasetSubtitle.addEventListener("keyup", function () {
  window.countCharacters(window.bfDatasetSubtitle, window.bfDatasetSubtitleCharCount);
});

// Add subtitle //
$("#button-add-subtitle").click(async () => {
  setTimeout(async function () {
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

    let selectedBfAccount = window.defaultBfAccount;
    let selectedBfDataset = window.defaultBfDataset;
    let inputSubtitle = $("#bf-dataset-subtitle").val().trim();

    window.log.info("Adding subtitle to dataset");
    window.log.info(inputSubtitle);

    try {
      await client.put(
        `/manage_datasets/bf_dataset_subtitle`,
        {
          input_subtitle: inputSubtitle,
        },
        {
          params: {
            selected_account: selectedBfAccount,
            selected_dataset: selectedBfDataset,
          },
        }
      );

      window.log.info("Added subtitle to dataset");

      $("#ds-description").val(inputSubtitle);

      Swal.fire({
        title: determineSwalSuccessMessage($("#button-add-subtitle")),
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      }).then(
        //check if subtitle text is empty and set Add/Edit button appropriately
        $("#bf-dataset-subtitle").val()
          ? $("#button-add-subtitle").html("Edit subtitle")
          : $("#button-add-subtitle").html("Add subtitle")
      );

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
        kombuchaEnums.Label.SUBTITLE,
        kombuchaEnums.Status.SUCCESS,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
        window.defaultBfDatasetId
      );

      // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
      window.showPrePublishingStatus();
    } catch (error) {
      clientError(error);

      let emessage = userErrorMessage(error);
      Swal.fire({
        title: "Failed to add subtitle!",
        html: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      $("#ds-description").val("");

      window.electron.ipcRenderer.send(
        "track-event",
        "Error",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
        window.defaultBfDatasetId
      );

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
        kombuchaEnums.Label.SUBTITLE,
        kombuchaEnums.Status.FAIL,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );
    }
  }, window.delayAnimation);
});

window.showCurrentSubtitle = async () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    $("#bf-dataset-subtitle").val("");
    return;
  }

  window.log.info(`Getting subtitle for dataset ${selectedBfDataset}`);

  document.getElementById("ds-description").innerHTML = "Loading...";
  document.getElementById("ds-description").disabled = true;

  try {
    let subtitle = await api.getDatasetSubtitle(selectedBfAccount, selectedBfDataset);
    window.logGeneralOperationsForAnalytics(
      "Success",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
      window.AnalyticsGranularity.ACTION,
      ["Get Subtitle"]
    );
    $("#bf-dataset-subtitle").val(subtitle);
    $("#ds-description").val(subtitle);
    let result = window.countCharacters(
      window.bfDatasetSubtitle,
      window.bfDatasetSubtitleCharCount
    );
    if (result === 0) {
      $("#button-add-subtitle > .btn_animated-inside").html("Add subtitle");
    } else {
      $("#button-add-subtitle > .btn_animated-inside").html("Edit subtitle");
    }
  } catch (error) {
    clientError(error);
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get Subtitle"]
    );
    $("#ds-description").val("");
  }

  document.getElementById("ds-description").disabled = false;
};

// Add description //

const requiredSections = {
  studyPurpose: "Study Purpose",
  dataCollection: "Data Collection",
  primaryConclusion: "Primary Conclusion",
  invalidText: "invalid text",
};

// open the first section of the accordion for first time user navigation to the section
let dsAccordion = new Accordion("#dd-accordion");
dsAccordion.open(0);

// fires whenever a user selects a dataset, from any card
window.showCurrentDescription = async () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === "Select dataset" || selectedBfDataset === null) {
    return;
  }

  // check if the warning message for invalid text is showing on the page
  let warningDisplayProperty = $("#ds-isa-warning").css("display");
  if (warningDisplayProperty === "flex") {
    // hide the warning message to prevent the user from seeing the warning for a new dataset
    $("#ds-isa-warning").css("display", "none");
  }

  window.log.info(`Getting description for dataset ${selectedBfDataset}`);

  // get the dataset readme
  let readme;
  try {
    readme = await api.getDatasetReadme(selectedBfAccount, selectedBfDataset);
  } catch (error) {
    clientError(error);
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get Readme"]
    );
    return;
  }

  window.logGeneralOperationsForAnalytics(
    "Success",
    window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
    window.AnalyticsGranularity.ACTION,
    ["Get Readme"]
  );

  // create the parsed dataset read me object
  let parsedReadme;
  try {
    parsedReadme = createParsedReadme(readme);
  } catch (error) {
    // log the error and send it to analytics
    window.log.error(error);
    console.error(error);

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Parse Readme"]
    );
    return;
  }

  window.logGeneralOperationsForAnalytics(
    "Success",
    window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
    window.AnalyticsGranularity.ACTION,
    ["Parse Readme"]
  );

  // check if any of the fields have data
  if (
    parsedReadme[requiredSections.studyPurpose] ||
    parsedReadme[requiredSections.dataCollection] ||
    parsedReadme[requiredSections.primaryConclusion]
  ) {
    //if so make the button say edit description
    $("#button-add-description > .btn_animated-inside").html("Edit description");
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
    parsedReadme[requiredSections.studyPurpose].trim().replace(/\r?\n|\r/g, "")
  );

  // place the text into the text area for that field
  $("#ds-description-data-collection").val(
    parsedReadme[requiredSections.dataCollection].trim().replace(/\r?\n|\r/g, "")
  );

  // place the text into the text area for that field
  $("#ds-description-primary-conclusion").val(
    parsedReadme[requiredSections.primaryConclusion].trim().replace(/\r?\n|\r/g, "")
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
  setTimeout(async () => {
    let selectedBfAccount = window.defaultBfAccount;
    let selectedBfDataset = window.defaultBfDataset;

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
    let primaryConclusion = $("#ds-description-primary-conclusion").val().trim();
    primaryConclusion.replace("**Primary Conclusion:**", "");
    if (primaryConclusion.length) {
      requiredFields.push("**Primary Conclusion:** " + primaryConclusion + "\n");
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
      }).then(async (result) => {
        if (!result.isConfirmed) {
          return;
        }
        // hide the warning message if it exists
        $("#ds-isa-warning").css("display", "none");
        await addDescription(selectedBfDataset, requiredFields.join("\n"));
        // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
        window.showPrePublishingStatus();
      });
    } else {
      // hide the warning message if it exists
      $("#ds-isa-warning").css("display", "none");
      // add the user's description to Pennsieve
      await addDescription(selectedBfDataset, requiredFields.join("\n"));
      // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
      window.showPrePublishingStatus();
    }
  }, window.delayAnimation);
});

// closes the warning message that appears when a user has invalid text
$("#ds-close-btn").click(() => {
  $("#ds-isa-warning").css("display", "none");
});

// I: user_markdown_input: A string that holds the user's markdown text.
// Merges user readme file changes with the original readme file.
const addDescription = async (selectedBfDataset, userMarkdownInput) => {
  window.log.info(`Adding description to dataset ${selectedBfDataset}`);

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

  // get the dataset readme
  let readme;
  try {
    readme = await api.getDatasetReadme(window.defaultBfAccount, selectedBfDataset);
  } catch (err) {
    clientError(err);
    Swal.fire({
      title: "Failed to get description!",
      text: userErrorMessage(err),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get Readme"]
    );
    return;
  }

  // strip out the required sections (don't check for errors here because we check for them in showCurrentDescription for the same functions and the same readme)
  readme = stripRequiredSectionFromReadme(readme, requiredSections.studyPurpose);

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  readme = stripRequiredSectionFromReadme(readme, requiredSections.dataCollection);

  // search for the "Primary Conclusion" and basic variations of spacing
  readme = stripRequiredSectionFromReadme(readme, requiredSections.primaryConclusion);

  // remove any invalid text
  readme = stripInvalidTextFromReadme(readme);

  // join the user_markdown_input with untouched sections of the original readme
  // because markdown on the Pennsieve side is strange add two spaces so the curator's notes section does not bold the section directly above it
  let completeReadme = userMarkdownInput + "\n" + "\n" + readme;

  // update the readme file
  try {
    await client.put(
      `/manage_datasets/datasets/${selectedBfDataset}/readme`,
      { updated_readme: completeReadme },
      { params: { selected_account: window.defaultBfAccount } }
    );
  } catch (error) {
    clientError(error);

    // TODO: Fix the error message since this won't be good I don't think
    let emessage = userErrorMessage(error);

    Swal.fire({
      title: "Failed to add description!",
      html: emessage,
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      window.defaultBfDatasetId
    );

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.MANAGE_DATASETS,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.README_TXT,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_id: window.defaultBfDatasetId,
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );

    return;
  }

  window.electron.ipcRenderer.send(
    "track-event",
    "Success",
    window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
    window.defaultBfDatasetId
  );

  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.MANAGE_DATASETS,
    kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
    kombuchaEnums.Label.README_TXT,
    kombuchaEnums.Status.SUCCESS,
    {
      value: 1,
      dataset_id: window.defaultBfDatasetId,
      dataset_int_id: window.defaultBfDatasetIntId,
    }
  );

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
};

// searches the markdown for key sections and returns them as an easily digestible object
// returns: {Study Purpose: text/markdown | "", Data Collection: text/markdown | "", Primary Conclusion: text/markdown | "", invalidText: text/markdown | ""}
const createParsedReadme = (readme) => {
  // read in the readme file and store it in a variable ( it is in markdown )
  let mutableReadme = readme;

  // create the return object
  const parsedReadme = {
    "Study Purpose": "",
    "Data Collection": "",
    "Primary Conclusion": "",
    "invalid text": "",
  };

  // remove the "Study Purpose" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "Study Purpose", parsedReadme);

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "Data Collection", parsedReadme);

  // search for the "Primary Conclusion" and basic variations of spacing
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "Primary Conclusion", parsedReadme);

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
const stripRequiredSectionFromReadme = (readme, sectionName, parsedReadme = undefined) => {
  // lowercase the readme file text to avoid casing issues with pattern matching
  let mutableReadme = readme.trim();

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

  for (endOfSectionIdx = sectionIdx; endOfSectionIdx < mutableReadme.length; endOfSectionIdx++) {
    // check if we found the start of a new section
    if (mutableReadme[endOfSectionIdx] === "*" || endOfSectionIdx === curatorsSectionIdx) {
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
  mutableReadme = mutableReadme.slice(0, sectionIdx) + mutableReadme.slice(endOfSectionIdx);

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
    readme.search(`[*][*]${requiredSections.dataCollection}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[*][*][ ]*:`) !== -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[*][*][ ]*:`) !== -1
  ) {
    throw new Error("There was a problem with reading your description file.");
  }

  // search for the first occurring auxillary section -- this is a user defined section
  let auxillarySectionIdx = readme.search("[*][*].*[ ]*:[*][*]");

  // check if there was an auxillary section found that has a colon before the markdown ends
  if (auxillarySectionIdx !== -1) {
    let auxillarySectionIdxAltFormat = readme.search("[*][*].*[ ]*[*][*][ ]*:");
    // check if there is an auxillary section that comes before the current section that uses alternative common syntax
    if (auxillarySectionIdxAltFormat !== -1 && auxillarySectionIdx > auxillarySectionIdxAltFormat) {
      auxillarySectionIdx = auxillarySectionIdxAltFormat;
    }
  } else {
    // no auxillary section could be found using the colon before the closing markdown sytnatx so try the alternative common syntax
    auxillarySectionIdx = readme.search("[*][*].*[ ]*[*][*][ ]*:");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    let curatorsSectionIdx = readme.search("(---)");
    // check if the curator's section appears before the auxillary section that was found
    if (curatorsSectionIdx !== -1 && auxillarySectionIdx > curatorsSectionIdx) {
      auxillarySectionIdx = curatorsSectionIdx;
    }
  } else {
    // set the auxillary section idx to the start of the curator's section idx
    auxillarySectionIdx = readme.search("(---)");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    // get the text that comes before the auxillary seciton idx
    let invalidText = readme.slice(0, auxillarySectionIdx);

    // if there is no invalid text then parsing is done
    if (!invalidText.length) {
      return readme;
    }

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

  if (!studyPurpose.length || !dataCollection.length || !primaryConclusion.length) {
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
    !hasLineBreak(studyPurpose) && !hasLineBreak(dataCollection) && !hasLineBreak(primaryConclusion)
  );
};

const changeDatasetUnderDD = () => {
  datasetDescriptionFileDataset.value = window.defaultBfDataset;
  showDatasetDescription();
};

///// grab dataset name and auto-load current description
const showDatasetDescription = async () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $("#ds-description").html("");

    setTimeout(() => {
      document.getElementById("description_header_label").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 5);

    return;
  }

  window.log.info(
    `Getting dataset subtitle for showDatasetDescription function for ${selectedBfDataset}.`
  );

  try {
    let subtitle = await api.getDatasetSubtitle(selectedBfAccount, selectedBfDataset);
    window.electron.ipcRenderer.send(
      "track-event",
      "Success",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE + " - Get Subtitle",
      window.defaultBfDatasetId
    );
    $("#ds-description").html(subtitle);

    setTimeout(() => {
      document.getElementById("description_header_label").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 5);
  } catch (error) {
    clientError(error);
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE + " - Get Subtitle",
      window.defaultBfDatasetId
    );
  }

  $("#ds-description").prop("disabled", false);
};

window.getBase64 = async (url) => {
  return await window.electron.ipcRenderer.invoke(
    "get-string-representation-of-buffer",
    url,
    "binary"
  );
};

// function for importing a banner image if one already exists
$("#edit_banner_image_button").click(async () => {
  $("#edit_banner_image_modal").modal("show");
  $("#edit_banner_image_modal").addClass("show");
  let banner_img = $("#para-current-banner-img").text();
  banner_img = banner_img.replace(/\s+/g, "");
  if (banner_img === "None") {
    //Do nothing... regular import
  } else {
    let img_src = $("#current-banner-img").attr("src");
    if (!img_src.includes("https://pennsieve")) {
      img_src = "file://" + img_src;
    }
    let img_base64 = await window.getBase64(img_src); // encode image to base64

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
        window.imageExtension = new_img_src.substring(new_position + 1);

        if (window.imageExtension.toLowerCase() == "png") {
          $("#image-banner").attr("src", "data:image/png;base64," + img_base64);
        } else if (window.imageExtension.toLowerCase() == "jpeg") {
          $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
        } else if (window.imageExtension.toLowerCase() == "jpg") {
          $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
        } else {
          window.log.error(`An error happened: ${img_src}`);
          Swal.fire({
            icon: "error",
            text: "An error occurred when importing the image. Please try again later.",
            showConfirmButton: "OK",
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
          });

          window.logGeneralOperationsForAnalytics(
            "Error",
            window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
            window.AnalyticsGranularity.ALL_LEVELS,
            ["Importing Banner Image"]
          );

          return;
        }
      } else {
        window.log.error(`An error happened: ${img_src}`);

        Swal.fire({
          icon: "error",
          text: "An error occurred when importing the image. Please try again later.",
          showConfirmButton: "OK",
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
        });

        window.logGeneralOperationsForAnalytics(
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          window.AnalyticsGranularity.ALL_LEVELS,
          ["Importing Banner Image"]
        );

        return;
      }
    } else {
      window.log.error(`An error happened: ${img_src}`);

      Swal.fire({
        icon: "error",
        text: "An error occurred when importing the image. Please try again later.",
        showConfirmButton: "OK",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });

      window.logGeneralOperationsForAnalytics(
        "Error",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
        window.AnalyticsGranularity.ALL_LEVELS,
        ["Importing Banner Image"]
      );

      return;
    }

    window.logGeneralOperationsForAnalytics(
      "Success",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      window.AnalyticsGranularity.ACTION,
      ["Importing Banner Image"]
    );

    window.myCropper.destroy();
    window.myCropper = new Cropper(document.getElementById("image-banner"), window.cropOptions);
  }
});

// displays the user selected banner image using Jimp in the edit banner image modal
const displayBannerImage = async (bannerImagePath) => {
  if (bannerImagePath.length > 0) {
    let original_image_path = bannerImagePath[0];
    let image_path = original_image_path;
    let destination_image_path = window.path.join(
      window.homeDirectory,
      "SODA",
      "banner-image-conversion"
    );
    let converted_image_file = window.path.join(destination_image_path, "converted-tiff.jpg");
    let conversion_success = true;
    window.imageExtension = bannerImagePath[0].split(".").pop();

    if (window.imageExtension.toLowerCase() == "tiff") {
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
          if (!window.fs.existsSync(destination_image_path)) {
            window.fs.mkdirSync(destination_image_path);
          }

          try {
            if (window.fs.existsSync(converted_image_file)) {
              window.fs.unlinkSync(converted_image_file);
            }
          } catch (err) {
            conversion_success = false;
            console.error(err);
          }

          return file.write(converted_image_file, async () => {
            if (window.fs.existsSync(converted_image_file)) {
              let stats = window.fs.statSync(converted_image_file);
              let fileSizeInBytes = stats.size;
              let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

              if (fileSizeInMegabytes > 5) {
                window.fs.unlinkSync(converted_image_file);

                await Jimp.read(original_image_path)
                  .then((file) => {
                    return file.resize(1024, 1024).write(converted_image_file, () => {
                      document.getElementById("div-img-container-holder").style.display = "none";
                      document.getElementById("div-img-container").style.display = "block";

                      $("#para-path-image").html(image_path);
                      window.bfViewImportedImage.src = converted_image_file;
                      window.myCropper.destroy();
                      window.myCropper = new Cropper(
                        window.bfViewImportedImage,
                        window.cropOptions
                      );
                      $("#save-banner-image").css("visibility", "visible");
                      $("body").removeClass("waiting");
                    });
                  })
                  .catch((err) => {
                    conversion_success = false;
                    console.error(err);
                  });
                if (window.fs.existsSync(converted_image_file)) {
                  let stats = window.fs.statSync(converted_image_file);
                  let fileSizeInBytes = stats.size;
                  let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                  if (fileSizeInMegabytes > 5) {
                    conversion_success = false;
                    // SHOW ERROR
                  }
                }
              }
              image_path = converted_image_file;
              window.imageExtension = "jpg";
              $("#para-path-image").html(image_path);
              window.bfViewImportedImage.src = image_path;
              window.myCropper.destroy();
              window.myCropper = new Cropper(window.bfViewImportedImage, window.cropOptions);
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
      document.getElementById("div-img-container-holder").style.display = "none";
      document.getElementById("div-img-container").style.display = "block";

      $("#para-path-image").html(image_path);
      window.bfViewImportedImage.src = image_path;
      window.myCropper.destroy();
      window.myCropper = new Cropper(window.bfViewImportedImage, window.cropOptions);

      $("#save-banner-image").css("visibility", "visible");
    }
  } else {
    if ($("#para-current-banner-img").text() === "None") {
      $("#save-banner-image").css("visibility", "hidden");
    } else {
      $("#save-banner-image").css("visibility", "visible");
    }
  }
};

// Action when user click on "Import image" button for banner image
$("#button-import-banner-image").click(async () => {
  $("#para-dataset-banner-image-status").html("");
  let filePaths = await window.electron.ipcRenderer.invoke("open-file-dialog-import-banner-image");
  handleSelectedBannerImage(filePaths, "freeform");
  $("#edit_banner_image_modal").modal("show");
  $("#edit_banner_image_modal").addClass("show");
});

// TODO: Dorian -> Simplify the if statement, redundent code
const uploadBannerImage = async () => {
  $("#para-dataset-banner-image-status").html("Please wait...");
  //Save cropped image locally and check size
  let imageFolder = window.path.join(homeDirectory, "SODA", "banner-image"); //banner will be saved in $HOME/SODA/banner-image
  let imageType = "";

  if (!window.fs.existsSync(imageFolder)) {
    window.fs.mkdirSync(imageFolder, { recursive: true });
  }

  if (window.imageExtension == "png") {
    imageType = "image/png";
  } else {
    imageType = "image/jpeg";
  }

  //creating path of the image and then getting cropped image information
  let imagePath = window.path.join(imageFolder, "banner-image-SODA." + window.imageExtension);
  let croppedImageDataURI = window.myCropper.getCroppedCanvas().toDataURL(imageType);

  imageDataURI.outputFile(croppedImageDataURI, imagePath).then(async () => {
    //image is created here into temp folder
    let image_file_size = window.fs.fileSizeSync(imagePath);

    if (image_file_size < 5 * 1024 * 1024) {
      let selectedBfAccount = window.defaultBfAccount;
      let selectedBfDataset = window.defaultBfDataset;

      try {
        let bf_add_banner = await client.put(
          `/manage_datasets/bf_banner_image`,
          {
            input_banner_image_path: imagePath,
          },
          {
            params: {
              selected_account: selectedBfAccount,
              selected_dataset: selectedBfDataset,
            },
          }
        );
        let res = bf_add_banner.data.message;
        $("#para-dataset-banner-image-status").html(res);

        window.showCurrentBannerImage();

        $("#edit_banner_image_modal").modal("hide");

        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          window.defaultBfDatasetId
        );

        // track the size for all dataset banner uploads
        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          "Size",
          image_file_size
        );

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.BANNER_SIZE,
          kombuchaEnums.Status.SUCCESS,
          {
            value: image_file_size,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );

        // track the size for the given dataset
        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          window.defaultBfDatasetId,
          image_file_size
        );
        //add success toast here
        // create a success notyf for api version check
        notyf.open({
          message: "Banner image uploaded",
          type: "success",
        });

        // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
        window.showPrePublishingStatus();
      } catch (error) {
        clientError(error);
        let emessage = userErrorMessage(error);
        $("#para-dataset-banner-image-status").html(
          "<span style='color: red;'> " + emessage + "</span>"
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          window.defaultBfDatasetId
        );

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.BANNER_SIZE,
          kombuchaEnums.Status.FAIL,
          {
            value: 1,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }
    } else {
      //final size is greater than 5mb so compress image here (image already created and stored in temp file)
      let scaledImagePath = await window.scaleBannerImage(imagePath); //scaled image will be in temp folder
      let image_file_size = window.fs.fileSizeSync(scaledImagePath); //update size for analytics
      try {
        let uploadBannerImage = await client.put(
          `/manage_datasets/bf_banner_image`,
          {
            input_banner_image_path: scaledImagePath,
          },
          {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.defaultBfDataset,
            },
          }
        );
        let bannerImage = uploadBannerImage.data.message;
        $("#para-dataset-banner-image-status").html(bannerImage);

        window.showCurrentBannerImage();

        $("#edit_banner_image_modal").modal("hide");

        notyf.open({
          message: "Banner image uploaded",
          type: "success",
        });

        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          window.defaultBfDatasetId
        );

        // track the size for all dataset banner uploads
        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          "Size",
          image_file_size
        );

        // track the size for the given dataset
        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          window.defaultBfDatasetId,
          image_file_size
        );

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.BANNER_SIZE,
          kombuchaEnums.Status.SUCCESS,
          {
            value: image_file_size,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      } catch (error) {
        clientError(error);

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          window.defaultBfDatasetId
        );

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.BANNER_SIZE,
          kombuchaEnums.Status.FAIL,
          {
            value: 1,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }
    }
  });
};

$("#save-banner-image").click((event) => {
  //save button for banner image (need on the size of the cropped image)
  //window.bfViewImportedImage holds the entire image
  $("#para-dataset-banner-image-status").html("");
  if (window.bfViewImportedImage.src.length > 0) {
    if (window.formBannerHeight.value > 511) {
      Swal.fire({
        icon: "warning",
        text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        //then check if height is more than 2048 and handle accordingly
        if (window.formBannerHeight.value < 1024) {
          Swal.fire({
            icon: "warning",
            text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${window.formBannerHeight.value} px. Would you like to continue?`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            reverseButtons: window.reverseSwalButtons,
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
        } else if (window.formBannerHeight.value > 2048) {
          Swal.fire({
            icon: "warning",
            text: `Your cropped image is ${window.formBannerHeight.value} px and is bigger than the 2048px standard. Would you like to scale this image down to fit the entire cropped image?`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            reverseButtons: window.reverseSwalButtons,
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

window.showCurrentBannerImage = async () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    $("#banner_image_loader").hide();

    window.bfCurrentBannerImg.src = "";
    document.getElementById("para-current-banner-img").innerHTML = "None";
    window.bfViewImportedImage.src = "";

    $("#div-img-container-holder").css("display", "block");
    $("#div-img-container").css("display", "none");
    $("#save-banner-image").css("visibility", "hidden");

    window.myCropper.destroy();

    return;
  }

  window.log.info(`Getting current banner image for dataset ${selectedBfDataset}`);

  $("#banner_image_loader").show();

  document.getElementById("para-current-banner-img").innerHTML = "";

  try {
    let res = await api.getDatasetBannerImageURL(selectedBfAccount, selectedBfDataset);
    window.logGeneralOperationsForAnalytics(
      "Success",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      window.AnalyticsGranularity.ACTION,
      ["Get Banner Image"]
    );

    if (res === "No banner image") {
      window.bfCurrentBannerImg.src = "";
      document.getElementById("para-current-banner-img").innerHTML = "None";
      window.bfViewImportedImage.src = "";

      $("#div-img-container-holder").css("display", "block");
      $("#div-img-container").css("display", "none");
      $("#save-banner-image").css("visibility", "hidden");

      window.myCropper.destroy();
    } else {
      document.getElementById("para-current-banner-img").innerHTML = "";
      window.bfCurrentBannerImg.src = res;
    }
    $("#banner_image_loader").hide();
  } catch (error) {
    clientError(error);
    $("#banner_image_loader").hide();

    window.bfCurrentBannerImg.src = "assets/img/no-banner-image.png";
    document.getElementById("para-current-banner-img").innerHTML = "None";
    window.bfViewImportedImage.src = "";

    $("#div-img-container-holder").css("display", "block");
    $("#div-img-container").css("display", "none");
    $("#save-banner-image").css("visibility", "hidden");

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get Banner Image"]
    );

    window.myCropper.destroy();
  }
};

// Add tags //

// add or edit metadata tags for a user's selected dataset in the "add/edit tags" section of the manage-dataset menu
$("#button-add-tags").click(async () => {
  Swal.fire({
    title: determineSwalLoadingMessage($("#button-add-tags")),
    html: "Please wait...",
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
  const tags = Array.from(window.datasetTagsTagify.getTagElms()).map((tag) => {
    return tag.textContent;
  });

  // get the name of the currently selected dataset
  let selectedBfDataset = window.defaultBfDataset;

  // Add tags to dataset
  try {
    await client.put(
      `/manage_datasets/datasets/${selectedBfDataset}/tags`,
      { tags },
      {
        params: {
          selected_account: window.defaultBfAccount,
        },
      }
    );
  } catch (e) {
    clientError(e);
    // alert the user of the error
    Swal.fire({
      title: "Failed to edit your dataset tags!",
      icon: "error",
      html: userErrorMessage(e),
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
      window.defaultBfDatasetId
    );

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.MANAGE_DATASETS,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.TAGS,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_id: window.defaultBfDatasetId,
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );

    // halt execution
    return;
  }
  // show success or failure to the user in a popup message
  await Swal.fire({
    title: determineSwalSuccessMessage($("#button-add-tags")),
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });

  window.electron.ipcRenderer.send(
    "track-event",
    "Success",
    window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
    window.defaultBfDatasetId
  );

  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.MANAGE_DATASETS,
    kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
    kombuchaEnums.Label.TAGS,
    kombuchaEnums.Status.SUCCESS,
    {
      value: 1,
      dataset_id: window.defaultBfDatasetId,
      dataset_int_id: window.defaultBfDatasetIntId,
    }
  );

  // run the pre-publishing checklist items to update the list found in the "Submit for pre-publishing review" section/card
  window.showPrePublishingStatus();

  //check if tags array is empty and set Add/Edit tags appropriately
  tags === undefined || tags.length == 0
    ? $("#button-add-tags").html("Add tags")
    : $("#button-add-tags").html("Edit tags");
});

// fetch a user's metadata tags
// this function fires from two events:
//    1. when a user clicks on the pencil icon to view their list of datasets in any of the manage-dataset sections
//    2. after the user selects a dataset from the very same dropdown list
window.showCurrentTags = async () => {
  var selectedBfAccount = window.defaultBfAccount;
  var selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    // this code executes when the pencil icon that allows a user to select a dataset is clicked in the tags section
    // for now do nothing
    return;
  }

  window.log.info(`Getting current tags for dataset ${selectedBfDataset}`);

  // remove all of the tags from the current input
  window.datasetTagsTagify.removeAllTags();

  // make the tags input display a loading spinner after a user selects a new dataset
  window.datasetTagsTagify.loading(true);

  // get the tags from the Pennsieve API
  let tagsResponse;
  try {
    tagsResponse = await client.get(`/manage_datasets/datasets/${selectedBfDataset}/tags`, {
      params: { selected_account: selectedBfAccount },
    });
  } catch (e) {
    clientError(e);
    // alert the user of the error
    Swal.fire({
      title: "Failed to retrieve your selected dataset!",
      icon: "error",
      text: userErrorMessage(e),
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get Tags"]
    );

    // stop the loader -- no data can be fetched for this dataset
    window.datasetTagsTagify.loading(false);

    // halt execution
    return;
  }

  let { tags } = tagsResponse.data;

  if (tags === undefined || tags.length == 0) {
    //if so make the button say add tags
    $("#button-add-tags").html("Add tags");
  } else {
    //make the button say edit tags
    $("#button-add-tags").html("Edit tags");
  }

  // stop displaying the tag loading spinner
  window.datasetTagsTagify.loading(false);

  // display the retrieved tags
  window.datasetTagsTagify.addTags(tags);
};

// Add license //
$("#button-add-license").click(async () => {
  setTimeout(async function () {
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

    let selectedBfAccount = window.defaultBfAccount;
    let selectedBfDataset = window.defaultBfDataset;
    let selectedLicense = "Creative Commons Attribution";

    window.log.info(`Adding license to selected dataset ${selectedBfDataset}`);
    try {
      await client.put(
        `/manage_datasets/bf_license`,
        {
          input_license: selectedLicense,
        },
        {
          params: {
            selected_account: selectedBfAccount,
            selected_dataset: selectedBfDataset,
          },
        }
      );

      Swal.fire({
        title: "Successfully added license to dataset!",
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      window.showCurrentLicense();

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
        window.defaultBfDatasetId
      );

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
        kombuchaEnums.Label.LICENSE,
        kombuchaEnums.Status.SUCCESS,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
      window.showPrePublishingStatus();
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      Swal.fire({
        title: "Failed to add the license to your dataset!",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      window.electron.ipcRenderer.send(
        "track-event",
        "Error",
        window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
        window.defaultBfDatasetId
      );

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
        kombuchaEnums.Label.LICENSE,
        kombuchaEnums.Status.FAIL,
        {
          value: 1,
          dataset_id: window.defaultBfDatasetId,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );
    }
  }, window.delayAnimation);
});

window.showCurrentLicense = async () => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    window.currentDatasetLicense.innerHTML = "None";
    return;
  }

  window.currentDatasetLicense.innerHTML = `Loading current license... <div class="ui active green inline loader tiny"></div>`;
  window.log.info(`Getting current license for dataset ${selectedBfDataset}`);

  try {
    let bf_get_license = await client.get(`/manage_datasets/bf_license`, {
      params: {
        selected_account: selectedBfAccount,
        selected_dataset: selectedBfDataset,
      },
    });
    let { license } = bf_get_license.data;
    window.currentDatasetLicense.innerHTML = license;

    let licenseContainer = document.getElementById("license-lottie-div");
    if (licenseContainer.children.length < 1) {
      // licenseContainer.removeChild(licenseContainer.children[1]);
      lottie.loadAnimation({
        container: licenseContainer,
        animationData: licenseLottie,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
    }

    if (license === "Creative Commons Attribution") {
      $("#button-add-license").hide();
      $("#assign-a-license-header").hide();

      licenseContainer.style.display = "block";
      document.getElementById("license-assigned").style.display = "block";
    } else {
      $("#button-add-license").show();
      $("#assign-a-license-header").show();
      document.getElementById("license-assigned").style.display = "none";
      licenseContainer.style.display = "none";
    }
  } catch (error) {
    clientError(error);
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get License"]
    );
  }
};

// verify the dataset is valid before allowing a user to upload
const handleSelectedSubmitDirectory = async (filepath) => {
  if (filepath != null && filepath.length > 0) {
    $("#selected-local-dataset-submit").attr("placeholder", `${filepath[0]}`);

    let valid_dataset = window.verify_sparc_folder(filepath[0], "pennsieve");

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
        text: "This folder does not seem to be a SPARC dataset folder. Are you sure you want to proceed?",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        reverseButtons: window.reverseSwalButtons,
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
          $("#input-destination-getting-started-locally").attr("placeholder", "Browse here");
          $("#selected-local-dataset-submit").attr("placeholder", "Browse here");
        }
      });
    }
  }
};

$("#selected-local-dataset-submit").click(async () => {
  let datasetDirectory = await window.electron.ipcRenderer.invoke(
    "open-file-dialog-submit-dataset"
  );
  handleSelectedSubmitDirectory(datasetDirectory);
});

const walk = (directory, filepaths = []) => {
  const files = window.fs.readdirSync(directory);
  for (let filename of files) {
    const filepath = window.path.join(directory, filename);
    if (window.fs.isDirectorySync(filepath)) {
      walk(filepath, filepaths);
    } else {
      filepaths.push(filepath);
    }
  }
  return filepaths;
};

const logFilesForUpload = (upload_folder_path) => {
  const foundFiles = walk(upload_folder_path);
  foundFiles.forEach((item) => {
    window.log.info(item);
  });
};

window.resetUploadLocalDataset = async () => {
  let uploadLocalDatasetParentTab = document.querySelector("#upload_local_dataset_parent-tab");

  const { value: result } = await Swal.fire({
    title: "Reset your progress?",
    icon: "warning",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (!result) {
    return;
  }

  // remove the show class from all child elements except for the first two
  for (let i = 2; i < uploadLocalDatasetParentTab.children.length; i++) {
    uploadLocalDatasetParentTab.children[i].classList.remove("show");
  }

  // hide the upload button
  $("#button-submit-dataset").hide();

  // reset the input text original text
  document.querySelector("#selected-local-dataset-submit").placeholder = "Select a folder";
};

$("#button-submit-dataset").click(async () => {
  // When true it will prevent duplicate file counts from being sent to analytics
  let finalFilesSent = false;
  let finalBytesSent = false;

  const progressfunction = (kombuchaEnums) => {
    $("#upload_local_dataset_progress_div")[0].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    const fillProgressBar = (progressResponse) => {
      let progressData = progressResponse.data;
      statusMessage = progressData["progress"];
      completionStatus = progressData["submit_dataset_status"];
      let submitprintstatus = progressData["submit_print_status"];
      totalFileSize = progressData["total_file_size"];
      let totalUploadedFileSize = progressData["upload_file_size"];
      let fileUploadStatus = progressData["files_uploaded_status"];
      let totalFilesUploaded = progressData["uploaded_files"];

      if (submitprintstatus === "Uploading") {
        logProgressToAnalytics(totalFilesUploaded, totalUploadedFileSize);

        $("#div-progress-submit").css("display", "block");
        if (completionStatus == "Done") {
          window.progressBarUploadBf.value = 100;
          cloneMeter.value = 100;

          $("#para-please-wait-manage-dataset").html("");
          $("#para-progress-bar-status").html(statusMessage + window.smileyCan);
          cloneStatus.innerHTML = statusMessage + window.smileyCan;

          // log the last batch of files uploaded if the difference between the last batch and the total files uploaded is not 0
          let finalFilesCount = totalFilesUploaded - filesOnPreviousLogPage;
          let differenceInBytes = totalUploadedFileSize - bytesOnPreviousLogPage;
          if (finalFilesCount > 0 && !finalFilesSent) {
            window.electron.ipcRenderer.send(
              "track-kombucha",
              kombuchaEnums.Category.MANAGE_DATASETS,
              kombuchaEnums.Action.GENERATE_DATASET,
              kombuchaEnums.Label.FILES,
              kombuchaEnums.Status.SUCCESS,
              createEventData(finalFilesCount, "Pennsieve", "Local", window.defaultBfDataset)
            );
            finalFilesSent = true;
          }

          if (differenceInBytes > 0 && !finalBytesSent) {
            window.electron.ipcRenderer.send(
              "track-kombucha",
              kombuchaEnums.Category.MANAGE_DATASETS,
              kombuchaEnums.Action.GENERATE_DATASET,
              kombuchaEnums.Label.SIZE,
              kombuchaEnums.Status.SUCCESS,
              createEventData(differenceInBytes, "Pennsieve", "Local", window.defaultBfDataset)
            );
            finalBytesSent = true;
          }
        } else {
          let value = (totalUploadedFileSize / totalFileSize) * 100;

          window.progressBarUploadBf.value = value;
          cloneMeter.value = value;
          let totalSizePrint = "";

          if (totalFileSize < window.displaySIze) {
            totalSizePrint = totalFileSize.toFixed(2) + " B";
          } else if (totalFileSize < window.displaySIze * window.displaySIze) {
            totalSizePrint = (totalFileSize / window.displaySIze).toFixed(2) + " KB";
          } else if (totalFileSize < window.displaySIze * window.displaySIze * window.displaySIze) {
            totalSizePrint =
              (totalFileSize / window.displaySIze / window.displaySIze).toFixed(2) + " MB";
          } else {
            totalSizePrint =
              (
                totalFileSize /
                window.displaySIze /
                window.displaySIze /
                window.displaySIze
              ).toFixed(2) + " GB";
          }

          $("#para-please-wait-manage-dataset").html("");
          // cloneStatus.innerHTML = "Progress: " + value.toFixed(2) + "%";
          if (statusMessage.indexOf("<br")) {
            let timeIndex = statusMessage.indexOf("<br");
            let timePhrase = statusMessage.substring(timeIndex);
            cloneStatus.innerHTML = "Progress: " + value.toFixed(2) + "%" + timePhrase;
          }
          $("#para-progress-bar-status").html(
            fileUploadStatus +
              statusMessage +
              "Progress: " +
              value.toFixed(2) +
              "%" +
              " (total size: " +
              totalSizePrint +
              ")"
          );
        }
      }
    };

    client
      .get("/manage_datasets/datasets/upload_progress")
      .then((progressResponse) => fillProgressBar(progressResponse, kombuchaEnums))
      .catch((error) => {
        clientError(error);
        let emessage = userErrorMessage(error);
        const kombuchaEventData = {
          value: emessage,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.PROGRESS_TRACK,
          kombuchaEnums.Status.FAIL,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
            ` - Progress track`,
          window.defaultBfDatasetId
        );

        // Enable curation buttons
        organizeDatasetButton.disabled = false;
        guidedModeHomePageButton.disabled = false;

        guidedModeHomePageButton.className = "button-prompt-container";
        organizeDatasetButton.className = "btn_animated generate-btn";
        organzieDatasetButtonDiv.className = "btn_animated-inside";

        organizeDatasetButton.style =
          "margin: 5px; width: 120px; height: 40px; font-size: 15px; border: none !important;";

        $("#para-progress-bar-error-status").html(
          "<span style='color: red;'>" + emessage + window.sadCan + "</span>"
        );
        Swal.fire({
          icon: "error",
          title: "An Error Occurred While Uploading Your Dataset",
          html: "Check the error text in the Upload Local Dataset's upload page to see what went wrong.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
          didOpen: () => {
            document.getElementById("swal2-html-container").style.maxHeight = "19rem";
            document.getElementById("swal2-html-container").style.overflowY = "auto";
          },
        }).then((result) => {
          progressClone.remove();
          sparc_logo.style.display = "inline";
          if (result.isConfirmed) {
            returnPage.click();
          }
        });
      });

    if (completionStatus === "Done") {
      countDone++;

      if (countDone > 1) {
        window.log.info("Done submit track");
        if (success_upload === true) {
          // Enable curation buttons
          organizeDatasetButton.disabled = false;
          guidedModeHomePageButton.disabled = false;

          guidedModeHomePageButton.className = "button-prompt-container";
          organizeDatasetButton.className = "btn_animated generate-btn";
          organzieDatasetButtonDiv.className = "btn_animated-inside";

          organizeDatasetButton.style =
            "margin: 5px; width: 120px; height: 40px; font-size: 15px; border: none !important;";

          // Announce success to User
          window.uploadComplete.open({
            type: "success",
            message: "Upload to Pennsieve completed",
          });
          window.dismissStatus(progressClone.id);
          progressClone.remove();
          sparc_logo.style.display = "inline";
        }

        if (statusMessage.includes("Success: COMPLETED")) {
          const kombuchaEventData = {
            value: statusMessage,
            dataset_id: window.defaultBfDatasetId,
            dataset_name: window.defaultBfDataset,
            dataset_int_id: window.defaultBfDatasetIntId,
          };

          window.electron.ipcRenderer.send(
            "track-kombucha",
            kombuchaEnums.Category.MANAGE_DATASETS,
            kombuchaEnums.Action.GENERATE_DATASET,
            kombuchaEnums.Label.PROGRESS_TRACK,
            kombuchaEnums.Status.SUCCESS,
            kombuchaEventData
          );
        }

        clearInterval(timerProgress);

        $("#para-please-wait-manage-dataset").html("");

        $("#button-submit-dataset").prop("disabled", false);
        $("#selected-local-dataset-submit").prop("disabled", false);

        // Remove <br> from the statusMessage text
        let eventValue = statusMessage.replace(/<br>/g, "");
        const kombuchaEventData = {
          value: eventValue,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.PROGRESS_TRACK,
          kombuchaEnums.Status.SUCCESS,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Success",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
            ` - Progress track`,
          window.defaultBfDatasetId
        );
      }
    }
  };

  let bytesOnPreviousLogPage = 0;
  let filesOnPreviousLogPage = 0;
  const logProgressToAnalytics = (files, bytes) => {
    // log every 500 files -- will log on success/failure as well so if there are less than 500 files we will log what we uploaded ( all in success case and some of them in failure case )
    if (files >= filesOnPreviousLogPage + 500) {
      filesOnPreviousLogPage += 500;
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.FILES,
        kombuchaEnums.Status.SUCCESS,
        createEventData(500, "Pennsieve", "Local", window.defaultBfDataset)
      );

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE + "- Step 7 - Generate - Dataset - Number of Files",
        `${datasetUploadSession.id}`,
        500
      );

      let differenceInBytes = bytes - bytesOnPreviousLogPage;
      bytesOnPreviousLogPage = bytes;
      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        PrepareDatasetsAnalyticsPrefix.CURATE + " - Step 7 - Generate - Dataset - Size",
        `${datasetUploadSession.id}`,
        differenceInBytes
      );

      if (differenceInBytes > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.SIZE,
          kombuchaEnums.Status.SUCCESS,
          createEventData(differenceInBytes, "Pennsieve", "Local", window.defaultBfDataset)
        );
      }
    }
  };

  // Check if dataset is locked before starting upload
  const isLocked = await api.isDatasetLocked(window.defaultBfAccount, window.defaultBfDataset);
  if (isLocked) {
    $("#upload_local_dataset_progress_div").removeClass("show");
    await Swal.fire({
      icon: "info",
      title: `${window.defaultBfDataset} is locked from editing`,
      html: `
        This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
        <br />
        <br />
        If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a target="_blank" href="mailto:curation@sparc.science">curation@sparc.science.</a>
      `,
      width: 600,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      focusConfirm: true,
      allowOutsideClick: false,
    });

    return;
  }

  // Create a clone of the progress bar for the navigation menu
  let progressSubmit = document.getElementById("div-progress-submit");
  let navContainer = document.getElementById("nav-items");
  let progressError = document.getElementById("para-progress-bar-error-status");

  let progressClone = progressSubmit.cloneNode(true);
  let cloneHeader = progressClone.children[0];
  progressClone.children[2].remove();
  cloneHeader.style = "margin: 0;";
  let cloneMeter = progressClone.children[1];
  let cloneStatus = progressClone.children[2];
  let navError = progressError.cloneNode(true);
  let organizeDatasetButton = document.getElementById("button-generate");
  let guidedModeHomePageButton = document.getElementById("button-homepage-guided-mode");
  let organzieDatasetButtonDiv = organizeDatasetButton.children[0];
  let returnButton = document.createElement("button");
  let returnPage = document.getElementById("upload_local_dataset_btn");

  progressClone.style =
    "position: absolute; width: 100%; bottom: 0px; padding: 15px; color: black;";
  cloneMeter.setAttribute("id", "clone-progress-bar-upload-bf");
  cloneMeter.className = "nav-status-bar";
  cloneStatus.setAttribute("id", "clone-para-progress-bar-status");
  cloneStatus.style = "overflow-x: hidden; margin-bottom: 3px; margin-top: 5px;";
  progressClone.setAttribute("id", "nav-progress-submit");
  returnButton.type = "button";
  returnButton.id = "returnButton";
  returnButton.innerHTML = "Return to progress";
  returnButton.onclick = function () {
    document.getElementById("upload_local_dataset_progress_div").style.display = "flex";
    returnPage.click();
  };
  progressClone.appendChild(returnButton);

  // Disable the organize dataset button
  guidedModeHomePageButton.disabled = true;
  organizeDatasetButton.disabled = true;

  // Change the color of the buttons to look disabled
  guidedModeHomePageButton.className = "button-prompt-container curate-disabled-button";
  organizeDatasetButton.className = "disabled-generate-button";

  organizeDatasetButton.style = "background-color: #f6f6f6";

  // guidedModeHomePageButton.className = "disabled-animated-div";
  organzieDatasetButtonDiv.className = "disabled-animated-div";

  // reset the progress bar and progress text
  window.progressBarUploadBf.value = 0;
  cloneMeter.value = 0;

  $("#para-please-wait-manage-dataset").html("Please wait...");
  $("#para-progress-bar-error-status").html("");

  $("#button-submit-dataset").prop("disabled", true);
  $("#selected-local-dataset-submit").prop("disabled", true);
  $("#button-submit-dataset").popover("hide");
  $("#progress-bar-status").html("Preparing files ...");

  // make the button unclickable until the preflight checks fail or pass
  $("#button-submit-dataset").attr("disabled", true);
  $("#para-please-wait-manage-dataset").html("Please wait while we verify a few things...");
  $("#para-progress-bar-status").html("");

  let supplementary_checks = await window.run_pre_flight_checks(false);
  if (!supplementary_checks) {
    // hide the progress bar as an upload will not occur yet
    $("#upload_local_dataset_progress_div").hide();
    $("#button-submit-dataset").attr("disabled", false);
    return;
  }

  $("#button-submit-dataset").css("display", "none");

  // $("#button-submit-dataset").attr("disabled", false);

  $("#upload_local_dataset_progress_div").show();

  var totalFileSize;
  var err = false;
  var completionStatus = "Solving";
  var success_upload = true;
  var selectedbfaccount = window.defaultBfAccount;
  var selectedbfdataset = window.defaultBfDataset;

  window.log.info("Files selected for upload:");
  logFilesForUpload(window.pathSubmitDataset.placeholder);

  // start the upload session
  datasetUploadSession.startSession();

  // Questions logs need to answer:
  // Which sessions failed? How many files were they attempting to upload per session? How many files were uploaded?
  // How many pennsieve datasets were involved in a failed upload? Successful upload?
  let sparc_logo = document.getElementById("sparc-logo-container");
  sparc_logo.style.display = "none";
  navContainer.appendChild(progressClone);
  cloneStatus.innerHTML = "Please wait...";
  document.getElementById("para-progress-bar-status").innerHTML = "";
  let navbar = document.getElementById("main-nav");
  if (navbar.classList.contains("active")) {
    document.getElementById("sidebarCollapse").click();
  }

  client
    .put(
      `/manage_datasets/datasets`,
      { filepath: window.pathSubmitDataset.placeholder },
      {
        params: {
          selected_account: selectedbfaccount,
          selected_dataset: selectedbfdataset,
        },
        timeout: 0,
      }
    )
    .then(async () => {
      $("#upload_local_dataset_progress_div")[0].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.log.info("Completed submit function");

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.TOTAL_UPLOADS,
        kombuchaEnums.Status.SUCCESS,
        createEventData(1, "Pennsieve", "Local", window.defaultBfDataset)
      );

      // hide the Upload dataset button to make sure that it isn't clickable until the user selects another dataset to upload
      $("#button-submit-dataset").hide();

      let getFilesFoldersResponse;
      try {
        getFilesFoldersResponse = await client.get(
          `/manage_datasets/get_number_of_files_and_folders_locally`,
          { params: { filepath: window.pathSubmitDataset.placeholder } }
        );
      } catch (error) {
        clientError(error);
        const kombuchaEventData = {
          value: datasetUploadSession.id,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.FOLDERS,
          kombuchaEnums.Status.FAIL,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
            ` - Number of Folders`,
          `${datasetUploadSession.id}`
        );
        return;
      }

      let { data } = getFilesFoldersResponse;

      let num_of_folders = data["totalDir"];

      // log amount of folders uploaded in the given session
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.FOLDERS,
        kombuchaEnums.Status.SUCCESS,
        {
          value: num_of_folders,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          upload_session: datasetUploadSession.id,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );
    })
    .catch(async (error) => {
      clientError(error);
      let emessage = userErrorMessage(error);

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.TOTAL_UPLOADS,
        kombuchaEnums.Status.FAIL,
        createEventData(1, "Pennsieve", "Local", window.defaultBfDataset)
      );

      $("#para-please-wait-manage-dataset").html("");
      $("#para-progress-bar-status").html("");
      cloneStatus.innerHTML = "";
      $("#div-progress-submit").css("display", "none");
      // document.getElementById("para-progress-bar-error-status").style = "color: red";
      // document.getElementById("para-progress-bar-error-status").innerHTML = emessage;
      success_upload = false;
      organizeDatasetButton.disabled = false;
      guidedModeHomePageButton.disabled = false;

      guidedModeHomePageButton.className = "button-prompt-container";
      organizeDatasetButton.className = "btn_animated generate-btn";
      organzieDatasetButtonDiv.className = "btn_animated-inside";

      organizeDatasetButton.style =
        "margin: 5px; width: 120px; height: 40px; font-size: 15px; border: none !important;";

      Swal.fire({
        icon: "error",
        title: "There was an issue uploading your dataset",
        html: emessage,
        allowOutsideClick: false,
        didOpen: () => {
          document.getElementById("swal2-html-container").style.maxHeight = "19rem";
          document.getElementById("swal2-html-container").style.overflowY = "auto";
        },
      }).then((result) => {
        progressClone.remove();
        sparc_logo.style.display = "inline";
        if (result.isConfirmed) {
          returnPage.click();
        }
      });

      //progressClone.remove();
      window.progressBarUploadBf.value = 0;
      cloneMeter.value = 0;

      err = true;

      // while sessions are used for tracking file count and file size for an upload
      // we still want to know what dataset didn't upload by its pennsieve ID
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.SIZE,
        kombuchaEnums.Status.FAIL,
        {
          value: totalFileSize,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      let getFilesFoldersResponse;
      try {
        getFilesFoldersResponse = await client.get(
          `/manage_datasets/get_number_of_files_and_folders_locally`,
          { params: { filepath: window.pathSubmitDataset.placeholder } }
        );
      } catch (error) {
        clientError(error);
        return;
      }

      let { data } = getFilesFoldersResponse;

      let num_of_files = data["totalFiles"];
      let num_of_folders = data["totalDir"];

      // log amount of folders uploaded in the given session
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.FOLDERS,
        kombuchaEnums.Status.FAIL,
        {
          value: num_of_folders,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      // track total amount of files being uploaded
      // makes it easy to see aggregate amount of files we failed to upload in Local Dataset
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.MANAGE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.FILES,
        kombuchaEnums.Status.FAIL,
        {
          value: num_of_files,
          dataset_id: window.defaultBfDatasetId,
          dataset_name: window.defaultBfDataset,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      $("#upload_local_dataset_progress_div")[0].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      $("#button-submit-dataset").prop("disabled", false);
      $("#selected-local-dataset-submit").prop("disabled", false);
    });

  var countDone = 0;
  var timerProgress = setInterval(() => progressfunction(kombuchaEnums), 1000);
  let statusMessage = "Error";

  let uploadErrorChildren = document.querySelector("#para-progress-bar-error-status").childNodes;
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

$("body").on("change", "input[type=radio][name=dataset_status_radio]", function () {
  $("#bf_list_dataset_status").val(this.value).trigger("change");
});

// Change dataset status option change
$("#bf_list_dataset_status").on("change", async () => {
  $(window.bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");

  window.selectOptionColor(window.bfListDatasetStatus);

  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;
  let selectedStatusOption =
    window.bfListDatasetStatus.options[window.bfListDatasetStatus.selectedIndex].text;

  window.log.info(`Changing dataset status to ${selectedStatusOption}`);

  try {
    let bf_change_dataset_status = await client.put(`/manage_datasets/bf_dataset_status`, {
      selected_bfaccount: selectedBfAccount,
      selected_bfdataset: selectedBfDataset,
      selected_status: selectedStatusOption,
    });
    let res = bf_change_dataset_status.data.message;

    window.electron.ipcRenderer.send(
      "track-event",
      "Success",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS,
      window.defaultBfDatasetId
    );

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.MANAGE_DATASETS,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.STATUS,
      kombuchaEnums.Status.SUCCESS,
      {
        value: selectedStatusOption,
        dataset_id: window.defaultBfDatasetId,
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );

    $(window.bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    Swal.fire({
      title: res,
      icon: "success",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  } catch (error) {
    clientError(error);
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS,
      window.defaultBfDatasetId
    );

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.MANAGE_DATASETS,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.STATUS,
      kombuchaEnums.Status.FAIL,
      {
        value: selectedStatusOption,
        dataset_id: window.defaultBfDatasetId,
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );

    var emessage = userErrorMessage(error);

    function showErrorDatasetStatus() {
      Swal.fire({
        title: "Failed to change dataset status!",
        html: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      $(window.bfCurrentDatasetStatusProgress).css("visibility", "hidden");
      $("#bf-dataset-status-spinner").css("display", "none");
    }

    window.showCurrentDatasetStatus(showErrorDatasetStatus);
  }
});

window.showCurrentDatasetStatus = async (callback) => {
  let selectedBfAccount = window.defaultBfAccount;
  let selectedBfDataset = window.defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    $(window.bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    window.removeOptions(window.bfListDatasetStatus);
    removeRadioOptions("dataset_status_ul");

    window.bfListDatasetStatus.style.color = "black";

    return;
  }

  window.log.info(`Showing current dataset status for ${selectedBfDataset}`);

  try {
    let bf_dataset_status = await client.get(`/manage_datasets/bf_dataset_status`, {
      params: {
        selected_dataset: selectedBfDataset,
        selected_account: selectedBfAccount,
      },
    });
    let res = bf_dataset_status.data;
    window.electron.ipcRenderer.send(
      "track-event",
      "Success",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS + ` - Get dataset Status`,
      window.defaultBfDatasetId
    );

    window.removeOptions(window.bfListDatasetStatus);
    removeRadioOptions("dataset_status_ul");

    for (let item in res["status_options"]) {
      let option = document.createElement("option");

      option.textContent = res["status_options"][item]["displayName"];
      option.value = res["status_options"][item]["name"];
      option.style.color = res["status_options"][item]["color"];

      window.bfListDatasetStatus.appendChild(option);

      addRadioOption(
        "dataset_status_ul",
        res["status_options"][item]["displayName"],
        res["status_options"][item]["name"]
      );
    }
    window.bfListDatasetStatus.value = res["current_status"];

    $(`input[name=dataset_status_radio][value=${res["current_status"]}]`).prop("checked", true);

    window.selectOptionColor(window.bfListDatasetStatus);

    $(window.bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    if (callback !== undefined) {
      callback();
    }
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Failed to change dataset status!",
      html: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    window.logGeneralOperationsForAnalytics(
      "Error",
      window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Get Dataset Status"]
    );

    $(window.bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");
  }
};
