const handleAxiosValidationErrors = async (errorObject) => {
  // prevent dreaded Sweet Alert error where the didLoading property's spinner doesn't disappear
  // and overwrites/obfuscates the confirm button text
  await wait(500);
  if (errorObject.response) {
    Swal.fire({
      title: `Your dataset could not be validated`,
      text: `${errorObject.response.status} - ${errorObject.response.data}`,
      icon: "error",
      allowEscapeKey: true,
      allowOutsideClick: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else if (errorObject.request) {
    Swal.fire({
      title: `The server could not be reached for validation`,
      text: "Please restart SODA and try again. If this issue continues please contact the SODA team at sodasparc@gmail.com",
      icon: "error",
      allowEscapeKey: true,
      allowOutsideClick: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else {
    // error with creating the request
    Swal.fire({
      title: `The validation request is malformed`,
      text: "This is not caused by any user action. Reach out to the SODA team at sodasparc@gmail.com if this happens again.",
      icon: "error",
      allowEscapeKey: true,
      allowOutsideClick: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      showConfirmButton: true,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }
};

exports.handleAxiosValidationErrors = handleAxiosValidationErrors;
