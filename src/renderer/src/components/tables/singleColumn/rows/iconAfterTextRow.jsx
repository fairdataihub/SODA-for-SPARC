import { Table } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";


export const singleColumnIconAfterTextRow = (row, index, handleRowClick) => (
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