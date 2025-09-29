import React from "react";
import SodaPaper from "../../utils/ui/SodaPaper";
import { Text, Center, Button, Stack } from "@mantine/core";
// import { handleOrganizeDsGenerateLocalManifestCopyButtonClick } from "./utils";

const ManifestFilePreviewSection = ({ id }) => {
  const handleClick = () => {
    if (id === "gm-manifest-file-preview") {
      window.guidedOpenManifestEditSwal();
    }
    if (id === "ffm-manifest-file-preview") {
      window.openmanifestEditSwal();
    }
  };

  const handleGenerateLocalCopy = async () => {
    // await handleOrganizeDsGenerateLocalManifestCopyButtonClick();
    console.log("TEst event");
  };

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
          <Button size="md" onClick={handleClick}>
            Preview/Edit Manifest file
          </Button>
          {id === "ffm-manifest-file-preview" && (
            <>
              <Text>
                You can create a local copy of your manifest files for review. Click to do so if
                needed.
              </Text>
              <Button size="md" onClick={handleGenerateLocalCopy}>
                Create local copy
              </Button>
            </>
          )}
        </Stack>
      </Center>
    </SodaPaper>
  );
};

export default ManifestFilePreviewSection;
