import React, { useEffect, useState } from "react";
import {
  Button,
  Text,
  Tooltip,
  Stack,
  Image,
  Overlay,
  AspectRatio,
  Card,
  Grid,
  TextInput,
  Box,
  Flex,
} from "@mantine/core";
import { IconSearch, IconSquareCheck, IconSquareX } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import {
  undesignateImageAsMicroscopyImage,
  designateImageAsMicroscopyImage,
  setConfirmMicroscopySearchInput,
} from "../../../stores/slices/microscopyImageSlice";
import useGlobalStore from "../../../stores/globalStore";
import styles from "./MicroscopyImageConfirmationPage.module.css";
import GuidedModeSection from "../../containers/GuidedModeSection";

const MicroscopyImageConfirmationPage = () => {
  const [guidedThumbnailsPath, setGuidedThumbnailsPath] = useState("");

  useEffect(() => {
    const fetchPath = async () => {
      const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
      const path = window.path.join(homeDir, "SODA", "Guided-Image-Thumbnails");
      setGuidedThumbnailsPath(path);
    };
    fetchPath();
  }, []);
  console.log("MicroscopyImageConfirmationPage2");

  const {
    potentialMicroscopyImages,
    confirmedMicroscopyImages,
    deniedMicroscopyImages,
    confirmMicroscopySearchInput,
  } = useGlobalStore();

  const filteredImages = potentialMicroscopyImages.filter((image) =>
    image.relativeDatasetStructurePaths
      .map((path) => path.toLowerCase())
      .some((path) => path.includes(confirmMicroscopySearchInput.toLowerCase()))
  );
  const confirmedImagePaths = new Set(confirmedMicroscopyImages.map((image) => image.filePath));
  const deniedImagePaths = new Set(deniedMicroscopyImages.map((image) => image.filePath));

  const selectAllImagesAsMicroscopy = () => {
    for (const image of filteredImages) {
      if (!confirmedImagePaths.has(image.filePath)) {
        designateImageAsMicroscopyImage(image);
      }
    }
  };

  const unselectAllImagesAsMicroscopy = () => {
    for (const image of filteredImages) {
      if (confirmedImagePaths.has(image.filePath)) {
        undesignateImageAsMicroscopyImage(image);
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
        "The selected images will be checked to ensure they have the SDS required file metadata requirements and then converted to SDS complient file types during the upload process.",
      ]}
    >
      <GuidedModeSection bordered={true}>
        <Flex align="flex-end" gap="md">
          <Stack spacing="xl" align="flex-start">
            {!filteredImages.every((image) => confirmedImagePaths.has(image.filePath)) && (
              <Button variant="light" color="cyan" w="275px" onClick={selectAllImagesAsMicroscopy}>
                Select {confirmMicroscopySearchInput === "" ? "all" : "filtered"} as microscopy
              </Button>
            )}
            {!filteredImages.every((image) => deniedImagePaths.has(image.filePath)) && (
              <Button
                variant="light"
                color="indigo"
                w="275px"
                onClick={unselectAllImagesAsMicroscopy}
              >
                Unselect {confirmMicroscopySearchInput === "" ? "all" : "filtered"} as microscopy
              </Button>
            )}
          </Stack>

          <TextInput
            label="Image search filter"
            placeholder="Enter a search filter for example 'sub-01' or '.tiff'"
            style={{ flexGrow: 1 }}
            value={confirmMicroscopySearchInput}
            onChange={(event) => setConfirmMicroscopySearchInput(event.target.value)}
            rightSection={<IconSearch size={20} />}
          />
        </Flex>
        <Grid>
          {filteredImages.length !== 0 ? (
            filteredImages.map((image) => {
              const imageIsConfirmed = confirmedImagePaths.has(image.filePath);
              const imageIsDenied = deniedImagePaths.has(image.filePath);
              return (
                <Grid.Col span={3} key={image.relativeDatasetStructurePaths.join()}>
                  <Card
                    className={styles.card}
                    onClick={() => handleCardClick(image)}
                    shadow="sm"
                    p="lg"
                    radius="md"
                    withBorder
                    style={{
                      opacity: imageIsDenied ? 0.5 : 1,
                    }}
                  >
                    <Card.Section>
                      <AspectRatio>
                        <Image
                          src={window.path.join(
                            guidedThumbnailsPath,
                            `${image.fileName}_thumbnail.jpg`
                          )}
                          alt={`${image.fileName}_thumbnail`}
                          className={styles.thumbnailImage}
                          fallbackSrc="https://placehold.co/128x128?text=Preview+unavailable"
                          loading="lazy"
                        />
                        {imageIsConfirmed && (
                          <Overlay className={styles.thumbnailOverlay} backgroundOpacity={0}>
                            <Box className={styles.checkBox}>
                              <IconSquareCheck size={30} color={"green"} className={styles.check} />
                            </Box>
                          </Overlay>
                        )}
                        {imageIsDenied && (
                          <Overlay className={styles.thumbnailOverlay} backgroundOpacity={0}>
                            <Box className={styles.checkBox}>
                              <IconSquareX size={30} color={"red"} className={styles.check} />
                            </Box>
                          </Overlay>
                        )}
                      </AspectRatio>
                    </Card.Section>
                    <Card.Section p="6px" h="60px" mb="-3px">
                      <Tooltip
                        multiline
                        label={
                          <Stack spacing="xs">
                            <Text>Local file path:</Text>
                            <Text>{image.filePath}</Text>
                            <Text>Path in organized dataset structure:</Text>
                            {image.relativeDatasetStructurePaths.map((path) => (
                              <Text key={path}>{path}</Text>
                            ))}
                          </Stack>
                        }
                      >
                        <Text
                          weight={500}
                          size="sm"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            wordBreak: "break-all",
                            textAlign: "center",
                          }}
                        >
                          {image.fileName}
                        </Text>
                      </Tooltip>
                    </Card.Section>
                  </Card>
                </Grid.Col>
              );
            })
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
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
