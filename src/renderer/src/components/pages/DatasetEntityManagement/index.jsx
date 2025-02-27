import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Paper } from "@mantine/core";

import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";

const DatasetEntityManagementPage = () => {
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);
  console.log("datasetEntityArray", datasetEntityArray);

  return (
    <GuidedModePage pageHeader="Manage Entity IDs">
      <GuidedModeSection>
        <Text>
          If you need to make any modifications to the IDs generated by SODA, you may do so on this
          page.
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
          <EntityHierarchyRenderer
            datasetEntityArray={datasetEntityArray}
            allowEntityStructureEditing={true}
          />
        </Paper>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityManagementPage;
