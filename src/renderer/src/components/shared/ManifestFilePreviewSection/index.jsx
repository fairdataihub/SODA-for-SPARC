import SodaPaper from "../../utils/ui/SodaPaper";
import { Text, Center, Button, Stack, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { handleOrganizeDsGenerateLocalManifestCopyButtonClick } from "./utils";
import useGlobalStore from "../../../stores/globalStore";

const ManifestFilePreviewSection = () => {
  const manifestFileGenerationDisabled = useGlobalStore(
    (state) => state.manifestFileGenerationDisabled
  );
  const handlePreviewEditManifestFileClick = () => {
    window.guidedOpenManifestEditSwal();
  };

  const handleGenerateLocalCopy = async () => {
    // await handleOrganizeDsGenerateLocalManifestCopyButtonClick();
    await window.guidedCreateLocalManifestCopy();
  };

  if (manifestFileGenerationDisabled) {
    return (
      <SodaPaper>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Manifest file generation unavailable"
          color="gray"
          variant="light"
        >
          <Text size="sm">
            SODA does not currently support manifest file generation for datasets that already have
            data on Pennsieve.
          </Text>
        </Alert>
      </SodaPaper>
    );
  }

  return (
    <SodaPaper>
      <Center>
        <Stack align="center" spacing="md">
          <Text size="lg" fw={500}>
            Manifest File Preview
          </Text>
          <Text>
            Click the button below to open the manifest file editor in a new window. Once you are
            done previewing or adding additional metadata to your manifest file, click the "Save and
            Exit" button at the bottom of the manifest file editor to save any changes you have
            made.
          </Text>
          <Button size="md" onClick={handlePreviewEditManifestFileClick}>
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
