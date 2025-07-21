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
  setProtocolUrlOrDoi,
  setStartDatetime,
  setEndDatetime,
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
  const performance_id = useGlobalStore((state) => state.performance_id);
  const protocol_url_or_doi = useGlobalStore((state) => state.protocol_url_or_doi);
  const start_datetime = useGlobalStore((state) => state.start_datetime);
  const end_datetime = useGlobalStore((state) => state.end_datetime);

  return (
    <Stack spacing="md">
      <TextInput
        label="Performance ID"
        description="Enter a unique identifier for this performance."
        placeholder="Enter performance ID (e.g., mri01)"
        value={performance_id}
        onChange={(event) => setPerformanceId(event.currentTarget.value)}
        error={
          performance_id &&
          !window.evaluateStringAgainstSdsRequirements(
            performance_id,
            "string-adheres-to-identifier-conventions"
          )
            ? "Performance IDs can only contain letters, numbers, and hyphens."
            : undefined
        }
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
        value={protocol_url_or_doi}
        onChange={(event) => setProtocolUrlOrDoi(event.currentTarget.value)}
      />

      <Group grow>
        <DateTimePicker
          label="Start Date & Time"
          description="Enter the date and time when the performance started."
          placeholder="Select start date and time"
          value={start_datetime ? new Date(start_datetime) : null}
          onChange={(val) => setStartDatetime(val ? val.toISOString() : "")}
          clearable
        />
        <DateTimePicker
          label="End Date & Time"
          description="Enter the date and time when the performance ended."
          placeholder="Select end date and time"
          value={end_datetime ? new Date(end_datetime) : null}
          onChange={(val) => setEndDatetime(val ? val.toISOString() : "")}
          clearable
        />
      </Group>
    </Stack>
  );
};

const PerformanceIdManagement = () => {
  const IsPerformanceFormVisible = useGlobalStore((state) => state.IsPerformanceFormVisible);
  const performance_id = useGlobalStore((state) => state.performance_id);

  const performanceList = useGlobalStore((state) => state.performanceList);

  const isEditMode = useGlobalStore((state) => state.isEditMode);
  const originalPerformanceId = useGlobalStore((state) => state.originalPerformanceId);

  // Validation for add/update button
  const isPerformanceIdValid = window.evaluateStringAgainstSdsRequirements?.(
    performance_id,
    "string-adheres-to-identifier-conventions"
  );

  // Function to handle selecting a performance for editing
  const selectPerformanceForEdit = (performance) => {
    setIsEditMode(true);
    setOriginalPerformanceId(performance.performance_id);
    setPerformanceId(performance.performance_id.replace("perf-", ""));
    setProtocolUrlOrDoi(performance.protocol_url_or_doi || "");
    setStartDatetime(performance.start_datetime || "");
    setEndDatetime(performance.end_datetime || "");
    setPerformanceFormVisible(true);
  };

  // Function to start adding a new performance
  const startAddingPerformance = () => {
    setIsEditMode(false);
    setOriginalPerformanceId("");
    setPerformanceId("");
    setProtocolUrlOrDoi("");
    setStartDatetime("");
    setEndDatetime("");
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
          Provide information for each performance of the experimental protocol below.
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
                        key={performance.performance_id}
                        align="center"
                        justify="space-between"
                        gap="xs"
                        style={{
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          backgroundColor:
                            isEditMode && originalPerformanceId === performance.performance_id
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
                          <Text fw={600}>{performance.performance_id}</Text>
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
                              deletePerformance(performance.performance_id);
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
                      disabled={!performance_id || !isPerformanceIdValid}
                    >
                      {isEditMode ? "Update Performance" : "Add Performance"}
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <InstructionsTowardsLeftContainer>
                <Text fw={500}>
                  {!performanceList || performanceList.length === 0
                    ? 'Click "Add Performance"  to begin adding a new performance.'
                    : 'Choose a performance to view or edit, or click "Add Performance" to create a new one.'}
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
