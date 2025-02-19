import { generateAlertElement } from "./utils.js";
import doiRegex from "doi-regex";
import validator from "validator";



export const addGuidedProtocol = (link, description, type) => {
    const currentProtocolLinks = getGuidedProtocolLinks();

    if (currentProtocolLinks.includes(link)) {
        throw new Error("Protocol link already exists");
    }

    const isFair = protocolObjIsFair(link, description);

    //add the new protocol to the JSONObj
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [
        ...window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"],
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
        return window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"].map(
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
    const protocols = window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

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
            return generateProtocolField(
                protocol["link"],
                protocol["type"],
                protocol["description"],
                protocol["isFair"]
            );
        })
        .join("\n");
    protocolsContainer.innerHTML = protocolElements;
};


//TODO: handle new blank protocol fields (when parameter are blank)
const generateProtocolField = (protocolUrl, protocolType, protocolDescription, isFair) => {
    return `
      <tr 
        class="guided-protocol-field-container"
      >
        <td class="middle aligned link-name-cell" >
          ${protocolUrl}
        </td>
        <td class="middle aligned">
          ${protocolDescription}
        </td>
        <td class="middle aligned collapsing text-center">
          ${isFair
            ? `<span class="badge badge-pill badge-success">Valid</span>`
            : `<span class="badge badge-pill badge-warning">Needs modification</span>`
        }
        </td>
        <td class="middle aligned collapsing text-center">
          <button
            type="button"
            class="btn btn-sm"
            style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
            data-protocol-url="${protocolUrl}"
            data-protocol-description="${protocolDescription}"
            onclick="window.openProtocolSwal(this)"
          >
          View/Edit
          </button>
        </td>
        <td class="middle aligned collapsing text-center">
          <button
            type="button"
            class="btn btn-danger btn-sm"
            data-protocol-url="${protocolUrl}"
            data-protocol-description="${protocolDescription}"
            onclick="window.guidedDeleteProtocol(this)"
          >
          Delete
          </button>
        </td>
      </tr>
    `;
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

window.guidedDeleteProtocol = (protocolElement) => {
    const linkToDelete = protocolElement.dataset.protocolUrl;
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = window.sodaJSONObj[
        "dataset-metadata"
    ]["description-metadata"]["protocols"].filter((protocol) => protocol.link !== linkToDelete);
    renderProtocolsTable();
};



const editGuidedProtocol = (oldLink, newLink, description, type) => {
    const currentProtocolLinks =
        window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
    //find the index of the protocol to be edited
    const protocolIndex = currentProtocolLinks.findIndex((protocol) => protocol.link === oldLink);

    const isFair = protocolObjIsFair(newLink, description);

    //replace the protocol at the index with the new protocol
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"][protocolIndex] = {
        link: newLink,
        type: type,
        relation: "IsProtocolFor",
        description: description,
        isFair: isFair,
    };
};


const determineIfLinkIsDOIorURL = (link) => {
    // returns either "DOI" or "URL" or "neither"
    if (doiRegex.declared({ exact: true }).test(link) === true) {
        return "DOI";
    }
    if (validator.isURL(link) != true) {
        return "neither";
    }
    if (link.includes("doi")) {
        return "DOI";
    } else {
        return "URL";
    }
};