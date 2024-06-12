import useGlobalStore from "../../../stores/globalStore";
import {
  setSelectedImageFileName,
  setMagnification,
  setSpacingX,
  setSpacingY,
} from "../../../stores/slices/microscopyImageMetadataSlice";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImages,
} from "../../../stores/slices/microscopyImageSlice";
import { Table, Checkbox, Text, Tooltip, Button, Stack, Grid, TextInput } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import styles from "./MicroscopyImageMetadataFormPage.module.css";
import GuidedModeSection from "../../containers/GuidedModeSection";
import ExternalLink from "../../buttons/ExternalLink";
import DropDownNote from "../../utils/ui/DropDownNote";

const MicroscopyImageMetadataFormPage = () => {
  // Get the required zustand store state variables
  const { confirmedMicroscopyImages, magnification, spacingX, spacingY } = useGlobalStore();

  const confirmedMicroscopyImagefileNames = confirmedMicroscopyImages.map(
    (imageObj) => imageObj["fileName"]
  );

  console.log("confirmedMicroscopyImagefileNames", confirmedMicroscopyImagefileNames);
  return (
    <GuidedModePage
      pageHeader="Microscopy Image Metadata"
      pageDescriptionArray={[
        "SODA has identified the images below as potential microscopy images. Please check the boxes next to the images that are microscopy images. You can use the button below to select or deselect all images at once.",
        "The selected images will be converted with MicroFile+ and processed to ensure they are SDS compliant.",
      ]}
    >
      <Grid>
        <Grid.Col span={3}>
          <Stack
            h={300}
            bg="var(--mantine-color-body)"
            align="stretch"
            justify="flex-start"
            gap="xs"
          >
            {confirmedMicroscopyImagefileNames.map((fileName) => {
              return <Button variant="default">{fileName}</Button>;
            })}
          </Stack>
        </Grid.Col>
        <Grid.Col span={9}>
          <Stack gap="md">
            <TextInput
              label="Magnification"
              placeholder="Enter the image's magnification"
              value={magnification}
              onChange={(event) => setMagnification(event.target.value)}
              rightSection={
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigator.clipboard.writeText(magnification)}
                >
                  Copy
                </Button>
              }
            />
            <TextInput
              label="Spacing X"
              placeholder="Enter the image's spacing X"
              value={spacingX}
              onChange={(event) => setSpacingX(event.target.value)}
              rightSection={
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigator.clipboard.writeText(spacingX)}
                >
                  Copy
                </Button>
              }
            />
            <TextInput
              label="Spacing Y"
              placeholder="Enter the image's spacing Y"
              value={spacingY}
              onChange={(event) => setSpacingY(event.target.value)}
              rightSection={
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigator.clipboard.writeText(spacingY)}
                >
                  Copy
                </Button>
              }
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </GuidedModePage>
  );
};

export default MicroscopyImageMetadataFormPage;
