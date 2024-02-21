// Purpose: Contains functions for handling workspace switching and related UI changes.

/**
 *
 * @param {*} selectedWorkspace : string - the workspace a user wants to swith to
 * @param {*} ev : event - event that triggered the prompt; useful within workspace selection from opendropdown prompt flows
 * @returns void if no workspace was selected or the selected workspace as a string
 *
 * Change workspace to the selected workspace from the list of workspaces the user has permission to access.
 */
window.switchWorkspace = async (selectedWorkspace, ev = null) => {
  if (dropdownEventID === "dd-select-pennsieve-organization") {
    $("#ds-name").val(window.bfOrganization);
    $("#ds-description").val = $("#bf-dataset-subtitle").val;
    $("body").removeClass("waiting");
    $(".svg-change-current-account.dataset").css("display", "block");
    dropdownEventID = "";
    return;
  }

  window.refreshOrganizationList();
  $("#dataset-loaded-message").hide();

  showHideDropdownButtons("organization", "show");
  document.getElementById("div-rename-bf-dataset").children[0].style.display = "flex";

  // rejoin test organiztion
  const { value: res } = await Swal.fire({
    allowOutsideClick: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "Cancel",
    confirmButtonText: "Switch Workspace",
    showCloseButton: false,
    focusConfirm: false,
    heightAuto: false,
    reverseButtons: window.reverseSwalButtons,
    showCancelButton: true,
    title: `<h3 style="text-align:center">To switch your workspace please provide your email and password</h3><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`,
    html: `<input type="text" id="ps_login" class="swal2-input" placeholder="Email Address for Pennsieve">
            <input type="password" id="ps_password" class="swal2-input" placeholder="Password">
            <p class="tip-content"> If you are using ORCID to sign in to Pennsieve view the official SODA docs <a href="https://docs.sodaforsparc.io/docs/how-to/how-to-use-workspaces" target="_blank">here</a> to learn how to change your workspace in SODA. </p>`,
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    didOpen: () => {
      $(".swal-popover").popover();
      let div_footer = document.getElementsByClassName("swal2-footer")[0];
      document.getElementsByClassName("swal2-popup")[0].style.width = "43rem";
      div_footer.style.flexDirection = "column";
      div_footer.style.alignItems = "center";
    },
    preConfirm: async () => {
      const login = Swal.getPopup().querySelector("#ps_login").value;
      const password = Swal.getPopup().querySelector("#ps_password").value;

      // show a loading spinner in place of the confirm button HERE
      // $(".ui.active.green.inline.loader.small.organization-loader").css("display", "block");
      Swal.showLoading();

      if (!login) {
        Swal.showValidationMessage("Please enter your email!");
        Swal.hideLoading();
        return undefined;
      }

      if (!password) {
        Swal.showValidationMessage("Please enter your password!");
        Swal.hideLoading();
        return undefined;
      }

      try {
        let organizationId = window.organizationNameToIdMapping[selectedWorkspace];
        let machineUsernameSpecifier = await window.electron.ipcRenderer.invoke(
          "get-nodestorage-item",
          window.os.userInfo().username
        );
        await api.setPreferredOrganization(
          login,
          password,
          organizationId,
          machineUsernameSpecifier
        );
      } catch (err) {
        clientError(err);
        await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          icon: "error",
          title: "Could Not Switch Organizations",
          text: "Please try again shortly.",
        });
        Swal.hideLoading();
        // reset the UI to pre-org switch state
        $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
        $(".svg-change-current-account.organization").css("display", "block");
        return undefined;
      }

      // set the new organization information in the appropriate fields
      $("#current-bf-organization").text(selectedWorkspace);
      $("#current-bf-organization-generate").text(selectedWorkspace);
      $(".bf-organization-span").html(selectedWorkspace);
      // set the permissions content to an empty string
      await window.loadDefaultAccount();

      // confirm_click_function();

      return true;
    },
  });

  if (!res) {
    $(".svg-change-current-account.organization").css("display", "block");
    $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
    $("#license-lottie-div").css("display", "block");
    $("#license-assigned").css("display", "block");
    initializeBootstrapSelect("#curatebforganizationlist", "show");
    return;
  }

  // reset the selected dataset to None
  $(".bf-dataset-span").html("None");
  // reset the current owner span in the manage dataset make pi owner of a dataset tab
  $(".current-permissions").html("None");

  // If the button that triggered the organization has the class
  // guided-change-workspace (from guided mode), handle changes based on the ev id
  // otherwise, reset the FFM UI based on the ev class
  ev?.classList.contains("guided-change-workspace")
    ? window.handleGuidedModeOrgSwitch(ev)
    : window.resetFFMUI(ev);

  // reset the dataset list
  window.datasetList = [];
  window.defaultBfDataset = null;
  window.clearDatasetDropdowns();

  // checkPrevDivForConfirmButton("dataset");

  $("#button-refresh-publishing-status").addClass("hidden");

  // TODO: MIght need to hide if clicked twice / do similar logic as above
  // for organization span in those locations instead of a dataset span
  //; since the logic is there for a reason.
  initializeBootstrapSelect("#curatebforganizationlist", "show");
  showHideDropdownButtons("organization", "show");

  $("body").removeClass("waiting");
  $(".svg-change-current-account.organization").css("display", "block");
  $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
};

window.excludedWorkspaces = ["N:organization:9ae9659b-2311-4d75-963e-0000aa055627"];

window.isWorkspaceExcluded = async () => {
  let userInfo = await api.getUserInformation();

  let currentWorkspace = userInfo.preferredOrganization;

  if (window.excludedWorkspaces.includes(currentWorkspace)) {
    return true;
  }

  return false;
};

window.userHasMultipleWorkspaces = async () => {
  let workspaces = await api.getOrganizations();
  workspaces = workspaces["organizations"];
  return workspaces.length > 1;
};
