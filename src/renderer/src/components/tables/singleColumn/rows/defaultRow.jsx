import { Table } from "@mantine/core";

export const defaultRow = (row, index, handleRowClick) => (
  <Table.Tr key={index} onClick={() => handleRowClick(index)}>
    <Table.Td style={{ textAlign: "left" }}>{row}</Table.Td>
  </Table.Tr>
);
