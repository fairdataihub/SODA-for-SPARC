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
              label="Microscopy"
              checked={modalityIsSelected("Microscopy")}
              onChange={() => toggleModalitySelection("Microscopy")}
            />
            <Checkbox
              label="Neuroimaging"
              checked={modalityIsSelected("Neuroimaging")}
              onChange={() => toggleModalitySelection("Neuroimaging")}
            />
            <Checkbox
              label="Tabular"
              checked={modalityIsSelected("Tabular")}
              onChange={() => toggleModalitySelection("Tabular")}
            />
            <Checkbox
              label="Timeseries"
              checked={modalityIsSelected("Timeseries")}
              onChange={() => toggleModalitySelection("Timeseries")}
            />
          </Stack>
        </Paper>
      </GuidedModeSection>

      {/* New section that appears when user selects "No" */}

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
    </GuidedModePage>
  );
};

export default ModalitySelectionPage;
