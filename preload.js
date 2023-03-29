// Purpose: Will become preload.js in the future. For now it is a place to put global variables/functions that are defined in javascript files
//          needed by the renderer process in order to run.

// Contributors table for the dataset description editing page
const currentConTable = document.getElementById("table-current-contributors");

// function to show dataset or account Confirm buttons
const showHideDropdownButtons = (category, action) => {
  if (category === "dataset") {
    if (action === "show") {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset").hide();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  } else if (category === "account") {
    if (action === "show") {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "flex");
      $("#div-bf-account-btns button").show();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    } else {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "none");
      $("#div-bf-account-btns button").hide();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    }
  }
};

// Function to clear the confirm options in the curate feature
const confirm_click_account_function = () => {
  let temp = $(".bf-account-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  if (temp == "None" || temp == "") {
    $("#div-create_empty_dataset-account-btns").css("display", "none");
    $("#div-bf-account-btns-getting-started").css("display", "none");
    $("#div-bf-account-btns-getting-started button").hide();
  } else {
    $("#div-create_empty_dataset-account-btns").css("display", "flex");
    $("#div-bf-account-btns-getting-started").css("display", "flex");
    $("#div-bf-account-btns-getting-started button").show();
  }
};

/// helper function to refresh live search dropdowns per dataset permission on change event
const initializeBootstrapSelect = (dropdown, action) => {
  if (action === "disabled") {
    $(dropdown).attr("disabled", true);
    $(".dropdown.bootstrap-select button").addClass("disabled");
    $(".dropdown.bootstrap-select").addClass("disabled");
    $(dropdown).selectpicker("refresh");
  } else if (action === "show") {
    $(dropdown).selectpicker();
    $(dropdown).selectpicker("refresh");
    $(dropdown).attr("disabled", false);
    $(".dropdown.bootstrap-select button").removeClass("disabled");
    $(".dropdown.bootstrap-select").removeClass("disabled");
  }
};

const updateDatasetList = (bfaccount) => {
  var filteredDatasets = [];

  $("#div-filter-datasets-progress-2").css("display", "none");

  removeOptions(curateDatasetDropdown);
  addOption(curateDatasetDropdown, "Search here...", "Select dataset");

  initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

  $("#bf-dataset-select-header").css("display", "none");
  $("#curatebfdatasetlist").selectpicker("hide");
  $("#curatebfdatasetlist").selectpicker("refresh");
  $(".selectpicker").selectpicker("hide");
  $(".selectpicker").selectpicker("refresh");
  $("#bf-dataset-select-div").hide();

  // waiting for dataset list to load first before initiating BF dataset dropdown list
  setTimeout(() => {
    var myPermission = $(datasetPermissionDiv).find("#select-permission-list-2").val();

    if (!myPermission) {
      myPermission = "All";
    }

    if (myPermission.toLowerCase() === "all") {
      for (var i = 0; i < datasetList.length; i++) {
        filteredDatasets.push(datasetList[i].name);
      }
    } else {
      for (var i = 0; i < datasetList.length; i++) {
        if (datasetList[i].role === myPermission.toLowerCase()) {
          filteredDatasets.push(datasetList[i].name);
        }
      }
    }

    filteredDatasets.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
    $("#curatebfdatasetlist").find("option:not(:first)").remove();

    for (myitem in filteredDatasets) {
      var myitemselect = filteredDatasets[myitem];
      var option = document.createElement("option");
      option.textContent = myitemselect;
      option.value = myitemselect;
      curateDatasetDropdown.appendChild(option);
    }

    initializeBootstrapSelect("#curatebfdatasetlist", "show");

    $("#div-filter-datasets-progress-2").css("display", "none");
    //$("#bf-dataset-select-header").css("display", "block")
    $("#curatebfdatasetlist").selectpicker("show");
    $("#curatebfdatasetlist").selectpicker("refresh");
    $(".selectpicker").selectpicker("show");
    $(".selectpicker").selectpicker("refresh");
    $("#bf-dataset-select-div").show();

    if (document.getElementById("div-permission-list-2")) {
      document.getElementById("para-filter-datasets-status-2").innerHTML =
        filteredDatasets.length +
        " dataset(s) where you have " +
        myPermission.toLowerCase() +
        " permissions were loaded successfully below.";
    }
  }, 100);
};

// per change event of current dataset span text
const confirm_click_function = () => {
  let temp = $(".bf-dataset-span").html();
  if ($(".bf-dataset-span").html() == "None" || $(".bf-dataset-span").html() == "") {
    $($(this).parents().find(".field").find(".div-confirm-button")).css("display", "none");
    $("#para-review-dataset-info-disseminate").text("None");
  } else {
    $($(this).parents().find(".field").find(".div-confirm-button")).css("display", "flex");
    if ($($(this).parents().find(".field").find(".synced-progress")).length) {
      if ($($(this).parents().find(".field").find(".synced-progress")).css("display") === "none") {
        $(".confirm-button").click();
      }
    } else {
      $(".confirm-button").click();
    }
  }
}

var dropdownEventID = "";
const openDropdownPrompt = async (ev, dropdown, show_timer = true) => {
  // if users edit current account
  if (dropdown === "bf") {
    var resolveMessage = "";
    if (bfAccountOptionsStatus === "") {
      if (Object.keys(bfAccountOptions).length === 1) {
        footerMessage = "No existing accounts to load. Please add an account.";
      } else {
        footerMessage = "";
      }
    } else {
      footerMessage = bfAccountOptionsStatus;
    }
    var bfacct;
    let bfAccountSwal = false;
    if (bfAccountSwal === null) {
      if (bfacct !== "Select") {
        Swal.fire({
          allowEscapeKey: false,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          title: "Loading your account details...",
          didOpen: () => {
            Swal.showLoading();
          },
        });
        $("#Question-getting-started-BF-account")
          .nextAll()
          .removeClass("show")
          .removeClass("prev")
          .removeClass("test2");
        $("#Question-generate-dataset-BF-account")
          .nextAll()
          .removeClass("show")
          .removeClass("prev")
          .removeClass("test2");
        $("#current-bf-account").text("");
        $("#current-bf-account-generate").text("");
        $("#create_empty_dataset_BF_account_span").text("");
        $(".bf-account-span").text("");
        $("#current-bf-dataset").text("None");
        $("#current-bf-dataset-generate").text("None");
        $(".bf-dataset-span").html("None");
        defaultBfDataset = "Select dataset";
        document.getElementById("ds-description").innerHTML = "";
        refreshDatasetList();
        $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "none");
        $("#button-confirm-bf-dataset-getting-started").hide();

        $("#para-account-detail-curate").html("");
        $("#current-bf-dataset").text("None");
        $(".bf-dataset-span").html("None");
        showHideDropdownButtons("dataset", "hide");

        try {
          let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
            params: {
              selected_account: bfacct,
            },
          });
          let accountDetails = bf_account_details_req.data.account_details;
          $("#para-account-detail-curate").html(accountDetails);
          $("#current-bf-account").text(bfacct);
          $("#current-bf-account-generate").text(bfacct);
          $("#create_empty_dataset_BF_account_span").text(bfacct);
          $(".bf-account-span").text(bfacct);
          updateBfAccountList();
          //change icons in getting started page (guided mode)
          const gettingStartedPennsieveBtn = document.getElementById(
            "getting-started-pennsieve-account"
          );
          gettingStartedPennsieveBtn.children[0].style.display = "none";
          gettingStartedPennsieveBtn.children[1].style.display = "flex";

          try {
            let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
              params: {
                selected_account: bfacct,
              },
            });

            datasetList = [];
            datasetList = responseObject.data.datasets;
            refreshDatasetList();
          } catch (error) {
            clientError(error);
            document.getElementById("para-filter-datasets-status-2").innerHTML =
              "<span style='color: red'>" + userErrorMessage(error) + "</span>";
            return;
          }
        } catch (error) {
          clientError(error);
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "error",
            text: userErrorMessage(error),
            footer:
              "<a href='https://docs.pennsieve.io/docs/configuring-the-client-credentials'>Why do I have this issue?</a>",
          });
          showHideDropdownButtons("account", "hide");
        }
      } else {
        Swal.showValidationMessage("Please select an account!");
      }
    } else if (bfAccountSwal === false) {
      Swal.fire({
        allowOutsideClick: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        confirmButtonText: "Connect to Pennsieve",
        showCloseButton: false,
        focusConfirm: false,
        heightAuto: false,
        reverseButtons: reverseSwalButtons,
        showCancelButton: true,

        title: `<h3 style="text-align:center">Connect your Pennsieve account using your email and password</h3><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`,

        html: `<input type="text" id="ps_login" class="swal2-input" placeholder="Email Address for Pennsieve">
          <input type="password" id="ps_password" class="swal2-input" placeholder="Password">`,
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },

        footer: `<a target="_blank" href="https://docs.sodaforsparc.io/docs/how-to/how-to-get-a-pennsieve-account" style="text-decoration: none;">I don't have a Pennsieve account and/or access to the SPARC Organization</a>`,

        didOpen: () => {
          $(".swal-popover").popover();
          let div_footer = document.getElementsByClassName("swal2-footer")[0];
          document.getElementsByClassName("swal2-popup")[0].style.width = "43rem";
          div_footer.style.flexDirection = "column";
          div_footer.style.alignItems = "center";
          let swal_actions = document.getElementsByClassName("swal2-actions")[0];
          let api_button = document.createElement("button");
          let api_arrow = document.createElement("i");

          api_button.innerText = "Connect with API key instead";
          api_button.setAttribute("onclick", "showBFAddAccountSweetalert()");
          api_arrow.classList.add("fas");
          api_arrow.classList.add("fa-arrow-right");
          api_arrow.style.marginLeft = "10px";
          api_button.type = "button";
          api_button.style.border = "";
          api_button.id = "api_connect_btn";
          api_button.classList.add("transition-btn");
          api_button.classList.add("api_key-btn");
          api_button.classList.add("back");
          api_button.style.display = "inline";
          api_button.appendChild(api_arrow);
          swal_actions.parentElement.insertBefore(api_button, div_footer);
        },
        preConfirm: async () => {
          Swal.resetValidationMessage();
          Swal.showLoading();
          const login = Swal.getPopup().querySelector("#ps_login").value;
          const password = Swal.getPopup().querySelector("#ps_password").value;
          if (!login || !password) {
            Swal.hideLoading();
            Swal.showValidationMessage(`Please enter email and password`);
          } else {
            let key_name = SODA_SPARC_API_KEY;
            let response = await get_api_key(login, password, key_name);
            if (response[0] == "failed") {
              let error_message = response[1];
              if (response[1]["message"] === "exceptions must derive from BaseException") {
                error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">It seems that you do not have access to the SPARC Organization on Pennsieve. See our <a target="_blank" href="https://docs.sodaforsparc.io/docs/next/how-to/how-to-get-a-pennsieve-account">[dedicated help page]</a> to learn how to get access</div>`;
              }
              if (response[1]["message"] === "Error: Username or password was incorrect.") {
                error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">Error: Username or password was incorrect</div>`;
              }
              Swal.hideLoading();
              Swal.showValidationMessage(error_message);
              document.getElementById("swal2-validation-message").style.flexDirection = "column";
            } else if (response["success"] == "success") {
              return {
                key: response["key"],
                secret: response["secret"],
                name: response["name"],
              };
            }
          }
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            allowEscapeKey: false,
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            showConfirmButton: false,
            title: "Adding account...",
            didOpen: () => {
              Swal.showLoading();
            },
          });
          let key_name = result.value.name;
          let apiKey = result.value.key;
          let apiSecret = result.value.secret;

          // lowercase the key_name the user provided
          // this is to prevent an issue caused by the pennsiev agent
          // wherein it fails to validate an account if it is not lowercase
          key_name = key_name.toLowerCase();
          //needs to be replaced
          try {
            await client.put(`/manage_datasets/account/username`, {
              keyname: key_name,
              key: apiKey,
              secret: apiSecret,
            });
            bfAccountOptions[key_name] = key_name;
            defaultBfAccount = key_name;
            defaultBfDataset = "Select dataset";

            try {
              let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
                params: {
                  selected_account: defaultBfAccount,
                },
              });
              let result = bf_account_details_req.data.account_details;
              $("#para-account-detail-curate").html(result);
              $("#current-bf-account").text(key_name);
              $("#current-bf-account-generate").text(key_name);
              $("#create_empty_dataset_BF_account_span").text(key_name);
              $(".bf-account-span").text(key_name);
              $("#current-bf-dataset").text("None");
              $("#current-bf-dataset-generate").text("None");
              $(".bf-dataset-span").html("None");
              $("#para-account-detail-curate-generate").html(result);
              $("#para_create_empty_dataset_BF_account").html(result);
              $("#para-account-detail-curate-generate").html(result);
              $(".bf-account-details-span").html(result);
              $("#para-continue-bf-dataset-getting-started").text("");

              $("#current_curation_team_status").text("None");
              $("#curation-team-share-btn").hide();
              $("#curation-team-unshare-btn").hide();
              $("#current_sparc_consortium_status").text("None");
              $("#sparc-consortium-share-btn").hide();
              $("#sparc-consortium-unshare-btn").hide();
              // const gettingStartedPennsieveBtn = document.getElementById(
              // "getting-started-pennsieve-account"
              // );
              // gettingStartedPennsieveBtn.children[0].style.display = "none";
              // gettingStartedPennsieveBtn.children[1].style.display = "flex";

              showHideDropdownButtons("account", "show");
              confirm_click_account_function();
              updateBfAccountList();

              // If the clicked button is the Guided Mode log in button, refresh the page to update UI
              if (ev.getAttribute("id") === "guided-button-pennsieve-log-in") {
                openPage("guided-pennsieve-intro-tab");
              }
            } catch (error) {
              clientError(error);
              Swal.fire({
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                icon: "error",
                text: "Something went wrong!",
                footer:
                  '<a target="_blank" href="https://docs.pennsieve.io/docs/configuring-the-client-credentials">Why do I have this issue?</a>',
              });
              showHideDropdownButtons("account", "hide");
              confirm_click_account_function();
            }

            Swal.fire({
              allowEscapeKey: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              icon: "success",
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              title: "Successfully added! <br/>Loading your account details...",
              didOpen: () => {
                Swal.showLoading();
              },
            });
          } catch (error) {
            clientError(error);
            Swal.showValidationMessage(userErrorMessage(error));
            Swal.close();
          }
        }
      });
    }
  } else if (dropdown === "dataset") {
    if (ev != null) {
      dropdownEventID = ev.id;
    }
    $(".svg-change-current-account.dataset").css("display", "none");
    $("#div-permission-list-2").css("display", "none");
    $(".ui.active.green.inline.loader.small").css("display", "block");

    setTimeout(async function () {
      // disable the Continue btn first
      $("#nextBtn").prop("disabled", true);
      var bfDataset = "";

      // if users edit Current dataset
      datasetPermissionDiv.style.display = "none";
      $(datasetPermissionDiv)
        .find("#curatebfdatasetlist")
        .find("option")
        .empty()
        .append('<option value="Select dataset">Search here...</option>')
        .val("Select dataset");

      $(datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "block");

      $("#bf-dataset-select-header").css("display", "none");

      $(datasetPermissionDiv).find("#para-filter-datasets-status-2").text("");
      $("#para-continue-bf-dataset-getting-started").text("");

      $(datasetPermissionDiv).find("#select-permission-list-2").val("All").trigger("change");
      $(datasetPermissionDiv).find("#curatebfdatasetlist").val("Select dataset").trigger("change");

      initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

      //$("#curatebfdatasetlist").selectpicker("hide");
      //$("#curatebfdatasetlist").selectpicker("refresh");
      //$(".selectpicker").selectpicker("hide");
      //$(".selectpicker").selectpicker("refresh");
      //$("#bf-dataset-select-div").hide();
      try {
        var accountPresent = await check_api_key();
      } catch (error) {
        console.error(error);
        $(".ui.active.green.inline.loader.small").css("display", "none");
        $(".svg-change-current-account.dataset").css("display", "block");
        accountPresent = false;
      }
      if (accountPresent === false) {
        //If there is no API key pair, warning will pop up allowing user to sign in
        await Swal.fire({
          icon: "warning",
          text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connected to Pennsieve. Would you like to do it now?",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Yes",
          showCancelButton: true,
          reverseButtons: reverseSwalButtons,
          cancelButtonText: "I'll do it later",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            await openDropdownPrompt(this, "bf");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          } else {
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          }
        });
        ipcRenderer.send(
          "track-event",
          "Error",
          "Selecting dataset",
          "User has not connected their Pennsieve account with SODA",
          1
        );
      } else {
        //account is signed in but no datasets have been fetched or created
        //invoke dataset request to ensure no datasets have been created
        if (datasetList.length === 0) {
          let responseObject;
          try {
            responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
              params: {
                selected_account: defaultBfAccount,
              },
            });
          } catch (error) {
            clientError(error);
            return;
          }

          let result = responseObject.data.datasets;
          datasetList = [];
          datasetList = result;
          refreshDatasetList();
        }
      }
      //after request check length again
      //if 0 then no datasets have been created
      if (datasetList.length === 0) {
        Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Create new dataset",
          focusCancel: false,
          focusConfirm: true,
          showCloseButton: true,
          showCancelButton: true,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          title: "<h3 style='margin-bottom:20px !important'>No dataset found</h3>",
          html: "It appears that your don't have any datasets on Pennsieve with owner or manage permission.<br><br>Please create one to get started.",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          didOpen: () => {
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          },
        }).then((result) => {
          if (result.isConfirmed) {
            $("#create_new_bf_dataset_btn").click();
          }
        });
        ipcRenderer.send(
          "track-event",
          "Error",
          "Selecting dataset",
          "User has not created any datasets",
          1
        );
      }

      //datasets do exist so display popup with dataset options
      //else datasets have been created
      if (datasetList.length > 0) {
        await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Confirm",
          focusCancel: true,
          focusConfirm: false,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          html: datasetPermissionDiv,
          reverseButtons: reverseSwalButtons,
          showCloseButton: true,
          showCancelButton: true,
          title: "<h3 style='margin-bottom:20px !important'>Select your dataset</h3>",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          willOpen: () => {
            $("#curatebfdatasetlist").selectpicker("hide");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#bf-dataset-select-div").hide();
          },
          didOpen: () => {
            $("#div-permission-list-2").css("display", "block");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            datasetPermissionDiv.style.display = "block";
            $("#curatebfdatasetlist").attr("disabled", false);
            $(datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#curatebfdatasetlist").selectpicker("show");
            $("#bf-dataset-select-div").show();

            bfDataset = $("#curatebfdatasetlist").val();
            let sweet_al = document.getElementsByClassName("swal2-content")[0];
            let sweet_alrt = document.getElementsByClassName("swal2-actions")[0];
            sweet_alrt.style.marginTop = "1rem";

            let tip_container = document.createElement("div");
            let tip_content = document.createElement("p");
            tip_content.innerText =
              "Only datasets where you have owner or manager permissions will be shown in the list";
            tip_content.classList.add("tip-content");
            tip_content.style.textAlign = "left";
            tip_container.style.marginTop = "1rem";
            tip_container.appendChild(tip_content);
            sweet_al.appendChild(tip_container);
          },
          preConfirm: () => {
            bfDataset = $("#curatebfdatasetlist").val();
            if (!bfDataset) {
              Swal.showValidationMessage("Please select a dataset!");

              $(datasetPermissionDiv)
                .find("#div-filter-datasets-progress-2")
                .css("display", "none");
              $("#curatebfdatasetlist").selectpicker("show");
              $("#curatebfdatasetlist").selectpicker("refresh");
              $("#bf-dataset-select-div").show();

              return undefined;
            } else {
              if (bfDataset === "Select dataset") {
                Swal.showValidationMessage("Please select a dataset!");

                $(datasetPermissionDiv)
                  .find("#div-filter-datasets-progress-2")
                  .css("display", "none");
                $("#curatebfdatasetlist").selectpicker("show");
                $("#curatebfdatasetlist").selectpicker("refresh");
                $("#bf-dataset-select-div").show();

                return undefined;
              } else {
                $("#license-lottie-div").css("display", "none");
                $("#license-assigned").css("display", "none");
                return bfDataset;
              }
            }
          },
        }).then((result) => {
          if (result.isConfirmed) {
            if (show_timer) {
              Swal.fire({
                allowEscapeKey: false,
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: false,
                title: "Loading your dataset details...",
                didOpen: () => {
                  Swal.showLoading();
                },
              });
            }
            if (dropdownEventID === "dd-select-pennsieve-dataset") {
              $("#ds-name").val(bfDataset);
              $("#ds-description").val = $("#bf-dataset-subtitle").val;
              $("body").removeClass("waiting");
              $(".svg-change-current-account.dataset").css("display", "block");
              dropdownEventID = "";
              return;
            }
            $("#current-bf-dataset").text(bfDataset);
            $("#current-bf-dataset-generate").text(bfDataset);
            $(".bf-dataset-span").html(bfDataset);
            confirm_click_function();

            defaultBfDataset = bfDataset;
            // document.getElementById("ds-description").innerHTML = "";
            refreshDatasetList();
            $("#dataset-loaded-message").hide();

            showHideDropdownButtons("dataset", "show");
            document.getElementById("div-rename-bf-dataset").children[0].style.display = "flex";

            // show the confirm button underneath the dataset select dropdown if one exists
            let btn = document.querySelector(".btn-confirm-ds-selection");
            btn.style.visibility = "visible";
            btn.style.display = "flex";

            // checkPrevDivForConfirmButton("dataset");
          } else if (result.isDismissed) {
            currentDatasetLicense.innerText = currentDatasetLicense.innerText;
          }
        });

        if ($("#current-bf-dataset-generate").text() === "None") {
          showHideDropdownButtons("dataset", "hide");
        } else {
          showHideDropdownButtons("dataset", "show");
        }
        //currently changing it but not visually in the UI
        $("#bf_list_users_pi").val("Select PI");

        let oldDatasetButtonSelected = document.getElementById("oldDatasetDescription-selection");
        let newDatasetButtonSelected = document.getElementById("newDatasetDescription-selection");

        if (newDatasetButtonSelected.classList.contains("checked")) {
          document.getElementById("Question-prepare-dd-2").classList.add("show");

          document.getElementById("dd-select-pennsieve-dataset").style.display = "block";
          document.getElementById("ds-name").value =
            document.getElementById("rename_dataset_name").innerText;
        } else {
          document.getElementById("Question-prepare-dd-4").classList.add("show");
          let onMyCompButton = document.getElementById("Question-prepare-dd-4-new");
          document.getElementById("dd-select-pennsieve-dataset").style.display = "none";
          let onPennsieveButton =
            onMyCompButton.parentElement.parentElement.children[1].children[0];
          if (onMyCompButton.classList.contains("checked")) {
            document.getElementById("Question-prepare-dd-3").classList.add("show");
          } else {
            document.getElementById("Question-prepare-dd-5").classList.add("show");
          }
        }

        // update the gloabl dataset id
        for (const item of datasetList) {
          let { name } = item;
          let { id } = item;
          if (name === bfDataset) {
            defaultBfDatasetId = id;
          }
        }

        let PI_users = document.getElementById("bf_list_users_pi");
        PI_users.value = "Select PI";
        $("#bf_list_users_pi").selectpicker("refresh");

        // log a map of datasetId to dataset name to analytics
        // this will be used to help us track private datasets which are not trackable using a datasetId alone
        ipcRenderer.send(
          "track-event",
          "Dataset ID to Dataset Name Map",
          defaultBfDatasetId,
          defaultBfDataset
        );

        // document.getElementById("ds-description").innerHTML = "";
        refreshDatasetList();
        $("#dataset-loaded-message").hide();

        showHideDropdownButtons("dataset", "show");
        // checkPrevDivForConfirmButton("dataset");
      }

      // hide "Confirm" button if Current dataset set to None
      if ($("#current-bf-dataset-generate").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }

      // hide "Confirm" button if Current dataset under Getting started set to None
      if ($("#current-bf-dataset").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }
      $("body").removeClass("waiting");
      $(".svg-change-current-account.dataset").css("display", "block");
      $(".ui.active.green.inline.loader.small").css("display", "none");
      ipcRenderer.send("track-event", "Success", "Selecting dataset", defaultBfDatasetId, 1);
    }, 10);
  }
};
