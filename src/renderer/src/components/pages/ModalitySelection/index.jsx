import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Progress,
  Box,
  Tooltip,
  Checkbox,
  ActionIcon,
  Center,
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../cards/CheckboxCard";
import NavigationButton from "../../buttons/Navigation";
import ModalitySelector from "../../ModalitySelector";

const ModalitySelectionPage = () => {
  const isYesChecked = useGlobalStore((state) => state.cardData["modality-selection-yes"]?.checked);
  const isNoChecked = useGlobalStore((state) => state.cardData["modality-selection-no"]?.checked);

  return (
    <GuidedModePage pageHeader="Dataset modalities">
      <GuidedModeSection>
        <Text>
          The SPARC Dataset Structure requires that if your dataset includes data collected through
          multiple modalities such as imaging, recordings, or behavioral data, the manifest file
          must indicate which modality was used for the data that was collected.
        </Text>
        <label className="guided--form-label centered">
          Does your dataset include data collected from multiple modalities?
        </label>

        <Center>
          <CheckboxCard id="modality-selection-yes" />
          <CheckboxCard id="modality-selection-no" />
        </Center>
      </GuidedModeSection>
      {/* Section that appears when user selects "Yes" */}

      {isYesChecked && (
        <GuidedModeSection sectionId="dataset-selection">
          <Text>Select all modalities used to acquire data in this dataset.</Text>

          <ModalitySelector />
        </GuidedModeSection>
      )}

      {/* New section that appears when user selects "No" */}
      {isNoChecked && (
        <GuidedModeSection sectionId="no-modalities">
          <Center mt="xl">
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
          </Center>
        </GuidedModeSection>
      )}
    </GuidedModePage>
  );
};

export default ModalitySelectionPage;
