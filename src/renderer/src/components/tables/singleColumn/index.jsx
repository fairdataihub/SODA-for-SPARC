import { Table } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { IconChevronRight } from "@tabler/icons-react";
import {getClickHandlerFunctions} from "./clickHandlers/clickHandlersFactory"



const SingleColumnTable = ({ columnName, id }) => {
  const rowData = useGlobalStore((state) => state.tableData[id]) || [];

  const rows = rowData.map((row, index) => {
    return (
      <Table.Tr key={index} onClick={() => handleRowClick(index)}>
        <Table.Td style={{ textAlign: "left", cursor: "pointer" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {row}
            <IconChevronRight />
          </div>
        </Table.Td>
      </Table.Tr>
    );
  });

  const handleRowClick = (index) => {
    let clickHandlerFunction = getClickHandlerFunctions(id);
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
