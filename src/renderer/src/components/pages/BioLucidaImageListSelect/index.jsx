import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import {
  setMicroscopyImagesUploadableToBioLucida,
  addImageToBioLucidaUploadList,
  removeImageFromBioLucidaUploadList,
} from "../../../stores/slices/microscopyImageSlice";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";

import { Affix, Text, Table, Checkbox, Tooltip, Stack, Button } from "@mantine/core";
import styles from "./BioLucidaImageListSelectPage.module.css";

const BioLucidaImageListSelectPage = () => {
  // Get the required zustand store state variables
  const {
    currentGuidedModePage,
    confirmedMicroscopyImages,
    microscopyImagesSelectedToBeUploadedToBioLucida,
  } = useGlobalStore();

  const filePathsSelectedToBeUploadedToBioLucida =
    microscopyImagesSelectedToBeUploadedToBioLucida.map((imageObj) => imageObj["filePath"]);
  const allImagesSelected =
    confirmedMicroscopyImages.length === microscopyImagesSelectedToBeUploadedToBioLucida.length;

  const toggleAllImages = (uploadAllImagesToBioLucida) => {
    if (uploadAllImagesToBioLucida) {
      setMicroscopyImagesUploadableToBioLucida(confirmedMicroscopyImages);
    } else {
      setMicroscopyImagesUploadableToBioLucida([]);
    }
  };

  const tableRows = confirmedMicroscopyImages.map((imageObj) => {
    const filePath = imageObj["filePath"];
    const fileName = imageObj["fileName"];
    const relativeDatasetStructurePath = imageObj["relativeDatasetStructurePath"];
    // Check if the image is already selected to be uploaded to BioLucida
    const isImageSelectedToBeUploadedToBioLucida =
      filePathsSelectedToBeUploadedToBioLucida.includes(filePath);
    return (
      <Table.Tr key={relativeDatasetStructurePath}>
        <Table.Td className={styles.selectCell}>
          {isImageSelectedToBeUploadedToBioLucida ? (
            <Checkbox
              aria-label={`Deselect ${imageObj.fileName}`}
              checked={true}
              onChange={() => removeImageFromBioLucidaUploadList(imageObj)}
            />
          ) : (
            <Checkbox
              aria-label={`Select ${imageObj.fileName}`}
              checked={false}
              onChange={() => addImageToBioLucidaUploadList(imageObj)}
            />
          )}
        </Table.Td>
        <Table.Td>
          <Tooltip
            multiline
            label={
              <Stack gap="xs">
                <Text ta="left">Local file path:</Text>
                <Text ta="left">{filePath}</Text>
                <Text ta="left">Paths in organized dataset structure:</Text>
                <Text ta="left">Path in organized dataset structure:</Text>
                <Text>{relativeDatasetStructurePath}</Text>
              </Stack>
            }
          >
            <Text ta="left">{fileName}</Text>
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Select the microscopy images you would like to upload to BioLucida (Up to 50)."
    >
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className={styles.selectHeader}>
              {allImagesSelected ? (
                <Button className={styles.toggleButton} onClick={() => toggleAllImages(false)}>
                  Deselect all
                </Button>
              ) : (
                <Button className={styles.toggleButton} onClick={() => toggleAllImages(true)}>
                  Select all
                </Button>
              )}
            </Table.Th>

            <Table.Th>Image name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
      {currentGuidedModePage === "guided-biolucida-image-selection-tab" && (
        <Affix
          position={{ top: 150, right: 20 }}
          style={{
            zIndex: 1000,
          }}
        >
          <SodaGreenPaper>
            <Text>
              Images selected: {microscopyImagesSelectedToBeUploadedToBioLucida.length}/50
            </Text>
          </SodaGreenPaper>
        </Affix>
      )}
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
