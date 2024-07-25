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
    console.log("Select all images");
  };

  const allImagesSelectedToBeUploadedToBioLucida = confirmedMicroscopyImages.every((image) =>
    bioLucidaImages.some((bioLucidaImage) => bioLucidaImage.filePath === image.filePath)
  );

  console.log("allImagesSelectedToBeUploadedToBioLucida", allImagesSelectedToBeUploadedToBioLucida);
  const pageDescriptionArray =
    confirmedMicroscopyImages.length > 50
      ? [
          "Select the microscopy images you would like to upload to BioLucida (Up to 50). The selected images will be uploaded to BioLucida at the end of the guided process.",
          "*NOTE*If you do not have a preference on which images to upload, you can select 50 random images by clicking the 'Select 50 random images' button below and SODA will choose 50 for you.",
        ]
      : [
          "Select the microscopy images you would like to upload to BioLucida. The selected images will be uploaded to BioLucida at the end of the guided process",
          "*NOTE*To have all images uploaded to BioLucida, click the 'Select all images' button below.",
        ];

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescriptionArray={pageDescriptionArray}
    >
      <GuidedModeSection bordered={true}>
        <Flex align="flex-end" gap="md">
          {!allImagesSelectedToBeUploadedToBioLucida && confirmedMicroscopyImages.length > 50 && (
            <Button onClick={handleSelectRandomImagesButtonClick}>Select 50 random images</Button>
          )}
          {!allImagesSelectedToBeUploadedToBioLucida && confirmedMicroscopyImages <= 50 && (
            <Button onClick={handleSelectAllImagesButtonClick}>Select all images</Button>
          )}
        </Flex>
        <Grid>
          {confirmedMicroscopyImages.map((image) => {
            const imageSelectedToBeUploaded = bioLucidaImages.some(
              (bioLucidaImage) => bioLucidaImage.filePath === image.filePath
            );
            return (
              <Grid.Col span={3} key={image.filePath}>
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
                    backgroundColor: imageSelectedToBeUploaded ? "#F0FAF0" : "transparent",
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

      {currentGuidedModePage === "guided-biolucida-image-selection-tab" && (
        <Affix
          position={{ top: 150, right: 20 }}
          style={{
            zIndex: 1000,
          }}
        >
          <SodaGreenPaper>
            <Text>Images selected: {bioLucidaImages.length}/50</Text>
          </SodaGreenPaper>
        </Affix>
      )}
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
