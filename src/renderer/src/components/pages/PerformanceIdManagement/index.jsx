import { useState, useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityListContainer from "../../containers/EntityListContainer";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  TextInput,
  Text,
  Stack,
  Group,
  Button,
  Box,
  ActionIcon,
  Flex,
  Paper,
  Collapse,
  NumberInput,
  Checkbox,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import useGlobalStore from "../../../stores/globalStore";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { naturalSort } from "../../shared/utils/util-functions";

const PerformanceIdManagement = () => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const [newEntityName, setNewEntityName] = useState("");
  const [protocolUrl, setProtocolUrl] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [performanceCount, setPerformanceCount] = useState(1);
  const [performanceForms, setPerformanceForms] = useState([]);
  const [useSameProtocol, setUseSameProtocol] = useState(true);
  console.log("performanceForms", performanceForms);
  console.log("performanceforms[0]", performanceForms[0]);

  const isPerformanceIdValid = window.evaluateStringAgainstSdsRequirements?.(
    newEntityName,
    "string-adheres-to-identifier-conventions"
  );

  const entityList = Object.keys(datasetEntityObj?.["performances"] || {});

  // Update performance forms when count changes
  useEffect(() => {
    // Initialize or update performance forms array
    const updatedForms = [...Array(performanceCount)].map((_, index) => {
      // Keep existing data if available
      const existingForm = performanceForms[index] || {};
      return {
        id: index + 1,
        protocolUrl: useSameProtocol ? "" : existingForm.protocolUrl || "",
        dateRange: existingForm.dateRange || [null, null],
        startTime: existingForm.startTime || "",
        endTime: existingForm.endTime || "",
      };
    });
    setPerformanceForms(updatedForms);
  }, [performanceCount, useSameProtocol]);

  const updatePerformanceForm = (index, field, value) => {
    const updatedForms = [...performanceForms];
    updatedForms[index] = {
      ...updatedForms[index],
      [field]: value,
    };
    setPerformanceForms(updatedForms);
  };

  const handleAddEntity = () => {
    const trimmedName = newEntityName.trim();
    if (trimmedName && isPerformanceIdValid) {
      // Generate multiple performance IDs based on the count
      const successfullyAdded = [];
      const failedToAdd = [];

      performanceForms.forEach((form, index) => {
        // Format name with number only when there are multiple performances
        const formattedName =
          performanceCount > 1 ? `perf-${trimmedName}-${index + 1}` : `perf-${trimmedName}`;

        // Check for duplicates before adding
        if (entityList.includes(formattedName)) {
          failedToAdd.push(formattedName);
          return;
        }

        // Create entity data from this form's fields
        const entityData = {
          protocolUrl: useSameProtocol ? protocolUrl.trim() : form.protocolUrl.trim(),
          startDate: form.dateRange?.[0] ? form.dateRange[0].toISOString().split("T")[0] : null,
          endDate: form.dateRange?.[1] ? form.dateRange[1].toISOString().split("T")[0] : null,
          startTime: form.startTime,
          endTime: form.endTime,
        };

        // Add entity with additional data
        addEntityToEntityList("performances", formattedName, entityData);
        successfullyAdded.push(formattedName);
      });

      // Show appropriate messages
      if (successfullyAdded.length > 0) {
        window.electron.showToastMessage({
          type: "success",
          message: `${successfullyAdded.length} performance(s) added successfully.`,
        });
      }

      if (failedToAdd.length > 0) {
        window.electron.showToastMessage({
          type: "error",
          message: `${failedToAdd.length} performance ID(s) already existed and were not added.`,
        });
      }

      // Reset form fields
      setNewEntityName("");
      setProtocolUrl("");
      setPerformanceForms([]);
      setPerformanceCount(1);
      setUseSameProtocol(true);
      setIsFormVisible(false);
    }
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      // Reset form fields when opening
      setNewEntityName("");
      setProtocolUrl("");
      setPerformanceForms([]);
      setPerformanceCount(1);
      setUseSameProtocol(true);
    }
  };

  const renderEntityList = (width) => {
    return entityList.length > 0 ? (
      <Box w={width}>
        {naturalSort(entityList).map((entityName) => (
          <Group
            key={entityName}
            justify="space-between"
            py={4}
            style={{ borderBottom: "1px solid #eaeaea" }}
          >
            <Text>{entityName}</Text>
            <ActionIcon
              color="red"
              onClick={() => {
                removeEntityFromEntityList("performances", entityName);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
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
          No performances have been added yet
        </Text>
      </Box>
    );
  };

  return (
    <GuidedModePage pageHeader="Performance ID Management">
      <GuidedModeSection>
        <Text>Every performance in your dataset must be assigned a unique performance ID.</Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Box
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f0f9ff",
            cursor: "pointer",
            marginBottom: "20px",
          }}
          p="sm"
          onClick={toggleFormVisibility}
        >
          <Flex align="center" gap="xs">
            <IconPlus size={15} color="#1c7ed6" />
            <Text fw={500} c="#1c7ed6">
              Add performance
            </Text>
          </Flex>
        </Box>

        <Collapse in={isFormVisible}>
          <Paper p="md" shadow="xs" mb="md">
            <Stack spacing="md">
              <TextInput
                label="Performance type"
                placeholder="Enter performance type (e.g. histology)"
                value={newEntityName}
                onChange={(event) => setNewEntityName(event.currentTarget.value)}
                error={
                  newEntityName && !isPerformanceIdValid
                    ? `Performance IDs can only contain letters, numbers, and hyphens.`
                    : null
                }
                required
              />
              <NumberInput
                label="How many times was performed"
                description={`Will generate ${performanceCount} unique performance ID${
                  performanceCount > 1 ? "s" : ""
                } with individual metadata`}
                value={performanceCount}
                onChange={setPerformanceCount}
                min={1}
                max={10}
              />

              <Group align="flex-end">
                <Checkbox
                  checked={useSameProtocol}
                  onChange={(event) => setUseSameProtocol(event.currentTarget.checked)}
                  label="Use the same protocol for all performances"
                />
              </Group>

              {useSameProtocol && (
                <TextInput
                  label="Protocol URL or DOI (applied to all performances)"
                  placeholder="Enter protocol URL or DOI"
                  value={protocolUrl}
                  onChange={(event) => setProtocolUrl(event.currentTarget.value)}
                />
              )}

              {performanceCount > 1 && (
                <Box py="xs">
                  <Text c="dimmed" size="sm">
                    For each performance below, provide specific details like{" "}
                    {!useSameProtocol && "protocol URL, "}
                    start date and end date. Each performance will be assigned its own unique ID
                    following the pattern: <b>perf-{newEntityName || "type"}-#</b>
                  </Text>
                </Box>
              )}

              {performanceForms.map((form, index) => (
                <Paper key={index} withBorder p="md" radius="sm">
                  <Text fw={500} mb="md">
                    Performance {index + 1}:{" "}
                    {newEntityName
                      ? performanceCount > 1
                        ? `perf-${newEntityName}-${index + 1}`
                        : `perf-${newEntityName}`
                      : ""}
                  </Text>
                  <Stack>
                    {!useSameProtocol && (
                      <TextInput
                        label="Protocol URL or DOI"
                        placeholder="Enter protocol URL or DOI"
                        value={form.protocolUrl}
                        onChange={(e) =>
                          updatePerformanceForm(index, "protocolUrl", e.currentTarget.value)
                        }
                      />
                    )}

                    <Group grow align="center">
                      <DatePicker
                        type="range"
                        label="Performance Date Range"
                        placeholder="Select start and end dates"
                        value={form.dateRange}
                        onChange={(value) => updatePerformanceForm(index, "dateRange", value)}
                        allowSingleDateInRange
                        clearable
                      />
                      <Stack spacing="xs" justify="center">
                        <TimeInput
                          label="Start Time"
                          placeholder="Enter start time"
                          value={form.startTime}
                          onChange={(e) =>
                            updatePerformanceForm(index, "startTime", e.currentTarget.value)
                          }
                        />
                        <TimeInput
                          label="End Time"
                          placeholder="Enter end time"
                          value={form.endTime}
                          onChange={(e) =>
                            updatePerformanceForm(index, "endTime", e.currentTarget.value)
                          }
                        />
                      </Stack>
                    </Group>
                  </Stack>
                </Paper>
              ))}

              <Group position="right" mt="md">
                <Button variant="outline" onClick={toggleFormVisibility}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEntity}
                  disabled={!newEntityName || !isPerformanceIdValid}
                >
                  Add
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Collapse>

        <EntityListContainer title={`Performance IDs (${entityList.length})`}>
          {renderEntityList()}
        </EntityListContainer>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default PerformanceIdManagement;
