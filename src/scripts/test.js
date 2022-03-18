$("#guided-button-has-docs-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["docs"] == undefined)
    datasetStructureJSONObj["folders"]["docs"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  $("#guided-button-open-docs-folder").show();
});
$("#guided-button-no-docs-data").on("click", () => {
  //ask user to confirm they would like to delete docs folder if it exists
  if (datasetStructureJSONObj["folders"]["docs"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the docs folder.",
      text: "Are you sure you would like to delete your docs folder progress?",
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
        //User agrees to delete docs folder
        delete datasetStructureJSONObj["folders"]["docs"];
        $("#guided-button-open-docs-folder").hide();
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no docs files
        $("#guided-button-has-docs-data").click();
      }
    });
  }
  $("#guided-button-open-docs-folder").hide();
});
$("#guided-button-open-docs-folder").on("click", () => {
  openFolderStructurePage(highLevelFolderPageData.docs);
});
