import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { Text, Paper } from "@mantine/core";

import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";

const DatasetEntityManagementPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  return (
    <GuidedModePage pageHeader="Description of Entities">
      <GuidedModeSection>
        <Text>
          The SPARC Data Structure requires you to assign IDs to the different entities you
          indicated on the previous page that you collected data from in order to differentiate them
          for metadata collection.
        </Text>

        <Text>
          Begin by assigning IDs to the subjects you collected data from. Once you have assigned
          each subject an ID, you can assign IDs to the data you collected from each subject.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Paper withBorder shadow="sm" p="md" mb="sm">
          <Text ta="center" size="lg" fw={700} mb="sm">
            Entity Structure
          </Text>

          <EntityHierarchyRenderer allowEntityStructureEditing={true} />
        </Paper>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityManagementPage;
