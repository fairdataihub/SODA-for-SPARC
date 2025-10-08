import { generateAlertElement } from "./utils.js";
import doiRegex from "doi-regex";
import validator from "validator";
import Swal from "sweetalert2";

export const addGuidedProtocol = (link, description, type) => {
  const currentProtocolLinks = getGuidedProtocolLinks();

  if (currentProtocolLinks.includes(link)) {
    throw new Error("Protocol link already exists");
  }

  const isFair = protocolObjIsFair(link, description);

  //add the new protocol to the JSONObj
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"] = [
    ...window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"],
    {
      link: link,
      type: type,
      relation: "IsProtocolFor",
      description: description,
      isFair: isFair,
    },
  ];
};

const getGuidedProtocolLinks = () => {
  try {
    return window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"].map(
      (protocol) => protocol.link
    );
  } catch (error) {
    // return an empty array if the protocol array doesn't exist yet
    return [];
  }
};

const protocolObjIsFair = (protocolLink, protocoldescription) => {
  return protocolLink.length > 0 && protocoldescription.length > 0;
};

export const renderProtocolsTable = () => {
  const protocols = window.sodaJSONObj["related_resources"];
  const protocolsContainer = document.getElementById("protocols-container");

  //protocols is either undefined when brand new dataset or 0 when returning from a saved dataset
  if (protocols === undefined || protocols.length === 0) {
    const emptyRowWarning = generateAlertElement(
      "warning",
      "You currently have no protocols for your dataset. To add, click the 'Add a new protocol' button"
    );
    let warningRowElement = `<tr id="protocolAlert"><td colspan="5">${emptyRowWarning}</td></tr>`;
    protocolsContainer.innerHTML = warningRowElement;
    return;
  }

  const protocolElements = protocols
    .map((protocol) => {
      return generateProtocolField(protocol["identifier"], protocol["identifier_description"]);
    })
    .join("\n");
  protocolsContainer.innerHTML = protocolElements;
};

//TODO: handle new blank protocol fields (when parameter are blank)
const generateProtocolField = (identifier, identifier_description) => {
  return `
      <tr 
        class="guided-protocol-field-container"
      >
        <td class="middle aligned link-name-cell" >
          ${identifier}
        </td>
        <td class="middle aligned">
          ${identifier_description}
        </td>
        <td class="middle aligned collapsing text-center">
          <button
            type="button"
            class="btn btn-sm"
            style="color: white; background-color: var(--color-soda-primary); border-color: var(--color-soda-primary);"
            onclick="window.guidedOpenAddOrEditProtocolSwal('${identifier}')"
          >
          View/Edit
          </button>
        </td>
        <td class="middle aligned collapsing text-center">
          <button
            type="button"
            class="btn btn-danger btn-sm"
            onclick="window.guidedDeleteProtocol('${identifier}')"
          >
          Delete
          </button>
        </td>
      </tr>
    `;
};

window.guidedOpenAddOrEditProtocolSwal = async (editIdentifier = null) => {
  let protocolToEdit = null;
  if (editIdentifier) {
    protocolToEdit = (window.sodaJSONObj["related_resources"] || []).find(
      (p) => p.identifier === editIdentifier
    );
  }
  const initialIdentifier = protocolToEdit ? protocolToEdit.identifier : "";
  const initialDescription = protocolToEdit ? protocolToEdit.identifier_description : "";
  await Swal.fire({
    title: protocolToEdit ? "Edit protocol" : "Add a protocol",
    html:
      `<label>Protocol URL or DOI: <i class="fas fa-info-circle swal-popover" data-content="Enter a protocol link or DOI." rel="popover" data-placement="right" data-html="true" data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL or DOI" value="${initialIdentifier}">` +
      `<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a brief description for this protocol." rel="popover" data-placement="right" data-html="true" data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description">${initialDescription}</textarea>`,
    focusConfirm: false,
    confirmButtonText: protocolToEdit ? "Save" : "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    width: "800",
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const identifier = $("#DD-protocol-link").val();
      const identifier_description = $("#DD-protocol-description").val();
      if (identifier === "") {
        Swal.showValidationMessage(`Please enter a URL or DOI!`);
        return;
      }
      if (identifier_description === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
        return;
      }
      let identifier_type = determineIfLinkIsDOIorURL(identifier);
      if (identifier_type === "neither") {
        Swal.showValidationMessage(`Please enter a valid URL or DOI!`);
        return;
      }
      try {
        let protocols = window.sodaJSONObj["related_resources"] || [];
        if (protocolToEdit) {
          protocols = protocols.map((p) =>
            p.identifier === editIdentifier
              ? {
                  ...p,
                  identifier,
                  identifier_description,
                  identifier_type,
                }
              : p
          );
        } else {
          protocols = [
            ...protocols,
            {
              identifier_description,
              relation_type: "IsProtocolFor",
              identifier,
              identifier_type,
            },
          ];
        }
        window.sodaJSONObj["related_resources"] = protocols;
        renderProtocolsTable();
      } catch (error) {
        Swal.showValidationMessage(error);
      }
    },
  });
};

window.openProtocolSwal = async (protocolElement) => {
  // True if adding a new protocol, false if editing an existing protocol
  let protocolURL = "";
  let protocolDescription = "";
  if (protocolElement) {
    protocolURL = protocolElement.dataset.protocolUrl;
    protocolDescription = protocolElement.dataset.protocolDescription;
  }
  await Swal.fire({
    title: "Add a protocol",
    html:
      `<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL" value="${protocolURL}">` +
      `<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description">${protocolDescription}</textarea>`,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    width: "38rem",
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const link = $("#DD-protocol-link").val();
      const protocolDescription = $("#DD-protocol-description").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
        return;
      }
      if (protocolDescription === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
        return;
      }
      let protocolType = determineIfLinkIsDOIorURL(link);
      if (protocolType === "neither") {
        Swal.showValidationMessage(`Please enter a valid URL or DOI!`);
        return;
      }

      try {
        if (!protocolElement) {
          // Add the protocol
          addGuidedProtocol(link, protocolDescription, protocolType);
        } else {
          // Edit the existing protocol
          const protocolToEdit = protocolElement.dataset.protocolUrl;
          editGuidedProtocol(protocolToEdit, link, protocolDescription, protocolType);
        }
        renderProtocolsTable();
      } catch (error) {
        Swal.showValidationMessage(error);
      }
    },
  });
};

window.guidedDeleteProtocol = (identifier) => {
  window.sodaJSONObj["related_resources"] = window.sodaJSONObj["related_resources"].filter(
    (protocol) => protocol.identifier !== identifier
  );
  renderProtocolsTable();
};

const editGuidedProtocol = (oldLink, newLink, description, type) => {
  const currentProtocolLinks =
    window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"];
  //find the index of the protocol to be edited
  const protocolIndex = currentProtocolLinks.findIndex((protocol) => protocol.link === oldLink);

  const isFair = protocolObjIsFair(newLink, description);

  //replace the protocol at the index with the new protocol
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"][protocolIndex] = {
    link: newLink,
    type: type,
    relation: "IsProtocolFor",
    description: description,
    isFair: isFair,
  };
};

const determineIfLinkIsDOIorURL = (link) => {
  // returns "DOI" if DOI, null if not, or "neither" if invalid
  if (doiRegex.declared({ exact: true }).test(link) === true) {
    return "DOI";
  }
  if (validator.isURL(link) === true) {
    return "URL";
  }
  return "neither";
};
