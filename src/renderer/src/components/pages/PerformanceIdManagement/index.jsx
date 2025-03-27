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
} from "@tabler/icons-react";
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

import {
  setPerformanceFormVisible,
  setPerformanceId,
  setProtocolUrl,
  setStartDateTime,
  setEndDateTime,
  addPerformance,
  deletePerformance,
} from "../../../stores/slices/performancesSlice";

// Performance metadata form component with store-based state
const PerformanceMetadataForm = () => {
  // Get form values from the global store
  const performanceId = useGlobalStore((state) => state.performanceId);
  const performanceType = useGlobalStore((state) => state.performanceType);
  const protocolUrl = useGlobalStore((state) => state.protocolUrl);
  const startDateTime = useGlobalStore((state) => state.startDateTime);
  const endDateTime = useGlobalStore((state) => state.endDateTime);

  return (
    <Stack spacing="md">
      <TextInput
        label="Performance ID"
        description="Unique identifier for the performance of the experimental protocol."
        placeholder="Enter performance ID (e.g., performance-1, performance-2)"
        value={performanceId}
        onChange={(event) => setPerformanceId(event.currentTarget.value)}
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
  const performanceId = useGlobalStore((state) => state.performanceId);
  const performanceList = useGlobalStore((state) => state.performanceList);

  // Validation for add button
  const isPerformanceIdValid = window.evaluateStringAgainstSdsRequirements?.(
    performanceId,
    "string-adheres-to-identifier-conventions"
  );

  return (
    <GuidedModePage pageHeader="Description of Performances">
      <GuidedModeSection>
        {/* Fix the malformed Text component */}
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
                  onClick={() => setPerformanceFormVisible(true)}
                >
                  <Flex align="center" gap="xs">
                    <IconPlus size={15} color="#1c7ed6" />
                    <Text fw={500} c="#1c7ed6">
                      Add Performance
                    </Text>
                  </Flex>
                </Box>
                {performanceList.length > 0 ? (
                  <Box
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                    p="sm"
                  >
                    {performanceList.map((performance) => (
                      <Flex
                        align="center"
                        justify="space-between"
                        gap="xs"
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <Group gap="xs">
                          <IconClipboard size={15} />
                          <Text fw={600}>{performance.performanceId}</Text>
                        </Group>
                        <Group gap="3px">
                          <IconEdit
                            color="blue"
                            size={18}
                            style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
                          />
                          <IconTrash
                            color="red"
                            size={16}
                            style={{ opacity: 0.6, cursor: "pointer" }}
                            onClick={() => deletePerformance(performance.performanceId)}
                          />
                        </Group>
                      </Flex>
                    ))}
                  </Box>
                ) : (
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
                )}
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
                      onClick={() => setPerformanceFormVisible(false)}
                      leftIcon={<IconX size={16} />}
                    >
                      Cancel
                    </Button>

                    <Button
                      color="blue"
                      onClick={addPerformance}
                      leftIcon={<IconDeviceFloppy size={16} />}
                      disabled={!performanceId || !isPerformanceIdValid}
                    >
                      Add Performance
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <Box mx="md">
                <Text size="lg" c="gray">
                  Select a performance from the left to edit its metadata or click "Add Performance"
                  to add a new performance.
                </Text>
              </Box>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default PerformanceIdManagement;
