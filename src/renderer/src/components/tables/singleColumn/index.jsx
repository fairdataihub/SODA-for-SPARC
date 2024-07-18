import { Table } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const SingleColumnTable = ({ columnName, id }) => {
  const rowData = useGlobalStore((state) => state.tableData[id]) || [];
  const rows = rowData.map((row, index) => {
    return (
      <Table.Tr key={index}>
        <Table.Td style={{ textAlign: "left" }}>{row}</Table.Td>
      </Table.Tr>
    );
  });

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
