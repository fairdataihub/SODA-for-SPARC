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
import DropDownNote from "../../utils/ui/DropDownNote";
import DropdownSelect from "../../common/DropdownSelect";

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
          Please choose a License for your dataset. The license will dictate what future users can
          and cannot do with your dataset.
        </Text>
        <DropdownSelect id="license-select" />
        <DropDownNote id="license-explanations" />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default LicenseSelectPage;
