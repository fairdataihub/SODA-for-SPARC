import {
  Button,
  Text,
  Tooltip,
  Stack,
  Image,
  Overlay,
  Card,
  Grid,
  TextInput,
  Box,
  Flex,
} from "@mantine/core";
import { IconSearch, IconMicroscope, IconSquareX } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import {
  designateImageAsMicroscopyImage,
  removeMicroscopyImageDesignation,
  setConfirmMicroscopySearchInput,
} from "../../../stores/slices/microscopyImageSlice";
import useGlobalStore from "../../../stores/globalStore";
import styles from "../../sharedComponentStyles/imageSelector.module.css";
import GuidedModeSection from "../../containers/GuidedModeSection";
import useFetchThumbnailsPath from "../../../hooks/useFetchThumbnailsPath";

const MicroscopyImageConfirmationPage = () => {
  const guidedThumbnailsPath = useFetchThumbnailsPath();

  const { potentialMicroscopyImages, confirmedMicroscopyImages, confirmMicroscopySearchInput } =
    useGlobalStore();

  const filteredImages = potentialMicroscopyImages.filter((image) =>
    image.relativeDatasetStructurePaths
      .map((path) => path.toLowerCase())
      .some((path) => path.includes(confirmMicroscopySearchInput.toLowerCase()))
  );
  const confirmedImagePaths = new Set(confirmedMicroscopyImages.map((image) => image.filePath));

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
        removeMicroscopyImageDesignation(image);
      }
    }
  };

  const handleCardClick = (image) => {
    if (confirmedImagePaths.has(image.filePath)) {
      removeMicroscopyImageDesignation(image);
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
              <Button variant="light" color="cyan" w="260px" onClick={selectAllImagesAsMicroscopy}>
                Select {confirmMicroscopySearchInput === "" ? "all" : "filtered"} images
              </Button>
            )}
            {filteredImages.some((image) => confirmedImagePaths.has(image.filePath)) && (
              <Button variant="light" color="red" w="260px" onClick={unselectAllImagesAsMicroscopy}>
                Clear {confirmMicroscopySearchInput === "" ? "all" : "filtered"} selected images
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
              return (
                <Grid.Col span={2} key={image.relativeDatasetStructurePaths.join()}>
                  <Card
                    className={styles.card}
                    onClick={() => handleCardClick(image)}
                    shadow="sm"
                    p="2%"
                    radius="md"
                    withBorder
                    style={{
                      opacity: imageIsConfirmed ? 0.8 : 1,
                      borderColor: imageIsConfirmed ? "green" : "transparent",
                      backgroundColor: imageIsConfirmed ? "#F0FAF0" : "",
                    }}
                  >
                    <Card.Section m="0px" p="0px">
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
                      {/* Overlay for the checkbox */}
                      {imageIsConfirmed && (
                        <Overlay className={styles.thumbnailOverlay} backgroundOpacity={0.3}>
                          <Box className={styles.checkBox}>
                            <IconMicroscope size={20} color={"green"} className={styles.check} />
                          </Box>
                        </Overlay>
                      )}
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
                          size="xs"
                          ml="xs"
                          mr="xs"
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
