import { Table, Text, Loader } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";

const ProcessStatusTable = ({ tableId }) => {
  const rowData = useGlobalStore((state) => state.processStatusTableData[tableId]) || [];

  const progressComponents = {
    loading: <Loader />,
    success: <IconCheck />,
  };

  const generateProgressDisplay = (progress) =>
    progressComponents[progress] || <Text>{progress}</Text>;

  const rows = rowData.map((row) => (
    <Table.Tr key={row.rowId}>
      <Table.Td>
        <Text>{row.status}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: "center" }}>{generateProgressDisplay(row.progress)}</Table.Td>
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
          <Table.Th>Status</Table.Th>
          <Table.Th style={{ textAlign: "center" }}>Progress</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};

export default ProcessStatusTable;
