const { UserDetailsCard } = require("../../stories/UserDetailsCard");

// add the edit subtitle card to the DOM

const addDatasetAndOrganizationCardComponents = () => {
  let addEditSubtitlesCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_add_edit_subtitle_confirm",
    currentTab: "add_edit_subtitle_tab",
    currentParentTab: "add_edit_subtitle_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_add_edit_subtitle",
  });

  document.querySelector("#top-level-card-container").appendChild(addEditSubtitlesCard);
};

module.exports = { addDatasetAndOrganizationCardComponents };
