import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  IconPlus,
  IconTrash,
  IconClipboard,
  IconDeviceFloppy,
  IconX,
  IconEdit,
  IconFlask,
} from "@tabler/icons-react";
import {
  Textarea,
  Text,
  Switch,
  Stack,
  Group,
  Button,
  Box,
  ActionIcon,
  Paper,
  Grid,
  Title,
  ScrollArea,
  Divider,
  Flex,
  Select,
  Badge,
  TextInput,
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

import { fetchLicenseTextForSelectedLicense } from "../../../stores/slices/licenseSlice";

const LicenseSelectPage = () => {
  const availableLicenses = useGlobalStore((state) => state.availableLicenses);
  const licenseText = useGlobalStore((state) => state.licenseText);
  const licenseTextIsDirty = useGlobalStore((state) => state.licenseTextIsDirty);
  const selectedLicense = useGlobalStore((state) => state.selectedLicense);
  const includeLicenseFile = useGlobalStore((state) => state.includeLicenseFile);
  console.log("Available Licenses:", availableLicenses);
  return (
    <GuidedModePage pageHeader="LICENSE">
      <GuidedModeSection>
        <Text>
          If your dataset has a license, please select it from the list below. If your license is
          not listed, choose "Other (custom license)" and enter the license type manually.
        </Text>
        <Select
          label="Select a license"
          placeholder="Search..."
          searchable
          nothingFoundMessage="No matches"
          data={availableLicenses}
          onChange={async (value) => {
            console.log("Selected License:", value);
            useGlobalStore.setState({ selectedLicense: value, licenseTextIsDirty: false });
            await fetchLicenseTextForSelectedLicense(value);
          }}
        />
        {selectedLicense == "Other (custom license)" && (
          <TextInput
            label="Custom License Type"
            placeholder="e.g. CC BY 4.0, MIT, etc."
            value={"Super Secret Special License"}
            onChange={(event) => {}}
          />
        )}
      </GuidedModeSection>
      {selectedLicense && (
        <GuidedModeSection>
          <Text size="lg" fw={500} mt="lg">
            License File
          </Text>
          <Text mb="md">
            The SPARC Data Structure recommends including a LICENSE file to clarify data usage
            terms, especially when uploading to platforms that do not provide license options.
            Toggle the option below to have SODA add a LICENSE file to your dataset.
          </Text>

          <Switch
            label="Include a license file in my generated dataset"
            checked={!!includeLicenseFile}
            size="md"
            onChange={(event) => {
              useGlobalStore.setState({ includeLicenseFile: event.currentTarget.checked });
            }}
            mb="md"
          />
          {includeLicenseFile && (
            <>
              <Text>
                Review the license text below. Edit any placeholders or details as needed. When
                finished, press "Save and Continue".
              </Text>
              <Textarea
                label="LICENSE file text"
                minRows={8}
                maxRows={20}
                autosize
                value={licenseText}
                onChange={(event) => {
                  useGlobalStore.setState({
                    licenseText: event.target.value,
                    licenseTextIsDirty: true,
                  });
                }}
                placeholder="License text will appear here..."
                mb="md"
              />
            </>
          )}
        </GuidedModeSection>
      )}
    </GuidedModePage>
  );
};

export default LicenseSelectPage;
