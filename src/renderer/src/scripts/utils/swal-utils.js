import Swal from "sweetalert2";

const swalShowError = async (title, errorText) => {
  await Swal.fire({
    title: title,
    html: errorText,
    icon: "error",
    width: 600,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    confirmButtonText: "OK",
  });
};

export const swalFileListSingleAction = async (fileList, title, helpText, postActionText) => {
  await Swal.fire({
    title: title,
    html: `
        ${helpText ? `<p>${helpText}</p>` : ""}
        <div class="swal-file-list">
          ${fileList
            .map(
              (file) =>
                `<div class="swal-file-row"><span class="swal-file-text">${file}</span></div>`
            )
            .join("")}
        </div>
        ${postActionText ? `<b>${postActionText}</b>` : ""}
      `,
    width: 800,
    heightAuto: false,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: false,
    showCloseButton: false,
  });
};

export const swalFileListDoubleAction = async (
  fileList,
  title,
  helpText,
  confirmButtonText,
  cancelButtonText,
  confirmationText
) => {
  const { value: action } = await Swal.fire({
    title: title,
    html: `
        ${helpText}
        <div class="swal-file-list">
          ${fileList
            .map(
              (file) =>
                `<div class="swal-file-row"><span class="swal-file-text">${file}</span></div>`
            )
            .join("")}
        </div>
        <b>${confirmationText}</b>
      `,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    showCloseButton: false,
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
  });
  return action;
};

export const swalFileListTripleAction = async (
  fileList,
  title,
  helpText,
  confirmButtonText,
  denyButtonText,
  cancelButtonText,
  confirmationText
) => {
  const { value: action } = await Swal.fire({
    title: title,
    html: `
        ${helpText}
        <div class="swal-file-list">
          ${fileList
            .map(
              (file) =>
                `<div class="swal-file-row"><span class="swal-file-text">${file}</span></div>`
            )
            .join("")}
        </div>
        <b>${confirmationText}</b>
      `,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCloseButton: false,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: confirmButtonText,
    denyButtonText: denyButtonText,
    cancelButtonText: cancelButtonText,
    customClass: {
      confirmButton: "swal-confirm-button",
      denyButton: "swal-deny-button",
      cancelButton: "swal-cancel-button",
    },
  });
  if (action === true) {
    return "confirm";
  } else if (action === false) {
    return "deny";
  } else {
    return "cancel";
  }
};
