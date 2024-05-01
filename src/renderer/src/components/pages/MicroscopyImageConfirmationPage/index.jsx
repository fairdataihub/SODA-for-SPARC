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
  const { potentialMicroscopyImages, confirmedMicroscopyImagePaths } = useGlobalStore();

  const confirmedMicroscopyImagePathNames = confirmedMicroscopyImagePaths.map(
    (imageObj) => imageObj["fileName"]
  );

  console.log("potentialMicroscopyImages rendered", potentialMicroscopyImages);
  console.log("confirmedMicroscopyImagePaths rendered", confirmedMicroscopyImagePaths);
  const areAllImagesSelected =
    potentialMicroscopyImages.length === confirmedMicroscopyImagePaths.length;

  const toggleAllMicroscopyImages = (markAllImagesAsMicroscopy) => {
    if (markAllImagesAsMicroscopy) {
      setConfirmedMicroscopyImagePaths(potentialMicroscopyImages);
    } else {
      setConfirmedMicroscopyImagePaths([]);
    }
  };

  const tableRows = potentialMicroscopyImages.map((imageObj) => {
    const filePath = imageObj["filePath"];
    const fileName = imageObj["fileName"];
    const filePathsInDatasetStructure = imageObj["filePathsInDatasetStructure"];
    const isImageDesignatedAsMicroscopyImage = confirmedMicroscopyImagePathNames.includes(fileName);

    return (
      <Table.Tr key={filePath}>
        <Table.Td className={styles.selectCell}>
          {isImageDesignatedAsMicroscopyImage ? (
            <Checkbox
              aria-label={`Deselect ${imageObj.fileName}`}
              checked={true}
              onChange={() => undesignateImageAsMicroscopyImage(imageObj)}
            />
          ) : (
            <Checkbox
              aria-label={`Select ${imageObj.fileName}`}
              checked={false}
              onChange={() => designateImageAsMicroscopyImage(imageObj)}
            />
          )}
        </Table.Td>
        <Table.Td>
          <Tooltip
            multiline
            label={
              <Stack gap="xs">
                <Text ta="left">Local file path:</Text>
                <Text ta="left">{filePath}</Text>
                <Text ta="left">Paths in organized dataset structure:</Text>
                {filePathsInDatasetStructure.map((imagePath) => (
                  <Text key={imagePath}>{imagePath}</Text>
                ))}
              </Stack>
            }
          >
            <Text ta="left">{fileName}</Text>
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Selection"
      pageDescription="Check the box for all images in your dataset that are microscopy images. The images you select will be processed by MicroFile+."
    >
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className={styles.selectHeader}>
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
