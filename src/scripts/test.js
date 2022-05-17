if (targetPageID === "guided-derivative-subjects-organization-tab") {
  renderSubjectsHighLevelFolderAsideItems("derivative");
  guidedUpdateFolderStructure("derivative", "subjects");
  $("#structure-subjects-folder").appendTo(
    $("#guided-derivative-subjects-file-explorer-container")
  );
  updateFolderStructureUI(highLevelFolderPageData.derivative); //temp
  document.getElementById("structure-folder-header").classList.add("hidden");
  document.getElementById("structure-folder-contents").classList.add("hidden");
}
