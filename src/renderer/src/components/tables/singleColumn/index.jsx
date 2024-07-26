import { Table } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { getClickHandlerFunctions } from "./clickHandlers/clickHandlersFactory";
import { getRowConfiguration } from "./rows/rowConfigurationFactory";

const SingleColumnTable = ({ columnName, id }) => {
  const handleRowClick = (index) => {
    let clickHandlerFunction = getClickHandlerFunctions(id);
    clickHandlerFunction(index);
  };

  const rowConfiguration = getRowConfiguration(id);

  const rowData = useGlobalStore((state) => state.tableData[id]) || [];

  const rows = rowData.map((row, index) => {
    return rowConfiguration(row, index, handleRowClick);
  });

  const tableProps = {
    withTableBorder: true,
    highlightOnHover: true,
  };

  return (
    <Table {...tableProps}>
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
