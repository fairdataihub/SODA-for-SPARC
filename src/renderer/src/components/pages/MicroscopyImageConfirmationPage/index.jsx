import useGuidedModeStore from "../../../stores/guidedModeStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { Table, Checkbox, Image, Text } from "@mantine/core";

const MicroscopyImageConfirmationPage = () => {
  const { currentGuidedModePage, potentialMicroscopyImages } = useGuidedModeStore();

  const tableRows = potentialMicroscopyImages.map((potentialMicroscopyImage) => (
    <Table.Tr key={potentialMicroscopyImage.relativePath}>
      <Table.Td>
        <Checkbox
          aria-label="Select row"
          checked={true}
          onChange={(event) => {
            console.log(event);
          }}
        />
      </Table.Td>
      <Table.Td>
        <Image src={potentialMicroscopyImage.filePath} height={120} alt="Microscopy image" />
      </Table.Td>
      <Table.Td>
        <Text>{potentialMicroscopyImage.filePath}</Text>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Confirm the microscopy images listed below are microscopy images . If you would like to remove any images, click the 'Remove' button."
    >
      <Table w={700}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Microscopy Image</Table.Th>
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
