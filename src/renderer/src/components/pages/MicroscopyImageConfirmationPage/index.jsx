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
      <Table.Td className={styles.selectCell}>
        <Checkbox
          aria-label={`Select ${imagePath.fileName}`}
          checked={confirmedMicroscopyImagePaths.includes(imagePath)}
          onChange={() => toggleMicroscopyImageDesignation(imagePath)}
        />
      </Table.Td>
      <Table.Td>
        <Tooltip
          multiline
          label={
            <Stack gap="xs">
              <Text ta="left">Local file path:</Text>
              <Text ta="left">{imagePath}</Text>
              <Text ta="left">Paths in organized dataset structure:</Text>
              {potentialMicroscopyImages[imagePath]["pathsInDatasetStructure"].map((image) => (
                <Text key={image}>{image}</Text>
              ))}
            </Stack>
          }
        >
          <Text ta="left">{potentialMicroscopyImages[imagePath]["fileName"]}</Text>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Check the box for all images in your dataset that are microscopy images. The images you select will be processed by MicroFile+."
    >
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              {areAllImagesSelected ? (
                <Button
                  className={styles.toggleButton}
                  onClick={() => toggleAllMicroscopyImages(false)}
                >
                  Deselect all
                </Button>
              ) : (
                <Button
                  className={styles.toggleButton}
                  onClick={() => toggleAllMicroscopyImages(true)}
                >
                  Select all
                </Button>
              )}
            </Table.Th>

            <Table.Th>Image name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
