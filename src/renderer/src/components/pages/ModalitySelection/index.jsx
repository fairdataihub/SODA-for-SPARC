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
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import GuidedSimpleButton from "../../buttons/GuidedButtons/GuidedSimpleButton";
import NavigationButton from "../../buttons/Navigation";

import {
  toggleModalitySelection,
  modalityIsSelected,
} from "../../../stores/slices/modalitiesSlice";

const ModalitySelectionPage = () => {
  return (
    <GuidedModePage pageHeader="Modalities Selection">
      <GuidedModeSection>
        <label class="guided--form-label centered">
          Does your dataset include data collected from multiple modalities, such as imaging,
          recordings, or behavioral data?
        </label>

        <Center>
          <div className="guided--radio-button-container">
            <GuidedSimpleButton
              id="modality-selection-yes"
              nextElementId="dataset-selection"
              buttonText="Yes"
              configValue="yes"
              configValueState="yes"
              buttonType="positive"
            />
            <GuidedSimpleButton
              id="modality-selection-no"
              nextElementId="no-modalities"
              buttonText="No"
              configValue="no"
              configValueState="no"
              buttonType="negative"
            />
          </div>
        </Center>
      </GuidedModeSection>
      {/* Section that appears when user selects "Yes" */}

      <GuidedModeSection sectionId="dataset-selection">
        <Text>Select all modalities used to acquire data in this dataset.</Text>

        <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
          <Stack>
            <Checkbox
              label="Electrophysiology"
              checked={modalityIsSelected("Electrophysiology")}
              onChange={() => toggleModalitySelection("Electrophysiology")}
            />

            <Checkbox
              label="Imaging"
              checked={modalityIsSelected("Imaging")}
              onChange={() => toggleModalitySelection("Imaging")}
            />

            <Checkbox
              label="Behavioral"
              checked={modalityIsSelected("Behavioral")}
              onChange={() => toggleModalitySelection("Behavioral")}
            />
          </Stack>
        </Paper>
      </GuidedModeSection>

      {/* New section that appears when user selects "No" */}

      <GuidedModeSection sectionId="no-modalities">
        <Center mt="xl">
          <NavigationButton
            onClick={() => {
              handleNextButtonClick();
            }}
            buttonCustomWidth={"215px"}
            buttonText={"Save and Continue"}
            navIcon={"right-arrow"}
            buttonSize={"md"}
          ></NavigationButton>
        </Center>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default ModalitySelectionPage;
