import useGuidedModeStore from "../../../stores/guidedModeStore";
import GuidedModePage from "../../containers/GuidedModePage";
import { Table, Checkbox, Image, Text, Center, Overlay } from "@mantine/core";
import styles from "./MicroscopyImageConfirmationPage.module.css";

const MicroscopyImageConfirmationPage = () => {
  const {
    potentialMicroscopyImages,
    confirmedMicroscopyImagePaths,
    designateImageAsMicroscopyImage,
    undesignateImageAsMicroscopyImage,
  } = useGuidedModeStore();

  const tableRows = potentialMicroscopyImages.map((potentialMicroscopyImage) => (
    <Table.Tr key={potentialMicroscopyImage.relativePath}>
      <Table.Td>
        <Checkbox
          aria-label="Select row"
          checked={confirmedMicroscopyImagePaths.includes(potentialMicroscopyImage.filePath)}
          onClick={
            confirmedMicroscopyImagePaths.includes(potentialMicroscopyImage.filePath)
              ? () => undesignateImageAsMicroscopyImage(potentialMicroscopyImage)
              : () => designateImageAsMicroscopyImage(potentialMicroscopyImage)
          }
        />
      </Table.Td>
      <Table.Td>
        <Text ta="left">{potentialMicroscopyImage.filePath}</Text>
      </Table.Td>
      <Table.Td>
        <Text ta="left">{potentialMicroscopyImage.relativePath}</Text>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Confirm the microscopy images listed below are microscopy images . If you would like to remove any images, click the 'Remove' button."
    >
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Image</Table.Th>
            <Table.Th>Relative path</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
    </GuidedModePage>
  );
};

export default MicroscopyImageConfirmationPage;
