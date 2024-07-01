import useGlobalStore from "../../../stores/globalStore";

import { useState } from "react";

import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImages,
} from "../../../stores/slices/microscopyImageSlice";
import {
  Text,
  Button,
  Stack,
  Grid,
  TextInput,
  Group,
  ScrollArea,
  Table,
  Checkbox,
} from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import { IconCheck, IconDots } from "@tabler/icons-react";
import styles from "./MicroscopyImageMetadataFormPage.module.css";
import GuidedModeSection from "../../containers/GuidedModeSection";
import ExternalLink from "../../buttons/ExternalLink";
import DropDownNote from "../../utils/ui/DropDownNote";
import { all } from "axios";

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
    selectedImageFileName,
    setSelectedImageFileName,
    confirmedMicroscopyImages,
    copyImageMetadataModeActive,
    setCopyImageMetadataModeActive,
    setImageMetadata,
    imageMetadataStore,
    imageMetadataSearchValue,
    setImageMetadataSearchValue,
    imageMetadataFields,
    imageHasRequiredMetadata,
    copyImageMetadata,
    imageMetadataCopyFilterValue,
    setImageMetadataCopyFilterValue,
  } = useGlobalStore();

  console.log("imageMetadataStore", imageMetadataStore);

  const confirmedMicroscopyImagefileNames = confirmedMicroscopyImages.map(
    (imageObj) => imageObj["fileName"]
  );

  const filteredMicroscopyImageFileNames = confirmedMicroscopyImagefileNames.filter((fileName) =>
    fileName.toLowerCase().includes(imageMetadataSearchValue.toLowerCase())
  );

  const filteredMicroscopyImagesToCopyMetadataTo = confirmedMicroscopyImages.filter((imageObj) =>
    imageObj.filePath.toLowerCase().includes(imageMetadataCopyFilterValue.toLowerCase())
  );

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Metadata"
      pageDescriptionArray={[
        "The SDS requires certain metadata fields to be provided for your microsocpy images.",
        "Plase fill in any missing metadata fields for the images below. Images with complete metadata will appear green in the left column.",
      ]}
    >
      {copyImageMetadataModeActive ? (
        <Stack>
          <Button onClick={() => setCopyImageMetadataModeActive(!copyImageMetadataModeActive)}>
            Back to main form
          </Button>
          <TextInput
            label="Image copy filter"
            placeholder="Enter a search term to filter images to copy metadata to"
            value={imageMetadataCopyFilterValue}
            onChange={(event) => setImageMetadataCopyFilterValue(event.target.value)}
          />
          <ScrollArea height={300}>
            <Table miw={800} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Checkbox />
                  </Table.Th>
                  <Table.Th>File name</Table.Th>
                  <Table.Th>File path</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredMicroscopyImagesToCopyMetadataTo.map((imageObj) => {
                  console.log("imageObj", imageObj);
                  return (
                    <Table.Tr key={imageObj.filePath}>
                      <Table.Td>
                        <Checkbox />
                      </Table.Td>
                      <Table.Td>{imageObj.fileName}</Table.Td>{" "}
                      <Table.Td>{imageObj.filePath}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      ) : (
        <Grid gutter="xl">
          <Grid.Col span={5}>
            <Stack gap="0px" p="4px" className={styles.scrollableStack}>
              <TextInput
                label="Image Search Filter"
                placeholder="Enter a search term to filter images"
                value={imageMetadataSearchValue}
                onChange={(event) => setImageMetadataSearchValue(event.target.value)}
                rightSectionWidth={165}
                mb="md"
              />
              {filteredMicroscopyImageFileNames.map((fileName) => {
                return (
                  <Button
                    variant="subtle"
                    key={fileName}
                    justify="space-between"
                    size="compact-sm"
                    rightSection={
                      imageHasRequiredMetadata(fileName) ? (
                        <IconCheck />
                      ) : (
                        <IconDots color="orange" />
                      )
                    }
                    onClick={() => setSelectedImageFileName(fileName)}
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
                  <b>Image name:</b> {selectedImageFileName}
                </Text>
                <Button
                  variant="light"
                  color="cyan"
                  size="xs"
                  onClick={() => setCopyImageMetadataModeActive(!copyImageMetadataModeActive)}
                >
                  Copy Metadata from this Image
                </Button>
              </Group>
              {imageMetadataFields.map((field) => {
                return (
                  <TextInput
                    key={field.key}
                    label={field.label}
                    placeholder={`Enter the image's ${field.label}`}
                    value={imageMetadataStore?.[selectedImageFileName]?.[field.key] || ""}
                    onChange={(event) =>
                      setImageMetadata(selectedImageFileName, field.key, event.target.value)
                    }
                  />
                );
              })}
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </GuidedModePage>
  );
};

export default MicroscopyImageMetadataFormPage;
