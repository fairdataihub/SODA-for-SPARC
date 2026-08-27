import { Box, Text } from "@mantine/core";
import DataImporter from "./DataImporter";
import useGlobalStore from "../../stores/globalStore";

const EntityBucketingDataImporter = () => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  return (
    <>
      {!selectedHierarchyEntity && (
        <Box p="xl">
          <Text size="sm" c="gray">
            Select an entity from the hierarchy to import files for it.
          </Text>
        </Box>
      )}
      <div style={{ display: selectedHierarchyEntity ? "block" : "none" }}>
        <DataImporter dataImporterId={"entity-bucketing-data-importer-dropzone"} />
      </div>
    </>
  );
};

export default EntityBucketingDataImporter;
