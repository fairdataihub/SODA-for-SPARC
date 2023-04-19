const { UserDetailsCard } = require("../../stories/UserDetailsCard");
const { FIELD_OPTIONS } = require("../../stories/UserDetailsCardField");

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
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container-add-edit-subtitle")
    .appendChild(addEditSubtitlesCard);

  // TODO: Remove the dataset addition line from this component as it is not necessary; show the question once organization has been selected
  let createEmptyDatasetCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "create_empty_dataset",
    currentTab: "create_empty_dataset_BF_account_tab",
    currentParentTab: "create_new_bf_dataset-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div-create-new-empty-dataset",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container-create-empty-dataset")
    .appendChild(createEmptyDatasetCard);

  let addOrRemoveCollectionCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button-collection-dataset-confirm",
    currentTab: "collection_BF_account_tab",
    currentParentTab: "bf_collection-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div-collection-bf-dataset",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.DATASET_EDITABLE,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container--add-remove-collection")
    .appendChild(addOrRemoveCollectionCard);

  let renameDatasetCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button-rename-dataset-confirm",
    currentTab: "rename_dataset_BF_account_tab",
    currentParentTab: "rename_bf_dataset-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div-rename-bf-dataset",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container--rename-dataset")
    .appendChild(renameDatasetCard);

  let makePiOwnerCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_pi_dataset_owner_confirm",
    currentTab: "pi_dataset_owner_tab",
    currentParentTab: "pi_dataset_owner_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_make_pi_owner_permissions",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
      FIELD_OPTIONS.OWNER_PERMISSIONS,
    ],
  });

  document.querySelector("#top-level-card-container--make-pi-owner").appendChild(makePiOwnerCard);

  let addEditPermissionsCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_add_edit_permissions_confirm",
    currentTab: "add_edit_permissions_choice_tab",
    currentParentTab: "add_edit_permissions_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "add_edit_permissions_choice_div",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
      FIELD_OPTIONS.PERMISSIONS,
    ],
  });

  document
    .querySelector("#top-level-card-container--add-edit-permissions")
    .appendChild(addEditPermissionsCard);

  let addTagsCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_add_tags_confirm",
    currentTab: "add_tags_tab",
    currentParentTab: "add_tags_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_add_tags",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document.querySelector("#top-level-card-container--add-tags").appendChild(addTagsCard);

  let addEditDescriptionCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_add_edit_description_confirm",
    currentTab: "add_edit_description_tab",
    currentParentTab: "add_edit_description_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_add_edit_description",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container--add-edit-description")
    .appendChild(addEditDescriptionCard);

  let addEditBanner = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_add_edit_banner_confirm",
    currentTab: "add_edit_banner_tab",
    currentParentTab: "add_edit_banner_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_add_edit_banner",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document.querySelector("#top-level-card-container--add-edit-banner").appendChild(addEditBanner);

  let addLicenseCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_add_license_confirm",
    currentTab: "add_license_tab",
    currentParentTab: "add_license_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_add_license",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
      FIELD_OPTIONS.LICENSE,
    ],
  });

  document.querySelector("#top-level-card-container--add-license").appendChild(addLicenseCard);

  let uploadLocalDatasetCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_upload_local_dataset_confirm",
    currentTab: "upload_local_dataset_tab",
    currentParentTab: "upload_local_dataset_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "upload_local_dataset_div",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container--upload-local-dataset")
    .appendChild(uploadLocalDatasetCard);

  let changeDatasetStatusCard = UserDetailsCard({
    tabName: "manage-dataset",
    buttonId: "button_view_change_dataset_status_confirm",
    currentTab: "view_change_dataset_status_tab",
    currentParentTab: "view_change_dataset_status_parent-tab",
    action: "delete",
    section: "individual-question manage-dataset",
    dataNext: "div_view_change_dataset_status",
    fields: [
      FIELD_OPTIONS.ACCOUNT_EDITABLE,
      FIELD_OPTIONS.ACCOUNT_DETAILS,
      FIELD_OPTIONS.ORGANIZATION_EDITABLE,
      FIELD_OPTIONS.DATASET_EDITABLE,
    ],
  });

  document
    .querySelector("#top-level-card-container--change-dataset-status")
    .appendChild(changeDatasetStatusCard);
};

module.exports = { addDatasetAndOrganizationCardComponents };
