export const addContributor = (
  contributorFullName,
  contributorORCID,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  //Check if the contributor already exists

  if (getContributorByOrcid(contributorORCID)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }

  //If the contributorFullName has one comma, we can successfully split the name into first and last name
  //If not, they will remain as empty strings until they are edited
  let contributorFirstName = "";
  let contributorLastName = "";
  if (contributorFullName.split(",").length === 2) {
    [contributorLastName, contributorFirstName] = contributorFullName
      .split(",")
      .map((name) => name.trim());
  }

  window.sodaJSONObj["dataset_contributors"].push({
    contributorFirstName: contributorFirstName,
    contributorLastName: contributorLastName,
    conName: contributorFullName,
    conID: contributorORCID,
    conAffliation: contributorAffiliationsArray,
    conRole: contributorRolesArray,
  });

  // Store the contributor locally so they can import the contributor's data in the future
  try {
    window.addOrUpdateStoredContributor(
      contributorFirstName,
      contributorLastName,
      contributorORCID,
      contributorAffiliationsArray,
      contributorRolesArray
    );
  } catch (error) {
    console.error("Failed to store contributor locally" + error);
  }
};

export const renderDatasetDescriptionContributorsTable = () => {
  const contributorsTable = document.getElementById("guided-DD-connoributors-table");

  let contributorsTableHTML;

  const contributors = window.sodaJSONObj["dataset_contributors"];

  if (contributors.length === 0) {
    contributorsTableHTML = `
        <tr>
          <td colspan="6">
            <div style="margin-right:.5rem" class="alert alert-warning guided--alert" role="alert">
              No contributors have been added to your dataset. To add a contributor, click the "Add a new contributor" button below.
            </div>
          </td>
        </tr>
      `;
  } else {
    contributorsTableHTML = contributors
      .map((contributor, index) => {
        let contributorIndex = index + 1;
        return generateContributorTableRow(contributor, contributorIndex);
      })
      .join("\n");
  }
  contributorsTable.innerHTML = contributorsTableHTML;
};

export const getContributorByOrcid = (orcid) => {
  const contributors = window.sodaJSONObj["dataset_contributors"];
  const contributor = contributors.find((contributor) => {
    return contributor.conID == orcid;
  });
  return contributor;
};

const generateContributorTableRow = (contributorObj, contributorIndex) => {
  const contributorObjIsValid = window.contributorDataIsValid(contributorObj);
  const contributorFullName = contributorObj["conName"];
  const contributorOrcid = contributorObj["conID"];
  const contributorRoleString = contributorObj["conRole"].join(", ");

  return `
    <tr 
      data-contributor-orcid=${contributorOrcid}
      draggable="true"
      ondragstart="window.handleContributorDragStart(event)"
      ondragover="window.handleContributorDragOver(event)"
      ondragend="window.handleContributorDrop(event)"
      style="cursor: move;"
    >
      <td class="middle aligned collapsing text-center">
        ${contributorIndex}
      </td>
      <td class="middle aligned">
        ${contributorFullName}
      </td>
      <td class="middle aligned">
        ${contributorRoleString}
      </td>
      <td class="middle aligned collapsing text-center">
        ${
          contributorObjIsValid
            ? `<span class="badge badge-pill badge-success">Valid</span>`
            : `<span class="badge badge-pill badge-warning">Needs Modification</span>`
        }
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
          onclick="window.openGuidedEditContributorSwal('${contributorOrcid}')"
        >
        View/Edit
        </button>
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm" 
          onclick="window.deleteContributor(this, '${contributorOrcid}')"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};
