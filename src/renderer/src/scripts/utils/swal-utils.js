import Swal from "sweetalert2";

// TODO: Convert to new conventions
const swalGetUserTextInput = async (
  title,
  inputLabel,
  validationRegex,
  textToDisplayIfRegexValidationFails,
  confirmButtonText,
  cancelButtonText
) => {
  const { value: textInput } = await Swal.fire({
    title: title,
    input: "text",
    inputLabel: inputLabel,
    width: 600,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    inputValidator: (value) => {
      if (!value) {
        return "Input can not be empty.";
      }
      if (!validationRegex.test(value)) {
        return textToDisplayIfRegexValidationFails;
      }
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  return textInput;
};

export const swalShowError = async (title, errorText) => {
  await Swal.fire({
    title: title,
    html: errorText,
    icon: "error",
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    confirmButtonText: "OK",
  });
};

export const swalShowInfo = async (title, infoText) => {
  await Swal.fire({
    title: title,
    html: infoText,
    icon: "info",
    width: 800,
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
      ${helpText ? `<p class="text-left">${helpText}</p>` : ""}
      <div class="swal-file-list">
        ${fileList
          .map(
            (file) => `<div class="swal-file-row"><span class="swal-file-text">${file}</span></div>`
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
      ${helpText ? `<p class="text-left">${helpText}</p>` : ""}
      <div class="swal-file-list">
        ${fileList
          .map(
            (file) => `<div class="swal-file-row"><span class="swal-file-text">${file}</span></div>`
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
      <p class="text-left">${helpText}</p>
      <div class="swal-file-list">
        ${fileList
          .map(
            (file) => `<div class="swal-file-row"><span class="swal-file-text">${file}</span></div>`
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

export const swalConfirmAction = async (icon, title, text, confirmButtonText, cancelButtonText) => {
  const { value: action } = await Swal.fire({
    icon: icon,
    title: title,
    html: text,
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
