/*********** Protocol page functions ***********/
$("#guided-button-has-protocol-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["protocol"] == undefined)
    datasetStructureJSONObj["folders"]["protocol"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  $("#guided-file-explorer-elements").appendTo(
    $("#guided-user-has-protocol-data")
  );
  updateFolderStructureUI(highLevelFolderPageData.protocol);
});
$("#guided-button-no-protocol-data").on("click", () => {
  //ask user to confirm they would like to delete protocol folder if it exists
  if (datasetStructureJSONObj["folders"]["protocol"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the protocol folder.",
      text: "Are you sure you would like to delete your protocol folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete protocol folder
        delete datasetStructureJSONObj["folders"]["protocol"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no protocol files
        $("#guided-button-has-protocol-data").click();
      }
    });
  }
});
