import { useCallback } from "react";
import { Text, Stack, Group, Switch, List, Center } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import {
  addSelectedDataCategoryForEntityType,
  removeSelectedDataCategoryForEntityType,
} from "../../../stores/slices/datasetContentSelectorSlice";
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
  const selectedDataCategoriesByEntityType =
    useGlobalStore((state) => state.selectedDataCategoriesByEntityType) || {};
  console.log("selectedDataCategoriesByEntityType:", selectedDataCategoriesByEntityType);

  // Get the selected data categories for the current entity type
  const selectedDataCategoriesForEntityType =
    selectedDataCategoriesByEntityType[questionnaireEntityType] || [];

  const handleDataCategorySelection = useCallback(
    (key, checked) => {
      if (checked) {
        // If switch is checked (true), add the data category for this entity type
        addSelectedDataCategoryForEntityType(questionnaireEntityType, key);
      } else {
        // If switch is unchecked (false), remove the data category for this entity type
        removeSelectedDataCategoryForEntityType(questionnaireEntityType, key);
      }
    },
    [questionnaireEntityType]
  );

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        {questionnaireEntityType === "experimental-data-categorization" && (
          <Text>
            Your experimental data, shown at the bottom of this page, can be organized into three
            categories: Primary, Source, and Derivative. These categories correspond to the folders
            where your data will be placed in your final standardized dataset. If you have files
            that are Source or Derivative and would like to categorize them, select "Yes" below
            indicating that you would like to organize your experimental data, and on the next page,
            you will be asked to assign a category to each file. If you do not have Source or
            Derivative files or do not wish to categorize your experimental data, select "No" below,
            and all experimental data will be categorized as "Primary" and placed in the Primary
            folder of your standardized dataset.
          </Text>
        )}
        {questionnaireEntityType === "non-experimental-data-categorization" && (
          <Text>
            Your non-experimental data, shown at the bottom of this page, can be organized into
            three categories: Primary, Source, and Derivative. These categories correspond to the
            folders where your data will be placed in your final standardized dataset. If you have
            Source or Derivative files and want to categorize them, select "Yes" below. On the next
            page, you will assign a category to each file. If you do not have Source or Derivative
            files or do not wish to categorize your data, select "No," and all non-experimental data
            will be treated as Primary and placed in the Primary folder of your standardized
            dataset.
          </Text>
        )}

        <DropDownNote id="data-categories-explanation" />
      </GuidedModeSection>
      <GuidedModeSection>
        {questionnaireEntityType === "experimental-data-categorization" && (
          <Stack gap={0}>
            <label className="guided--form-label centered mt-md">
              Would you like to categorize some experimental data as either Source or Derivative?
            </label>
            <Center>
              <CheckboxCard id="categorize-experimental-data-yes" />
              <CheckboxCard id="categorize-experimental-data-no" />
            </Center>
          </Stack>
        )}

        {questionnaireEntityType === "non-experimental-data-categorization" && (
          <Stack gap={0}>
            <label className="guided--form-label centered mt-md">
              Would you like to categorize some non-experimental data as either Source or
              Derivative?
            </label>
            <Center>
              <CheckboxCard id="categorize-non-experimental-data-yes" />
              <CheckboxCard id="categorize-non-experimental-data-no" />
            </Center>
          </Stack>
        )}
      </GuidedModeSection>
      <GuidedModeSection withBorder sectionId="experimental-data-categories-selection">
        <Stack gap="xs">
          {Object.entries(dataCategoriesOptionsMap).map(([key, option]) => {
            // Check if this data category is selected for the current entity type
            const switchChecked = selectedDataCategoriesForEntityType.includes(key);

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
        {questionnaireEntityType === "experimental-data-categorization" && (
          <Text size="md" fw={500}>
            The experimental data below will be categorized as "Primary". You may now continue to
            the next page.
          </Text>
        )}
        {questionnaireEntityType === "non-experimental-data-categorization" && (
          <Text size="md" fw={500}>
            The non-experimental data below will be categorized as "Primary". You may now continue
            to the next page.
          </Text>
        )}
      </GuidedModeSection>
      <GuidedModeSection>
        <DatasetTreeViewRenderer fileExplorerId={pageID} entityType={null} hideSearchBar={true} />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataCategoriesQuestionnairePage;
