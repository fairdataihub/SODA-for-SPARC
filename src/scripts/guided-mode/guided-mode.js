//FOLDER SELECTOR CLICK HANDLERS
$(document).ready(() => {
  $("#confirm-account-settings").click(() => {
    $("#guided-splash").hide();
    $("#guided-steps").hide();
  });

  $("#create-pennsieve-dataset").click(() => {
    $("#nav-select-folders").click();
  });
});
