import useGlobalStore from "../../../stores/globalStore";
import {
  setSelectedImageFileName,
  setMagnification,
  setChannelName,
  setChannelColor,
  setSpacingX,
  setSpacingY,
} from "../../../stores/slices/microscopyImageMetadataSlice";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImages,
} from "../../../stores/slices/microscopyImageSlice";
import { Text, Button, Stack, Grid, TextInput, Group } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import { IconCheck, IconDots } from "@tabler/icons-react";
import styles from "./MicroscopyImageMetadataFormPage.module.css";
import GuidedModeSection from "../../containers/GuidedModeSection";
import ExternalLink from "../../buttons/ExternalLink";
import DropDownNote from "../../utils/ui/DropDownNote";

const stringContainsAnEvenNumber = (str) => {
  // Regular expression to match any even digit (0, 2, 4, 6, 8)
  const evenDigitRegex = /[02468]/;
  // Loop through each character
  for (let char of str) {
    // Check if the character matches the even digit regex
    if (evenDigitRegex.test(char)) {
      return true; // Even number found, return true
    }
  }
  // No even numbers found, return false
  return false;
};

const MicroscopyImageMetadataFormPage = () => {
  // Get the required zustand store state variables
  const {
    confirmedMicroscopyImages,
    magnification,
    channelName,
    channelColor,
    spacingX,
    spacingY,
  } = useGlobalStore();

  const confirmedMicroscopyImagefileNames = confirmedMicroscopyImages.map(
    (imageObj) => imageObj["fileName"]
  );

  console.log("confirmedMicroscopyImagefileNames", confirmedMicroscopyImagefileNames);
  return (
    <GuidedModePage
      pageHeader="Microscopy Image Metadata"
      pageDescriptionArray={[
        "The SDS requires certain metadata fields to be provided for your microsocpy images.",
        "Plase fill in any missing metadata fields for the images below. Images with complete metadata will appear green in the left column.",
      ]}
    >
      <Grid gutter="xl">
        <Grid.Col span={5}>
          <Stack gap="0px" p="4px" className={styles.scrollableStack}>
            <TextInput
              label="Image Search Filter"
              placeholder="Enter a search term to filter images"
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
              rightSectionWidth={165}
              mb="md"
            />
            {confirmedMicroscopyImagefileNames.map((fileName) => {
              return (
                <Button
                  variant={fileName === "sub-a-img-1.tif" ? "filled" : "subtle"}
                  key={fileName}
                  justify="space-between"
                  size="compact-sm"
                  rightSection={
                    stringContainsAnEvenNumber(fileName) ? (
                      <IconCheck />
                    ) : (
                      <IconDots color="orange" />
                    )
                  }
                >
                  <Text size="sm">{fileName}</Text>
                </Button>
              );
            })}
          </Stack>
        </Grid.Col>
        <Grid.Col span={7}>
          <Stack gap="md">
            <Group>
              <Text>
                <b>Image name:</b> sub-a-image-1.tiff
              </Text>
              <Button variant="light" color="cyan" size="xs">
                Copy Metadata from this Image
              </Button>
            </Group>
            <TextInput
              label="Channel Name"
              placeholder="Enter the image's channel name"
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
            />

            <TextInput
              label="Channel Color"
              placeholder="Enter the image's channel color"
              value={channelColor}
              onChange={(event) => setChannelColor(event.target.value)}
            />

            <TextInput
              label="Magnification"
              placeholder="Enter the image's magnification"
              value={magnification}
              onChange={(event) => setMagnification(event.target.value)}
            />
            <TextInput
              label="Spacing X"
              placeholder="Enter the image's spacing X"
              value={spacingX}
              onChange={(event) => setSpacingX(event.target.value)}
            />
            <TextInput
              label="Spacing Y"
              placeholder="Enter the image's spacing Y"
              value={spacingY}
              onChange={(event) => setSpacingY(event.target.value)}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </GuidedModePage>
  );
};

export default MicroscopyImageMetadataFormPage;
