import useGlobalStore from "../../../stores/globalStore";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImages,
} from "../../../stores/slices/microscopyImageSlice";
import {
  Table,
  Checkbox,
  Text,
  Tooltip,
  Button,
  Stack,
  Image,
  Center,
  Overlay,
  AspectRatio,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import styles from "./MicroscopyImageConfirmationPage.module.css";

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedThumbnailsPath = window.path.join(homeDir, "SODA", "Guided-Image-Thumbnails");

const MicroscopyImageConfirmationPage = () => {
  // Get the required zustand store state variables
  const { potentialMicroscopyImages, confirmedMicroscopyImages } = useGlobalStore();

  const confirmedMicroscopyImagePathPaths = confirmedMicroscopyImages.map(
    (imageObj) => imageObj["filePath"]
  );
  const allImagesSelected = potentialMicroscopyImages.length === confirmedMicroscopyImages.length;

  const toggleAllImages = (markAllImagesAsMicroscopy) => {
    if (markAllImagesAsMicroscopy) {
      setConfirmedMicroscopyImages(potentialMicroscopyImages);
    } else {
      setConfirmedMicroscopyImages([]);
    }
  };

  const tableRows = potentialMicroscopyImages.map((imageObj) => {
    const filePath = imageObj["filePath"];
    const fileName = imageObj["fileName"];
    const relativeDatasetStructurePath = imageObj["relativeDatasetStructurePath"];

    // Check if the image is already confirmed as a microscopy image
    const isImageDesignatedAsMicroscopyImage = confirmedMicroscopyImagePathPaths.includes(filePath);

    const handleRowClick = (imageObj) => {
      if (confirmedMicroscopyImagePathPaths.includes(imageObj.filePath)) {
        undesignateImageAsMicroscopyImage(imageObj);
      } else {
        designateImageAsMicroscopyImage(imageObj);
      }
    };

    return (
      <Table.Tr key={relativeDatasetStructurePath} onClick={() => handleRowClick(imageObj)}>
        <Table.Td>
          <Center>
            {isImageDesignatedAsMicroscopyImage ? (
              <Checkbox aria-label={`Deselect ${imageObj.fileName}`} checked={true} />
            ) : (
              <Checkbox aria-label={`Select ${imageObj.fileName}`} checked={false} />
            )}
          </Center>
        </Table.Td>
        <Table.Td>
          <AspectRatio h={100} w={100}>
            <Image
              src={window.path.join(guidedThumbnailsPath, `${fileName}_thumbnail.jpg`)}
              alt={window.path.join(guidedThumbnailsPath, `${fileName}_thumbnail.jpg`)}
              className={styles.thumbnailImage}
              radius="md"
              withPlaceholder
              fallbackSrc="https://placehold.co/10x10?text=Preview+unavailable"
            />
            {!isImageDesignatedAsMicroscopyImage && (
              <Overlay opacity={0.5} color="gray" className={styles.thumbnailImage}>
                <Center>
                  <IconX size={"xl"} color="white" />
                </Center>
              </Overlay>
            )}
          </AspectRatio>
        </Table.Td>
        <Table.Td>
          <Tooltip
            multiline
            label={
              <Stack gap="xs">
                <Text ta="left">Local file path:</Text>
                <Text ta="left">{filePath}</Text>
                <Text ta="left">Path in organized dataset structure:</Text>
                <Text>{relativeDatasetStructurePath}</Text>
              </Stack>
            }
          >
            <Text ta="left" flexGrow={1}>
              {fileName}
            </Text>
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Confirmation"
      pageDescriptionArray={[
        "SODA has identified the images below as potential microscopy images. Please check the boxes next to the images that are microscopy images. You can use the button below to select or deselect all images at once.",
        "The selected images will be converted with MicroFile+ and processed to ensure they are SDS compliant.",
      ]}
    >
      <Table withTableBorder highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className={styles.selectHeader}>
              {allImagesSelected ? (
                <Button className={styles.toggleButton} onClick={() => toggleAllImages(false)}>
                  Deselect all
                </Button>
              ) : (
                <Button className={styles.toggleButton} onClick={() => toggleAllImages(true)}>
                  Select all
                </Button>
              )}
            </Table.Th>
            <Table.Th>Image thumb</Table.Th>

            <Table.Th>Image name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
