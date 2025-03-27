import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconPlus, IconTrash, IconClipboard, IconDeviceFloppy, IconX } from "@tabler/icons-react";
import {
  TextInput,
  Text,
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
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { DateTimePicker } from "@mantine/dates";

import { setPerformanceFormVisible } from "../../../stores/slices/performancesSlice";

// Performance metadata form component
const PerformanceMetadataForm = () => {
  const [performanceId, setPerformanceId] = useState("");
  const [performanceType, setPerformanceType] = useState("");
  const [protocolUrl, setProtocolUrl] = useState("");
  const [startDateTime, setStartDateTime] = useState(null);
  const [endDateTime, setEndDateTime] = useState(null);

  // Validation for performance ID
  const isPerformanceIdValid = window.evaluateStringAgainstSdsRequirements?.(
    performanceType,
    "string-adheres-to-identifier-conventions"
  );

  return (
    <Stack spacing="md">
      <TextInput
        label="Performance ID"
        description="Unique identifier for the performance of the experimental protocol."
        placeholder="Enter performance ID (e.g., performance-1, performance-2)"
        value={performanceId}
        onChange={(event) => setPerformanceId(event.currentTarget.value)}
        error={
          performanceType && !isPerformanceIdValid
            ? `Performance IDs can only contain letters, numbers, and hyphens.`
            : null
        }
      />
      <TextInput
        label="Performance Type"
        description="Enter the type of procedure or measurement performed (e.g., histology, imaging, electrophysiology)"
        placeholder="Enter performance type (e.g., mri, histology)"
        value={performanceType}
        onChange={(event) => setPerformanceType(event.currentTarget.value)}
        error={
          performanceType && !isPerformanceIdValid
            ? `Performance IDs can only contain letters, numbers, and hyphens.`
            : null
        }
      />

      <TextInput
        label="Protocol URL or DOI"
        description="Link to the protocol documentation that describes the methods used for this performance type."
        placeholder="Enter protocol URL or DOI (e.g., doi:10.1000/xyz123 or https://protocol.io/...)"
        value={protocolUrl}
        onChange={(event) => setProtocolUrl(event.currentTarget.value)}
      />

      <Group grow>
        <DateTimePicker
          label="Start Date & Time"
          description="Enter the date and time when the performance started."
          placeholder="Select start date and time"
          value={startDateTime}
          onChange={setStartDateTime}
          clearable
        />
        <DateTimePicker
          label="End Date & Time"
          description="Enter the date and time when the performance ended."
          placeholder="Select end date and time"
          value={endDateTime}
          onChange={setEndDateTime}
          clearable
        />
      </Group>
    </Stack>
  );
};

const PerformanceIdManagement = () => {
  const IsPerformanceFormVisible = useGlobalStore((state) => state.IsPerformanceFormVisible);

  // Handlers for form actions
  const handleCancel = () => {
    setPerformanceFormVisible(false);
  };

  const handleAddPerformance = () => {
    // Implement your add performance logic here
    console.log("Adding performance");
    // For now just close the form
    setPerformanceFormVisible(false);
  };

  return (
    <GuidedModePage pageHeader="Description of Performances">
      <GuidedModeSection>
        <Text mb="md">
          Provide information for each performance of experimental protocol in the interface below.
        </Text>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          {/* Left Column - Performance List */}
          <Grid.Col span={4}>
            <Paper
              shadow="sm"
              radius="md"
              p="md"
              withBorder
              style={{ position: "sticky", top: "20px" }}
            >
              <Stack gap="xs">
                <Box
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f0f9ff",
                    cursor: "pointer",
                  }}
                  p="sm"
                  onClick={() => {
                    setPerformanceFormVisible(true);
                  }}
                >
                  <Flex align="center" gap="xs">
                    <IconPlus size={15} color="#1c7ed6" />
                    <Text fw={500} c="#1c7ed6">
                      Add Performance
                    </Text>
                  </Flex>
                </Box>
                <Box
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                  }}
                  p="md"
                >
                  <Text c="dimmed" ta="center">
                    No performances to display
                  </Text>
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column - Form or Details View */}
          <Grid.Col span={8}>
            {IsPerformanceFormVisible ? (
              <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
                <Stack spacing="lg">
                  {/* Header section with entity type and title */}
                  <Group position="apart">
                    <Group>
                      <IconClipboard size={20} color="#ae3ec9" />
                      <Title order={4}>Add new performance</Title>
                    </Group>
                  </Group>

                  <Divider />

                  {/* Performance metadata form */}
                  <PerformanceMetadataForm />

                  {/* Action buttons */}
                  <Group position="right" mt="md">
                    <Button
                      variant="outline"
                      color="gray"
                      onClick={handleCancel}
                      leftIcon={<IconX size={16} />}
                    >
                      Cancel
                    </Button>

                    <Button
                      color="blue"
                      onClick={handleAddPerformance}
                      leftIcon={<IconDeviceFloppy size={16} />}
                    >
                      Add Performance
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
                <Stack gap="md" align="center" justify="center" h={400}>
                  <IconClipboard size={48} color="#adb5bd" />
                  <Text c="dimmed" ta="center">
                    Select a performance from the list or add a new one
                  </Text>
                  <Button
                    leftIcon={<IconPlus size={14} />}
                    onClick={() => setPerformanceFormVisible(true)}
                  >
                    Add Performance
                  </Button>
                </Stack>
              </Paper>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default PerformanceIdManagement;
