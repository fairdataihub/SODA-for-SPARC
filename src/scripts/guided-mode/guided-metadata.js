let guidedHeadersArrSubjects = [];
let guidedHeadersArrSamples = [];
let guidedSubjectsTableData = [];
let guidedSamplesTableData = [];

/// function to add Species - subjects + samples
async function guidedAddSpecies(ev, type) {
  $("#guided-bootbox-" + type + "-species").val("");
  const { value: value } = await Swal.fire({
    title: "Add/Edit a species",
    html: `<input type="text" id="sweetalert-${type}-species" placeholder="Search for species..." style="font-size: 14px;"/>`,
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    customClass: {
      confirmButton: "confirm-disabled",
    },
    didOpen: () => {
      $(".swal2-confirm").attr("id", "btn-confirm-species");
      createSpeciesAutocomplete("sweetalert-" + type + "-species");
    },
    preConfirm: () => {
      if (
        document.getElementById("sweetalert-" + type + "-species").value === ""
      ) {
        Swal.showValidationMessage("Please enter a species.");
      }
      return document.getElementById("sweetalert-" + type + "-species").value;
    },
  });
  if (value) {
    console.log(type);
    if (value !== "") {
      $("#guided-bootbox-" + type + "-species").val(value);
      guidedSwitchSpeciesStrainInput("species", "edit");
    }
  } else {
    guidedSwitchSpeciesStrainInput("species", "add");
  }
}
function guidedSwitchSpeciesStrainInput(type, mode) {
  if (mode === "add") {
    $("#guided-button-add-" + type + "-subject").html(
      `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add ${type}`
    );
    $(`#guided-bootbox-subject-${type}`).css("display", "none");
    $(`#guided-bootbox-subject-${type}`).val("");
  } else if (mode === "edit") {
    $(`#guided-bootbox-subject-${type}`).css("display", "block");
    $(`#guided-bootbox-subject-${type}`).attr("readonly", true);
    $(`#guided-bootbox-subject-${type}`).css("background", "#f5f5f5");
    $("#guided-button-add-" + type + "-subject").html(
      "<i class='pen icon'></i>Edit"
    );
  }
}
async function guidedAddStrain(ev, type) {
  $("#guided-bootbox-" + type + "-strain").val("");
  const { value: value } = await Swal.fire({
    title: "Add/Edit a strain",
    html: `<input type="text" id="sweetalert-${type}-strain" placeholder="Search for strain..." style="font-size: 14px;"/>`,
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    customClass: {
      confirmButton: "confirm-disabled",
    },
    didOpen: () => {
      $(".swal2-confirm").attr("id", "btn-confirm-strain");
      guidedCreateStrain("sweetalert-" + type + "-strain", type);
    },
    preConfirm: () => {
      if (
        document.getElementById("sweetalert-" + type + "-strain").value === ""
      ) {
        Swal.showValidationMessage("Please enter a strain.");
      }
      return document.getElementById("sweetalert-" + type + "-strain").value;
    },
  });
  if (value) {
    if (value !== "") {
      $("#guided-bootbox-" + type + "-strain").val(value);
      guidedSwitchSpeciesStrainInput("strain", "edit");
    }
  } else {
    guidedSwitchSpeciesStrainInput("strain", "add");
  }
}
function guidedCreateStrain(id, type) {
  var autoCompleteJS4 = new autoComplete({
    selector: "#" + id,
    data: {
      src: [
        "Wistar",
        "Yucatan",
        "C57/B6J",
        "C57 BL/6J",
        "mixed background",
        "Sprague-Dawley",
      ],
    },
    events: {
      input: {
        focus: () => {
          autoCompleteJS4.start();
        },
      },
    },
    resultItem: {
      element: (item, data) => {
        // Modify Results Item Style
        item.style = "display: flex; justify-content: space-between;";
        // Modify Results Item Content
        item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          ${data.match}
        </span>`;
      },
      highlight: true,
    },
    threshold: 0,
    resultsList: {
      element: (list, data) => {
        const info = document.createElement("div");

        if (data.results.length === 0) {
          info.setAttribute("class", "no_results_species");
          info.setAttribute(
            "onclick",
            "guidedPopulateRRID('" + data.query + "', '" + type + "')"
          );
          info.innerHTML = `Click here to check <strong>"${data.query}"</strong>`;
        }
        list.prepend(info);
      },
      noResults: true,
      maxResults: 5,
      tabSelect: true,
    },
  });

  autoCompleteJS4.input.addEventListener("selection", function (event) {
    var feedback = event.detail;
    var selection = feedback.selection.value;
    document.querySelector("#" + id).value = selection;
    var strain = $("#sweetalert-" + type + "-strain").val();
    if (strain !== "") {
      guidedPopulateRRID(strain, type);
    }
    autoCompleteJS4.input.value = selection;
  });
}
// populate RRID
function guidedPopulateRRID(strain, type) {
  var rridHostname = "scicrunch.org";
  // this is to handle spaces and other special characters in strain name
  var encodedStrain = encodeURIComponent(strain);
  var rridInfo = {
    hostname: rridHostname,
    port: 443,
    path: `/api/1/dataservices/federation/data/nlx_154697-1?q=${encodedStrain}&key=2YOfdcQRDVN6QZ1V6x3ZuIAsuypusxHD`,
    headers: { accept: "text/xml" },
  };
  Swal.fire({
    title: `Retrieving RRID for ${strain}...`,
    allowEscapeKey: false,
    allowOutsideClick: false,
    html: "Please wait...",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  https.get(rridInfo, (res) => {
    if (res.statusCode === 200) {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (d) => {
        data += d;
      });
      res.on("end", () => {
        var returnRes = readXMLScicrunch(data, type);
        if (!returnRes) {
          Swal.fire({
            title: `Failed to retrieve the RRID for ${strain} from <a target="_blank" href="https://scicrunch.org/resources/Organisms/search">Scicrunch.org</a>.`,
            text: "Please make sure you enter the correct strain.",
            showCancelButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          $("#guided-bootbox-" + type + "-strain").val("");
          $("#guided-bootbox-" + type + "-strain-RRID").val("");
          $("#guided-bootbox-" + type + "-strain").css("display", "none");
          if (type.includes("subject")) {
            $("#guided-button-add-strain-subject").html(
              `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add strain`
            );
          } else {
            $("#guided-button-add-strain-sample").html(
              `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add strain`
            );
          }
        } else {
          $("#guided-bootbox-" + type + "-strain").val(strain);
          $("#btn-confirm-strain").removeClass("confirm-disabled");
          $("#guided-bootbox-" + type + "-strain").css("display", "block");
          $("#guided-bootbox-" + type + "-strain").attr("readonly", true);
          $("#guided-bootbox-" + type + "-strain").css("background", "#f5f5f5");
          if (type.includes("subject")) {
            $("#button-add-strain-subject").html(
              "<i class='pen icon'></i>Edit"
            );
          } else {
            $("#guided-button-add-strain-sample").html(
              "<i class='pen icon'></i>Edit"
            );
          }
          Swal.fire({
            title: `Successfully retrieved the RRID for "${strain}".`,
            icon: "success",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
        }
      });
    } else {
      $("#guided-bootbox-" + type + "-strain").val("");
      $("#guided-bootbox-" + type + "-strain-RRID").val("");
      Swal.fire({
        title: `Failed to retrieve the RRID for "${strain}" from <a target="_blank" href="https://scicrunch.org/resources/Organisms/search">Scicrunch.org</a>.`,
        text: "Please check your Internet Connection or contact us at sodasparc@gmail.com",
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  });
}
function guidedPreliminaryProtocolStep(type) {
  var credentials = loadExistingProtocolInfo();
  if (credentials[0]) {
    // show email for protocol account
    showProtocolCredentials(credentials[1], type);
  } else {
    protocolAccountQuestion(type, false);
  }
}
async function guidedAddCustomField(type) {
  if (type === "subjects") {
    var lowercaseCasedArray = $.map(
      guidedHeadersArrSubjects,
      function (item, index) {
        return item.toLowerCase();
      }
    );
    const { value: customField } = await Swal.fire({
      title: "Enter a custom field:",
      input: "text",
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a custom field";
        } else {
          if (lowercaseCasedArray.includes(value.toLowerCase())) {
            return "Duplicate field name! <br> You entered a custom field that is already listed.";
          }
        }
      },
    });
    if (customField) {
      guidedAddCustomHeader("subjects", customField);
    }
  } else if (type === "samples") {
    var lowercaseCasedArray = $.map(
      guidedHeadersArrSamples,
      function (item, index) {
        return item.toLowerCase();
      }
    );
    const { value: customField } = await Swal.fire({
      title: "Enter a custom field:",
      input: "text",
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a custom field";
        } else {
          if (guidedHeadersArrSamples.includes(value.toLowerCase())) {
            return "Duplicate field name! <br> You entered a custom field that is already listed.";
          }
        }
      },
    });
    if (customField) {
      guidedAddCustomHeader("samples", customField);
    }
  }
}
function guidedAddCustomHeader(type, customHeaderValue) {
  var customName = customHeaderValue.trim();
  if (type === "subjects") {
    var divElement =
      '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
      customName +
      ':</font></div></div><div class="demo-controls-body"><div class="ui input modified"><input class="subjects-form-entry" type="text" placeholder="Type here..." id="guided-bootbox-subject-' +
      customName +
      '" name="' +
      customName +
      '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
      customName +
      '\', 0)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
    $("#guided-accordian-custom-fields").append(divElement);
    guidedHeadersArrSubjects.push(customName);
    // add empty entries for all of the other sub_ids to normalize the size of matrix
    for (var subId of guidedSubjectsTableData.slice(
      1,
      guidedSubjectsTableData.length
    )) {
      subId.push("");
    }
  } else if (type === "samples") {
    var divElement =
      '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
      customName +
      ':</font></div></div><div class="demo-controls-body"><div class="ui input modified"><input class="samples-form-entry" type="text" placeholder="Type here..." id="guided-bootbox-subject-' +
      customName +
      '" name="' +
      customName +
      '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
      customName +
      '\', 1)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
    $("#guided-accordian-custom-fields-samples").append(divElement);
    guidedHeadersArrSamples.push(customName);
    // add empty entries for all of the other sub_ids to normalize the size of matrix
    for (var sampleId of samplesTableData.slice(1, samplesTableData.length)) {
      sampleId.push("");
    }
  }
}
