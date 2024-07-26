import {
  swalConfirmAction,
  swalShowError,
  swalShowInfo,
  swalShowLoading,
} from "../../../../../scripts/utils/swal-utils";
import { clientError } from "../../../../../scripts/others/http-error-handler/error-handler";

export const accountsClickHandlers = async (index) => {
  switch (index) {
    case 0:
      connectPennsieveAccountClickHandler();
      break;
    case 1:
      changeWorkspaceClickHandler();
      break;
    case 2:
      disconnectPennsieveAccountClickHandler();
      break;
    case 3:
      testPennsieveConnectionClickHandler();
      break;
    default:
      console.log("Invalid row index");
      break;
  }
};

const connectPennsieveAccountClickHandler = () => {
  window.addBfAccount(null, false);
};

const changeWorkspaceClickHandler = () => {
  window.openDropdownPrompt(null, "organization", false);
};

const disconnectPennsieveAccountClickHandler = async () => {
  let defaultProfile = window.getDefaultProfile();
  if (!defaultProfile) {
    swalShowError(
      "Cannot Disconnect Account",
      "If you have previously connected your Pennsieve account with SODA then you will need to make it the active account before you can disconnect it. To make your account active please click the 'Connect Your Pennsieve Account' option. "
    );
    return;
  }
  // TODO: Force user to login and check the resulting profile matches the current account before allowing them to disconnect?
  let response = await swalConfirmAction(
    "warning",
    "Disconnect Pennsieve Account from SODA",
    "You will need to reconnect your Pennsieve account to use Pennsieve features in SODA. Are you sure you want to disconnect?",
    "Yes",
    "No"
  );
  if (response) {
    window.disconnectPennsieveAccount(defaultProfile.profile_key);
  }
};

const testPennsieveConnectionClickHandler = async () => {
  swalShowLoading("Testing Connection", "Please wait while we test your connection to Pennsieve.");

  if (
    !(
      window.defaultBfAccount !== undefined ||
      (window.defaultBfAccount === undefined && window.getDefaultProfile())
    )
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await swalShowError(
      "No Pennsieve Account Connected",
      "Please use the 'Connect Your Pennsieve Account' option and try again."
    );
    return;
  }

  try {
    const accountValid = await window.check_api_key();
    if (!accountValid) {
      await swalShowError(
        "Your Pennsieve account connected to SODA is invalid",
        "Please use the 'Connect Your Pennsieve Account' option and try again."
      );
      return;
    }
    await window.synchronizePennsieveWorkspace();
  } catch (e) {
    clientError(e);
    await swalShowInfo(
      "Something went wrong while verifying your profile",
      "Please try again. If this issue persists please use our `Contact Us` page to report the issue."
    );
    return;
  }

  swalShowInfo(
    "Connection Test Passed",
    "All Pennsieve based features of SODA should work as expected."
  );
};
