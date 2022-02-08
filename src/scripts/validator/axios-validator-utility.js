const handleAxiosValidationErrors = (errorObject) => {
    if (errorObject.response) {
      Swal.fire({
        title: `Your dataset could not be validated`,
        text: `${errorObject.response.status} - ${errorObject.response.data}`,
        allowEscapeKey: true,
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
      });
    } else if (errorObject.request) {
      Swal.fire({
        title: `The server could not be reached for validation`,
        text: "Please restart SODA and try again. If this issue continues please contact the SODA team at sodasparc@gmail.com",
        allowEscapeKey: true,
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
      });
    } else {
      // error with creating the request
      Swal.fire({
        title: `The validation request is malformed`,
        text: "This is not caused by any user action. Reach out to the SODA team if this happens again by using sodasparc@gmail.com.",
        allowEscapeKey: true,
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
      });
    }
  };

exports.handleAxiosValidationErrors = handleAxiosValidationErrors