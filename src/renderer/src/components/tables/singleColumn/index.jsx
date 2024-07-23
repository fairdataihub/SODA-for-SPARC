import { Table } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { swalConfirmAction, swalShowError, swalShowInfo } from "../../../scripts/utils/swal-utils";

const getClickHandlerFunction = (id) => {
  if (id === "account-options-table") {
    return async (index) => {
      switch (index) {
        case 0:
          window.addBfAccount(null, false);
          break;
        case 1:
          console.log("Change Workspace clicked");
          window.openDropdownPrompt(null, "organization", false);
          break;
        case 2:
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
            "info",
            "Disconnect Pennsieve Account from SODA",
            "You will need to reconnect your Pennsieve account to use SODA again. Are you sure you want to disconnect?",
            "Yes",
            "No"
          );
          if (response) {
            window.disconnectPennsieveAccount(defaultProfile.profile_key);
          }
          break;
        case 3:
          let responseTestConnection = await swalConfirmAction(
            "info",
            "Test Connection With Pennsieve",
            "Are you sure you want to test connection with Pennsieve?",
            "Yes",
            "No"
          );

          if (!responseTestConnection) return;

          // Check for an API key pair in the default profile and ensure it is not obsolete.
          const accountValid = await window.check_api_key(true);

          // Add a new api key and secret for validating the user's account in the current workspace.
          if (!accountValid) {
            await swalShowInfo(
              "Your Pennsieve account connected to SODA is invalid",
              "Please use the 'Connect Your Account With Pennsieve' option and try again."
            );
            return;
          }
          await swalShowInfo(
            "Your Pennsieve account account connected to SODA is valid ",
            "All Pennsieve based features of SODA should work as expected."
          );
          break;
        default:
          console.log("Invalid row index");
          break;
      }
    };
  }
};

const SingleColumnTable = ({ columnName, id }) => {
  const rowData = useGlobalStore((state) => state.tableData[id]) || [];

  const rows = rowData.map((row, index) => {
    return (
      <Table.Tr key={index} onClick={() => handleRowClick(index)}>
        <Table.Td style={{ textAlign: "left", cursor: "pointer" }}>{row}</Table.Td>
      </Table.Tr>
    );
  });

  const handleRowClick = (index) => {
    let clickHandlerFunction = getClickHandlerFunction(id);
    clickHandlerFunction(index);
  };

  return (
    <Table withTableBorder highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{columnName}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};

export default SingleColumnTable;
