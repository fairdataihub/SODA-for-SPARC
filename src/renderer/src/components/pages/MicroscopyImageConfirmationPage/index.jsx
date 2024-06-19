import React from "react";
import useGlobalStore from "../../../stores/globalStore";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImages,
  setConfirmMicroscopySearchInput,
} from "../../../stores/slices/microscopyImageSlice";
import {
  Checkbox,
  Text,
  Tooltip,
  Button,
  Stack,
  Image,
  Center,
  Overlay,
  AspectRatio,
  Modal,
  Group,
  Card,
  Badge,
  Grid,
  TextInput,
  Switch,
} from "@mantine/core";
import { IconMicroscope, IconMicroscopeOff, IconSearch, IconX } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import styles from "./MicroscopyImageConfirmationPage.module.css";

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedThumbnailsPath = window.path.join(homeDir, "SODA", "Guided-Image-Thumbnails");

const MicroscopyImageConfirmationPage = () => {
  const { potentialMicroscopyImages, confirmedMicroscopyImages, confirmMicroscopySearchInput } =
    useGlobalStore();

  const filteredImages = potentialMicroscopyImages.filter((image) =>
    image.relativeDatasetStructurePath
      .toLowerCase()
      .includes(confirmMicroscopySearchInput.toLowerCase())
  );
  const allFilteredImagesAreMicroscopyImages = filteredImages.every((image) =>
    confirmedMicroscopyImages.some((confirmedImage) => confirmedImage.filePath === image.filePath)
  );

  const confirmedImagePaths = new Set(confirmedMicroscopyImages.map((image) => image.filePath));

  const toggleAllImages = () => {
    for (const image of filteredImages) {
      if (allFilteredImagesAreMicroscopyImages) {
        undesignateImageAsMicroscopyImage(image);
      } else {
        designateImageAsMicroscopyImage(image);
      }
    }
  };

  const handleCardClick = (image) => {
    if (confirmedImagePaths.has(image.filePath)) {
      undesignateImageAsMicroscopyImage(image);
    } else {
      designateImageAsMicroscopyImage(image);
    }
  };

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Confirmation"
      pageDescriptionArray={[
        "SODA has identified the images below as potential microscopy images. Please check the cards of the images that are microscopy images. You can use the search filter to batch select/deselect images based on their file name or type.",
        "The selected images will be converted with MicroFile+ and processed to ensure they are SDS compliant.",
      ]}
    >
      <Group position="center">
        <Switch
          checked={allFilteredImagesAreMicroscopyImages}
          label="Toggle images"
          onChange={() => {
            toggleAllImages();
          }}
          size="lg"
          onLabel={<IconMicroscope />}
          offLabel={<IconMicroscopeOff />}
        />

        <TextInput
          label="Image search filter"
          placeholder="Enter a search filter for example 'sub-01' or '.tiff'"
          style={{ flexGrow: 1 }}
          value={confirmMicroscopySearchInput}
          onChange={(event) => setConfirmMicroscopySearchInput(event.target.value)}
          rightSection={<IconSearch size={20} />}
        />
      </Group>
      <Grid>
        {filteredImages.length != 0 ? (
          filteredImages.map((image) => (
            <Grid.Col span={3} key={image.relativeDatasetStructurePath}>
              <Card
                className={styles.card}
                onClick={() => handleCardClick(image)}
                shadow="sm"
                p="lg"
                pb="xs"
                radius="md"
                withBorder
              >
                <Card.Section>
                  <AspectRatio ratio="1" style={{ position: "relative" }}>
                    <Image
                      src={window.path.join(
                        guidedThumbnailsPath,
                        `${image.fileName}_thumbnail.jpg`
                      )}
                      alt={`${image.fileName}_thumbnail`}
                      withPlaceholder
                      className={styles.thumbnailImage}
                      fallbackSrc="https://placehold.co/128x128?text=Preview+unavailable"
                      loading="lazy"
                    />
                    {!confirmedImagePaths.has(image.filePath) ? (
                      <Overlay className={styles.thumbnailImage}>
                        <Center>
                          <IconX size={60} color="white" />
                        </Center>
                      </Overlay>
                    ) : (
                      <Overlay
                        opacity={0.2}
                        style={{ backgroundColor: "lightblue" }}
                        className={styles.thumbnailImage}
                      >
                        <Center>
                          <IconMicroscope size={60} color="white" />
                        </Center>
                      </Overlay>
                    )}
                  </AspectRatio>
                </Card.Section>
                <Stack spacing="xs" mt="md">
                  <Tooltip
                    multiline
                    label={
                      <Stack spacing="xs">
                        <Text>Local file path:</Text>
                        <Text>{image.filePath}</Text>
                        <Text>Path in organized dataset structure:</Text>
                        <Text>{image.relativeDatasetStructurePath}</Text>
                      </Stack>
                    }
                  >
                    <Text weight={500} size="sm">
                      {image.fileName}
                    </Text>
                  </Tooltip>
                </Stack>
              </Card>
            </Grid.Col>
          ))
        ) : (
          <Grid.Col span={12}>
            <Text c="dimmed" size="lg" ta="center">
              No images matching the search criteria
            </Text>
            <Text c="dimmed" ta="center">
              Modify the search input to view more images
            </Text>
          </Grid.Col>
        )}
      </Grid>
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
