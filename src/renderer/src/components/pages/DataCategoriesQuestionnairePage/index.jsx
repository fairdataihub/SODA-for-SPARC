import { Text } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";

const DataCategoriesQuestionnairePage = ({ pageID, pageName, questionnaireEntityType }) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>This is the {questionnaireEntityType} page</Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <DatasetTreeViewRenderer fileExplorerId={pageID} entityType={null} hideSearchBar={true} />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataCategoriesQuestionnairePage;
