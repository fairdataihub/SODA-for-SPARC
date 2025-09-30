import React, { useMemo } from "react";
import { Stack, Text, Paper, Group, ActionIcon, Tooltip } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";

// Example config: each id maps to an array of row configs
const dataConfig = {
  "ffm-data-importer-dropzone": [
    {
      rowKey: "org-dataset-folder-path",
      isEditable: false,
      rowDisplayName: "Dataset Folder Path",
      editable: false,
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
      const label = row.rowDisplayName || row.rowKey;
      return label.length > max ? label.length : max;
    }, 0);
  }, [rowConfigs]);

  // If all of the row values are undefined, show placeholder
  if (rowValues.every((value) => value === undefined)) {
    return (
      <Paper radius="md" p="lg" withBorder>
        <Text ta="center" c="gray.6" fw={500}>
          No Data Available
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="md" align="stretch">
        {rowConfigs.map((row, idx) => (
          <Group
            key={row.rowKey}
            justify="space-between"
            wrap="nowrap"
            w="100%"
            px="sm"
            py="xs"
            bd={
              idx !== rowConfigs.length - 1
                ? "0 0 1px solid var(--mantine-color-gray-3)"
                : undefined
            }
          >
            <Text
              fw={600}
              c="gray.8"
              ta="right"
              mr="md"
              style={{
                minWidth: `${maxLabelLength + 2}ch`,
              }}
            >
              {(row.rowDisplayName || row.rowKey) + ":"}
            </Text>
            <Text fw={500} c="gray.7" ta="left" flex={1}>
              {rowValues[idx] ?? (
                <Text component="span" c="gray.4">
                  No Value
                </Text>
              )}
            </Text>
            {row.isEditable && (
              <Tooltip label="Edit" position="right" withArrow>
                <ActionIcon
                  variant="light"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement edit logic for this row
                    console.log("Edit clicked for", row.rowKey);
                  }}
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        ))}
      </Stack>
    </Paper>
  );
};

export default StateDisplayContainer;
