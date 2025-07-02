import SodaPaper from "../../utils/ui/SodaPaper";
import { Text, Center, Button, Stack } from "@mantine/core";

const ManifestFilePreviewSection = ({ id }) => {
  const handleClick = () => {
    if (id === "gm-manifest-file-preview") {
      window.guidedOpenManifestEditSwal();
    }
    if (id === "ffm-manifest-file-preview") {
      window.guidedOpenManifestEditSwal();
    }
  };

  return (
    <SodaPaper>
      <Center>
        <Stack align="center" spacing="md">
          <Text size="lg" fw={500}>
            Manifest File Preview
          </Text>
          <Text>
            To edit the manifest file, click the button below to modify the manifest file in a
            seperate window
          </Text>
          <Button size="md" onClick={handleClick}>
            Preview/Edit Manifest file
          </Button>
        </Stack>
      </Center>
    </SodaPaper>
  );
};

export default ManifestFilePreviewSection;
