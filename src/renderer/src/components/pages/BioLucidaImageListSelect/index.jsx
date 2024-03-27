import useGuidedModeStore from "../../../stores/guidedModeStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { SimpleGrid, Card, Image, Text, Badge, Button, Group, HoverCard } from "@mantine/core";

import ExternalLink from "../../buttons/ExternalLink";

const BioLucidaImageListSelectPage = () => {
  const {
    microscopyImagesUploadableToBioLucida,
    microscopyImagesSelectedToBeUploadedToBioLucida,
    addMicroscopyImageToBeUploadedToBioLucida,
    removeMicroscopyImageToBeUploadedToBioLucida,
  } = useGuidedModeStore();
  console.log("microscopyImagesUploadableToBioLucida", microscopyImagesUploadableToBioLucida);
  console.log(
    "microscopyImagesSelectedToBeUploadedToBioLucida",
    microscopyImagesSelectedToBeUploadedToBioLucida
  );
  return (
    <GuidedModePage
      pageHeader="BioLucida Image Selection"
      pageDescription="Select the microscopy images you would like to upload to BioLucida (Up to 10)."
    >
      <SimpleGrid cols={4}>
        {microscopyImagesUploadableToBioLucida.map((image) => (
          <Card shadow="sm" padding="lg" radius="md" withBorder key={image.relativePath}>
            <Card.Section>
              <Image src={image.filePath} height={160} alt="Microscopy image" />
            </Card.Section>

            <Group justify="space-between" mt="md">
              <Text truncate="end">{image.relativePath}</Text>
            </Group>
            {microscopyImagesSelectedToBeUploadedToBioLucida.includes(image.filePath) ? (
              <Button
                mt="sm"
                onClick={() => removeMicroscopyImageToBeUploadedToBioLucida(image.filePath)}
                color="red"
              >
                Remove
              </Button>
            ) : (
              <Button
                mt="sm"
                onClick={() => addMicroscopyImageToBeUploadedToBioLucida(image.filePath)}
              >
                Add
              </Button>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
