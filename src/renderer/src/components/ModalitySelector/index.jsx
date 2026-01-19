import { Checkbox, Stack, Paper } from "@mantine/core";
import { toggleModalitySelection, modalityIsSelected } from "../../stores/slices/modalitiesSlice";

const ModalitySelector = ({
  modalities = ["Physiology", "Sequencing", "Radiology", "Microscopy", "Morphology"],
}) => {
  return (
    <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
      <Stack>
        {modalities.map((modality) => {
          const isSelected = modalityIsSelected(modality);
          return (
            <Checkbox
              key={modality}
              label={modality}
              checked={isSelected}
              onChange={() => toggleModalitySelection(modality)}
            />
          );
        })}
      </Stack>
    </Paper>
  );
};

export default ModalitySelector;
