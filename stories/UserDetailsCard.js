const UserDetailsCard = ({
  tabName,
  buttonId,
  currentTab,
  currentParentTab,
  action,
  section,
  dataNext,
}) => {
  const cardContainer = document.createElement("div");
  cardContainer.style.display = "flex";
  cardContainer.style.flexDirection = "column";
  cardContainer.style.justifyContent = "space-between";
  cardContainer.style.marginTop = "15px";
  cardContainer.style.height = "auto";
  cardContainer.style.boxShadow = "0px 0px 10px #d5d5d5";
  cardContainer.style.padding = "15px 25px";
  cardContainer.style.borderRadius = "5px";

  const card = `
      <div style="display: flex; flex-direction: row; justify-content: space-between">
        <div class="card-container ${tabName}">
          <div style="display: flex">
            <h5 class="card-left" style="padding-right: 5px">Current account:</h5>
            <div
              class="change-current-account md-change-current-account"
              style="margin-left: 10px"
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
      </div>
      <div style="display: flex; flex-direction: row; margin-bottom: 15px">
        <div class="card-container ${tabName}">
          <div>
            <h5 class="card-left" style="padding-right: 21px; width: 40%">
              Account details:
            </h5>
            <h5 class="card-right bf-account-details-span">None</h5>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between">
        <div class="card-container ${tabName}">
          <div style="width: 100%; display: flex">
            <h5 class="card-left" style="padding-right: 5px">Current dataset:</h5>
            <div class="change-current-account ds-dd" style="margin-left: 10px">
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
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between">
        <div class="card-container ${tabName}">
          <div style="width: 100%; display: flex">
            <h5 class="card-left" style="padding-right: 5px">Current organization:</h5>
            <div class="change-current-account ds-dd" style="margin-left: 10px">
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
      </div>
      <div
        class="div-confirm-button"
        style="
          display: none;
          flex-direction: row;
          justify-content: center;
          margin: 10px auto;
        "
      >
        <button
          id="${buttonId}"
          onclick="transitionFreeFormMode(this, '${currentTab}', '${currentParentTab}', '${action}', '${section}')"
          data-next="${dataNext}"
          class="confirm-button"
          style="
            cursor: pointer;
            border-radius: 8px;
            margin: 10px auto;
            width: 100px;
            height: 30px;
            background: var(--color-light-green);
            color: #fff;
            font-weight: 600;
            border: none;
            font-size: 13px;
          "
        >
          Confirm
        </button>
      </div>

`;

  cardContainer.insertAdjacentHTML("beforeend", card);

  return cardContainer;
};

module.exports = { UserDetailsCard };
