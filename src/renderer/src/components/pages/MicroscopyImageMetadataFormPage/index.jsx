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
  Tooltip,
  Flex,
} from "@mantine/core";
import {
  IconSearch,
  IconCheck,
  IconKeyboard,
  IconFolder,
  IconFolderOpen,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
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
  } = useGlobalStore();

  const [selectedCopyToImages, setSelectedCopyToImages] = useState([]);
  const [selectedCopyToFolders, setSelectedCopyToFolders] = useState([]);
  const [openFolders, setOpenFolders] = useState({});

  const naturalSort = (a, b) =>
    a.filePath.localeCompare(b.filePath, undefined, { numeric: true, sensitivity: "base" });

  const createMicroscopyImageObject = () => {
    const imageObject = {};
    const filteredImages = confirmedMicroscopyImages
      .filter((imageObj) =>
        imageObj.fileName.toLowerCase().includes(imageMetadataSearchValue.toLowerCase())
      )
      .sort(naturalSort);

    filteredImages.forEach((imageObj) => {
      const imageDirectoryName = window.path.dirname(imageObj.filePath);
      const lastFolder = window.path.basename(imageDirectoryName);
      if (imageObject[lastFolder]) {
        imageObject[lastFolder].push(imageObj);
      } else {
        imageObject[lastFolder] = [imageObj];
      }
    });

    console.log("imageObject", imageObject);
    return imageObject;
  };

  const microscopyImageFileNamesWithoutSelectedImage = confirmedMicroscopyImages.filter(
    (imageObj) => imageObj.filePath !== selectedImageFileObj?.filePath
  );

  const handleCopyToFileClick = (imageObj) => {
    const imageIsSelectedToBeCopiedTo = selectedCopyToImages.some(
      (image) => image.filePath === imageObj.filePath
    );

    if (imageIsSelectedToBeCopiedTo) {
      setSelectedCopyToImages((prevSelected) =>
        prevSelected.filter((image) => image.filePath !== imageObj.filePath)
      );
    } else {
      setSelectedCopyToImages((prevSelected) => [...prevSelected, imageObj]);
    }
  };

  const handleCopyMetadataFromImageButtonClick = () => {
    setSelectedCopyToImages([]);
    setCopyImageMetadataModeActive(true);
  };

  const handleCancelCopyImageMetadataButtonClick = () => {
    setCopyImageMetadataModeActive(false);
  };

  const handleCopyImageMetadataButtonClick = () => {
    copyImageMetadata(
      selectedImageFileObj.filePath,
      selectedCopyToImages.map((image) => image.filePath)
    );
    setCopyImageMetadataModeActive(false);
  };

  const handleToggleFolder = (folderKey) => {
    setOpenFolders((prevOpenFolders) => ({
      ...prevOpenFolders,
      [folderKey]: !prevOpenFolders[folderKey],
    }));
  };

  const handleSelectCopyToFolderClick = (event, folderName) => {
    event.stopPropagation();

    const folderNameWasSelected = selectedCopyToFolders.includes(folderName);
    const imagesInFolder = microscopyImageObject[folderName];

    if (folderNameWasSelected) {
      // Unselect the folder and all its files
      setSelectedCopyToFolders((prevSelected) =>
        prevSelected.filter((folder) => folder !== folderName)
      );
      setSelectedCopyToImages((prevSelected) =>
        prevSelected.filter(
          (image) =>
            !imagesInFolder.some((imageInFolder) => imageInFolder.filePath === image.filePath)
        )
      );
    } else {
      // Select the folder and all its files
      setSelectedCopyToFolders((prevSelected) => [...prevSelected, folderName]);
      setSelectedCopyToImages((prevSelected) => [
        ...prevSelected,
        ...imagesInFolder.filter(
          (imageInFolder) =>
            !prevSelected.some((image) => image.filePath === imageInFolder.filePath)
        ),
      ]);
    }
  };

  const folderIsSelectedToBeCopiedTo = (folderName) => selectedCopyToFolders.includes(folderName);

  const microscopyImageObject = createMicroscopyImageObject();

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Metadata"
      pageDescriptionArray={[
        "The SPARC Data Structure (SDS) requires specific metadata fields to be added to your microscopy images.",
        "Please provide any missing metadata for the images listed below. Images with complete metadata are indicated by a checkmark next to their name on the left.",
        "*NOTE* If multiple microscopy images share the same metadata, you can fill in the metadata for one image and use the 'Copy Metadata from this Image' button to apply it to the other images.",
      ]}
    >
      <GuidedModeSection bordered>
        {copyImageMetadataModeActive ? (
          <Stack>
            <Flex justify="center" align="center" gap="md">
              <NavigationButton
                buttonText="Cancel metadata copy"
                navIcon="left-arrow"
                buttonOnClick={handleCancelCopyImageMetadataButtonClick}
              />
              <Button color="cyan" onClick={handleCopyImageMetadataButtonClick} style={{ flex: 1 }}>
                Copy metadata to selected images
              </Button>
            </Flex>
            <Center mt="md">
              <Title order={2}>
                Select images to copy metadata from "{selectedImageFileObj?.fileName}" to
              </Title>
            </Center>

            <ScrollArea h={300} type="always">
              <Stack gap="xs">
                {Object.keys(microscopyImageObject).map((folderKey) => (
                  <Stack gap="2px" key={folderKey}>
                    <Group
                      m="0px"
                      onClick={() => handleToggleFolder(folderKey)}
                      style={{ cursor: "pointer" }}
                    >
                      <Checkbox
                        checked={folderIsSelectedToBeCopiedTo(folderKey)}
                        onClick={(e) => handleSelectCopyToFolderClick(e, folderKey)}
                        readOnly
                      />
                      {openFolders[folderKey] ? (
                        <IconFolderOpen size={24} />
                      ) : (
                        <IconFolder size={24} />
                      )}
                      <Text size="sm">{folderKey}</Text>
                      {openFolders[folderKey] ? (
                        <IconChevronDown size={24} />
                      ) : (
                        <IconChevronRight size={24} />
                      )}
                    </Group>
                    {openFolders[folderKey] &&
                      microscopyImageObject[folderKey].map((fileObj) => {
                        const isSelectedToBeCopiedTo = selectedCopyToImages.some(
                          (image) => image.filePath === fileObj.filePath
                        );
                        return (
                          <Tooltip
                            openDelay={500}
                            key={fileObj.filePath}
                            label={
                              <Stack gap="xs">
                                <Text size="sm" mb="0px">
                                  Local file path:
                                </Text>
                                <Text size="xs" mt="-8px">
                                  {fileObj.filePath}
                                </Text>
                                <Text size="sm" mb="-7px" mt="4px">
                                  Location in dataset:
                                </Text>
                                {fileObj.relativeDatasetStructurePaths.map((path) => (
                                  <Text key={path} size="xs">
                                    {path}
                                  </Text>
                                ))}
                              </Stack>
                            }
                          >
                            <Button
                              variant="subtle"
                              justify="flex-start"
                              size="compact-sm"
                              className={
                                fileObj.filePath === selectedImageFileObj?.filePath
                                  ? styles.selectedImageInSidebar
                                  : ""
                              }
                              leftSection={<Checkbox checked={isSelectedToBeCopiedTo} readOnly />}
                              onClick={() => handleCopyToFileClick(fileObj)}
                            >
                              <Text size="sm">{fileObj.fileName}</Text>
                            </Button>
                          </Tooltip>
                        );
                      })}
                  </Stack>
                ))}
              </Stack>
              {/*<Table miw={800} verticalSpacing="sm" withTableBorder highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th></Table.Th>
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
                        onClick={() => handleCopyToFileClick(imageObj, isSelectedToBeCopiedTo)}
                      >
                        <Table.Td>
                          <Checkbox checked={isSelectedToBeCopiedTo} readOnly />
                        </Table.Td>
                        <Table.Td>{imageObj.fileName}</Table.Td>
                        <Table.Td>{imageObj.filePath}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>*/}
            </ScrollArea>
          </Stack>
        ) : (
          <Grid gutter="xl">
            <Grid.Col span={5}>
              <Stack className={styles.imageSidebar}>
                <TextInput
                  placeholder="Search for an image name or file path"
                  value={imageMetadataSearchValue}
                  onChange={(event) => setImageMetadataSearchValue(event.target.value)}
                  rightSection={<IconSearch size={20} />}
                />

                <Text fw={700} size="lg">
                  Microscopy Images
                </Text>
                <Divider my="-10px" />
                <ScrollArea h={300}>
                  <Stack gap="xs">
                    {Object.keys(microscopyImageObject).length > 0 ? (
                      Object.keys(microscopyImageObject).map((folderKey) => (
                        <Stack gap="2px" key={folderKey}>
                          <Group
                            m="0px"
                            onClick={() => handleToggleFolder(folderKey)}
                            style={{ cursor: "pointer" }}
                          >
                            {openFolders[folderKey] ? (
                              <IconFolderOpen size={18} />
                            ) : (
                              <IconFolder size={18} />
                            )}
                            <Text size="sm">{folderKey}</Text>
                            {openFolders[folderKey] ? (
                              <IconChevronDown size={18} />
                            ) : (
                              <IconChevronRight size={18} />
                            )}
                          </Group>
                          {openFolders[folderKey] &&
                            microscopyImageObject[folderKey].map((fileObj) => (
                              <Tooltip
                                openDelay={500}
                                key={fileObj.filePath}
                                label={
                                  <Stack gap="xs">
                                    <Text size="sm" mb="0px">
                                      Local file path:
                                    </Text>
                                    <Text size="xs" mt="-8px">
                                      {fileObj.filePath}
                                    </Text>
                                    <Text size="sm" mb="-7px" mt="4px">
                                      Location in dataset:
                                    </Text>
                                    {fileObj.relativeDatasetStructurePaths.map((path) => (
                                      <Text key={path} size="xs">
                                        {path}
                                      </Text>
                                    ))}
                                  </Stack>
                                }
                              >
                                <Button
                                  variant="subtle"
                                  justify="flex-start"
                                  size="compact-sm"
                                  className={
                                    fileObj.filePath === selectedImageFileObj?.filePath
                                      ? styles.selectedImageInSidebar
                                      : ""
                                  }
                                  leftSection={
                                    imageHasRequiredMetadata(fileObj.filePath) ? (
                                      <IconCheck size={18} />
                                    ) : (
                                      <IconKeyboard opacity={0.3} size={18} />
                                    )
                                  }
                                  onClick={() => setSelectedImageFileObj(fileObj)}
                                >
                                  <Text size="sm">{fileObj.fileName}</Text>
                                </Button>
                              </Tooltip>
                            ))}
                        </Stack>
                      ))
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
                    <Text truncate="end">
                      <b>Image name:</b> {selectedImageFileObj?.fileName}
                    </Text>
                    <Button
                      variant="light"
                      color="cyan"
                      size="xs"
                      onClick={handleCopyMetadataFromImageButtonClick}
                    >
                      Copy Metadata from this Image
                    </Button>
                  </Group>
                  {imageMetadataFields.map((field) => (
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
                  ))}
                </Stack>
              ) : (
                <Center>
                  <Text mt="xl" size="lg" fw={500}>
                    Select an image on the left to add/edit metadata.
                  </Text>
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
