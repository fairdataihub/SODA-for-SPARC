import React, { useState, useEffect } from "react";
import { Box, Text, Group, TextInput, Loader, Stack, ScrollArea, Button } from "@mantine/core";
import { IconSearch, IconFolder, IconFile, IconFilterOff } from "@tabler/icons-react";
import useGlobalStore from "../../stores/globalStore";
import {
  setDatasetStructureSearchFilter,
  clearEntityFilter,
} from "../../stores/slices/datasetTreeViewSlice";

/**
 * File Explorer Component
 *
 * Displays a hierarchical view of files and folders with support for filtering
 */
const FileExplorer = ({ hideClearFilter = false }) => {
  const renderDatasetStructureJSONObj = useGlobalStore(
    (state) => state.renderDatasetStructureJSONObj
  );
  const renderDatasetStructureJSONObjIsLoading = useGlobalStore(
    (state) => state.renderDatasetStructureJSONObjIsLoading
  );
  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );
  const entityFilterActive = useGlobalStore((state) => state.entityFilterActive);
  const entityFilterName = useGlobalStore((state) => state.entityFilterName);

  const [searchValue, setSearchValue] = useState("");

  // Update search filter when the user types in the search box
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDatasetStructureSearchFilter(searchValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const renderFolder = (folder, name, level = 0) => {
    if (!folder) return null;

    const indentation = level * 20;

    return (
      <Box key={name}>
        <Group spacing="xs" style={{ paddingLeft: indentation }}>
          <IconFolder size={16} color="#228be6" />
          <Text>{name}</Text>
        </Group>

        {/* Render subfolders */}
        {folder.folders &&
          Object.entries(folder.folders).map(([subName, subFolder]) =>
            renderFolder(subFolder, subName, level + 1)
          )}

        {/* Render files */}
        {folder.files &&
          Object.entries(folder.files).map(([fileName, file]) => (
            <Group key={fileName} spacing="xs" style={{ paddingLeft: indentation + 20 }}>
              <IconFile size={16} color="#868e96" />
              <Text>{fileName}</Text>
            </Group>
          ))}
      </Box>
    );
  };

  const handleClearFilter = () => {
    clearEntityFilter();
  };

  // Simplified renderFilterNotice - only shows when entity filter is active AND clearFilter isn't hidden
  const renderFilterNotice = () => {
    if (!entityFilterActive || hideClearFilter) return null;

    return (
      <Group
        position="apart"
        style={{ padding: "0.5rem", backgroundColor: "#f1f3f5", borderRadius: "4px" }}
      >
        <Text size="sm">
          <b>Active Filter:</b> Showing only files in entity "{entityFilterName}"
        </Text>
        <Button
          variant="subtle"
          compact
          leftIcon={<IconFilterOff size={16} />}
          onClick={handleClearFilter}
        >
          Clear Filter
        </Button>
      </Group>
    );
  };

  if (renderDatasetStructureJSONObjIsLoading) {
    return (
      <Box style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <Loader />
      </Box>
    );
  }

  const isEmpty =
    !renderDatasetStructureJSONObj ||
    ((!renderDatasetStructureJSONObj.folders ||
      Object.keys(renderDatasetStructureJSONObj.folders).length === 0) &&
      (!renderDatasetStructureJSONObj.files ||
        Object.keys(renderDatasetStructureJSONObj.files).length === 0));

  return (
    <Stack spacing="md">
      <TextInput
        placeholder="Search files..."
        icon={<IconSearch size={16} />}
        value={searchValue}
        onChange={handleSearchChange}
      />

      {renderFilterNotice()}

      <ScrollArea style={{ height: "400px" }}>
        {isEmpty ? (
          <Box style={{ padding: "2rem", textAlign: "center" }}>
            <Text color="dimmed">
              No files found
              {datasetStructureSearchFilter ? ` matching "${datasetStructureSearchFilter}"` : ""}.
            </Text>
          </Box>
        ) : (
          <Box>
            {renderDatasetStructureJSONObj.folders &&
              Object.entries(renderDatasetStructureJSONObj.folders).map(([name, folder]) =>
                renderFolder(folder, name)
              )}

            {renderDatasetStructureJSONObj.files &&
              Object.entries(renderDatasetStructureJSONObj.files).map(([fileName, file]) => (
                <Group key={fileName} spacing="xs">
                  <IconFile size={16} color="#868e96" />
                  <Text>{fileName}</Text>
                </Group>
              ))}
          </Box>
        )}
      </ScrollArea>
    </Stack>
  );
};

export default FileExplorer;
