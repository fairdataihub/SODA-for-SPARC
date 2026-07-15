import { Text } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";

const DataBucketingPage = ({ pageID, pageName, entityTypeStringSingular }) => {
  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>
          Use the interface below to organize your {entityTypeStringSingular} data files into
          buckets. Select the files that belong together and assign them to the appropriate
          grouping.
        </Text>
      </GuidedModeSection>

      <GuidedModeSection mt="lg">
        <DatasetTreeViewRenderer fileExplorerId={pageID} entityType={null} hideSearchBar={true} />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataBucketingPage;
