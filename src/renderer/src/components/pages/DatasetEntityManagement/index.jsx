import { useEffect } from "react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  TextInput,
  NumberInput,
  Text,
  Stack,
  Group,
  Box,
  Flex,
  Paper,
  Divider,
  ScrollArea,
} from "@mantine/core";
import { IconUser, IconFlask, IconClipboard, IconPin } from "@tabler/icons-react";
import {
  setDatasetEntityArray,
  setSpeciesList,
} from "../../../stores/slices/datasetEntityStructureSlice";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";

const DatasetEntityManagementPage = () => {
  // Global configuration for what entities to include.
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  // Retrieve species list and the generated structure from the global store.
  const speciesList = useGlobalStore((state) => state.speciesList);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

  return (
    <GuidedModePage pageHeader="Generate IDs to Associate Data With">
      <GuidedModeSection>
        <Text>
          Provide details about the entities from which you collected data during your study. This
          information will be used to generate unique IDs for data association in the following
          steps.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        {/* Data Structure Preview */}
        <Paper withBorder shadow="sm" p="md" mb="sm">
          <Text size="lg" fw={700} mb="sm">
            Data Structure Preview
          </Text>
          <Text mb="md">
            Please verify that the generated structure below is correct before proceeding.
          </Text>
          <ScrollArea h={650}>
            <EntityHierarchyRenderer datasetEntityArray={datasetEntityArray} />
          </ScrollArea>
        </Paper>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityManagementPage;
