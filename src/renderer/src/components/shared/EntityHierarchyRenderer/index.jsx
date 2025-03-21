import { Stack, Text, Box, Flex, ScrollArea, ActionIcon, Group } from "@mantine/core";
import {
  IconUser,
  IconFlask,
  IconClipboard,
  IconPin,
  IconEdit,
  IconPlus,
  IconTrash,
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
  getAllEntityIds,
  setActiveFormType,
  setEntityBeingAddedParentSubject,
  setEntityBeingAddedParentSample,
} from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";
import { guidedOpenEntityAdditionSwal, guidedOpenEntityEditSwal } from "./utils";
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

// Simplified HierarchyItem that doesn't pass entityType anymore
const HierarchyItem = ({
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
  console.log("selectedHierarchyEntity::", selectedHierarchyEntity);
  const selectedEntityId = selectedHierarchyEntity ? selectedHierarchyEntity.id : null;
  const selectedEntityParentSubjectId = selectedHierarchyEntity?.parentSubject;
  const selectedEntityParentSampleId = selectedHierarchyEntity?.parentSample;
  console.log("selectedEntityId", selectedEntityId);
  const marginLeft = (level - 1) * 8;
  const isAddButton = icon === "add";
  const horizontalHierarchyLineWidth = 10;

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
      // Just pass the raw entity data which already includes parent references
      console.log("entityData", entityData);
      onSelect(entityData);
    }
  };

  return (
    <Box ml={`${marginLeft}px`} style={{ borderLeft: "2px solid #ccc" }} py="3px">
      <Flex
        align="center"
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
      {children && <Stack gap="0px">{children}</Stack>}
    </Box>
  );
};

const EntityHierarchyRenderer = ({ allowEntityStructureEditing, allowEntitySelection }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const selectedEntityId = selectedHierarchyEntity ? selectedHierarchyEntity.id : null;
  const selectedEntityParentSubjectId = selectedHierarchyEntity?.parentSubject;
  const selectedEntityParentSampleId = selectedHierarchyEntity?.parentSample;

  // Ultra-simple entity selection handler that just passes the raw entity data
  const handleEntitySelect = useCallback((entityData) => {
    console.log("getAllEntityIds", getAllEntityIds());
    console.log("Selected entity data:", entityData);
    setSelectedHierarchyEntity(entityData);
  }, []);

  // Define all entity operations within the component

  // Subject operations
  const handleAddSubjectButtonClick = useCallback(() => {
    setSelectedHierarchyEntity(null); // Reset selected entity when adding new subjects
    setActiveFormType("subject"); // Set the active form type to subject
  }, []);

  const handleAddSampleButtonClick = useCallback((subject) => {
    setSelectedHierarchyEntity(null); // Reset selected entity when adding new subjects
    setEntityBeingAddedParentSubject(subject.id);
    setActiveFormType("sample"); // Set the active form type to subject
  }, []);

  const handleAddSubjectSiteButtonClick = useCallback((subject) => {
    setSelectedHierarchyEntity(null); // Reset selected entity when adding new subjects
    setEntityBeingAddedParentSubject(subject.id);
    setActiveFormType("site"); // Set the active form type to subject
  }, []);

  const handleEditSubject = useCallback((subject) => {
    return guidedOpenEntityEditSwal("subject", subject);
  }, []);

  const handleDeleteSubject = useCallback((subject) => {
    return deleteSubject(subject.id);
  }, []);

  const handleEditSample = useCallback(async (sample, subject) => {
    console.log(`Edit sample ${sample.id} of subject ${subject.id}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "sample",
      entityData: sample,
      parentEntityData: subject,
    });

    if (result) {
      modifySampleId(subject.id, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSample = useCallback((sample, subject) => {
    console.log(`Delete sample ${sample.id} from subject ${subject.id}`);
    return deleteSampleFromSubject(subject.id, sample.id);
  }, []);

  // Subject site operations

  const handleEditSubjectSite = useCallback(async (site, subject) => {
    console.log(`Edit site ${site.id} of subject ${subject.id}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "site",
      entityData: site,
      parentEntityData: subject,
    });

    if (result) {
      modifySubjectSiteId(subject.id, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSubjectSite = useCallback((site, subject) => {
    console.log(`Delete site ${site.id} from subject ${subject.id}`);
    return deleteSiteFromSubject(subject.id, site.id);
  }, []);

  // Subject performance operations
  const handleAddSubjectPerformance = useCallback((subject) => {
    console.log(`Add performance to subject: ${subject.id}`);
    guidedOpenEntityAdditionSwal({ entityType: "performances", subjectId: subject.id });
  }, []);

  const handleEditSubjectPerformance = useCallback(async (performance, subject) => {
    console.log(`Edit performance ${performance.id} of subject ${subject.id}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "performance",
      entityData: performance,
      parentEntityData: subject,
    });

    if (result) {
      modifySubjectPerformanceId(subject.id, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSubjectPerformance = useCallback((performance, subject) => {
    console.log(`Delete performance ${performance.id} from subject ${subject.id}`);
    return deletePerformanceFromSubject(subject.id, performance.id);
  }, []);

  // Sample site operations
  const handleAddSampleSite = useCallback(({ sample, subject }) => {
    console.log(`Add site to sample ${sample.id} of subject ${subject.id}`);
    guidedOpenEntityAdditionSwal({
      entityType: "sites",
      subjectId: subject.id,
      sampleId: sample.id,
    });
  }, []);

  const handleEditSampleSite = useCallback(async (site, { sample, subject }) => {
    console.log(`Edit site ${site.id} of sample ${sample.id} of subject ${subject.id}`);
    const result = await guidedOpenEntityEditSwal({
      entityType: "site",
      entityData: site,
      parentEntityData: { sample, subject },
    });

    if (result) {
      modifySampleSiteId(subject.id, sample.id, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSampleSite = useCallback((site, { sample, subject }) => {
    console.log(`Delete site ${site.id} from sample ${sample.id} of subject ${subject.id}`);
    return deleteSiteFromSample(subject.id, sample.id, site.id);
  }, []);

  // Sample performance operations
  const handleAddSamplePerformance = useCallback(({ sample, subject }) => {
    console.log(`Add performance to sample ${sample.id} of subject ${subject.id}`);
    guidedOpenEntityAdditionSwal({
      entityType: "performances",
      subjectId: subject.id,
      sampleId: sample.id,
    });
  }, []);

  const handleEditSamplePerformance = useCallback(async (performance, { sample, subject }) => {
    console.log(
      `Edit performance ${performance.id} of sample ${sample.id} of subject ${subject.id}`
    );
    const result = await guidedOpenEntityEditSwal({
      entityType: "performance",
      entityData: performance,
      parentEntityData: { sample, subject },
    });

    if (result) {
      modifySamplePerformanceId(subject.id, sample.id, result.oldName, result.newName);
    }
  }, []);

  const handleDeleteSamplePerformance = useCallback((performance, { sample, subject }) => {
    console.log(
      `Delete performance ${performance.id} from sample ${sample.id} of subject ${subject.id}`
    );
    return deletePerformanceFromSample(subject.id, sample.id, performance.id);
  }, []);

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
      <ScrollArea mah={650} type="auto">
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
                key={subject.id}
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
                  onClick={() => allowEntitySelection && handleEntitySelect(subject)}
                  style={{
                    cursor: allowEntitySelection ? "pointer" : "default",

                    backgroundColor:
                      allowEntitySelection && selectedEntityId === subject.id
                        ? "#bbdefb" // Update the subject selection color to match
                        : selectedEntityParentSubjectId === subject.id
                          ? "#f0f0f0"
                          : "",
                  }}
                >
                  <IconUser size={15} />
                  <Text fw={600}>{subject.id}</Text>
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
                      parentEntityData={subject} // Keep this for edit/delete operations
                      onEdit={() => handleEditSample(sample, subject)}
                      onDelete={() => handleDeleteSample(sample, subject)}
                      onSelect={handleEntitySelect}
                      isSampleParent={sample.id === selectedEntityParentSampleId}
                    >
                      {/* Sample Sites */}
                      {allowEntityStructureEditing && showSampleSites && (
                        <HierarchyItem
                          label={`Add site`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSampleSite}
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
                            parentEntityData={{ sample, subject }} // Keep for edit/delete operations
                            onEdit={() => handleEditSampleSite(site, { sample, subject })}
                            onDelete={() => handleDeleteSampleSite(site, { sample, subject })}
                            onSelect={handleEntitySelect}
                          />
                        ))}

                      {allowEntityStructureEditing && showSamplePerformances && (
                        <HierarchyItem
                          label={`Add performance(s) to ${sample.id}`}
                          icon="add"
                          level={3}
                          parentEntityData={{ sample, subject }}
                          onAdd={handleAddSamplePerformance}
                        />
                      )}
                      {/* Sample Performances */}
                      {showSamplePerformances &&
                        sample.performances?.map((performance) => (
                          <HierarchyItem
                            key={performance.id}
                            icon="performance"
                            label={performance.id}
                            level={3}
                            allowEntityStructureEditing={allowEntityStructureEditing}
                            allowEntitySelection={allowEntitySelection}
                            entityData={performance}
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
                      key={site.id}
                      icon="site"
                      label={site.id}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={site}
                      parentEntityData={subject}
                      onEdit={() => handleEditSubjectSite(site, subject)}
                      onDelete={() => handleDeleteSubjectSite(site, subject)}
                      onSelect={handleEntitySelect}
                    />
                  ))}
                {allowEntityStructureEditing && showSubjectSites && (
                  <HierarchyItem
                    label={`Add site`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSubjectSiteButtonClick}
                  />
                )}
                {allowEntityStructureEditing && showSubjectPerformances && (
                  <HierarchyItem
                    label={`Add performance(s) to ${subject.id}`}
                    icon="add"
                    level={2}
                    parentEntityData={subject}
                    onAdd={handleAddSubjectPerformance}
                  />
                )}
                {showSubjectPerformances &&
                  subject.subjectPerformances?.map((performance) => (
                    <HierarchyItem
                      key={performance.id}
                      icon="performance"
                      label={performance.id}
                      level={2}
                      allowEntityStructureEditing={allowEntityStructureEditing}
                      allowEntitySelection={allowEntitySelection}
                      entityData={performance}
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
