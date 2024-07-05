import { Table } from "@mantine/core";

const SingleColumnTable = ({ columnName, rowData }) => {
  const rows = rowData.map((row, index) => {
    return (
      <Table.Tr key={index}>
        <Table.Td>{row}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table>
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
