import {
  Stack,
  Text,
  Box,
  Flex,
  ScrollArea,
  ActionIcon,
  Group,
  TextInput,
  Button,
} from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
  IconTrash,
  IconX,
  IconCheck,
} from "@tabler/icons-react";

import { useMemo, useCallback, useState } from "react";
import {
  addSubject,
  deleteSubject,
  modifySubjectId,
  deleteSampleFromSubject,
  modifySampleId,
  addSiteToSubject,
  deleteSiteFromSubject,
  modifySubjectSiteId,
  deletePerformanceFromSubject,
  modifySubjectPerformanceId,
  deleteSiteFromSample,
  modifySampleSiteId,
  deletePerformanceFromSample,
  modifySamplePerformanceId,
  addSampleToSubject,
  addPerformanceToSubject,
  addSiteToSample,
  addPerformanceToSample,
} from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";
import { guidedOpenEntityEditSwal } from "./utils";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice";

// Utility for getting the appropriate icon component
const getEntityIcon = (iconType) => {
  const iconSize = 15;
  switch (iconType) {
    case "subject":
      return <IconUser size={iconSize} />;
    case "sample":
      return <IconFlask size={iconSize} color="#74b816" />;
    case "site":
      return <IconPin size={iconSize} color="red" />;
    case "performance":
      return <IconClipboard size={iconSize} />;
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

// Inline form for adding new entities
const InlineEntityAdditionForm = ({ entityType, parentEntityData, onCancel, onSubmit }) => {
  const [entityId, setEntityId] = useState("");
  const [protocolLink, setProtocolLink] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!entityId.trim()) {
      setError("Please enter an ID");
      return;
    }

    onSubmit({ entityId: entityId.trim(), protocolLink: protocolLink.trim() });
    setEntityId("");
    setProtocolLink("");
    setError("");
  };

  const getEntityTypeName = () => {
    switch (entityType) {
      case "subjects":
        return "Subject";
      case "samples":
        return "Sample";
      case "sites":
        return "Site";
      case "performances":
        return "Performance";
      default:
        return "Entity";
    }
  };

  return (
    <Box p="xs" bg="#f0f8ff" style={{ border: "1px solid #c5d9e8", borderRadius: "4px" }}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>{`Add ${getEntityTypeName()}`}</Text>
        <TextInput
          placeholder={`Enter ${getEntityTypeName()} ID`}
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          error={error}
          size="xs"
          data-autofocus
        />
        <TextInput
          placeholder="Protocol link (optional)"
          value={protocolLink}
          onChange={(e) => setProtocolLink(e.target.value)}
          size="xs"
        />
        <Group position="right" spacing="xs">
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            leftIcon={<IconX size={14} />}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button size="xs" leftIcon={<IconCheck size={14} />} onClick={handleSubmit}>
            Add
          </Button>
        </Group>
      </Stack>
    </Box>
  );
};

// Component for rendering nested hierarchy items
const HierarchyItem = ({
  icon,
  label,
  children,
  level = 1,
  allowEntityStructureEditing = false,
  allowEntitySelection = false,
  entityData = null,
  entityType = null,
  parentEntityData = null,
  onAdd = null,
  onEdit = null,
  onDelete = null,
  onSelect = null,
  isAddingEntity = false,
  onCancelAdd = null,
  onSubmitAdd = null,
  addEntityType = null,
}) => {
  const marginLeft = (level - 1) * 8;
  const isAddButton = icon === "add";

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd && onAdd(parentEntityData);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit && onEdit(entityData, parentEntityData);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete && onDelete(entityData, parentEntityData);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (allowEntitySelection && !isAddButton && onSelect) {
      onSelect(entityData, entityType, parentEntityData);
    }
  };

  return (
    <Box ml={`${marginLeft}px`} style={{ borderLeft: "2px solid #ccc" }} py="3px">
      <Flex
        align="center"
        onClick={isAddButton ? handleAdd : handleSelect}
        style={{
          cursor: isAddButton || (allowEntitySelection && !isAddButton) ? "pointer" : "default",
        }}
        sx={
          allowEntitySelection && !isAddButton
            ? {
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.03)",
                },
              }
            : undefined
        }
      >
        <Box bg="#ccc" h="2px" w="10px" />
        {getEntityIcon(isAddButton ? "add" : icon)}
        <Text
          ml="4px"
          fw={isAddButton ? 400 : 500}
          size={isAddButton ? "xs" : undefined}
          c={isAddButton ? "dimmed" : undefined}
        >
          {label}
        </Text>
        {!isAddButton && allowEntityStructureEditing && (
          <>
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
          </>
        )}
      </Flex>

      {isAddingEntity && (
        <Box ml={10} mt={5}>
          <InlineEntityAdditionForm
            entityType={addEntityType}
            parentEntityData={parentEntityData}
            onCancel={onCancelAdd}
            onSubmit={onSubmitAdd}
          />
        </Box>
      )}

      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

const EntityHierarchyRenderer = ({ allowEntityStructureEditing, allowEntitySelection }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

  // State to track which entity is being added
  const [addingEntityState, setAddingEntityState] = useState({
    isAdding: false,
    entityType: null,
    parentEntityData: null,
  });

  // Helper to cancel entity addition
  const handleCancelAddEntity = useCallback(() => {
    setAddingEntityState({
      isAdding: false,
      entityType: null,
      parentEntityData: null,
    });
  }, []);

  // Simple entity selection handler that just logs the selection
  const handleEntitySelect = useCallback((entityData, entityType, parentEntityData) => {
    console.log("Entity selected:", { entityData, entityType, parentEntityData });
    setSelectedHierarchyEntity({ entityData, entityType, parentEntityData });
  }, []);

  // Subject operations
  const handleAddSubjects = useCallback(() => {
    setAddingEntityState({
      isAdding: true,
      entityType: "subjects",
      parentEntityData: null,
    });
  }, []);

  const handleSubmitAddSubjects = useCallback(
    ({ entityId, protocolLink }) => {
      // Pass entityId directly as a string
      addSubject(entityId, protocolLink);
      handleCancelAddEntity();
    },
    [handleCancelAddEntity]
  );

  const handleEditSubject = useCallback((subject) => {
    return guidedOpenEntityEditSwal("subject", subject);
  }, []);

  const handleDeleteSubject = useCallback((subject) => {
    return deleteSubject(subject.subjectId);
  }, []);

  // Sample operations
  const handleAddSample = useCallback((subject) => {
    setAddingEntityState({
      isAdding: true,
      entityType: "samples",
      parentEntityData: subject,
    });
  }, []);

  const handleSubmitAddSample = useCallback(
    ({ entityId, protocolLink }) => {
      const { parentEntityData: subject } = addingEntityState;
      addSampleToSubject(subject.subjectId, entityId, protocolLink);
      handleCancelAddEntity();
    },
    [addingEntityState, handleCancelAddEntity]
  );

  const handleEditSample = useCallback(async (sample, subject) => {
    console.log(`Edit sample ${sample.sampleId} of subject ${subject.subjectId}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "sample",
      entityData: sample,
      parentEntityData: subject,
    });

    if (result) {
      modifySampleId(subject.subjectId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSample = useCallback((sample, subject) => {
    console.log(`Delete sample ${sample.sampleId} from subject ${subject.subjectId}`);
    return deleteSampleFromSubject(subject.subjectId, sample.sampleId);
  }, []);

  // Subject site operations
  const handleAddSubjectSite = useCallback((subject) => {
    setAddingEntityState({
      isAdding: true,
      entityType: "sites",
      parentEntityData: subject,
    });
  }, []);

  const handleSubmitAddSubjectSite = useCallback(
    ({ entityId, protocolLink }) => {
      const { parentEntityData: subject } = addingEntityState;
      addSiteToSubject(subject.subjectId, entityId, protocolLink);
      handleCancelAddEntity();
    },
    [addingEntityState, handleCancelAddEntity]
  );

  const handleEditSubjectSite = useCallback(async (site, subject) => {
    console.log(`Edit site ${site.siteId} of subject ${subject.subjectId}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "site",
      entityData: site,
      parentEntityData: subject,
    });

    if (result) {
      modifySubjectSiteId(subject.subjectId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSubjectSite = useCallback((site, subject) => {
    console.log(`Delete site ${site.siteId} from subject ${subject.subjectId}`);
    return deleteSiteFromSubject(subject.subjectId, site.siteId);
  }, []);

  // Subject performance operations
  const handleAddSubjectPerformance = useCallback((subject) => {
    setAddingEntityState({
      isAdding: true,
      entityType: "performances",
      parentEntityData: subject,
    });
  }, []);

  const handleSubmitAddSubjectPerformance = useCallback(
    ({ entityId, protocolLink }) => {
      const { parentEntityData: subject } = addingEntityState;
      addPerformanceToSubject(subject.subjectId, entityId, protocolLink);
      handleCancelAddEntity();
    },
    [addingEntityState, handleCancelAddEntity]
  );

  const handleEditSubjectPerformance = useCallback(async (performance, subject) => {
    console.log(`Edit performance ${performance.performanceId} of subject ${subject.subjectId}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "performance",
      entityData: performance,
      parentEntityData: subject,
    });

    if (result) {
      modifySubjectPerformanceId(subject.subjectId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSubjectPerformance = useCallback((performance, subject) => {
    console.log(
      `Delete performance ${performance.performanceId} from subject ${subject.subjectId}`
    );
    return deletePerformanceFromSubject(subject.subjectId, performance.performanceId);
  }, []);

  // Sample site operations
  const handleAddSampleSite = useCallback(({ sample, subject }) => {
    setAddingEntityState({
      isAdding: true,
      entityType: "sites",
      parentEntityData: { sample, subject },
    });
  }, []);

  const handleSubmitAddSampleSite = useCallback(
    ({ entityId, protocolLink }) => {
      const {
        parentEntityData: { sample, subject },
      } = addingEntityState;
      addSiteToSample(subject.subjectId, sample.sampleId, entityId, protocolLink);
      handleCancelAddEntity();
    },
    [addingEntityState, handleCancelAddEntity]
  );

  const handleEditSampleSite = useCallback(async (site, { sample, subject }) => {
    console.log(
      `Edit site ${site.siteId} of sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    const result = await guidedOpenEntityEditSwal({
      entityType: "site",
      entityData: site,
      parentEntityData: { sample, subject },
    });

    if (result) {
      modifySampleSiteId(subject.subjectId, sample.sampleId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSampleSite = useCallback((site, { sample, subject }) => {
    console.log(
      `Delete site ${site.siteId} from sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    return deleteSiteFromSample(subject.subjectId, sample.sampleId, site.siteId);
  }, []);

  // Sample performance operations
  const handleAddSamplePerformance = useCallback(({ sample, subject }) => {
    setAddingEntityState({
      isAdding: true,
      entityType: "performances",
      parentEntityData: { sample, subject },
    });
  }, []);

  const handleSubmitAddSamplePerformance = useCallback(
    ({ entityId, protocolLink }) => {
      const {
        parentEntityData: { sample, subject },
      } = addingEntityState;
      addPerformanceToSample(subject.subjectId, sample.sampleId, entityId, protocolLink);
      handleCancelAddEntity();
    },
    [addingEntityState, handleCancelAddEntity]
  );

  const handleEditSamplePerformance = useCallback(async (performance, { sample, subject }) => {
    console.log(
      `Edit performance ${performance.performanceId} of sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    const result = await guidedOpenEntityEditSwal({
      entityType: "performance",
      entityData: performance,
      parentEntityData: { sample, subject },
    });

    if (result) {
      modifySamplePerformanceId(subject.subjectId, sample.sampleId, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSamplePerformance = useCallback((performance, { sample, subject }) => {
    console.log(
      `Delete performance ${performance.performanceId} from sample ${sample.sampleId} of subject ${subject.subjectId}`
    );
    return deletePerformanceFromSample(
      subject.subjectId,
      sample.sampleId,
      performance.performanceId
    );
  }, []);

  // Check if a specific entity is currently being added
  const isAddingEntity = (entityType, parentData) => {
    if (!addingEntityState.isAdding) return false;
    if (addingEntityState.entityType !== entityType) return false;

    // For top-level subjects
    if (entityType === "subjects" && !parentData) return true;

    // For other entity types, compare parent data
    if (parentData && addingEntityState.parentEntityData) {
      if (entityType === "samples" || entityType === "sites" || entityType === "performances") {
        if (addingEntityState.parentEntityData.subjectId === parentData.subjectId) return true;
      }

      // For sample's sites or performances
      if (parentData.sample && addingEntityState.parentEntityData.sample) {
        return (
          addingEntityState.parentEntityData.sample.sampleId === parentData.sample.sampleId &&
          addingEntityState.parentEntityData.subject.subjectId === parentData.subject.subjectId
        );
      }
    }

    return false;
  };

  // Choose the submit function based on entity type
  const getSubmitFunction = useCallback(
    (entityType) => {
      switch (entityType) {
        case "subjects":
          return handleSubmitAddSubjects;
        case "samples":
          return handleSubmitAddSample;
        case "sites":
          return addingEntityState.parentEntityData.sample
            ? handleSubmitAddSampleSite
            : handleSubmitAddSubjectSite;
        case "performances":
          return addingEntityState.parentEntityData.sample
            ? handleSubmitAddSamplePerformance
            : handleSubmitAddSubjectPerformance;
        default:
          return () => {};
      }
    },
    [
      addingEntityState,
      handleSubmitAddSubjects,
      handleSubmitAddSample,
      handleSubmitAddSubjectSite,
      handleSubmitAddSampleSite,
      handleSubmitAddSubjectPerformance,
      handleSubmitAddSamplePerformance,
    ]
  );

  // Memoize derived values to avoid recalculation
  const {
    showSamples,
    showSubjectSites,
    showSampleSites,
    showSubjectPerformances,
    showSamplePerformances,
  } = useMemo(
    () => ({
      showSamples: selectedEntities?.includes("samples") || false,
      showSubjectSites: selectedEntities?.includes("subject-sites") || false,
      showSampleSites: selectedEntities?.includes("sample-sites") || false,
      showSubjectPerformances: selectedEntities?.includes("subject-performances") || false,
      showSamplePerformances: selectedEntities?.includes("sample-performances") || false,
    }),
    [selectedEntities]
  );

  // We can check if we should show empty state after all hooks are called
  const shouldShowEmptyState = !datasetEntityArray?.length;

  return (
    <Stack gap="xs">
      {allowEntityStructureEditing && (
        <Box
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f0f9ff",
            cursor: isAddingEntity("subjects", null) ? "default" : "pointer",
          }}
          p="sm"
          onClick={isAddingEntity("subjects", null) ? undefined : handleAddSubjects}
        >
          {isAddingEntity("subjects", null) ? (
            <InlineEntityAdditionForm
              entityType="subjects"
              parentEntityData={null}
              onCancel={handleCancelAddEntity}
              onSubmit={handleSubmitAddSubjects}
            />
          ) : (
            <Flex align="center" gap="xs">
              <IconPlus size={15} color="#1c7ed6" />
              <Text fw={500} c="#1c7ed6">
                Add Subjects
              </Text>
            </Flex>
          )}
        </Box>
      )}
      <ScrollArea h={650} type="auto">
        <Stack gap="xs">
          {shouldShowEmptyState ? (
            <Box
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
              p="md"
            >
              <Text c="dimmed" ta="center">
                No subjects have been added yet
              </Text>
            </Box>
          ) : (
            datasetEntityArray.map((subject) => (
              <Box
                key={subject.subjectId}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
                p="sm"
              >
                {/* Subject Header */}
                <Flex
                  align="center"
                  gap="xs"
                  onClick={() =>
                    allowEntitySelection && handleEntitySelect(subject, "subject", null)
                  }
                  style={{
                    cursor: allowEntitySelection ? "pointer" : "default",
                  }}
                  sx={
                    allowEntitySelection
                      ? {
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.03)",
                          },
                        }
                      : undefined
                  }
                >
                  <IconUser size={15} />
                  <Text fw={600}>{subject.subjectId}</Text>
                  {allowEntityStructureEditing && (
                    <>
                      <IconEdit
                        color="blue"
                        size={18}
                        style={{ marginLeft: "4px", opacity: 0.6, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSubject(subject);
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
                    </>
                  )}
                </Flex>

                {allowEntityStructureEditing && showSamples && (
                  <HierarchyItem
                    label={`Add sample(s) to ${subject.subjectId}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSample}
                    isAddingEntity={isAddingEntity("samples", subject)}
                    onCancelAdd={handleCancelAddEntity}
                    onSubmitAdd={getSubmitFunction("samples")}
                    addEntityType="samples"
                  />
                )}

                {/* Samples */}
                {showSamples &&
                  subject.samples?.map((sample) => (
                    <HierarchyItem
                      key={sample.sampleId}
                      icon="sample"
                      label={sample.sampleId}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={sample}
                      entityType="sample"
                      parentEntityData={subject}
                      onEdit={() => handleEditSample(sample, subject)}
                      onDelete={() => handleDeleteSample(sample, subject)}
                      onSelect={handleEntitySelect}
                    >
                      {/* Sample Sites */}
                      {allowEntityStructureEditing && showSampleSites && (
                        <HierarchyItem
                          label={`Add site(s) to ${sample.sampleId}`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSampleSite}
                          isAddingEntity={isAddingEntity("sites", { sample, subject })}
                          onCancelAdd={handleCancelAddEntity}
                          onSubmitAdd={getSubmitFunction("sites")}
                          addEntityType="sites"
                        />
                      )}
                      {showSampleSites &&
                        sample.sites?.map((site) => (
                          <HierarchyItem
                            key={site.siteId}
                            icon="site"
                            label={site.siteId}
                            level={3}
                            allowEntityStructureEditing={allowEntityStructureEditing}
                            allowEntitySelection={allowEntitySelection}
                            entityData={site}
                            entityType="site"
                            parentEntityData={{ sample, subject }}
                            onEdit={() => handleEditSampleSite(site, { sample, subject })}
                            onDelete={() => handleDeleteSampleSite(site, { sample, subject })}
                            onSelect={handleEntitySelect}
                          />
                        ))}

                      {allowEntityStructureEditing && showSamplePerformances && (
                        <HierarchyItem
                          label={`Add performance(s) to ${sample.sampleId}`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSamplePerformance}
                          isAddingEntity={isAddingEntity("performances", { sample, subject })}
                          onCancelAdd={handleCancelAddEntity}
                          onSubmitAdd={getSubmitFunction("performances")}
                          addEntityType="performances"
                        />
                      )}
                      {/* Sample Performances */}
                      {showSamplePerformances &&
                        sample.performances?.map((performance) => (
                          <HierarchyItem
                            key={performance.performanceId}
                            icon="performance"
                            label={performance.performanceId}
                            level={3}
                            allowEntityStructureEditing={allowEntityStructureEditing}
                            allowEntitySelection={allowEntitySelection}
                            entityData={performance}
                            entityType="performance"
                            parentEntityData={{ sample, subject }}
                            onEdit={() =>
                              handleEditSamplePerformance(performance, { sample, subject })
                            }
                            onDelete={() =>
                              handleDeleteSamplePerformance(performance, { sample, subject })
                            }
                            onSelect={handleEntitySelect}
                          />
                        ))}
                    </HierarchyItem>
                  ))}

                {/* Subject Sites */}
                {showSubjectSites &&
                  subject.subjectSites?.map((site) => (
                    <HierarchyItem
                      key={site.siteId}
                      icon="site"
                      label={site.siteId}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={site}
                      entityType="site"
                      parentEntityData={subject}
                      onEdit={() => handleEditSubjectSite(site, subject)}
                      onDelete={() => handleDeleteSubjectSite(site, subject)}
                      onSelect={handleEntitySelect}
                    />
                  ))}
                {allowEntityStructureEditing && showSubjectSites && (
                  <HierarchyItem
                    label={`Add site(s) to ${subject.subjectId}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSubjectSite}
                    isAddingEntity={isAddingEntity("sites", subject)}
                    onCancelAdd={handleCancelAddEntity}
                    onSubmitAdd={getSubmitFunction("sites")}
                    addEntityType="sites"
                  />
                )}
                {allowEntityStructureEditing && showSubjectPerformances && (
                  <HierarchyItem
                    label={`Add performance(s) to ${subject.subjectId}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSubjectPerformance}
                    isAddingEntity={isAddingEntity("performances", subject)}
                    onCancelAdd={handleCancelAddEntity}
                    onSubmitAdd={getSubmitFunction("performances")}
                    addEntityType="performances"
                  />
                )}
                {showSubjectPerformances &&
                  subject.subjectPerformances?.map((performance) => (
                    <HierarchyItem
                      key={performance.performanceId}
                      icon="performance"
                      label={performance.performanceId}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={performance}
                      entityType="performance"
                      parentEntityData={subject}
                      onEdit={() => handleEditSubjectPerformance(performance, subject)}
                      onDelete={() => handleDeleteSubjectPerformance(performance, subject)}
                      onSelect={handleEntitySelect}
                    />
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
