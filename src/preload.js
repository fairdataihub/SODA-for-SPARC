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
            $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
                "display",
                "flex"
            );
            $("#button-confirm-bf-dataset-getting-started").show();
        } else {
            // btn under Step 6
            $($("#button-confirm-bf-dataset").parents()[0]).css("display", "none");
            $("#button-confirm-bf-dataset").hide();
            // btn under Step 1
            $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
                "display",
                "none"
            );
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
      var myPermission = $(datasetPermissionDiv)
        .find("#select-permission-list-2")
        .val();
  
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