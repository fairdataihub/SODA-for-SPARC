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
  TextInput,
  Grid,
  Card,
  Image,
  AspectRatio,
  Overlay,
  Box,
} from "@mantine/core";
import { IconSquareCheck, IconSearch } from "@tabler/icons-react";
import styles from "./BioLucidaImageListSelectPage.module.css";
import useFetchThumbnailsPath from "../../../hooks/useFetchThumbnailsPath";

const BioLucidaImageListSelectPage = () => {
  const guidedThumbnailsPath = useFetchThumbnailsPath();
  console.log("BioLucidaImageListSelectPage");
  // Get the required zustand store state variables
  const {
    currentGuidedModePage,
    confirmedMicroscopyImages,
    bioLucidaImageSelectSearchInput,
    setBioLucidaImageSelectSearchInput,
    bioLucidaImages,
    addBioLucidaImage,
    removeBioLucidaImage,
  } = useGlobalStore();

  // Filter the images based on the search input
  const filteredImages = confirmedMicroscopyImages.filter((image) =>
    image.relativeDatasetStructurePaths
      .map((path) => path.toLowerCase())
      .some((path) => path.includes(bioLucidaImageSelectSearchInput.toLowerCase()))
  );

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
      }
    }
  };

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescriptionArray={[
        "Select the microscopy images you would like to upload to BioLucida (Up to 50). The selected images will be uploaded to BioLucida at the end of the guided process.",
      ]}
    >
      <GuidedModeSection bordered={true}>
        <Flex align="flex-end" gap="md">
          <Stack spacing="xl" align="flex-start"></Stack>

          <TextInput
            label="Image search filter"
            placeholder="Enter a search filter for example 'sub-01' or '.tiff'"
            style={{ flexGrow: 1 }}
            value={bioLucidaImageSelectSearchInput}
            onChange={(event) => setBioLucidaImageSelectSearchInput(event.currentTarget.value)}
            rightSection={<IconSearch size={20} />}
          />
        </Flex>
        <Grid>
          {filteredImages.length !== 0 ? (
            filteredImages.map((image) => {
              const imageSelectedToBeUploaded = bioLucidaImages.some(
                (bioLucidaImage) => bioLucidaImage.filePath === image.filePath
              );
              return (
                <Grid.Col span={3} key={image.filePath}>
                  <Card
                    className={styles.card}
                    onClick={() => handleCardClick(image)}
                    shadow="sm"
                    p="lg"
                    radius="md"
                    withBorder
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
                        {imageSelectedToBeUploaded && (
                          <Overlay className={styles.thumbnailOverlay} backgroundOpacity={0}>
                            <Box className={styles.checkBox}>
                              <IconSquareCheck size={30} color={"green"} className={styles.check} />
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
