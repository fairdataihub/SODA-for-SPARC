import useGuidedModeStore from "../../../stores/guidedModeStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  HoverCard,
  Affix,
  Transition,
  Paper,
} from "@mantine/core";

import ExternalLink from "../../buttons/ExternalLink";

const BioLucidaImageListSelectPage = () => {
  const {
    currentGuidedModePage,
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
                Select
              </Button>
            )}
          </Card>
        ))}
      </SimpleGrid>
      {currentGuidedModePage === "guided-biolucida-image-selection-tab" && (
        <Affix
          position={{ top: 150, right: 20 }}
          style={{
            zIndex: 1000,
          }}
        >
          <Paper p="md" shadow="xs" radius="md">
            <Text>Images selected: {microscopyImagesSelectedToBeUploadedToBioLucida.length}</Text>
          </Paper>
        </Affix>
      )}
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
