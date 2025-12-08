import { Text, Stack, Center } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { isCheckboxCardChecked } from "../../../stores/slices/checkboxCardSlice";
import NavigationButton from "../../buttons/Navigation";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import CheckboxCard from "../../cards/CheckboxCard";
import DropDownNote from "../../utils/ui/DropDownNote";

const DataCategoriesQuestionnairePage = ({ pageID, pageName, questionnaireEntityType }) => {
  console.log("questionnaireEntityType:", questionnaireEntityType);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        {questionnaireEntityType === "experimental-data-categorization" && (
          <Text>
            Your experimental data, shown at the bottom of this page, can be organized into three
            categories: Primary, Source, and Derivative. These categories correspond to the folders
            where your data will be placed in your final standardized dataset. If you do not have
            Source or Derivative files, or do not wish to categorize your data, select "No" below.
            All experimental data will then be categorized as "Primary" and placed in the Primary
            folder. If you have Source or Derivative files and want to categorize them, select "Yes"
            below, and on the next page, you will be asked to assign a category to each file.
          </Text>
        )}
        {questionnaireEntityType === "remaining-data-categorization" && (
          <Text>
            The files shown below have not yet been categorized and must be organized according to
            the SPARC Dataset Structure (SDS). These files can be placed into one of three
            categories: Primary, Source, or Derivative. Each category corresponds to a specific
            folder in your final standardized dataset. If you need to manually assign some files as
            Source or Derivative, select "Yes" below and you'll be able to categorize each file
            individually on the next page. If all remaining files should be treated as Primary data,
            select "No" and they will automatically be placed in the Primary folder.
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
            withBorder
            sectionId="guided-section-experimental-data-categorization-yes-message"
            centered
          >
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
            withBorder
            sectionId="guided-section-experimental-data-categorization-no-message"
            centered
          >
            <Text size="md" fw={500}>
              The experimental data below will be categorized as "Primary". You may now continue to
              the next page.
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
            withBorder
            sectionId="guided-section-remaining-data-categorization-yes-message"
            centered
          >
            <Text size="md" fw={500}>
              Great! On the next page, you will be able to categorize your remaining data into
              Primary, Source, and Derivative folders. You may now continue to the next page.
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
            withBorder
            sectionId="guided-section-remaining-data-categorization-no-message"
            centered
          >
            <Text size="md" fw={500}>
              The remaining data below will be categorized as "Primary". You may now continue to the
              next page.
            </Text>
          </GuidedModeSection>
        </>
      )}

      <GuidedModeSection>
        <DatasetTreeViewRenderer fileExplorerId={pageID} entityType={null} hideSearchBar={true} />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataCategoriesQuestionnairePage;
