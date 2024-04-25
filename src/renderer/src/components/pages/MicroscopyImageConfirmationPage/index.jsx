import useGlobalStore from "../../../stores/globalStore";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImagePaths,
} from "../../../stores/slices/microscopyImageSlice";
import { Table, Checkbox, Text, Tooltip, Button, Stack } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import styles from "./MicroscopyImageConfirmationPage.module.css";

const MicroscopyImageConfirmationPage = () => {
  const potentialMicroscopyImages = useGlobalStore((state) => state.potentialMicroscopyImages);
  const confirmedMicroscopyImagePaths = useGlobalStore(
    (state) => state.confirmedMicroscopyImagePaths
  );

  const toggleAllMicroscopyImages = (markAllImagesAsMicroscopy) => {
    if (markAllImagesAsMicroscopy) {
      const allImagePaths = Object.keys(potentialMicroscopyImages);
      setConfirmedMicroscopyImagePaths(allImagePaths);
    } else {
      setConfirmedMicroscopyImagePaths([]);
    }
  };

  const toggleMicroscopyImageDesignation = (imagePath) => {
    if (confirmedMicroscopyImagePaths.includes(imagePath)) {
      undesignateImageAsMicroscopyImage(imagePath);
    } else {
      designateImageAsMicroscopyImage(imagePath);
    }
  };

  const areAllImagesSelected =
    Object.keys(potentialMicroscopyImages).length === confirmedMicroscopyImagePaths.length;

  const tableRows = Object.keys(potentialMicroscopyImages).map((imagePath) => (
    <Table.Tr key={imagePath}>
      <Table.Td className={styles.centeredCell}>
        <Checkbox
          aria-label={`Select ${imagePath}`}
          checked={confirmedMicroscopyImagePaths.includes(imagePath)}
          onChange={() => toggleMicroscopyImageDesignation(imagePath)}
        />
      </Table.Td>
      <Table.Td>
        <Tooltip
          multiline
          label={
            <Stack gap="xs">
              {potentialMicroscopyImages[imagePath].map((image) => (
                <Text key={image}>{image}</Text>
              ))}
            </Stack>
          }
        >
          <Text ta="left">{imagePath}</Text>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Confirm the microscopy images listed below are microscopy images. If you would like to remove any images, click the 'Remove' button."
    >
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th hidden={!areAllImagesSelected}>
              <Button onClick={() => toggleAllMicroscopyImages(false)}>Deselect all</Button>
            </Table.Th>
            <Table.Th hidden={areAllImagesSelected}>
              <Button onClick={() => toggleAllMicroscopyImages(true)}>Select all</Button>
            </Table.Th>
            <Table.Th>Image file path</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
