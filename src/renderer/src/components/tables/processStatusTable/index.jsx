import { Table, Text, Container } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const ProcessStatusTable = ({ tableId }) => {
  const rowData = useGlobalStore((state) => state.processStatusTableData[tableId]) || [];
  const rows = rowData.map((row) => (
    <Table.Tr key={row.rowName}>
      <Table.Td style={{ maxWidth: "500px" }}>
        <Text>{row.rowName}</Text>
      </Table.Td>
      <Table.Td style={{ maxWidth: "300px" }}>
        <Text>{row.rowStatus}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table stickyHeader withTableBorder stickyHeaderOffset={-10} captionSide="top">
      <Table.Caption>
        <Text fw={700} size="xl">
          Process Status Table
        </Text>
      </Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ textAlign: "left" }}>Name</Table.Th>
          <Table.Th style={{ textAlign: "left" }}>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};

export default ProcessStatusTable;
