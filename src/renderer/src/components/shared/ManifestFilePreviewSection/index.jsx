import SodaPaper from "../../utils/ui/SodaPaper";
import { Text, Center, Button, Stack } from "@mantine/core";
import { handleOrganizeDsGenerateLocalManifestCopyButtonClick } from "./utils";

const ManifestFilePreviewSection = ({ id }) => {
  const handleClick = () => {
    if (id === "gm-manifest-file-preview") {
      window.guidedOpenManifestEditSwal();
    }
    if (id === "ffm-manifest-file-preview") {
      window.ffOpenManifestEditSwal();
    }
  };

  const handleGenerateLocalCopy = async () => {
    await handleOrganizeDsGenerateLocalManifestCopyButtonClick();
  };

  return (
    <SodaPaper>
      <Center>
        <Stack align="center" spacing="md">
          <Text size="lg" fw={500}>
            Manifest File Preview
          </Text>
          <Text>
            You can preview below the manifest files that will be automatically included by SODA in
            each of the SDS folders. You can also suggest edits that will be incorporated by SODA
          </Text>
          <Button size="md" onClick={handleClick}>
            Preview/Edit Manifest file
          </Button>
          <Text>
            You can create a local copy of your manifest files for review. Click to do so if needed.
          </Text>
          <Button size="md" onClick={handleGenerateLocalCopy}>
            Create local copy
          </Button>
        </Stack>
      </Center>
    </SodaPaper>
  );
};

export default ManifestFilePreviewSection;
