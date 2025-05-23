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
  updatePerformance,
  deletePerformance,
  setIsEditMode,
  setOriginalPerformanceId,
} from "../../../stores/slices/performancesSlice";
import InstructionsTowardsLeftContainer from "../../utils/ui/InstructionsTowardsLeftContainer";

// Performance metadata form component with store-based state
const PerformanceMetadataForm = () => {
  // Get form values from the global store
  const performanceId = useGlobalStore((state) => state.performanceId);
  const protocolUrl = useGlobalStore((state) => state.protocolUrl);
  const startDateTime = useGlobalStore((state) => state.startDateTime);
  const endDateTime = useGlobalStore((state) => state.endDateTime);

  // Show the user what the full ID will be
  const fullPerformanceId = performanceId ? `perf-${performanceId}` : "";

  return (
    <Stack spacing="md">
      <TextInput
        label="Performance ID"
        description="Enter a unique identifier for this performance."
        placeholder="Enter performance ID (e.g., mri01)"
        value={performanceId}
        onChange={(event) => setPerformanceId(event.currentTarget.value)}
        leftSection={
          <Text size="sm" c="dimmed" mx="sm">
            perf-
          </Text>
        }
        leftSectionWidth={50}
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
  const protocolUrl = useGlobalStore((state) => state.protocolUrl);
  const startDateTime = useGlobalStore((state) => state.startDateTime);
  const endDateTime = useGlobalStore((state) => state.endDateTime);
  const performanceList = useGlobalStore((state) => state.performanceList);
  const isEditMode = useGlobalStore((state) => state.isEditMode);
  const originalPerformanceId = useGlobalStore((state) => state.originalPerformanceId);

  // Validation for add/update button
  const isPerformanceIdValid = window.evaluateStringAgainstSdsRequirements?.(
    performanceId,
    "string-adheres-to-identifier-conventions"
  );

  // Function to handle selecting a performance for editing
  const selectPerformanceForEdit = (performance) => {
    setIsEditMode(true);
    setOriginalPerformanceId(performance.performanceId);
    setPerformanceId(performance.performanceId.replace("perf-", ""));
    setProtocolUrl(performance.protocolUrl || "");
    setStartDateTime(performance.startDateTime ? new Date(performance.startDateTime) : null);
    setEndDateTime(performance.endDateTime ? new Date(performance.endDateTime) : null);
    setPerformanceFormVisible(true);
  };

  // Function to start adding a new performance
  const startAddingPerformance = () => {
    setIsEditMode(false);
    setOriginalPerformanceId("");
    setPerformanceId("");
    setProtocolUrl("");
    setStartDateTime(null);
    setEndDateTime(null);
    setPerformanceFormVisible(true);
  };

  // Function to cancel editing or adding
  const cancelForm = () => {
    setIsEditMode(false);
    setOriginalPerformanceId("");
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
                  onClick={startAddingPerformance}
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
                        key={performance.performanceId}
                        align="center"
                        justify="space-between"
                        gap="xs"
                        style={{
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          backgroundColor:
                            isEditMode && originalPerformanceId === performance.performanceId
                              ? "#e6f7ff"
                              : "transparent",
                          "&:hover": {
                            backgroundColor: "#f0f0f0",
                          },
                        }}
                      >
                        <Group
                          gap="xs"
                          onClick={() => selectPerformanceForEdit(performance)}
                          style={{ flex: 1 }}
                        >
                          <IconClipboard size={15} />
                          <Text fw={600}>{performance.performanceId}</Text>
                        </Group>
                        <Group gap="3px">
                          <IconEdit
                            color="blue"
                            size={18}
                            style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectPerformanceForEdit(performance);
                            }}
                          />
                          <IconTrash
                            color="red"
                            size={16}
                            style={{ opacity: 0.6, cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePerformance(performance.performanceId);
                            }}
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
                      <Title order={4}>
                        {isEditMode ? "Edit performance" : "Add new performance"}
                      </Title>
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
                      onClick={cancelForm}
                      leftIcon={<IconX size={16} />}
                    >
                      Cancel
                    </Button>

                    <Button
                      color="blue"
                      onClick={isEditMode ? updatePerformance : addPerformance}
                      leftIcon={<IconDeviceFloppy size={16} />}
                      disabled={!performanceId || !isPerformanceIdValid}
                    >
                      {isEditMode ? "Update Performance" : "Add Performance"}
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <InstructionsTowardsLeftContainer>
                <Text fw={400}>
                  Select a performance from the left to edit its metadata or click "Add Performance"
                  to add a new performance.
                </Text>
              </InstructionsTowardsLeftContainer>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default PerformanceIdManagement;
