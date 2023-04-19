const { UserDetailsCardField } = require("./UserDetailsCardField");

const UserDetailsCard = ({
  tabName,
  buttonId,
  currentTab,
  currentParentTab,
  action,
  section,
  dataNext,
  fields,
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

  for (const field of fields) {
    // console.log("Adding field: ", field);
    let fieldContainer = UserDetailsCardField({
      fieldOption: field,
      tabName: tabName,
    });

    cardContainer.appendChild(fieldContainer);
  }

  const cardButton = `
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

  cardContainer.insertAdjacentHTML("beforeend", cardButton);

  return cardContainer;
};

module.exports = { UserDetailsCard };
