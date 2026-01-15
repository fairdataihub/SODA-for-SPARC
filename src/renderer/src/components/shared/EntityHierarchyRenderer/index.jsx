import { Stack, Text, Box, Flex, ActionIcon, Group } from "@mantine/core";
import { IconUser, IconFlask, IconPin, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo, useCallback, memo } from "react";
import {
  deleteSubject,
  deleteSampleFromSubject,
  deleteSite,
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
      return <IconFlask size={iconSize} color="black" />;
    case "site":
      return <IconPin size={iconSize} color="black" />;
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

  // Helper function to reset form state and set up new form type
  // Consolidates the common pattern of clearing selections and setting parent relationships
  const setupFormForEntityType = useCallback(
    (formType, parentSubjectId = null, parentSampleId = null) => {
      setSelectedHierarchyEntity(null);
      setEntityBeingAddedParentSubject(parentSubjectId);
      setEntityBeingAddedParentSample(parentSampleId);
      setActiveFormType(formType);
    },
    []
  );

  // Memoize the entity select handler to prevent recreation on each render
  const handleEntitySelect = useCallback((entityData) => {
    setSelectedHierarchyEntity(entityData);
  }, []);

  // ----- SUBJECT OPERATIONS -----
  const handleAddSubjectButtonClick = useCallback(() => {
    setupFormForEntityType("subject");
  }, [setupFormForEntityType]);

  const handleDeleteSubject = useCallback(
    (subject) => {
      const subjectId = subject.metadata.subject_id;

      // If the subject being deleted is currently selected, clear the form
      if (selectedHierarchyEntity && selectedHierarchyEntity.id === subject.id) {
        setupFormForEntityType(null);
      }

      // If currently adding a sample or site to this subject, reset the form
      const currentState = useGlobalStore.getState();
      if (
        currentState.activeFormType === "sample" &&
        currentState.entityBeingAddedParentSubject === subjectId
      ) {
        setupFormForEntityType(null);
      }
      if (
        currentState.activeFormType === "site" &&
        currentState.entityBeingAddedParentSubject === subjectId
      ) {
        setupFormForEntityType(null);
      }

      return deleteSubject(subject.id);
    },
    [selectedHierarchyEntity, setupFormForEntityType]
  );

  // ----- SAMPLE OPERATIONS -----
  const handleAddSampleButtonClick = useCallback(
    (subject) => {
      const subjectId = subject["metadata"]["subject_id"];
      setupFormForEntityType("sample", subjectId, null);
    },
    [setupFormForEntityType]
  );

  const handleDeleteSample = useCallback(
    (sample, subject) => {
      const sampleId = sample.metadata.sample_id;

      // If the sample being deleted is currently selected, clear the form
      if (selectedHierarchyEntity && selectedHierarchyEntity.id === sample.id) {
        setupFormForEntityType(null);
      }

      // If currently adding a site to this sample, reset the form
      const currentState = useGlobalStore.getState();
      if (
        currentState.activeFormType === "site" &&
        currentState.entityBeingAddedParentSample === sampleId
      ) {
        setupFormForEntityType(null);
      }

      return deleteSampleFromSubject(subject.id, sample.id);
    },
    [selectedHierarchyEntity, setupFormForEntityType]
  );

  // ----- SAMPLE SITE OPERATIONS -----
  const handleAddSampleSiteButtonClick = useCallback(
    ({ sample, subject }) => {
      const subjectId = subject["metadata"]["subject_id"];
      const sampleId = sample["metadata"]["sample_id"];
      setupFormForEntityType("site", subjectId, sampleId);
    },
    [setupFormForEntityType]
  );

  const handleDeleteSampleSite = useCallback(
    (site, { sample, subject }) => {
      // If the site being deleted is currently selected, clear the form
      if (selectedHierarchyEntity && selectedHierarchyEntity.id === site.id) {
        setupFormForEntityType(null);
      }
      return deleteSite(site.id);
    },
    [selectedHierarchyEntity, setupFormForEntityType]
  );

  // ----- SUBJECT SITE OPERATIONS -----
  const handleAddSubjectSiteButtonClick = useCallback(
    (subject) => {
      const subjectId = subject["metadata"]["subject_id"];
      setupFormForEntityType("site", subjectId, null);
    },
    [setupFormForEntityType]
  );

  const handleDeleteSubjectSite = useCallback(
    (site, subject) => {
      // If the site being deleted is currently selected, clear the form
      if (selectedHierarchyEntity && selectedHierarchyEntity.id === site.id) {
        setupFormForEntityType(null);
      }
      return deleteSite(site.id);
    },
    [selectedHierarchyEntity, setupFormForEntityType]
  );

  // ----- DERIVED SAMPLE OPERATIONS -----
  const handleAddDerivedSampleButtonClick = useCallback(
    ({ sample, subject }) => {
      const subjectId = subject["metadata"]["subject_id"];
      const parentSampleId = sample["metadata"]["sample_id"];
      setupFormForEntityType("sample", subjectId, parentSampleId);
    },
    [setupFormForEntityType]
  );

  // Calculate which entity types should be displayed based on selected entities
  const { showSamples, showSubjectSites, showSampleSites, showDerivedSamples } = useMemo(
    () => ({
      showSamples: selectedEntities?.includes("samples") || false,
      showSubjectSites: selectedEntities?.includes("subjectSites") || false,
      showSampleSites: selectedEntities?.includes("sampleSites") || false,
      showDerivedSamples: selectedEntities?.includes("derivedSamples") || false,
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
            backgroundColor: "#f0f9ff",
            cursor: "pointer",
          }}
          p="sm"
          onClick={handleAddSubjectButtonClick}
        >
          <Flex align="center" gap="xs">
            <IconPlus size={15} color="#1c7ed6" />
            <Text fw={500} c="#1c7ed6">
              Add Subject
            </Text>
          </Flex>
        </Box>
      )}
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
              {allowEntityStructureEditing && showSubjectSites && (
                <HierarchyItem
                  label={`Add subject site`}
                  icon="add"
                  level={2}
                  parentEntityData={subject}
                  onAdd={handleAddSubjectSiteButtonClick}
                />
              )}
              {/* Subject Sites */}
              {showSubjectSites &&
                subject.subjectSites?.map((site) => (
                  <HierarchyItem
                    key={site.id}
                    icon="site"
                    label={site.id}
                    level={2}
                    allowEntityStructureEditing={allowEntityStructureEditing}
                    allowEntitySelection={allowEntitySelection}
                    entityData={site}
                    parentEntityData={subject}
                    onEdit={handleEntitySelect}
                    onDelete={() => handleDeleteSubjectSite(site)}
                    onSelect={handleEntitySelect}
                  />
                ))}
              {/* Samples */}
              {showSamples &&
                (() => {
                  console.log("subject.id:", subject.id);
                  // Filter samples into regular samples and derived samples
                  const allSamples = subject.samples?.filter(Boolean) || [];
                  const regularSamples = allSamples.filter(
                    (sample) => sample.metadata?.was_derived_from === subject.id
                  );
                  const derivedSamples = allSamples.filter(
                    (sample) => sample.metadata?.was_derived_from !== subject.id
                  );
                  console.log("allSamples: for" + subject.id + ",", allSamples);

                  console.log("regularSamples:", regularSamples);
                  console.log("derivedSamples:", derivedSamples);

                  return regularSamples.map((sample) => {
                    // Find derived samples that were derived from this sample
                    const childDerivedSamples = derivedSamples.filter(
                      (derivedSample) => derivedSample.metadata?.was_derived_from === sample.id
                    );

                    return (
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
                            label={`Add sample site`}
                            icon="add"
                            level={3}
                            parentEntityData={{ sample, subject }}
                            onAdd={handleAddSampleSiteButtonClick}
                          />
                        )}
                        {/* Derived Samples (subsamples) */}
                        {allowEntityStructureEditing && showDerivedSamples && (
                          <HierarchyItem
                            label={`Add derived sample`}
                            icon="add"
                            level={3}
                            parentEntityData={{ sample, subject }}
                            onAdd={handleAddDerivedSampleButtonClick}
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
                        {/* Render derived samples that were derived from this sample */}
                        {showDerivedSamples &&
                          childDerivedSamples.map((derivedSample) => (
                            <HierarchyItem
                              key={derivedSample.id}
                              icon="sample"
                              label={derivedSample.id}
                              level={3}
                              allowEntityStructureEditing={allowEntityStructureEditing}
                              allowEntitySelection={allowEntitySelection}
                              entityData={derivedSample}
                              parentEntityData={{ sample, subject }}
                              onEdit={handleEntitySelect}
                              onDelete={() => handleDeleteSample(derivedSample, subject)}
                              onSelect={handleEntitySelect}
                            >
                              {/* Derived Sample Sites */}
                              {allowEntityStructureEditing && showSampleSites && (
                                <HierarchyItem
                                  label={`Add sample site`}
                                  icon="add"
                                  level={4}
                                  parentEntityData={{ sample: derivedSample, subject }}
                                  onAdd={handleAddSampleSiteButtonClick}
                                />
                              )}
                              {showSampleSites &&
                                derivedSample.sites?.map((site) => (
                                  <HierarchyItem
                                    key={site.id}
                                    icon="site"
                                    label={site.id}
                                    level={4}
                                    allowEntityStructureEditing={allowEntityStructureEditing}
                                    allowEntitySelection={allowEntitySelection}
                                    entityData={site}
                                    parentEntityData={{ sample: derivedSample, subject }}
                                    onEdit={handleEntitySelect}
                                    onDelete={() =>
                                      handleDeleteSampleSite(site, {
                                        sample: derivedSample,
                                        subject,
                                      })
                                    }
                                    onSelect={handleEntitySelect}
                                  />
                                ))}
                            </HierarchyItem>
                          ))}
                      </HierarchyItem>
                    );
                  });
                })()}
            </Box>
          ))
        )}
      </Stack>
    </Stack>
  );
};

export default EntityHierarchyRenderer;
