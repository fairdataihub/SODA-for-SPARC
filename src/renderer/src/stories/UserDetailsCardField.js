const FIELD_OPTIONS = {
  DATASET: "dataset-field",
  ORGANIZATION: "organization-field",
  OWNER_PERMISSIONS: "owner-permissions-field",
  ACCOUNT: "account-field",
  STATUS: "status-field",
  ACCOUNT_EDITABLE: "account-editable-field",
  ORGANIZATION_EDITABLE: "organization-editable-field",
  DATASET_EDITABLE: "dataset-editable-field",
  ACCOUNT_DETAILS_EXTRA: "account-details-field",
  PERMISSIONS: "permissions-field",
  LICENSE: "license-field",
};

const UserDetailsCardField = ({ fieldOption, tabName }) => {
  // given a field name, create a field with the appropriate attributes, classnames, etc
  let field = ``;
  const fieldContainer = document.createElement("div");

  if (fieldOption === FIELD_OPTIONS.DATASET_EDITABLE) {
    fieldContainer.style.display = "flex";
    fieldContainer.style.flexDirection = "row";
    fieldContainer.style.justifyContent = "space-between";

    field = `
      <div class="card-container ${tabName}">
        <div style="width: 100%; display: flex">
          <h5 class="card-left" style="padding-right: 5px">Current dataset:</h5>
          <div class="change-current-account ds-dd dataset-name" style="margin-left: 10px">
            <h5 class="card-right ps-dataset-span" style="width: fit-content">None</h5>

              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" class="tabler-icon tabler-icon-edit svg-change-current-account">
                <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path>
              </svg>
          </div>
        </div>
        <div class="ui active blue inline loader small" style="display: none"></div>
      </div>
      `;
  } else if (fieldOption === FIELD_OPTIONS.ORGANIZATION_EDITABLE) {
    fieldContainer.style.display = "flex";
    fieldContainer.style.flexDirection = "row";
    fieldContainer.style.justifyContent = "space-between";

    field = `
        <div class="card-container ${tabName}">
          <div style="width: 100%; display: flex">
            <h5 class="card-left" style="padding-right: 5px">Current workspace:</h5>
            <div class="change-current-account ds-dd organization" style="margin-left: 12px">
              <h5 class="card-right ps-organization-span" style="width: fit-content">None</h5>

              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" class="tabler-icon tabler-icon-edit svg-change-current-account organization">
                <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path>
              </svg>
            </div>
          </div>
          <div class="ui active blue inline loader small organization-loader" style="display: none"></div>
        </div>
    `;
  } else if (fieldOption === FIELD_OPTIONS.ACCOUNT_DETAILS_EXTRA) {
    field = `
      <div style="display: flex; flex-direction: row; margin-bottom: 15px">
          <div class="card-container ${tabName}">
            <div>
              <h5 class="card-left" style="padding-right: 21px; width: 40%">
                Account details:
              </h5>
              <h5 class="card-right ps-account-details-span" style="padding-left: 4px;">None</h5>
            </div>
          </div>
        </div>
      `;
  } else if (fieldOption === FIELD_OPTIONS.OWNER_PERMISSIONS) {
    fieldContainer.style.display = "flex";
    fieldContainer.style.flexDirection = "row";
    fieldContainer.style.justifyContent = "space-between";
    field = `
            <div class="card-container manage-dataset" style="overflow-x: hidden">
              <div>
                <h5
                  class="card-left"
                  style="text-align: left; padding-right: 10px; width: 140px; margin-right: 60px;"
                >
                  Current owner:
                </h5>
                <h5
                  class="card-right current-permissions"
                  id="para-dataset-permission-current"
                >
                  None
                </h5>
              </div>
            </div>
          </div>
    `;
    // dataset account information field
  } else if (fieldOption === FIELD_OPTIONS.ACCOUNT_EDITABLE) {
    fieldContainer.style.display = "flex";
    fieldContainer.style.flexDirection = "row";
    fieldContainer.style.justifyContent = "space-between";

    field = `
        <div class="card-container ${tabName}">
          <div style="display: flex">
            <h5 class="card-left" style="padding-right: 5px">Current account:</h5>
            <div
              class="change-current-account md-change-current-account"
              style="margin-left: 6px"
            >
              <h5 class="card-right ps-account-span" style="width: fit-content">None</h5>

              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" class="tabler-icon tabler-icon-edit svg-change-current-account">
                <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path>
              </svg>
            </div>
          </div>
        </div>
    `;
  } else if (fieldOption === FIELD_OPTIONS.PERMISSIONS) {
    fieldContainer.style.display = "flex";
    fieldContainer.style.flexDirection = "row";

    field = `
        <div class="card-container ${tabName}" style="overflow-x: hidden">
          <div>
            <h5
              class="card-left"
              style="text-align: left; padding-right: 11px; width: 200px;"
            >
              Current permissions:
            </h5>
            <h5
              class="card-right current-permissions"
              id="para-add-edit-dataset-permission-current"
              style="padding-left: 6px; overflow-y: hidden; overflow-x: hidden"
            >
              None
            </h5>
          </div>
        </div>
    `;
  } else if (fieldOption === FIELD_OPTIONS.LICENSE) {
    fieldContainer.style.display = "flex";
    fieldContainer.style.flexDirection = "row";
    fieldContainer.style.marginBottom = "15px";
    field = `
        <div class="card-container manage-dataset" style="overflow-x: hidden">
          <div>
            <h5 class="card-left" style="text-align: left; padding-right: 21px; width: 200px;">
              Current license:
            </h5>
            <h5
              id="para-dataset-license-current"
              class="card-right"
              style="margin-top: 0px; padding-left: 5px"
            >
              None
            </h5>
          </div>
        </div>
      </div>
    `;
  }

  fieldContainer.insertAdjacentHTML("beforeend", field);

  // return the html field element for insertion into the DOM
  return fieldContainer;

  // KEY: The UserDetailsCard imports this and uses the a given field as a parma to use this function to create the desired field name
};

export { UserDetailsCardField, FIELD_OPTIONS };
