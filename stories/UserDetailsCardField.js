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
  console.log(tabName);
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
            <h5 class="card-right bf-dataset-span" style="width: fit-content">None</h5>

            <svg
              class="svg-change-current-account dataset bi bi-pencil-fill"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="#000"
              viewBox="0 0 16 16"
            >
              <path
                d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
              />
            </svg>
          </div>
        </div>
        <div class="ui active green inline loader small" style="display: none"></div>
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
              <h5 class="card-right bf-organization-span" style="width: fit-content">None</h5>

              <svg
                class="svg-change-current-account organization bi bi-pencil-fill"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="#000"
                viewBox="0 0 16 16"
              >
                <path
                  d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
                />
              </svg>
            </div>
          </div>
          <div class="ui active green inline loader small organization-loader" style="display: none"></div>
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
              <h5 class="card-right bf-account-details-span" style="padding-left: 4px;">None</h5>
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
              <h5 class="card-right bf-account-span" style="width: fit-content">None</h5>

              <svg
                class="svg-change-current-account bi bi-pencil-fill"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="#000"
                viewBox="0 0 16 16"
              >
                <path
                  d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
                />
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
              style="padding-left: 6px"
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

module.exports = { UserDetailsCardField, FIELD_OPTIONS };
