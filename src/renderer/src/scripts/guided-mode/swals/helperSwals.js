import Swal from "sweetalert2";

// Function that allows the user to retry fetching the page if any errors occur
// while pulling from Pennsieve. Ultimately, this function just tries to re-open the page
export const guidedShowOptionalRetrySwal = async (
  errorMessage,
  pageIdToRetryOpening,
  retryAsyncCallback
) => {
  const { value: addDataManually } = await Swal.fire({
    icon: "info",
    title: "Your dataset is missing a required component",
    html: `
        ${errorMessage}
        <br />
        <br />
        You may either add the data in SODA or retry fetching the data from Pennsieve
      `,
    width: 700,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showCancelButton: true,
    confirmButtonText: "Add data in SODA",
    cancelButtonText: "Retry",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  if (!addDataManually) {
    await retryAsyncCallback(pageIdToRetryOpening);
  }
};
