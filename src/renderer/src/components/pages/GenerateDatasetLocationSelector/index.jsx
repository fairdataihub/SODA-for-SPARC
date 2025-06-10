import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Box,
  Tooltip,
  Badge,
  Title,
  Divider,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Notification,
  Accordion,
  Checkbox,
} from "@mantine/core";
import { useMemo, useCallback, useRef, useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../buttons/CheckboxCard";
import { IconDeviceFloppy, IconCloudUpload } from "@tabler/icons-react";

const GenerateDatasetLocationSelectorPage = () => {
  return (
    <GuidedModePage pageHeader="Generation Options">
      <GuidedModeSection>
        <Text mb="md">
          Check the box for all of the locations you would like to generate your dataset to.
        </Text>
        <Stack align="stretch" gap="md">
          <CheckboxCard id="generate-dataset-locally" />
          <CheckboxCard id="generate-dataset-on-pennsieve" />
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default GenerateDatasetLocationSelectorPage;
