import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Paper } from "@mantine/core";

import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";

const DatasetEntityManagementPage = () => {
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  console.log("datasetEntityArray", datasetEntityArray);

  return (
    <GuidedModePage pageHeader="Dataset Entity IDs">
      <GuidedModeSection>
        <Text>
          The SDS requires you to assign each entity in your dataset a unique identifier. (There
          will be more text here describing the types of entities depending on what the user
          selected on the dataset content page)
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Paper withBorder shadow="sm" p="md" mb="sm">
          <Text ta="center" size="lg" fw={700} mb="sm" align>
            Entity Structure
          </Text>

          <EntityHierarchyRenderer allowEntityStructureEditing={true} />
        </Paper>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityManagementPage;
