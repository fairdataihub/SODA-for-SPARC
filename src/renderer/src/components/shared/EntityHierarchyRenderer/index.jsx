import { Stack, Text, Box, Flex, ScrollArea, ActionIcon, Group } from "@mantine/core";
import { IconUser, IconFlask, IconPin, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo, useCallback, useState, memo } from "react";
import {
  deleteSubject,
  deleteSampleFromSubject,
  deleteSiteFromSample,
  modifySampleSiteId,
  setActiveFormType,
  setEntityBeingAddedParentSubject,
  setEntityBeingAddedParentSample,
} from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";
import { guidedOpenEntityEditSwal } from "./utils";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";

// Returns the appropriate icon component based on entity type
// Used for visual differentiation between different entity types
const getEntityIcon = (iconType) => {
  const iconSize = 15;
  switch (iconType) {
    case "subject":
      return <IconUser size={iconSize} />;
    case "sample":
      return <IconFlask size={iconSize} color="#74b816" />;
    case "site":
      return <IconPin size={iconSize} color="red" />;
    case "add":
      return (
        <ActionIcon variant="light" color="blue" radius="xl" size="sm">
          <IconPlus size={14} />
        </ActionIcon>
      );
    default:
      return null;
  }
};

// Memoize the hierarchy item component to prevent unnecessary re-renders
const HierarchyItem = memo(
  ({
    icon,
    label,
    children,
    level = 1,
    allowEntityStructureEditing = false,
    allowEntitySelection = false,
    entityData = null, // Contains all needed data including parent references
    parentEntityData = null, // Only needed for edit/delete operations
    onAdd = null,
    onEdit = null,
    onDelete = null,
    onSelect = null,
    isSampleParent = false,
  }) => {
    const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
    const selectedEntityId = selectedHierarchyEntity ? selectedHierarchyEntity.id : null;
    const marginLeft = (level - 1) * 8;
    const isAddButton = icon === "add";
    const horizontalHierarchyLineWidth = 10;

    // Event handler for add button clicks
    // Stops propagation to prevent parent handlers from firing
    const handleAdd = (e) => {
      e.stopPropagation();
      onAdd && onAdd(parentEntityData);
    };

    // Event handler for edit button clicks
    // Stops propagation to prevent parent handlers from firing
    const handleEdit = (e) => {
      e.stopPropagation();
      onEdit && onEdit(entityData, parentEntityData);
    };

    // Event handler for delete button clicks
    // Stops propagation to prevent parent handlers from firing
    const handleDelete = (e) => {
      e.stopPropagation();
      onDelete && onDelete(entityData, parentEntityData);
    };

    // Event handler for item selection
    // Only triggers if selection is allowed and this isn't an add button
    const handleSelect = (e) => {
      e.stopPropagation();
      if (allowEntitySelection && !isAddButton && onSelect) {
        // Just pass the raw entity data which already includes parent references
        onSelect(entityData);
      }
    };

    // Render the hierarchy item with horizontal line connectors and proper indentation
    // Visual structure: [line]--[icon][label] [edit/delete buttons]
    return (
      <Box ml={`${marginLeft}px`} style={{ borderLeft: "2px solid #ccc" }} py="3px">
        <Flex
          align="center"
          justify="space-between"
          onClick={isAddButton ? handleAdd : handleSelect}
          style={{
            cursor: isAddButton || allowEntitySelection ? "pointer" : "default",
            backgroundColor:
              allowEntitySelection && selectedEntityId === entityData?.id
                ? "#bbdefb" // More vibrant blue that's clearly visible
                : isSampleParent
                  ? "#f0f0f0" // Keep the existing gray for parent items
                  : "",
          }}
          ml={`${horizontalHierarchyLineWidth}px`}
        >
          <Group gap={0} justify="flex-start">
            <Box
              bg="#ccc"
              h="2px"
              w={`${horizontalHierarchyLineWidth}px`}
              ml={`${horizontalHierarchyLineWidth * -1}px`}
            />
            {getEntityIcon(isAddButton ? "add" : icon)}
            <Text
              ml="4px"
              fw={isAddButton ? 400 : 500}
              size={isAddButton ? "xs" : undefined}
              c={isAddButton ? "dimmed" : undefined}
            >
              {label}
            </Text>
          </Group>
          {!isAddButton && allowEntityStructureEditing && (
            <Group gap="3px">
              <IconEdit
                color="blue"
                size={18}
                style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
                onClick={handleEdit}
              />
              <IconTrash
                color="red"
                size={16}
                style={{ opacity: 0.6, cursor: "pointer" }}
                onClick={handleDelete}
              />
            </Group>
          )}
        </Flex>
        {children && <Stack gap="0px">{children}</Stack>}
      </Box>
    );
  }
);

// Main component that renders the entire entity hierarchy tree
const EntityHierarchyRenderer = ({
  allowEntityStructureEditing,
  allowEntitySelection,
  onlyRenderEntityType,
}) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const selectedEntityId = selectedHierarchyEntity ? selectedHierarchyEntity.id : null;
  const currentSelectedHierarchyEntityParentSubject = useGlobalStore(
    (state) => state.currentSelectedHierarchyEntityParentSubject
  );
  const currentSelectedHierarchyEntityParentSample = useGlobalStore(
    (state) => state.currentSelectedHierarchyEntityParentSample
  );

  const activeEntity = useGlobalStore((state) => state.activeEntity);
  // Memoize the entity select handler to prevent recreation on each render
  const handleEntitySelect = useCallback((entityData) => {
    setSelectedHierarchyEntity(entityData);
  }, []);

  // ----- SUBJECT OPERATIONS -----
  const handleAddSubjectButtonClick = useCallback(() => {
    setSelectedHierarchyEntity(null);
    setActiveFormType("subject");
  }, []);

  const handleDeleteSubject = useCallback((subject) => {
    return deleteSubject(subject.id);
  }, []);

  // ----- SAMPLE OPERATIONS -----
  const handleAddSampleButtonClick = useCallback((subject) => {
    const subjectId = subject["metadata"]["subject_id"];
    setSelectedHierarchyEntity(null);
    setEntityBeingAddedParentSubject(subjectId);
    setActiveFormType("sample");
  }, []);

  const handleDeleteSample = useCallback((sample, subject) => {
    return deleteSampleFromSubject(subject.id, sample.id);
  }, []);

  // ----- SAMPLE SITE OPERATIONS -----
  const handleAddSampleSiteButtonClick = useCallback(({ sample, subject }) => {
    const subjectId = subject["metadata"]["subject_id"];
    const sampleId = sample["metadata"]["sample_id"];
    setSelectedHierarchyEntity(null);
    setEntityBeingAddedParentSample(sampleId);
    setEntityBeingAddedParentSubject(subjectId);
    setActiveFormType("site");
  }, []);

  const handleDeleteSampleSite = useCallback((site, { sample, subject }) => {
    return deleteSiteFromSample(subject.id, sample.id, site.id);
  }, []);

  // Calculate which entity types should be displayed based on selected entities
  const { showSamples, showSubjectSites, showSampleSites } = useMemo(
    () => ({
      showSamples: selectedEntities?.includes("samples") || false,
      showSubjectSites: selectedEntities?.includes("sites") || false,
      showSampleSites: selectedEntities?.includes("sites") || false,
    }),
    [selectedEntities]
  );

  // Helper function to get entities by type
  const getEntitiesToRender = () => {
    if (!onlyRenderEntityType) return [];

    if (onlyRenderEntityType === "subjects") {
      return getExistingSubjects();
    }
    if (onlyRenderEntityType === "samples") {
      return getExistingSamples();
    }
    if (onlyRenderEntityType === "sites") {
      return getExistingSites();
    }

    console.error("Invalid entity type for rendering:", onlyRenderEntityType);
    return [];
  };
  // Get the specific entities to render if we're only showing one type
  const entitiesToRender = onlyRenderEntityType ? getEntitiesToRender() : [];

  // Fixed renderEntityList function - no hooks inside function
  const renderEntityList = (entities) => {
    return entities.map((entity) => (
      <Box
        key={entity.id}
        onClick={() => handleEntitySelect(entity)}
        p="xs"
        style={{
          width: "100%",
          backgroundColor: entity.id === selectedEntityId ? "#e3f2fd" : "transparent",
          color: entity.id === selectedEntityId ? "#0d47a1" : "#333",
          border: "none",
          borderLeft: `3px solid ${entity.id === selectedEntityId ? "#2196f3" : "transparent"}`,
          cursor: "pointer",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        <Text size="sm">{entity.id}</Text>
      </Box>
    ));
  };

  // EARLY RETURN: If we're only rendering a specific entity type
  if (onlyRenderEntityType) {
    return (
      <Stack gap="xs">
        <ScrollArea mah={650} type="auto">
          {entitiesToRender.length > 0 ? (
            <Stack gap="xs">{renderEntityList(entitiesToRender)}</Stack>
          ) : (
            <Box
              style={{ border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
              p="md"
            >
              <Text c="dimmed" ta="center">
                No {onlyRenderEntityType} to display
              </Text>
            </Box>
          )}
        </ScrollArea>
      </Stack>
    );
  }

  // MAIN RETURN: Full hierarchical view with all entity types
  return (
    <Stack gap="xs">
      {allowEntityStructureEditing && (
        <Box
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "var(--mantine-color-primary-3)",
            cursor: "pointer",
          }}
          p="sm"
          onClick={handleAddSubjectButtonClick}
        >
          <Flex align="center" gap="xs">
            <IconPlus size={15} color="var(--mantine-color-primary-6)" />
            <Text fw={500} c="var(--mantine-color-primary-6)">
              Add Subject
            </Text>
          </Flex>
        </Box>
      )}
      <ScrollArea mah={650} type="auto">
        <Stack gap="xs">
          {!datasetEntityArray?.length ? (
            <Box
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
              p="md"
            >
              <Text c="dimmed" ta="center">
                No subjects to display
              </Text>
            </Box>
          ) : (
            datasetEntityArray.map((subject) => (
              <Box
                key={subject.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
                p="sm"
              >
                <Flex
                  align="center"
                  justify="space-between"
                  gap="xs"
                  onClick={() => allowEntitySelection && handleEntitySelect(subject)}
                  style={{
                    cursor: allowEntitySelection ? "pointer" : "default",
                    backgroundColor:
                      allowEntitySelection && selectedEntityId === subject.id
                        ? "#bbdefb"
                        : currentSelectedHierarchyEntityParentSubject === subject.id
                          ? "#f0f0f0"
                          : "",
                  }}
                >
                  <Group gap="xs">
                    <IconUser size={15} />
                    <Text fw={600}>{subject.id}</Text>
                  </Group>
                  {allowEntityStructureEditing && (
                    <Group gap="3px">
                      <IconEdit
                        color="blue"
                        size={18}
                        style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEntitySelect(subject);
                        }}
                      />
                      <IconTrash
                        color="red"
                        size={16}
                        style={{ opacity: 0.6, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject);
                        }}
                      />
                    </Group>
                  )}
                </Flex>

                {allowEntityStructureEditing && showSamples && (
                  <HierarchyItem
                    label={`Add sample`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSampleButtonClick}
                  />
                )}

                {/* Samples */}
                {showSamples &&
                  subject.samples?.map((sample) => (
                    <HierarchyItem
                      key={sample.id}
                      icon="sample"
                      label={sample.id}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={sample}
                      parentEntityData={subject}
                      onEdit={handleEntitySelect}
                      onDelete={() => handleDeleteSample(sample, subject)}
                      onSelect={handleEntitySelect}
                      isSampleParent={sample.id === currentSelectedHierarchyEntityParentSample}
                    >
                      {/* Sample Sites */}
                      {allowEntityStructureEditing && showSampleSites && (
                        <HierarchyItem
                          label={`Add site`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSampleSiteButtonClick}
                        />
                      )}
                      {showSampleSites &&
                        sample.sites?.map((site) => (
                          <HierarchyItem
                            key={site.id}
                            icon="site"
                            label={site.id}
                            level={3}
                            allowEntityStructureEditing={allowEntityStructureEditing}
                            allowEntitySelection={allowEntitySelection}
                            entityData={site}
                            parentEntityData={{ sample, subject }}
                            onEdit={handleEntitySelect}
                            onDelete={() => handleDeleteSampleSite(site, { sample, subject })}
                            onSelect={handleEntitySelect}
                          />
                        ))}
                    </HierarchyItem>
                  ))}
              </Box>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

export default EntityHierarchyRenderer;
