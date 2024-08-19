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
  Affix,
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
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
import useFetchThumbnailsPath from "../../../hooks/useFetchThumbnailsPath";

const MicroscopyImageConfirmationPage = () => {
  const guidedThumbnailsPath = useFetchThumbnailsPath();

  const {
    currentGuidedModePage,
    potentialMicroscopyImages,
    confirmedMicroscopyImages,
    confirmMicroscopySearchInput,
  } = useGlobalStore();

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
        "SODA has identified the images below as potential microscopy images. Please indicate which images are microscopy by either selecting them individually by clicking on each image, or by using the search filter to select multiple images at once.",
        "The images you select below will have SPARC-required metadata added using MicroFile+ and will then be converted and added to the derivative folder.",
        "*NOTE*If all your microscopy images are stored in a single folder or share a common file extension, you can use the search filter to select all images at once by searching and clicking 'Select filtered images'.",
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
                        openDelay={500}
                        label={
                          <Stack gap="xs">
                            <Text size="sm" mb="0px">
                              Local file path:
                            </Text>
                            <Text size="xs" mt="-8px">
                              {image.filePath}
                            </Text>
                            <Text size="sm" mb="-7px" mt="4px">
                              Location in dataset:
                            </Text>
                            {image.relativeDatasetStructurePaths.map((path) => (
                              <Text key={path} size="xs">
                                {path}
                              </Text>
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

      {currentGuidedModePage === "guided-microscopy-image-confirmation-tab" &&
        potentialMicroscopyImages.length && (
          <Affix
            position={{ top: 135, right: 20 }}
            style={{
              zIndex: 1000,
            }}
          >
            <SodaGreenPaper>
              <Text>
                Images selected: {confirmedMicroscopyImages.length}/
                {potentialMicroscopyImages.length}
              </Text>
            </SodaGreenPaper>
          </Affix>
        )}
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
