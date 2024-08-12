import { Table, Text, Loader, ScrollArea } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import useGlobalStore from "../../../stores/globalStore";

const ProcessStatusTable = ({ tableId }) => {
  const rowData = useGlobalStore((state) => state.processStatusTableData[tableId]) || [];
  const scrollAreaRef = useRef(null);

  const progressComponents = {
    loading: <Loader my="sm" />,
    success: <IconCheck color="green" stroke={3} />,
  };

  const generateProgressDisplay = (progress) =>
    progressComponents[progress] || <Text>{progress}</Text>;

  const rows = rowData.map((row) => (
    <tr key={row.rowId}>
      <td>
        <Text>{row.status}</Text>
      </td>
      <td style={{ textAlign: "center" }}>{generateProgressDisplay(row.progress)}</td>
    </tr>
  ));

  useEffect(() => {
    // Scroll to the bottom of the table when rowData changes
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [rowData]);

  return (
    <Table stickyHeader withTableBorder captionSide="top">
      <Table.Caption>
        <Text fw={700} size="xl">
          Process Status Table
        </Text>
      </Table.Caption>
      <ScrollArea h={400} viewportRef={scrollAreaRef} style={{ width: "100%" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Status</Table.Th>
            <Table.Th style={{ textAlign: "center" }}>Progress</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </ScrollArea>
    </Table>
  );
};

export default ProcessStatusTable;
