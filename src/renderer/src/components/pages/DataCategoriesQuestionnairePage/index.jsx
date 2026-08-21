import { Text, Stack, Center } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { isCheckboxCardChecked } from "../../../stores/slices/checkboxCardSlice";
import { getOxfordCommaSeparatedListOfEntities } from "../../../stores/slices/datasetContentSelectorSlice";
import NavigationButton from "../../buttons/Navigation";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import CheckboxCard from "../../cards/CheckboxCard";
import DropDownNote from "../../utils/ui/DropDownNote";

const DataCategoriesQuestionnairePage = ({ pageID, pageName, questionnaireEntityType }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetStructuringMode = useGlobalStore((state) => state.datasetStructuringMode);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        {questionnaireEntityType === "experimental-data-categorization" && (
          <Text>
            Your experimental data, shown below, can be organized into three categories: Primary,
            Source, and Derivative. These categories determine where your files will be placed in
            your final standardized dataset. Source data (for example, raw data files) will be
            placed in the Source folder, while derivative data (for example, processed data files)
            will be placed in the Derivative folder. If you select No, all experimental data will be
            categorized as Primary and placed in the Primary folder. If you select Yes, you will be
            able to categorize your experimental data as either Source or Derivative on the next
            page.
          </Text>
        )}
        {questionnaireEntityType === "entity-bucketing-data-categorization" && (
          <Text>
            By default, the data associated with each entity will be placed in the Primary folder.
            You can also categorize source data (for example, raw data files) and derivative data
            (for example, processed data files). These categories determine where your files will be
            placed in your final standardized dataset. If you select No, all associated data will
            remain categorized as Primary and placed in the Primary folder. If you select Yes, you
            will be able to categorize your associated data as either Source or Derivative on the
            next page.
          </Text>
        )}
        {questionnaireEntityType === "remaining-data-categorization" && (
          <Text>
            {selectedEntities.length === 0
              ? `
                You indicated that none of the typical dataset content questions applied to your dataset. Your
                data can now be organized into three categories: Primary, Source, and Derivative. These categories
                determine where your files will be placed in your final standardized dataset. Source data (for example,
                raw data files) will be placed in the Source folder, while derivative data (for example, processed data
                files) will be placed in the Derivative folder. If you select No, all data will be categorized as
                Primary and placed in the Primary folder. If you select Yes, you will be able to categorize your data
                as either Source or Derivative on the next page.`
              : `
                The remaining files, shown below, have not been categorized in earlier steps and can now be organized
                into three categories: Primary, Source, and Derivative. These categories determine where your files will
                be placed in your final standardized dataset. Source data (for example, raw data files) will be placed in
                the Source folder, while derivative data (for example, processed data files) will be placed in the Derivative
                folder. If you select No, all remaining files will be categorized as Primary and placed in the Primary folder.
                If you select Yes, you will be able to categorize your remaining files as either Source or Derivative on the
                next page.`}
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

        {questionnaireEntityType === "entity-bucketing-data-categorization" && (
          <Stack gap={0}>
            <label className="guided--form-label centered mt-md">
              Would you like to categorize some entity associated data as either Source or
              Derivative?
            </label>
            <Center>
              <CheckboxCard id="categorize-entity-bucketing-data-yes" />
              <CheckboxCard id="categorize-entity-bucketing-data-no" />
            </Center>
          </Stack>
        )}

        {questionnaireEntityType === "remaining-data-categorization" && (
          <Stack gap={0}>
            <label className="guided--form-label centered mt-md">
              Would you like to categorize some remaining data as either Source or Derivative?
            </label>
            <Center>
              <CheckboxCard id="categorize-remaining-data-yes" />
              <CheckboxCard id="categorize-remaining-data-no" />
            </Center>
          </Stack>
        )}
      </GuidedModeSection>

      {questionnaireEntityType === "experimental-data-categorization" && (
        <>
          <GuidedModeSection
            sectionId="guided-section-experimental-data-categorization-yes-message"
            centered
          >
            <Text size="md" fw={500}>
              Continue to the next page to categorize your experimental data.
            </Text>
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </GuidedModeSection>

          <GuidedModeSection
            sectionId="guided-section-experimental-data-categorization-no-message"
            centered
          >
            <Text size="md" fw={500}>
              The experimental data below will be categorized as "Primary" and remain in the Primary
              folder. You may now continue to the next page.
            </Text>
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </GuidedModeSection>
        </>
      )}
      {questionnaireEntityType === "entity-bucketing-data-categorization" && (
        <>
          <GuidedModeSection
            sectionId="guided-section-entity-bucketing-data-categorization-yes-message"
            centered
          >
            <Text size="md" fw={500}>
              Continue to the next page to categorize your entity associated data.
            </Text>
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </GuidedModeSection>

          <GuidedModeSection
            sectionId="guided-section-entity-bucketing-data-categorization-no-message"
            centered
          >
            <Text size="md" fw={500}>
              The remaining data below will be categorized as "Primary" and remain in the Primary
              folder. You may now continue to the next page.
            </Text>
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </GuidedModeSection>
        </>
      )}
      {questionnaireEntityType === "remaining-data-categorization" && (
        <>
          <GuidedModeSection
            sectionId="guided-section-remaining-data-categorization-yes-message"
            centered
          >
            <Text size="md" fw={500}>
              Continue to the next page to categorize your remaining data.
            </Text>
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </GuidedModeSection>

          <GuidedModeSection
            sectionId="guided-section-remaining-data-categorization-no-message"
            centered
          >
            <Text size="md" fw={500}>
              The remaining data below will be categorized as "Primary" and remain in the Primary
              folder. You may now continue to the next page.
            </Text>
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </GuidedModeSection>
        </>
      )}

      <GuidedModeSection mt="lg">
        <DatasetTreeViewRenderer
          fileExplorerId={pageID}
          entityType={null}
          hideSearchBar={true}
          excludeFolders={datasetStructuringMode === "entity-buckets" ? ["non-data-folders"] : []}
        />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataCategoriesQuestionnairePage;
