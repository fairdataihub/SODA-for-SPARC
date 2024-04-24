import React from "react";
import useGlobalStore from "../../../stores/globalStore";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
} from "../../../stores/slices/microscopyImageSlice";
import { Table, Checkbox, Text } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import styles from "./MicroscopyImageConfirmationPage.module.css";

const MicroscopyImageConfirmationPage = () => {
  const potentialMicroscopyImages = useGlobalStore((state) => state.potentialMicroscopyImages);
  const confirmedMicroscopyImagePaths = useGlobalStore(
    (state) => state.confirmedMicroscopyImagePaths
  );

  const toggleMicroscopyImageDesignation = (potentialMicroscopyImage) => {
    if (confirmedMicroscopyImagePaths.includes(potentialMicroscopyImage.filePath)) {
      undesignateImageAsMicroscopyImage(potentialMicroscopyImage);
    } else {
      designateImageAsMicroscopyImage(potentialMicroscopyImage);
    }
  };

  const tableRows = potentialMicroscopyImages.map((potentialMicroscopyImage) => (
    <Table.Tr key={potentialMicroscopyImage.relativePath}>
      <Table.Td>
        <Checkbox
          aria-label="Select row"
          checked={confirmedMicroscopyImagePaths.includes(potentialMicroscopyImage.filePath)}
          onChange={() => toggleMicroscopyImageDesignation(potentialMicroscopyImage)}
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
      pageDescription="Confirm the microscopy images listed below are microscopy images. If you would like to remove any images, click the 'Remove' button."
    >
      <Table withTableBorder>
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
