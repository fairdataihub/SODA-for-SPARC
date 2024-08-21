import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
import {
  Affix,
  Text,
  Tooltip,
  Stack,
  Flex,
  Button,
  Grid,
  Card,
  Image,
  Overlay,
  Box,
} from "@mantine/core";
import { IconCloudUpload, IconSearch } from "@tabler/icons-react";
import styles from "../../sharedComponentStyles/imageSelector.module.css";
import useFetchThumbnailsPath from "../../../hooks/useFetchThumbnailsPath";

const BioLucidaImageListSelectPage = () => {
  const guidedThumbnailsPath = useFetchThumbnailsPath();
  console.log("BioLucidaImageListSelectPage");
  // Get the required zustand store state variables
  const {
    currentGuidedModePage,
    confirmedMicroscopyImages,
    bioLucidaImages,
    chooseFiftyRandomBioLucidaImages,
    addBioLucidaImage,
    removeBioLucidaImage,
    clearImagesSelectedToBeUploadedToBioLucida,
  } = useGlobalStore();

  const handleCardClick = (image) => {
    console.log("image", image);
    const imageSelectedToBeUploaded = bioLucidaImages.some(
      (bioLucidaImage) => bioLucidaImage.filePath === image.filePath
    );
    if (imageSelectedToBeUploaded) {
      console.log("Removing image", image.filePath);
      removeBioLucidaImage(image);
    } else {
      console.log("Adding image", image.filePath);
      if (bioLucidaImages.length < 50) {
        addBioLucidaImage(image);
      } else {
        window.notyf.error("Only 50 images can be selected for upload to BioLucida");
      }
    }
  };

  const handleSelectRandomImagesButtonClick = () => {
    chooseFiftyRandomBioLucidaImages();
  };

  const handleSelectAllImagesButtonClick = () => {
    clearImagesSelectedToBeUploadedToBioLucida();
    confirmedMicroscopyImages.forEach((image) => {
      addBioLucidaImage(image);
    });
  };

  const handleClearAllSelectedImagesButtonClick = () => {
    clearImagesSelectedToBeUploadedToBioLucida();
  };

  const allImagesSelectedToBeUploadedToBioLucida = confirmedMicroscopyImages.every((image) =>
    bioLucidaImages.some((bioLucidaImage) => bioLucidaImage.filePath === image.filePath)
  );

  console.log("allImagesSelectedToBeUploadedToBioLucida", allImagesSelectedToBeUploadedToBioLucida);
  const bioLucidaExplanationText = `
    BioLucida is a software platform developed by MBF Bioscience for managing, visualizing, and sharing high-resolution microscopy images.
    Before your dataset is uploaded to Pennsieve at the end of the End-to-End process, the images you select in the interface below will be
    uploaded to BioLucida allowing other researchers to view them.
  `;
  const pageDescriptionArray =
    confirmedMicroscopyImages.length > 50
      ? [
          bioLucidaExplanationText,
          "Select the microscopy images you would like SODA to upload to BioLucida (Up to 50).",
          "*NOTE*If you do not have a preference on which images to upload, you can select 50 random images by clicking the 'Select 50 random images' button below and SODA will choose 50 for you.",
        ]
      : [
          bioLucidaExplanationText,
          "Select the microscopy images you would like SODA to upload to BioLucida below.",
          "*NOTE*To have all images uploaded to BioLucida, click the 'Select all images' button below.",
        ];

  console.log(path.join(guidedThumbnailsPath, `_thumbnail.jpg`));
  console.log("allImagesSelectedToBeUploadedToBioLucida", allImagesSelectedToBeUploadedToBioLucida);
  console.log("confirmedMicroscopyImages <= 50", confirmedMicroscopyImages);

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescriptionArray={pageDescriptionArray}
    >
      <GuidedModeSection bordered={true}>
        <Flex align="flex-end" gap="md">
          {confirmedMicroscopyImages.length > 50 && (
            <Button onClick={handleSelectRandomImagesButtonClick}>Select 50 random images</Button>
          )}
          {!allImagesSelectedToBeUploadedToBioLucida && confirmedMicroscopyImages.length <= 50 && (
            <Button onClick={handleSelectAllImagesButtonClick}>Select all images</Button>
          )}
          {bioLucidaImages.length > 0 && (
            <Button variant="light" color="red" onClick={handleClearAllSelectedImagesButtonClick}>
              Clear all selected images
            </Button>
          )}
        </Flex>
        <Grid>
          {confirmedMicroscopyImages.map((image) => {
            const imageSelectedToBeUploaded = bioLucidaImages.some(
              (bioLucidaImage) => bioLucidaImage.filePath === image.filePath
            );
            return (
              <Grid.Col span={2} key={image.filePath}>
                <Card
                  className={styles.card}
                  onClick={() => handleCardClick(image)}
                  shadow="sm"
                  p="2%"
                  radius="md"
                  withBorder
                  style={{
                    opacity: imageSelectedToBeUploaded ? 1 : 0.9,
                    borderColor: imageSelectedToBeUploaded ? "green" : "transparent",
                    backgroundColor: imageSelectedToBeUploaded ? "#F0FAF0" : "",
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
                    {imageSelectedToBeUploaded && (
                      <Overlay className={styles.thumbnailOverlay} backgroundOpacity={0}>
                        <Box className={styles.checkBox}>
                          <IconCloudUpload size={30} color={"teal"} className={styles.check} />
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
          })}
        </Grid>
      </GuidedModeSection>

      {currentGuidedModePage === "guided-biolucida-image-selection-tab" &&
        bioLucidaImages.length > 0 && (
          <Affix
            position={{ top: 135, right: 20 }}
            style={{
              zIndex: 1000,
            }}
          >
            <SodaGreenPaper>
              <Text>
                Images selected: {bioLucidaImages.length}/{confirmedMicroscopyImages.length}
              </Text>
            </SodaGreenPaper>
          </Affix>
        )}
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
