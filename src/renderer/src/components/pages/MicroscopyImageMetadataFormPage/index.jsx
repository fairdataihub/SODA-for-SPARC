import { useState } from "react";
import useGlobalStore from "../../../stores/globalStore";
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
  Center,
  Title,
  Divider,
} from "@mantine/core";
import { IconSearch, IconCheck, IconDots } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import NavigationButton from "../../buttons/Navigation";
import GuidedModeSection from "../../containers/GuidedModeSection";
import styles from "./MicroscopyImageMetadataFormPage.module.css";

const MicroscopyImageMetadataFormPage = () => {
  const {
    selectedImageFileObj,
    setSelectedImageFileObj,
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

  const [selectedCopyToImages, setSelectedCopyToImages] = useState([]);

  const filteredMicroscopyImageObjs = confirmedMicroscopyImages.filter((imageObj) =>
    imageObj.fileName.toLowerCase().includes(imageMetadataSearchValue.toLowerCase())
  );

  const microscopyImageFileNamesWithoutSelectedImage = confirmedMicroscopyImages.filter(
    (imageObj) => imageObj.fileName !== selectedImageFileObj?.fileName
  );

  const filteredCopyToImages = microscopyImageFileNamesWithoutSelectedImage.filter((imageObj) =>
    imageObj.filePath.toLowerCase().includes(imageMetadataCopyFilterValue.toLowerCase())
  );

  const allFilteredImagesSelected = filteredCopyToImages.length === selectedCopyToImages.length;

  const handleToggleAllImages = (selectAll) => {
    if (selectAll) {
      setSelectedCopyToImages([]);
    } else {
      setSelectedCopyToImages(filteredCopyToImages);
    }
  };

  const handleImageSelection = (imageObj, isSelectedToBeCopiedTo) => {
    isSelectedToBeCopiedTo
      ? setSelectedCopyToImages((prevSelected) =>
          prevSelected.filter((image) => image.filePath !== imageObj.filePath)
        )
      : setSelectedCopyToImages((prevSelected) => [...prevSelected, imageObj]);
  };

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Metadata"
      pageDescriptionArray={[
        "The SDS requires certain metadata fields to be provided for your microscopy images.",
        "Please fill in any missing metadata fields for the images below. Images with complete metadata have a checkmark to the left of the image.",
        "If you have multiple microscopy images that have overlapping metadata, you can fill in the metadata for one image and copy it to other images using the 'Copy Metadata from this Image' button.",
      ]}
    >
      <GuidedModeSection bordered>
        {copyImageMetadataModeActive ? (
          <Stack>
            <NavigationButton
              buttonText="Cancel metadata copy"
              navIcon="left-arrow"
              buttonOnClick={() => setCopyImageMetadataModeActive(!copyImageMetadataModeActive)}
            />
            <Center mt="md">
              <Title order={2}>
                Select images to copy metadata from "{selectedImageFileObj["fileName"]}" to
              </Title>
            </Center>
            <TextInput
              placeholder="Filter images using a file name or file path"
              value={imageMetadataCopyFilterValue}
              onChange={(event) => setImageMetadataCopyFilterValue(event.target.value)}
              rightSection={<IconSearch size={20} />}
            />
            <ScrollArea height={300}>
              <Table miw={800} verticalSpacing="sm" withTableBorder highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Button
                        className={styles.toggleButton}
                        onClick={() => handleToggleAllImages(allFilteredImagesSelected)}
                      >
                        {allFilteredImagesSelected
                          ? `Deselect ${imageMetadataCopyFilterValue === "" ? "all" : "filtered"}`
                          : `Select ${imageMetadataCopyFilterValue === "" ? "all" : "filtered"}`}
                      </Button>
                    </Table.Th>
                    <Table.Th>File name</Table.Th>
                    <Table.Th>File path</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredCopyToImages.map((imageObj) => {
                    const isSelectedToBeCopiedTo = selectedCopyToImages.some(
                      (image) => image.filePath === imageObj.filePath
                    );
                    return (
                      <Table.Tr
                        key={imageObj.filePath}
                        onClick={() => handleImageSelection(imageObj, isSelectedToBeCopiedTo)}
                      >
                        <Table.Td>
                          <Checkbox checked={isSelectedToBeCopiedTo} />
                        </Table.Td>
                        <Table.Td>{imageObj.fileName}</Table.Td>
                        <Table.Td>{imageObj.filePath}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            <Button
              color="cyan"
              onClick={() => {
                copyImageMetadata(
                  selectedImageFileObj["filePath"],
                  filteredCopyToImages.map((image) => image.filePath)
                );
                setCopyImageMetadataModeActive(false);
              }}
            >
              Copy metadata to selected images
            </Button>
          </Stack>
        ) : (
          <Grid gutter="xl">
            <Grid.Col span={5}>
              <Stack className={styles.imageSidebar}>
                <TextInput
                  placeholder="Enter a search term to filter images"
                  value={imageMetadataSearchValue}
                  onChange={(event) => setImageMetadataSearchValue(event.target.value)}
                  rightSection={<IconSearch size={20} />}
                />

                <Text fw={700} size="lg">
                  Microscopy Images
                </Text>
                <Divider my="-10px" />
                <ScrollArea h={300}>
                  <Stack gap="2px">
                    {filteredMicroscopyImageObjs.length > 0 ? (
                      filteredMicroscopyImageObjs.map((fileObj) => {
                        return (
                          <Button
                            variant="subtle"
                            key={fileObj.filePath}
                            justify="flex-start"
                            size="compact-sm"
                            className={
                              fileObj.filePath === selectedImageFileObj?.filePath
                                ? styles.selectedImageInSidebar
                                : ""
                            }
                            leftSection={
                              imageHasRequiredMetadata(fileObj.filePath) ? (
                                <IconCheck />
                              ) : (
                                <IconDots />
                              )
                            }
                            onClick={() => setSelectedImageFileObj(fileObj)}
                          >
                            <Text size="sm">{fileObj.fileName}</Text>
                          </Button>
                        );
                      })
                    ) : (
                      <Center>
                        <Text>No microscopy images match the search.</Text>
                      </Center>
                    )}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Grid.Col>
            <Grid.Col span={7}>
              {selectedImageFileObj ? (
                <Stack gap="md">
                  <Group>
                    <Text>
                      <b>Image name:</b> {selectedImageFileObj?.fileName}
                    </Text>
                    <Button
                      variant="light"
                      color="cyan"
                      size="xs"
                      onClick={() => {
                        setSelectedCopyToImages([]); // Clear selected images in the copy UI
                        setCopyImageMetadataModeActive(true);
                      }}
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
                        value={
                          imageMetadataStore?.[selectedImageFileObj?.filePath]?.[field.key] || ""
                        }
                        onChange={(event) =>
                          setImageMetadata(
                            selectedImageFileObj?.filePath,
                            field.key,
                            event.target.value
                          )
                        }
                      />
                    );
                  })}
                </Stack>
              ) : (
                <Center>
                  <Text>No image selected.</Text>
                </Center>
              )}
            </Grid.Col>
          </Grid>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default MicroscopyImageMetadataFormPage;
