if (pageBeingLeftID === "guided-protocol-folder-tab") {
  const guidedButtonUserHasProtocolData = document.getElementById(
    "guided-button-has-protocol-data"
  );
  const guidedButtonUserNoProtocolData = document.getElementById(
    "guided-button-no-protocol-data"
  );

  const protocolFolder = datasetStructureJSONObj["folders"]["protocol"];

  if (
    !guidedButtonUserHasProtocolData.classList.contains("selected") &&
    !guidedButtonUserNoProtocolData.classList.contains("selected")
  ) {
    errorArray.push({
      type: "notyf",
      message: "Please indicate if your dataset contains protocol data",
    });
    throw errorArray;
  }
  if (guidedButtonUserHasProtocolData.classList.contains("selected")) {
    if (
      Object.keys(protocolFolder.folders).length === 0 &&
      Object.keys(protocolFolder.files).length === 0
    ) {
      errorArray.push({
        type: "notyf",
        message:
          "Please add docs protocol or indicate that you do not have protocol data",
      });
      throw errorArray;
    }
  }
  if (guidedButtonUserNoProtocolData.classList.contains("selected")) {
    if (
      Object.keys(protocolFolder.folders).length === 0 &&
      Object.keys(protocolFolder.files).length === 0
    ) {
      delete datasetStructureJSONObj["folders"]["protocol"];
    } else {
      const { value: deleteCodeFolderWithData } = await Swal.fire({
        title: "Delete protocol folder?",
        text: "You indicated that your dataset does not contain protocol data, however, you previously added protocol data to your dataset. Do you want to delete the protocol folder?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, keep it!",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      if (deleteCodeFolderWithData) {
        delete datasetStructureJSONObj["folders"]["protocol"];
      } else {
        guidedButtonUserHasProtocolData.click();
      }
    }
  }
}
