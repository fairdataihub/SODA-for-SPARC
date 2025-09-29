import React, { useEffect, useMemo } from "react";
import { Stack, Text, Paper, Group } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

// Example config: each id maps to an array of row configs
const dataConfig = {
  "ffm-data-importer-dropzone": [
    {
      rowKey: "org-dataset-folder-path",
      isEditable: false,
    },
  ],
  // Add more ids and their row configs here
};

const StateDisplayContainer = ({ id }) => {
  const rowConfigs = dataConfig[id] || [];
  const stateDisplayData = useGlobalStore((state) => state.stateDisplay);

  // Grab values for each rowKey from the store
  const rowValues = useGlobalStore((state) =>
    rowConfigs.map((row) => state.stateDisplay?.[row.rowKey])
  );

  // Calculate the longest left label for alignment
  const maxLabelLength = useMemo(() => {
    return rowConfigs.reduce((max, row) => {
      return row.rowKey.length > max ? row.rowKey.length : max;
    }, 0);
  }, [rowConfigs]);

  // If all of the row values are undefined, show placeholder
  if (rowValues.every((value) => value === undefined)) {
    return (
      <Paper
        shadow="md"
        radius={12}
        p={24}
        withBorder
        style={{ background: "#f8fafc", width: "100%" }}
      >
        <Text align="center" color="gray.6" fw={500}>
          No Data Available
        </Text>
      </Paper>
    );
  }

  return (
    <Paper>
      <Stack spacing="md" align="center" justify="center">
        {rowConfigs.map((row, idx) => (
          <Group
            key={row.rowKey}
            position="apart"
            noWrap
            style={{
              width: "100%",
              padding: "8px 0",
              borderBottom: idx !== rowConfigs.length - 1 ? "1px solid #e0e0e0" : "none",
            }}
          >
            <Text
              fw={600}
              c="gray.8"
              style={{
                minWidth: `${maxLabelLength + 2}ch`,
                textAlign: "right",
                marginRight: 16,
              }}
            >
              {row.rowKey}:
            </Text>
            <Text fw={500} c="gray.7" style={{ textAlign: "left", flex: 1 }}>
              {rowValues[idx] ?? <span style={{ color: "#bdbdbd" }}>No Value</span>}
            </Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
};

export default StateDisplayContainer;
