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
} from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";

import {
  toggleModalitySelection,
  modalityIsSelected,
} from "../../../stores/slices/modalitiesSlice";

const ModalitySelectionPage = () => {
  return (
    <GuidedModePage pageHeader="Modalities Selection">
      <GuidedModeSection>
        <Text>Select all modalities used to acquire data in this dataset.</Text>
      </GuidedModeSection>
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
    </GuidedModePage>
  );
};

export default ModalitySelectionPage;
