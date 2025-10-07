import React, { useMemo } from "react";
import { Stack, Text, Paper, Group, ActionIcon, Tooltip, Divider } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";

// Example config with editable rows using onEdit callbacks
const dataConfig = {
  "ffm-data-importer-dropzone": [
    {
      rowKey: "org-dataset-folder-path",
      rowDisplayName: "Dataset Folder Path",
      onEdit: (value, row) => {
        document.getElementById("ffm-data-importer-dropzone").click();
      },
    },
  ],
};

const StateDisplayContainer = ({ id }) => {
  const rowConfigs = dataConfig[id] || [];
  const rowValues = useGlobalStore((state) =>
    rowConfigs.map((row) => state.stateDisplay?.[row.rowKey])
  );

  // Longest label for alignment
  const maxLabelLength = useMemo(
    () =>
      rowConfigs.reduce((max, row) => {
        const label = row.rowDisplayName || row.rowKey;
        return Math.max(max, label.length);
      }, 0),
    [rowConfigs]
  );

  // Skip rendering if all values are missing
  if (rowValues.every((value) => value === undefined)) {
    return null;
  }

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap={0}>
        {rowConfigs.map((row, idx) => {
          const value = rowValues[idx];
          const valueStr = value === undefined || value === null ? "No Value" : String(value);
          // Show tooltip if value is long
          const maxValueLength = 45;
          const isLong = valueStr.length > maxValueLength;
          const displayValue = isLong ? valueStr.slice(0, maxValueLength - 3) + "..." : valueStr;
          return (
            <React.Fragment key={row.rowKey}>
              <Group gap="md" justify="space-between" wrap="nowrap" w="100%">
                {/* Label (no colon) */}
                <Text fw={600} c="gray.8" ta="right" w={`${maxLabelLength + 1}ch`} truncate>
                  {row.rowDisplayName || row.rowKey}:
                </Text>

                {/* Value with tooltip if long */}
                {isLong ? (
                  <Tooltip label={valueStr} position="top" withArrow zIndex={2999}>
                    <Text fw={500} c="gray.7" flex={1} ta="left" truncate>
                      {displayValue}
                    </Text>
                  </Tooltip>
                ) : (
                  <Text
                    fw={500}
                    c={valueStr === "No Value" ? "gray.4" : "gray.7"}
                    flex={1}
                    ta="left"
                    truncate
                  >
                    {displayValue}
                  </Text>
                )}

                {/* Edit button if onEdit is defined */}
                {row.onEdit && (
                  <Tooltip label="Edit" position="right" withArrow>
                    <ActionIcon
                      variant="light"
                      size="sm"
                      onClick={() => row.onEdit(rowValues[idx], row)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </React.Fragment>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default StateDisplayContainer;
