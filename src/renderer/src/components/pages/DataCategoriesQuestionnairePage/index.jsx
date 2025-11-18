import { useCallback } from "react";
import { Text, Stack, Group, Switch, List, Center } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import CheckboxCard from "../../cards/CheckboxCard";
import DropDownNote from "../../utils/ui/DropDownNote";

// Data categories options map
export const dataCategoriesOptionsMap = {
  Primary: {
    label: "Does the data below include primary data?",
  },
  Source: {
    label: "Does the data below include source data?",
  },
  Derivative: {
    label: "Does the data below include derivative data?",
  },
};

const DataCategoriesQuestionnairePage = ({ pageID, pageName, questionnaireEntityType }) => {
  console.log("questionnaireEntityType:", questionnaireEntityType);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const selectedDataCategories = useGlobalStore((state) => state.selectedDataCategories) || [];
  const deSelectedDataCategories = useGlobalStore((state) => state.deSelectedDataCategories) || [];

  const handleDataCategorySelection = useCallback((key, checked) => {
    const { selectedDataCategories = [], deSelectedDataCategories = [] } =
      useGlobalStore.getState();

    if (checked) {
      // If switch is checked (true), add to selectedDataCategories and remove from deSelectedDataCategories
      useGlobalStore.setState({
        selectedDataCategories: selectedDataCategories.includes(key)
          ? selectedDataCategories
          : [...selectedDataCategories, key],
        deSelectedDataCategories: deSelectedDataCategories.filter((id) => id !== key),
      });
    } else {
      // If switch is unchecked (false), add to deSelectedDataCategories and remove from selectedDataCategories
      useGlobalStore.setState({
        deSelectedDataCategories: deSelectedDataCategories.includes(key)
          ? deSelectedDataCategories
          : [...deSelectedDataCategories, key],
        selectedDataCategories: selectedDataCategories.filter((id) => id !== key),
      });
    }
  }, []);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>
          Your experimental data, which can be viewed at the bottom of this page, can be categorized
          into three separate types: Primary, Source, and Derivative. If you choose to categorize
          your data on this page, you will be asked to categorize your experimental data on a
          per-file basis on the next page. You can skip categorization by selecting "No" below, and
          your experimental data will be categorized as "Primary" by default.
        </Text>

        <DropDownNote id="data-categories-explanation" />
      </GuidedModeSection>
      <GuidedModeSection>
        <Stack gap="xs">
          <label className="guided--form-label centered mt-md">
            Would you like to categorize your experimental data into Primary, Source, and/or
            Derivative?
          </label>
          <Center>
            <CheckboxCard id="categorize-experimental-data-yes" />
            <CheckboxCard id="categorize-experimental-data-no" />
          </Center>
        </Stack>
      </GuidedModeSection>
      <GuidedModeSection withBorder sectionId="experimental-data-categories-selection">
        <Stack gap="xs">
          {Object.entries(dataCategoriesOptionsMap).map(([key, option]) => {
            let switchChecked;
            if (selectedDataCategories.includes(key)) {
              switchChecked = true; // Yes
            } else if (deSelectedDataCategories.includes(key)) {
              switchChecked = false; // No
            } else {
              switchChecked = false; // Default to unchecked for unanswered
            }

            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "6px 10px",
                  borderRadius: "6px",
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text size="md" fw={600}>
                      {option.label}
                    </Text>
                  </div>
                  <Group align="center" spacing="md">
                    <Text size="sm" c="dimmed">
                      No
                    </Text>
                    <Switch
                      checked={switchChecked}
                      onChange={(event) =>
                        handleDataCategorySelection(key, event.currentTarget.checked)
                      }
                      size="lg"
                      color={switchChecked ? "green" : "red"}
                      thumbIcon={
                        switchChecked ? (
                          <Text size="xs" c="white" fw={700}>
                            ✓
                          </Text>
                        ) : (
                          <Text size="xs" c="white" fw={700}>
                            ✗
                          </Text>
                        )
                      }
                      styles={(theme) => ({
                        track: {
                          backgroundColor: !switchChecked
                            ? theme.colors.red[2]
                            : theme.colors.green[2],
                        },
                      })}
                    />
                    <Text size="sm" c="dimmed">
                      Yes
                    </Text>
                  </Group>
                </Group>
              </div>
            );
          })}
        </Stack>
      </GuidedModeSection>
      <GuidedModeSection withBorder sectionId="experimental-data-categorization-not-selected">
        <Text size="md" fw={500}>
          The experimental data below will be categorized as "Primary". You may now continue to the
          next page.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <DatasetTreeViewRenderer fileExplorerId={pageID} entityType={null} hideSearchBar={true} />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataCategoriesQuestionnairePage;
