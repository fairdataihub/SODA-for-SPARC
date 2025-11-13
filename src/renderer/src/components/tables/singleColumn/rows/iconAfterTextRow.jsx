import { Table } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import classes from "../../tables.module.css";

export const singleColumnIconAfterTextRow = (row, index, handleRowClick) => (
  <Table.Tr key={index} onClick={() => handleRowClick(index)} className={classes["table-row"]}>
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
        <IconChevronRight
          style={{
            color: "var(--mantine-color-primary-6)",
          }}
        />
      </div>
    </Table.Td>
  </Table.Tr>
);
