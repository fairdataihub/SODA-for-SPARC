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
  Select,
  Badge,
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import InstructionsTowardsLeftContainer from "../../utils/ui/InstructionsTowardsLeftContainer";

import {
  setResourceFormVisible,
  setRrid,
  setType,
  setName,
  setUrl,
  setVendor,
  setVersion,
  setIdInProtocol,
  addResource,
  updateResource,
  deleteResource,
  setIsEditMode,
  setOriginalResourceName,
  resourceTypes,
} from "../../../stores/slices/resourceMetadataSlice";

const toOxfordCommaString = (arr) => {
  if (!Array.isArray(arr)) return "";

  const len = arr.length;

  if (len === 0) return "";
  if (len === 1) return arr[0];
  if (len === 2) return `${arr[0]} and ${arr[1]}`;

  return `${arr.slice(0, -1).join(", ")}, and ${arr[len - 1]}`;
};

const matchesHttpPattern = (str) => {
  const pattern = /^https?:\/\/.+/;
  console.log("matchesHttpPattern", str, pattern.test(str));
  return pattern.test(str);
};

// Resource metadata form component with store-based state
const ResourceMetadataForm = () => {
  // Get form values from the global store
  const type = useGlobalStore((state) => state.type);
  const name = useGlobalStore((state) => state.name);
  const rrid = useGlobalStore((state) => state.rrid);
  const url = useGlobalStore((state) => state.url);
  const vendor = useGlobalStore((state) => state.vendor);
  const version = useGlobalStore((state) => state.version);
  const id_in_protocol = useGlobalStore((state) => state.id_in_protocol);

  return (
    <Stack spacing="md">
      <TextInput
        label="Resource Name"
        description="Enter the name of the resource"
        placeholder="Resource name (e.g., GraphPad Prism, Abcam Antibody)"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
        required
      />
      <Select
        label="Resource Type"
        placeholder="Select resource type"
        data={resourceTypes}
        value={type}
        onChange={(value) => setType(value)}
      />
      <TextInput
        label="RRID (Research Resource Identifier)"
        description="Enter the standardized RRID if available"
        placeholder="e.g., RRID:AB_123456"
        value={rrid}
        onChange={(event) => setRrid(event.currentTarget.value)}
      />

      <TextInput
        label="URL"
        description="Link to the resource documentation or website"
        placeholder="e.g., https://example.com"
        value={url}
        onChange={(event) => setUrl(event.currentTarget.value)}
        error={url && !matchesHttpPattern(url) ? "URL must start with http:// or https://" : null}
      />

      <TextInput
        label="Vendor"
        description="Provider or manufacturer of the resource"
        placeholder="e.g., Abcam, Thermo Fisher"
        value={vendor}
        onChange={(event) => setVendor(event.currentTarget.value)}
      />

      <TextInput
        label="Version"
        description="Version or catalog number"
        placeholder="e.g., v1.0, Cat# ab123"
        value={version}
        onChange={(event) => setVersion(event.currentTarget.value)}
      />

      <TextInput
        label="ID in protocol"
        description="Identifier used in your protocol documentation"
        placeholder="e.g., Tool-1, Ab-3"
        value={id_in_protocol}
        onChange={(event) => setIdInProtocol(event.currentTarget.value)}
      />
    </Stack>
  );
};

const ResourcesManagementPage = () => {
  const isResourceFormVisible = useGlobalStore((state) => state.isResourceFormVisible);
  const name = useGlobalStore((state) => state.name);
  const url = useGlobalStore((state) => state.url);
  const resourceList = useGlobalStore((state) => state.resourceList);
  const isEditMode = useGlobalStore((state) => state.isEditMode);
  const originalResourceName = useGlobalStore((state) => state.originalResourceName);

  const validateResourceForm = () => {
    const resourceNameIsValid = name && name.trim().length > 0;
    const urlIsValid = !url || matchesHttpPattern(url);
    return resourceNameIsValid && urlIsValid;
  };

  // Validation for add/update button
  const isResourceValid = validateResourceForm();

  // Function to handle selecting a resource for editing
  const selectResourceForEdit = (resource) => {
    setIsEditMode(true);
    setOriginalResourceName(resource.name); // Updated from resource.id
    setRrid(resource.rrid || "");
    setType(resource.type || "");
    setName(resource.name || "");
    setUrl(resource.url || "");
    setVendor(resource.vendor || "");
    setVersion(resource.version || "");
    setIdInProtocol(resource.id_in_protocol || "");
    setResourceFormVisible(true);
  };

  // Function to start adding a new resource
  const startAddingResource = () => {
    setIsEditMode(false);
    setOriginalResourceName("");
    setRrid("");
    setType("");
    setName("");
    setUrl("");
    setVendor("");
    setVersion("");
    setIdInProtocol("");
    setResourceFormVisible(true);
  };

  // Function to cancel editing or adding
  const cancelForm = () => {
    setIsEditMode(false);
    setOriginalResourceName("");
    setResourceFormVisible(false);
  };

  return (
    <GuidedModePage pageHeader="Experimental Resources">
      <GuidedModeSection>
        <Text mb="md">
          Provide information about the resources used in the experiments below. The currently
          supported resources are: {toOxfordCommaString(resourceTypes)}.
        </Text>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          {/* Left Column - Resource List */}
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
                  onClick={startAddingResource}
                >
                  <Flex align="center" gap="xs">
                    <IconPlus size={15} color="#1c7ed6" />
                    <Text fw={500} c="#1c7ed6">
                      Add Resource
                    </Text>
                  </Flex>
                </Box>
                {resourceList.length > 0 ? (
                  <Box
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                      maxHeight: "400px",
                      overflow: "auto",
                    }}
                    p="sm"
                  >
                    {resourceList.map((resource) => (
                      <Flex
                        key={resource.name} // Updated from resource.id
                        align="center"
                        justify="space-between"
                        gap="xs"
                        mb="xs"
                        style={{
                          cursor: "pointer",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            isEditMode && originalResourceName === resource.name
                              ? "#e6f7ff"
                              : "#ffffff",
                          "&:hover": {
                            backgroundColor: "#f0f0f0",
                          },
                          border: "1px solid #eee",
                        }}
                      >
                        <Group
                          gap="xs"
                          onClick={() => selectResourceForEdit(resource)}
                          style={{ flex: 1 }}
                        >
                          <IconFlask size={15} />
                          <div>
                            <Text fw={600}>{resource.name}</Text>
                            <Group gap="xs">
                              {resource.type && (
                                <Badge size="xs" color="blue" variant="light">
                                  {resource.type}
                                </Badge>
                              )}
                              {resource.rrid && (
                                <Text size="xs" c="dimmed">
                                  {resource.rrid}
                                </Text>
                              )}
                            </Group>
                          </div>
                        </Group>
                        <Group gap="3px">
                          <ActionIcon
                            color="blue"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectResourceForEdit(resource);
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteResource(resource.name); // Updated from resource.id
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
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
                      No resources to display
                    </Text>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column - Form or Details View */}
          <Grid.Col span={8}>
            {isResourceFormVisible ? (
              <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
                <Stack spacing="lg">
                  {/* Header section with entity type and title */}
                  <Group position="apart">
                    <Group>
                      <IconFlask size={20} color="#ae3ec9" />
                      <Title order={4}>
                        {isEditMode ? "Edit research resource" : "Add new research resource"}
                      </Title>
                    </Group>
                  </Group>

                  <Divider />

                  {/* Resource metadata form */}
                  <ResourceMetadataForm />

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
                      onClick={isEditMode ? updateResource : addResource}
                      leftIcon={<IconDeviceFloppy size={16} />}
                      disabled={!isResourceValid}
                    >
                      {isEditMode ? "Update Resource" : "Add Resource"}
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              <InstructionsTowardsLeftContainer>
                <Text fw={500}>
                  {!resourceList || resourceList.length === 0
                    ? 'Click "Add Resource"  to begin adding a new resource.'
                    : 'Choose a resource to view or edit, or click "Add Resource" to create a new one.'}
                </Text>
              </InstructionsTowardsLeftContainer>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default ResourcesManagementPage;
