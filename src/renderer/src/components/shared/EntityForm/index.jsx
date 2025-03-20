import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Group,
  Title,
  TextInput,
  Select,
  NumberInput,
  Button,
  Paper,
  Divider,
  Text,
  Alert,
} from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconPin,
  IconClipboard,
  IconDeviceFloppy,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import {
  addSubject,
  addSampleToSubject,
  addSiteToSubject,
  addSiteToSample,
  addPerformanceToSubject,
  addPerformanceToSample,
  updateEntityMetadata,
} from "../../../stores/slices/datasetEntityStructureSlice";
import {
  setSelectedHierarchyEntity,
  clearTemporaryMetadata,
  setActiveEntityFormType,
} from "../../../stores/slices/datasetEntitySelectorSlice";

const EntityForm = () => {
  const activeEntityFormType = useGlobalStore((state) => state.activeEntityFormType);
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const temporaryEntityMetadata = useGlobalStore((state) => state.temporaryEntityMetadata);
  const isEditMode = !!selectedHierarchyEntity;

  // State to store form values
  const [formValues, setFormValues] = useState({});

  // Add a new state to keep a local copy of the parent info
  // This will help if the global state is cleared or modified unexpectedly
  const [localParentInfo, setLocalParentInfo] = useState(null);

  // Initialize form values and capture parent info when component mounts or dependencies change
  useEffect(() => {
    if (selectedHierarchyEntity) {
      // Edit mode - pre-fill with existing values
      const metadata = selectedHierarchyEntity.metadata || {};
      setFormValues({
        id: selectedHierarchyEntity.id,
        ...metadata,
      });
    } else {
      // Add mode - reset form
      setFormValues({
        id: "",
      });

      // Capture parent info from temporary metadata
      if (temporaryEntityMetadata?.parentInfo) {
        console.log("Capturing parent info on mount:", temporaryEntityMetadata.parentInfo);
        setLocalParentInfo(temporaryEntityMetadata.parentInfo);
      }
    }
  }, [selectedHierarchyEntity, activeEntityFormType, temporaryEntityMetadata]);

  // Improved parent info detection with fallback mechanisms
  useEffect(() => {
    if (temporaryEntityMetadata?.parentInfo) {
      console.log("Parent info found in state:", temporaryEntityMetadata.parentInfo);
      setLocalParentInfo(temporaryEntityMetadata.parentInfo);
    }
  }, [temporaryEntityMetadata]);

  // For debugging - run this on every render to see what parent info is available
  const parentInfo = temporaryEntityMetadata?.parentInfo || localParentInfo;
  console.log("Current parent info:", parentInfo);
  console.log("Current form type:", activeEntityFormType);
  console.log("Selected entity:", selectedHierarchyEntity);
  console.log("Is edit mode:", isEditMode);

  // Enhanced change handler that handles both edit mode and new entity mode
  const handleChange = (field, value) => {
    console.log("Changing field:", field, "to value:", value);

    // Update the local form state in all cases
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If we're in edit mode, update the entity metadata directly
    if (isEditMode && selectedHierarchyEntity) {
      updateEntityMetadata(selectedHierarchyEntity, { [field]: value });
    } else {
      // We're creating a new entity, update the temporary metadata
      updateEntityMetadata(null, { [field]: value }, activeEntityFormType);
    }
  };

  // Handle form submission with improved handling for add mode
  const handleSubmit = () => {
    const { id, ...metadata } = formValues;

    if (isEditMode) {
      // In edit mode, we might have already updated the metadata as the user typed,
      // but let's make a final update to ensure everything is saved
      updateEntityMetadata(selectedHierarchyEntity, metadata);
      console.log("Entity updated successfully");
      setSelectedHierarchyEntity(null);
    } else {
      try {
        // Get the parent info - try both sources
        const parentInfo = temporaryEntityMetadata?.parentInfo || localParentInfo;
        console.log("Submitting form with parent info:", parentInfo);

        switch (activeEntityFormType) {
          case "subject":
            // First add the subject (which only takes an ID)
            addSubject(id);

            // Then update its metadata if there is any
            if (Object.keys(metadata).length > 0) {
              const newSubject = { id, type: "subject" };
              updateEntityMetadata(newSubject, metadata);
            }
            console.log(`Subject ${id} added successfully`);
            break;

          case "sample":
            if (parentInfo && parentInfo.parentSubject) {
              console.log(`Adding sample ${id} to subject ${parentInfo.parentSubject}`);
              // Pass the metadata directly when creating
              addSampleToSubject(parentInfo.parentSubject, id, metadata);
              console.log(`Sample ${id} added to subject ${parentInfo.parentSubject} successfully`);
            } else {
              // Error handling for missing parent info
              const errorMsg = `Cannot add sample: Missing parent subject ID. (Temp: ${JSON.stringify(
                temporaryEntityMetadata
              )}, Local: ${JSON.stringify(localParentInfo)})`;
              console.error(errorMsg);
              alert(errorMsg);
              return; // Exit early
            }
            break;

          case "site":
            if (parentInfo.parentSample && parentInfo.parentSubject) {
              addSiteToSample(parentInfo.parentSubject, parentInfo.parentSample, id, metadata);
              console.log(`Site ${id} added to sample ${parentInfo.parentSample} successfully`);
            } else if (parentInfo.parentSubject) {
              addSiteToSubject(parentInfo.parentSubject, id, metadata);
              console.log(`Site ${id} added to subject ${parentInfo.parentSubject} successfully`);
            } else {
              console.error("Cannot add site: Missing parent information");
            }
            break;

          case "performance":
            if (parentInfo.parentSample && parentInfo.parentSubject) {
              addPerformanceToSample(
                parentInfo.parentSubject,
                parentInfo.parentSample,
                id,
                metadata
              );
              console.log(
                `Performance ${id} added to sample ${parentInfo.parentSample} successfully`
              );
            } else if (parentInfo.parentSubject) {
              addPerformanceToSubject(parentInfo.parentSubject, id, metadata);
              console.log(
                `Performance ${id} added to subject ${parentInfo.parentSubject} successfully`
              );
            } else {
              console.error("Cannot add performance: Missing parent information");
            }
            break;

          default:
            console.error("Unknown entity type:", activeEntityFormType);
        }
      } catch (error) {
        console.error("Error adding entity:", error);
        alert(`Error adding entity: ${error.message}`);
        return; // Exit early to prevent form reset on error
      }
    }

    // Reset states after successful submission
    setFormValues({ id: "" });
    clearTemporaryMetadata();
    setLocalParentInfo(null);
    setSelectedHierarchyEntity(null);
    setActiveEntityFormType(null);
    clearAllTemporaryEntityMetadata(); // Clear temporary entity metadata
  };

  // Handle form cancel
  const handleCancel = () => {
    // Clear selected entity to exit edit mode
    setSelectedHierarchyEntity(null);
    // Also clear temporary metadata
    clearTemporaryMetadata();
    setActiveEntityFormType(null);
  };

  // Get the appropriate icon based on entity type
  const getEntityIcon = () => {
    switch (activeEntityFormType) {
      case "subject":
        return <IconUser size={20} />;
      case "sample":
        return <IconFlask size={20} color="#74b816" />;
      case "site":
        return <IconPin size={20} color="red" />;
      case "performance":
        return <IconClipboard size={20} color="#ae3ec9" />;
      default:
        return null;
    }
  };

  // Render entity-specific form fields
  const renderEntityFields = () => {
    // Important: We're now using activeEntityFormType instead of trying to extract it from selectedHierarchyEntity
    // This avoids the error when selectedHierarchyEntity is null (which happens in add mode)

    switch (activeEntityFormType) {
      case "subject":
        return (
          <Stack spacing="md">
            <TextInput
              label="Subject ID"
              required
              placeholder="Enter subject ID"
              value={formValues.id || ""}
              onChange={(e) => handleChange("id", e.target.value)}
              disabled={isEditMode} // Can't change ID in edit mode
            />

            <TextInput
              label="Subject Experimental Group"
              description="The experimental group this subject belongs to"
              placeholder="e.g., Control, Treatment A"
              value={formValues["experimental group"] || ""}
              onChange={(e) => handleChange("experimental group", e.target.value)}
            />

            <Group grow>
              <NumberInput
                label="Age Value"
                description="Numeric age value"
                placeholder="e.g., 12"
                value={formValues.ageValue || ""}
                onChange={(value) => handleChange("ageValue", value)}
                min={0}
              />

              <Select
                label="Age Unit"
                description="Time unit for age"
                placeholder="Select unit"
                data={[
                  { value: "hours", label: "Hours" },
                  { value: "days", label: "Days" },
                  { value: "weeks", label: "Weeks" },
                  { value: "months", label: "Months" },
                  { value: "years", label: "Years" },
                ]}
                value={formValues.ageUnit || ""}
                onChange={(value) => handleChange("ageUnit", value)}
              />
            </Group>

            <Select
              label="Sex"
              description="Subject's biological sex"
              placeholder="Select sex"
              data={["Male", "Female", "Unknown"]}
              value={formValues.sex || ""}
              onChange={(value) => handleChange("sex", value)}
            />

            <Select
              label="Age category"
              description="The age category of the subject"
              placeholder="Select age category"
              data={[
                "embryo stage",
                "juvenile stage",
                "adult stage",
                "larval stage",
                // Add more options as needed
              ]}
              value={formValues["age category"] || ""}
              onChange={(value) => handleChange("age category", value)}
            />
          </Stack>
        );

      case "sample":
        return (
          <Stack spacing="md">
            <TextInput
              label="Sample ID"
              required
              placeholder="Enter sample ID"
              value={formValues.id || ""}
              onChange={(e) => handleChange("id", e.target.value)}
              disabled={isEditMode}
            />

            <TextInput
              label="Sample Experimental Group"
              description="The experimental group this sample belongs to"
              placeholder="e.g., Control, Treatment A"
              value={formValues["experimental group"] || ""}
              onChange={(e) => handleChange("experimental group", e.target.value)}
            />

            <Select
              label="Sample Type"
              placeholder="Select sample type"
              data={[
                "Tissue",
                "Whole Organ",
                "Primary Cell",
                "Immortalized Cell Line",
                "In Vitro Differentiated Cell",
                "Induced Pluripotent Stem Cell",
                "Stem Cell",
                "Other",
              ]}
              value={formValues["sample type"] || ""}
              onChange={(value) => handleChange("sample type", value)}
            />
          </Stack>
        );

      case "site":
        return <Stack spacing="md">{/* Site form fields here */}</Stack>;

      case "performance":
        return <Stack spacing="md">{/* Performance form fields here */}</Stack>;

      default:
        return (
          <Box p="md" bg="gray.0">
            <Text c="dimmed">Unknown entity type: {activeEntityFormType}</Text>
          </Box>
        );
    }
  };

  // Don't render anything if no active form type
  if (!activeEntityFormType) {
    return null;
  }

  // Display a message about the parent context when adding a child entity
  const renderParentContext = () => {
    // Use either the global or local parent info
    const parentInfo = temporaryEntityMetadata?.parentInfo || localParentInfo;

    if (!isEditMode && parentInfo) {
      const { parentSubject, parentSample } = parentInfo;

      if (activeEntityFormType === "sample" && parentSubject) {
        return (
          <Text size="sm" color="blue" mb="md">
            Adding a sample to subject: <b>{parentSubject}</b>
          </Text>
        );
      }

      if (activeEntityFormType === "site") {
        if (parentSample && parentSubject) {
          return (
            <Text size="sm" color="blue" mb="md">
              Adding a site to sample: <b>{parentSample}</b> of subject: <b>{parentSubject}</b>
            </Text>
          );
        } else if (parentSubject) {
          return (
            <Text size="sm" color="blue" mb="md">
              Adding a site to subject: <b>{parentSubject}</b>
            </Text>
          );
        }
      }

      if (activeEntityFormType === "performance") {
        if (parentSample && parentSubject) {
          return (
            <Text size="sm" color="blue" mb="md">
              Adding a performance to sample: <b>{parentSample}</b> of subject:{" "}
              <b>{parentSubject}</b>
            </Text>
          );
        } else if (parentSubject) {
          return (
            <Text size="sm" color="blue" mb="md">
              Adding a performance to subject: <b>{parentSubject}</b>
            </Text>
          );
        }
      }
    }
    return null;
  };

  // For adding samples, verify parent subject information is available
  const canSubmitForm = () => {
    if (!isEditMode && activeEntityFormType === "sample") {
      if (!formValues.id) return false;

      const parentInfo = temporaryEntityMetadata?.parentInfo || localParentInfo;
      const hasParent = parentInfo && parentInfo.parentSubject;

      if (!hasParent) {
        console.warn("Missing parent info for sample:", {
          temporaryEntityMetadata,
          localParentInfo,
        });
      }

      return hasParent;
    }

    return formValues.id ? true : false; // Basic validation for other entity types
  };

  // Render missing parent info warning with better details
  const renderMissingParentWarning = () => {
    const parentInfo = temporaryEntityMetadata?.parentInfo || localParentInfo;

    if (
      !isEditMode &&
      activeEntityFormType === "sample" &&
      (!parentInfo || !parentInfo.parentSubject)
    ) {
      return (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Missing parent information"
          color="red"
          mb="md"
        >
          <Stack>
            <Text>Cannot add a sample without selecting a parent subject first.</Text>
            <Text size="sm">
              Debug info: Form type: {activeEntityFormType}, Temp metadata:{" "}
              {JSON.stringify(temporaryEntityMetadata)}, Local info:{" "}
              {JSON.stringify(localParentInfo)}
            </Text>
            <Text>
              Please cancel and try again by selecting "Add sample(s)" from a subject in the
              hierarchy.
            </Text>
          </Stack>
        </Alert>
      );
    }
    return null;
  };

  return (
    <Paper shadow="sm" radius="md" p="md" withBorder>
      <Stack spacing="lg">
        <Group position="apart">
          <Group>
            {getEntityIcon()}
            <Title order={4}>
              {isEditMode && selectedHierarchyEntity
                ? `Edit ${activeEntityFormType}: ${selectedHierarchyEntity.id}`
                : `Add new ${activeEntityFormType}`}
            </Title>
          </Group>
        </Group>

        <Divider />

        {renderMissingParentWarning()}
        {renderParentContext()}

        {renderEntityFields()}

        <Group position="right" mt="md">
          <Button
            leftIcon={<IconX size={16} />}
            variant="outline"
            color="gray"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            leftIcon={<IconDeviceFloppy size={16} />}
            onClick={handleSubmit}
            disabled={!canSubmitForm()}
          >
            {isEditMode ? "Save Changes" : "Add Entity"}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default EntityForm;
