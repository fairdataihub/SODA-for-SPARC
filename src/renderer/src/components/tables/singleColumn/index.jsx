import { Table } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { swalConfirmAction, swalShowError } from "../../../scripts/utils/swal-utils";

const getClickHandlerFunction = (id) => {
  if (id === "account-options-table") {
    return async (index) => {
      switch (index) {
        case 0:
          console.log("Change User clicked");
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
          console.log("Test Connection With Pennsieve clicked");
          swalConfirmAction(
            "info",
            "Test Connection With Pennsieve",
            "Are you sure you want to test connection with Pennsieve?",
            "Yes",
            "No"
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
